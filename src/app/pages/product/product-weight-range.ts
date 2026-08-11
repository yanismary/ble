import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteExecutionPolicy,
} from '../../core/services/ble-write-execution.service';
import {
  KnownProductProfile,
  LegacyBleWrite,
  encodeLegacyWeightRange,
  isCataloguedLegacyBleWrite,
} from '../../core/services/legacy-ble-write-catalog';
import {
  ProductPageConfig,
  ProductProfessionalField,
  ProductWeightRange,
} from './product-page.config';

export type ProductWeightRangeField = Extract<
  ProductProfessionalField,
  'weight-range'
>;

export interface ProductWeightRangeUiConfig {
  readonly profile: Exclude<KnownProductProfile, 'widoor'>;
  readonly field: ProductWeightRangeField;
  readonly range: ProductWeightRange;
  readonly label: string;
  readonly catalogFactory: (range: ProductWeightRange) => LegacyBleWrite;
  readonly confirmationPolicy: LegacyBleWriteConfirmationPolicy;
  readonly policy: LegacyBleWriteExecutionPolicy;
}

export interface ProductWeightRangeAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}

const PRODUCT_WEIGHT_RANGE_AUTHORIZATION_TTL_MS = 30_000;

export function productWeightRangeConfigsFor(
  config: ProductPageConfig,
): readonly ProductWeightRangeUiConfig[] {
  const profile = config.profile;
  if (!config.professionalFields.includes('weight-range') ||
      profile === 'widoor') {
    return Object.freeze([]);
  }
  return Object.freeze(config.weightRanges.map((range) =>
    weightRangeConfig(profile, range),
  ));
}

export function isSameProductWeightRange(
  first: ProductWeightRange | null,
  second: ProductWeightRange | null,
): boolean {
  return first !== null &&
    second !== null &&
    first.lower === second.lower &&
    first.upper === second.upper;
}

export function isValidProductWeightRange(
  configs: readonly ProductWeightRangeUiConfig[],
  range: ProductWeightRange | null,
): boolean {
  return configs.some((config) =>
    isSameProductWeightRange(config.range, range),
  );
}

export function createProductWeightRangeAuthorization(
  input: ProductWeightRangeAuthorizationInput,
): LegacyBleWriteAuthorization {
  if (!isCataloguedLegacyBleWrite(input.write) ||
      input.write.operation !== 'weight-range' ||
      input.write.destructiveLevel !== 'non-destructive-setting' ||
      input.write.hardwareValidationStatus !== 'phase1-reference-only') {
    throw new Error('A controlled catalogued weight-range write is required.');
  }
  if (!input.deviceId.trim() ||
      !input.attemptId.trim() ||
      !input.confirmationId.trim()) {
    throw new Error('Weight-range authorization context is incomplete.');
  }
  if (!Number.isInteger(input.connectionGeneration) ||
      input.connectionGeneration < 0 ||
      !Number.isFinite(input.confirmedAt)) {
    throw new Error('Weight-range authorization context is invalid.');
  }
  return Object.freeze({
    confirmedByUser: true,
    confirmedAt: input.confirmedAt,
    expiresAt: input.confirmedAt + PRODUCT_WEIGHT_RANGE_AUTHORIZATION_TTL_MS,
    confirmationId: input.confirmationId,
    operation: input.write.operation,
    payloadHex: input.write.payloadHex,
    profile: input.write.profile,
    deviceId: input.deviceId,
    connectionGeneration: input.connectionGeneration,
    attemptId: input.attemptId,
  });
}

function weightRangeConfig(
  profile: Exclude<KnownProductProfile, 'widoor'>,
  range: ProductWeightRange,
): ProductWeightRangeUiConfig {
  return Object.freeze({
    profile,
    field: 'weight-range',
    range: Object.freeze({ lower: range.lower, upper: range.upper }),
    label: `${range.lower}-${range.upper} kg`,
    catalogFactory: (value: ProductWeightRange) =>
      encodeLegacyWeightRange(profile, value.lower, value.upper),
    confirmationPolicy: { kind: 'gatt-only' } as const,
    policy: { allowPhase1ReferenceOnly: true } as const,
  });
}
