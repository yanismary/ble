import { Injectable, OnDestroy, inject } from '@angular/core';

import {
  BLE_UUIDS,
  ProductProfile,
} from './ble-profile-catalog';
import {
  BleDatesAndCycles,
  BleDecodeResult,
  BleMaintenance,
  BleAdvancedParameters,
  BleUserParameters,
  BleVersionFrame,
  decodeBleDatesAndCycles,
  decodeBleMaintenance,
  decodeBleAdvancedParameters,
  decodeBleUserParameters,
  decodeBleVersion,
} from './ble-read-decoders';
import {
  BleGattCharacteristicAvailability,
  BleService,
} from './ble';

export type BleReadType =
  | 'version'
  | 'dates-and-cycles'
  | 'maintenance'
  | 'user-parameters'
  | 'advanced-parameters';

export type BleReadStatus =
  | 'success'
  | 'invalid-frame'
  | 'disconnected'
  | 'unavailable'
  | 'failed'
  | 'stale';

export interface BleReadError {
  readonly code:
    | 'profile-not-readable'
    | 'not-connected'
    | 'wrong-device'
    | 'services-not-discovered'
    | 'service-absent'
    | 'characteristic-absent'
    | 'not-readable'
    | 'read-in-progress'
    | 'disconnected'
    | 'stale'
    | 'invalid-frame'
    | 'native-read-failed';
  readonly message: string;
  readonly cause?: unknown;
}

export interface BleTypedReadResult<T> {
  readonly type: BleReadType;
  readonly profile: ProductProfile;
  readonly deviceId: string | null;
  readonly serviceUuid: string;
  readonly characteristicUuid: string;
  readonly startedAt: number;
  readonly completedAt: number;
  readonly status: BleReadStatus;
  readonly decoded: BleDecodeResult<T> | null;
  readonly error: BleReadError | null;
}

interface ReadDefinition<T> {
  readonly type: BleReadType;
  readonly characteristicUuid: string;
  readonly decode: (
    profile: ProductProfile,
    value: DataView,
  ) => BleDecodeResult<T>;
}

@Injectable({
  providedIn: 'root',
})
export class BleReadService implements OnDestroy {
  private readonly bleService = inject(BleService);
  private activeRead = false;
  private destroyed = false;

  get isReading(): boolean {
    return this.activeRead;
  }

  readVersion(
    profile: ProductProfile,
    deviceId?: string,
  ): Promise<BleTypedReadResult<BleVersionFrame>> {
    return this.executeRead(profile, deviceId, {
      type: 'version',
      characteristicUuid: BLE_UUIDS.versionCharacteristic,
      decode: (_profile, value) => decodeBleVersion(value),
    });
  }

  readDatesAndCycles(
    profile: ProductProfile,
    deviceId?: string,
  ): Promise<BleTypedReadResult<BleDatesAndCycles>> {
    return this.executeRead(profile, deviceId, {
      type: 'dates-and-cycles',
      characteristicUuid: BLE_UUIDS.datesAndCyclesCharacteristic,
      decode: (_profile, value) => decodeBleDatesAndCycles(value),
    });
  }

  readMaintenance(
    profile: ProductProfile,
    deviceId?: string,
  ): Promise<BleTypedReadResult<BleMaintenance>> {
    return this.executeRead(profile, deviceId, {
      type: 'maintenance',
      characteristicUuid: BLE_UUIDS.maintenanceCharacteristic,
      decode: (_profile, value) => decodeBleMaintenance(value),
    });
  }

