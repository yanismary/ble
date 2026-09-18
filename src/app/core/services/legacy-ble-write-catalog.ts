import {
  BLE_UUIDS,
  ProductProfile,
} from './ble-profile-catalog';
import { encodeMotorCommand } from './motor-command';

const LEGACY_BLE_WRITE_BRAND: unique symbol = Symbol('LegacyBleWrite');

export type KnownProductProfile = Exclude<
  ProductProfile,
  'unknown' | 'ambiguous'
>;

export type LegacyDestructiveLevel =
  | 'non-destructive-setting'
  | 'motor-movement'
  | 'learning'
  | 'reset';

export type LegacyHardwareValidationStatus =
  | 'validated-widoor-old-firmware'
  | 'phase1-reference-only'
  | 'not-yet-validated';

export interface LegacyBleWrite {
  readonly [LEGACY_BLE_WRITE_BRAND]: true;
  readonly operation: string;
  readonly profile: KnownProductProfile;
  readonly serviceUuid: string;
  readonly characteristicUuid: string;
  readonly payload: Uint8Array;
  readonly payloadHex: string;
  readonly length: number;
  readonly destructiveLevel: LegacyDestructiveLevel;
  readonly requiresConfirmation: boolean;
  readonly hardwareValidationStatus: LegacyHardwareValidationStatus;
  readonly notes?: string;
}

interface LegacyBleWriteFingerprint {
  readonly operation: string;
  readonly profile: KnownProductProfile;
  readonly serviceUuid: string;
  readonly characteristicUuid: string;
  readonly payload: Uint8Array;
  readonly payloadHex: string;
  readonly length: number;
  readonly destructiveLevel: LegacyDestructiveLevel;
  readonly requiresConfirmation: boolean;
  readonly hardwareValidationStatus: LegacyHardwareValidationStatus;
  readonly notes?: string;
}

const cataloguedWrites = new WeakMap<
  LegacyBleWrite,
  LegacyBleWriteFingerprint
>();

export type LegacyBleWriteAuthenticity =
  | 'authentic'
  | 'unauthenticated'
  | 'altered';

export function inspectCataloguedLegacyBleWrite(
  value: unknown,
): LegacyBleWriteAuthenticity {
  if (typeof value !== 'object' || value === null) {
    return 'unauthenticated';
  }
  const write = value as LegacyBleWrite;
  const fingerprint = cataloguedWrites.get(write);
  if (fingerprint === undefined) {
    return 'unauthenticated';
  }
  const payload = write.payload;
  const intact = Object.isFrozen(write) &&
    write[LEGACY_BLE_WRITE_BRAND] === true &&
    payload instanceof Uint8Array &&
    write.operation === fingerprint.operation &&
    write.profile === fingerprint.profile &&
    write.serviceUuid === fingerprint.serviceUuid &&
    write.characteristicUuid === fingerprint.characteristicUuid &&
    write.payloadHex === fingerprint.payloadHex &&
    write.length === fingerprint.length &&
    write.length === payload.length &&
    payload.length === fingerprint.payload.length &&
    payload.every((valueAtIndex, index) =>
      valueAtIndex === fingerprint.payload[index],
    ) &&
    payloadToHex(payload) === fingerprint.payloadHex &&
    write.destructiveLevel === fingerprint.destructiveLevel &&
    write.requiresConfirmation === fingerprint.requiresConfirmation &&
    write.hardwareValidationStatus ===
      fingerprint.hardwareValidationStatus &&
    write.notes === fingerprint.notes;
  return intact ? 'authentic' : 'altered';
}

export function isCataloguedLegacyBleWrite(
  value: unknown,
): value is LegacyBleWrite {
  return inspectCataloguedLegacyBleWrite(value) === 'authentic';
}

export type LegacyMotorCommand =
  | 'OPEN'
  | 'OPEN_SHORT_TIMED'
  | 'OPEN_LONG_TIMED'
  | 'CLOSE'
  | 'LEARNING';

export type LegacyMotorOperation =
  | 'motor-open'
  | 'motor-open-short-timed'
  | 'motor-open-long-timed'
  | 'motor-close'
  | 'motor-learning';

