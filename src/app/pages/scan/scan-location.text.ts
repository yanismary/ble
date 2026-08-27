import {
  AppLanguage,
  readStoredAppLanguage,
} from '../../core/services/app-language';

export interface ScanLocationText {
  readonly disabledTitle: string;
  readonly disabledMessage: string;
  readonly cancel: string;
  readonly openSettings: string;
}

const SCAN_LOCATION_TEXT: Readonly<Record<AppLanguage, ScanLocationText>> =
  Object.freeze({
    fr: Object.freeze({
      disabledTitle: 'Localisation désactivée',
      disabledMessage:
        'Activez la localisation du téléphone pour autoriser le scan ' +
        'Bluetooth, puis relancez la recherche.',
      cancel: 'Annuler',
      openSettings: 'Ouvrir les réglages de localisation',
    }),
    en: Object.freeze({
      disabledTitle: 'Location disabled',
      disabledMessage:
        'Enable phone location services to allow Bluetooth scanning, then ' +
        'start the search again.',
      cancel: 'Cancel',
      openSettings: 'Open location settings',
    }),
    de: Object.freeze({
      disabledTitle: 'Standort deaktiviert',
      disabledMessage:
        'Aktivieren Sie die Standortdienste des Telefons, um die ' +
        'Bluetooth-Suche zu ermöglichen, und starten Sie die Suche erneut.',
      cancel: 'Abbrechen',
      openSettings: 'Standorteinstellungen öffnen',
    }),
    pl: Object.freeze({
      disabledTitle: 'Lokalizacja wyłączona',
      disabledMessage:
        'Włącz usługi lokalizacji telefonu, aby umożliwić skanowanie ' +
        'Bluetooth, a następnie ponownie rozpocznij wyszukiwanie.',
      cancel: 'Anuluj',
      openSettings: 'Otwórz ustawienia lokalizacji',
    }),
  });

export function scanLocationTextFor(
  language: AppLanguage = readStoredAppLanguage(),
): ScanLocationText {
  return SCAN_LOCATION_TEXT[language];
}
