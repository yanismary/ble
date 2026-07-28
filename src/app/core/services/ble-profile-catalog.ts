export type ProductProfile =
  | 'widoor'
  | 'moventiv-60'
  | 'moventiv-80'
  | 'garline'
  | 'unknown'
  | 'ambiguous';

export type MotorCommand = 'OPEN';

export const BLE_UUIDS = {
  shdoService: 'dc06d52e-6ee8-471e-a5fd-0f40674a061d',
  versionCharacteristic: '175d6bc8-5840-4037-95da-a778395a036c',
  motorCommandCharacteristic: 'd5ff2020-f80b-4b61-a3d4-ce0e0e75360e',
  motorStateCharacteristic: 'e56b24a5-3309-487e-9aa6-079cd32270ae',
  widoorService: '3206890a-650e-46f3-9c73-2bc0840e3b8e',
  moventivGarlineService: '978ae765-664c-45d8-9157-3b9031e6478e',
} as const;

export interface WritableBleProfile {
  readonly writable: true;
  readonly primaryServiceUuid: string;
  readonly secondaryServiceUuid: string;
  readonly motorCommandCharacteristicUuid: string;
  readonly motorStateCharacteristicUuid: string;
  readonly writeWithResponse: true;
  readonly allowedCommands: readonly MotorCommand[];
}

export interface NonWritableBleProfile {
  readonly writable: false;
  readonly allowedCommands: readonly [];
}

export type BleProfileConfiguration =
  | WritableBleProfile
  | NonWritableBleProfile;

const commonWritableProfile = {
  writable: true,
  primaryServiceUuid: BLE_UUIDS.shdoService,
  motorCommandCharacteristicUuid: BLE_UUIDS.motorCommandCharacteristic,
  motorStateCharacteristicUuid: BLE_UUIDS.motorStateCharacteristic,
  writeWithResponse: true,
  allowedCommands: ['OPEN'],
} as const;

export const BLE_PROFILE_CATALOG: Readonly<
  Record<ProductProfile, BleProfileConfiguration>
> = {
  widoor: {
    ...commonWritableProfile,
    secondaryServiceUuid: BLE_UUIDS.widoorService,
  },
  'moventiv-60': {
    ...commonWritableProfile,
    secondaryServiceUuid: BLE_UUIDS.moventivGarlineService,
  },
  'moventiv-80': {
    ...commonWritableProfile,
    secondaryServiceUuid: BLE_UUIDS.moventivGarlineService,
  },
  garline: {
    ...commonWritableProfile,
    secondaryServiceUuid: BLE_UUIDS.moventivGarlineService,
  },
  unknown: {
    writable: false,
    allowedCommands: [],
  },
  ambiguous: {
    writable: false,
    allowedCommands: [],
  },
};
