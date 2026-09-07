import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { storeManualAppLanguage } from '../../core/services/app-language';
import { ContactPage } from './contact.page';

describe('ContactPage', () => {
  let fixture: ComponentFixture<ContactPage>;
  let component: ContactPage;

  beforeEach(async () => {
    storeManualAppLanguage('fr');
    await TestBed.configureTestingModule({
      imports: [ContactPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('lang');
  });

  it('should expose the dedicated Phase 1 contact destination', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('ion-title')?.textContent)
      .toContain(component.copy.contactTitle);
    expect(element.querySelector('ion-toolbar.main-menu-destination-navbar'))
      .not.toBeNull();
    expect(element.querySelector('img[src="assets/img/logo_wimove.png"]'))
      .not.toBeNull();
    expect(element.textContent).toContain(component.copy.supportEmail);
    expect(component.copy.phoneHref).toBe('tel:+33380378571');
    expect(element.textContent).not.toContain(component.copy.aboutContentTitle);
    const actions = Array.from(element.querySelectorAll('ion-item'))
      .map((item) => (item as HTMLIonItemElement).href)
      .filter((href): href is string => href !== undefined);
    expect(actions).toContain(component.copy.supportEmailHref);
    expect(actions).toContain(component.copy.phoneHref);
  });

  it('should return through navigation history without product cleanup actions',
    () => {
      const back = fixture.nativeElement.querySelector(
        'ion-back-button',
      ) as HTMLIonBackButtonElement;

      expect(back.defaultHref).toBe('/scan');
    },
  );
});
