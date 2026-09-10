import {
  AppLanguage,
  resolveAppLanguage,
} from '../../core/services/app-language';

export type HelpPlatform = 'android' | 'ios' | 'web';
export type HelpProduct = 'widoor' | 'moventiv-garline';

export interface HelpSectionText {
  readonly title: string;
  readonly steps: readonly string[];
}

export interface HelpProductText {
  readonly title: string;
  readonly pairing: HelpSectionText;
  readonly troubleshooting: HelpSectionText;
}

export interface HelpPageText {
  readonly title: string;
  readonly productChoiceTitle: string;
  readonly products: Record<HelpProduct, string>;
  readonly productHelp: Record<HelpProduct, HelpProductText>;
}

const FR_PAIRING_TROUBLESHOOTING: HelpSectionText = Object.freeze({
  title: 'Difficulte d\u2019appairage',
  steps: Object.freeze([
    'Verifiez que le Bluetooth est active sur le smartphone.',
    'Rapprochez le telephone de la motorisation puis relancez la recherche.',
    'Verifiez que la motorisation n\u2019est pas deja connectee a un autre telephone.',
    'Si un ancien jumelage bloque la connexion, supprimez-le depuis les reglages Bluetooth du telephone.',
  ]),
});

const EN_PAIRING_TROUBLESHOOTING: HelpSectionText = Object.freeze({
  title: 'Pairing issues',
  steps: Object.freeze([
    'Check that Bluetooth is enabled on the smartphone.',
    'Move the phone closer to the motor, then start discovery again.',
    'Check that the motor is not already connected to another phone.',
    'If old pairing data blocks the connection, remove it from the phone Bluetooth settings.',
  ]),
});

const DE_PAIRING_TROUBLESHOOTING: HelpSectionText = Object.freeze({
  title: 'Verbindungsprobleme',
  steps: Object.freeze([
    'Prufen Sie, ob Bluetooth auf dem Smartphone aktiviert ist.',
    'Bringen Sie das Telefon naher an den Motor und starten Sie die Suche erneut.',
    'Prufen Sie, ob der Motor nicht bereits mit einem anderen Telefon verbunden ist.',
    'Wenn eine alte Kopplung die Verbindung blockiert, entfernen Sie sie in den Bluetooth-Einstellungen des Telefons.',
  ]),
});

const PL_PAIRING_TROUBLESHOOTING: HelpSectionText = Object.freeze({
  title: 'Problemy z parowaniem',
  steps: Object.freeze([
    'Sprawdz, czy Bluetooth jest wlaczony w smartfonie.',
    'Zbliz telefon do napedu i ponownie uruchom wyszukiwanie.',
    'Sprawdz, czy naped nie jest juz polaczony z innym telefonem.',
    'Jesli stare parowanie blokuje polaczenie, usun je w ustawieniach Bluetooth telefonu.',
  ]),
});

const FR_TEXT: HelpPageText = {
  title: 'Aide',
  productChoiceTitle: 'Quel produit souhaitez-vous appairer ?',
  products: {
    widoor: 'WIDOOR',
    'moventiv-garline': 'MOVENTIV / GARLINE',
  },
  productHelp: {
    widoor: {
      title: 'WIDOOR',
      pairing: {
        title: 'Appairage',
        steps: [
          'Placez-vous a proximite de la motorisation WIDOOR alimentee.',
          'Sur la motorisation, placez le switch 1 sur OFF.',
          'Activez le Bluetooth du telephone puis lancez la recherche dans l\u2019application.',
          'Appuyez sur le bouton PRG : l\u2019indicateur doit rester allume en magenta.',
          'Selectionnez le produit WIDOOR detecte pour lancer la connexion.',
        ],
      },
      troubleshooting: FR_PAIRING_TROUBLESHOOTING,
    },
    'moventiv-garline': {
      title: 'MOVENTIV/GARLINE',
      pairing: {
        title: 'Appairage',
        steps: [
          'Placez-vous a proximite de la motorisation alimentee.',
          'Sur la motorisation, placez le switch 1 sur OFF.',
          'Activez le Bluetooth du telephone puis lancez la recherche dans l\u2019application.',
          'Appuyez sur le bouton PRG : l\u2019indicateur doit rester allume en magenta.',
          'Selectionnez le produit MOVENTIV ou GARLINE detecte pour lancer la connexion.',
        ],
      },
      troubleshooting: FR_PAIRING_TROUBLESHOOTING,
    },
  },
};

const EN_TEXT: HelpPageText = {
  title: 'Help',
  productChoiceTitle: 'Which product do you want to pair?',
  products: {
    widoor: 'WIDOOR',
    'moventiv-garline': 'MOVENTIV / GARLINE',
  },
  productHelp: {
    widoor: {
      title: 'WIDOOR',
      pairing: {
        title: 'Pairing',
        steps: [
          'Stay close to the powered WIDOOR motor.',
          'On the motor, set switch 1 to OFF.',
          'Enable Bluetooth on the phone, then start discovery in the app.',
          'Press the PRG button: the indicator must remain lit in magenta.',
          'Select the detected WIDOOR product to start the connection.',
        ],
      },
      troubleshooting: EN_PAIRING_TROUBLESHOOTING,
    },
    'moventiv-garline': {
      title: 'MOVENTIV/GARLINE',
      pairing: {
        title: 'Pairing',
        steps: [
          'Stay close to the powered motor.',
          'On the motor, set switch 1 to OFF.',
          'Enable Bluetooth on the phone, then start discovery in the app.',
          'Press the PRG button: the indicator must remain lit in magenta.',
          'Select the detected MOVENTIV or GARLINE product to start the connection.',
        ],
      },
      troubleshooting: EN_PAIRING_TROUBLESHOOTING,
    },
  },
};

