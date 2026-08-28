import { Component } from '@angular/core';
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
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { call, location, mail } from 'ionicons/icons';

import { currentAppLanguage } from '../../core/services/app-language';
import { appInfoCopyFor } from '../app-info/app-info.model';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.page.html',
  styleUrls: ['../app-info/app-info.page.scss'],
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
    IonTitle,
    IonToolbar,
  ],
})
export class ContactPage {
  get copy() {
    return appInfoCopyFor(currentAppLanguage());
  }

  constructor() {
    addIcons({ call, location, mail });
  }
}
