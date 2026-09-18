import { PRODUCT_PAGE_CONFIG } from
  '../product-page-config.facade';
import {
  ProductProfileDefinition,
} from '../product-profile.types';
import {
  isMoventivProductProfile,
  ProductProfileRegistry,
  productProfileRegistry,
} from '../product-profile.registry';

describe('ProductProfileRegistry', () => {
  it('should expose every production profile through one registry', () => {
    expect(productProfileRegistry.all().map(({ profile }) => profile))
      .toEqual([
        'widoor',
        'moventiv-60',
        'moventiv-80',
        'garline',
      ]);
    expect(productProfileRegistry.get('widoor').commands).toEqual([
      'motor-open',
      'motor-close',
      'motor-open-short-timed',
    ]);
    expect(productProfileRegistry.get('moventiv-60').family)
      .toBe('moventiv');
    expect(productProfileRegistry.get('moventiv-80').family)
      .toBe('moventiv');
    expect(productProfileRegistry.get('garline').expertFields)
      .toEqual([
        'near-open-speed',
        'near-close-speed',
        'obstacle-sensitivity',
      ]);
  });

  it('should keep unsupported production options explicitly absent', () => {
    expect(productProfileRegistry.get('widoor').behavior
      .refreshAfterMaintenanceAction).toBeTrue();
    expect(productProfileRegistry.get('moventiv-60').behavior
      .refreshAfterMaintenanceAction).toBeFalse();
    expect(productProfileRegistry.get('moventiv-80').capabilities.demo)
      .toBeFalse();
    expect(productProfileRegistry.get('garline').capabilities
      .expertInputs).toBeFalse();
    expect(productProfileRegistry.get('garline').capabilities
      .weightRangeControl).toBe('none');
  });

  it('should return typed definitions and reject unknown profile ids', () => {
    const registry = new ProductProfileRegistry(fixtureDefinitions());

    expect(registry.get('widoor').family).toBe('widoor');
    expect(registry.get('moventiv-80').variant).toBe('80');
    expect(registry.has('garline')).toBeTrue();
    expect(registry.has('unknown')).toBeFalse();
    expect(registry.resolve('garline')).toBe(registry.get('garline'));
    expect(registry.resolve('unknown')).toBeUndefined();
    expect(() => registry.get(
      'unknown' as ProductProfileDefinition['profile'],
    )).toThrowError('Unknown product profile: unknown.');
    expect(registry.all().map(({ profile }) => profile)).toEqual([
      'widoor',
      'moventiv-60',
      'moventiv-80',
      'garline',
    ]);
  });

  it('should report Moventiv family membership without a closed type guard', () => {
    expect(isMoventivProductProfile('moventiv-60')).toBeTrue();
    expect(isMoventivProductProfile('moventiv-80')).toBeTrue();
    expect(isMoventivProductProfile('widoor')).toBeFalse();
    expect(isMoventivProductProfile('garline')).toBeFalse();
    expect(isMoventivProductProfile('unknown')).toBeFalse();
  });

  it('should expose immutable profile definitions', () => {
    const registry = new ProductProfileRegistry(fixtureDefinitions());
    const profile = registry.get('widoor');

    expect(Object.isFrozen(registry.asRecord())).toBeTrue();
    expect(Object.isFrozen(profile)).toBeTrue();
    expect(Object.isFrozen(profile.commands)).toBeTrue();
    expect(Object.isFrozen(profile.capabilities)).toBeTrue();
    expect(Object.isFrozen(profile.information)).toBeTrue();
    expect(Object.isFrozen(
      profile.information.supplementalMaintenanceFields,
    )).toBeTrue();
  });

  it('should reject a definition registered under the wrong id', () => {
    const definitions = fixtureDefinitions();
    const invalid = {
      ...definitions,
      widoor: {
        ...definitions.widoor,
        profile: 'garline',
      },
    } as unknown as Record<keyof typeof definitions,
      ProductProfileDefinition>;

    expect(() => new ProductProfileRegistry(invalid)).toThrowError(
      'Product profile registry mismatch for widoor.',
    );
  });

  it('should reject a family or variant inconsistent with the profile id', () => {
    const definitions = fixtureDefinitions();
    const invalid = replaceDefinition(definitions, 'moventiv-60', {
      ...definitions['moventiv-60'],
      variant: '80',
    });

    expect(() => new ProductProfileRegistry(invalid)).toThrowError(
      'Product profile identity mismatch for moventiv-60.',
    );
  });

  it('should require the peripherals field for expert inputs', () => {
    const definitions = fixtureDefinitions();
    const invalid = replaceDefinition(definitions, 'widoor', {
      ...definitions.widoor,
      expertFields: definitions.widoor.expertFields.filter(
        (field) => field !== 'peripherals',
      ),
    });

    expect(() => new ProductProfileRegistry(invalid)).toThrowError(
      'Expert inputs require peripherals for widoor.',
    );
  });

  it('should keep weight-range fields, controls and ranges consistent', () => {
    const definitions = fixtureDefinitions();
    const missingControl = replaceDefinition(definitions, 'moventiv-60', {
      ...definitions['moventiv-60'],
      capabilities: {
        ...definitions['moventiv-60'].capabilities,
        weightRangeControl: 'none',
      },
    });
    const missingRanges = replaceDefinition(definitions, 'moventiv-60', {
      ...definitions['moventiv-60'],
      weightRanges: [],
    });

    expect(() => new ProductProfileRegistry(missingControl)).toThrowError(
      'Weight-range capability mismatch for moventiv-60.',
    );
    expect(() => new ProductProfileRegistry(missingRanges)).toThrowError(
      'Weight-range capability mismatch for moventiv-60.',
    );
  });
});

