import { KnownProductProfile } from
  '../../../core/services/product-data-load.service';

export type ProductProfileId = KnownProductProfile;

export type ProductUserField =
  | 'lock-mode'
  | 'open-speed'
  | 'close-speed'
  | 'short-timing'
  | 'long-timing'
  | 'static-light'
  | 'dynamic-light'
  | 'rgb';

export type ProductProfessionalField =
  | 'weight-range'
  | 'exact-weight'
  | 'break-force-at-open'
  | 'near-open-speed'
  | 'near-close-speed'
  | 'near-open-torque'
  | 'near-close-torque'
  | 'braking-open-power'
  | 'obstacle-sensitivity'
  | 'near-open-proportional'
  | 'near-close-proportional'
  | 'near-open-integral'
  | 'near-close-integral'
  | 'peripherals';

export interface ProductWeightRange {
  readonly lower: number;
  readonly upper: number;
}

export interface ProductPageConfig {
  readonly profile: ProductProfileId;
  readonly route: string;
  readonly productName: string;
  readonly maximumWeightLabel: string | null;
  readonly weightRanges: readonly ProductWeightRange[];
  readonly userFields: readonly ProductUserField[];
  readonly professionalFields: readonly ProductProfessionalField[];
  readonly visibleLockModes: readonly (
    | 'none'
    | 'locked-open'
    | 'locked-closed'
    | 'unknown'
  )[];
  readonly hiddenMotorSwitches: readonly (
    | 'push-and-go'
    | 'automatic-manual'
    | 'direction'
  )[];
  readonly openSpeedRange: Readonly<{ min: number; max: number }>;
  readonly closeSpeedRange: Readonly<{ min: number; max: number }>;
  readonly nearOpenSpeedRange: Readonly<{ min: number; max: number }>;
  readonly nearCloseSpeedRange: Readonly<{ min: number; max: number }>;
  readonly lockMinimumMotorVersionExclusive: readonly [
    number,
    number,
    number,
  ] | null;
}

export type ProductFamily = 'widoor' | 'moventiv' | 'garline';

export type ProductVariant = 'standard' | '60' | '80';

export type ProductMotorCommandCapability =
  | 'motor-open'
  | 'motor-close'
  | 'motor-open-short-timed'
  | 'motor-open-long-timed';

export type ProductSensitiveActionCapability =
  | 'learning'
  | 'radar-test-1'
  | 'radar-test-2'
  | 'professional-peripheral-lock'
  | 'reset';

export type ProductMaintenanceInformationField =
  | 'initializations'
  | 'cycles-since-init'
  | 'obstacles'
  | 'learning'
  | 'encoder-errors'
  | 'motor-errors';

export type ProductImmediateWritePolicy =
  | 'widoor'
  | 'moventiv'
  | 'garline'
  | 'none';

export interface ProductProfileCapabilities {
  readonly demo: boolean;
  readonly professionalInputs: boolean;
  readonly professionalAccessFields: readonly ProductProfessionalField[];
  readonly weightRangeControl: 'none' | 'basic' | 'advanced';
}

export interface ProductProfileBehavior {
  readonly immediateWritePolicy: ProductImmediateWritePolicy;
  readonly sliderAutoWrite: boolean;
  readonly advancedSettingsConfirmation: boolean;
  readonly showControlsBeforeRead: boolean;
  readonly refreshAfterMaintenanceAction: boolean;
}

export interface ProductProfileInformation {
  readonly showMotorAddress: boolean;
  readonly showMaintenanceDates: boolean;
  readonly showCurrentWeightRange: boolean;
  readonly supplementalMaintenanceFields: readonly (
    ProductMaintenanceInformationField
  )[];
}

export interface ProductProfileUiCapabilities {
  readonly widoorLayout: boolean;
  readonly phase1SliderInteraction: boolean;
}

export interface ProductProfileDefinition extends ProductPageConfig {
  readonly family: ProductFamily;
  readonly variant: ProductVariant;
  readonly commands: readonly ProductMotorCommandCapability[];
  readonly sensitiveActions: readonly ProductSensitiveActionCapability[];
  readonly capabilities: ProductProfileCapabilities;
  readonly behavior: ProductProfileBehavior;
  readonly information: ProductProfileInformation;
  readonly ui: ProductProfileUiCapabilities;
}

export function defineProductProfile(
  definition: ProductProfileDefinition,
): ProductProfileDefinition {
  return Object.freeze({
    ...definition,
    weightRanges: Object.freeze(definition.weightRanges.map((range) =>
      Object.freeze({ ...range }),
    )),
    userFields: Object.freeze([...definition.userFields]),
    professionalFields: Object.freeze([...definition.professionalFields]),
    visibleLockModes: Object.freeze([...definition.visibleLockModes]),
    hiddenMotorSwitches: Object.freeze([...definition.hiddenMotorSwitches]),
    openSpeedRange: Object.freeze({ ...definition.openSpeedRange }),
    closeSpeedRange: Object.freeze({ ...definition.closeSpeedRange }),
    nearOpenSpeedRange: Object.freeze({ ...definition.nearOpenSpeedRange }),
    nearCloseSpeedRange: Object.freeze({ ...definition.nearCloseSpeedRange }),
    lockMinimumMotorVersionExclusive:
      definition.lockMinimumMotorVersionExclusive === null
        ? null
        : Object.freeze([
            ...definition.lockMinimumMotorVersionExclusive,
          ]) as readonly [number, number, number],
    commands: Object.freeze([...definition.commands]),
    sensitiveActions: Object.freeze([...definition.sensitiveActions]),
    capabilities: Object.freeze({
      ...definition.capabilities,
      professionalAccessFields: Object.freeze([
        ...definition.capabilities.professionalAccessFields,
      ]),
    }),
    behavior: Object.freeze({ ...definition.behavior }),
    information: Object.freeze({
      ...definition.information,
      supplementalMaintenanceFields: Object.freeze([
        ...definition.information.supplementalMaintenanceFields,
      ]),
    }),
    ui: Object.freeze({ ...definition.ui }),
  });
}
