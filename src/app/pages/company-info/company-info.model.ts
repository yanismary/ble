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

interface LegacyCompanyInfoCopy {
  readonly NAVBAR_TITLE: string;
  readonly CONTENT_TITLE: string;
  readonly CONTENT_SUBTITLE: string;
  readonly PARGRAPH1: string;
  readonly PARGRAPH2: string;
  readonly PARGRAPH2_LIST: {
    readonly ITEM1: string;
    readonly ITEM2: string;
    readonly ITEM3: string;
  };
  readonly PARGRAPH3: string;
  readonly PARGRAPH4: string;
  readonly ADDRESS: {
    readonly PRESENTATION: string;
    readonly LOCALIZATION: string;
  };
}

const LEGACY_WHO = {
  "fr": {
    "NAVBAR_TITLE": "Qui sommes-nous ?",
    "CONTENT_TITLE": "MANTION SMT",
    "CONTENT_SUBTITLE": "LE SPÉCIALISTE DE LA MOTORISATION POUR L'HABITAT",
    "PARGRAPH1": "De la conception à la réalisation, de la fabrication à la commercialisation, MANTION SMT vous accompagne dans vos projets de motorisation, grâce à une équipe soucieuse de répondre à vos besoins.",
    "PARGRAPH2": "MANTION SMT propose une gamme complète de produits de qualité, garantis 5 ans.",
    "PARGRAPH2_LIST": {
      "ITEM1": "Motorisations pour volets battants",
      "ITEM2": "Motorisations pour volets coulissants",
      "ITEM3": "Motorisations pour portes intérieures coulissantes"
    },
    "PARGRAPH3": "Les produits MANTION SMT sont innovants et brevetés. Ils apportent un confort important et une réelle avancée dans le domaine de l'aide à la personne.",
    "PARGRAPH4": "Des solutions simples aux solutions les plus élaborées, MANTION SMT met son savoir-faire à votre disposition afin de répondre à vos besoins. Le département MANTION SMT réalise des produits \"à la carte\" (devis sur demande).",
    "ADDRESS": {
      "PRESENTATION": "L’ensemble des services commerciaux, la R&D, la fabrication, les services administratifs ainsi qu’une salle d’exposition sont situés :",
      "LOCALIZATION": "2, rue des métiers, ZA de la Tille, 21110 GENLIS (France)"
    }
  },
  "en": {
    "NAVBAR_TITLE": "Who are we?",
    "CONTENT_TITLE": "MANTION SMT",
    "CONTENT_SUBTITLE": "THE SPECIALIST IN HOME AUTOMATION MOTORS",
    "PARGRAPH1": "From design and manufacturing to marketing, MANTION SMT supports your automation projects with a team committed to meeting your needs.",
    "PARGRAPH2": "MANTION SMT offers a comprehensive range of high-quality products with a 5-year warranty.",
    "PARGRAPH2_LIST": {
      "ITEM1": "Motors for hinged shutters",
      "ITEM2": "Motors for sliding shutters",
      "ITEM3": "Motors for sliding interior doors"
    },
    "PARGRAPH3": "MANTION SMT products are innovative and patented. They provide greater comfort and genuine progress in solutions that assist people in their daily lives.",
    "PARGRAPH4": "From simple systems to the most advanced solutions, MANTION SMT puts its expertise at your disposal to meet your needs. MANTION SMT also manufactures custom products (quotation on request).",
    "ADDRESS": {
      "PRESENTATION": "The sales, research and development, manufacturing and administrative departments, as well as a showroom, are located at:",
      "LOCALIZATION": "2, rue des Métiers, ZA de la Tille, 21110 GENLIS (France)"
    }
  },
  "de": {
    "NAVBAR_TITLE": "Wer sind wir?",
    "CONTENT_TITLE": "MANTION SMT",
    "CONTENT_SUBTITLE": "DER SPEZIALIST FÜR ANTRIEBE IM WOHNBEREICH",
    "PARGRAPH1": "Von der Entwicklung über die Herstellung bis zur Vermarktung begleitet MANTION SMT Ihre Antriebsprojekte mit einem Team, das sich engagiert um Ihre Anforderungen kümmert.",
    "PARGRAPH2": "MANTION SMT bietet ein breites Sortiment an Qualitätsprodukten mit 5 Jahren Garantie.",
    "PARGRAPH2_LIST": {
      "ITEM1": "Motoren für Klappläden",
      "ITEM2": "Motoren für Schiebeläden",
      "ITEM3": "Motoren für Schiebetüren im Innenbereich"
    },
    "PARGRAPH3": "MANTION SMT Produkte sind innovativ und patentiert. Sie bieten wichtigen Komfort und echten Fortschritt im Bereich der Motorisierung Ihres Zuhauses.",
    "PARGRAPH4": "MANTION SMT bietet Ihnen von einfachen bis zu komplexen Lösungen alles, um Ihren Anforderungen gerecht zu werden. MANTION SMT stellt auch individuell auf Ihre Wünsche zugeschnittene Produkte her (Preis auf Anfrage).",
    "ADDRESS": {
      "PRESENTATION": "Vertrieb, Forschung und Entwicklung, Fertigung und Verwaltung sowie ein Ausstellungsraum befinden sich an folgendem Standort:",
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
      "LOCALIZATION": "2, rue des Métiers, Z.A. de la Tille, 21110 GENLIS (Francja)"
    }
  }
} as const satisfies Readonly<
  Record<CompanyInfoLanguage, LegacyCompanyInfoCopy>
>;

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
  const source: LegacyCompanyInfoCopy = LEGACY_WHO[language];

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
