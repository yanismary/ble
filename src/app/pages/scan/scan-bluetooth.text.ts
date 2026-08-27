import {
  AppLanguage,
  readStoredAppLanguage,
} from '../../core/services/app-language';

export interface ScanBluetoothText {
  readonly disabledTitle: string;
  readonly disabledMessage: string;
  readonly cancel: string;
  readonly enable: string;
  readonly settingsTitle: string;
  readonly androidSettingsMessage: string;
  readonly iosSettingsMessage: string;
  readonly ok: string;
  readonly openBluetoothSettings: string;
  readonly openAppSettings: string;
}

const SCAN_BLUETOOTH_TEXT: Readonly<Record<AppLanguage, ScanBluetoothText>> =
  Object.freeze({
    fr: Object.freeze({
      disabledTitle: 'Bluetooth désactivé',
      disabledMessage:
        'Le Bluetooth est actuellement désactivé sur le téléphone. ' +
        'Voulez-vous l’activer et lancer une recherche ?',
      cancel: 'Annuler',
      enable: 'Activer',
      settingsTitle: 'Activation nécessaire',
      androidSettingsMessage:
        'Le Bluetooth n’a pas été activé automatiquement. Activez-le dans ' +
        'les paramètres Bluetooth puis relancez la recherche.',
      iosSettingsMessage:
        'Le Bluetooth doit être activé dans les réglages iOS. Activez-le ' +
        'puis relancez la recherche.',
      ok: 'OK',
      openBluetoothSettings: 'Ouvrir les paramètres Bluetooth',
      openAppSettings: 'Ouvrir les réglages',
    }),
    en: Object.freeze({
      disabledTitle: 'Bluetooth disabled',
      disabledMessage:
        'Bluetooth is currently disabled on the phone. Would you like to ' +
        'enable it and start a search?',
      cancel: 'Cancel',
      enable: 'Enable',
      settingsTitle: 'Activation required',
      androidSettingsMessage:
        'Bluetooth could not be enabled automatically. Enable it in ' +
        'Bluetooth settings, then start the search again.',
      iosSettingsMessage:
        'Bluetooth must be enabled in iOS Settings. Enable it, then start ' +
        'the search again.',
      ok: 'OK',
      openBluetoothSettings: 'Open Bluetooth settings',
      openAppSettings: 'Open Settings',
    }),
    de: Object.freeze({
      disabledTitle: 'Bluetooth deaktiviert',
      disabledMessage:
        'Bluetooth ist derzeit auf dem Telefon deaktiviert. Möchten Sie es ' +
        'aktivieren und eine Suche starten?',
      cancel: 'Abbrechen',
      enable: 'Aktivieren',
      settingsTitle: 'Aktivierung erforderlich',
      androidSettingsMessage:
        'Bluetooth konnte nicht automatisch aktiviert werden. Aktivieren ' +
        'Sie es in den Bluetooth-Einstellungen und starten Sie die Suche erneut.',
      iosSettingsMessage:
        'Bluetooth muss in den iOS-Einstellungen aktiviert werden. ' +
        'Aktivieren Sie es und starten Sie die Suche erneut.',
      ok: 'OK',
      openBluetoothSettings: 'Bluetooth-Einstellungen öffnen',
      openAppSettings: 'Einstellungen öffnen',
    }),
    pl: Object.freeze({
      disabledTitle: 'Bluetooth jest wyłączony',
      disabledMessage:
        'Bluetooth jest obecnie wyłączony w telefonie. Czy chcesz go ' +
        'włączyć i rozpocząć wyszukiwanie?',
      cancel: 'Anuluj',
      enable: 'Włącz',
      settingsTitle: 'Wymagana aktywacja',
      androidSettingsMessage:
        'Nie udało się automatycznie włączyć Bluetooth. Włącz go w ' +
        'ustawieniach Bluetooth, a następnie ponownie rozpocznij wyszukiwanie.',
      iosSettingsMessage:
        'Bluetooth należy włączyć w ustawieniach iOS. Włącz go, a następnie ' +
        'ponownie rozpocznij wyszukiwanie.',
      ok: 'OK',
      openBluetoothSettings: 'Otwórz ustawienia Bluetooth',
      openAppSettings: 'Otwórz ustawienia',
    }),
  });

export function scanBluetoothTextFor(
  language: AppLanguage = readStoredAppLanguage(),
): ScanBluetoothText {
  return SCAN_BLUETOOTH_TEXT[language];
}
