import {
  legalNoticeCopyFor,
  normalizeLegalNoticeLanguage,
} from '../legal-notice.model';

describe('legal notice model', () => {
  it('contains the complete Phase 2 terms and contact', () => {
    const copy = legalNoticeCopyFor('fr');

    expect(copy.navbarTitle).toBeTruthy();
    expect(copy.title).toBeTruthy();
    expect(copy.navbarTitle).toBe('Conditions d’utilisation');
    expect(copy.title).toContain('MANTION Door Control');
    expect(copy.lastUpdated).toBe('22 septembre 2026');
    expect(copy.sections.length).toBe(10);
    expect(copy.sections[0].paragraphs.length).toBe(2);
    expect(copy.sections[8].paragraphs).toContain('MANTION SMT');
    expect(copy.sections[8].paragraphs).toContain('appsupport@mantion-smt.fr');
    expect(copy.definitions.length).toBe(4);
  });

  it('keeps legal content available in every migrated language', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const copy = legalNoticeCopyFor(language);

      expect(copy.title).toBeTruthy();
      expect(copy.title).toContain('MANTION Door Control');
      expect(copy.lastUpdated).toContain('2026');
      expect(copy.sections.length).toBe(10);
      expect(copy.sections.every((section) =>
        Boolean(section.title) && section.paragraphs.length > 0,
      )).toBeTrue();
      expect(copy.definitionsTitle).toBeTruthy();
      expect(copy.definitions.length).toBe(4);
      expect(copy.definitions.every((definition) =>
        Boolean(definition.term) && Boolean(definition.description),
      )).toBeTrue();
    }
  });

  it('falls back to English for unsupported languages', () => {
    expect(normalizeLegalNoticeLanguage('xx')).toBe('en');
    expect(normalizeLegalNoticeLanguage(null)).toBe('en');
  });
});
