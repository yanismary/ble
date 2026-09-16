import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
  tick,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonContent,
  IonRouterOutlet,
  Platform,
} from '@ionic/angular/standalone';
import { Observable, Subject, Subscription } from 'rxjs';

import {
  BleDisconnectionEvent,
  BleGattCharacteristicProperties,
  BleNotificationEvent,
  BleService,
} from '../../core/services/ble';
import { BLE_UUIDS } from '../../core/services/ble-profile-catalog';
import {
  BleDatesAndCycles,
  BleDecodeFailure,
  BleDecodeSuccess,
  BleMaintenance,
  BleProfessionalParameters,
  BleUserParameters,
  BleVersionFrame,
} from '../../core/services/ble-read-decoders';
import {
  BleReadStatus,
  BleReadError,
  BleReadType,
  BleTypedReadResult,
} from '../../core/services/ble-read.service';
import {
  KnownProductProfile,
  ProductDataLoadResult,
  ProductDataLoadService,
  ProductDataLoadStatus,
} from '../../core/services/product-data-load.service';
import {
  MaintenanceAccessContext,
  MaintenanceAccessService,
} from '../../core/services/maintenance-access.service';
import {
  ExpertAccessContext,
  ExpertAccessService,
} from
  '../../core/services/expert-access.service';
import { ProductDetection } from '../../core/services/product-detection';
import {
  BleWriteExecutionService,
  LegacyBleWriteExecutionResult,
  LegacyBleWriteRequest,
} from '../../core/services/ble-write-execution.service';
import {
  ROOM_ASSIGNMENTS_STORAGE_KEY,
  readRoomCacheEntry,
} from '../../core/services/app-room-cache';
import { storeManualAppLanguage } from '../../core/services/app-language';
import {
  storeShowProductInformation,
  storeShowProductSettings,
} from '../../core/services/app-preferences';
import {
  ProductExitStateService,
} from '../../core/services/product-exit-state.service';
import {
  CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS,
  ConnectedProductInactivityService,
} from '../../core/services/connected-product-inactivity.service';
import {
  AppMainMenuComponent,
} from '../../shared/app-main-menu/app-main-menu.component';
import {
  ProductPage,
  formatProductTimestamp,
  isProductPageNavigationState,
} from './product.page';
import {
  MOTOR_COMMAND_UI_CONFIGS,
  WIDOOR_COMMAND_UI_CONFIGS,
} from './profiles/product-motor-command.registry';
import { PRODUCT_PAGE_CONFIG } from
  './profiles/product-page-config.facade';
import {
  moventivMotorStateLabelFor,
  productPageTextFor,
} from './shared/localization/product-page-localization';
import { productUserSpeedConfigsFor } from
  './shared/settings/product-user-speed';
import { productUserTimingConfigsFor } from
  './shared/settings/product-user-timing';
import { productUserPeripheralConfigsFor } from
  './shared/settings/product-user-peripheral';
import { productExpertScalarConfigsFor } from
  './shared/expert/product-expert-scalar';
import {
  ProductPageNavigationState,
  ProductReadViewState,
} from './shared/models/product-view.model';
import {
  ProductDemoProfile,
  createProductDemoNavigationState,
} from './shared/demo/product-demo';

class FakeBleService {
  private readonly disconnectionSubject =
    new Subject<BleDisconnectionEvent>();
  private readonly notificationSubject = new Subject<BleNotificationEvent>();
  connectedDeviceId: string | null = 'device-1';
  connectionGeneration = 4;
  disconnectingDeviceId: string | null = null;
  isWriting = false;
  readonly writeCharacteristic = jasmine.createSpy('writeCharacteristic');
  readonly getGattCharacteristicProperties = jasmine.createSpy(
    'getGattCharacteristicProperties',
  ).and.returnValue(writableGattProperties());
  readonly waitForNotificationStart = jasmine.createSpy(
    'waitForNotificationStart',
  ).and.resolveTo();

  readonly disconnections$: Observable<BleDisconnectionEvent> =
    this.disconnectionSubject.asObservable();
  readonly notifications$: Observable<BleNotificationEvent> =
    this.notificationSubject.asObservable();

  async disconnect(): Promise<void> {
    const deviceId = this.connectedDeviceId;
    this.connectedDeviceId = null;
    this.connectionGeneration += 1;
    if (deviceId !== null) {
      this.disconnectionSubject.next({ deviceId, reason: 'remote' });
    }
  }

  emitMotorState(bytes: readonly number[]): void {
    const array = Uint8Array.from(bytes);
    this.notificationSubject.next({
      deviceId: 'device-1',
      serviceUuid: BLE_UUIDS.shdoService,
      characteristicUuid: BLE_UUIDS.motorStateCharacteristic,
      value: new DataView(array.buffer),
      sequence: 1,
      receivedAt: 20,
    });
  }
}

class FakeBackButton {
  private handler: (() => Promise<unknown> | void) | null = null;
  readonly subscribeWithPriority = jasmine.createSpy('subscribeWithPriority')
    .and.callFake((
      _priority: number,
      handler: () => Promise<unknown> | void,
    ): Subscription => {
      this.handler = handler;
      return new Subscription(() => {
        if (this.handler === handler) {
          this.handler = null;
        }
      });
    });

  async trigger(): Promise<void> {
    await this.handler?.();
  }
}

class FakePlatform {
  readonly backButton = new FakeBackButton();
}

class FakeBleWriteExecutionService {
  isExecuting = false;
  nextResult = openExecutionResult('success', 'confirmed');
  nextResults: LegacyBleWriteExecutionResult[] = [];
  readonly execute = jasmine.createSpy('execute')
    .and.callFake(async (_request: LegacyBleWriteRequest) =>
      this.nextResults.shift() ?? this.nextResult,
    );
}

class FakeProductDataLoadService {
  isLoading = false;
  nextResult = completeLoadResult('success');
  readonly loadProductData = jasmine.createSpy('loadProductData')
    .and.callFake(async () => this.nextResult);
  readonly cancelCurrentLoad = jasmine.createSpy('cancelCurrentLoad')
    .and.returnValue(true);
}

const PRODUCT_PAGE_EXPERT_ACCESS_TEST_CODE =
  'accepted-expert-access-code';

class FakeExpertAccessService {
  private authenticatedContext: ExpertAccessContext | null = null;

  isAuthenticated(context: ExpertAccessContext | null): boolean {
    return context !== null &&
      this.authenticatedContext !== null &&
      this.sameContext(this.authenticatedContext, context);
  }

  authenticate(
    context: ExpertAccessContext,
    accessCode: string,
  ): boolean {
    if (accessCode !== PRODUCT_PAGE_EXPERT_ACCESS_TEST_CODE) {
      return false;
    }
    this.authenticatedContext = Object.freeze({ ...context });
    return true;
  }

  reset(context?: ExpertAccessContext): void {
    if (context === undefined ||
        (this.authenticatedContext !== null &&
          this.sameContext(this.authenticatedContext, context))) {
      this.authenticatedContext = null;
    }
  }

  private sameContext(
    first: ExpertAccessContext,
    second: ExpertAccessContext,
  ): boolean {
    return first.profile === second.profile &&
      first.deviceId === second.deviceId &&
      first.connectionGeneration === second.connectionGeneration;
  }
}

const PRODUCT_PAGE_MAINTENANCE_ACCESS_TEST_CODE =
  'accepted-maintenance-access-code';

class FakeMaintenanceAccessService {
  private authenticatedContext: MaintenanceAccessContext | null = null;
  readonly authenticate = jasmine.createSpy('authenticate')
    .and.callFake((
      context: MaintenanceAccessContext,
      accessCode: string,
    ): boolean => {
      if (accessCode !== PRODUCT_PAGE_MAINTENANCE_ACCESS_TEST_CODE) {
        return false;
      }
      this.authenticatedContext = Object.freeze({ ...context });
      return true;
    });
  readonly reset = jasmine.createSpy('reset')
    .and.callFake((context?: MaintenanceAccessContext): void => {
      if (context === undefined ||
          (this.authenticatedContext !== null &&
            this.sameContext(this.authenticatedContext, context))) {
        this.authenticatedContext = null;
      }
    });

  isAuthenticated(context: MaintenanceAccessContext | null): boolean {
    return context !== null &&
      this.authenticatedContext !== null &&
      this.sameContext(this.authenticatedContext, context);
  }

  private sameContext(
    first: MaintenanceAccessContext,
    second: MaintenanceAccessContext,
  ): boolean {
    return first.profile === second.profile &&
      first.deviceId === second.deviceId &&
      first.connectionGeneration === second.connectionGeneration;
  }
}