export type LegacyLockMode = 'none' | 'locked-open' | 'locked-closed';
export type LegacyFeatureState = 'enabled' | 'disabled';
export type LegacyInputMode = 'button' | 'radar';
export type LegacyLockState = 'locked' | 'unlocked';

export interface LegacyValueRange {
  readonly min: number;
  readonly max: number;
}

export interface LegacyValueSemantics {
  readonly readableByteRange: LegacyValueRange;
  readonly invalidReadDefaults: Readonly<Record<string, number>>;
  readonly historicalInternalDefaults: Readonly<Record<string, number>>;
}

export interface LegacyProfileWriteConstraints {
  readonly openSpeed: LegacyValueRange;
  readonly closeSpeed: LegacyValueRange;
  readonly shortTiming: LegacyValueRange;
  readonly longTiming: LegacyValueRange;
  readonly shortTimingInvalidReadDefault: number;
  readonly nearOpenSpeed: LegacyValueRange;
  readonly nearCloseSpeed: LegacyValueRange;
  readonly nearOpenTorque?: LegacyValueRange;
  readonly nearCloseTorque?: LegacyValueRange;
  readonly brakingOpenPower?: LegacyValueRange;
  readonly obstacleSensitivity?: LegacyValueRange;
  readonly breakForceAtOpen?: LegacyValueRange;
  readonly weightRanges: readonly (readonly [number, number])[];
  readonly uiAdvancedRanges: Readonly<Record<string, LegacyValueRange>>;
}

const MOVENTIV_60_WEIGHT_RANGES = [
  [10, 20],
  [20, 30],
  [30, 40],
  [40, 50],
  [50, 60],
  [60, 80],
] as const;

const MOVENTIV_80_WEIGHT_RANGES = [
  ...MOVENTIV_60_WEIGHT_RANGES,
] as const;

const GARLINE_WEIGHT_RANGES = [
  [60, 80],
  [80, 100],
  [100, 120],
  [120, 140],
] as const;

export const LEGACY_WRITE_CONSTRAINTS: Readonly<
  Record<KnownProductProfile, LegacyProfileWriteConstraints>
