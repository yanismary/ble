import { Component } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bluetooth, chatbubbles, list } from 'ionicons/icons';

import {
  readAutoEnableBluetooth,
  readHapticFeedback,
  readShowBleIdentifier,
  readShowProductInformation,
  readShowProductSettings,
  storeAutoEnableBluetooth,
  storeHapticFeedback,
  storeShowBleIdentifier,
  storeShowProductInformation,
  storeShowProductSettings,
} from '../../core/services/app-preferences';
import {
  triggerConfiguredHapticFeedback,
} from '../../core/services/app-haptics';
import {
  APP_LANGUAGES,
  AppLanguage,
  AppLanguageMode,
  currentAppLanguage,
  readAppLanguageMode,
  readStoredManualAppLanguage,
  storeAutomaticAppLanguage,
  storeManualAppLanguage,
  storeManualAppLanguageMode,
} from '../../core/services/app-language';
import {
  SettingsPageText,
  settingsPageTextFor,
} from './settings-page.text';

interface LanguageOption {
  readonly code: AppLanguage;
  readonly label: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToggle,
    IonToolbar,
  ],
})
export class SettingsPage {
  readonly languageOptions: readonly LanguageOption[] = Object.freeze([
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Fran\u00e7ais' },
    { code: 'pl', label: 'Polski' },
  ]);

  mode: AppLanguageMode = readAppLanguageMode();
  manualLanguage: AppLanguage | null = readStoredManualAppLanguage();
  readonly isAndroid = Capacitor.getPlatform() === 'android';
  autoEnableBluetooth = readAutoEnableBluetooth();
  showBleIdentifier = readShowBleIdentifier();
  hapticFeedback = readHapticFeedback();
  showProductSettings = readShowProductSettings();
  showProductInformation = readShowProductInformation();
  statusMessage: string | null = null;

  constructor() {
    addIcons({ bluetooth, chatbubbles, list });

    if (this.languageOptions.length !== APP_LANGUAGES.length) {
      throw new Error('Language option catalogue is incomplete.');
    }
  }

  get language(): AppLanguage {
    return currentAppLanguage();
  }

  get text(): SettingsPageText {
    return settingsPageTextFor(this.language);
  }

  get bleIdentifierLabel(): string {
    return this.isAndroid
      ? this.text.scan.showBleIdentifierAndroid
      : this.text.scan.showBleIdentifierIos;
  }

  selectLanguage(language: AppLanguage): void {
    this.manualLanguage = storeManualAppLanguage(language);
    this.mode = 'manual';
    this.statusMessage = this.text.status.manualLanguage;
  }

  usePhoneLanguage(): void {
    storeAutomaticAppLanguage(navigator.language);
    this.mode = 'automatic';
    this.statusMessage =
      this.text.status.automaticLanguage(this.language.toUpperCase());
  }

  setAutomaticLanguage(
    event: CustomEvent<{ checked: boolean }>,
  ): void {
    if (event.detail.checked) {
      this.usePhoneLanguage();
      return;
    }

    storeManualAppLanguageMode();
    this.mode = 'manual';
    this.statusMessage = this.text.status.manualLanguage;
  }

  isSelected(language: AppLanguage): boolean {
    return this.language === language;
  }

  setAutoEnableBluetooth(
    event: CustomEvent<{ checked: boolean }>,
  ): void {
    this.autoEnableBluetooth =
      storeAutoEnableBluetooth(event.detail.checked);
    this.statusMessage = this.autoEnableBluetooth
      ? this.text.status.enableBluetooth
      : this.text.status.disableBluetooth;
  }

  setShowBleIdentifier(event: CustomEvent<{ checked: boolean }>): void {
    this.showBleIdentifier = storeShowBleIdentifier(event.detail.checked);
    this.statusMessage = this.showBleIdentifier
      ? this.text.status.showBleIdentifier
      : this.text.status.hideBleIdentifier;
  }

  setShowProductSettings(event: CustomEvent<{ checked: boolean }>): void {
    this.showProductSettings =
      storeShowProductSettings(event.detail.checked);
    this.statusMessage = this.showProductSettings
      ? this.text.status.showSettings
      : this.text.status.hideSettings;
  }

  setShowProductInformation(
    event: CustomEvent<{ checked: boolean }>,
  ): void {
    this.showProductInformation =
      storeShowProductInformation(event.detail.checked);
    this.statusMessage = this.showProductInformation
      ? this.text.status.showInformation
      : this.text.status.hideInformation;
  }

  async setHapticFeedback(
    event: CustomEvent<{ checked: boolean }>,
  ): Promise<void> {
    this.hapticFeedback = storeHapticFeedback(event.detail.checked);
    this.statusMessage = this.hapticFeedback
      ? this.text.status.enableHaptics
      : this.text.status.disableHaptics;

    if (!this.hapticFeedback) {
      return;
    }

    await triggerConfiguredHapticFeedback();
  }
}
