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
      "PARA_1": "Les présentes conditions générales ont pour objet de définir les modalités de mise à disposition et d’utilisation de l’application MANTION SMT ainsi que des services associés. Tout accès à l’Application ou toute utilisation de celle-ci et des services associés suppose l’acceptation et le respect de l’ensemble des présentes Conditions.",
      "PARA_2": "Si l’utilisateur de l’Application ne souhaite pas accepter tout ou partie des présentes conditions générales, l’Application ne lui sera plus accessible.",
      "PARA_3": "La version actuellement publiée en ligne de ces conditions générales d’utilisation de l’Application et des services associés reste applicable jusqu’à son remplacement par une nouvelle version."
    },
    "SUB_TITLE_2": "2. Mentions légales",
    "CHAPTER_2": {
      "PARA_1": "L’Application est éditée par la société MANTION SMT. L’Éditeur est titulaire de l’ensemble des droits sur l’Application et les services associés."
    },
    "SUB_TITLE_3": "3. Définitions",
    "CHAPTER_3": {
      "DEF_OBJECT_1": "Application : ",
      "DEF_1": "Désigne l’application et les services associés. Ils comprennent notamment un logiciel et ses mises à jour, ainsi que tout ou partie des éléments suivants : base de données, contenu éditorial, graphismes, photographies et vidéos. Il s’agit d’un programme rendu accessible par MANTION SMT.",
      "DEF_OBJECT_2": "Utilisateur : ",
      "DEF_2": "Désigne toute personne physique majeure responsable de l’utilisation de l’Application.",
      "DEF_OBJECT_3": "Éditeur : ",
      "DEF_3": "Désigne MANTION SMT"
    }
  },
  "en": {
    "NAVBAR_TITLE": "Terms of use",
    "TITLE": "General Terms of Use of the Application",
    "SUB_TITLE_1": "1. Purpose",
    "CHAPTER_1": {
      "PARA_1": "These General Terms define the conditions under which the MANTION SMT application and its associated services are made available and used. Accessing or using the Application and its associated services implies acceptance of and compliance with all these Terms.",
      "PARA_2": "If an Application user does not wish to accept all or part of these General Terms, the Application will no longer be available to that user.",
      "PARA_3": "The current online version of these General Terms of Use for the Application and its associated services remains applicable until it is replaced by a new version."
    },
    "SUB_TITLE_2": "2. Legal notice",
    "CHAPTER_2": {
      "PARA_1": "The Application is published by MANTION SMT. The Publisher owns all rights to the Application and its associated services."
    },
    "SUB_TITLE_3": "3. Definitions",
    "CHAPTER_3": {
      "DEF_OBJECT_1": "Application: ",
      "DEF_1": "Means the application and its associated services. These include, without limitation, software and software updates, as well as all or part of the following: databases, editorial content, graphics, photographs and videos. It is a program made available by MANTION SMT.",
      "DEF_OBJECT_2": "User: ",
      "DEF_2": "Means any adult individual responsible for using the Application.",
      "DEF_OBJECT_3": "Publisher: ",
      "DEF_3": "Means MANTION SMT"
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
      "PARA_1": "Die App wurde von MANTION SMT entwickelt. Der Entwickler behält sich alle Rechte an der App und den dazugehörigen Leistungen vor."
    },
    "SUB_TITLE_3": "3. Definition",
    "CHAPTER_3": {
      "DEF_OBJECT_1": "App: ",
      "DEF_1": "Die mobile Anwendungssoftware, wie sie im App Store oder bei Google Play zum Herunterladen angeboten wird, sowie die dazugehörigen Leistungen. Dazu gehören die Software, alle verbundenen Dateien und folgende Elemente: Texte, Bilder, Fotos, Videos und Funktionen.",
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
