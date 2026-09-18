import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteExecutionPolicy,
} from '../../../../core/services/ble-write-execution.service';
import {
  KnownProductProfile,
  LegacyBleWrite,
  LEGACY_WRITE_CONSTRAINTS,
  LegacyProfessionalScalar,
  encodeLegacyProfessionalScalar,
  isCataloguedLegacyBleWrite,
} from '../../../../core/services/legacy-ble-write-catalog';
import type {
  ProductExpertField,
  ProductProfileDefinition,
} from '../../profiles/product-profile.types';
import { productExpertFieldRequiresAccess } from
  './product-expert-access';

export type ProductExpertScalarField = Extract<
  ProductExpertField,
  | 'break-force-at-open'
  | 'near-open-speed'
  | 'near-close-speed'
  | 'near-open-torque'
  | 'near-close-torque'
  | 'braking-open-power'
  | 'obstacle-sensitivity'
>;

export type ProductExpertScalarTextKey =
  | 'breakForceAtOpen'
  | 'nearOpenSpeed'
  | 'nearCloseSpeed'
  | 'nearOpenTorque'
  | 'nearCloseTorque'
  | 'brakingOpenPower'
  | 'obstacleSensitivity';

export interface ProductExpertScalarUiConfig {
  readonly profile: KnownProductProfile;
  readonly field: ProductExpertScalarField;
  readonly textKey: ProductExpertScalarTextKey;
  readonly range: Readonly<{ min: number; max: number }>;
  readonly unit: '%' | null;
  readonly requiresExpertAccess: boolean;
  readonly catalogFactory: (value: number) => LegacyBleWrite;
  readonly confirmationPolicy: LegacyBleWriteConfirmationPolicy;
  readonly policy: LegacyBleWriteExecutionPolicy;
}

export interface ProductExpertScalarAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}

const PRODUCT_EXPERT_SCALAR_AUTHORIZATION_TTL_MS = 30_000;

type ProductExpertScalarConstraintKey =
  | 'breakForceAtOpen'
  | 'nearOpenSpeed'
  | 'nearCloseSpeed'
  | 'nearOpenTorque'
  | 'nearCloseTorque'
  | 'brakingOpenPower'
  | 'obstacleSensitivity';

interface ProductExpertScalarDefinition {
  readonly field: ProductExpertScalarField & LegacyProfessionalScalar;
  readonly textKey: ProductExpertScalarTextKey;
  readonly constraintKey: ProductExpertScalarConstraintKey;
  readonly unit: '%' | null;
  readonly profiles: readonly KnownProductProfile[];
}

const EXPERT_SCALAR_DEFINITIONS: readonly (
  ProductExpertScalarDefinition
)[] = Object.freeze([
  Object.freeze({
    field: 'break-force-at-open',
    textKey: 'breakForceAtOpen',
    constraintKey: 'breakForceAtOpen',
    unit: null,
    profiles: ['widoor'] as const,
  }),
  Object.freeze({
    field: 'near-open-speed',
    textKey: 'nearOpenSpeed',
    constraintKey: 'nearOpenSpeed',
    unit: '%',
    profiles: [
      'widoor',
      'moventiv-60',
      'moventiv-80',
      'garline',
    ] as const,
  }),
  Object.freeze({
    field: 'near-close-speed',
    textKey: 'nearCloseSpeed',
    constraintKey: 'nearCloseSpeed',
    unit: '%',
    profiles: [
      'widoor',
      'moventiv-60',
      'moventiv-80',
      'garline',
    ] as const,
  }),
  Object.freeze({
    field: 'near-open-torque',
    textKey: 'nearOpenTorque',
    constraintKey: 'nearOpenTorque',
    unit: '%',
    profiles: ['moventiv-60', 'moventiv-80'] as const,
  }),
  Object.freeze({
    field: 'near-close-torque',
    textKey: 'nearCloseTorque',
    constraintKey: 'nearCloseTorque',
    unit: '%',
    profiles: ['moventiv-60', 'moventiv-80'] as const,
  }),
  Object.freeze({
    field: 'braking-open-power',
    textKey: 'brakingOpenPower',
    constraintKey: 'brakingOpenPower',
    unit: '%',
    profiles: ['moventiv-60', 'moventiv-80'] as const,
  }),
  Object.freeze({
    field: 'obstacle-sensitivity',
    textKey: 'obstacleSensitivity',
    constraintKey: 'obstacleSensitivity',
    unit: null,
    profiles: ['moventiv-60', 'moventiv-80', 'garline'] as const,
  }),
]);

