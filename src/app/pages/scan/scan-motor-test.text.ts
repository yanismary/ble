// Replace this catalogue with the application i18n service when it is added.
export const SCAN_MOTOR_TEST_TEXT = {
  title: 'Test commande moteur',
  warning:
    'Attention : cette action déclenche un mouvement réel du moteur. ' +
    'Vérifiez que la zone est dégagée et que l’arrêt physique est accessible.',
  profile: 'Profil détecté',
  deviceName: 'Nom du périphérique',
  deviceId: 'Identifiant',
  currentPosition: 'Position actuelle',
  maximumPosition: 'Position maximale',
  availability: 'Disponibilité',
  open: 'OPEN',
  cancel: 'Annuler',
  confirmTitle: 'Confirmer l’ouverture',
  confirmMessage:
    'Le moteur va réellement bouger. Vérifiez que la zone est dégagée ' +
    'et gardez l’arrêt physique accessible.',
  ready: 'Commande disponible',
  unconfirmedProfile: 'Profil non confirmé',
  waitingFirstState: 'En attente du premier état moteur',
  invalidPosition: 'Position moteur invalide',
  alreadyOpen: 'Porte déjà ouverte',
  commandInProgress: 'Commande en cours',
  disconnected: 'Périphérique déconnecté',
  scanning: 'Scan en cours',
  detectionInProgress: 'Détection du profil en cours',
  waitingMotorStateSubscription:
    'Abonnement à l’état moteur indisponible',
  unknownDeviceName: 'Périphérique sans nom',
  widoorNoPosition:
    'Ce Widoor ne fournit pas de position moteur exploitable.',
  widoorExpectedConfirmation:
    'La confirmation attendue est l’état moteur de début d’ouverture.',
  confirmationMode: 'Mode de confirmation',
  awaiting: 'Commande envoyée, attente du mouvement…',
  confirmed: 'Début d’ouverture confirmé',
  widoorConfirmed: 'Début d’ouverture confirmé par l’état moteur',
  rawState: 'État moteur brut',
  widoorTimeout:
    'Commande écrite, mais aucun état de début d’ouverture compatible ' +
    'n’a été reçu dans le délai.',
  timeout:
    'Commande écrite, mais aucune augmentation de position n’a été ' +
    'confirmée dans le délai.',
  disconnectedDuringCommand: 'Connexion perdue pendant la commande.',
  failed: 'Échec de la commande',
  deviceChanged:
    'Le périphérique connecté a changé avant l’envoi. Commande annulée.',
  reset: 'Effacer le résultat',
  newPosition: 'Nouvelle position',
  confirmationDuration: 'Délai de confirmation',
  diagnosticTitle: 'Diagnostic technique des notifications',
  diagnosticNotice:
    'Historique temporaire en mémoire, limité aux 20 dernières notifications.',
  diagnosticSequence: 'Séquence',
  diagnosticTime: 'Heure',
  diagnosticFrame: 'Trame',
  diagnosticState: 'État brut',
  diagnosticCurrentPosition: 'Position courante',
  diagnosticMaximumPosition: 'Position maximale',
  diagnosticError: 'Erreur',
  diagnosticSwitches: 'Contacteurs bruts',
  diagnosticPositionDelta: 'Variation de position',
  diagnosticUnavailable: 'Absente',
} as const;
