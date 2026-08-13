import {
  normalizeTutorialLanguage,
  normalizeTutorialPlatform,
  tutorialCopyFor,
} from './tutorial.model';

describe('tutorial model', () => {
  it('keeps the eight Phase 1 tutorial steps', () => {
    const copy = tutorialCopyFor('moventiv', 'fr', 'android');

    expect(copy.slides.length).toBe(8);
    expect(copy.slides.slice(0, 6).every((slide) => Boolean(slide.image)))
      .toBeTrue();
    expect(copy.slides[6].image).toBeUndefined();
    expect(copy.slides[7].image).toBeUndefined();
  });

  it('keeps product-specific text substitution', () => {
    const widoor = tutorialCopyFor('widoor', 'fr', 'android');
    const garline = tutorialCopyFor('garline', 'fr', 'android');

    expect(widoor.readyTitle.toUpperCase()).toContain('WIDOOR');
    expect(garline.readyTitle.toUpperCase()).toContain('GARLINE');
  });

  it('keeps the Phase 1 image-language fallback for non-French languages', () => {
    const copy = tutorialCopyFor('moventiv', 'de', 'android');

    expect(copy.slides[1].image).toContain('_en_moventiv');
  });

  it('normalizes supported languages and platforms', () => {
    expect(normalizeTutorialLanguage('fr')).toBe('fr');
    expect(normalizeTutorialLanguage('xx')).toBe('en');
    expect(normalizeTutorialPlatform('ios')).toBe('ios');
    expect(normalizeTutorialPlatform('android')).toBe('android');
    expect(normalizeTutorialPlatform('web')).toBe('web');
  });
});
