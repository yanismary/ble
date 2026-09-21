export type TutorialLanguage = 'fr' | 'en' | 'de' | 'pl';
export type TutorialPlatform = 'android' | 'ios' | 'web';
export type TutorialProduct = 'widoor' | 'moventiv' | 'garline';

export interface TutorialSlide {
  readonly title: string;
  readonly description: string;
  readonly image?: string;
}

export interface TutorialImageSet {
  readonly slide1: string;
  readonly slide2: string;
  readonly slide3: string;
  readonly slide4: string;
  readonly slide5: string;
  readonly slide6: string;
}

export interface TutorialCopy {
  readonly choiceTitle: string;
  readonly choiceWidoor: string;
  readonly choiceMoventiv: string;
  readonly choiceGarline: string;
  readonly skip: string;
  readonly continueLabel: string;
  readonly readyTitle: string;
  readonly slides: readonly TutorialSlide[];
}

const LEGACY_INFOSLIDE = {
  "fr": {
    "SKIP": "Passer",
    "CHOICE": {
      "TITLE": "Choisissez un tutoriel",
      "WIDOOR": "Tuto Widoor",
      "MOVENTIV": "Tuto Moventiv",
      "GARLINE": "Tuto Garline"
    },
    "END": {
      "READY": "Prêt à utiliser votre Widoor ?",
      "PREVIOUS": "Précédent",
      "NEXT": "Suivant",
      "CONTINUE": "Continuer"
    },
    "SLIDE1": {
      "TITLE": "Bienvenue dans le tutoriel !",
      "DESC": "Ce tutoriel va vous montrer les éléments clés de l'application."
    },
    "SLIDE2": {
      "TITLE": "Piloter votre motorisation",
      "DESC": "Vous pouvez piloter votre Moventiv avec votre smartphone, comme vous le feriez avec une télécommande."
    },
    "SLIDE3": {
      "TITLE": "Régler votre motorisation",
      "DESC": "Vous pouvez ajuster la vitesse de votre motorisation et modifier la temporisation de fermeture."
    },
    "SLIDE4": {
      "TITLE": "Configurer votre motorisation",
      "DESC": "Changez l’affectation des borniers et lancez un apprentissage des butées."
    },
    "SLIDE5": {
      "TITLE": "Accéder aux informations",
      "DESC": "Vous pouvez par exemple connaître la position des switchs."
    },
    "SLIDE6": {
      "TITLE": "Configurer l'application",
      "DESC": "Vous pouvez par exemple désactiver les menus que vous n'utilisez pas."
    },
    "SLIDE7": {
      "ANDROID": {
        "TITLE": "Appairage avec votre Widoor",
        "DESC": "Sur le smartphone, ouvrez le menu Bluetooth (généralement : Paramètres > Connexions > Bluetooth > Rechercher des appareils). Sur la motorisation, placez le switch 1 sur OFF, puis appuyez sur le bouton PRG (l’indicateur doit rester allumé en magenta). Sélectionnez ensuite Widoor sur le téléphone : il doit apparaître dans les appareils associés."
      },
      "IOS": {
        "TITLE": "Appairage avec votre Widoor",
        "DESC": "Sur votre smartphone, recherchez la motorisation dans l’application. Sur la motorisation, placez le switch 1 sur OFF, puis appuyez sur le bouton PRG (l’indicateur doit rester allumé en magenta). Dans l’application, sélectionnez ensuite Widoor et acceptez la demande de jumelage."
      }
    },
    "SLIDE8": {
      "ANDROID": {
        "TITLE": "Renommer votre Widoor",
        "DESC": "Une fois connecté, vous pouvez renommer votre Widoor et l’associer à une pièce."
      },
      "IOS": {
        "TITLE": "Renommer votre Widoor",
        "DESC": "Une fois connecté, vous pouvez renommer votre Widoor et l’associer à une pièce. Le nouveau nom peut mettre quelques minutes à apparaître sur votre smartphone."
      }
    }
  },
  "en": {
    "SKIP": "Skip",
    "CHOICE": {
      "TITLE": "Choose a tutorial",
      "WIDOOR": "Widoor tutorial",
      "MOVENTIV": "Moventiv tutorial",
      "GARLINE": "Garline tutorial"
    },
    "END": {
      "READY": "Ready to use your Widoor?",
      "PREVIOUS": "Previous",
      "NEXT": "Next",
      "CONTINUE": "Continue"
    },
    "SLIDE1": {
      "TITLE": "Welcome to the tutorial!",
      "DESC": "This tutorial will show you the key features of the app."
    },
    "SLIDE2": {
      "TITLE": "Control your motor",
      "DESC": "You can control your motor with your smartphone, just as you would with a remote control."
    },
    "SLIDE3": {
      "TITLE": "Adjust your motor",
      "DESC": "You can adjust the motor speed and change the delay before closing."
    },
    "SLIDE4": {
      "TITLE": "Configure your motor",
      "DESC": "Change the terminal assignments and start end-stop learning."
    },
    "SLIDE5": {
      "TITLE": "View information",
      "DESC": "For example, you can check the switch positions."
    },
    "SLIDE6": {
      "TITLE": "Configure the app",
      "DESC": "For example, you can hide menus that you do not use."
    },
    "SLIDE7": {
      "ANDROID": {
        "TITLE": "Pair with Widoor",
        "DESC": "On the smartphone, open the Bluetooth menu (usually Settings > Connections > Bluetooth > Search for devices). On the motor, set switch 1 to OFF, then press the PRG button (the indicator must remain lit in magenta). Select Widoor on the phone: it should appear under paired devices."
      },
      "IOS": {
        "TITLE": "Pair with WIDOOR",
        "DESC": "On your smartphone, search for the motor in the app. On the motor, set switch 1 to OFF, then press the PRG button (the indicator must remain lit in magenta). In the app, select Widoor and accept the pairing request."
      }
    },
    "SLIDE8": {
      "ANDROID": {
        "TITLE": "Rename your Widoor",
        "DESC": "Once connected, you can rename your Widoor and associate it with a room."
      },
      "IOS": {
        "TITLE": "Rename your Widoor",
        "DESC": "Once connected, you can rename your Widoor and associate it with a room. The new name may take a few minutes to appear on your iPhone."
      }
    }
  },
  "de": {
    "SKIP": "Überspringen",
    "CHOICE": {
      "TITLE": "Tutorial auswählen",
      "WIDOOR": "Widoor Tutorial",
      "MOVENTIV": "Moventiv Tutorial",
      "GARLINE": "Garline Tutorial"
    },
    "END": {
      "READY": "Sind Sie bereit Ihren WIDOOR zu benutzen?",
      "PREVIOUS": "Zurück",
      "NEXT": "Weiter",
      "CONTINUE": "Fortfahren"
    },
    "SLIDE1": {
      "TITLE": "Willkommen zum Tutorial!",
      "DESC": "Dieses Tutorial stellt Ihnen die zentralen Funktionen der App vor."
    },
    "SLIDE2": {
      "TITLE": "Motor bedienen",
      "DESC": "Sie können Ihren Motor mit dem Smartphone oder einer Fernbedienung nutzen."
    },
    "SLIDE3": {
      "TITLE": "Motor einstellen",
      "DESC": "Sie können die Geschwindigkeit, die Zeit bis zum automatischen Schließen und anderes einstellen."
    },
    "SLIDE4": {
      "TITLE": "Konfigurieren Sie Ihren Motor",
      "DESC": "Ändern Sie die Zuordnung der Anschlüsse und starten Sie das Einlernen der Endlagen."
    },
    "SLIDE5": {
      "TITLE": "Motorinformationen anzeigen",
      "DESC": "Sie können beispielsweise die Schalterstellungen prüfen."
    },
    "SLIDE6": {
      "TITLE": "App-Einstellungen",
      "DESC": "Deaktivieren Sie nicht genutzte Menüs."
    },
    "SLIDE7": {
      "ANDROID": {
        "TITLE": "Mit WIDOOR verbinden",
        "DESC": "Öffnen Sie auf dem Smartphone das Bluetooth-Menü (normalerweise Einstellungen > Verbindungen > Bluetooth > Geräte suchen). Stellen Sie am Motor den Schalter 1 auf OFF und drücken Sie anschließend die PRG-Taste (die Anzeige muss dauerhaft magenta leuchten). Wählen Sie Widoor auf dem Smartphone aus: Der Motor sollte unter den gekoppelten Geräten erscheinen."
      },
      "IOS": {
        "TITLE": "Mit WIDOOR verbinden",
        "DESC": "Suchen Sie den Motor auf Ihrem Smartphone in der App. Stellen Sie am Motor den Schalter 1 auf OFF und drücken Sie anschließend die PRG-Taste (die Anzeige muss dauerhaft magenta leuchten). Wählen Sie Widoor in der App aus und bestätigen Sie die Kopplungsanfrage."
      }
    },
    "SLIDE8": {
      "ANDROID": {
        "TITLE": "Widoor umbenennen",
        "DESC": "Sobald Widoor verbunden ist, können Sie den Namen ändern und den Motor einem Raum zuordnen."
      },
      "IOS": {
        "TITLE": "Widoor umbenennen",
        "DESC": "Sobald Widoor verbunden ist, können Sie den Namen ändern und den Motor einem Raum zuordnen. Es kann einige Minuten dauern, bis der neue Name auf dem iPhone angezeigt wird."
      }
    }
  },
  "pl": {
    "SKIP": "Pomiń",
    "CHOICE": {
      "TITLE": "Wybierz samouczek",
      "WIDOOR": "Samouczek Widoor",
      "MOVENTIV": "Samouczek Moventiv",
      "GARLINE": "Samouczek Garline"
    },
    "END": {
      "READY": "Gotowy do korzystania z aplikacji WIDOOR?",
      "PREVIOUS": "Wstecz",
      "NEXT": "Dalej",
      "CONTINUE": "Kontynuuj"
    },
    "SLIDE1": {
      "TITLE": "Witaj w samouczku!",
      "DESC": "Ten samouczek pokaże Ci najważniejsze funkcje aplikacji."
    },
    "SLIDE2": {
      "TITLE": "Steruj swoim napędem",
      "DESC": "Możesz sterować swoim napędem za pomocą smartfona, tak jak pilotem zdalnego sterowania."
    },
    "SLIDE3": {
      "TITLE": "Dostosuj swój napęd",
      "DESC": "Możesz regulować prędkość napędu, zmieniać czas oczekiwania przed zamknięciem itp."
    },
    "SLIDE4": {
      "TITLE": "Skonfiguruj swój napęd",
      "DESC": "Zmień przypisanie zacisków, uruchom kalibrację pozycji krańcowych itp."
    },
    "SLIDE5": {
      "TITLE": "Dostęp do informacji",
      "DESC": "Możesz na przykład sprawdzić pozycje przełączników."
    },
    "SLIDE6": {
      "TITLE": "Skonfiguruj aplikację",
      "DESC": "Możesz na przykład ukryć menu, którego nie potrzebujesz."
    },
    "SLIDE7": {
      "ANDROID": {
        "TITLE": "Sparuj z napędem",
        "DESC": "Na telefonie przejdź do menu parowania (zazwyczaj: Ustawienia > Połączenia > Bluetooth > Wyszukaj urządzenia). Po stronie napędu ustaw Przełącznik 1 w pozycji OFF i naciśnij przycisk PRG (dioda LED powinna świecić stałym purpurowym światłem). Następnie na telefonie wybierz swój napęd — powinien pojawić się w sekcji Sparowane urządzenia."
      },
      "IOS": {
        "TITLE": "Sparuj z napędem",
        "DESC": "Na iPhonie wyszukaj napęd za pomocą aplikacji. Na napędzie ustaw przełącznik 1 w pozycji OFF, a następnie naciśnij i zwolnij przycisk PRG (dioda LED powinna świecić ciągłym purpurowym światłem). Następnie wybierz napęd w aplikacji i zaakceptuj prośbę o parowanie."
      }
    },
    "SLIDE8": {
      "ANDROID": {
        "TITLE": "Zmień nazwę swojego napędu",
        "DESC": "Po połączeniu możesz zmienić nazwę swojego napędu i przypisać go do pomieszczenia."
      },
      "IOS": {
        "TITLE": "Zmień nazwę swojego napędu",
        "DESC": "Po połączeniu możesz zmienić nazwę swojego napędu i przypisać go do pomieszczenia (nowa nazwa może być widoczna na iPhonie po kilku minutach)."
      }
    }
  }
} as const;

