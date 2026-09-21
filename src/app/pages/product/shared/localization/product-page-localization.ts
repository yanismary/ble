import { PRODUCT_PAGE_TEXT } from './product-page-text';
import { translatedProductPageTextFor } from './product-page-translations';

export type ProductPageLanguage = 'fr' | 'en' | 'de' | 'pl';

const MOVENTIV_CLOSE_LOCK_ALERT_TEXT = Object.freeze({
  fr: Object.freeze({
    title: 'Condamnation de la porte',
    message:
      'Vous allez condamner la porte en fermeture, il vous sera impossible de l\u2019ouvrir sans d\u00e9sactiver cette option.',
    ok: 'OK',
  }),
  en: Object.freeze({
    title: 'Door locked in closed position',
    message:
      'You will not be able to open the door without deactivating this option.',
    ok: 'OK',
  }),
  de: Object.freeze({
    title: 'T\u00fcr geschlossen halten',
    message:
      'Die T\u00fcr wird verriegelt und kann ohne Deaktivierung dieser Option nicht mehr ge\u00f6ffnet werden.',
    ok: 'OK',
  }),
  pl: Object.freeze({
    title: 'Drzwi zablokowane w pozycji zamkni\u0119tej.',
    message:
      'Nie b\u0119dzie mo\u017cna otworzy\u0107 drzwi bez dezaktywacji tej opcji.',
    ok: 'OK',
  }),
} satisfies Readonly<Record<ProductPageLanguage, Readonly<{
  title: string;
  message: string;
  ok: string;
}>>>);

