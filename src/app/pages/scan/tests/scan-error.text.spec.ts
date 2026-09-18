import { scanErrorTextFor } from '../scan-error.text';

describe('scanErrorTextFor', () => {
  it('should expose user-facing scan failures in every language', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const text = scanErrorTextFor(language);

      expect(text.genericFailure).not.toBe('');
      expect(text.bluetoothNotReady).not.toBe('');
    }
  });

  it('should preserve the Phase 1 French scan failure wording', () => {
    expect(scanErrorTextFor('fr')).toEqual({
      genericFailure:
        'La recherche Bluetooth a échoué. Veuillez réessayer.',
      bluetoothNotReady:
        'Le Bluetooth de l’application n’est pas prêt. Veuillez relancer ' +
        'la recherche.',
    });
  });
});
