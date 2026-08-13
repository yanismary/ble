import { PRODUCT_PAGE_TEXT } from './product-page.text';
import {
  normalizeProductPageLanguage,
  productPageTextFor,
} from './product-page-legacy-localization';

describe('product page legacy localization', () => {
  it('supports every Phase 1 application language', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const text = productPageTextFor(language);

      expect(text.sections.commands).toBeTruthy();
      expect(text.user.openSpeed).toBeTruthy();
      expect(text.professional.nearOpenSpeed).toBeTruthy();
      expect(text.dates.firstCommissioning).toBeTruthy();
      expect(text.version.motor).toBeTruthy();
      expect(text.maintenance.obstacleDetectionCount).toBeTruthy();
    }
  });

  it('keeps the current Phase 2 French catalogue as the default', () => {
    expect(normalizeProductPageLanguage(null)).toBe('fr');
    expect(normalizeProductPageLanguage('xx')).toBe('fr');
    expect(productPageTextFor('fr')).toBe(PRODUCT_PAGE_TEXT);
    expect(productPageTextFor('fr').lockModeControls.lockedOpen.label)
      .toBe('Maintien ouvert');
    expect(productPageTextFor('fr').dates.cyclesSinceMaintenance)
      .toBe('Cycles depuis maintenance');
    expect(productPageTextFor('fr').maintenance.initializationCount)
      .toBe('Initialisations');
  });

  it('actually changes legacy labels with the selected language', () => {
    expect(productPageTextFor('en').user.openSpeed)
      .not.toBe(productPageTextFor('fr').user.openSpeed);
    expect(productPageTextFor('de').sections.settings)
      .not.toBe(productPageTextFor('fr').sections.settings);
    expect(productPageTextFor('pl').dates.firstCommissioning)
      .not.toBe(productPageTextFor('fr').dates.firstCommissioning);
  });
});