const PRODUCT_LOCALIZED_LABELS = {
  "fr": {
    "sections": {
      "navbarTitle": "Commandes",
      "commands": "Commandes",
      "settings": "Réglages",
      "information": "Informations",
      "basic": "Basiques",
      "advanced": "Avancés",
      "motorState": "États des switchs",
      "general": "Informations générales",
      "version": "Versions des logiciels",
      "hardware": "Matériel",
      "maintenance": "Maintenance"
    },
    "commands": {
      "open": "Ouvrir",
      "openDelayed": "Ouvrir {{seconds}} s",
      "close": "Fermer",
      "lockedOpen": "Maintien de la porte en position ouverte",
      "lockedClosed": "Porte condamnée en position fermée"
    },
    "user": {
      "lighting": "Éclairage",
      "lockSetting": "Verrouiller le réglage",
      "unlockSetting": "Déverrouiller le réglage",
      "openSpeed": "Vitesse d'ouverture",
      "closeSpeed": "Vitesse de fermeture",
      "shortTiming": "Temporisation courte à la fermeture",
      "longTiming": "Temporisation longue à la fermeture",
      "dynamicLight": "Éclairage lors de l'ouverture",
      "rgb": "LED Principale",
      "nameRoom": "Nom et localisation",
      "nameLabel": "Modifier le nom de votre WIDOOR",
      "roomLabel": "Associer votre WIDOOR à une pièce",
      "validate": "VALIDER",
      "increase": "Incrémenter",
      "decrease": "Décrémenter"
    },
    "rooms": {
      "bedroom": "Chambre",
      "livingRoom": "Salon",
      "diningRoom": "Salle à manger",
      "kitchen": "Cuisine",
      "bathroom": "Salle de bain",
      "toilet": "Toilettes",
      "garageUtilityRoom": "Garage / Buanderie",
      "playroom": "Salle de jeux"
    },
    "expert": {
      "weightRange": "Réglage du poids",
      "nearOpenSpeed": "Vitesse en fin d'ouverture",
      "nearCloseSpeed": "Vitesse en fin de fermeture",
      "nearOpenTorque": "Force en fin d'ouverture",
      "nearCloseTorque": "Force en fin de fermeture",
      "brakingOpenPower": "Freinage en ouverture",
      "obstacleSensitivity": "Sensibilité de la détection d'obstacle",
      "breakForceAtOpen": "Force de freinage à l'ouverture"
    },
    "inputs": {
      "title": "Configuration des entrées",
      "input1": "Entrée 1",
      "input2": "Entrée 2",
      "radar": "Radar",
      "button": "Bouton"
    },
    "dates": {
      "firstCommissioning": "Date de la première mise en service",
      "lastMaintenance": "Date de la dernière maintenance",
      "totalCycles": "Nombre de cycles réalisés depuis la première mise en service",
      "cyclesSinceMaintenance": "Nombre de cycles réalisés depuis la dernière maintenance"
    },
    "version": {
      "motor": "Version microprogramme motorisation",
      "ble": "Version microprogramme bluetooth",
      "stack": "Version stack bluetooth",
      "controlHardware": "Identifiant matériel"
    },
    "maintenance": {
      "initializationCount": "Nombre de redémarrages",
      "cyclesSinceInitialization": "Nombre de cycles depuis le dernier redémarrage",
      "obstacleDetectionCount": "Nombre de détections d'obstacles",
      "wrongStopOpenCount": "Nombre de mauvaises arrivées en ouverture",
      "wrongStopCloseCount": "Nombre de mauvaises arrivées en fermeture",
      "learningCycleCount": "Nombre d'apprentissages",
      "encoderErrorCount": "Nombre d'erreurs codeur",
      "motorErrorCount": "Nombre d'erreurs moteur"
    },
    "motor": {
      "pushAndGo": "Push'n Go",
      "ble": "Bluetooth",
      "automaticManual": "Mode de fermeture",
      "direction": "Ouverture",
      "pairing": "Appairage / Apprentissage"
    },
    "motorStates": {
      "enabled": "Activé",
      "disabled": "Désactivé",
      "manual": "Manuel",
      "automatic": "Automatique",
      "clockwise": "Horaire",
      "counterClockwise": "Antihoraire",
      "learning": "Apprentissage",
      "pairing": "Appairage"
    },
    "actions": {
      "learning": "Apprentissage des butées",
      "reset": "Reset de tous les paramètres",
      "peripheralLock": "Verrou",
      "outputsTitle": "Configuration des sorties",
      "additionalTitle": "Commandes supplémentaires",
      "maintenance": "Maintenance effectuée",
      "setup": "Mise en service effectuée"
    },
    "moventiv": {
      "staticLight": "Activation du bandeau lumineux",
      "advancedTuning": "Réglages avancés",
      "expertTitle": "Réglages expert",
      "expertMode": "Mode expert",
      "expertPlaceholder": "Rentrez le mot de passe",
      "currentWeightProfile": "Profil actuel",
      "maximumWeight": "Poids maximum autorisé",
      "weightSelectTitle": "Sélectionner le poids de la porte",
      "weightWarning": "ATTENTION : La modification de ce paramètre entraînera la réinitialisation des paramètres de vitesse !",
      "weightCancel": "Annuler",
      "weightConfirm": "Valider",
      "directionLeft": "opposé sortie câbles",
      "directionRight": "Vers sortie câbles"
    }
  },
  "en": {
    "sections": {
      "navbarTitle": "Commands",
      "commands": "Commands",
      "settings": "Settings",
      "information": "Information",
      "basic": "Basic",
      "advanced": "Advanced",
      "motorState": "Switch states",
      "general": "General information",
      "version": "Firmware versions",
      "hardware": "Hardware",
      "maintenance": "Maintenance"
    },
    "commands": {
      "open": "Open",
      "openDelayed": "Open {{seconds}} s",
      "close": "Close",
      "lockedOpen": "Keep door open",
      "lockedClosed": "Door locked in closed position"
    },
    "user": {
      "lighting": "Lighting",
      "lockSetting": "Lock setting",
      "unlockSetting": "Unlock setting",
      "openSpeed": "Open speed",
      "closeSpeed": "Close speed",
      "shortTiming": "Short delay before closing",
      "longTiming": "Long delay before closing",
      "dynamicLight": "LED light during opening",
      "rgb": "main LED",
      "nameRoom": "Name and location",
      "nameLabel": "Change your WIDOOR's name",
      "roomLabel": "Associate your WIDOOR with a room",
      "validate": "VALIDATE",
      "increase": "Increment",
      "decrease": "Decrement"
    },
    "rooms": {
      "bedroom": "Bedroom",
      "livingRoom": "Living room",
      "diningRoom": "Dining room",
      "kitchen": "Kitchen",
      "bathroom": "Bathroom",
      "toilet": "Toilet",
      "garageUtilityRoom": "Garage / utility room",
      "playroom": "Playroom"
    },
    "expert": {
      "weightRange": "Weight tuning",
      "nearOpenSpeed": "Speed at end of open",
      "nearCloseSpeed": "Speed at end of close",
      "nearOpenTorque": "Force at end of opening",
      "nearCloseTorque": "Force at end of closing",
      "brakingOpenPower": "Braking on opening",
      "obstacleSensitivity": "Obstacle detection sensitivity",
      "breakForceAtOpen": "Braking force on opening"
    },
    "inputs": {
      "title": "Input configuration",
      "input1": "Input 1",
      "input2": "Input 2",
      "radar": "Radar",
      "button": "Button"
    },
    "dates": {
      "firstCommissioning": "Date of the first use",
      "lastMaintenance": "Date of the last maintenance",
      "totalCycles": "Number of open/close cycles since the first use",
      "cyclesSinceMaintenance": "Number of open/close cycles since the last maintenance"
    },
    "version": {
      "motor": "Door controller firmware",
      "ble": "Bluetooth firmware",
      "stack": "Bluetooth stack version",
      "controlHardware": "Door controller"
    },
    "maintenance": {
      "initializationCount": "Number of restarts",
      "cyclesSinceInitialization": "Number of cycles since last reboot",
      "obstacleDetectionCount": "Number of obstacle detections",
      "wrongStopOpenCount": "Number of wrong arrivals in open",
      "wrongStopCloseCount": "Number of wrong arrivals in close",
      "learningCycleCount": "Number of learning cycles",
      "encoderErrorCount": "Number of encoder errors",
      "motorErrorCount": "Number of motor errors"
    },
    "motor": {
      "pushAndGo": "Push'n Go",
      "ble": "Bluetooth",
      "automaticManual": "Closing mode",
      "direction": "Opening",
      "pairing": "Pairing / Learning"
    },
    "motorStates": {
      "enabled": "Enable",
      "disabled": "Disable",
      "manual": "Manual",
      "automatic": "Auto",
      "clockwise": "CW",
      "counterClockwise": "CCW",
      "learning": "Learning",
      "pairing": "Pairing"
    },
    "actions": {
      "learning": "Learning of stops",
      "reset": "Reset all parameters",
      "peripheralLock": "Locker",
      "outputsTitle": "Configuration of outputs",
      "additionalTitle": "Additional commands",
      "maintenance": "Maintenance done",
      "setup": "Setup done"
    },
    "moventiv": {
      "staticLight": "Activation of the illuminated panel",
      "advancedTuning": "Advanced tuning",
      "expertTitle": "Expert settings",
      "expertMode": "Expert mode",
      "expertPlaceholder": "Enter password",
      "currentWeightProfile": "Current weight profile",
      "maximumWeight": "Maximum weight",
      "weightSelectTitle": "Select door weight",
      "weightWarning": "CAUTION: Changing this setting will reset the speed settings!",
      "weightCancel": "Cancel",
      "weightConfirm": "Validate",
      "directionLeft": "Opposite of cable output",
      "directionRight": "To cable output"
    }
  },
  "de": {
    "sections": {
      "navbarTitle": "Befehle",
      "commands": "Befehle",
      "settings": "Einstellungen",
      "information": "Informationen",
      "basic": "Grundeinstellungen",
      "advanced": "Fortgeschrittene\nEinstellungen",
      "motorState": "Status",
      "general": "Allgemeine Informationen",
      "version": "Firmware-Versionen",
      "hardware": "Hardware-Version",
      "maintenance": "Wartung"
    },
    "commands": {
      "open": "Öffnen",
      "openDelayed": "{{seconds}} s öffnen",
      "close": "Schließen",
      "lockedOpen": "Tür geöffnet halten",
      "lockedClosed": "Tür geschlossen halten"
    },
    "user": {
      "lighting": "Beleuchtung",
      "lockSetting": "Einstellung sperren",
      "unlockSetting": "Einstellung entsperren",
      "openSpeed": "Öffnungsgeschwindigkeit",
      "closeSpeed": "Schließgeschwindigkeit",
      "shortTiming": "Schließverzögerung",
      "longTiming": "Lange Schließverzögerung",
      "dynamicLight": "LED-Leuchte während des Öffnens",
      "rgb": "Haupt-LED",
      "nameRoom": "Name und Raum",
      "nameLabel": "Ändern Sie den Namen Ihres WIDOOR Motors",
      "roomLabel": "Verknüpfen Sie den Raum Ihres WIDOOR Motors",
      "validate": "BESTÄTIGEN",
      "increase": "Erhöhen",
      "decrease": "Verringern"
    },
    "rooms": {
      "bedroom": "Schlafzimmer",
      "livingRoom": "Wohnzimmer",
      "diningRoom": "Esszimmer",
      "kitchen": "Küche",
      "bathroom": "Badezimmer",
      "toilet": "Toilette",
      "garageUtilityRoom": "Garage / Abstellraum",
      "playroom": "Spielzimmer"
    },
    "expert": {
      "weightRange": "Justierung des Gewichts",
      "nearOpenSpeed": "Endgeschwindigkeit beim Öffnen",
      "nearCloseSpeed": "Endgeschwindigkeit beim Schließen",
      "nearOpenTorque": "Öffnungsende Drehmoment",
      "nearCloseTorque": "Schließungsende Drehmoment",
      "brakingOpenPower": "Bremsung beim Öffnen",
      "obstacleSensitivity": "Empfindlichkeit der Hinderniserkennung",
      "breakForceAtOpen": "Abbremsung beim Öffnen"
    },
    "inputs": {
      "title": "Eingänge konfigurieren",
      "input1": "Eingang 1",
      "input2": "Eingang 2",
      "radar": "Radar",
      "button": "Taster"
    },
    "dates": {
      "firstCommissioning": "Datum der ersten Nutzung",
      "lastMaintenance": "Datum der letzten Wartung",
      "totalCycles": "Anzahl der Öffnungs- und Schließzyklen seit erster Nutzung",
      "cyclesSinceMaintenance": "Anzahl der Öffnungs- und Schließzyklen seit der letzten Wartung"
    },
    "version": {
      "motor": "Firmware der Türsteuerung",
      "ble": "Bluetooth-Firmware",
      "stack": "Bluetooth-Stack-Version",
      "controlHardware": "Türsteuerung"
    },
    "maintenance": {
      "initializationCount": "Anzahl der Neustarts",
      "cyclesSinceInitialization": "Anzahl der Öffnungs- und Schließzyklen seit dem letzten Neustart",
      "obstacleDetectionCount": "Anzahl erkannter Hindernisse",
      "wrongStopOpenCount": "Anzahl falscher Öffnungen",
      "wrongStopCloseCount": "Anzahl falscher Schließungen",
      "learningCycleCount": "Lernanzahl",
      "encoderErrorCount": "Anzahl der Encoderfehler",
      "motorErrorCount": "Anzahl der Motorfehler"
    },
    "motor": {
      "pushAndGo": "Push'n Go",
      "ble": "Bluetooth",
      "automaticManual": "Schließmodus",
      "direction": "Öffnen",
      "pairing": "Kopplung / Einlernen"
    },
    "motorStates": {
      "enabled": "Aktiviert",
      "disabled": "Deaktiviert",
      "manual": "Manuell",
      "automatic": "Automatisch",
      "clockwise": "CW",
      "counterClockwise": "CCW",
      "learning": "Anlernen",
      "pairing": "Verbunden"
    },
    "actions": {
      "learning": "Anschläge erlernen",
      "reset": "Alle Parameter zurücksetzen",
      "peripheralLock": "Verriegelung",
      "outputsTitle": "Ausgänge konfigurieren",
      "additionalTitle": "Weitere Befehle",
      "maintenance": "Wartung abgeschlossen",
      "setup": "Inbetriebnahme abgeschlossen"
    },
    "moventiv": {
      "staticLight": "Aktivierung des LED",
      "advancedTuning": "Fortgeschrittene Justierung",
      "expertTitle": "Experteneinstellungen",
      "expertMode": "Expertenmodus",
      "expertPlaceholder": "Passwort eingeben",
      "currentWeightProfile": "Gewichtsprofil",
      "maximumWeight": "Maximales Gewicht",
      "weightSelectTitle": "Türgewicht auswählen",
      "weightWarning": "ACHTUNG: Wenn Sie diesen Parameter ändern, werden die Geschwindigkeitseinstellungen zurückgesetzt!",
      "weightCancel": "Abbrechen",
      "weightConfirm": "Bestätigen",
      "directionLeft": "gegenüber dem Kabelausgang",
      "directionRight": "zum Kabelausgang"
    }
  },
  "pl": {
    "sections": {
      "navbarTitle": "Sterowanie",
      "commands": "Polecenia",
      "settings": "Ustawienia",
      "information": "Informacje",
      "basic": "Podstawowe",
      "advanced": "Zaawansowane",
      "motorState": "Pozycje przełączników",
      "general": "Informacje ogólne",
      "version": "Wersja oprogramowania",
      "hardware": "Wersja sprzętowa",
      "maintenance": "Konserwacja"
    },
    "commands": {
      "open": "Otwórz",
      "openDelayed": "Otwórz za {{seconds}} s",
      "close": "Zamknij",
      "lockedOpen": "Trzymaj drzwi otwarte.",
      "lockedClosed": "Drzwi zablokowane w pozycji zamkniętej."
    },
    "user": {
      "lighting": "Oświetlenie",
      "lockSetting": "Zablokuj ustawienie",
      "unlockSetting": "Odblokuj ustawienie",
      "openSpeed": "Prędkość otwierania",
      "closeSpeed": "Prędkość zamykania",
      "shortTiming": "Opóźnienie zamykania drzwi (sekundy)",
      "longTiming": "Opóźnienie zamykania drzwi (minuty)",
      "dynamicLight": "Oświetlenie LED podczas otwierania.",
      "rgb": "Główna dioda LED",
      "nameRoom": "Nazwa i lokalizacja",
      "nameLabel": "Zmień nazwę swojego napędu.",
      "roomLabel": "Przypisz pomieszczenie do swojego napędu.",
      "validate": "ZATWIERDŹ",
      "increase": "Zwiększ",
      "decrease": "Zmniejsz"
    },
    "rooms": {
      "bedroom": "Sypialnia",
      "livingRoom": "Salon",
      "diningRoom": "Jadalnia",
      "kitchen": "Kuchnia",
      "bathroom": "Łazienka",
      "toilet": "Toaleta",
      "garageUtilityRoom": "Garaż/pomieszczenie gospodarcze",
      "playroom": "Pokój zabaw"
    },
    "expert": {
      "weightRange": "Dostosowanie wagi",
      "nearOpenSpeed": "Prędkość w końcowej fazie otwierania",
      "nearCloseSpeed": "Prędkość w końcowej fazie zamykania",
      "nearOpenTorque": "Moment obrotowy w końcowej fazie otwierania",
      "nearCloseTorque": "Moment obrotowy w końcowej fazie zamykania",
      "brakingOpenPower": "Hamowanie przy otwieraniu",
      "obstacleSensitivity": "Próg wykrywania przeszkód",
      "breakForceAtOpen": "Siła hamowania przy otwieraniu"
    },
    "inputs": {
      "title": "Konfiguracja wejść",
      "input1": "Wejście 1",
      "input2": "Wejście 2",
      "radar": "Czujnik",
      "button": "Przycisk"
    },
    "dates": {
      "firstCommissioning": "Data pierwszego użycia",
      "lastMaintenance": "Data ostatniej konserwacji",
      "totalCycles": "Liczba cykli otwarcia/zamknięcia od pierwszego użycia",
      "cyclesSinceMaintenance": "Liczba cykli otwarcia/zamknięcia od ostatniej konserwacji"
    },
    "version": {
      "motor": "Oprogramowanie sterownika drzwi",
      "ble": "Oprogramowanie Bluetooth",
      "stack": "Wersja protokołu Bluetooth",
      "controlHardware": "Sterownik drzwi"
    },
    "maintenance": {
      "initializationCount": "Liczba restartów",
      "cyclesSinceInitialization": "Liczba cykli od ostatniego restartu",
      "obstacleDetectionCount": "Liczba wykrytych przeszkód",
      "wrongStopOpenCount": "Liczba błędnych zatrzymań przy otwieraniu",
      "wrongStopCloseCount": "Liczba błędnych zatrzymań przy zamykaniu",
      "learningCycleCount": "Liczba procesów kalibracji",
      "encoderErrorCount": "Liczba błędów enkodera",
      "motorErrorCount": "Liczba błędów silnika"
    },
    "motor": {
      "pushAndGo": "Push'n Go",
      "ble": "Bluetooth",
      "automaticManual": "Tryb zamykania",
      "direction": "Kierunek otwierania",
      "pairing": "Parowanie/Kalibracja"
    },
    "motorStates": {
      "enabled": "Włączony",
      "disabled": "Wyłączony",
      "manual": "Ręczny",
      "automatic": "Automatyczny",
      "clockwise": "W prawo",
      "counterClockwise": "W lewo",
      "learning": "Kalibracja",
      "pairing": "Parowanie"
    },
    "actions": {
      "learning": "Kalibracja pozycji krańcowych",
      "reset": "Resetuj wszystkie parametry",
      "peripheralLock": "Blokada",
      "outputsTitle": "Konfiguracja wyjść",
      "additionalTitle": "Dodatkowe polecenia",
      "maintenance": "Konserwacja wykonana",
      "setup": "Konfiguracja zakończona"
    },
    "moventiv": {
      "staticLight": "Aktywacja podświetlanego panelu.",
      "advancedTuning": "Ustawienia zaawansowane",
      "expertTitle": "Ustawienia zaawansowane",
      "expertMode": "Tryb ekspercki",
      "expertPlaceholder": "Wprowadź hasło",
      "currentWeightProfile": "Aktualny profil wagowy",
      "maximumWeight": "Maksymalna waga",
      "weightSelectTitle": "Wybierz wagę drzwi",
      "weightWarning": "UWAGA: Zmiana tego ustawienia zresetuje ustawienia prędkości!",
      "weightCancel": "Anuluj",
      "weightConfirm": "Zatwierdź",
      "directionLeft": "Przeciwnie do wyjścia kabla.",
      "directionRight": "W kierunku wyjścia kabla."
    }
  }
} as const;

