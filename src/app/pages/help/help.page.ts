import { Component } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  IonAccordion,
  IonAccordionGroup,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { readStoredAppLanguage } from '../../core/services/app-language';
import {
  HelpPlatform,
  HelpProduct,
  HelpProductText,
  helpPageTextFor,
  helpProductTextFor,
} from './help-page.text';

@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss'],
  standalone: true,
  imports: [
    IonAccordion,
    IonAccordionGroup,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
  ],
})
export class HelpPage {
  readonly platform = normalizeHelpPlatform(Capacitor.getPlatform());
  readonly language = readStoredAppLanguage();
  readonly text = helpPageTextFor(this.language);
  readonly products: readonly HelpProduct[] = Object.freeze([
    'widoor',
    'moventiv',
    'garline',
  ]);

  selectedProduct: HelpProduct | null = null;

  get selectedProductText(): HelpProductText | null {
    if (this.selectedProduct === null) {
      return null;
    }

    return helpProductTextFor(
      this.language,
      this.platform,
      this.selectedProduct,
    );
  }

  selectProduct(product: HelpProduct): void {
    this.selectedProduct = product;
  }

  isProductSelected(product: HelpProduct): boolean {
    return this.selectedProduct === product;
  }
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
