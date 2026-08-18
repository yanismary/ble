import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterLink, provideRouter } from '@angular/router';

import { AppInfoPage } from './app-info.page';

describe('AppInfoPage', () => {
  let fixture: ComponentFixture<AppInfoPage>;
  let component: AppInfoPage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppInfoPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the standalone app information page', () => {
    expect(component).toBeTruthy();
  });

  it('uses a safe web fallback for the app version', () => {
    expect(component.appVersion).toBeTruthy();
  });

  it('renders the Phase 1 style Mantion navbar and contact list', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('ion-toolbar.mantion-navbar')).toBeTruthy();
    expect(element.querySelector('img[src="assets/img/logo_wimove.png"]'))
      .toBeTruthy();
    expect(element.textContent).toContain('appsupport@mantion-smt.fr');
    expect(component.copy.phoneHref).toBe('tel:+33380378571');
  });

  it('keeps the company and legal destinations on the existing routes', () => {
    const routes = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .map((debugElement) => debugElement.injector.get(RouterLink).href);

    expect(routes).toContain('/company-info');
    expect(routes).toContain('/legal-notice');
  });
});
