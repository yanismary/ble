import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  BleService as DiscoveredBleService,
  ScanResult,
} from '@capacitor-community/bluetooth-le';
import { AlertController } from '@ionic/angular/standalone';
import { Observable, Subject } from 'rxjs';

import {
  BleDisconnectionEvent,
  BleGattCharacteristicProperties,
  BleOperationError,
  BleService,
} from '../../core/services/ble';
import {
  storeAutoEnableBluetooth,
  storeShowBleIdentifier,
} from '../../core/services/app-preferences';
import { BLE_UUIDS } from '../../core/services/product-detection';
import { MotorCommandService } from '../../core/services/motor-command.service';
import {
  ProductDataLoadResult,
  ProductDataLoadService,
  ProductDataLoadStatus,
} from '../../core/services/product-data-load.service';
import {
  BleReadStatus,
  BleReadType,
  BleTypedReadResult,
} from '../../core/services/ble-read.service';
import {
  BleDatesAndCycles,
  decodeBleDatesAndCycles,
} from '../../core/services/ble-read-decoders';
import { ScanPage } from './scan.page';
import {
  getBleSignalQualityAsset,
  getBleSignalQualityFromRssi,
  getScanRoomIconClass,
  splitScanDisplayName,
} from './scan-page-ui';

class FakeBleService {
  private readonly disconnectionSubject = new Subject<BleDisconnectionEvent>();
  private connectedDeviceIdValue: string | null = null;
  private scanning = false;
  private scanCallback: ((result: ScanResult) => void) | null = null;
  private notificationCallback: ((value: DataView) => void) | null = null;
  isWriting = false;
  bluetoothEnabled = true;
  bluetoothEnabledError: unknown | null = null;
  canRequestBluetoothEnable = true;
  canOpenAppSettings = true;
  requestBluetoothEnableResult: Promise<void> | null = null;
  connectionGeneration = 0;
  disconnectResult: Promise<void> | null = null;
  servicesResult: DiscoveredBleService[] = [];
  readResult: DataView = new DataView(new ArrayBuffer(0));
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

  readonly disconnections$: Observable<BleDisconnectionEvent> =
    this.disconnectionSubject.asObservable();

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

  async startScan(
    callback: (result: ScanResult) => void,
    _serviceUuids: readonly string[] = [],
  ): Promise<void> {
    this.scanning = true;
    this.scanCallback = callback;
  }

  async stopScan(): Promise<void> {
    this.scanning = false;
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
        'professionalParameters',
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

  beforeEach(async () => {
    localStorage.clear();
    storeAutoEnableBluetooth(false);
    storeShowBleIdentifier(true);
    bleService = new FakeBleService();
    productDataLoadService = new FakeProductDataLoadService();
    routerNavigate = jasmine.createSpy('navigate').and.resolveTo(true);
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
          provide: MotorCommandService,
          useValue: { sendMotorCommandWithConfirmation },
        },
        {
          provide: ProductDataLoadService,
          useValue: productDataLoadService,
        },
        {
          provide: Router,
          useValue: { navigate: routerNavigate },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScanPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

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
    expect(splitScanDisplayName('Salon#SAL')).toEqual({
      displayName: 'Salon',
      roomSuffix: '#SAL',
    });
    expect(splitScanDisplayName('Garage')).toEqual({
      displayName: 'Garage',
      roomSuffix: null,
    });
    expect(getScanRoomIconClass('#CHA')).toBe('ai-loc-cha');
    expect(getScanRoomIconClass('#ENT')).toBe('ai-loc-autre');
    expect(getScanRoomIconClass(null)).toBeNull();
  });

  it('should use the local room cache as the Phase 1 scan display fallback',
    async () => {
      localStorage.setItem('StoredRoomAssignments', JSON.stringify({
        'DEVICE-1': { name: 'Bureau', suffix: '#ENT', updatedAt: 1 },
      }));
      await component.startScan();
      bleService.emit(createScanResult('device-1', -55, 'Ancien#SAL'));

      expect(component.getScanDisplayName(component.devices[0]))
        .toBe('Bureau');
      expect(component.getScanRoomSuffix(component.devices[0])).toBe('#ENT');
    });

  it('should navigate from the Phase 1 style main menu without BLE calls',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      const connectSpy = spyOn(bleService, 'connect').and.callThrough();
      fixture.detectChanges();

      expect(component.mainMenuItems.map(({ label }) => label)).toEqual([
        'Réglages',
        'Aide',
        'À propos',
        'Qui sommes-nous',
        'Contact',
        'Mentions légales',
      ]);

      await component.openMainMenuRoute(component.mainMenuItems[0]);

      expect(routerNavigate).toHaveBeenCalledOnceWith(['/settings']);
      expect(startScanSpy).not.toHaveBeenCalled();
      expect(connectSpy).not.toHaveBeenCalled();
    },
  );

