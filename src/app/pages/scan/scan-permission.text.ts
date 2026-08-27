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

const SCAN_PERMISSION_TEXT: Readonly<Record<AppLanguage, ScanPermissionText>> =
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
): ScanPermissionText {
  return SCAN_PERMISSION_TEXT[language];
}