describe('ProductPage', () => {
  let component: ProductPage;
  let fixture: ComponentFixture<ProductPage>;
  let bleService: FakeBleService;
  let loadService: FakeProductDataLoadService;
  let writeExecutionService: FakeBleWriteExecutionService;
  let alertRole: string | undefined;
  let alertCreate: jasmine.Spy;
  let alertGetTop: jasmine.Spy;
  let topAlertDismiss: jasmine.Spy;
  let alertOptions: Record<string, unknown>[];
  let delaySpy: jasmine.Spy;
  let routerNavigate: jasmine.Spy;
  let routerNavigationState: ProductPageNavigationState;
  let platform: FakePlatform;
  let routerOutlet: { swipeGesture: boolean };
  let productExitState: ProductExitStateService;

  beforeEach(async () => {
    localStorage.removeItem(ROOM_ASSIGNMENTS_STORAGE_KEY);
    storeManualAppLanguage('fr');
    storeShowProductSettings(true);
    storeShowProductInformation(true);
    bleService = new FakeBleService();
    loadService = new FakeProductDataLoadService();
    writeExecutionService = new FakeBleWriteExecutionService();
    alertRole = 'cancel';
    alertOptions = [];
    alertCreate = jasmine.createSpy('create').and.callFake(
      async (options: Record<string, unknown>) => {
        alertOptions.push(options);
        return {
          present: async () => undefined,
          onDidDismiss: async () => ({ role: alertRole }),
        };
      },
    );
    topAlertDismiss = jasmine.createSpy('dismiss').and.resolveTo(true);
    alertGetTop = jasmine.createSpy('getTop').and.resolveTo({
      dismiss: topAlertDismiss,
    });
    routerNavigate = jasmine.createSpy('navigate').and.resolveTo(true);
    routerNavigationState = navigationState('widoor');
    platform = new FakePlatform();
    routerOutlet = { swipeGesture: true };

    await TestBed.configureTestingModule({
      imports: [ProductPage],
      providers: [
        { provide: BleService, useValue: bleService },
        {
          provide: AlertController,
          useValue: { create: alertCreate, getTop: alertGetTop },
        },
        {
          provide: BleWriteExecutionService,
          useValue: writeExecutionService,
        },
        { provide: ProductDataLoadService, useValue: loadService },
        { provide: ProductDetection, useClass: ProductDetection },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { profile: 'widoor' } } },
        },
        {
          provide: Router,
          useValue: {
            getCurrentNavigation: () => ({
              extras: { state: routerNavigationState },
            }),
            navigate: routerNavigate,
          },
        },
        { provide: Platform, useValue: platform },
        { provide: IonRouterOutlet, useValue: routerOutlet },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductPage);
    component = fixture.componentInstance;
    delaySpy = spyOn<any>(component, 'delay').and.resolveTo();
    productExitState = TestBed.inject(ProductExitStateService);
    fixture.detectChanges();
  });

  it('should not load automatically and should keep explicit refresh internal',
    async () => {
      expect(loadService.loadProductData).not.toHaveBeenCalled();

      await component.refreshProductData();
      fixture.detectChanges();

      expect(loadService.loadProductData)
        .toHaveBeenCalledOnceWith('widoor', 'device-1', {});
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('ion-range.user-speed-range'))
        .not.toBeNull();
      expect(element.querySelector('ion-toggle.lock-mode-toggle'))
        .toBeNull();
    },
  );

  it('should show the Phase 1 product shell with commands selected by default',
    () => {
      const element = fixture.nativeElement as HTMLElement;
      const commandsSection = element.querySelector<HTMLElement>(
        '[aria-labelledby="commands-title"]',
      );
      const settingsSection = element.querySelector<HTMLElement>(
        '[aria-labelledby="settings-title"]',
      );
      const informationSection = element.querySelector<HTMLElement>(
        '[aria-labelledby="information-title"]',
      );

      expect(component.activeMainTab).toBe('commands');
      expect(component.activeSettingsTab).toBe('basic');
      expect(element.querySelector('ion-header.product-profile-widoor'))
        .not.toBeNull();
      expect(element.querySelector('ion-content.product-profile-widoor'))
        .not.toBeNull();
      expect(element.textContent).toContain(component.text.shell.controlledDoor);
      expect(commandsSection?.hidden).toBeFalse();
      expect(settingsSection?.hidden).toBeTrue();
      expect(informationSection?.hidden).toBeTrue();
    },
  );

  it('should hide V2.1-only global shell technical controls', async () => {
    await component.refreshProductData();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const textContent = element.textContent ?? '';
    expect(element.querySelector('.product-summary')).toBeNull();
    expect(element.querySelector('.product-identity-details')).toBeNull();
    expect(element.querySelector('.product-actions')).toBeNull();
    expect(element.querySelector('.product-back-button')).not.toBeNull();
    expect(element.querySelector('.product-navbar-icon.ai-param')).not.toBeNull();
    expect(textContent).not.toContain(component.text.backToScan);
    expect(textContent).not.toContain(component.text.refresh);
    expect(textContent).not.toContain('Verrouiller tous les réglages');
    expect(textContent).not.toContain(component.text.sections.identity);
    expect(textContent).not.toContain(component.text.profile);
    expect(textContent).not.toContain(component.text.deviceId);
    expect(textContent).not.toContain(component.text.connection);
    expect(textContent).not.toContain(component.text.lastRefresh);
    expect(textContent).not.toContain(routerNavigationState.deviceId);
  });

  it('should render the Phase 1 navbar title without replacing the product identity', () => {
    const title = fixture.nativeElement.querySelector('ion-title');

    expect(title?.textContent?.trim()).toBe('Commandes');
    expect(component.config.productName).toBe('WIDOOR');
    expect(component.config.profile).toBe('widoor');
    expect(fixture.nativeElement.querySelector('.product-back-button'))
      .not.toBeNull();
    expect(fixture.nativeElement.querySelector('.app-main-menu-button'))
      .not.toBeNull();
  });

  it('should preserve the Phase 1 navbar title in every supported language', () => {
    expect(productPageTextFor('fr').sections.navbarTitle).toBe('Commandes');
    expect(productPageTextFor('en').sections.navbarTitle).toBe('Commands');
    expect(productPageTextFor('de').sections.navbarTitle).toBe('Befehle');
    expect(productPageTextFor('pl').sections.navbarTitle).toBe('Sterowanie');
  });

  it('should update visible product texts without changing the BLE context', () => {
    const frenchCommand = component.productCommands[0].text.label;

    storeManualAppLanguage('de');
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('ion-title');
    expect(title?.textContent?.trim()).toBe('Befehle');
    expect(component.productCommands[0].text.label)
      .not.toBe(frenchCommand);
    expect(fixture.nativeElement.textContent)
      .toContain(component.productCommands[0].text.label);
    expect(bleService.connectedDeviceId).toBe('device-1');
    expect(bleService.connectionGeneration).toBe(4);
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should open the anchored global menu without selecting product settings',
    async () => {
    const menu = fixture.debugElement.query(
      By.directive(AppMainMenuComponent),
    ).componentInstance as AppMainMenuComponent;
    const menuButton = fixture.nativeElement.querySelector(
      '.app-main-menu-button',
    ) as HTMLIonButtonElement;
    const popover = fixture.nativeElement.querySelector(
      'ion-popover.app-main-menu-popover',
    ) as HTMLIonPopoverElement;
    const backToScan = spyOn(component, 'backToScan').and.callThrough();
    const didPresent = popoverDidPresent(popover);

    expect(component.activeMainTab).toBe('commands');

    menuButton.click();
    await didPresent;

    expect(menu.menuOpen).toBeTrue();
    expect(popover.reference).toBe('trigger');
    expect(component.activeMainTab).toBe('commands');
    expect(routerNavigate).not.toHaveBeenCalled();
    expect(backToScan).not.toHaveBeenCalled();
    expect(bleService.connectedDeviceId).toBe('device-1');
    expect(bleService.connectionGeneration).toBe(4);
    expect(productExitState.consume()).toBeNull();

    await popover.dismiss();

    expect(menu.menuOpen).toBeFalse();
    expect(component.activeMainTab).toBe('commands');
    expect(routerNavigate).not.toHaveBeenCalled();
    expect(backToScan).not.toHaveBeenCalled();
    expect(bleService.connectedDeviceId).toBe('device-1');
    expect(bleService.connectionGeneration).toBe(4);
    },
  );

  it('should navigate from the menu without disconnecting the product',
    async () => {
      const disconnectSpy = spyOn(bleService, 'disconnect').and.callThrough();
      const menu = fixture.debugElement.query(
        By.directive(AppMainMenuComponent),
      ).componentInstance as AppMainMenuComponent;
      const menuButton = fixture.nativeElement.querySelector(
        '.app-main-menu-button',
      ) as HTMLIonButtonElement;
      const popover = fixture.nativeElement.querySelector(
        'ion-popover.app-main-menu-popover',
      ) as HTMLIonPopoverElement;
      const help = menu.items.find(({ destination }) =>
        destination === 'help'
      );
      const backToScan = spyOn(component, 'backToScan').and.callThrough();
      const didPresent = popoverDidPresent(popover);

      expect(help).toBeDefined();
      menuButton.click();
      await didPresent;
      await menu.select(help!);

      expect(routerNavigate).toHaveBeenCalledOnceWith(['/help']);
      expect(disconnectSpy).not.toHaveBeenCalled();
      expect(backToScan).not.toHaveBeenCalled();
      expect(bleService.connectedDeviceId).toBe('device-1');
      expect(bleService.connectionGeneration).toBe(4);
      expect(productExitState.consume()).toBeNull();
      expect(component.activeMainTab).toBe('commands');
      expect(menu.menuOpen).toBeFalse();
      expect(TestBed.inject(ConnectedProductInactivityService)
        .isMonitoring('widoor:device-1:4')).toBeTrue();
    },
  );

  it('should scope Android Back away from an auxiliary page and restore the product context',
    async () => {
      const disconnectSpy = spyOn(bleService, 'disconnect').and.callThrough();
      const menu = fixture.debugElement.query(
        By.directive(AppMainMenuComponent),
      ).componentInstance as AppMainMenuComponent;
      const help = menu.items.find(({ destination }) =>
        destination === 'help'
      );

      component.ionViewWillEnter();
      await menu.select(help!);
      component.ionViewWillLeave();
      routerNavigate.calls.reset();

      expect(TestBed.inject(ConnectedProductInactivityService)
        .isMonitoring('widoor:device-1:4')).toBeTrue();

      await platform.backButton.trigger();

      expect(routerNavigate).not.toHaveBeenCalled();
      expect(disconnectSpy).not.toHaveBeenCalled();
      expect(bleService.connectedDeviceId).toBe('device-1');
      expect(productExitState.consume()).toBeNull();

      component.ionViewWillEnter();
      expect(bleService.connectedDeviceId).toBe('device-1');
      expect(routerOutlet.swipeGesture).toBeFalse();
    },
  );

  it('should navigate the product shell without BLE writes', () => {
    component.setActiveMainTab('settings');
    fixture.detectChanges();

    let element = fixture.nativeElement as HTMLElement;
    expect(component.activeMainTab).toBe('settings');
    expect(component.activeSettingsTab).toBe('basic');
    expect(element.querySelector<HTMLElement>(
      '[aria-labelledby="commands-title"]',
    )?.hidden).toBeTrue();
    expect(element.querySelector<HTMLElement>(
      '[aria-labelledby="settings-title"]',
    )?.hidden).toBeFalse();

    component.setActiveSettingsTab('advanced');
    fixture.detectChanges();
    expect(component.activeSettingsTab).toBe('advanced');

    component.setActiveMainTab('information');
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector<HTMLElement>(
      '[aria-labelledby="information-title"]',
    )?.hidden).toBeFalse();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
    expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
  });

  it('should scroll to the top only for real Product tab changes', () => {
    const content = fixture.debugElement.query(By.directive(IonContent))
      .componentInstance as IonContent;
    const scrollToTop = spyOn(content, 'scrollToTop').and.resolveTo();

    component.setActiveMainTab('settings');
    expect(scrollToTop).toHaveBeenCalledOnceWith(0);

    component.setActiveMainTab('settings');
    expect(scrollToTop).toHaveBeenCalledTimes(1);

    component.setActiveSettingsTab('advanced');
    component.setActiveSettingsTab('advanced');
    component.setActiveSettingsTab('basic');
    component.setActiveMainTab('information');
    component.setActiveMainTab('commands');

    expect(scrollToTop).toHaveBeenCalledTimes(5);
    expect(scrollToTop.calls.allArgs()).toEqual([
      [0], [0], [0], [0], [0],
    ]);
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should monitor inactivity only for the current real BLE session', () => {
    const inactivity = TestBed.inject(ConnectedProductInactivityService);

    expect(inactivity.isMonitoring('widoor:device-1:4')).toBeTrue();
    bleService.emitMotorState([0x21, 0, 0, 0, 0]);
    expect(inactivity.isMonitoring('widoor:device-1:4')).toBeTrue();
  });

  it('should dismiss the top alert before inactivity uses backToScan',
    async () => {
      const disconnect = spyOn(bleService, 'disconnect').and.callThrough();

      await (component as any).handleConnectedProductInactivityTimeout();

      expect(alertGetTop).toHaveBeenCalledTimes(1);
      expect(topAlertDismiss).toHaveBeenCalledOnceWith(
        undefined,
        'product-inactivity-timeout',
      );
      expect(disconnect).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
    },
  );

  it('should navigate on expired resume after BLE disconnected in background',
    fakeAsync(() => {
      const inactivity = TestBed.inject(ConnectedProductInactivityService);
      const disconnect = spyOn(bleService, 'disconnect').and.callThrough();

      inactivity.handleAppStateChange(false);
      void bleService.disconnect();
      flushMicrotasks();

      expect(bleService.connectedDeviceId).toBeNull();
      expect(inactivity.isMonitoring('widoor:device-1:4')).toBeTrue();
      tick(CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS);
      expect(routerNavigate).not.toHaveBeenCalled();

      inactivity.handleAppStateChange(true);
      flushMicrotasks();

      expect(disconnect).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
      expect(inactivity.isMonitoring()).toBeFalse();
    }),
  );

  it('should retry Scan on resume when expiration completed in background',
    fakeAsync(() => {
      const inactivity = TestBed.inject(ConnectedProductInactivityService);
      const disconnect = spyOn(bleService, 'disconnect').and.callThrough();
      let resolveFirstNavigation!: (navigated: boolean) => void;
      inactivity.stop('widoor:device-1:4');
      inactivity.start({
        id: 'widoor:device-1:4',
        isWriteInProgress: () => false,
        onTimeout: () => (component as any)
          .handleConnectedProductInactivityTimeout(),
      });
      routerNavigate.and.returnValue(new Promise<boolean>((resolve) => {
        resolveFirstNavigation = resolve;
      }));

      tick(CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS);
      flushMicrotasks();
      expect(disconnect).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledTimes(1);
      expect(bleService.connectedDeviceId).toBeNull();

      inactivity.handleAppStateChange(false);
      resolveFirstNavigation(true);
      flushMicrotasks();
      expect(inactivity.isExpirationPending('widoor:device-1:4')).toBeTrue();

      routerNavigate.and.resolveTo(true);
      inactivity.handleAppStateChange(true);
      flushMicrotasks();

      expect(disconnect).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledTimes(2);
      expect(routerNavigate.calls.allArgs()).toEqual([
        [['/scan']],
        [['/scan']],
      ]);
      expect(inactivity.isMonitoring()).toBeFalse();
    }),
  );

  it('should show settings and information tabs by default', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(component.showSettingsTab).toBeTrue();
    expect(component.showInformationTab).toBeTrue();
    expect(element.querySelector('ion-segment-button[value="settings"]'))
      .not.toBeNull();
    expect(element.querySelector('ion-segment-button[value="information"]'))
      .not.toBeNull();
  });

  it('should hide inactive optional tabs while keeping commands usable', () => {
    storeShowProductSettings(false);
    storeShowProductInformation(false);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(component.activeMainTab).toBe('commands');
    expect(component.showSettingsTab).toBeFalse();
    expect(component.showInformationTab).toBeFalse();
    expect(element.querySelector('ion-segment-button[value="commands"]'))
      .not.toBeNull();
    expect(element.querySelector('ion-segment-button[value="settings"]'))
      .toBeNull();
    expect(element.querySelector('ion-segment-button[value="information"]'))
      .toBeNull();
    expect(element.querySelector<HTMLElement>(
      '[aria-labelledby="commands-title"]',
    )?.hidden).toBeFalse();
  });

  it('should apply persisted hidden tabs to a new product page', () => {
    fixture.destroy();
    storeShowProductSettings(false);
    storeShowProductInformation(false);

    fixture = TestBed.createComponent(ProductPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(component.activeMainTab).toBe('commands');
    expect(component.showSettingsTab).toBeFalse();
    expect(component.showInformationTab).toBeFalse();
    expect(element.querySelector('ion-segment-button[value="commands"]'))
      .not.toBeNull();
    expect(element.querySelector('ion-segment-button[value="settings"]'))
      .toBeNull();
    expect(element.querySelector('ion-segment-button[value="information"]'))
      .toBeNull();
    expect(element.querySelector<HTMLElement>(
      '[aria-labelledby="commands-title"]',
    )?.hidden).toBeFalse();
  });

  it('should preserve active settings content when its tab becomes hidden', () => {
    const disconnectSpy = spyOn(bleService, 'disconnect').and.callThrough();
    component.setActiveMainTab('settings');
    component.setActiveSettingsTab('advanced');
    const generation = bleService.connectionGeneration;

    storeShowProductSettings(false);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(component.activeMainTab).toBe('settings');
    expect(component.activeSettingsTab).toBe('advanced');
    expect(component.showSettingsTab).toBeFalse();
    expect(element.querySelector('ion-segment-button[value="settings"]'))
      .toBeNull();
    expect(element.querySelector('.product-sub-segment')).not.toBeNull();
    expect(element.querySelector<HTMLElement>(
      '[aria-labelledby="settings-title"]',
    )?.hidden).toBeFalse();
    expect(disconnectSpy).not.toHaveBeenCalled();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
    expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    expect(bleService.connectedDeviceId).toBe('device-1');
    expect(bleService.connectionGeneration).toBe(generation);
  });

  it('should preserve active information content when its tab becomes hidden', () => {
    const disconnectSpy = spyOn(bleService, 'disconnect').and.callThrough();
    component.setActiveMainTab('information');
    const generation = bleService.connectionGeneration;

    storeShowProductInformation(false);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(component.activeMainTab).toBe('information');
    expect(component.showInformationTab).toBeFalse();
    expect(element.querySelector('ion-segment-button[value="information"]'))
      .toBeNull();
    expect(element.querySelector<HTMLElement>(
      '[aria-labelledby="information-title"]',
    )?.hidden).toBeFalse();
    expect(disconnectSpy).not.toHaveBeenCalled();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
    expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    expect(bleService.connectedDeviceId).toBe('device-1');
    expect(bleService.connectionGeneration).toBe(generation);
  });

  it('should restore optional tabs immediately when preferences are enabled', () => {
    storeShowProductSettings(false);
    storeShowProductInformation(false);
    fixture.detectChanges();

    storeShowProductSettings(true);
    storeShowProductInformation(true);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(component.showSettingsTab).toBeTrue();
    expect(component.showInformationTab).toBeTrue();
    expect(element.querySelector('ion-segment-button[value="settings"]'))
      .not.toBeNull();
    expect(element.querySelector('ion-segment-button[value="information"]'))
      .not.toBeNull();
  });

  it('should load once on first entry and keep cached data across tabs',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithTimings(4, 1),
      );
      const shortTimedCommand = component.productCommands.find((command) =>
        command.config.operation === 'motor-open-short-timed',
      )!;
      const shortTiming = component.userTimingControls.find((control) =>
        control.config.field === 'short-timing',
      )!.config;
      component.setUserTimingDraftValue(shortTiming, 1);

      component.ionViewWillEnter();
      await waitForCondition(() =>
        loadService.loadProductData.calls.count() === 1 &&
        !component.viewModel.loading,
      );
      fixture.detectChanges();

      expect(component.activeMainTab).toBe('commands');
      expect(component.productCommandDisplayLabel(shortTimedCommand))
        .toBe('Ouvrir 4 s');
      expect(fixture.nativeElement.querySelector('.cmd-timed .cmd-label')
        ?.textContent).toContain('Ouvrir 4 s');

      component.setActiveMainTab('settings');
      component.setActiveSettingsTab('basic');
      component.setActiveSettingsTab('advanced');
      component.setActiveMainTab('information');
      component.setActiveMainTab('commands');

      expect(loadService.loadProductData).toHaveBeenCalledTimes(1);
      expect(component.viewModel.loading).toBeFalse();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should wait for the motor notification before initial product reads',
    async () => {
      let releaseNotification!: () => void;
      const notificationStart = new Promise<void>((resolve) => {
        releaseNotification = resolve;
      });
      bleService.waitForNotificationStart.and.returnValue(notificationStart);

      component.ionViewWillEnter();
      await Promise.resolve();

      expect(component.viewModel.loading).toBeTrue();
      expect(loadService.loadProductData).not.toHaveBeenCalled();

      releaseNotification();
      await waitForCondition(() =>
        loadService.loadProductData.calls.count() === 1 &&
        !component.viewModel.loading,
      );

      expect(bleService.waitForNotificationStart).toHaveBeenCalledOnceWith(
        BLE_UUIDS.shdoService,
        BLE_UUIDS.motorStateCharacteristic,
        'device-1',
      );
    },
  );

  it('should keep toggle DOM and appearance stable while another write runs',
    async () => {
      await component.refreshProductData();
      component.setActiveMainTab('settings');
      fixture.detectChanges();
      const before = fixture.nativeElement.querySelector(
        'ion-toggle.user-peripheral-toggle',
      ) as HTMLIonToggleElement;

      component.userSpeedWriteState = Object.freeze({
        status: 'executing',
        field: component.userSpeedControls[0].config.field,
        message: component.text.userSpeedControls.executing,
      });
      fixture.detectChanges();
      const during = fixture.nativeElement.querySelector(
        'ion-toggle.user-peripheral-toggle',
      ) as HTMLIonToggleElement;

      expect(during).toBe(before);
      expect(during.disabled).toBeTrue();
      expect(getComputedStyle(during).opacity).toBe('1');
      expect(component.viewModel.loading).toBeFalse();
    },
  );

  it('should expose name and room editing from the navigation display name',
    () => {
      const element = fixture.nativeElement as HTMLElement;

      expect(component.showNameRoomControls).toBeTrue();
      expect(component.currentNameRoomValue()).toEqual({
        name: 'Porte',
        roomSuffix: '#CHA',
      });
      expect(component.nameRoomDraftValue()).toEqual({
        name: 'Porte',
        roomSuffix: '#CHA',
      });
      expect(element.querySelector('ion-input.name-room-name-input'))
        .not.toBeNull();
      const roomSelect = element.querySelector<HTMLIonSelectElement>(
        'ion-select.name-room-select',
      );
      expect(roomSelect).not.toBeNull();
      expect(element.querySelector('.basic-name-room-actions ion-button'))
        .not.toBeNull();
      expect(roomSelect?.label).toBe(component.text.nameRoomControls.roomLabel);
      expect(component.canApplyNameRoom()).toBeFalse();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should write a product name change through the executor', async () => {
    writeExecutionService.nextResult = nameRoomExecutionResult(
      'widoor',
      '43 6f 75 6c 6f 69 72 23 43 48 41',
    );

    component.setNameRoomDraftName('Couloir');
    await component.requestNameRoomChange();

    expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
    const request = writeExecutionService.execute.calls.mostRecent()
      .args[0] as LegacyBleWriteRequest;
    expect(request.profile).toBe('widoor');
    expect(request.write.operation).toBe('name-room');
    expect(request.write.serviceUuid).toBe(BLE_UUIDS.shdoService);
    expect(request.write.characteristicUuid)
      .toBe(BLE_UUIDS.nameCharacteristic);
    expect(request.write.payloadHex)
      .toBe('43 6f 75 6c 6f 69 72 23 43 48 41');
    expect(Array.from(request.write.payload)).toEqual(
      Array.from('Couloir#CHA', (character) => character.charCodeAt(0)),
    );
    expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
    expect(request.policy).toEqual(jasmine.objectContaining({
      allowPhase1ReferenceOnly: true,
      gattWriteTimeoutMs: 15_000,
      useLegacyAndroidWriteApi: true,
    }));
    expect(request.authorization).toBeNull();
    expect(delaySpy.calls.allArgs()).toEqual([[200], [1_800]]);
    expect(component.viewModel.displayedName).toBe('Couloir');
    expect(component.viewModel.roomSuffix).toBe('#CHA');
    expect(component.nameRoomWriteState.status).toBe('sent');
    expect(loadService.loadProductData).not.toHaveBeenCalled();
  });

  it('should write a room-only change while keeping the current name',
    async () => {
      writeExecutionService.nextResult = nameRoomExecutionResult(
        'widoor',
        '50 6f 72 74 65 23 53 44 42',
      );

      component.setNameRoomDraftRoom('#SDB');
      await component.requestNameRoomChange();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.write.payloadHex).toBe(
        '50 6f 72 74 65 23 53 44 42',
      );
      expect(Array.from(request.write.payload)).toEqual(
        Array.from('Porte#SDB', (character) => character.charCodeAt(0)),
      );
      expect(component.viewModel.displayedName).toBe('Porte');
      expect(component.viewModel.roomSuffix).toBe('#SDB');
      expect(component.nameRoomDraftValue()).toEqual({
        name: 'Porte',
        roomSuffix: '#SDB',
      });
    },
  );

  it('should write room removal without changing the current name',
    async () => {
      writeExecutionService.nextResult = nameRoomExecutionResult(
        'widoor',
        '50 6f 72 74 65',
      );

      component.setNameRoomDraftRoom(null);
      await component.requestNameRoomChange();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.write.payloadHex).toBe('50 6f 72 74 65');
      expect(Array.from(request.write.payload)).toEqual(
        Array.from('Porte', (character) => character.charCodeAt(0)),
      );
      expect(component.viewModel.displayedName).toBe('Porte');
      expect(component.viewModel.roomSuffix).toBeNull();
    },
  );

  it('should write product name and room changes together', async () => {
    writeExecutionService.nextResult = nameRoomExecutionResult(
      'widoor',
      '47 61 72 61 67 65 23 47 41 52',
    );

    component.setNameRoomDraftName('Garage');
    component.setNameRoomDraftRoom('#GAR');
    await component.requestNameRoomChange();

    expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
    const request = writeExecutionService.execute.calls.mostRecent()
      .args[0] as LegacyBleWriteRequest;
    expect(request.write.payloadHex)
      .toBe('47 61 72 61 67 65 23 47 41 52');
    expect(Array.from(request.write.payload)).toEqual(
      Array.from('Garage#GAR', (character) => character.charCodeAt(0)),
    );
    expect(component.viewModel.displayedName).toBe('Garage');
    expect(component.viewModel.roomSuffix).toBe('#GAR');
    expect(readRoomCacheEntry(' DEVICE-1 ')).toEqual(
      jasmine.objectContaining({
        name: 'Garage',
        suffix: '#GAR',
      }),
    );
  });

  it('should update the Phase 1 room cache after successful name-room writes for each migrated profile',
    async () => {
      for (const profile of [
        'widoor',
        'moventiv-60',
        'moventiv-80',
        'garline',
      ] as const) {
        localStorage.removeItem(ROOM_ASSIGNMENTS_STORAGE_KEY);
        const harness = await createNameRoomProfileHarness(profile);
        harness.writeExecutionService.nextResult = nameRoomExecutionResult(
          profile,
          '47 61 72 61 67 65 23 47 41 52',
        );

        harness.component.setNameRoomDraftName('Garage');
        harness.component.setNameRoomDraftRoom('#GAR');
        await harness.component.requestNameRoomChange();

        expect(readRoomCacheEntry(' device-1 ')).withContext(profile).toEqual(
          jasmine.objectContaining({
            name: 'Garage',
            suffix: '#GAR',
          }),
        );
        harness.fixture.destroy();
      }
    },
  );

  it('should reject invalid name and room drafts before any write', async () => {
    component.setNameRoomDraftName('Abc');

    expect(component.canApplyNameRoom()).toBeFalse();
    expect(component.canRequestNameRoomChange()).toBeTrue();
    expect(component.nameRoomValidationMessage()).toBe(
      component.text.nameRoomControls.errors.tooShort,
    );
    await component.requestNameRoomChange();

    expect(writeExecutionService.execute).not.toHaveBeenCalled();
    expect(alertCreate).toHaveBeenCalledTimes(1);
    expect(alertOptions[0]).toEqual(jasmine.objectContaining({
      message: component.text.nameRoomControls.errors.tooShort,
    }));
    component.setNameRoomDraftName('Porte_1');
    expect(component.canApplyNameRoom()).toBeFalse();
    expect(component.canRequestNameRoomChange()).toBeTrue();
    expect(component.nameRoomValidationMessage()).toBe(
      component.text.nameRoomControls.errors.invalidCharacters,
    );
    await component.requestNameRoomChange();

    expect(writeExecutionService.execute).not.toHaveBeenCalled();
    expect(alertCreate).toHaveBeenCalledTimes(2);
    expect(alertOptions[1]).toEqual(jasmine.objectContaining({
      message: component.text.nameRoomControls.errors.invalidCharacters,
    }));
    component.setNameRoomDraftName('123456789012');
    expect(component.canApplyNameRoom()).toBeFalse();
    expect(component.canRequestNameRoomChange()).toBeTrue();
    await component.requestNameRoomChange();

    expect(writeExecutionService.execute).not.toHaveBeenCalled();
    expect(alertCreate).toHaveBeenCalledTimes(3);
    expect(alertOptions[2]).toEqual(jasmine.objectContaining({
      message: component.text.nameRoomControls.errors.tooLong,
    }));
    fixture.detectChanges();
    const pageText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(pageText).not.toContain(
      component.text.nameRoomControls.errors.tooShort,
    );
    expect(pageText).not.toContain(
      component.text.nameRoomControls.errors.invalidCharacters,
    );
    expect(pageText).not.toContain(
      component.text.nameRoomControls.errors.tooLong,
    );
  });

  it('should keep current name and room when a name write fails', async () => {
    localStorage.setItem(ROOM_ASSIGNMENTS_STORAGE_KEY, JSON.stringify({
      'DEVICE-1': { name: 'Ancien', suffix: '#SAL', updatedAt: 42 },
    }));
    writeExecutionService.nextResult = {
      ...nameRoomExecutionResult(
        'widoor',
        '43 6f 75 6c 6f 69 72 23 43 48 41',
      ),
      status: 'failed',
      nativeWriteCompleted: false,
      error: {
        code: 'native-write-failed',
        message: 'Native failure',
      },
    };

    component.setNameRoomDraftName('Couloir');
    await component.requestNameRoomChange();

    expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
    expect(component.viewModel.displayedName).toBe('Porte');
    expect(component.viewModel.roomSuffix).toBe('#CHA');
    expect(component.nameRoomDraftValue()).toEqual({
      name: 'Couloir',
      roomSuffix: '#CHA',
    });
    expect(component.nameRoomWriteState.status).toBe('failed');
    fixture.detectChanges();
    expect(alertCreate).toHaveBeenCalledTimes(1);
    expect(alertOptions[0]).toEqual(jasmine.objectContaining({
      message: component.text.nameRoomControls.failed,
    }));
    expect((fixture.nativeElement as HTMLElement).textContent)
      .not.toContain(component.text.nameRoomControls.failed);
    expect(bleService.connectedDeviceId).toBe('device-1');
    expect(routerNavigate).not.toHaveBeenCalled();
    expect(readRoomCacheEntry('device-1')).toEqual({
      name: 'Ancien',
      suffix: '#SAL',
      updatedAt: 42,
    });
  });

  it('should reset name and room drafts on reload and disconnection',
    async () => {
      component.setNameRoomDraftName('Couloir');
      component.setNameRoomDraftRoom('#SDB');
      expect(component.canApplyNameRoom()).toBeTrue();

      await component.refreshProductData();

      expect(component.nameRoomDraftValue()).toEqual({
        name: 'Porte',
        roomSuffix: '#CHA',
      });
      component.setNameRoomDraftName('Couloir');

      bleService.disconnect();

      expect(component.showNameRoomControls).toBeFalse();
      expect(component.canApplyNameRoom()).toBeFalse();
      expect(component.nameRoomWriteState.status).toBe('idle');
    },
  );

  it('should expose Widoor commands without executing automatically',
    () => {
      const element = fixture.nativeElement as HTMLElement;
      const openButton = element.querySelector<HTMLIonButtonElement>(
        'ion-button.widoor-open-command',
      );
      const shortTimedCommand = component.productCommands.find((command) =>
        command.config.operation === 'motor-open-short-timed',
      )!;

      expect(openButton).not.toBeNull();
      expect(openButton?.disabled).toBeFalse();
      expect(element.textContent).toContain(
        component.text.widoorCommands.open.label,
      );
      expect(element.querySelector('ion-button.widoor-close-command'))
        .not.toBeNull();
      expect(component.productCommandDisplayLabel(shortTimedCommand))
        .toBe('Ouvrir 1 s');
      expect(component.productCommandDisplayLabel(shortTimedCommand))
        .not.toBe(component.text.widoorCommands.openShortTimed.label);
      expect(element.textContent).toContain('Apprentissage');
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(alertCreate).not.toHaveBeenCalled();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should not expose Commandes lock controls from the decoded Widoor lock mode',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithLockMode('locked-open'),
      );

      await component.refreshProductData();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(component.lockModeControls).toEqual([]);
      expect(component.showLockModeControls).toBeFalse();
      expect(element.textContent).not.toContain(
        component.text.lockModeControls.lockedOpen.label,
      );
      expect(element.textContent).not.toContain(
        component.text.lockModeControls.lockedClosed.label,
      );
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should expose speed controls initialized from decoded user parameters',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithSpeeds(42, 57),
      );

      await component.refreshProductData();
      fixture.detectChanges();

      expect(component.showUserSpeedControls).toBeTrue();
      expect(component.userSpeedControls.map((control) =>
        control.config.field,
      )).toEqual(['open-speed', 'close-speed']);
      expect(component.currentUserSpeedValue(
        component.userSpeedControls[0].config,
      )).toBe(42);
      expect(component.userSpeedDraftValue(
        component.userSpeedControls[1].config,
      )).toBe(57);
      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain(component.text.user.openSpeed);
      expect(element.textContent).toContain(component.text.user.closeSpeed);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should write Widoor speed changes through the executor', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithSpeeds(25, 35),
    );
    await component.refreshProductData();
    const openControl = component.userSpeedControls[0].config;
    const closeControl = component.userSpeedControls[1].config;

    const transitions = [
      {
        config: openControl,
        changedValue: 26,
        operation: 'open-speed',
        payloadHex: '01 1a',
        payload: [0x01, 0x1a],
      },
      {
        config: closeControl,
        changedValue: 100,
        operation: 'close-speed',
        payloadHex: '02 64',
        payload: [0x02, 0x64],
      },
      {
        config: openControl,
        changedValue: 60,
        operation: 'open-speed',
        payloadHex: '01 3c',
        payload: [0x01, 0x3c],
      },
    ] as const;

    for (const transition of transitions) {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithSpeeds(25, 35),
      );
      writeExecutionService.nextResult = userSpeedExecutionResult(
        'widoor',
        transition.operation,
        transition.payloadHex,
      );
      writeExecutionService.execute.calls.reset();

      component.setUserSpeedDraftValue(
        transition.config,
        transition.changedValue,
      );
      await component.requestUserSpeedChange(transition.config);

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.profile).toBe('widoor');
      expect(request.write.operation).toBe(transition.operation);
      expect(request.write.serviceUuid).toBe(BLE_UUIDS.widoorService);
      expect(request.write.characteristicUuid)
        .toBe(BLE_UUIDS.userParametersCharacteristic);
      expect(request.write.payloadHex).toBe(transition.payloadHex);
      expect(Array.from(request.write.payload)).toEqual(transition.payload);
      expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
      expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
      expect(request.authorization).toBeNull();
      expect(component.userSpeedWriteState.status).toBe('sent');
    }
  });

  it('should keep speed drafts local until apply and reset them on reload',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithSpeeds(25, 35),
      );
      await component.refreshProductData();
      const openControl = component.userSpeedControls[0].config;

      component.setUserSpeedDraftValue(openControl, 42);

      expect(component.currentUserSpeedValue(openControl)).toBe(25);
      expect(component.userSpeedDraftValue(openControl)).toBe(42);
      expect(component.canApplyUserSpeed(openControl)).toBeTrue();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();

      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithSpeeds(55, 35),
      );
      await component.refreshProductData();

      expect(component.currentUserSpeedValue(openControl)).toBe(55);
      expect(component.userSpeedDraftValue(openControl)).toBe(55);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should clear speed drafts when the product disconnects', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithSpeeds(25, 35),
    );
    await component.refreshProductData();
    const openControl = component.userSpeedControls[0].config;

    component.setUserSpeedDraftValue(openControl, 42);
    bleService.disconnect();

    expect(component.currentUserSpeedValue(openControl)).toBeNull();
    expect(component.userSpeedDraftValue(openControl))
      .toBe(openControl.range.min);
    expect(component.canApplyUserSpeed(openControl)).toBeFalse();
    expect(component.userSpeedWriteState.status).toBe('idle');
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should reject speed controls from another profile', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithSpeeds(25, 35),
    );
    await component.refreshProductData();
    const widoorOpenControl = component.userSpeedControls[0].config;
    const moventivOpenControl = productUserSpeedConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    )[0];

    component.setUserSpeedDraftValue(moventivOpenControl, 50);
    await component.requestUserSpeedChange(moventivOpenControl);

    expect(component.userSpeedDraftValue(widoorOpenControl)).toBe(25);
    expect(component.canApplyUserSpeed(moventivOpenControl)).toBeFalse();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should reject invalid speed values without writing', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithSpeeds(25, 35),
    );
    await component.refreshProductData();
    const openControl = component.userSpeedControls[0].config;

    component.setUserSpeedDraftValue(openControl, 24);
    await component.requestUserSpeedChange(openControl);

    expect(component.userSpeedDraftValue(openControl)).toBe(25);
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should keep decoded speed as applied state when a write fails',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithSpeeds(25, 35),
      );
      writeExecutionService.nextResult = {
        ...userSpeedExecutionResult('widoor', 'open-speed', '01 1a'),
        status: 'failed',
        nativeWriteCompleted: false,
        error: { code: 'native-write-failed', message: 'Native failure' },
      };
      await component.refreshProductData();
      const openControl = component.userSpeedControls[0].config;

      component.setUserSpeedDraftValue(openControl, 26);
      await component.requestUserSpeedChange(openControl);

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.currentUserSpeedValue(openControl)).toBe(25);
      expect(component.userSpeedDraftValue(openControl)).toBe(26);
      expect(component.userSpeedWriteState.status).toBe('failed');
      expect(component.userSpeedWriteState.message)
        .toBe(component.text.userSpeedControls.failed);
    },
  );

  it('should expose timing controls initialized from decoded user parameters',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithTimings(3, 12),
      );

      await component.refreshProductData();
      fixture.detectChanges();

      expect(component.showUserTimingControls).toBeTrue();
      expect(component.userTimingControls.map((control) =>
        control.config.field,
      )).toEqual(['short-timing']);
      const shortControl = component.userTimingControls[0].config;
      expect(component.currentUserTimingValue(shortControl)).toBe(3);
      expect(component.userTimingDraftValue(shortControl)).toBe(3);
      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain(component.text.user.shortTiming);
      expect(element.textContent).not.toContain(component.text.user.longTiming);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should write Widoor short timing through the executor', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithTimings(1, 12),
    );
    await component.refreshProductData();
    const shortControl = component.userTimingControls[0].config;
    const transitions = [
      {
        value: 0,
        payloadHex: '03 00',
        payload: [0x03, 0x00],
      },
      {
        value: 60,
        payloadHex: '03 3c',
        payload: [0x03, 0x3c],
      },
      {
        value: 12,
        payloadHex: '03 0c',
        payload: [0x03, 0x0c],
      },
    ] as const;

    for (const transition of transitions) {
      writeExecutionService.nextResult = userTimingExecutionResult(
        'widoor',
        'short-timing',
        transition.payloadHex,
      );
      writeExecutionService.execute.calls.reset();

      component.setUserTimingDraftValue(shortControl, transition.value);
      await component.requestUserTimingChange(shortControl);

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.profile).toBe('widoor');
      expect(request.write.operation).toBe('short-timing');
      expect(request.write.serviceUuid).toBe(BLE_UUIDS.widoorService);
      expect(request.write.characteristicUuid)
        .toBe(BLE_UUIDS.userParametersCharacteristic);
      expect(request.write.payloadHex).toBe(transition.payloadHex);
      expect(Array.from(request.write.payload)).toEqual(transition.payload);
      expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
      expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
      expect(request.authorization).toBeNull();
      expect(component.userTimingWriteState.status).toBe('sent');
    }
  });

  it('should keep timing drafts local until apply and reset them on reload',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithTimings(3, 12),
      );
      await component.refreshProductData();
      const shortControl = component.userTimingControls[0].config;

      component.setUserTimingDraftValue(shortControl, 30);

      expect(component.currentUserTimingValue(shortControl)).toBe(3);
      expect(component.userTimingDraftValue(shortControl)).toBe(30);
      expect(component.canApplyUserTiming(shortControl)).toBeTrue();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();

      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithTimings(45, 12),
      );
      await component.refreshProductData();

      expect(component.currentUserTimingValue(shortControl)).toBe(45);
      expect(component.userTimingDraftValue(shortControl)).toBe(45);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should reject invalid timing values without writing', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithTimings(3, 12),
    );
    await component.refreshProductData();
    const shortControl = component.userTimingControls[0].config;

    component.setUserTimingDraftValue(shortControl, 61);
    await component.requestUserTimingChange(shortControl);

    expect(component.userTimingDraftValue(shortControl)).toBe(3);
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should keep decoded timing as applied state when a write fails',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithTimings(3, 12),
      );
      writeExecutionService.nextResult = {
        ...userTimingExecutionResult('widoor', 'short-timing', '03 0c'),
        status: 'failed',
        nativeWriteCompleted: false,
        error: { code: 'native-write-failed', message: 'Native failure' },
      };
      await component.refreshProductData();
      const shortControl = component.userTimingControls[0].config;

      component.setUserTimingDraftValue(shortControl, 12);
      await component.requestUserTimingChange(shortControl);

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.currentUserTimingValue(shortControl)).toBe(3);
      expect(component.userTimingDraftValue(shortControl)).toBe(12);
      expect(component.userTimingWriteState.status).toBe('failed');
      expect(component.userTimingWriteState.message)
        .toBe(component.text.userTimingControls.failed);
    },
  );

  it('should clear timing drafts when the product disconnects', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithTimings(3, 12),
    );
    await component.refreshProductData();
    const shortControl = component.userTimingControls[0].config;

    component.setUserTimingDraftValue(shortControl, 30);
    bleService.disconnect();

    expect(component.currentUserTimingValue(shortControl)).toBeNull();
    expect(component.userTimingDraftValue(shortControl))
      .toBe(shortControl.range.min);
    expect(component.canApplyUserTiming(shortControl)).toBeFalse();
    expect(component.userTimingWriteState.status).toBe('idle');
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should reject timing controls from another profile', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithTimings(3, 12),
    );
    await component.refreshProductData();
    const widoorShortControl = component.userTimingControls[0].config;
    const garlineLongControl = productUserTimingConfigsFor(
      PRODUCT_PAGE_CONFIG.garline,
    )[1];

    component.setUserTimingDraftValue(garlineLongControl, 10);
    await component.requestUserTimingChange(garlineLongControl);

    expect(component.userTimingDraftValue(widoorShortControl)).toBe(3);
    expect(component.canApplyUserTiming(garlineLongControl)).toBeFalse();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should expose only the Widoor RGB user lighting toggle from BLE state',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithPeripherals({
          staticLight: true,
          dynamicLight: true,
          rgbIndicator: true,
        }),
      );

      await component.refreshProductData();
      fixture.detectChanges();

      expect(component.showUserPeripheralControls).toBeTrue();
      expect(component.userPeripheralControls.map((control) =>
        control.config.field,
      )).toEqual(['rgb']);
      expect(component.currentUserPeripheralState(
        component.userPeripheralControls[0].config,
      )).toBeTrue();
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelectorAll('ion-toggle.user-peripheral-toggle')
        .length).toBe(1);
      expect(element.textContent).toContain(component.text.user.rgb);
      expect(element.textContent).not.toContain(
        component.text.user.staticLight,
      );
      expect(element.textContent).not.toContain(
        component.text.user.dynamicLight,
      );
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should write Widoor RGB changes through the executor', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithPeripherals({ rgbIndicator: false }),
    );
    writeExecutionService.nextResult = userPeripheralExecutionResult(
      'widoor',
      'rgb-indicator',
      '05 03 01',
    );

    await component.refreshProductData();
    const rgbControl = component.userPeripheralControls[0].config;
    await component.requestUserPeripheralChange(rgbControl, true);

    expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
    const request = writeExecutionService.execute.calls.mostRecent()
      .args[0] as LegacyBleWriteRequest;
    expect(request.profile).toBe('widoor');
    expect(request.write.operation).toBe('rgb-indicator');
    expect(request.write.serviceUuid).toBe(BLE_UUIDS.widoorService);
    expect(request.write.characteristicUuid)
      .toBe(BLE_UUIDS.userParametersCharacteristic);
    expect(request.write.payloadHex).toBe('05 03 01');
    expect(Array.from(request.write.payload)).toEqual([0x05, 0x03, 0x01]);
    expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
    expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
    expect(request.authorization).toBeNull();
    expect(component.userPeripheralWriteState.status).toBe('sent');
    expect(loadService.loadProductData).toHaveBeenCalledTimes(1);
  });

  it('should keep decoded user lighting state when a write fails',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithPeripherals({ rgbIndicator: false }),
      );
      writeExecutionService.nextResult = {
        ...userPeripheralExecutionResult(
          'widoor',
          'rgb-indicator',
          '05 03 01',
        ),
        status: 'failed',
        nativeWriteCompleted: false,
        error: {
          code: 'native-write-failed',
          message: 'Native failure',
        },
      };

      await component.refreshProductData();
      const rgbControl = component.userPeripheralControls[0].config;
      await component.requestUserPeripheralChange(rgbControl, true);
      fixture.detectChanges();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.currentUserPeripheralState(rgbControl)).toBeFalse();
      expect((fixture.nativeElement as HTMLElement).querySelector(
        '.basic-settings-panel .product-light-icon[data-light-state="off"]',
      )).not.toBeNull();
      expect((fixture.nativeElement as HTMLElement).querySelector(
        '.basic-settings-panel .product-light-icon' +
          '.peripheral-icon-active',
      )).toBeNull();
      expect(component.userPeripheralWriteState.status).toBe('failed');
      expect(component.userPeripheralWriteState.message)
        .toBe(component.text.userPeripheralControls.failed);
    },
  );

  it('should reject user lighting controls from another profile', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithPeripherals({ rgbIndicator: false }),
    );
    await component.refreshProductData();
    const moventivStaticControl = productUserPeripheralConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    )[0];

    await component.requestUserPeripheralChange(moventivStaticControl, true);

    expect(component.canToggleUserPeripheral(moventivStaticControl))
      .toBeFalse();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should block a second user lighting write while one is pending',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = completeLoadResult(
        'success',
        'moventiv-60',
        userValueWithPeripherals({
          staticLight: false,
          dynamicLight: true,
          rgbIndicator: false,
        }),
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      let resolveWrite!: (value: LegacyBleWriteExecutionResult) => void;
      writeExecutionService.execute.and.returnValue(new Promise((resolve) => {
        resolveWrite = resolve;
      }));

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create').and.resolveTo({
                present: async () => undefined,
                onDidDismiss: async () => ({ role: 'confirm' }),
              }),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { data: { profile: 'moventiv-60' } },
            },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('moventiv-60') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();
      const dynamicControl = component.userPeripheralControls.find(
        (candidate) => candidate.config.field === 'dynamic-light',
      )!.config;
      const rgbControl = component.userPeripheralControls.find(
        (candidate) => candidate.config.field === 'rgb',
      )!.config;

      const firstWrite = component.requestUserPeripheralChange(
        dynamicControl,
        false,
      );

      expect(component.userPeripheralWriteState.status).toBe('executing');
      expect(component.canToggleUserPeripheral(rgbControl)).toBeFalse();
      await component.requestUserPeripheralChange(rgbControl, true);
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);

      resolveWrite(userPeripheralExecutionResult(
        'moventiv-60',
        'dynamic-light',
        '05 07 02',
      ));
      await firstWrite;

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.userPeripheralWriteState.status).toBe('sent');
    },
  );

  it('should reset user lighting write state when the product disconnects',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithPeripherals({ rgbIndicator: false }),
      );
      writeExecutionService.nextResult = {
        ...userPeripheralExecutionResult(
          'widoor',
          'rgb-indicator',
          '05 03 01',
        ),
        status: 'failed',
        nativeWriteCompleted: false,
        error: {
          code: 'native-write-failed',
          message: 'Native failure',
        },
      };
      await component.refreshProductData();
      const rgbControl = component.userPeripheralControls[0].config;
      await component.requestUserPeripheralChange(rgbControl, true);

      bleService.disconnect();

      expect(component.currentUserPeripheralState(rgbControl)).toBeNull();
      expect(component.canToggleUserPeripheral(rgbControl)).toBeFalse();
      expect(component.userPeripheralWriteState.status).toBe('idle');
    },
  );

  it('should not expose Widoor Commandes lock-mode transitions',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithLockMode('locked-closed'),
      );
      await component.refreshProductData();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(component.lockModeControls).toEqual([]);
      expect(component.showLockModeControls).toBeFalse();
      expect(element.querySelector('.lock-mode-controls')).toBeNull();
      expect(element.querySelector('ion-toggle.lock-mode-toggle')).toBeNull();
      expect(element.textContent).not.toContain(
        component.text.lockModeControls.title,
      );
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should block all Widoor motor commands while locked and restore at none',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithLockMode('locked-closed'),
      );
      alertRole = 'confirm';
      await component.refreshProductData();

      expect(component.showLockModeControls).toBeFalse();
      for (const command of WIDOOR_COMMAND_UI_CONFIGS.filter((config) =>
        config.enabled,
      )) {
        expect(component.canExecuteProductCommand(command)).toBeTrue();
      }

      await component.requestProductCommand(WIDOOR_COMMAND_UI_CONFIGS[0]);

      expect(alertCreate).toHaveBeenCalledTimes(1);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();

      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithLockMode('none'),
      );
      await component.refreshProductData();

      for (const command of WIDOOR_COMMAND_UI_CONFIGS.filter((config) =>
        config.enabled,
      )) {
        expect(component.canExecuteProductCommand(command)).toBeTrue();
      }
    },
  );

  it('should execute Widoor OPEN without a user confirmation alert',
    async () => {
      await component.requestWidoorOpen();
      fixture.detectChanges();

      expect(alertCreate).not.toHaveBeenCalled();
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.openCommandState.status).toBe('confirmed');
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should ignore alert dismissal roles for immediate Widoor OPEN',
    async () => {
      alertRole = 'backdrop';

      await component.requestWidoorOpen();

      expect(alertCreate).not.toHaveBeenCalled();
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.openCommandState.status).toBe('confirmed');
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should execute catalogued Widoor OPEN once with scoped authorization',
    async () => {
      alertRole = 'confirm';
      writeExecutionService.nextResult = openExecutionResult(
        'success',
        'not-required',
      );

      await component.requestWidoorOpen();
      fixture.detectChanges();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.write.operation).toBe('motor-open');
      expect(request.write.payloadHex).toBe('00 20 00 00');
      expect(Array.from(request.write.payload)).toEqual([0x00, 0x20, 0, 0]);
      expect(request.profile).toBe('widoor');
      expect(request.deviceId).toBe('device-1');
      expect(request.connectionGeneration).toBe(4);
      expect(request.identification).toEqual({
        profile: 'widoor',
        confidence: 'strong',
      });
      expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
      expect(request.policy).toEqual({
        allowWidoorPhase1ImmediateWrite: true,
      });
      expect(request.authorization).toBeNull();
      expect(component.openCommandState.status).toBe('confirmed');
      expect(component.openCommandState.confirmationStatus)
        .toBe('not-required');
      expect(component.openCommandState.movementStartConfirmed).toBeFalse();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should execute CLOSE without creating a user authorization',
    async () => {
      await component.requestWidoorClose();

      expect(alertCreate).not.toHaveBeenCalled();
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.authorization).toBeNull();
      expect(component.openCommandState.status).toBe('confirmed');
    },
  );

  it('should ignore CLOSE backdrop dismissal for immediate Widoor CLOSE', async () => {
    alertRole = 'backdrop';

    await component.requestWidoorClose();

    expect(alertCreate).not.toHaveBeenCalled();
    expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
    expect(component.openCommandState.status).toBe('confirmed');
    expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
  });

  it('should execute catalogued Widoor CLOSE once with a limited policy',
    async () => {
      alertRole = 'confirm';
      writeExecutionService.nextResult = openExecutionResult(
        'success',
        'not-validated',
        null,
        'motor-close',
      );

      await component.requestWidoorClose();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.write.operation).toBe('motor-close');
      expect(request.write.payloadHex).toBe('00 30');
      expect(Array.from(request.write.payload)).toEqual([0x00, 0x30]);
      expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
      expect(request.policy).toEqual({
        allowPhysicalValidationAttempt: {
          operation: 'motor-close',
          profile: 'widoor',
        },
        allowWidoorPhase1ImmediateWrite: true,
      });
      expect(request.policy?.allowPhase1ReferenceOnly).toBeUndefined();
      expect(request.authorization).toBeNull();
      expect(component.openCommandState.status).toBe('confirmed');
      expect(component.openCommandState.message)
        .toBe(component.text.openCommand.sent);
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should map CLOSE timeout without claiming a confirmed movement',
    async () => {
      alertRole = 'confirm';
      writeExecutionService.nextResult = openExecutionResult(
        'timeout',
        'timeout',
        'confirmation-timeout',
        'motor-close',
      );

      await component.requestWidoorClose();

      expect(component.openCommandState.status).toBe('timeout');
      expect(component.openCommandState.nativeWriteCompleted).toBeTrue();
      expect(component.openCommandState.confirmationStatus).toBe('timeout');
      expect(component.openCommandState.message)
        .toBe(component.text.widoorCommands.close.notConfirmed);
    },
  );

  it('should map every terminal CLOSE result without native text',
    async () => {
      alertRole = 'confirm';
      const cases: readonly [
        LegacyBleWriteExecutionResult,
        string,
        string,
      ][] = [
        [openExecutionResult('failed', 'unavailable', null, 'motor-close'),
          'failed', component.text.openCommand.failed],
        [openExecutionResult(
          'unavailable', 'unavailable', null, 'motor-close',
        ), 'unavailable', component.text.openCommand.unavailable],
        [openExecutionResult(
          'disconnected', 'unavailable', null, 'motor-close',
        ), 'disconnected', component.text.openCommand.disconnected],
        [openExecutionResult(
          'stale', 'unavailable', null, 'motor-close',
        ), 'stale', component.text.openCommand.stale],
        [openExecutionResult(
          'unavailable', 'unavailable', 'write-in-progress', 'motor-close',
        ), 'unavailable', component.text.openCommand.alreadyInProgress],
        [openExecutionResult(
          'success', 'not-validated', null, 'motor-close',
        ), 'confirmed', component.text.openCommand.sent],
      ];

      for (const [result, expectedStatus, expectedMessage] of cases) {
        writeExecutionService.nextResult = result;
        await component.requestWidoorClose();
        expect(component.openCommandState.status).toBe(expectedStatus);
        expect(component.openCommandState.message).toBe(expectedMessage);
        expect(component.openCommandState.message).not.toContain(
          'Native CLOSE error',
        );
      }
      expect(component.openCommandState.nativeWriteCompleted).toBeTrue();
      expect(component.openCommandState.confirmationStatus)
        .toBe('not-validated');
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should ignore a late CLOSE result after same-device reconnection',
    async () => {
      alertRole = 'confirm';
      let resolveExecution!: (result: LegacyBleWriteExecutionResult) => void;
      writeExecutionService.execute.and.returnValue(new Promise((resolve) => {
        resolveExecution = resolve;
      }));
      const pending = component.requestWidoorClose();
      await waitForCondition(() =>
        writeExecutionService.execute.calls.count() === 1,
      );

      bleService.connectionGeneration += 1;
      resolveExecution(openExecutionResult(
        'success',
        'confirmed',
        null,
        'motor-close',
      ));
      await pending;

      expect(component.displayedOpenCommandStatus).toBe('stale');
      expect(component.openCommandState.status).toBe('stale');
      expect(component.openCommandState.message)
        .toBe(component.text.openCommand.stale);
      expect(component.commandHistory).toEqual([]);
    },
  );

  it('should keep timed commands active and expose Phase 1 sensitive actions',
    () => {
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelectorAll(
        'ion-button.widoor-command-disabled',
      ).length).toBe(0);
      expect(element.textContent).toContain(
        component.productCommandDisplayLabel(
          component.productCommands.find((command) =>
            command.config.operation === 'motor-open-short-timed')!,
        ),
      );
      expect(element.textContent).not.toContain(
        component.text.widoorCommands.openLongTimed.label,
      );
      expect(element.querySelectorAll(
        'ion-button.widoor-timed-command',
      ).length).toBe(1);
      expect(component.sensitiveActions.map((action) => action.action))
        .toEqual([
          'learning',
          'radar-test-1',
          'radar-test-2',
          'professional-peripheral-lock',
          'reset',
        ]);
      expect(element.textContent).toContain(
        component.text.sensitiveActions.learning,
      );
      expect(element.textContent).toContain(
        component.text.sensitiveActions.reset,
      );
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(alertCreate).not.toHaveBeenCalled();
    },
  );

  it('should execute short timed opening once with its exact limited scope',
    async () => {
      alertRole = 'confirm';
      const config = WIDOOR_COMMAND_UI_CONFIGS[2];
      writeExecutionService.nextResult = openExecutionResult(
        'success',
        'not-validated',
        null,
        'motor-open-short-timed',
      );

      await component.requestWidoorCommand(config);
      fixture.detectChanges();

      expect(alertCreate).not.toHaveBeenCalled();
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.write.payloadHex).toBe('00 21 00 00');
      expect(request.write.operation).toBe('motor-open-short-timed');
      expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
      expect(request.policy?.allowPhysicalValidationAttempt).toEqual({
        operation: 'motor-open-short-timed',
        profile: 'widoor',
      });
      expect(request.policy?.allowWidoorPhase1ImmediateWrite).toBeTrue();
      expect(request.policy?.allowPhase1ReferenceOnly).toBeUndefined();
      expect(request.authorization).toBeNull();
      expect(component.openCommandState.movementStartConfirmed).toBeFalse();
      expect(component.openCommandState.timedCycleValidationStatus)
        .toBe('not-observed');
      expect(component.openCommandState.message).toBe(
        component.text.openCommand.sent,
      );
      expect(component.openCommandState.secondaryMessage).toBeNull();
      expect(component.commandHistory[0]).toEqual(jasmine.objectContaining({
        label: component.text.widoorCommands.openShortTimed.label,
        status: 'confirmed',
        confirmationStatus: 'not-validated',
        isTimedCommand: true,
        timedCycleValidationStatus: 'not-observed',
      }));
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should not expose long timed opening for Widoor', async () => {
    expect(WIDOOR_COMMAND_UI_CONFIGS.some((config) =>
      config.operation === 'motor-open-long-timed',
    )).toBeFalse();
    expect(component.productCommands.some((command) =>
      command.config.operation === 'motor-open-long-timed',
    )).toBeFalse();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should map timed timeout, failure, disconnection and stale results',
    async () => {
      alertRole = 'confirm';
      const config = WIDOOR_COMMAND_UI_CONFIGS[2];
      const cases = [
        ['timeout', 'timeout', 'timeout'],
        ['failed', 'unavailable', 'failed'],
        ['disconnected', 'unavailable', 'disconnected'],
        ['stale', 'unavailable', 'stale'],
      ] as const;

      for (const [resultStatus, confirmation, expectedStatus] of cases) {
        writeExecutionService.nextResult = openExecutionResult(
          resultStatus,
          confirmation,
          resultStatus === 'timeout' ? 'confirmation-timeout' : 'test-error',
          'motor-open-short-timed',
        );
        await component.requestWidoorCommand(config);
        expect(component.openCommandState.status).toBe(expectedStatus);
        expect(component.openCommandState.movementStartConfirmed).toBeFalse();
        expect(component.openCommandState.timedCycleValidationStatus)
          .not.toBe('validated');
        expect(component.openCommandState.message).not.toContain('Native');
      }
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should execute a timed opening without user authorization',
    async () => {
      alertRole = 'backdrop';

      await component.requestWidoorCommand(WIDOOR_COMMAND_UI_CONFIGS[2]);

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.authorization).toBeNull();
      expect(component.openCommandState.status).toBe('confirmed');
      expect(component.commandHistory.length).toBe(1);
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should block another motor command while a timed alert is pending',
    async () => {
      let dismissAlert!: () => void;
      alertCreate.and.callFake(async (options: Record<string, unknown>) => {
        alertOptions.push(options);
        return {
          present: async () => undefined,
          onDidDismiss: () => new Promise<{ role: string }>((resolve) => {
            dismissAlert = () => resolve({ role: 'cancel' });
          }),
        };
      });

      await component.requestWidoorCommand(WIDOOR_COMMAND_UI_CONFIGS[2]);

      expect(alertCreate).not.toHaveBeenCalled();
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.commandHistory[0]).toEqual(jasmine.objectContaining({
        label: component.text.widoorCommands.openShortTimed.label,
      }));
    },
  );

  it('should retain command history internally without rendering it',
    async () => {
      alertRole = 'confirm';
      for (let index = 0; index < 6; index += 1) {
        const config = WIDOOR_COMMAND_UI_CONFIGS[index % 2];
        writeExecutionService.nextResult = openExecutionResult(
          'success',
          'confirmed',
          null,
          config.operation,
        );
        await component.requestWidoorCommand(config);
      }
      fixture.detectChanges();

      expect(component.commandHistory.length).toBe(5);
      expect(component.commandHistory[0].label).toBe(
        component.text.widoorCommands.close.label,
      );
      const details = fixture.nativeElement.querySelector(
        'details.command-history',
      ) as HTMLDetailsElement;
      expect(details).toBeNull();
      expect((fixture.nativeElement as HTMLElement).textContent)
        .not.toContain(component.text.commandHistory.title);

      bleService.disconnect();
      expect(component.commandHistory).toEqual([]);
    },
  );

  it('should clear command history on a new connection generation',
    async () => {
      alertRole = 'confirm';
      await component.requestWidoorOpen();
      expect(component.commandHistory.length).toBe(1);

      bleService.connectionGeneration += 1;

      expect(component.commandHistory).toEqual([]);
    },
  );

  it('should reject rapid duplicate confirmation flows', async () => {
    let dismissAlert!: () => void;
    alertCreate.and.callFake(async (options: Record<string, unknown>) => {
      alertOptions.push(options);
      return {
        present: async () => undefined,
        onDidDismiss: () => new Promise<{ role: string }>((resolve) => {
          dismissAlert = () => resolve({ role: 'cancel' });
        }),
      };
    });

    await component.requestWidoorOpen();
    await component.requestWidoorOpen();

    expect(alertCreate).not.toHaveBeenCalled();
    expect(writeExecutionService.execute).toHaveBeenCalledTimes(2);
  });

  it('should reject rapid duplicate CLOSE confirmation flows', async () => {
    await component.requestWidoorClose();
    await component.requestWidoorClose();

    expect(alertCreate).not.toHaveBeenCalled();
    expect(writeExecutionService.execute).toHaveBeenCalledTimes(2);
  });

  it('should map every guarded OPEN execution result without native text',
    async () => {
      alertRole = 'confirm';
      const cases: readonly [
        LegacyBleWriteExecutionResult,
        string,
        string,
      ][] = [
        [openExecutionResult('success', 'confirmed'), 'confirmed',
          component.text.openCommand.sent],
        [openExecutionResult('timeout', 'timeout'), 'timeout',
          component.text.widoorCommands.open.notConfirmed],
        [openExecutionResult('failed', 'unavailable'), 'failed',
          component.text.openCommand.failed],
        [openExecutionResult('unavailable', 'unavailable'), 'unavailable',
          component.text.openCommand.unavailable],
        [openExecutionResult('disconnected', 'unavailable'), 'disconnected',
          component.text.openCommand.disconnected],
        [openExecutionResult('stale', 'unavailable'), 'stale',
          component.text.openCommand.stale],
        [openExecutionResult(
          'unavailable', 'unavailable', 'write-in-progress',
        ), 'unavailable', component.text.openCommand.alreadyInProgress],
        [openExecutionResult('success', 'not-validated'), 'confirmed',
          component.text.openCommand.sent],
      ];

      for (const [result, expectedStatus, expectedMessage] of cases) {
        writeExecutionService.nextResult = result;
        await component.requestWidoorOpen();
        expect(component.openCommandState.status).toBe(expectedStatus);
        expect(component.openCommandState.message).toBe(expectedMessage);
        expect(component.openCommandState.message).not.toContain(
          'Native OPEN error',
        );
      }
      expect(component.openCommandState.nativeWriteCompleted).toBeTrue();
      expect(component.openCommandState.confirmationStatus)
        .toBe('not-validated');
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should disable OPEN when cached GATT write is unavailable', async () => {
    bleService.getGattCharacteristicProperties.and.returnValue(
      writableGattProperties({ write: false }),
    );
    fixture.detectChanges();

    const openButton = fixture.nativeElement.querySelector(
      'ion-button.widoor-open-command',
    ) as HTMLIonButtonElement | null;
    expect(openButton?.disabled).toBeTrue();
    await component.requestWidoorOpen();
    expect(alertCreate).not.toHaveBeenCalled();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should ignore confirmation after disconnection', async () => {
    bleService.disconnect();
    await component.requestWidoorOpen();

    expect(writeExecutionService.execute).not.toHaveBeenCalled();
    expect(component.displayedOpenCommandStatus).toBe('disconnected');
  });

  it('should reject a late result after same-device reconnection', async () => {
    alertRole = 'confirm';
    let resolveExecution!: (result: LegacyBleWriteExecutionResult) => void;
    writeExecutionService.execute.and.returnValue(new Promise((resolve) => {
      resolveExecution = resolve;
    }));
    const pending = component.requestWidoorOpen();
    await waitForCondition(() =>
      writeExecutionService.execute.calls.count() === 1,
    );

    fixture.detectChanges();
    expect(component.openCommandState.status).toBe('executing');
    expect((fixture.nativeElement.querySelector(
      'ion-button.widoor-open-command',
    ) as HTMLIonButtonElement | null)?.disabled).toBeTrue();

    bleService.connectionGeneration += 1;
    resolveExecution(openExecutionResult('success', 'confirmed'));
    await pending;

    expect(component.displayedOpenCommandStatus).toBe('stale');
    expect(component.displayedOpenCommandMessage)
      .toBe(component.text.openCommand.stale);
  });

  it('should reject a late result after connection to another device',
    async () => {
      alertRole = 'confirm';
      let resolveExecution!: (result: LegacyBleWriteExecutionResult) => void;
      writeExecutionService.execute.and.returnValue(new Promise((resolve) => {
        resolveExecution = resolve;
      }));
      const pending = component.requestWidoorOpen();
      await waitForCondition(() =>
        writeExecutionService.execute.calls.count() === 1,
      );

      bleService.connectedDeviceId = 'device-2';
      bleService.connectionGeneration += 1;
      resolveExecution(openExecutionResult('success', 'confirmed'));
      await pending;

      expect(component.displayedOpenCommandStatus).toBe('stale');
      expect(component.openCommandState.status).toBe('stale');
    },
  );

  it('should invalidate an active command on disconnection', async () => {
    alertRole = 'confirm';
    let resolveExecution!: (result: LegacyBleWriteExecutionResult) => void;
    writeExecutionService.execute.and.returnValue(new Promise((resolve) => {
      resolveExecution = resolve;
    }));
    const pending = component.requestWidoorOpen();
    await waitForCondition(() =>
      writeExecutionService.execute.calls.count() === 1,
    );

    bleService.disconnect();
    resolveExecution(openExecutionResult('success', 'confirmed'));
    await pending;

    expect(component.displayedOpenCommandStatus).toBe('disconnected');
    expect(component.openCommandState.status).toBe('disconnected');
  });

  it('should ignore a late result after page destruction', async () => {
    alertRole = 'confirm';
    let resolveExecution!: (result: LegacyBleWriteExecutionResult) => void;
    writeExecutionService.execute.and.returnValue(new Promise((resolve) => {
      resolveExecution = resolve;
    }));
    const pending = component.requestWidoorOpen();
    await waitForCondition(() =>
      writeExecutionService.execute.calls.count() === 1,
    );

    fixture.destroy();
    resolveExecution(openExecutionResult('success', 'confirmed'));
    await pending;

    expect(component.openCommandState.status).toBe('idle');
    expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
  });

  it('should reject a second refresh while the first load is pending',
    async () => {
      let resolveLoad!: (value: ProductDataLoadResult) => void;
      loadService.loadProductData.and.returnValue(new Promise((resolve) => {
        resolveLoad = resolve;
      }));

      const firstLoad = component.refreshProductData();
      await component.refreshProductData();

      expect(loadService.loadProductData).toHaveBeenCalledTimes(1);
      resolveLoad(completeLoadResult('success'));
      await firstLoad;
    },
  );

  it('should render successful values including zero and false', async () => {
    await component.refreshProductData();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('27/08/2019');
    expect(text).toContain('26580');
    expect(component.datesRows.some((row) =>
      row.key === 'cycles-since-maintenance' &&
      row.label === component.text.dates.cyclesSinceMaintenance,
    )).toBeTrue();
    expect(text).toContain('0');
    expect(text).toContain(component.text.user.rgb);
    expect(text).not.toContain(component.text.user.staticLight);
    expect(text).not.toContain(component.text.user.dynamicLight);
    expect(text).toContain('3.5.3.348');
    expect(text).toContain(component.text.maintenance.initializationCount);
    expect(text).toContain('25');
  });

  it('should preserve partial successes and distinct read failures',
    async () => {
      loadService.nextResult = partialLoadResult();

      await component.refreshProductData();
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent as string;

      expect(component.viewModel.partialSuccess).toBeTrue();
      expect(component.globalStatusLabel)
        .toBe(component.text.states.partialSuccess);
      expect(fixture.nativeElement.querySelector('.product-summary'))
        .toBeNull();
      expect(component.readStatusLabel(component.viewModel.reads.userParameters))
        .toBe(component.text.states.invalid);
      expect(component.readStatusLabel(
        component.viewModel.reads.professionalParameters,
      )).toBe(component.text.errors.characteristicAbsent);
      expect(component.readStatusLabel(component.viewModel.reads.maintenance))
        .toBe(component.text.errors.unknown);
      expect(text).not.toContain('Native maintenance failure');
      expect(text).toContain('3.5.3.348');
    },
  );

  it('should render Widoor Phase 1 settings when parameter reads are unavailable',
    async () => {
      loadService.nextResult = oldWidoorLoadResult();

      await component.refreshProductData();
      component.setActiveMainTab('settings');
      component.setActiveSettingsTab('basic');
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const text = element.textContent as string;

      expect(component.viewModel.reads.userParameters.value).toBeNull();
      expect(component.viewModel.reads.professionalParameters.value).toBeNull();
      expect(component.showUserSpeedControls).toBeTrue();
      expect(component.showUserTimingControls).toBeTrue();
      expect(component.showBasicUserPeripheralControls).toBeTrue();
      expect(component.showNameRoomControls).toBeTrue();
      expect(element.querySelectorAll('ion-range.user-speed-range').length)
        .toBe(2);
      expect(element.querySelector('ion-range.user-timing-range'))
        .not.toBeNull();
      expect(element.querySelector('ion-toggle.user-peripheral-toggle'))
        .not.toBeNull();
      expect(element.querySelector('ion-input.name-room-name-input'))
        .not.toBeNull();
      expect(element.querySelector('ion-select.name-room-select'))
        .not.toBeNull();

      component.setActiveSettingsTab('advanced');
      fixture.detectChanges();

      expect(component.showExpertScalarControls).toBeTrue();
      expect(component.showExpertInputControls).toBeTrue();
      expect(element.querySelector(
        '[data-professional-scalar-field="break-force-at-open"]',
      )).not.toBeNull();
      expect(element.querySelector(
        '[data-professional-scalar-field="near-open-speed"]',
      )).not.toBeNull();
      expect(element.querySelector(
        '[data-professional-scalar-field="near-close-speed"]',
      )).not.toBeNull();
      expect(element.querySelector(
        '[data-professional-input-field="input-1"]',
      )).not.toBeNull();
      expect(element.querySelector(
        '[data-professional-input-field="input-2"]',
      )).not.toBeNull();
      expect(element.querySelectorAll(
        '[data-professional-input-field] ion-toggle.advanced-input-toggle',
      ).length).toBe(2);
      expect(element.querySelector(
        '[data-professional-input-field] ion-select',
      )).toBeNull();
      expect(element.querySelector('.advanced-input-header ion-button'))
        .toBeNull();
      expect(element.querySelector('[data-sensitive-action="learning"]'))
        .not.toBeNull();
      expect(element.querySelector('[data-sensitive-action="reset"]'))
        .not.toBeNull();
      expect(element.querySelector('[data-sensitive-action="radar-test-1"]'))
        .toBeNull();
      expect(element.querySelector('[data-sensitive-action="radar-test-2"]'))
        .toBeNull();
      expect(text).not.toContain('The required GATT characteristic');
      expect(text).toContain('27/08/2019');
      expect(text).toContain(component.text.maintenance.initializationCount);
    },
  );

  it('should keep unavailable Widoor settings visible but block writes without a writable characteristic',
    async () => {
      loadService.nextResult = oldWidoorLoadResult();
      bleService.getGattCharacteristicProperties.and.returnValue(
        writableGattProperties({
          characteristicPresent: false,
          propertiesAvailable: false,
          write: false,
        }),
      );

      await component.refreshProductData();
      component.setActiveMainTab('settings');
      component.setActiveSettingsTab('basic');
      fixture.detectChanges();

      const openSpeed = component.userSpeedControls[0].config;
      component.toggleUserSpeedLock(openSpeed);
      component.setUserSpeedDraftValue(openSpeed, 40);

      expect(component.showUserSpeedControls).toBeTrue();
      expect(component.canApplyUserSpeed(openSpeed)).toBeFalse();
      await component.requestUserSpeedChange(openSpeed);

      component.setActiveSettingsTab('advanced');
      fixture.detectChanges();
      const breakForce = component.expertScalarControls.find(
        (control) => control.config.field === 'break-force-at-open',
      )!.config;
      component.toggleExpertScalarLock(breakForce);
      component.setExpertScalarDraftValue(breakForce, 6);

      expect(component.showExpertScalarControls).toBeTrue();
      expect(component.canApplyExpertScalar(breakForce)).toBeFalse();
      await component.requestExpertScalarChange(breakForce);

      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should keep native errors and UUIDs out of the main presentation',
    async () => {
      loadService.nextResult = oldWidoorLoadResult();

      await component.refreshProductData();
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const details = element.querySelector<HTMLDetailsElement>(
        'details.product-technical-details',
      );

      expect(details).toBeNull();
      expect(element.textContent).not.toContain(
        BLE_UUIDS.userParametersCharacteristic,
      );
      expect(element.textContent).not.toContain(
        'The required GATT characteristic',
      );
    },
  );

  it('should hide raw frames in closed technical details by default',
    async () => {
      await component.refreshProductData();
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const details = element.querySelector<HTMLDetailsElement>(
        'details.product-technical-details',
      );

      expect(details).toBeNull();
      expect(element.textContent).not.toContain(
        component.text.rawFrame,
      );
    },
  );

  it('should format refresh timestamps internally without rendering shell data',
    async () => {
      const timestamp = new Date(2026, 6, 31, 11, 47, 3).getTime();
      loadService.nextResult = {
        ...completeLoadResult('success'),
        completedAt: timestamp,
      };

      await component.refreshProductData();
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent as string;

      expect(formatProductTimestamp(timestamp)).toBe('31/07/2026 11:47:03');
      expect(component.viewModel.lastUpdatedAt).toBe(timestamp);
      expect(text).not.toContain('31/07/2026 11:47:03');
      expect(text).not.toMatch(/\b(?:AM|PM)\b/);
      expect(text).not.toContain(component.text.lastRefresh);
      expect(text).not.toContain('suffixe Phase 1');
    },
  );

  it('should format timestamps without locale-dependent output', () => {
    expect(formatProductTimestamp(
      new Date(2026, 0, 1, 0, 0, 0).getTime(),
    )).toBe('01/01/2026 00:00:00');
    expect(formatProductTimestamp(
      new Date(2026, 11, 9, 8, 5, 4).getTime(),
    )).toBe('09/12/2026 08:05:04');
    expect(formatProductTimestamp(null)).toBeNull();
    expect(formatProductTimestamp(Number.NaN)).toBeNull();
    expect(formatProductTimestamp(Number.MAX_VALUE)).toBeNull();
  });

  it('should map known read errors without exposing native messages', () => {
    const cases: readonly [
      BleReadError['code'],
      Exclude<BleReadStatus, 'success'>,
      string,
    ][] = [
      ['service-absent', 'unavailable', component.text.errors.serviceAbsent],
      ['characteristic-absent', 'unavailable',
        component.text.errors.characteristicAbsent],
      ['not-readable', 'unavailable', component.text.errors.notReadable],
      ['disconnected', 'disconnected', component.text.states.disconnected],
      ['stale', 'stale', component.text.states.stale],
      ['invalid-frame', 'invalid-frame', component.text.states.invalid],
      ['native-read-failed', 'failed', component.text.errors.unknown],
    ];

    for (const [code, status, expected] of cases) {
      const state = failedViewState(code, status);
      expect(component.readStatusLabel(state)).withContext(code).toBe(expected);
      expect(component.readStatusLabel(state)).not.toContain('Native message');
    }
  });

  it('should cancel and clear data on disconnection while ignoring late data',
    async () => {
      let resolveLoad!: (value: ProductDataLoadResult) => void;
      loadService.loadProductData.and.returnValue(new Promise((resolve) => {
        resolveLoad = resolve;
      }));
      const pending = component.refreshProductData();

      bleService.disconnect();
      resolveLoad(completeLoadResult('success'));
      await pending;
      fixture.detectChanges();

      expect(loadService.cancelCurrentLoad).toHaveBeenCalledTimes(1);
      expect(component.viewModel.connectionState).toBe('disconnected');
      expect(component.viewModel.reads.version.value).toBeNull();
      expect(component.viewModel.loading).toBeFalse();
      expect(fixture.nativeElement.querySelector(
        '[aria-labelledby="settings-title"]',
      )).toBeNull();
      expect((fixture.nativeElement.querySelector(
        'ion-button.widoor-open-command',
      ) as HTMLIonButtonElement | null)?.disabled).toBeTrue();
    },
  );

  it('should cancel an active load when the page is destroyed', async () => {
    let resolveLoad!: (value: ProductDataLoadResult) => void;
    loadService.loadProductData.and.returnValue(new Promise((resolve) => {
      resolveLoad = resolve;
    }));
    const pending = component.refreshProductData();

    fixture.destroy();
    resolveLoad(completeLoadResult('success'));
    await pending;

    expect(loadService.cancelCurrentLoad).toHaveBeenCalledTimes(1);
    expect(component.viewModel.reads.version.value).toBeNull();
  });

  it('should ignore a late result after reconnection with the same deviceId',
    async () => {
      let resolveLoad!: (value: ProductDataLoadResult) => void;
      loadService.loadProductData.and.returnValue(new Promise((resolve) => {
        resolveLoad = resolve;
      }));
      const pending = component.refreshProductData();

      bleService.connectionGeneration += 1;
      resolveLoad(completeLoadResult('success'));
      await pending;
      fixture.detectChanges();

      expect(component.pageContextCurrent).toBeFalse();
      expect(component.displayedConnectionState).toBe('stale');
      expect(component.viewModel.reads.version.value).toBeNull();
      expect(fixture.nativeElement.querySelector(
        '[aria-labelledby="information-title"]',
      )).toBeNull();
      expect((fixture.nativeElement.querySelector(
        'ion-button.widoor-open-command',
      ) as HTMLIonButtonElement | null)?.disabled).toBeTrue();
    },
  );

  it('should reject an orchestrator result for another connection context',
    async () => {
      loadService.nextResult = {
        ...completeLoadResult('success'),
        deviceId: 'device-2',
        connectionGeneration: 5,
      };

      await component.refreshProductData();

      expect(component.viewModel.reads.version.value).toBeNull();
      expect(component.viewModel.lastUpdatedAt).toBeNull();
    },
  );

  it('should update read-only motor state from the existing notification flow',
    () => {
      bleService.emitMotorState([0x21, 0, 0, 0, 100, 0, 0x08]);
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const text = fixture.nativeElement.textContent as string;

      expect(text).toContain(component.text.motor.ble);
      expect(text).toContain(component.text.motor.automaticManual);
      expect(text).toContain(component.text.motor.direction);
      expect(text).toContain(component.text.motor.pairing);
      expect(text).toContain('Activé');
      expect(text).toContain('Automatique');
      expect(text).toContain('Antihoraire');
      expect(text).toContain('Appairage');
      expect(element.querySelector(
        '.product-information-row[data-info-row="motor-state-label"]',
      )).toBeNull();
      expect(element.querySelector(
        '.product-information-row[data-info-row="motor-percentage"]',
      )).toBeNull();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should keep each global state internally without rendering shell summary',
    () => {
    expect(component.viewModel.loadStatus).toBeNull();
    expect(fixture.nativeElement.querySelector('.product-summary')).toBeNull();

    component.viewModel = { ...component.viewModel, loading: true };
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(component.text.loading);

    for (const status of [
      'success',
      'partial-success',
      'failed',
      'disconnected',
      'stale',
      'cancelled',
    ] as const) {
      component.viewModel = {
        ...component.viewModel,
        loading: false,
        loadStatus: status,
      };
      const label = component.globalStatusLabel;
      fixture.detectChanges();
      expect(label).withContext(status).toBeTruthy();
      const summary = fixture.nativeElement.querySelector(
        '.product-summary',
      ) as HTMLElement | null;
      expect(summary).withContext(status).toBeNull();
    }
  });

  it('should return to Scan from the toolbar back control',
    async () => {
      const disconnectSpy = spyOn(bleService, 'disconnect')
        .and.callThrough();
      const backButton = fixture.nativeElement.querySelector(
        '.product-back-button',
      ) as HTMLIonButtonElement;

      backButton.click();
      await waitForCondition(() => routerNavigate.calls.count() === 1);

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
      expect(bleService.connectedDeviceId).toBeNull();
      expect(bleService.connectionGeneration).toBe(5);
      expect(productExitState.consume()).toEqual({
        deviceId: 'device-1',
        disconnectStatus: 'success',
      });
    },
  );

  it('should route Android hardware back through the same scoped workflow',
    async () => {
      const disconnectSpy = spyOn(bleService, 'disconnect').and.callThrough();

      component.ionViewWillEnter();
      expect(platform.backButton.subscribeWithPriority)
        .toHaveBeenCalledOnceWith(10, jasmine.any(Function));
      expect(routerOutlet.swipeGesture).toBeFalse();

      await platform.backButton.trigger();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);

      component.ionViewWillLeave();
      expect(routerOutlet.swipeGesture).toBeTrue();
      routerNavigate.calls.reset();
      await platform.backButton.trigger();
      expect(routerNavigate).not.toHaveBeenCalled();
    },
  );

  it('should ignore a second scan return while disconnect is pending',
    async () => {
      let releaseDisconnect!: () => void;
      const pendingDisconnect = new Promise<void>((resolve) => {
        releaseDisconnect = resolve;
      });
      const disconnectSpy = spyOn(bleService, 'disconnect')
        .and.returnValue(pendingDisconnect);

      const firstReturn = component.backToScan();
      await component.backToScan();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(routerNavigate).not.toHaveBeenCalled();

      releaseDisconnect();
      await firstReturn;

      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
    },
  );

  it('should navigate to Scan after a native disconnect failure without hiding the active context',
    async () => {
      const disconnectSpy = spyOn(bleService, 'disconnect')
        .and.rejectWith(new Error('Native disconnect failed.'));

      await component.backToScan();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
      expect(component.returningToScan).toBeFalse();
      expect(component.returnToScanErrorMessage).toBeNull();
      expect(bleService.connectedDeviceId).toBe('device-1');
      expect(productExitState.consume()).toEqual({
        deviceId: 'device-1',
        disconnectStatus: 'failed',
      });
    },
  );

  it('should navigate to Scan when disconnect rejects after a remote disconnection',
    async () => {
      spyOn(bleService, 'disconnect').and.callFake(async () => {
        bleService.connectedDeviceId = null;
        bleService.connectionGeneration += 1;
        throw new Error('Native disconnect failed after remote disconnect.');
      });

      await component.backToScan();

      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
      expect(component.returnToScanErrorMessage).toBeNull();
      expect(bleService.connectedDeviceId).toBeNull();
    },
  );

  it('should cancel an active initial load before returning to Scan',
    async () => {
      component.viewModel = {
        ...component.viewModel,
        loading: true,
      };
      loadService.isLoading = true;

      await component.backToScan();

      expect(loadService.cancelCurrentLoad).toHaveBeenCalled();
      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
    },
  );

  it('should return to Scan through the central disconnect while a write is in progress',
    async () => {
      bleService.isWriting = true;
      const disconnectSpy = spyOn(bleService, 'disconnect')
        .and.callThrough();

      await component.backToScan();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
      expect(bleService.connectedDeviceId).toBeNull();
    },
  );

  it('should flush one pending 400 ms slider write before disconnecting',
    async () => {
      const executionOrder: string[] = [];
      writeExecutionService.execute.and.callFake(async () => {
        executionOrder.push('write');
        return writeExecutionService.nextResult;
      });
      const originalDisconnect = bleService.disconnect.bind(bleService);
      const disconnectSpy = spyOn(bleService, 'disconnect').and.callFake(
        async () => {
          executionOrder.push('disconnect');
          await originalDisconnect();
        },
      );
      await component.refreshProductData();
      const control = component.userSpeedControls[0].config;
      component.toggleUserSpeedLock(control);
      component.stepUserSpeedDraft(control, 1);

      await component.backToScan();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(executionOrder).toEqual(['write', 'disconnect']);

      await new Promise((resolve) => window.setTimeout(resolve, 430));
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
    },
  );

  it('should reject incomplete or forged navigation state', () => {
    expect(isProductPageNavigationState(null)).toBeFalse();
    expect(isProductPageNavigationState({
      ...navigationState('widoor'),
      deviceId: '',
    })).toBeFalse();
    expect(isProductPageNavigationState({
      ...navigationState('widoor'),
      displayName: '   ',
    })).toBeFalse();
    expect(isProductPageNavigationState({
      ...navigationState('widoor'),
      motorState: {},
    })).toBeFalse();
    expect(isProductPageNavigationState({
      ...navigationState('widoor'),
      identificationConfidence: 'weak',
    })).toBeFalse();
    expect(isProductPageNavigationState(navigationState('widoor'))).toBeTrue();
  });

  it('should require the Phase 1 confirmation before Widoor Advanced',
    async () => {
      const content = fixture.debugElement.query(By.directive(IonContent))
        .componentInstance as IonContent;
      const scrollToTop = spyOn(content, 'scrollToTop').and.resolveTo();
      component.setActiveMainTab('settings');
      component.requestActiveSettingsTab('advanced');
      await waitForCondition(() => component.activeSettingsTab === 'basic');

      expect(alertCreate).toHaveBeenCalledTimes(1);
      expect(alertOptions[0]['header'])
        .toBe(component.text.moventivAdvancedAlert.title);
      expect(alertOptions[0]['message'])
        .toBe(component.text.moventivAdvancedAlert.message);
      expect(component.activeSettingsTab).toBe('basic');
      expect(scrollToTop).toHaveBeenCalledTimes(3);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should allow the next Widoor command as soon as its GATT write settles',
    async () => {
      writeExecutionService.nextResult = openExecutionResult(
        'success',
        'not-validated',
        null,
        'motor-close',
      );

      await component.requestWidoorClose();

      expect(component.canExecuteWidoorCommand(
        WIDOOR_COMMAND_UI_CONFIGS[0],
      )).toBeTrue();
      writeExecutionService.nextResult = openExecutionResult(
        'success',
        'not-required',
      );
      await component.requestWidoorOpen();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(2);
      expect(writeExecutionService.execute.calls.allArgs().map(
        ([request]) => request.confirmationPolicy,
      )).toEqual([
        { kind: 'gatt-only' },
        { kind: 'gatt-only' },
      ]);
      expect(component.openCommandState.status).toBe('confirmed');
    },
  );

  it('should open Widoor Advanced after Phase 1 confirmation', async () => {
    alertRole = 'confirm';
    component.setActiveMainTab('settings');
    component.requestActiveSettingsTab('advanced');
    await waitForCondition(() => alertCreate.calls.count() === 1);
    await fixture.whenStable();

    expect(component.activeSettingsTab).toBe('advanced');
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });
});