  it('should disconnect a native connection left alive when ScanPage is created',
    async () => {
      fixture.destroy();
      bleService.setConnectedDeviceId('device-previous');
      bleService.connectionGeneration = 7;

      fixture = TestBed.createComponent(ScanPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
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

  it('should not disconnect again when ScanPage is created after ProductPage cleaned the service',
    async () => {
      fixture.destroy();
      bleService.setConnectedDeviceId(null);
      bleService.disconnect.calls.reset();

      fixture = TestBed.createComponent(ScanPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
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

      expect(component.entryConnectionCleanupInProgress).toBeTrue();
      expect(component.canStartScan).toBeFalse();

      await component.startScan();

      expect(component.scanning).toBeFalse();

      releaseDisconnect();
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

      bleService.emitRemoteDisconnection('device-previous');
      releaseDisconnect();
      await settlePromises();

      expect(bleService.connectedDeviceId).toBeNull();
      expect(component.connectedDeviceId).toBeNull();
      expect(component.entryConnectionCleanupInProgress).toBeFalse();
      expect(component.canStartScan).toBeTrue();
    },
  );

  it('should start scanning, display its state and stop after ten seconds', fakeAsync(() => {
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
    expect(fixture.nativeElement.textContent).toContain(
      'Recherche d’appareils BLE',
    );

    tick(10_000);
    flushMicrotasks();

    expect(stopScanSpy).toHaveBeenCalledTimes(1);
    expect(component.scanning).toBeFalse();
  }));

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

      expect(item?.textContent).toContain('Nom : Salon');
      expect(item?.textContent).toContain('device-1');
      expect(item?.textContent).toContain('Pièce : #SAL');
      expect(item?.querySelector('.ai-loc-sal')).not.toBeNull();
      expect(signal?.getAttribute('src')).toBe(
        'assets/img/img_ble_strenght_4_4.svg',
      );

      await component.stopScan();
    },
  );

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
      await component.startScan();

      bleService.emit(createScanResult(
        'device-1',
        -42,
        'Ancien nom',
        'Nouveau nom#CHA',
      ));

      expect(component.devices[0].name).toBe('Nouveau nom#CHA');
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

  it('should display a readable error when scanning fails', async () => {
    spyOn(bleService, 'startScan').and.rejectWith(
      new Error('Capteur indisponible'),
    );

    await component.startScan();
    fixture.detectChanges();

    expect(component.errorMessage).toContain('Capteur indisponible');
    expect(fixture.nativeElement.textContent).toContain('Capteur indisponible');
    expect(component.scanning).toBeFalse();
  });

  it('should automatically enable Bluetooth before scanning when the preference is active',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      storeAutoEnableBluetooth(true);
      bleService.bluetoothEnabled = false;

      await component.startScan();

      expect(bleService.requestBluetoothEnable).toHaveBeenCalledTimes(1);
      expect(startScanSpy).toHaveBeenCalledTimes(1);
      expect(component.scanBleError).toBeNull();
      expect(component.scanning).toBeTrue();
    },
  );

  it('should show an enable action without starting scan when Bluetooth is off',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      bleService.bluetoothEnabled = false;

      await component.startScan();
      fixture.detectChanges();

      expect(startScanSpy).not.toHaveBeenCalled();
      expect(bleService.requestBluetoothEnable).not.toHaveBeenCalled();
      expect(component.scanning).toBeFalse();
      expect(component.scanBleError?.code).toBe('bluetooth-disabled');
      expect(component.scanBleError?.action).toBe('enable-bluetooth');
      expect(fixture.nativeElement.textContent).toContain('Activer Bluetooth');
    },
  );

