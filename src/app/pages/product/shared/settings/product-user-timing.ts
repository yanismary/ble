import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteExecutionPolicy,
} from '../../../../core/services/ble-write-execution.service';
import {
  KnownProductProfile,
  LegacyBleWrite,
  LEGACY_WRITE_CONSTRAINTS,
  encodeLegacyUserScalar,
  isCataloguedLegacyBleWrite,
} from '../../../../core/services/legacy-ble-write-catalog';
import type { ProductPageConfig, ProductUserField } from
  '../../profiles/product-profile.types';

export type ProductUserTimingField = Extract<
  ProductUserField,
  'short-timing' | 'long-timing'
>;

export type ProductUserTimingTextKey = 'shortTiming' | 'longTiming';

export interface ProductUserTimingUiConfig {
  readonly profile: KnownProductProfile;
  readonly field: ProductUserTimingField;
  readonly textKey: ProductUserTimingTextKey;
  readonly range: Readonly<{ min: number; max: number }>;
  readonly unit: 's' | 'min';
  readonly catalogFactory: (value: number) => LegacyBleWrite;
  readonly confirmationPolicy: LegacyBleWriteConfirmationPolicy;
  readonly policy: LegacyBleWriteExecutionPolicy;
}

export interface ProductUserTimingAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}

const PRODUCT_USER_TIMING_AUTHORIZATION_TTL_MS = 30_000;

const TIMING_DEFINITIONS: readonly {
  readonly field: ProductUserTimingField;
  readonly textKey: ProductUserTimingTextKey;
  readonly constraintKey: 'shortTiming' | 'longTiming';
  readonly unit: 's' | 'min';
}[] = Object.freeze([
  Object.freeze({
    field: 'short-timing',
    textKey: 'shortTiming',
    constraintKey: 'shortTiming',
    unit: 's',
  }),
  Object.freeze({
    field: 'long-timing',
    textKey: 'longTiming',
    constraintKey: 'longTiming',
    unit: 'min',
  }),
]);

export function productUserTimingConfigsFor(
  config: ProductPageConfig,
): readonly ProductUserTimingUiConfig[] {
  return Object.freeze(
    TIMING_DEFINITIONS
      .filter((definition) => config.userFields.includes(definition.field))
      .map((definition) => timingConfig(config.profile, definition)),
  );
}

export function isValidProductUserTimingValue(
  config: ProductUserTimingUiConfig,
  value: number,
): boolean {
  return Number.isInteger(value) &&
    value >= config.range.min &&
    value <= config.range.max;
}

export function createProductUserTimingAuthorization(
  input: ProductUserTimingAuthorizationInput,
): LegacyBleWriteAuthorization {
  if (!isCataloguedLegacyBleWrite(input.write) ||
      (input.write.operation !== 'short-timing' &&
        input.write.operation !== 'long-timing') ||
      input.write.destructiveLevel !== 'non-destructive-setting' ||
      input.write.hardwareValidationStatus !== 'phase1-reference-only') {
    throw new Error('A controlled catalogued user-timing write is required.');
  }
  if (!input.deviceId.trim() ||
      !input.attemptId.trim() ||
      !input.confirmationId.trim()) {
    throw new Error('User-timing authorization context is incomplete.');
  }
  if (!Number.isInteger(input.connectionGeneration) ||
      input.connectionGeneration < 0 ||
      !Number.isFinite(input.confirmedAt)) {
    throw new Error('User-timing authorization context is invalid.');
  }
  return Object.freeze({
    confirmedByUser: true,
    confirmedAt: input.confirmedAt,
    expiresAt: input.confirmedAt + PRODUCT_USER_TIMING_AUTHORIZATION_TTL_MS,
    confirmationId: input.confirmationId,
    operation: input.write.operation,
    payloadHex: input.write.payloadHex,
    profile: input.write.profile,
    deviceId: input.deviceId,
    connectionGeneration: input.connectionGeneration,
    attemptId: input.attemptId,
  });
}

function timingConfig(
  profile: KnownProductProfile,
  definition: {
    readonly field: ProductUserTimingField;
    readonly textKey: ProductUserTimingTextKey;
    readonly constraintKey: 'shortTiming' | 'longTiming';
    readonly unit: 's' | 'min';
  },
): ProductUserTimingUiConfig {
  const range = LEGACY_WRITE_CONSTRAINTS[profile][definition.constraintKey];
  return Object.freeze({
    profile,
    field: definition.field,
    textKey: definition.textKey,
    range: Object.freeze({ min: range.min, max: range.max }),
    unit: definition.unit,
    catalogFactory: (value: number) =>
      encodeLegacyUserScalar(profile, definition.field, value),
    confirmationPolicy: { kind: 'gatt-only' } as const,
    policy: { allowPhase1ReferenceOnly: true } as const,
  });
}
