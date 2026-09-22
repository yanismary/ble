import {
  AppLanguage,
  currentAppLanguage,
} from '../../core/services/app-language';

export type AppMainMenuDestination =
  | 'settings'
  | 'help'
  | 'about'
  | 'company'
  | 'contact'
  | 'legal';

export interface AppMainMenuItem {
  readonly destination: AppMainMenuDestination;
  readonly label: string;
  readonly route: readonly string[];
}

const APP_MAIN_MENU_LABELS: Readonly<
  Record<AppLanguage, Readonly<Record<AppMainMenuDestination, string>>>
> = Object.freeze({
  fr: Object.freeze({
    settings: "Configuration de l'application",
    help: 'Aide',
    about: 'À propos',
    company: 'Qui sommes-nous ?',
    contact: 'Contacts',
    legal: 'Conditions d’utilisation',
  }),
  en: Object.freeze({
    settings: 'App configuration',
    help: 'Help',
    about: 'About',
    company: 'Who are we?',
    contact: 'Contacts',
    legal: 'Terms of Use',
  }),
  de: Object.freeze({
    settings: 'App-Einstellungen',
    help: 'Hilfe',
    about: 'Über uns',
    company: 'Wer sind wir?',
    contact: 'Kontakt',
    legal: 'Nutzungsbedingungen',
  }),
  pl: Object.freeze({
    settings: 'Konfiguracja aplikacji',
    help: 'Pomoc',
    about: 'O aplikacji',
    company: 'Kim jesteśmy?',
    contact: 'Kontakt',
    legal: 'Warunki użytkowania',
  }),
});

const APP_MAIN_MENU_BUTTON_LABELS: Readonly<Record<AppLanguage, string>> =
  Object.freeze({
    fr: 'Ouvrir le menu principal',
    en: 'Open main menu',
    de: 'Hauptmenü öffnen',
    pl: 'Otwórz menu główne',
  });

const APP_MAIN_MENU_ROUTES: Readonly<
  Record<AppMainMenuDestination, readonly string[]>
> = Object.freeze({
  settings: Object.freeze(['/settings']),
  help: Object.freeze(['/help']),
  about: Object.freeze(['/app-info']),
  company: Object.freeze(['/company-info']),
  contact: Object.freeze(['/contact']),
  legal: Object.freeze(['/legal-notice']),
});

const APP_MAIN_MENU_ORDER: readonly AppMainMenuDestination[] = Object.freeze([
  'settings',
  'help',
  'about',
  'company',
  'contact',
  'legal',
]);

export function appMainMenuItemsFor(
  language: AppLanguage = currentAppLanguage(),
): readonly AppMainMenuItem[] {
  const labels = APP_MAIN_MENU_LABELS[language];
  return Object.freeze(APP_MAIN_MENU_ORDER.map((destination) => Object.freeze({
    destination,
    label: labels[destination],
    route: APP_MAIN_MENU_ROUTES[destination],
  })));
}

export function appMainMenuButtonLabelFor(
  language: AppLanguage = currentAppLanguage(),
): string {
  return APP_MAIN_MENU_BUTTON_LABELS[language];
}
