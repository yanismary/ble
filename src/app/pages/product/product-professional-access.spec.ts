import { productProfessionalFieldRequiresAccess } from
  './product-professional-access';

describe('productProfessionalFieldRequiresAccess', () => {
  it('keeps Widoor professional fields available without access validation',
    () => {
      expect(productProfessionalFieldRequiresAccess(
        'widoor',
        'break-force-at-open',
      )).toBeFalse();
      expect(productProfessionalFieldRequiresAccess(
        'widoor',
        'near-open-speed',
      )).toBeFalse();
    },
  );

  it('protects only Moventiv advanced force and obstacle fields', () => {
    for (const profile of ['moventiv-60', 'moventiv-80'] as const) {
      expect(productProfessionalFieldRequiresAccess(
        profile,
        'weight-range',
      )).toBeFalse();
      expect(productProfessionalFieldRequiresAccess(
        profile,
        'near-open-speed',
      )).toBeFalse();
      expect(productProfessionalFieldRequiresAccess(
        profile,
        'near-close-speed',
      )).toBeFalse();
      expect(productProfessionalFieldRequiresAccess(
        profile,
        'braking-open-power',
      )).toBeTrue();
      expect(productProfessionalFieldRequiresAccess(
        profile,
        'obstacle-sensitivity',
      )).toBeTrue();
      expect(productProfessionalFieldRequiresAccess(
        profile,
        'near-open-torque',
      )).toBeTrue();
      expect(productProfessionalFieldRequiresAccess(
        profile,
        'near-close-torque',
      )).toBeTrue();
    }
  });

  it('protects Garline obstacle sensitivity only', () => {
    expect(productProfessionalFieldRequiresAccess(
      'garline',
      'weight-range',
    )).toBeFalse();
    expect(productProfessionalFieldRequiresAccess(
      'garline',
      'near-open-speed',
    )).toBeFalse();
    expect(productProfessionalFieldRequiresAccess(
      'garline',
      'near-close-speed',
    )).toBeFalse();
    expect(productProfessionalFieldRequiresAccess(
      'garline',
      'obstacle-sensitivity',
    )).toBeTrue();
  });
});
