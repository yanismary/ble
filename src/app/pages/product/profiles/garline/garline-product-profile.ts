import {
  LEGACY_WRITE_CONSTRAINTS,
} from '../../../../core/services/legacy-ble-write-catalog';
import {
  defineProductProfile,
  ProductProfileDefinition,
} from '../product-profile.types';

export const GARLINE_PRODUCT_PROFILE = defineProductProfile({
  profile: 'garline',
  family: 'garline',
  variant: 'standard',
  route: '/product/garline',
  productName: 'GARLINE',
  maximumWeightLabel: '140 kg',
  weightRanges: LEGACY_WRITE_CONSTRAINTS.garline.weightRanges.map(
    ([lower, upper]) => ({ lower, upper }),
  ),
  userFields: [
    'open-speed',
    'close-speed',
    'short-timing',
    'long-timing',
    'static-light',
    'dynamic-light',
    'rgb',
  ],
  professionalFields: [
    'near-open-speed',
    'near-close-speed',
    'obstacle-sensitivity',
  ],
  visibleLockModes: [],
  hiddenMotorSwitches: [
    'push-and-go',
    'automatic-manual',
    'direction',
  ],
  openSpeedRange: { min: 0, max: 100 },
  closeSpeedRange: { min: 0, max: 100 },
  nearOpenSpeedRange: { min: 0, max: 100 },
  nearCloseSpeedRange: { min: 0, max: 100 },
  lockMinimumMotorVersionExclusive: null,
  commands: [
    'motor-open',
    'motor-close',
    'motor-open-short-timed',
  ],
  sensitiveActions: ['learning'],
  capabilities: {
    demo: true,
    professionalInputs: false,
    professionalAccessFields: ['obstacle-sensitivity'],
    weightRangeControl: 'none',
  },
  behavior: {
    immediateWritePolicy: 'garline',
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
    phase1SliderInteraction: false,
  },
} satisfies ProductProfileDefinition);
