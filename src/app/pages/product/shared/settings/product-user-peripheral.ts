import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteExecutionPolicy,
} from '../../../../core/services/ble-write-execution.service';
import {
  KnownProductProfile,
  LegacyBleWrite,
  LegacyUserPeripheral,
  encodeLegacyUserPeripheral,
  isCataloguedLegacyBleWrite,
} from '../../../../core/services/legacy-ble-write-catalog';
import type { ProductPageConfig, ProductUserField } from
  '../../profiles/product-profile.types';

export type ProductUserPeripheralField = Extract<
  ProductUserField,
  'static-light' | 'dynamic-light' | 'rgb'
>;

export type ProductUserPeripheralTextKey =
  | 'staticLight'
  | 'dynamicLight'
  | 'rgb';

export interface ProductUserPeripheralUiConfig {
  readonly profile: KnownProductProfile;
  readonly field: ProductUserPeripheralField;
  readonly textKey: ProductUserPeripheralTextKey;
  readonly catalogFactory: (enabled: boolean) => LegacyBleWrite;
  readonly confirmationPolicy: LegacyBleWriteConfirmationPolicy;
  readonly policy: LegacyBleWriteExecutionPolicy;
}

export interface ProductUserPeripheralAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}

const PRODUCT_USER_PERIPHERAL_AUTHORIZATION_TTL_MS = 30_000;

interface ProductUserPeripheralDefinition {
  readonly field: ProductUserPeripheralField;
  readonly textKey: ProductUserPeripheralTextKey;
  readonly operation: LegacyUserPeripheral;
  readonly profiles: readonly KnownProductProfile[];
}

const USER_PERIPHERAL_DEFINITIONS: readonly (
  ProductUserPeripheralDefinition
)[] = Object.freeze([
  Object.freeze({
    field: 'static-light',
    textKey: 'staticLight',
    operation: 'static-light',
    profiles: ['moventiv-60', 'moventiv-80', 'garline'] as const,
  }),
  Object.freeze({
    field: 'dynamic-light',
    textKey: 'dynamicLight',
    operation: 'dynamic-light',
    profiles: ['moventiv-60', 'moventiv-80', 'garline'] as const,
  }),
  Object.freeze({
    field: 'rgb',
    textKey: 'rgb',
    operation: 'rgb-indicator',
    profiles: [
      'widoor',
      'moventiv-60',
      'moventiv-80',
      'garline',
    ] as const,
  }),
]);

export function productUserPeripheralConfigsFor(
  config: ProductPageConfig,
): readonly ProductUserPeripheralUiConfig[] {
  return Object.freeze(
    USER_PERIPHERAL_DEFINITIONS
      .filter((definition) =>
        definition.profiles.includes(config.profile) &&
        config.userFields.includes(definition.field),
      )
      .map((definition) => userPeripheralConfig(config, definition)),
  );
}

export function createProductUserPeripheralAuthorization(
  input: ProductUserPeripheralAuthorizationInput,
): LegacyBleWriteAuthorization {
  if (!isCataloguedLegacyBleWrite(input.write) ||
      !isProductUserPeripheralWriteSupported(input.write) ||
      input.write.destructiveLevel !== 'non-destructive-setting' ||
      input.write.hardwareValidationStatus !== 'phase1-reference-only') {
    throw new Error(
      'A controlled catalogued user-peripheral write is required.',
    );
  }
  if (!input.deviceId.trim() ||
      !input.attemptId.trim() ||
      !input.confirmationId.trim()) {
    throw new Error(
      'User-peripheral authorization context is incomplete.',
    );
  }
  if (!Number.isInteger(input.connectionGeneration) ||
      input.connectionGeneration < 0 ||
      !Number.isFinite(input.confirmedAt)) {
    throw new Error('User-peripheral authorization context is invalid.');
  }
  return Object.freeze({
    confirmedByUser: true,
    confirmedAt: input.confirmedAt,
    expiresAt:
      input.confirmedAt + PRODUCT_USER_PERIPHERAL_AUTHORIZATION_TTL_MS,
    confirmationId: input.confirmationId,
    operation: input.write.operation,
    payloadHex: input.write.payloadHex,
    profile: input.write.profile,
    deviceId: input.deviceId,
    connectionGeneration: input.connectionGeneration,
    attemptId: input.attemptId,
  });
}

function userPeripheralConfig(
  pageConfig: ProductPageConfig,
  definition: ProductUserPeripheralDefinition,
): ProductUserPeripheralUiConfig {
  return Object.freeze({
    profile: pageConfig.profile,
    field: definition.field,
    textKey: definition.textKey,
    catalogFactory: (enabled: boolean) => encodeLegacyUserPeripheral(
      pageConfig.profile,
      definition.operation,
      enabled ? 'enabled' : 'disabled',
    ),
    confirmationPolicy: { kind: 'gatt-only' } as const,
    policy: { allowPhase1ReferenceOnly: true } as const,
  });
}

function isProductUserPeripheralWriteSupported(
  write: LegacyBleWrite,
): boolean {
  return USER_PERIPHERAL_DEFINITIONS.some((definition) =>
    definition.operation === write.operation &&
    definition.profiles.includes(write.profile),
  );
}
