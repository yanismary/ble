import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteExecutionPolicy,
} from '../../../../core/services/ble-write-execution.service';
import {
  KnownProductProfile,
  LegacyBleWrite,
  LegacyLockMode,
  encodeLegacyLockMode,
  isCataloguedLegacyBleWrite,
} from '../../../../core/services/legacy-ble-write-catalog';
import { ProductPageConfig } from
  '../product-page-config.facade';

export type ProductLockModeTarget = Extract<
  LegacyLockMode,
  'locked-open' | 'locked-closed'
>;

export type ProductLockModeTextKey = 'lockedOpen' | 'lockedClosed';

export interface ProductLockModeUiConfig {
  readonly profile: KnownProductProfile;
  readonly mode: ProductLockModeTarget;
  readonly textKey: ProductLockModeTextKey;
  readonly catalogFactory: (
    mode: LegacyLockMode,
  ) => LegacyBleWrite;
  readonly confirmationPolicy: LegacyBleWriteConfirmationPolicy;
  readonly policy: LegacyBleWriteExecutionPolicy;
}

export interface ProductLockModeAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}

const PRODUCT_LOCK_MODE_AUTHORIZATION_TTL_MS = 30_000;

const LOCK_MODE_DEFINITIONS: readonly {
  readonly mode: ProductLockModeTarget;
  readonly textKey: ProductLockModeTextKey;
}[] = Object.freeze([
  Object.freeze({ mode: 'locked-open', textKey: 'lockedOpen' }),
  Object.freeze({ mode: 'locked-closed', textKey: 'lockedClosed' }),
]);

export function productLockModeConfigsFor(
  config: ProductPageConfig,
): readonly ProductLockModeUiConfig[] {
  return Object.freeze(
    LOCK_MODE_DEFINITIONS
      .filter((definition) =>
        config.visibleLockModes.includes(definition.mode),
      )
      .map((definition) => lockModeConfig(config.profile, definition)),
  );
}

export function createProductLockModeAuthorization(
  input: ProductLockModeAuthorizationInput,
): LegacyBleWriteAuthorization {
  if (!isCataloguedLegacyBleWrite(input.write) ||
      input.write.operation !== 'lock-mode' ||
      input.write.destructiveLevel !== 'non-destructive-setting' ||
      input.write.hardwareValidationStatus !== 'phase1-reference-only') {
    throw new Error('A controlled catalogued lock-mode write is required.');
  }
  if (!input.deviceId.trim() ||
      !input.attemptId.trim() ||
      !input.confirmationId.trim()) {
    throw new Error('Lock-mode authorization context is incomplete.');
  }
  if (!Number.isFinite(input.confirmedAt)) {
    throw new Error('Lock-mode authorization date is invalid.');
  }
  return Object.freeze({
    confirmedByUser: true,
    confirmedAt: input.confirmedAt,
    expiresAt: input.confirmedAt + PRODUCT_LOCK_MODE_AUTHORIZATION_TTL_MS,
    confirmationId: input.confirmationId,
    operation: input.write.operation,
    payloadHex: input.write.payloadHex,
    profile: input.write.profile,
    deviceId: input.deviceId,
    connectionGeneration: input.connectionGeneration,
    attemptId: input.attemptId,
  });
}

function lockModeConfig(
  profile: KnownProductProfile,
  definition: {
    readonly mode: ProductLockModeTarget;
    readonly textKey: ProductLockModeTextKey;
  },
): ProductLockModeUiConfig {
  return Object.freeze({
    profile,
    mode: definition.mode,
    textKey: definition.textKey,
    catalogFactory: (mode: LegacyLockMode) => {
      if (mode !== 'none' && mode !== definition.mode) {
        throw new Error(`${mode} is not supported by this lock control.`);
      }
      return encodeLegacyLockMode(profile, mode);
    },
    confirmationPolicy: { kind: 'gatt-only' } as const,
    policy: { allowPhase1ReferenceOnly: true } as const,
  });
}
