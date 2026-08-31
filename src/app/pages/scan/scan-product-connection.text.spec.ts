import { scanProductConnectionTextFor } from './scan-product-connection.text';

describe('scanProductConnectionTextFor', () => {
  it('should expose translated connection guidance in every language', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const text = scanProductConnectionTextFor(language);

      expect(text.connectionFailedTitle).not.toBe('');
      expect(text.connectionFailed).not.toBe('');
      expect(text.discoveryFailed).not.toBe('');
      expect(text.productNotRecognized).not.toBe('');
      expect(text.ok).not.toBe('');
    }
  });

  it('should provide conditional pairing guidance in French', () => {
    expect(scanProductConnectionTextFor('fr')).toEqual({
      connectionFailedTitle: 'Connexion impossible',
      connectionFailed:
        "Impossible de se connecter à l'appareil. Vérifiez qu'il est allumé, " +
        'à proximité et correctement appairé avec votre téléphone, puis réessayez.',
      discoveryFailed:
        'Decouverte des services Bluetooth impossible.',
      productNotRecognized: 'Produit non reconnu.',
      ok: 'OK',
    });
    expect(scanProductConnectionTextFor('fr').connectionFailed)
      .not.toContain("L'appareil n'est pas appairé");
  });
});
