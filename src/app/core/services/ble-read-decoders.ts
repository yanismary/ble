import { ProductProfile } from './ble-profile-catalog';

export type BleBytes = Uint8Array | DataView;

export interface BleDecodeSuccess<T> {
  readonly valid: true;
  readonly value: T;
  readonly rawHex: string;
  readonly length: number;
  readonly errors: readonly [];
}

export interface BleDecodeFailure {
  readonly valid: false;
  readonly value: null;
  readonly rawHex: string;
  readonly length: number;
  readonly errors: readonly string[];
}

export type BleDecodeResult<T> = BleDecodeSuccess<T> | BleDecodeFailure;

export interface BleStackVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly build: number;
}

export interface BleSoftwareVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly specification: number;
}

export interface BleVersionFrame {
  readonly stack: BleStackVersion;
  readonly bleSoftware: BleSoftwareVersion;
  readonly productType: number;
  readonly productSubtype: number;
  readonly motorSoftware: BleSoftwareVersion;
  readonly crc: number;
  readonly motorAddressHex: string | null;
}

export type HistoricalBleDateStatus = 'present' | 'not-initialized';

export interface HistoricalBleDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number | null;
  readonly status: HistoricalBleDateStatus;
  readonly raw: readonly number[];
}

export interface BleDatesAndCycles {
  /**
   * Named FAD in Phase 1. Its business meaning is not documented there.
   */
  readonly historicalFadDate: HistoricalBleDate;
  readonly firstCommissioningDate: HistoricalBleDate;
  readonly lastMaintenanceDate: HistoricalBleDate;
  readonly totalCycles: number;
  readonly cyclesSinceMaintenance: number;
}

export interface BleMaintenance {
  readonly initializationCount: number;
  readonly cyclesSinceInitialization: number;
  readonly obstacleDetectionCount: number;
  readonly wrongStopOpenCount: number;
  readonly wrongStopCloseCount: number;
  readonly learningCycleCount: number;
  readonly encoderErrorCount: number;
  readonly motorErrorCount: number;
}

export type DoorLockMode =
  | 'none'
  | 'locked-open'
  | 'locked-closed'
  | 'unknown';

export interface UserPeripheralFlags {
  readonly dynamicLight: boolean;
  readonly staticLight: boolean;
  readonly light1: boolean;
  readonly light2: boolean;
  readonly rgbIndicator: boolean;
}

export interface BleUserParameters {
  readonly lockModeRaw: number;
  readonly lockMode: DoorLockMode;
  readonly openSpeed: number;
  readonly closeSpeed: number;
  readonly shortOpenTime: number;
  readonly longOpenTime: number;
  readonly peripheralByte1: number;
  readonly peripheralByte2: number;
  readonly peripheralFlags: UserPeripheralFlags;
}

interface CommonProfessionalParameters {
  readonly weightRangeLower: number;
  readonly weightRangeUpper: number;
  readonly nearOpenSpeed: number;
  readonly nearCloseSpeed: number;
  readonly nearOpenTorque: number;
  readonly nearCloseTorque: number;
  readonly peripheralByte1: number;
  readonly peripheralByte2: number;
}

export interface WidoorProfessionalParameters
  extends CommonProfessionalParameters {
  readonly profile: 'widoor';
  readonly breakForceAtOpen: number;
  readonly nearOpenProportional: number;
  readonly nearCloseProportional: number;
  readonly nearOpenIntegral: number;
  readonly nearCloseIntegral: number;
}

export interface MoventivProfessionalParameters
  extends CommonProfessionalParameters {
  readonly profile: 'moventiv-60' | 'moventiv-80';
  readonly exactWeight: number;
  readonly brakingOpenPower: number;
  readonly obstacleSensitivity: number;
  readonly nearOpenIntegral: number;
  readonly nearCloseIntegral: number;
}

export interface GarlineProfessionalParameters
  extends CommonProfessionalParameters {
  readonly profile: 'garline';
  readonly exactWeight: number;
  readonly brakingOpenPower: number;
  readonly obstacleSensitivity: number;
  readonly nearOpenIntegral: number;
  readonly nearCloseIntegral: number;
}

export type BleProfessionalParameters =
  | WidoorProfessionalParameters
  | MoventivProfessionalParameters
  | GarlineProfessionalParameters;

export const BLE_READ_MIN_LENGTHS = {
  version: 20,
  datesAndCycles: 17,
  maintenance: 18,
  userParameters: 7,
  professionalParameters: 13,
} as const;

export const HISTORICAL_DATE_SENTINEL = 0xff;