  readUserParameters(
    profile: ProductProfile,
    deviceId?: string,
  ): Promise<BleTypedReadResult<BleUserParameters>> {
    console.info('[INPUT] user-read-requested', JSON.stringify({
      profile, deviceId, at: Date.now(),
    }));
    return this.executeRead(profile, deviceId, {
      type: 'user-parameters',
      characteristicUuid: BLE_UUIDS.userParametersCharacteristic,
      decode: (_profile, value) => decodeBleUserParameters(value),
    }).then((result) => {
      const value = result.decoded?.valid ? result.decoded.value : null;
      if (value !== null) {
        const byte6 = value.peripheralByte1;
        const highNibble = (byte6 >> 4) & 0x0f;
        console.info('[INPUT READ]', JSON.stringify({
          deviceId: result.deviceId,
          rawByte6: `0x${byte6.toString(16).padStart(2, '0').toUpperCase()}`,
          highNibble: `0x${highNibble.toString(16).toUpperCase()}`,
          highNibbleBinary: highNibble.toString(2).padStart(4, '0'),
          input1Bit: (highNibble >> 1) & 1,
          input1Mode: value.peripheralFlags.input1Radar ? 'radar' : 'button',
          input2Bit: highNibble & 1,
          input2Mode: value.peripheralFlags.input2Radar ? 'radar' : 'button',
        }));
      }
      console.info('[INPUT] user-read-result', JSON.stringify({
        profile,
        deviceId,
        status: result.status,
        rawHex: result.decoded?.rawHex ?? null,
        peripheralByte1: value?.peripheralByte1 ?? null,
        input1Radar: value?.peripheralFlags.input1Radar ?? null,
        input2Radar: value?.peripheralFlags.input2Radar ?? null,
        error: result.error,
      }));
      return result;
    });
  }

