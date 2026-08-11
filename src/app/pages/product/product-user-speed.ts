import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteExecutionPolicy,
} from '../../core/services/ble-write-execution.service';
import {
  KnownProductProfile,
  LegacyBleWrite,
  encodeLegacyUserScalar,
  isCataloguedLegacyBleWrite,
} from '../../core/services/legacy-ble-write-catalog';
import { ProductPageConfig, ProductUserField } from './product-page.config';

export type ProductUserSpeedField = Extract<
  ProductUserField,
  'open-speed' | 'close-speed'
>;

export type ProductUserSpeedTextKey = 'openSpeed' | 'closeSpeed';

export interface ProductUserSpeedUiConfig {
  readonly profile: KnownProductProfile;
  readonly field: ProductUserSpeedField;
  readonly textKey: ProductUserSpeedTextKey;
  readonly range: Readonly<{ min: number; max: number }>;
  readonly catalogFactory: (value: number) => LegacyBleWrite;
  readonly confirmationPolicy: LegacyBleWriteConfirmationPolicy;
  readonly policy: LegacyBleWriteExecutionPolicy;
}

export interface ProductUserSpeedAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}

const PRODUCT_USER_SPEED_AUTHORIZATION_TTL_MS = 30_000;

const SPEED_DEFINITIONS: readonly {
  readonly field: ProductUserSpeedField;
  readonly textKey: ProductUserSpeedTextKey;
  readonly rangeKey: 'openSpeedRange' | 'closeSpeedRange';
}[] = Object.freeze([
  Object.freeze({
    field: 'open-speed',
    textKey: 'openSpeed',
    rangeKey: 'openSpeedRange',
  }),
  Object.freeze({
    field: 'close-speed',
    textKey: 'closeSpeed',
    rangeKey: 'closeSpeedRange',
  }),
]);

export function productUserSpeedConfigsFor(
  config: ProductPageConfig,
): readonly ProductUserSpeedUiConfig[] {
  return Object.freeze(
    SPEED_DEFINITIONS
      .filter((definition) => config.userFields.includes(definition.field))
      .map((definition) => speedConfig(config, definition)),
  );
}

export function isValidProductUserSpeedValue(
  config: ProductUserSpeedUiConfig,
  value: number,
): boolean {
  return Number.isInteger(value) &&
    value >= config.range.min &&
    value <= config.range.max;
}

export function createProductUserSpeedAuthorization(
  input: ProductUserSpeedAuthorizationInput,
): LegacyBleWriteAuthorization {
  if (!isCataloguedLegacyBleWrite(input.write) ||
      (input.write.operation !== 'open-speed' &&
        input.write.operation !== 'close-speed') ||
      input.write.destructiveLevel !== 'non-destructive-setting' ||
      input.write.hardwareValidationStatus !== 'phase1-reference-only') {
    throw new Error('A controlled catalogued user-speed write is required.');
  }
  if (!input.deviceId.trim() ||
      !input.attemptId.trim() ||
      !input.confirmationId.trim()) {
    throw new Error('User-speed authorization context is incomplete.');
  }
  if (!Number.isInteger(input.connectionGeneration) ||
      input.connectionGeneration < 0 ||
      !Number.isFinite(input.confirmedAt)) {
    throw new Error('User-speed authorization context is invalid.');
  }
  return Object.freeze({
    confirmedByUser: true,
    confirmedAt: input.confirmedAt,
    expiresAt: input.confirmedAt + PRODUCT_USER_SPEED_AUTHORIZATION_TTL_MS,
    confirmationId: input.confirmationId,
    operation: input.write.operation,
    payloadHex: input.write.payloadHex,
    profile: input.write.profile,
    deviceId: input.deviceId,
    connectionGeneration: input.connectionGeneration,
    attemptId: input.attemptId,
  });
}

function speedConfig(
  pageConfig: ProductPageConfig,
  definition: {
    readonly field: ProductUserSpeedField;
    readonly textKey: ProductUserSpeedTextKey;
    readonly rangeKey: 'openSpeedRange' | 'closeSpeedRange';
  },
): ProductUserSpeedUiConfig {
  const range = pageConfig[definition.rangeKey];
  return Object.freeze({
    profile: pageConfig.profile,
    field: definition.field,
    textKey: definition.textKey,
    range: Object.freeze({ min: range.min, max: range.max }),
    catalogFactory: (value: number) =>
      encodeLegacyUserScalar(pageConfig.profile, definition.field, value),
    confirmationPolicy: { kind: 'gatt-only' } as const,
    policy: { allowPhase1ReferenceOnly: true } as const,
  });
}
