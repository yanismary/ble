import {
  AppLanguage,
  resolveAppLanguage,
} from '../../core/services/app-language';

export interface SettingsPageText {
  readonly title: string;
  readonly selectCancel: string;
  readonly selectOk: string;
  readonly sections: {
    readonly language: string;
    readonly scan: string;
    readonly productTabs: string;
    readonly other: string;
  };
  readonly language: {
    readonly automatic: string;
    readonly manual: string;
    readonly status: (language: string) => string;
  };
  readonly scan: {
    readonly showBleIdentifierAndroid: string;
    readonly showBleIdentifierIos: string;
  };
  readonly productTabs: {
    readonly settings: string;
    readonly information: string;
  };
  readonly other: {
    readonly haptics: string;
    readonly bluetooth: string;
  };
  readonly status: {
    readonly manualLanguage: string;
    readonly automaticLanguage: (language: string) => string;
    readonly showBleIdentifier: string;
    readonly hideBleIdentifier: string;
    readonly showSettings: string;
    readonly hideSettings: string;
    readonly showInformation: string;
    readonly hideInformation: string;
    readonly enableBluetooth: string;
    readonly disableBluetooth: string;
    readonly enableHaptics: string;
    readonly disableHaptics: string;
  };
}

const SETTINGS_TEXT: Record<AppLanguage, SettingsPageText> = {
  fr: {
    title: 'Param\u00e8tres',
    selectCancel: 'Annuler',
    selectOk: 'OK',
    sections: {
      language: 'Langue',
      scan: 'Page de scan',
      productTabs: 'Onglets produit',
      other: 'Autres options',
    },
    language: {
      automatic: 'Utiliser la langue du t\u00e9l\u00e9phone',
      manual: 'Choisir la langue',
      status: (language) =>
        `Mode automatique actif - langue actuelle : ${language}.`,
    },
    scan: {
      showBleIdentifierAndroid: 'Afficher l\u2019adresse MAC',
      showBleIdentifierIos: 'Afficher l\u2019identifiant UUID',
    },
    productTabs: {
      settings: 'Afficher l\u2019onglet R\u00e9glages',
      information: 'Afficher l\u2019onglet Informations',
    },
    other: {
      haptics: 'Activer les vibrations',
      bluetooth: 'Demander l\u2019activation Bluetooth avant scan',
    },
    status: {
      manualLanguage:
        'Langue enregistr\u00e9e. Elle sera utilis\u00e9e \u00e0 la prochaine ouverture des \u00e9crans.',
      automaticLanguage: (language) =>
        `Langue du t\u00e9l\u00e9phone enregistr\u00e9e : ${language}.`,
      showBleIdentifier: 'Identifiant BLE affich\u00e9 sur la page de scan.',
      hideBleIdentifier: 'Identifiant BLE masqu\u00e9 sur la page de scan.',
      showSettings: 'R\u00e9glages produit affich\u00e9s.',
      hideSettings: 'R\u00e9glages produit masqu\u00e9s.',
      showInformation: 'Informations produit affich\u00e9es.',
      hideInformation: 'Informations produit masqu\u00e9es.',
      enableBluetooth:
        'Activation automatique du Bluetooth activ\u00e9e pour les scans.',
      disableBluetooth: 'Activation automatique du Bluetooth d\u00e9sactiv\u00e9e.',
      enableHaptics: 'Vibrations activ\u00e9es.',
      disableHaptics: 'Vibrations d\u00e9sactiv\u00e9es.',
    },
  },
  en: {
    title: 'Settings',
    selectCancel: 'Cancel',
    selectOk: 'OK',
    sections: {
      language: 'Language',
      scan: 'Scan page',
      productTabs: 'Product tabs',
      other: 'Other options',
    },
    language: {
      automatic: 'Use phone language',
      manual: 'Choose language',
      status: (language) =>
        `Automatic mode active - current language: ${language}.`,
    },
    scan: {
      showBleIdentifierAndroid: 'Show MAC address',
      showBleIdentifierIos: 'Show UUID identifier',
    },
    productTabs: {
      settings: 'Show Settings tab',
      information: 'Show Information tab',
    },
    other: {
      haptics: 'Enable vibration',
      bluetooth: 'Ask to enable Bluetooth before scan',
    },
    status: {
      manualLanguage:
        'Language saved. It will be used the next time screens are opened.',
      automaticLanguage: (language) => `Phone language saved: ${language}.`,
      showBleIdentifier: 'BLE identifier shown on the scan page.',
      hideBleIdentifier: 'BLE identifier hidden on the scan page.',
      showSettings: 'Product settings shown.',
      hideSettings: 'Product settings hidden.',
      showInformation: 'Product information shown.',
      hideInformation: 'Product information hidden.',
      enableBluetooth: 'Automatic Bluetooth enable active for scans.',
      disableBluetooth: 'Automatic Bluetooth enable disabled.',
      enableHaptics: 'Vibration enabled.',
      disableHaptics: 'Vibration disabled.',
    },
  },
  de: {
    title: 'Einstellungen',
    selectCancel: 'Abbrechen',
    selectOk: 'OK',
    sections: {
      language: 'Sprache',
      scan: 'Scan-Seite',
      productTabs: 'Produkt-Tabs',
      other: 'Weitere Optionen',
    },
    language: {
      automatic: 'Telefonsprache verwenden',
      manual: 'Sprache ausw\u00e4hlen',
      status: (language) =>
        `Automatikmodus aktiv - aktuelle Sprache: ${language}.`,
    },
    scan: {
      showBleIdentifierAndroid: 'MAC-Adresse anzeigen',
      showBleIdentifierIos: 'UUID anzeigen',
    },
    productTabs: {
      settings: 'Tab Einstellungen anzeigen',
      information: 'Tab Informationen anzeigen',
    },
    other: {
      haptics: 'Vibration aktivieren',
      bluetooth: 'Bluetooth-Aktivierung vor dem Scan anfragen',
    },
    status: {
      manualLanguage:
        'Sprache gespeichert. Sie wird beim n\u00e4chsten \u00d6ffnen der Seiten verwendet.',
      automaticLanguage: (language) =>
        `Telefonsprache gespeichert: ${language}.`,
      showBleIdentifier: 'BLE-Kennung auf der Scan-Seite sichtbar.',
      hideBleIdentifier: 'BLE-Kennung auf der Scan-Seite ausgeblendet.',
      showSettings: 'Produkteinstellungen sichtbar.',
      hideSettings: 'Produkteinstellungen ausgeblendet.',
      showInformation: 'Produktinformationen sichtbar.',
      hideInformation: 'Produktinformationen ausgeblendet.',
      enableBluetooth: 'Automatische Bluetooth-Aktivierung f\u00fcr Scans aktiv.',
      disableBluetooth: 'Automatische Bluetooth-Aktivierung deaktiviert.',
      enableHaptics: 'Vibration aktiviert.',
      disableHaptics: 'Vibration deaktiviert.',
    },
  },
  pl: {
    title: 'Ustawienia',
    selectCancel: 'Anuluj',
    selectOk: 'OK',
    sections: {
      language: 'J\u0119zyk',
      scan: 'Ekran skanowania',
      productTabs: 'Zak\u0142adki produktu',
      other: 'Inne opcje',
    },
    language: {
      automatic: 'U\u017cyj j\u0119zyka telefonu',
      manual: 'Wybierz j\u0119zyk',
      status: (language) =>
        `Tryb automatyczny aktywny - aktualny j\u0119zyk: ${language}.`,
    },
    scan: {
      showBleIdentifierAndroid: 'Poka\u017c adres MAC',
      showBleIdentifierIos: 'Poka\u017c identyfikator UUID',
    },
    productTabs: {
      settings: 'Poka\u017c zak\u0142adk\u0119 Ustawienia',
      information: 'Poka\u017c zak\u0142adk\u0119 Informacje',
    },
    other: {
      haptics: 'W\u0142\u0105cz wibracje',
      bluetooth: 'Popro\u015b o w\u0142\u0105czenie Bluetooth przed skanowaniem',
    },
    status: {
      manualLanguage:
        'J\u0119zyk zapisany. Zostanie u\u017cyty przy nast\u0119pnym otwarciu ekran\u00f3w.',
      automaticLanguage: (language) =>
        `J\u0119zyk telefonu zapisany: ${language}.`,
      showBleIdentifier: 'Identyfikator BLE widoczny na ekranie skanowania.',
      hideBleIdentifier: 'Identyfikator BLE ukryty na ekranie skanowania.',
      showSettings: 'Ustawienia produktu widoczne.',
      hideSettings: 'Ustawienia produktu ukryte.',
      showInformation: 'Informacje produktu widoczne.',
      hideInformation: 'Informacje produktu ukryte.',
      enableBluetooth:
        'Automatyczne w\u0142\u0105czanie Bluetooth aktywne dla skanowania.',
      disableBluetooth:
        'Automatyczne w\u0142\u0105czanie Bluetooth wy\u0142\u0105czone.',
      enableHaptics: 'Wibracje w\u0142\u0105czone.',
      disableHaptics: 'Wibracje wy\u0142\u0105czone.',
    },
  },
};

export function settingsPageTextFor(
  language: string | null | undefined,
): SettingsPageText {
  return SETTINGS_TEXT[resolveAppLanguage(language)];
}
