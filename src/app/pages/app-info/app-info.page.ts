import { Component, OnInit } from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import {
  IonBackButton,
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
  appInfoCopyFor,
} from './app-info.model';
import { currentAppLanguage } from '../../core/services/app-language';

export function displayAppVersion(version: string): string {
  return version ? `V${version.replace(/-dev$/, '')}` : '—';
}

@Component({
  selector: 'app-app-info',
  templateUrl: './app-info.page.html',
  styleUrls: ['./app-info.page.scss'],
  standalone: true,
  imports: [
    IonBackButton,
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
export class AppInfoPage implements OnInit {
  get copy() {
    return appInfoCopyFor(currentAppLanguage());
  }

  appVersion = '—';

  async ngOnInit(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const info = await App.getInfo();
      this.appVersion = displayAppVersion(info.version);
    } catch {
      this.appVersion = '—';
    }
  }
}
