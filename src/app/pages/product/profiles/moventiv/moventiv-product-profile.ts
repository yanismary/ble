import {
  LEGACY_WRITE_CONSTRAINTS,
} from '../../../../core/services/legacy-ble-write-catalog';
import {
  defineProductProfile,
  ProductProfileDefinition,
  ProductProfessionalField,
  ProductUserField,
  ProductWeightRange,
} from '../product-profile.types';

const MOVENTIV_USER_FIELDS: readonly ProductUserField[] = [
  'lock-mode',
  'open-speed',
  'close-speed',
  'short-timing',
  'static-light',
  'dynamic-light',
  'rgb',
];

const MOVENTIV_PROFESSIONAL_FIELDS: readonly ProductProfessionalField[] = [
  'weight-range',
  'exact-weight',
  'near-open-speed',
  'near-close-speed',
  'near-open-torque',
  'near-close-torque',
  'braking-open-power',
  'obstacle-sensitivity',
  'near-open-integral',
  'near-close-integral',
  'peripherals',
];

export const MOVENTIV_60_PRODUCT_PROFILE = createMoventivProductProfile('60');
export const MOVENTIV_80_PRODUCT_PROFILE = createMoventivProductProfile('80');

function createMoventivProductProfile(
  variant: '60' | '80',
): ProductProfileDefinition {
  const profile = `moventiv-${variant}` as const;
  return defineProductProfile({
    profile,
    family: 'moventiv',
    variant,
    route: `/product/${profile}`,
    productName: `MOVENTIV ${variant} kg`,
    maximumWeightLabel: `${variant} kg`,
    weightRanges: legacyWeightRanges(profile),
    userFields: MOVENTIV_USER_FIELDS,
    professionalFields: MOVENTIV_PROFESSIONAL_FIELDS,
    visibleLockModes: ['locked-closed'],
    hiddenMotorSwitches: [],
    openSpeedRange: { min: 50, max: 100 },
    closeSpeedRange: { min: 50, max: 100 },
    nearOpenSpeedRange: { min: 1, max: 100 },
    nearCloseSpeedRange: { min: 1, max: 100 },
    lockMinimumMotorVersionExclusive: null,
    commands: [
      'motor-open',
      'motor-close',
      'motor-open-short-timed',
    ],
    sensitiveActions: ['learning'],
    capabilities: {
      demo: variant === '60',
      professionalInputs: true,
      professionalAccessFields: [
        'near-open-torque',
        'near-close-torque',
        'braking-open-power',
        'obstacle-sensitivity',
      ],
      weightRangeControl: 'basic',
    },
    behavior: {
      immediateWritePolicy: 'moventiv',
      sliderAutoWrite: true,
      advancedSettingsConfirmation: true,
      showControlsBeforeRead: true,
      refreshAfterMaintenanceAction: false,
    },
    information: {
      showMotorAddress: true,
      showMaintenanceDates: true,
      showCurrentWeightRange: true,
      supplementalMaintenanceFields: [
        'initializations',
        'cycles-since-init',
        'obstacles',
        'learning',
      ],
    },
    ui: {
      widoorLayout: false,
      widoorSliderInteraction: false,
    },
  });
}

function legacyWeightRanges(
  profile: 'moventiv-60' | 'moventiv-80',
): readonly ProductWeightRange[] {
  return LEGACY_WRITE_CONSTRAINTS[profile].weightRanges.map(
    ([lower, upper]) => ({ lower, upper }),
  );
}
