import { scanPermissionTextFor } from './scan-permission.text';

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

  it('should preserve the active French Phase 1 permission wording', () => {
    expect(scanPermissionTextFor('fr')).toEqual(jasmine.objectContaining({
      firstDenial:
        'Impossible de lancer la recherche tant que les autorisations ' +
        'Bluetooth et localisation ne sont pas accordées.',
      settingsTitle: 'Autorisations requises',
      cancel: 'Annuler',
      openAppSettings: 'Ouvrir les réglages de l’application',
    }));
  });
});
