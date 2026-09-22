export type LegalNoticeLanguage = 'fr' | 'en' | 'de' | 'pl';

export interface LegalDefinition {
  readonly term: string;
  readonly description: string;
}

export interface LegalNoticeCopy {
  readonly navbarTitle: string;
  readonly title: string;
  readonly lastUpdatedLabel: string;
  readonly lastUpdated: string;
  readonly sections: readonly {
    readonly title: string;
    readonly paragraphs: readonly string[];
  }[];
  readonly definitionsTitle: string;
  readonly definitions: readonly LegalDefinition[];
}

const TERMS_COPY: Readonly<Record<LegalNoticeLanguage, LegalNoticeCopy>> = {
  fr: {
    navbarTitle: 'Conditions d’utilisation',
    title: 'Conditions Générales d’Utilisation de MANTION Door Control',
    lastUpdatedLabel: 'Dernière mise à jour :',
    lastUpdated: '22 septembre 2026',
    sections: [
      {
        title: '1. Objet',
        paragraphs: [
          'Les présentes conditions définissent les modalités d’accès et d’utilisation de MANTION Door Control, application éditée par MANTION SMT. Elle permet de communiquer avec certaines motorisations MANTION compatibles pour les identifier, les commander, consulter leurs informations et modifier certains paramètres.',
          'L’utilisation de l’application implique l’acceptation des présentes Conditions Générales d’Utilisation.',
        ],
      },
      {
        title: '2. Fonctionnement de l’application',
        paragraphs: [
          'L’application communique localement avec les motorisations au moyen du Bluetooth Low Energy (BLE). Selon le produit et les droits disponibles, elle peut permettre la détection et la connexion, l’ouverture ou la fermeture, la modification des paramètres, la consultation d’informations techniques et de diagnostic ainsi que l’accès à certains réglages professionnels ou protégés.',
          'Les fonctions disponibles peuvent varier selon le produit, sa version matérielle, son firmware et la version de l’application.',
        ],
      },
      {
        title: '3. Conditions d’utilisation',
        paragraphs: [
          'L’utilisateur est responsable des commandes et réglages qu’il effectue. Avant toute commande, il doit s’assurer que le mouvement peut être réalisé sans danger pour les personnes, les animaux et les biens.',
          'Les réglages techniques ou professionnels ne doivent être modifiés que par des personnes disposant des compétences ou autorisations nécessaires.',
          'Les notices et procédures de sécurité propres à chaque produit restent prioritaires. L’application ne remplace pas les dispositifs de sécurité physiques.',
        ],
      },
      {
        title: '4. Compatibilité et Bluetooth',
        paragraphs: [
          'L’utilisation nécessite un appareil Android ou iOS compatible, le Bluetooth activé, les permissions système nécessaires et une motorisation MANTION compatible à proximité.',
          'La qualité de la communication BLE dépend notamment du téléphone ou de la tablette, de la distance, de l’environnement radio et des versions logicielles.',
        ],
      },
      {
        title: '5. Disponibilité et mises à jour',
        paragraphs: [
          'MANTION SMT peut faire évoluer l’application pour améliorer son fonctionnement et sa sécurité, maintenir la compatibilité avec Android et iOS, ajouter, modifier ou supprimer certaines fonctionnalités, ou prendre en charge de nouveaux produits et firmwares.',
          'Une mise à jour de l’application ou du produit peut être nécessaire pour disposer de certaines fonctions.',
        ],
      },
      {
        title: '6. Données et stockage local',
        paragraphs: [
          'L’application fonctionne principalement localement, par communication BLE directe avec les équipements.',
          'Elle peut enregistrer sur l’appareil mobile certaines informations nécessaires à son fonctionnement et à sa personnalisation, notamment des préférences utilisateur, la langue, des options d’affichage et certaines informations associées aux équipements.',
        ],
      },
      {
        title: '7. Propriété intellectuelle',
        paragraphs: [
          'L’application, son logiciel, son interface, ses textes, graphismes, illustrations, logos et marques sont protégés par les droits de propriété intellectuelle applicables. Leur utilisation ne confère aucun droit de propriété sur ces éléments.',
        ],
      },
      {
        title: '8. Responsabilité',
        paragraphs: [
          'L’utilisateur reste responsable des commandes et réglages effectués. Une utilisation non conforme, le non-respect des instructions, des réglages réalisés par une personne non autorisée, un produit défectueux ou mal installé, une incompatibilité système ou une perturbation BLE indépendante de l’application peuvent affecter son fonctionnement.',
          'La responsabilité de MANTION SMT est appréciée dans chaque cas sous réserve des dispositions légales impératives applicables.',
        ],
      },
      {
        title: '9. Éditeur et contact',
        paragraphs: [
          'MANTION SMT',
          '2 rue des Métiers',
          '21110 Genlis, France',
          'appsupport@mantion-smt.fr',
        ],
      },
      {
        title: '10. Modification des CGU',
        paragraphs: [
          'Les présentes conditions peuvent évoluer pour tenir compte des changements de l’application, des produits ou de la réglementation. La version mise à jour est accessible dans l’application.',
        ],
      },
    ],
    definitionsTitle: '11. Définitions',
    definitions: [
      { term: 'Application', description: 'MANTION Door Control, son logiciel, son interface et ses mises à jour.' },
      { term: 'Utilisateur', description: 'Toute personne qui utilise l’application.' },
      { term: 'Équipement ou motorisation', description: 'Produit MANTION compatible avec lequel l’application communique.' },
      { term: 'Éditeur', description: 'MANTION SMT.' },
    ],
  },
  en: {
    navbarTitle: 'Terms of Use',
    title: 'Terms of Use of MANTION Door Control',
    lastUpdatedLabel: 'Last updated:',
    lastUpdated: '22 September 2026',
    sections: [
      {
        title: '1. Purpose',
        paragraphs: [
          'These Terms govern access to and use of MANTION Door Control, an app published by MANTION SMT. The app communicates with certain compatible MANTION motorized systems to identify and operate them, view their information and change certain settings.',
          'Using the app constitutes acceptance of these Terms of Use.',
        ],
      },
      {
        title: '2. How the app works',
        paragraphs: [
          'The app communicates locally with motorized systems using Bluetooth Low Energy (BLE). Depending on the product and the user’s permissions, it may provide detection and connection, opening and closing controls, settings changes, technical and diagnostic information, and access to certain professional or protected settings.',
          'Available features may vary by product, hardware revision, firmware and app version.',
        ],
      },
      {
        title: '3. Conditions of use',
        paragraphs: [
          'Users are responsible for the commands and settings they apply. Before issuing a command, they must ensure that movement can take place without endangering people, animals or property.',
          'Technical or professional settings must be changed only by people with the necessary skills or authorization.',
          'The product’s operating instructions and safety procedures take precedence. The app does not replace physical safety devices.',
        ],
      },
      {
        title: '4. Compatibility and Bluetooth',
        paragraphs: [
          'Use requires a compatible Android or iOS device, Bluetooth enabled, the necessary system permissions and a compatible MANTION motorized system nearby.',
          'BLE connection quality depends in particular on the phone or tablet, distance, radio environment and software versions.',
        ],
      },
      {
        title: '5. Availability and updates',
        paragraphs: [
          'MANTION SMT may update the app to improve its operation or security, maintain Android and iOS compatibility, add, change or remove features, or support new products and firmware.',
          'An app or product update may be required to use certain features.',
        ],
      },
      {
        title: '6. Data and local storage',
        paragraphs: [
          'The app operates primarily locally through direct BLE communication with equipment.',
          'It may store on the mobile device information needed for operation and personalization, including user preferences, language, display options and certain information associated with equipment.',
        ],
      },
      {
        title: '7. Intellectual property',
        paragraphs: [
          'The app, its software, interface, text, graphics, illustrations, logos and trademarks are protected by applicable intellectual property rights. Using the app does not transfer ownership of these elements.',
        ],
      },
      {
        title: '8. Responsibility',
        paragraphs: [
          'Users remain responsible for the commands and settings they apply. Improper use, failure to follow instructions, settings changed by an unauthorized person, a defective or incorrectly installed product, system incompatibility or BLE interference outside the app’s control may affect operation.',
          'MANTION SMT’s liability in each case remains subject to applicable mandatory legal provisions.',
        ],
      },
      {
        title: '9. Publisher and contact',
        paragraphs: [
          'MANTION SMT',
          '2 rue des Métiers',
          '21110 Genlis, France',
          'appsupport@mantion-smt.fr',
        ],
      },
      {
        title: '10. Changes to these Terms',
        paragraphs: [
          'These Terms may change as the app, products or regulations evolve. The updated version is available in the app.',
        ],
      },
    ],
    definitionsTitle: '11. Definitions',
    definitions: [
      { term: 'App', description: 'MANTION Door Control, its software, interface and updates.' },
      { term: 'User', description: 'Any person using the app.' },
      { term: 'Equipment or motorized system', description: 'A compatible MANTION product with which the app communicates.' },
      { term: 'Publisher', description: 'MANTION SMT.' },
    ],
  },
  de: {
    navbarTitle: 'Nutzungsbedingungen',
    title: 'Nutzungsbedingungen für MANTION Door Control',
    lastUpdatedLabel: 'Letzte Aktualisierung:',
    lastUpdated: '22. September 2026',
    sections: [
      {
        title: '1. Gegenstand',
        paragraphs: [
          'Diese Nutzungsbedingungen regeln den Zugang zu und die Nutzung von MANTION Door Control, einer von MANTION SMT herausgegebenen App. Sie ermöglicht die Kommunikation mit bestimmten kompatiblen MANTION-Antrieben, um diese zu identifizieren und zu steuern, Informationen abzurufen und bestimmte Einstellungen zu ändern.',
          'Mit der Nutzung der App werden diese Nutzungsbedingungen akzeptiert.',
        ],
      },
      {
        title: '2. Funktionsweise der App',
        paragraphs: [
          'Die App kommuniziert lokal über Bluetooth Low Energy (BLE) mit den Antrieben. Je nach Produkt und verfügbaren Berechtigungen sind Erkennung und Verbindung, Öffnen und Schließen, die Änderung von Einstellungen, technische Informationen und Diagnosedaten sowie der Zugriff auf bestimmte Fach- oder geschützte Einstellungen möglich.',
          'Die verfügbaren Funktionen können je nach Produkt, Hardwareversion, Firmware und App-Version variieren.',
        ],
      },
      {
        title: '3. Nutzungsbedingungen',
        paragraphs: [
          'Nutzer sind für die von ihnen ausgelösten Befehle und vorgenommenen Einstellungen verantwortlich. Vor jedem Befehl müssen sie sicherstellen, dass die Bewegung ohne Gefahr für Personen, Tiere oder Sachen erfolgen kann.',
          'Technische oder fachliche Einstellungen dürfen nur von Personen mit den erforderlichen Kenntnissen oder Berechtigungen geändert werden.',
          'Die Anleitungen und Sicherheitsverfahren des jeweiligen Produkts haben Vorrang. Die App ersetzt keine physischen Sicherheitseinrichtungen.',
        ],
      },
      {
        title: '4. Kompatibilität und Bluetooth',
        paragraphs: [
          'Voraussetzung sind ein kompatibles Android- oder iOS-Gerät, aktiviertes Bluetooth, die erforderlichen Systemberechtigungen und ein kompatibler MANTION-Antrieb in der Nähe.',
          'Die Qualität der BLE-Verbindung hängt insbesondere vom Smartphone oder Tablet, der Entfernung, der Funkumgebung und den Softwareversionen ab.',
        ],
      },
      {
        title: '5. Verfügbarkeit und Updates',
        paragraphs: [
          'MANTION SMT kann die App weiterentwickeln, um Funktion und Sicherheit zu verbessern, die Kompatibilität mit Android und iOS zu erhalten, Funktionen hinzuzufügen, zu ändern oder zu entfernen und neue Produkte oder Firmwareversionen zu unterstützen.',
          'Für bestimmte Funktionen kann ein Update der App oder des Produkts erforderlich sein.',
        ],
      },
      {
        title: '6. Daten und lokale Speicherung',
        paragraphs: [
          'Die App arbeitet überwiegend lokal durch direkte BLE-Kommunikation mit den Geräten.',
          'Sie kann auf dem Mobilgerät Informationen speichern, die für Betrieb und Personalisierung erforderlich sind. Dazu gehören insbesondere Nutzereinstellungen, Sprache, Anzeigeoptionen und bestimmte gerätebezogene Informationen.',
        ],
      },
      {
        title: '7. Geistiges Eigentum',
        paragraphs: [
          'Die App, ihre Software, Oberfläche, Texte, Grafiken, Illustrationen, Logos und Marken sind durch geltende Rechte des geistigen Eigentums geschützt. Durch die Nutzung werden keine Eigentumsrechte daran übertragen.',
        ],
      },
      {
        title: '8. Verantwortung und Haftung',
        paragraphs: [
          'Nutzer bleiben für ihre Befehle und Einstellungen verantwortlich. Unsachgemäße Nutzung, Missachtung von Anweisungen, Einstellungen durch Unbefugte, ein defektes oder falsch installiertes Produkt, Systeminkompatibilität oder von der App unabhängige BLE-Störungen können den Betrieb beeinträchtigen.',
          'Die Haftung von MANTION SMT richtet sich im Einzelfall nach den zwingenden gesetzlichen Bestimmungen.',
        ],
      },
      {
        title: '9. Herausgeber und Kontakt',
        paragraphs: [
          'MANTION SMT',
          '2 rue des Métiers',
          '21110 Genlis, Frankreich',
          'appsupport@mantion-smt.fr',
        ],
      },
      {
        title: '10. Änderung der Nutzungsbedingungen',
        paragraphs: [
          'Diese Bedingungen können aufgrund von Änderungen der App, der Produkte oder der Rechtslage angepasst werden. Die aktualisierte Fassung ist in der App verfügbar.',
        ],
      },
    ],
    definitionsTitle: '11. Begriffsbestimmungen',
    definitions: [
      { term: 'App', description: 'MANTION Door Control einschließlich Software, Oberfläche und Updates.' },
      { term: 'Nutzer', description: 'Jede Person, die die App verwendet.' },
      { term: 'Gerät oder Antrieb', description: 'Ein kompatibles MANTION-Produkt, mit dem die App kommuniziert.' },
      { term: 'Herausgeber', description: 'MANTION SMT.' },
    ],
  },
  pl: {
    navbarTitle: 'Warunki użytkowania',
    title: 'Warunki użytkowania MANTION Door Control',
    lastUpdatedLabel: 'Ostatnia aktualizacja:',
    lastUpdated: '22 września 2026 r.',
    sections: [
      {
        title: '1. Przedmiot',
        paragraphs: [
          'Niniejsze warunki określają zasady dostępu do aplikacji MANTION Door Control i korzystania z niej. Wydawcą aplikacji jest MANTION SMT. Aplikacja umożliwia komunikację z wybranymi zgodnymi napędami MANTION w celu ich identyfikacji, sterowania nimi, przeglądania informacji oraz zmiany niektórych ustawień.',
          'Korzystanie z aplikacji oznacza akceptację niniejszych warunków użytkowania.',
        ],
      },
      {
        title: '2. Działanie aplikacji',
        paragraphs: [
          'Aplikacja komunikuje się lokalnie z napędami za pomocą Bluetooth Low Energy (BLE). W zależności od produktu i dostępnych uprawnień może umożliwiać wykrywanie i łączenie, otwieranie i zamykanie, zmianę ustawień, przeglądanie informacji technicznych i diagnostycznych oraz dostęp do wybranych ustawień specjalistycznych lub chronionych.',
          'Dostępne funkcje mogą zależeć od produktu, wersji sprzętu, oprogramowania napędu i wersji aplikacji.',
        ],
      },
      {
        title: '3. Zasady użytkowania',
        paragraphs: [
          'Użytkownik odpowiada za wydawane polecenia i wprowadzane ustawienia. Przed wydaniem polecenia musi upewnić się, że ruch urządzenia nie zagrozi ludziom, zwierzętom ani mieniu.',
          'Ustawienia techniczne lub specjalistyczne mogą zmieniać wyłącznie osoby posiadające odpowiednie kompetencje albo uprawnienia.',
          'Instrukcje i procedury bezpieczeństwa danego produktu mają pierwszeństwo. Aplikacja nie zastępuje fizycznych zabezpieczeń.',
        ],
      },
      {
        title: '4. Zgodność i Bluetooth',
        paragraphs: [
          'Korzystanie wymaga zgodnego urządzenia z systemem Android lub iOS, włączonego Bluetooth, niezbędnych uprawnień systemowych oraz zgodnego napędu MANTION znajdującego się w pobliżu.',
          'Jakość połączenia BLE zależy między innymi od telefonu lub tabletu, odległości, warunków radiowych oraz wersji oprogramowania.',
        ],
      },
      {
        title: '5. Dostępność i aktualizacje',
        paragraphs: [
          'MANTION SMT może rozwijać aplikację, aby poprawiać jej działanie i bezpieczeństwo, utrzymywać zgodność z Androidem i iOS, dodawać, zmieniać lub usuwać funkcje oraz obsługiwać nowe produkty i wersje oprogramowania napędów.',
          'Dostęp do niektórych funkcji może wymagać aktualizacji aplikacji lub produktu.',
        ],
      },
      {
        title: '6. Dane i pamięć lokalna',
        paragraphs: [
          'Aplikacja działa przede wszystkim lokalnie, komunikując się bezpośrednio z urządzeniami przez BLE.',
          'Może zapisywać na urządzeniu mobilnym informacje potrzebne do działania i personalizacji, w tym preferencje użytkownika, język, opcje wyświetlania oraz niektóre informacje związane z urządzeniami.',
        ],
      },
      {
        title: '7. Własność intelektualna',
        paragraphs: [
          'Aplikacja, jej oprogramowanie, interfejs, teksty, grafiki, ilustracje, logotypy i znaki towarowe podlegają ochronie na podstawie obowiązujących przepisów. Korzystanie z aplikacji nie przenosi praw własności do tych elementów.',
        ],
      },
      {
        title: '8. Odpowiedzialność',
        paragraphs: [
          'Użytkownik odpowiada za wydawane polecenia i wprowadzane ustawienia. Nieprawidłowe użytkowanie, niestosowanie się do instrukcji, zmiany ustawień przez osoby nieuprawnione, wadliwy lub błędnie zainstalowany produkt, niezgodność systemowa albo zakłócenia BLE niezależne od aplikacji mogą wpływać na jej działanie.',
          'Odpowiedzialność MANTION SMT jest w każdym przypadku oceniana z uwzględnieniem bezwzględnie obowiązujących przepisów prawa.',
        ],
      },
      {
        title: '9. Wydawca i kontakt',
        paragraphs: [
          'MANTION SMT',
          '2 rue des Métiers',
          '21110 Genlis, Francja',
          'appsupport@mantion-smt.fr',
        ],
      },
      {
        title: '10. Zmiany warunków',
        paragraphs: [
          'Niniejsze warunki mogą być zmieniane wraz z rozwojem aplikacji, produktów lub zmianą przepisów. Aktualna wersja jest dostępna w aplikacji.',
        ],
      },
    ],
    definitionsTitle: '11. Definicje',
    definitions: [
      { term: 'Aplikacja', description: 'MANTION Door Control wraz z oprogramowaniem, interfejsem i aktualizacjami.' },
      { term: 'Użytkownik', description: 'Każda osoba korzystająca z aplikacji.' },
      { term: 'Urządzenie lub napęd', description: 'Zgodny produkt MANTION, z którym komunikuje się aplikacja.' },
      { term: 'Wydawca', description: 'MANTION SMT.' },
    ],
  },
};

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
  return TERMS_COPY[language];
}
