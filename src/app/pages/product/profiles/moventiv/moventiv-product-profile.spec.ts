import {
  MOVENTIV_60_PRODUCT_PROFILE,
  MOVENTIV_80_PRODUCT_PROFILE,
} from './moventiv-product-profile';

describe('Moventiv product profiles', () => {
  it('should model 60 and 80 as variants of one family', () => {
    expect(MOVENTIV_60_PRODUCT_PROFILE.family).toBe('moventiv');
    expect(MOVENTIV_80_PRODUCT_PROFILE.family).toBe('moventiv');
    expect(MOVENTIV_60_PRODUCT_PROFILE.variant).toBe('60');
    expect(MOVENTIV_80_PRODUCT_PROFILE.variant).toBe('80');
    expect(MOVENTIV_60_PRODUCT_PROFILE.route).toBe('/product/moventiv-60');
    expect(MOVENTIV_80_PRODUCT_PROFILE.route).toBe('/product/moventiv-80');
  });

  it('should share the current Moventiv settings and commands', () => {
    expect(MOVENTIV_60_PRODUCT_PROFILE.commands)
      .toEqual(MOVENTIV_80_PRODUCT_PROFILE.commands);
    expect(MOVENTIV_60_PRODUCT_PROFILE.userFields)
      .toEqual(MOVENTIV_80_PRODUCT_PROFILE.userFields);
    expect(MOVENTIV_60_PRODUCT_PROFILE.professionalFields)
      .toEqual(MOVENTIV_80_PRODUCT_PROFILE.professionalFields);
    expect(MOVENTIV_60_PRODUCT_PROFILE.visibleLockModes)
      .toEqual(['locked-closed']);
    expect(MOVENTIV_60_PRODUCT_PROFILE.capabilities.weightRangeControl)
      .toBe('advanced');
    expect(MOVENTIV_60_PRODUCT_PROFILE.capabilities.professionalInputs)
      .toBeTrue();
    expect(MOVENTIV_60_PRODUCT_PROFILE.ui.phase1SliderInteraction).toBeTrue();
    expect(MOVENTIV_80_PRODUCT_PROFILE.ui.phase1SliderInteraction).toBeTrue();
  });

  it('should retain the existing Demo availability per variant', () => {
    expect(MOVENTIV_60_PRODUCT_PROFILE.capabilities.demo).toBeTrue();
    expect(MOVENTIV_80_PRODUCT_PROFILE.capabilities.demo).toBeFalse();
  });

  it('should expose independent immutable definitions per variant', () => {
    expect(Object.isFrozen(MOVENTIV_60_PRODUCT_PROFILE)).toBeTrue();
    expect(Object.isFrozen(MOVENTIV_80_PRODUCT_PROFILE)).toBeTrue();
    expect(Object.isFrozen(MOVENTIV_60_PRODUCT_PROFILE.userFields)).toBeTrue();
    expect(MOVENTIV_60_PRODUCT_PROFILE.userFields)
      .not.toBe(MOVENTIV_80_PRODUCT_PROFILE.userFields);
    expect(() => {
      (MOVENTIV_60_PRODUCT_PROFILE.userFields as unknown as string[])
        .push('long-timing');
    }).toThrow();
    expect(MOVENTIV_80_PRODUCT_PROFILE.userFields)
      .not.toContain('long-timing');
  });

  it('should exclude Widoor-only profile capabilities', () => {
    for (const profile of [
      MOVENTIV_60_PRODUCT_PROFILE,
      MOVENTIV_80_PRODUCT_PROFILE,
    ]) {
      expect(profile.professionalFields).not.toContain('break-force-at-open');
      expect(profile.sensitiveActions).toEqual(['learning']);
      expect(profile.ui.widoorLayout).toBeFalse();
      expect(profile.behavior.advancedSettingsConfirmation).toBeTrue();
    }
  });
});
