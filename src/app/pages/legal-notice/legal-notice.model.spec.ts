import {
  legalNoticeCopyFor,
  normalizeLegalNoticeLanguage,
} from './legal-notice.model';

describe('legal notice model', () => {
  it('keeps the complete Phase 1 legal structure', () => {
    const copy = legalNoticeCopyFor('fr');

    expect(copy.navbarTitle).toBeTruthy();
    expect(copy.title).toBeTruthy();
    expect(copy.sections.length).toBe(2);
    expect(copy.sections[0].paragraphs.length).toBe(3);
    expect(copy.sections[1].paragraphs.length).toBe(1);
    expect(copy.definitions.length).toBe(3);
  });

  it('keeps legal content available in every migrated language', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const copy = legalNoticeCopyFor(language);

      expect(copy.title).toBeTruthy();
      expect(copy.definitionsTitle).toBeTruthy();
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
