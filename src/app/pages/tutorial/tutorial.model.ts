export type TutorialLanguage = 'fr' | 'en' | 'de' | 'pl';
export type TutorialPlatform = 'android' | 'ios' | 'web';
export type TutorialProduct = 'widoor' | 'moventiv' | 'garline';

export interface TutorialSlide {
  readonly title: string;
  readonly description: string;
  readonly image?: string;
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
      "DESC": "Vous pouvez ajuster la vitesse de votre motorisation, changer la temporisation de fermeture etc..."
    },
    "SLIDE4": {
      "TITLE": "Configurer votre motorisation",
      "DESC": "Changez l'assignement des borniers, lancer un apprentissage des butées etc..."
    },
    "SLIDE5": {
      "TITLE": "Accéder aux informations",
      "DESC": "Vous pouvez par exemple connaitre la position des switchs."
    },
    "SLIDE6": {
      "TITLE": "Configurer l'application",
      "DESC": "Vous pouvez par exemple désactiver les menus que vous n'utilisez pas."
    },
    "SLIDE7": {
      "ANDROID": {
        "TITLE": "Appairage avec votre Widoor",
        "DESC": "Du coté du smartphone se rendre dans le menu Bluetooth (généralement : paramètres > connexions > Bluetooth > ANALYSER). Du coté de la motorisation, mettre le switch 1 sur OFF, appuyer sur le bouton prg (l'indicateur doit s'allumer magenta fixement). Ensuite du coté du téléphone appuyer sur Widoor, celui-ci doit migrer dans PERIPHERIQUES Associés. "
      },
      "IOS": {
        "TITLE": "Appairage avec votre Widoor",
        "DESC": "Du coté de votre smartphone, effectuer une recherche de motorisation via l'appli. Du coté de la motorisation, mettre le switch 1 sur OFF, appuyer sur le bouton prg (l'indicateur doit s'allumer magenta fixement). Ensuite dans l'application appuyer sur Widoor et accepter la demande de jumelage. "
      }
    },
    "SLIDE8": {
      "ANDROID": {
        "TITLE": "Renommer votre Widoor",
        "DESC": "Une fois connecté vous pouver renommer votre Widoor et l'associer à une pièce"
      },
      "IOS": {
        "TITLE": "Renommer votre Widoor",
        "DESC": "Une fois connecté vous pouver renommer votre Widoor et l'associer à une pièce. (Le renommage peut mettre quelques minutes à être visible depuis votre smartphone)"
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
      "READY": "Ready to use your Widoor ?",
      "CONTINUE": "Continue"
    },
    "SLIDE1": {
      "TITLE": "Welcome in the tutorial !",
      "DESC": "This tutorial will show you the key features of the app."
    },
    "SLIDE2": {
      "TITLE": "Drive your motorization",
      "DESC": "You can drive your motorization with your smartphone as with a remote controler."
    },
    "SLIDE3": {
      "TITLE": "Tune your motorization",
      "DESC": "You can tune the spped of your motorization, change the waiting tile before closing etc..."
    },
    "SLIDE4": {
      "TITLE": "Configure your motorization",
      "DESC": "Change the terminals assignement, launch stops  learningetc..."
    },
    "SLIDE5": {
      "TITLE": "Acces to informations",
      "DESC": "For example you can know the switch positions"
    },
    "SLIDE6": {
      "TITLE": "Configure the App",
      "DESC": "You can for example disable the menus you dislike"
    },
    "SLIDE7": {
      "ANDROID": {
        "TITLE": "Pair with Widoor",
        "DESC": "On the phone side go to the pairing menu (usually : parameters-> connections->Bluetooth-> search devices. On the motorization side, put the Switch 1 on OFF state, press the prg button (LED indicator should be static magenta). Then on the phone side, select the Widoor device. It should translate to the PAIRED DEVICES"
      },
      "IOS": {
        "TITLE": "Pair with WIDOOR",
        "DESC": "On the Iphone side, search motorizations with the APP. On the Moventiv side, mput the switch 1 OFF, push and release the prg button(lED indicator should be magenta). Then in the APP clic on WIDOOR and accept the pairing request. "
      }
    },
    "SLIDE8": {
      "ANDROID": {
        "TITLE": "Rename your Widoor",
        "DESC": "Once connected you can rename your Widoor and associate it with a room"
      },
      "IOS": {
        "TITLE": "Rename your Widoor",
        "DESC": "Once connected you can rename your Widoor and associate it with a room (new name could take some minutes to be visible on your iPhone)"
      }
    }
  },
  "de": {
    "SKIP": "Überspringen",
    "CHOICE": {
      "TITLE": "Tutorial auswahlen",
      "WIDOOR": "Widoor Tutorial",
      "MOVENTIV": "Moventiv Tutorial",
      "GARLINE": "Garline Tutorial"
    },
    "END": {
      "READY": "Sind Sie bereit Ihren WIDOOR zu benutzen?",
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
      "TITLE": "Justieren Sie Ihren Motor",
      "DESC": "Sie können die Geschwindigkeit, die Zeit bis zum automatischen Schließen und anderes einstellen."
    },
    "SLIDE4": {
      "TITLE": "Konfigurieren Sie Ihren Motor",
      "DESC": "Ändern Sie die Zuordnung der Terminals, beginnen Sie das Anerlernen etc."
    },
    "SLIDE5": {
      "TITLE": "Informationen zum Motor",
      "DESC": "Beispielsweise die SWITCH POSITIONS"
    },
    "SLIDE6": {
      "TITLE": "App Einstellungen",
      "DESC": "Deaktivieren Sie nicht genutzte Menüs."
    },
    "SLIDE7": {
      "ANDROID": {
        "TITLE": "Mit WIDOOR verbinden",
        "DESC": "Gehen Sie in Ihrem Smartphone in die Bluetooth-Verbindungen (Einstellungen -> Bluetooth -> Meine Geräte) Stellen Sie den SWITCH 1 in die OFF Position beim Motor, drücken Sie den Programmierknopf (die LED Lampe sollte dauerhaft magenta leuchten). Wählen Sie in Ihrem Smartphone dann WIDOOR aus, dann sollte der Motor sich mit Ihrem Smartphone verbinden."
      },
      "IOS": {
        "TITLE": "Mit WIDOOR verbinden",
        "DESC": "Gehen Sie in Ihrem iPhone in die Bluetooth-Verbindungen (Einstellungen -> Bluetooth -> Meine Geräte) Stellen Sie den SWITCH 1 in die OFF Position beim Motor, drücken Sie den Programmierknopf (die LED Lampe sollte dauerhaft magenta leuchten). Wählen Sie in Ihrer App dann WIDOR und akzeptieren Sie die Verbindung."
      }
    },
    "SLIDE8": {
      "ANDROID": {
        "TITLE": "Ändern Sie den Namen Ihres WIDOORS",
        "DESC": "Sobald der WIDOOR verbunden ist, können Sie den Namen ändern und ihn einem Raum zuordnen"
      },
      "IOS": {
        "TITLE": "Ändern Sie den Namen Ihres WIDOORS",
        "DESC": "Sobald der WIDOOR verbunden ist, können Sie den Namen ändern und ihn einem Raum zuordnen (es kann einige Minuten dauern, bis der neue Name im iPhone sichtbar ist)."
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
        "DESC": "Na iPhonie wyszukaj napęd za pomocą aplikacji. Po stronie \"nazwa Twojego napędu\" ustaw Przełącznik 1 w pozycji OFF i naciśnij oraz zwolnij przycisk PRG (dioda LED powinna świecić purpurowym światłem). Następnie w aplikacji naciśnij \"nazwa Twojego napędu\" i zaakceptuj prośbę o parowanie. "
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
  const images = tutorialImagesFor(product, language, platform);

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

function tutorialImagesFor(
  product: TutorialProduct,
  language: TutorialLanguage,
  platform: TutorialPlatform,
) {
  const basePath = `assets/img/tuto_${product}/`;
  const imageLanguage = language === 'fr' ? 'fr' : 'en';

  if (platform === 'ios') {
    return Object.freeze({
      slide1: `${basePath}slide1_${product}.png`,
      slide2: `${basePath}slide2_ios_${imageLanguage}_${product}.PNG`,
      slide3: `${basePath}slide3_ios_${imageLanguage}_${product}.PNG`,
      slide4: `${basePath}slide4_ios_${imageLanguage}_${product}.PNG`,
      slide5: `${basePath}slide5_ios_${imageLanguage}_${product}.PNG`,
      slide6: `${basePath}slide6_ios_${imageLanguage}_${product}.PNG`,
    });
  }

  const slide4 = product === 'widoor' && imageLanguage === 'fr'
    ? `${basePath}slide4_anroid_fr_widoor.jpg`
    : `${basePath}slide4_android_${imageLanguage}_${product}.jpg`;

  return Object.freeze({
    slide1: `${basePath}slide1_${product}.png`,
    slide2: `${basePath}slide2_android_${imageLanguage}_${product}.jpg`,
    slide3: `${basePath}slide3_android_${imageLanguage}_${product}.jpg`,
    slide4,
    slide5: `${basePath}slide5_android_${imageLanguage}_${product}.jpg`,
    slide6: `${basePath}slide6_android_${imageLanguage}_${product}.jpg`,
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
