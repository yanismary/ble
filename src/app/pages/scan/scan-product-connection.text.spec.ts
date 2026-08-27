import { scanProductConnectionTextFor } from './scan-product-connection.text';

describe('scanProductConnectionTextFor', () => {
  it('should expose the three recovery messages in every language', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const text = scanProductConnectionTextFor(language);

      expect(text.connectionFailed).not.toBe('');
      expect(text.discoveryFailed).not.toBe('');
      expect(text.productNotRecognized).not.toBe('');
    }
  });

  it('should preserve the Phase 1 French wording', () => {
    expect(scanProductConnectionTextFor('fr')).toEqual({
      connectionFailed:
        'Connexion Bluetooth impossible. Veuillez réessayer.',
      discoveryFailed:
        'Decouverte des services Bluetooth impossible.',
      productNotRecognized: 'Produit non reconnu.',
    });
  });
});
