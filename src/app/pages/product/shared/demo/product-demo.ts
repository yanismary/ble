import {
  BleDatesAndCycles,
  BleMaintenance,
  BleAdvancedParameters,
  BleUserParameters,
  BleVersionFrame,
} from '../../../../core/services/ble-read-decoders';
import { MotorStateFrame } from
  '../../../../core/services/product-detection';
import { AppLanguage } from '../../../../core/services/app-language';
import { ProductPageNavigationState } from
  '../models/product-view.model';
import type { ProductProfileDefinition } from
  '../../profiles/product-profile.types';

export type ProductDemoProfile = 'widoor' | 'moventiv-60' | 'garline';

export const PRODUCT_DEMO_CHOICES: readonly {
  readonly profile: ProductDemoProfile;
  readonly label: string;
}[] = Object.freeze([
  { profile: 'moventiv-60', label: 'Moventiv' },
  { profile: 'garline', label: 'Garline' },
  { profile: 'widoor', label: 'Widoor' },
]);

export interface ProductDemoSnapshot {
  readonly profile: ProductDemoProfile;
  readonly version: BleVersionFrame;
  readonly datesAndCycles: BleDatesAndCycles;
  readonly maintenance: BleMaintenance;
  readonly userParameters: BleUserParameters;
  readonly advancedParameters: BleAdvancedParameters;
  readonly motorState: MotorStateFrame;
}

export function createProductDemoNavigationState(
  profile: ProductDemoProfile,
  language: AppLanguage = 'fr',
): ProductPageNavigationState {
  return Object.freeze({
    mode: 'demo',
    profile,
    deviceId: `${demoIdPrefix(profile)}-DEMO-0001`,
    connectionGeneration: 0,
    displayName: productDemoTextFor(language).profileLabels[profile],
    identificationConfidence: 'demo',
    motorState: demoMotorState(),
  });
}

export function productDemoTextFor(language: AppLanguage): {
  readonly title: string;
  readonly cancel: string;
  readonly profileLabels: Readonly<Record<ProductDemoProfile, string>>;
} {
  const translated = {
    fr: {
      cancel: 'Annuler',
      moventiv: 'MOVENTIV exemple',
      garline: 'GARLINE exemple',
      widoor: 'WIDOOR exemple',
    },
    en: {
      cancel: 'Cancel',
      moventiv: 'MOVENTIV example',
      garline: 'GARLINE example',
      widoor: 'WIDOOR example',
    },
    de: {
      cancel: 'Abbrechen',
      moventiv: 'MOVENTIV Beispiel',
      garline: 'GARLINE Beispiel',
      widoor: 'WIDOOR Beispiel',
    },
    pl: {
      cancel: 'Anuluj',
      moventiv: 'Przykład MOVENTIV',
      garline: 'Przykład GARLINE',
      widoor: 'Przykład WIDOOR',
    },
  }[language];
  return Object.freeze({
    title: 'Demo',
    cancel: translated.cancel,
    profileLabels: Object.freeze({
      'moventiv-60': translated.moventiv,
      garline: translated.garline,
      widoor: translated.widoor,
    }),
  });
}

