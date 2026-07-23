import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import {
  BleService as DiscoveredBleService,
  ScanResult,
} from '@capacitor-community/bluetooth-le';
import { Observable, Subject } from 'rxjs';

import {
  BleDisconnectionEvent,
  BleService,
} from '../../core/services/ble';
import { BLE_UUIDS } from '../../core/services/product-detection';
import { ScanPage } from './scan.page';

class FakeBleService {
  private readonly disconnectionSubject = new Subject<BleDisconnectionEvent>();
  private connectedDeviceIdValue: string | null = null;
  private scanning = false;
  private scanCallback: ((result: ScanResult) => void) | null = null;
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

  emit(result: ScanResult): void {
    this.scanCallback?.(result);
  }

  emitRemoteDisconnection(deviceId: string): void {
    this.connectedDeviceIdValue = null;
    this.disconnectionSubject.next({ deviceId, reason: 'remote' });
  }
}

describe('ScanPage', () => {
  let component: ScanPage;
  let fixture: ComponentFixture<ScanPage>;
  let bleService: FakeBleService;

  beforeEach(async () => {
    bleService = new FakeBleService();

    await TestBed.configureTestingModule({
      imports: [ScanPage],
      providers: [{ provide: BleService, useValue: bleService }],
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
    expect(fixture.nativeElement.textContent).toContain(
      'Service secondaire Widoor détecté',
    );
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

    bleService.emitRemoteDisconnection('device-1');

    expect(component.identification).toBeNull();
    expect(component.secondaryProfile).toBe('Inconnu');
    expect(component.readingIdentification).toBeFalse();
  });
});

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

function createVersionWord(productByte: number, subtypeByte: number): DataView {
  return new DataView(Uint8Array.from([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    productByte,
    subtypeByte,
  ]).buffer);
}
