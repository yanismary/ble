import { TestBed } from '@angular/core/testing';
import {
  BleClient,
  ScanResult,
} from '@capacitor-community/bluetooth-le';

import { BleDisconnectionEvent, BleService } from './ble';

describe('BleService', () => {
  let service: BleService;
  let requestLEScanSpy: jasmine.Spy<typeof BleClient.requestLEScan>;
  let connectSpy: jasmine.Spy<typeof BleClient.connect>;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    spyOn(BleClient, 'initialize').and.resolveTo();
    requestLEScanSpy = spyOn(BleClient, 'requestLEScan').and.resolveTo();
    spyOn(BleClient, 'stopLEScan').and.resolveTo();
    spyOn(BleClient, 'isEnabled').and.resolveTo(true);
    spyOn(BleClient, 'requestEnable').and.resolveTo();
    connectSpy = spyOn(BleClient, 'connect').and.resolveTo();
    spyOn(BleClient, 'disconnect').and.resolveTo();

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

  it('should connect to a device and expose its identifier', async () => {
    await service.connect('device-1');

    expect(BleClient.connect).toHaveBeenCalledOnceWith(
      'device-1',
      jasmine.any(Function),
    );
    expect(service.connectedDeviceId).toBe('device-1');
  });

  it('should reject an empty deviceId', async () => {
    await expectAsync(service.connect('   ')).toBeRejectedWithError(
      'A deviceId is required to connect.',
    );
    expect(BleClient.connect).not.toHaveBeenCalled();
  });

  it('should stop scanning before connecting', async () => {
    const callback = jasmine.createSpy<(result: ScanResult) => void>(
      'deviceFound',
    );
    await service.startScan(callback);

    await service.connect('device-1');

    expect(BleClient.stopLEScan).toHaveBeenCalledBefore(BleClient.connect);
    expect(service.isScanning()).toBeFalse();
  });

  it('should reset its connection state when connecting fails', async () => {
    const connectionError = new Error('Connection failed');
    connectSpy.and.rejectWith(connectionError);

    await expectAsync(service.connect('device-1')).toBeRejectedWith(
      connectionError,
    );
    expect(service.connectedDeviceId).toBeNull();

    connectSpy.and.resolveTo();
    await expectAsync(service.connect('device-1')).toBeResolved();
  });

  it('should reject a second simultaneous connection', async () => {
    let releaseConnection!: () => void;
    const pendingConnection = new Promise<void>((resolve) => {
      releaseConnection = resolve;
    });
    connectSpy.and.returnValue(pendingConnection);

    const firstConnection = service.connect('device-1');

    await expectAsync(service.connect('device-2')).toBeRejectedWithError(
      'A BLE connection is already in progress.',
    );
    expect(connectSpy).toHaveBeenCalledTimes(1);

    releaseConnection();
    await firstConnection;
  });

  it('should disconnect the connected device', async () => {
    await service.connect('device-1');

    await service.disconnect();

    expect(BleClient.disconnect).toHaveBeenCalledOnceWith('device-1');
    expect(service.connectedDeviceId).toBeNull();
  });

  it('should emit a remote disconnection and clear the connected device', async () => {
    let onDisconnect: ((deviceId: string) => void) | undefined;
    connectSpy.and.callFake(async (_deviceId, callback) => {
      onDisconnect = callback;
    });
    const events: BleDisconnectionEvent[] = [];
    service.disconnections$.subscribe((event) => events.push(event));
    await service.connect('device-1');

    onDisconnect?.('device-1');

    expect(service.connectedDeviceId).toBeNull();
    expect(events).toEqual([
      { deviceId: 'device-1', reason: 'remote' },
    ]);
  });

  it('should emit only one local event for a voluntary disconnection', async () => {
    let onDisconnect: ((deviceId: string) => void) | undefined;
    connectSpy.and.callFake(async (_deviceId, callback) => {
      onDisconnect = callback;
    });
    const events: BleDisconnectionEvent[] = [];
    service.disconnections$.subscribe((event) => events.push(event));
    await service.connect('device-1');
    const disconnectSpy = BleClient.disconnect as jasmine.Spy<
      typeof BleClient.disconnect
    >;
    disconnectSpy.and.callFake(async (deviceId) => {
      onDisconnect?.(deviceId);
    });

    await service.disconnect();
    onDisconnect?.('device-1');

    expect(events).toEqual([
      { deviceId: 'device-1', reason: 'local' },
    ]);
  });
});
