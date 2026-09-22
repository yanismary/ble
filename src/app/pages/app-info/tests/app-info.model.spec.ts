import {
  appInfoCopyFor,
  normalizeAppInfoLanguage,
} from '../app-info.model';

describe('app info model', () => {
  it('keeps the current support contact in the French copy', () => {
    const copy = appInfoCopyFor('fr');

    expect(copy.companyName).toBeTruthy();
    expect(copy.supportEmail).toBe('appsupport@mantion-smt.fr');
    expect(copy.supportEmailHref).toBe('mailto:appsupport@mantion-smt.fr');
    expect(copy.phoneLabel).toBeTruthy();
    expect(copy.phoneHref).toBe('tel:+33380378571');
    expect(copy.addressLines.length).toBeGreaterThan(0);
  });

  it('uses the Phase 1 support phone target for every migrated language', () => {
    expect(appInfoCopyFor('fr').phoneHref).toBe('tel:+33380378571');
    expect(appInfoCopyFor('en').phoneHref).toBe('tel:+33380378571');
    expect(appInfoCopyFor('de').phoneHref).toBe('tel:+492056582690');
    expect(appInfoCopyFor('pl').phoneHref).toBe('tel:+33380378571');
  });

  it('presents the Phase 2 app in all four languages', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const copy = appInfoCopyFor(language);

      expect(copy.aboutTitle).toBeTruthy();
      expect(copy.aboutContentTitle).toBeTruthy();
      expect(copy.versionLabel).toBeTruthy();
      expect(copy.description).toContain('MANTION Door Control');
      expect(copy.connectionDescription).toContain('Bluetooth Low Energy');
      expect(copy.supportedProducts).toEqual([
        'WIDOOR', 'MOVENTIV 60', 'MOVENTIV 80', 'GARLINE',
      ]);
      expect(copy.phase2Description).toBeTruthy();
      expect(copy.modernizationDescription).toContain('2.1');
      expect(copy.compatibilityNotice).toBeTruthy();
      expect(copy.developerLabel).toContain('MANTION SMT');
      expect(copy.aboutAddressLines).toEqual([
        '2 rue des Métiers', '21110 Genlis — France',
      ]);
      expect(copy.contactTitle).toBeTruthy();
      expect(copy.sendMessage).toBeTruthy();
      expect(copy.supportEmail).toBeTruthy();
      expect(copy.supportEmailHref).toBe(`mailto:${copy.supportEmail}`);
      expect(copy.companyName).toBeTruthy();
      expect(copy.phoneLabel).toBeTruthy();
      expect(copy.phoneHref).toMatch(/^tel:\+\d+$/);
      expect(copy.addressLines.length).toBeGreaterThan(0);
      expect(copy.companyInfoLabel).toBeTruthy();
      expect(copy.legalNoticeLabel).toBe({
        fr: 'Conditions d’utilisation',
        en: 'Terms of Use',
        de: 'Nutzungsbedingungen',
        pl: 'Warunki użytkowania',
      }[language]);
    }
  });

  it('falls back to English for an unsupported language', () => {
    expect(normalizeAppInfoLanguage('xx')).toBe('en');
    expect(normalizeAppInfoLanguage(null)).toBe('en');
  });
});
