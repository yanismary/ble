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

  it('uses one product slide 1 for every language and platform', () => {
    const products: TutorialProduct[] = ['widoor', 'moventiv', 'garline'];
    const contexts: readonly [TutorialPlatform, TutorialLanguage][] = [
      ['android', 'fr'],
      ['android', 'en'],
      ['ios', 'fr'],
      ['ios', 'pl'],
    ];

    for (const product of products) {
      const expected = `assets/img/tuto_${product}/slide1_${product}.png`;
      for (const [platform, language] of contexts) {
        expect(tutorialImagePathsFor(product, language, platform).slide1)
          .withContext(`${product}/${platform}/${language}`)
          .toBe(expected);
      }
    }
  });

  it('selects localized Android tutorial images from product folders', () => {
    const widoor = tutorialImagePathsFor('widoor', 'fr', 'android');
    const moventiv = tutorialImagePathsFor('moventiv', 'de', 'android');

    expect(widoor.slide2)
      .toBe('assets/img/tuto_widoor/android/fr/slide2.jpg');
    expect(moventiv.slide3)
      .toBe('assets/img/tuto_moventiv/android/de/slide3.jpg');
  });

  it('selects localized iOS images using their real file names', () => {
    const widoor = tutorialImagePathsFor('widoor', 'en', 'ios');
    const garline = tutorialImagePathsFor('garline', 'pl', 'ios');
    const moventivGerman = tutorialImagePathsFor('moventiv', 'de', 'ios');
    const moventivFrench = tutorialImagePathsFor('moventiv', 'fr', 'ios');

    expect(widoor.slide2)
      .toBe('assets/img/tuto_widoor/ios/en/slide2.PNG');
    expect(garline.slide4)
      .toBe('assets/img/tuto_garline/ios/pl/slide4.PNG');
    expect(moventivGerman.slide3)
      .toBe('assets/img/tuto_moventiv/ios/de/slide3-4_a_revoir.PNG');
    expect(moventivGerman.slide4).toBe(moventivGerman.slide3);
    expect(moventivFrench.slide6).toBe(
      'assets/img/tuto_moventiv/ios/fr/' +
      'slide6_a_revoir_avec_UUID_et_MAC.PNG',
    );
    expect(garline.slide6).toBe(
      'assets/img/tuto_garline/ios/pl/slide6_a_revoir_UUID_MAC.PNG',
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
