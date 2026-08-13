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
  companyInfoCopyFor,
  normalizeCompanyInfoLanguage,
} from './company-info.model';

@Component({
  selector: 'app-company-info',
  templateUrl: './company-info.page.html',
  styleUrls: ['./company-info.page.scss'],
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
export class CompanyInfoPage {
  readonly copy = companyInfoCopyFor(
    normalizeCompanyInfoLanguage(localStorage.getItem('lang')),
  );
}
