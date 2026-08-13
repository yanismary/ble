import { Component } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import {
  legalNoticeCopyFor,
  normalizeLegalNoticeLanguage,
} from './legal-notice.model';

@Component({
  selector: 'app-legal-notice',
  templateUrl: './legal-notice.page.html',
  styleUrls: ['./legal-notice.page.scss'],
  standalone: true,
  imports: [
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
  ],
})
export class LegalNoticePage {
  readonly copy = legalNoticeCopyFor(
    normalizeLegalNoticeLanguage(localStorage.getItem('lang')),
  );
}
