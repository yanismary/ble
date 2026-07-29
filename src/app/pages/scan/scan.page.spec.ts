import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import {
  BleService as DiscoveredBleService,
  ScanResult,
} from '@capacitor-community/bluetooth-le';
import { AlertController } from '@ionic/angular/standalone';
import { Observable, Subject } from 'rxjs';

import {
  BleDisconnectionEvent,
  BleService,
} from '../../core/services/ble';
import { BLE_UUIDS } from '../../core/services/product-detection';
import { MotorCommandService } from '../../core/services/motor-command.service';
import { ScanPage } from './scan.page';

class FakeBleService {
  private readonly disconnectionSubject = new Subject<BleDisconnectionEvent>();
  private connectedDeviceIdValue: string | null = null;
  private scanning = false;
  private scanCallback: ((result: ScanResult) => void) | null = null;
  private notificationCallback: ((value: DataView) => void) | null = null;
  isWriting = false;
  servicesResult: DiscoveredBleService[] = [];
  readResult: DataView = new DataView(new ArrayBuffer(0));

  readonly disconnections$: Observable<BleDisconnectionEvent> =
    this.disconnectionSubject.asObservable();

  get connectedDeviceId(): string | null {
    return this.connectedDeviceIdValue;
  }

  async initialize(): Promise<void> {}

  async isBluetoothEnabled(): Promise<boolean> {
    return true;
  }

  async requestBluetoothEnable(): Promise<void> {}

  async startScan(callback: (result: ScanResult) => void): Promise<void> {
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
  }

  async disconnect(): Promise<void> {
    this.connectedDeviceIdValue = null;
  }

  async discoverServices(_deviceId?: string): Promise<DiscoveredBleService[]> {
    return this.servicesResult;
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
    this.disconnectionSubject.next({ deviceId, reason: 'remote' });
  }

  setConnectedDeviceId(deviceId: string | null): void {
    this.connectedDeviceIdValue = deviceId;
  }

  emitNotification(value: DataView): void {
    this.notificationCallback?.(value);
  }
}

describe('ScanPage', () => {
  let component: ScanPage;
  let fixture: ComponentFixture<ScanPage>;
  let bleService: FakeBleService;
  let alertCreate: jasmine.Spy;
  let alertOptions: TestAlertOptions[];
  let sendMotorCommandWithConfirmation: jasmine.Spy;

  beforeEach(async () => {
    bleService = new FakeBleService();
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScanPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start scanning, display its state and stop after ten seconds', fakeAsync(() => {
    const startScanSpy = spyOn(bleService, 'startScan').and.callThrough();
    const stopScanSpy = spyOn(bleService, 'stopScan').and.callThrough();

    void component.startScan();
    flushMicrotasks();
    fixture.detectChanges();

    expect(startScanSpy).toHaveBeenCalledTimes(1);
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

  it('should stop scanning and display the connection state', fakeAsync(() => {
    const stopScanSpy = spyOn(bleService, 'stopScan').and.callThrough();
    const connectSpy = spyOn(bleService, 'connect').and.callThrough();
    void component.startScan();
    flushMicrotasks();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    component.selectDevice(component.devices[0]);

    void component.connectSelectedDevice();
    expect(component.connecting).toBeTrue();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Connexion en cours');
    flushMicrotasks();
    fixture.detectChanges();

    expect(stopScanSpy).toHaveBeenCalledBefore(connectSpy);
    expect(component.connectedDeviceId).toBe('device-1');
    expect(fixture.nativeElement.textContent).toContain('Connecté');
  }));

  it('should display a readable connection error', async () => {
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    component.selectDevice(component.devices[0]);
    spyOn(bleService, 'connect').and.rejectWith(
      new Error('Connexion refusée'),
    );

    await component.connectSelectedDevice();
    fixture.detectChanges();

    expect(component.connectionError).toContain('Connexion refusée');
    expect(fixture.nativeElement.textContent).toContain('Connexion refusée');
    expect(component.connecting).toBeFalse();
  });

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

    const buttons = fixture.nativeElement.querySelectorAll(
      'ion-button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBeFalse();
    expect(buttons[2].disabled).toBeFalse();
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
    spyOn(bleService, 'discoverServices').and.rejectWith(
      new Error('Découverte indisponible'),
    );
    await component.startScan();
    bleService.emit(createScanResult('device-1', -42, 'Capteur'));
    component.selectDevice(component.devices[0]);

    await component.connectSelectedDevice();
    fixture.detectChanges();

    expect(component.connectedDeviceId).toBe('device-1');
    expect(component.discoveryError).toContain('Découverte indisponible');
    expect(fixture.nativeElement.textContent).toContain('Connecté');
    expect(fixture.nativeElement.textContent).toContain(
      'Découverte indisponible',
    );
  });

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
    expect(fixture.nativeElement.textContent).toContain('Connect');
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
    expect(fixture.nativeElement.textContent).toContain('Connect');
    expect(fixture.nativeElement.textContent).toContain(
      'Notifications refusées',
    );
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
});

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
): ScanResult {
  return {
    device: { deviceId, name },
    rssi,
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
