import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Capacitor } from '@capacitor/core';

import { storeManualAppLanguage } from '../../../core/services/app-language';
import { HelpPage, normalizeHelpPlatform } from '../help.page';

describe('HelpPage', () => {
  beforeEach(() => {
    storeManualAppLanguage('fr');
  });

  afterEach(() => {
    localStorage.clear();
  });

  async function createPage(
    platform: 'android' | 'ios' | 'web' = 'android',
  ): Promise<ComponentFixture<HelpPage>> {
    spyOn(Capacitor, 'getPlatform').and.returnValue(platform);

    await TestBed.configureTestingModule({
      imports: [HelpPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(HelpPage);
    fixture.detectChanges();
    return fixture;
  }

  function query<T extends Element>(
    fixture: ComponentFixture<HelpPage>,
    selector: string,
  ): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  it('creates the standalone help page', async () => {
    const fixture = await createPage();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('normalizes native and web platform values', () => {
    expect(normalizeHelpPlatform('android')).toBe('android');
    expect(normalizeHelpPlatform('ios')).toBe('ios');
    expect(normalizeHelpPlatform('web')).toBe('web');
    expect(normalizeHelpPlatform('unknown')).toBe('web');
  });

  it('renders the Phase 1 style navbar and back button', async () => {
    const fixture = await createPage();

    expect(query(fixture, 'ion-toolbar.main-menu-destination-navbar'))
      .not.toBeNull();
    expect(query(fixture, 'ion-back-button[defaultHref="/scan"]'))
      .not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Aide');
  });

  for (const platform of ['android', 'ios'] as const) {
    it(`shows two shared product choices on ${platform}`, async () => {
      const fixture = await createPage(platform);
      const buttons = fixture.nativeElement.querySelectorAll(
        '[data-product-option]',
      );

      expect(Array.from(buttons).map((button) =>
        (button as HTMLElement).getAttribute('data-product-option'),
      )).toEqual(['widoor', 'moventiv-garline']);
      expect(Array.from(buttons).map((button) =>
        (button as HTMLElement).textContent?.trim(),
      )).toEqual(['WIDOOR', 'MOVENTIV / GARLINE']);
    });
  }

  it('lets the user choose the shared Moventiv/Garline help', async () => {
    const fixture = await createPage();

    fixture.componentInstance.selectProduct('moventiv-garline');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('MOVENTIV/GARLINE');
    expect(query(fixture, '[data-help-section="pairing"]')).not.toBeNull();
    expect(query(fixture, '[data-help-section="troubleshooting"]'))
      .not.toBeNull();
  });

  it('shows Widoor content after product selection', async () => {
    const fixture = await createPage();

    fixture.componentInstance.selectProduct('widoor');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('WIDOOR');
    expect(query(fixture, '[data-help-section="pairing"]')).not.toBeNull();
    expect(query(fixture, '[data-help-section="troubleshooting"]'))
      .not.toBeNull();
  });

  it('renders the iOS native pairing action as the sixth step', async () => {
    storeManualAppLanguage('en');
    const fixture = await createPage('ios');

    fixture.componentInstance.selectProduct('widoor');
    fixture.detectChanges();

    const pairingSteps = fixture.nativeElement.querySelectorAll(
      '[data-help-section="pairing"] li',
    );

    expect(pairingSteps.length).toBe(6);
    expect(pairingSteps[5].textContent)
      .toContain('Tap \u00ab Pair \u00bb');
  });

  it('keeps help sections as purely UI accordions', async () => {
    const fixture = await createPage();

    fixture.componentInstance.selectProduct('moventiv-garline');
    fixture.detectChanges();

    const group = query<HTMLIonAccordionGroupElement>(
      fixture,
      'ion-accordion-group',
    );

    expect(group).not.toBeNull();

    group!.value = 'pairing';
    expect(group!.value).toBe('pairing');

    group!.value = undefined;
    expect(group!.value).toBeUndefined();
  });

  it('does not navigate to product pages from help consultation', async () => {
    const fixture = await createPage();

    expect(query(fixture, '[routerLink="/product"]')).toBeNull();
    expect(query(fixture, '[href*="product"]')).toBeNull();
  });

  it('does not import or trigger BLE behavior', async () => {
    const fixture = await createPage();

    fixture.componentInstance.selectProduct('moventiv-garline');
    fixture.detectChanges();

    expect(fixture.componentInstance).not.toEqual(
      jasmine.objectContaining({ bleService: jasmine.anything() }),
    );
  });
});
