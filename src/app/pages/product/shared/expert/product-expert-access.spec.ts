import { productExpertFieldRequiresAccess } from
  './product-expert-access';
import { PRODUCT_PAGE_CONFIG } from
  '../../profiles/product-page-config.facade';

describe('productExpertFieldRequiresAccess', () => {
  it('keeps Widoor expert fields available without access validation',
    () => {
      expect(productExpertFieldRequiresAccess(
        PRODUCT_PAGE_CONFIG.widoor,
        'break-force-at-open',
      )).toBeFalse();
      expect(productExpertFieldRequiresAccess(
        PRODUCT_PAGE_CONFIG.widoor,
        'near-open-speed',
      )).toBeFalse();
    },
  );

  it('protects only Moventiv advanced force and obstacle fields', () => {
    for (const profile of ['moventiv-60', 'moventiv-80'] as const) {
      const definition = PRODUCT_PAGE_CONFIG[profile];
      expect(productExpertFieldRequiresAccess(
        definition,
        'weight-range',
      )).toBeFalse();
      expect(productExpertFieldRequiresAccess(
        definition,
        'near-open-speed',
      )).toBeFalse();
      expect(productExpertFieldRequiresAccess(
        definition,
        'near-close-speed',
      )).toBeFalse();
      expect(productExpertFieldRequiresAccess(
        definition,
        'braking-open-power',
      )).toBeTrue();
      expect(productExpertFieldRequiresAccess(
        definition,
        'obstacle-sensitivity',
      )).toBeTrue();
      expect(productExpertFieldRequiresAccess(
        definition,
        'near-open-torque',
      )).toBeTrue();
      expect(productExpertFieldRequiresAccess(
        definition,
        'near-close-torque',
      )).toBeTrue();
    }
  });

  it('protects Garline obstacle sensitivity only', () => {
    expect(productExpertFieldRequiresAccess(
      PRODUCT_PAGE_CONFIG.garline,
      'weight-range',
    )).toBeFalse();
    expect(productExpertFieldRequiresAccess(
      PRODUCT_PAGE_CONFIG.garline,
      'near-open-speed',
    )).toBeFalse();
    expect(productExpertFieldRequiresAccess(
      PRODUCT_PAGE_CONFIG.garline,
      'near-close-speed',
    )).toBeFalse();
    expect(productExpertFieldRequiresAccess(
      PRODUCT_PAGE_CONFIG.garline,
      'obstacle-sensitivity',
    )).toBeTrue();
  });
});
