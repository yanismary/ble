import {
  KnownProductProfile,
} from '../../core/services/product-data-load.service';
import {
  LEGACY_WRITE_CONSTRAINTS,
} from '../../core/services/legacy-ble-write-catalog';

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
  readonly profile: KnownProductProfile;
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

const MOVENTIV_USER_FIELDS: readonly ProductUserField[] = [
  'lock-mode',
  'open-speed',
  'close-speed',
  'short-timing',
  'static-light',
  'dynamic-light',
  'rgb',
];

const MOVENTIV_PRO_FIELDS: readonly ProductProfessionalField[] = [
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

function legacyWeightRanges(
  profile: Exclude<KnownProductProfile, 'widoor'>,
): readonly ProductWeightRange[] {
  return LEGACY_WRITE_CONSTRAINTS[profile].weightRanges.map(
    ([lower, upper]) => ({ lower, upper }),
  );
}

const PRODUCT_PAGE_CONFIG_DEFINITIONS = {
  widoor: {
    profile: 'widoor',
    route: '/product/widoor',
    productName: 'WIDOOR',
    maximumWeightLabel: null,
    weightRanges: [],
    userFields: [
      'lock-mode',
      'open-speed',
      'close-speed',
      'short-timing',
      'rgb',
    ],
    professionalFields: [
      'break-force-at-open',
      'near-open-speed',
      'near-close-speed',
      'near-open-torque',
      'near-close-torque',
      'near-open-proportional',
      'near-close-proportional',
      'near-open-integral',
      'near-close-integral',
      'peripherals',
    ],
    visibleLockModes: [
      'none',
      'locked-open',
      'locked-closed',
      'unknown',
    ],
    hiddenMotorSwitches: ['push-and-go'],
    openSpeedRange: { min: 25, max: 100 },
    closeSpeedRange: { min: 35, max: 100 },
    nearOpenSpeedRange: { min: 70, max: 100 },
    nearCloseSpeedRange: { min: 50, max: 100 },
    lockMinimumMotorVersionExclusive: [1, 0, 0],
  },
  'moventiv-60': {
    profile: 'moventiv-60',
    route: '/product/moventiv-60',
    productName: 'MOVENTIV 60 kg',
    maximumWeightLabel: '60 kg',
    weightRanges: legacyWeightRanges('moventiv-60'),
    userFields: MOVENTIV_USER_FIELDS,
    professionalFields: MOVENTIV_PRO_FIELDS,
    visibleLockModes: [
      'none',
      'locked-open',
      'locked-closed',
      'unknown',
    ],
    hiddenMotorSwitches: [],
    openSpeedRange: { min: 50, max: 100 },
    closeSpeedRange: { min: 50, max: 100 },
    nearOpenSpeedRange: { min: 1, max: 100 },
    nearCloseSpeedRange: { min: 1, max: 100 },
    lockMinimumMotorVersionExclusive: null,
  },
  'moventiv-80': {
    profile: 'moventiv-80',
    route: '/product/moventiv-80',
    productName: 'MOVENTIV 80 kg',
    maximumWeightLabel: '80 kg',
    weightRanges: legacyWeightRanges('moventiv-80'),
    userFields: MOVENTIV_USER_FIELDS,
    professionalFields: MOVENTIV_PRO_FIELDS,
    visibleLockModes: [
      'none',
      'locked-open',
      'locked-closed',
      'unknown',
    ],
    hiddenMotorSwitches: [],
    openSpeedRange: { min: 50, max: 100 },
    closeSpeedRange: { min: 50, max: 100 },
    nearOpenSpeedRange: { min: 1, max: 100 },
    nearCloseSpeedRange: { min: 1, max: 100 },
    lockMinimumMotorVersionExclusive: null,
  },
  garline: {
    profile: 'garline',
    route: '/product/garline',
    productName: 'GARLINE',
    maximumWeightLabel: null,
    weightRanges: legacyWeightRanges('garline'),
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
  },
} as const satisfies Record<KnownProductProfile, ProductPageConfig>;

function freezeProductPageConfig(
  config: ProductPageConfig,
): ProductPageConfig {
  return Object.freeze({
    ...config,
    weightRanges: Object.freeze(config.weightRanges.map((range) =>
      Object.freeze({ ...range }),
    )),
    userFields: Object.freeze([...config.userFields]),
    professionalFields: Object.freeze([...config.professionalFields]),
    visibleLockModes: Object.freeze([...config.visibleLockModes]),
    hiddenMotorSwitches: Object.freeze([...config.hiddenMotorSwitches]),
    openSpeedRange: Object.freeze({ ...config.openSpeedRange }),
    closeSpeedRange: Object.freeze({ ...config.closeSpeedRange }),
    nearOpenSpeedRange: Object.freeze({ ...config.nearOpenSpeedRange }),
    nearCloseSpeedRange: Object.freeze({ ...config.nearCloseSpeedRange }),
    lockMinimumMotorVersionExclusive:
      config.lockMinimumMotorVersionExclusive === null
        ? null
        : Object.freeze([...config.lockMinimumMotorVersionExclusive]) as
          readonly [number, number, number],
  });
}

export const PRODUCT_PAGE_CONFIG: Readonly<
  Record<KnownProductProfile, ProductPageConfig>
> = Object.freeze({
  widoor: freezeProductPageConfig(PRODUCT_PAGE_CONFIG_DEFINITIONS.widoor),
  'moventiv-60': freezeProductPageConfig(
    PRODUCT_PAGE_CONFIG_DEFINITIONS['moventiv-60'],
  ),
  'moventiv-80': freezeProductPageConfig(
    PRODUCT_PAGE_CONFIG_DEFINITIONS['moventiv-80'],
  ),
  garline: freezeProductPageConfig(PRODUCT_PAGE_CONFIG_DEFINITIONS.garline),
});

export function isKnownProductProfile(
  value: unknown,
): value is KnownProductProfile {
  return value === 'widoor' ||
    value === 'moventiv-60' ||
    value === 'moventiv-80' ||
    value === 'garline';
}
