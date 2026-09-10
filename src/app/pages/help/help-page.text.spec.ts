import {
  helpPageTextFor,
  helpProductTextFor,
} from './help-page.text';

describe('help page text', () => {
  it('exposes one Widoor and one Moventiv/Garline choice per language', () => {
    for (const language of ['fr', 'en', 'de', 'pl']) {
      expect(helpPageTextFor(language).products).toEqual({
        widoor: 'WIDOOR',
        'moventiv-garline': 'MOVENTIV / GARLINE',
      });
    }
  });

  it('places Bluetooth discovery before PRG for every language and product',
    () => {
      for (const language of ['fr', 'en', 'de', 'pl']) {
        for (const product of ['widoor', 'moventiv-garline'] as const) {
          const steps = helpProductTextFor(language, 'android', product)
            .pairing.steps;

          expect(steps.length).toBe(6);
          expect(steps[2]).toContain('Bluetooth');
          expect(steps[3]).toContain('PRG');
          expect(steps[3]).toContain('magenta');
        }
      }
    });

  it('uses the exact localized Android pairing action as step 6', () => {
    const expected: Record<string, string> = {
      fr: 'Appuyez sur \u00ab Associer \u00bb lorsque la fenetre d\u2019appairage Android apparait.',
      en: 'Tap \u00ab Pair \u00bb when the Android pairing dialog appears.',
      de: 'Tippen Sie auf \u00ab Koppeln \u00bb, wenn das Android-Kopplungsfenster erscheint.',
      pl: 'Nacisnij \u00ab Sparuj \u00bb, gdy pojawi sie okno parowania systemu Android.',
    };

    for (const [language, step] of Object.entries(expected)) {
      expect(helpProductTextFor(language, 'android', 'widoor')
        .pairing.steps[5]).toBe(step);
    }
  });

  it('uses the exact localized iOS pairing action as step 6', () => {
    const expected: Record<string, string> = {
      fr: 'Appuyez sur \u00ab Jumeler \u00bb lorsque la fenetre d\u2019appairage iOS apparait.',
      en: 'Tap \u00ab Pair \u00bb when the iOS pairing dialog appears.',
      de: 'Tippen Sie auf \u00ab Koppeln \u00bb, wenn das iOS-Kopplungsfenster erscheint.',
      pl: 'Nacisnij \u00ab Polacz w pare \u00bb, gdy pojawi sie okno parowania systemu iOS.',
    };

    for (const [language, step] of Object.entries(expected)) {
      expect(helpProductTextFor(language, 'ios', 'moventiv-garline')
        .pairing.steps[5]).toBe(step);
    }
  });

  it('does not render the obsolete Android or iOS pairing paragraphs', () => {
    for (const language of ['fr', 'en', 'de', 'pl']) {
      const android = helpProductTextFor(language, 'android', 'widoor');
      const ios = helpProductTextFor(language, 'ios', 'widoor');

      expect('note' in android.pairing).toBeFalse();
      expect('note' in ios.pairing).toBeFalse();
    }
  });

  it('shares Moventiv/Garline pairing troubleshooting with Widoor', () => {
    for (const language of ['fr', 'en', 'de', 'pl']) {
      const text = helpPageTextFor(language);

      expect(text.productHelp.widoor.troubleshooting)
        .toBe(text.productHelp['moventiv-garline'].troubleshooting);
    }
  });

  it('resolves supported Phase 2 languages', () => {
    expect(helpPageTextFor('fr').title).toBe('Aide');
    expect(helpPageTextFor('en').title).toBe('Help');
    expect(helpPageTextFor('de').title).toBe('Hilfe');
    expect(helpPageTextFor('pl').title).toBe('Pomoc');
  });
});
