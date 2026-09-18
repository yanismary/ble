import {
  normalizeTutorialLanguage,
  normalizeTutorialPlatform,
  TutorialLanguage,
  TutorialPlatform,
  TutorialProduct,
  tutorialImagePathsFor,
  tutorialCopyFor,
} from '../tutorial.model';

describe('tutorial model', () => {
  it('keeps the eight Phase 1 tutorial steps', () => {
    const copy = tutorialCopyFor('moventiv', 'fr', 'android');

    expect(copy.slides.length).toBe(8);
    expect(copy.slides.slice(0, 6).every((slide) => Boolean(slide.image)))
      .toBeTrue();
    expect(copy.slides[6].image).toBeUndefined();
    expect(copy.slides[7].image).toBeUndefined();
  });

  it('keeps eight steps for every Phase 1 product, language, and platform',
    () => {
      const products: TutorialProduct[] = ['widoor', 'moventiv', 'garline'];
      const languages: TutorialLanguage[] = ['fr', 'en', 'de', 'pl'];
      const platforms: TutorialPlatform[] = ['android', 'ios'];

      for (const product of products) {
        for (const language of languages) {
          for (const platform of platforms) {
            const copy = tutorialCopyFor(product, language, platform);

            expect(copy.slides.length)
              .withContext(`${product}/${language}/${platform}`)
              .toBe(8);
            expect(copy.slides.slice(0, 6).every((slide) => Boolean(slide.image)))
              .withContext(`${product}/${language}/${platform}`)
              .toBeTrue();
          }
        }
      }
    },
  );

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

  it('selects Android tutorial images with their exact historical paths', () => {
    const images = tutorialImagePathsFor('widoor', 'fr', 'android');

    expect(images.slide1).toBe('assets/img/tuto_widoor/slide1_widoor.png');
    expect(images.slide2).toBe(
      'assets/img/tuto_widoor/slide2_android_fr_widoor.jpg',
    );
    expect(images.slide4).toBe(
      'assets/img/tuto_widoor/slide4_anroid_fr_widoor.jpg',
    );
  });

  it('selects iOS tutorial images with the historical uppercase extension', () => {
    const images = tutorialImagePathsFor('garline', 'en', 'ios');

    expect(images.slide2).toBe(
      'assets/img/tuto_garline/slide2_ios_en_garline.PNG',
    );
    expect(images.slide6).toBe(
      'assets/img/tuto_garline/slide6_ios_en_garline.PNG',
    );
  });

  it('normalizes supported languages and platforms', () => {
    expect(normalizeTutorialLanguage('fr')).toBe('fr');
    expect(normalizeTutorialLanguage('xx')).toBe('en');
    expect(normalizeTutorialPlatform('ios')).toBe('ios');
    expect(normalizeTutorialPlatform('android')).toBe('android');
    expect(normalizeTutorialPlatform('web')).toBe('web');
  });
});
