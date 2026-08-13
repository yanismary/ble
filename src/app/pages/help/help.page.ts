import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import {
  HelpPlatform,
  helpInstructionsFor,
} from './help-page.text';

@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss'],
  standalone: true,
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    RouterLink,
  ],
})
export class HelpPage {
  readonly platform = normalizeHelpPlatform(Capacitor.getPlatform());
  readonly instructions = helpInstructionsFor(this.platform);
}

export function normalizeHelpPlatform(value: string): HelpPlatform {
  switch (value) {
    case 'android':
      return 'android';
    case 'ios':
      return 'ios';
    default:
      return 'web';
  }
}
