import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteExecutionPolicy,
} from '../../core/services/ble-write-execution.service';
import {
  KnownProductProfile,
  LegacyBleWrite,
  LEGACY_WRITE_CONSTRAINTS,
  LegacyProfessionalScalar,
  encodeLegacyProfessionalScalar,
  isCataloguedLegacyBleWrite,
} from '../../core/services/legacy-ble-write-catalog';
import {
  ProductPageConfig,
  ProductProfessionalField,
} from './product-page.config';
import { productProfessionalFieldRequiresAccess } from
  './product-professional-access';

export type ProductProfessionalScalarField = Extract<
  ProductProfessionalField,
  | 'break-force-at-open'
  | 'near-open-speed'
  | 'near-close-speed'
  | 'near-open-torque'
  | 'near-close-torque'
  | 'braking-open-power'
  | 'obstacle-sensitivity'
>;

export type ProductProfessionalScalarTextKey =
  | 'breakForceAtOpen'
  | 'nearOpenSpeed'
  | 'nearCloseSpeed'
  | 'nearOpenTorque'
  | 'nearCloseTorque'
  | 'brakingOpenPower'
  | 'obstacleSensitivity';

export interface ProductProfessionalScalarUiConfig {
  readonly profile: KnownProductProfile;
  readonly field: ProductProfessionalScalarField;
  readonly textKey: ProductProfessionalScalarTextKey;
  readonly range: Readonly<{ min: number; max: number }>;
  readonly unit: '%' | null;
  readonly requiresProfessionalAccess: boolean;
  readonly catalogFactory: (value: number) => LegacyBleWrite;
  readonly confirmationPolicy: LegacyBleWriteConfirmationPolicy;
  readonly policy: LegacyBleWriteExecutionPolicy;
}

export interface ProductProfessionalScalarAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}

const PRODUCT_PROFESSIONAL_SCALAR_AUTHORIZATION_TTL_MS = 30_000;

type ProductProfessionalScalarConstraintKey =
  | 'breakForceAtOpen'
  | 'nearOpenSpeed'
  | 'nearCloseSpeed'
  | 'nearOpenTorque'
  | 'nearCloseTorque'
  | 'brakingOpenPower'
  | 'obstacleSensitivity';

interface ProductProfessionalScalarDefinition {
  readonly field: ProductProfessionalScalarField & LegacyProfessionalScalar;
  readonly textKey: ProductProfessionalScalarTextKey;
  readonly constraintKey: ProductProfessionalScalarConstraintKey;
  readonly unit: '%' | null;
  readonly profiles: readonly KnownProductProfile[];
}

const PROFESSIONAL_SCALAR_DEFINITIONS: readonly (
  ProductProfessionalScalarDefinition
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

export function productProfessionalScalarConfigsFor(
  config: ProductPageConfig,
): readonly ProductProfessionalScalarUiConfig[] {
  return Object.freeze(
    PROFESSIONAL_SCALAR_DEFINITIONS
      .filter((definition) =>
        isProductProfessionalScalarProfileSupported(
          definition,
          config.profile,
        ) &&
        config.professionalFields.includes(definition.field) &&
        LEGACY_WRITE_CONSTRAINTS[config.profile].uiProfessionalRanges[
          definition.constraintKey
        ] !== undefined,
      )
      .map((definition) => professionalScalarConfig(config, definition)),
  );
}

export function isValidProductProfessionalScalarValue(
  config: ProductProfessionalScalarUiConfig,
  value: number,
): boolean {
  return Number.isInteger(value) &&
    value >= config.range.min &&
    value <= config.range.max;
}

export function createProductProfessionalScalarAuthorization(
  input: ProductProfessionalScalarAuthorizationInput,
): LegacyBleWriteAuthorization {
  if (!isCataloguedLegacyBleWrite(input.write) ||
      !isProductProfessionalScalarField(input.write.operation) ||
      !isProductProfessionalScalarWriteSupported(input.write) ||
      input.write.destructiveLevel !== 'non-destructive-setting' ||
      input.write.hardwareValidationStatus !== 'phase1-reference-only') {
    throw new Error(
      'A controlled catalogued professional-scalar write is required.',
    );
  }
  if (!input.deviceId.trim() ||
      !input.attemptId.trim() ||
      !input.confirmationId.trim()) {
    throw new Error(
      'Professional-scalar authorization context is incomplete.',
    );
  }
  if (!Number.isInteger(input.connectionGeneration) ||
      input.connectionGeneration < 0 ||
      !Number.isFinite(input.confirmedAt)) {
    throw new Error('Professional-scalar authorization context is invalid.');
  }
  return Object.freeze({
    confirmedByUser: true,
    confirmedAt: input.confirmedAt,
    expiresAt:
      input.confirmedAt + PRODUCT_PROFESSIONAL_SCALAR_AUTHORIZATION_TTL_MS,
    confirmationId: input.confirmationId,
    operation: input.write.operation,
    payloadHex: input.write.payloadHex,
    profile: input.write.profile,
    deviceId: input.deviceId,
    connectionGeneration: input.connectionGeneration,
    attemptId: input.attemptId,
  });
}

function professionalScalarConfig(
  pageConfig: ProductPageConfig,
  definition: ProductProfessionalScalarDefinition,
): ProductProfessionalScalarUiConfig {
  const range = LEGACY_WRITE_CONSTRAINTS[
    pageConfig.profile
  ].uiProfessionalRanges[definition.constraintKey];
  if (range === undefined ||
      !isProductProfessionalScalarProfileSupported(
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
    requiresProfessionalAccess: productProfessionalFieldRequiresAccess(
      pageConfig.profile,
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

function isProductProfessionalScalarProfileSupported(
  definition: ProductProfessionalScalarDefinition,
  profile: KnownProductProfile,
): boolean {
  return definition.profiles.includes(profile);
}

function isProductProfessionalScalarWriteSupported(
  write: LegacyBleWrite,
): boolean {
  return PROFESSIONAL_SCALAR_DEFINITIONS.some((definition) =>
    definition.field === write.operation &&
    definition.profiles.includes(write.profile),
  );
}

function isProductProfessionalScalarField(
  value: string,
): value is ProductProfessionalScalarField {
  return value === 'break-force-at-open' ||
    value === 'near-open-speed' ||
    value === 'near-close-speed' ||
    value === 'near-open-torque' ||
    value === 'near-close-torque' ||
    value === 'braking-open-power' ||
    value === 'obstacle-sensitivity';
}
