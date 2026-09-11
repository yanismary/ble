import {
  AppLanguage,
  readStoredAppLanguage,
} from '../../core/services/app-language';

export interface ScanExitText {
  readonly message: string;
  readonly cancel: string;
  readonly exit: string;
}

const SCAN_EXIT_TEXT: Readonly<Record<AppLanguage, ScanExitText>> =
  Object.freeze({
    fr: Object.freeze({
      message: "Souhaitez-vous quitter l'application ?",
      cancel: 'Annuler',
      exit: 'Quitter',
    }),
    en: Object.freeze({
      message: 'Would you like to exit the application?',
      cancel: 'Cancel',
      exit: 'Exit',
    }),
    de: Object.freeze({
      message: 'Möchten Sie die Anwendung beenden?',
      cancel: 'Abbrechen',
      exit: 'Beenden',
    }),
    pl: Object.freeze({
      message: 'Czy chcesz zamknąć aplikację?',
      cancel: 'Anuluj',
      exit: 'Zamknij',
    }),
  });

export function scanExitTextFor(
  language: AppLanguage = readStoredAppLanguage(),
): ScanExitText {
  return SCAN_EXIT_TEXT[language];
}
