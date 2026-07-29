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
          () => this.sendMotorCommand(
            request.profile,
            request.command,
            request.deviceId,
          ),
        );
    } finally {
      this.confirmedCommandInProgress = false;
    }
  }
}
