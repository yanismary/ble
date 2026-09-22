import { PRODUCT_PAGE_TEXT } from './product-page-text';

type ProductPageLanguage = 'fr' | 'en' | 'de' | 'pl';

type LocalizedText<T> = T extends (...args: infer TArgs) => string
  ? (...args: TArgs) => string
  : T extends string
    ? string
  : T extends object
    ? { readonly [TKey in keyof T]: LocalizedText<T[TKey]> }
    : T;
type ProductPageText = LocalizedText<typeof PRODUCT_PAGE_TEXT>;
type TextPatch<T> = T extends (...args: infer TArgs) => string
  ? (...args: TArgs) => string
  : T extends string
    ? string
    : T extends object
      ? { readonly [TKey in keyof T]?: TextPatch<T[TKey]> }
      : T;

type TranslatedLanguage = Exclude<ProductPageLanguage, 'fr'>;

const PRODUCT_PAGE_TRANSLATIONS = {
  en: {
    backToScan: 'Back to scan',
    returnToScanFailed:
      'Unable to disconnect the product. Try again before returning to scan.',
    openProductPage: 'Open product page',
    refresh: 'Refresh information',
    loading: 'Loading…',
    readonlyNotice: 'Settings read from the product.',
    commandsUnavailable: 'Commands are currently unavailable.',
    lockModeControls: {
      title: 'Door locking',
      executing: 'Sending door-lock setting…',
      sent: 'Door-lock setting sent. Verification read in progress.',
      failed: 'Failed to send the door-lock setting.',
      unavailable: 'Door-lock command unavailable',
    },
    userSpeedControls: {
      apply: 'Apply',
      current: 'Current value:',
      draft: 'Value to apply:',
      executing: 'Sending speed…',
      sent: 'Speed sent. Verification read in progress.',
      failed: 'Failed to send the speed.',
      unavailable: 'Speed command unavailable',
    },
    userTimingControls: {
      apply: 'Apply',
      current: 'Current value:',
      draft: 'Value to apply:',
      executing: 'Sending delay…',
      sent: 'Delay sent. Verification read in progress.',
      failed: 'Failed to send the delay.',
      unavailable: 'Delay command unavailable',
    },
    userPeripheralControls: {
      title: 'Lighting and indicators',
      executing: 'Sending lighting setting…',
      sent: 'Lighting setting sent. Verification read in progress.',
      failed: 'Failed to send the lighting setting.',
      unavailable: 'Lighting command unavailable',
    },
    nameRoomControls: {
      none: 'None',
      current: 'Current value:',
      draft: 'Value to write:',
      executing: 'Sending name and room…',
      sent: 'Name and room sent. A new scan may be required.',
      failed: 'Failed to send the name and room.',
      unavailable: 'Name/room command unavailable',
      rooms: {
        entrance: 'Entrance',
        hall: 'Hall',
      },
      errors: {
        empty: 'The name is required.',
        invalidCharacters:
          'Only letters, numbers, spaces and hyphens are allowed.',
        tooLong: 'The full name is limited to 15 characters.',
        tooShort: 'The name must contain at least 5 characters.',
        invalidRoom: 'Unknown room.',
      },
    },
    weightRangeControls: {
      apply: 'Apply',
      selectTitle: 'Select door weight',
      warning:
        'CAUTION: Changing this setting will reset the speed settings!',
      cancel: 'Cancel',
      confirm: 'Confirm',
      current: 'Current range:',
      draft: 'Range to apply:',
      executing: 'Sending weight range…',
      sent: 'Weight range sent. Verification read in progress.',
      failed: 'Failed to send the weight range.',
      unavailable: 'Weight-range command unavailable',
    },
    sensitiveActions: {
      title: 'Advanced functions',
      notice:
        'These functions reproduce the commands available on the product. Destructive actions require explicit confirmation.',
      radarTest1: 'Radar test 1',
      radarTest2: 'Radar test 2',
      awaitingConfirmation: 'Confirmation required.',
      executing: 'Advanced command in progress…',
      sent: 'Command sent. Verification read in progress.',
      failed: 'Advanced command failed.',
      cancelled: 'Command cancelled.',
      cancel: 'Cancel',
      confirm: 'Confirm',
      learningConfirmTitle: 'Start end-stop learning?',
      learningConfirmMessage:
        'This command may cause automatic motor movement. Make sure the area is clear before confirming.',
      resetConfirmTitle: 'Reset Widoor settings?',
      resetConfirmMessage:
        'This action restores the nine default settings and replaces several current settings. It cannot be undone automatically.',
    },
    expertPeripheralDiagnostics: {
      title: 'Peripheral diagnostics',
      readonlyNotice:
        'States read from the product. No test or locking command is sent.',
      radarTest1: 'Radar test 1',
      radarTest2: 'Radar test 2',
      peripheralLock: 'Peripheral lock',
      enabled: 'Enabled',
      disabled: 'Disabled',
    },
    expertInputControls: {
      current: 'Current value:',
      executing: 'Sending input configuration…',
      sent: 'Input configuration confirmed by the product.',
      failed: 'Input configuration not confirmed by the product.',
      unavailable: 'Input-configuration command unavailable',
    },
    expertScalarControls: {
      apply: 'Apply',
      current: 'Current value:',
      draft: 'Value to apply:',
      executing: 'Sending expert setting…',
      sent: 'Expert setting sent. Verification read in progress.',
      failed: 'Failed to send the expert setting.',
      unavailable: 'Expert-setting command unavailable',
    },
    expertAccess: {
      title: 'Expert access',
      expertTitle: 'Expert settings',
      expertMode: 'Expert mode',
      message: 'Enter the expert code to display these settings.',
      placeholder: 'Expert code',
      expertPlaceholder: 'Enter password',
      cancel: 'Cancel',
      confirm: 'Confirm',
      unlock: 'Unlock expert settings',
      locked: 'Some expert settings are hidden.',
      unlocked: 'Expert settings unlocked.',
      failed: 'Incorrect expert code.',
    },
    moventivAdvancedAlert: {
      title: 'Caution',
      message:
        'Changing these settings may affect proper system operation. Please read the manual before making any changes.',
      no: 'Cancel',
      yes: 'Continue',
    },
    productDateActions: {
      confirmTitle: 'Confirmation required',
      passwordPlaceholder: 'Maintenance password',
      cancel: 'Cancel',
      confirm: 'Confirm',
      awaitingConfirmation: 'Maintenance confirmation required.',
      executing: 'Sending date action…',
      setupSent: 'Commissioning confirmed.',
      setupNotConfirmed:
        'Commissioning was not confirmed by the product. Check the dates.',
      maintenanceSent: 'Maintenance sent. Verification read in progress.',
      setupSentReloadFailed:
        'Commissioning sent, but the verification read failed.',
      maintenanceSentReloadFailed:
        'Maintenance sent, but the verification read failed.',
      failed: 'Failed to send the date action.',
      partialFailed:
        'Maintenance was sent, but commissioning was not confirmed.',
      partialReloadFailed:
        'Maintenance was sent, but commissioning was not confirmed. The verification read failed.',
      unavailable: 'Date action unavailable',
      wrongCode: 'Incorrect maintenance code.',
      cancelled: 'Action cancelled.',
      setupConfirmation: (date: string) =>
        `Do you confirm that commissioning was completed on ${date}? ` +
        'Maintenance will be recorded, then the commissioning date will be permanently recorded if the product still reports it as uninitialized.',
      maintenanceConfirmation: (date: string) =>
        `Do you confirm that maintenance was completed on ${date}? ` +
        'The firmware may reset the cycle counter since the last maintenance.',
    },
    openCommand: {
      cancel: 'Cancel',
      awaitingConfirmation: 'Confirmation required',
      sent: 'Command sent',
      executing: 'Command in progress…',
      unavailable: 'Command unavailable',
      disconnected: 'Device disconnected',
      stale: 'Outdated result',
      failed: 'Command failed',
      alreadyInProgress: 'A command is already in progress',
      cancelled: 'Command cancelled',
    },
    widoorCommands: {
      warning: 'The motor will actually move.',
      physicalValidationRequired: 'Physical validation required',
      protected: 'Protected function — dedicated validation required',
      timedCyclePending:
        'The complete timed cycle still requires physical validation.',
      open: {
        confirmTitle: 'Open the door?',
        confirmMessage:
          'This action moves the motor. Make sure the area is clear and the physical stop control is accessible.',
        confirmed: 'Opening confirmed',
        notConfirmed: 'Command sent, but opening was not confirmed',
      },
      close: {
        confirmTitle: 'Close the door?',
        confirmMessage:
          'This action moves the motor. Make sure the area is clear and the physical stop control is accessible.',
        confirmed: 'Closing confirmed',
        notConfirmed: 'Command sent, but closing was not confirmed',
      },
      openShortTimed: {
        label: 'Short timed opening',
        confirmTitle: 'Start short timed opening?',
        confirmMessage:
          'This action moves the motor. Make sure the area is clear and the physical stop control is accessible. The start of movement will be checked, but the complete timed cycle must be validated separately.',
        confirmAction: 'Start',
        confirmed: 'Start of short timed opening confirmed',
        notConfirmed: 'Command sent, but start was not confirmed',
      },
      openLongTimed: {
        label: 'Long timed opening',
        confirmTitle: 'Start long timed opening?',
        confirmMessage:
          'This action moves the motor. Make sure the area is clear and the physical stop control is accessible. The start of movement will be checked, but the complete timed cycle must be validated separately.',
        confirmAction: 'Start',
        confirmed: 'Start of long timed opening confirmed',
        notConfirmed: 'Command sent, but start was not confirmed',
      },
      learning: {
        label: 'Learning',
      },
    },
    widoorCommandAlerts: {
      lock: {
        title: 'Unable to execute command',
        subtitle: 'Disable the door lock first.',
      },
      retention: {
        title: 'Unable to execute command',
        subtitle: 'Disable the hold-open mode first.',
      },
    },
    commandHistory: {
      title: 'Command history',
      empty: 'No command completed during this session.',
      duration: 'Delay',
      confirmation: 'Motor confirmation',
      timedCycle: 'Timed cycle',
      statuses: {
        confirmed: 'Confirmed',
        timeout: 'Not confirmed',
        failed: 'Failed',
        disconnected: 'Disconnected',
        stale: 'Outdated',
        unavailable: 'Unavailable',
        cancelled: 'Cancelled',
      },
      confirmations: {
        confirmed: 'Confirmed',
        timeout: 'Not confirmed',
        unavailable: 'Unavailable',
        notRequired: 'Not required',
        notValidated: 'Not validated',
        none: 'None',
      },
      timedCycles: {
        notObserved: 'Not observed',
        pendingPhysicalValidation: 'Awaiting physical validation',
        validated: 'Validated',
        failed: 'Failed',
      },
    },
    sections: {
      information: 'Information',
      userSettings: 'User settings',
      expertSettings: 'Expert settings',
      identity: 'Connected product',
      maintenance: 'Maintenance',
    },
    information: {
      general: 'General information',
      currentWeightProfile: 'Current profile',
      maximumWeight: 'Maximum weight',
      supplemental: 'Additional information',
    },
    shell: {
      controlledDoor: 'Controlled door',
      showPrecision: 'Show precise adjustment',
      preciseAdjustment: 'Precise adjustment',
      increaseByOne: 'Increase by 1',
      decreaseByOne: 'Decrease by 1',
    },
    states: {
      available: 'Available',
      unavailable: 'Unavailable',
      invalid: 'Invalid data',
      notLoaded: 'Not loaded',
      failed: 'Unable to read',
      disconnected: 'Disconnected',
      stale: 'Outdated data',
      connected: 'Connected',
      invalidProfile: 'Inconsistent profile',
      partialSuccess: 'Partial success',
      success: 'Information available',
      cancelled: 'Read cancelled',
    },
    profile: 'Profile',
    productName: 'Product name',
    displayedName: 'Displayed name',
    room: 'Room',
    deviceId: 'Device identifier',
    connection: 'Connection',
    lastRefresh: 'Last refresh',
    noRoom: 'Not specified',
    noValue: 'Unavailable',
    noMotorState: 'No motor state received',
    yes: 'Yes',
    no: 'No',
    notInitialized: 'Not initialized',
    invalidHistoricalDate: 'Invalid historical date',
    historicalFad: 'Raw historical FAD',
    historicalFadNotice: 'Business meaning not confirmed',
    rawFrame: 'Raw frame',
    technicalDetails: 'Technical details',
    serviceUuid: 'Service UUID',
    characteristicUuid: 'Characteristic UUID',
    errorCode: 'Error code',
    errors: {
      serviceAbsent: 'BLE service unavailable',
      characteristicAbsent: 'Unavailable on this firmware',
      notReadable: 'Reading not supported',
      unknown: 'An error occurred while reading.',
    },
    errorDetails: {
      serviceAbsent: 'The required BLE service is not exposed by this product.',
      characteristicAbsent:
        'The required BLE characteristic is not exposed by this product.',
      notReadable: 'The BLE characteristic cannot be read on this product.',
    },
    version: {
      productType: 'Raw product type',
      productSubtype: 'Subtype',
      crc: 'CRC',
      motorAddress: 'Serial number',
    },
    user: {
      lockMode: 'Door-lock mode',
      lockModeRaw: 'Raw door-lock mode',
      staticLight: 'Static lighting',
      peripheralByte1: 'User peripheral byte 1',
      peripheralByte2: 'User peripheral byte 2',
    },
    expert: {
      exactWeight: 'Exact weight',
      nearOpenProportional: 'Opening proportional gain',
      nearCloseProportional: 'Closing proportional gain',
      nearOpenIntegral: 'Opening integral gain',
      nearCloseIntegral: 'Closing integral gain',
      peripherals: 'Raw peripherals (inputs, lock and radar tests)',
      peripheralsWithoutLock: 'Raw peripherals (inputs and radar tests)',
    },
    motor: {
      rawState: 'Raw state',
      stateLabel: 'Technical state',
      currentPosition: 'Current position',
      maximumPosition: 'Maximum position',
      percentage: 'Opening',
      error: 'Error',
      switchesRaw: 'Raw state bits',
      openingStarted: 'Opening started',
      stoppedAfterOpening: 'Stopped after opening',
      closingStarted: 'Closing started',
      stoppedAfterClosing: 'Stopped after closing',
      unknown: 'Undocumented state',
    },
  },
  de: {
    backToScan: 'Zurück zur Suche',
    returnToScanFailed:
      'Das Produkt konnte nicht getrennt werden. Versuchen Sie es erneut, bevor Sie zur Suche zurückkehren.',
    openProductPage: 'Produktseite öffnen',
    refresh: 'Informationen aktualisieren',
    loading: 'Wird geladen…',
    readonlyNotice: 'Vom Produkt gelesene Einstellungen.',
    commandsUnavailable: 'Befehle sind derzeit nicht verfügbar.',
    lockModeControls: {
      title: 'Türverriegelung',
      executing: 'Verriegelungseinstellung wird gesendet…',
      sent: 'Verriegelungseinstellung gesendet. Kontrolllesung läuft.',
      failed: 'Verriegelungseinstellung konnte nicht gesendet werden.',
      unavailable: 'Verriegelungsbefehl nicht verfügbar',
    },
    userSpeedControls: {
      apply: 'Anwenden', current: 'Aktueller Wert:', draft: 'Zu übernehmender Wert:',
      executing: 'Geschwindigkeit wird gesendet…',
      sent: 'Geschwindigkeit gesendet. Kontrolllesung läuft.',
      failed: 'Geschwindigkeit konnte nicht gesendet werden.',
      unavailable: 'Geschwindigkeitsbefehl nicht verfügbar',
    },
    userTimingControls: {
      apply: 'Anwenden', current: 'Aktueller Wert:', draft: 'Zu übernehmender Wert:',
      executing: 'Verzögerung wird gesendet…',
      sent: 'Verzögerung gesendet. Kontrolllesung läuft.',
      failed: 'Verzögerung konnte nicht gesendet werden.',
      unavailable: 'Verzögerungsbefehl nicht verfügbar',
    },
    userPeripheralControls: {
      title: 'Beleuchtung und Anzeigen',
      executing: 'Beleuchtungseinstellung wird gesendet…',
      sent: 'Beleuchtungseinstellung gesendet. Kontrolllesung läuft.',
      failed: 'Beleuchtungseinstellung konnte nicht gesendet werden.',
      unavailable: 'Beleuchtungsbefehl nicht verfügbar',
    },
    nameRoomControls: {
      none: 'Keine',
      current: 'Aktueller Wert:', draft: 'Zu schreibender Wert:',
      executing: 'Name und Raum werden gesendet…',
      sent: 'Name und Raum gesendet. Eine neue Suche kann erforderlich sein.',
      failed: 'Name und Raum konnten nicht gesendet werden.',
      unavailable: 'Befehl für Name/Raum nicht verfügbar',
      rooms: { entrance: 'Eingang', hall: 'Flur' },
      errors: {
        empty: 'Der Name ist erforderlich.',
        invalidCharacters: 'Nur Buchstaben, Ziffern, Leerzeichen und Bindestriche sind zulässig.',
        tooLong: 'Der vollständige Name ist auf 15 Zeichen begrenzt.',
        tooShort: 'Der Name muss mindestens 5 Zeichen enthalten.',
        invalidRoom: 'Unbekannter Raum.',
      },
    },
    weightRangeControls: {
      apply: 'Anwenden', selectTitle: 'Türgewicht auswählen',
      warning: 'ACHTUNG: Beim Ändern dieser Einstellung werden die Geschwindigkeitseinstellungen zurückgesetzt!',
      cancel: 'Abbrechen', confirm: 'Bestätigen', current: 'Aktueller Bereich:', draft: 'Zu übernehmender Bereich:',
      executing: 'Gewichtsbereich wird gesendet…',
      sent: 'Gewichtsbereich gesendet. Kontrolllesung läuft.',
      failed: 'Gewichtsbereich konnte nicht gesendet werden.',
      unavailable: 'Befehl für Gewichtsbereich nicht verfügbar',
    },
    sensitiveActions: {
      title: 'Erweiterte Funktionen',
      notice: 'Diese Funktionen entsprechen den am Produkt verfügbaren Befehlen. Destruktive Aktionen erfordern eine ausdrückliche Bestätigung.',
      radarTest1: 'Radartest 1', radarTest2: 'Radartest 2',
      awaitingConfirmation: 'Bestätigung erforderlich.', executing: 'Erweiterter Befehl läuft…',
      sent: 'Befehl gesendet. Kontrolllesung läuft.', failed: 'Erweiterter Befehl fehlgeschlagen.',
      cancelled: 'Befehl abgebrochen.', cancel: 'Abbrechen', confirm: 'Bestätigen',
      learningConfirmTitle: 'Endlagenlernen starten?',
      learningConfirmMessage: 'Dieser Befehl kann automatische Motorbewegungen auslösen. Stellen Sie vor der Bestätigung sicher, dass der Bereich frei ist.',
      resetConfirmTitle: 'Widoor-Einstellungen zurücksetzen?',
      resetConfirmMessage: 'Diese Aktion stellt die neun Standardeinstellungen wieder her und ersetzt mehrere aktuelle Einstellungen. Sie kann nicht automatisch rückgängig gemacht werden.',
    },
    expertPeripheralDiagnostics: {
      title: 'Peripheriediagnose',
      readonlyNotice: 'Vom Produkt gelesene Zustände. Es wird kein Test- oder Verriegelungsbefehl gesendet.',
      radarTest1: 'Radartest 1', radarTest2: 'Radartest 2', peripheralLock: 'Peripherieverriegelung',
      enabled: 'Aktiviert', disabled: 'Deaktiviert',
    },
    expertInputControls: {
      current: 'Aktueller Wert:', executing: 'Eingangskonfiguration wird gesendet…',
      sent: 'Eingangskonfiguration vom Produkt bestätigt.',
      failed: 'Eingangskonfiguration vom Produkt nicht bestätigt.',
      unavailable: 'Befehl für Eingangskonfiguration nicht verfügbar',
    },
    expertScalarControls: {
      apply: 'Anwenden', current: 'Aktueller Wert:', draft: 'Zu übernehmender Wert:',
      executing: 'Experteneinstellung wird gesendet…', sent: 'Experteneinstellung gesendet. Kontrolllesung läuft.',
      failed: 'Experteneinstellung konnte nicht gesendet werden.', unavailable: 'Experteneinstellung nicht verfügbar',
    },
    expertAccess: {
      title: 'Expertenzugang', expertTitle: 'Experteneinstellungen', expertMode: 'Expertenmodus',
      message: 'Geben Sie den Expertencode ein, um diese Einstellungen anzuzeigen.', placeholder: 'Expertencode',
      expertPlaceholder: 'Passwort eingeben', cancel: 'Abbrechen', confirm: 'Bestätigen',
      unlock: 'Experteneinstellungen entsperren', locked: 'Einige Experteneinstellungen sind ausgeblendet.',
      unlocked: 'Experteneinstellungen entsperrt.', failed: 'Falscher Expertencode.',
    },
    moventivAdvancedAlert: {
      title: 'Achtung',
      message: 'Das Ändern dieser Einstellungen kann den ordnungsgemäßen Betrieb des Systems beeinträchtigen. Lesen Sie vor Änderungen die Anleitung.',
      no: 'Abbrechen', yes: 'Fortsetzen',
    },
    productDateActions: {
      confirmTitle: 'Bestätigung erforderlich', passwordPlaceholder: 'Wartungspasswort', cancel: 'Abbrechen', confirm: 'Bestätigen',
      awaitingConfirmation: 'Wartungsbestätigung erforderlich.', executing: 'Datumsaktion wird gesendet…',
      setupSent: 'Inbetriebnahme bestätigt.', setupNotConfirmed: 'Inbetriebnahme vom Produkt nicht bestätigt. Prüfen Sie die Datumsangaben.', maintenanceSent: 'Wartung gesendet. Kontrolllesung läuft.',
      setupSentReloadFailed: 'Inbetriebnahme gesendet, aber die Kontrolllesung ist fehlgeschlagen.',
      maintenanceSentReloadFailed: 'Wartung gesendet, aber die Kontrolllesung ist fehlgeschlagen.',
      failed: 'Datumsaktion konnte nicht gesendet werden.',
      partialFailed: 'Wartung gesendet, aber die Inbetriebnahme wurde nicht bestätigt.',
      partialReloadFailed: 'Wartung gesendet, aber die Inbetriebnahme wurde nicht bestätigt. Die Kontrolllesung ist fehlgeschlagen.',
      unavailable: 'Datumsaktion nicht verfügbar', wrongCode: 'Falscher Wartungscode.', cancelled: 'Aktion abgebrochen.',
      setupConfirmation: (date: string) => `Bestätigen Sie, dass die Inbetriebnahme am ${date} durchgeführt wurde? Die Wartung wird gespeichert; anschließend wird das Inbetriebnahmedatum dauerhaft gespeichert, wenn das Produkt weiterhin als nicht initialisiert gemeldet wird.`,
      maintenanceConfirmation: (date: string) => `Bestätigen Sie, dass die Wartung am ${date} durchgeführt wurde? Die Firmware kann den Zykluszähler seit der letzten Wartung zurücksetzen.`,
    },
    openCommand: {
      cancel: 'Abbrechen', awaitingConfirmation: 'Bestätigung erforderlich', sent: 'Befehl gesendet', executing: 'Befehl läuft…',
      unavailable: 'Befehl nicht verfügbar', disconnected: 'Gerät getrennt', stale: 'Veraltetes Ergebnis', failed: 'Befehl fehlgeschlagen',
      alreadyInProgress: 'Ein Befehl wird bereits ausgeführt', cancelled: 'Befehl abgebrochen',
    },
    widoorCommands: {
      warning: 'Der Motor wird tatsächlich bewegt.', physicalValidationRequired: 'Physische Prüfung erforderlich',
      protected: 'Geschützte Funktion — gesonderte Prüfung erforderlich', timedCyclePending: 'Der vollständige zeitgesteuerte Zyklus muss noch physisch geprüft werden.',
      open: { confirmTitle: 'Tür öffnen?', confirmMessage: 'Diese Aktion bewegt den Motor. Stellen Sie sicher, dass der Bereich frei und der physische Stopp erreichbar ist.', confirmed: 'Öffnung bestätigt', notConfirmed: 'Befehl gesendet, aber Öffnung nicht bestätigt' },
      close: { confirmTitle: 'Tür schließen?', confirmMessage: 'Diese Aktion bewegt den Motor. Stellen Sie sicher, dass der Bereich frei und der physische Stopp erreichbar ist.', confirmed: 'Schließung bestätigt', notConfirmed: 'Befehl gesendet, aber Schließung nicht bestätigt' },
      openShortTimed: { label: 'Kurze zeitgesteuerte Öffnung', confirmTitle: 'Kurze zeitgesteuerte Öffnung starten?', confirmMessage: 'Diese Aktion bewegt den Motor. Stellen Sie sicher, dass der Bereich frei und der physische Stopp erreichbar ist. Der Bewegungsbeginn wird geprüft; der vollständige zeitgesteuerte Zyklus muss separat validiert werden.', confirmAction: 'Starten', confirmed: 'Beginn der kurzen zeitgesteuerten Öffnung bestätigt', notConfirmed: 'Befehl gesendet, aber Start nicht bestätigt' },
      openLongTimed: { label: 'Lange zeitgesteuerte Öffnung', confirmTitle: 'Lange zeitgesteuerte Öffnung starten?', confirmMessage: 'Diese Aktion bewegt den Motor. Stellen Sie sicher, dass der Bereich frei und der physische Stopp erreichbar ist. Der Bewegungsbeginn wird geprüft; der vollständige zeitgesteuerte Zyklus muss separat validiert werden.', confirmAction: 'Starten', confirmed: 'Beginn der langen zeitgesteuerten Öffnung bestätigt', notConfirmed: 'Befehl gesendet, aber Start nicht bestätigt' },
      learning: { label: 'Einlernen' },
    },
    widoorCommandAlerts: {
      lock: { title: 'Befehl nicht möglich', subtitle: 'Deaktivieren Sie zuerst die Türverriegelung.' },
      retention: { title: 'Befehl nicht möglich', subtitle: 'Deaktivieren Sie zuerst das Offenhalten.' },
    },
    commandHistory: {
      title: 'Befehlsverlauf', empty: 'Während dieser Sitzung wurde kein Befehl abgeschlossen.', duration: 'Dauer', confirmation: 'Motorbestätigung', timedCycle: 'Zeitgesteuerter Zyklus',
      statuses: { confirmed: 'Bestätigt', timeout: 'Nicht bestätigt', failed: 'Fehlgeschlagen', disconnected: 'Getrennt', stale: 'Veraltet', unavailable: 'Nicht verfügbar', cancelled: 'Abgebrochen' },
      confirmations: { confirmed: 'Bestätigt', timeout: 'Nicht bestätigt', unavailable: 'Nicht verfügbar', notRequired: 'Nicht erforderlich', notValidated: 'Nicht validiert', none: 'Keine' },
      timedCycles: { notObserved: 'Nicht beobachtet', pendingPhysicalValidation: 'Physische Prüfung ausstehend', validated: 'Validiert', failed: 'Fehlgeschlagen' },
    },
    sections: { userSettings: 'Benutzereinstellungen', expertSettings: 'Experteneinstellungen', identity: 'Verbundenes Produkt' },
    information: { general: 'Allgemeine Informationen', currentWeightProfile: 'Aktuelles Profil', maximumWeight: 'Maximalgewicht', supplemental: 'Zusätzliche Informationen' },
    shell: {
      controlledDoor: 'Gesteuerte Tür',
      showPrecision: 'Feineinstellung anzeigen',
      preciseAdjustment: 'Feineinstellung',
      increaseByOne: 'Um 1 erhöhen',
      decreaseByOne: 'Um 1 verringern',
    },
    states: { available: 'Verfügbar', unavailable: 'Nicht verfügbar', invalid: 'Ungültige Daten', notLoaded: 'Nicht geladen', failed: 'Lesen nicht möglich', disconnected: 'Getrennt', stale: 'Veraltete Daten', connected: 'Verbunden', invalidProfile: 'Inkonsistentes Profil', partialSuccess: 'Teilerfolg', success: 'Informationen verfügbar', cancelled: 'Lesen abgebrochen' },
    profile: 'Profil', productName: 'Produktname', displayedName: 'Angezeigter Name', room: 'Raum', deviceId: 'Gerätekennung', connection: 'Verbindung', lastRefresh: 'Letzte Aktualisierung', noRoom: 'Nicht angegeben', noValue: 'Nicht verfügbar', noMotorState: 'Kein Motorzustand empfangen', yes: 'Ja', no: 'Nein', notInitialized: 'Nicht initialisiert', invalidHistoricalDate: 'Ungültiges historisches Datum', historicalFad: 'Historische FAD-Rohdaten', historicalFadNotice: 'Fachliche Bedeutung nicht bestätigt', rawFrame: 'Rohdatenrahmen', technicalDetails: 'Technische Details', serviceUuid: 'Service-UUID', characteristicUuid: 'Merkmal-UUID', errorCode: 'Fehlercode',
    errors: { serviceAbsent: 'BLE-Dienst nicht verfügbar', characteristicAbsent: 'Für diese Firmware nicht verfügbar', notReadable: 'Lesen nicht unterstützt', unknown: 'Beim Lesen ist ein Fehler aufgetreten.' },
    errorDetails: { serviceAbsent: 'Der erforderliche BLE-Dienst wird von diesem Produkt nicht bereitgestellt.', characteristicAbsent: 'Das erforderliche BLE-Merkmal wird von diesem Produkt nicht bereitgestellt.', notReadable: 'Das BLE-Merkmal kann bei diesem Produkt nicht gelesen werden.' },
    version: { productType: 'Produkt-Rohtyp', productSubtype: 'Untertyp', crc: 'CRC', motorAddress: 'Seriennummer' },
    user: { lockMode: 'Verriegelungsmodus', lockModeRaw: 'Roher Verriegelungsmodus', staticLight: 'Statische Beleuchtung', peripheralByte1: 'Benutzer-Peripheriebyte 1', peripheralByte2: 'Benutzer-Peripheriebyte 2' },
    expert: { exactWeight: 'Genaues Gewicht', nearOpenProportional: 'Proportionalanteil Öffnen', nearCloseProportional: 'Proportionalanteil Schließen', nearOpenIntegral: 'Integralanteil Öffnen', nearCloseIntegral: 'Integralanteil Schließen', peripherals: 'Peripherie-Rohdaten (Eingänge, Verriegelung und Radartests)', peripheralsWithoutLock: 'Peripherie-Rohdaten (Eingänge und Radartests)' },
    motor: { rawState: 'Rohzustand', stateLabel: 'Technischer Zustand', currentPosition: 'Aktuelle Position', maximumPosition: 'Maximale Position', percentage: 'Öffnung', error: 'Fehler', switchesRaw: 'Rohdaten der Zustandsbits', openingStarted: 'Öffnung gestartet', stoppedAfterOpening: 'Nach dem Öffnen angehalten', closingStarted: 'Schließung gestartet', stoppedAfterClosing: 'Nach dem Schließen angehalten', unknown: 'Nicht dokumentierter Zustand' },
  },
  pl: {
    backToScan: 'Powrót do wyszukiwania',
    returnToScanFailed: 'Nie można odłączyć produktu. Spróbuj ponownie przed powrotem do wyszukiwania.',
    openProductPage: 'Otwórz stronę produktu', refresh: 'Odśwież informacje', loading: 'Ładowanie…',
    readonlyNotice: 'Ustawienia odczytane z produktu.', commandsUnavailable: 'Polecenia są obecnie niedostępne.',
    lockModeControls: { title: 'Blokada drzwi', executing: 'Wysyłanie ustawienia blokady…', sent: 'Ustawienie blokady wysłane. Trwa odczyt kontrolny.', failed: 'Nie udało się wysłać ustawienia blokady.', unavailable: 'Polecenie blokady niedostępne' },
    userSpeedControls: { apply: 'Zastosuj', current: 'Bieżąca wartość:', draft: 'Wartość do zastosowania:', executing: 'Wysyłanie prędkości…', sent: 'Prędkość wysłana. Trwa odczyt kontrolny.', failed: 'Nie udało się wysłać prędkości.', unavailable: 'Polecenie prędkości niedostępne' },
    userTimingControls: { apply: 'Zastosuj', current: 'Bieżąca wartość:', draft: 'Wartość do zastosowania:', executing: 'Wysyłanie opóźnienia…', sent: 'Opóźnienie wysłane. Trwa odczyt kontrolny.', failed: 'Nie udało się wysłać opóźnienia.', unavailable: 'Polecenie opóźnienia niedostępne' },
    userPeripheralControls: { title: 'Oświetlenie i wskaźniki', executing: 'Wysyłanie ustawienia oświetlenia…', sent: 'Ustawienie oświetlenia wysłane. Trwa odczyt kontrolny.', failed: 'Nie udało się wysłać ustawienia oświetlenia.', unavailable: 'Polecenie oświetlenia niedostępne' },
    nameRoomControls: {
      none: 'Brak',
      current: 'Bieżąca wartość:', draft: 'Wartość do zapisania:', executing: 'Wysyłanie nazwy i pomieszczenia…', sent: 'Nazwa i pomieszczenie wysłane. Może być wymagane ponowne wyszukiwanie.', failed: 'Nie udało się wysłać nazwy i pomieszczenia.', unavailable: 'Polecenie nazwy/pomieszczenia niedostępne',
      rooms: { entrance: 'Przedpokój', hall: 'Hol' },
      errors: { empty: 'Nazwa jest wymagana.', invalidCharacters: 'Dozwolone są wyłącznie litery, cyfry, spacje i łączniki.', tooLong: 'Pełna nazwa jest ograniczona do 15 znaków.', tooShort: 'Nazwa musi zawierać co najmniej 5 znaków.', invalidRoom: 'Nieznane pomieszczenie.' },
    },
    weightRangeControls: { apply: 'Zastosuj', selectTitle: 'Wybierz wagę drzwi', warning: 'UWAGA: Zmiana tego ustawienia zresetuje ustawienia prędkości!', cancel: 'Anuluj', confirm: 'Potwierdź', current: 'Bieżący zakres:', draft: 'Zakres do zastosowania:', executing: 'Wysyłanie zakresu wagi…', sent: 'Zakres wagi wysłany. Trwa odczyt kontrolny.', failed: 'Nie udało się wysłać zakresu wagi.', unavailable: 'Polecenie zakresu wagi niedostępne' },
    sensitiveActions: {
      title: 'Funkcje zaawansowane', notice: 'Te funkcje odpowiadają poleceniom dostępnym w produkcie. Działania destrukcyjne wymagają wyraźnego potwierdzenia.', radarTest1: 'Test radaru 1', radarTest2: 'Test radaru 2', awaitingConfirmation: 'Wymagane potwierdzenie.', executing: 'Trwa wykonywanie polecenia zaawansowanego…', sent: 'Polecenie wysłane. Trwa odczyt kontrolny.', failed: 'Polecenie zaawansowane nie powiodło się.', cancelled: 'Polecenie anulowane.', cancel: 'Anuluj', confirm: 'Potwierdź',
      learningConfirmTitle: 'Uruchomić kalibrację pozycji krańcowych?', learningConfirmMessage: 'To polecenie może spowodować automatyczny ruch napędu. Przed potwierdzeniem upewnij się, że obszar jest wolny.', resetConfirmTitle: 'Zresetować ustawienia Widoor?', resetConfirmMessage: 'Ta czynność przywraca dziewięć ustawień domyślnych i zastępuje kilka bieżących ustawień. Nie można jej automatycznie cofnąć.',
    },
    expertPeripheralDiagnostics: { title: 'Diagnostyka urządzeń peryferyjnych', readonlyNotice: 'Stany odczytane z produktu. Nie jest wysyłane żadne polecenie testu ani blokady.', radarTest1: 'Test radaru 1', radarTest2: 'Test radaru 2', peripheralLock: 'Blokada urządzeń peryferyjnych', enabled: 'Włączone', disabled: 'Wyłączone' },
    expertInputControls: { current: 'Bieżąca wartość:', executing: 'Wysyłanie konfiguracji wejść…', sent: 'Konfiguracja wejść potwierdzona przez produkt.', failed: 'Produkt nie potwierdził konfiguracji wejść.', unavailable: 'Polecenie konfiguracji wejść niedostępne' },
    expertScalarControls: { apply: 'Zastosuj', current: 'Bieżąca wartość:', draft: 'Wartość do zastosowania:', executing: 'Wysyłanie ustawienia eksperckiego…', sent: 'Ustawienie eksperckie wysłane. Trwa odczyt kontrolny.', failed: 'Nie udało się wysłać ustawienia eksperckiego.', unavailable: 'Ustawienie eksperckie niedostępne' },
    expertAccess: { title: 'Dostęp ekspercki', expertTitle: 'Ustawienia eksperckie', expertMode: 'Tryb ekspercki', message: 'Wprowadź kod ekspercki, aby wyświetlić te ustawienia.', placeholder: 'Kod ekspercki', expertPlaceholder: 'Wprowadź hasło', cancel: 'Anuluj', confirm: 'Potwierdź', unlock: 'Odblokuj ustawienia eksperckie', locked: 'Niektóre ustawienia eksperckie są ukryte.', unlocked: 'Ustawienia eksperckie odblokowane.', failed: 'Nieprawidłowy kod ekspercki.' },
    moventivAdvancedAlert: { title: 'Uwaga', message: 'Zmiana tych ustawień może wpłynąć na prawidłowe działanie systemu. Przed wprowadzeniem zmian przeczytaj instrukcję.', no: 'Anuluj', yes: 'Kontynuuj' },
    productDateActions: {
      confirmTitle: 'Wymagane potwierdzenie', passwordPlaceholder: 'Hasło konserwacyjne', cancel: 'Anuluj', confirm: 'Potwierdź', awaitingConfirmation: 'Wymagane potwierdzenie konserwacji.', executing: 'Wysyłanie działania daty…', setupSent: 'Potwierdzono uruchomienie.', setupNotConfirmed: 'Produkt nie potwierdził uruchomienia. Sprawdź daty.', maintenanceSent: 'Konserwacja wysłana. Trwa odczyt kontrolny.', setupSentReloadFailed: 'Uruchomienie wysłane, ale odczyt kontrolny nie powiódł się.', maintenanceSentReloadFailed: 'Konserwacja wysłana, ale odczyt kontrolny nie powiódł się.', failed: 'Nie udało się wysłać działania daty.', partialFailed: 'Konserwacja wysłana, ale uruchomienie nie zostało potwierdzone.', partialReloadFailed: 'Konserwacja wysłana, ale uruchomienie nie zostało potwierdzone. Odczyt kontrolny nie powiódł się.', unavailable: 'Działanie daty niedostępne', wrongCode: 'Nieprawidłowy kod konserwacyjny.', cancelled: 'Działanie anulowane.',
      setupConfirmation: (date: string) => `Czy potwierdzasz, że uruchomienie przeprowadzono ${date}? Konserwacja zostanie zapisana, a następnie data uruchomienia zostanie trwale zapisana, jeśli produkt nadal zgłasza brak inicjalizacji.`,
      maintenanceConfirmation: (date: string) => `Czy potwierdzasz, że konserwację przeprowadzono ${date}? Oprogramowanie układowe może wyzerować licznik cykli od ostatniej konserwacji.`,
    },
    openCommand: { cancel: 'Anuluj', awaitingConfirmation: 'Wymagane potwierdzenie', sent: 'Polecenie wysłane', executing: 'Polecenie w toku…', unavailable: 'Polecenie niedostępne', disconnected: 'Urządzenie odłączone', stale: 'Nieaktualny wynik', failed: 'Polecenie nie powiodło się', alreadyInProgress: 'Polecenie jest już wykonywane', cancelled: 'Polecenie anulowane' },
    widoorCommands: {
      warning: 'Napęd zostanie rzeczywiście uruchomiony.', physicalValidationRequired: 'Wymagana weryfikacja fizyczna', protected: 'Funkcja chroniona — wymagana osobna weryfikacja', timedCyclePending: 'Pełny cykl czasowy nadal wymaga weryfikacji fizycznej.',
      open: { confirmTitle: 'Otworzyć drzwi?', confirmMessage: 'Ta czynność uruchamia napęd. Upewnij się, że obszar jest wolny, a fizyczny przycisk zatrzymania jest dostępny.', confirmed: 'Otwarcie potwierdzone', notConfirmed: 'Polecenie wysłane, ale otwarcie nie zostało potwierdzone' },
      close: { confirmTitle: 'Zamknąć drzwi?', confirmMessage: 'Ta czynność uruchamia napęd. Upewnij się, że obszar jest wolny, a fizyczny przycisk zatrzymania jest dostępny.', confirmed: 'Zamknięcie potwierdzone', notConfirmed: 'Polecenie wysłane, ale zamknięcie nie zostało potwierdzone' },
      openShortTimed: { label: 'Krótkie otwarcie czasowe', confirmTitle: 'Uruchomić krótkie otwarcie czasowe?', confirmMessage: 'Ta czynność uruchamia napęd. Upewnij się, że obszar jest wolny, a fizyczny przycisk zatrzymania jest dostępny. Początek ruchu zostanie sprawdzony, ale pełny cykl czasowy należy zweryfikować osobno.', confirmAction: 'Uruchom', confirmed: 'Potwierdzono początek krótkiego otwarcia czasowego', notConfirmed: 'Polecenie wysłane, ale początek nie został potwierdzony' },
      openLongTimed: { label: 'Długie otwarcie czasowe', confirmTitle: 'Uruchomić długie otwarcie czasowe?', confirmMessage: 'Ta czynność uruchamia napęd. Upewnij się, że obszar jest wolny, a fizyczny przycisk zatrzymania jest dostępny. Początek ruchu zostanie sprawdzony, ale pełny cykl czasowy należy zweryfikować osobno.', confirmAction: 'Uruchom', confirmed: 'Potwierdzono początek długiego otwarcia czasowego', notConfirmed: 'Polecenie wysłane, ale początek nie został potwierdzony' },
      learning: { label: 'Kalibracja' },
    },
    widoorCommandAlerts: { lock: { title: 'Nie można wykonać polecenia', subtitle: 'Najpierw wyłącz blokadę drzwi.' }, retention: { title: 'Nie można wykonać polecenia', subtitle: 'Najpierw wyłącz utrzymywanie drzwi w pozycji otwartej.' } },
    commandHistory: { title: 'Historia poleceń', empty: 'W tej sesji nie zakończono żadnego polecenia.', duration: 'Czas', confirmation: 'Potwierdzenie napędu', timedCycle: 'Cykl czasowy', statuses: { confirmed: 'Potwierdzone', timeout: 'Niepotwierdzone', failed: 'Niepowodzenie', disconnected: 'Odłączone', stale: 'Nieaktualne', unavailable: 'Niedostępne', cancelled: 'Anulowane' }, confirmations: { confirmed: 'Potwierdzone', timeout: 'Niepotwierdzone', unavailable: 'Niedostępne', notRequired: 'Niewymagane', notValidated: 'Niezweryfikowane', none: 'Brak' }, timedCycles: { notObserved: 'Niezaobserwowany', pendingPhysicalValidation: 'Oczekuje na weryfikację fizyczną', validated: 'Zweryfikowany', failed: 'Niepowodzenie' } },
    sections: { userSettings: 'Ustawienia użytkownika', expertSettings: 'Ustawienia eksperckie', identity: 'Połączony produkt' },
    information: { general: 'Informacje ogólne', currentWeightProfile: 'Bieżący profil', maximumWeight: 'Maksymalna waga', supplemental: 'Informacje dodatkowe' },
    shell: {
      controlledDoor: 'Sterowane drzwi',
      showPrecision: 'Pokaż regulację precyzyjną',
      preciseAdjustment: 'Regulacja precyzyjna',
      increaseByOne: 'Zwiększ o 1',
      decreaseByOne: 'Zmniejsz o 1',
    },
    states: { available: 'Dostępne', unavailable: 'Niedostępne', invalid: 'Nieprawidłowe dane', notLoaded: 'Niezaładowane', failed: 'Odczyt niemożliwy', disconnected: 'Odłączono', stale: 'Nieaktualne dane', connected: 'Połączono', invalidProfile: 'Niespójny profil', partialSuccess: 'Częściowe powodzenie', success: 'Informacje dostępne', cancelled: 'Odczyt anulowany' },
    profile: 'Profil', productName: 'Nazwa produktu', displayedName: 'Wyświetlana nazwa', room: 'Pomieszczenie', deviceId: 'Identyfikator urządzenia', connection: 'Połączenie', lastRefresh: 'Ostatnie odświeżenie', noRoom: 'Nie podano', noValue: 'Niedostępne', noMotorState: 'Nie odebrano stanu napędu', yes: 'Tak', no: 'Nie', notInitialized: 'Nie zainicjalizowano', invalidHistoricalDate: 'Nieprawidłowa data historyczna', historicalFad: 'Surowe historyczne dane FAD', historicalFadNotice: 'Znaczenie funkcjonalne niepotwierdzone', rawFrame: 'Surowa ramka', technicalDetails: 'Szczegóły techniczne', serviceUuid: 'UUID usługi', characteristicUuid: 'UUID charakterystyki', errorCode: 'Kod błędu',
    errors: { serviceAbsent: 'Usługa BLE niedostępna', characteristicAbsent: 'Niedostępne dla tego oprogramowania układowego', notReadable: 'Odczyt nieobsługiwany', unknown: 'Wystąpił błąd podczas odczytu.' },
    errorDetails: { serviceAbsent: 'Wymagana usługa BLE nie jest udostępniana przez ten produkt.', characteristicAbsent: 'Wymagana charakterystyka BLE nie jest udostępniana przez ten produkt.', notReadable: 'Charakterystyki BLE tego produktu nie można odczytać.' },
    version: { productType: 'Surowy typ produktu', productSubtype: 'Podtyp', crc: 'CRC', motorAddress: 'Numer seryjny' },
    user: { lockMode: 'Tryb blokady', lockModeRaw: 'Surowy tryb blokady', staticLight: 'Oświetlenie statyczne', peripheralByte1: 'Bajt urządzeń peryferyjnych użytkownika 1', peripheralByte2: 'Bajt urządzeń peryferyjnych użytkownika 2' },
    expert: { exactWeight: 'Dokładna waga', nearOpenProportional: 'Składnik proporcjonalny otwierania', nearCloseProportional: 'Składnik proporcjonalny zamykania', nearOpenIntegral: 'Składnik całkujący otwierania', nearCloseIntegral: 'Składnik całkujący zamykania', peripherals: 'Surowe dane urządzeń peryferyjnych (wejścia, blokada i testy radaru)', peripheralsWithoutLock: 'Surowe dane urządzeń peryferyjnych (wejścia i testy radaru)' },
    motor: { rawState: 'Surowy stan', stateLabel: 'Stan techniczny', currentPosition: 'Bieżąca pozycja', maximumPosition: 'Pozycja maksymalna', percentage: 'Otwarcie', error: 'Błąd', switchesRaw: 'Surowe bity stanu', openingStarted: 'Rozpoczęto otwieranie', stoppedAfterOpening: 'Zatrzymano po otwarciu', closingStarted: 'Rozpoczęto zamykanie', stoppedAfterClosing: 'Zatrzymano po zamknięciu', unknown: 'Stan nieudokumentowany' },
  },
} satisfies Readonly<Record<TranslatedLanguage, TextPatch<ProductPageText>>>;

function mergeText<T>(base: T, patch: TextPatch<T>): T {
  if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
    return patch as T;
  }

  const baseRecord = base as Record<string, unknown>;
  const patchRecord = patch as Record<string, unknown>;
  const result: Record<string, unknown> = { ...baseRecord };
  for (const [key, value] of Object.entries(patchRecord)) {
    result[key] = typeof value === 'object' && value !== null && !Array.isArray(value)
      ? mergeText(baseRecord[key], value)
      : value;
  }
  return Object.freeze(result) as T;
}

export function translatedProductPageTextFor(
  language: ProductPageLanguage,
): ProductPageText {
  return language === 'fr'
    ? PRODUCT_PAGE_TEXT
    : mergeText<ProductPageText>(
        PRODUCT_PAGE_TEXT,
        PRODUCT_PAGE_TRANSLATIONS[language],
      );
}
