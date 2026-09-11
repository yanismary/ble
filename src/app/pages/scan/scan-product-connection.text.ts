import {
  AppLanguage,
  readStoredAppLanguage,
} from '../../core/services/app-language';

export interface ScanProductConnectionText {
  readonly connectionFailedTitle: string;
  readonly connectionFailed: string;
  readonly discoveryFailed: string;
  readonly productNotRecognized: string;
  readonly ok: string;
}

const SCAN_PRODUCT_CONNECTION_TEXT: Readonly<
  Record<AppLanguage, ScanProductConnectionText>
> = Object.freeze({
  fr: Object.freeze({
    connectionFailedTitle: 'Connexion impossible',
    connectionFailed:
      "Impossible de se connecter à l'appareil. Vérifiez qu'il est allumé, " +
      'à proximité et correctement appairé avec votre téléphone, puis réessayez.',
    discoveryFailed:
      'Découverte des services Bluetooth impossible.',
    productNotRecognized: 'Produit non reconnu.',
    ok: 'OK',
  }),
  en: Object.freeze({
    connectionFailedTitle: 'Unable to connect',
    connectionFailed:
      'Unable to connect to the device. Make sure it is turned on, nearby, ' +
      'and properly paired with your phone, then try again.',
    discoveryFailed:
      'Bluetooth service discovery failed.',
    productNotRecognized: 'Product not recognized.',
    ok: 'OK',
  }),
  de: Object.freeze({
    connectionFailedTitle: 'Verbindung nicht möglich',
    connectionFailed:
      'Es konnte keine Verbindung zum Gerät hergestellt werden. Stellen Sie ' +
      'sicher, dass es eingeschaltet, in der Nähe und ordnungsgemäß mit Ihrem ' +
      'Telefon gekoppelt ist, und versuchen Sie es erneut.',
    discoveryFailed:
      'Die Bluetooth-Dienste konnten nicht gefunden werden.',
    productNotRecognized: 'Produkt nicht erkannt.',
    ok: 'OK',
  }),
  pl: Object.freeze({
    connectionFailedTitle: 'Nie można nawiązać połączenia',
    connectionFailed:
      'Nie można połączyć się z urządzeniem. Upewnij się, że jest włączone, ' +
      'znajduje się w pobliżu i jest prawidłowo sparowane z telefonem, a ' +
      'następnie spróbuj ponownie.',
    discoveryFailed:
      'Nie udało się wykryć usług Bluetooth.',
    productNotRecognized: 'Produkt nierozpoznany.',
    ok: 'OK',
  }),
});

export function scanProductConnectionTextFor(
  language: AppLanguage = readStoredAppLanguage(),
): ScanProductConnectionText {
  return SCAN_PRODUCT_CONNECTION_TEXT[language];
}
