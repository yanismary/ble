import { Injectable, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { BleNotificationEvent, BleService } from './ble';
import {
  BLE_PROFILE_CATALOG,
  MotorCommand,
  ProductProfile,
} from './ble-profile-catalog';
import {
  MotorStateFrame,
  ProductDetection,
} from './product-detection';

export const DEFAULT_MOTOR_CONFIRMATION_TIMEOUT_MS = 5_000;

export type MotorCommandConfirmationStatus =
  | 'pending'
  | 'confirmed'
  | 'timeout'
  | 'disconnected'
  | 'failed';

export interface MotorCommandConfirmation {
  readonly status: MotorCommandConfirmationStatus;
  readonly command: MotorCommand;
  readonly profile: ProductProfile;
  readonly sentAt: number;
  readonly confirmedAt: number | null;
  readonly notification: MotorStateFrame | null;
  readonly failureReason: string | null;
}

export interface MotorCommandConfirmationRequest {
  readonly profile: ProductProfile;
  readonly command: MotorCommand;
  readonly baselinePosition: number;
  readonly baselineMaximumPosition?: number;
  readonly deviceId?: string;
  readonly timeoutMs?: number;
}

@Injectable({
  providedIn: 'root',
})
export class MotorCommandConfirmationService {
  private readonly bleService = inject(BleService);
  private readonly productDetection = inject(ProductDetection);
  private readonly activeConfirmations = new Set<string>();

  async executeWithMotorCommandConfirmation(
    request: MotorCommandConfirmationRequest,
    write: () => Promise<void>,
  ): Promise<MotorCommandConfirmation> {
    const validationFailure = this.validateRequest(request);
    if (validationFailure !== null) {
      return this.result(request, 'failed', 0, null, null, validationFailure);
    }

    const configuration = BLE_PROFILE_CATALOG[request.profile];
    if (!configuration.writable) {
      return this.result(
        request,
        'failed',
        0,
        null,
        null,
        `BLE confirmations are forbidden for profile "${request.profile}".`,
      );
    }

    const deviceId = request.deviceId ?? this.bleService.connectedDeviceId;
    if (deviceId === null || !deviceId.trim()) {
      return this.result(
        request,
        'failed',
        0,
        null,
        null,
        'No BLE device is connected.',
      );
    }
    if (deviceId !== this.bleService.connectedDeviceId) {
      return this.result(
        request,
        'failed',
        0,
        null,
        null,
        'The target device is not the connected BLE device.',
      );
    }

    const key = `${deviceId}|${request.command}`;
    if (this.activeConfirmations.has(key)) {
      return this.result(
        request,
        'failed',
        0,
        null,
        null,
        'A confirmation is already pending for this motor command.',
      );
    }
    this.activeConfirmations.add(key);

    const minimumSequence = this.bleService.lastNotificationSequence;
    let armed = false;
    let writeSucceeded = false;
    const buffer: {
      value: {
        readonly event: BleNotificationEvent;
        readonly frame: MotorStateFrame;
      } | null;
    } = { value: null };
    let sentAt = 0;
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let resolveResult!: (result: MotorCommandConfirmation) => void;
    const subscriptions = new Subscription();
    const completion = new Promise<MotorCommandConfirmation>((resolve) => {
      resolveResult = resolve;
    });
    const finish = (
      status: MotorCommandConfirmationStatus,
      confirmedAt: number | null,
      notification: MotorStateFrame | null,
      failureReason: string | null,
    ): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      subscriptions.unsubscribe();
      this.activeConfirmations.delete(key);
      resolveResult(this.result(
        request,
        status,
        sentAt,
        confirmedAt,
        notification,
        failureReason,
      ));
    };

    subscriptions.add(this.bleService.notifications$.subscribe((event) => {
      if (!armed || event.sequence <= minimumSequence) {
        return;
      }
      const frame = this.compatibleOpenNotification(
        request,
        event,
        deviceId,
        configuration.primaryServiceUuid,
        configuration.motorStateCharacteristicUuid,
      );
      if (frame === null) {
        return;
      }
      if (writeSucceeded) {
        finish('confirmed', event.receivedAt, frame, null);
      } else {
        buffer.value = { event, frame };
      }
    }));
    subscriptions.add(this.bleService.disconnections$.subscribe((event) => {
      if (event.deviceId === deviceId) {
        finish('disconnected', null, null, 'The BLE device disconnected.');
      }
    }));

    sentAt = Date.now();
    armed = true;
    try {
      await write();
      if (settled) {
        return completion;
      }
      writeSucceeded = true;
      if (buffer.value !== null) {
        finish(
          'confirmed',
          buffer.value.event.receivedAt,
          buffer.value.frame,
          null,
        );
      } else {
        const timeoutMs =
          request.timeoutMs ?? DEFAULT_MOTOR_CONFIRMATION_TIMEOUT_MS;
        timer = setTimeout(() => {
          finish(
            'timeout',
            null,
            null,
            'No compatible motor notification was received before the timeout.',
          );
        }, timeoutMs);
      }
    } catch (error: unknown) {
      finish(
        'failed',
        null,
        null,
        error instanceof Error ? error.message : String(error),
      );
    }

    return completion;
  }

  private validateRequest(
    request: MotorCommandConfirmationRequest,
  ): string | null {
    if (!Number.isFinite(request.baselinePosition) ||
        request.baselinePosition < 0) {
      return 'A valid baseline motor position is required.';
    }
    if (request.baselineMaximumPosition !== undefined) {
      if (!Number.isFinite(request.baselineMaximumPosition) ||
          request.baselineMaximumPosition <= 0) {
        return 'A valid maximum motor position is required.';
      }
      if (request.baselinePosition >= request.baselineMaximumPosition) {
        return 'The motor already appears to be fully open.';
      }
    }
    const timeoutMs =
      request.timeoutMs ?? DEFAULT_MOTOR_CONFIRMATION_TIMEOUT_MS;
    return !Number.isFinite(timeoutMs) || timeoutMs < 0
      ? 'A non-negative confirmation timeout is required.'
      : null;
  }

  private compatibleOpenNotification(
    request: MotorCommandConfirmationRequest,
    event: BleNotificationEvent,
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
  ): MotorStateFrame | null {
    if (request.command !== 'OPEN' ||
        event.deviceId !== deviceId ||
        event.serviceUuid.toLowerCase() !== serviceUuid ||
        event.characteristicUuid.toLowerCase() !== characteristicUuid) {
      return null;
    }

    const frame = this.productDetection.interpretMotorState(event.value);
    const position = frame.currentPosition;
    const maximum = frame.maximumPosition;
    if (position === null ||
        maximum === null ||
        maximum <= 0 ||
        position < 0 ||
        position > maximum) {
      return null;
    }

    // Until physical validation, OPEN is confirmed only by a position increase.
    return position > request.baselinePosition ? frame : null;
  }

  private result(
    request: MotorCommandConfirmationRequest,
    status: MotorCommandConfirmationStatus,
    sentAt: number,
    confirmedAt: number | null,
    notification: MotorStateFrame | null,
    failureReason: string | null,
  ): MotorCommandConfirmation {
    return {
      status,
      command: request.command,
      profile: request.profile,
      sentAt,
      confirmedAt,
      notification,
      failureReason,
    };
  }
}