  readAdvancedParameters(
    profile: ProductProfile,
    deviceId?: string,
  ): Promise<BleTypedReadResult<BleAdvancedParameters>> {
    console.info(
      '[INPUT] advanced-read-requested',
      JSON.stringify({
        profile,
        deviceId,
        at: Date.now() }),
      );
    return this.executeRead(profile, deviceId, {
      type: 'advanced-parameters',
      characteristicUuid: BLE_UUIDS.professionalParametersCharacteristic,
      decode: (targetProfile, value) =>
        decodeBleAdvancedParameters(targetProfile, value),
    }).then((result) => {
      console.log(
        '[INPUT] advanced-read-result',
        JSON.stringify({
          status: result.status,
          rawHex: result.decoded?.rawHex ?? null,
          peripheralByte1:
            result.decoded?.valid
              ? result.decoded.value.peripheralByte1
              : null,
          bit7Set:
            result.decoded?.valid
              ? (result.decoded.value.peripheralByte1 & 0x80) !== 0
              : null,
          bit6Set:
            result.decoded?.valid
              ? (result.decoded.value.peripheralByte1 & 0x40) !== 0
              : null,
          error: result.error,
        }),
      );
      return result;
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  private async executeRead<T>(
    profile: ProductProfile,
    requestedDeviceId: string | undefined,
    definition: ReadDefinition<T>,
  ): Promise<BleTypedReadResult<T>> {
    const startedAt = Date.now();
    const connectedDeviceId = this.bleService.connectedDeviceId;
    const targetDeviceId = requestedDeviceId === undefined
      ? connectedDeviceId
      : requestedDeviceId.trim();
    const base = {
      type: definition.type,
      profile,
      deviceId: targetDeviceId || null,
      serviceUuid: this.serviceUuidForRead(profile, definition),
      characteristicUuid: definition.characteristicUuid,
      startedAt,
    } as const;

    if (profile === 'unknown' || profile === 'ambiguous') {
      return this.terminal(base, 'unavailable', null, {
        code: 'profile-not-readable',
        message: `BLE reads are not allowed for profile "${profile}".`,
      });
    }

    if (connectedDeviceId === null) {
      return this.terminal(base, 'disconnected', null, {
        code: 'not-connected',
        message: 'No BLE device is connected.',
      });
    }

    if (!targetDeviceId || targetDeviceId !== connectedDeviceId) {
      return this.terminal(base, 'unavailable', null, {
        code: 'wrong-device',
        message: 'The target device is not the connected BLE device.',
      });
    }

    const gattAvailability =
      this.bleService.getGattCharacteristicAvailability(
        base.serviceUuid,
        definition.characteristicUuid,
        targetDeviceId,
      );

    if (gattAvailability !== 'available') {
      return this.gattUnavailable(base, gattAvailability);
    }

    if (this.activeRead) {
      return this.terminal(base, 'unavailable', null, {
        code: 'read-in-progress',
        message: 'A BLE read is already in progress.',
      });
    }

    const connectionGeneration = this.bleService.connectionGeneration;
    this.activeRead = true;

    try {
      const value = await this.bleService.readCharacteristic(
        base.serviceUuid,
        definition.characteristicUuid,
        targetDeviceId,
      );
      const lateStatus = this.getLateStatus(
        targetDeviceId,
        connectionGeneration,
      );

      if (lateStatus !== null) {
        return this.lateResult(base, lateStatus);
      }

      const decoded = definition.decode(profile, value);

      if (!decoded.valid) {
        return this.terminal<T>(base, 'invalid-frame', decoded, {
          code: 'invalid-frame',
          message: decoded.errors.join(' '),
        });
      }

      return this.terminal(base, 'success', decoded, null);
    } catch (cause: unknown) {
      const lateStatus = this.getLateStatus(
        targetDeviceId,
        connectionGeneration,
      );

      if (lateStatus !== null) {
        return this.lateResult(base, lateStatus);
      }

      return this.terminal(base, 'failed', null, {
        code: 'native-read-failed',
        message: cause instanceof Error
          ? cause.message
          : 'The native BLE read failed.',
        cause,
      });
    } finally {
      this.activeRead = false;
    }
  }

  private serviceUuidForRead(
    profile: ProductProfile,
    definition: ReadDefinition<unknown>,
  ): string {
    if (
        definition.type === 'user-parameters' ||
        definition.type === 'advanced-parameters') {
      if (profile === 'widoor') {
        return BLE_UUIDS.widoorService;
      }
      if (profile === 'moventiv-60' ||
          profile === 'moventiv-80' ||
          profile === 'garline') {
        return BLE_UUIDS.moventivGarlineService;
      }
    }
    return BLE_UUIDS.shdoService;
  }

  private getLateStatus(
    deviceId: string,
    connectionGeneration: number,
  ): 'disconnected' | 'stale' | null {
    if (this.destroyed) {
      return 'stale';
    }

    if (
      this.bleService.connectedDeviceId === null
      || this.bleService.disconnectingDeviceId === deviceId
    ) {
      return 'disconnected';
    }

    if (
      this.bleService.connectedDeviceId !== deviceId
      || this.bleService.connectionGeneration !== connectionGeneration
    ) {
      return 'stale';
    }

    return null;
  }

  private lateResult<T>(
    base: Omit<
      BleTypedReadResult<T>,
      'completedAt' | 'status' | 'decoded' | 'error'
    >,
    status: 'disconnected' | 'stale',
  ): BleTypedReadResult<T> {
    return this.terminal(base, status, null, {
      code: status,
      message: status === 'disconnected'
        ? 'The BLE device disconnected during the read.'
        : 'The BLE read result belongs to an obsolete connection.',
    });
  }

  private gattUnavailable<T>(
    base: Omit<
      BleTypedReadResult<T>,
      'completedAt' | 'status' | 'decoded' | 'error'
    >,
    availability: Exclude<BleGattCharacteristicAvailability, 'available'>,
  ): BleTypedReadResult<T> {
    const messages: Readonly<Record<typeof availability, string>> = {
      'services-not-discovered':
        'GATT services have not been discovered for the connected device.',
      'service-absent':
        `The required GATT service ${base.serviceUuid} is absent.`,
      'characteristic-absent':
        `The required GATT characteristic ${base.characteristicUuid} is absent.`,
      'not-readable':
        `The GATT characteristic ${base.characteristicUuid} is not readable.`,
    };

    return this.terminal(base, 'unavailable', null, {
      code: availability,
      message: messages[availability],
    });
  }

  private terminal<T>(
    base: Omit<
      BleTypedReadResult<T>,
      'completedAt' | 'status' | 'decoded' | 'error'
    >,
    status: BleReadStatus,
    decoded: BleDecodeResult<T> | null,
    error: BleReadError | null,
  ): BleTypedReadResult<T> {
    return {
      ...base,
      completedAt: Date.now(),
      status,
      decoded,
      error,
    };
  }
}
