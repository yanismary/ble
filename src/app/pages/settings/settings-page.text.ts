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
    title: 'Configuration de l\'application',
    selectCancel: 'Annuler',
    selectOk: 'Valider',
    sections: {
      language: 'Langage',
      scan: 'Affichage de l\'adresse MAC',
      productTabs: 'Affichage des onglets',
      other: 'Option',
    },
    language: {
      automatic: 'D\u00e9tection automatique de la langue',
      manual: 'S\u00e9lectionner votre langue',
      status: (language) =>
        `Mode automatique actif - langue actuelle : ${language}.`,
    },
    scan: {
      showBleIdentifierAndroid: 'Affichage de l\'adresse MAC',
      showBleIdentifierIos: 'Affichage de l\'UUID',
    },
    productTabs: {
      settings: 'R\u00e9glages',
      information: 'Informations',
    },
    other: {
      haptics: 'Retour vibrations',
      bluetooth: 'Activation/d\u00e9sactivation automatique Bluetooth',
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
    title: 'App configuration',
    selectCancel: 'Cancel',
    selectOk: 'OK',
    sections: {
      language: 'Language',
      scan: 'Scan page',
      productTabs: 'Display of the tab pages',
      other: 'Options',
    },
    language: {
      automatic: 'Language auto-detection',
      manual: 'Select your langage',
      status: (language) =>
        `Automatic mode active - current language: ${language}.`,
    },
    scan: {
      showBleIdentifierAndroid: 'Display of MAC address',
      showBleIdentifierIos: 'Display of UUID',
    },
    productTabs: {
      settings: 'Tuning',
      information: 'Informations',
    },
    other: {
      haptics: 'Rumble feedback',
      bluetooth: 'Enable/disable automatic Bluetooth switch',
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
    title: 'App Einstellungen',
    selectCancel: 'Abbrechen',
    selectOk: 'OK',
    sections: {
      language: 'Sprache',
      scan: 'Anzeige der MAC Adresse',
      productTabs: 'Ansicht der Tabs',
      other: 'Optionen',
    },
    language: {
      automatic: 'Sprache automatisch ausw\u00e4hlen',
      manual: 'Sprache ausw\u00e4hlen',
      status: (language) =>
        `Automatikmodus aktiv - aktuelle Sprache: ${language}.`,
    },
    scan: {
      showBleIdentifierAndroid: 'Anzeige der MAC Adresse',
      showBleIdentifierIos: 'Anzeige der UUID',
    },
    productTabs: {
      settings: 'Einstellungen',
      information: 'Informationen',
    },
    other: {
      haptics: 'Vibration',
      bluetooth: 'Aktiviere/deaktiviere Bluetooth automatisch',
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
    title: 'Konfiguracja aplikacji',
    selectCancel: 'Anuluj',
    selectOk: 'OK',
    sections: {
      language: 'J\u0119zyk',
      scan: 'Wy\u015bwietlanie adresu MAC',
      productTabs: 'Wy\u015bwietlanie zak\u0142adek',
      other: 'Opcje',
    },
    language: {
      automatic: 'Automatyczne wykrywanie j\u0119zyka',
      manual: 'Wybierz j\u0119zyk',
      status: (language) =>
        `Tryb automatyczny aktywny - aktualny j\u0119zyk: ${language}.`,
    },
    scan: {
      showBleIdentifierAndroid: 'Wy\u015bwietlanie adresu MAC',
      showBleIdentifierIos: 'Wy\u015bwietlanie UUID',
    },
    productTabs: {
      settings: 'Ustawienia',
      information: 'Informacje',
    },
    other: {
      haptics: 'Wibracje',
      bluetooth: 'W\u0142\u0105cz/wy\u0142\u0105cz automatyczne prze\u0142\u0105czanie Bluetooth',
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
