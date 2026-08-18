import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import {
  IonButton,
  IonContent,
} from '@ionic/angular/standalone';

import {
  TutorialProduct,
  normalizeTutorialLanguage,
  normalizeTutorialPlatform,
  tutorialCopyFor,
} from './tutorial.model';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.page.html',
  styleUrls: ['./tutorial.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
  ],
})
export class TutorialPage {
  readonly language = normalizeTutorialLanguage(localStorage.getItem('lang'));
  readonly platform = normalizeTutorialPlatform(Capacitor.getPlatform());

  selectedProduct: TutorialProduct | null = null;
  slideIndex = 0;

  constructor(private readonly router: Router) {}

  get copy() {
    return tutorialCopyFor(
      this.selectedProduct ?? 'moventiv',
      this.language,
      this.platform,
    );
  }

  get currentSlide() {
    return this.selectedProduct && !this.isReadySlide
      ? this.copy.slides[this.slideIndex]
      : null;
  }

  get totalPages(): number {
    return this.selectedProduct ? this.copy.slides.length + 1 : 0;
  }

  get pageIndexes(): readonly number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index);
  }

  get isReadySlide(): boolean {
    return this.selectedProduct !== null &&
      this.slideIndex === this.copy.slides.length;
  }

  get isLastSlide(): boolean {
    return this.selectedProduct !== null &&
      this.slideIndex === this.totalPages - 1;
  }

  selectProduct(product: TutorialProduct): void {
    this.selectedProduct = product;
    this.slideIndex = 0;
  }

  previous(): void {
    if (this.slideIndex > 0) {
      this.slideIndex -= 1;
    }
  }

  next(): void {
    if (!this.selectedProduct) {
      return;
    }
    if (this.slideIndex < this.totalPages - 1) {
      this.slideIndex += 1;
      return;
    }
    void this.finish();
  }

  goToSlide(index: number): void {
    if (!this.selectedProduct || index < 0 || index >= this.totalPages) {
      return;
    }

    this.slideIndex = index;
  }

  async finish(): Promise<void> {
    await this.router.navigate(['/scan']);
  }
}
