import { Component } from '@angular/core';
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
  IonToolbar,
} from '@ionic/angular/standalone';

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
}
