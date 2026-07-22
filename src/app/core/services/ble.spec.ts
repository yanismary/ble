import { TestBed } from '@angular/core/testing';
import {
  BleClient,
  ScanResult,
} from '@capacitor-community/bluetooth-le';

import { BleService } from './ble';

describe('BleService', () => {
  let service: BleService;
  let requestLEScanSpy: jasmine.Spy<typeof BleClient.requestLEScan>;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    spyOn(BleClient, 'initialize').and.resolveTo();
    requestLEScanSpy = spyOn(BleClient, 'requestLEScan').and.resolveTo();
    spyOn(BleClient, 'stopLEScan').and.resolveTo();
    spyOn(BleClient, 'isEnabled').and.resolveTo(true);
    spyOn(BleClient, 'requestEnable').and.resolveTo();

    service = TestBed.inject(BleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize BLE without using scan results for location', async () => {
    await service.initialize();

    expect(BleClient.initialize).toHaveBeenCalledOnceWith({
      androidNeverForLocation: true,
    });
  });

  it('should initialize BLE only once', async () => {
    await Promise.all([
      service.initialize(),
      service.initialize(),
      service.initialize(),
    ]);

    expect(BleClient.initialize).toHaveBeenCalledTimes(1);
  });

  it('should start a scan without duplicate results', async () => {
    const callback = jasmine.createSpy<(result: ScanResult) => void>(
      'deviceFound',
    );

    await service.startScan(callback);

    expect(BleClient.requestLEScan).toHaveBeenCalledOnceWith(
      { allowDuplicates: false },
      callback,
    );
    expect(service.isScanning()).toBeTrue();
  });

  it('should reject a second simultaneous scan', async () => {
    const callback = jasmine.createSpy<(result: ScanResult) => void>(
      'deviceFound',
    );
    await service.startScan(callback);

    await expectAsync(service.startScan(callback)).toBeRejectedWithError(
      'A BLE scan is already in progress.',
    );
    expect(BleClient.requestLEScan).toHaveBeenCalledTimes(1);
  });

  it('should stop the active scan', async () => {
    const callback = jasmine.createSpy<(result: ScanResult) => void>(
      'deviceFound',
    );
    await service.startScan(callback);

    await service.stopScan();

    expect(BleClient.stopLEScan).toHaveBeenCalledTimes(1);
    expect(service.isScanning()).toBeFalse();
  });

  it('should reset its state when starting the scan fails', async () => {
    const callback = jasmine.createSpy<(result: ScanResult) => void>(
      'deviceFound',
    );
    const scanError = new Error('Scan unavailable');
    requestLEScanSpy.and.rejectWith(scanError);

    await expectAsync(service.startScan(callback)).toBeRejectedWith(scanError);
    expect(service.isScanning()).toBeFalse();
  });
});
