import {
  AppLanguage,
  resolveAppLanguage,
} from '../../core/services/app-language';

export type HelpPlatform = 'android' | 'ios' | 'web';
export type HelpProduct = 'widoor' | 'moventiv' | 'garline';
export type HelpProductGroup = 'widoor' | 'moventiv-garline';

export interface HelpSectionText {
  readonly title: string;
  readonly steps: readonly string[];
  readonly note?: string;
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
  readonly productHelp: Record<HelpProductGroup, HelpProductText>;
}

const FR_TEXT: HelpPageText = {
  title: 'Aide',
  productChoiceTitle: 'Quel produit souhaitez-vous appairer ?',
  products: {
    widoor: 'WIDOOR',
    moventiv: 'MOVENTIV',
    garline: 'GARLINE',
  },
  productHelp: {
    widoor: {
      title: 'WIDOOR',
      pairing: {
        title: 'Appairage',
        steps: [
          'Placez-vous a proximite de la motorisation WIDOOR alimentee.',
          'Sur la motorisation, placez le switch 1 sur OFF.',
          'Appuyez sur le bouton PRG : l\u2019indicateur doit rester allume en magenta.',
          'Activez le Bluetooth du telephone puis lancez la recherche dans l\u2019application.',
          'Selectionnez le produit WIDOOR detecte pour lancer la connexion.',
        ],
      },
      troubleshooting: {
        title: 'Difficulte d\u2019appairage',
        steps: [
          'Verifiez que le Bluetooth est active sur le smartphone.',
          'Verifiez que la motorisation est alimentee et proche du telephone.',
          'Si un produit etait deja connecte, revenez au scan et deconnectez-le proprement.',
          'Relancez la recherche puis selectionnez a nouveau le produit detecte.',
        ],
      },
    },
    'moventiv-garline': {
      title: 'MOVENTIV/GARLINE',
      pairing: {
        title: 'Appairage',
        steps: [
          'Placez-vous a proximite de la motorisation alimentee.',
          'Sur la motorisation, placez le switch 1 sur OFF.',
          'Appuyez sur le bouton PRG : l\u2019indicateur doit rester allume en magenta.',
          'Activez le Bluetooth du telephone puis lancez la recherche dans l\u2019application.',
          'Selectionnez le produit MOVENTIV ou GARLINE detecte pour lancer la connexion.',
        ],
      },
      troubleshooting: {
        title: 'Difficulte d\u2019appairage',
        steps: [
          'Verifiez que le Bluetooth est active sur le smartphone.',
          'Rapprochez le telephone de la motorisation puis relancez la recherche.',
          'Verifiez que la motorisation n\u2019est pas deja connectee a un autre telephone.',
          'Si un ancien jumelage bloque la connexion, supprimez-le depuis les reglages Bluetooth du telephone.',
        ],
      },
    },
  },
};

const EN_TEXT: HelpPageText = {
  title: 'Help',
  productChoiceTitle: 'Which product do you want to pair?',
  products: {
    widoor: 'WIDOOR',
    moventiv: 'MOVENTIV',
    garline: 'GARLINE',
  },
  productHelp: {
    widoor: {
      title: 'WIDOOR',
      pairing: {
        title: 'Pairing',
        steps: [
          'Stay close to the powered WIDOOR motor.',
          'On the motor, set switch 1 to OFF.',
          'Press the PRG button: the indicator must remain lit in magenta.',
          'Enable Bluetooth on the phone, then start discovery in the app.',
          'Select the detected WIDOOR product to start the connection.',
        ],
      },
      troubleshooting: {
        title: 'Pairing issues',
        steps: [
          'Check that Bluetooth is enabled on the smartphone.',
          'Check that the motor is powered and close to the phone.',
          'If a product was already connected, return to scan and disconnect it cleanly.',
          'Start discovery again, then select the detected product.',
        ],
      },
    },
    'moventiv-garline': {
      title: 'MOVENTIV/GARLINE',
      pairing: {
        title: 'Pairing',
        steps: [
          'Stay close to the powered motor.',
          'On the motor, set switch 1 to OFF.',
          'Press the PRG button: the indicator must remain lit in magenta.',
          'Enable Bluetooth on the phone, then start discovery in the app.',
          'Select the detected MOVENTIV or GARLINE product to start the connection.',
        ],
      },
      troubleshooting: {
        title: 'Pairing issues',
        steps: [
          'Check that Bluetooth is enabled on the smartphone.',
          'Move the phone closer to the motor, then start discovery again.',
          'Check that the motor is not already connected to another phone.',
          'If old pairing data blocks the connection, remove it from the phone Bluetooth settings.',
        ],
      },
    },
  },
};

