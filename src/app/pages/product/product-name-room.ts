import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteExecutionPolicy,
} from '../../core/services/ble-write-execution.service';
import {
  LEGACY_KNOWN_ROOM_SUFFIXES,
  LEGACY_SELECTABLE_ROOM_SUFFIXES,
  LegacyRoomSuffix,
  KnownProductProfile,
  LegacyBleWrite,
  encodeLegacyName,
  encodeLegacyNameWrite,
  isCataloguedLegacyBleWrite,
} from '../../core/services/legacy-ble-write-catalog';

export type ProductRoomSuffix = LegacyRoomSuffix;

export type ProductRoomTextKey =
  | 'bedroom'
  | 'entrance'
  | 'livingRoom'
  | 'kitchen'
  | 'diningRoom'
  | 'bathroom'
  | 'toilet'
  | 'garageUtilityRoom'
  | 'hall'
  | 'playroom';

export interface ProductRoomOption {
  readonly suffix: ProductRoomSuffix;
  readonly textKey: ProductRoomTextKey;
}

export interface ProductNameRoomValue {
  readonly name: string;
  readonly roomSuffix: ProductRoomSuffix | null;
}

export interface ProductNameRoomDraft {
  readonly name: string;
  readonly roomSuffix: ProductRoomSuffix | null;
}

export interface ProductNameRoomValidationSuccess {
  readonly valid: true;
  readonly valueToWrite: string;
  readonly baseName: string;
  readonly roomSuffix: ProductRoomSuffix | null;
  readonly nameChanged: boolean;
  readonly roomChanged: boolean;
}

export interface ProductNameRoomValidationFailure {
  readonly valid: false;
  readonly error:
    | 'empty'
    | 'invalid-characters'
    | 'too-long'
    | 'too-short'
    | 'invalid-room'
    | 'unchanged';
}

export type ProductNameRoomValidationResult =
  | ProductNameRoomValidationSuccess
  | ProductNameRoomValidationFailure;

export interface ProductNameRoomAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}

export const PRODUCT_NAME_ROOM_MIN_TYPED_NAME_LENGTH = 5;
export const PRODUCT_NAME_ROOM_MAX_LENGTH = 15;

const PRODUCT_NAME_ROOM_AUTHORIZATION_TTL_MS = 30_000;

const ROOM_TEXT_KEY_BY_SUFFIX: Record<ProductRoomSuffix, ProductRoomTextKey> =
  Object.freeze({
    '#CHA': 'bedroom',
    '#ENT': 'entrance',
    '#SAL': 'livingRoom',
    '#CUI': 'kitchen',
    '#SAM': 'diningRoom',
    '#SDB': 'bathroom',
    '#WCS': 'toilet',
    '#GAR': 'garageUtilityRoom',
    '#SLL': 'hall',
    '#SDJ': 'playroom',
  });

export const PRODUCT_KNOWN_ROOM_OPTIONS: readonly ProductRoomOption[] =
  Object.freeze(LEGACY_KNOWN_ROOM_SUFFIXES.map((suffix) =>
    Object.freeze({ suffix, textKey: ROOM_TEXT_KEY_BY_SUFFIX[suffix] }),
  ));

export const PRODUCT_ROOM_OPTIONS: readonly ProductRoomOption[] =
  Object.freeze(LEGACY_SELECTABLE_ROOM_SUFFIXES.map((suffix) =>
    Object.freeze({ suffix, textKey: ROOM_TEXT_KEY_BY_SUFFIX[suffix] }),
  ));

export function splitProductDisplayName(
  displayName: string,
): ProductNameRoomValue {
  const trimmed = displayName.trim();
  const suffix = PRODUCT_KNOWN_ROOM_OPTIONS.find((option) =>
    trimmed.endsWith(option.suffix),
  )?.suffix ?? null;
  return Object.freeze({
    name: suffix === null
      ? trimmed
      : trimmed.slice(0, -suffix.length).trim(),
    roomSuffix: suffix,
  });
}

export function createProductNameRoomDraft(
  current: ProductNameRoomValue,
): ProductNameRoomDraft {
  return Object.freeze({
    name: current.name,
    roomSuffix: current.roomSuffix,
  });
}

