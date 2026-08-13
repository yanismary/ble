import {
  companyInfoCopyFor,
  normalizeCompanyInfoLanguage,
} from './company-info.model';

describe('company info model', () => {
  it('keeps the complete Phase 1 company information structure', () => {
    const copy = companyInfoCopyFor('fr');

    expect(copy.navbarTitle).toBeTruthy();
    expect(copy.contentTitle).toBeTruthy();
    expect(copy.contentSubtitle).toBeTruthy();
    expect(copy.introduction).toBeTruthy();
    expect(copy.expertiseIntro).toBeTruthy();
    expect(copy.expertiseItems.length).toBe(3);
    expect(copy.addressPresentation).toBeTruthy();
    expect(copy.addressLocalization).toBeTruthy();
  });

  it('keeps company information available in every migrated language', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const copy = companyInfoCopyFor(language);

      expect(copy.navbarTitle).toBeTruthy();
      expect(copy.contentTitle).toBeTruthy();
      expect(copy.introduction).toBeTruthy();
    }
  });

  it('falls back to English for unsupported languages', () => {
    expect(normalizeCompanyInfoLanguage('xx')).toBe('en');
    expect(normalizeCompanyInfoLanguage(null)).toBe('en');
  });
});