const DE_TEXT: HelpPageText = {
  title: 'Hilfe',
  productChoiceTitle: 'Welches Produkt mochten Sie koppeln?',
  products: {
    widoor: 'WIDOOR',
    'moventiv-garline': 'MOVENTIV / GARLINE',
  },
  productHelp: {
    widoor: {
      title: 'WIDOOR',
      pairing: {
        title: 'Verbindung',
        steps: [
          'Bleiben Sie in der Nahe des eingeschalteten WIDOOR Motors.',
          'Stellen Sie am Motor den Switch 1 auf OFF.',
          'Aktivieren Sie Bluetooth am Telefon und starten Sie die Suche in der App.',
          'Drucken Sie die PRG-Taste: die Anzeige muss dauerhaft magenta leuchten.',
          'Wahlen Sie das erkannte WIDOOR Produkt aus, um die Verbindung zu starten.',
        ],
      },
      troubleshooting: DE_PAIRING_TROUBLESHOOTING,
    },
    'moventiv-garline': {
      title: 'MOVENTIV/GARLINE',
      pairing: {
        title: 'Verbindung',
        steps: [
          'Bleiben Sie in der Nahe des eingeschalteten Motors.',
          'Stellen Sie am Motor den Switch 1 auf OFF.',
          'Aktivieren Sie Bluetooth am Telefon und starten Sie die Suche in der App.',
          'Drucken Sie die PRG-Taste: die Anzeige muss dauerhaft magenta leuchten.',
          'Wahlen Sie das erkannte MOVENTIV oder GARLINE Produkt aus, um die Verbindung zu starten.',
        ],
      },
      troubleshooting: DE_PAIRING_TROUBLESHOOTING,
    },
  },
};

const PL_TEXT: HelpPageText = {
  title: 'Pomoc',
  productChoiceTitle: 'Ktory produkt chcesz sparowac?',
  products: {
    widoor: 'WIDOOR',
    'moventiv-garline': 'MOVENTIV / GARLINE',
  },
  productHelp: {
    widoor: {
      title: 'WIDOOR',
      pairing: {
        title: 'Parowanie',
        steps: [
          'Pozostan blisko zasilonego napedu WIDOOR.',
          'Po stronie napedu ustaw przelacznik 1 w pozycji OFF.',
          'Wlacz Bluetooth w telefonie, a nastepnie uruchom wyszukiwanie w aplikacji.',
          'Nacisnij przycisk PRG: wskaznik powinien swiecic stale na kolor magenta.',
          'Wybierz wykryty produkt WIDOOR, aby rozpoczac polaczenie.',
        ],
      },
      troubleshooting: PL_PAIRING_TROUBLESHOOTING,
    },
    'moventiv-garline': {
      title: 'MOVENTIV/GARLINE',
      pairing: {
        title: 'Parowanie',
        steps: [
          'Pozostan blisko zasilonego napedu.',
          'Po stronie napedu ustaw przelacznik 1 w pozycji OFF.',
          'Wlacz Bluetooth w telefonie, a nastepnie uruchom wyszukiwanie w aplikacji.',
          'Nacisnij przycisk PRG: wskaznik powinien swiecic stale na kolor magenta.',
          'Wybierz wykryty produkt MOVENTIV lub GARLINE, aby rozpoczac polaczenie.',
        ],
      },
      troubleshooting: PL_PAIRING_TROUBLESHOOTING,
    },
  },
};

const HELP_TEXT: Record<AppLanguage, HelpPageText> = {
  fr: FR_TEXT,
  en: EN_TEXT,
  de: DE_TEXT,
  pl: PL_TEXT,
};

export function helpPageTextFor(
  language: string | null | undefined,
): HelpPageText {
  return HELP_TEXT[resolveAppLanguage(language)];
}

export function helpProductTextFor(
  language: string | null | undefined,
  platform: HelpPlatform,
  product: HelpProduct,
): HelpProductText {
  const text = helpPageTextFor(language);
  const productText = text.productHelp[product];

  return {
    ...productText,
    pairing: {
      ...productText.pairing,
      steps: [
        ...productText.pairing.steps,
        platformPairingStep(resolveAppLanguage(language), platform),
      ],
    },
  };
}

function platformPairingStep(
  language: AppLanguage,
  platform: HelpPlatform,
): string {
  return platform === 'ios'
    ? iosPairingStep(language)
    : androidPairingStep(language);
}

function androidPairingStep(language: AppLanguage): string {
  switch (language) {
    case 'fr':
      return 'Appuyez sur \u00ab Associer \u00bb lorsque la fenetre d\u2019appairage Android apparait.';
    case 'de':
      return 'Tippen Sie auf \u00ab Koppeln \u00bb, wenn das Android-Kopplungsfenster erscheint.';
    case 'pl':
      return 'Nacisnij \u00ab Sparuj \u00bb, gdy pojawi sie okno parowania systemu Android.';
    case 'en':
    default:
      return 'Tap \u00ab Pair \u00bb when the Android pairing dialog appears.';
  }
}

function iosPairingStep(language: AppLanguage): string {
  switch (language) {
    case 'fr':
      return 'Appuyez sur \u00ab Jumeler \u00bb lorsque la fenetre d\u2019appairage iOS apparait.';
    case 'de':
      return 'Tippen Sie auf \u00ab Koppeln \u00bb, wenn das iOS-Kopplungsfenster erscheint.';
    case 'pl':
      return 'Nacisnij \u00ab Polacz w pare \u00bb, gdy pojawi sie okno parowania systemu iOS.';
    case 'en':
    default:
      return 'Tap \u00ab Pair \u00bb when the iOS pairing dialog appears.';
  }
}
