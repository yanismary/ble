export type AppInfoLanguage = 'fr' | 'en' | 'de' | 'pl';

export interface AppInfoCopy {
  readonly aboutTitle: string;
  readonly aboutContentTitle: string;
  readonly versionLabel: string;
  readonly description: string;
  readonly connectionDescription: string;
  readonly supportedProductsTitle: string;
  readonly supportedProducts: readonly string[];
  readonly phase2Description: string;
  readonly modernizationDescription: string;
  readonly compatibilityNotice: string;
  readonly developerLabel: string;
  readonly aboutAddressLines: readonly string[];
  readonly supportLabel: string;
  readonly contactTitle: string;
  readonly sendMessage: string;
  readonly supportEmail: string;
  readonly supportEmailHref: string;
  readonly companyName: string;
  readonly phoneLabel: string;
  readonly phoneHref: string;
  readonly addressLines: readonly string[];
  readonly companyInfoLabel: string;
  readonly legalNoticeLabel: string;
}

const SUPPORT_EMAIL = 'appsupport@mantion-smt.fr';
const ABOUT_ADDRESS_LINES = Object.freeze([
  '2 rue des Métiers', '21110 Genlis — France',
]);
const SUPPORTED_PRODUCTS = Object.freeze([
  'WIDOOR', 'MOVENTIV 60', 'MOVENTIV 80', 'GARLINE',
]);

const ABOUT_COPY: Readonly<Record<AppInfoLanguage, Pick<AppInfoCopy,
  | 'aboutTitle'
  | 'aboutContentTitle'
  | 'versionLabel'
  | 'description'
  | 'connectionDescription'
  | 'supportedProductsTitle'
  | 'phase2Description'
  | 'modernizationDescription'
  | 'compatibilityNotice'
  | 'developerLabel'
  | 'supportLabel'
  | 'legalNoticeLabel'
>>> = {
  fr: {
    aboutTitle: 'À propos',
    aboutContentTitle: 'MANTION Door Control',
    versionLabel: 'Version :',
    description: 'MANTION Door Control est l’application mobile de MANTION SMT dédiée au pilotage, à la configuration et au diagnostic des motorisations MANTION compatibles.',
    connectionDescription: 'L’application communique directement avec les équipements à proximité grâce au Bluetooth Low Energy (BLE).',
    supportedProductsTitle: 'Motorisations prises en charge',
    phase2Description: 'Cette nouvelle génération de l’application regroupe dans une interface unique les fonctionnalités auparavant réparties entre plusieurs applications MANTION.',
    modernizationDescription: 'La version 2.1 repose sur une architecture modernisée afin d’améliorer la compatibilité avec les versions récentes d’Android et d’iOS ainsi que la stabilité, les performances et la maintenabilité de l’application.',
    compatibilityNotice: 'Les fonctionnalités disponibles peuvent varier selon le modèle de motorisation, sa version matérielle et sa version logicielle.',
    developerLabel: 'Développé par MANTION SMT',
    supportLabel: 'Support application :',
    legalNoticeLabel: 'Conditions d’utilisation',
  },
  en: {
    aboutTitle: 'About',
    aboutContentTitle: 'MANTION Door Control',
    versionLabel: 'Version:',
    description: 'MANTION Door Control is the MANTION SMT mobile app for operating, configuring and diagnosing compatible MANTION motorized systems.',
    connectionDescription: 'The app communicates directly with nearby equipment using Bluetooth Low Energy (BLE).',
    supportedProductsTitle: 'Supported motorized systems',
    phase2Description: 'This new generation brings together in a single interface features previously spread across several MANTION apps.',
    modernizationDescription: 'Version 2.1 is built on a modernized architecture to improve compatibility with recent Android and iOS versions, as well as the app’s stability, performance and maintainability.',
    compatibilityNotice: 'Available features may vary depending on the motorized system model and its hardware and software versions.',
    developerLabel: 'Developed by MANTION SMT',
    supportLabel: 'App support:',
    legalNoticeLabel: 'Terms of Use',
  },
  de: {
    aboutTitle: 'Über die App',
    aboutContentTitle: 'MANTION Door Control',
    versionLabel: 'Version:',
    description: 'MANTION Door Control ist die mobile App von MANTION SMT zur Steuerung, Konfiguration und Diagnose kompatibler MANTION-Antriebe.',
    connectionDescription: 'Die App kommuniziert über Bluetooth Low Energy (BLE) direkt mit Antrieben in der Nähe.',
    supportedProductsTitle: 'Unterstützte Antriebe',
    phase2Description: 'Diese neue App-Generation vereint Funktionen, die bisher auf mehrere MANTION-Apps verteilt waren, in einer Oberfläche.',
    modernizationDescription: 'Version 2.1 basiert auf einer modernisierten Architektur. Sie verbessert die Kompatibilität mit aktuellen Android- und iOS-Versionen sowie Stabilität, Leistung und Wartbarkeit der App.',
    compatibilityNotice: 'Die verfügbaren Funktionen können je nach Antriebsmodell sowie dessen Hardware- und Softwareversion variieren.',
    developerLabel: 'Entwickelt von MANTION SMT',
    supportLabel: 'App-Support:',
    legalNoticeLabel: 'Nutzungsbedingungen',
  },
  pl: {
    aboutTitle: 'O aplikacji',
    aboutContentTitle: 'MANTION Door Control',
    versionLabel: 'Wersja:',
    description: 'MANTION Door Control to aplikacja mobilna MANTION SMT służąca do sterowania, konfiguracji i diagnostyki zgodnych napędów MANTION.',
    connectionDescription: 'Aplikacja komunikuje się bezpośrednio z pobliskimi urządzeniami za pomocą Bluetooth Low Energy (BLE).',
    supportedProductsTitle: 'Obsługiwane napędy',
    phase2Description: 'Ta nowa generacja aplikacji łączy w jednym interfejsie funkcje dostępne wcześniej w kilku aplikacjach MANTION.',
    modernizationDescription: 'Wersja 2.1 opiera się na unowocześnionej architekturze, która poprawia zgodność z nowszymi wersjami Androida i iOS oraz stabilność, wydajność i łatwość utrzymania aplikacji.',
    compatibilityNotice: 'Dostępne funkcje mogą się różnić w zależności od modelu napędu oraz wersji jego sprzętu i oprogramowania.',
    developerLabel: 'Opracowano przez MANTION SMT',
    supportLabel: 'Pomoc dotycząca aplikacji:',
    legalNoticeLabel: 'Warunki użytkowania',
  },
};

