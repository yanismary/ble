import { scanLocationTextFor } from './scan-location.text';

describe('scanLocationTextFor', () => {
  it('should provide the complete location alert in every supported language',
    () => {
      for (const language of ['fr', 'en', 'de', 'pl'] as const) {
        const text = scanLocationTextFor(language);

        expect(text.disabledTitle).toBeTruthy();
        expect(text.disabledMessage).toBeTruthy();
        expect(text.cancel).toBeTruthy();
        expect(text.openSettings).toBeTruthy();
      }
    },
  );

  it('should preserve the exact Phase 1 French location wording', () => {
    expect(scanLocationTextFor('fr')).toEqual({
      disabledTitle: 'Localisation désactivée',
      disabledMessage:
        'Activez la localisation du téléphone pour autoriser le scan ' +
        'Bluetooth, puis relancez la recherche.',
      cancel: 'Annuler',
      openSettings: 'Ouvrir les réglages de localisation',
    });
  });
});