export function normalizeTutorialLanguage(value: string | null): TutorialLanguage {
  return value === 'fr' || value === 'en' || value === 'de' || value === 'pl'
    ? value
    : 'en';
}

export function normalizeTutorialPlatform(value: string): TutorialPlatform {
  return value === 'ios' ? 'ios' : value === 'android' ? 'android' : 'web';
}

export function tutorialCopyFor(
  product: TutorialProduct,
  language: TutorialLanguage,
  platform: TutorialPlatform,
): TutorialCopy {
  const source = LEGACY_INFOSLIDE[language] as any;
  const platformKey = platform === 'ios' ? 'IOS' : 'ANDROID';
  const images = tutorialImagePathsFor(product, language, platform);

  const slides = Object.freeze([
    legacySlide(source.SLIDE1, product, images.slide1),
    legacySlide(source.SLIDE2, product, images.slide2),
    legacySlide(source.SLIDE3, product, images.slide3),
    legacySlide(source.SLIDE4, product, images.slide4),
    legacySlide(source.SLIDE5, product, images.slide5),
    legacySlide(source.SLIDE6, product, images.slide6),
    legacySlide(source.SLIDE7[platformKey], product),
    legacySlide(source.SLIDE8[platformKey], product),
  ]);

  return Object.freeze({
    choiceTitle: source.CHOICE.TITLE,
    choiceWidoor: source.CHOICE.WIDOOR,
    choiceMoventiv: source.CHOICE.MOVENTIV,
    choiceGarline: source.CHOICE.GARLINE,
    skip: source.SKIP,
    continueLabel: source.END.CONTINUE,
    readyTitle: productText(source.END.READY, product),
    slides,
  });
}