const CONTACT_COPY: Readonly<Record<AppInfoLanguage, Pick<AppInfoCopy,
  | 'contactTitle'
  | 'sendMessage'
  | 'companyName'
  | 'phoneLabel'
  | 'phoneHref'
  | 'addressLines'
  | 'companyInfoLabel'
>>> = {
  fr: {
    contactTitle: 'Contact',
    sendMessage: 'Envoyer un message',
    companyName: 'MANTION SMT',
    phoneLabel: 'Tél +33 (0)3 80 37 85 71',
    phoneHref: 'tel:+33380378571',
    addressLines: ['France', '2 rue des métiers', '21110 Genlis'],
    companyInfoLabel: 'Qui sommes-nous ?',
  },
  en: {
    contactTitle: 'Contact',
    sendMessage: 'Send a message',
    companyName: 'MANTION SMT',
    phoneLabel: 'Call +33 (0)3 80 37 85 71',
    phoneHref: 'tel:+33380378571',
    addressLines: ['France', '2 rue des métiers', '21110 Genlis'],
    companyInfoLabel: 'Who are we?',
  },
  de: {
    contactTitle: 'Kontakt',
    sendMessage: 'Senden Sie eine Nachricht',
    companyName: 'MANTION Baubeschläge GmbH',
    phoneLabel: 'Tel +49 2056 582690',
    phoneHref: 'tel:+492056582690',
    addressLines: ['Deutschland', 'Dieselstr. 18', '42579 Heiligenhaus'],
    companyInfoLabel: 'Wer sind wir?',
  },
  pl: {
    contactTitle: 'Kontakt',
    sendMessage: 'Wyślij wiadomość',
    companyName: 'MANTION SMT',
    phoneLabel: 'Zadzwoń +33 (0)3 80 37 85 71',
    phoneHref: 'tel:+33380378571',
    addressLines: ['FRANCJA', '2 rue des métiers', '21110 Genlis'],
    companyInfoLabel: 'Kim jesteśmy?',
  },
};

export function normalizeAppInfoLanguage(
  value: string | null,
): AppInfoLanguage {
  return value === 'fr' || value === 'en' || value === 'de' || value === 'pl'
    ? value
    : 'en';
}

export function appInfoCopyFor(language: AppInfoLanguage): AppInfoCopy {
  return Object.freeze({
    ...ABOUT_COPY[language],
    ...CONTACT_COPY[language],
    supportedProducts: SUPPORTED_PRODUCTS,
    aboutAddressLines: ABOUT_ADDRESS_LINES,
    supportEmail: SUPPORT_EMAIL,
    supportEmailHref: `mailto:${SUPPORT_EMAIL}`,
  });
}
