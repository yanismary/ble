import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import {
  BleService as DiscoveredBleService,
  ScanResult,
} from '@capacitor-community/bluetooth-le';
import {
  AlertController,
  IonRouterOutlet,
  Platform,
  ToastController,
} from '@ionic/angular/standalone';
import { Observable, Subject, Subscription } from 'rxjs';

import {
  BleDisconnectionEvent,
  BleGattCharacteristicProperties,
  BleOperationError,
  BleService,
} from '../../../core/services/ble';
import {
  storeAutoEnableBluetooth,
  storeShowBleIdentifier,
} from '../../../core/services/app-preferences';
import { storeManualAppLanguage } from '../../../core/services/app-language';
import {
  ProductExitStateService,
} from '../../../core/services/product-exit-state.service';
import { BLE_UUIDS } from '../../../core/services/product-detection';
import { MotorCommandService } from '../../../core/services/motor-command.service';
import {
  ProductDataLoadResult,
  ProductDataLoadService,
  ProductDataLoadStatus,
} from '../../../core/services/product-data-load.service';
import {
  BleReadStatus,
  BleReadType,
  BleTypedReadResult,
} from '../../../core/services/ble-read.service';
import {
  BleDatesAndCycles,
  decodeBleDatesAndCycles,
} from '../../../core/services/ble-read-decoders';
import {
  AppMainMenuComponent,
} from '../../../shared/app-main-menu/app-main-menu.component';
import { ScanPage } from '../scan.page';
import {
  getBleSignalQualityAsset,
  getBleSignalQualityFromRssi,
  getScanRoomIconClass,
  splitScanDisplayName,
} from '../scan-page-ui';
import { TUTORIAL_FRESH_SCAN_STATE_KEY } from
  '../../tutorial/tutorial-navigation';

class FakeBleService {
  private readonly disconnectionSubject = new Subject<BleDisconnectionEvent>();
  private readonly bluetoothEnabledSubject = new Subject<boolean>();
  private connectedDeviceIdValue: string | null = null;
  private scanning = false;
  private scanCallback: ((result: ScanResult) => void) | null = null;
  private notificationCallback: ((value: DataView) => void) | null = null;
  lastScanServiceUuids: readonly string[] = [];
  isWriting = false;
  bluetoothEnabled = true;
  bluetoothEnabledError: unknown | null = null;
  legacyAndroidLocationServiceRequired = false;
  locationEnabled = true;
  canRequestBluetoothEnable = true;
  canOpenAppSettings = true;
  platform: 'android' | 'ios' | 'web' = 'android';
  requestBluetoothEnableResult: Promise<void> | null = null;
  connectionGeneration = 0;
  disconnectResult: Promise<void> | null = null;
  stopScanError: unknown | null = null;
  servicesResult: DiscoveredBleService[] = [];
  readResult: DataView = new DataView(new ArrayBuffer(0));
  readonly writeCharacteristic = jasmine.createSpy('writeCharacteristic');
  readonly requestBluetoothEnable = jasmine.createSpy(
    'requestBluetoothEnable',
  ).and.callFake(async (): Promise<void> => {
    if (this.requestBluetoothEnableResult !== null) {
      await this.requestBluetoothEnableResult;
    }
    this.bluetoothEnabled = true;
  });
  readonly openAppSettings = jasmine.createSpy('openAppSettings')
    .and.resolveTo();
  readonly openBluetoothSettings = jasmine.createSpy(
    'openBluetoothSettings',
  ).and.resolveTo();
  readonly openLocationSettings = jasmine.createSpy(
    'openLocationSettings',
  ).and.resolveTo();

  readonly disconnections$: Observable<BleDisconnectionEvent> =
    this.disconnectionSubject.asObservable();
  readonly bluetoothEnabledChanges$: Observable<boolean> =
    this.bluetoothEnabledSubject.asObservable();

  get connectedDeviceId(): string | null {
    return this.connectedDeviceIdValue;
  }

  async initialize(): Promise<void> {}

  async isBluetoothEnabled(): Promise<boolean> {
    if (this.bluetoothEnabledError !== null) {
      throw this.bluetoothEnabledError;
    }
    return this.bluetoothEnabled;
  }

  async requiresLegacyAndroidLocationService(): Promise<boolean> {
    return this.legacyAndroidLocationServiceRequired;
  }

  async isLocationEnabled(): Promise<boolean> {
    return this.locationEnabled;
  }

  async startScan(
    callback: (result: ScanResult) => void,
    serviceUuids: readonly string[] = [],
  ): Promise<void> {
    this.scanning = true;
    this.scanCallback = callback;
    this.lastScanServiceUuids = serviceUuids;
  }

  async stopScan(): Promise<void> {
    this.scanning = false;
    if (this.stopScanError !== null) {
      throw this.stopScanError;
    }
  }

  isScanning(): boolean {
    return this.scanning;
  }

  async connect(deviceId: string): Promise<void> {
    this.scanning = false;
    this.connectedDeviceIdValue = deviceId;
    this.connectionGeneration += 1;
  }

  readonly disconnect = jasmine.createSpy('disconnect').and.callFake(
    async (): Promise<void> => {
      if (this.disconnectResult !== null) {
        await this.disconnectResult;
      }
      if (this.connectedDeviceIdValue !== null) {
        this.connectedDeviceIdValue = null;
        this.connectionGeneration += 1;
      }
    },
  );

  async discoverServices(_deviceId?: string): Promise<DiscoveredBleService[]> {
    return this.servicesResult;
  }

  getGattCharacteristicProperties(
    serviceUuid: string,
    characteristicUuid: string,
    _deviceId?: string,
  ): BleGattCharacteristicProperties {
    const normalizedServiceUuid = serviceUuid.trim().toLowerCase();
    const normalizedCharacteristicUuid =
      characteristicUuid.trim().toLowerCase();
    const service = this.servicesResult.find(({ uuid }) =>
      uuid.trim().toLowerCase() === normalizedServiceUuid,
    );
    const characteristic = service?.characteristics.find(({ uuid }) =>
      uuid.trim().toLowerCase() === normalizedCharacteristicUuid,
    );
    const rawProperties: Record<string, boolean> = {};
    for (const [name, value] of Object.entries(
      characteristic?.properties ?? {},
    )) {
      if (typeof value === 'boolean') {
        rawProperties[name] = value;
      }
    }
    const property = (name: string): boolean | null =>
      typeof rawProperties[name] === 'boolean'
        ? rawProperties[name]
        : null;

    return {
      serviceUuid: normalizedServiceUuid,
      characteristicUuid: normalizedCharacteristicUuid,
      servicePresent: service !== undefined,
      characteristicPresent: characteristic !== undefined,
      propertiesAvailable: Object.keys(rawProperties).length > 0,
      read: property('read'),
      write: property('write'),
      writeWithoutResponse: property('writeWithoutResponse'),
      notify: property('notify'),
      indicate: property('indicate'),
      descriptorUuids:
        characteristic?.descriptors.map(({ uuid }) => uuid) ?? [],
      rawProperties,
    };
  }

  async readCharacteristic(
    _serviceUuid: string,
    _characteristicUuid: string,
    _deviceId?: string,
  ): Promise<DataView> {
    return this.readResult;
  }

  async startNotifications(
    _serviceUuid: string,
    _characteristicUuid: string,
    callback: (value: DataView) => void,
    _deviceId?: string,
  ): Promise<void> {
    this.notificationCallback = callback;
  }

  async stopNotifications(
    _serviceUuid: string,
    _characteristicUuid: string,
    _deviceId?: string,
  ): Promise<void> {
    this.notificationCallback = null;
  }

  emit(result: ScanResult): void {
    this.scanCallback?.(result);
  }

  emitBluetoothEnabled(enabled: boolean): void {
    this.bluetoothEnabled = enabled;
    this.bluetoothEnabledSubject.next(enabled);
  }

  emitRemoteDisconnection(deviceId: string): void {
    this.connectedDeviceIdValue = null;
    this.connectionGeneration += 1;
    this.disconnectionSubject.next({ deviceId, reason: 'remote' });
  }

  setConnectedDeviceId(deviceId: string | null): void {
    this.connectedDeviceIdValue = deviceId;
  }

  emitNotification(value: DataView): void {
    this.notificationCallback?.(value);
  }
}

class FakeBackButton {
  private handler: ((processNextHandler: () => void) => void) | null = null;
  activeSubscriptions = 0;
  readonly subscribeWithPriority = jasmine.createSpy('subscribeWithPriority')
    .and.callFake((
      _priority: number,
      handler: (processNextHandler: () => void) => void,
    ): Subscription => {
      this.handler = handler;
      this.activeSubscriptions += 1;
      return new Subscription(() => {
        this.activeSubscriptions -= 1;
        if (this.handler === handler) {
          this.handler = null;
        }
      });
    });

  trigger(processNextHandler: () => void = () => undefined): void {
    this.handler?.(processNextHandler);
  }
}

class FakePlatform {
  readonly backButton = new FakeBackButton();
}

class FakeProductDataLoadService {
  isLoading = false;
  readonly loadProductData = jasmine.createSpy('loadProductData').and.callFake(
    async (
      profile: ProductDataLoadResult['profile'],
      deviceId?: string,
    ): Promise<ProductDataLoadResult> => ({
      profile,
      deviceId: deviceId ?? null,
      connectionGeneration: 1,
      startedAt: 10,
      completedAt: 20,
      status: 'success',
      executedOrder: [
        'version',
        'datesAndCycles',
        'maintenance',
        'userParameters',
        'advancedParameters',
      ],
      results: {},
      notRequested: [],
      unavailable: [],
      partialSuccess: false,
      error: null,
    }),
  );
  readonly cancelCurrentLoad = jasmine.createSpy(
    'cancelCurrentLoad',
  ).and.returnValue(true);
}