export function toUint8Array(value: BleBytes): Uint8Array {
  return value instanceof Uint8Array
    ? value
    : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

export function bytesToHex(value: BleBytes): string {
  return Array.from(toUint8Array(value), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join(' ');
}

export function readUint16BigEndian(
  value: BleBytes,
  offset: number,
): number | null {
  const bytes = toUint8Array(value);

  if (!isReadableOffset(bytes, offset, 2)) {
    return null;
  }

  return (bytes[offset] << 8) | bytes[offset + 1];
}

export function readUint24BigEndian(
  value: BleBytes,
  offset: number,
): number | null {
  const bytes = toUint8Array(value);

  if (!isReadableOffset(bytes, offset, 3)) {
    return null;
  }

  return (
    (bytes[offset] * 0x10000)
    + (bytes[offset + 1] << 8)
    + bytes[offset + 2]
  );
}

export function decodeBleVersion(
  value: BleBytes,
): BleDecodeResult<BleVersionFrame> {
  const bytes = toUint8Array(value);
  const failure = validateMinimumLength(
    bytes,
    BLE_READ_MIN_LENGTHS.version,
    'version',
  );

  if (failure !== null) {
    return failure;
  }

  const stackMajor = readUint16BigEndian(bytes, 0);
  const stackMinor = readUint16BigEndian(bytes, 2);
  const stackPatch = readUint16BigEndian(bytes, 4);
  const stackBuild = readUint16BigEndian(bytes, 6);
  const crc = readUint16BigEndian(bytes, 18);

  if (
    stackMajor === null
    || stackMinor === null
    || stackPatch === null
    || stackBuild === null
    || crc === null
  ) {
    return invalidResult(bytes, 'Version frame contains incomplete fields.');
  }

  const motorAddressHex = bytes.length >= 26
    ? Array.from(bytes.slice(20, 26), (byte) =>
        byte.toString(16).padStart(2, '0').toUpperCase(),
      ).join('.')
    : null;

  return validResult(bytes, {
    stack: {
      major: stackMajor,
      minor: stackMinor,
      patch: stackPatch,
      build: stackBuild,
    },
    bleSoftware: {
      major: bytes[8],
      minor: bytes[9],
      patch: bytes[10],
      specification: bytes[11],
    },
    productType: bytes[12],
    productSubtype: bytes[13],
    motorSoftware: {
      major: bytes[14],
      minor: bytes[15],
      patch: bytes[16],
      specification: bytes[17],
    },
    crc,
    motorAddressHex,
  });
}

export function decodeBleDatesAndCycles(
  value: BleBytes,
): BleDecodeResult<BleDatesAndCycles> {
  const bytes = toUint8Array(value);
  const failure = validateMinimumLength(
    bytes,
    BLE_READ_MIN_LENGTHS.datesAndCycles,
    'dates and cycles',
  );

  if (failure !== null) {
    return failure;
  }

  const totalCycles = readUint24BigEndian(bytes, 11);
  const cyclesSinceMaintenance = readUint24BigEndian(bytes, 14);

  if (totalCycles === null || cyclesSinceMaintenance === null) {
    return invalidResult(bytes, 'Dates and cycles frame is incomplete.');
  }

  return validResult(bytes, {
    historicalFadDate: decodeHistoricalDate(bytes, 0, false),
    firstCommissioningDate: decodeHistoricalDate(bytes, 3, true),
    lastMaintenanceDate: decodeHistoricalDate(bytes, 7, true),
    totalCycles,
    cyclesSinceMaintenance,
  });
}

export function decodeBleMaintenance(
  value: BleBytes,
): BleDecodeResult<BleMaintenance> {
  const bytes = toUint8Array(value);
  const failure = validateMinimumLength(
    bytes,
    BLE_READ_MIN_LENGTHS.maintenance,
    'maintenance',
  );

  if (failure !== null) {
    return failure;
  }

  const initializationCount = readUint24BigEndian(bytes, 0);
  const cyclesSinceInitialization = readUint24BigEndian(bytes, 3);
  const obstacleDetectionCount = readUint24BigEndian(bytes, 6);
  const wrongStopOpenCount = readUint24BigEndian(bytes, 9);
  const wrongStopCloseCount = readUint24BigEndian(bytes, 12);

  if (
    initializationCount === null
    || cyclesSinceInitialization === null
    || obstacleDetectionCount === null
    || wrongStopOpenCount === null
    || wrongStopCloseCount === null
  ) {
    return invalidResult(bytes, 'Maintenance frame is incomplete.');
  }

  return validResult(bytes, {
    initializationCount,
    cyclesSinceInitialization,
    obstacleDetectionCount,
    wrongStopOpenCount,
    wrongStopCloseCount,
    learningCycleCount: bytes[15],
    encoderErrorCount: bytes[16],
    motorErrorCount: bytes[17],
  });
}

export function decodeBleUserParameters(
  value: BleBytes,
): BleDecodeResult<BleUserParameters> {
  const bytes = toUint8Array(value);
  const failure = validateMinimumLength(
    bytes,
    BLE_READ_MIN_LENGTHS.userParameters,
    'user parameters',
  );

  if (failure !== null) {
    return failure;
  }

  return validResult(bytes, {
    lockModeRaw: bytes[0],
    lockMode: decodeLockMode(bytes[0]),
    openSpeed: bytes[1],
    closeSpeed: bytes[2],
    shortOpenTime: bytes[3],
    longOpenTime: bytes[4],
    peripheralByte1: bytes[5],
    peripheralByte2: bytes[6],
    peripheralFlags: {
      dynamicLight: Boolean(bytes[5] & 0x80),
      staticLight: Boolean(bytes[5] & 0x40),
      light1: Boolean(bytes[5] & 0x20),
      light2: Boolean(bytes[5] & 0x10),
      rgbIndicator: Boolean(bytes[5] & 0x08),
    },
  });
}

export function decodeBleProfessionalParameters(
  profile: ProductProfile,
  value: BleBytes,
): BleDecodeResult<BleProfessionalParameters> {
  const bytes = toUint8Array(value);

  if (profile === 'unknown' || profile === 'ambiguous') {
    return invalidResult(
      bytes,
      `Professional parameters cannot be decoded for profile "${profile}".`,
    );
  }

  const failure = validateMinimumLength(
    bytes,
    BLE_READ_MIN_LENGTHS.professionalParameters,
    'professional parameters',
  );

  if (failure !== null) {
    return failure;
  }

  const common = {
    weightRangeLower: bytes[0],
    weightRangeUpper: bytes[1],
    nearOpenSpeed: bytes[3],
    nearCloseSpeed: bytes[4],
    nearOpenTorque: bytes[5],
    nearCloseTorque: bytes[6],
    peripheralByte1: bytes[11],
    peripheralByte2: bytes[12],
  };

  if (profile === 'widoor') {
    return validResult(bytes, {
      ...common,
      profile,
      breakForceAtOpen: bytes[2],
      nearOpenProportional: bytes[7],
      nearCloseProportional: bytes[8],
      nearOpenIntegral: bytes[9],
      nearCloseIntegral: bytes[10],
    });
  }

  const moventivLayout = {
    ...common,
    profile,
    exactWeight: bytes[2],
    brakingOpenPower: bytes[7],
    obstacleSensitivity: bytes[8],
    nearOpenIntegral: bytes[9],
    nearCloseIntegral: bytes[10],
  };

  return validResult(bytes, moventivLayout);
}

function decodeLockMode(raw: number): DoorLockMode {
  switch (raw) {
    case 0:
      return 'none';
    case 1:
      return 'locked-open';
    case 2:
      return 'locked-closed';
    default:
      return 'unknown';
  }
}

function decodeHistoricalDate(
  bytes: Uint8Array,
  offset: number,
  includesHour: boolean,
): HistoricalBleDate {
  const length = includesHour ? 4 : 3;
  const raw = Array.from(bytes.slice(offset, offset + length));
  // Phase 1 treats any 0xFF year/month/day component as an absent date.
  const isSentinel = raw.slice(0, 3).some((byte) =>
    byte === HISTORICAL_DATE_SENTINEL,
  );

  return {
    year: raw[0],
    month: raw[1],
    day: raw[2],
    hour: includesHour ? raw[3] : null,
    status: isSentinel ? 'not-initialized' : 'present',
    raw,
  };
}

function validateMinimumLength(
  bytes: Uint8Array,
  minimumLength: number,
  frameName: string,
): BleDecodeFailure | null {
  return bytes.length < minimumLength
    ? invalidResult(
        bytes,
        `The ${frameName} frame requires at least ${minimumLength} bytes; received ${bytes.length}.`,
      )
    : null;
}

function isReadableOffset(
  bytes: Uint8Array,
  offset: number,
  width: number,
): boolean {
  return Number.isInteger(offset)
    && offset >= 0
    && offset + width <= bytes.length;
}

function validResult<T>(
  bytes: Uint8Array,
  value: T,
): BleDecodeSuccess<T> {
  return {
    valid: true,
    value,
    rawHex: bytesToHex(bytes),
    length: bytes.length,
    errors: [],
  };
}

function invalidResult(
  bytes: Uint8Array,
  error: string,
): BleDecodeFailure {
  return {
    valid: false,
    value: null,
    rawHex: bytesToHex(bytes),
    length: bytes.length,
    errors: [error],
  };
}
