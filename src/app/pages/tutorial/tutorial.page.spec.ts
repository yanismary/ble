import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { GestureController } from '@ionic/angular/standalone';

import { TutorialPage } from './tutorial.page';
import { TUTORIAL_FRESH_SCAN_STATE_KEY } from './tutorial-navigation';

describe('TutorialPage', () => {
  let router: jasmine.SpyObj<Router>;
  let gestureOptions: {
    readonly direction?: string;
    readonly threshold?: number;
    readonly onStart?: () => void;
    readonly onMove?: (detail: {
      readonly deltaX: number;
      readonly deltaY: number;
    }) => void;
    readonly onEnd?: (detail: {
      readonly deltaX: number;
      readonly deltaY: number;
    }) => void;
  } | null;
  let gestureEnable: jasmine.Spy;
  let gestureDestroy: jasmine.Spy;

  async function createPage(
    platform: 'android' | 'ios' | 'web' = 'android',
  ): Promise<ComponentFixture<TutorialPage>> {
    spyOn(Capacitor, 'getPlatform').and.returnValue(platform);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    gestureOptions = null;
    gestureEnable = jasmine.createSpy('enable');
    gestureDestroy = jasmine.createSpy('destroy');

    await TestBed.configureTestingModule({
      imports: [TutorialPage],
      providers: [
        { provide: Router, useValue: router },
        {
          provide: GestureController,
          useValue: {
            create: (options: typeof gestureOptions) => {
              gestureOptions = options;
              return {
                enable: gestureEnable,
                destroy: gestureDestroy,
              };
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TutorialPage);
    fixture.detectChanges();
    return fixture;
  }

  function query<T extends Element>(
    fixture: ComponentFixture<TutorialPage>,
    selector: string,
  ): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  afterEach(() => {
    localStorage.clear();
  });

  it('starts with the Phase 1 product choice screen', async () => {
    const fixture = await createPage();

    expect(fixture.componentInstance.selectedProduct).toBeNull();
    expect(query(fixture, '[data-tutorial-product="widoor"]')).not.toBeNull();
    expect(query(fixture, '[data-tutorial-product="moventiv"]'))
      .not.toBeNull();
    expect(query(fixture, '[data-tutorial-product="garline"]')).not.toBeNull();
    const choices = Array.from(
      fixture.nativeElement.querySelectorAll('[data-tutorial-product]'),
      (element: Element) => element.getAttribute('data-tutorial-product'),
    );
    expect(choices).toEqual(['moventiv', 'garline', 'widoor']);
    const buttonBackground = (product: string) => {
      const button = query<HTMLElement>(
        fixture,
        `[data-tutorial-product="${product}"]`,
      ) as HTMLElement;
      return getComputedStyle(button).getPropertyValue('--background').trim();
    };
    expect(buttonBackground('widoor')).toBe('#488aff');
    expect(buttonBackground('moventiv')).toBe('#32db64');
    expect(buttonBackground('garline')).toBe('#a7c855');
  });

  it('selects Widoor and renders its first slide', async () => {
    const fixture = await createPage();

    fixture.componentInstance.selectProduct('widoor');
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedProduct).toBe('widoor');
    expect(fixture.componentInstance.slideIndex).toBe(0);
    expect(query<HTMLImageElement>(fixture, '.tutorial-image')?.src)
      .toContain('slide1_widoor.png');
    expect(getComputedStyle(
      query<HTMLImageElement>(fixture, '.tutorial-image') as HTMLImageElement,
    ).objectFit).toBe('contain');
    expect(gestureOptions?.direction).toBe('x');
    expect(gestureEnable).toHaveBeenCalled();
  });

  it('selects Moventiv and Garline tutorials independently', async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.selectProduct('moventiv');
    expect(component.copy.slides[0].image).toContain('slide1_moventiv.png');

    component.selectProduct('garline');
    expect(component.copy.slides[0].image).toContain('slide1_garline.png');
  });

  it('uses Android images on Android', async () => {
    localStorage.setItem('lang', 'fr');
    const fixture = await createPage('android');

    fixture.componentInstance.selectProduct('moventiv');
    fixture.componentInstance.handleSwipe(-100, 0);
    fixture.detectChanges();

    expect(fixture.componentInstance.currentSlide?.image)
      .toContain('slide2_android_fr_moventiv.jpg');
  });

  it('uses iOS images on iOS', async () => {
    localStorage.setItem('lang', 'en');
    const fixture = await createPage('ios');

    fixture.componentInstance.selectProduct('garline');
    fixture.componentInstance.handleSwipe(-100, 0);
    fixture.detectChanges();

    expect(fixture.componentInstance.currentSlide?.image)
      .toContain('slide2_ios_en_garline.PNG');
  });

  it('changes slides by horizontal swipe and updates the visual pager',
    async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.selectProduct('widoor');
    component.handleSwipe(-120, 5);
    fixture.detectChanges();

    expect(component.slideIndex).toBe(1);
    expect(query(fixture, '[data-pager-index="1"]')
      ?.classList.contains('tutorial-pager-dot-active')).toBeTrue();
    component.handleSwipe(120, 5);
    expect(component.slideIndex).toBe(0);
    component.handleSwipe(-20, 0);
    component.handleSwipe(-120, 150);
    expect(component.slideIndex).toBe(0);
  });

  it('moves the slide with the finger before selecting it on release',
    async () => {
      const fixture = await createPage();
      const component = fixture.componentInstance;

      component.selectProduct('widoor');
      fixture.detectChanges();
      gestureOptions?.onStart?.();
      gestureOptions?.onMove?.({ deltaX: -72, deltaY: 4 });
      fixture.detectChanges();

      const firstSlide = query<HTMLElement>(fixture, '.tutorial-slide');
      expect(component.slideIndex).toBe(0);
      expect(component.slideDragOffsetX).toBe(-72);
      expect(firstSlide?.classList.contains('tutorial-slide-dragging'))
        .toBeTrue();
      expect(firstSlide?.style.transform).toBe(
        'translate3d(calc(0% - 72px), 0px, 0px)',
      );

      gestureOptions?.onEnd?.({ deltaX: -72, deltaY: 4 });
      fixture.detectChanges();

      expect(component.slideIndex).toBe(1);
      expect(component.slideDragOffsetX).toBe(0);
      expect(firstSlide?.classList.contains('tutorial-slide-dragging'))
        .toBeFalse();
      expect(firstSlide?.style.transform).toContain('-100%');
    },
  );

  it('dampens dragging beyond the first and final pages', async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.selectProduct('moventiv');
    component.startSlideDrag();
    component.moveSlideDrag(80, 0);
    expect(component.slideDragOffsetX).toBe(20);

    component.slideIndex = component.totalPages - 1;
    component.startSlideDrag();
    component.moveSlideDrag(-80, 0);
    expect(component.slideDragOffsetX).toBe(-20);
  });

  it('keeps the pager indicative and removes Phase 2 navigation buttons',
    async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.selectProduct('widoor');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.tutorial-pager-dot'))
      .toHaveSize(9);
    expect(query(fixture, '.tutorial-pager button')).toBeNull();
    expect(query(fixture, '.tutorial-navigation')).toBeNull();
  });

  it('shows the final ready slide after the eight Phase 1 slides', async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.selectProduct('widoor');
    for (let index = 0; index < component.copy.slides.length; index += 1) {
      component.handleSwipe(-120, 0);
    }
    fixture.detectChanges();

    expect(component.isReadySlide).toBeTrue();
    expect(component.totalPages).toBe(9);
    expect(fixture.nativeElement.textContent).toContain(component.copy.readyTitle);
    expect(query(fixture, '.tutorial-skip-button')).not.toBeNull();
    expect(query(fixture, '.tutorial-continue-button')).not.toBeNull();
  });

  it('finishes through the Phase 2 router when Skip is used', async () => {
    const fixture = await createPage();

    await fixture.componentInstance.finish();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/scan'], {
      state: { [TUTORIAL_FRESH_SCAN_STATE_KEY]: true },
    });
  });

  it('continues to scan from the final slide', async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.selectProduct('garline');
    for (let index = 0; index < component.totalPages - 1; index += 1) {
      component.handleSwipe(-120, 0);
    }
    fixture.detectChanges();
    query<HTMLElement>(fixture, '.tutorial-continue-button')?.click();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/scan'], {
      state: { [TUTORIAL_FRESH_SCAN_STATE_KEY]: true },
    });
  });

  it('lets native Back return without invoking the finish navigation',
    async () => {
      const fixture = await createPage();
      fixture.componentInstance.selectProduct('moventiv');
      fixture.detectChanges();

      fixture.destroy();

      expect(router.navigate).not.toHaveBeenCalled();
      expect(gestureDestroy).toHaveBeenCalled();
    },
  );

  it('does not navigate to ProductPage or expose BLE behavior', async () => {
    const fixture = await createPage();

    fixture.componentInstance.selectProduct('moventiv');
    fixture.detectChanges();

    expect(query(fixture, '[routerLink="/product"]')).toBeNull();
    expect(query(fixture, '[href*="product"]')).toBeNull();
    expect(fixture.componentInstance).not.toEqual(
      jasmine.objectContaining({ bleService: jasmine.anything() }),
    );
  });
});
