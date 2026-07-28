import { Injectable, inject } from '@angular/core';

import { BleService } from './ble';
import {
  BLE_PROFILE_CATALOG,
  MotorCommand,
  ProductProfile,
} from './ble-profile-catalog';
import { encodeMotorCommand } from './motor-command';

@Injectable({
  providedIn: 'root',
})
export class MotorCommandService {
  private readonly bleService = inject(BleService);

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
}