describe('ScanPage', () => {
  let component: ScanPage;
  let fixture: ComponentFixture<ScanPage>;
  let bleService: FakeBleService;
  let alertCreate: jasmine.Spy;
  let alertOptions: TestAlertOptions[];
  let sendMotorCommandWithConfirmation: jasmine.Spy;
  let productDataLoadService: FakeProductDataLoadService;
  let routerNavigate: jasmine.Spy;
  let routerGetCurrentNavigation: jasmine.Spy;
  let productExitState: ProductExitStateService;
  let platform: FakePlatform;
  let routerOutlet: { canGoBack: jasmine.Spy };
  let toastCreate: jasmine.Spy;
  let toastPresent: jasmine.Spy;
  let toastOptions: Record<string, unknown>[];

  beforeEach(async () => {
    localStorage.clear();
    storeManualAppLanguage('fr');
    storeAutoEnableBluetooth(false);
    storeShowBleIdentifier(true);
    bleService = new FakeBleService();
    platform = new FakePlatform();
    routerOutlet = {
      canGoBack: jasmine.createSpy('canGoBack').and.returnValue(false),
    };
    productDataLoadService = new FakeProductDataLoadService();
    routerNavigate = jasmine.createSpy('navigate').and.resolveTo(true);
    routerGetCurrentNavigation = jasmine.createSpy('getCurrentNavigation')
      .and.returnValue(null);
    toastOptions = [];
    toastPresent = jasmine.createSpy('present').and.resolveTo();
    toastCreate = jasmine.createSpy('create').and.callFake(
      async (options: Record<string, unknown>) => {
        toastOptions.push(options);
        return { present: toastPresent };
      },
    );
    alertOptions = [];
    alertCreate = jasmine.createSpy('create').and.callFake(
      async (options: TestAlertOptions) => {
        alertOptions.push(options);
        return {
          present: async () => undefined,
          onDidDismiss: async () => ({ role: 'cancel' }),
        };
      },
    );
    sendMotorCommandWithConfirmation =
      jasmine.createSpy('sendMotorCommandWithConfirmation').and.resolveTo(
        motorCommandResult('confirmed'),
      );

    await TestBed.configureTestingModule({
      imports: [ScanPage],
      providers: [
        { provide: BleService, useValue: bleService },
        {
          provide: AlertController,
          useValue: { create: alertCreate },
        },
        {
          provide: ToastController,
          useValue: { create: toastCreate },
        },
        {
          provide: MotorCommandService,
          useValue: { sendMotorCommandWithConfirmation },
        },
        {
          provide: ProductDataLoadService,
          useValue: productDataLoadService,
        },
        {
          provide: Router,
          useValue: {
            navigate: routerNavigate,
            getCurrentNavigation: routerGetCurrentNavigation,
          },
        },
        { provide: Platform, useValue: platform },
        { provide: IonRouterOutlet, useValue: routerOutlet },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScanPage);
    component = fixture.componentInstance;
    productExitState = TestBed.inject(ProductExitStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show one Phase 1 exit prompt on Android Scan root and preserve state on cancel',
    async () => {
      component.devices = [{ deviceId: 'device-1', name: 'Salon', rssi: -50 }];
      await component.ionViewWillEnter();

      platform.backButton.trigger();
      platform.backButton.trigger();
      await settlePromises();

      expect(platform.backButton.subscribeWithPriority)
        .toHaveBeenCalledOnceWith(1, jasmine.any(Function));
      expect(alertOptions).toHaveSize(1);
      expect(alertOptions[0].message).toBe(
        "Souhaitez-vous quitter l'application ?",
      );
      expect(alertOptions[0].buttons.map(({ text }) => text))
        .toEqual(['Annuler', 'Quitter']);

      alertOptions[0].buttons[0].handler?.();

      expect(component.devices).toHaveSize(1);
      expect(component.scanning).toBeFalse();

      platform.backButton.trigger();
      await settlePromises();
      expect(alertOptions).toHaveSize(2);
    },
  );

  it('should keep an active scan running when the root exit prompt is cancelled',
    async () => {
      await component.startScan();
      const timeout = scanTimeoutOf(component);
      await component.ionViewWillEnter();

      platform.backButton.trigger();
      await settlePromises();
      alertOptions[0].buttons[0].handler?.();

      expect(component.scanning).toBeTrue();
      expect(scanTimeoutOf(component)).toBe(timeout);
      expect(bleService.isScanning()).toBeTrue();
    },
  );

  it('should stop an active scan and exit once when auto Bluetooth is enabled',
    async () => {
      storeAutoEnableBluetooth(true);
      const exitApp = spyOn<any>(component, 'exitNativeApplication')
        .and.resolveTo();
      const stopScan = spyOn(bleService, 'stopScan').and.callThrough();
      await component.startScan();
      await component.ionViewWillEnter();

      platform.backButton.trigger();
      await settlePromises();
      await alertOptions[0].buttons[1].handler?.();

      expect(stopScan).toHaveBeenCalledTimes(1);
      expect(component.scanning).toBeFalse();
      expect(scanTimeoutOf(component)).toBeNull();
      expect(exitApp).toHaveBeenCalledTimes(1);
    },
  );

  it('should preserve the Phase 1 preference role and exit without stopping when disabled',
    async () => {
      storeAutoEnableBluetooth(false);
      const exitApp = spyOn<any>(component, 'exitNativeApplication')
        .and.resolveTo();
      const stopScan = spyOn(bleService, 'stopScan').and.callThrough();
      await component.startScan();
      await component.ionViewWillEnter();

      platform.backButton.trigger();
      await settlePromises();
      await alertOptions[0].buttons[1].handler?.();

      expect(stopScan).not.toHaveBeenCalled();
      expect(exitApp).toHaveBeenCalledTimes(1);
    },
  );

  it('should still exit after a native stopScan failure', async () => {
    storeAutoEnableBluetooth(true);
    const exitApp = spyOn<any>(component, 'exitNativeApplication')
      .and.resolveTo();
    bleService.stopScanError = new Error('Native stop failed');
    await component.startScan();
    await component.ionViewWillEnter();

    platform.backButton.trigger();
    await settlePromises();
    await alertOptions[0].buttons[1].handler?.();

    expect(component.scanning).toBeFalse();
    expect(scanTimeoutOf(component)).toBeNull();
    expect(exitApp).toHaveBeenCalledTimes(1);
  });

  it('should ignore a second exit action while scan cleanup is pending',
    async () => {
      storeAutoEnableBluetooth(true);
      const exitApp = spyOn<any>(component, 'exitNativeApplication')
        .and.resolveTo();
      let releaseStop!: () => void;
      const pendingStop = new Promise<void>((resolve) => {
        releaseStop = resolve;
      });
      const stopScan = spyOn(bleService, 'stopScan')
        .and.returnValue(pendingStop);
      await component.startScan();
      await component.ionViewWillEnter();
      platform.backButton.trigger();
      await settlePromises();

      const exitHandler = alertOptions[0].buttons[1].handler;
      const firstExit = exitHandler?.();
      const secondExit = exitHandler?.();

      expect(stopScan).toHaveBeenCalledTimes(1);
      expect(exitApp).not.toHaveBeenCalled();

      releaseStop();
      await Promise.all([firstExit, secondExit]);
      expect(exitApp).toHaveBeenCalledTimes(1);
    },
  );

  it('should delegate hardware Back when the Ionic outlet can navigate back',
    async () => {
      const processNextHandler = jasmine.createSpy('processNextHandler');
      routerOutlet.canGoBack.and.returnValue(true);
      await component.ionViewWillEnter();

      platform.backButton.trigger(processNextHandler);
      await settlePromises();

      expect(processNextHandler).toHaveBeenCalledTimes(1);
      expect(alertCreate).not.toHaveBeenCalled();
    },
  );

  it('should not register the root exit handler on iOS', async () => {
    bleService.platform = 'ios';

    await component.ionViewWillEnter();
    platform.backButton.trigger();
    await settlePromises();

    expect(platform.backButton.subscribeWithPriority).not.toHaveBeenCalled();
    expect(alertCreate).not.toHaveBeenCalled();
  });

  it('should keep one scoped root Back subscription across repeated Scan entries',
    async () => {
      await component.ionViewWillEnter();
      await component.ionViewWillEnter();

      expect(platform.backButton.activeSubscriptions).toBe(1);

      component.ionViewWillLeave();
      expect(platform.backButton.activeSubscriptions).toBe(0);

      platform.backButton.trigger();
      await settlePromises();
      expect(alertCreate).not.toHaveBeenCalled();
    },
  );

  it('should render the Phase 1 Scan surface in FR, EN, DE and PL', () => {
    const expected = {
      fr: ['Sélection', 'Rechercher', 'Aucune motorisation détectée.', 'Démo'],
      en: ['Selection', 'Search', 'No motor detected.', 'Demo'],
      de: ['Auswahl', 'Suchen', 'Kein Motor gefunden.', 'Demo'],
      pl: ['Wybór napędów', 'Wyszukiwanie', 'Nie znaleziono napędu.', 'Demo'],
    } as const;

    for (const [language, labels] of Object.entries(expected)) {
      storeManualAppLanguage(language as 'fr' | 'en' | 'de' | 'pl');
      fixture.detectChanges();
      const rendered = fixture.nativeElement.textContent as string;
      for (const label of labels) {
        expect(rendered).withContext(`${language}: ${label}`).toContain(label);
      }
    }
  });

  it('should show empty/searching text only while the result list is empty', () => {
    expect(fixture.nativeElement.textContent).toContain(
      'Aucune motorisation détectée.',
    );

    component.scanning = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Recherche en cours...');

    component.devices = [{ deviceId: 'device-1', name: 'Produit', rssi: -42 }];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(
      'Recherche en cours...',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Aucune motorisation détectée.',
    );
  });

  it('should label the visible identifier as MAC on Android and UUID on iOS', () => {
    component.devices = [{ deviceId: 'device-1', name: 'Produit', rssi: -42 }];

    bleService.platform = 'android';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('MAC: device-1');
    expect(fixture.nativeElement.textContent).not.toContain('UUID: device-1');

    bleService.platform = 'ios';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('UUID: device-1');
    expect(fixture.nativeElement.textContent).not.toContain('MAC: device-1');
  });

  it('should open the active Info tutorial without any BLE operation',
    async () => {
      const element = fixture.nativeElement as HTMLElement;
      const infoButton = element.querySelector<HTMLElement>(
        '.scan-info-fab ion-fab-button',
      );
      const connect = spyOn(bleService, 'connect').and.callThrough();
      const discovery = spyOn(bleService, 'discoverServices').and.callThrough();
      const read = spyOn(bleService, 'readCharacteristic').and.callThrough();
      const write = bleService.writeCharacteristic;

      expect(infoButton).not.toBeNull();
      expect(infoButton?.hasAttribute('disabled')).toBeFalse();

      await component.openTutorial();

      expect(routerNavigate).toHaveBeenCalledOnceWith(['/tutorial']);
      expect(connect).not.toHaveBeenCalled();
      expect(discovery).not.toHaveBeenCalled();
      expect(read).not.toHaveBeenCalled();
      expect(write).not.toHaveBeenCalled();
      expect(bleService.disconnect).not.toHaveBeenCalled();
    },
  );

  it('should preserve scan results on natural Tutorial Back', async () => {
    component.devices = [{ deviceId: 'device-1', name: 'Porte', rssi: -42 }];

    await component.ionViewWillEnter();

    expect(component.devices).toHaveSize(1);
    expect(bleService.disconnect).not.toHaveBeenCalled();
  });

  it('should start with an empty list after Tutorial Skip or Continue',
    async () => {
      component.devices = [
        { deviceId: 'device-1', name: 'Porte', rssi: -42 },
      ];
      routerGetCurrentNavigation.and.returnValue({
        extras: {
          state: { [TUTORIAL_FRESH_SCAN_STATE_KEY]: true },
        },
      });

      await component.ionViewWillEnter();

      expect(component.devices).toEqual([]);
      expect(bleService.disconnect).not.toHaveBeenCalled();
      expect(component.scanning).toBeFalse();
    },
  );

  it('should expose the enabled Phase 1 Demo FAB and choices in order',
    async () => {
      const element = fixture.nativeElement as HTMLElement;
      const button = element.querySelector<HTMLElement>(
        '.scan-demo-fab ion-fab-button',
      );
      expect(button).not.toBeNull();
      expect(button?.hasAttribute('disabled')).toBeFalse();

      await component.launchDemoMode();

      expect(alertOptions).toHaveSize(1);
      expect(alertOptions[0].header).toBe('Demo');
      expect(alertOptions[0].buttons.map(({ text }) => text)).toEqual([
        'MOVENTIV exemple',
        'GARLINE exemple',
        'WIDOOR exemple',
        'Annuler',
      ]);
      expect(alertOptions[0].buttons[3].role).toBe('cancel');
      expect(alertOptions[0].cssClass).toBe('scan-demo-product-alert');
      expect(alertOptions[0].buttons.map(({ cssClass }) => cssClass)).toEqual([
        ['scan-demo-product-button', 'scan-demo-product-button-moventiv'],
        ['scan-demo-product-button', 'scan-demo-product-button-garline'],
        ['scan-demo-product-button', 'scan-demo-product-button-widoor'],
        'scan-demo-product-cancel-button',
      ]);
      expect(alertOptions[0].buttons.some(({ text }) =>
        text?.includes('80'),
      )).toBeFalse();
    },
  );

  it('should render connection progress as a Phase 1-style overlay', () => {
    component.devices = [{ deviceId: 'device-1', name: 'Produit', rssi: -42 }];
    component.selectedDeviceId = 'device-1';
    component.connecting = true;

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const overlay = element.querySelector('.scan-connection-overlay');
    const item = element.querySelector('.device-list ion-item');
    expect(overlay).not.toBeNull();
    expect(overlay?.textContent).toContain('Connexion en cours...');
    expect(element.querySelector('.connection-panel')).toBeNull();
    expect(item?.querySelector('ion-spinner')).toBeNull();
  });

  it('should enter each Demo profile without BLE connection or discovery',
    async () => {
      const connect = spyOn(bleService, 'connect').and.callThrough();
      const discovery = spyOn(bleService, 'discoverServices').and.callThrough();
      const startScan = spyOn(bleService, 'startScan').and.callThrough();
      const scenarios = [
        { button: 0, profile: 'moventiv-60', id: 'MOVENTIV-DEMO-0001' },
        { button: 1, profile: 'garline', id: 'GARLINE-DEMO-0001' },
        { button: 2, profile: 'widoor', id: 'WIDOOR-DEMO-0001' },
      ] as const;

      for (const scenario of scenarios) {
        alertOptions = [];
        routerNavigate.calls.reset();
        await component.launchDemoMode();
        alertOptions[0].buttons[scenario.button].handler?.();
        await settlePromises();

        expect(routerNavigate).toHaveBeenCalledOnceWith(
          [`/product/${scenario.profile}`],
          {
            state: jasmine.objectContaining({
              mode: 'demo',
              profile: scenario.profile,
              deviceId: scenario.id,
              identificationConfidence: 'demo',
            }),
          },
        );
      }

      expect(connect).not.toHaveBeenCalled();
      expect(discovery).not.toHaveBeenCalled();
      expect(startScan).not.toHaveBeenCalled();
    },
  );

  it('should cancel Demo without navigation and stop only an active scan',
    async () => {
      await component.launchDemoMode();
      alertOptions[0].buttons[3].handler?.();
      await settlePromises();
      expect(routerNavigate).not.toHaveBeenCalled();

      await component.startScan();
      const stopScan = spyOn(bleService, 'stopScan').and.callThrough();
      alertOptions = [];
      await component.launchDemoMode();
      alertOptions[0].buttons[2].handler?.();
      await settlePromises();

      expect(stopScan).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledWith(
        ['/product/widoor'],
        { state: jasmine.objectContaining({ mode: 'demo' }) },
      );
    },
  );

  it('should map RSSI values to historical signal quality assets', () => {
    expect(getBleSignalQualityFromRssi(null)).toBe(0);
    expect(getBleSignalQualityFromRssi(-95)).toBe(0);
    expect(getBleSignalQualityFromRssi(-90)).toBe(1);
    expect(getBleSignalQualityFromRssi(-80)).toBe(2);
    expect(getBleSignalQualityFromRssi(-70)).toBe(3);
    expect(getBleSignalQualityFromRssi(-60)).toBe(4);
    expect(getBleSignalQualityAsset(-42)).toBe(
      'assets/img/img_ble_strenght_4_4.svg',
    );
  });

  it('should split scanned names and resolve historical room icons', () => {
    for (const suffix of [
      '#CHA', '#ENT', '#SAL', '#CUI', '#SAM',
      '#SDB', '#WCS', '#GAR', '#SLL', '#SDJ',
    ]) {
      expect(splitScanDisplayName(`Porte${suffix}`)).toEqual({
        displayName: 'Porte',
        roomSuffix: suffix,
      });
    }
    expect(splitScanDisplayName('Salon#SAL')).toEqual({
      displayName: 'Salon',
      roomSuffix: '#SAL',
    });
    expect(splitScanDisplayName('Garage')).toEqual({
      displayName: 'Garage',
      roomSuffix: null,
    });
    expect(splitScanDisplayName('Porte#WCS\0')).toEqual({
      displayName: 'Porte',
      roomSuffix: '#WCS',
    });
    expect(getScanRoomIconClass('#CHA')).toBe('ai-loc-cha');
    expect(getScanRoomIconClass('#WCS')).toBe('ai-loc-wcs');
    expect(getScanRoomIconClass('#ENT')).toBe('ai-loc-autre');
    expect(getScanRoomIconClass(null)).toBeNull();
  });

  it('should display the BLE name even when an older name is cached',
    async () => {
      localStorage.setItem('StoredRoomAssignments', JSON.stringify({
        'DEVICE-1': { name: 'Bureau', suffix: '#ENT', updatedAt: 1 },
      }));
      await component.startScan();
      bleService.emit(createScanResult('device-1', -55, 'Ancien#SAL'));

      expect(component.getScanDisplayName(component.devices[0]))
        .toBe('Ancien');
      expect(component.getScanRoomSuffix(component.devices[0])).toBe('#SAL');
    });

  it('should prefer a fresh BLE room over an empty or stale cached room',
    async () => {
      localStorage.setItem('StoredRoomAssignments', JSON.stringify({
        'DEVICE-1': { suffix: '#SAL' },
      }));
      await component.startScan();
      bleService.emit(createScanResult('device-1', -55, 'Ancien', 'Porte#WCS'));

      expect(component.getScanDisplayName(component.devices[0])).toBe('Porte');
      expect(component.getScanRoomSuffix(component.devices[0])).toBe('#WCS');
      expect(component.getScanRoomIconClass(component.devices[0])).toBe('ai-loc-wcs');

      bleService.emit(createScanResult('device-1', -55, 'Ancien', 'Porte'));
      expect(component.getScanDisplayName(component.devices[0])).toBe('Porte');
      expect(component.getScanRoomSuffix(component.devices[0])).toBeNull();
      expect(component.getScanRoomIconClass(component.devices[0])).toBeNull();
    });

  it('should navigate from the Phase 1 style main menu without BLE calls',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      const connectSpy = spyOn(bleService, 'connect').and.callThrough();
      fixture.detectChanges();
      const menu = fixture.debugElement.query(
        By.directive(AppMainMenuComponent),
      ).componentInstance as AppMainMenuComponent;
      const menuButton = fixture.nativeElement.querySelector(
        '.app-main-menu-button',
      ) as HTMLIonButtonElement;
      const popover = fixture.nativeElement.querySelector(
        'ion-popover.app-main-menu-popover',
      ) as HTMLIonPopoverElement;

      expect(menu.items.map(({ label }) => label)).toEqual([
        "Configuration de l'application",
        'Aide',
        'À propos',
        'Qui sommes-nous ?',
        'Contacts',
        'Mentions légales',
      ]);

      const didPresent = popoverDidPresent(popover);
      menuButton.click();
      await didPresent;

      expect(menu.menuOpen).toBeTrue();
      expect(popover.reference).toBe('trigger');
      expect(popover.side).toBe('bottom');
      expect(popover.alignment).toBe('end');

      await menu.select(menu.items[0]);

      expect(routerNavigate).toHaveBeenCalledOnceWith(['/settings']);
      expect(menu.menuOpen).toBeFalse();
      expect(startScanSpy).not.toHaveBeenCalled();
      expect(connectSpy).not.toHaveBeenCalled();
    },
  );

  it('should disconnect a native connection left alive when ScanPage enters',
    async () => {
      fixture.destroy();
      bleService.setConnectedDeviceId('device-previous');
      bleService.connectionGeneration = 7;

      fixture = TestBed.createComponent(ScanPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await component.ionViewWillEnter();
      await settlePromises();

      expect(bleService.disconnect).toHaveBeenCalledTimes(1);
      expect(bleService.connectedDeviceId).toBeNull();
      expect(bleService.connectionGeneration).toBe(8);
      expect(component.connectedDeviceId).toBeNull();
      expect(component.canStartScan).toBeTrue();

      await component.startScan();

      expect(component.scanning).toBeTrue();
    },
  );

  it('should not disconnect again when ScanPage enters after ProductPage cleaned the service',
    async () => {
      fixture.destroy();
      bleService.setConnectedDeviceId(null);
      bleService.disconnect.calls.reset();

      fixture = TestBed.createComponent(ScanPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await component.ionViewWillEnter();
      await settlePromises();

      expect(bleService.disconnect).not.toHaveBeenCalled();
      expect(component.canStartScan).toBeTrue();
    },
  );

  it('should block a new scan while an entry disconnect is pending',
    async () => {
      fixture.destroy();
      let releaseDisconnect!: () => void;
      bleService.setConnectedDeviceId('device-previous');
      bleService.disconnectResult = new Promise<void>((resolve) => {
        releaseDisconnect = resolve;
      });

      fixture = TestBed.createComponent(ScanPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      const entry = component.ionViewWillEnter();

      expect(component.entryConnectionCleanupInProgress).toBeTrue();
      expect(component.canStartScan).toBeFalse();

      await component.startScan();

      expect(component.scanning).toBeFalse();

      releaseDisconnect();
      await entry;
      await settlePromises();

      expect(component.entryConnectionCleanupInProgress).toBeFalse();
      expect(component.canStartScan).toBeTrue();
    },
  );

  it('should finish entry cleanup when a remote disconnect happens while cleanup is pending',
    async () => {
      fixture.destroy();
      let releaseDisconnect!: () => void;
      bleService.setConnectedDeviceId('device-previous');
      bleService.disconnectResult = new Promise<void>((resolve) => {
        releaseDisconnect = resolve;
      });

      fixture = TestBed.createComponent(ScanPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      const entry = component.ionViewWillEnter();

      bleService.emitRemoteDisconnection('device-previous');
      releaseDisconnect();
      await entry;
      await settlePromises();

      expect(bleService.connectedDeviceId).toBeNull();
      expect(component.connectedDeviceId).toBeNull();
      expect(component.entryConnectionCleanupInProgress).toBeFalse();
      expect(component.canStartScan).toBeTrue();
    },
  );

  it('should consume a successful product exit, clear the list and show the Phase 1 toast',
    async () => {
      component.devices = [{ deviceId: 'device-1', name: 'Salon', rssi: -50 }];
      productExitState.record({
        deviceId: 'device-1',
        disconnectStatus: 'success',
      });
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();

      await component.ionViewWillEnter();

      expect(component.devices).toEqual([]);
      expect(component.scanning).toBeFalse();
      expect(startScanSpy).not.toHaveBeenCalled();
      expect(toastOptions).toEqual([{
        message: component.productPageText.states.disconnected,
        duration: 500,
        position: 'middle',
      }]);
      expect(toastPresent).toHaveBeenCalledTimes(1);
    },
  );

  it('should preserve the list after disconnect failure and retry cleanup only on manual scan',
    async () => {
      component.devices = [{ deviceId: 'device-1', name: 'Salon', rssi: -50 }];
      bleService.setConnectedDeviceId('device-1');
      productExitState.record({
        deviceId: 'device-1',
        disconnectStatus: 'failed',
      });

      await component.ionViewWillEnter();

      expect(bleService.disconnect).not.toHaveBeenCalled();
      expect(component.devices.length).toBe(1);
      expect(component.canStartScan).toBeTrue();
      expect(toastCreate).not.toHaveBeenCalled();

      bleService.disconnectResult = Promise.reject(
        new Error('Native disconnect still failed.'),
      );
      await component.startScan();

      expect(bleService.disconnect).toHaveBeenCalledTimes(1);
      expect(component.scanning).toBeFalse();
      expect(component.devices.length).toBe(1);
      expect(component.canStartScan).toBeTrue();
      expect(toastCreate).not.toHaveBeenCalled();

      bleService.disconnectResult = null;
      await component.startScan();

      expect(bleService.disconnect).toHaveBeenCalledTimes(2);
      expect(component.devices).toEqual([]);
      expect(component.scanning).toBeTrue();
      expect(toastCreate).toHaveBeenCalledTimes(1);
    },
  );

  it('should start scanning with Phase 1 filters and stop after eight seconds', fakeAsync(() => {
    const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
    const stopScanSpy = spyOn(bleService, 'stopScan').and.callThrough();

    void component.startScan();
    flushMicrotasks();
    fixture.detectChanges();

    expect(startScanSpy).toHaveBeenCalledTimes(1);
    expect(startScanSpy).toHaveBeenCalledOnceWith(
      jasmine.any(Function),
      [BLE_UUIDS.widoorService, BLE_UUIDS.moventivGarlineService],
    );
    expect(component.scanning).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Recherche en cours...');

    tick(7_999);
    flushMicrotasks();

    expect(stopScanSpy).not.toHaveBeenCalled();
    expect(component.scanning).toBeTrue();

    tick(1);
    flushMicrotasks();

    expect(stopScanSpy).toHaveBeenCalledTimes(1);
    expect(component.scanning).toBeFalse();
  }));

  it('should preserve existing results when Bluetooth precheck fails',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      const existingDevice = {
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      };
      component.devices = [existingDevice];
      component.selectedDeviceId = existingDevice.deviceId;
      bleService.bluetoothEnabled = false;

      await component.startScan();
      fixture.detectChanges();

      expect(component.devices).toEqual([existingDevice]);
      expect(component.selectedDeviceId).toBe(existingDevice.deviceId);
      expect(component.scanning).toBeFalse();
      expect(startScanSpy).not.toHaveBeenCalled();
      expect(scanTimeoutOf(component)).toBeNull();
      expect(fixture.nativeElement.querySelector('.scan-header-spinner'))
        .toBeNull();
    },
  );

  it('should preserve existing results when permission precheck fails',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      component.devices = [{
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      }];
      bleService.bluetoothEnabledError = new BleOperationError(
        'permission-denied',
        'BLE permission denied.',
      );

      await component.startScan();

      expect(component.devices.map(({ deviceId }) => deviceId))
        .toEqual(['device-existing']);
      expect(component.scanning).toBeFalse();
      expect(startScanSpy).not.toHaveBeenCalled();
      expect(scanTimeoutOf(component)).toBeNull();
      expect(component.canStartScan).toBeTrue();
    },
  );

  it('should preserve existing results after an unexpected prepare error',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      component.devices = [{
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      }];
      bleService.bluetoothEnabledError = new Error('Prepare failed');

      await component.startScan();

      expect(component.devices.map(({ deviceId }) => deviceId))
        .toEqual(['device-existing']);
      expect(component.scanning).toBeFalse();
      expect(startScanSpy).not.toHaveBeenCalled();
      expect(scanTimeoutOf(component)).toBeNull();
      expect(component.canStartScan).toBeTrue();
    },
  );

  it('should clear existing results only after the precheck succeeds',
    async () => {
      let releasePrecheck!: (enabled: boolean) => void;
      const pendingPrecheck = new Promise<boolean>((resolve) => {
        releasePrecheck = resolve;
      });
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      spyOn(bleService, 'isBluetoothEnabled')
        .and.returnValue(pendingPrecheck);
      component.devices = [{
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      }];

      const scan = component.startScan();

      expect(component.devices.length).toBe(1);
      expect(component.scanning).toBeFalse();
      expect(component.canStartScan).toBeFalse();
      expect(startScanSpy).not.toHaveBeenCalled();
      expect(scanTimeoutOf(component)).toBeNull();

      releasePrecheck(true);
      await scan;

      expect(component.devices).toEqual([]);
      expect(component.scanning).toBeTrue();
      expect(startScanSpy).toHaveBeenCalledTimes(1);
      expect(scanTimeoutOf(component)).not.toBeNull();
    },
  );

  it('should preserve new results when the eight-second scan times out',
    fakeAsync(() => {
      void component.startScan();
      flushMicrotasks();
      bleService.emit(createScanResult('device-new', -42, 'Nouveau produit'));

      tick(8_000);
      flushMicrotasks();

      expect(component.scanning).toBeFalse();
      expect(component.devices.map(({ deviceId }) => deviceId))
        .toEqual(['device-new']);
      expect(component.canStartScan).toBeTrue();
    }),
  );

  it('should add a detected device', async () => {
    await component.startScan();

    bleService.emit(createScanResult('device-1', -42, 'Capteur'));

    expect(component.devices).toEqual([
      { deviceId: 'device-1', name: 'Capteur', rssi: -42 },
    ]);
    await component.stopScan();
  });

  it('should render scanned devices with Phase 1 compact visual data',
    async () => {
      await component.startScan();

      bleService.emit(createScanResult('device-1', -42, 'Salon#SAL'));
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector(
        '.device-list ion-item',
      ) as HTMLElement | null;
      const signal = fixture.nativeElement.querySelector(
        '.scan-rssi-image',
      ) as HTMLImageElement | null;
      const signalLine = fixture.nativeElement.querySelector(
        '.scan-rssi-line',
      ) as HTMLElement | null;
      const signalIndicator = fixture.nativeElement.querySelector(
        '.scan-rssi-indicator',
      ) as HTMLElement | null;

      expect(item?.textContent).toContain('Nom : Salon');
      expect(item?.textContent).toContain('device-1');
      expect(item?.textContent).not.toContain('Pièce :');
      expect(item?.querySelector('.ai-loc-sal')).not.toBeNull();
      expect(signal?.getAttribute('src')).toBe(
        'assets/img/img_ble_strenght_4_4.svg',
      );
      expect(signalLine?.firstElementChild?.classList)
        .toContain('scan-rssi-label');
      expect(signalLine?.lastElementChild).toBe(signalIndicator);
      expect(signalIndicator?.firstElementChild).toBe(signal);

      await component.stopScan();
    },
  );

  it('should render the Phase 1 blue search action with its leading icon',
    () => {
      const button = scanSearchButton(fixture);
      const icon = button.querySelector('ion-icon');

      expect(button.hasAttribute('color')).toBeFalse();
      expect(icon?.getAttribute('name')).toBe('search');
      expect(icon?.getAttribute('slot')).toBe('start');
      expect(button.textContent?.trim()).toBe(component.scanText.search);
    });

  it('should hide BLE identifiers when the scan preference disables them',
    async () => {
      storeShowBleIdentifier(false);
      await component.startScan();

      bleService.emit(createScanResult('device-1', -42, 'Salon#SAL'));
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).not.toContain('device-1');

      await component.stopScan();
    },
  );

  it('should deduplicate devices by deviceId', async () => {
    await component.startScan();

    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    bleService.emit(createScanResult('device-1', -50, 'Capteur'));

    expect(component.devices.length).toBe(1);
    await component.stopScan();
  });

  it('should update the RSSI of an existing device', async () => {
    await component.startScan();

    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    bleService.emit(createScanResult('device-1', -61, 'Capteur'));

    expect(component.devices[0].rssi).toBe(-61);
    await component.stopScan();
  });

  it('should prefer the advertised localName over device.name',
    async () => {
      localStorage.setItem('StoredRoomAssignments', JSON.stringify({
        'DEVICE-1': { name: 'Ancien nom', suffix: '#SAL' },
      }));
      await component.startScan();

      bleService.emit(createScanResult(
        'device-1',
        -42,
        'Ancien nom',
        'Nouveau nom#CHA',
      ));

      expect(component.devices[0].name).toBe('Nouveau nom#CHA');
      expect(component.getScanDisplayName(component.devices[0]))
        .toBe('Nouveau nom');
      await component.stopScan();
    },
  );

  it('should replace a stale iOS device.name when localName arrives later',
    async () => {
      bleService.platform = 'ios';
      await component.startScan();

      bleService.emit(createScanResult('device-1', -42, 'Ancien nom'));
      expect(component.getScanDisplayName(component.devices[0]))
        .toBe('Ancien nom');

      bleService.emit(createScanResult(
        'device-1', -48, 'Ancien nom', 'Nouveau nom#CHA',
      ));
      expect(component.devices).toHaveSize(1);
      expect(component.devices[0].name).toBe('Nouveau nom#CHA');
      expect(component.getScanDisplayName(component.devices[0]))
        .toBe('Nouveau nom');
      await component.stopScan();
    },
  );

  it('should preserve a known name while duplicates refresh RSSI',
    async () => {
      await component.startScan();

      bleService.emit(createScanResult('device-1', -42, 'Produit'));
      bleService.emit(createScanResult('device-1', -61));

      expect(component.devices).toEqual([
        { deviceId: 'device-1', name: 'Produit', rssi: -61 },
      ]);
      await component.stopScan();
    },
  );

  it('should stop scanning', async () => {
    const stopScanSpy = spyOn(bleService, 'stopScan').and.callThrough();
    await component.startScan();

    await component.stopScan();

    expect(stopScanSpy).toHaveBeenCalledTimes(1);
    expect(component.scanning).toBeFalse();
  });

  it('should preserve the previous list and show a simple toast when scan start fails',
    async () => {
      const existingDevice = {
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      };
      component.devices = [existingDevice];
      spyOn(bleService, 'startScan').and.rejectWith(
        new Error('Capteur indisponible'),
      );

      await component.startScan();
      fixture.detectChanges();

      expect(component.devices).toEqual([existingDevice]);
      expect(component.errorMessage).toBeNull();
      expect(component.scanBleError).toBeNull();
      expect(fixture.nativeElement.textContent)
        .not.toContain('Capteur indisponible');
      expect(fixture.nativeElement.textContent).not.toContain('Réessayer');
      expect(toastOptions).toEqual([jasmine.objectContaining({
        message: 'La recherche Bluetooth a échoué. Veuillez réessayer.',
        duration: 3_000,
      })]);
      expect(component.scanning).toBeFalse();
      expect(component.canStartScan).toBeTrue();
      expect(scanTimeoutOf(component)).toBeNull();
    },
  );

  it('should start a new scan from the main button after a start failure',
    fakeAsync(() => {
      const startScanSpy = spyOn(bleService, 'startScan');
      startScanSpy.and.returnValues(
        Promise.reject(new Error('Scan unavailable')),
        Promise.resolve(),
      );

      scanSearchButton(fixture).click();
      flushMicrotasks();
      fixture.detectChanges();

      expect(component.canStartScan).toBeTrue();
      scanSearchButton(fixture).click();
      flushMicrotasks();

      expect(startScanSpy).toHaveBeenCalledTimes(2);
      expect(component.scanning).toBeTrue();
    }),
  );

  it('should show the Phase 1 not-ready toast without native details',
    async () => {
      spyOn(bleService, 'startScan').and.rejectWith(new BleOperationError(
        'initialization-failed',
        'BleClient not initialized',
        new Error('Native status 17'),
      ));

      await component.startScan();
      fixture.detectChanges();

      expect(toastOptions).toEqual([jasmine.objectContaining({
        message:
          'Le Bluetooth de l’application n’est pas prêt. Veuillez relancer ' +
          'la recherche.',
        duration: 3_000,
      })]);
      expect(fixture.nativeElement.textContent).not.toContain('Native status');
      expect(component.canStartScan).toBeTrue();
    },
  );

  it('should keep active results and reuse Bluetooth-off feedback when Bluetooth stops',
    async () => {
      await component.startScan();
      bleService.emit(createScanResult('device-new', -42, 'Nouveau produit'));

      bleService.emitBluetoothEnabled(false);
      await settlePromises();
      fixture.detectChanges();

      expect(component.scanning).toBeFalse();
      expect(component.devices.map(({ deviceId }) => deviceId))
        .toEqual(['device-new']);
      expect(scanTimeoutOf(component)).toBeNull();
      expect(alertOptions).toHaveSize(1);
      expect(alertOptions[0].header).toBe('Bluetooth désactivé');
      expect(toastOptions).toEqual([]);
      expect(component.errorMessage).toBeNull();
      expect(component.canStartScan).toBeTrue();
    },
  );

  it('should silently leave the UI idle when native stopScan fails',
    async () => {
      await component.startScan();
      bleService.emit(createScanResult('device-new', -42, 'Nouveau produit'));
      bleService.stopScanError = new Error('Native stop failed');

      await component.stopScan();
      fixture.detectChanges();

      expect(component.scanning).toBeFalse();
      expect(component.devices.map(({ deviceId }) => deviceId))
        .toEqual(['device-new']);
      expect(component.errorMessage).toBeNull();
      expect(toastOptions).toEqual([]);
      expect(scanTimeoutOf(component)).toBeNull();
      expect(component.canStartScan).toBeTrue();
    },
  );

  it('should show the same Bluetooth-off alert for both auto-enable preferences',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      const existingDevice = {
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      };
      bleService.bluetoothEnabled = false;

      for (const autoEnable of [false, true]) {
        storeAutoEnableBluetooth(autoEnable);
        component.devices = [existingDevice];
        await component.startScan();

        const alert = alertOptions[alertOptions.length - 1];
        expect(alert.header).toBe('Bluetooth désactivé');
        expect(alert.buttons.map(({ text }) => text))
          .toEqual(['Annuler', 'Activer']);
        expect(component.devices).toEqual([existingDevice]);
        expect(component.scanning).toBeFalse();
        expect(component.scanBleError).toBeNull();
        expect(component.errorMessage).toBeNull();
        expect(startScanSpy).not.toHaveBeenCalled();
        expect(bleService.requestBluetoothEnable).not.toHaveBeenCalled();

        await alert.buttons[0].handler?.();
      }
    },
  );

  it('should cancel Bluetooth activation without changing the current scan list',
    async () => {
      const existingDevice = {
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      };
      bleService.bluetoothEnabled = false;

      for (const platform of ['android', 'ios'] as const) {
        component.devices = [existingDevice];
        component.selectedDeviceId = existingDevice.deviceId;
        bleService.platform = platform;
        bleService.canRequestBluetoothEnable = platform === 'android';

        await component.startScan();
        const alert = alertOptions[alertOptions.length - 1];
        await alert.buttons[0].handler?.();

        expect(component.devices).toEqual([existingDevice]);
        expect(component.selectedDeviceId).toBe(existingDevice.deviceId);
        expect(component.scanning).toBeFalse();
        expect(scanTimeoutOf(component)).toBeNull();
      }
      expect(bleService.requestBluetoothEnable).not.toHaveBeenCalled();
    },
  );

  it('should release scan preparation after cancelling the Bluetooth-off alert',
    async () => {
      bleService.bluetoothEnabled = false;
      const isBluetoothEnabledSpy = spyOn(bleService, 'isBluetoothEnabled')
        .and.callThrough();
      const searchButton = scanSearchButton(fixture);

      searchButton.click();
      await fixture.whenStable();
      await alertOptions[0].buttons[0].handler?.();
      fixture.detectChanges();

      expect(scanPreparationInProgressOf(component)).toBeFalse();
      expect(component.scanning).toBeFalse();
      expect(component.canStartScan).toBeTrue();

      searchButton.click();
      await fixture.whenStable();

      expect(isBluetoothEnabledSpy).toHaveBeenCalledTimes(2);
      expect(alertOptions).toHaveSize(2);
      expect(scanPreparationInProgressOf(component)).toBeFalse();
    },
  );

  it('should enable Bluetooth on Android and start one scan after confirmation',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      component.devices = [{
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      }];
      bleService.bluetoothEnabled = false;

      await component.startScan();
      await alertOptions[0].buttons[1].handler?.();

      expect(bleService.requestBluetoothEnable).toHaveBeenCalledTimes(1);
      expect(startScanSpy).toHaveBeenCalledTimes(1);
      expect(component.devices).toEqual([]);
      expect(component.scanning).toBeTrue();
      expect(component.scanBleError).toBeNull();
    },
  );

  it('should offer Android Bluetooth settings when activation is refused',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      component.devices = [{
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      }];
      bleService.bluetoothEnabled = false;
      bleService.requestBluetoothEnable.and.rejectWith(
        new BleOperationError(
          'bluetooth-enable-failed',
          'Bluetooth enable request failed.',
        ),
      );

      await component.startScan();
      await alertOptions[0].buttons[1].handler?.();

      expect(alertOptions.length).toBe(2);
      expect(alertOptions[1].header).toBe('Activation nécessaire');
      expect(alertOptions[1].buttons.map(({ text }) => text))
        .toEqual(['OK', 'Ouvrir les paramètres Bluetooth']);
      expect(component.devices.map(({ deviceId }) => deviceId))
        .toEqual(['device-existing']);
      expect(component.scanning).toBeFalse();
      expect(startScanSpy).not.toHaveBeenCalled();
      expect(component.scanBleError).toBeNull();

      await alertOptions[1].buttons[1].handler?.();
      expect(bleService.openBluetoothSettings).toHaveBeenCalledTimes(1);
      expect(bleService.openAppSettings).not.toHaveBeenCalled();
    },
  );

  it('should offer settings when Android Bluetooth remains disabled',
    fakeAsync(() => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      bleService.bluetoothEnabled = false;
      bleService.requestBluetoothEnable.and.callFake(async () => undefined);

      void component.startScan();
      flushMicrotasks();
      void alertOptions[0].buttons[1].handler?.();
      flushMicrotasks();

      tick(400);
      flushMicrotasks();
      tick(600);
      flushMicrotasks();
      tick(800);
      flushMicrotasks();

      expect(bleService.requestBluetoothEnable).toHaveBeenCalledTimes(1);
      expect(alertOptions.length).toBe(2);
      expect(startScanSpy).not.toHaveBeenCalled();
      expect(component.scanning).toBeFalse();
    }),
  );

  it('should never request Bluetooth enable on iOS and open app settings',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      bleService.platform = 'ios';
      bleService.canRequestBluetoothEnable = false;
      bleService.bluetoothEnabled = false;

      await component.startScan();
      await alertOptions[0].buttons[1].handler?.();

      expect(bleService.requestBluetoothEnable).not.toHaveBeenCalled();
      expect(alertOptions.length).toBe(2);
      expect(alertOptions[1].buttons.map(({ text }) => text))
        .toEqual(['OK', 'Ouvrir les réglages']);
      expect(startScanSpy).not.toHaveBeenCalled();
      expect(component.scanning).toBeFalse();

      await alertOptions[1].buttons[1].handler?.();
      expect(bleService.openAppSettings).toHaveBeenCalledTimes(1);
      expect(bleService.openBluetoothSettings).not.toHaveBeenCalled();
      expect(startScanSpy).not.toHaveBeenCalled();
    },
  );

  it('should preserve the list and offer location settings on Android API 30',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      const existingDevice = {
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      };
      component.devices = [existingDevice];
      component.selectedDeviceId = existingDevice.deviceId;
      bleService.legacyAndroidLocationServiceRequired = true;
      bleService.locationEnabled = false;

      await component.startScan();

      expect(alertOptions).toHaveSize(1);
      expect(alertOptions[0].header).toBe('Localisation désactivée');
      expect(alertOptions[0].buttons.map(({ text }) => text)).toEqual([
        'Annuler',
        'Ouvrir les réglages de localisation',
      ]);
      expect(component.devices).toEqual([existingDevice]);
      expect(component.selectedDeviceId).toBe(existingDevice.deviceId);
      expect(component.scanning).toBeFalse();
      expect(scanPreparationInProgressOf(component)).toBeFalse();
      expect(scanTimeoutOf(component)).toBeNull();
      expect(startScanSpy).not.toHaveBeenCalled();
      expect(component.scanBleError).toBeNull();
      expect(component.errorMessage).toBeNull();
    },
  );

  it('should open location settings once without automatically scanning',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      bleService.legacyAndroidLocationServiceRequired = true;
      bleService.locationEnabled = false;

      await component.startScan();
      await alertOptions[0].buttons[1].handler?.();

      expect(bleService.openLocationSettings).toHaveBeenCalledTimes(1);
      expect(startScanSpy).not.toHaveBeenCalled();
      expect(component.scanning).toBeFalse();
      expect(component.canStartScan).toBeTrue();
    },
  );

  it('should scan on a new search after legacy Android location is enabled',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      component.devices = [{
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      }];
      bleService.legacyAndroidLocationServiceRequired = true;
      bleService.locationEnabled = false;

      await component.startScan();
      await alertOptions[0].buttons[1].handler?.();
      bleService.locationEnabled = true;

      expect(startScanSpy).not.toHaveBeenCalled();
      expect(component.devices).toHaveSize(1);

      await component.startScan();

      expect(startScanSpy).toHaveBeenCalledTimes(1);
      expect(component.devices).toEqual([]);
      expect(component.scanning).toBeTrue();
      expect(scanTimeoutOf(component)).not.toBeNull();
    },
  );

  it('should scan normally when legacy Android location is already enabled',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      const locationSpy = spyOn(bleService, 'isLocationEnabled')
        .and.callThrough();
      bleService.legacyAndroidLocationServiceRequired = true;
      bleService.locationEnabled = true;

      await component.startScan();

      expect(locationSpy).toHaveBeenCalledTimes(1);
      expect(startScanSpy).toHaveBeenCalledTimes(1);
      expect(component.scanning).toBeTrue();
      expect(alertOptions).toEqual([]);
    },
  );

  it('should not check location services on Android API 31 or later',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      const locationSpy = spyOn(bleService, 'isLocationEnabled')
        .and.callThrough();
      bleService.legacyAndroidLocationServiceRequired = false;
      bleService.locationEnabled = false;

      await component.startScan();

      expect(locationSpy).not.toHaveBeenCalled();
      expect(startScanSpy).toHaveBeenCalledTimes(1);
      expect(component.scanning).toBeTrue();
    },
  );

  it('should never check Android location services on iOS', async () => {
    const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
    const locationPolicySpy = spyOn(
      bleService,
      'requiresLegacyAndroidLocationService',
    ).and.callThrough();
    const locationSpy = spyOn(bleService, 'isLocationEnabled')
      .and.callThrough();
    bleService.platform = 'ios';
    bleService.legacyAndroidLocationServiceRequired = false;
    bleService.locationEnabled = false;

    await component.startScan();

    expect(locationPolicySpy).toHaveBeenCalledTimes(1);
    expect(locationSpy).not.toHaveBeenCalled();
    expect(startScanSpy).toHaveBeenCalledTimes(1);
    expect(component.scanning).toBeTrue();
  });

  it('should show only a Phase 1 toast after the first Android permission denial',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.rejectWith(
        new BleOperationError(
          'permission-denied',
          'BLE permission denied.',
        ),
      );
      const existingDevice = {
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      };
      component.devices = [existingDevice];
      component.selectedDeviceId = existingDevice.deviceId;

      scanSearchButton(fixture).click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(toastOptions).toEqual([jasmine.objectContaining({
        message:
          'L’autorisation Bluetooth est nécessaire pour détecter et se ' +
          'connecter aux motorisations.',
        duration: 3_500,
        position: 'bottom',
      })]);
      expect(toastOptions[0]['message']).not.toContain('localisation');
      expect(alertOptions).toEqual([]);
      expect(component.devices).toEqual([existingDevice]);
      expect(component.selectedDeviceId).toBe(existingDevice.deviceId);
      expect(component.scanning).toBeFalse();
      expect(component.scanBleError).toBeNull();
      expect(component.errorMessage).toBeNull();
      expect(scanPreparationInProgressOf(component)).toBeFalse();
      expect(component.canStartScan).toBeTrue();
      expect(fixture.nativeElement.textContent).not.toContain('Réessayer');
      expect(startScanSpy).toHaveBeenCalledTimes(1);
      expect(bleService.isScanning()).toBeFalse();
    },
  );

  it('should offer app settings after a repeated Android permission denial',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.rejectWith(
        new BleOperationError(
          'permission-denied',
          'BLE permission denied.',
        ),
      );
      component.devices = [{
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      }];

      const searchButton = scanSearchButton(fixture);
      searchButton.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.canStartScan).toBeTrue();

      searchButton.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(toastCreate).toHaveBeenCalledTimes(1);
      expect(alertOptions.length).toBe(1);
      expect(alertOptions[0].header).toBe('Autorisation requise');
      expect(alertOptions[0].message).toBe(
        'L’autorisation Bluetooth est nécessaire pour détecter et se ' +
        'connecter aux motorisations. Veuillez l’activer dans les réglages ' +
        'de l’application.',
      );
      expect(alertOptions[0].message).not.toContain('localisation');
      expect(alertOptions[0].buttons.map(({ text }) => text)).toEqual([
        'Annuler',
        'Ouvrir les réglages de l’application',
      ]);
      expect(component.devices.map(({ deviceId }) => deviceId))
        .toEqual(['device-existing']);
      expect(component.scanning).toBeFalse();
      expect(component.scanBleError).toBeNull();
      expect(scanPreparationInProgressOf(component)).toBeFalse();
      expect(component.canStartScan).toBeTrue();
      expect(startScanSpy).toHaveBeenCalledTimes(2);
      expect(bleService.isScanning()).toBeFalse();

      await alertOptions[0].buttons[1].handler?.();
      expect(bleService.openAppSettings).toHaveBeenCalledTimes(1);
      expect(startScanSpy).toHaveBeenCalledTimes(2);
    },
  );

  it('should keep location in permission feedback on Android API 30',
    async () => {
      bleService.legacyAndroidLocationServiceRequired = true;
      bleService.locationEnabled = true;
      spyOn(bleService, 'startScan').and.rejectWith(
        new BleOperationError('permission-denied', 'Permission denied.'),
      );

      await component.startScan();

      expect(toastOptions).toEqual([jasmine.objectContaining({
        message:
          'Impossible de lancer la recherche tant que les autorisations ' +
          'Bluetooth et localisation ne sont pas accordées.',
      })]);
    },
  );

  it('should remember a blocked permission without repeating the native check',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.rejectWith(
        new BleOperationError(
          'permission-settings-required',
          'BLE permission denied.',
        ),
      );

      await component.startScan();
      await alertOptions[0].buttons[0].handler?.();
      expect(scanPreparationInProgressOf(component)).toBeFalse();
      expect(component.canStartScan).toBeTrue();

      await component.startScan();

      expect(startScanSpy).toHaveBeenCalledTimes(1);
      expect(alertOptions.length).toBe(2);
      expect(toastCreate).not.toHaveBeenCalled();
      expect(component.scanning).toBeFalse();
      expect(scanPreparationInProgressOf(component)).toBeFalse();
      expect(component.canStartScan).toBeTrue();
    },
  );

  it('should offer app settings immediately after an iOS permission denial',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.rejectWith(
        new BleOperationError(
          'permission-settings-required',
          'BLE permission denied.',
        ),
      );
      component.devices = [{
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      }];
      bleService.platform = 'ios';
      bleService.canRequestBluetoothEnable = false;

      await component.startScan();

      expect(toastCreate).not.toHaveBeenCalled();
      expect(alertOptions.length).toBe(1);
      expect(component.devices.map(({ deviceId }) => deviceId))
        .toEqual(['device-existing']);
      expect(component.scanning).toBeFalse();
      expect(scanPreparationInProgressOf(component)).toBeFalse();
      expect(component.canStartScan).toBeTrue();
      expect(startScanSpy).toHaveBeenCalledTimes(1);

      await alertOptions[0].buttons[1].handler?.();
      expect(bleService.openAppSettings).toHaveBeenCalledTimes(1);
      expect(startScanSpy).toHaveBeenCalledTimes(1);
    },
  );

  it('should scan after permission is granted and reset denial state',
    async () => {
      const permissionDenied = new BleOperationError(
        'permission-denied',
        'BLE permission denied.',
      );
      const startScanSpy = spyOn(bleService, 'startScan').and.returnValues(
        Promise.reject(permissionDenied),
        Promise.resolve(),
        Promise.reject(permissionDenied),
      );
      component.devices = [{
        deviceId: 'device-existing',
        name: 'Produit existant',
        rssi: -48,
      }];

      await component.startScan();
      expect(component.devices).toHaveSize(1);

      await component.startScan();
      expect(component.scanning).toBeTrue();
      expect(component.devices).toEqual([]);
      expect(startScanSpy).toHaveBeenCalledTimes(2);
      await component.stopScan();

      await component.startScan();

      expect(toastCreate).toHaveBeenCalledTimes(2);
      expect(alertOptions).toEqual([]);
      expect(component.scanning).toBeFalse();
      expect(startScanSpy).toHaveBeenCalledTimes(3);
    },
  );

  it('should keep Scan usable when opening permission settings fails',
    async () => {
      bleService.bluetoothEnabledError = new BleOperationError(
        'permission-settings-required',
        'BLE permission denied.',
      );
      bleService.openAppSettings.and.rejectWith(new BleOperationError(
        'app-settings-failed',
        'Opening app settings failed.',
      ));

      await component.startScan();
      await alertOptions[0].buttons[1].handler?.();

      expect(bleService.openAppSettings).toHaveBeenCalledTimes(1);
      expect(component.scanBleError).toBeNull();
      expect(component.errorMessage).toBeNull();
      expect(component.scanning).toBeFalse();
      expect(component.canStartScan).toBeTrue();
    },
  );

  it('should not render the former technical scan retry action', () => {
    component.errorMessage = 'Native plugin error';
    component.scanBleError = {
      code: 'scan-failed',
      message: 'Native scan error',
      action: 'retry-scan',
      actionLabel: 'Réessayer',
    };

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Réessayer');
    expect(fixture.nativeElement.textContent).not.toContain('Native scan error');
    expect(fixture.nativeElement.textContent).not.toContain('Native plugin error');
  });

  it('should ignore a second Bluetooth recovery action while enable is pending',
    async () => {
      let releaseEnable!: () => void;
      bleService.bluetoothEnabled = false;
      bleService.requestBluetoothEnableResult = new Promise<void>((resolve) => {
        releaseEnable = resolve;
      });
      await component.startScan();

      const firstAction = alertOptions[0].buttons[1].handler?.();
      await alertOptions[0].buttons[1].handler?.();

      expect(bleService.requestBluetoothEnable).toHaveBeenCalledTimes(1);

      releaseEnable();
      await firstAction;
    },
  );

  it('should ignore scan retry while Bluetooth initialization is pending',
    async () => {
      let releaseEnabled!: (enabled: boolean) => void;
      const pendingEnabled = new Promise<boolean>((resolve) => {
        releaseEnabled = resolve;
      });
      const enabledSpy = spyOn(bleService, 'isBluetoothEnabled')
        .and.returnValue(pendingEnabled);

      const firstScan = component.startScan();
      await component.startScan();

      expect(enabledSpy).toHaveBeenCalledTimes(1);

      releaseEnabled(true);
      await firstScan;
    },
  );

  it('should not update scan errors when destroyed during Bluetooth initialization',
    async () => {
      let releaseEnabled!: (enabled: boolean) => void;
      spyOn(bleService, 'isBluetoothEnabled').and.returnValue(
        new Promise<boolean>((resolve) => {
          releaseEnabled = resolve;
        }),
      );
      const scan = component.startScan();

      fixture.destroy();
      releaseEnabled(false);
      await scan;

      expect(component.scanning).toBeFalse();
      expect(component.scanBleError).toBeNull();
      expect(component.errorMessage).toBeNull();
    },
  );

  it('should clear recovery state when destroyed during Bluetooth enable',
    async () => {
      let releaseEnable!: () => void;
      bleService.bluetoothEnabled = false;
      bleService.requestBluetoothEnableResult = new Promise<void>((resolve) => {
        releaseEnable = resolve;
      });
      await component.startScan();
      const recovery = alertOptions[0].buttons[1].handler?.();

      fixture.destroy();
      releaseEnable();
      await recovery;

      expect(component.bleRecoveryInProgress).toBeFalse();
    },
  );

  it('should stop scanning when the page is destroyed', fakeAsync(() => {
    const stopScanSpy = spyOn(bleService, 'stopScan').and.callThrough();
    void component.startScan();
    flushMicrotasks();

    fixture.destroy();
    flushMicrotasks();

    expect(stopScanSpy).toHaveBeenCalledTimes(1);
    expect(component.scanning).toBeFalse();
  }));

  it('should select a detected device', async () => {
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));

    component.selectDevice(component.devices[0]);

    expect(component.selectedDeviceId).toBe('device-1');
    expect(component.selectedDevice?.name).toBe('Capteur');
    await component.stopScan();
  });

  it('should stop scanning when a detected device is tapped', fakeAsync(() => {
    const stopScanSpy = spyOn(bleService, 'stopScan').and.callThrough();
    const connectSpy = spyOn(bleService, 'connect').and.callThrough();
    bleService.servicesResult = createIdentificationServices();
    bleService.readResult = createVersionWord(0, 1);
    void component.startScan();
    flushMicrotasks();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));

    void component.selectAndConnectDevice(component.devices[0]);
    expect(component.connecting).toBeTrue();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Connexion en cours');
    flushMicrotasks();
    tick(400);
    flushMicrotasks();
    fixture.detectChanges();

    expect(stopScanSpy).toHaveBeenCalledBefore(connectSpy);
    expect(component.connectedDeviceId).toBe('device-1');
    tick(500);
    flushMicrotasks();
    expect(fixture.nativeElement.textContent).not.toContain('Connecter');
  }));

  it('should wait 500 ms after a first-attempt connection before discovery',
    fakeAsync(() => {
      const discoverSpy = spyOn(bleService, 'discoverServices')
        .and.callThrough();
      bleService.servicesResult = createIdentificationServices();
      bleService.readResult = createVersionWord(0, 1);
      void component.startScan();
      flushMicrotasks();
      bleService.emit(createScanResult('device-1', -42, 'Produit'));

      void component.selectAndConnectDevice(component.devices[0]);
      flushMicrotasks();
      tick(399);
      expect(bleService.connectedDeviceId).toBeNull();

      tick(1);
      flushMicrotasks();
      expect(bleService.connectedDeviceId).toBe('device-1');
      expect(discoverSpy).not.toHaveBeenCalled();

      tick(499);
      flushMicrotasks();
      expect(discoverSpy).not.toHaveBeenCalled();

      tick(1);
      flushMicrotasks();
      expect(discoverSpy).toHaveBeenCalledOnceWith('device-1');
    }),
  );

  it('should keep retry and post-connection 500 ms delays distinct',
    fakeAsync(() => {
      const originalConnect = bleService.connect.bind(bleService);
      let attempt = 0;
      const connectSpy = spyOn(bleService, 'connect')
        .and.callFake(async (deviceId: string) => {
          attempt += 1;
          if (attempt === 1) {
            throw new BleOperationError(
              'connection-failed',
              'BLE connection failed.',
            );
          }
          await originalConnect(deviceId);
        });
      const discoverSpy = spyOn(bleService, 'discoverServices')
        .and.callThrough();
      bleService.servicesResult = createIdentificationServices();
      bleService.readResult = createVersionWord(0, 1);
      void component.startScan();
      flushMicrotasks();
      bleService.emit(createScanResult('device-1', -42, 'Produit'));

      void component.selectAndConnectDevice(component.devices[0]);
      flushMicrotasks();
      tick(400);
      flushMicrotasks();
      expect(connectSpy).toHaveBeenCalledTimes(1);

      tick(499);
      flushMicrotasks();
      expect(connectSpy).toHaveBeenCalledTimes(1);

      tick(1);
      flushMicrotasks();
      expect(connectSpy).toHaveBeenCalledTimes(2);
      expect(discoverSpy).not.toHaveBeenCalled();

      tick(499);
      flushMicrotasks();
      expect(discoverSpy).not.toHaveBeenCalled();

      tick(1);
      flushMicrotasks();
      expect(discoverSpy).toHaveBeenCalledOnceWith('device-1');
    }),
  );

  it('should skip discovery and close the winning connection if destroyed during stabilization',
    fakeAsync(() => {
      const discoverSpy = spyOn(bleService, 'discoverServices')
        .and.callThrough();
      bleService.servicesResult = createIdentificationServices();
      bleService.readResult = createVersionWord(0, 1);
      void component.startScan();
      flushMicrotasks();
      bleService.emit(createScanResult('device-1', -42, 'Produit'));

      void component.selectAndConnectDevice(component.devices[0]);
      flushMicrotasks();
      tick(400);
      flushMicrotasks();
      expect(bleService.connectedDeviceId).toBe('device-1');

      fixture.destroy();
      tick(499);
      flushMicrotasks();
      expect(discoverSpy).not.toHaveBeenCalled();

      tick(1);
      flushMicrotasks();
      expect(discoverSpy).not.toHaveBeenCalled();
      expect(bleService.disconnect).toHaveBeenCalledTimes(1);
      expect(bleService.connectedDeviceId).toBeNull();
      expect(routerNavigate).not.toHaveBeenCalled();
    }),
  );

  it('should automatically navigate after a successful tap connection flow',
    async () => {
      spyOn<any>(component, 'delay').and.resolveTo();
      bleService.servicesResult = createIdentificationServices();
      bleService.readResult = createVersionWord(0, 1);
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Produit'));

      await component.selectAndConnectDevice(component.devices[0]);

      expect(routerNavigate).toHaveBeenCalledOnceWith(
        ['/product/moventiv-60'],
        {
          state: jasmine.objectContaining({
            profile: 'moventiv-60',
            deviceId: 'device-1',
            connectionGeneration: bleService.connectionGeneration,
            identificationConfidence: 'strong',
          }),
        },
      );
    },
  );

  it('should preserve the physically validated Widoor tap flow without an intermediate step',
    async () => {
      spyOn<any>(component, 'delay').and.resolveTo();
      bleService.servicesResult = createWidoorIdentificationServices();
      bleService.readResult = createVersionWord(1, 0);
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Widoor#CHA'));

      await component.selectAndConnectDevice(component.devices[0]);

      expect(routerNavigate).toHaveBeenCalledOnceWith(
        ['/product/widoor'],
        {
          state: jasmine.objectContaining({
            profile: 'widoor',
            deviceId: 'device-1',
            identificationConfidence: 'strong',
          }),
        },
      );
      expect(fixture.nativeElement.textContent).not.toContain('Connecter');
    },
  );

  it('should automatically retry initial connection up to the last Phase 1 attempt',
    fakeAsync(() => {
      const originalConnect = bleService.connect.bind(bleService);
      const discoverSpy = spyOn(bleService, 'discoverServices')
        .and.callThrough();
      let attempt = 0;
      const connectSpy = spyOn(bleService, 'connect')
        .and.callFake(async (deviceId: string) => {
          attempt += 1;
          if (attempt < 3) {
            throw new BleOperationError(
              'connection-failed',
              'BLE connection failed.',
            );
          }
          await originalConnect(deviceId);
        });
      bleService.servicesResult = createIdentificationServices();
      bleService.readResult = createVersionWord(0, 1);
      void component.startScan();
      flushMicrotasks();
      bleService.emit(createScanResult('device-1', -42, 'Produit'));

      void component.selectAndConnectDevice(component.devices[0]);
      flushMicrotasks();
      expect(connectSpy).not.toHaveBeenCalled();
      expect(discoverSpy).not.toHaveBeenCalled();

      tick(400);
      flushMicrotasks();
      expect(connectSpy).toHaveBeenCalledTimes(1);
      expect(routerNavigate).not.toHaveBeenCalled();

      tick(500);
      flushMicrotasks();
      expect(connectSpy).toHaveBeenCalledTimes(2);
      expect(routerNavigate).not.toHaveBeenCalled();

      tick(1_000);
      flushMicrotasks();
      expect(connectSpy).toHaveBeenCalledTimes(3);
      expect(discoverSpy).not.toHaveBeenCalled();

      tick(499);
      flushMicrotasks();
      expect(discoverSpy).not.toHaveBeenCalled();

      tick(1);
      flushMicrotasks();
      expect(discoverSpy).toHaveBeenCalledOnceWith('device-1');
      expect(routerNavigate).toHaveBeenCalledOnceWith(
        ['/product/moventiv-60'],
        jasmine.any(Object),
      );
    }),
  );

  it('should recover after all Phase 1 connection attempts fail',
    async () => {
      spyOn(console, 'warn');
      spyOn<any>(component, 'delay').and.resolveTo();
      const connectSpy = spyOn(bleService, 'connect').and.rejectWith(
        new BleOperationError(
          'connection-timeout',
          'BLE connection timed out.',
        ),
      );
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));

      await component.selectAndConnectDevice(component.devices[0]);
      fixture.detectChanges();

      expect(connectSpy).toHaveBeenCalledTimes(3);
      expect(component.connectedDeviceId).toBeNull();
      expect(component.selectedDeviceId).toBeNull();
      expect(component.connecting).toBeFalse();
      expect(component.canStartScan).toBeTrue();
      expect(component.devices).toHaveSize(1);
      const connectionAlert = alertOptions.find(
        ({ header }) => header === 'Connexion impossible',
      );
      expect(connectionAlert).toBeDefined();
      expect(connectionAlert?.message).toBe(
        "Impossible de se connecter à l'appareil. Vérifiez qu'il est allumé, " +
        'à proximité et correctement appairé avec votre téléphone, puis réessayez.',
      );
      expect(connectionAlert?.message)
        .not.toContain("L'appareil n'est pas appairé");
      expect(connectionAlert?.buttons).toEqual([
        jasmine.objectContaining({ text: 'OK', role: 'cancel' }),
      ]);
      expect(toastOptions).not.toContain(jasmine.objectContaining({
        message: jasmine.stringContaining('appairé'),
      }));
      expect(fixture.nativeElement.textContent).not.toContain(
        'BLE connection timed out',
      );
      expect(routerNavigate).not.toHaveBeenCalled();
    },
  );

  it('should not schedule discovery stabilization after three failed attempts',
    fakeAsync(() => {
      spyOn(console, 'warn');
      const connectSpy = spyOn(bleService, 'connect').and.rejectWith(
        new BleOperationError(
          'connection-timeout',
          'BLE connection timed out.',
        ),
      );
      const discoverSpy = spyOn(bleService, 'discoverServices')
        .and.callThrough();
      void component.startScan();
      flushMicrotasks();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));

      void component.selectAndConnectDevice(component.devices[0]);
      flushMicrotasks();
      tick(400);
      flushMicrotasks();
      tick(500);
      flushMicrotasks();
      tick(1_000);
      flushMicrotasks();

      expect(connectSpy).toHaveBeenCalledTimes(3);
      expect(discoverSpy).not.toHaveBeenCalled();
      expect(component.canStartScan).toBeTrue();
      expect(component.devices).toHaveSize(1);

      tick(500);
      flushMicrotasks();
      expect(discoverSpy).not.toHaveBeenCalled();
    }),
  );

  it('should cleanup a partial failed connection before retrying',
    async () => {
      spyOn<any>(component, 'delay').and.resolveTo();
      const originalConnect = bleService.connect.bind(bleService);
      let attempt = 0;
      spyOn(bleService, 'connect').and.callFake(async (deviceId: string) => {
        attempt += 1;
        if (attempt === 1) {
          bleService.setConnectedDeviceId(deviceId);
          throw new BleOperationError(
            'connection-failed',
            'BLE connection failed.',
          );
        }
        await originalConnect(deviceId);
      });
      bleService.servicesResult = createIdentificationServices();
      bleService.readResult = createVersionWord(0, 1);
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));

      await component.selectAndConnectDevice(component.devices[0]);

      expect(bleService.disconnect).toHaveBeenCalledTimes(1);
      expect(component.connectedDeviceId).toBe('device-1');
    },
  );

  it('should replace a native connection error with pairing guidance', async () => {
    spyOn(console, 'warn');
    spyOn<any>(component, 'delay').and.resolveTo();
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    spyOn(bleService, 'connect').and.rejectWith(
      new Error('Connexion refusée'),
    );

    await component.selectAndConnectDevice(component.devices[0]);
    fixture.detectChanges();

    expect(component.connectionError).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Connexion refusée');
    expect(alertOptions).toContain(jasmine.objectContaining({
      header: 'Connexion impossible',
      message:
        "Impossible de se connecter à l'appareil. Vérifiez qu'il est allumé, " +
        'à proximité et correctement appairé avec votre téléphone, puis réessayez.',
    }));
    expect(toastOptions).toHaveSize(0);
    expect(component.connecting).toBeFalse();
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('should ignore a double tap while the connection is pending', async () => {
    spyOn<any>(component, 'delay').and.resolveTo();
    let releaseConnection!: () => void;
    const originalConnect = bleService.connect.bind(bleService);
    const connectSpy = spyOn(bleService, 'connect')
      .and.callFake(async (deviceId: string) => {
        await new Promise<void>((resolve) => {
          releaseConnection = resolve;
        });
        await originalConnect(deviceId);
      });
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));

    const firstTap = component.selectAndConnectDevice(component.devices[0]);
    const secondTap = component.selectAndConnectDevice(component.devices[0]);

    expect(component.connecting).toBeTrue();
    await settlePromises();
    expect(connectSpy).toHaveBeenCalledTimes(1);

    releaseConnection();
    await firstTap;
    await secondTap;

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('should ignore a late connection failure after the page is destroyed',
    async () => {
      spyOn<any>(component, 'delay').and.resolveTo();
      let rejectConnection!: (error: unknown) => void;
      spyOn(bleService, 'connect').and.returnValue(
        new Promise<void>((_resolve, reject) => {
          rejectConnection = reject;
        }),
      );
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));
      component.selectDevice(component.devices[0]);

      const connection = component.connectSelectedDevice();
      await Promise.resolve();
      fixture.destroy();
      rejectConnection(
        new BleOperationError(
          'connection-timeout',
          'BLE connection timed out.',
        ),
      );
      await connection;

      expect(component.connectionError).toBeNull();
      expect(component.connectionRetryDeviceId).toBeNull();
      expect(routerNavigate).not.toHaveBeenCalled();
    },
  );

  it('should allow a new device tap after exhausted automatic retries',
    async () => {
      spyOn(console, 'warn');
      spyOn<any>(component, 'delay').and.resolveTo();
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));
      bleService.servicesResult = createIdentificationServices();
      bleService.readResult = createVersionWord(0, 1);
      const originalConnect = bleService.connect.bind(bleService);
      let attempt = 0;
      const connectSpy = spyOn(bleService, 'connect').and.callFake(
        async (deviceId: string) => {
          attempt += 1;
          if (attempt <= 3) {
            throw new BleOperationError(
              'connection-timeout',
              'BLE connection timed out.',
            );
          }
          await originalConnect(deviceId);
        },
      );

      await component.selectAndConnectDevice(component.devices[0]);
      await component.selectAndConnectDevice(component.devices[0]);

      expect(connectSpy).toHaveBeenCalledTimes(4);
      expect(routerNavigate).toHaveBeenCalledOnceWith(
        ['/product/moventiv-60'],
        jasmine.any(Object),
      );
    },
  );

  it('should automatically retry and connect after one failed attempt',
    async () => {
      spyOn<any>(component, 'delay').and.resolveTo();
      const originalConnect = bleService.connect.bind(bleService);
      let attempt = 0;
      const connectSpy = spyOn(bleService, 'connect')
        .and.callFake(async (deviceId: string) => {
          attempt += 1;
          if (attempt === 1) {
            throw new BleOperationError(
              'connection-failed',
              'BLE connection failed.',
            );
          }
          await originalConnect(deviceId);
        });
      bleService.servicesResult = createIdentificationServices();
      bleService.readResult = createVersionWord(0, 1);
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));
      component.selectDevice(component.devices[0]);
      await component.connectSelectedDevice();
      fixture.detectChanges();

      expect(connectSpy).toHaveBeenCalledTimes(2);
      expect(connectSpy.calls.allArgs()).toEqual([
        ['device-1'],
        ['device-1'],
      ]);
      expect(component.connectedDeviceId).toBe('device-1');
      expect(component.connectionError).toBeNull();
      expect(component.connectionRetryDeviceId).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('Connecter');
    },
  );

  it('should not offer connection retry for permission or Bluetooth errors',
    async () => {
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));
      component.selectDevice(component.devices[0]);
      spyOn(bleService, 'connect').and.rejectWith(
        new BleOperationError(
          'permission-denied',
          'BLE permission denied.',
        ),
      );

      await component.connectSelectedDevice();

      expect(component.connectionRetryDeviceId).toBeNull();
      expect(component.canRetryConnection).toBeFalse();
    },
  );

  it('should leave the connected state after a remote disconnection', async () => {
    bleService.servicesResult = createIdentificationServices();
    bleService.readResult = createVersionWord(0, 1);
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    component.selectDevice(component.devices[0]);
    await component.connectSelectedDevice();

    bleService.emitRemoteDisconnection('device-1');
    fixture.detectChanges();

    expect(component.connectedDeviceId).toBeNull();
    expect(component.connecting).toBeFalse();
    expect(component.connectionError).toBe(
      'Connexion perdue avec l’appareil.',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Connexion perdue avec l’appareil',
    );

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('ion-button'),
    ) as HTMLIonButtonElement[];

    const scanButton = buttons.find((button) =>
      button.textContent?.includes('Rechercher'),
    );

    expect(scanButton).toBeDefined();
    expect(scanButton?.disabled).toBeFalse();
    expect(fixture.nativeElement.textContent).not.toContain('Connecter');
  });

  it('should discover services after connecting without rendering them', async () => {
    bleService.servicesResult = createIdentificationServices();
    bleService.readResult = createVersionWord(0, 1);
    const discoverSpy = spyOn(bleService, 'discoverServices').and.callThrough();
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    component.selectDevice(component.devices[0]);

    await component.connectSelectedDevice();
    fixture.detectChanges();

    expect(discoverSpy).toHaveBeenCalledOnceWith('device-1');
    expect(component.services).toEqual(createIdentificationServices());
    expect(fixture.nativeElement.textContent).not.toContain('service-uuid');
    expect(fixture.nativeElement.textContent).not.toContain(
      'characteristic-uuid',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Notification');
  });

  it('should display the service discovery state', fakeAsync(() => {
    let resolveServices!: (services: DiscoveredBleService[]) => void;
    const pendingServices = new Promise<DiscoveredBleService[]>((resolve) => {
      resolveServices = resolve;
    });
    spyOn(bleService, 'discoverServices').and.returnValue(pendingServices);
    void component.startScan();
    flushMicrotasks();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    component.selectDevice(component.devices[0]);

    void component.connectSelectedDevice();
    flushMicrotasks();
    tick(400);
    flushMicrotasks();
    tick(500);
    flushMicrotasks();
    fixture.detectChanges();

    expect(component.discoveringServices).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain(
      'Connexion en cours...',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Découverte des services',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Services BLE',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Informations techniques',
    );

    resolveServices([]);
    flushMicrotasks();
  }));

  it('should disconnect and recover when service discovery fails', async () => {
    spyOn(console, 'warn');
    const discoverSpy = spyOn(bleService, 'discoverServices').and.rejectWith(
      new Error('Découverte indisponible'),
    );
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    component.selectDevice(component.devices[0]);

    await component.connectSelectedDevice();
    fixture.detectChanges();

    expect(component.connectedDeviceId).toBeNull();
    expect(bleService.connectedDeviceId).toBeNull();
    expect(component.selectedDeviceId).toBeNull();
    expect(component.discoveryError).toBeNull();
    expect(component.canStartScan).toBeTrue();
    expect(discoverSpy).toHaveBeenCalledTimes(1);
    expect(bleService.disconnect).toHaveBeenCalledTimes(1);
    expect(component.devices).toHaveSize(1);
    expect(toastOptions).toContain(jasmine.objectContaining({
      message: 'Découverte des services Bluetooth impossible.',
      duration: 3_000,
      position: 'bottom',
    }));
    expect(alertOptions).toHaveSize(0);
    expect(fixture.nativeElement.textContent).not.toContain(
      'Découverte indisponible',
    );
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('should never render stored connection pipeline diagnostics', () => {
    component.connectionError = 'Error: native connect failure';
    component.discoveryError = 'GATT service UUID unavailable';
    component.identificationError = 'Native identification exception';

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('native connect failure');
    expect(text).not.toContain('GATT');
    expect(text).not.toContain('UUID');
    expect(text).not.toContain('Native identification exception');
    expect(fixture.nativeElement.querySelector('.connection-panel')).toBeNull();
  });

  it('should keep native state honest and retry cleanup before a future scan',
    async () => {
      spyOn(console, 'warn');
      spyOn(bleService, 'discoverServices').and.rejectWith(
        new Error('Découverte indisponible'),
      );
      bleService.disconnectResult = Promise.reject(
        new Error('Déconnexion refusée'),
      );
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));
      component.selectDevice(component.devices[0]);
      await component.connectSelectedDevice();

      expect(component.connectedDeviceId).toBeNull();
      expect(bleService.connectedDeviceId).toBe('device-1');
      expect(component.errorMessage).toBeNull();
      expect(component.canStartScan).toBeTrue();
      expect(component.devices).toHaveSize(1);

      bleService.disconnectResult = null;
      await component.startScan();

      expect(bleService.disconnect).toHaveBeenCalledTimes(2);
      expect(bleService.connectedDeviceId).toBeNull();
      expect(component.scanning).toBeTrue();
    },
  );

  it('should clear discovered services after a remote disconnection', async () => {
    bleService.servicesResult = createIdentificationServices();
    bleService.readResult = createVersionWord(0, 1);
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    component.selectDevice(component.devices[0]);
    await component.connectSelectedDevice();
    expect(component.services.length).toBeGreaterThan(0);

    bleService.emitRemoteDisconnection('device-1');

    expect(component.services).toEqual([]);
    expect(component.discoveringServices).toBeFalse();
  });

  it('should read identification after service discovery without rendering raw details', async () => {
    bleService.servicesResult = createIdentificationServices();
    bleService.readResult = createVersionWord(2, 4);
    const readSpy = spyOn(
      bleService,
      'readCharacteristic',
    ).and.callThrough();
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Garline'));
    component.selectDevice(component.devices[0]);

    await component.connectSelectedDevice();
    fixture.detectChanges();

    expect(readSpy).toHaveBeenCalledOnceWith(
      BLE_UUIDS.shdoService,
      BLE_UUIDS.versionCharacteristic,
      'device-1',
    );
    expect(component.identification?.rawHex).toContain('02 04');
    expect(component.identification?.detectedType).toBe('Garline');
    expect(component.productProfile).toBe('garline');
    expect(fixture.nativeElement.textContent).not.toContain('02 04');
    expect(fixture.nativeElement.textContent).not.toContain(
      'Identification du produit',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Mot de version brut',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Service Moventiv/Garline + octet produit 2',
    );
  });

  it('should keep the Widoor detection reason internal for an old product name', async () => {
    spyOn<any>(component, 'delay').and.resolveTo();
    bleService.servicesResult = createWidoorIdentificationServices();
    bleService.readResult = createVersionWord(1, 0);
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Firma#CHA'));
    component.selectDevice(component.devices[0]);

    await component.connectSelectedDevice();
    fixture.detectChanges();

    expect(component.identification?.detectedType).toBe('Widoor');
    expect(component.identification?.productByte).toBe(1);
    expect(component.identification?.detectionReason).toBe(
      'Service secondaire Widoor détecté',
    );
    expect(component.identification?.detectionConfidence).toBe('Forte');
    expect(component.productProfile).toBe('widoor');
    expect(fixture.nativeElement.textContent).not.toContain(
      'Service secondaire Widoor détecté',
    );
  });

  it('should use the Phase 1 Widoor name fallback when version read fails',
    async () => {
      spyOn<any>(component, 'delay').and.resolveTo();
      bleService.servicesResult = createWidoorIdentificationServices();
      spyOn(bleService, 'readCharacteristic').and.rejectWith(
        new Error('Version read refused'),
      );
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'WI-001#CHA'));
      component.selectDevice(component.devices[0]);

      await component.connectSelectedDevice();

      expect(component.identification?.detectedType).toBe('Widoor');
      expect(component.identification?.detectionConfidence).toBe('Forte');
      expect(component.identification?.detectionReason).toBe(
        'Nom Bluetooth WI + service secondaire Widoor après échec de lecture du mot de version',
      );
      expect(component.productProfile).toBe('widoor');
      expect(routerNavigate).toHaveBeenCalledOnceWith(
        ['/product/widoor'],
        jasmine.any(Object),
      );
    },
  );

  it('should use the Phase 1 Widoor name fallback when version characteristic is absent',
    async () => {
      spyOn<any>(component, 'delay').and.resolveTo();
      bleService.servicesResult = [
        {
          uuid: BLE_UUIDS.shdoService,
          characteristics: [
            {
              uuid: BLE_UUIDS.motorStateCharacteristic,
              descriptors: [],
              properties: {
                authenticatedSignedWrites: false,
                broadcast: false,
                indicate: false,
                notify: true,
                read: true,
                write: false,
                writeWithoutResponse: false,
              },
            },
          ],
        },
        {
          uuid: BLE_UUIDS.widoorService,
          characteristics: [],
        },
      ];
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'WI-002'));
      component.selectDevice(component.devices[0]);

      await component.connectSelectedDevice();

      expect(component.identification?.detectedType).toBe('Widoor');
      expect(component.identificationError).toBeNull();
      expect(component.productProfile).toBe('widoor');
      expect(routerNavigate).toHaveBeenCalledOnceWith(
        ['/product/widoor'],
        jasmine.any(Object),
      );
    },
  );

  it('should not turn a WI-named Moventiv/Garline service into Widoor when version read fails',
    async () => {
      spyOn(console, 'warn');
      spyOn<any>(component, 'delay').and.resolveTo();
      bleService.servicesResult = createIdentificationServices();
      spyOn(bleService, 'readCharacteristic').and.rejectWith(
        new Error('Version read refused'),
      );
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'WI-FAUX'));
      component.selectDevice(component.devices[0]);

      await component.connectSelectedDevice();

      expect(component.productProfile).toBe('unknown');
      expect(component.identification).toBeNull();
      expect(component.identificationError).toBeNull();
      expect(component.connectedDeviceId).toBeNull();
      expect(bleService.connectedDeviceId).toBeNull();
      expect(bleService.disconnect).toHaveBeenCalledTimes(1);
      expect(component.canStartScan).toBeTrue();
      expect(toastOptions).toContain(jasmine.objectContaining({
        message: 'Produit non reconnu.',
      }));
      expect(routerNavigate).not.toHaveBeenCalled();
    },
  );

  it('should hide the motor test without a known connected profile', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.motor-test-panel')).toBeNull();

    configureMotorTest('unknown');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.motor-test-panel')).toBeNull();

    configureMotorTest('ambiguous');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.motor-test-panel')).toBeNull();
  });

  it('should hide the motor test while scan, discovery or identification is active',
    () => {
      configureMotorTest('widoor');

      component.scanning = true;
      expect(component.showMotorTestPanel).toBeFalse();
      component.scanning = false;
      component.discoveringServices = true;
      expect(component.showMotorTestPanel).toBeFalse();
      component.discoveringServices = false;
      component.readingIdentification = true;
      expect(component.showMotorTestPanel).toBeFalse();
      component.readingIdentification = false;
      component.identification = null;
      expect(component.showMotorTestPanel).toBeFalse();
    },
  );

  it('should require the native connection to match the page connection', () => {
    configureMotorTest('widoor');
    bleService.setConnectedDeviceId('device-2');

    expect(component.showMotorTestPanel).toBeFalse();
    expect(component.motorCommandAvailability.enabled).toBeFalse();
  });

  ['widoor', 'moventiv-60', 'moventiv-80', 'garline'].forEach((profile) => {
    it(`should keep the motor test internal for ${profile}`, () => {
      configureMotorTest(
        profile as 'widoor' | 'moventiv-60' | 'moventiv-80' | 'garline',
      );
      fixture.detectChanges();

      expect(component.showMotorTestPanel).toBeTrue();
      expect(fixture.nativeElement.querySelector('.motor-test-panel'))
        .toBeNull();
    });
  });

  it('should centralize the OPEN availability conditions', () => {
    configureMotorTest('garline');
    component.motorState = null;
    expect(component.motorCommandAvailability.reason).toBe(
      component.motorTestText.waitingFirstState,
    );

    component.motorState = motorState(null, 500);
    expect(component.motorCommandAvailability.reason).toBe(
      component.motorTestText.invalidPosition,
    );

    component.motorState = motorState(100, 0);
    expect(component.motorCommandAvailability.reason).toBe(
      component.motorTestText.invalidPosition,
    );

    component.motorState = motorState(500, 500);
    expect(component.motorCommandAvailability.reason).toBe(
      component.motorTestText.alreadyOpen,
    );

    component.motorState = motorState(100, 500);
    expect(component.motorCommandAvailability.enabled).toBeTrue();
  });

  it('should reject an invalid numeric motor position', () => {
    configureMotorTest('garline');
    component.motorState = motorState(Number.NaN, 500);

    expect(component.motorCommandAvailability.enabled).toBeFalse();
    expect(component.motorCommandAvailability.reason).toBe(
      component.motorTestText.invalidPosition,
    );
  });

  it('should only accept motor state from the current expected BLE target', () => {
    configureMotorTest('garline');
    component.motorStateSource = {
      deviceId: 'device-2',
      serviceUuid: BLE_UUIDS.shdoService,
      characteristicUuid: BLE_UUIDS.motorStateCharacteristic,
    };
    expect(component.motorCommandAvailability.enabled).toBeFalse();

    component.motorStateSource = {
      deviceId: 'device-1',
      serviceUuid: 'different-service',
      characteristicUuid: BLE_UUIDS.motorStateCharacteristic,
    };
    expect(component.motorCommandAvailability.enabled).toBeFalse();

    component.motorStateSource = {
      deviceId: 'device-1',
      serviceUuid: BLE_UUIDS.shdoService,
      characteristicUuid: 'different-characteristic',
    };
    expect(component.motorCommandAvailability.enabled).toBeFalse();

    component.motorStateSource = {
      deviceId: 'device-1',
      serviceUuid: BLE_UUIDS.shdoService.toUpperCase(),
      characteristicUuid: BLE_UUIDS.motorStateCharacteristic.toUpperCase(),
    };
    expect(component.motorCommandAvailability.enabled).toBeTrue();
  });

  it('should open one confirmation alert without sending automatically',
    async () => {
      configureMotorTest('widoor');

      await component.requestOpenMotorTest();

      expect(alertCreate).toHaveBeenCalledTimes(1);
      expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();
      expect(alertOptions[0].message).toContain('Moteur banc');
      expect(alertOptions[0].message).toContain(
        component.motorTestText.widoorNoPosition,
      );
      expect(alertOptions[0].message).not.toContain('Position actuelle');
      expect(alertOptions[0].message).not.toContain('Position maximale');
    },
  );

  it('should not send when the confirmation is cancelled', async () => {
    configureMotorTest('widoor');
    await component.requestOpenMotorTest();

    expect(alertOptions[0].buttons[0].role).toBe('cancel');
    expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();
  });

  it('should send exactly one OPEN with the captured safety data', async () => {
    configureMotorTest('garline');
    await component.requestOpenMotorTest();

    alertOptions[0].buttons[1].handler?.();
    await settlePromises();

    expect(sendMotorCommandWithConfirmation).toHaveBeenCalledOnceWith({
      profile: 'garline',
      command: 'OPEN',
      baselinePosition: 100,
      baselineMaximumPosition: 500,
      deviceId: 'device-1',
    });
  });

  it('should use the latest valid motor state when the alert is confirmed',
    async () => {
      configureMotorTest('garline');
      await component.requestOpenMotorTest();
      component.motorState = motorState(150, 600);

      alertOptions[0].buttons[1].handler?.();
      await settlePromises();

    expect(sendMotorCommandWithConfirmation).toHaveBeenCalledOnceWith({
      profile: 'garline',
      command: 'OPEN',
      baselinePosition: 150,
      baselineMaximumPosition: 600,
      deviceId: 'device-1',
    });
    },
  );

  it('should not send if the latest state reaches maximum in the alert',
    async () => {
      configureMotorTest('garline');
      await component.requestOpenMotorTest();
      component.motorState = motorState(500, 500);

      alertOptions[0].buttons[1].handler?.();
      await settlePromises();

      expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();
    },
  );

  it('should enable Widoor OPEN without an initial notification', () => {
    configureMotorTest('widoor');
    component.motorState = null;
    component.motorStateSource = null;

    expect(component.motorCommandAvailability.enabled).toBeTrue();
  });

  it('should enable Widoor OPEN with observed zero positions', () => {
    configureMotorTest('widoor');
    component.motorState = motorState(0, 0, 0x20);

    expect(component.motorCommandAvailability.enabled).toBeTrue();
  });

  it('should send Widoor OPEN without a position baseline', async () => {
    configureMotorTest('widoor');
    component.motorState = null;
    component.motorStateSource = null;

    await component.requestOpenMotorTest();
    alertOptions[0].buttons[1].handler?.();
    await settlePromises();

    expect(sendMotorCommandWithConfirmation).toHaveBeenCalledOnceWith({
      profile: 'widoor',
      command: 'OPEN',
      deviceId: 'device-1',
    });
  });

  it('should prevent two alerts and two command validations', async () => {
    configureMotorTest('widoor');
    let resolveAlert!: () => void;
    alertCreate.and.callFake(async (options: TestAlertOptions) => {
      alertOptions.push(options);
      return {
        present: async () => undefined,
        onDidDismiss: () => new Promise<{ role: string }>(
          (resolve) => resolveAlert = () => resolve({ role: 'confirm' }),
        ),
      };
    });
    const firstAlert = component.requestOpenMotorTest();
    await Promise.resolve();
    await component.requestOpenMotorTest();
    expect(alertCreate).toHaveBeenCalledTimes(1);

    let resolveCommand!: () => void;
    sendMotorCommandWithConfirmation.and.returnValue(new Promise(
      (resolve) => resolveCommand = () =>
        resolve(motorCommandResult('timeout')),
    ));
    alertOptions[0].buttons[1].handler?.();
    alertOptions[0].buttons[1].handler?.();
    await Promise.resolve();
    expect(sendMotorCommandWithConfirmation).toHaveBeenCalledTimes(1);

    resolveCommand();
    resolveAlert();
    await firstAlert;
  });

  [
    { status: 'confirmed', expected: 'Début d’ouverture confirmé' },
    {
      status: 'timeout',
      expected: 'aucun état de début d’ouverture compatible',
    },
    {
      status: 'disconnected',
      expected: 'Connexion perdue pendant la commande',
    },
  ].forEach(({ status, expected }) => {
    it(`should keep the ${status} motor result internal`, async () => {
      configureMotorTest('widoor');
      sendMotorCommandWithConfirmation.and.resolveTo(
        motorCommandResult(
          status as 'confirmed' | 'timeout' | 'disconnected',
        ),
      );
      await confirmOpen();
      fixture.detectChanges();

      expect(component.motorTestStatus).toBe(status);
      expect(component.motorTestResult?.status).toBe(
        status as 'confirmed' | 'timeout' | 'disconnected',
      );
      expect(fixture.nativeElement.textContent).not.toContain(expected);
      expect(fixture.nativeElement.querySelector('ion-spinner')).toBeNull();
    });
  });

  it('should keep the raw Widoor confirmation state internal',
    async () => {
      configureMotorTest('widoor');
      sendMotorCommandWithConfirmation.and.resolveTo(
        motorCommandResult('confirmed'),
      );

      await confirmOpen();
      fixture.detectChanges();

      expect(component.motorTestResult?.notification?.state).toBe(0x21);
      expect(fixture.nativeElement.textContent).not.toContain('0x21');
      expect(fixture.nativeElement.textContent).not.toContain('(33)');
      expect(fixture.nativeElement.textContent).not.toContain(
        component.motorTestText.newPosition,
      );
    },
  );

  it('should preserve the native failure reason and release local state',
    async () => {
      configureMotorTest('widoor');
      sendMotorCommandWithConfirmation.and.resolveTo({
        ...motorCommandResult('failed'),
        failureReason: 'Native GATT write failed',
      });

      await confirmOpen();
      fixture.detectChanges();

      expect(component.motorTestStatus).toBe('failed');
      expect(component.motorTestFailureReason).toBe(
        'Native GATT write failed',
      );
      expect(fixture.nativeElement.textContent).not.toContain(
        'Native GATT write failed',
      );
      expect(component.motorCommandAvailability.enabled).toBeTrue();
    },
  );

  it('should cancel the send if the connected device changed', async () => {
    configureMotorTest('widoor');
    await component.requestOpenMotorTest();
    component.connectedDeviceId = 'device-2';

    alertOptions[0].buttons[1].handler?.();
    await settlePromises();

    expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();
    expect(component.motorTestFailureReason).toBe(
      component.motorTestText.deviceChanged,
    );
  });

  it('should not send after disconnection or profile loss in the alert',
    async () => {
      configureMotorTest('widoor');
      await component.requestOpenMotorTest();
      bleService.emitRemoteDisconnection('device-1');
      alertOptions[0].buttons[1].handler?.();
      await settlePromises();
      expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();

      configureMotorTest('widoor');
      await component.requestOpenMotorTest();
      component.productProfile = 'unknown';
      alertOptions[1].buttons[1].handler?.();
      await settlePromises();
      expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();
    },
  );

  it('should release the alert lock after an external dismissal', async () => {
    configureMotorTest('widoor');

    await component.requestOpenMotorTest();
    await component.requestOpenMotorTest();

    expect(alertCreate).toHaveBeenCalledTimes(2);
    expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();
  });

  it('should hide and stop the test UI on disconnection during a command',
    async () => {
      configureMotorTest('widoor');
      let resolveCommand!: () => void;
      sendMotorCommandWithConfirmation.and.returnValue(new Promise(
        (resolve) => resolveCommand = () =>
          resolve(motorCommandResult('disconnected')),
      ));
      await component.requestOpenMotorTest();
      alertOptions[0].buttons[1].handler?.();
      await Promise.resolve();

      bleService.emitRemoteDisconnection('device-1');
      fixture.detectChanges();

      expect(component.motorTestStatus).toBe('disconnected');
      expect(component.showMotorTestPanel).toBeFalse();
      expect(fixture.nativeElement.querySelector('.motor-test-panel')).toBeNull();

      resolveCommand();
      await settlePromises();
    },
  );

  it('should ignore an old command result after a new connection', async () => {
    configureMotorTest('widoor');
    let resolveCommand!: () => void;
    sendMotorCommandWithConfirmation.and.returnValue(new Promise(
      (resolve) => resolveCommand = () =>
        resolve(motorCommandResult('confirmed')),
    ));
    await component.requestOpenMotorTest();
    alertOptions[0].buttons[1].handler?.();
    await Promise.resolve();

    bleService.emitRemoteDisconnection('device-1');
    bleService.servicesResult = createIdentificationServices();
    bleService.readResult = createVersionWord(0, 1);
    await component.connectSelectedDevice();

    resolveCommand();
    await settlePromises();

    expect(component.motorTestStatus).toBe('idle');
    expect(component.motorTestResult).toBeNull();
  });

  it('should reject and recover from contradictory detection clues', async () => {
    spyOn(console, 'warn');
    bleService.servicesResult = createContradictoryIdentificationServices();
    bleService.readResult = createVersionWord(1, 0);
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Produit'));
    component.selectDevice(component.devices[0]);

    await component.connectSelectedDevice();

    expect(component.identification).toBeNull();
    expect(component.productProfile).toBe('unknown');
    expect(component.connectedDeviceId).toBeNull();
    expect(bleService.connectedDeviceId).toBeNull();
    expect(bleService.disconnect).toHaveBeenCalledTimes(1);
    expect(toastOptions).toContain(jasmine.objectContaining({
      message: 'Produit non reconnu.',
      duration: 2_000,
    }));
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('should keep a simple connection state while reading identification',
    fakeAsync(() => {
    bleService.servicesResult = createIdentificationServices();
    let resolveRead!: (value: DataView) => void;
    const pendingRead = new Promise<DataView>((resolve) => {
      resolveRead = resolve;
    });
    spyOn(bleService, 'readCharacteristic').and.returnValue(pendingRead);
    void component.startScan();
    flushMicrotasks();
    bleService.emit(createScanResult('device-1', -42, 'Produit'));
    component.selectDevice(component.devices[0]);

    void component.connectSelectedDevice();
    flushMicrotasks();
    tick(400);
    flushMicrotasks();
    tick(500);
    flushMicrotasks();
    fixture.detectChanges();

    expect(component.readingIdentification).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain(
      'Connexion en cours...',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Lecture de l’identification',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Identification du produit',
    );

    resolveRead(createVersionWord(0, 1));
    flushMicrotasks();
  }));

  it('should disconnect and recover when identification reading fails', async () => {
    spyOn(console, 'warn');
    bleService.servicesResult = createIdentificationServices();
    spyOn(bleService, 'readCharacteristic').and.rejectWith(
      new Error('Lecture refusée'),
    );
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Produit'));
    component.selectDevice(component.devices[0]);

    await component.connectSelectedDevice();
    fixture.detectChanges();

    expect(component.connectedDeviceId).toBeNull();
    expect(bleService.connectedDeviceId).toBeNull();
    expect(component.identificationError).toBeNull();
    expect(component.canStartScan).toBeTrue();
    expect(component.devices).toHaveSize(1);
    expect(bleService.disconnect).toHaveBeenCalledTimes(1);
    expect(toastOptions).toContain(jasmine.objectContaining({
      message: 'Produit non reconnu.',
      duration: 3_000,
    }));
    expect(fixture.nativeElement.textContent).not.toContain('Lecture refusée');
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('should clear identification after a remote disconnection', async () => {
    bleService.servicesResult = createIdentificationServices();
    bleService.readResult = createVersionWord(0, 1);
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Produit'));
    component.selectDevice(component.devices[0]);
    await component.connectSelectedDevice();
    expect(component.identification).not.toBeNull();
    expect(component.productProfile).toBe('moventiv-60');

    bleService.emitRemoteDisconnection('device-1');

    expect(component.identification).toBeNull();
    expect(component.secondaryProfile).toBe('Inconnu');
    expect(component.readingIdentification).toBeFalse();
    expect(component.productProfile).toBe('unknown');
  });

  it('should subscribe to motor state after identification', async () => {
    bleService.servicesResult = createIdentificationServices();
    bleService.readResult = createVersionWord(0, 1);
    const startNotificationsSpy = spyOn(
      bleService,
      'startNotifications',
    ).and.callThrough();
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Produit'));
    component.selectDevice(component.devices[0]);

    await component.connectSelectedDevice();

    expect(startNotificationsSpy).toHaveBeenCalledOnceWith(
      BLE_UUIDS.shdoService,
      BLE_UUIDS.motorStateCharacteristic,
      jasmine.any(Function),
      'device-1',
    );
  });

  it('should navigate without waiting for the motor notification setup',
    async () => {
      let releaseNotification!: () => void;
      const notificationStart = new Promise<void>((resolve) => {
        releaseNotification = resolve;
      });
      bleService.servicesResult = createIdentificationServices();
      bleService.readResult = createVersionWord(0, 1);
      spyOn(bleService, 'startNotifications')
        .and.returnValue(notificationStart);
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Produit'));
      component.selectDevice(component.devices[0]);

      await component.connectSelectedDevice();

      expect(routerNavigate).toHaveBeenCalledOnceWith(
        ['/product/moventiv-60'],
        jasmine.any(Object),
      );
      expect(component.subscribingMotorState).toBeTrue();

      releaseNotification();
      await notificationStart;
      await settlePromises();
      expect(component.motorStateNotificationsActive).toBeTrue();
    },
  );

  it('should keep motor state notifications internal and increment their count', async () => {
    bleService.servicesResult = createIdentificationServices();
    bleService.readResult = createVersionWord(0, 1);
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Produit'));
    component.selectDevice(component.devices[0]);
    await component.connectSelectedDevice();

    bleService.emitNotification(createMotorStateFrame());
    bleService.emitNotification(createMotorStateFrame());
    fixture.detectChanges();

    expect(component.motorNotificationCount).toBe(2);
    expect(component.motorState?.rawHex).toBe('03 01 02 03 04 05 1d');
    expect(component.motorState?.currentPosition).toBe(258);
    expect(component.motorState?.maximumPosition).toBe(772);
    expect(component.lastMotorStateReceivedAt).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('État moteur');
    expect(fixture.nativeElement.textContent).not.toContain(
      '03 01 02 03 04 05 1d',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Notifications reçues : 2',
    );
    expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();
  });

  it('should preserve identical zero-position notifications in diagnostics',
    async () => {
      bleService.servicesResult = createWidoorIdentificationServices();
      bleService.readResult = createVersionWord(1, 0);
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Firma#CHA'));
      component.selectDevice(component.devices[0]);
      await component.connectSelectedDevice();
      const observedFrame = createMotorStateFrame(
        [0x01, 0, 0, 0, 0, 0, 0x08],
      );

      bleService.emitNotification(observedFrame);
      bleService.emitNotification(observedFrame);

      expect(component.motorNotificationHistory.length).toBe(2);
      expect(component.motorNotificationHistory.map(({ sequence }) => sequence))
        .toEqual([1, 2]);
      expect(component.motorNotificationHistory[0].frame.rawHex)
        .toBe('01 00 00 00 00 00 08');
      expect(component.motorNotificationHistory[1].positionDelta).toBe(0);
      expect(component.motorCommandAvailability.enabled).toBeTrue();
      expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();
    },
  );

  it('should retain only the latest twenty diagnostics in sequence order',
    async () => {
      bleService.servicesResult = createIdentificationServices();
      bleService.readResult = createVersionWord(0, 1);
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Produit'));
      component.selectDevice(component.devices[0]);
      await component.connectSelectedDevice();

      for (let sequence = 1; sequence <= 21; sequence += 1) {
        bleService.emitNotification(createMotorStateFrame([
          1,
          0,
          sequence,
          0,
          100,
          0,
          0x08,
        ]));
      }

      expect(component.motorNotificationHistory.length).toBe(20);
      expect(component.motorNotificationHistory[0].sequence).toBe(2);
      expect(component.motorNotificationHistory[19].sequence).toBe(21);
      expect(component.motorNotificationHistory[19].positionDelta).toBe(1);
    },
  );

  it('should clear motor state after a remote disconnection', async () => {
    bleService.servicesResult = createIdentificationServices();
    bleService.readResult = createVersionWord(0, 1);
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Produit'));
    component.selectDevice(component.devices[0]);
    await component.connectSelectedDevice();
    bleService.emitNotification(createMotorStateFrame());
    expect(component.motorNotificationCount).toBe(1);

    bleService.emitRemoteDisconnection('device-1');

    expect(component.motorState).toBeNull();
    expect(component.motorNotificationCount).toBe(0);
    expect(component.motorNotificationHistory).toEqual([]);
    expect(component.lastMotorStateReceivedAt).toBeNull();
  });

  it('should stay connected when the motor subscription fails', async () => {
    bleService.servicesResult = createIdentificationServices();
    bleService.readResult = createVersionWord(0, 1);
    spyOn(bleService, 'startNotifications').and.rejectWith(
      new Error('Notifications refusées'),
    );
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Produit'));
    component.selectDevice(component.devices[0]);

    await component.connectSelectedDevice();
    fixture.detectChanges();

    expect(component.connectedDeviceId).toBe('device-1');
    expect(component.motorNotificationError).toContain(
      'Notifications refusées',
    );
    expect(routerNavigate).toHaveBeenCalledWith(
      ['/product/moventiv-60'],
      jasmine.any(Object),
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Notifications refusées',
    );
  });

  it('should never load product data automatically', async () => {
    await configureProductReadPanel('widoor');
    expect(productDataLoadService.loadProductData).not.toHaveBeenCalled();
  });

  it('should show product reads only for known profiles', async () => {
    await configureProductReadPanel('widoor');
    for (const profile of [
      'widoor', 'moventiv-60', 'moventiv-80', 'garline',
    ] as const) {
      component.productProfile = profile;
      expect(component.showProductReadPanel).withContext(profile).toBeTrue();
    }
    component.productProfile = 'unknown';
    expect(component.showProductReadPanel).toBeFalse();
    component.productProfile = 'ambiguous';
    expect(component.showProductReadPanel).toBeFalse();
  });

  it('should keep cached historical GATT properties internal', async () => {
    const readSpy = spyOn(bleService, 'readCharacteristic').and.callThrough();
    const startSpy = spyOn(bleService, 'startNotifications').and.callThrough();
    const stopSpy = spyOn(bleService, 'stopNotifications').and.callThrough();
    await configureProductReadPanel('widoor');
    addHistoricalCharacteristic(bleService.servicesResult, {
      notify: true,
      read: true,
      write: false,
    }, ['descriptor-1', 'descriptor-2']);
    const readCalls = readSpy.calls.count();
    const startCalls = startSpy.calls.count();
    const stopCalls = stopSpy.calls.count();
    const loadCalls = productDataLoadService.loadProductData.calls.count();

    fixture.detectChanges();

    expect(component.showHistoricalGattDiagnostic).toBeTrue();
    expect(component.historicalGattDiagnostic.characteristicUuid)
      .toBe(BLE_UUIDS.completeParametersCharacteristic);
    expect(component.historicalGattDiagnostic.descriptorUuids.length).toBe(2);
    expect(fixture.nativeElement.querySelector(
      '.historical-gatt-diagnostic',
    )).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain(
      BLE_UUIDS.completeParametersCharacteristic,
    );
    expect(readSpy.calls.count()).toBe(readCalls);
    expect(startSpy.calls.count()).toBe(startCalls);
    expect(stopSpy.calls.count()).toBe(stopCalls);
    expect(productDataLoadService.loadProductData.calls.count()).toBe(loadCalls);
    expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();
  });

  it('should distinguish missing historical GATT service and characteristic',
    async () => {
      await configureProductReadPanel('widoor');
      bleService.servicesResult = [];
      expect(component.historicalGattDiagnostic).toEqual(
        jasmine.objectContaining({
          servicePresent: false,
          characteristicPresent: false,
        }),
      );

      bleService.servicesResult = createWidoorIdentificationServices();
      expect(component.historicalGattDiagnostic).toEqual(
        jasmine.objectContaining({
          servicePresent: true,
          characteristicPresent: false,
        }),
      );
    },
  );

  it('should preserve every cached historical GATT capability', async () => {
    await configureProductReadPanel('widoor');
    for (const properties of [
      { read: true },
      { notify: true },
      { read: true, notify: true },
      { write: true },
      { writeWithoutResponse: true },
      { indicate: true },
    ]) {
      bleService.servicesResult = createWidoorIdentificationServices();
      addHistoricalCharacteristic(bleService.servicesResult, properties);
      const diagnostic = component.historicalGattDiagnostic;

      for (const [name, enabled] of Object.entries(properties)) {
        expect(diagnostic.rawProperties[name])
          .withContext(name)
          .toBe(enabled);
      }
    }
  });

  it('should report unknown capabilities when properties are unavailable',
    async () => {
      await configureProductReadPanel('widoor');
      addHistoricalCharacteristic(bleService.servicesResult, {});
      const diagnostic = component.historicalGattDiagnostic;

      expect(diagnostic.propertiesAvailable).toBeFalse();
      expect(component.formatGattCapability(diagnostic.read))
        .toBe(component.productReadText.unknown);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector(
        '.historical-gatt-diagnostic',
      )).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain(
        component.productReadText.unknown,
      );
    },
  );

  it('should hide the historical GATT diagnostic after disconnection or reuse',
    async () => {
      await configureProductReadPanel('widoor');
      expect(component.showHistoricalGattDiagnostic).toBeTrue();

      bleService.emitRemoteDisconnection('device-1');
      expect(component.showHistoricalGattDiagnostic).toBeFalse();

      component.connectedDeviceId = 'device-1';
      bleService.setConnectedDeviceId('device-1');
      component.productProfile = 'widoor';
      expect(component.showHistoricalGattDiagnostic).toBeFalse();
    },
  );

  it('should expose the historical GATT diagnostic internally only for known Widoor',
    async () => {
      for (const profile of [
        'moventiv-60',
        'moventiv-80',
        'garline',
        'unknown',
        'ambiguous',
      ] as const) {
        await configureProductReadPanel('widoor');
        component.productProfile = profile;
        expect(component.showHistoricalGattDiagnostic)
          .withContext(profile)
          .toBeFalse();
      }

      await configureProductReadPanel('widoor');
      expect(component.showHistoricalGattDiagnostic).toBeTrue();
    },
  );

  it('should hide product reads during scan, discovery or detection',
    async () => {
      await configureProductReadPanel('widoor');
      component.scanning = true;
      expect(component.showProductReadPanel).toBeFalse();
      component.scanning = false;
      component.discoveringServices = true;
      expect(component.showProductReadPanel).toBeFalse();
      component.discoveringServices = false;
      component.readingIdentification = true;
      expect(component.showProductReadPanel).toBeFalse();
    },
  );

  it('should manually request all default reads with profile and device',
    async () => {
      await configureProductReadPanel('garline');
      await component.loadProductInformation();
      expect(productDataLoadService.loadProductData)
        .toHaveBeenCalledOnceWith('garline', 'device-1');
      expect(component.productReadStatus).toBe('success');
      expect(component.isProductReadLoading).toBeFalse();
    },
  );

  it('should navigate known products with the detected connection context',
    async () => {
      for (const [profile, route] of [
        ['widoor', '/product/widoor'],
        ['moventiv-60', '/product/moventiv-60'],
        ['moventiv-80', '/product/moventiv-80'],
        ['garline', '/product/garline'],
      ] as const) {
        await configureProductReadPanel(profile);
        await component.openProductPage();

        expect(routerNavigate).toHaveBeenCalledWith(
          [route],
          {
            state: jasmine.objectContaining({
              profile,
              deviceId: 'device-1',
              connectionGeneration: bleService.connectionGeneration,
              identificationConfidence: 'strong',
            }),
          },
        );
      }
      expect(productDataLoadService.loadProductData).not.toHaveBeenCalled();
      expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();
    },
  );

  it('should refuse product navigation for an unknown or stale profile',
    async () => {
      await configureProductReadPanel('widoor');
      component.productProfile = 'unknown';
      await component.openProductPage();
      component.productProfile = 'ambiguous';
      await component.openProductPage();
      bleService.connectionGeneration += 1;
      component.productProfile = 'widoor';
      await component.openProductPage();

      expect(routerNavigate).not.toHaveBeenCalled();
    },
  );

  it('should reject a second click while a product load is active',
    async () => {
      await configureProductReadPanel('widoor');
      let resolveLoad!: (result: ProductDataLoadResult) => void;
      productDataLoadService.loadProductData.and.returnValue(
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
      );
      const firstLoad = component.loadProductInformation();
      await component.loadProductInformation();
      expect(productDataLoadService.loadProductData).toHaveBeenCalledTimes(1);
      resolveLoad(productLoadResult('success'));
      await firstLoad;
      expect(component.isProductReadLoading).toBeFalse();
    },
  );

  it('should cancel without disconnecting or sending a motor command',
    async () => {
      await configureProductReadPanel('widoor');
      productDataLoadService.loadProductData.and.returnValue(
        new Promise(() => undefined),
      );
      bleService.disconnect.calls.reset();
      void component.loadProductInformation();
      component.cancelProductInformationLoad();
      expect(productDataLoadService.cancelCurrentLoad)
        .toHaveBeenCalledTimes(1);
      expect(bleService.disconnect).not.toHaveBeenCalled();
      expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();
    },
  );

  it('should cancel and ignore a late result after disconnection', async () => {
    await configureProductReadPanel('widoor');
    let resolveLoad!: (result: ProductDataLoadResult) => void;
    productDataLoadService.loadProductData.and.returnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const load = component.loadProductInformation();
    productDataLoadService.isLoading = true;
    bleService.emitRemoteDisconnection('device-1');
    resolveLoad(productLoadResult('success'));
    await load;
    expect(productDataLoadService.cancelCurrentLoad).toHaveBeenCalled();
    expect(component.productReadResult).toBeNull();
    expect(component.productReadStatus).toBe('idle');
    expect(component.showProductReadPanel).toBeFalse();
  });

  it('should ignore a late result after a generation change', async () => {
    await configureProductReadPanel('widoor');
    let resolveLoad!: (result: ProductDataLoadResult) => void;
    productDataLoadService.loadProductData.and.returnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const load = component.loadProductInformation();
    bleService.connectionGeneration += 1;
    resolveLoad(productLoadResult('success'));
    await load;
    expect(component.productReadResult).toBeNull();
    expect(component.isProductReadLoading).toBeFalse();
    expect(component.productReadStatus).toBe('idle');
  });

  it('should ignore a late result after the detected profile changes',
    async () => {
      await configureProductReadPanel('widoor');
      let resolveLoad!: (result: ProductDataLoadResult) => void;
      productDataLoadService.loadProductData.and.returnValue(
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
      );
      const load = component.loadProductInformation();
      component.productProfile = 'garline';
      resolveLoad(productLoadResult('success'));
      await load;
      expect(component.productReadResult).toBeNull();
      expect(component.productReadStatus).toBe('idle');
    },
  );

  it('should preserve partial status and count individual results',
    async () => {
      await configureProductReadPanel('moventiv-60');
      productDataLoadService.loadProductData.and.resolveTo({
        ...productLoadResult('partial-success'),
        partialSuccess: true,
        results: {
          version: typedReadResult('version', 'success'),
          datesAndCycles: typedReadResult(
            'dates-and-cycles',
            'invalid-frame',
          ),
          maintenance: typedReadResult('maintenance', 'unavailable'),
          userParameters: typedReadResult('user-parameters', 'failed'),
        },
      });
      await component.loadProductInformation();
      expect(component.productReadSummary).toEqual({
        success: 1,
        invalid: 1,
        unavailable: 1,
        failed: 1,
      });
      expect(component.productReadStatus).toBe('partial-success');
    },
  );

  it('should disable product reads during a native write', async () => {
    await configureProductReadPanel('widoor');
    bleService.isWriting = true;
    expect(component.productReadAvailability.enabled).toBeFalse();
    expect(productDataLoadService.loadProductData).not.toHaveBeenCalled();
  });

  it('should preserve every terminal product load status', async () => {
    await configureProductReadPanel('widoor');
    for (const status of [
      'success',
      'partial-success',
      'failed',
      'disconnected',
      'stale',
      'cancelled',
    ] as const) {
      productDataLoadService.loadProductData.and.resolveTo(
        productLoadResult(status),
      );
      await component.loadProductInformation();
      expect(component.productReadStatus).withContext(status).toBe(status);
      expect(component.isProductReadLoading).withContext(status).toBeFalse();
    }
  });

  it('should display historical date sentinels without creating a date', () => {
    expect(component.formatHistoricalDate({
      rawYear: 0xff,
      rawMonth: 0xff,
      rawDay: 0xff,
      rawHour: null,
      year: null,
      month: null,
      day: null,
      hour: null,
      status: 'not-initialized',
      invalidReason: null,
      raw: [0xff, 0xff, 0xff],
    })).toBe(component.productReadText.notInitialized);
  });

  it('should format normalized historical dates like Phase 1', () => {
    expect(component.formatHistoricalDate({
      rawYear: 19,
      rawMonth: 7,
      rawDay: 27,
      rawHour: 0,
      year: 2019,
      month: 8,
      day: 27,
      hour: 0,
      status: 'present',
      invalidReason: null,
      raw: [19, 7, 27, 0],
    })).toBe('27/08/2019');
  });

  it('should display a zero historical date as not initialized', () => {
    const formatted = component.formatHistoricalDate({
      rawYear: 0,
      rawMonth: 0,
      rawDay: 0,
      rawHour: 0,
      year: null,
      month: null,
      day: null,
      hour: null,
      status: 'invalid',
      invalidReason: 'zero-date',
      raw: [0, 0, 0, 0],
    });

    expect(formatted).toBe(component.productReadText.notInitialized);
    expect(formatted).not.toBe('0/0/0');
  });

  it('should display a nonzero invalid date as a technical error', () => {
    expect(component.formatHistoricalDate({
      rawYear: 21,
      rawMonth: 1,
      rawDay: 29,
      rawHour: 0,
      year: null,
      month: null,
      day: null,
      hour: null,
      status: 'invalid',
      invalidReason: 'invalid-calendar-date',
      raw: [21, 1, 29, 0],
    })).toBe(component.productReadText.invalidDate);
  });

  it('should decode physical dates without rendering the diagnostic grid',
    async () => {
      await configureProductReadPanel('widoor');
      const decoded = decodeBleDatesAndCycles(new Uint8Array([
        0, 0, 0, 19, 7, 27, 0, 0, 0, 0, 0, 0, 0x67, 0xd4, 0, 0, 0,
      ]));
      const datesRead: BleTypedReadResult<BleDatesAndCycles> = {
        type: 'dates-and-cycles',
        profile: 'widoor',
        deviceId: 'device-1',
        serviceUuid: BLE_UUIDS.shdoService,
        characteristicUuid: BLE_UUIDS.datesAndCyclesCharacteristic,
        startedAt: 10,
        completedAt: 20,
        status: 'success',
        decoded,
        error: null,
      };
      productDataLoadService.loadProductData.and.resolveTo({
        ...productLoadResult('success'),
        results: { datesAndCycles: datesRead },
      });

      await component.loadProductInformation();
      fixture.detectChanges();
      const details = fixture.nativeElement.querySelector(
        '.product-read-details',
      ) as HTMLElement | null;

      expect(component.productReadResult?.results.datesAndCycles?.decoded)
        .toBe(decoded);
      expect(details).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('00 00 00');
      expect(fixture.nativeElement.textContent).not.toContain('27/08/2019');
      expect(fixture.nativeElement.textContent).not.toContain('26580');
      expect(fixture.nativeElement.textContent).not.toContain('[object Object]');
    },
  );

  it('should distinguish Widoor professional data for presentation', () => {
    expect(component.isWidoorAdvancedParameters({
      profile: 'widoor',
      weightRangeLower: 1,
      weightRangeUpper: 2,
      breakForceAtOpen: 3,
      nearOpenSpeed: 4,
      nearCloseSpeed: 5,
      nearOpenTorque: 6,
      nearCloseTorque: 7,
      nearOpenProportional: 8,
      nearCloseProportional: 9,
      nearOpenIntegral: 10,
      nearCloseIntegral: 11,
      peripheralByte1: 12,
      peripheralByte2: 13,
    })).toBeTrue();
  });

  function configureMotorTest(
    profile:
      | 'widoor'
      | 'moventiv-60'
      | 'moventiv-80'
      | 'garline'
      | 'unknown'
      | 'ambiguous',
  ): void {
    component.devices = [
      { deviceId: 'device-1', name: 'Moteur banc', rssi: -40 },
    ];
    component.selectedDeviceId = 'device-1';
    component.connectedDeviceId = 'device-1';
    bleService.setConnectedDeviceId('device-1');
    component.productProfile = profile;
    component.identification = {
      rawHex: '',
      length: 14,
      productByte: 0,
      subtypeByte: 0,
      detectedType: 'Widoor',
      ambiguous: false,
      detectionReason: '',
      detectionConfidence: 'Forte',
    };
    component.motorState = motorState(100, 500);
    component.motorStateSource = {
      deviceId: 'device-1',
      serviceUuid: BLE_UUIDS.shdoService,
      characteristicUuid: BLE_UUIDS.motorStateCharacteristic,
    };
    component.services = createIdentificationServices();
    component.motorStateNotificationsActive = true;
    component.discoveringServices = false;
    component.readingIdentification = false;
    component.scanning = false;
  }

  async function confirmOpen(): Promise<void> {
    await component.requestOpenMotorTest();
    alertOptions[0].buttons[1].handler?.();
    await settlePromises();
  }

  async function configureProductReadPanel(
    profile: 'widoor' | 'moventiv-60' | 'moventiv-80' | 'garline',
  ): Promise<void> {
    const delay = (component as unknown as {
      delay: (milliseconds: number) => Promise<void>;
    }).delay;
    if (!jasmine.isSpy(delay)) {
      spyOn<any>(component, 'delay').and.resolveTo();
    }
    bleService.servicesResult = profile === 'widoor'
      ? createWidoorIdentificationServices()
      : createIdentificationServices();
    bleService.readResult = createVersionWord(
      profile === 'widoor' ? 1 : 0,
      profile === 'moventiv-80' ? 2 : profile === 'garline' ? 3 : 1,
    );
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Produit'));
    component.selectDevice(component.devices[0]);
    await component.connectSelectedDevice();
    routerNavigate.calls.reset();
    component.productProfile = profile;
  }
});

function productLoadResult(
  status: ProductDataLoadStatus,
): ProductDataLoadResult {
  return {
    profile: 'widoor',
    deviceId: 'device-1',
    connectionGeneration: 1,
    startedAt: 10,
    completedAt: 20,
    status,
    executedOrder: [
      'version',
      'datesAndCycles',
      'maintenance',
      'userParameters',
      'advancedParameters',
    ],
    results: {},
    notRequested: [],
    unavailable: [],
    partialSuccess: status === 'partial-success',
    error: null,
  };
}

function typedReadResult(
  type: BleReadType,
  status: BleReadStatus,
): BleTypedReadResult<never> {
  return {
    type,
    profile: 'widoor',
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid: BLE_UUIDS.versionCharacteristic,
    startedAt: 10,
    completedAt: 20,
    status,
    decoded: null,
    error: status === 'failed'
      ? { code: 'native-read-failed', message: 'native failure' }
      : null,
  };
}

interface TestAlertOptions {
  readonly header?: string;
  readonly message: string;
  readonly cssClass?: string | readonly string[];
  readonly buttons: readonly {
    readonly text?: string;
    readonly role?: string;
    readonly cssClass?: string | readonly string[];
    readonly handler?: () => void | Promise<void>;
  }[];
}

function motorState(
  currentPosition: number | null,
  maximumPosition: number | null,
  state: number | null = null,
) {
  return {
    rawHex: '',
    length: 7,
    state,
    currentPosition,
    maximumPosition,
    error: null,
    switches: null,
  };
}

function motorCommandResult(
  status: 'confirmed' | 'timeout' | 'disconnected' | 'failed',
) {
  return {
    status,
    command: 'OPEN' as const,
    profile: 'widoor' as const,
    sentAt: 100,
    confirmedAt: status === 'confirmed' ? 150 : null,
    notification: status === 'confirmed'
      ? motorState(120, 500, 0x21)
      : null,
    failureReason: status === 'failed' ? 'Failed' : null,
  };
}

async function settlePromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function scanTimeoutOf(component: ScanPage): unknown {
  return (component as unknown as { scanTimeout: unknown }).scanTimeout;
}

function scanPreparationInProgressOf(component: ScanPage): boolean {
  return (component as unknown as {
    scanPreparationInProgress: boolean;
  }).scanPreparationInProgress;
}

function scanSearchButton(fixture: ComponentFixture<ScanPage>): HTMLElement {
  const element = fixture.nativeElement as HTMLElement;
  const button = element.querySelector<HTMLElement>(
    '.scan-search-button',
  );
  if (button === null) {
    throw new Error('Scan search button is not rendered.');
  }
  return button;
}

function createScanResult(
  deviceId: string,
  rssi: number,
  name?: string,
  localName?: string,
): ScanResult {
  return {
    device: { deviceId, name },
    rssi,
    localName,
  };
}

function createServices(): DiscoveredBleService[] {
  return [
    {
      uuid: 'service-uuid',
      characteristics: [
        {
          uuid: 'characteristic-uuid',
          descriptors: [],
          properties: {
            authenticatedSignedWrites: false,
            broadcast: false,
            indicate: false,
            notify: true,
            read: true,
            write: false,
            writeWithoutResponse: false,
          },
        },
      ],
    },
  ];
}

function createIdentificationServices(): DiscoveredBleService[] {
  return [
    {
      uuid: BLE_UUIDS.shdoService,
      characteristics: [
        {
          uuid: BLE_UUIDS.versionCharacteristic,
          descriptors: [],
          properties: {
            authenticatedSignedWrites: false,
            broadcast: false,
            indicate: false,
            notify: false,
            read: true,
            write: false,
            writeWithoutResponse: false,
          },
        },
        {
          uuid: BLE_UUIDS.motorStateCharacteristic,
          descriptors: [],
          properties: {
            authenticatedSignedWrites: false,
            broadcast: false,
            indicate: false,
            notify: true,
            read: true,
            write: false,
            writeWithoutResponse: false,
          },
        },
      ],
    },
    {
      uuid: BLE_UUIDS.moventivGarlineService,
      characteristics: [],
    },
  ];
}

function createWidoorIdentificationServices(): DiscoveredBleService[] {
  const services = createIdentificationServices();

  return [
    services[0],
    {
      uuid: BLE_UUIDS.widoorService,
      characteristics: [],
    },
  ];
}

function popoverDidPresent(popover: HTMLIonPopoverElement): Promise<void> {
  return new Promise((resolve) => {
    popover.addEventListener('ionPopoverDidPresent', () => resolve(), {
      once: true,
    });
  });
}

function addHistoricalCharacteristic(
  services: DiscoveredBleService[],
  properties: Partial<
    DiscoveredBleService['characteristics'][number]['properties']
  >,
  descriptorUuids: readonly string[] = [],
): void {
  const shdoService = services.find(({ uuid }) =>
    uuid.toLowerCase() === BLE_UUIDS.shdoService,
  );

  shdoService?.characteristics.push({
    uuid: BLE_UUIDS.completeParametersCharacteristic.toUpperCase(),
    descriptors: descriptorUuids.map((uuid) => ({ uuid })),
    properties: properties as DiscoveredBleService[
      'characteristics'
    ][number]['properties'],
  });
}

function createContradictoryIdentificationServices(): DiscoveredBleService[] {
  return [
    ...createIdentificationServices(),
    {
      uuid: BLE_UUIDS.widoorService,
      characteristics: [],
    },
  ];
}

function createVersionWord(productByte: number, subtypeByte: number): DataView {
  return new DataView(Uint8Array.from([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    productByte,
    subtypeByte,
  ]).buffer);
}

function createMotorStateFrame(
  bytes: readonly number[] = [3, 0x01, 0x02, 0x03, 0x04, 5, 0x1d],
): DataView {
  return new DataView(
    Uint8Array.from(bytes).buffer,
  );
}