describe('ProductPage commands for other profiles', () => {
  for (const profile of [
    'moventiv-60',
    'moventiv-80',
    'garline',
  ] as const) {
    it(`should expose ${profile} main commands without auto execution`,
      async () => {
      const bleService = new FakeBleService();
      const writeExecutionService = new FakeBleWriteExecutionService();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: { create: jasmine.createSpy('create') },
          },
          { provide: BleWriteExecutionService, useValue: writeExecutionService },
          {
            provide: ProductDataLoadService,
            useValue: new FakeProductDataLoadService(),
          },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState(profile) },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(ProductPage);
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelector('ion-button.widoor-open-command'))
        .not.toBeNull();
      expect(element.textContent).toContain(
        fixture.componentInstance.text.widoorCommands.open.label,
      );
      expect(element.textContent).toContain(
        fixture.componentInstance.text.widoorCommands.close.label,
      );
      expect(element.textContent).toContain(
        fixture.componentInstance.productCommandDisplayLabel(
          fixture.componentInstance.productCommands.find((command) =>
            command.config.operation === 'motor-open-short-timed')!,
        ),
      );
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
      fixture.destroy();
    });
  }
});

describe('ProductPage direct navigation', () => {
  it('should show a controlled state without constructing assumed data',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      const routerNavigate = jasmine.createSpy('navigate').and.resolveTo(true);
      globalThis.history.replaceState({}, '', globalThis.location.pathname);
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create'),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: new FakeBleWriteExecutionService(),
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'widoor' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => null,
              navigate: routerNavigate,
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.viewModel.connectionState).toBe('invalid-profile');
      expect(component.pageContextCurrent).toBeFalse();
      expect(component.canRefresh).toBeFalse();
      expect(loadService.loadProductData).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector(
        '[aria-labelledby="settings-title"]',
      )).toBeNull();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );
});

