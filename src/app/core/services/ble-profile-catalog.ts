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
  nameCharacteristic: 'e36d5943-cc43-4d59-89ed-bcd58a70d85d',
  versionCharacteristic: '175d6bc8-5840-4037-95da-a778395a036c',
  datesAndCyclesCharacteristic: '02e9b750-65dc-48c5-a269-78afe8528b71',
  motorCommandCharacteristic: 'd5ff2020-f80b-4b61-a3d4-ce0e0e75360e',
  motorStateCharacteristic: 'e56b24a5-3309-487e-9aa6-079cd32270ae',
  maintenanceCharacteristic: '90a9b170-c180-4af6-8ca0-263170e8a315',
  userParametersCharacteristic: '7c7679a6-5a0d-4cbd-8cbe-93b6d6b4b80f',
  professionalParametersCharacteristic:
    '15e9eef3-939b-4e66-baf9-772d8bd18c41',
  completeParametersCharacteristic:
    'cc942243-7656-441f-880c-4617eeb8bacc',
  widoorService: '3206890a-650e-46f3-9c73-2bc0840e3b8e',
  moventivGarlineService: '978ae765-664c-45d8-9157-3b9031e6478e',
} as const;

export const BLE_SCAN_SERVICE_UUIDS = [
  BLE_UUIDS.widoorService,
  BLE_UUIDS.moventivGarlineService,
] as const;

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