  it('should request enabling Bluetooth once and start scanning after it is enabled',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      bleService.bluetoothEnabled = false;
      await component.startScan();

      await component.runScanBleErrorAction();

      expect(bleService.requestBluetoothEnable).toHaveBeenCalledTimes(1);
      expect(startScanSpy).toHaveBeenCalledTimes(1);
      expect(component.scanBleError).toBeNull();
      expect(component.errorMessage).toBeNull();
      expect(component.scanning).toBeTrue();
    },
  );

  it('should show retry when Bluetooth enable is refused',
    async () => {
      bleService.bluetoothEnabled = false;
      await component.startScan();
      bleService.requestBluetoothEnable.and.rejectWith(
        new BleOperationError(
          'bluetooth-enable-failed',
          'Bluetooth enable request failed.',
          new Error('User cancelled'),
        ),
      );

      await component.runScanBleErrorAction();

      expect(component.scanBleError?.code).toBe('bluetooth-enable-failed');
      expect(component.scanBleError?.action).toBe('retry-scan');
      expect(component.scanning).toBeFalse();
    },
  );

  it('should not request Android Bluetooth enable when the platform cannot support it',
    async () => {
      bleService.canRequestBluetoothEnable = false;
      bleService.bluetoothEnabled = false;

      await component.startScan();
      await component.runScanBleErrorAction();

      expect(bleService.requestBluetoothEnable).not.toHaveBeenCalled();
      expect(component.scanBleError?.action).toBe('retry-scan');
      expect(component.scanning).toBeFalse();
    },
  );

  it('should show a retry action when BLE permission is denied',
    async () => {
      const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
      bleService.bluetoothEnabledError = new BleOperationError(
        'permission-denied',
        'BLE permission denied.',
      );

      await component.startScan();
      fixture.detectChanges();

      expect(startScanSpy).not.toHaveBeenCalled();
      expect(component.scanBleError?.code).toBe('permission-denied');
      expect(component.scanBleError?.action).toBe('retry-scan');
      expect(fixture.nativeElement.textContent).toContain('Réessayer');
    },
  );

  it('should show app settings when BLE permission requires settings',
    async () => {
      bleService.bluetoothEnabledError = new BleOperationError(
        'permission-settings-required',
        'BLE permission denied.',
      );

      await component.startScan();
      await component.runScanBleErrorAction();

      expect(component.scanBleError?.action).toBe('open-app-settings');
      expect(bleService.openAppSettings).toHaveBeenCalledTimes(1);
      expect(component.scanning).toBeFalse();
    },
  );

  it('should handle app settings failure without crashing',
    async () => {
      bleService.bluetoothEnabledError = new BleOperationError(
        'permission-settings-required',
        'BLE permission denied.',
      );
      bleService.openAppSettings.and.rejectWith(new BleOperationError(
        'app-settings-failed',
        'Opening app settings failed.',
        new Error('Settings unavailable'),
      ));

      await component.startScan();
      await component.runScanBleErrorAction();

      expect(bleService.openAppSettings).toHaveBeenCalledTimes(1);
      expect(component.scanBleError?.code).toBe('app-settings-failed');
      expect(component.scanBleError?.action).toBe('retry-scan');
      expect(component.scanning).toBeFalse();
    },
  );

  it('should clear a scan error when retry succeeds', async () => {
    const startScanSpy = spyOn(bleService, 'startScan').and.rejectWith(
      new Error('Scan unavailable'),
    );
    await component.startScan();
    expect(component.scanBleError?.action).toBe('retry-scan');
    startScanSpy.and.callThrough();

    await component.runScanBleErrorAction();

    expect(component.scanBleError).toBeNull();
    expect(component.errorMessage).toBeNull();
    expect(component.scanning).toBeTrue();
  });

  it('should ignore a second Bluetooth recovery action while enable is pending',
    async () => {
      let releaseEnable!: () => void;
      bleService.bluetoothEnabled = false;
      bleService.requestBluetoothEnableResult = new Promise<void>((resolve) => {
        releaseEnable = resolve;
      });
      await component.startScan();

      const firstAction = component.runScanBleErrorAction();
      await component.runScanBleErrorAction();

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
      const recovery = component.runScanBleErrorAction();

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
    void component.startScan();
    flushMicrotasks();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));

    void component.selectAndConnectDevice(component.devices[0]);
    expect(component.connecting).toBeTrue();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Connexion en cours');
    flushMicrotasks();
    fixture.detectChanges();

    expect(stopScanSpy).toHaveBeenCalledBefore(connectSpy);
    expect(component.connectedDeviceId).toBe('device-1');
    expect(fixture.nativeElement.textContent).not.toContain('Connecter');
  }));

  it('should automatically navigate after a successful tap connection flow',
    async () => {
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

  it('should display a readable connection error', async () => {
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    spyOn(bleService, 'connect').and.rejectWith(
      new Error('Connexion refusée'),
    );

    await component.selectAndConnectDevice(component.devices[0]);
    fixture.detectChanges();

    expect(component.connectionError).toContain('Connexion refusée');
    expect(fixture.nativeElement.textContent).toContain('Connexion refusée');
    expect(component.connecting).toBeFalse();
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('should ignore a double tap while the connection is pending', async () => {
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
    await Promise.resolve();
    await Promise.resolve();
    expect(connectSpy).toHaveBeenCalledTimes(1);

    releaseConnection();
    await firstTap;
    await secondTap;

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('should ignore a late connection failure after the page is destroyed',
    async () => {
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

  it('should offer a manual retry after a retryable connection failure',
    async () => {
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));
      component.selectDevice(component.devices[0]);
      spyOn(bleService, 'connect').and.rejectWith(
        new BleOperationError(
          'connection-timeout',
          'BLE connection timed out.',
        ),
      );

      await component.connectSelectedDevice();
      fixture.detectChanges();

      expect(component.connectionRetryDeviceId).toBe('device-1');
      expect(component.canRetryConnection).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain(
        'Réessayer la connexion',
      );
    },
  );

  it('should retry the same device through the normal connection flow',
    async () => {
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
      bleService.servicesResult = createServices();
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));
      component.selectDevice(component.devices[0]);
      await component.connectSelectedDevice();

      await component.retryConnection();
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

  it('should keep the manual retry available after a second retryable failure',
    async () => {
      spyOn(bleService, 'connect').and.rejectWith(
        new BleOperationError(
          'service-discovery-failed',
          'BLE service discovery failed during connection.',
        ),
      );
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));
      component.selectDevice(component.devices[0]);
      await component.connectSelectedDevice();

      await component.retryConnection();

      expect(bleService.connect).toHaveBeenCalledTimes(2);
      expect(component.connectedDeviceId).toBeNull();
      expect(component.connectionRetryDeviceId).toBe('device-1');
      expect(component.canRetryConnection).toBeTrue();
    },
  );

  it('should ignore a double manual retry while one connection is pending',
    async () => {
      let releaseRetry!: () => void;
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
          await new Promise<void>((resolve) => {
            releaseRetry = resolve;
          });
          await originalConnect(deviceId);
        });
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));
      component.selectDevice(component.devices[0]);
      await component.connectSelectedDevice();

      const retry = component.retryConnection();
      const ignoredRetry = component.retryConnection();
      await Promise.resolve();

      expect(connectSpy).toHaveBeenCalledTimes(2);
      expect(component.connecting).toBeTrue();
      expect(component.connectionStatusLabel).toContain('Nouvelle tentative');

      releaseRetry();
      await retry;
      await ignoredRetry;
      expect(component.connectedDeviceId).toBe('device-1');
    },
  );

  it('should disconnect if a retry succeeds after the page is destroyed',
    async () => {
      let releaseRetry!: () => void;
      const originalConnect = bleService.connect.bind(bleService);
      let attempt = 0;
      spyOn(bleService, 'connect')
        .and.callFake(async (deviceId: string) => {
          attempt += 1;
          if (attempt === 1) {
            throw new BleOperationError(
              'connection-failed',
              'BLE connection failed.',
            );
          }
          await new Promise<void>((resolve) => {
            releaseRetry = resolve;
          });
          await originalConnect(deviceId);
        });
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));
      component.selectDevice(component.devices[0]);
      await component.connectSelectedDevice();
      bleService.disconnect.calls.reset();

      const retry = component.retryConnection();
      await Promise.resolve();
      fixture.destroy();
      releaseRetry();
      await retry;

      expect(bleService.disconnect).toHaveBeenCalledTimes(1);
      expect(bleService.connectedDeviceId).toBeNull();
      expect(routerNavigate).not.toHaveBeenCalled();
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
    expect(fixture.nativeElement.textContent).toContain(
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

  it('should discover and display services after connecting', async () => {
    bleService.servicesResult = createServices();
    const discoverSpy = spyOn(bleService, 'discoverServices').and.callThrough();
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    component.selectDevice(component.devices[0]);

    await component.connectSelectedDevice();
    fixture.detectChanges();

    expect(discoverSpy).toHaveBeenCalledOnceWith('device-1');
    expect(fixture.nativeElement.textContent).toContain('service-uuid');
    expect(fixture.nativeElement.textContent).toContain('characteristic-uuid');
    expect(fixture.nativeElement.textContent).toContain('Lecture');
    expect(fixture.nativeElement.textContent).toContain('Notification');
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
    fixture.detectChanges();

    expect(component.discoveringServices).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain(
      'Découverte des services',
    );

    resolveServices([]);
    flushMicrotasks();
  }));

  it('should stay connected when service discovery fails', async () => {
    const discoverSpy = spyOn(bleService, 'discoverServices').and.rejectWith(
      new Error('Découverte indisponible'),
    );
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    component.selectDevice(component.devices[0]);

    await component.connectSelectedDevice();
    fixture.detectChanges();

    expect(component.connectedDeviceId).toBe('device-1');
    expect(bleService.connectedDeviceId).toBe('device-1');
    expect(component.discoveryError).toContain('Découverte indisponible');
    expect(component.canRetryConnection).toBeFalse();
    expect(component.canRetryServiceDiscovery).toBeTrue();
    expect(component.canDisconnectAfterDiscoveryError).toBeTrue();
    expect(discoverSpy).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain(
      'Découverte indisponible',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Connexion BLE toujours active',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Réessayer le chargement',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Réessayer la connexion',
    );
  });

  it('should retry service discovery on the active connection', async () => {
    const connectSpy = spyOn(bleService, 'connect').and.callThrough();
    let attempt = 0;
    const discoverSpy = spyOn(bleService, 'discoverServices')
      .and.callFake(async () => {
        attempt += 1;
        if (attempt === 1) {
          throw new Error('Découverte indisponible');
        }
        return createIdentificationServices();
      });
    bleService.readResult = createVersionWord(2, 4);
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Garline'));
    component.selectDevice(component.devices[0]);
    await component.connectSelectedDevice();

    await component.retryLoadServices();
    fixture.detectChanges();

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(discoverSpy.calls.allArgs()).toEqual([
      ['device-1'],
      ['device-1'],
    ]);
    expect(component.discoveryError).toBeNull();
    expect(component.canRetryServiceDiscovery).toBeFalse();
    expect(component.identification?.detectedType).toBe('Garline');
    expect(component.canOpenProductPage).toBeTrue();
  });

  it('should keep service discovery retry available after a retry failure',
    async () => {
      const discoverSpy = spyOn(bleService, 'discoverServices')
        .and.rejectWith(new Error('Services indisponibles'));
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));
      component.selectDevice(component.devices[0]);
      await component.connectSelectedDevice();

      await component.retryLoadServices();

      expect(discoverSpy).toHaveBeenCalledTimes(2);
      expect(component.connectedDeviceId).toBe('device-1');
      expect(component.discoveryError).toContain('Services indisponibles');
      expect(component.canRetryServiceDiscovery).toBeTrue();
    },
  );

  it('should support several manual service discovery retries', async () => {
    let attempt = 0;
    spyOn(bleService, 'discoverServices').and.callFake(async () => {
      attempt += 1;
      if (attempt < 3) {
        throw new Error(`Découverte indisponible ${attempt}`);
      }
      return createIdentificationServices();
    });
    bleService.readResult = createVersionWord(2, 4);
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Garline'));
    component.selectDevice(component.devices[0]);
    await component.connectSelectedDevice();

    await component.retryLoadServices();
    expect(component.canRetryServiceDiscovery).toBeTrue();
    await component.retryLoadServices();

    expect(component.discoveryError).toBeNull();
    expect(component.identification?.detectedType).toBe('Garline');
    expect(bleService.discoverServices).toHaveBeenCalledTimes(3);
  });

  it('should ignore double service discovery retries', async () => {
    let releaseRetry!: (services: DiscoveredBleService[]) => void;
    let attempt = 0;
    const discoverSpy = spyOn(bleService, 'discoverServices')
      .and.callFake(async () => {
        attempt += 1;
        if (attempt === 1) {
          throw new Error('Découverte indisponible');
        }
        return new Promise<DiscoveredBleService[]>((resolve) => {
          releaseRetry = resolve;
        });
      });
    bleService.readResult = createVersionWord(2, 4);
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Garline'));
    component.selectDevice(component.devices[0]);
    await component.connectSelectedDevice();

    const retry = component.retryLoadServices();
    const ignoredRetry = component.retryLoadServices();
    await Promise.resolve();

    expect(discoverSpy).toHaveBeenCalledTimes(2);
    expect(component.discoveringServices).toBeTrue();
    expect(component.serviceDiscoveryStatusLabel).toContain(
      'Nouveau chargement',
    );

    releaseRetry(createIdentificationServices());
    await retry;
    await ignoredRetry;
    expect(component.identification?.detectedType).toBe('Garline');
  });

  it('should clear service discovery recovery after a remote disconnect',
    async () => {
      spyOn(bleService, 'discoverServices').and.rejectWith(
        new Error('Découverte indisponible'),
      );
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Capteur'));
      component.selectDevice(component.devices[0]);
      await component.connectSelectedDevice();

      bleService.emitRemoteDisconnection('device-1');

      expect(component.connectedDeviceId).toBeNull();
      expect(component.discoveryError).toBeNull();
      expect(component.canRetryServiceDiscovery).toBeFalse();
      expect(component.canStartScan).toBeTrue();
    },
  );

  it('should ignore a stale service discovery retry result after reconnect',
    async () => {
      let releaseStaleRetry!: (services: DiscoveredBleService[]) => void;
      let attempt = 0;
      spyOn(bleService, 'discoverServices').and.callFake(async () => {
        attempt += 1;
        if (attempt === 1) {
          throw new Error('Découverte indisponible');
        }
        if (attempt === 2) {
          return new Promise<DiscoveredBleService[]>((resolve) => {
            releaseStaleRetry = resolve;
          });
        }
        return createWidoorIdentificationServices();
      });
      bleService.readResult = createVersionWord(1, 0);
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Firma#CHA'));
      component.selectDevice(component.devices[0]);
      await component.connectSelectedDevice();

      const staleRetry = component.retryLoadServices();
      await Promise.resolve();
      bleService.emitRemoteDisconnection('device-1');
      await component.connectSelectedDevice();
      releaseStaleRetry(createIdentificationServices());
      await staleRetry;

      expect(component.connectedDeviceId).toBe('device-1');
      expect(component.identification?.detectedType).toBe('Widoor');
      expect(component.services.some(({ uuid }) =>
        uuid === BLE_UUIDS.widoorService,
      )).toBeTrue();
    },
  );

  it('should not update UI after destruction during service discovery retry',
    async () => {
      let releaseRetry!: (services: DiscoveredBleService[]) => void;
      let attempt = 0;
      spyOn(bleService, 'discoverServices').and.callFake(async () => {
        attempt += 1;
        if (attempt === 1) {
          throw new Error('Découverte indisponible');
        }
        return new Promise<DiscoveredBleService[]>((resolve) => {
          releaseRetry = resolve;
        });
      });
      await component.startScan();
      bleService.emit(createScanResult('device-1', -42, 'Garline'));
      component.selectDevice(component.devices[0]);
      await component.connectSelectedDevice();

      const retry = component.retryLoadServices();
      await Promise.resolve();
      fixture.destroy();
      releaseRetry(createIdentificationServices());
      await retry;

      expect(routerNavigate).not.toHaveBeenCalled();
    },
  );

  it('should disconnect from a service discovery error state', async () => {
    spyOn(bleService, 'discoverServices').and.rejectWith(
      new Error('Découverte indisponible'),
    );
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    component.selectDevice(component.devices[0]);
    await component.connectSelectedDevice();

    await component.disconnectAfterDiscoveryError();

    expect(bleService.disconnect).toHaveBeenCalledTimes(1);
    expect(component.connectedDeviceId).toBeNull();
    expect(component.discoveryError).toBeNull();
    expect(component.canStartScan).toBeTrue();
  });

  it('should keep the connected state when disconnect after discovery error fails',
    async () => {
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

      await component.disconnectAfterDiscoveryError();

      expect(component.connectedDeviceId).toBe('device-1');
      expect(bleService.connectedDeviceId).toBe('device-1');
      expect(component.errorMessage).toContain('Déconnexion refusée');
      expect(component.canStartScan).toBeFalse();
    },
  );

  it('should clear discovered services after a remote disconnection', async () => {
    bleService.servicesResult = createServices();
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    component.selectDevice(component.devices[0]);
    await component.connectSelectedDevice();
    expect(component.services.length).toBe(1);

    bleService.emitRemoteDisconnection('device-1');

    expect(component.services).toEqual([]);
    expect(component.discoveringServices).toBeFalse();
  });

  it('should read and display identification after service discovery', async () => {
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
    expect(fixture.nativeElement.textContent).toContain('02 04');
    expect(fixture.nativeElement.textContent).toContain('Garline');
    expect(fixture.nativeElement.textContent).toContain(
      'Service Moventiv/Garline + octet produit 2',
    );
  });

  it('should display the Widoor detection reason for an old product name', async () => {
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
    expect(fixture.nativeElement.textContent).toContain(
      'Service secondaire Widoor détecté',
    );
  });

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
    it(`should show the motor test for ${profile}`, () => {
      configureMotorTest(
        profile as 'widoor' | 'moventiv-60' | 'moventiv-80' | 'garline',
      );
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.motor-test-panel'))
        .not.toBeNull();
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
    it(`should display the ${status} motor result`, async () => {
      configureMotorTest('widoor');
      sendMotorCommandWithConfirmation.and.resolveTo(
        motorCommandResult(
          status as 'confirmed' | 'timeout' | 'disconnected',
        ),
      );
      await confirmOpen();
      fixture.detectChanges();

      expect(component.motorTestStatus).toBe(status);
      expect(fixture.nativeElement.textContent).toContain(expected);
      expect(fixture.nativeElement.querySelector('ion-spinner')).toBeNull();
    });
  });

  it('should display the raw Widoor confirmation state instead of a position',
    async () => {
      configureMotorTest('widoor');
      sendMotorCommandWithConfirmation.and.resolveTo(
        motorCommandResult('confirmed'),
      );

      await confirmOpen();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('0x21');
      expect(fixture.nativeElement.textContent).toContain('(33)');
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
      expect(fixture.nativeElement.textContent).toContain(
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

  it('should store ambiguous for contradictory detection clues', async () => {
    spyOn(console, 'warn');
    bleService.servicesResult = createContradictoryIdentificationServices();
    bleService.readResult = createVersionWord(1, 0);
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Produit'));
    component.selectDevice(component.devices[0]);

    await component.connectSelectedDevice();

    expect(component.identification?.detectedType).toBe('Ambigu');
    expect(component.productProfile).toBe('ambiguous');
  });

  it('should display the identification reading state', fakeAsync(() => {
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
    fixture.detectChanges();

    expect(component.readingIdentification).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain(
      'Lecture de l’identification',
    );

    resolveRead(createVersionWord(0, 1));
    flushMicrotasks();
  }));

  it('should stay connected when identification reading fails', async () => {
    bleService.servicesResult = createIdentificationServices();
    spyOn(bleService, 'readCharacteristic').and.rejectWith(
      new Error('Lecture refusée'),
    );
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Produit'));
    component.selectDevice(component.devices[0]);

    await component.connectSelectedDevice();
    fixture.detectChanges();

    expect(component.connectedDeviceId).toBe('device-1');
    expect(component.identificationError).toContain('Lecture refusée');
    expect(fixture.nativeElement.textContent).toContain('Lecture refusée');
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

  it('should display motor state notifications and increment their count', async () => {
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
    expect(fixture.nativeElement.textContent).toContain('État moteur');
    expect(fixture.nativeElement.textContent).toContain(
      '03 01 02 03 04 05 1d',
    );
    expect(fixture.nativeElement.textContent).toContain(
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
    expect(fixture.nativeElement.textContent).toContain(
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

  it('should passively display cached historical GATT properties', async () => {
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
    const text = fixture.nativeElement.querySelector(
      '.historical-gatt-diagnostic',
    )?.textContent ?? '';

    expect(component.showHistoricalGattDiagnostic).toBeTrue();
    expect(text).toContain(BLE_UUIDS.completeParametersCharacteristic);
    expect(text).toContain(component.productReadText.passiveGattNotice);
    expect(text).toContain('Descripteurs');
    expect(text).toContain('2');
    expect(text).toContain(component.productReadText.yes);
    expect(text).toContain(component.productReadText.no);
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
      )?.textContent).toContain(component.productReadText.unknown);
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

  it('should show the historical GATT diagnostic only for known Widoor',
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

  it('should render the physical dates on the responsive diagnostic grid',
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
      const text = details?.textContent ?? '';

      expect(details).not.toBeNull();
      expect(text).toContain('00 00 00');
      expect(text).toContain('27/08/2019');
      expect(text).toContain(component.productReadText.notInitialized);
      expect(text).toContain('26580');
      expect(text).toMatch(/Cycles depuis maintenance\s*0/);
      expect(text).not.toContain('[object Object]');
      expect(text).not.toContain('0/0/0');
      expect(text).not.toContain('27/7/19');
    },
  );

  it('should distinguish Widoor professional data for presentation', () => {
    expect(component.isWidoorProfessionalParameters({
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
      'professionalParameters',
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
  readonly message: string;
  readonly buttons: readonly {
    readonly role?: string;
    readonly handler?: () => void;
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
