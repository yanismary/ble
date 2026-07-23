import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { ScanResult } from '@capacitor-community/bluetooth-le';
import { Observable, Subject } from 'rxjs';

import {
  BleDisconnectionEvent,
  BleService,
} from '../../core/services/ble';
import { ScanPage } from './scan.page';

class FakeBleService {
  private readonly disconnectionSubject = new Subject<BleDisconnectionEvent>();
  private connectedDeviceIdValue: string | null = null;
  private scanning = false;
  private scanCallback: ((result: ScanResult) => void) | null = null;

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
