import { Injectable, inject } from '@angular/core';

import { BleService } from './ble';
import {
  BLE_PROFILE_CATALOG,
  MotorCommand,
  ProductProfile,
} from './ble-profile-catalog';
import { encodeMotorCommand } from './motor-command';
import {
  MotorCommandConfirmation,
  MotorCommandConfirmationRequest,
  MotorCommandConfirmationService,
} from './motor-command-confirmation';
import {
  LegacyBleWrite,
  LegacyMotorCommand,
  inspectCataloguedLegacyBleWrite,
} from './legacy-ble-write-catalog';

export interface CataloguedWidoorMotorConfirmationRequest {
  readonly write: LegacyBleWrite;
  readonly command: Extract<LegacyMotorCommand,
    'OPEN' | 'OPEN_SHORT_TIMED' | 'OPEN_LONG_TIMED' | 'CLOSE'>;
  readonly deviceId: string;
  readonly timeoutMs?: number;
}

@Injectable({
  providedIn: 'root',
})
export class MotorCommandService {
  private readonly bleService = inject(BleService);
  private readonly confirmationService =
    inject(MotorCommandConfirmationService);
  private confirmedCommandInProgress = false;

  async sendMotorCommand(
    profile: ProductProfile,
    command: MotorCommand,
    deviceId?: string,
  ): Promise<void> {
    const configuration = BLE_PROFILE_CATALOG[profile];

    if (!configuration.writable) {
      throw new Error(`BLE writes are forbidden for profile "${profile}".`);
    }

    const value = encodeMotorCommand(profile, command);

    await this.bleService.writeCharacteristic(
      configuration.primaryServiceUuid,
      configuration.motorCommandCharacteristicUuid,
      value,
      deviceId,
    );
  }

  async sendMotorCommandWithConfirmation(
    request: MotorCommandConfirmationRequest,
  ): Promise<MotorCommandConfirmation> {
    if (request.command !== 'OPEN') {
      return {
        status: 'failed',
        command: request.command,
        profile: request.profile,
        sentAt: 0,
        confirmedAt: null,
        notification: null,
        failureReason: 'Use a catalogued write for this motor command.',
      };
    }
    const command = request.command;
    return this.executeConfirmedCommand(
      request,
      () => this.sendMotorCommand(
        request.profile,
        command,
        request.deviceId,
      ),
    );
  }

  async sendCataloguedWidoorMotorCommandWithConfirmation(
    request: CataloguedWidoorMotorConfirmationRequest,
  ): Promise<MotorCommandConfirmation> {
    const expectedOperations = {
      OPEN: 'motor-open',
      OPEN_SHORT_TIMED: 'motor-open-short-timed',
      OPEN_LONG_TIMED: 'motor-open-long-timed',
      CLOSE: 'motor-close',
    } as const;
    const expectedOperation = expectedOperations[request.command];
    if (inspectCataloguedLegacyBleWrite(request.write) !== 'authentic' ||
        request.write.profile !== 'widoor' ||
        request.write.operation !== expectedOperation ||
        request.write.destructiveLevel !== 'motor-movement') {
      return {
        status: 'failed',
        command: request.command,
        profile: 'widoor',
        sentAt: 0,
        confirmedAt: null,
        notification: null,
        failureReason: 'An authentic catalogued Widoor motor write is required.',
      };
    }
    const payload = Uint8Array.from(request.write.payload);
    return this.executeConfirmedCommand(
      {
        profile: 'widoor',
        command: request.command,
        deviceId: request.deviceId,
        timeoutMs: request.timeoutMs,
      },
      () => this.bleService.writeCharacteristic(
        request.write.serviceUuid,
        request.write.characteristicUuid,
        payload,
        request.deviceId,
      ),
    );
  }

  private async executeConfirmedCommand(
    request: MotorCommandConfirmationRequest,
    write: () => Promise<void>,
  ): Promise<MotorCommandConfirmation> {
    if (this.confirmedCommandInProgress) {
      return {
        status: 'failed',
        command: request.command,
        profile: request.profile,
        sentAt: 0,
        confirmedAt: null,
        notification: null,
        failureReason:
          'Another confirmed motor command is already in progress.',
      };
    }

    this.confirmedCommandInProgress = true;
    try {
      return await this.confirmationService
        .executeWithMotorCommandConfirmation(
          request,
          write,
        );
    } finally {
      this.confirmedCommandInProgress = false;
    }
  }
}