> = {
  widoor: {
    openSpeed: { min: 25, max: 100 },
    closeSpeed: { min: 35, max: 100 },
    shortTiming: { min: 0, max: 60 },
    longTiming: { min: 0, max: 255 },
    shortTimingInvalidReadDefault: 1,
    breakForceAtOpen: { min: 1, max: 10 },
    nearOpenSpeed: { min: 70, max: 100 },
    nearCloseSpeed: { min: 50, max: 100 },
    nearOpenTorque: { min: 0, max: 255 },
    nearCloseTorque: { min: 0, max: 255 },
    weightRanges: [],
    uiAdvancedRanges: {
      breakForceAtOpen: { min: 1, max: 10 },
      nearOpenSpeed: { min: 70, max: 100 },
      nearCloseSpeed: { min: 50, max: 100 },
    },
  },
  'moventiv-60': {
    openSpeed: { min: 50, max: 100 },
    closeSpeed: { min: 50, max: 100 },
    shortTiming: { min: 0, max: 60 },
    longTiming: { min: 1, max: 60 },
    shortTimingInvalidReadDefault: 1,
    nearOpenSpeed: { min: 0, max: 200 },
    nearCloseSpeed: { min: 0, max: 200 },
    nearOpenTorque: { min: 0, max: 200 },
    nearCloseTorque: { min: 0, max: 200 },
    brakingOpenPower: { min: 0, max: 200 },
    obstacleSensitivity: { min: 0, max: 200 },
    weightRanges: MOVENTIV_60_WEIGHT_RANGES,
    uiAdvancedRanges: {
      nearOpenSpeed: { min: 1, max: 100 },
      nearCloseSpeed: { min: 1, max: 100 },
      nearOpenTorque: { min: 1, max: 200 },
      nearCloseTorque: { min: 1, max: 200 },
      brakingOpenPower: { min: 1, max: 100 },
      obstacleSensitivity: { min: 1, max: 5 },
    },
  },
  'moventiv-80': {
    openSpeed: { min: 50, max: 100 },
    closeSpeed: { min: 50, max: 100 },
    shortTiming: { min: 0, max: 60 },
    longTiming: { min: 1, max: 60 },
    shortTimingInvalidReadDefault: 1,
    nearOpenSpeed: { min: 0, max: 200 },
    nearCloseSpeed: { min: 0, max: 200 },
    nearOpenTorque: { min: 0, max: 200 },
    nearCloseTorque: { min: 0, max: 200 },
    brakingOpenPower: { min: 0, max: 200 },
    obstacleSensitivity: { min: 0, max: 200 },
    weightRanges: MOVENTIV_80_WEIGHT_RANGES,
    uiAdvancedRanges: {
      nearOpenSpeed: { min: 1, max: 100 },
      nearCloseSpeed: { min: 1, max: 100 },
      nearOpenTorque: { min: 1, max: 200 },
      nearCloseTorque: { min: 1, max: 200 },
      brakingOpenPower: { min: 1, max: 100 },
      obstacleSensitivity: { min: 1, max: 5 },
    },
  },
  garline: {
    openSpeed: { min: 0, max: 100 },
    closeSpeed: { min: 0, max: 100 },
    shortTiming: { min: 0, max: 60 },
    longTiming: { min: 1, max: 60 },
    shortTimingInvalidReadDefault: 1,
    nearOpenSpeed: { min: 0, max: 100 },
    nearCloseSpeed: { min: 0, max: 100 },
    nearOpenTorque: { min: 0, max: 200 },
    nearCloseTorque: { min: 0, max: 200 },
    brakingOpenPower: { min: 0, max: 200 },
    obstacleSensitivity: { min: 0, max: 200 },
    weightRanges: GARLINE_WEIGHT_RANGES,
    uiAdvancedRanges: {
      nearOpenSpeed: { min: 0, max: 100 },
      nearCloseSpeed: { min: 0, max: 100 },
      nearOpenTorque: { min: 1, max: 200 },
      nearCloseTorque: { min: 1, max: 200 },
      brakingOpenPower: { min: 1, max: 100 },
      obstacleSensitivity: { min: 1, max: 5 },
    },
  },
};

// These defaults have distinct Phase 1 contexts and are not write-range rules.
export const LEGACY_VALUE_SEMANTICS: Readonly<
  Record<KnownProductProfile, LegacyValueSemantics>
> = {
  widoor: {
    readableByteRange: { min: 0, max: 255 },
    invalidReadDefaults: { shortTiming: 1 },
    historicalInternalDefaults: {
      resetOpenSpeed: 50,
      resetCloseSpeed: 50,
      resetShortTiming: 3,
    },
  },
  'moventiv-60': {
    readableByteRange: { min: 0, max: 255 },
    invalidReadDefaults: { shortTiming: 1 },
    historicalInternalDefaults: {
      demoOpenSpeed: 90,
      demoCloseSpeed: 95,
      demoShortTiming: 4,
      demoLongTiming: 10,
    },
  },
  'moventiv-80': {
    readableByteRange: { min: 0, max: 255 },
    invalidReadDefaults: { shortTiming: 1 },
    historicalInternalDefaults: {
      demoOpenSpeed: 90,
      demoCloseSpeed: 95,
      demoShortTiming: 4,
      demoLongTiming: 10,
    },
  },
  garline: {
    readableByteRange: { min: 0, max: 255 },
    invalidReadDefaults: { shortTiming: 1 },
    historicalInternalDefaults: {
      demoOpenSpeed: 90,
      demoCloseSpeed: 95,
      demoShortTiming: 1,
      demoLongTiming: 10,
    },
  },
};

