import {
  AppLanguage,
  readStoredAppLanguage,
} from '../../core/services/app-language';

export interface ScanErrorText {
  readonly genericFailure: string;
  readonly bluetoothNotReady: string;
}

const SCAN_ERROR_TEXT: Readonly<Record<AppLanguage, ScanErrorText>> =
  Object.freeze({
    fr: Object.freeze({
      genericFailure:
        'La recherche Bluetooth a échoué. Veuillez réessayer.',
      bluetoothNotReady:
        'Le Bluetooth de l’application n’est pas prêt. Veuillez relancer ' +
        'la recherche.',
    }),
    en: Object.freeze({
      genericFailure: 'Bluetooth search failed. Please try again.',
      bluetoothNotReady:
        'The app Bluetooth is not ready. Please start the search again.',
    }),
    de: Object.freeze({
      genericFailure:
        'Die Bluetooth-Suche ist fehlgeschlagen. Bitte versuchen Sie es erneut.',
      bluetoothNotReady:
        'Bluetooth ist in der App noch nicht bereit. Bitte starten Sie die ' +
        'Suche erneut.',
    }),
    pl: Object.freeze({
      genericFailure:
        'Wyszukiwanie Bluetooth nie powiodło się. Spróbuj ponownie.',
      bluetoothNotReady:
        'Bluetooth w aplikacji nie jest jeszcze gotowy. Uruchom wyszukiwanie ' +
        'ponownie.',
    }),
  });

export function scanErrorTextFor(
  language: AppLanguage = readStoredAppLanguage(),
): ScanErrorText {
  return SCAN_ERROR_TEXT[language];
}
