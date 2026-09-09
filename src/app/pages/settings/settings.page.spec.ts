import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';

import {
  APP_LANGUAGE_MODE_STORAGE_KEY,
  APP_LANGUAGE_STORAGE_KEY,
  currentAppLanguage,
  storeManualAppLanguage,
} from '../../core/services/app-language';
import {
  AUTO_ENABLE_BLUETOOTH_STORAGE_KEY,
  HAPTIC_FEEDBACK_STORAGE_KEY,
  SHOW_BLE_IDENTIFIER_STORAGE_KEY,
  SHOW_PRODUCT_INFORMATION_STORAGE_KEY,
  SHOW_PRODUCT_SETTINGS_STORAGE_KEY,
} from '../../core/services/app-preferences';
import { SettingsPage } from './settings.page';

describe('SettingsPage', () => {
  beforeEach(() => {
    storeManualAppLanguage('fr');
  });

  afterEach(() => {
    localStorage.clear();
  });

  async function createPage(
    platform: 'android' | 'ios' = 'android',
  ): Promise<ComponentFixture<SettingsPage>> {
    spyOn(Capacitor, 'getPlatform').and.returnValue(platform);

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    return fixture;
  }

  function change(checked: boolean): CustomEvent<{ checked: boolean }> {
    return new CustomEvent('ionChange', { detail: { checked } });
  }

  function query<T extends Element>(
    fixture: ComponentFixture<SettingsPage>,
    selector: string,
  ): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  it('renders the Phase 1 style settings navbar and compact lists', async () => {
    const fixture = await createPage();

    expect(query(fixture, 'ion-toolbar.main-menu-destination-navbar'))
      .not.toBeNull();
    expect(query(fixture, 'ion-back-button[defaultHref="/scan"]'))
      .not.toBeNull();
    expect(fixture.nativeElement.textContent)
      .toContain("Configuration de l'application");
    expect(fixture.nativeElement.querySelectorAll('ion-list').length)
      .toBe(4);
    expect(query(fixture, '.settings-row-icon.ai-change-name')).not.toBeNull();
    expect(query(fixture, '.settings-row-icon.ai-vibrate')).not.toBeNull();
  });

  it('shows the Phase 1 manual language order', async () => {
    const fixture = await createPage();
    const manualRow = query<HTMLElement>(
      fixture,
      '[data-setting-row="manual-language"]',
    );
    const select = manualRow?.querySelector('ion-select');
    const options = Array.from(
      fixture.nativeElement.querySelectorAll('ion-select-option'),
    ) as HTMLIonSelectOptionElement[];

    expect(manualRow?.querySelector('.settings-row-icon')).toBeNull();
    expect(select?.interface).toBe('alert');
    expect(select?.value).toBe('fr');
    expect(options.map((option) => option.value)).toEqual([
      'de',
      'en',
      'fr',
      'pl',
    ]);
  });

  it('stores manual language through the Phase 2 language mechanism', async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.selectLanguage('en');
    fixture.detectChanges();

    expect(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(localStorage.getItem(APP_LANGUAGE_MODE_STORAGE_KEY)).toBe('manual');
    expect(localStorage.getItem('StoredIsLanguageAuto')).toBe('false');
    expect(localStorage.getItem('appLanguage')).toBe('"manualLang_EN"');
    expect(currentAppLanguage()).toBe('en');
    expect(component.text.title).toBe('App configuration');
  });

  it('stores automatic language mode through the Phase 2 language mechanism', async () => {
    spyOnProperty(navigator, 'language').and.returnValue('de-DE');
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.setAutomaticLanguage(change(true));
    fixture.detectChanges();

    expect(localStorage.getItem(APP_LANGUAGE_MODE_STORAGE_KEY))
      .toBe('automatic');
    expect(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe('de');
    expect(localStorage.getItem('StoredIsLanguageAuto')).toBe('true');
    expect(component.mode).toBe('automatic');
    expect(component.language).toBe('de');
    expect(query(fixture, '[data-setting-row="manual-language"]')).toBeNull();
  });

  it('keeps the current language and previous manual choice when auto is disabled',
    async () => {
      storeManualAppLanguage('pl');
      spyOnProperty(navigator, 'language').and.returnValue('de-DE');
      const fixture = await createPage();
      const component = fixture.componentInstance;

      component.setAutomaticLanguage(change(true));
      component.setAutomaticLanguage(change(false));
      fixture.detectChanges();

      expect(component.language).toBe('de');
      expect(component.manualLanguage).toBe('pl');
      expect(component.mode).toBe('manual');
      expect(localStorage.getItem(APP_LANGUAGE_MODE_STORAGE_KEY)).toBe('manual');
      expect(localStorage.getItem('appLanguage')).toBe('"manualLang_PL"');
    });

  it('updates the existing scan MAC/UUID preference', async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.setShowBleIdentifier(change(false));

    expect(localStorage.getItem(SHOW_BLE_IDENTIFIER_STORAGE_KEY))
      .toBe('false');
    expect(component.showBleIdentifier).toBeFalse();
  });

  it('updates the existing product tab preferences', async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.setShowProductSettings(change(false));
    component.setShowProductInformation(change(false));

    expect(localStorage.getItem(SHOW_PRODUCT_SETTINGS_STORAGE_KEY))
      .toBe('false');
    expect(localStorage.getItem(SHOW_PRODUCT_INFORMATION_STORAGE_KEY))
      .toBe('false');
  });

  it('restores persisted product tab preferences on a new settings page',
    async () => {
      let fixture = await createPage();
      fixture.componentInstance.setShowProductSettings(change(false));
      fixture.componentInstance.setShowProductInformation(change(false));
      fixture.destroy();

      fixture = TestBed.createComponent(SettingsPage);
      fixture.detectChanges();

      expect(fixture.componentInstance.showProductSettings).toBeFalse();
      expect(fixture.componentInstance.showProductInformation).toBeFalse();
    });

  it('updates the existing haptics preference without BLE interaction', async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    await component.setHapticFeedback(change(false));

    expect(localStorage.getItem(HAPTIC_FEEDBACK_STORAGE_KEY)).toBe('false');
    expect(component.hapticFeedback).toBeFalse();
  });

  it('shows the Android Bluetooth preference and stores the existing key', async () => {
    const fixture = await createPage('android');
    const component = fixture.componentInstance;

    expect(query(fixture, '[data-setting-row="auto-bluetooth"]'))
      .not.toBeNull();
    expect(fixture.nativeElement.textContent)
      .toContain('Activation/d\u00e9sactivation automatique Bluetooth');

    component.setAutoEnableBluetooth(change(false));

    expect(localStorage.getItem(AUTO_ENABLE_BLUETOOTH_STORAGE_KEY))
      .toBe('false');
  });

  it('does not show the Android Bluetooth preference on iOS', async () => {
    const fixture = await createPage('ios');

    expect(query(fixture, '[data-setting-row="auto-bluetooth"]')).toBeNull();
  });

  const historicalSurfaces = [
    {
      language: 'fr',
      labels: [
        "Configuration de l'application",
        'Langage',
        'D\u00e9tection automatique de la langue',
        'S\u00e9lectionner votre langue',
        "Affichage de l'adresse MAC",
        'Affichage des onglets',
        'R\u00e9glages',
        'Informations',
        'Option',
        'Retour vibrations',
        'Activation/d\u00e9sactivation automatique Bluetooth',
      ],
    },
    {
      language: 'en',
      labels: [
        'App configuration',
        'Language',
        'Language auto-detection',
        'Select your langage',
        'Display of MAC address',
        'Display of the tab pages',
        'Tuning',
        'Informations',
        'Options',
        'Rumble feedback',
        'Enable/disable automatic Bluetooth switch',
      ],
    },
    {
      language: 'de',
      labels: [
        'App Einstellungen',
        'Sprache',
        'Sprache automatisch ausw\u00e4hlen',
        'Sprache ausw\u00e4hlen',
        'Anzeige der MAC Adresse',
        'Ansicht der Tabs',
        'Einstellungen',
        'Informationen',
        'Optionen',
        'Vibration',
        'Aktiviere/deaktiviere Bluetooth automatisch',
      ],
    },
    {
      language: 'pl',
      labels: [
        'Konfiguracja aplikacji',
        'J\u0119zyk',
        'Automatyczne wykrywanie j\u0119zyka',
        'Wybierz j\u0119zyk',
        'Wy\u015bwietlanie adresu MAC',
        'Wy\u015bwietlanie zak\u0142adek',
        'Ustawienia',
        'Informacje',
        'Opcje',
        'Wibracje',
        'W\u0142\u0105cz/wy\u0142\u0105cz automatyczne prze\u0142\u0105czanie Bluetooth',
      ],
    },
  ] as const;

  for (const surface of historicalSurfaces) {
    it(`renders the Phase 1 ${surface.language.toUpperCase()} surface`,
      async () => {
        storeManualAppLanguage(surface.language);
        const fixture = await createPage('android');
        const text = fixture.nativeElement.textContent as string;

        for (const label of surface.labels) {
          expect(text).withContext(label).toContain(label);
        }
      });
  }

  it('renders seven historical controls on Android', async () => {
    const fixture = await createPage('android');

    expect(fixture.nativeElement.querySelectorAll('ion-toggle').length).toBe(6);
    expect(fixture.nativeElement.querySelectorAll('ion-select').length).toBe(1);
  });

  it('renders six historical controls on iOS with UUID and no Bluetooth toggle',
    async () => {
      const fixture = await createPage('ios');
      const text = fixture.nativeElement.textContent as string;

      expect(fixture.nativeElement.querySelectorAll('ion-toggle').length).toBe(5);
      expect(fixture.nativeElement.querySelectorAll('ion-select').length).toBe(1);
      expect(text).toContain("Affichage de l'UUID");
      expect(text).not.toContain(
        'Activation/d\u00e9sactivation automatique Bluetooth',
      );
    });

  it('does not render Phase 2 automatic or confirmation status panels',
    async () => {
      const fixture = await createPage();
      const component = fixture.componentInstance;

      component.setShowProductSettings(change(false));
      fixture.detectChanges();

      expect(component.statusMessage).not.toBeNull();
      expect(query(fixture, '.settings-inline-status')).toBeNull();
      expect(query(fixture, '.settings-status')).toBeNull();
    });
});