const DE_TEXT: HelpPageText = {
  title: 'Hilfe',
  productChoiceTitle: 'Welches Produkt mochten Sie koppeln?',
  products: {
    widoor: 'WIDOOR',
    moventiv: 'MOVENTIV',
    garline: 'GARLINE',
  },
  productHelp: {
    widoor: {
      title: 'WIDOOR',
      pairing: {
        title: 'Verbindung',
        steps: [
          'Bleiben Sie in der Nahe des eingeschalteten WIDOOR Motors.',
          'Stellen Sie am Motor den Switch 1 auf OFF.',
          'Drucken Sie die PRG-Taste: die Anzeige muss dauerhaft magenta leuchten.',
          'Aktivieren Sie Bluetooth am Telefon und starten Sie die Suche in der App.',
          'Wahlen Sie das erkannte WIDOOR Produkt aus, um die Verbindung zu starten.',
        ],
      },
      troubleshooting: {
        title: 'Verbindungsprobleme',
        steps: [
          'Prufen Sie, ob Bluetooth auf dem Smartphone aktiviert ist.',
          'Prufen Sie, ob der Motor mit Strom versorgt wird und sich in der Nahe des Telefons befindet.',
          'Wenn bereits ein Produkt verbunden war, kehren Sie zum Scan zuruck und trennen Sie es sauber.',
          'Starten Sie die Suche erneut und wahlen Sie das erkannte Produkt aus.',
        ],
      },
    },
    'moventiv-garline': {
      title: 'MOVENTIV/GARLINE',
      pairing: {
        title: 'Verbindung',
        steps: [
          'Bleiben Sie in der Nahe des eingeschalteten Motors.',
          'Stellen Sie am Motor den Switch 1 auf OFF.',
          'Drucken Sie die PRG-Taste: die Anzeige muss dauerhaft magenta leuchten.',
          'Aktivieren Sie Bluetooth am Telefon und starten Sie die Suche in der App.',
          'Wahlen Sie das erkannte MOVENTIV oder GARLINE Produkt aus, um die Verbindung zu starten.',
        ],
      },
      troubleshooting: {
        title: 'Verbindungsprobleme',
        steps: [
          'Prufen Sie, ob Bluetooth auf dem Smartphone aktiviert ist.',
          'Bringen Sie das Telefon naher an den Motor und starten Sie die Suche erneut.',
          'Prufen Sie, ob der Motor nicht bereits mit einem anderen Telefon verbunden ist.',
          'Wenn eine alte Kopplung die Verbindung blockiert, entfernen Sie sie in den Bluetooth-Einstellungen des Telefons.',
        ],
      },
    },
  },
};

