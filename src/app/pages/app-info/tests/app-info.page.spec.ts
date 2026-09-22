import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { storeManualAppLanguage } from '../../../core/services/app-language';
import { AppInfoPage, displayAppVersion } from '../app-info.page';

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

  it('renders the Phase 2 About content without the old changelog', () => {
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
    expect(text).toContain(component.copy.description);
    expect(text).toContain(component.copy.phase2Description);
    expect(text).toContain(component.copy.compatibilityNotice);
    expect(text).toContain('WIDOOR');
    expect(text).toContain('MOVENTIV 60');
    expect(text).toContain('MOVENTIV 80');
    expect(text).toContain('GARLINE');
    expect(text).not.toContain('Dernières modifications');
    expect(text).not.toContain('Ajout d’un avertissement');
    expect(text).not.toContain(component.copy.contactTitle);
    expect(text).toContain(component.copy.supportEmail);
    expect(element.querySelector('.legacy-contact-list')).toBeNull();
    expect(element.querySelector('.info-links')).toBeNull();
  });

  it('renders the native marketing version as V2.1', () => {
    expect(displayAppVersion('2.1')).toBe('V2.1');
    expect(displayAppVersion('2.1-dev')).toBe('V2.1');
    component.appVersion = displayAppVersion('2.1-dev');
    fixture.detectChanges();

    expect(component.appVersion).toBe('V2.1');
    expect((fixture.nativeElement as HTMLElement)
      .querySelector('.app-version-number')?.textContent).toContain('V2.1');
  });
});