export function encodeLegacyMotorCommand(
  profile: KnownProductProfile,
  command: LegacyMotorCommand,
): LegacyBleWrite {
  const payloads: Record<Exclude<LegacyMotorCommand, 'OPEN'>, readonly number[]> = {
    OPEN_SHORT_TIMED: [0x00, 0x21, 0x00, 0x00],
    OPEN_LONG_TIMED: [0x00, 0x22],
    CLOSE: [0x00, 0x30],
    LEARNING: [0x00, 0x12],
  };
  const payload = command === 'OPEN'
    ? encodeMotorCommand(profile, 'OPEN')
    : Uint8Array.from(payloads[command]);
  const learning = command === 'LEARNING';
  const operations: Record<LegacyMotorCommand, LegacyMotorOperation> = {
    OPEN: 'motor-open',
    OPEN_SHORT_TIMED: 'motor-open-short-timed',
    OPEN_LONG_TIMED: 'motor-open-long-timed',
    CLOSE: 'motor-close',
    LEARNING: 'motor-learning',
  };

  return createWrite(
    profile,
    operations[command],
    BLE_UUIDS.shdoService,
    BLE_UUIDS.motorCommandCharacteristic,
    payload,
    learning ? 'learning' : 'motor-movement',
    true,
    command === 'OPEN' && profile === 'widoor'
      ? 'validated-widoor-old-firmware'
      : 'phase1-reference-only',
  );
}

export function encodeLegacyLockMode(
  profile: KnownProductProfile,
  mode: LegacyLockMode,
): LegacyBleWrite {
  const raw: Record<LegacyLockMode, number> = {
    none: 0x00,
    'locked-open': 0x01,
    'locked-closed': 0x02,
  };
  return userWrite(profile, 'lock-mode', [0x00, raw[mode]]);
}

export type LegacyUserScalar =
  | 'open-speed'
  | 'close-speed'
  | 'short-timing'
  | 'long-timing';

export function encodeLegacyUserScalar(
  profile: KnownProductProfile,
  operation: LegacyUserScalar,
  value: number,
): LegacyBleWrite {
  const selectors: Record<LegacyUserScalar, number> = {
    'open-speed': 0x01,
    'close-speed': 0x02,
    'short-timing': 0x03,
    'long-timing': 0x04,
  };
  const constraints = LEGACY_WRITE_CONSTRAINTS[profile];
  const ranges: Record<LegacyUserScalar, LegacyValueRange> = {
    'open-speed': constraints.openSpeed,
    'close-speed': constraints.closeSpeed,
    'short-timing': constraints.shortTiming,
    'long-timing': constraints.longTiming,
  };
  assertInRange(value, ranges[operation], operation);
  return userWrite(profile, operation, [selectors[operation], value]);
}

export type LegacyUserPeripheral =
  | 'static-light'
  | 'dynamic-light'
  | 'rgb-indicator';

export function encodeLegacyUserPeripheral(
  profile: KnownProductProfile,
  operation: LegacyUserPeripheral,
  state: LegacyFeatureState,
): LegacyBleWrite {
  const selectors: Record<LegacyUserPeripheral, number> = {
    'static-light': 0x06,
    'dynamic-light': 0x07,
    'rgb-indicator': 0x03,
  };
  return userWrite(profile, operation, [
    0x05,
    selectors[operation],
    encodeLegacyEnabledState(state),
  ]);
}

export type LegacyProfessionalScalar =
  | 'break-force-at-open'
  | 'near-open-speed'
  | 'near-close-speed'
  | 'near-open-torque'
  | 'near-close-torque'
  | 'braking-open-power'
  | 'obstacle-sensitivity';

export function encodeLegacyProfessionalScalar(
  profile: KnownProductProfile,
  operation: LegacyProfessionalScalar,
  value: number,
): LegacyBleWrite {
  const constraints = LEGACY_WRITE_CONSTRAINTS[profile];
  const definitions: Record<
    LegacyProfessionalScalar,
    { readonly selector: number; readonly range?: LegacyValueRange }
  > = {
    'break-force-at-open': {
      selector: 0x01,
      range: constraints.breakForceAtOpen,
    },
    'near-open-speed': { selector: 0x02, range: constraints.nearOpenSpeed },
    'near-close-speed': { selector: 0x03, range: constraints.nearCloseSpeed },
    'near-open-torque': { selector: 0x04, range: constraints.nearOpenTorque },
    'near-close-torque': { selector: 0x05, range: constraints.nearCloseTorque },
    'braking-open-power': {
      selector: 0x06,
      range: constraints.brakingOpenPower,
    },
    'obstacle-sensitivity': {
      selector: 0x07,
      range: constraints.obstacleSensitivity,
    },
  };
  const definition = definitions[operation];
  if (definition.range === undefined) {
    throw new Error(`${operation} is not available for ${profile}.`);
  }
  assertInRange(value, definition.range, operation);
  return professionalWrite(profile, operation, [definition.selector, value]);
}