describe('ProductPage Moventiv/Garline motor commands', () => {
  for (const profile of ['moventiv-60', 'garline'] as const) {
    it(`should expose ${profile} Phase 1 main motor commands through the ` +
      'Phase 2 write executor', async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      const writeExecutionService = new FakeBleWriteExecutionService();
      writeExecutionService.nextResult = {
        ...openExecutionResult(
          'success',
          'not-validated',
          null,
          'motor-close',
        ),
        profile,
        hardwareValidationStatus: 'phase1-reference-only',
        policyOverrideUsed: true,
      };
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'confirm' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState(profile) },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain(
        component.text.widoorCommands.open.label,
      );
      expect(element.textContent).toContain(
        component.text.widoorCommands.close.label,
      );
      expect(element.textContent).toContain(
        component.productCommandDisplayLabel(
          component.productCommands.find((command) =>
            command.config.operation === 'motor-open-short-timed')!,
        ),
      );
      expect(element.textContent).not.toContain(
        component.text.widoorCommands.openLongTimed.label,
      );

      await component.requestProductCommand(
        MOTOR_COMMAND_UI_CONFIGS[profile][1],
      );

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.profile).toBe(profile);
      expect(request.identification).toEqual({
        profile,
        confidence: 'strong',
      });
      expect(request.write.profile).toBe(profile);
      expect(request.write.operation).toBe('motor-close');
      expect(request.write.serviceUuid).toBe(BLE_UUIDS.shdoService);
      expect(request.write.characteristicUuid)
        .toBe(BLE_UUIDS.motorCommandCharacteristic);
      expect(request.write.payloadHex).toBe('00 30');
      expect(Array.from(request.write.payload)).toEqual([0x00, 0x30]);
      expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
      expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
      expect(alertCreate).not.toHaveBeenCalled();
      if (profile === 'moventiv-60') {
        expect(request.policy).toEqual(jasmine.objectContaining({
          allowMoventivPhase1ImmediateWrite: true,
        }));
      } else {
        expect(request.policy).toEqual(jasmine.objectContaining({
          allowGarlinePhase1ImmediateWrite: true,
        }));
      }
      expect(request.authorization).toBeNull();
      expect(component.openCommandState.status).toBe('confirmed');
      expect(component.openCommandState.confirmationStatus)
        .toBe('not-validated');
      expect(component.openCommandState.message)
        .toBe(component.text.openCommand.sent);
    });
  }

  it('should execute every visible Garline motor command immediately',
    async () => {
      const bleService = new FakeBleService();
      const writeExecutionService = new FakeBleWriteExecutionService();
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'confirm' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          {
            provide: ProductDataLoadService,
            useValue: new FakeProductDataLoadService(),
          },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'garline' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('garline') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      for (const command of MOTOR_COMMAND_UI_CONFIGS.garline) {
        writeExecutionService.nextResult = {
          ...openExecutionResult(
            'success',
            'not-validated',
            null,
            command.operation,
          ),
          profile: 'garline',
          hardwareValidationStatus: 'phase1-reference-only',
          policyOverrideUsed: true,
        };
        await component.requestProductCommand(command);
      }

      expect(MOTOR_COMMAND_UI_CONFIGS.garline.map((command) =>
        command.operation,
      )).toEqual([
        'motor-open',
        'motor-close',
        'motor-open-short-timed',
      ]);
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(3);
      expect(alertCreate).not.toHaveBeenCalled();
      const requests = writeExecutionService.execute.calls.allArgs()
        .map(([request]) => request as LegacyBleWriteRequest);
      expect(requests.map((request) => request.write.operation)).toEqual([
        'motor-open',
        'motor-close',
        'motor-open-short-timed',
      ]);
      expect(requests.every((request) =>
        request.authorization === null &&
        request.policy?.allowGarlinePhase1ImmediateWrite === true &&
        request.policy?.allowPhase1ReferenceOnly === true,
      )).toBeTrue();
    },
  );

  it('should reject non-current or unsupported motor command configs',
    async () => {
      const bleService = new FakeBleService();
      const writeExecutionService = new FakeBleWriteExecutionService();
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'confirm' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          {
            provide: ProductDataLoadService,
            useValue: new FakeProductDataLoadService(),
          },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'moventiv-60' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('moventiv-60') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      expect(MOTOR_COMMAND_UI_CONFIGS['moventiv-60'].some((config) =>
        config.command === 'OPEN_LONG_TIMED',
      )).toBeFalse();

      await component.requestProductCommand(WIDOOR_COMMAND_UI_CONFIGS[3]);

      expect(alertCreate).not.toHaveBeenCalled();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should render the Phase 1 room choice for Widoor and Moventiv',
    async () => {
      for (const profile of ['widoor', 'moventiv-60'] as const) {
        const harness = await createNameRoomProfileHarness(profile);
        harness.component.setActiveMainTab('settings');
        harness.fixture.detectChanges();
        const element = harness.fixture.nativeElement as HTMLElement;
        const roomSelect = element.querySelector<HTMLIonSelectElement>(
          'ion-select.name-room-select',
        );

        expect(roomSelect).withContext(profile).not.toBeNull();
        expect(roomSelect?.value).withContext(profile).toBe('#CHA');
        expect(roomSelect?.label).withContext(profile)
          .toBe(harness.component.text.nameRoomControls.roomLabel);
        expect(roomSelect?.querySelectorAll('ion-select-option').length)
          .withContext(profile).toBe(harness.component.roomOptions.length);
        expect(element.querySelector('.basic-name-room-actions ion-button'))
          .withContext(profile).not.toBeNull();
        harness.fixture.destroy();
      }
    },
  );

  for (const profile of ['moventiv-80', 'garline'] as const) {
    it(`should show the Phase 1 advanced-tab alert for ${profile} and return to basic on cancel`,
      async () => {
      const bleService = new FakeBleService();
      const writeExecutionService = new FakeBleWriteExecutionService();
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'cancel' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          {
            provide: ProductDataLoadService,
            useValue: new FakeProductDataLoadService(),
          },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState(profile) },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      component.setActiveMainTab('settings');
      component.requestActiveSettingsTab('advanced');
      await waitForCondition(() => component.activeSettingsTab === 'basic');

      expect(alertCreate).toHaveBeenCalledTimes(1);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      },
    );
  }
});

describe('ProductPage speed controls for profile variants', () => {
  for (const scenario of [
    {
      profile: 'moventiv-60',
      open: 60,
      close: 70,
      accepted: 50,
      invalid: 49,
      payloadHex: '01 32',
      serviceUuid: BLE_UUIDS.moventivGarlineService,
      range: { min: 50, max: 100 },
    },
    {
      profile: 'moventiv-80',
      open: 60,
      close: 70,
      accepted: 50,
      invalid: 49,
      payloadHex: '01 32',
      serviceUuid: BLE_UUIDS.moventivGarlineService,
      range: { min: 50, max: 100 },
    },
    {
      profile: 'garline',
      open: 10,
      close: 20,
      accepted: 0,
      invalid: -1,
      payloadHex: '01 00',
      serviceUuid: BLE_UUIDS.moventivGarlineService,
      range: { min: 0, max: 100 },
    },
  ] as const) {
    it(`should apply ${scenario.profile} speed ranges and writes`,
      async () => {
        const bleService = new FakeBleService();
        const loadService = new FakeProductDataLoadService();
        loadService.nextResult = completeLoadResult(
          'success',
          scenario.profile,
          userValueWithSpeeds(scenario.open, scenario.close),
        );
        const writeExecutionService = new FakeBleWriteExecutionService();
        writeExecutionService.nextResult = userSpeedExecutionResult(
          scenario.profile,
          'open-speed',
          scenario.payloadHex,
        );

        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
          imports: [ProductPage],
          providers: [
            { provide: BleService, useValue: bleService },
            {
              provide: AlertController,
              useValue: {
                create: jasmine.createSpy('create').and.resolveTo({
                  present: async () => undefined,
                  onDidDismiss: async () => ({ role: 'confirm' }),
                }),
              },
            },
            {
              provide: BleWriteExecutionService,
              useValue: writeExecutionService,
            },
            { provide: ProductDataLoadService, useValue: loadService },
            { provide: ProductDetection, useClass: ProductDetection },
            {
              provide: ActivatedRoute,
              useValue: {
                snapshot: { data: { profile: scenario.profile } },
              },
            },
            {
              provide: Router,
              useValue: {
                getCurrentNavigation: () => ({
                  extras: { state: navigationState(scenario.profile) },
                }),
                navigate: jasmine.createSpy('navigate').and.resolveTo(true),
              },
            },
          ],
        }).compileComponents();

        const fixture = TestBed.createComponent(ProductPage);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        await component.refreshProductData();
        const openControl = component.userSpeedControls[0].config;

        expect(openControl.range).toEqual(scenario.range);
        expect(component.currentUserSpeedValue(openControl))
          .toBe(scenario.open);

        component.setUserSpeedDraftValue(openControl, scenario.invalid);
        await component.requestUserSpeedChange(openControl);
        expect(writeExecutionService.execute).not.toHaveBeenCalled();

        component.setUserSpeedDraftValue(openControl, scenario.accepted);
        await component.requestUserSpeedChange(openControl);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.profile).toBe(scenario.profile);
        expect(request.write.operation).toBe('open-speed');
        expect(request.write.serviceUuid).toBe(scenario.serviceUuid);
        expect(request.write.characteristicUuid)
          .toBe(BLE_UUIDS.userParametersCharacteristic);
        expect(request.write.payloadHex).toBe(scenario.payloadHex);
        if (scenario.profile === 'garline') {
          expect(request.policy).toEqual(jasmine.objectContaining({
            allowGarlinePhase1ImmediateWrite: true,
          }));
          expect(request.authorization).toBeNull();
        }
      },
    );
  }

  it('should keep Moventiv settings visible when user and pro reads are unavailable',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = moventivGarlineUnavailableParameterLoadResult(
        'moventiv-60',
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'confirm' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'moventiv-60' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('moventiv-60') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();

      expect(component.showUserSpeedControls).toBeTrue();
      expect(component.showUserTimingControls).toBeTrue();
      expect(component.showUserPeripheralControls).toBeTrue();
      expect(component.showWeightRangeControls).toBeTrue();
      expect(component.showExpertInputControls).toBeTrue();
      expect(component.showExpertScalarControls).toBeTrue();
      expect(component.currentUserTimingValue(
        component.userTimingControls[0].config,
      )).toBe(1);
      expect(component.canChangeExpertInput(
        component.expertInputControls[0].config,
        'radar',
      )).toBeFalse();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should keep Garline Phase 1 settings visible when user and pro reads are unavailable',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = moventivGarlineUnavailableParameterLoadResult(
        'garline',
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'confirm' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'garline' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('garline') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();

      expect(component.showUserSpeedControls).toBeTrue();
      expect(component.showUserTimingControls).toBeTrue();
      expect(component.showUserPeripheralControls).toBeTrue();
      expect(component.showExpertScalarControls).toBeTrue();
      expect(component.showExpertAccessPrompt).toBeTrue();
      expect(component.showLockModeControls).toBeFalse();
      expect(component.showWeightRangeControls).toBeFalse();
      expect(component.showExpertInputControls).toBeFalse();
      expect(component.currentUserTimingValue(
        component.userTimingControls[0].config,
      )).toBe(1);
      expect(component.userTimingControls.map((control) =>
        control.config.field,
      )).toEqual(['short-timing', 'long-timing']);
      expect(component.visibleExpertScalarControls.map((control) =>
        control.config.field,
      )).toEqual(['near-open-speed', 'near-close-speed']);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should write Moventiv speed on release and not create a false authorization',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = completeLoadResult(
        'success',
        'moventiv-60',
        userValueWithSpeeds(60, 70),
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      writeExecutionService.nextResult = userSpeedExecutionResult(
        'moventiv-60',
        'open-speed',
        '01 3d',
      );

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create').and.resolveTo({
                present: async () => undefined,
                onDidDismiss: async () => ({ role: 'confirm' }),
              }),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'moventiv-60' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('moventiv-60') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();
      const control = component.userSpeedControls[0].config;

      component.toggleUserSpeedLock(control);
      component.setUserSpeedDraftValue(control, 61);
      component.onUserSpeedSliderReleased(control);
      await waitForCondition(() =>
        writeExecutionService.execute.calls.count() === 1,
      );

      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.authorization).toBeNull();
      expect(request.policy).toEqual(jasmine.objectContaining({
        allowMoventivPhase1ImmediateWrite: true,
      }));
      expect(component.showApplyButtonForProfile('moventiv-60')).toBeFalse();
      expect(component.showApplyButtonForProfile('garline')).toBeFalse();
    },
  );

  it('should write Moventiv +/- slider changes after the Phase 1 delay',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = completeLoadResult(
        'success',
        'moventiv-80',
        userValueWithSpeeds(60, 70),
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      writeExecutionService.nextResult = userSpeedExecutionResult(
        'moventiv-80',
        'open-speed',
        '01 3d',
      );

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create').and.resolveTo({
                present: async () => undefined,
                onDidDismiss: async () => ({ role: 'confirm' }),
              }),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'moventiv-80' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('moventiv-80') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();
      const control = component.userSpeedControls[0].config;

      component.toggleUserSpeedLock(control);
      component.stepUserSpeedDraft(control, 1);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      await new Promise((resolve) => window.setTimeout(resolve, 430));

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
    },
  );
});

describe('ProductPage timing controls for profile variants', () => {
  for (const scenario of [
    {
      profile: 'moventiv-60',
      controls: ['short-timing'],
      short: 4,
      long: 10,
      accepted: 0,
      invalid: 61,
      operation: 'short-timing',
      payloadHex: '03 00',
      serviceUuid: BLE_UUIDS.moventivGarlineService,
      range: { min: 0, max: 60 },
      unit: 's',
    },
    {
      profile: 'moventiv-80',
      controls: ['short-timing'],
      short: 4,
      long: 10,
      accepted: 60,
      invalid: -1,
      operation: 'short-timing',
      payloadHex: '03 3c',
      serviceUuid: BLE_UUIDS.moventivGarlineService,
      range: { min: 0, max: 60 },
      unit: 's',
    },
    {
      profile: 'garline',
      controls: ['short-timing', 'long-timing'],
      short: 4,
      long: 10,
      accepted: 30,
      invalid: 0,
      operation: 'long-timing',
      payloadHex: '04 1e',
      serviceUuid: BLE_UUIDS.moventivGarlineService,
      range: { min: 1, max: 60 },
      unit: 'min',
    },
  ] as const) {
    it(`should apply ${scenario.profile} timing ranges and writes`,
      async () => {
        const bleService = new FakeBleService();
        const loadService = new FakeProductDataLoadService();
        loadService.nextResult = completeLoadResult(
          'success',
          scenario.profile,
          userValueWithTimings(scenario.short, scenario.long),
        );
        const writeExecutionService = new FakeBleWriteExecutionService();
        writeExecutionService.nextResult = userTimingExecutionResult(
          scenario.profile,
          scenario.operation,
          scenario.payloadHex,
        );

        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
          imports: [ProductPage],
          providers: [
            { provide: BleService, useValue: bleService },
            {
              provide: AlertController,
              useValue: {
                create: jasmine.createSpy('create').and.resolveTo({
                  present: async () => undefined,
                  onDidDismiss: async () => ({ role: 'confirm' }),
                }),
              },
            },
            {
              provide: BleWriteExecutionService,
              useValue: writeExecutionService,
            },
            { provide: ProductDataLoadService, useValue: loadService },
            { provide: ProductDetection, useClass: ProductDetection },
            {
              provide: ActivatedRoute,
              useValue: {
                snapshot: { data: { profile: scenario.profile } },
              },
            },
            {
              provide: Router,
              useValue: {
                getCurrentNavigation: () => ({
                  extras: { state: navigationState(scenario.profile) },
                }),
                navigate: jasmine.createSpy('navigate').and.resolveTo(true),
              },
            },
          ],
        }).compileComponents();

        const fixture = TestBed.createComponent(ProductPage);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        await component.refreshProductData();
        const timingControl = component.userTimingControls.find((control) =>
          control.config.field === scenario.operation,
        )?.config;

        expect(component.userTimingControls.map((control) =>
          control.config.field,
        )).toEqual(scenario.controls);
        expect(timingControl).toBeDefined();
        expect(timingControl?.range).toEqual(scenario.range);
        expect(timingControl?.unit).toBe(scenario.unit);
        expect(component.currentUserTimingValue(timingControl!))
          .toBe(scenario.operation === 'short-timing'
            ? scenario.short
            : scenario.long);

        component.setUserTimingDraftValue(timingControl!, scenario.invalid);
        await component.requestUserTimingChange(timingControl!);
        expect(writeExecutionService.execute).not.toHaveBeenCalled();

        component.setUserTimingDraftValue(timingControl!, scenario.accepted);
        await component.requestUserTimingChange(timingControl!);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.profile).toBe(scenario.profile);
        expect(request.write.operation).toBe(scenario.operation);
        expect(request.write.serviceUuid).toBe(scenario.serviceUuid);
        expect(request.write.characteristicUuid)
          .toBe(BLE_UUIDS.userParametersCharacteristic);
        expect(request.write.payloadHex).toBe(scenario.payloadHex);
        if (scenario.profile === 'garline') {
          expect(request.policy).toEqual(jasmine.objectContaining({
            allowGarlinePhase1ImmediateWrite: true,
          }));
          expect(request.authorization).toBeNull();
        }
      },
    );
  }

  it('should keep Garline short and long timing drafts independent',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = completeLoadResult(
        'success',
        'garline',
        userValueWithTimings(4, 10),
      );
      const writeExecutionService = new FakeBleWriteExecutionService();

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create').and.resolveTo({
                present: async () => undefined,
                onDidDismiss: async () => ({ role: 'confirm' }),
              }),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'garline' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('garline') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();
      const shortControl = component.userTimingControls[0].config;
      const longControl = component.userTimingControls[1].config;

      component.setUserTimingDraftValue(longControl, 30);

      expect(component.userTimingDraftValue(shortControl)).toBe(4);
      expect(component.userTimingDraftValue(longControl)).toBe(30);
      expect(component.canApplyUserTiming(shortControl)).toBeFalse();
      expect(component.canApplyUserTiming(longControl)).toBeTrue();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );
});

describe('ProductPage user lighting controls for profile variants', () => {
  for (const scenario of [
    {
      profile: 'moventiv-60',
      current: {
        staticLight: true,
        dynamicLight: true,
        rgbIndicator: false,
      },
      controls: ['static-light', 'dynamic-light', 'rgb'],
      field: 'dynamic-light',
      checked: false,
      operation: 'dynamic-light',
      payloadHex: '05 07 02',
      payload: [0x05, 0x07, 0x02],
    },
    {
      profile: 'garline',
      current: {
        staticLight: false,
        dynamicLight: true,
        rgbIndicator: true,
      },
      controls: ['static-light', 'dynamic-light', 'rgb'],
      field: 'static-light',
      checked: true,
      operation: 'static-light',
      payloadHex: '05 06 01',
      payload: [0x05, 0x06, 0x01],
    },
  ] as const) {
    it(`should apply ${scenario.profile} user lighting writes`,
      async () => {
        const bleService = new FakeBleService();
        const loadService = new FakeProductDataLoadService();
        loadService.nextResult = completeLoadResult(
          'success',
          scenario.profile,
          userValueWithPeripherals(scenario.current),
        );
        const writeExecutionService = new FakeBleWriteExecutionService();
        writeExecutionService.nextResult = userPeripheralExecutionResult(
          scenario.profile,
          scenario.operation,
          scenario.payloadHex,
        );

        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
          imports: [ProductPage],
          providers: [
            { provide: BleService, useValue: bleService },
            {
              provide: AlertController,
              useValue: {
                create: jasmine.createSpy('create').and.resolveTo({
                  present: async () => undefined,
                  onDidDismiss: async () => ({ role: 'confirm' }),
                }),
              },
            },
            {
              provide: BleWriteExecutionService,
              useValue: writeExecutionService,
            },
            { provide: ProductDataLoadService, useValue: loadService },
            { provide: ProductDetection, useClass: ProductDetection },
            {
              provide: ActivatedRoute,
              useValue: {
                snapshot: { data: { profile: scenario.profile } },
              },
            },
            {
              provide: Router,
              useValue: {
                getCurrentNavigation: () => ({
                  extras: { state: navigationState(scenario.profile) },
                }),
                navigate: jasmine.createSpy('navigate').and.resolveTo(true),
              },
            },
          ],
        }).compileComponents();

        const fixture = TestBed.createComponent(ProductPage);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        await component.refreshProductData();
        fixture.detectChanges();
        const control = component.userPeripheralControls.find(
          (candidate) => candidate.config.field === scenario.field,
        )?.config;

        expect(component.showUserPeripheralControls).toBeTrue();
        expect(component.userPeripheralControls.map((candidate) =>
          candidate.config.field,
        )).toEqual(scenario.controls);
        expect(control).toBeDefined();
        await component.requestUserPeripheralChange(
          control!,
          scenario.checked,
        );

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.profile).toBe(scenario.profile);
        expect(request.write.operation).toBe(scenario.operation);
        expect(request.write.serviceUuid)
          .toBe(BLE_UUIDS.moventivGarlineService);
        expect(request.write.characteristicUuid)
          .toBe(BLE_UUIDS.userParametersCharacteristic);
        expect(request.write.payloadHex).toBe(scenario.payloadHex);
        expect(Array.from(request.write.payload)).toEqual(scenario.payload);
        expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
        expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
        if (scenario.profile === 'garline') {
          expect(request.policy).toEqual(jasmine.objectContaining({
            allowGarlinePhase1ImmediateWrite: true,
          }));
          expect(request.authorization).toBeNull();
        }
        expect(component.userPeripheralWriteState.status).toBe('sent');
      },
    );
  }
});

