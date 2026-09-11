import {
  AppLanguage,
  readStoredAppLanguage,
} from '../../core/services/app-language';

export interface ScanSurfaceText {
  readonly title: string;
  readonly search: string;
  readonly searching: string;
  readonly noMotorDetected: string;
  readonly name: string;
  readonly macAddress: string;
  readonly uuidAddress: string;
  readonly signalQuality: string;
  readonly connecting: string;
  readonly info: string;
  readonly demo: string;
}

const SCAN_SURFACE_TEXT: Readonly<Record<AppLanguage, ScanSurfaceText>> =
  Object.freeze({
    fr: Object.freeze({
      title: 'Sélection',
      search: 'Rechercher',
      searching: 'Recherche en cours...',
      noMotorDetected: 'Aucune motorisation détectée.',
      name: 'Nom :',
      macAddress: 'MAC:',
      uuidAddress: 'UUID:',
      signalQuality: 'Qualité du signal :',
      connecting: 'Connexion en cours...',
      info: 'Info',
      demo: 'Démo',
    }),
    en: Object.freeze({
      title: 'Selection',
      search: 'Search',
      searching: 'Searching in progress...',
      noMotorDetected: 'No motor detected.',
      name: 'Name:',
      macAddress: 'MAC:',
      uuidAddress: 'UUID:',
      signalQuality: 'Signal quality:',
      connecting: 'Connecting...',
      info: 'Info',
      demo: 'Demo',
    }),
    de: Object.freeze({
      title: 'Auswahl',
      search: 'Suchen',
      searching: 'Suche läuft...',
      noMotorDetected: 'Kein Motor gefunden.',
      name: 'Name:',
      macAddress: 'MAC:',
      uuidAddress: 'UUID:',
      signalQuality: 'Signalstärke:',
      connecting: 'Verbindung wird hergestellt...',
      info: 'Info',
      demo: 'Demo',
    }),
    pl: Object.freeze({
      title: 'Wybór napędów',
      search: 'Wyszukiwanie',
      searching: 'Wyszukiwanie w trakcie...',
      noMotorDetected: 'Nie znaleziono napędu.',
      name: 'Nazwa:',
      macAddress: 'MAC:',
      uuidAddress: 'UUID:',
      signalQuality: 'Jakość sygnału:',
      connecting: 'Łączenie...',
      info: 'Info',
      demo: 'Demo',
    }),
  });

export function scanSurfaceTextFor(
  language: AppLanguage = readStoredAppLanguage(),
): ScanSurfaceText {
  return SCAN_SURFACE_TEXT[language];
}
