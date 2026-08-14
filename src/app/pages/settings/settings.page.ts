import { Component } from '@angular/core';
import { Haptics } from '@capacitor/haptics';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';

import {
  readHapticFeedback,
  readShowBleIdentifier,
  readShowProductInformation,
  readShowProductSettings,
  storeHapticFeedback,
  storeShowBleIdentifier,
  storeShowProductInformation,
  storeShowProductSettings,
} from '../../core/services/app-preferences';
import {
  APP_LANGUAGES,
  AppLanguage,
  AppLanguageMode,
  readAppLanguageMode,
  readStoredAppLanguage,
  storeAutomaticAppLanguage,
  storeManualAppLanguage,
} from '../../core/services/app-language';

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
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonTitle,
    IonToggle,
    IonToolbar,
  ],
})
export class SettingsPage {
  readonly languageOptions: readonly LanguageOption[] = Object.freeze([
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
    { code: 'pl', label: 'Polski' },
  ]);

  language: AppLanguage = readStoredAppLanguage();
  mode: AppLanguageMode = readAppLanguageMode();
  showBleIdentifier = readShowBleIdentifier();
  hapticFeedback = readHapticFeedback();
  showProductSettings = readShowProductSettings();
  showProductInformation = readShowProductInformation();
  statusMessage: string | null = null;

  constructor() {
    if (this.languageOptions.length !== APP_LANGUAGES.length) {
      throw new Error('Language option catalogue is incomplete.');
    }
  }

  selectLanguage(language: AppLanguage): void {
    this.language = storeManualAppLanguage(language);
    this.mode = 'manual';
    this.statusMessage =
      'Langue enregistrée. Elle sera utilisée à la prochaine ouverture des écrans.';
  }

  usePhoneLanguage(): void {
    this.language = storeAutomaticAppLanguage(navigator.language);
    this.mode = 'automatic';
    this.statusMessage =
      'Langue du téléphone enregistrée : ' + this.language.toUpperCase() + '.';
  }

  isSelected(language: AppLanguage): boolean {
    return this.language === language;
  }

  setShowBleIdentifier(event: CustomEvent<{ checked: boolean }>): void {
    this.showBleIdentifier = storeShowBleIdentifier(event.detail.checked);
    this.statusMessage = this.showBleIdentifier
      ? 'Identifiant BLE affiché sur la page de scan.'
      : 'Identifiant BLE masqué sur la page de scan.';
  }

  setShowProductSettings(event: CustomEvent<{ checked: boolean }>): void {
    this.showProductSettings =
      storeShowProductSettings(event.detail.checked);
    this.statusMessage = this.showProductSettings
      ? 'Réglages produit affichés.'
      : 'Réglages produit masqués.';
  }

  setShowProductInformation(
    event: CustomEvent<{ checked: boolean }>,
  ): void {
    this.showProductInformation =
      storeShowProductInformation(event.detail.checked);
    this.statusMessage = this.showProductInformation
      ? 'Informations produit affichées.'
      : 'Informations produit masquées.';
  }

  async setHapticFeedback(
    event: CustomEvent<{ checked: boolean }>,
  ): Promise<void> {
    this.hapticFeedback = storeHapticFeedback(event.detail.checked);
    this.statusMessage = this.hapticFeedback
      ? 'Vibrations activées.'
      : 'Vibrations désactivées.';

    if (!this.hapticFeedback) {
      return;
    }

    try {
      await Haptics.vibrate({ duration: 50 });
    } catch {
      // Preference remains valid when haptics are unavailable.
    }
  }
}
