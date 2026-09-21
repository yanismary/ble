import { PRODUCT_PAGE_TEXT } from '../product-page-text';
import {
  moventivMotorStateLabelFor,
  normalizeProductPageLanguage,
  productPageTextFor,
  widoorDelayedOpenLabelFor,
} from '../product-page-localization';

describe('product page localization', () => {
  it('supports every Phase 1 application language', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const text = productPageTextFor(language);

      expect(text.sections.commands).toBeTruthy();
      expect(text.user.openSpeed).toBeTruthy();
      expect(text.expert.nearOpenSpeed).toBeTruthy();
      expect(text.dates.firstCommissioning).toBeTruthy();
      expect(text.version.motor).toBeTruthy();
      expect(text.maintenance.obstacleDetectionCount).toBeTruthy();
    }
  });

  it('keeps the current Phase 2 French catalogue as the default', () => {
    expect(normalizeProductPageLanguage(null)).toBe('fr');
    expect(normalizeProductPageLanguage('xx')).toBe('fr');
    expect(productPageTextFor('fr')).toBe(PRODUCT_PAGE_TEXT);
    expect(productPageTextFor('fr').lockModeControls.lockedOpen.label)
      .toBe('Maintien ouvert');
    expect(productPageTextFor('fr').dates.cyclesSinceMaintenance)
      .toBe('Cycles depuis maintenance');
    expect(productPageTextFor('fr').maintenance.initializationCount)
      .toBe('Initialisations');
  });

  it('actually changes legacy labels with the selected language', () => {
    expect(productPageTextFor('en').user.openSpeed)
      .not.toBe(productPageTextFor('fr').user.openSpeed);
    expect(productPageTextFor('de').sections.settings)
      .not.toBe(productPageTextFor('fr').sections.settings);
    expect(productPageTextFor('pl').dates.firstCommissioning)
      .not.toBe(productPageTextFor('fr').dates.firstCommissioning);
  });

  it('breaks only the German advanced-settings label onto two lines', () => {
    expect(productPageTextFor('de').shell.advanced)
      .toBe('Fortgeschrittene\nEinstellungen');

    for (const language of ['fr', 'en', 'pl'] as const) {
      expect(productPageTextFor(language).shell.advanced)
        .withContext(language)
        .not.toContain('\n');
    }
  });

  it('formats the short timed motor command with its duration in every language',
    () => {
      expect(widoorDelayedOpenLabelFor('fr', 4)).toBe('Ouvrir 4 s');
      expect(widoorDelayedOpenLabelFor('en', 4)).toBe('Open 4 s');
      expect(widoorDelayedOpenLabelFor('de', 4)).toBe('4 s öffnen');
      expect(widoorDelayedOpenLabelFor('pl', 4)).toBe('Otwórz za 4 s');
    },
  );

  it('restores the Phase 1 Moventiv labels without changing the default catalogue',
    () => {
      const text = productPageTextFor('fr', 'moventiv-60');

      expect(text.shell.basic).toBe('Basiques');
      expect(text.sections.expertSettings).toBe('Réglages avancés');
      expect(text.user.staticLight).toBe('Activation du bandeau lumineux');
      expect(text.user.rgb).toBe('LED Principale');
      expect(text.nameRoomControls.nameLabel)
        .toBe('Modifier le nom de votre MOVENTIV');
      expect(text.nameRoomControls.roomLabel)
        .toBe('Associer votre MOVENTIV à une pièce');
      expect(text.weightRangeControls.selectTitle)
        .toBe('Sélectionner le poids de la porte');
      expect(text.weightRangeControls.warning)
        .toContain('réinitialisation des paramètres de vitesse');
      expect(text.expertAccess.expertTitle).toBe('Réglages expert');
      expect(text.expertAccess.expertMode).toBe('Mode expert');
      expect(text.moventivCloseLockAlert).toEqual({
        title: 'Condamnation de la porte',
        message:
          'Vous allez condamner la porte en fermeture, il vous sera impossible de l\u2019ouvrir sans d\u00e9sactiver cette option.',
        ok: 'OK',
      });
      expect(text.information.currentWeightProfile).toBe('Profil actuel');
      expect(text.information.maximumWeight).toBe('Poids maximum autorisé');
      expect(productPageTextFor('fr')).toBe(PRODUCT_PAGE_TEXT);
    },
  );

  it('localizes the Moventiv close-lock information in every language', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      const alert = productPageTextFor(language, 'moventiv-60')
        .moventivCloseLockAlert;

      expect(alert.title).toBeTruthy();
      expect(alert.message).toBeTruthy();
      expect(alert.ok).toBeTruthy();
    }
    expect(productPageTextFor('en', 'moventiv-60')
      .moventivCloseLockAlert.message).toContain('not be able to open');
    expect(productPageTextFor('de', 'moventiv-60')
      .moventivCloseLockAlert.message).toContain('nicht mehr ge\u00f6ffnet');
    expect(productPageTextFor('pl', 'moventiv-60')
      .moventivCloseLockAlert.message).toContain('Nie b\u0119dzie mo\u017cna');
  });

  it('uses family labels for Garline while keeping its product name', () => {
    const moventiv = productPageTextFor('fr', 'moventiv-60');
    const garline = productPageTextFor('fr', 'garline');

    expect(garline.sections.expertSettings)
      .toBe(moventiv.sections.expertSettings);
    expect(garline.user.staticLight).toBe(moventiv.user.staticLight);
    expect(garline.nameRoomControls.nameLabel).toContain('GARLINE');
    expect(moventiv.nameRoomControls.nameLabel).toContain('MOVENTIV');
    expect(garline.expertAccess.expertTitle)
      .toBe(moventiv.expertAccess.expertTitle);
    expect(garline.information.currentWeightProfile)
      .toBe(moventiv.information.currentWeightProfile);
  });

  it('formats Moventiv switch states with the Phase 1 business labels', () => {
    expect(moventivMotorStateLabelFor('fr', 'push-and-go', false))
      .toBe('Désactivé');
    expect(moventivMotorStateLabelFor('fr', 'automatic-manual', false))
      .toBe('Automatique');
    expect(moventivMotorStateLabelFor('fr', 'direction', false))
      .toBe('opposé sortie câbles');
    expect(moventivMotorStateLabelFor('fr', 'pairing', false))
      .toBe('Appairage');
  });
});
