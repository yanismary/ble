export type LegalNoticeLanguage = 'fr' | 'en' | 'de' | 'pl';

export interface LegalDefinition {
  readonly term: string;
  readonly description: string;
}

export interface LegalNoticeCopy {
  readonly navbarTitle: string;
  readonly title: string;
  readonly sections: readonly {
    readonly title: string;
    readonly paragraphs: readonly string[];
  }[];
  readonly definitionsTitle: string;
  readonly definitions: readonly LegalDefinition[];
}

const LEGACY_GCU = {
  "fr": {
    "NAVBAR_TITLE": "CGU",
    "TITLE": "Conditions Générales d’Utilisation de l’Application",
    "SUB_TITLE_1": "1. Objet",
    "CHAPTER_1": {
      "PARA_1": "Les présentes conditions Générales ont pour objet de définir les modalités des mises à disposition et d'utilisation de l'application de MANTION SMT, ainsi que les services associés. Tout accès et/ou utilisation de l'Application, et des services associés suppose l'acceptation et les respect de l'ensemble des termes des présentes Conditions.",
      "PARA_2": "Dans le cas ou l'utilisateur d'Application ne souhaite pas accepter tout ou parties des présentes conditions générales, celle-ci ne lui sera plus accessible.",
      "PARA_3": "La version actuelle en ligne de ces conditions générales d'utilisation de l'Application et des services associés, et ce jusqu'à qu'une nouvelle version la remplace."
    },
    "SUB_TITLE_2": "2. Mentions légales",
    "CHAPTER_2": {
      "PARA_1": "L' Application est éditée pas la société MANTION SMT. L'Editeur est titulaire de l'ensemble des droits sur l'Application, et les services associés."
    },
    "SUB_TITLE_3": "3. Définitions",
    "CHAPTER_3": {
      "DEF_OBJECT_1": "Application : ",
      "DEF_1": "Désigne l'application et les services associés. Elles sont constituées de mannière non limitative d'un logiciel, de mise à jour d'un logiciel, de mises à jour de ce logiciel et de tout ou partie des éléments suivants : base de données, contenu éditorial, graphisme, photo, vidéo. Il s'agit d'un programme rendu accessible par MANTION SMT.",
      "DEF_OBJECT_2": "Utilisateur : ",
      "DEF_2": "Désigne toute personne physique majeure qui est responsable de l'utilisation de l'Application.",
      "DEF_OBJECT_3": "Editeur : ",
      "DEF_3": "Désigne MANTION SMT"
    }
  },
  "en": {
    "NAVBAR_TITLE": "CGU",
    "TITLE": "Conditions Générales d’Utilisation de l’Application",
    "SUB_TITLE_1": "1. Objet",
    "CHAPTER_1": {
      "PARA_1": "Les présentes conditions Générales ont pour objet de définir les modalités des mises à disposition et d'utilisation de l'application de MANTION SMT, ainsi que les services associés. Tout accès et/ou utilisation de l'Application, et des services associés suppose l'acceptation et les respect de l'ensemble des termes des présentes Conditions.",
      "PARA_2": "Dans le cas ou l'utilisateur d'Application ne souhaite pas accepter tout ou parties des présentes conditions générales, celle-ci ne lui sera plus accessible.",
      "PARA_3": "La version actuelle en ligne de ces conditions générales d'utilisation de l'Application et des services associés, et ce jusqu'à qu'une nouvelle version la remplace."
    },
    "SUB_TITLE_2": "2. Mentions légales",
    "CHAPTER_2": {
      "PARA_1": "L' Application est éditée pas la société MANTION SMT. L'Editeur est titulaire de l'ensemble des droits sur l'Application, et les services associés."
    },
    "SUB_TITLE_3": "3. Définitions",
    "CHAPTER_3": {
      "DEF_OBJECT_1": "Application : ",
      "DEF_1": "Désigne l'application et les services associés. Elles sont constituées de mannière non limitative d'un logiciel, de mise à jour d'un logiciel, de mises à jour de ce logiciel et de tout ou partie des éléments suivants : base de données, contenu éditorial, graphisme, photo, vidéo. Il s'agit d'un programme rendu accessible par MANTION SMT.",
      "DEF_OBJECT_2": "Utilisateur : ",
      "DEF_2": "Désigne toute personne physique majeure qui est responsable de l'utilisation de l'Application.",
      "DEF_OBJECT_3": "Editeur : ",
      "DEF_3": "Désigne MANTION SMT"
    }
  },
  "de": {
    "NAVBAR_TITLE": "AGB",
    "TITLE": "Generelle Bestimmungen bei Nutzung der App",
    "SUB_TITLE_1": "1. Gegenstand",
    "CHAPTER_1": {
      "PARA_1": "Die generellen Bestimmungen gelten für die App sowie alle weiteren Leistungen von Mantion SMT sowie deren Vertriebspartner. Bei Nutzung der App gelten die Allgemeinen Geschäftsbedingungen von Mantion SMT sowie dazugehöriger Leistungen. ",
      "PARA_2": "Die App kann nur genutzt werden, wenn die Allgemeinen Geschäftsbedingungen akzeptiert werden.",
      "PARA_3": "Die aktuelle Version gilt so lange, bis sie durch eine neue Version ersetzt wird."
    },
    "SUB_TITLE_2": "2. Hinweise",
    "CHAPTER_2": {
      "PARA_1": "Die App wurde von MANTION SMT entwickelt. Der Entwicklet behält sich alle Rechte an der App sowie dazugehörige Leistungen vor."
    },
    "SUB_TITLE_3": "3. Definition",
    "CHAPTER_3": {
      "DEF_OBJECT_1": "App: ",
      "DEF_1": "Die mobile Applikationssoftware, wie Sie im App Store oder bei Google Play zum Herunterladen angeboten wird, sowieso die dazugehörigen Leistungen. Dazu gehört die Software sowie alle verbunden Dateien und nachfolgende Elemente: Texte, Bilder, Fotos, Videos, Funktionen.",
      "DEF_OBJECT_2": "Nutzer: ",
      "DEF_2": "Alle physischen Personen welche die App nutzen.",
      "DEF_OBJECT_3": "Entwickler: ",
      "DEF_3": "MANTION SMT"
    }
  },
  "pl": {
    "NAVBAR_TITLE": "Regulamin",
    "TITLE": "Ogólne Warunki Użytkowania Aplikacji",
    "SUB_TITLE_1": "1. Przedmiot",
    "CHAPTER_1": {
      "PARA_1": "Niniejsze Ogólne Warunki mają na celu określenie zasad udostępniania i użytkowania aplikacji MANTION SMT oraz powiązanych usług. Każdy dostęp i/lub korzystanie z Aplikacji oraz powiązanych usług oznacza akceptację i przestrzeganie wszystkich postanowień niniejszych Warunków.",
      "PARA_2": "W przypadku gdy użytkownik Aplikacji nie chce zaakceptować wszystkich lub części niniejszych ogólnych warunków, Aplikacja nie będzie dla niego dostępna.",
      "PARA_3": "Aktualna wersja online niniejszych ogólnych warunków użytkowania Aplikacji i powiązanych usług obowiązuje do czasu zastąpienia jej nową wersją."
    },
    "SUB_TITLE_2": "2. Informacje prawne",
    "CHAPTER_2": {
      "PARA_1": "Aplikacja jest wydawana przez spółkę MANTION SMT. Wydawca posiada wszelkie prawa do Aplikacji i powiązanych usług."
    },
    "SUB_TITLE_3": "3. Definicje",
    "CHAPTER_3": {
      "DEF_OBJECT_1": "Aplikacja:",
      "DEF_1": "Oznacza aplikację i powiązane usługi. Składają się one w sposób nieograniczony z oprogramowania, aktualizacji oprogramowania oraz wszystkich lub części następujących elementów: bazy danych, treści redakcyjnych, grafiki, zdjęć, wideo. Jest to program udostępniany przez MANTION SMT.",
      "DEF_OBJECT_2": "Użytkownik:",
      "DEF_2": "Oznacza każdą pełnoletnią osobę fizyczną odpowiedzialną za korzystanie z Aplikacji.",
      "DEF_OBJECT_3": "Wydawca:",
      "DEF_3": "Oznacza MANTION SMT"
    }
  }
} as const;