describe('ProductPage Phase 1 commands tab presentation', () => {
  for (const scenario of [
    {
      profile: 'widoor',
      commands: [
        'motor-open',
        'motor-close',
        'motor-open-short-timed',
      ],
      commandLighting: [],
      basicLighting: ['rgb'],
      locks: [],
      timedAssetCount: 1,
    },
    {
      profile: 'moventiv-60',
      commands: [
        'motor-open',
        'motor-close',
        'motor-open-short-timed',
      ],
      commandLighting: ['static-light'],
      basicLighting: ['dynamic-light', 'rgb'],
      locks: ['locked-closed'],
      timedAssetCount: 1,
    },
    {
      profile: 'moventiv-80',
      commands: [
        'motor-open',
        'motor-close',
        'motor-open-short-timed',
      ],
      commandLighting: ['static-light'],
      basicLighting: ['dynamic-light', 'rgb'],
      locks: ['locked-closed'],
      timedAssetCount: 1,
    },
    {
      profile: 'garline',
      commands: [
        'motor-open',
        'motor-close',
        'motor-open-short-timed',
      ],
      commandLighting: ['static-light'],
      basicLighting: ['dynamic-light', 'rgb'],
      locks: [],
      timedAssetCount: 1,
    },
  ] as const) {
    it(`should render Phase 1 command affordances for ${scenario.profile}`,
      async () => {
        const {
          fixture,
          component,
          writeExecutionService,
          bleService,
        } = await createProductCommandsUiPage(scenario.profile);
        const element = fixture.nativeElement as HTMLElement;

        expect(component.activeMainTab).toBe('commands');
        expect(component.productCommands.map((command) =>
          command.config.operation,
        )).toEqual([...scenario.commands]);
        expect(component.lockModeControls.map((control) =>
          control.config.mode,
        )).toEqual([...scenario.locks]);
        expect(component.commandUserPeripheralControls.map((control) =>
          control.config.field,
        )).toEqual([...scenario.commandLighting]);
        expect(component.basicUserPeripheralControls.map((control) =>
          control.config.field,
        )).toEqual([...scenario.basicLighting]);

        expect(element.querySelector<HTMLImageElement>(
          '.widoor-open-command img',
        )?.getAttribute('src')).toBe('assets/img/icon_command_open.svg');
        expect(element.querySelector<HTMLImageElement>(
          '.widoor-close-command img',
        )?.getAttribute('src')).toBe('assets/img/icon_command_close.svg');
        expect(Array.from(element.querySelectorAll<HTMLImageElement>(
          '.widoor-timed-command img',
        )).map((image) => image.getAttribute('src'))).toEqual(
          Array.from(
            { length: scenario.timedAssetCount },
            () => 'assets/img/icon_command_openThenClose.svg',
          ),
        );
        expect(
          element.querySelectorAll(
            '.user-peripheral-command-controls .user-peripheral-toggle',
          ).length,
        ).toBe(scenario.commandLighting.length);
        expect(element.querySelectorAll(
          '.lock-mode-controls .lock-mode-toggle',
        ).length).toBe(scenario.locks.length);
        expect(element.textContent).not.toContain(
          component.text.lockModeControls.lockedOpen.label,
        );
        if (scenario.profile === 'widoor' || scenario.profile === 'garline') {
          expect(element.querySelector('.lock-mode-controls')).toBeNull();
          expect(element.textContent).not.toContain(
            component.text.lockModeControls.lockedClosed.label,
          );
        }
        if (scenario.profile === 'moventiv-60' ||
            scenario.profile === 'moventiv-80') {
          expect(element.querySelector('.phase1-mov-close-lock-command'))
            .not.toBeNull();
          expect(element.textContent).not.toContain(
            component.text.lockModeControls.title,
          );
          expect(element.textContent).toContain(
            component.text.lockModeControls.lockedClosed.label,
          );
        }
        if (scenario.commandLighting.length > 0) {
          const commandLightIcon = element.querySelector<HTMLElement>(
            '.user-peripheral-command-controls .product-light-icon',
          );
          expect(commandLightIcon?.getAttribute('data-light-state'))
            .toBe('on');
          expect(commandLightIcon?.classList)
            .toContain('peripheral-icon-active');
        }
        const commandsSection = element.querySelector<HTMLElement>(
          '[aria-labelledby="commands-title"]',
        );
        expect(commandsSection).not.toBeNull();
        expect(commandsSection?.querySelector('.command-history')).toBeNull();
        expect(commandsSection?.querySelector('.command-warning')).toBeNull();
        expect(commandsSection?.querySelector('.command-state')).toBeNull();
        expect(commandsSection?.querySelector('.command-secondary-message'))
          .toBeNull();
        expect(commandsSection?.textContent).not.toContain(
          component.text.commandHistory.title,
        );
        expect(commandsSection?.textContent).not.toContain(
          component.text.widoorCommands.warning,
        );
        expect(commandsSection?.textContent).not.toContain('payload');
        expect(commandsSection?.textContent).not.toContain('Code :');
        expect(writeExecutionService.execute).not.toHaveBeenCalled();
        expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
      },
    );
  }

  it('should keep product command clicks routed through the existing handler',
    async () => {
      const { fixture, component, writeExecutionService } =
        await createProductCommandsUiPage('moventiv-60');
      const element = fixture.nativeElement as HTMLElement;
      const openButton = element
        .querySelector<HTMLIonButtonElement>('ion-button.widoor-open-command');
      const requestProductCommand = spyOn(component, 'requestProductCommand')
        .and.resolveTo();

      openButton?.click();
      fixture.detectChanges();

      expect(requestProductCommand).toHaveBeenCalledOnceWith(
        component.productCommands[0].config,
      );
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  for (const scenario of [
    {
      profile: 'widoor',
      field: 'rgb',
      checked: true,
      operation: 'rgb-indicator',
      payloadHex: '05 03 01',
      iconSelector: '.basic-settings-panel .product-light-icon',
      settingsTab: true,
    },
    {
      profile: 'moventiv-60',
      field: 'static-light',
      checked: false,
      operation: 'static-light',
      payloadHex: '05 06 00',
      iconSelector: '.user-peripheral-command-controls .product-light-icon',
      settingsTab: false,
    },
    {
      profile: 'garline',
      field: 'static-light',
      checked: false,
      operation: 'static-light',
      payloadHex: '05 06 00',
      iconSelector: '.user-peripheral-command-controls .product-light-icon',
      settingsTab: false,
    },
  ] as const) {
    it(`should immediately mirror the ${scenario.profile} light toggle`,
      async () => {
        const { fixture, component, writeExecutionService } =
          await createProductCommandsUiPage(scenario.profile);
        const control = component.userPeripheralControls.find((candidate) =>
          candidate.config.field === scenario.field,
        )!.config;
        const result = userPeripheralExecutionResult(
          scenario.profile,
          scenario.operation,
          scenario.payloadHex,
        );
        let resolveWrite!: (
          value: LegacyBleWriteExecutionResult,
        ) => void;
        writeExecutionService.execute.and.returnValue(
          new Promise<LegacyBleWriteExecutionResult>((resolve) => {
            resolveWrite = resolve;
          }),
        );
        if (scenario.settingsTab) {
          component.setActiveMainTab('settings');
          fixture.detectChanges();
        }

        const pending = component.requestUserPeripheralChange(
          control,
          scenario.checked,
        );
        fixture.detectChanges();

        const icon = (fixture.nativeElement as HTMLElement)
          .querySelector<HTMLElement>(scenario.iconSelector);
        expect(component.userPeripheralWriteState.status).toBe('executing');
        expect(component.currentUserPeripheralState(control))
          .toBe(scenario.checked);
        expect(icon?.getAttribute('data-light-state'))
          .toBe(scenario.checked ? 'on' : 'off');
        expect(icon?.classList.contains('peripheral-icon-active'))
          .toBe(scenario.checked);

        resolveWrite(result);
        await pending;
        fixture.detectChanges();

        expect(component.userPeripheralWriteState.status).toBe('sent');
        expect(component.currentUserPeripheralState(control))
          .toBe(scenario.checked);
      },
    );
  }

  it('should show the Phase 1 information only when Moventiv close lock is enabled',
    async () => {
      const { fixture, component, writeExecutionService } =
        await createProductCommandsUiPage('moventiv-60');
      const alertCreate = TestBed.inject(AlertController).create as jasmine.Spy;
      const closeControl = component.lockModeControls[0].config;
      writeExecutionService.nextResult = lockModeExecutionResult(
        'moventiv-60',
        '00 02',
      );

      expect(alertCreate).not.toHaveBeenCalled();
      await component.requestLockModeChange(closeControl, true);
      await fixture.whenStable();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(alertCreate).toHaveBeenCalledTimes(1);
      expect(alertCreate).toHaveBeenCalledWith({
        header: component.text.moventivCloseLockAlert.title,
        message: component.text.moventivCloseLockAlert.message,
        buttons: [component.text.moventivCloseLockAlert.ok],
      });
    },
  );

  it('should immediately mirror both Moventiv close-lock transitions',
    async () => {
      const { fixture, component, writeExecutionService } =
        await createProductCommandsUiPage('moventiv-60');
      const control = component.lockModeControls[0].config;
      let resolveWrite!: (value: LegacyBleWriteExecutionResult) => void;
      writeExecutionService.execute.and.callFake(() =>
        new Promise<LegacyBleWriteExecutionResult>((resolve) => {
          resolveWrite = resolve;
        }),
      );
      const icon = () => (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLElement>(
          '.phase1-mov-close-lock-command .product-lock-state-icon',
        );

      const enable = component.requestLockModeChange(control, true);
      fixture.detectChanges();

      expect(component.lockModeWriteState.status).toBe('executing');
      expect(component.isLockModeActive(control)).toBeTrue();
      expect(icon()?.classList).toContain('ai-lock-close');
      expect(icon()?.classList).not.toContain('ai-lock-open');
      expect(getComputedStyle(icon()!).backgroundImage)
        .toContain('icon_padlock_closed.svg');

      resolveWrite(lockModeExecutionResult('moventiv-60', '00 02'));
      await enable;

      const disable = component.requestLockModeChange(control, false);
      fixture.detectChanges();

      expect(component.lockModeWriteState.status).toBe('executing');
      expect(component.isLockModeActive(control)).toBeFalse();
      expect(icon()?.classList).toContain('ai-lock-open');
      expect(icon()?.classList).not.toContain('ai-lock-close');
      expect(getComputedStyle(icon()!).backgroundImage)
        .toContain('icon_padlock_open.svg');

      resolveWrite(lockModeExecutionResult('moventiv-60', '00 00'));
      await disable;
      expect(component.lockModeWriteState.status).toBe('sent');
    },
  );

  it('should restore the Moventiv close-lock icon after a failed write',
    async () => {
      const { fixture, component, writeExecutionService } =
        await createProductCommandsUiPage('moventiv-60');
      const control = component.lockModeControls[0].config;
      writeExecutionService.nextResult = {
        ...lockModeExecutionResult('moventiv-60', '00 02'),
        status: 'failed',
        nativeWriteCompleted: false,
        error: { code: 'native-write-failed', message: 'Native failure' },
      };

      await component.requestLockModeChange(control, true);
      fixture.detectChanges();

      expect(component.lockModeWriteState.status).toBe('failed');
      expect(component.isLockModeActive(control)).toBeFalse();
      expect((fixture.nativeElement as HTMLElement)
        .querySelector<HTMLElement>(
          '.phase1-mov-close-lock-command .product-lock-state-icon',
        )?.classList).toContain('ai-lock-open');
    },
  );

  for (const profile of ['moventiv-60', 'garline'] as const) {
    it(`should keep ${profile} motor buttons visually stable during a switch write`,
      async () => {
        const { fixture, component } =
          await createProductCommandsUiPage(profile);
        component.userPeripheralWriteState = Object.freeze({
          status: 'executing',
          field: 'static-light',
          message: component.text.userPeripheralControls.executing,
        });
        fixture.detectChanges();

        const buttons = Array.from(
          (fixture.nativeElement as HTMLElement)
            .querySelectorAll<HTMLIonButtonElement>(
            'ion-button.cmd-motor',
          ),
        );
        expect(component.commandSwitchWriteInProgress).toBeTrue();
        expect(buttons.length).toBeGreaterThan(0);
        expect(buttons.every((button) => button.disabled)).toBeTrue();
        expect(buttons.every((button) =>
          button.classList.contains('command-switch-write-pending'),
        )).toBeTrue();
        expect(buttons.every((button) =>
          getComputedStyle(button).opacity === '1',
        )).toBeTrue();
      },
    );
  }

  for (const profile of ['moventiv-60', 'moventiv-80'] as const) {
    it(`should write only the Phase 1 close lock command for ${profile}`,
      async () => {
        const { fixture, component, writeExecutionService, loadService } =
          await createProductCommandsUiPage(profile);
        const closeControl = component.lockModeControls[0].config;

        expect(component.lockModeControls.map((control) =>
          control.config.mode,
        )).toEqual(['locked-closed']);
        expect(component.showLockModeControls).toBeTrue();
        expect(component.moventivCloseLockControl?.config)
          .toBe(closeControl);
        expect(fixture.nativeElement.textContent).not.toContain(
          component.text.lockModeControls.lockedOpen.label,
        );

        for (const transition of [
          {
            checked: true,
            payloadHex: '00 02',
            payload: [0x00, 0x02],
            current: 'none',
          },
          {
            checked: false,
            payloadHex: '00 00',
            payload: [0x00, 0x00],
            current: 'locked-closed',
          },
        ] as const) {
          loadService.nextResult = completeLoadResult(
            'success',
            profile,
            userValueWithLockMode(transition.current),
          );
          writeExecutionService.nextResult = lockModeExecutionResult(
            profile,
            transition.payloadHex,
          );
          writeExecutionService.execute.calls.reset();
          await component.refreshProductData();
          fixture.detectChanges();

          expect((fixture.nativeElement as HTMLElement)
            .querySelector<HTMLElement>(
              '.phase1-mov-close-lock-command .product-lock-state-icon',
            )?.classList.contains(
              transition.current === 'locked-closed'
                ? 'ai-lock-close'
                : 'ai-lock-open',
            )).toBeTrue();

          await component.requestLockModeChange(
            closeControl,
            transition.checked,
          );

          expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
          const request = writeExecutionService.execute.calls.mostRecent()
            .args[0] as LegacyBleWriteRequest;
          expect(request.profile).toBe(profile);
          expect(request.write.operation).toBe('lock-mode');
          expect(request.write.serviceUuid)
            .toBe(BLE_UUIDS.moventivGarlineService);
          expect(request.write.characteristicUuid)
            .toBe(BLE_UUIDS.userParametersCharacteristic);
          expect(request.write.payloadHex).toBe(transition.payloadHex);
          expect(Array.from(request.write.payload))
            .toEqual(transition.payload);
          expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
          expect(request.policy).toEqual(jasmine.objectContaining({
            allowMoventivPhase1ImmediateWrite: true,
          }));
          expect(request.authorization).toBeNull();
          expect(component.lockModeWriteState.status).toBe('sent');
        }
      },
    );
  }

  for (const scenario of [
    {
      profile: 'widoor',
      basicLighting: ['rgb'],
      timings: ['short-timing'],
      basicWeight: false,
      advancedWeight: false,
    },
    {
      profile: 'moventiv-60',
      basicLighting: ['dynamic-light', 'rgb'],
      timings: ['short-timing'],
      basicWeight: false,
      advancedWeight: true,
    },
    {
      profile: 'moventiv-80',
      basicLighting: ['dynamic-light', 'rgb'],
      timings: ['short-timing'],
      basicWeight: false,
      advancedWeight: true,
    },
    {
      profile: 'garline',
      basicLighting: ['dynamic-light', 'rgb'],
      timings: ['short-timing', 'long-timing'],
      basicWeight: false,
      advancedWeight: false,
    },
  ] as const) {
    it(`should render Phase 1 basic settings affordances for ${scenario.profile}`,
      async () => {
        const { fixture, component, writeExecutionService, bleService } =
          await createProductCommandsUiPage(scenario.profile);

        component.setActiveMainTab('settings');
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const basicPanel = element.querySelector<HTMLElement>(
          '.basic-settings-panel',
        );

        expect(basicPanel).not.toBeNull();
        expect(component.userSpeedControls.map((control) =>
          control.config.field,
        )).toEqual(['open-speed', 'close-speed']);
        expect(component.userTimingControls.map((control) =>
          control.config.field,
        )).toEqual([...scenario.timings]);
        expect(component.basicUserPeripheralControls.map((control) =>
          control.config.field,
        )).toEqual([...scenario.basicLighting]);
        expect(component.showBasicWeightRangeControls)
          .toBe(scenario.basicWeight);
        expect(component.showAdvancedWeightRangeControls)
          .toBe(scenario.advancedWeight);

        const basicText = basicPanel?.textContent ?? '';
        expect(basicPanel?.querySelector('.read-state')).toBeNull();
        expect(basicPanel?.querySelector('.read-state-detail')).toBeNull();
        expect(basicPanel?.querySelector('.basic-technical-details')).toBeNull();
        expect(basicText).not.toContain(component.text.readonlyNotice);
        expect(basicText).not.toContain(component.text.technicalDetails);
        expect(basicText).not.toContain(component.text.rawFrame);
        expect(basicText).not.toContain(component.text.serviceUuid);
        expect(basicText).not.toContain(component.text.characteristicUuid);
        expect(basicText).not.toContain(
          component.text.errors.characteristicAbsent,
        );

        expect(basicPanel?.querySelector<HTMLImageElement>(
          'img[src="assets/img/icon_speed.svg"]',
        )).not.toBeNull();
        expect(basicPanel?.querySelector<HTMLImageElement>(
          'img[src="assets/img/icon_delay.svg"]',
        )).not.toBeNull();
        expect(basicPanel?.querySelector<HTMLImageElement>(
          'img[src="assets/img/icon_room_other.svg"]',
        )).not.toBeNull();
        expect(basicPanel?.querySelectorAll<HTMLElement>(
          '.product-light-icon[data-light-state="off"]',
        ).length).toBe(scenario.basicLighting.length);
        expect(basicPanel?.querySelector(
          '.peripheral-state-icon.peripheral-icon-active',
        )).toBeNull();
        const basicToggleLabels = Array.from(
          basicPanel?.querySelectorAll<HTMLElement>(
            '.basic-toggle-row ion-label',
          ) ?? [],
        ).map((label) => label.textContent?.trim() ?? '');
        expect(basicToggleLabels).not.toContain(
          component.text.user.staticLight,
        );

        expect(writeExecutionService.execute).not.toHaveBeenCalled();
        expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
      },
    );
  }

  for (const scenario of [
    {
      profile: 'widoor',
      advancedScalars: [
        'break-force-at-open',
        'near-open-speed',
        'near-close-speed',
      ],
      sensitiveActions: ['learning', 'reset'],
      absentActions: [],
    },
    {
      profile: 'moventiv-60',
      advancedScalars: ['near-open-speed', 'near-close-speed'],
      sensitiveActions: ['learning'],
      absentActions: ['reset'],
    },
    {
      profile: 'moventiv-80',
      advancedScalars: ['near-open-speed', 'near-close-speed'],
      sensitiveActions: ['learning'],
      absentActions: ['reset'],
    },
    {
      profile: 'garline',
      advancedScalars: ['near-open-speed', 'near-close-speed'],
      sensitiveActions: ['learning'],
      absentActions: ['reset'],
    },
  ] as const) {
    it(`should render Phase 1 advanced settings without V2.1 diagnostics for ${scenario.profile}`,
      async () => {
        const { fixture, component, writeExecutionService, bleService } =
          await createProductCommandsUiPage(scenario.profile);

        component.setActiveMainTab('settings');
        component.setActiveSettingsTab('advanced');
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const settingsSection = element.querySelector<HTMLElement>(
          'section[aria-labelledby="settings-title"]',
        );
        const settingsText = settingsSection?.textContent ?? '';

        expect(settingsSection).not.toBeNull();
        expect(settingsSection?.querySelector('.read-state')).toBeNull();
        expect(settingsSection?.querySelector('.read-state-detail')).toBeNull();
        expect(settingsSection?.querySelector('.basic-technical-details'))
          .toBeNull();
        expect(settingsSection?.querySelector('.advanced-technical-details'))
          .toBeNull();
        expect(settingsText).not.toContain(component.text.technicalDetails);
        expect(settingsText).not.toContain(component.text.rawFrame);
        expect(settingsText).not.toContain(component.text.serviceUuid);
        expect(settingsText).not.toContain(component.text.characteristicUuid);
        expect(settingsText).not.toContain(component.text.sensitiveActions.title);
        expect(settingsText).not.toContain(
          component.text.sensitiveActions.notice,
        );
        expect(settingsText).not.toContain(
          component.text.expertPeripheralDiagnostics.title,
        );
        expect(settingsText).not.toContain(
          component.text.errors.characteristicAbsent,
        );
        expect(settingsText).not.toContain('Phase 1');
        expect(settingsText).not.toContain('Phase 2');

        for (const field of scenario.advancedScalars) {
          expect(settingsSection?.querySelector(
            `[data-professional-scalar-field="${field}"]`,
          )).not.toBeNull();
        }
        for (const action of scenario.sensitiveActions) {
          expect(settingsSection?.querySelector(
            `[data-sensitive-action="${action}"]`,
          )).not.toBeNull();
        }
        for (const action of scenario.absentActions) {
          expect(settingsSection?.querySelector(
            `[data-sensitive-action="${action}"]`,
          )).toBeNull();
        }

        expect(writeExecutionService.execute).not.toHaveBeenCalled();
        expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
      },
    );
  }

  it('should unlock a Widoor slider from its row and open precision separately',
    async () => {
      const { fixture, component, writeExecutionService } =
        await createProductCommandsUiPage('widoor');
      const openSpeed = component.userSpeedControls[0].config;
      const closeSpeed = component.userSpeedControls[1].config;

      component.setActiveMainTab('settings');
      fixture.detectChanges();

      let element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('.basic-precision-row')).toBeNull();

      element.querySelector<HTMLElement>(
        `[data-basic-slider-field="${openSpeed.field}"] + ion-item`,
      )?.click();
      fixture.detectChanges();
      element = fixture.nativeElement as HTMLElement;
      expect(component.isUserSpeedUnlocked(openSpeed)).toBeTrue();
      expect(element.querySelector('.basic-slider-row.slider-unlocked'))
        .not.toBeNull();
      expect(element.querySelector('.basic-precision-row')).toBeNull();

      const options = element.querySelector<HTMLElement>(
        '.basic-slider-row .slider-options-toggle',
      );
      options?.click();
      fixture.detectChanges();
      element = fixture.nativeElement as HTMLElement;
      expect(component.isUserSpeedPrecisionOpen(openSpeed)).toBeTrue();
      expect(element.querySelector('.basic-precision-row')).not.toBeNull();
      expect(element.querySelector<HTMLIonIconElement>(
        '.slider-options-toggle ion-icon',
      )?.name).toBe('caret-forward');
      const range = element.querySelector<HTMLIonRangeElement>(
        '.basic-slider-row ion-range',
      );
      expect(range?.pin).toBeFalse();
      expect(element.querySelector('.basic-precision-row')?.textContent)
        .toContain(component.text.shell.increase);
      expect(element.querySelector('.basic-precision-row')?.textContent)
        .toContain(component.text.shell.decrease);

      component.unlockUserSpeedFromZone(closeSpeed);
      fixture.detectChanges();
      expect(component.isUserSpeedUnlocked(openSpeed)).toBeFalse();
      expect(component.isUserSpeedPrecisionOpen(openSpeed)).toBeFalse();
      expect(component.isUserSpeedUnlocked(closeSpeed)).toBeTrue();
      expect(element.querySelectorAll('.basic-slider-row.slider-unlocked').length)
        .toBe(1);

      component.setUserSpeedDraftValue(closeSpeed, closeSpeed.range.min);
      fixture.detectChanges();
      expect(element.querySelector(
        `[data-basic-slider-field="${closeSpeed.field}"] .basic-value-badge`,
      )?.textContent).toContain(`${closeSpeed.range.min} %`);

      component.stepUserSpeedDraft(closeSpeed, -1);
      expect(component.userSpeedDraftValue(closeSpeed))
        .toBe(closeSpeed.range.min);

      const editableValue = closeSpeed.range.max - 1;
      component.setUserSpeedDraftValue(closeSpeed, editableValue);
      component.stepUserSpeedDraft(closeSpeed, 1);
      fixture.detectChanges();
      expect(element.querySelector(
        `[data-basic-slider-field="${closeSpeed.field}"] .basic-value-badge`,
      )?.textContent).toContain(`${closeSpeed.range.max} %`);

      component.stepUserSpeedDraft(closeSpeed, 1);
      expect(component.userSpeedDraftValue(closeSpeed))
        .toBe(closeSpeed.range.max);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should reproduce the Phase 1 Moventiv slider interaction without writing',
    async () => {
      const { fixture, component, writeExecutionService } =
        await createProductCommandsUiPage('moventiv-60');
      const openSpeed = component.userSpeedControls[0].config;
      const closeSpeed = component.userSpeedControls[1].config;

      component.setActiveMainTab('settings');
      fixture.detectChanges();

      let element = fixture.nativeElement as HTMLElement;
      const openSpeedHeader = element.querySelector<HTMLElement>(
        `[data-basic-slider-field="${openSpeed.field}"]`,
      );
      expect(openSpeedHeader).not.toBeNull();
      expect(element.querySelector('.basic-precision-row')).toBeNull();

      openSpeedHeader?.click();
      fixture.detectChanges();
      element = fixture.nativeElement as HTMLElement;

      expect(component.isUserSpeedUnlocked(openSpeed)).toBeTrue();
      expect(element.querySelector(
        `[data-basic-slider-field="${openSpeed.field}"] + ion-item.slider-unlocked`,
      )).not.toBeNull();
      expect(element.querySelector('.basic-precision-row')).toBeNull();

      element.querySelector<HTMLElement>(
        `[data-basic-slider-field="${openSpeed.field}"] + ion-item .slider-options-toggle`,
      )?.click();
      fixture.detectChanges();
      element = fixture.nativeElement as HTMLElement;

      expect(component.isUserSpeedPrecisionOpen(openSpeed)).toBeTrue();
      expect(element.querySelector('.basic-precision-row')).not.toBeNull();

      element.querySelector<HTMLElement>(
        `[data-basic-slider-field="${closeSpeed.field}"]`,
      )?.click();
      fixture.detectChanges();

      expect(component.isUserSpeedUnlocked(openSpeed)).toBeFalse();
      expect(component.isUserSpeedPrecisionOpen(openSpeed)).toBeFalse();
      expect(component.isUserSpeedUnlocked(closeSpeed)).toBeTrue();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should update slider badges on ionInput without writing',
    async () => {
      const { fixture, component, writeExecutionService } =
        await createProductCommandsUiPage('moventiv-60');
      const speed = component.userSpeedControls[0].config;

      component.setActiveMainTab('settings');
      component.toggleUserSpeedLock(speed);
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const range = element.querySelector<HTMLIonRangeElement>(
        `[data-basic-slider-field="${speed.field}"] + ion-item ion-range`,
      )!;
      range.dispatchEvent(new CustomEvent('ionInput', {
        bubbles: true,
        detail: { value: 61 },
      }));
      fixture.detectChanges();

      expect(component.userSpeedDraftValue(speed)).toBe(61);
      expect(element.querySelector(
        `[data-basic-slider-field="${speed.field}"] .basic-value-badge`,
      )?.textContent).toContain('61 %');
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      const timing = component.userTimingControls.find((control) =>
        control.config.field === 'short-timing',
      )!.config;
      component.toggleUserTimingLock(timing);
      fixture.detectChanges();
      const timingRange = element.querySelector<HTMLIonRangeElement>(
        `[data-basic-slider-field="${timing.field}"] + ion-item ion-range`,
      )!;
      timingRange.dispatchEvent(new CustomEvent('ionInput', {
        bubbles: true,
        detail: { value: 4 },
      }));
      fixture.detectChanges();

      expect(component.userTimingDraftValue(timing)).toBe(4);
      expect(element.querySelector(
        `[data-basic-slider-field="${timing.field}"] .basic-value-badge`,
      )?.textContent).toContain('4 s');
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  for (const profile of [
    'widoor',
    'moventiv-60',
    'moventiv-80',
    'garline',
  ] as const) {
    it(`should keep the ${profile} short timed command label duration dynamic`,
      async () => {
        const { fixture, component } =
          await createProductCommandsUiPage(profile);
        const command = component.productCommands.find((candidate) =>
          candidate.config.operation === 'motor-open-short-timed',
        )!;
        const timing = component.userTimingControls.find((control) =>
          control.config.field === 'short-timing',
        )!.config;

        expect(component.productCommandDisplayLabel(command))
          .toBe('Ouvrir 0 s');
        expect(component.productCommandDisplayLabel(command))
          .not.toBe(component.text.widoorCommands.openShortTimed.label);

        component.setUserTimingDraftValue(timing, 4);
        fixture.detectChanges();

        expect(component.productCommandDisplayLabel(command))
          .toBe('Ouvrir 4 s');
        expect(fixture.nativeElement.querySelector('.cmd-timed .cmd-label')
          ?.textContent).toContain('Ouvrir 4 s');
      },
    );
  }

  it('should replace an initial short-timing draft with the first BLE value',
    async () => {
      const { fixture, component, loadService } =
        await createProductCommandsUiPage('moventiv-60');
      const command = component.productCommands.find((candidate) =>
        candidate.config.operation === 'motor-open-short-timed',
      )!;
      const timing = component.userTimingControls.find((control) =>
        control.config.field === 'short-timing',
      )!.config;
      const loaded = completeLoadResult(
        'success',
        'moventiv-60',
        userValueWithTimings(4, 12),
      );

      component.viewModel = {
        ...component.viewModel,
        reads: {
          ...component.viewModel.reads,
          userParameters: {
            status: 'not-loaded',
            readStatus: null,
            value: null,
            result: null,
          },
        },
      };
      component.setUserTimingDraftValue(timing, 1);
      expect(component.productCommandDisplayLabel(command))
        .toBe('Ouvrir 1 s');
      loadService.nextResult = {
        ...loaded,
        executedOrder: ['userParameters'],
        results: { userParameters: loaded.results.userParameters },
        notRequested: [
          'version',
          'datesAndCycles',
          'maintenance',
          'professionalParameters',
        ],
      };

      await component.refreshProductData();
      fixture.detectChanges();

      expect(component.currentUserTimingValue(timing)).toBe(4);
      expect(component.userTimingDraftValue(timing)).toBe(4);
      expect(component.productCommandDisplayLabel(command))
        .toBe('Ouvrir 4 s');
      expect(fixture.nativeElement.querySelector('.cmd-timed .cmd-label')
        ?.textContent).toContain('Ouvrir 4 s');
    },
  );

  it('should render basic slider drafts immediately and hide only normal feedback',
    async () => {
      const { fixture, component, writeExecutionService } =
        await createProductCommandsUiPage('widoor');
      const speed = component.userSpeedControls[0].config;
      const timing = component.userTimingControls[0].config;

      component.setActiveMainTab('settings');
      component.setUserSpeedDraftValue(speed, 40);
      component.setUserTimingDraftValue(timing, 4);
      fixture.detectChanges();

      let element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector(
        `[data-basic-slider-field="${speed.field}"] .basic-value-badge`,
      )?.textContent).toContain('40 %');
      expect(element.querySelector(
        `[data-basic-slider-field="${timing.field}"] .basic-value-badge`,
      )?.textContent).toContain('4 s');

      await component.requestUserSpeedChange(speed);
      fixture.detectChanges();
      element = fixture.nativeElement as HTMLElement;

      expect(element.textContent)
        .not.toContain(component.text.userSpeedControls.sent);

      component.setUserTimingDraftValue(timing, 4);
      await component.requestUserTimingChange(timing);
      fixture.detectChanges();
      element = fixture.nativeElement as HTMLElement;

      expect(element.textContent)
        .not.toContain(component.text.userTimingControls.sent);

      writeExecutionService.nextResult = {
        ...userSpeedExecutionResult('widoor', 'open-speed', '01 29'),
        status: 'failed',
        nativeWriteCompleted: false,
        error: { code: 'native-write-failed', message: 'Native failure' },
      };
      component.setUserSpeedDraftValue(speed, 41);
      await component.requestUserSpeedChange(speed);
      fixture.detectChanges();

      expect(component.userSpeedWriteState.status).toBe('failed');
      expect((fixture.nativeElement as HTMLElement).textContent)
        .toContain(component.text.userSpeedControls.failed);
    },
  );

  it('should render the Phase 1 Moventiv advanced controls and ordering hooks',
    async () => {
      const { fixture, component, writeExecutionService, bleService } =
        await createProductCommandsUiPage('moventiv-60');

      component.setActiveMainTab('settings');
      component.requestActiveSettingsTab('advanced');
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const weightRow = element.querySelector<HTMLElement>(
        '.phase1-mov-weight-row',
      );
      const inputRows = Array.from(element.querySelectorAll<HTMLElement>(
        '.advanced-input-row',
      ));

      expect(component.showBasicWeightRangeControls).toBeFalse();
      expect(component.showAdvancedWeightRangeControls).toBeTrue();
      expect(weightRow).not.toBeNull();
      expect(weightRow?.querySelector('ion-select')?.interface).toBe('alert');
      expect(component.weightRangeControls.map((control) =>
        control.config.label,
      )).toEqual([
        '< 20Kg',
        '20-30Kg',
        '30-40Kg',
        '40-50Kg',
        '50-60Kg',
        '60-80Kg',
      ]);
      expect(Array.from(weightRow?.querySelectorAll('ion-select-option') ?? [])
        .map((option) => option.textContent?.trim())).toEqual([
          '< 20Kg',
          '20-30Kg',
          '30-40Kg',
          '40-50Kg',
          '50-60Kg',
          '60-80Kg',
        ]);
      expect(component.moventivWeightAlertOptions).toEqual({
        header: component.text.weightRangeControls.selectTitle,
        message: component.text.weightRangeControls.warning,
        cssClass: 'product-mov-weight-alert',
      });
      expect(inputRows.length).toBe(2);
      expect(inputRows.every((row) => row.querySelector('ion-toggle') !== null))
        .toBeTrue();
      expect(inputRows.every((row) => row.querySelector('ion-select') === null))
        .toBeTrue();
      expect(element.querySelector('.phase1-mov-extra-actions-header'))
        .not.toBeNull();
      expect(element.querySelector('[data-sensitive-action="learning"]'))
        .not.toBeNull();
      expect(element.querySelector('.phase1-mov-maintenance-action-row'))
        .not.toBeNull();
      expect(element.querySelector('.phase1-mov-expert-access-row ion-input'))
        .not.toBeNull();
      expect(element.querySelector('.phase1-mov-expert-submit-row ion-button'))
        .not.toBeNull();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should render Garline with the shared Phase 1 Moventiv presentation only',
    async () => {
      const { fixture, component, writeExecutionService, bleService } =
        await createProductCommandsUiPage('garline');

      expect(component.isMoventivProfile).toBeFalse();
      expect(component.usesMoventivLayout).toBeTrue();
      expect(component.usesPhase1SliderInteraction).toBeTrue();

      let element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('ion-header.product-profile-garline'))
        .not.toBeNull();
      expect(element.querySelector('ion-content.product-profile-garline'))
        .not.toBeNull();
      expect(element.querySelector('.phase1-mov-close-lock-command'))
        .toBeNull();
      expect(element.querySelector(
        '.user-peripheral-command-controls .cmd-head',
      )).toBeNull();

      component.setActiveMainTab('settings');
      fixture.detectChanges();
      element = fixture.nativeElement as HTMLElement;

      expect(component.userTimingControls.map((control) =>
        control.config.field,
      )).toEqual(['short-timing', 'long-timing']);
      expect(element.querySelector('.basic-lighting-header')).toBeNull();
      expect(element.querySelector(
        '.basic-name-room-header ion-button',
      )).toBeNull();
      expect(element.querySelectorAll(
        '.basic-slider-row .slider-options-toggle',
      ).length).toBe(4);

      component.setActiveSettingsTab('advanced');
      fixture.detectChanges();
      element = fixture.nativeElement as HTMLElement;

      expect(component.showAdvancedWeightRangeControls).toBeFalse();
      expect(component.showExpertInputControls).toBeFalse();
      expect(element.querySelector('.phase1-mov-weight-row')).toBeNull();
      expect(element.querySelector('.advanced-input-row')).toBeNull();
      expect(element.querySelector('.phase1-mov-extra-actions-header'))
        .not.toBeNull();
      expect(element.querySelector('[data-sensitive-action="learning"]'))
        .not.toBeNull();
      expect(element.querySelector('.phase1-mov-maintenance-action-row'))
        .not.toBeNull();
      expect(element.querySelector('.phase1-mov-advanced-tuning-header'))
        .not.toBeNull();
      expect(element.querySelector('.phase1-mov-expert-access-row ion-input'))
        .not.toBeNull();
      expect(component.visibleExpertScalarControls.map((control) =>
        control.config.field,
      )).toEqual(['near-open-speed', 'near-close-speed']);
      expect(element.querySelectorAll(
        '.advanced-slider-row .slider-options-toggle',
      ).length).toBe(2);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should hide normal setting status messages and preserve failures',
    async () => {
      const { fixture, component } =
        await createProductCommandsUiPage('moventiv-60');
      component.setActiveMainTab('settings');
      component.setActiveSettingsTab('advanced');
      component.weightRangeWriteState = Object.freeze({
        status: 'sent',
        message: 'weight-success',
      });
      component.expertInputWriteState = Object.freeze({
        status: 'sent',
        field: component.expertInputControls[0].config.field,
        message: 'input-success',
      });
      component.expertAccessState = Object.freeze({
        status: 'unlocked',
        message: 'access-success',
      });
      fixture.detectChanges();

      let textContent = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(textContent).not.toContain('weight-success');
      expect(textContent).not.toContain('input-success');
      expect(textContent).not.toContain('access-success');

      component.weightRangeWriteState = Object.freeze({
        status: 'failed',
        message: 'weight-failed',
      });
      component.expertInputWriteState = Object.freeze({
        status: 'failed',
        field: component.expertInputControls[0].config.field,
        message: 'input-failed',
      });
      component.expertAccessState = Object.freeze({
        status: 'failed',
        message: 'access-failed',
      });
      fixture.detectChanges();

      textContent = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(textContent).toContain('weight-failed');
      expect(textContent).toContain('input-failed');
      expect(textContent).toContain('access-failed');
    },
  );

  for (const scenario of [
    {
      profile: 'widoor',
      generalRows: [],
      absentGeneralRows: ['maximum-weight', 'current-weight-range'],
      maintenanceRows: [],
      absentMaintenanceRows: ['last-maintenance', 'cycles-since-maintenance'],
      supplementalRows: [
        'initializations',
        'cycles-since-init',
        'obstacles',
        'encoder-errors',
        'motor-errors',
      ],
      absentSupplementalRows: ['learning', 'wrong-open', 'wrong-close'],
    },
    {
      profile: 'moventiv-60',
      generalRows: ['maximum-weight', 'current-weight-range'],
      absentGeneralRows: [],
      maintenanceRows: ['last-maintenance', 'cycles-since-maintenance'],
      absentMaintenanceRows: [],
      supplementalRows: [
        'initializations',
        'cycles-since-init',
        'obstacles',
        'learning',
      ],
      absentSupplementalRows: [
        'encoder-errors',
        'motor-errors',
        'wrong-open',
        'wrong-close',
      ],
    },
    {
      profile: 'moventiv-80',
      generalRows: ['maximum-weight', 'current-weight-range'],
      absentGeneralRows: [],
      maintenanceRows: ['last-maintenance', 'cycles-since-maintenance'],
      absentMaintenanceRows: [],
      supplementalRows: [
        'initializations',
        'cycles-since-init',
        'obstacles',
        'learning',
      ],
      absentSupplementalRows: [
        'encoder-errors',
        'motor-errors',
        'wrong-open',
        'wrong-close',
      ],
    },
    {
      profile: 'garline',
      generalRows: ['maximum-weight', 'current-weight-range'],
      absentGeneralRows: [],
      maintenanceRows: ['last-maintenance', 'cycles-since-maintenance'],
      absentMaintenanceRows: [],
      supplementalRows: [
        'initializations',
        'cycles-since-init',
        'obstacles',
        'learning',
      ],
      absentSupplementalRows: [
        'encoder-errors',
        'motor-errors',
        'wrong-open',
        'wrong-close',
      ],
    },
  ] as const) {
    it(`should render Phase 1 information lists for ${scenario.profile}`,
      async () => {
        const { fixture, component, writeExecutionService, bleService } =
          await createProductCommandsUiPage(scenario.profile);

        component.setActiveMainTab('information');
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const informationSection = element.querySelector<HTMLElement>(
          'section[aria-labelledby="information-title"]',
        );
        const informationLists = informationSection?.querySelectorAll(
          '.product-information-list',
        );
        const informationText = informationSection?.textContent ?? '';

        expect(informationSection).not.toBeNull();
        expect(informationLists?.length).toBeGreaterThanOrEqual(4);
        expect(informationSection?.querySelector('.read-state')).toBeNull();
        expect(informationSection?.querySelector('.read-state-detail'))
          .toBeNull();
        expect(informationSection?.querySelector('.product-information-technical'))
          .toBeNull();
        expect(informationText).not.toContain(component.text.technicalDetails);
        expect(informationText).not.toContain(component.text.rawFrame);
        expect(informationText).not.toContain(component.text.serviceUuid);
        expect(informationText).not.toContain(component.text.characteristicUuid);
        expect(informationText).not.toContain('Phase 1');
        expect(informationText).not.toContain('Phase 2');
        for (const row of scenario.generalRows) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).not.toBeNull();
        }
        for (const row of scenario.absentGeneralRows) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).toBeNull();
        }
        if (scenario.profile === 'widoor') {
          expect(informationSection?.textContent)
            .not.toContain(component.text.noMotorState);
        } else {
          expect(informationSection?.textContent)
            .toContain(component.text.noMotorState);
        }
        if (scenario.profile === 'moventiv-60' ||
            scenario.profile === 'moventiv-80' ||
            scenario.profile === 'garline') {
          const dates = informationSection?.querySelector<HTMLElement>(
            '.product-information-general + .product-information-dates',
          );
          expect(dates).not.toBeNull();
          expect(parseFloat(getComputedStyle(dates!).borderTopWidth))
            .toBeGreaterThan(0);
        }
        expect(informationSection?.querySelector(
          '.product-information-row[data-info-row="first-commissioning"]',
        )).not.toBeNull();
        expect(informationSection?.querySelector(
          '.product-information-row[data-info-row="total-cycles"]',
        )).not.toBeNull();
        for (const row of scenario.maintenanceRows) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).not.toBeNull();
        }
        for (const row of scenario.absentMaintenanceRows) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).toBeNull();
        }
        for (const row of scenario.supplementalRows) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).not.toBeNull();
        }
        for (const row of scenario.absentSupplementalRows) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).toBeNull();
        }
        expect(informationSection?.querySelector(
          '.product-information-row[data-info-row="motor-version"]',
        )).not.toBeNull();
        expect(informationSection?.querySelector(
          '.product-information-row[data-info-row="ble-version"]',
        )).not.toBeNull();
        expect(informationSection?.querySelector(
          '.product-information-row[data-info-row="stack-version"]',
        )).not.toBeNull();
        expect(informationSection?.querySelector(
          '.product-information-row[data-info-row="control-hardware"]',
        )).not.toBeNull();
        if (scenario.profile === 'widoor' ||
            scenario.profile === 'moventiv-60' ||
            scenario.profile === 'moventiv-80' ||
            scenario.profile === 'garline') {
          expect(informationSection?.querySelector(
            '.product-information-hardware',
          )).not.toBeNull();
          expect(informationText).toContain('Matériel');
          if (scenario.profile === 'widoor') {
            expect(informationSection?.querySelector(
              '.product-information-row[data-info-row="motor-address"]',
            )).toBeNull();
          } else {
            expect(informationSection?.querySelector(
              '.product-information-row[data-info-row="motor-address"]',
            )).not.toBeNull();
          }
        } else {
          expect(informationSection?.querySelector(
            '.product-information-row[data-info-row="motor-address"]',
          )).not.toBeNull();
        }
        if (scenario.profile === 'garline') {
          expect(informationText).toContain('140 kg');
          expect(informationSection?.querySelector(
            '.product-information-row[data-info-row="current-weight-range"]',
          )?.textContent).toContain(
            component.text.information.currentWeightProfile,
          );
        }
        expect(informationSection?.querySelector(
          'ion-button',
        )).toBeNull();
        expect(writeExecutionService.execute).not.toHaveBeenCalled();
        expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
      },
    );
  }

  for (const scenario of [
    {
      profile: 'widoor',
      visibleSwitches: ['ble-switch', 'automatic-manual', 'direction', 'pairing'],
      hiddenSwitches: ['push-and-go'],
    },
    {
      profile: 'moventiv-60',
      visibleSwitches: [
        'push-and-go',
        'ble-switch',
        'automatic-manual',
        'direction',
        'pairing',
      ],
      hiddenSwitches: [],
    },
    {
      profile: 'moventiv-80',
      visibleSwitches: [
        'push-and-go',
        'ble-switch',
        'automatic-manual',
        'direction',
        'pairing',
      ],
      hiddenSwitches: [],
    },
    {
      profile: 'garline',
      visibleSwitches: ['ble-switch', 'pairing'],
      hiddenSwitches: ['push-and-go', 'automatic-manual', 'direction'],
    },
  ] as const) {
    it(`should render only Phase 1 motor switch information for ${scenario.profile}`,
      async () => {
        const { fixture, component } =
          await createProductCommandsUiPage(scenario.profile);

        component.viewModel = {
          ...component.viewModel,
          motorState: {
            rawHex: '01 0a 64 07 ff',
            length: 5,
            state: 1,
            currentPosition: 10,
            maximumPosition: 100,
            error: 7,
            switches: {
              raw: 0xff,
              unknownHighBits: 0xf8,
              pushAndGo: true,
              ble: true,
              automaticManual: false,
              direction: true,
              pairing: false,
            },
          },
        };
        component.setActiveMainTab('information');
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const informationSection = element.querySelector<HTMLElement>(
          'section[aria-labelledby="information-title"]',
        );
        const informationText = informationSection?.textContent ?? '';

        for (const row of scenario.visibleSwitches) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).not.toBeNull();
        }
        for (const row of scenario.hiddenSwitches) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).toBeNull();
        }
        for (const row of [
          'motor-raw-state',
          'motor-state-label',
          'motor-position',
          'motor-maximum',
          'motor-percentage',
          'motor-error',
          'motor-switches',
        ]) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).toBeNull();
        }
        expect(informationText).not.toContain(component.text.motor.rawState);
        expect(informationText).not.toContain(component.text.motor.stateLabel);
        expect(informationText).not.toContain(component.text.motor.switchesRaw);
        if (scenario.profile.startsWith('moventiv-')) {
          const values = scenario.visibleSwitches.map((row) =>
            informationSection?.querySelector(
              `.product-information-row[data-info-row="${row}"] ` +
              '.product-information-value',
            )?.textContent?.trim(),
          );
          expect(values).toEqual([
            'Activé',
            'Activé',
            'Automatique',
            'Vers sortie câbles',
            'Appairage',
          ]);
        }
        if (scenario.profile === 'garline') {
          const values = scenario.visibleSwitches.map((row) =>
            informationSection?.querySelector(
              `.product-information-row[data-info-row="${row}"] ` +
              '.product-information-value',
            )?.textContent?.trim(),
          );
          expect(values).toEqual([
            moventivMotorStateLabelFor('fr', 'ble-switch', true),
            moventivMotorStateLabelFor('fr', 'pairing', false),
          ]);
        }
      },
    );
  }

  it('should hide V2.1 technical information without triggering writes',
    async () => {
      const { fixture, component, writeExecutionService, bleService } =
        await createProductCommandsUiPage('moventiv-80');

      component.setActiveMainTab('information');
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const technicalDetails = element.querySelector<HTMLDetailsElement>(
        '.product-information-technical',
      );

      expect(technicalDetails).toBeNull();
      expect(element.textContent).not.toContain(component.text.technicalDetails);
      expect(element.textContent).not.toContain(component.text.rawFrame);
      expect(element.textContent).not.toContain(component.text.serviceUuid);
      expect(element.textContent).not.toContain(
        component.text.characteristicUuid,
      );

      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  async function createProductCommandsUiPage(
    profile: KnownProductProfile,
  ): Promise<{
    readonly fixture: ComponentFixture<ProductPage>;
    readonly component: ProductPage;
    readonly bleService: FakeBleService;
    readonly loadService: FakeProductDataLoadService;
    readonly writeExecutionService: FakeBleWriteExecutionService;
  }> {
    const bleService = new FakeBleService();
    const loadService = new FakeProductDataLoadService();
    loadService.nextResult = completeLoadResult(
      'success',
      profile,
      userValueWithPeripherals({
        staticLight: true,
        dynamicLight: false,
        rgbIndicator: false,
      }),
    );
    const writeExecutionService = new FakeBleWriteExecutionService();

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProductPage],
      providers: [
        { provide: BleService, useValue: bleService },
        {
          provide: AlertController,
          useValue: {
            create: jasmine.createSpy('create').and.resolveTo({
              present: async () => undefined,
              onDidDismiss: async () => ({ role: 'confirm' }),
            }),
          },
        },
        { provide: BleWriteExecutionService, useValue: writeExecutionService },
        { provide: ProductDataLoadService, useValue: loadService },
        { provide: ProductDetection, useClass: ProductDetection },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { profile } } },
        },
        {
          provide: Router,
          useValue: {
            getCurrentNavigation: () => ({
              extras: { state: navigationState(profile) },
            }),
            navigate: jasmine.createSpy('navigate').and.resolveTo(true),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await component.refreshProductData();
    fixture.detectChanges();

    return {
      fixture,
      component,
      bleService,
      loadService,
      writeExecutionService,
    };
  }
});

