import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import {
  GestureController,
  IonButton,
  IonContent,
} from '@ionic/angular/standalone';

import {
  TutorialProduct,
  normalizeTutorialLanguage,
  normalizeTutorialPlatform,
  tutorialCopyFor,
} from './tutorial.model';
import { TUTORIAL_FRESH_SCAN_STATE_KEY } from './tutorial-navigation';

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
export class TutorialPage implements OnDestroy {
  private slideGesture: ReturnType<GestureController['create']> | null = null;
  readonly language = normalizeTutorialLanguage(localStorage.getItem('lang'));
  readonly platform = normalizeTutorialPlatform(Capacitor.getPlatform());

  selectedProduct: TutorialProduct | null = null;
  slideIndex = 0;

  constructor(
    private readonly gestureController: GestureController,
    private readonly ngZone: NgZone,
    private readonly router: Router,
  ) {}

  @ViewChild('slideSurface')
  set slideSurface(element: ElementRef<HTMLElement> | undefined) {
    this.slideGesture?.destroy();
    this.slideGesture = null;
    if (element === undefined) {
      return;
    }
    this.slideGesture = this.gestureController.create({
      el: element.nativeElement,
      gestureName: 'tutorial-slide-swipe',
      direction: 'x',
      threshold: 12,
      onEnd: ({ deltaX, deltaY }) => {
        this.ngZone.run(() => this.handleSwipe(deltaX, deltaY));
      },
    });
    this.slideGesture.enable();
  }

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

  selectProduct(product: TutorialProduct): void {
    this.selectedProduct = product;
    this.slideIndex = 0;
  }

  handleSwipe(deltaX: number, deltaY: number): void {
    if (this.selectedProduct === null ||
        Math.abs(deltaX) < 50 ||
        Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }
    if (deltaX < 0 && this.slideIndex < this.totalPages - 1) {
      this.slideIndex += 1;
      return;
    }
    if (deltaX > 0 && this.slideIndex > 0) {
      this.slideIndex -= 1;
    }
  }

  async finish(): Promise<void> {
    await this.router.navigate(['/scan'], {
      state: { [TUTORIAL_FRESH_SCAN_STATE_KEY]: true },
    });
  }

  ngOnDestroy(): void {
    this.slideGesture?.destroy();
    this.slideGesture = null;
  }
}
