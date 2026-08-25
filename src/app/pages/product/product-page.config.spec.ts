import {
  PRODUCT_PAGE_CONFIG,
  isKnownProductProfile,
} from './product-page.config';

describe('Product page configuration', () => {
  it('should define a dedicated route and title for every known profile', () => {
    expect(PRODUCT_PAGE_CONFIG.widoor.route).toBe('/product/widoor');
    expect(PRODUCT_PAGE_CONFIG['moventiv-60'].route)
      .toBe('/product/moventiv-60');
    expect(PRODUCT_PAGE_CONFIG['moventiv-80'].route)
      .toBe('/product/moventiv-80');
    expect(PRODUCT_PAGE_CONFIG.garline.route).toBe('/product/garline');
    expect(PRODUCT_PAGE_CONFIG.garline.productName).toBe('GARLINE');
    expect(PRODUCT_PAGE_CONFIG.garline.productName).not.toContain('MOVENTIV');
  });

  it('should keep the Widoor Phase 1 fields and speed variants', () => {
    const config = PRODUCT_PAGE_CONFIG.widoor;

    expect(config.userFields).not.toContain('long-timing');
    expect(config.userFields).not.toContain('static-light');
    expect(config.userFields).not.toContain('dynamic-light');
    expect(config.userFields).not.toContain('lock-mode');
    expect(config.visibleLockModes).toEqual([]);
    expect(config.userFields).toContain('rgb');
    expect(config.professionalFields).toContain('break-force-at-open');
    expect(config.professionalFields).toContain('near-open-proportional');
    expect(config.professionalFields).toContain('near-open-integral');
    expect(config.openSpeedRange).toEqual({ min: 25, max: 100 });
    expect(config.closeSpeedRange).toEqual({ min: 35, max: 100 });
    expect(config.nearOpenSpeedRange).toEqual({ min: 70, max: 100 });
    expect(config.nearCloseSpeedRange).toEqual({ min: 50, max: 100 });
  });

  it('should distinguish the Moventiv 60 and 80 weight variants', () => {
    const moventiv60 = PRODUCT_PAGE_CONFIG['moventiv-60'];
    const moventiv80 = PRODUCT_PAGE_CONFIG['moventiv-80'];

    expect(moventiv60.productName).toContain('60');
    expect(moventiv80.productName).toContain('80');
    expect(moventiv60.weightRanges[moventiv60.weightRanges.length - 1])
      .toEqual({
      lower: 60,
      upper: 80,
    });
    expect(moventiv80.weightRanges[moventiv80.weightRanges.length - 1])
      .toEqual({
      lower: 60,
      upper: 80,
    });
    expect(moventiv60.userFields).not.toContain('long-timing');
    expect(moventiv80.userFields).not.toContain('long-timing');
    expect(moventiv60.visibleLockModes).toEqual(['locked-closed']);
    expect(moventiv80.visibleLockModes).toEqual(['locked-closed']);
  });

  it('should encode Garline masking rules without removing technical data', () => {
    const config = PRODUCT_PAGE_CONFIG.garline;

    expect(
      (config.visibleLockModes as readonly string[]).includes('locked-closed'),
    ).toBeFalse();
    expect(config.userFields).toContain('long-timing');
    expect(config.maximumWeightLabel).toBe('140 kg');
    const professionalFields =
      config.professionalFields as readonly string[];
    expect(professionalFields.includes('weight-range')).toBeFalse();
    expect(professionalFields.includes('peripherals')).toBeFalse();
    expect(professionalFields.includes('near-open-torque')).toBeFalse();
    expect(config.weightRanges).toEqual([
      { lower: 60, upper: 80 },
      { lower: 80, upper: 100 },
      { lower: 100, upper: 120 },
      { lower: 120, upper: 140 },
    ]);
    expect(config.professionalFields).toContain('obstacle-sensitivity');
    expect(config.openSpeedRange).toEqual({ min: 0, max: 100 });
    expect(config.nearOpenSpeedRange).toEqual({ min: 0, max: 100 });
  });

  it('should reject unknown and ambiguous profiles', () => {
    expect(isKnownProductProfile('widoor')).toBeTrue();
    expect(isKnownProductProfile('moventiv-60')).toBeTrue();
    expect(isKnownProductProfile('moventiv-80')).toBeTrue();
    expect(isKnownProductProfile('garline')).toBeTrue();
    expect(isKnownProductProfile('unknown')).toBeFalse();
    expect(isKnownProductProfile('ambiguous')).toBeFalse();
  });

  it('should expose deeply frozen profile configurations', () => {
    const config = PRODUCT_PAGE_CONFIG['moventiv-80'];

    expect(Object.isFrozen(PRODUCT_PAGE_CONFIG)).toBeTrue();
    expect(Object.isFrozen(config)).toBeTrue();
    expect(Object.isFrozen(config.userFields)).toBeTrue();
    expect(Object.isFrozen(config.weightRanges)).toBeTrue();
    expect(Object.isFrozen(config.weightRanges[0])).toBeTrue();
    expect(Object.isFrozen(config.openSpeedRange)).toBeTrue();
    expect(() => {
      (config.userFields as unknown as string[]).push('long-timing');
    }).toThrow();
  });
});