describe('ProductPage weight-range controls for profile variants', () => {
  async function createWeightRangePage(
    profile: Exclude<KnownProductProfile, 'widoor'>,
    lower: number,
    upper: number,
    result: LegacyBleWriteExecutionResult = weightRangeExecutionResult(
      profile,
      '00 32 3c',
    ),
  ): Promise<{
    readonly component: ProductPage;
    readonly fixture: ComponentFixture<ProductPage>;
    readonly bleService: FakeBleService;
    readonly loadService: FakeProductDataLoadService;
    readonly writeExecutionService: FakeBleWriteExecutionService;
  }> {
    const bleService = new FakeBleService();
    const loadService = new FakeProductDataLoadService();
    loadService.nextResult = completeLoadResult(
      'success',
      profile,
      userValue(),
      professionalValue(profile, lower, upper),
    );
    const writeExecutionService = new FakeBleWriteExecutionService();
    writeExecutionService.nextResult = result;

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProductPage],
      providers: [
        { provide: BleService, useValue: bleService },
        {
          provide: AlertController,
          useValue: {
            create: jasmine.createSpy('create').and.resolveTo({
              present: async () => undefined,
              onDidDismiss: async () => ({ role: 'confirm' }),
            }),
          },
        },
        {
          provide: BleWriteExecutionService,
          useValue: writeExecutionService,
        },
        {
          provide: MaintenanceAccessService,
          useValue: new FakeMaintenanceAccessService(),
        },
        { provide: ProductDataLoadService, useValue: loadService },
        { provide: ProductDetection, useClass: ProductDetection },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { profile } } },
        },
        {
          provide: Router,
          useValue: {
            getCurrentNavigation: () => ({
              extras: { state: navigationState(profile) },
            }),
            navigate: jasmine.createSpy('navigate').and.resolveTo(true),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await component.refreshProductData();
    fixture.detectChanges();

    return {
      component,
      fixture,
      bleService,
      loadService,
      writeExecutionService,
    };
  }

  for (const scenario of [
    {
      profile: 'moventiv-60',
      current: { lower: 40, upper: 50 },
      accepted: { lower: 60, upper: 80 },
      invalid: { lower: 80, upper: 100 },
      payloadHex: '00 3c 50',
      ranges: [
        { lower: 10, upper: 20 },
        { lower: 20, upper: 30 },
        { lower: 30, upper: 40 },
        { lower: 40, upper: 50 },
        { lower: 50, upper: 60 },
        { lower: 60, upper: 80 },
      ],
    },
    {
      profile: 'moventiv-80',
      current: { lower: 50, upper: 60 },
      accepted: { lower: 60, upper: 80 },
      invalid: { lower: 80, upper: 100 },
      payloadHex: '00 3c 50',
      ranges: [
        { lower: 10, upper: 20 },
        { lower: 20, upper: 30 },
        { lower: 30, upper: 40 },
        { lower: 40, upper: 50 },
        { lower: 50, upper: 60 },
        { lower: 60, upper: 80 },
      ],
    },
  ] as const) {
    it(`should apply ${scenario.profile} weight ranges and writes`,
      async () => {
        const {
          component,
          fixture,
          writeExecutionService,
        } = await createWeightRangePage(
          scenario.profile,
          scenario.current.lower,
          scenario.current.upper,
          weightRangeExecutionResult(scenario.profile, scenario.payloadHex),
        );

        expect(component.weightRangeControls.map((control) =>
          control.config.range,
        )).toEqual(scenario.ranges);
        expect(component.currentWeightRangeValue()).toEqual(scenario.current);
        expect(component.weightRangeDraftValue()).toEqual(scenario.current);
        expect(fixture.nativeElement.textContent)
          .toContain(
            `${scenario.current.lower}-${scenario.current.upper}Kg`,
          );

        component.setWeightRangeDraftValue(scenario.invalid);
        await component.requestWeightRangeChange();
        expect(writeExecutionService.execute).not.toHaveBeenCalled();
        expect(component.weightRangeDraftValue()).toEqual(scenario.current);

        component.setWeightRangeDraftValue(scenario.accepted);
        expect(component.weightRangeDraftValue()).toEqual(scenario.accepted);
        expect(component.canApplyWeightRange()).toBeTrue();
        expect(writeExecutionService.execute).not.toHaveBeenCalled();

        await component.requestWeightRangeChange();

        expect(writeExecutionService.execute)
          .toHaveBeenCalledTimes(3);
        const requests = writeExecutionService.execute.calls.allArgs()
          .map(([request]) => request as LegacyBleWriteRequest);
        expect(requests.map((request) => request.write.operation))
          .toEqual(['open-speed', 'close-speed', 'weight-range']);
        expect(requests.map((request) => request.write.payloadHex))
          .toEqual(['01 4b', '02 46', scenario.payloadHex]);
        expect(requests.every((request) => request.authorization === null))
          .toBeTrue();
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.profile).toBe(scenario.profile);
        expect(request.write.operation).toBe('weight-range');
        expect(request.write.serviceUuid)
          .toBe(BLE_UUIDS.moventivGarlineService);
        expect(request.write.characteristicUuid)
          .toBe(BLE_UUIDS.professionalParametersCharacteristic);
        expect(request.write.payloadHex).toBe(scenario.payloadHex);
        expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
        expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
        expect(request.policy).toEqual(jasmine.objectContaining({
          allowMoventivPhase1ImmediateWrite: true,
        }));
        expect(request.authorization).toBeNull();
      },
    );
  }

  it('should not expose interactive Garline weight range tuning',
    async () => {
      const {
        component,
        fixture,
        writeExecutionService,
      } = await createWeightRangePage('garline', 80, 100);

      expect(component.weightRangeControls).toEqual([]);
      expect(component.showWeightRangeControls).toBeFalse();
      expect(component.showBasicWeightRangeControls).toBeFalse();
      expect(component.showAdvancedWeightRangeControls).toBeFalse();
      expect(fixture.nativeElement.querySelector('[data-weight-range]'))
        .toBeNull();

      await component.requestWeightRangeChange();

      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should keep Widoor weight range read-only and preserve other controls',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = completeLoadResult('success', 'widoor');
      const writeExecutionService = new FakeBleWriteExecutionService();

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create').and.resolveTo({
                present: async () => undefined,
                onDidDismiss: async () => ({ role: 'confirm' }),
              }),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'widoor' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('widoor') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();

      expect(component.showWeightRangeControls).toBeFalse();
      expect(component.weightRangeControls).toEqual([]);
      expect(component.showUserSpeedControls).toBeTrue();
      expect(component.showUserTimingControls).toBeTrue();
      expect(component.showLockModeControls).toBeFalse();
      expect(component.showProductMotorCommands).toBeTrue();

      await component.requestWeightRangeChange();

      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should leave the BLE value unchanged when a weight write fails',
    async () => {
      const {
        component,
        writeExecutionService,
      } = await createWeightRangePage(
        'moventiv-80',
        50,
        60,
        weightRangeExecutionResult('moventiv-80', '00 3c 50', 'failed'),
      );

      component.setWeightRangeDraftValue({ lower: 60, upper: 80 });
      writeExecutionService.nextResults = [
        userSpeedExecutionResult('moventiv-80', 'open-speed', '01 4b'),
        userSpeedExecutionResult('moventiv-80', 'close-speed', '02 46'),
        weightRangeExecutionResult('moventiv-80', '00 3c 50', 'failed'),
      ];
      await component.requestWeightRangeChange();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(3);
      expect(component.currentWeightRangeValue())
        .toEqual({ lower: 50, upper: 60 });
      expect(component.weightRangeDraftValue())
        .toEqual({ lower: 60, upper: 80 });
      expect(component.weightRangeWriteState.status).toBe('failed');
    },
  );

  it('should reset the weight draft after a BLE reload',
    async () => {
      const {
        component,
        loadService,
      } = await createWeightRangePage('moventiv-80', 50, 60);

      component.setWeightRangeDraftValue({ lower: 60, upper: 80 });
      expect(component.weightRangeDraftValue())
        .toEqual({ lower: 60, upper: 80 });

      loadService.nextResult = completeLoadResult(
        'success',
        'moventiv-80',
        userValue(),
        professionalValue('moventiv-80', 40, 50),
      );
      await component.refreshProductData();

      expect(component.currentWeightRangeValue())
        .toEqual({ lower: 40, upper: 50 });
      expect(component.weightRangeDraftValue())
        .toEqual({ lower: 40, upper: 50 });
    },
  );

  it('should reset weight editing on disconnection',
    async () => {
      const {
        component,
        bleService,
      } = await createWeightRangePage('moventiv-80', 50, 60);

      component.setWeightRangeDraftValue({ lower: 60, upper: 80 });
      component.weightRangeWriteState = Object.freeze({
        status: 'failed',
        message: 'failed',
      });

      bleService.disconnect();

      expect(component.weightRangeDraftValue()).toBeNull();
      expect(component.weightRangeWriteState).toEqual({
        status: 'idle',
        message: null,
      });
      expect(component.canApplyWeightRange()).toBeFalse();
    },
  );

  it('should require an explicit draft when the BLE weight range is unknown',
    async () => {
      const {
        component,
        writeExecutionService,
      } = await createWeightRangePage('moventiv-80', 255, 255);

      expect(component.currentWeightRangeValue())
        .toEqual({ lower: 255, upper: 255 });
      expect(component.weightRangeDraftValue()).toBeNull();
      expect(component.canApplyWeightRange()).toBeFalse();

      await component.requestWeightRangeChange();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();

      component.setWeightRangeDraftValue({ lower: 60, upper: 80 });
      expect(component.canApplyWeightRange()).toBeTrue();
    },
  );
});

describe('ProductPage expert scalar controls',
  () => {
    async function createExpertScalarPage(
      profile: KnownProductProfile,
      professionalParameters: BleProfessionalParameters,
      result: LegacyBleWriteExecutionResult =
        expertScalarExecutionResult(
          profile,
          profile === 'widoor'
            ? 'break-force-at-open'
            : 'obstacle-sensitivity',
          profile === 'widoor' ? '01 05' : '07 03',
        ),
      expertAccessDismissal: {
        readonly role: string;
        readonly data?: {
          readonly values?: {
            readonly expertAccessCode?: string;
          };
        };
      } = {
        role: 'confirm',
        data: {
          values: {
            expertAccessCode: PRODUCT_PAGE_EXPERT_ACCESS_TEST_CODE,
          },
        },
      },
    ): Promise<{
      readonly component: ProductPage;
      readonly fixture: ComponentFixture<ProductPage>;
      readonly bleService: FakeBleService;
      readonly loadService: FakeProductDataLoadService;
      readonly expertAccessService: FakeExpertAccessService;
      readonly writeExecutionService: FakeBleWriteExecutionService;
    }> {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      const expertAccessService = new FakeExpertAccessService();
      loadService.nextResult = completeLoadResult(
        'success',
        profile,
        userValue(),
        professionalParameters,
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      writeExecutionService.nextResult = result;

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create').and.resolveTo({
                present: async () => undefined,
                onDidDismiss: async () => expertAccessDismissal,
              }),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          {
            provide: ExpertAccessService,
            useValue: expertAccessService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState(profile) },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();
      fixture.detectChanges();

      return {
        component,
        fixture,
        bleService,
        loadService,
        expertAccessService,
        writeExecutionService,
      };
    }

    for (const scenario of [
      {
        profile: 'widoor',
        current: professionalValue('widoor', 0, 0, {
          breakForceAtOpen: 5,
          nearOpenSpeed: 80,
          nearCloseSpeed: 70,
        }),
        field: 'break-force-at-open',
        controls: [
          'break-force-at-open',
          'near-open-speed',
          'near-close-speed',
        ],
        accepted: 10,
        invalid: 11,
        range: { min: 1, max: 10 },
        unit: null,
        currentValue: 5,
        payloadHex: '01 0a',
        serviceUuid: BLE_UUIDS.widoorService,
      },
      {
        profile: 'widoor',
        current: professionalValue('widoor', 0, 0, {
          breakForceAtOpen: 5,
          nearOpenSpeed: 80,
          nearCloseSpeed: 70,
        }),
        field: 'near-open-speed',
        controls: [
          'break-force-at-open',
          'near-open-speed',
          'near-close-speed',
        ],
        accepted: 85,
        invalid: 69,
        range: { min: 70, max: 100 },
        unit: '%',
        currentValue: 80,
        payloadHex: '02 55',
        serviceUuid: BLE_UUIDS.widoorService,
      },
      {
        profile: 'widoor',
        current: professionalValue('widoor', 0, 0, {
          breakForceAtOpen: 5,
          nearOpenSpeed: 80,
          nearCloseSpeed: 70,
        }),
        field: 'near-close-speed',
        controls: [
          'break-force-at-open',
          'near-open-speed',
          'near-close-speed',
        ],
        accepted: 75,
        invalid: 49,
        range: { min: 50, max: 100 },
        unit: '%',
        currentValue: 70,
        payloadHex: '03 4b',
        serviceUuid: BLE_UUIDS.widoorService,
      },
      {
        profile: 'moventiv-80',
        current: professionalValue('moventiv-80', 50, 60, {
          nearOpenSpeed: 45,
          nearCloseSpeed: 55,
          nearOpenTorque: 90,
          nearCloseTorque: 110,
          brakingOpenPower: 40,
          obstacleSensitivity: 2,
        }),
        field: 'near-open-speed',
        controls: [
          'near-open-speed',
          'near-close-speed',
          'near-open-torque',
          'near-close-torque',
          'braking-open-power',
          'obstacle-sensitivity',
        ],
        accepted: 50,
        invalid: 0,
        range: { min: 1, max: 100 },
        unit: '%',
        currentValue: 45,
        payloadHex: '02 32',
        serviceUuid: BLE_UUIDS.moventivGarlineService,
      },
      {
        profile: 'garline',
        current: professionalValue('garline', 80, 100, {
          nearOpenSpeed: 20,
          nearCloseSpeed: 30,
          obstacleSensitivity: 2,
        }),
        field: 'near-close-speed',
        controls: [
          'near-open-speed',
          'near-close-speed',
          'obstacle-sensitivity',
        ],
        accepted: 0,
        invalid: 101,
        range: { min: 0, max: 100 },
        unit: '%',
        currentValue: 30,
        payloadHex: '03 00',
        serviceUuid: BLE_UUIDS.moventivGarlineService,
      },
      {
        profile: 'moventiv-80',
        current: professionalValue('moventiv-80', 50, 60, {
          nearOpenSpeed: 45,
          nearCloseSpeed: 55,
          nearOpenTorque: 90,
          nearCloseTorque: 110,
          brakingOpenPower: 40,
          obstacleSensitivity: 2,
        }),
        field: 'near-open-torque',
        controls: [
          'near-open-speed',
          'near-close-speed',
          'near-open-torque',
          'near-close-torque',
          'braking-open-power',
          'obstacle-sensitivity',
        ],
        accepted: 120,
        invalid: 201,
        range: { min: 1, max: 200 },
        unit: '%',
        currentValue: 90,
        payloadHex: '04 78',
        serviceUuid: BLE_UUIDS.moventivGarlineService,
      },
      {
        profile: 'moventiv-60',
        current: professionalValue('moventiv-60', 50, 60, {
          nearOpenSpeed: 45,
          nearCloseSpeed: 55,
          nearOpenTorque: 90,
          nearCloseTorque: 110,
          brakingOpenPower: 40,
          obstacleSensitivity: 2,
        }),
        field: 'near-close-torque',
        controls: [
          'near-open-speed',
          'near-close-speed',
          'near-open-torque',
          'near-close-torque',
          'braking-open-power',
          'obstacle-sensitivity',
        ],
        accepted: 130,
        invalid: 0,
        range: { min: 1, max: 200 },
        unit: '%',
        currentValue: 110,
        payloadHex: '05 82',
        serviceUuid: BLE_UUIDS.moventivGarlineService,
      },
      {
        profile: 'moventiv-80',
        current: professionalValue('moventiv-80', 50, 60, {
          nearOpenSpeed: 45,
          nearCloseSpeed: 55,
          nearOpenTorque: 90,
          nearCloseTorque: 110,
          brakingOpenPower: 40,
          obstacleSensitivity: 2,
        }),
        field: 'braking-open-power',
        controls: [
          'near-open-speed',
          'near-close-speed',
          'near-open-torque',
          'near-close-torque',
          'braking-open-power',
          'obstacle-sensitivity',
        ],
        accepted: 50,
        invalid: 101,
        range: { min: 1, max: 100 },
        unit: '%',
        currentValue: 40,
        payloadHex: '06 32',
        serviceUuid: BLE_UUIDS.moventivGarlineService,
      },
      {
        profile: 'garline',
        current: professionalValue('garline', 80, 100, {
          nearOpenSpeed: 20,
          nearCloseSpeed: 30,
          obstacleSensitivity: 2,
        }),
        field: 'obstacle-sensitivity',
        controls: [
          'near-open-speed',
          'near-close-speed',
          'obstacle-sensitivity',
        ],
        accepted: 5,
        invalid: 6,
        range: { min: 1, max: 5 },
        unit: null,
        currentValue: 2,
        payloadHex: '07 05',
        serviceUuid: BLE_UUIDS.moventivGarlineService,
      },
    ] as const) {
      it(`should apply ${scenario.profile} ${scenario.field}`,
        async () => {
          const {
            component,
            fixture,
            expertAccessService,
            writeExecutionService,
          } = await createExpertScalarPage(
            scenario.profile,
            scenario.current,
            expertScalarExecutionResult(
              scenario.profile,
              scenario.field,
              scenario.payloadHex,
            ),
          );
          const control = component.expertScalarControls.find(
            (candidate) => candidate.config.field === scenario.field,
          )?.config;

          expect(component.expertScalarControls.map((candidate) =>
            candidate.config.field,
          )).toEqual(scenario.controls);
          expect(control).toBeDefined();
          component.setActiveMainTab('settings');
          component.setActiveSettingsTab('advanced');
          await fixture.whenStable();
          if (control?.requiresExpertAccess) {
            expect(component.visibleExpertScalarControls.map(
              (candidate) => candidate.config.field,
            )).not.toContain(scenario.field);
            expect(component.canApplyExpertScalar(control))
              .toBeFalse();
            expect(expertAccessService.authenticate({
              profile: scenario.profile,
              deviceId: 'device-1',
              connectionGeneration: 4,
            }, PRODUCT_PAGE_EXPERT_ACCESS_TEST_CODE)).toBeTrue();
          }
          expect(control?.range).toEqual(scenario.range);
          expect(control?.unit).toBe(scenario.unit);
          expect(component.currentExpertScalarValue(control!))
            .toBe(scenario.currentValue);

          component.setExpertScalarDraftValue(control!, scenario.invalid);
          await component.requestExpertScalarChange(control!);
          expect(writeExecutionService.execute).not.toHaveBeenCalled();

          component.setExpertScalarDraftValue(
            control!,
            scenario.accepted,
          );
          expect(component.expertScalarDraftValue(control!))
            .toBe(scenario.accepted);
          expect(component.canApplyExpertScalar(control!)).toBeTrue();
          expect(writeExecutionService.execute).not.toHaveBeenCalled();

          fixture.detectChanges();
          expect(fixture.nativeElement.querySelector(
            `[data-professional-scalar-header="${scenario.field}"] ` +
            '.advanced-value-badge',
          )?.textContent).toContain(String(scenario.accepted));

          await component.requestExpertScalarChange(control!);
          fixture.detectChanges();

          expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
          expect((fixture.nativeElement as HTMLElement).textContent)
            .not.toContain(component.text.expertScalarControls.sent);
          const request = writeExecutionService.execute.calls.mostRecent()
            .args[0] as LegacyBleWriteRequest;
          expect(request.profile).toBe(scenario.profile);
          expect(request.write.operation).toBe(scenario.field);
          expect(request.write.serviceUuid).toBe(scenario.serviceUuid);
          expect(request.write.characteristicUuid)
            .toBe(BLE_UUIDS.professionalParametersCharacteristic);
          expect(request.write.payloadHex).toBe(scenario.payloadHex);
          expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
          expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
          if (scenario.profile === 'garline') {
            expect(request.policy).toEqual(jasmine.objectContaining({
              allowGarlinePhase1ImmediateWrite: true,
            }));
            expect(request.authorization).toBeNull();
          }
        },
      );
    }

    it('should leave the BLE value unchanged when an expert write fails',
      async () => {
        const {
          component,
          fixture,
          expertAccessService,
          writeExecutionService,
        } = await createExpertScalarPage(
          'garline',
          professionalValue('garline', 80, 100, {
            obstacleSensitivity: 2,
          }),
          expertScalarExecutionResult(
            'garline',
            'obstacle-sensitivity',
            '07 03',
            'failed',
          ),
        );
        const control = component.expertScalarControls.find(
          (candidate) =>
            candidate.config.field === 'obstacle-sensitivity',
        )!.config;
        component.setActiveMainTab('settings');
        component.setActiveSettingsTab('advanced');
        await fixture.whenStable();
        expect(expertAccessService.authenticate({
          profile: 'garline',
          deviceId: 'device-1',
          connectionGeneration: 4,
        }, PRODUCT_PAGE_EXPERT_ACCESS_TEST_CODE)).toBeTrue();

        component.setExpertScalarDraftValue(control, 3);
        await component.requestExpertScalarChange(control);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        expect(component.currentExpertScalarValue(control)).toBe(2);
        expect(component.expertScalarDraftValue(control)).toBe(3);
        expect(component.expertScalarWriteState.status).toBe('failed');
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).textContent)
          .toContain(component.text.expertScalarControls.failed);
      },
    );

    it('should reset expert scalar drafts after a BLE reload',
      async () => {
        const {
          component,
          loadService,
        } = await createExpertScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, { breakForceAtOpen: 5 }),
        );
        const control = component.expertScalarControls[0].config;

        component.setExpertScalarDraftValue(control, 8);
        expect(component.expertScalarDraftValue(control)).toBe(8);

        loadService.nextResult = completeLoadResult(
          'success',
          'widoor',
          userValue(),
          professionalValue('widoor', 0, 0, { breakForceAtOpen: 2 }),
        );
        await component.refreshProductData();

        expect(component.currentExpertScalarValue(control)).toBe(2);
        expect(component.expertScalarDraftValue(control)).toBe(2);
      },
    );

    it('should reset expert scalar editing on disconnection',
      async () => {
        const {
          component,
          bleService,
          expertAccessService,
        } = await createExpertScalarPage(
          'moventiv-80',
          professionalValue('moventiv-80', 50, 60, {
            nearOpenSpeed: 45,
            nearCloseSpeed: 55,
            nearOpenTorque: 90,
            nearCloseTorque: 110,
            brakingOpenPower: 40,
            obstacleSensitivity: 2,
          }),
        );
        const control = component.expertScalarControls[0].config;
        expect(expertAccessService.authenticate({
          profile: 'moventiv-80',
          deviceId: 'device-1',
          connectionGeneration: 4,
        }, PRODUCT_PAGE_EXPERT_ACCESS_TEST_CODE)).toBeTrue();

        component.setExpertScalarDraftValue(control, 50);
        component.expertScalarWriteState = Object.freeze({
          status: 'failed',
          field: control.field,
          message: 'failed',
        });

        bleService.disconnect();

        expect(component.expertScalarDraftValue(control))
          .toBe(control.range.min);
        expect(component.expertScalarWriteState).toEqual({
          status: 'idle',
          field: null,
          message: null,
        });
        expect(component.expertAccessGranted).toBeFalse();
        expect(component.canApplyExpertScalar(control)).toBeFalse();
      },
    );

    it('should keep protected expert settings hidden before access',
      async () => {
        const {
          component,
        } = await createExpertScalarPage(
          'moventiv-80',
          professionalValue('moventiv-80', 50, 60, {
            nearOpenSpeed: 45,
            nearCloseSpeed: 55,
            brakingOpenPower: 40,
            obstacleSensitivity: 2,
            nearOpenTorque: 10,
            nearCloseTorque: 20,
          }),
        );

        expect(component.expertAccessGranted).toBeFalse();
        expect(component.showExpertAccessPrompt).toBeTrue();
        expect(component.visibleExpertScalarControls.map((control) =>
          control.config.field,
        )).toEqual(['near-open-speed', 'near-close-speed']);
        expect(component.expertRows.map((row) => row.key))
          .not.toContain('braking-open-power');
        expect(component.expertRows.map((row) => row.key))
          .not.toContain('obstacle-sensitivity');
        expect(component.expertRows.map((row) => row.key))
          .not.toContain('near-open-torque');
        expect(component.expertRows.map((row) => row.key))
          .not.toContain('near-close-torque');
        expect(component.expertRows.map((row) => row.key))
          .toContain('near-open-speed');
        expect(component.expertRows.map((row) => row.key))
          .toContain('near-close-speed');
        expect(component.expertRows.map((row) => row.key))
          .toContain('weight-range');
      },
    );

    it('should unlock protected expert settings with a valid code',
      async () => {
        const {
          component,
          fixture,
        } = await createExpertScalarPage(
          'moventiv-80',
          professionalValue('moventiv-80', 50, 60, {
            nearOpenSpeed: 45,
            nearCloseSpeed: 55,
            brakingOpenPower: 40,
            obstacleSensitivity: 2,
          }),
        );

        await component.requestExpertAccess();
        fixture.detectChanges();

        expect(component.expertAccessGranted).toBeTrue();
        expect(component.expertAccessState.status).toBe('unlocked');
        expect(component.showExpertAccessPrompt).toBeFalse();
        expect(component.visibleExpertScalarControls.map((control) =>
          control.config.field,
        )).toEqual([
          'near-open-speed',
          'near-close-speed',
          'near-open-torque',
          'near-close-torque',
          'braking-open-power',
          'obstacle-sensitivity',
        ]);
        expect(component.expertRows.map((row) => row.key))
          .toContain('braking-open-power');
        expect(component.expertRows.map((row) => row.key))
          .toContain('near-open-torque');
      },
    );

    it('should render Phase 1 advanced settings without bypassing access',
      async () => {
        const {
          component,
          fixture,
          writeExecutionService,
        } = await createExpertScalarPage(
          'moventiv-80',
          professionalValue('moventiv-80', 50, 60, {
            nearOpenSpeed: 45,
            nearCloseSpeed: 55,
            brakingOpenPower: 40,
            obstacleSensitivity: 2,
            nearOpenTorque: 90,
            nearCloseTorque: 110,
          }),
        );
        const protectedControl = component.expertScalarControls.find(
          (candidate) => candidate.config.field === 'braking-open-power',
        )!.config;
        const advancedControl = component.expertScalarControls.find(
          (candidate) => candidate.config.field === 'near-open-speed',
        )!.config;

        component.setActiveMainTab('settings');
        component.setActiveSettingsTab('advanced');
        component.toggleExpertScalarLock(protectedControl);
        component.toggleExpertScalarLock(advancedControl);
        component.toggleExpertScalarPrecision(
          advancedControl,
          new Event('click'),
        );
        fixture.detectChanges();

        let element = fixture.nativeElement as HTMLElement;
        const advancedPanel = element.querySelector<HTMLElement>(
          '.advanced-settings-panel',
        );
        expect(advancedPanel).not.toBeNull();
        expect(component.expertAccessGranted).toBeFalse();
        expect(component.visibleExpertScalarControls.map((control) =>
          control.config.field,
        )).toEqual(['near-open-speed', 'near-close-speed']);
        expect(component.canApplyExpertScalar(protectedControl))
          .toBeFalse();
        expect(Array.from(element.querySelectorAll<HTMLElement>(
          '[data-professional-scalar-field]',
        )).map((row) => row.getAttribute('data-professional-scalar-field')))
          .toEqual(['near-open-speed', 'near-close-speed']);
        expect(element.querySelector('.phase1-mov-expert-mode-header'))
          .toBeNull();
        expect(element.querySelectorAll(
          '[data-professional-scalar-header] .advanced-lock-icon',
        ).length).toBe(2);
        expect(element.querySelector<HTMLImageElement>(
          'img[src="assets/img/icon_speed.svg"]',
        )).not.toBeNull();
        expect(element.querySelector<HTMLElement>(
          '[data-professional-scalar-field] ion-icon',
        )).not.toBeNull();
        const advancedPrecision = element.querySelector<HTMLElement>(
          '[data-professional-scalar-precision="near-open-speed"]',
        );
        expect(advancedPrecision).not.toBeNull();
        expect(advancedPrecision?.textContent)
          .toContain(component.text.shell.increase);
        expect(advancedPrecision?.textContent)
          .toContain(component.text.shell.decrease);
        expect(getComputedStyle(advancedPrecision!).order).toBe('40');

        await component.requestExpertAccess();
        component.toggleExpertScalarLock(protectedControl);
        component.toggleExpertScalarPrecision(
          protectedControl,
          new Event('click'),
        );
        fixture.detectChanges();
        element = fixture.nativeElement as HTMLElement;

        expect(component.expertAccessGranted).toBeTrue();
        expect(Array.from(element.querySelectorAll<HTMLElement>(
          '[data-professional-scalar-field]',
        )).map((row) => row.getAttribute('data-professional-scalar-field')))
          .toEqual([
            'near-open-speed',
            'near-close-speed',
            'near-open-torque',
            'near-close-torque',
            'braking-open-power',
            'obstacle-sensitivity',
          ]);
        expect(element.querySelector('.phase1-mov-expert-mode-header')
          ?.textContent).toContain('Mode expert');
        expect(element.querySelectorAll(
          '[data-professional-scalar-header] .advanced-lock-icon',
        ).length).toBe(6);
        expect(element.querySelector<HTMLImageElement>(
          'img[src="assets/img/icon_force.svg"]',
        )).not.toBeNull();
        const expertPrecision = element.querySelector<HTMLElement>(
          '[data-professional-scalar-precision="braking-open-power"]',
        );
        expect(expertPrecision).not.toBeNull();
        expect(expertPrecision?.textContent)
          .toContain(component.text.shell.increase);
        expect(expertPrecision?.textContent)
          .toContain(component.text.shell.decrease);
        expect(getComputedStyle(expertPrecision!).order).toBe('40');
        expect(writeExecutionService.execute).not.toHaveBeenCalled();
      },
    );

    it('should keep Widoor advanced actions routed through existing handlers',
      async () => {
        const {
          component,
          fixture,
          writeExecutionService,
        } = await createExpertScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, {
            breakForceAtOpen: 5,
            nearOpenSpeed: 25,
            nearCloseSpeed: 35,
          }),
        );
        const requestSensitiveAction = spyOn(component, 'requestSensitiveAction')
          .and.resolveTo();

        component.setActiveMainTab('settings');
        component.setActiveSettingsTab('advanced');
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        expect(Array.from(element.querySelectorAll<HTMLElement>(
          '[data-sensitive-action]',
        )).map((row) => row.getAttribute('data-sensitive-action'))).toEqual([
          'learning',
          'professional-peripheral-lock',
          'reset',
        ]);
        expect(element.querySelector(
          '[data-sensitive-action="radar-test-1"]',
        )).toBeNull();
        expect(element.querySelector(
          '[data-sensitive-action="radar-test-2"]',
        )).toBeNull();
        expect(element.querySelector<HTMLElement>(
          '[data-sensitive-action="professional-peripheral-lock"] ' +
            '.product-lock-state-icon.ai-lock-open',
        )).not.toBeNull();
        expect(element.textContent).toContain('Configuration des sorties');
        expect(element.textContent).toContain('Commandes supplémentaires');
        expect(element.textContent).toContain(
          component.text.sensitiveActions.peripheralLock,
        );
        expect(element.textContent).toContain(
          component.text.sensitiveActions.reset,
        );
        expect(component.showExpertAccessPrompt).toBeFalse();
        expect(component.canExecuteSensitiveAction(
          component.sensitiveActions.find((action) =>
            action.action === 'radar-test-1',
          )!,
        )).toBeTrue();
        expect(component.canExecuteSensitiveAction(
          component.sensitiveActions.find((action) =>
            action.action === 'professional-peripheral-lock',
          )!,
        )).toBeTrue();

        const learningButton = element.querySelector<HTMLIonButtonElement>(
          '[data-sensitive-action="learning"] ion-button',
        );
        learningButton?.click();
        fixture.detectChanges();

        expect(requestSensitiveAction)
          .toHaveBeenCalledOnceWith(component.sensitiveActions[0]);
        expect(writeExecutionService.execute).not.toHaveBeenCalled();
      },
    );

    it('should keep a large action button visually stable while its write is pending',
      async () => {
        const {
          component,
          fixture,
          writeExecutionService,
        } = await createExpertScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, {
            breakForceAtOpen: 5,
            nearOpenSpeed: 25,
            nearCloseSpeed: 35,
          }),
        );
        const action = component.sensitiveActions.find((candidate) =>
          candidate.action === 'learning',
        )!;
        let resolveWrite!: (result: LegacyBleWriteExecutionResult) => void;
        const result = writeExecutionService.nextResult;
        writeExecutionService.execute.and.returnValue(
          new Promise<LegacyBleWriteExecutionResult>((resolve) => {
            resolveWrite = resolve;
          }),
        );
        component.setActiveMainTab('settings');
        component.setActiveSettingsTab('advanced');
        fixture.detectChanges();

        const before = (fixture.nativeElement as HTMLElement)
          .querySelector<HTMLIonButtonElement>(
            '[data-sensitive-action="learning"] ion-button',
          )!;
        const pending = component.requestSensitiveAction(action);
        while (!writeExecutionService.execute.calls.any()) {
          await Promise.resolve();
        }
        fixture.detectChanges();

        const during = (fixture.nativeElement as HTMLElement)
          .querySelector<HTMLIonButtonElement>(
            '[data-sensitive-action="learning"] ion-button',
          )!;
        expect(during).toBe(before);
        expect(during.disabled).toBeTrue();
        expect(during.classList).toContain('action-write-pending');
        expect(getComputedStyle(during).opacity).toBe('1');
        expect(component.viewModel.loading).toBeFalse();

        resolveWrite(result);
        await pending;
      },
    );

    it('should mirror Widoor input and lock switch states after successful writes',
      async () => {
        const {
          component,
          fixture,
          writeExecutionService,
        } = await createExpertScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, {
            breakForceAtOpen: 5,
            nearOpenSpeed: 25,
            nearCloseSpeed: 35,
          }),
        );

        component.activeMainTab = 'settings';
        component.activeSettingsTab = 'advanced';
        fixture.detectChanges();

        const input = component.expertInputControls[0].config;
        let element = fixture.nativeElement as HTMLElement;
        let inputRow = element.querySelector<HTMLElement>(
          `[data-professional-input-field="${input.field}"]`,
        );
        expect(inputRow?.querySelector('img[src="assets/img/icon_button.svg"]'))
          .not.toBeNull();
        expect(inputRow?.querySelector('.advanced-value-negative'))
          .not.toBeNull();

        component.toggleExpertInputControlLock();
        await component.requestExpertInputChange(input, 'radar');
        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        expect(component.currentExpertInputMode(input)).toBe('radar');
        fixture.detectChanges();
        element = fixture.nativeElement as HTMLElement;
        inputRow = element.querySelector<HTMLElement>(
          `[data-professional-input-field="${input.field}"]`,
        );
        expect(inputRow?.querySelector('img[src="assets/img/icon_radar.svg"]'))
          .not.toBeNull();
        expect(inputRow?.querySelector('.advanced-value-positive'))
          .not.toBeNull();
        expect(inputRow?.textContent).toContain(
          component.text.expertInputControls.radar,
        );

        writeExecutionService.execute.calls.reset();
        const lock = component.sensitiveActions.find((action) =>
          action.action === 'professional-peripheral-lock',
        )!;
        await component.requestSensitiveAction(lock, true);
        fixture.detectChanges();

        const lockRow = (fixture.nativeElement as HTMLElement)
          .querySelector<HTMLElement>(
            '[data-sensitive-action="professional-peripheral-lock"]',
          );
        expect(lockRow?.querySelector('.product-lock-state-icon.ai-lock-close'))
          .not.toBeNull();
        expect(lockRow?.querySelector('.advanced-value-positive'))
          .not.toBeNull();
        expect(lockRow?.textContent).toContain(
          component.text.expertPeripheralDiagnostics.enabled,
        );
        expect(writeExecutionService.execute).toHaveBeenCalled();
        expect((fixture.nativeElement as HTMLElement).textContent)
          .not.toContain(component.text.sensitiveActions.sent);

        component.sensitiveActionState = Object.freeze({
          status: 'failed',
          action: lock.action,
          message: component.text.sensitiveActions.failed,
        });
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).textContent)
          .toContain(component.text.sensitiveActions.failed);
      },
    );

    it('should immediately mirror both Widoor peripheral-lock transitions',
      async () => {
        const {
          component,
          fixture,
          writeExecutionService,
        } = await createExpertScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, {
            breakForceAtOpen: 5,
            nearOpenSpeed: 25,
            nearCloseSpeed: 35,
          }),
        );
        component.setActiveMainTab('settings');
        component.setActiveSettingsTab('advanced');
        fixture.detectChanges();
        const lock = component.sensitiveActions.find((action) =>
          action.action === 'professional-peripheral-lock',
        )!;
        const result = writeExecutionService.nextResult;
        let resolveWrite!: (value: LegacyBleWriteExecutionResult) => void;
        writeExecutionService.execute.and.callFake(() =>
          new Promise<LegacyBleWriteExecutionResult>((resolve) => {
            resolveWrite = resolve;
          }),
        );
        const lockRow = () => (fixture.nativeElement as HTMLElement)
          .querySelector<HTMLElement>(
            '[data-sensitive-action="professional-peripheral-lock"]',
          );

        const enable = component.requestSensitiveAction(lock, true);
        fixture.detectChanges();

        expect(component.sensitiveActionState.status).toBe('executing');
        expect(component.sensitiveActionCurrentEnabled(lock)).toBeTrue();
        expect(lockRow()?.querySelector(
          '.product-lock-state-icon.ai-lock-close',
        )).not.toBeNull();
        expect(lockRow()?.querySelector('.product-lock-state-icon.ai-lock-open'))
          .toBeNull();
        expect(getComputedStyle(lockRow()!.querySelector<HTMLElement>(
          '.product-lock-state-icon',
        )!).backgroundImage).toContain('icon_padlock_closed.svg');

        resolveWrite(result);
        await enable;

        const disable = component.requestSensitiveAction(lock, false);
        fixture.detectChanges();

        expect(component.sensitiveActionState.status).toBe('executing');
        expect(component.sensitiveActionCurrentEnabled(lock)).toBeFalse();
        expect(lockRow()?.querySelector(
          '.product-lock-state-icon.ai-lock-open',
        )).not.toBeNull();
        expect(lockRow()?.querySelector('.product-lock-state-icon.ai-lock-close'))
          .toBeNull();
        expect(getComputedStyle(lockRow()!.querySelector<HTMLElement>(
          '.product-lock-state-icon',
        )!).backgroundImage).toContain('icon_padlock_open.svg');

        resolveWrite(result);
        await disable;
        expect(component.sensitiveActionState.status).toBe('sent');
      },
    );

    it('should restore the Widoor lock icon after a failed write',
      async () => {
        const {
          component,
          fixture,
          writeExecutionService,
        } = await createExpertScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, {
            breakForceAtOpen: 5,
            nearOpenSpeed: 25,
            nearCloseSpeed: 35,
          }),
        );
        writeExecutionService.nextResult = {
          ...writeExecutionService.nextResult,
          status: 'failed',
          nativeWriteCompleted: false,
          error: { code: 'native-write-failed', message: 'Native failure' },
        };
        component.setActiveMainTab('settings');
        component.setActiveSettingsTab('advanced');
        fixture.detectChanges();
        const lock = component.sensitiveActions.find((action) =>
          action.action === 'professional-peripheral-lock',
        )!;

        await component.requestSensitiveAction(lock, true);
        fixture.detectChanges();

        expect(component.sensitiveActionState.status).toBe('failed');
        expect(component.sensitiveActionCurrentEnabled(lock)).toBeFalse();
        expect((fixture.nativeElement as HTMLElement).querySelector(
          '[data-sensitive-action="professional-peripheral-lock"] ' +
            '.product-lock-state-icon.ai-lock-open',
        )).not.toBeNull();
      },
    );

    it('should keep the Widoor firmware guard on a real product',
      async () => {
        const {
          component,
          writeExecutionService,
        } = await createExpertScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, {
            breakForceAtOpen: 5,
            nearOpenSpeed: 25,
            nearCloseSpeed: 35,
          }),
        );
        const version = component.viewModel.reads.version;
        if (version.status !== 'available') {
          fail('Expected an available Widoor version');
          return;
        }
        component.viewModel = {
          ...component.viewModel,
          reads: {
            ...component.viewModel.reads,
            version: {
              ...version,
              value: {
                ...version.value!,
                motorSoftware: {
                  major: 1,
                  minor: 0,
                  patch: 0,
                  specification: 0,
                },
              },
            },
          },
        };
        const lock = component.sensitiveActions.find((action) =>
          action.action === 'professional-peripheral-lock',
        )!;

        expect(component.isDemoMode).toBeFalse();
        expect(component.canExecuteSensitiveAction(lock)).toBeFalse();

        await component.requestSensitiveAction(lock, true);

        expect(writeExecutionService.execute).not.toHaveBeenCalled();
      },
    );

    it('should omit the Widoor motor-state empty placeholder', async () => {
      const { component, fixture } = await createExpertScalarPage(
        'widoor',
        professionalValue('widoor', 0, 0),
      );
      component.viewModel = {
        ...component.viewModel,
        motorState: null,
      };
      component.setActiveMainTab('information');
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent)
        .not.toContain(component.text.noMotorState);
      expect((fixture.nativeElement as HTMLElement).querySelector(
        '.product-information-panel',
      )).not.toBeNull();
    });

    it('should render Widoor braking force ticks and gate precision controls',
      async () => {
        const { component, fixture, writeExecutionService } =
          await createExpertScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, {
            breakForceAtOpen: 5,
            nearOpenSpeed: 25,
            nearCloseSpeed: 35,
          }),
        );
        component.setActiveMainTab('settings');
        component.setActiveSettingsTab('advanced');
        fixture.detectChanges();

        const force = component.expertScalarControls.find((control) =>
          control.config.field === 'break-force-at-open',
        )!.config;
        let row = (fixture.nativeElement as HTMLElement)
          .querySelector<HTMLElement>(
            '[data-professional-scalar-field="break-force-at-open"]',
          );
        const range = row?.querySelector<HTMLIonRangeElement>('ion-range');
        const header = (fixture.nativeElement as HTMLElement)
          .querySelector<HTMLElement>(
            '[data-professional-scalar-header="break-force-at-open"]',
          );
        expect(range?.ticks).toBeTrue();
        expect(range?.snaps).toBeTrue();
        expect(range?.pin).toBeFalse();
        expect(parseFloat(getComputedStyle(header!).borderTopWidth))
          .toBeGreaterThan(0);
        expect(getComputedStyle(header!).borderBottomWidth).toBe('0px');

        row?.click();
        fixture.detectChanges();
        expect(component.isExpertScalarUnlocked(force)).toBeTrue();
        expect(component.isExpertScalarPrecisionOpen(force)).toBeFalse();
        expect((fixture.nativeElement as HTMLElement)
          .querySelector('.advanced-precision-row')).toBeNull();

        range?.dispatchEvent(new CustomEvent('ionInput', {
          bubbles: true,
          detail: { value: 7 },
        }));
        fixture.detectChanges();
        expect(component.expertScalarDraftValue(force)).toBe(7);
        expect((fixture.nativeElement as HTMLElement).querySelector(
          '[data-professional-scalar-header="break-force-at-open"] ' +
          '.advanced-value-badge',
        )?.textContent).toContain('7');
        expect(writeExecutionService.execute).not.toHaveBeenCalled();

        row = (fixture.nativeElement as HTMLElement)
          .querySelector<HTMLElement>(
            '[data-professional-scalar-field="break-force-at-open"]',
          );
        row?.querySelector<HTMLElement>('.slider-options-toggle')?.click();
        fixture.detectChanges();
        expect(component.isExpertScalarPrecisionOpen(force)).toBeTrue();
        expect((fixture.nativeElement as HTMLElement)
          .querySelector('.advanced-precision-row')).not.toBeNull();
      },
    );

    it('should execute Garline learning immediately without user authorization',
      async () => {
        const {
          component,
          fixture,
          writeExecutionService,
        } = await createExpertScalarPage(
          'garline',
          professionalValue('garline', 80, 100, {
            nearOpenSpeed: 25,
            nearCloseSpeed: 35,
            obstacleSensitivity: 2,
          }),
        );

        component.setActiveMainTab('settings');
        component.setActiveSettingsTab('advanced');
        fixture.detectChanges();
        const action = component.sensitiveActions.find((candidate) =>
          candidate.action === 'learning',
        )!;

        expect(component.canExecuteSensitiveAction(action)).toBeTrue();

        await component.requestSensitiveAction(action);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.profile).toBe('garline');
        expect(request.write.operation).toBe('motor-learning');
        expect(request.write.payloadHex).toBe('00 12');
        expect(request.policy).toEqual(jasmine.objectContaining({
          allowPhase1ReferenceOnly: true,
          allowGarlinePhase1ImmediateWrite: true,
          allowLearning: true,
        }));
        expect(request.authorization).toBeNull();
      },
    );

    for (const actionName of [
      'radar-test-1',
      'radar-test-2',
      'professional-peripheral-lock',
    ] as const) {
      it(`should execute Widoor ${actionName} without expert access`,
        async () => {
          const {
            component,
            writeExecutionService,
          } = await createExpertScalarPage(
            'widoor',
            professionalValue('widoor', 0, 0, {
              breakForceAtOpen: 5,
              nearOpenSpeed: 25,
              nearCloseSpeed: 35,
            }),
          );
          const action = component.sensitiveActions.find((candidate) =>
            candidate.action === actionName,
          )!;

          expect(component.expertAccessGranted).toBeFalse();
          expect(component.canExecuteSensitiveAction(action)).toBeTrue();

          await component.requestSensitiveAction(action, true);

          expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
          const request = writeExecutionService.execute.calls.mostRecent()
            .args[0] as LegacyBleWriteRequest;
          expect(request.authorization).toBeNull();
        },
      );
    }

    it('should execute Widoor sensitive actions without expert access',
      async () => {
        const {
          component,
          writeExecutionService,
        } = await createExpertScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, {
            breakForceAtOpen: 5,
            nearOpenSpeed: 25,
            nearCloseSpeed: 35,
          }),
        );
        const radarTest = component.sensitiveActions.find((action) =>
          action.action === 'radar-test-1',
        )!;
        const scalar = component.expertScalarControls.find((control) =>
          control.config.field === 'break-force-at-open',
        )!.config;

        component.toggleExpertScalarLock(scalar);
        component.toggleExpertInputControlLock();

        expect(component.expertAccessGranted).toBeFalse();
        expect(component.canExecuteSensitiveAction(radarTest)).toBeTrue();

        await component.requestSensitiveAction(radarTest, true);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.authorization).toBeNull();
      },
    );

    it('should keep near open and near close speed drafts independent',
      async () => {
        const {
          component,
          writeExecutionService,
        } = await createExpertScalarPage(
          'moventiv-80',
          professionalValue('moventiv-80', 50, 60, {
            nearOpenSpeed: 45,
            nearCloseSpeed: 55,
            nearOpenTorque: 90,
            nearCloseTorque: 110,
            brakingOpenPower: 40,
            obstacleSensitivity: 2,
          }),
          expertScalarExecutionResult(
            'moventiv-80',
            'near-open-speed',
            '02 32',
          ),
        );
        const nearOpenSpeed = component.expertScalarControls.find(
          (candidate) => candidate.config.field === 'near-open-speed',
        )!.config;
        const nearCloseSpeed = component.expertScalarControls.find(
          (candidate) => candidate.config.field === 'near-close-speed',
        )!.config;

        component.setExpertScalarDraftValue(nearOpenSpeed, 50);

        expect(component.expertScalarDraftValue(nearOpenSpeed))
          .toBe(50);
        expect(component.expertScalarDraftValue(nearCloseSpeed))
          .toBe(55);

        await component.requestExpertScalarChange(nearOpenSpeed);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.write.operation).toBe('near-open-speed');
        expect(request.write.payloadHex).toBe('02 32');
      },
    );

    it('should keep near open and near close torque drafts independent',
      async () => {
        const {
          component,
          expertAccessService,
          writeExecutionService,
        } = await createExpertScalarPage(
          'moventiv-80',
          professionalValue('moventiv-80', 50, 60, {
            nearOpenSpeed: 45,
            nearCloseSpeed: 55,
            nearOpenTorque: 90,
            nearCloseTorque: 110,
            brakingOpenPower: 40,
            obstacleSensitivity: 2,
          }),
          expertScalarExecutionResult(
            'moventiv-80',
            'near-open-torque',
            '04 78',
          ),
        );
        expect(expertAccessService.authenticate({
          profile: 'moventiv-80',
          deviceId: 'device-1',
          connectionGeneration: 4,
        }, PRODUCT_PAGE_EXPERT_ACCESS_TEST_CODE)).toBeTrue();
        const nearOpenTorque = component.expertScalarControls.find(
          (candidate) => candidate.config.field === 'near-open-torque',
        )!.config;
        const nearCloseTorque = component.expertScalarControls.find(
          (candidate) => candidate.config.field === 'near-close-torque',
        )!.config;

        component.setExpertScalarDraftValue(nearOpenTorque, 120);

        expect(component.expertScalarDraftValue(nearOpenTorque))
          .toBe(120);
        expect(component.expertScalarDraftValue(nearCloseTorque))
          .toBe(110);

        await component.requestExpertScalarChange(nearOpenTorque);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.write.operation).toBe('near-open-torque');
        expect(request.write.payloadHex).toBe('04 78');
      },
    );

    it('should reject an incorrect expert access code without writing',
      async () => {
        const {
          component,
          writeExecutionService,
        } = await createExpertScalarPage(
          'garline',
          professionalValue('garline', 80, 100, {
            obstacleSensitivity: 2,
          }),
          expertScalarExecutionResult(
            'garline',
            'obstacle-sensitivity',
            '07 03',
          ),
          {
            role: 'confirm',
            data: { values: { expertAccessCode: 'bad-code' } },
          },
        );

        await component.requestExpertAccess();

        expect(component.expertAccessGranted).toBeFalse();
        expect(component.expertAccessState.status).toBe('failed');
        expect(component.visibleExpertScalarControls.map((control) =>
          control.config.field,
        )).toEqual(['near-open-speed', 'near-close-speed']);
        expect(writeExecutionService.execute).not.toHaveBeenCalled();
      },
    );

    it('should reject an expert scalar config from another profile',
      async () => {
        const {
          component,
          writeExecutionService,
        } = await createExpertScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, { breakForceAtOpen: 5 }),
        );
        const garlineObstacle = productExpertScalarConfigsFor(
          PRODUCT_PAGE_CONFIG.garline,
        )[0];

        component.setExpertScalarDraftValue(garlineObstacle, 3);
        await component.requestExpertScalarChange(garlineObstacle);

        expect(writeExecutionService.execute).not.toHaveBeenCalled();
        expect(component.canApplyExpertScalar(garlineObstacle))
          .toBeFalse();
      },
    );

    it('should keep previous setting groups and motor commands available',
      async () => {
        const {
          component,
        } = await createExpertScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, { breakForceAtOpen: 5 }),
        );

        expect(component.showExpertScalarControls).toBeTrue();
        expect(component.showWeightRangeControls).toBeFalse();
        expect(component.showUserSpeedControls).toBeTrue();
        expect(component.showUserTimingControls).toBeTrue();
        expect(component.showLockModeControls).toBeFalse();
        expect(component.showProductMotorCommands).toBeTrue();
      },
    );
  },
);