const PL_TEXT: HelpPageText = {
  title: 'Pomoc',
  productChoiceTitle: 'Ktory produkt chcesz sparowac?',
  products: {
    widoor: 'WIDOOR',
    moventiv: 'MOVENTIV',
    garline: 'GARLINE',
  },
  productHelp: {
    widoor: {
      title: 'WIDOOR',
      pairing: {
        title: 'Parowanie',
        steps: [
          'Pozostan blisko zasilonego napedu WIDOOR.',
          'Po stronie napedu ustaw przelacznik 1 w pozycji OFF.',
          'Nacisnij przycisk PRG: wskaznik powinien swiecic stale na kolor magenta.',
          'Wlacz Bluetooth w telefonie, a nastepnie uruchom wyszukiwanie w aplikacji.',
          'Wybierz wykryty produkt WIDOOR, aby rozpoczac polaczenie.',
        ],
      },
      troubleshooting: {
        title: 'Problemy z parowaniem',
        steps: [
          'Sprawdz, czy Bluetooth jest wlaczony w smartfonie.',
          'Sprawdz, czy naped jest zasilany i znajduje sie blisko telefonu.',
          'Jesli produkt byl juz polaczony, wroc do skanowania i rozlacz go poprawnie.',
          'Uruchom wyszukiwanie ponownie, a nastepnie wybierz wykryty produkt.',
        ],
      },
    },
    'moventiv-garline': {
      title: 'MOVENTIV/GARLINE',
      pairing: {
        title: 'Parowanie',
        steps: [
          'Pozostan blisko zasilonego napedu.',
          'Po stronie napedu ustaw przelacznik 1 w pozycji OFF.',
          'Nacisnij przycisk PRG: wskaznik powinien swiecic stale na kolor magenta.',
          'Wlacz Bluetooth w telefonie, a nastepnie uruchom wyszukiwanie w aplikacji.',
          'Wybierz wykryty produkt MOVENTIV lub GARLINE, aby rozpoczac polaczenie.',
        ],
      },
      troubleshooting: {
        title: 'Problemy z parowaniem',
        steps: [
          'Sprawdz, czy Bluetooth jest wlaczony w smartfonie.',
          'Zbliz telefon do napedu i ponownie uruchom wyszukiwanie.',
          'Sprawdz, czy naped nie jest juz polaczony z innym telefonem.',
          'Jesli stare parowanie blokuje polaczenie, usun je w ustawieniach Bluetooth telefonu.',
        ],
      },
    },
  },
};

const HELP_TEXT: Record<AppLanguage, HelpPageText> = {
  fr: FR_TEXT,
  en: EN_TEXT,
  de: DE_TEXT,
  pl: PL_TEXT,
};

export function getHelpProductGroup(
  product: HelpProduct,
): HelpProductGroup {
  return product === 'widoor' ? 'widoor' : 'moventiv-garline';
}

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
  const productText = text.productHelp[getHelpProductGroup(product)];
  const note = platform === 'ios'
    ? iosPairingNote(resolveAppLanguage(language))
    : androidPairingNote(resolveAppLanguage(language));

  return {
    ...productText,
    pairing: {
      ...productText.pairing,
      note,
    },
  };
}

function androidPairingNote(language: AppLanguage): string {
  switch (language) {
    case 'fr':
      return 'Sur Android recent, la recherche BLE se fait dans l\u2019application : il n\u2019est pas necessaire d\u2019activer le GPS.';
    case 'de':
      return 'Auf aktuellen Android-Versionen erfolgt die BLE-Suche in der App; GPS muss nicht aktiviert werden.';
    case 'pl':
      return 'W nowszych wersjach Androida skanowanie BLE odbywa sie w aplikacji; wlaczanie GPS nie jest wymagane.';
    case 'en':
    default:
      return 'On recent Android versions, BLE discovery is handled in the app; GPS does not need to be enabled.';
  }
}

function iosPairingNote(language: AppLanguage): string {
  switch (language) {
    case 'fr':
      return 'Sur iOS, acceptez la demande de jumelage si le systeme l\u2019affiche pendant la connexion.';
    case 'de':
      return 'Unter iOS bestatigen Sie die Kopplungsanfrage, falls das System sie wahrend der Verbindung anzeigt.';
    case 'pl':
      return 'W systemie iOS zaakceptuj prosbe o parowanie, jesli pojawi sie podczas polaczenia.';
    case 'en':
    default:
      return 'On iOS, accept the pairing request if the system displays it during connection.';
  }
}
