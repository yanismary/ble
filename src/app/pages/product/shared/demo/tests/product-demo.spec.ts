import {
  PRODUCT_DEMO_CHOICES,
  createProductDemoNavigationState,
  createProductDemoSnapshot,
  isProductDemoProfile,
  productDemoTextFor,
} from '../product-demo';
import { productProfileRegistry } from
  '../../../profiles/product-profile.registry';

describe('Product Demo data', () => {
  it('exposes only the three Phase 1 profiles in their historical order', () => {
    expect(PRODUCT_DEMO_CHOICES).toEqual([
      { profile: 'moventiv-60', label: 'Moventiv' },
      { profile: 'garline', label: 'Garline' },
      { profile: 'widoor', label: 'Widoor' },
    ]);
    expect(isProductDemoProfile(productProfileRegistry.get('widoor')))
      .toBeTrue();
    expect(isProductDemoProfile(productProfileRegistry.get('moventiv-60')))
      .toBeTrue();
    expect(isProductDemoProfile(productProfileRegistry.get('moventiv-80')))
      .toBeFalse();
    expect(isProductDemoProfile(productProfileRegistry.get('garline')))
      .toBeTrue();
    expect(isProductDemoProfile('unknown')).toBeFalse();
  });

  it('rejects snapshots for profiles without the Demo capability', () => {
    expect(() => createProductDemoSnapshot(
      productProfileRegistry.get('moventiv-80'),
    )).toThrowError(
      'Demo is not available for moventiv-80.',
    );
  });

  it('creates explicit non-connected navigation identities', () => {
    expect(createProductDemoNavigationState('moventiv-60')).toEqual(
      jasmine.objectContaining({
        mode: 'demo',
        profile: 'moventiv-60',
        deviceId: 'MOVENTIV-DEMO-0001',
        connectionGeneration: 0,
        identificationConfidence: 'demo',
      }),
    );
    expect(createProductDemoNavigationState('garline').deviceId)
      .toBe('GARLINE-DEMO-0001');
    expect(createProductDemoNavigationState('widoor').deviceId)
      .toBe('WIDOOR-DEMO-0001');
    expect(createProductDemoNavigationState('widoor').displayName)
      .toBe('WIDOOR exemple');
    expect(createProductDemoNavigationState('widoor', 'en').displayName)
      .toBe('WIDOOR example');
  });

  it('restores the four Phase 1 Demo translations', () => {
    expect(productDemoTextFor('fr').cancel).toBe('Annuler');
    expect(productDemoTextFor('en').cancel).toBe('Cancel');
    expect(productDemoTextFor('de').profileLabels.garline)
      .toBe('GARLINE Beispiel');
    expect(productDemoTextFor('pl').profileLabels['moventiv-60'])
      .toBe('Przykład MOVENTIV');
  });

  it('restores the Phase 1 Widoor values', () => {
    const snapshot = createProductDemoSnapshot(
      productProfileRegistry.get('widoor'),
    );

    expect(snapshot.version.stack).toEqual({
      major: 1, minor: 2, patch: 3, build: 4,
    });
    expect(snapshot.userParameters.openSpeed).toBe(90);
    expect(snapshot.userParameters.closeSpeed).toBe(95);
    expect(snapshot.userParameters.shortOpenTime).toBe(4);
    expect(snapshot.advancedParameters.nearOpenSpeed).toBe(90);
    expect(snapshot.advancedParameters.nearCloseSpeed).toBe(100);
    expect(snapshot.advancedParameters.profile).toBe('widoor');
    if (snapshot.advancedParameters.profile === 'widoor') {
      expect(snapshot.advancedParameters.breakForceAtOpen).toBe(5);
    }
    expect(snapshot.datesAndCycles.totalCycles).toBe(0);
  });

  it('restores the Phase 1 Moventiv 60 and Garline values', () => {
    const moventiv = createProductDemoSnapshot(
      productProfileRegistry.get('moventiv-60'),
    );
    const garline = createProductDemoSnapshot(
      productProfileRegistry.get('garline'),
    );

    expect(moventiv.userParameters.shortOpenTime).toBe(4);
    expect(moventiv.userParameters.longOpenTime).toBe(10);
    expect(moventiv.datesAndCycles.totalCycles).toBe(55989);
    expect(moventiv.maintenance.initializationCount).toBe(10);
    expect(moventiv.maintenance.cyclesSinceInitialization).toBe(200);
    expect(moventiv.maintenance.obstacleDetectionCount).toBe(2);
    expect(garline.userParameters.shortOpenTime).toBe(1);
    expect(garline.userParameters.longOpenTime).toBe(10);
    expect(garline.version.productType).toBe(2);
  });
});
