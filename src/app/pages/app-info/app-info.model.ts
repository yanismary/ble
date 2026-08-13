export type AppInfoLanguage = 'fr' | 'en' | 'de' | 'pl';

export interface AppInfoCopy {
  readonly aboutTitle: string;
  readonly aboutContentTitle: string;
  readonly versionLabel: string;
  readonly lastModification: string;
  readonly lastModificationText: string;
  readonly contactTitle: string;
  readonly sendMessage: string;
  readonly companyName: string;
  readonly phoneLabel: string;
  readonly addressLines: readonly string[];
}

const LEGACY_APP_INFO = {
  "fr": {
    "ABOUT_PAGE": {
      "NAVBAR_TITLE": "A propos",
      "CONTENT_TITLE": "MANTION Door Control",
      "VERSION": "Version :",
      "LAST_MODIFICATION": "Dernières modifications : ",
      "PARAGRAPHE1": "Nouvelle application regroupant les anciennes applications MANTION. Les fonctionnalités principales restent identiques, avec une meilleure stabilité et une interface utilisateur améliorée.",
      "PARAGRAPHE2": "Ajout d'un avertissement lors du changement de poids",
      "PARAGRAPHE2_LIST": {
        "ITEM1": "",
        "ITEM2": "",
        "ITEM3": ""
      },
      "PARAGRAPHE3": "Ajout de cette page (A propos), Ajout de la page : Qui sommes nous ?",
      "PARAGRAPHE4": "Ajout de la plage de poids 60-80kg (moteur aprés SN-2307 seulement)"
    },
    "CONTACT_PAGE": {
      "NAVBAR_TITLE": "Contact",
      "SEND_A_MESSAGE": "Envoyer un message",
      "CONTACT_1": {
        "PHONE": {
          "USERSEE": "Tél +33 (0)3 81 50 56 77",
          "SYSTEMCALL": "33381505677"
        },
        "ADDRESS": {
          "NAME": "MANTION SAS",
          "STATE": "FRANCE",
          "STREET": "7 rue Gay Lussac",
          "CITY": "25000 BESANÇON"
        },
        "SEND_MESSAGE": {
          "TO": "contact@mantion.com",
          "CC": "contact@mantion-smt.com",
          "SUBJECT": "Produit Moventiv",
          "BODY": "Bonjour,"
        }
      },
      "CONTACT_2": {
        "PHONE": {
          "USERSEE": "Tél +33 (0)3 80 37 85 71",
          "SYSTEMCALL": "33380378571"
        },
        "ADDRESS": {
          "NAME": "MANTION SMT",
          "STATE": "FRANCE",
          "STREET": "2 rue des métiers",
          "CITY": "21110 Genlis"
        },
        "SEND_MESSAGE": {
          "TO": "contact@mantion-smt.com",
          "CC": "",
          "SUBJECT": "Produit Moventiv",
          "BODY": "Bonjour,"
        }
      }
    }
  },
  "en": {
    "ABOUT_PAGE": {
      "NAVBAR_TITLE": "About",
      "CONTENT_TITLE": "MANTION Door Control",
      "VERSION": "Version :",
      "LAST_MODIFICATION": "Last modifications : ",
      "PARAGRAPHE1": "New application bringing together the previous MANTION apps. The main features remain the same, with improved stability and an improved user interface.",
      "PARAGRAPHE2": "Addition of a warning when changing weight",
      "PARAGRAPHE2_LIST": {
        "ITEM1": "",
        "ITEM2": "",
        "ITEM3": ""
      },
      "PARAGRAPHE3": "Adding this page (About), Adding the page: Who are we?",
      "PARAGRAPHE4": "Added weight range 60-80kg (motor after SN-2307 only)"
    },
    "CONTACT_PAGE": {
      "NAVBAR_TITLE": "Contact",
      "SEND_A_MESSAGE": "Send a message",
      "CONTACT_1": {
        "PHONE": {
          "USERSEE": "Call +33 (0)3 81 50 56 77",
          "SYSTEMCALL": "33381505677"
        },
        "ADDRESS": {
          "NAME": "MANTION SAS",
          "STATE": "FRANCE",
          "STREET": "7 rue Gay Lussac",
          "CITY": "25000 BESANÇON"
        },
        "SEND_MESSAGE": {
          "TO": "contact@mantion.com",
          "CC": "contact@mantion-smt.com",
          "SUBJECT": "Product Moventiv",
          "BODY": "Hello,"
        }
      },
      "CONTACT_2": {
        "PHONE": {
          "USERSEE": "Call +33 (0)3 80 37 85 71",
          "SYSTEMCALL": "33380378571"
        },
        "ADDRESS": {
          "NAME": "MANTION SMT",
          "STATE": "FRANCE",
          "STREET": "2 rue des métiers",
          "CITY": "21110 Genlis"
        },
        "SEND_MESSAGE": {
          "TO": "contact@mantion-smt.com",
          "CC": "",
          "SUBJECT": "Product Moventiv",
          "BODY": "Hello,"
        }
      }
    }
  },
  "de": {
    "ABOUT_PAGE": {
      "NAVBAR_TITLE": "Über",
      "CONTENT_TITLE": "MANTION Door Control",
      "VERSION": "Version :",
      "LAST_MODIFICATION": "Letzte Änderungen : ",
      "PARAGRAPHE1": "Neue Anwendung, die die bisherigen MANTION Apps zusammenführt. Die Hauptfunktionen bleiben unverändert, mit besserer Stabilität und einer verbesserten Benutzeroberfläche.",
      "PARAGRAPHE2": "Hinzufügen einer Warnung beim Ändern des Gewichts",
      "PARAGRAPHE2_LIST": {
        "ITEM1": "",
        "ITEM2": "",
        "ITEM3": ""
      },
      "PARAGRAPHE3": "Hinzufügen dieser Seite (Über), Hinzufügen der Seite: Wer sind wir?",
      "PARAGRAPHE4": "Gewichtsbereich 60-80kg hinzugefügt (nur Motor nach SN-2307)"
    },
    "CONTACT_PAGE": {
      "NAVBAR_TITLE": "Kontakt",
      "SEND_A_MESSAGE": "Senden Sie eine Nachricht",
      "CONTACT_1": {
        "PHONE": {
          "USERSEE": "Tél +33 (0)3 81 50 56 77",
          "SYSTEMCALL": "492056582690"
        },
        "ADDRESS": {
          "NAME": "MANTION SAS",
          "STATE": "FRANCE",
          "STREET": "7 rue Gay Lussac",
          "CITY": "25000 BESANÇON"
        },
        "SEND_MESSAGE": {
          "TO": "contact@mantion.com",
          "CC": "contact@mantion-smt.com",
          "SUBJECT": "Produkt Motor WIDOOR",
          "BODY": "Guten Tag!"
        }
      },
      "CONTACT_2": {
        "PHONE": {
          "USERSEE": "Tel +49 2056 582690",
          "SYSTEMCALL": "492056582690"
        },
        "ADDRESS": {
          "NAME": "MANTION Baubeschläge GmbH",
          "STATE": "Deutschland",
          "STREET": "Dieselstr. 18",
          "CITY": "42579 Heiligenhaus"
        },
        "SEND_MESSAGE": {
          "TO": "into@mantion.de",
          "CC": "",
          "SUBJECT": "Produkt Motor WIDOOR",
          "BODY": "Guten Tag!"
        }
      }
    }
  },
  "pl": {
    "ABOUT_PAGE": {
      "NAVBAR_TITLE": "O aplikacji",
      "CONTENT_TITLE": "MANTION Door Control",
      "VERSION": "Wersja:",
      "LAST_MODIFICATION": "Ostatnie modyfikacje:",
      "PARAGRAPHE1": "Lista wyboru wagi zapamiętuje ostatnio wybraną wartość.",
      "PARAGRAPHE2": "Dodanie ostrzeżenia przy zmianie wagi.",
      "PARAGRAPHE2_LIST": {
        "ITEM1": "",
        "ITEM2": "",
        "ITEM3": ""
      },
      "PARAGRAPHE3": "Dodanie tej strony (O aplikacji), dodanie strony: Kim jesteśmy?",
      "PARAGRAPHE4": "Dodano zakres wagi 60-80 kg (tylko napędy od numeru seryjnego SN-2307)"
    },
    "CONTACT_PAGE": {
      "NAVBAR_TITLE": "Kontakt",
      "SEND_A_MESSAGE": "Wyślij wiadomość",
      "CONTACT_1": {
        "PHONE": {
          "USERSEE": "Zadzwoń +48 22 8187722",
          "SYSTEMCALL": "48228187722"
        },
        "ADDRESS": {
          "NAME": "MANTION POLSKA SP. Z O.O.",
          "STATE": "POLSKA",
          "STREET": "ulica Boruty 2A",
          "CITY": "03-769 WARSZAWA"
        },
        "SEND_MESSAGE": {
          "TO": "biuro@mantion.pl",
          "CC": "contact@mantion-smt.com",
          "SUBJECT": "Produkt WIDOOR",
          "BODY": "Dzień dobry,"
        }
      },
      "CONTACT_2": {
        "PHONE": {
          "USERSEE": "Zadzwoń +33 (0)3 80 37 85 71",
          "SYSTEMCALL": "33380378571"
        },
        "ADDRESS": {
          "NAME": "MANTION SMT",
          "STATE": "FRANCE",
          "STREET": "2 rue des métiers",
          "CITY": "21110 Genlis"
        },
        "SEND_MESSAGE": {
          "TO": "contact@mantion-smt.com",
          "CC": "",
          "SUBJECT": "Produkt WIDOOR",
          "BODY": "Dzień dobry,"
        }
      }
    }
  }
} as const;

export function normalizeAppInfoLanguage(
  value: string | null,
): AppInfoLanguage {
  return value === 'fr' || value === 'en' || value === 'de' || value === 'pl'
    ? value
    : 'en';
}

export function appInfoCopyFor(language: AppInfoLanguage): AppInfoCopy {
  const source = LEGACY_APP_INFO[language] as any;
  const about = source.ABOUT_PAGE;
  const contact = source.CONTACT_PAGE;
  const address = contact.CONTACT_2.ADDRESS;

  return Object.freeze({
    aboutTitle: about.NAVBAR_TITLE,
    aboutContentTitle: about.CONTENT_TITLE,
    versionLabel: about.VERSION,
    lastModification: about.LAST_MODIFICATION,
    lastModificationText: about.PARAGRAPHE1,
    contactTitle: contact.NAVBAR_TITLE,
    sendMessage: contact.SEND_A_MESSAGE,
    companyName: address.NAME,
    phoneLabel: contact.CONTACT_2.PHONE.USERSEE,
    addressLines: Object.freeze([
      address.STATE,
      address.STREET,
      address.CITY,
    ].filter((value): value is string => Boolean(value))),
  });
}
