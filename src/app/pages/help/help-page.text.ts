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
  title: 'Difficulté d’appairage',
  steps: Object.freeze([
    'Vérifiez que le Bluetooth est activé sur le smartphone.',
    'Rapprochez le téléphone de la motorisation puis relancez la recherche.',
    'Vérifiez que la motorisation n’est pas déjà connectée à un autre téléphone.',
    'Si un ancien jumelage bloque la connexion, supprimez-le depuis les réglages Bluetooth du téléphone.',
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
    'Prüfen Sie, ob Bluetooth auf dem Smartphone aktiviert ist.',
    'Bringen Sie das Telefon näher an den Motor und starten Sie die Suche erneut.',
    'Prüfen Sie, ob der Motor nicht bereits mit einem anderen Telefon verbunden ist.',
    'Wenn eine alte Kopplung die Verbindung blockiert, entfernen Sie sie in den Bluetooth-Einstellungen des Telefons.',
  ]),
});

const PL_PAIRING_TROUBLESHOOTING: HelpSectionText = Object.freeze({
  title: 'Problemy z parowaniem',
  steps: Object.freeze([
    'Sprawdź, czy Bluetooth jest włączony w smartfonie.',
    'Zbliż telefon do napędu i ponownie uruchom wyszukiwanie.',
    'Sprawdź, czy napęd nie jest już połączony z innym telefonem.',
    'Jeśli stare parowanie blokuje połączenie, usuń je w ustawieniach Bluetooth telefonu.',
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
          'Placez-vous à proximité de la motorisation WIDOOR alimentée.',
          'Sur la motorisation, placez le switch 1 sur OFF.',
          'Activez le Bluetooth du téléphone puis lancez la recherche dans l’application.',
          'Appuyez sur le bouton PRG : l’indicateur doit rester allumé en magenta.',
          'Sélectionnez le produit WIDOOR détecté pour lancer la connexion.',
        ],
      },
      troubleshooting: FR_PAIRING_TROUBLESHOOTING,
    },
    'moventiv-garline': {
      title: 'MOVENTIV/GARLINE',
      pairing: {
        title: 'Appairage',
        steps: [
          'Placez-vous à proximité de la motorisation alimentée.',
          'Sur la motorisation, placez le switch 1 sur OFF.',
          'Activez le Bluetooth du téléphone puis lancez la recherche dans l’application.',
          'Appuyez sur le bouton PRG : l’indicateur doit rester allumé en magenta.',
          'Sélectionnez le produit MOVENTIV ou GARLINE détecté pour lancer la connexion.',
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
          'Bleiben Sie in der Nähe des eingeschalteten WIDOOR-Motors.',
          'Stellen Sie am Motor den Switch 1 auf OFF.',
          'Aktivieren Sie Bluetooth am Telefon und starten Sie die Suche in der App.',
          'Drücken Sie die PRG-Taste: Die Anzeige muss dauerhaft magenta leuchten.',
          'Wählen Sie das erkannte WIDOOR-Produkt aus, um die Verbindung zu starten.',
        ],
      },
      troubleshooting: DE_PAIRING_TROUBLESHOOTING,
    },
    'moventiv-garline': {
      title: 'MOVENTIV/GARLINE',
      pairing: {
        title: 'Verbindung',
        steps: [
          'Bleiben Sie in der Nähe des eingeschalteten Motors.',
          'Stellen Sie am Motor den Switch 1 auf OFF.',
          'Aktivieren Sie Bluetooth am Telefon und starten Sie die Suche in der App.',
          'Drücken Sie die PRG-Taste: Die Anzeige muss dauerhaft magenta leuchten.',
          'Wählen Sie das erkannte MOVENTIV- oder GARLINE-Produkt aus, um die Verbindung zu starten.',
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
          'Pozostań blisko zasilanego napędu WIDOOR.',
          'Po stronie napędu ustaw przełącznik 1 w pozycji OFF.',
          'Włącz Bluetooth w telefonie, a następnie uruchom wyszukiwanie w aplikacji.',
          'Naciśnij przycisk PRG: wskaźnik powinien świecić stale na kolor magenta.',
          'Wybierz wykryty produkt WIDOOR, aby rozpocząć połączenie.',
        ],
      },
      troubleshooting: PL_PAIRING_TROUBLESHOOTING,
    },
    'moventiv-garline': {
      title: 'MOVENTIV/GARLINE',
      pairing: {
        title: 'Parowanie',
        steps: [
          'Pozostań blisko zasilanego napędu.',
          'Po stronie napędu ustaw przełącznik 1 w pozycji OFF.',
          'Włącz Bluetooth w telefonie, a następnie uruchom wyszukiwanie w aplikacji.',
          'Naciśnij przycisk PRG: wskaźnik powinien świecić stale na kolor magenta.',
          'Wybierz wykryty produkt MOVENTIV lub GARLINE, aby rozpocząć połączenie.',
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
      return 'Appuyez sur « Associer » lorsque la fenêtre d’appairage Android apparaît.';
    case 'de':
      return 'Tippen Sie auf „Koppeln“, wenn das Android-Kopplungsfenster erscheint.';
    case 'pl':
      return 'Naciśnij „Sparuj”, gdy pojawi się okno parowania systemu Android.';
    case 'en':
    default:
      return 'Tap \u00ab Pair \u00bb when the Android pairing dialog appears.';
  }
}

function iosPairingStep(language: AppLanguage): string {
  switch (language) {
    case 'fr':
      return 'Appuyez sur « Jumeler » lorsque la fenêtre d’appairage iOS apparaît.';
    case 'de':
      return 'Tippen Sie auf „Koppeln“, wenn das iOS-Kopplungsfenster erscheint.';
    case 'pl':
      return 'Naciśnij „Połącz w parę”, gdy pojawi się okno parowania systemu iOS.';
    case 'en':
    default:
      return 'Tap \u00ab Pair \u00bb when the iOS pairing dialog appears.';
  }
}