export function validateProductNameRoomDraft(
  current: ProductNameRoomValue,
  draft: ProductNameRoomDraft,
): ProductNameRoomValidationResult {
  const typedName = draft.name.trim();
  const currentName = current.name.trim();
  const baseName = typedName || currentName;
  const roomSuffix = draft.roomSuffix;

  if (roomSuffix !== null && !isKnownRoomSuffix(roomSuffix)) {
    return { valid: false, error: 'invalid-room' };
  }
  if (roomSuffix !== null &&
      roomSuffix !== current.roomSuffix &&
      !isSelectableRoomSuffix(roomSuffix)) {
    return { valid: false, error: 'invalid-room' };
  }
  if (!baseName) {
    return { valid: false, error: 'empty' };
  }
  if (typedName &&
      typedName.length < PRODUCT_NAME_ROOM_MIN_TYPED_NAME_LENGTH) {
    return { valid: false, error: 'too-short' };
  }

  const encoded = encodeLegacyName(baseName, roomSuffix ?? '');
  if (!encoded.valid) {
    return { valid: false, error: encoded.error };
  }

  const nameChanged = !!typedName && typedName !== currentName;
  const roomChanged = roomSuffix !== current.roomSuffix;
  if (!nameChanged && !roomChanged) {
    return { valid: false, error: 'unchanged' };
  }
  return Object.freeze({
    valid: true,
    valueToWrite: encoded.value,
    baseName,
    roomSuffix,
    nameChanged,
    roomChanged,
  });
}

export function encodeProductNameRoomWrite(
  profile: KnownProductProfile,
  validation: ProductNameRoomValidationSuccess,
): LegacyBleWrite {
  return encodeLegacyNameWrite(
    profile,
    validation.baseName,
    validation.roomSuffix ?? '',
  );
}

export function createProductNameRoomAuthorization(
  input: ProductNameRoomAuthorizationInput,
): LegacyBleWriteAuthorization {
  if (!isCataloguedLegacyBleWrite(input.write) ||
      input.write.operation !== 'name-room' ||
      input.write.serviceUuid.trim().length === 0 ||
      input.write.characteristicUuid.trim().length === 0 ||
      input.write.destructiveLevel !== 'non-destructive-setting' ||
      input.write.hardwareValidationStatus !== 'phase1-reference-only') {
    throw new Error('A controlled catalogued name-room write is required.');
  }
  if (!input.deviceId.trim() ||
      !input.attemptId.trim() ||
      !input.confirmationId.trim()) {
    throw new Error('Name-room authorization context is incomplete.');
  }
  if (!Number.isInteger(input.connectionGeneration) ||
      input.connectionGeneration < 0 ||
      !Number.isFinite(input.confirmedAt)) {
    throw new Error('Name-room authorization context is invalid.');
  }
  return Object.freeze({
    confirmedByUser: true,
    confirmedAt: input.confirmedAt,
    expiresAt: input.confirmedAt + PRODUCT_NAME_ROOM_AUTHORIZATION_TTL_MS,
    confirmationId: input.confirmationId,
    operation: input.write.operation,
    payloadHex: input.write.payloadHex,
    profile: input.write.profile,
    deviceId: input.deviceId,
    connectionGeneration: input.connectionGeneration,
    attemptId: input.attemptId,
  });
}

export const PRODUCT_NAME_ROOM_CONFIRMATION_POLICY:
  LegacyBleWriteConfirmationPolicy = Object.freeze({ kind: 'gatt-only' });

export const PRODUCT_NAME_ROOM_EXECUTION_POLICY:
  LegacyBleWriteExecutionPolicy = Object.freeze({
    allowPhase1ReferenceOnly: true,
  });

function isKnownRoomSuffix(value: string): value is ProductRoomSuffix {
  return PRODUCT_KNOWN_ROOM_OPTIONS.some((option) => option.suffix === value);
}

function isSelectableRoomSuffix(value: string): value is ProductRoomSuffix {
  return PRODUCT_ROOM_OPTIONS.some((option) => option.suffix === value);
}
