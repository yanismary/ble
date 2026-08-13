import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
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
  appInfoCopyFor,
  normalizeAppInfoLanguage,
} from './app-info.model';

@Component({
  selector: 'app-app-info',
  templateUrl: './app-info.page.html',
  styleUrls: ['./app-info.page.scss'],
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
    RouterLink,
  ],
})
export class AppInfoPage implements OnInit {
  readonly copy = appInfoCopyFor(
    normalizeAppInfoLanguage(localStorage.getItem('lang')),
  );

  appVersion = '—';

  async ngOnInit(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const info = await App.getInfo();
      this.appVersion = info.version || '—';
    } catch {
      this.appVersion = '—';
    }
  }
}