describe('ProductPage lock-mode controls for profile variants', () => {
  it('should not expose Garline lock-mode controls',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = completeLoadResult(
        'success',
        'garline',
        userValueWithLockMode('none'),
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'confirm' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'garline' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('garline') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      await component.refreshProductData();
      fixture.detectChanges();

      expect(component.lockModeControls.map((control) =>
        control.config.mode,
      )).toEqual([]);
      expect(component.showLockModeControls).toBeFalse();
      expect(fixture.nativeElement.textContent).not.toContain(
        component.text.lockModeControls.lockedOpen.label,
      );
      expect(fixture.nativeElement.textContent).not.toContain(
        component.text.lockModeControls.lockedClosed.label,
      );

      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(alertCreate).not.toHaveBeenCalled();
    },
  );
});

describe('ProductPage product date maintenance actions', () => {
  for (const profile of [
    'moventiv-60',
    'moventiv-80',
    'garline',
  ] as const) {
    it(`should expose setup action for ${profile} when first date is empty`,
      async () => {
        const harness = await createProductDateHarness(
          profile,
          notInitializedHistoricalDate(),
        );

        expect(harness.component.showProductDateMaintenanceAction).toBeTrue();
        expect(harness.component.productDateMaintenanceActionLabel)
          .toBe(harness.component.text.productDateActions.setupLabel);
        expect(harness.fixture.nativeElement.textContent).toContain(
          harness.component.text.productDateActions.setupLabel,
        );
        expect(harness.component.canRequestProductDateMaintenanceAction())
          .toBeTrue();
      },
    );
  }

  it('should expose maintenance action when first date is already present',
    async () => {
      const harness = await createProductDateHarness(
        'moventiv-80',
        presentHistoricalDate(),
      );

      expect(harness.component.showProductDateMaintenanceAction).toBeTrue();
      expect(harness.component.productDateMaintenanceActionLabel)
        .toBe(harness.component.text.productDateActions.maintenanceLabel);
      expect(harness.fixture.nativeElement.textContent).toContain(
        harness.component.text.productDateActions.maintenanceLabel,
      );
    },
  );

  it('should place maintenance actions in the advanced settings tab',
    async () => {
      const harness = await createProductDateHarness(
        'garline',
        presentHistoricalDate(),
      );
      const requestProductDateMaintenanceAction = spyOn(
        harness.component,
        'requestProductDateMaintenanceAction',
      ).and.resolveTo();

      harness.component.setActiveMainTab('settings');
      harness.component.setActiveSettingsTab('advanced');
      harness.fixture.detectChanges();

      const element = harness.fixture.nativeElement as HTMLElement;
      const advancedButton = element.querySelector<HTMLIonButtonElement>(
        '.phase1-mov-maintenance-action-row ion-button',
      );
      expect(advancedButton?.textContent).toContain(
        harness.component.text.productDateActions.maintenanceLabel,
      );

      advancedButton?.click();
      harness.fixture.detectChanges();

      expect(requestProductDateMaintenanceAction).toHaveBeenCalledTimes(1);

      harness.component.setActiveMainTab('information');
      harness.fixture.detectChanges();
      expect(element.querySelector<HTMLIonButtonElement>(
        'section[aria-labelledby="information-title"] ion-button[color="warning"]',
      )).toBeNull();
    },
  );

  it('should never expose product date actions on Widoor', async () => {
    const harness = await createProductDateHarness(
      'widoor',
      notInitializedHistoricalDate(),
    );

    expect(harness.component.showProductDateMaintenanceAction).toBeFalse();
    expect(harness.component.canRequestProductDateMaintenanceAction())
      .toBeFalse();
    expect(harness.fixture.nativeElement.textContent).not.toContain(
      harness.component.text.productDateActions.setupLabel,
    );
    expect(harness.fixture.nativeElement.textContent).not.toContain(
      harness.component.text.productDateActions.maintenanceLabel,
    );
  });

  it('should ask the maintenance code and write maintenance then first date',
    async () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2026, 0, 2, 3, 59, 58));
      try {
        const harness = await createProductDateHarness(
          'garline',
          notInitializedHistoricalDate(),
        );
        harness.writeExecutionService.nextResults = [
          productDateExecutionResult(
            'garline',
            'maintenance-date',
            '02 1a 00 02 03',
          ),
          productDateExecutionResult(
            'garline',
            'first-commissioning-date',
            '01 1a 00 02 03',
          ),
        ];

        await harness.component.requestProductDateMaintenanceAction();

        expect(harness.alertCreate).toHaveBeenCalledTimes(1);
        expect(harness.alertOptions[0]['message']).toContain(
          'mise en service',
        );
        expect(harness.maintenanceAccessService.authenticate)
          .toHaveBeenCalledOnceWith(jasmine.objectContaining({
            profile: 'garline',
            deviceId: 'device-1',
            connectionGeneration: 4,
          }), PRODUCT_PAGE_MAINTENANCE_ACCESS_TEST_CODE);
        expect(harness.maintenanceAccessService.reset).toHaveBeenCalledWith(
          jasmine.objectContaining({
            profile: 'garline',
            deviceId: 'device-1',
            connectionGeneration: 4,
          }),
        );
        expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(2);
        const requests = harness.writeExecutionService.execute.calls.allArgs()
          .map(([request]) => request as LegacyBleWriteRequest);
        expect(requests.map(({ write }) => write.operation)).toEqual([
          'maintenance-date',
          'first-commissioning-date',
        ]);
        expect(requests.map(({ write }) => write.payloadHex)).toEqual([
          '02 1a 00 02 03',
          '01 1a 00 02 03',
        ]);
        expect(requests.every((request) =>
          request.profile === 'garline' &&
          request.deviceId === 'device-1' &&
          request.connectionGeneration === 4,
        )).toBeTrue();
        expect(harness.component.productDateActionState.status).toBe('sent');
        expect(harness.component.productDateActionState.message)
          .toBe(harness.component.text.productDateActions.setupSent);
        expect(harness.loadService.loadProductData).toHaveBeenCalledTimes(2);
      } finally {
        jasmine.clock().uninstall();
      }
    },
  );

  it('should ask the maintenance code again for each maintenance action',
    async () => {
      const harness = await createProductDateHarness(
        'garline',
        presentHistoricalDate(),
      );

      await harness.component.requestProductDateMaintenanceAction();
      await harness.component.requestProductDateMaintenanceAction();

      expect(harness.alertCreate).toHaveBeenCalledTimes(2);
      expect(harness.maintenanceAccessService.authenticate)
        .toHaveBeenCalledTimes(2);
      expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(2);
    },
  );

  for (const profile of ['moventiv-60', 'garline'] as const) {
    it(`should write ${profile} maintenance only when first date is already initialized`,
      async () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2026, 11, 31, 23, 12, 30));
      try {
        const harness = await createProductDateHarness(
          profile,
          presentHistoricalDate(),
        );
        harness.writeExecutionService.nextResult = productDateExecutionResult(
          profile,
          'maintenance-date',
          '02 1a 0b 1f 17',
        );

        await harness.component.requestProductDateMaintenanceAction();

        expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = harness.writeExecutionService.execute.calls
          .mostRecent().args[0] as LegacyBleWriteRequest;
        expect(request.write.operation).toBe('maintenance-date');
        expect(request.write.payloadHex).toBe('02 1a 0b 1f 17');
        expect(harness.component.productDateActionState.status).toBe('sent');
        expect(harness.component.productDateActionState.message)
          .toBe(harness.component.text.productDateActions.maintenanceSent);
        expect(harness.loadService.loadProductData).toHaveBeenCalledTimes(1);
      } finally {
        jasmine.clock().uninstall();
      }
      },
    );
  }

  it('should reject wrong maintenance code and cancellation before any write',
    async () => {
      const wrongCodeHarness = await createProductDateHarness(
        'garline',
        presentHistoricalDate(),
        { accessCode: 'bad-code' },
      );

      await wrongCodeHarness.component.requestProductDateMaintenanceAction();

      expect(wrongCodeHarness.writeExecutionService.execute)
        .not.toHaveBeenCalled();
      expect(wrongCodeHarness.component.productDateActionState.status)
        .toBe('failed');
      expect(wrongCodeHarness.component.productDateActionState.message)
        .toBe(wrongCodeHarness.component.text.productDateActions.wrongCode);

      const cancelledHarness = await createProductDateHarness(
        'garline',
        presentHistoricalDate(),
        { alertRole: 'cancel' },
      );

      await cancelledHarness.component.requestProductDateMaintenanceAction();

      expect(cancelledHarness.maintenanceAccessService.authenticate)
        .not.toHaveBeenCalled();
      expect(cancelledHarness.writeExecutionService.execute)
        .not.toHaveBeenCalled();
      expect(cancelledHarness.component.productDateActionState.status)
        .toBe('cancelled');
    },
  );

  it('should report partial failure when setup maintenance succeeds and first date fails',
    async () => {
      const harness = await createProductDateHarness(
        'moventiv-80',
        notInitializedHistoricalDate(),
      );
      harness.writeExecutionService.nextResults = [
        productDateExecutionResult(
          'moventiv-80',
          'maintenance-date',
          '02 1a 00 02 03',
        ),
        productDateExecutionResult(
          'moventiv-80',
          'first-commissioning-date',
          '01 1a 00 02 03',
          'failed',
        ),
      ];

      await harness.component.requestProductDateMaintenanceAction();

      expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(2);
      expect(harness.component.productDateActionState.status)
        .toBe('partial-failed');
      expect(harness.component.productDateActionState.message)
        .toBe(harness.component.text.productDateActions.partialFailed);
      expect(harness.loadService.loadProductData).toHaveBeenCalledTimes(2);
    },
  );

  it('should not write first date when the maintenance write fails',
    async () => {
      const harness = await createProductDateHarness(
        'garline',
        notInitializedHistoricalDate(),
      );
      harness.writeExecutionService.nextResult = productDateExecutionResult(
        'garline',
        'maintenance-date',
        '02 1a 00 02 03',
        'failed',
      );

      await harness.component.requestProductDateMaintenanceAction();

      expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = harness.writeExecutionService.execute.calls
        .mostRecent().args[0] as LegacyBleWriteRequest;
      expect(request.write.operation).toBe('maintenance-date');
      expect(harness.component.productDateActionState.status).toBe('failed');
      expect(harness.loadService.loadProductData).toHaveBeenCalledTimes(2);
    },
  );

  it('should keep Garline initialized maintenance success without final refresh',
    async () => {
      const harness = await createProductDateHarness(
        'garline',
        presentHistoricalDate(),
      );
      harness.loadService.nextResult = productDateLoadResult(
        'garline',
        presentHistoricalDate(),
        'failed',
      );

      await harness.component.requestProductDateMaintenanceAction();

      expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(harness.component.productDateActionState.status).toBe('sent');
      expect(harness.component.productDateActionState.message)
        .toBe(harness.component.text.productDateActions.maintenanceSent);
      expect(harness.loadService.loadProductData).toHaveBeenCalledTimes(1);
    },
  );

  it('should report partial failure when the product disconnects after maintenance',
    async () => {
      const harness = await createProductDateHarness(
        'garline',
        notInitializedHistoricalDate(),
      );
      harness.writeExecutionService.execute.and.callFake(
        async () => {
          harness.bleService.disconnect();
          return productDateExecutionResult(
            'garline',
            'maintenance-date',
            '02 1a 00 02 03',
          );
        },
      );

      await harness.component.requestProductDateMaintenanceAction();

      expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(harness.component.productDateActionState.status)
        .toBe('partial-failed');
      expect(harness.component.productDateActionState.message)
        .toBe(harness.component.text.productDateActions.partialFailed);
    },
  );

  it('should report partial failure when the context becomes stale after maintenance',
    async () => {
      const harness = await createProductDateHarness(
        'moventiv-80',
        notInitializedHistoricalDate(),
      );
      harness.writeExecutionService.execute.and.callFake(
        async () => {
          harness.bleService.connectionGeneration = 5;
          return productDateExecutionResult(
            'moventiv-80',
            'maintenance-date',
            '02 1a 00 02 03',
          );
        },
      );

      await harness.component.requestProductDateMaintenanceAction();

      expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(harness.component.productDateActionState.status)
        .toBe('partial-failed');
      expect(harness.component.productDateActionState.message)
        .toBe(harness.component.text.productDateActions.partialFailed);
    },
  );

  it('should block double action and reset maintenance access on disconnection',
    async () => {
      const harness = await createProductDateHarness(
        'garline',
        presentHistoricalDate(),
      );

      harness.component.productDateActionState = Object.freeze({
        status: 'awaiting-confirmation',
        action: 'maintenance',
        message: harness.component.text.productDateActions
          .awaitingConfirmation,
      });
      expect(harness.component.canRequestProductDateMaintenanceAction())
        .toBeFalse();

      harness.bleService.disconnect();

      expect(harness.component.productDateActionState.status).toBe('idle');
      expect(harness.component.showProductDateMaintenanceAction).toBeFalse();
      expect(harness.maintenanceAccessService.reset).toHaveBeenCalled();
    },
  );
});

