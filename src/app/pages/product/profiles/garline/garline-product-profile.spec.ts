import { GARLINE_PRODUCT_PROFILE } from './garline-product-profile';

describe('Garline product profile', () => {
  it('should describe the current Garline commands and settings', () => {
    expect(GARLINE_PRODUCT_PROFILE.family).toBe('garline');
    expect(GARLINE_PRODUCT_PROFILE.productName).toBe('GARLINE');
    expect(GARLINE_PRODUCT_PROFILE.commands).toEqual([
      'motor-open',
      'motor-close',
      'motor-open-short-timed',
    ]);
    expect(GARLINE_PRODUCT_PROFILE.userFields).toContain('long-timing');
    expect(GARLINE_PRODUCT_PROFILE.professionalFields)
      .toContain('obstacle-sensitivity');
  });

  it('should keep unsupported controls explicitly absent', () => {
    expect(GARLINE_PRODUCT_PROFILE.capabilities.professionalInputs)
      .toBeFalse();
    expect(GARLINE_PRODUCT_PROFILE.capabilities.weightRangeControl)
      .toBe('none');
    const professionalFields = GARLINE_PRODUCT_PROFILE.professionalFields as
      readonly string[];
    expect(professionalFields).not.toContain('weight-range');
    expect(professionalFields).not.toContain('peripherals');
    expect(GARLINE_PRODUCT_PROFILE.sensitiveActions).toEqual(['learning']);
  });

  it('should retain Garline information and lifecycle capabilities', () => {
    expect(Object.isFrozen(GARLINE_PRODUCT_PROFILE)).toBeTrue();
    expect(Object.isFrozen(GARLINE_PRODUCT_PROFILE.weightRanges)).toBeTrue();
    expect(GARLINE_PRODUCT_PROFILE.capabilities.demo).toBeTrue();
    expect(GARLINE_PRODUCT_PROFILE.behavior.refreshAfterMaintenanceAction)
      .toBeFalse();
    expect(GARLINE_PRODUCT_PROFILE.information.showMotorAddress).toBeTrue();
    expect(GARLINE_PRODUCT_PROFILE.information.showCurrentWeightRange)
      .toBeTrue();
    expect(GARLINE_PRODUCT_PROFILE.ui.widoorLayout).toBeFalse();
  });
});