function replaceDefinition(
  definitions: Readonly<
    Record<ProductProfileDefinition['profile'], ProductProfileDefinition>
  >,
  profile: ProductProfileDefinition['profile'],
  replacement: ProductProfileDefinition,
): Readonly<
  Record<ProductProfileDefinition['profile'], ProductProfileDefinition>
> {
  return {
    ...definitions,
    [profile]: replacement,
  };
}

function fixtureDefinitions(): Readonly<
  Record<ProductProfileDefinition['profile'], ProductProfileDefinition>
> {
  return {
    widoor: fixtureDefinition('widoor', 'widoor', 'standard'),
    'moventiv-60': fixtureDefinition('moventiv-60', 'moventiv', '60'),
    'moventiv-80': fixtureDefinition('moventiv-80', 'moventiv', '80'),
    garline: fixtureDefinition('garline', 'garline', 'standard'),
  };
}

function fixtureDefinition(
  profile: ProductProfileDefinition['profile'],
  family: ProductProfileDefinition['family'],
  variant: ProductProfileDefinition['variant'],
): ProductProfileDefinition {
  return {
    ...PRODUCT_PAGE_CONFIG[profile],
    family,
    variant,
    commands: ['motor-open'],
    sensitiveActions: ['learning'],
    capabilities: {
      demo: profile !== 'moventiv-80',
      expertInputs: profile !== 'garline',
      expertAccessFields: [],
      weightRangeControl: family === 'moventiv' ? 'advanced' : 'none',
    },
    behavior: {
      immediateWritePolicy: family,
      sliderAutoWrite: true,
      advancedSettingsConfirmation: family !== 'widoor',
      showControlsBeforeRead: true,
      refreshAfterMaintenanceAction: family === 'widoor',
    },
    information: {
      showMotorAddress: family !== 'widoor',
      showMaintenanceDates: family !== 'widoor',
      showCurrentWeightRange: family !== 'widoor',
      supplementalMaintenanceFields: ['initializations'],
    },
    ui: {
      widoorLayout: family === 'widoor',
      moventivLayout: family === 'moventiv' || family === 'garline',
      phase1SliderInteraction: true,
    },
  };
}
