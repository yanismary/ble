import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteExecutionPolicy,
} from '../../../../core/services/ble-write-execution.service';
import {
  KnownProductProfile,
  LegacyBleWrite,
  LegacyInputMode,
  encodeLegacyProfessionalPeripheral,
  isCataloguedLegacyBleWrite,
} from '../../../../core/services/legacy-ble-write-catalog';
import type { ProductProfileDefinition } from
  '../../profiles/product-profile.types';

export type ProductExpertInputField = 'input-1' | 'input-2';
export type ProductExpertInputTextKey = 'input1' | 'input2';

export interface ProductExpertInputUiConfig {
  readonly profile: KnownProductProfile;
  readonly field: ProductExpertInputField;
  readonly textKey: ProductExpertInputTextKey;
  readonly catalogFactory: (mode: LegacyInputMode) => LegacyBleWrite;
  readonly confirmationPolicy: LegacyBleWriteConfirmationPolicy;
  readonly policy: LegacyBleWriteExecutionPolicy;
}

export interface ProductExpertInputAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}

const EXPERT_INPUT_AUTHORIZATION_TTL_MS = 30_000;

const INPUT_DEFINITIONS = [
  { field: 'input-1', textKey: 'input1', operation: 'input-1-radar' },
  { field: 'input-2', textKey: 'input2', operation: 'input-2-radar' },
] as const;

export function productExpertInputConfigsFor(
  config: ProductProfileDefinition,
): readonly ProductExpertInputUiConfig[] {
  if (!config.capabilities.expertInputs ||
      !config.expertFields.includes('peripherals')) {
    return Object.freeze([]);
  }
  return Object.freeze(INPUT_DEFINITIONS.map((definition) => Object.freeze({
    profile: config.profile,
    field: definition.field,
    textKey: definition.textKey,
    catalogFactory: (mode: LegacyInputMode) =>
      encodeLegacyProfessionalPeripheral(
        config.profile,
        definition.operation,
        mode,
      ),
    confirmationPolicy: { kind: 'gatt-only' } as const,
    policy: { allowPhase1ReferenceOnly: true } as const,
  })));
}

export function createProductExpertInputAuthorization(
  input: ProductExpertInputAuthorizationInput,
): LegacyBleWriteAuthorization {
  if (!isCataloguedLegacyBleWrite(input.write) ||
      !isExpertInputWrite(input.write) ||
      input.write.destructiveLevel !== 'non-destructive-setting' ||
      input.write.hardwareValidationStatus !== 'phase1-reference-only') {
    throw new Error('A controlled catalogued expert-input write is required.');
  }
  if (!input.deviceId.trim() ||
      !input.attemptId.trim() ||
      !input.confirmationId.trim()) {
    throw new Error('Expert-input authorization context is incomplete.');
  }
  if (!Number.isInteger(input.connectionGeneration) ||
      input.connectionGeneration < 0 ||
      !Number.isFinite(input.confirmedAt)) {
    throw new Error('Expert-input authorization context is invalid.');
  }
  return Object.freeze({
    confirmedByUser: true,
    confirmedAt: input.confirmedAt,
    expiresAt: input.confirmedAt + EXPERT_INPUT_AUTHORIZATION_TTL_MS,
    confirmationId: input.confirmationId,
    operation: input.write.operation,
    payloadHex: input.write.payloadHex,
    profile: input.write.profile,
    deviceId: input.deviceId,
    connectionGeneration: input.connectionGeneration,
    attemptId: input.attemptId,
  });
}

function isExpertInputWrite(write: LegacyBleWrite): boolean {
  return write.operation === 'input-1-radar' ||
    write.operation === 'input-2-radar';
}