export function productExpertScalarConfigsFor(
  config: ProductProfileDefinition,
): readonly ProductExpertScalarUiConfig[] {
  return Object.freeze(
    EXPERT_SCALAR_DEFINITIONS
      .filter((definition) =>
        isProductExpertScalarProfileSupported(
          definition,
          config.profile,
        ) &&
        config.expertFields.includes(definition.field) &&
        LEGACY_WRITE_CONSTRAINTS[config.profile].uiAdvancedRanges[
          definition.constraintKey
        ] !== undefined,
      )
      .map((definition) => expertScalarConfig(config, definition)),
  );
}

export function isValidProductExpertScalarValue(
  config: ProductExpertScalarUiConfig,
  value: number,
): boolean {
  return Number.isInteger(value) &&
    value >= config.range.min &&
    value <= config.range.max;
}

export function createProductExpertScalarAuthorization(
  input: ProductExpertScalarAuthorizationInput,
): LegacyBleWriteAuthorization {
  if (!isCataloguedLegacyBleWrite(input.write) ||
      !isProductExpertScalarField(input.write.operation) ||
      !isProductExpertScalarWriteSupported(input.write) ||
      input.write.destructiveLevel !== 'non-destructive-setting' ||
      input.write.hardwareValidationStatus !== 'phase1-reference-only') {
    throw new Error(
      'A controlled catalogued expert-scalar write is required.',
    );
  }
  if (!input.deviceId.trim() ||
      !input.attemptId.trim() ||
      !input.confirmationId.trim()) {
    throw new Error(
      'Expert-scalar authorization context is incomplete.',
    );
  }
  if (!Number.isInteger(input.connectionGeneration) ||
      input.connectionGeneration < 0 ||
      !Number.isFinite(input.confirmedAt)) {
    throw new Error('Expert-scalar authorization context is invalid.');
  }
  return Object.freeze({
    confirmedByUser: true,
    confirmedAt: input.confirmedAt,
    expiresAt:
      input.confirmedAt + PRODUCT_EXPERT_SCALAR_AUTHORIZATION_TTL_MS,
    confirmationId: input.confirmationId,
    operation: input.write.operation,
    payloadHex: input.write.payloadHex,
    profile: input.write.profile,
    deviceId: input.deviceId,
    connectionGeneration: input.connectionGeneration,
    attemptId: input.attemptId,
  });
}

function expertScalarConfig(
  pageConfig: ProductProfileDefinition,
  definition: ProductExpertScalarDefinition,
): ProductExpertScalarUiConfig {
  const range = LEGACY_WRITE_CONSTRAINTS[
    pageConfig.profile
  ].uiAdvancedRanges[definition.constraintKey];
  if (range === undefined ||
      !isProductExpertScalarProfileSupported(
        definition,
        pageConfig.profile,
      )) {
    throw new Error(
      `${definition.field} is not available for ${pageConfig.profile}.`,
    );
  }
  return Object.freeze({
    profile: pageConfig.profile,
    field: definition.field,
    textKey: definition.textKey,
    range: Object.freeze({ min: range.min, max: range.max }),
    unit: definition.unit,
    requiresExpertAccess: productExpertFieldRequiresAccess(
      pageConfig,
      definition.field,
    ),
    catalogFactory: (value: number) => {
      if (!Number.isInteger(value) ||
          value < range.min ||
          value > range.max) {
        throw new Error(
          `${definition.field} value ${value} is outside the UI range.`,
        );
      }
      return encodeLegacyProfessionalScalar(
        pageConfig.profile,
        definition.field,
        value,
      );
    },
    confirmationPolicy: { kind: 'gatt-only' } as const,
    policy: { allowPhase1ReferenceOnly: true } as const,
  });
}

function isProductExpertScalarProfileSupported(
  definition: ProductExpertScalarDefinition,
  profile: KnownProductProfile,
): boolean {
  return definition.profiles.includes(profile);
}

function isProductExpertScalarWriteSupported(
  write: LegacyBleWrite,
): boolean {
  return EXPERT_SCALAR_DEFINITIONS.some((definition) =>
    definition.field === write.operation &&
    definition.profiles.includes(write.profile),
  );
}

function isProductExpertScalarField(
  value: string,
): value is ProductExpertScalarField {
  return value === 'break-force-at-open' ||
    value === 'near-open-speed' ||
    value === 'near-close-speed' ||
    value === 'near-open-torque' ||
    value === 'near-close-torque' ||
    value === 'braking-open-power' ||
    value === 'obstacle-sensitivity';
}
