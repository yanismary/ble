import { scanBluetoothTextFor } from './scan-bluetooth.text';

describe('scanBluetoothTextFor', () => {
  it('should expose the Phase 1 Bluetooth-off actions in every language', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const text = scanBluetoothTextFor(language);

      expect(text.disabledTitle).not.toBe('');
      expect(text.disabledMessage).not.toBe('');
      expect(text.cancel).not.toBe('');
      expect(text.enable).not.toBe('');
      expect(text.settingsTitle).not.toBe('');
      expect(text.androidSettingsMessage).not.toBe('');
      expect(text.iosSettingsMessage).not.toBe('');
      expect(text.ok).not.toBe('');
      expect(text.openBluetoothSettings).not.toBe('');
      expect(text.openAppSettings).not.toBe('');
    }
  });

  it('should preserve the confirmed French Phase 1 wording', () => {
    expect(scanBluetoothTextFor('fr')).toEqual(jasmine.objectContaining({
      disabledTitle: 'Bluetooth désactivé',
      disabledMessage:
        'Le Bluetooth est actuellement désactivé sur le téléphone. ' +
        'Voulez-vous l’activer et lancer une recherche ?',
      cancel: 'Annuler',
      enable: 'Activer',
      settingsTitle: 'Activation nécessaire',
      openBluetoothSettings: 'Ouvrir les paramètres Bluetooth',
      openAppSettings: 'Ouvrir les réglages',
    }));
  });
});