export function encodeLegacyWeightRange(
  profile: Exclude<KnownProductProfile, 'widoor'>,
  minimum: number,
  maximum: number,
): LegacyBleWrite {
  const allowed = LEGACY_WRITE_CONSTRAINTS[profile].weightRanges.some(
    ([min, max]) => min === minimum && max === maximum,
  );
  if (!allowed) {
    throw new Error(`Weight range ${minimum}-${maximum} is invalid for ${profile}.`);
  }
  return professionalWrite(profile, 'weight-range', [0x00, minimum, maximum]);
}

export type LegacyProfessionalPeripheral =
  | 'input-1-radar'
  | 'input-2-radar'
  | 'lock'
  | 'radar-test-1'
  | 'radar-test-2';

export type LegacyProfessionalPeripheralState<
  T extends LegacyProfessionalPeripheral,
> = T extends 'input-1-radar' | 'input-2-radar'
  ? LegacyInputMode
  : T extends 'lock'
    ? LegacyLockState
    : LegacyFeatureState;

export function encodeLegacyProfessionalPeripheral<
  T extends LegacyProfessionalPeripheral,
>(
  profile: KnownProductProfile,
  operation: T,
  state: LegacyProfessionalPeripheralState<T>,
): LegacyBleWrite {
  const selectors: Record<LegacyProfessionalPeripheral, number> = {
    'input-1-radar': 0x07,
    'input-2-radar': 0x06,
    lock: 0x05,
    'radar-test-1': 0x04,
    'radar-test-2': 0x03,
  };
  return professionalWrite(profile, operation, [
    0x0a,
    selectors[operation],
    encodeLegacyPeripheralState(state),
  ]);
}

// Phase 1 writes 0x01 for a set bit and 0x02 for its cleared counterpart.
export function encodeLegacyEnabledState(state: LegacyFeatureState): number {
  return state === 'enabled' ? 0x01 : 0x02;
}

export function encodeLegacyInputMode(mode: LegacyInputMode): number {
  return mode === 'radar' ? 0x01 : 0x02;
}

export function encodeMoventivUserInputMode(
  profile: 'moventiv-60' | 'moventiv-80',
  input: 1 | 2,
  mode: LegacyInputMode,
): LegacyBleWrite {
  // User peripheral selectors match firmware bit positions (7/6/3 already used).
  return userWrite(profile, input === 1 ? 'input-1-radar' : 'input-2-radar', [
    0x05,
    input === 1 ? 0x05 : 0x04,
    encodeLegacyInputMode(mode),
  ]);
}

export function encodeLegacyLockState(state: LegacyLockState): number {
  return state === 'locked' ? 0x01 : 0x02;
}

function encodeLegacyPeripheralState(
  state: LegacyFeatureState | LegacyInputMode | LegacyLockState,
): number {
  switch (state) {
    case 'enabled':
    case 'radar':
    case 'locked':
      return 0x01;
    case 'disabled':
    case 'button':
    case 'unlocked':
      return 0x02;
  }
}

export interface LegacyNameEncodingSuccess {
  readonly valid: true;
  readonly value: string;
  readonly bytes: Uint8Array;
}

export interface LegacyNameEncodingFailure {
  readonly valid: false;
  readonly value: null;
  readonly bytes: null;
  readonly error: 'empty' | 'invalid-characters' | 'too-long';
}

export type LegacyNameEncodingResult =
  | LegacyNameEncodingSuccess
  | LegacyNameEncodingFailure;

export const LEGACY_KNOWN_ROOM_SUFFIXES = [
  '#CHA',
  '#ENT',
  '#SAL',
  '#CUI',
  '#SAM',
  '#SDB',
  '#WCS',
  '#GAR',
  '#SLL',
  '#SDJ',
] as const;

