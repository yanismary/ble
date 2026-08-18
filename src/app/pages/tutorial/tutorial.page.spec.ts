import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';

import { TutorialPage } from './tutorial.page';

describe('TutorialPage', () => {
  let router: jasmine.SpyObj<Router>;

  async function createPage(
    platform: 'android' | 'ios' | 'web' = 'android',
  ): Promise<ComponentFixture<TutorialPage>> {
    spyOn(Capacitor, 'getPlatform').and.returnValue(platform);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [TutorialPage],
      providers: [{ provide: Router, useValue: router }],
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
  });

  it('selects Widoor and renders its first slide', async () => {
    const fixture = await createPage();

    fixture.componentInstance.selectProduct('widoor');
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedProduct).toBe('widoor');
    expect(fixture.componentInstance.slideIndex).toBe(0);
    expect(query<HTMLImageElement>(fixture, '.tutorial-image')?.src)
      .toContain('slide1_widoor.png');
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
    fixture.componentInstance.next();
    fixture.detectChanges();

    expect(fixture.componentInstance.currentSlide?.image)
      .toContain('slide2_android_fr_moventiv.jpg');
  });

  it('uses iOS images on iOS', async () => {
    localStorage.setItem('lang', 'en');
    const fixture = await createPage('ios');

    fixture.componentInstance.selectProduct('garline');
    fixture.componentInstance.next();
    fixture.detectChanges();

    expect(fixture.componentInstance.currentSlide?.image)
      .toContain('slide2_ios_en_garline.PNG');
  });

  it('updates the pager with the current slide index', async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.selectProduct('widoor');
    component.goToSlide(3);
    fixture.detectChanges();

    expect(component.slideIndex).toBe(3);
    expect(query(fixture, '[data-pager-index="3"]')
      ?.classList.contains('tutorial-pager-dot-active')).toBeTrue();
  });

  it('resets the index when changing product', async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.selectProduct('widoor');
    component.goToSlide(4);
    component.selectProduct('moventiv');

    expect(component.slideIndex).toBe(0);
    expect(component.selectedProduct).toBe('moventiv');
  });

  it('shows the final ready slide after the eight Phase 1 slides', async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.selectProduct('widoor');
    component.goToSlide(component.copy.slides.length);
    fixture.detectChanges();

    expect(component.isReadySlide).toBeTrue();
    expect(component.totalPages).toBe(9);
    expect(fixture.nativeElement.textContent).toContain(component.copy.readyTitle);
  });

  it('finishes through the Phase 2 router when Skip is used', async () => {
    const fixture = await createPage();

    await fixture.componentInstance.finish();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/scan']);
  });

  it('continues to scan from the final slide', async () => {
    const fixture = await createPage();
    const component = fixture.componentInstance;

    component.selectProduct('garline');
    component.goToSlide(component.totalPages - 1);
    component.next();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/scan']);
  });

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