function legacySlide(
  source: { readonly TITLE: string; readonly DESC: string },
  product: TutorialProduct,
  image?: string,
): TutorialSlide {
  return Object.freeze({
    title: productText(source.TITLE, product),
    description: productText(source.DESC, product),
    ...(image ? { image } : {}),
  });
}

export function tutorialImagePathsFor(
  product: TutorialProduct,
  language: TutorialLanguage,
  platform: TutorialPlatform,
): TutorialImageSet {
  const basePath = `assets/img/tuto_${product}/`;
  const imagePlatform = platform === 'ios' ? 'ios' : 'android';
  const localizedBasePath = `${basePath}${imagePlatform}/${language}/`;
  const localizedImage = (slideNumber: 2 | 3 | 4 | 5 | 6): string => {
    if (imagePlatform === 'android') {
      return `${localizedBasePath}slide${slideNumber}.jpg`;
    }
    if (language === 'de' && (slideNumber === 3 || slideNumber === 4)) {
      return `${localizedBasePath}slide3-4_a_revoir.PNG`;
    }
    if (slideNumber === 6) {
      const fileName = language === 'fr'
        ? 'slide6_a_revoir_avec_UUID_et_MAC.PNG'
        : 'slide6_a_revoir_UUID_MAC.PNG';
      return `${localizedBasePath}${fileName}`;
    }
    return `${localizedBasePath}slide${slideNumber}.PNG`;
  };

  return Object.freeze({
    slide1: `${basePath}slide1_${product}.png`,
    slide2: localizedImage(2),
    slide3: localizedImage(3),
    slide4: localizedImage(4),
    slide5: localizedImage(5),
    slide6: localizedImage(6),
  });
}

function productText(value: string, product: TutorialProduct): string {
  if (!value) {
    return value;
  }

  if (product === 'garline') {
    return value
      .replace(/MOVENTIV/g, 'GARLINE')
      .replace(/WIDOOR/g, 'GARLINE')
      .replace(/WIDOR/g, 'GARLINE')
      .replace(/Moventiv/g, 'GARLINE')
      .replace(/Widoor/g, 'GARLINE')
      .replace(/widoor/g, 'garline')
      .replace(/moventiv/g, 'garline');
  }

  if (product === 'widoor') {
    return value
      .replace(/MOVENTIV/g, 'WIDOOR')
      .replace(/Moventiv/g, 'Widoor')
      .replace(/moventiv/g, 'widoor');
  }

  return value
    .replace(/WIDOOR/g, 'MOVENTIV')
    .replace(/WIDOR/g, 'MOVENTIV')
    .replace(/Widoor/g, 'Moventiv')
    .replace(/widoor/g, 'moventiv');
}
