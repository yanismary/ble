import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IonPopover } from '@ionic/angular/standalone';

import { storeManualAppLanguage } from '../../core/services/app-language';
import { AppMainMenuComponent } from './app-main-menu.component';
import { appMainMenuItemsFor } from './app-main-menu.model';

describe('AppMainMenuComponent', () => {
  let fixture: ComponentFixture<AppMainMenuComponent>;
  let component: AppMainMenuComponent;
  let routerNavigate: jasmine.Spy;

  beforeEach(async () => {
    storeManualAppLanguage('fr');
    routerNavigate = jasmine.createSpy('navigate').and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [AppMainMenuComponent],
      providers: [
        { provide: Router, useValue: { navigate: routerNavigate } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppMainMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    storeManualAppLanguage('fr');
    localStorage.clear();
  });

  it('should expose the six Phase 1 entries in their exact order', () => {
    expect(component.items.map(({ label }) => label)).toEqual([
      "Configuration de l'application",
      'Aide',
      'À propos',
      'Qui sommes nous ?',
      'Contacts',
      'Mentions légales',
    ]);
    expect(component.items.map(({ route }) => route)).toEqual([
      ['/settings'],
      ['/help'],
      ['/app-info'],
      ['/company-info'],
      ['/contact'],
      ['/legal-notice'],
    ]);
  });

  it('should preserve the Phase 1 labels for every supported language', () => {
    expect(appMainMenuItemsFor('en').map(({ label }) => label)).toEqual([
      'App configuration', 'Help', 'About', 'Who are we ?', 'Contacts',
      'Legal notice',
    ]);
    expect(appMainMenuItemsFor('de').map(({ label }) => label)).toEqual([
      'App Einstellungen', 'Hilfe', 'Über uns', 'Wer sind wir?', 'Kontakt',
      'AGB',
    ]);
    expect(appMainMenuItemsFor('pl').map(({ label }) => label)).toEqual([
      'Konfiguracja aplikacji', 'Pomoc', 'O aplikacji', 'Kim jesteśmy?',
      'Kontakt', 'Informacje prawne',
    ]);
  });

  it('should update all entries immediately without recreating the menu', () => {
    expect(component.items[0].label).toBe("Configuration de l'application");

    storeManualAppLanguage('de');
    fixture.detectChanges();

    expect(component.items.map(({ label }) => label)).toEqual([
      'App Einstellungen', 'Hilfe', 'Über uns', 'Wer sind wir?', 'Kontakt',
      'AGB',
    ]);
  });

  it('should configure responsive Ionic event positioning', () => {
    const popover = fixture.nativeElement.querySelector(
      'ion-popover',
    ) as HTMLIonPopoverElement;

    expect(popover.reference).toBe('trigger');
    expect(popover.side).toBe('bottom');
    expect(popover.alignment).toBe('end');
  });

  it('should keep the dedicated Phase 1-sized menu button classes', () => {
    const button = fixture.nativeElement.querySelector(
      '.app-main-menu-button',
    ) as HTMLIonButtonElement;
    const icon = button.querySelector('.app-main-menu-icon');

    expect(button).not.toBeNull();
    expect(icon).not.toBeNull();
    expect(getComputedStyle(button).width).toBe('48px');
    expect(getComputedStyle(button).height).toBe('48px');
    expect(getComputedStyle(icon!).fontSize).toBe('26px');
  });

  it('should open from the ai-param click and dismiss without navigation',
    async () => {
      const button = fixture.nativeElement.querySelector(
        '.app-main-menu-button',
      ) as HTMLIonButtonElement;
      const popover = fixture.nativeElement.querySelector(
        'ion-popover',
      ) as HTMLIonPopoverElement;
      const present = spyOn(popoverProxy(component), 'present').and.callThrough();
      const didPresent = popoverDidPresent(popover);

      button.click();
      await didPresent;

      expect(component.menuOpen).toBeTrue();
      expect(present).toHaveBeenCalledOnceWith(jasmine.any(Event));

      await popover.dismiss();

      expect(component.menuOpen).toBeFalse();
      expect(routerNavigate).not.toHaveBeenCalled();
    },
  );

  it('should keep one presented popover after a double click', async () => {
    const button = fixture.nativeElement.querySelector(
      '.app-main-menu-button',
    ) as HTMLIonButtonElement;
    const popover = fixture.nativeElement.querySelector(
      'ion-popover',
    ) as HTMLIonPopoverElement;
    const present = spyOn(popoverProxy(component), 'present').and.callThrough();
    const didPresent = popoverDidPresent(popover);

    button.click();
    button.click();
    await didPresent;

    expect(component.menuOpen).toBeTrue();
    expect(present).toHaveBeenCalledTimes(1);

    await popover.dismiss();
  });

  it('should keep every Phase 1 menu label aligned to the start',
    async () => {
      const button = fixture.nativeElement.querySelector(
        '.app-main-menu-button',
      ) as HTMLIonButtonElement;
      const popover = fixture.nativeElement.querySelector(
        'ion-popover',
      ) as HTMLIonPopoverElement;
      const didPresent = popoverDidPresent(popover);

      button.click();
      await didPresent;
      await fixture.whenStable();

      const labels = Array.from(
        document.querySelectorAll<HTMLElement>('.app-main-menu-list ion-label'),
      );
      expect(labels).toHaveSize(6);
      expect(labels.every((label) =>
        ['start', 'left'].includes(getComputedStyle(label).textAlign)))
        .toBeTrue();

      await popover.dismiss();
    },
  );

  it('should dismiss before navigating once to the selected destination',
    async () => {
      const order: string[] = [];
      const dismiss = jasmine.createSpy('dismiss').and.callFake(async () => {
        order.push('dismiss');
        return true;
      });
      (component as unknown as {
        popover: { dismiss: () => Promise<boolean> };
      }).popover = { dismiss };
      routerNavigate.and.callFake(async () => {
        order.push('navigate');
        return true;
      });

      await component.select(component.items[4]);

      expect(dismiss).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledOnceWith(['/contact']);
      expect(order).toEqual(['dismiss', 'navigate']);
      expect(component.menuOpen).toBeFalse();
    },
  );

  it('should prevent concurrent selections from navigating twice',
    async () => {
      let releaseNavigation!: (value: boolean) => void;
      const pendingNavigation = new Promise<boolean>((resolve) => {
        releaseNavigation = resolve;
      });
      (component as unknown as {
        popover: { dismiss: () => Promise<boolean> };
      }).popover = { dismiss: async () => true };
      routerNavigate.and.returnValue(pendingNavigation);

      const firstSelection = component.select(component.items[1]);
      await Promise.resolve();
      await component.select(component.items[2]);

      expect(routerNavigate).toHaveBeenCalledOnceWith(['/help']);
      releaseNavigation(true);
      await firstSelection;
    },
  );
});

function popoverDidPresent(popover: HTMLIonPopoverElement): Promise<void> {
  return new Promise((resolve) => {
    popover.addEventListener('ionPopoverDidPresent', () => resolve(), {
      once: true,
    });
  });
}

function popoverProxy(component: AppMainMenuComponent): IonPopover {
  return (component as unknown as { popover: IonPopover }).popover;
}
