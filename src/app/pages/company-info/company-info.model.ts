export type CompanyInfoLanguage = 'fr' | 'en' | 'de' | 'pl';

export interface CompanyInfoCopy {
  readonly navbarTitle: string;
  readonly contentTitle: string;
  readonly contentSubtitle: string;
  readonly introduction: string;
  readonly expertiseIntro: string;
  readonly expertiseItems: readonly string[];
  readonly paragraph3: string;
  readonly paragraph4: string;
  readonly addressPresentation: string;
  readonly addressLocalization: string;
}

const LEGACY_WHO = {
  "fr": {
    "NAVBAR_TITLE": "Qui sommes nous ?",
    "CONTENT_TITLE": "MANTION SMT",
    "CONTENT_SUBTITLE": "LE SPÉCIALISTE DE LA MOTORISATION POUR L'HABITAT",
    "PARGRAPH1": "De la conception à la réalisation, de la fabrication à la commercialisation, MANTION SMT vous accompagne dans vos projets de motorisation, grâce à une équipe soucieuse de répondre à vos besoins.",
    "PARGRAPH2": "MANTION SMT propose une gamme complète de produits de qualité, garantis 5 ans",
    "PARGRAPH2_LIST": {
      "ITEM1": "Motorisations pour volets battants",
      "ITEM2": "Motorisations pour volets coulissants",
      "ITEM3": "Motorisations pour portes intérieures coulissantes"
    },
    "PARGRAPH3": "Les produits MANTION SMT sont innovants et brevetés. Ils apportent un confort important et une réelle avancée dans le domaine de l'aide à la personne.",
    "PARGRAPH4": "Des solutions simples aux solutions les plus élaborées, MANTION SMT met son savoir faire à votre disposition afin de vous satisfaire. Le département MANTION SMT réalise des produits \"à la carte\" (devis sur demande)",
    "ADDRESS": {
      "PRESENTATION": "L’ensemble des services commerciaux, la R&D, la fabrication, les services administratifs ainsi qu’une salle d’exposition sont situés :",
      "LOCALIZATION": "2, rue des métiers, ZA de la Tille, 21110 GENLIS (France)"
    }
  },
  "en": {
    "NAVBAR_TITLE": "Who are we ?",
    "CONTENT_TITLE": "MANTION SMT",
    "CONTENT_SUBTITLE": "The specialist in motors for home",
    "PARGRAPH1": "From design to completion, from manufacturing to marketing, MANTION SMT support you in your  projects, thanks to a team committed to respond to your requests.",
    "PARGRAPH2": "MANTION SMT offers a wide range of high quality products, with 5 years warranty",
    "PARGRAPH2_LIST": {
      "ITEM1": "Hinged shutters motors",
      "ITEM2": "Sliding shutters motors",
      "ITEM3": "Sliding indoor doors motors"
    },
    "PARGRAPH3": "MANTION SMT products are innovating and patented. They provide an important comfort and a real progress in the field of aid to individuals.",
    "PARGRAPH4": "From simple solutions to the most elaborated solutions, MANTION SMT puts their knowledge at your disposal to completely meet your needs. MANTION SMT manufacture products upon application (quotation on demand)",
    "ADDRESS": {
      "PRESENTATION": "All commercial services, the research and development service, the manufacturing, and administrative services are located :",
      "LOCALIZATION": "2, rue des métiers, ZA de la Tille, 21110 GENLIS (FRANCE)"
    }
  },
  "de": {
    "NAVBAR_TITLE": "Wer sind wir?",
    "CONTENT_TITLE": "MANTION SMT",
    "CONTENT_SUBTITLE": "Der Spezialist für Heimmotoren",
    "PARGRAPH1": "Vom Design bis zur Entwicklung, von der Herstellung bis zum Marketing, unterstützt Sie MANTION SMT bei Ihren Projekten mit einem Team, das sich vollstens um Ihre Zufriedenheit bemüht.",
    "PARGRAPH2": "MANTION SMT bietet ein breites Sortiment an Qualitätsprodukten mit 5 Jahren Garantie.",
    "PARGRAPH2_LIST": {
      "ITEM1": "Motoren für Klappläden",
      "ITEM2": "Motoren für Schiebeläden",
      "ITEM3": "Motoren für Schiebetüren im Innenbereich"
    },
    "PARGRAPH3": "MANTION SMT Produkte sind innovativ und patentiert. Sie bieten wichtigen Komfort und echten Fortschritt im Bereich der Motorisierung Ihres Zuhauses.",
    "PARGRAPH4": "MANTION SMT bieten Ihnen von einfachen bis komplexen Lösungen alles, um Ihren Ansprüchen gerecht zu werden. MANTION SMT stellt auch auf Ihre Wünsche individuell zugeschnitten Produkte her. (Preis auf Anfrage.)",
    "ADDRESS": {
      "PRESENTATION": "Alle kommerziellen Dienstleistungen, die Forschungs- und Entwicklungsabteilung, die Herstellung sowie alle administrativen Dienste haben Ihren Standort hier:",
      "LOCALIZATION": "2, rue des métiers, ZA de la Tille, 21110 GENLIS (Frankreich)"
    }
  },
  "pl": {
    "NAVBAR_TITLE": "Kim jesteśmy?",
    "CONTENT_TITLE": "MANTION SMT",
    "CONTENT_SUBTITLE": "Specjalista w dziedzinie napędów do domu",
    "PARGRAPH1": "Od projektu do realizacji, od produkcji po sprzedaż — MANTION SMT i jego zaangażowany zespół towarzyszą Ci na każdym etapie.",
    "PARGRAPH2": "MANTION SMT oferuje szeroką gamę wysokiej jakości produktów z 5-letnią gwarancją.",
    "PARGRAPH2_LIST": {
      "ITEM1": "Napędy do okiennic uchylnych",
      "ITEM2": "Napędy do okiennic przesuwnych",
      "ITEM3": "Napędy do przesuwnych drzwi wewnętrznych"
    },
    "PARGRAPH3": "Innowacyjne i opatentowane produkty MANTION SMT wyznaczają nowe standardy komfortu i stanowią prawdziwy przełom w dziedzinie inteligentnych rozwiązań dla domu.",
    "PARGRAPH4": "Od prostych instalacji po kompleksowe projekty — eksperci MANTION SMT są gotowi sprostać każdemu wyzwaniu. Produkcja na zamówienie — wycena na żądanie.",
    "ADDRESS": {
      "PRESENTATION": "Siedziba firmy, w której mieszczą się działy handlowy, badań i rozwoju, produkcji oraz administracji:",
      "LOCALIZATION": "2, rue des Métiers, Z.A. de la Tille, 21110 GENLIS (FRANCE)"
    }
  }
} as const;

export function normalizeCompanyInfoLanguage(
  value: string | null,
): CompanyInfoLanguage {
  return value === 'fr' || value === 'en' || value === 'de' || value === 'pl'
    ? value
    : 'en';
}

export function companyInfoCopyFor(
  language: CompanyInfoLanguage,
): CompanyInfoCopy {
  const source = LEGACY_WHO[language] as any;

  return Object.freeze({
    navbarTitle: source.NAVBAR_TITLE,
    contentTitle: source.CONTENT_TITLE,
    contentSubtitle: source.CONTENT_SUBTITLE,
    introduction: source.PARGRAPH1,
    expertiseIntro: source.PARGRAPH2,
    expertiseItems: Object.freeze([
      source.PARGRAPH2_LIST.ITEM1,
      source.PARGRAPH2_LIST.ITEM2,
      source.PARGRAPH2_LIST.ITEM3,
    ]),
    paragraph3: source.PARGRAPH3,
    paragraph4: source.PARGRAPH4,
    addressPresentation: source.ADDRESS.PRESENTATION,
    addressLocalization: source.ADDRESS.LOCALIZATION,
  });
}
