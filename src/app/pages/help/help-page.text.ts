export type HelpPlatform = 'android' | 'ios' | 'web';

export interface HelpInstructions {
  readonly pairing: readonly string[];
  readonly troubleshooting: readonly string[];
  readonly unpairing: readonly string[];
}

const COMMON_TROUBLESHOOTING = Object.freeze([
  'Vérifiez que le Bluetooth est activé sur le téléphone.',
  'Rapprochez le téléphone de la motorisation puis relancez la recherche.',
  'Si un produit était déjà connecté, revenez au scan et reconnectez-le proprement.',
]);

const ANDROID_PAIRING = Object.freeze([
  'Sur la motorisation, placez le switch 1 sur OFF.',
  'Appuyez sur le bouton PRG : l’indicateur doit rester allumé en magenta.',
  'Sur le téléphone, activez le Bluetooth puis revenez dans l’application.',
  'Lancez le scan BLE et sélectionnez la motorisation détectée.',
]);

const IOS_PAIRING = Object.freeze([
  'Sur la motorisation, placez le switch 1 sur OFF.',
  'Appuyez sur le bouton PRG : l’indicateur doit rester allumé en magenta.',
  'Dans l’application, lancez la recherche des motorisations.',
  'Sélectionnez la motorisation puis acceptez la demande de jumelage si iOS la présente.',
]);

const IOS_UNPAIRING = Object.freeze([
  'Dans Réglages > Bluetooth, ouvrez les informations de l’appareil puis choisissez « Oublier cet appareil » si nécessaire.',
  'L’effacement de tous les appareils côté motorisation est une opération distincte qui peut aussi supprimer les émetteurs radio ; ne l’effectuez que selon la procédure produit validée.',
]);

const DEFAULT_UNPAIRING = Object.freeze([
  'Si un ancien jumelage empêche la connexion, supprimez l’association Bluetooth depuis les réglages du téléphone puis relancez le scan dans l’application.',
]);

export function helpInstructionsFor(
  platform: HelpPlatform,
): HelpInstructions {
  return Object.freeze({
    pairing: platform === 'ios' ? IOS_PAIRING : ANDROID_PAIRING,
    troubleshooting: COMMON_TROUBLESHOOTING,
    unpairing: platform === 'ios' ? IOS_UNPAIRING : DEFAULT_UNPAIRING,
  });
}
