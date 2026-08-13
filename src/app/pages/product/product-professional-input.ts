import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteExecutionPolicy,
} from '../../core/services/ble-write-execution.service';
import {
  KnownProductProfile,
  LegacyBleWrite,
  LegacyInputMode,
  encodeLegacyProfessionalPeripheral,
  isCataloguedLegacyBleWrite,
} from '../../core/services/legacy-ble-write-catalog';
import { ProductPageConfig } from './product-page.config';

export type ProductProfessionalInputField = 'input-1' | 'input-2';
export type ProductProfessionalInputTextKey = 'input1' | 'input2';

export interface ProductProfessionalInputUiConfig {
  readonly profile: KnownProductProfile;
  readonly field: ProductProfessionalInputField;
  readonly textKey: ProductProfessionalInputTextKey;
  readonly catalogFactory: (mode: LegacyInputMode) => LegacyBleWrite;
  readonly confirmationPolicy: LegacyBleWriteConfirmationPolicy;
  readonly policy: LegacyBleWriteExecutionPolicy;
}

export interface ProductProfessionalInputAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}

const PROFESSIONAL_INPUT_AUTHORIZATION_TTL_MS = 30_000;

const SUPPORTED_PROFILES: readonly KnownProductProfile[] = [
  'widoor',
  'moventiv-60',
  'moventiv-80',
];

const INPUT_DEFINITIONS = [
  { field: 'input-1', textKey: 'input1', operation: 'input-1-radar' },
  { field: 'input-2', textKey: 'input2', operation: 'input-2-radar' },
] as const;

export function productProfessionalInputConfigsFor(
  config: ProductPageConfig,
): readonly ProductProfessionalInputUiConfig[] {
  if (!SUPPORTED_PROFILES.includes(config.profile) ||
      !config.professionalFields.includes('peripherals')) {
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

export function createProductProfessionalInputAuthorization(
  input: ProductProfessionalInputAuthorizationInput,
): LegacyBleWriteAuthorization {
  if (!isCataloguedLegacyBleWrite(input.write) ||
      !isProfessionalInputWrite(input.write) ||
      input.write.destructiveLevel !== 'non-destructive-setting' ||
      input.write.hardwareValidationStatus !== 'phase1-reference-only') {
    throw new Error('A controlled catalogued professional-input write is required.');
  }
  if (!input.deviceId.trim() ||
      !input.attemptId.trim() ||
      !input.confirmationId.trim()) {
    throw new Error('Professional-input authorization context is incomplete.');
  }
  if (!Number.isInteger(input.connectionGeneration) ||
      input.connectionGeneration < 0 ||
      !Number.isFinite(input.confirmedAt)) {
    throw new Error('Professional-input authorization context is invalid.');
  }
  return Object.freeze({
    confirmedByUser: true,
    confirmedAt: input.confirmedAt,
    expiresAt: input.confirmedAt + PROFESSIONAL_INPUT_AUTHORIZATION_TTL_MS,
    confirmationId: input.confirmationId,
    operation: input.write.operation,
    payloadHex: input.write.payloadHex,
    profile: input.write.profile,
    deviceId: input.deviceId,
    connectionGeneration: input.connectionGeneration,
    attemptId: input.attemptId,
  });
}

function isProfessionalInputWrite(write: LegacyBleWrite): boolean {
  return write.operation === 'input-1-radar' ||
    write.operation === 'input-2-radar';
}