export function normalizeProductPageLanguage(
  value: string | null,
): ProductPageLanguage {
  return value === 'fr' || value === 'en' || value === 'de' || value === 'pl'
    ? value
    : 'fr';
}

export function widoorDelayedOpenLabelFor(
  language: ProductPageLanguage,
  seconds: number,
): string {
  return PRODUCT_LOCALIZED_LABELS[language].commands.openDelayed.replace(
    '{{seconds}}',
    String(seconds),
  );
}

export type WidoorMotorStateKey =
  | 'push-and-go'
  | 'ble-switch'
  | 'automatic-manual'
  | 'direction'
  | 'pairing';

export function widoorMotorStateLabelFor(
  language: ProductPageLanguage,
  key: WidoorMotorStateKey,
  value: boolean,
): string {
  const labels = PRODUCT_LOCALIZED_LABELS[language].motorStates;
  switch (key) {
    case 'automatic-manual':
      return value ? labels.manual : labels.automatic;
    case 'direction':
      return value ? labels.clockwise : labels.counterClockwise;
    case 'pairing':
      return value ? labels.learning : labels.pairing;
    default:
      return value ? labels.enabled : labels.disabled;
  }
}

export function moventivMotorStateLabelFor(
  language: ProductPageLanguage,
  key: WidoorMotorStateKey,
  value: boolean,
): string {
  if (key === 'direction') {
    const labels = PRODUCT_LOCALIZED_LABELS[language].moventiv;
    return value ? labels.directionRight : labels.directionLeft;
  }
  return widoorMotorStateLabelFor(language, key, value);
}

