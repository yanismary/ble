import { scanPermissionTextFor } from '../scan-permission.text';

describe('scanPermissionTextFor', () => {
  it('should expose every permission action in all supported languages', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const text = scanPermissionTextFor(language);

      expect(text.firstDenial).not.toBe('');
      expect(text.settingsTitle).not.toBe('');
      expect(text.repeatedDenial).not.toBe('');
      expect(text.blockedDenial).not.toBe('');
      expect(text.cancel).not.toBe('');
      expect(text.openAppSettings).not.toBe('');
    }
  });

  it('should mention only Bluetooth for modern permission requests', () => {
    const locationTerms = {
      fr: 'localisation',
      en: 'location',
      de: 'standort',
      pl: 'lokalizacji',
    } as const;

    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const text = scanPermissionTextFor(language, 'bluetooth');
      const messages = [
        text.firstDenial,
        text.repeatedDenial,
        text.blockedDenial,
      ].join(' ').toLowerCase();

      expect(messages).toContain('bluetooth');
      expect(messages).not.toContain(locationTerms[language]);
    }
  });

  it('should preserve the legacy French Bluetooth and location wording', () => {
    expect(scanPermissionTextFor('fr', 'bluetooth-and-location')).toEqual(
      jasmine.objectContaining({
        firstDenial:
          'Impossible de lancer la recherche tant que les autorisations ' +
          'Bluetooth et localisation ne sont pas accordées.',
        settingsTitle: 'Autorisations requises',
        cancel: 'Annuler',
        openAppSettings: 'Ouvrir les réglages de l’application',
      }),
    );
  });
});