describe('ProductPage Demo mode', () => {
  it('should reject a forged Moventiv 80 Demo navigation context', () => {
    expect(isProductPageNavigationState({
      ...navigationState('moventiv-80'),
      mode: 'demo',
      identificationConfidence: 'demo',
    })).toBeFalse();
  });

  it('should load each Phase 1 Demo profile from local data only', async () => {
    const scenarios = [
      { profile: 'widoor', shortTime: 4, cycles: 0 },
      { profile: 'moventiv-60', shortTime: 4, cycles: 55989 },
      { profile: 'garline', shortTime: 1, cycles: 55989 },
    ] as const;

    for (const scenario of scenarios) {
      const harness = await createDemoHarness(scenario.profile);

      expect(harness.component.isDemoMode).toBeTrue();
      expect(harness.component.pageContextCurrent).toBeTrue();
      expect(harness.component.viewModel.connectionState).toBe('demo');
      expect(harness.component.viewModel.reads.version.status)
        .toBe('available');
      expect(harness.component.viewModel.reads.userParameters.value
        ?.shortOpenTime).toBe(scenario.shortTime);
      expect(harness.component.viewModel.reads.datesAndCycles.value
        ?.totalCycles).toBe(scenario.cycles);
      expect(harness.component.productCommands.length).toBeGreaterThan(0);
      expect(harness.component.showSettingsTab).toBeTrue();
      expect(harness.component.showInformationTab).toBeTrue();
      expect(harness.loadService.loadProductData).not.toHaveBeenCalled();
      expect(harness.bleService.getGattCharacteristicProperties)
        .not.toHaveBeenCalled();

      harness.fixture.destroy();
    }
  });

  it('should keep Demo motor commands local', async () => {
    const harness = await createDemoHarness('widoor');
    const command = harness.component.productCommands[0].config;

    expect(harness.component.canExecuteProductCommand(command)).toBeTrue();
    await harness.component.requestProductCommand(command);

    expect(harness.writeExecutionService.execute).not.toHaveBeenCalled();
    expect(harness.bleService.writeCharacteristic).not.toHaveBeenCalled();
  });

  it('should keep the Widoor Demo setup action but hide its sent message',
    async () => {
      const harness = await createDemoHarness('widoor', {
        confirmProductDateAction: true,
      });
      harness.component.setActiveMainTab('settings');
      harness.component.setActiveSettingsTab('advanced');
      harness.fixture.detectChanges();
      const action = harness.fixture.nativeElement.querySelector(
        'ion-button.advanced-historical-action',
      ) as HTMLIonButtonElement | null;

      expect(action?.textContent).toContain(
        harness.component.text.productDateActions.setupLabel,
      );

      await harness.component.requestProductDateMaintenanceAction();
      harness.fixture.detectChanges();

      expect(harness.component.productDateActionState.status).toBe('sent');
      expect(harness.component.productDateActionState.message)
        .toBe(harness.component.text.productDateActions.setupSent);
      expect(harness.fixture.nativeElement.textContent).not.toContain(
        harness.component.text.productDateActions.setupSent,
      );
      expect(harness.writeExecutionService.execute).not.toHaveBeenCalled();
      expect(harness.bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should update Demo sliders, toggles and name locally without BLE',
    async () => {
      localStorage.removeItem(ROOM_ASSIGNMENTS_STORAGE_KEY);
      const harness = await createDemoHarness('widoor');
      const speed = harness.component.userSpeedControls[0].config;
      const timing = harness.component.userTimingControls.find((control) =>
        control.config.field === 'short-timing',
      )!.config;
      const shortTimedCommand = harness.component.productCommands.find(
        (command) => command.config.operation === 'motor-open-short-timed',
      )!;
      const peripheral = harness.component.userPeripheralControls[0].config;
      const originalPeripheral = harness.component.currentUserPeripheralState(
        peripheral,
      );

      harness.component.setUserSpeedDraftValue(speed, 80);
      await harness.component.requestUserSpeedChange(speed);
      harness.component.setUserTimingDraftValue(timing, 4);
      expect(harness.component.productCommandDisplayLabel(shortTimedCommand))
        .toBe('Ouvrir 4 s');
      await harness.component.requestUserTimingChange(timing);
      await harness.component.requestUserPeripheralChange(
        peripheral,
        !originalPeripheral,
      );
      harness.component.setNameRoomDraftName('Demo locale');
      harness.component.setNameRoomDraftRoom('#SAL');
      await harness.component.requestNameRoomChange();

      expect(harness.component.currentUserSpeedValue(speed)).toBe(80);
      expect(harness.component.currentUserTimingValue(timing)).toBe(4);
      expect(harness.component.currentUserPeripheralState(peripheral))
        .toBe(!originalPeripheral);
      expect(harness.component.currentNameRoomValue()).toEqual({
        name: 'Demo locale',
        roomSuffix: '#SAL',
      });
      expect(harness.writeExecutionService.execute).not.toHaveBeenCalled();
      expect(harness.bleService.writeCharacteristic).not.toHaveBeenCalled();
      expect(localStorage.getItem(ROOM_ASSIGNMENTS_STORAGE_KEY)).toBeNull();
    },
  );

  it('should mirror the Moventiv Demo lock icon locally without BLE',
    async () => {
      const moventiv = await createDemoHarness('moventiv-60');
      const moventivLock = moventiv.component.lockModeControls[0].config;

      await moventiv.component.requestLockModeChange(moventivLock, true);
      moventiv.fixture.detectChanges();

      expect(moventiv.component.isLockModeActive(moventivLock)).toBeTrue();
      expect((moventiv.fixture.nativeElement as HTMLElement)
        .querySelector<HTMLElement>(
          '.phase1-mov-close-lock-command .product-lock-state-icon',
        )?.classList).toContain('ai-lock-close');
      expect(moventiv.writeExecutionService.execute).not.toHaveBeenCalled();
      expect(moventiv.bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should keep the Widoor Demo lock local and available like Phase 1',
    async () => {
      const widoor = await createDemoHarness('widoor');
      const lock = widoor.component.sensitiveActions.find((action) =>
        action.action === 'professional-peripheral-lock',
      )!;
      widoor.component.setActiveMainTab('settings');
      widoor.component.setActiveSettingsTab('advanced');
      widoor.fixture.detectChanges();
      const row = () => (widoor.fixture.nativeElement as HTMLElement)
        .querySelector<HTMLElement>(
          '[data-sensitive-action="professional-peripheral-lock"]',
        );

      expect(widoor.component.sensitiveActionCurrentEnabled(lock)).toBeFalse();
      expect(widoor.component.canExecuteSensitiveAction(lock)).toBeTrue();
      expect(row()?.querySelector<HTMLIonToggleElement>('ion-toggle')?.disabled)
        .toBeFalse();
      expect(row()?.querySelector('.product-lock-state-icon.ai-lock-open'))
        .not.toBeNull();

      await widoor.component.requestSensitiveAction(lock, true);
      widoor.fixture.detectChanges();

      expect(widoor.component.sensitiveActionCurrentEnabled(lock)).toBeTrue();
      expect(row()?.querySelector('.product-lock-state-icon.ai-lock-close'))
        .not.toBeNull();

      await widoor.component.requestSensitiveAction(lock, false);
      widoor.fixture.detectChanges();

      expect(widoor.component.sensitiveActionCurrentEnabled(lock)).toBeFalse();
      expect(row()?.querySelector('.product-lock-state-icon.ai-lock-open'))
        .not.toBeNull();
      expect(widoor.writeExecutionService.execute).not.toHaveBeenCalled();
      expect(widoor.bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should return from Demo without disconnect or connected exit state',
    async () => {
      const harness = await createDemoHarness('garline');
      const disconnect = spyOn(harness.bleService, 'disconnect')
        .and.callThrough();

      await harness.component.backToScan();

      expect(disconnect).not.toHaveBeenCalled();
      expect(harness.routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
      expect(harness.productExitState.consume()).toBeNull();
      expect(harness.loadService.cancelCurrentLoad).not.toHaveBeenCalled();
      expect(harness.inactivityService.isMonitoring()).toBeFalse();
    },
  );
});

async function createDemoHarness(
  profile: ProductDemoProfile,
  options: { readonly confirmProductDateAction?: boolean } = {},
): Promise<{
  readonly fixture: ComponentFixture<ProductPage>;
  readonly component: ProductPage;
  readonly bleService: FakeBleService;
  readonly loadService: FakeProductDataLoadService;
  readonly writeExecutionService: FakeBleWriteExecutionService;
  readonly routerNavigate: jasmine.Spy;
  readonly productExitState: ProductExitStateService;
  readonly inactivityService: ConnectedProductInactivityService;
}> {
  const bleService = new FakeBleService();
  bleService.connectedDeviceId = null;
  bleService.connectionGeneration = 0;
  const loadService = new FakeProductDataLoadService();
  const writeExecutionService = new FakeBleWriteExecutionService();
  const routerNavigate = jasmine.createSpy('navigate').and.resolveTo(true);
  const platform = new FakePlatform();
  const routerOutlet = { swipeGesture: true };
  const state = createProductDemoNavigationState(profile);
  const maintenanceAccessService = new FakeMaintenanceAccessService();

  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [ProductPage],
    providers: [
      { provide: BleService, useValue: bleService },
      {
        provide: AlertController,
        useValue: {
          create: jasmine.createSpy('create').and.resolveTo({
            present: async () => undefined,
            onDidDismiss: async () => options.confirmProductDateAction
              ? {
                  role: 'confirm',
                  data: {
                    values: {
                      maintenanceAccessCode:
                        PRODUCT_PAGE_MAINTENANCE_ACCESS_TEST_CODE,
                    },
                  },
                }
              : { role: 'cancel' },
          }),
        },
      },
      { provide: BleWriteExecutionService, useValue: writeExecutionService },
      {
        provide: MaintenanceAccessService,
        useValue: maintenanceAccessService,
      },
      { provide: ProductDataLoadService, useValue: loadService },
      { provide: ProductDetection, useClass: ProductDetection },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data: { profile } } },
      },
      {
        provide: Router,
        useValue: {
          getCurrentNavigation: () => ({ extras: { state } }),
          navigate: routerNavigate,
        },
      },
      { provide: Platform, useValue: platform },
      { provide: IonRouterOutlet, useValue: routerOutlet },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProductPage);
  const component = fixture.componentInstance;
  const productExitState = TestBed.inject(ProductExitStateService);
  const inactivityService = TestBed.inject(
    ConnectedProductInactivityService,
  );
  fixture.detectChanges();
  return {
    fixture,
    component,
    bleService,
    loadService,
    writeExecutionService,
    routerNavigate,
    productExitState,
    inactivityService,
  };
}

function navigationState(
  profile: KnownProductProfile,
): ProductPageNavigationState {
  return {
    profile,
    deviceId: 'device-1',
    connectionGeneration: 4,
    displayName: 'Porte#CHA',
    identificationConfidence: 'strong',
    motorState: null,
  };
}

async function createNameRoomProfileHarness(
  profile: KnownProductProfile,
): Promise<{
  readonly fixture: ComponentFixture<ProductPage>;
  readonly component: ProductPage;
  readonly writeExecutionService: FakeBleWriteExecutionService;
}> {
  const bleService = new FakeBleService();
  const loadService = new FakeProductDataLoadService();
  const writeExecutionService = new FakeBleWriteExecutionService();

  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [ProductPage],
    providers: [
      { provide: BleService, useValue: bleService },
      {
        provide: AlertController,
        useValue: {
          create: jasmine.createSpy('create').and.resolveTo({
            present: async () => undefined,
            onDidDismiss: async () => ({ role: 'confirm' }),
          }),
        },
      },
      { provide: BleWriteExecutionService, useValue: writeExecutionService },
      { provide: ProductDataLoadService, useValue: loadService },
      { provide: ProductDetection, useClass: ProductDetection },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data: { profile } } },
      },
      {
        provide: Router,
        useValue: {
          getCurrentNavigation: () => ({
            extras: { state: navigationState(profile) },
          }),
          navigate: jasmine.createSpy('navigate').and.resolveTo(true),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProductPage);
  const component = fixture.componentInstance;
  spyOn<any>(component, 'delay').and.resolveTo();
  fixture.detectChanges();

  return {
    fixture,
    component,
    writeExecutionService,
  };
}

async function createProductDateHarness(
  profile: KnownProductProfile,
  firstCommissioningDate: BleDatesAndCycles['firstCommissioningDate'],
  options: {
    readonly alertRole?: string;
    readonly accessCode?: string;
  } = {},
): Promise<{
  readonly fixture: ComponentFixture<ProductPage>;
  readonly component: ProductPage;
  readonly bleService: FakeBleService;
  readonly loadService: FakeProductDataLoadService;
  readonly writeExecutionService: FakeBleWriteExecutionService;
  readonly maintenanceAccessService: FakeMaintenanceAccessService;
  readonly alertCreate: jasmine.Spy;
  readonly alertOptions: Record<string, unknown>[];
}> {
  const bleService = new FakeBleService();
  const loadService = new FakeProductDataLoadService();
  loadService.nextResult = productDateLoadResult(
    profile,
    firstCommissioningDate,
  );
  const writeExecutionService = new FakeBleWriteExecutionService();
  writeExecutionService.nextResult = productDateExecutionResult(
    profile,
    'maintenance-date',
    '02 1a 00 02 03',
  );
  const maintenanceAccessService = new FakeMaintenanceAccessService();
  const alertOptions: Record<string, unknown>[] = [];
  const alertCreate = jasmine.createSpy('create').and.callFake(
    async (alert: Record<string, unknown>) => {
      alertOptions.push(alert);
      return {
        present: async () => undefined,
        onDidDismiss: async () => ({
          role: options.alertRole ?? 'confirm',
          data: {
            values: {
              maintenanceAccessCode: options.accessCode ??
                PRODUCT_PAGE_MAINTENANCE_ACCESS_TEST_CODE,
            },
          },
        }),
      };
    },
  );

  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [ProductPage],
    providers: [
      { provide: BleService, useValue: bleService },
      { provide: AlertController, useValue: { create: alertCreate } },
      {
        provide: BleWriteExecutionService,
        useValue: writeExecutionService,
      },
      {
        provide: MaintenanceAccessService,
        useValue: maintenanceAccessService,
      },
      { provide: ProductDataLoadService, useValue: loadService },
      { provide: ProductDetection, useClass: ProductDetection },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data: { profile } } },
      },
      {
        provide: Router,
        useValue: {
          getCurrentNavigation: () => ({
            extras: { state: navigationState(profile) },
          }),
          navigate: jasmine.createSpy('navigate').and.resolveTo(true),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProductPage);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  await component.refreshProductData();
  fixture.detectChanges();

  return {
    fixture,
    component,
    bleService,
    loadService,
    writeExecutionService,
    maintenanceAccessService,
    alertCreate,
    alertOptions,
  };
}

function productDateLoadResult(
  profile: KnownProductProfile,
  firstCommissioningDate: BleDatesAndCycles['firstCommissioningDate'],
  status: ProductDataLoadStatus = 'success',
): ProductDataLoadResult {
  const base = completeLoadResult(status, profile);
  return {
    ...base,
    results: {
      ...base.results,
      datesAndCycles: successRead(
        'dates-and-cycles',
        BLE_UUIDS.datesAndCyclesCharacteristic,
        {
          ...datesValue(),
          firstCommissioningDate,
        },
      ),
    },
  };
}

function productDateExecutionResult(
  profile: KnownProductProfile,
  operation: 'maintenance-date' | 'first-commissioning-date',
  payloadHex: string,
  status: LegacyBleWriteExecutionResult['status'] = 'success',
): LegacyBleWriteExecutionResult {
  return {
    status,
    operation,
    profile,
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid: BLE_UUIDS.datesAndCyclesCharacteristic,
    payloadHex,
    length: 5,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: status === 'success',
    confirmationStatus: status === 'success' ? 'not-required' : 'unavailable',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: status === 'success'
      ? null
      : { code: 'product-date-test-error', message: 'Product date error' },
  };
}

function notInitializedHistoricalDate():
  BleDatesAndCycles['firstCommissioningDate'] {
  return {
    status: 'not-initialized',
    rawYear: 0xff,
    rawMonth: 0xff,
    rawDay: 0xff,
    rawHour: 0xff,
    raw: [0xff, 0xff, 0xff, 0xff],
    year: null,
    month: null,
    day: null,
    hour: null,
    invalidReason: null,
  };
}

function presentHistoricalDate(): BleDatesAndCycles['firstCommissioningDate'] {
  return {
    status: 'present',
    rawYear: 26,
    rawMonth: 0,
    rawDay: 2,
    rawHour: 3,
    raw: [26, 0, 2, 3],
    year: 2026,
    month: 1,
    day: 2,
    hour: 3,
    invalidReason: null,
  };
}

function popoverDidPresent(popover: HTMLIonPopoverElement): Promise<void> {
  return new Promise((resolve) => {
    popover.addEventListener('ionPopoverDidPresent', () => resolve(), {
      once: true,
    });
  });
}

async function waitForCondition(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) {
      return;
    }
    await Promise.resolve();
  }
  throw new Error('The asynchronous test condition was not reached.');
}

function writableGattProperties(
  overrides: Partial<BleGattCharacteristicProperties> = {},
): BleGattCharacteristicProperties {
  return {
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid: BLE_UUIDS.motorCommandCharacteristic,
    servicePresent: true,
    characteristicPresent: true,
    propertiesAvailable: true,
    read: false,
    write: true,
    writeWithoutResponse: false,
    notify: false,
    indicate: false,
    descriptorUuids: [],
    rawProperties: { write: true },
    ...overrides,
  };
}

function openExecutionResult(
  status: LegacyBleWriteExecutionResult['status'],
  confirmationStatus: LegacyBleWriteExecutionResult['confirmationStatus'],
  errorCode: string | null = status === 'success' ? null : 'open-test-error',
  operation = 'motor-open',
): LegacyBleWriteExecutionResult {
  const nativeWriteCompleted = status === 'success' || status === 'timeout';
  const timed = operation === 'motor-open-short-timed' ||
    operation === 'motor-open-long-timed';
  const confirmed = confirmationStatus === 'confirmed';
  const payloadHex = operation === 'motor-close'
    ? '00 30'
    : operation === 'motor-open-short-timed'
      ? '00 21 00 00'
      : operation === 'motor-open-long-timed'
        ? '00 22'
        : '00 20 00 00';
  return {
    status,
    operation,
    profile: 'widoor',
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid: BLE_UUIDS.motorCommandCharacteristic,
    payloadHex,
    length: payloadHex.split(' ').length,
    destructiveLevel: 'motor-movement',
    hardwareValidationStatus: operation === 'motor-open'
      ? 'validated-widoor-old-firmware'
      : 'phase1-reference-only',
    policyOverrideUsed: operation !== 'motor-open',
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted,
    confirmationStatus,
    confirmedMotorStateRaw: confirmed
      ? operation === 'motor-close' ? 0x31 : 0x21
      : null,
    movementStartConfirmed: confirmed,
    timedCycleValidationStatus: timed
      ? confirmed
        ? 'pending-physical-validation'
        : status === 'timeout' || status === 'success'
          ? 'not-observed'
          : 'failed'
      : 'not-observed',
    error: errorCode === null
      ? null
      : { code: errorCode, message: 'Native OPEN error' },
  };
}

function lockModeExecutionResult(
  profile: KnownProductProfile,
  payloadHex: '00 00' | '00 01' | '00 02',
): LegacyBleWriteExecutionResult {
  return {
    status: 'success',
    operation: 'lock-mode',
    profile,
    deviceId: 'device-1',
    serviceUuid: profile === 'widoor'
      ? BLE_UUIDS.widoorService
      : BLE_UUIDS.moventivGarlineService,
    characteristicUuid: BLE_UUIDS.userParametersCharacteristic,
    payloadHex,
    length: 2,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: true,
    confirmationStatus: 'not-required',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: null,
  };
}

function userSpeedExecutionResult(
  profile: KnownProductProfile,
  operation: 'open-speed' | 'close-speed',
  payloadHex: string,
): LegacyBleWriteExecutionResult {
  return {
    status: 'success',
    operation,
    profile,
    deviceId: 'device-1',
    serviceUuid: profile === 'widoor'
      ? BLE_UUIDS.widoorService
      : BLE_UUIDS.moventivGarlineService,
    characteristicUuid: BLE_UUIDS.userParametersCharacteristic,
    payloadHex,
    length: 2,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: true,
    confirmationStatus: 'not-required',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: null,
  };
}

function userTimingExecutionResult(
  profile: KnownProductProfile,
  operation: 'short-timing' | 'long-timing',
  payloadHex: string,
): LegacyBleWriteExecutionResult {
  return {
    status: 'success',
    operation,
    profile,
    deviceId: 'device-1',
    serviceUuid: profile === 'widoor'
      ? BLE_UUIDS.widoorService
      : BLE_UUIDS.moventivGarlineService,
    characteristicUuid: BLE_UUIDS.userParametersCharacteristic,
    payloadHex,
    length: 2,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: true,
    confirmationStatus: 'not-required',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: null,
  };
}

function userPeripheralExecutionResult(
  profile: KnownProductProfile,
  operation: 'static-light' | 'dynamic-light' | 'rgb-indicator',
  payloadHex: string,
): LegacyBleWriteExecutionResult {
  return {
    status: 'success',
    operation,
    profile,
    deviceId: 'device-1',
    serviceUuid: profile === 'widoor'
      ? BLE_UUIDS.widoorService
      : BLE_UUIDS.moventivGarlineService,
    characteristicUuid: BLE_UUIDS.userParametersCharacteristic,
    payloadHex,
    length: 3,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: true,
    confirmationStatus: 'not-required',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: null,
  };
}

function nameRoomExecutionResult(
  profile: KnownProductProfile,
  payloadHex: string,
): LegacyBleWriteExecutionResult {
  return {
    status: 'success',
    operation: 'name-room',
    profile,
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid: BLE_UUIDS.nameCharacteristic,
    payloadHex,
    length: payloadHex.split(' ').length,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: true,
    confirmationStatus: 'not-required',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: null,
  };
}

function weightRangeExecutionResult(
  profile: Exclude<KnownProductProfile, 'widoor'>,
  payloadHex: string,
  status: LegacyBleWriteExecutionResult['status'] = 'success',
): LegacyBleWriteExecutionResult {
  return {
    status,
    operation: 'weight-range',
    profile,
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.moventivGarlineService,
    characteristicUuid: BLE_UUIDS.professionalParametersCharacteristic,
    payloadHex,
    length: 3,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: status === 'success',
    confirmationStatus: status === 'success' ? 'not-required' : 'unavailable',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: status === 'success'
      ? null
      : { code: 'weight-range-test-error', message: 'Weight range error' },
  };
}

function expertScalarExecutionResult(
  profile: KnownProductProfile,
  operation:
    | 'break-force-at-open'
    | 'near-open-speed'
    | 'near-close-speed'
    | 'near-open-torque'
    | 'near-close-torque'
    | 'braking-open-power'
    | 'obstacle-sensitivity',
  payloadHex: string,
  status: LegacyBleWriteExecutionResult['status'] = 'success',
): LegacyBleWriteExecutionResult {
  return {
    status,
    operation,
    profile,
    deviceId: 'device-1',
    serviceUuid: profile === 'widoor'
      ? BLE_UUIDS.widoorService
      : BLE_UUIDS.moventivGarlineService,
    characteristicUuid: BLE_UUIDS.professionalParametersCharacteristic,
    payloadHex,
    length: 2,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: status === 'success',
    confirmationStatus: status === 'success' ? 'not-required' : 'unavailable',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: status === 'success'
      ? null
      : {
        code: 'expert-scalar-test-error',
        message: 'Expert scalar error',
      },
  };
}

function completeLoadResult(
  status: ProductDataLoadStatus,
  profile: KnownProductProfile = 'widoor',
  userParameters: BleUserParameters = userValue(),
  professionalParameters: BleProfessionalParameters = professionalValue(
    profile,
  ),
): ProductDataLoadResult {
  return {
    profile,
    deviceId: 'device-1',
    connectionGeneration: 4,
    startedAt: 10,
    completedAt: 20,
    status,
    executedOrder: [
      'version',
      'datesAndCycles',
      'maintenance',
      'userParameters',
      'professionalParameters',
    ],
    results: {
      version: successRead(
        'version',
        BLE_UUIDS.versionCharacteristic,
        versionValue(),
      ),
      datesAndCycles: successRead(
        'dates-and-cycles',
        BLE_UUIDS.datesAndCyclesCharacteristic,
        datesValue(),
      ),
      maintenance: successRead(
        'maintenance',
        BLE_UUIDS.maintenanceCharacteristic,
        maintenanceValue(),
      ),
      userParameters: successRead(
        'user-parameters',
        BLE_UUIDS.userParametersCharacteristic,
        userParameters,
      ),
      professionalParameters: successRead(
        'professional-parameters',
        BLE_UUIDS.professionalParametersCharacteristic,
        professionalParameters,
      ),
    },
    notRequested: [],
    unavailable: [],
    partialSuccess: status === 'partial-success',
    error: null,
  };
}

function partialLoadResult(): ProductDataLoadResult {
  const base = completeLoadResult('partial-success');
  return {
    ...base,
    results: {
      version: base.results.version,
      datesAndCycles: base.results.datesAndCycles,
      maintenance: failedRead(
        'maintenance',
        BLE_UUIDS.maintenanceCharacteristic,
        'Native maintenance failure',
      ),
      userParameters: invalidRead(
        'user-parameters',
        BLE_UUIDS.userParametersCharacteristic,
      ),
      professionalParameters: unavailableRead(
        'professional-parameters',
        BLE_UUIDS.professionalParametersCharacteristic,
      ),
    },
    unavailable: ['professionalParameters'],
    partialSuccess: true,
  };
}

function oldWidoorLoadResult(): ProductDataLoadResult {
  const base = completeLoadResult('partial-success');
  return {
    ...base,
    results: {
      version: base.results.version,
      datesAndCycles: base.results.datesAndCycles,
      maintenance: base.results.maintenance,
      userParameters: unavailableRead(
        'user-parameters',
        BLE_UUIDS.userParametersCharacteristic,
      ),
      professionalParameters: unavailableRead(
        'professional-parameters',
        BLE_UUIDS.professionalParametersCharacteristic,
      ),
    },
    unavailable: ['userParameters', 'professionalParameters'],
    partialSuccess: true,
  };
}

function moventivGarlineUnavailableParameterLoadResult(
  profile: 'moventiv-60' | 'moventiv-80' | 'garline',
): ProductDataLoadResult {
  const base = completeLoadResult('partial-success', profile);
  return {
    ...base,
    profile,
    results: {
      version: base.results.version,
      datesAndCycles: base.results.datesAndCycles,
      maintenance: base.results.maintenance,
      userParameters: unavailableRead(
        'user-parameters',
        BLE_UUIDS.userParametersCharacteristic,
      ),
      professionalParameters: unavailableRead(
        'professional-parameters',
        BLE_UUIDS.professionalParametersCharacteristic,
      ),
    },
    unavailable: ['userParameters', 'professionalParameters'],
    partialSuccess: true,
  };
}

function successRead<T>(
  type: BleReadType,
  characteristicUuid: string,
  value: T,
): BleTypedReadResult<T> {
  const decoded: BleDecodeSuccess<T> = {
    valid: true,
    value,
    rawHex: '00',
    length: 1,
    errors: [],
  };
  return readResult(type, characteristicUuid, 'success', decoded, null);
}

function invalidRead<T>(
  type: BleReadType,
  characteristicUuid: string,
): BleTypedReadResult<T> {
  const decoded: BleDecodeFailure = {
    valid: false,
    value: null,
    rawHex: '00',
    length: 1,
    errors: ['Invalid fixture'],
  };
  return readResult<T>(type, characteristicUuid, 'invalid-frame', decoded, {
    code: 'invalid-frame',
    message: 'Invalid fixture',
  });
}

function unavailableRead<T>(
  type: BleReadType,
  characteristicUuid: string,
): BleTypedReadResult<T> {
  return readResult(type, characteristicUuid, 'unavailable', null, {
    code: 'characteristic-absent',
    message: `The required GATT characteristic ${characteristicUuid} ` +
      'is absent.',
  });
}

function failedRead<T>(
  type: BleReadType,
  characteristicUuid: string,
  message: string,
): BleTypedReadResult<T> {
  return readResult(type, characteristicUuid, 'failed', null, {
    code: 'native-read-failed',
    message,
  });
}

function readResult<T>(
  type: BleReadType,
  characteristicUuid: string,
  status: BleReadStatus,
  decoded: BleTypedReadResult<T>['decoded'],
  error: BleTypedReadResult<T>['error'],
): BleTypedReadResult<T> {
  return {
    type,
    profile: 'widoor',
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid,
    startedAt: 10,
    completedAt: 20,
    status,
    decoded,
    error,
  };
}

function failedViewState(
  code: BleReadError['code'],
  status: Exclude<BleReadStatus, 'success'>,
): ProductReadViewState<never> {
  return {
    status: status === 'invalid-frame'
      ? 'invalid'
      : status,
    readStatus: status,
    value: null,
    result: readResult<never>(
      'version',
      BLE_UUIDS.versionCharacteristic,
      status,
      null,
      { code, message: 'Native message' },
    ),
  };
}

function versionValue(): BleVersionFrame {
  return {
    stack: { major: 3, minor: 5, patch: 3, build: 348 },
    bleSoftware: { major: 1, minor: 0, patch: 0, specification: 0 },
    productType: 1,
    productSubtype: 0,
    motorSoftware: { major: 1, minor: 0, patch: 1, specification: 0 },
    crc: 202,
    motorAddressHex: null,
  };
}

function datesValue(): BleDatesAndCycles {
  return {
    historicalFadDate: {
      status: 'raw-only',
      rawYear: 0,
      rawMonth: 0,
      rawDay: 0,
      raw: [0, 0, 0],
    },
    firstCommissioningDate: {
      status: 'present',
      rawYear: 19,
      rawMonth: 7,
      rawDay: 27,
      rawHour: 0,
      raw: [19, 7, 27, 0],
      year: 2019,
      month: 8,
      day: 27,
      hour: 0,
      invalidReason: null,
    },
    lastMaintenanceDate: {
      status: 'invalid',
      rawYear: 0,
      rawMonth: 0,
      rawDay: 0,
      rawHour: 0,
      raw: [0, 0, 0, 0],
      year: null,
      month: null,
      day: null,
      hour: null,
      invalidReason: 'zero-date',
    },
    totalCycles: 26580,
    cyclesSinceMaintenance: 0,
  };
}

function maintenanceValue(): BleMaintenance {
  return {
    initializationCount: 25,
    cyclesSinceInitialization: 14,
    obstacleDetectionCount: 80,
    wrongStopOpenCount: 5,
    wrongStopCloseCount: 0,
    learningCycleCount: 0,
    encoderErrorCount: 0,
    motorErrorCount: 0,
  };
}

function userValue(): BleUserParameters {
  return {
    lockModeRaw: 0,
    lockMode: 'none',
    openSpeed: 25,
    closeSpeed: 35,
    shortOpenTime: 0,
    longOpenTime: 1,
    peripheralByte1: 0,
    peripheralByte2: 0,
    peripheralFlags: {
      dynamicLight: false,
      staticLight: false,
      light1: false,
      light2: false,
      rgbIndicator: false,
    },
  };
}

function userValueWithLockMode(
  lockMode: BleUserParameters['lockMode'],
): BleUserParameters {
  const raw: Record<BleUserParameters['lockMode'], number> = {
    none: 0,
    'locked-open': 1,
    'locked-closed': 2,
    unknown: 9,
  };
  return {
    ...userValue(),
    lockMode,
    lockModeRaw: raw[lockMode],
  };
}

function userValueWithSpeeds(
  openSpeed: number,
  closeSpeed: number,
): BleUserParameters {
  return {
    ...userValue(),
    openSpeed,
    closeSpeed,
  };
}

function userValueWithTimings(
  shortOpenTime: number,
  longOpenTime: number,
): BleUserParameters {
  return {
    ...userValue(),
    shortOpenTime,
    longOpenTime,
  };
}

function userValueWithPeripherals(
  flags: Partial<BleUserParameters['peripheralFlags']>,
): BleUserParameters {
  return {
    ...userValue(),
    peripheralFlags: {
      ...userValue().peripheralFlags,
      ...flags,
    },
  };
}

interface ProfessionalValueOverrides {
  readonly breakForceAtOpen?: number;
  readonly nearOpenSpeed?: number;
  readonly nearCloseSpeed?: number;
  readonly brakingOpenPower?: number;
  readonly obstacleSensitivity?: number;
  readonly nearOpenTorque?: number;
  readonly nearCloseTorque?: number;
}

function professionalValue(
  profile: KnownProductProfile = 'widoor',
  weightRangeLower = 0,
  weightRangeUpper = 0,
  overrides: ProfessionalValueOverrides = {},
): BleProfessionalParameters {
  const common = {
    weightRangeLower,
    weightRangeUpper,
    nearOpenSpeed: overrides.nearOpenSpeed ?? 70,
    nearCloseSpeed: overrides.nearCloseSpeed ?? 50,
    nearOpenTorque: overrides.nearOpenTorque ?? 0,
    nearCloseTorque: overrides.nearCloseTorque ?? 0,
    peripheralByte1: 0,
    peripheralByte2: 0,
  };
  if (profile === 'widoor') {
    return {
      ...common,
      profile,
      breakForceAtOpen: overrides.breakForceAtOpen ?? 1,
      nearOpenProportional: 0,
      nearCloseProportional: 0,
      nearOpenIntegral: 0,
      nearCloseIntegral: 0,
    };
  }
  return {
    ...common,
    profile,
    exactWeight: 0,
    brakingOpenPower: overrides.brakingOpenPower ?? 0,
    obstacleSensitivity: overrides.obstacleSensitivity ?? 0,
    nearOpenIntegral: 0,
    nearCloseIntegral: 0,
  };
}