export type LegacyRoomSuffix = typeof LEGACY_KNOWN_ROOM_SUFFIXES[number];

export const LEGACY_SELECTABLE_ROOM_SUFFIXES: readonly LegacyRoomSuffix[] =
  Object.freeze([
    '#CHA',
    '#SAL',
    '#SAM',
    '#CUI',
    '#SDB',
    '#WCS',
    '#GAR',
    '#SDJ',
  ]);

export function encodeLegacyName(
  name: string,
  roomSuffix = '',
): LegacyNameEncodingResult {
  const trimmedName = name.trim();
  const value = `${trimmedName}${roomSuffix}`.trim();
  if (!value) {
    return { valid: false, value: null, bytes: null, error: 'empty' };
  }
  if (!/^[A-Za-z0-9 -]+$/.test(trimmedName) ||
      !/^[A-Za-z0-9# -]*$/.test(roomSuffix)) {
    return {
      valid: false,
      value: null,
      bytes: null,
      error: 'invalid-characters',
    };
  }
  if (value.length > 15) {
    return { valid: false, value: null, bytes: null, error: 'too-long' };
  }
  return {
    valid: true,
    value,
    bytes: Uint8Array.from(Array.from(value), (character) =>
      character.charCodeAt(0),
    ),
  };
}

export function encodeLegacyNameWrite(
  profile: KnownProductProfile,
  name: string,
  roomSuffix = '',
): LegacyBleWrite {
  if (roomSuffix !== '' && !isLegacyRoomSuffix(roomSuffix)) {
    throw new Error('Invalid legacy name: invalid-room.');
  }
  const encoded = encodeLegacyName(name, roomSuffix);
  if (!encoded.valid) {
    throw new Error(`Invalid legacy name: ${encoded.error}.`);
  }
  return createWrite(
    profile,
    'name-room',
    BLE_UUIDS.shdoService,
    BLE_UUIDS.nameCharacteristic,
    encoded.bytes,
    'non-destructive-setting',
    false,
    'phase1-reference-only',
  );
}

function isLegacyRoomSuffix(value: string): value is LegacyRoomSuffix {
  return LEGACY_KNOWN_ROOM_SUFFIXES.some((suffix) => suffix === value);
}

export interface LegacyBleDateFields {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
}

export function encodeLegacyDateWrite(
  profile: KnownProductProfile,
  kind: 'first-commissioning' | 'maintenance',
  date: LegacyBleDateFields,
): LegacyBleWrite {
  assertInRange(date.year, { min: 0, max: 255 }, 'year');
  assertInRange(date.month, { min: 0, max: 11 }, 'month');
  assertInRange(date.day, { min: 1, max: 31 }, 'day');
  assertInRange(date.hour, { min: 0, max: 23 }, 'hour');
  if (!isValidCalendarDate(2000 + date.year, date.month + 1, date.day)) {
    throw new Error('date must be a valid calendar date.');
  }
  return createWrite(
    profile,
    `${kind}-date`,
    BLE_UUIDS.shdoService,
    BLE_UUIDS.datesAndCyclesCharacteristic,
    [kind === 'first-commissioning' ? 0x01 : 0x02,
      date.year, date.month, date.day, date.hour],
    'non-destructive-setting',
    false,
    'phase1-reference-only',
  );
}

export interface LegacyResetStep extends LegacyBleWrite {
  readonly index: number;
  readonly delayAfterMs: 250;
  readonly description: string;
}

export function createWidoorLegacyResetSequence(): readonly LegacyResetStep[] {
  const definitions = [
    ['user', [0x01, 50], 'vitesse ouverture'],
    ['user', [0x02, 50], 'vitesse fermeture'],
    ['user', [0x03, 3], 'temporisation courte'],
    ['professional', [0x01, 5], 'force freinage ouverture'],
    ['professional', [0x02, 80], 'vitesse fin ouverture'],
    ['professional', [0x03, 70], 'vitesse fin fermeture'],
    ['professional', [0x0a, 0x07, 0x02], 'entrée 1 bouton'],
    ['professional', [0x0a, 0x06, 0x02], 'entrée 2 bouton'],
    ['professional', [0x0a, 0x05, 0x02], 'verrou désactivé'],
  ] as const;
  const steps = definitions.map(([target, payload, description], index) => {
    const step: LegacyResetStep = {
      ...createWrite(
      'widoor',
      `reset-step-${index + 1}`,
      BLE_UUIDS.widoorService,
      target === 'user'
        ? BLE_UUIDS.userParametersCharacteristic
        : BLE_UUIDS.professionalParametersCharacteristic,
      payload,
      'reset',
      true,
      'phase1-reference-only',
      ),
      index: index + 1,
      delayAfterMs: 250,
      description,
    };
    return registerCataloguedWrite(step);
  });
  return Object.freeze(steps);
}

function userWrite(
  profile: KnownProductProfile,
  operation: string,
  payload: readonly number[],
): LegacyBleWrite {
  return createWrite(
    profile,
    operation,
    secondaryService(profile),
    BLE_UUIDS.userParametersCharacteristic,
    payload,
    'non-destructive-setting',
    false,
    'phase1-reference-only',
  );
}

function professionalWrite(
  profile: KnownProductProfile,
  operation: string,
  payload: readonly number[],
): LegacyBleWrite {
  return createWrite(
    profile,
    operation,
    secondaryService(profile),
    BLE_UUIDS.professionalParametersCharacteristic,
    payload,
    'non-destructive-setting',
    false,
    'phase1-reference-only',
  );
}

function secondaryService(profile: KnownProductProfile): string {
  switch (profile) {
    case 'widoor':
      return BLE_UUIDS.widoorService;
    case 'moventiv-60':
    case 'moventiv-80':
    case 'garline':
      return BLE_UUIDS.moventivGarlineService;
  }
}

function createWrite(
  profile: KnownProductProfile,
  operation: string,
  serviceUuid: string,
  characteristicUuid: string,
  payloadValue: Uint8Array | readonly number[],
  destructiveLevel: LegacyDestructiveLevel,
  requiresConfirmation: boolean,
  hardwareValidationStatus: LegacyHardwareValidationStatus,
): LegacyBleWrite {
  const payload = payloadValue instanceof Uint8Array
    ? Uint8Array.from(payloadValue)
    : Uint8Array.from(payloadValue);
  const write: LegacyBleWrite = {
    [LEGACY_BLE_WRITE_BRAND]: true,
    operation,
    profile,
    serviceUuid,
    characteristicUuid,
    payload,
    payloadHex: payloadToHex(payload),
    length: payload.length,
    destructiveLevel,
    requiresConfirmation,
    hardwareValidationStatus,
  };
  return registerCataloguedWrite(write);
}

function registerCataloguedWrite<T extends LegacyBleWrite>(write: T): T {
  const privatePayload = Uint8Array.from(write.payload);
  Object.defineProperty(write, 'payload', {
    configurable: false,
    enumerable: true,
    get: () => Uint8Array.from(privatePayload),
  });
  cataloguedWrites.set(write, {
    operation: write.operation,
    profile: write.profile,
    serviceUuid: write.serviceUuid,
    characteristicUuid: write.characteristicUuid,
    payload: privatePayload,
    payloadHex: write.payloadHex,
    length: write.length,
    destructiveLevel: write.destructiveLevel,
    requiresConfirmation: write.requiresConfirmation,
    hardwareValidationStatus: write.hardwareValidationStatus,
    notes: write.notes,
  });
  return Object.freeze(write);
}

function payloadToHex(payload: Uint8Array): string {
  return Array.from(payload, (value) =>
    value.toString(16).padStart(2, '0'),
  ).join(' ');
}

function assertInRange(
  value: number,
  range: LegacyValueRange,
  field: string,
): void {
  if (!Number.isInteger(value) || value < range.min || value > range.max) {
    throw new Error(
      `${field} must be an integer between ${range.min} and ${range.max}.`,
    );
  }
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysByMonth = [
    31, leapYear ? 29 : 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31,
  ];
  return day <= daysByMonth[month - 1];
}
