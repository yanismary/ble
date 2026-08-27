import {
  AppLanguage,
  readStoredAppLanguage,
} from '../../core/services/app-language';

export interface ScanProductConnectionText {
  readonly connectionFailed: string;
  readonly discoveryFailed: string;
  readonly productNotRecognized: string;
}

const SCAN_PRODUCT_CONNECTION_TEXT: Readonly<
  Record<AppLanguage, ScanProductConnectionText>
> = Object.freeze({
  fr: Object.freeze({
    connectionFailed:
      'Connexion Bluetooth impossible. Veuillez réessayer.',
    discoveryFailed:
      'Decouverte des services Bluetooth impossible.',
    productNotRecognized: 'Produit non reconnu.',
  }),
  en: Object.freeze({
    connectionFailed:
      'Bluetooth connection failed. Please try again.',
    discoveryFailed:
      'Bluetooth service discovery failed.',
    productNotRecognized: 'Product not recognized.',
  }),
  de: Object.freeze({
    connectionFailed:
      'Bluetooth-Verbindung fehlgeschlagen. Bitte versuchen Sie es erneut.',
    discoveryFailed:
      'Die Bluetooth-Dienste konnten nicht gefunden werden.',
    productNotRecognized: 'Produkt nicht erkannt.',
  }),
  pl: Object.freeze({
    connectionFailed:
      'Połączenie Bluetooth nie powiodło się. Spróbuj ponownie.',
    discoveryFailed:
      'Nie udało się wykryć usług Bluetooth.',
    productNotRecognized: 'Produkt nierozpoznany.',
  }),
});

export function scanProductConnectionTextFor(
  language: AppLanguage = readStoredAppLanguage(),
): ScanProductConnectionText {
  return SCAN_PRODUCT_CONNECTION_TEXT[language];
}