export function productPageTextFor(
  language: ProductPageLanguage,
  profile: string | null = null,
) {
  const usesMoventivPage = profile?.startsWith('moventiv-') === true ||
    profile === 'garline';
  const productName = profile === 'garline'
    ? 'GARLINE'
    : usesMoventivPage
      ? 'MOVENTIV'
      : 'WIDOOR';
  if (language === 'fr' && profile !== 'widoor' && !usesMoventivPage) {
    return PRODUCT_PAGE_TEXT;
  }

  const labels = PRODUCT_LOCALIZED_LABELS[language];
  const baseText = translatedProductPageTextFor(language);

  return Object.freeze({
    ...baseText,
    sections: Object.freeze({
      ...baseText.sections,
      navbarTitle: labels.sections.navbarTitle,
      commands: labels.sections.commands,
      settings: labels.sections.settings,
      information: labels.sections.information,
      motorState: labels.sections.motorState,
      dates: labels.sections.general,
      version: labels.sections.version,
      hardware: labels.sections.hardware,
      maintenance: labels.sections.maintenance,
      expertSettings: usesMoventivPage
        ? labels.moventiv.advancedTuning
        : baseText.sections.expertSettings,
    }),
    shell: Object.freeze({
      ...baseText.shell,
      basic: labels.sections.basic,
      advanced: labels.sections.advanced,
      increase: labels.user.increase,
      decrease: labels.user.decrease,
    }),
    lockModeControls: Object.freeze({
      ...baseText.lockModeControls,
      lockedOpen: Object.freeze({
        ...baseText.lockModeControls.lockedOpen,
        label: labels.commands.lockedOpen,
      }),
      lockedClosed: Object.freeze({
        ...baseText.lockModeControls.lockedClosed,
        label: labels.commands.lockedClosed,
      }),
    }),
    moventivCloseLockAlert: MOVENTIV_CLOSE_LOCK_ALERT_TEXT[language],
    widoorCommands: Object.freeze({
      ...baseText.widoorCommands,
      open: Object.freeze({
        ...baseText.widoorCommands.open,
        label: labels.commands.open,
        confirmAction: labels.commands.open,
      }),
      close: Object.freeze({
        ...baseText.widoorCommands.close,
        label: labels.commands.close,
        confirmAction: labels.commands.close,
      }),
    }),
    nameRoomControls: Object.freeze({
      ...baseText.nameRoomControls,
      title: labels.user.nameRoom,
      nameLabel: labels.user.nameLabel.replace('WIDOOR', productName),
      roomLabel: labels.user.roomLabel.replace('WIDOOR', productName),
      apply: labels.user.validate,
      rooms: Object.freeze({
        ...baseText.nameRoomControls.rooms,
        ...labels.rooms,
      }),
    }),
    expertInputControls: Object.freeze({
      ...baseText.expertInputControls,
      title: labels.inputs.title,
      input1: labels.inputs.input1,
      input2: labels.inputs.input2,
      radar: labels.inputs.radar,
      button: labels.inputs.button,
    }),
    weightRangeControls: Object.freeze({
      ...baseText.weightRangeControls,
      selectTitle: usesMoventivPage
        ? labels.moventiv.weightSelectTitle
        : baseText.weightRangeControls.selectTitle,
      warning: usesMoventivPage
        ? labels.moventiv.weightWarning
        : baseText.weightRangeControls.warning,
      cancel: usesMoventivPage
        ? labels.moventiv.weightCancel
        : baseText.weightRangeControls.cancel,
      confirm: usesMoventivPage
        ? labels.moventiv.weightConfirm
        : baseText.weightRangeControls.confirm,
    }),
    expertAccess: Object.freeze({
      ...baseText.expertAccess,
      expertTitle: usesMoventivPage
        ? labels.moventiv.expertTitle
        : baseText.expertAccess.expertTitle,
      expertMode: usesMoventivPage
        ? labels.moventiv.expertMode
        : baseText.expertAccess.expertMode,
      expertPlaceholder: usesMoventivPage
        ? labels.moventiv.expertPlaceholder
        : baseText.expertAccess.expertPlaceholder,
    }),
    productDateActions: Object.freeze({
      ...baseText.productDateActions,
      setupLabel: labels.actions.setup,
      maintenanceLabel: labels.actions.maintenance,
    }),
    sensitiveActions: Object.freeze({
      ...baseText.sensitiveActions,
      learning: labels.actions.learning,
      reset: labels.actions.reset,
      peripheralLock: labels.actions.peripheralLock,
      outputsTitle: labels.actions.outputsTitle,
      additionalTitle: labels.actions.additionalTitle,
    }),
    user: Object.freeze({
      ...baseText.user,
      lighting: labels.user.lighting,
      lockSetting: labels.user.lockSetting,
      unlockSetting: labels.user.unlockSetting,
      openSpeed: labels.user.openSpeed,
      closeSpeed: labels.user.closeSpeed,
      shortTiming: labels.user.shortTiming,
      longTiming: labels.user.longTiming,
      staticLight: usesMoventivPage
        ? labels.moventiv.staticLight
        : baseText.user.staticLight,
      dynamicLight: labels.user.dynamicLight,
      rgb: labels.user.rgb,
    }),
    expert: Object.freeze({
      ...baseText.expert,
      weightRange: labels.expert.weightRange,
      nearOpenSpeed: labels.expert.nearOpenSpeed,
      nearCloseSpeed: labels.expert.nearCloseSpeed,
      nearOpenTorque: labels.expert.nearOpenTorque,
      nearCloseTorque: labels.expert.nearCloseTorque,
      brakingOpenPower: labels.expert.brakingOpenPower,
      obstacleSensitivity: labels.expert.obstacleSensitivity,
      breakForceAtOpen: labels.expert.breakForceAtOpen,
    }),
    information: Object.freeze({
      ...baseText.information,
      currentWeightProfile: usesMoventivPage
        ? labels.moventiv.currentWeightProfile
        : baseText.information.currentWeightProfile,
      maximumWeight: usesMoventivPage
        ? labels.moventiv.maximumWeight
        : baseText.information.maximumWeight,
    }),
    dates: Object.freeze({
      ...baseText.dates,
      ...labels.dates,
    }),
    version: Object.freeze({
      ...baseText.version,
      motor: labels.version.motor,
      ble: labels.version.ble,
      stack: labels.version.stack,
      controlHardware: labels.version.controlHardware,
    }),
    maintenance: Object.freeze({
      ...baseText.maintenance,
      ...labels.maintenance,
    }),
    motor: Object.freeze({
      ...baseText.motor,
      pushAndGo: labels.motor.pushAndGo,
      ble: labels.motor.ble,
      automaticManual: labels.motor.automaticManual,
      direction: labels.motor.direction,
      pairing: labels.motor.pairing,
    }),
  });
}
