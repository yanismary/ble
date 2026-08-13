import {
  appInfoCopyFor,
  normalizeAppInfoLanguage,
} from './app-info.model';

describe('app info model', () => {
  it('keeps the Phase 1 support contact in the French copy', () => {
    const copy = appInfoCopyFor('fr');

    expect(copy.companyName).toBeTruthy();
    expect(copy.phoneLabel).toBeTruthy();
    expect(copy.addressLines.length).toBeGreaterThan(0);
  });

  it('keeps the Phase 1 about text available in every migrated language', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const copy = appInfoCopyFor(language);

      expect(copy.aboutTitle).toBeTruthy();
      expect(copy.aboutContentTitle).toBeTruthy();
      expect(copy.versionLabel).toBeTruthy();
      expect(copy.companyInfoLabel).toBeTruthy();
      expect(copy.legalNoticeLabel).toBeTruthy();
    }
  });

  it('falls back to English for an unsupported language', () => {
    expect(normalizeAppInfoLanguage('xx')).toBe('en');
    expect(normalizeAppInfoLanguage(null)).toBe('en');
  });
});
