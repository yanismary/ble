import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { storeManualAppLanguage } from '../../core/services/app-language';
import { AppInfoPage } from './app-info.page';

describe('AppInfoPage', () => {
  let fixture: ComponentFixture<AppInfoPage>;
  let component: AppInfoPage;

  beforeEach(async () => {
    storeManualAppLanguage('fr');
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

  it('renders only the Phase 1 About content', () => {
    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';

    expect(element.querySelector('ion-toolbar.main-menu-destination-navbar'))
      .toBeTruthy();
    expect(element.querySelector('ion-back-button[defaultHref="/help"]'))
      .toBeTruthy();
    expect(element.querySelector('.app-version-number')?.textContent)
      .toContain(component.appVersion);
    expect(text).toContain(component.copy.aboutContentTitle);
    expect(text).toContain(component.copy.versionLabel);
    expect(text).toContain(component.copy.lastModification);
    expect(text).toContain(component.copy.lastModificationText);
    expect(text).not.toContain(component.copy.contactTitle);
    expect(text).not.toContain(component.copy.supportEmail);
    expect(element.querySelector('.legacy-contact-list')).toBeNull();
    expect(element.querySelector('.info-links')).toBeNull();
  });
});
