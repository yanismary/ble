import { PRODUCT_PAGE_TEXT } from './product-page.text';

export type ProductPageLanguage = 'fr' | 'en' | 'de' | 'pl';

const LEGACY_PRODUCT_LABELS = {
  "fr": {
    "sections": {
      "navbarTitle": "Commandes",
      "commands": "Commandes",
      "settings": "Réglages",
      "information": "Informations",
      "version": "Versions des logiciels",
      "maintenance": "Maintenance"
    },
    "commands": {
      "open": "Ouvrir",
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
      "nameRoom": "Nom et localisation"
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
      "stack": "Version stack bluetooth"
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
    "actions": {
      "learning": "Apprentissage des butées",
      "maintenance": "Maintenance effectuée",
      "setup": "Mise en service effectuée"
    }
  },
  "en": {
    "sections": {
      "navbarTitle": "Command",
      "commands": "Commands",
      "settings": "Tuning",
      "information": "Informations",
      "version": "Firmwares versions",
      "maintenance": "Maintenance"
    },
    "commands": {
      "open": "Open",
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
      "nameRoom": "Name and location"
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
      "stack": "Bluetooth stack version"
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
    "actions": {
      "learning": "Learning of stops",
      "maintenance": "Maintenance done",
      "setup": "Setup done"
    }
  },
  "de": {
    "sections": {
      "navbarTitle": "Befehle",
      "commands": "Befehle",
      "settings": "Einstellungen",
      "information": "Informationen",
      "version": "Firmware Versionen",
      "maintenance": "Wartung"
    },
    "commands": {
      "open": "Öffnen",
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
      "nameRoom": "Name und Ort"
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
      "stack": "Bluetooth Stack Version"
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
    "actions": {
      "learning": "Anschläge erlernen",
      "maintenance": "Wartung abgeschlossen",
      "setup": "Einstellungen abgeschlossen"
    }
  },
  "pl": {
    "sections": {
      "navbarTitle": "Sterowanie",
      "commands": "Polecenia",
      "settings": "Ustawienia",
      "information": "Informacje",
      "version": "Wersja oprogramowania",
      "maintenance": "Konserwacja"
    },
    "commands": {
      "open": "Otwórz",
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
      "nameRoom": "Nazwa i lokalizacja"
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
      "stack": "Wersja protokołu Bluetooth"
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
    "actions": {
      "learning": "Kalibracja pozycji krańcowych",
      "maintenance": "Konserwacja wykonana",
      "setup": "Konfiguracja zakończona"
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

export function productPageTextFor(language: ProductPageLanguage) {
  if (language === 'fr') {
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
      version: labels.sections.version,
      maintenance: labels.sections.maintenance,
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
    productDateActions: Object.freeze({
      ...PRODUCT_PAGE_TEXT.productDateActions,
      setupLabel: labels.actions.setup,
      maintenanceLabel: labels.actions.maintenance,
    }),
    sensitiveActions: Object.freeze({
      ...PRODUCT_PAGE_TEXT.sensitiveActions,
      learning: labels.actions.learning,
    }),
    user: Object.freeze({
      ...PRODUCT_PAGE_TEXT.user,
      openSpeed: labels.user.openSpeed,
      closeSpeed: labels.user.closeSpeed,
      shortTiming: labels.user.shortTiming,
      longTiming: labels.user.longTiming,
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
    dates: Object.freeze({
      ...PRODUCT_PAGE_TEXT.dates,
      ...labels.dates,
    }),
    version: Object.freeze({
      ...PRODUCT_PAGE_TEXT.version,
      motor: labels.version.motor,
      ble: labels.version.ble,
      stack: labels.version.stack,
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