export function createProductDemoSnapshot(
  definition: ProductProfileDefinition,
): ProductDemoSnapshot {
  const demoProfile = implementedDemoProfile(definition);
  const moventivFamily = demoProfile !== 'widoor';
  return Object.freeze({
    profile: demoProfile,
    version: Object.freeze({
      stack: Object.freeze({ major: 1, minor: 2, patch: 3, build: 4 }),
      bleSoftware: softwareVersion(),
      productType: demoProfile === 'garline' ? 2 : 0,
      productSubtype: 0,
      motorSoftware: softwareVersion(),
      crc: 0,
      motorAddressHex: moventivFamily ? '00.00.00.00.00.00' : null,
    }),
    datesAndCycles: Object.freeze({
      historicalFadDate: Object.freeze({
        status: 'raw-only', rawYear: 0, rawMonth: 0, rawDay: 0,
        raw: Object.freeze([0, 0, 0]),
      }),
      firstCommissioningDate: emptyDate(),
      lastMaintenanceDate: emptyDate(),
      totalCycles: moventivFamily ? 55989 : 0,
      cyclesSinceMaintenance: 0,
    }),
    maintenance: Object.freeze({
      initializationCount: moventivFamily ? 10 : 0,
      cyclesSinceInitialization: moventivFamily ? 200 : 0,
      obstacleDetectionCount: moventivFamily ? 2 : 0,
      wrongStopOpenCount: 0,
      wrongStopCloseCount: 0,
      learningCycleCount: 0,
      encoderErrorCount: 0,
      motorErrorCount: 0,
    }),
    userParameters: Object.freeze({
      lockModeRaw: 0,
      lockMode: 'none',
      openSpeed: 90,
      closeSpeed: 95,
      shortOpenTime: demoProfile === 'garline' ? 1 : 4,
      longOpenTime: moventivFamily ? 10 : 0,
      peripheralByte1: 0,
      peripheralByte2: 0,
      peripheralFlags: Object.freeze({
        dynamicLight: false,
        staticLight: false,
        input1Radar: false,
        input2Radar: false,
        rgbIndicator: true,
      }),
    }),
    advancedParameters: demoAdvancedParameters(demoProfile),
    motorState: demoMotorState(),
  });
}

export function isProductDemoProfile(
  value: unknown,
): boolean {
  if (typeof value !== 'object' || value === null ||
      !('capabilities' in value)) {
    return false;
  }
  const capabilities = (value as {
    readonly capabilities?: { readonly demo?: unknown };
  }).capabilities;
  return capabilities?.demo === true;
}

function implementedDemoProfile(
  definition: ProductProfileDefinition,
): ProductDemoProfile {
  const profile = definition.profile;
  if (!isProductDemoProfile(definition)) {
    throw new Error(`Demo is not available for ${profile}.`);
  }
  switch (profile) {
    case 'widoor':
    case 'moventiv-60':
    case 'garline':
      return profile;
    case 'moventiv-80':
      throw new Error(`Demo data is not implemented for ${profile}.`);
  }
}

function demoAdvancedParameters(
  profile: ProductDemoProfile,
): BleAdvancedParameters {
  const common = {
    weightRangeLower: 0,
    weightRangeUpper: 0,
    nearOpenSpeed: 90,
    nearCloseSpeed: 100,
    nearOpenTorque: 0,
    nearCloseTorque: 0,
    peripheralByte1: 0x40,
    peripheralByte2: 0,
  } as const;
  if (profile === 'widoor') {
    return Object.freeze({
      ...common,
      profile,
      breakForceAtOpen: 5,
      nearOpenProportional: 0,
      nearCloseProportional: 0,
      nearOpenIntegral: 0,
      nearCloseIntegral: 0,
    });
  }
  return Object.freeze({
    ...common,
    profile,
    exactWeight: 0,
    brakingOpenPower: 0,
    obstacleSensitivity: 0,
    nearOpenIntegral: 0,
    nearCloseIntegral: 0,
  });
}

function demoMotorState(): MotorStateFrame {
  return Object.freeze({
    rawHex: '',
    length: 0,
    state: 0,
    currentPosition: 0,
    maximumPosition: 0,
    error: 0,
    switches: Object.freeze({
      raw: 0x0a,
      unknownHighBits: 0,
      pushAndGo: false,
      ble: true,
      automaticManual: false,
      direction: true,
      pairing: false,
    }),
  });
}

function emptyDate(): BleDatesAndCycles['firstCommissioningDate'] {
  return Object.freeze({
    status: 'not-initialized',
    rawYear: 0,
    rawMonth: 0,
    rawDay: 0,
    rawHour: null,
    raw: Object.freeze([0, 0, 0, 0]),
    year: null,
    month: null,
    day: null,
    hour: null,
    invalidReason: null,
  });
}

function softwareVersion() {
  return Object.freeze({ major: 0, minor: 0, patch: 0, specification: 0 });
}

function demoIdPrefix(profile: ProductDemoProfile): string {
  return profile === 'moventiv-60' ? 'MOVENTIV' : profile.toUpperCase();
}
