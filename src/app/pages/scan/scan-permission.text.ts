import {
  AppLanguage,
  readStoredAppLanguage,
} from '../../core/services/app-language';

export interface ScanPermissionText {
  readonly firstDenial: string;
  readonly settingsTitle: string;
  readonly repeatedDenial: string;
  readonly blockedDenial: string;
  readonly cancel: string;
  readonly openAppSettings: string;
}

export type ScanPermissionRequirement =
  | 'bluetooth'
  | 'bluetooth-and-location';

const SCAN_BLUETOOTH_PERMISSION_TEXT: Readonly<
  Record<AppLanguage, ScanPermissionText>
> = Object.freeze({
  fr: Object.freeze({
    firstDenial:
      'L’autorisation Bluetooth est nécessaire pour détecter et se ' +
      'connecter aux motorisations.',
    settingsTitle: 'Autorisation requise',
    repeatedDenial:
      'Activez l’autorisation Bluetooth de l’application dans les réglages, ' +
      'puis relancez la recherche.',
    blockedDenial:
      'L’autorisation Bluetooth est nécessaire pour détecter et se connecter ' +
      'aux motorisations. Veuillez l’activer dans les réglages de ' +
      'l’application.',
    cancel: 'Annuler',
    openAppSettings: 'Ouvrir les réglages de l’application',
  }),
  en: Object.freeze({
    firstDenial:
      'Bluetooth permission is required to detect and connect to motors.',
    settingsTitle: 'Permission required',
    repeatedDenial:
      'Enable Bluetooth permission for the app in Settings, then start the ' +
      'search again.',
    blockedDenial:
      'Bluetooth permission is required to detect and connect to motors. ' +
      'Enable it in the app settings.',
    cancel: 'Cancel',
    openAppSettings: 'Open app settings',
  }),
  de: Object.freeze({
    firstDenial:
      'Die Bluetooth-Berechtigung ist erforderlich, um Antriebe zu erkennen ' +
      'und eine Verbindung herzustellen.',
    settingsTitle: 'Berechtigung erforderlich',
    repeatedDenial:
      'Aktivieren Sie die Bluetooth-Berechtigung der App in den Einstellungen ' +
      'und starten Sie die Suche erneut.',
    blockedDenial:
      'Die Bluetooth-Berechtigung ist erforderlich, um Antriebe zu erkennen ' +
      'und eine Verbindung herzustellen. Aktivieren Sie sie in den ' +
      'App-Einstellungen.',
    cancel: 'Abbrechen',
    openAppSettings: 'App-Einstellungen öffnen',
  }),
  pl: Object.freeze({
    firstDenial:
      'Uprawnienie Bluetooth jest wymagane do wykrywania napędów i łączenia ' +
      'się z nimi.',
    settingsTitle: 'Wymagane uprawnienie',
    repeatedDenial:
      'Włącz uprawnienie Bluetooth dla aplikacji w ustawieniach, a następnie ' +
      'ponownie rozpocznij wyszukiwanie.',
    blockedDenial:
      'Uprawnienie Bluetooth jest wymagane do wykrywania napędów i łączenia ' +
      'się z nimi. Włącz je w ustawieniach aplikacji.',
    cancel: 'Anuluj',
    openAppSettings: 'Otwórz ustawienia aplikacji',
  }),
});

const SCAN_LEGACY_PERMISSION_TEXT: Readonly<
  Record<AppLanguage, ScanPermissionText>
> =
  Object.freeze({
    fr: Object.freeze({
      firstDenial:
        'Impossible de lancer la recherche tant que les autorisations ' +
        'Bluetooth et localisation ne sont pas accordées.',
      settingsTitle: 'Autorisations requises',
      repeatedDenial:
        'Activez les autorisations Bluetooth et localisation de ' +
        'l’application dans les réglages, puis relancez la recherche.',
      blockedDenial:
        'Impossible de lancer la recherche tant que les autorisations ' +
        'Bluetooth et localisation ne sont pas accordées. Veuillez les ' +
        'activer dans les réglages de l’application.',
      cancel: 'Annuler',
      openAppSettings: 'Ouvrir les réglages de l’application',
    }),
    en: Object.freeze({
      firstDenial:
        'The search cannot start until Bluetooth and location permissions ' +
        'have been granted.',
      settingsTitle: 'Permissions required',
      repeatedDenial:
        'Enable Bluetooth and location permissions for the app in Settings, ' +
        'then start the search again.',
      blockedDenial:
        'The search cannot start until Bluetooth and location permissions ' +
        'have been granted. Enable them in the app settings.',
      cancel: 'Cancel',
      openAppSettings: 'Open app settings',
    }),
    de: Object.freeze({
      firstDenial:
        'Die Suche kann erst gestartet werden, wenn die Bluetooth- und ' +
        'Standortberechtigungen erteilt wurden.',
      settingsTitle: 'Berechtigungen erforderlich',
      repeatedDenial:
        'Aktivieren Sie die Bluetooth- und Standortberechtigungen der App ' +
        'in den Einstellungen und starten Sie die Suche erneut.',
      blockedDenial:
        'Die Suche kann erst gestartet werden, wenn die Bluetooth- und ' +
        'Standortberechtigungen erteilt wurden. Aktivieren Sie sie in den ' +
        'App-Einstellungen.',
      cancel: 'Abbrechen',
      openAppSettings: 'App-Einstellungen öffnen',
    }),
    pl: Object.freeze({
      firstDenial:
        'Nie można rozpocząć wyszukiwania, dopóki nie zostaną przyznane ' +
        'uprawnienia Bluetooth i lokalizacji.',
      settingsTitle: 'Wymagane uprawnienia',
      repeatedDenial:
        'Włącz uprawnienia Bluetooth i lokalizacji dla aplikacji w ' +
        'ustawieniach, a następnie ponownie rozpocznij wyszukiwanie.',
      blockedDenial:
        'Nie można rozpocząć wyszukiwania, dopóki nie zostaną przyznane ' +
        'uprawnienia Bluetooth i lokalizacji. Włącz je w ustawieniach aplikacji.',
      cancel: 'Anuluj',
      openAppSettings: 'Otwórz ustawienia aplikacji',
    }),
  });

export function scanPermissionTextFor(
  language: AppLanguage = readStoredAppLanguage(),
  requirement: ScanPermissionRequirement = 'bluetooth',
): ScanPermissionText {
  return requirement === 'bluetooth-and-location'
    ? SCAN_LEGACY_PERMISSION_TEXT[language]
    : SCAN_BLUETOOTH_PERMISSION_TEXT[language];
}
