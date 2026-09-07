import { PRODUCT_PAGE_TEXT } from './product-page.text';

export type ProductPageLanguage = 'fr' | 'en' | 'de' | 'pl';

const LEGACY_PRODUCT_LABELS = {
  "fr": {
    "sections": {
      "navbarTitle": "Commandes",
      "commands": "Commandes",
      "settings": "Réglages",
      "information": "Informations",
      "basic": "Basiques",
      "advanced": "Avancés",
      "motorState": "Etats des switchs",
      "general": "Informations générales",
      "version": "Versions des logiciels",
      "hardware": "Materiel",
      "maintenance": "Maintenance"
    },
    "commands": {
      "open": "Ouvrir",
      "openDelayed": "Ouvrir dans {{seconds}} s",
      "close": "Fermer",
      "lockedOpen": "Maintien de la porte en position ouverte",
      "lockedClosed": "Porte condamnée en position fermée"
    },
    "user": {
      "openSpeed": "Vitesse d'ouverture",
      "closeSpeed": "Vitesse de fermeture",
      "shortTiming": "Temporisation courte à la fermeture",
      "longTiming": "Temporisation longue à la fermeture",
      "dynamicLight": "Eclairage lors de l'ouverture",
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
    "professional": {
      "weightRange": "Réglage du poids",
      "nearOpenSpeed": "Vitesse en fin d'ouverture",
      "nearCloseSpeed": "Vitesse en fin de fermeture",
      "nearOpenTorque": "Force en fin d'ouverture",
      "nearCloseTorque": "Force en fin de fermeture",
      "brakingOpenPower": "Freinage en ouverture",
      "obstacleSensitivity": "Sensibilité de la detection d'obstacle",
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
      "cyclesSinceInitialization": "Nombre de cycle depuis le dernier redémarrage",
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
      "weightWarning": "ATTENTION : La modification de ce paramètre entrainera la réinitialisation des paramètres de vitesse !",
      "weightCancel": "Annuler",
      "weightConfirm": "Valider",
      "directionLeft": "opposé sortie câbles",
      "directionRight": "Vers sortie câbles"
    }
  },
  "en": {
    "sections": {
      "navbarTitle": "Command",
      "commands": "Commands",
      "settings": "Tuning",
      "information": "Informations",
      "basic": "Basic",
      "advanced": "Advanced",
      "motorState": "Switch states",
      "general": "General informations",
      "version": "Firmwares versions",
      "hardware": "Hardware version",
      "maintenance": "Maintenance"
    },
    "commands": {
      "open": "Open",
      "openDelayed": "Open in {{seconds}} s",
      "close": "Close",
      "lockedOpen": "Keep door open",
      "lockedClosed": "Door locked in closed position"
    },
    "user": {
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
      "garageUtilityRoom": "Garage / utilityroom",
      "playroom": "Playroom"
    },
    "professional": {
      "weightRange": "Weight tuning",
      "nearOpenSpeed": "Speed at end of open",
      "nearCloseSpeed": "Speed at end of close",
      "nearOpenTorque": "Strenght at end of open",
      "nearCloseTorque": "Strenght at end of close",
      "brakingOpenPower": "Braking in open",
      "obstacleSensitivity": "Obstacle detection sensibility",
      "breakForceAtOpen": "Break power at open"
    },
    "inputs": {
      "title": "Configuration of inputs",
      "input1": "Input 1",
      "input2": "Input 2",
      "radar": "Radar",
      "button": "Button"
    },
    "dates": {
      "firstCommissioning": "Date of the first use",
      "lastMaintenance": "Date of the last maintenance",
      "totalCycles": "Number of open/close cycles since the first use",
      "cyclesSinceMaintenance": "Number of open/close cycles since the first use"
    },
    "version": {
      "motor": "Door controller firmware",
      "ble": "Bluetooth firmware",
      "stack": "Bluetooth stack version",
      "controlHardware": "Door controller"
    },
    "maintenance": {
      "initializationCount": "Reboot numbers",
      "cyclesSinceInitialization": "Number of cycles since last reboot",
      "obstacleDetectionCount": "Number of obstacles detections",
      "wrongStopOpenCount": "Number of wrong arrivals in open",
      "wrongStopCloseCount": "Number of wrong arrivals in close",
      "learningCycleCount": "Number of learning",
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
      "additionalTitle": "Additionnal commands",
      "maintenance": "Maintenance done",
      "setup": "Setup done"
    },
    "moventiv": {
      "staticLight": "Activation of the illuminated panel",
      "advancedTuning": "Advanced tuning",
      "expertTitle": "Expert settings",
      "expertMode": "Expert mode",
      "expertPlaceholder": "Enter password",
      "currentWeightProfile": "Actuel weight profile",
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
      "advanced": "Fortgeschrittene Einstellungen",
      "motorState": "Status",
      "general": "Allgemeine Informationen",
      "version": "Firmware Versionen",
      "hardware": "Hardware Version",
      "maintenance": "Wartung"
    },
    "commands": {
      "open": "Öffnen",
      "openDelayed": "In {{seconds}} s öffnen",
      "close": "Schließen",
      "lockedOpen": "Tür geöffnet halten",
      "lockedClosed": "Tür geschlossen halten"
    },
    "user": {
      "openSpeed": "Öffnungsgeschwindigkeit",
      "closeSpeed": "Schließgeschwindigkeit",
      "shortTiming": "Schließverzögerung",
      "longTiming": "Lange Schließverzögerung",
      "dynamicLight": "LED Leuchte während des Öffnens",
      "rgb": "Haupt LED",
      "nameRoom": "Name und Ort",
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
      "toilet": "Bad",
      "garageUtilityRoom": "Garage / Abstellraum",
      "playroom": "Spielzimmer"
    },
    "professional": {
      "weightRange": "Justierung des Gewichts",
      "nearOpenSpeed": "Endgeschwindigkeit beim Öffnen",
      "nearCloseSpeed": "Endgeschwindigkeit beim Schließen",
      "nearOpenTorque": "Öffnungsende Drehmoment",
      "nearCloseTorque": "Schließungsende Drehmoment",
      "brakingOpenPower": "Braking in open",
      "obstacleSensitivity": "Obstacle detection sensibility",
      "breakForceAtOpen": "Abbremsung beim Öffnen"
    },
    "inputs": {
      "title": "Eingänge konfigurieren",
      "input1": "Eingang 1",
      "input2": "Eingang 2",
      "radar": "Funk",
      "button": "Kabel"
    },
    "dates": {
      "firstCommissioning": "Datum der ersten Nutzung",
      "lastMaintenance": "Datum der letzten Wartung",
      "totalCycles": "Anzahl der Öffnungs- und Schließzyklen seit erster Nutzung",
      "cyclesSinceMaintenance": "Anzahl der Öffnungs- und Schließzyklen seit erster Nutzung"
    },
    "version": {
      "motor": "Tür Fernbedienung Firmware",
      "ble": "Bluetooth Firmware",
      "stack": "Bluetooth Stack Version",
      "controlHardware": "Tür Fernbedienung"
    },
    "maintenance": {
      "initializationCount": "Anzahl Neustarts",
      "cyclesSinceInitialization": "Anzahl der Öffnungs- und Schließzyklen seit dem letzten Neustart",
      "obstacleDetectionCount": "Anzahl erkannter Hindernisse",
      "wrongStopOpenCount": "Anzahl falscher Öffnungen",
      "wrongStopCloseCount": "Anzahl falscher Schließungen",
      "learningCycleCount": "Lernanzahl",
      "encoderErrorCount": "Anzahl Encoder Fehler",
      "motorErrorCount": "Anzahl Motorfehler"
    },
    "motor": {
      "pushAndGo": "Push'n Go",
      "ble": "Bluetooth",
      "automaticManual": "Schließmodus",
      "direction": "Öffnen",
      "pairing": "Verbunden / Anlernen"
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
      "setup": "Einstellungen abgeschlossen"
    },
    "moventiv": {
      "staticLight": "Aktivierung des LED",
      "advancedTuning": "Fortgeschrittene Justierung",
      "expertTitle": "Experten Einstellungen",
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
    "professional": {
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
  return LEGACY_PRODUCT_LABELS[language].commands.openDelayed.replace(
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
  const labels = LEGACY_PRODUCT_LABELS[language].motorStates;
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
    const labels = LEGACY_PRODUCT_LABELS[language].moventiv;
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
  if (language === 'fr' && profile !== 'widoor' && !usesMoventivPage) {
    return PRODUCT_PAGE_TEXT;
  }

  const labels = LEGACY_PRODUCT_LABELS[language];

  return Object.freeze({
    ...PRODUCT_PAGE_TEXT,
    sections: Object.freeze({
      ...PRODUCT_PAGE_TEXT.sections,
      navbarTitle: labels.sections.navbarTitle,
      commands: labels.sections.commands,
      settings: labels.sections.settings,
      information: labels.sections.information,
      motorState: labels.sections.motorState,
      dates: labels.sections.general,
      version: labels.sections.version,
      hardware: labels.sections.hardware,
      maintenance: labels.sections.maintenance,
      professionalSettings: usesMoventivPage
        ? labels.moventiv.advancedTuning
        : PRODUCT_PAGE_TEXT.sections.professionalSettings,
    }),
    shell: Object.freeze({
      ...PRODUCT_PAGE_TEXT.shell,
      basic: labels.sections.basic,
      advanced: labels.sections.advanced,
      increase: labels.user.increase,
      decrease: labels.user.decrease,
    }),
    lockModeControls: Object.freeze({
      ...PRODUCT_PAGE_TEXT.lockModeControls,
      lockedOpen: Object.freeze({
        ...PRODUCT_PAGE_TEXT.lockModeControls.lockedOpen,
        label: labels.commands.lockedOpen,
      }),
      lockedClosed: Object.freeze({
        ...PRODUCT_PAGE_TEXT.lockModeControls.lockedClosed,
        label: labels.commands.lockedClosed,
      }),
    }),
    widoorCommands: Object.freeze({
      ...PRODUCT_PAGE_TEXT.widoorCommands,
      open: Object.freeze({
        ...PRODUCT_PAGE_TEXT.widoorCommands.open,
        label: labels.commands.open,
        confirmAction: labels.commands.open,
      }),
      close: Object.freeze({
        ...PRODUCT_PAGE_TEXT.widoorCommands.close,
        label: labels.commands.close,
        confirmAction: labels.commands.close,
      }),
    }),
    nameRoomControls: Object.freeze({
      ...PRODUCT_PAGE_TEXT.nameRoomControls,
      title: labels.user.nameRoom,
      nameLabel: usesMoventivPage
        ? labels.user.nameLabel.replace('WIDOOR', 'MOVENTIV')
        : labels.user.nameLabel,
      roomLabel: usesMoventivPage
        ? labels.user.roomLabel.replace('WIDOOR', 'MOVENTIV')
        : labels.user.roomLabel,
      apply: labels.user.validate,
      rooms: Object.freeze({
        ...PRODUCT_PAGE_TEXT.nameRoomControls.rooms,
        ...labels.rooms,
      }),
    }),
    professionalInputControls: Object.freeze({
      ...PRODUCT_PAGE_TEXT.professionalInputControls,
      title: labels.inputs.title,
      input1: labels.inputs.input1,
      input2: labels.inputs.input2,
      radar: labels.inputs.radar,
      button: labels.inputs.button,
    }),
    weightRangeControls: Object.freeze({
      ...PRODUCT_PAGE_TEXT.weightRangeControls,
      selectTitle: usesMoventivPage
        ? labels.moventiv.weightSelectTitle
        : PRODUCT_PAGE_TEXT.weightRangeControls.selectTitle,
      warning: usesMoventivPage
        ? labels.moventiv.weightWarning
        : PRODUCT_PAGE_TEXT.weightRangeControls.warning,
      cancel: usesMoventivPage
        ? labels.moventiv.weightCancel
        : PRODUCT_PAGE_TEXT.weightRangeControls.cancel,
      confirm: usesMoventivPage
        ? labels.moventiv.weightConfirm
        : PRODUCT_PAGE_TEXT.weightRangeControls.confirm,
    }),
    professionalAccess: Object.freeze({
      ...PRODUCT_PAGE_TEXT.professionalAccess,
      expertTitle: usesMoventivPage
        ? labels.moventiv.expertTitle
        : PRODUCT_PAGE_TEXT.professionalAccess.expertTitle,
      expertMode: usesMoventivPage
        ? labels.moventiv.expertMode
        : PRODUCT_PAGE_TEXT.professionalAccess.expertMode,
      expertPlaceholder: usesMoventivPage
        ? labels.moventiv.expertPlaceholder
        : PRODUCT_PAGE_TEXT.professionalAccess.expertPlaceholder,
    }),
    productDateActions: Object.freeze({
      ...PRODUCT_PAGE_TEXT.productDateActions,
      setupLabel: labels.actions.setup,
      maintenanceLabel: labels.actions.maintenance,
    }),
    sensitiveActions: Object.freeze({
      ...PRODUCT_PAGE_TEXT.sensitiveActions,
      learning: labels.actions.learning,
      reset: labels.actions.reset,
      peripheralLock: labels.actions.peripheralLock,
      outputsTitle: labels.actions.outputsTitle,
      additionalTitle: labels.actions.additionalTitle,
    }),
    user: Object.freeze({
      ...PRODUCT_PAGE_TEXT.user,
      openSpeed: labels.user.openSpeed,
      closeSpeed: labels.user.closeSpeed,
      shortTiming: labels.user.shortTiming,
      longTiming: labels.user.longTiming,
      staticLight: usesMoventivPage
        ? labels.moventiv.staticLight
        : PRODUCT_PAGE_TEXT.user.staticLight,
      dynamicLight: labels.user.dynamicLight,
      rgb: labels.user.rgb,
    }),
    professional: Object.freeze({
      ...PRODUCT_PAGE_TEXT.professional,
      weightRange: labels.professional.weightRange,
      nearOpenSpeed: labels.professional.nearOpenSpeed,
      nearCloseSpeed: labels.professional.nearCloseSpeed,
      nearOpenTorque: labels.professional.nearOpenTorque,
      nearCloseTorque: labels.professional.nearCloseTorque,
      brakingOpenPower: labels.professional.brakingOpenPower,
      obstacleSensitivity: labels.professional.obstacleSensitivity,
      breakForceAtOpen: labels.professional.breakForceAtOpen,
    }),
    information: Object.freeze({
      ...PRODUCT_PAGE_TEXT.information,
      currentWeightProfile: usesMoventivPage
        ? labels.moventiv.currentWeightProfile
        : PRODUCT_PAGE_TEXT.information.currentWeightProfile,
      maximumWeight: usesMoventivPage
        ? labels.moventiv.maximumWeight
        : PRODUCT_PAGE_TEXT.information.maximumWeight,
    }),
    dates: Object.freeze({
      ...PRODUCT_PAGE_TEXT.dates,
      ...labels.dates,
    }),
    version: Object.freeze({
      ...PRODUCT_PAGE_TEXT.version,
      motor: labels.version.motor,
      ble: labels.version.ble,
      stack: labels.version.stack,
      controlHardware: labels.version.controlHardware,
    }),
    maintenance: Object.freeze({
      ...PRODUCT_PAGE_TEXT.maintenance,
      ...labels.maintenance,
    }),
    motor: Object.freeze({
      ...PRODUCT_PAGE_TEXT.motor,
      pushAndGo: labels.motor.pushAndGo,
      ble: labels.motor.ble,
      automaticManual: labels.motor.automaticManual,
      direction: labels.motor.direction,
      pairing: labels.motor.pairing,
    }),
  });
}
