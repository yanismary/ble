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
  MotorCommandConfirmationService,
} from './motor-command-confirmation';

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
    profile: ProductProfile,
    command: MotorCommand,
    baselinePosition: number,
    deviceId?: string,
    timeoutMs?: number,
    baselineMaximumPosition?: number,
  ): Promise<MotorCommandConfirmation> {
    if (this.confirmedCommandInProgress) {
      return {
        status: 'failed',
        command,
        profile,
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
        .executeWithMotorCommandConfirmation({
          profile,
          command,
          baselinePosition,
          baselineMaximumPosition,
          deviceId,
          timeoutMs,
        }, () => this.sendMotorCommand(profile, command, deviceId));
    } finally {
      this.confirmedCommandInProgress = false;
    }
  }
}