export function normalizeLegalNoticeLanguage(
  value: string | null,
): LegalNoticeLanguage {
  return value === 'fr' || value === 'en' || value === 'de' || value === 'pl'
    ? value
    : 'en';
}

export function legalNoticeCopyFor(
  language: LegalNoticeLanguage,
): LegalNoticeCopy {
  const source = LEGACY_GCU[language] as any;

  return Object.freeze({
    navbarTitle: source.NAVBAR_TITLE,
    title: source.TITLE,
    sections: Object.freeze([
      Object.freeze({
        title: source.SUB_TITLE_1,
        paragraphs: Object.freeze([
          source.CHAPTER_1.PARA_1,
          source.CHAPTER_1.PARA_2,
          source.CHAPTER_1.PARA_3,
        ]),
      }),
      Object.freeze({
        title: source.SUB_TITLE_2,
        paragraphs: Object.freeze([
          source.CHAPTER_2.PARA_1,
        ]),
      }),
    ]),
    definitionsTitle: source.SUB_TITLE_3,
    definitions: Object.freeze([
      Object.freeze({
        term: source.CHAPTER_3.DEF_OBJECT_1,
        description: source.CHAPTER_3.DEF_1,
      }),
      Object.freeze({
        term: source.CHAPTER_3.DEF_OBJECT_2,
        description: source.CHAPTER_3.DEF_2,
      }),
      Object.freeze({
        term: source.CHAPTER_3.DEF_OBJECT_3,
        description: source.CHAPTER_3.DEF_3,
      }),
    ]),
  });
}
