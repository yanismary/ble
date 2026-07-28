import { TestBed } from '@angular/core/testing';
import {
  BleClient,
  BleService as DiscoveredBleService,
  ScanResult,
} from '@capacitor-community/bluetooth-le';

import { BleDisconnectionEvent, BleService } from './ble';

describe('BleService', () => {
  let service: BleService;
  let requestLEScanSpy: jasmine.Spy<typeof BleClient.requestLEScan>;
  let connectSpy: jasmine.Spy<typeof BleClient.connect>;
  let writeSpy: jasmine.Spy<typeof BleClient.write>;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    spyOn(BleClient, 'initialize').and.resolveTo();
    requestLEScanSpy = spyOn(BleClient, 'requestLEScan').and.resolveTo();
    spyOn(BleClient, 'stopLEScan').and.resolveTo();
    spyOn(BleClient, 'isEnabled').and.resolveTo(true);
    spyOn(BleClient, 'requestEnable').and.resolveTo();
    connectSpy = spyOn(BleClient, 'connect').and.resolveTo();
    spyOn(BleClient, 'disconnect').and.resolveTo();
    spyOn(BleClient, 'getServices').and.resolveTo([]);
    spyOn(BleClient, 'read').and.resolveTo(new DataView(new ArrayBuffer(0)));
    writeSpy = spyOn(BleClient, 'write').and.resolveTo();
    spyOn(BleClient, 'writeWithoutResponse').and.resolveTo();
    spyOn(BleClient, 'startNotifications').and.resolveTo();
    spyOn(BleClient, 'stopNotifications').and.resolveTo();

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

  it('should reject service discovery when no device is connected', async () => {
    await expectAsync(service.discoverServices()).toBeRejectedWithError(
      'No BLE device is connected.',
    );
    expect(BleClient.getServices).not.toHaveBeenCalled();
  });

  it('should reject an empty deviceId for service discovery', async () => {
    await service.connect('device-1');

    await expectAsync(service.discoverServices('   ')).toBeRejectedWithError(
      'A deviceId is required to discover services.',
    );
    expect(BleClient.getServices).not.toHaveBeenCalled();
  });

  it('should return services for the connected device', async () => {
    const services: DiscoveredBleService[] = [
      {
        uuid: 'service-1',
        characteristics: [
          {
            uuid: 'characteristic-1',
            properties: createCharacteristicProperties({ read: true }),
            descriptors: [],
          },
        ],
      },
    ];
    const getServicesSpy = BleClient.getServices as jasmine.Spy<
      typeof BleClient.getServices
    >;
    getServicesSpy.and.resolveTo(services);
    await service.connect('device-1');

    const result = await service.discoverServices();

    expect(getServicesSpy).toHaveBeenCalledOnceWith('device-1');
    expect(result).toBe(services);
  });

  it('should reject a characteristic read when no device is connected', async () => {
    await expectAsync(
      service.readCharacteristic('service-1', 'characteristic-1'),
    ).toBeRejectedWithError('No BLE device is connected.');
    expect(BleClient.read).not.toHaveBeenCalled();
  });

  it('should read a characteristic from the connected device', async () => {
    const value = new DataView(Uint8Array.from([1, 2, 3]).buffer);
    const readSpy = BleClient.read as jasmine.Spy<typeof BleClient.read>;
    readSpy.and.resolveTo(value);
    await service.connect('device-1');

    const result = await service.readCharacteristic(
      ' service-uuid ',
      ' characteristic-uuid ',
    );

    expect(readSpy).toHaveBeenCalledOnceWith(
      'device-1',
      'service-uuid',
      'characteristic-uuid',
    );
    expect(result).toBe(value);
  });

  it('should use an explicit device identifier for a characteristic read', async () => {
    await service.connect('device-1');

    await service.readCharacteristic(
      'service-uuid',
      'characteristic-uuid',
      'device-2',
    );

    expect(BleClient.read).toHaveBeenCalledOnceWith(
      'device-2',
      'service-uuid',
      'characteristic-uuid',
    );
  });

  it('should reject a characteristic write when no device is connected', async () => {
    await expectAsync(
      service.writeCharacteristic(
        'service-uuid',
        'characteristic-uuid',
        Uint8Array.from([1]),
      ),
    ).toBeRejectedWithError('No BLE device is connected.');
    expect(BleClient.write).not.toHaveBeenCalled();
  });

  it('should write a non-empty value to the connected device with response', async () => {
    await service.connect('device-1');

    await service.writeCharacteristic(
      ' SERVICE-UUID ',
      ' CHARACTERISTIC-UUID ',
      Uint8Array.from([0x00, 0x20, 0x00, 0x00]),
    );

    expect(writeSpy).toHaveBeenCalledOnceWith(
      'device-1',
      'service-uuid',
      'characteristic-uuid',
      jasmine.any(DataView),
    );
    const value = writeSpy.calls.mostRecent().args[3];
    expect(Array.from(
      new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
    )).toEqual([0x00, 0x20, 0x00, 0x00]);
    expect(BleClient.writeWithoutResponse).not.toHaveBeenCalled();
    expect(service.isWriting).toBeFalse();
  });

  it('should reject an explicit device other than the connected device', async () => {
    await service.connect('device-1');

    await expectAsync(
      service.writeCharacteristic(
        'service-uuid',
        'characteristic-uuid',
        Uint8Array.from([1]),
        'device-2',
      ),
    ).toBeRejectedWithError(
      'The target device is not the connected BLE device.',
    );
    expect(BleClient.write).not.toHaveBeenCalled();
  });

  [
    {
      serviceUuid: ' ',
      characteristicUuid: 'characteristic-uuid',
      expected: 'A service UUID is required to write a characteristic.',
    },
    {
      serviceUuid: 'service-uuid',
      characteristicUuid: ' ',
      expected:
        'A characteristic UUID is required to write a characteristic.',
    },
  ].forEach(({ serviceUuid, characteristicUuid, expected }) => {
    it(`should reject an invalid write target: ${expected}`, async () => {
      await service.connect('device-1');

      await expectAsync(
        service.writeCharacteristic(
          serviceUuid,
          characteristicUuid,
          Uint8Array.from([1]),
        ),
      ).toBeRejectedWithError(expected);
      expect(BleClient.write).not.toHaveBeenCalled();
    });
  });

  it('should reject an empty characteristic value', async () => {
    await service.connect('device-1');

    await expectAsync(
      service.writeCharacteristic(
        'service-uuid',
        'characteristic-uuid',
        new Uint8Array(0),
      ),
    ).toBeRejectedWithError(
      'A non-empty value is required for a BLE write.',
    );
    expect(BleClient.write).not.toHaveBeenCalled();
  });

  it('should reject a second simultaneous characteristic write', async () => {
    let releaseWrite!: () => void;
    writeSpy.and.returnValue(new Promise<void>((resolve) => {
      releaseWrite = resolve;
    }));
    await service.connect('device-1');

    const firstWrite = service.writeCharacteristic(
      'service-uuid',
      'characteristic-uuid',
      Uint8Array.from([1]),
    );
    expect(service.isWriting).toBeTrue();

    await expectAsync(
      service.writeCharacteristic(
        'service-uuid',
        'characteristic-uuid',
        Uint8Array.from([2]),
      ),
    ).toBeRejectedWithError('A BLE write is already in progress.');
    expect(writeSpy).toHaveBeenCalledTimes(1);

    releaseWrite();
    await firstWrite;
    expect(service.isWriting).toBeFalse();
  });

  it('should propagate a native write error and release its lock', async () => {
    const writeError = new Error('Native write failed');
    writeSpy.and.rejectWith(writeError);
    await service.connect('device-1');

    await expectAsync(
      service.writeCharacteristic(
        'service-uuid',
        'characteristic-uuid',
        Uint8Array.from([1]),
      ),
    ).toBeRejectedWith(writeError);
    expect(service.isWriting).toBeFalse();

    writeSpy.and.resolveTo();
    await expectAsync(
      service.writeCharacteristic(
        'service-uuid',
        'characteristic-uuid',
        Uint8Array.from([2]),
      ),
    ).toBeResolved();
  });

  it('should reject when the device disconnects during a write', async () => {
    let onDisconnect: ((deviceId: string) => void) | undefined;
    connectSpy.and.callFake(async (_deviceId, callback) => {
      onDisconnect = callback;
    });
    let releaseWrite!: () => void;
    writeSpy.and.returnValue(new Promise<void>((resolve) => {
      releaseWrite = resolve;
    }));
    await service.connect('device-1');

    const write = service.writeCharacteristic(
      'service-uuid',
      'characteristic-uuid',
      Uint8Array.from([1]),
    );
    onDisconnect?.('device-1');
    releaseWrite();

    await expectAsync(write).toBeRejectedWithError(
      'The BLE device disconnected during the write.',
    );
    expect(service.isWriting).toBeFalse();
  });

  it('should reject notifications when no device is connected', async () => {
    const callback = jasmine.createSpy<(value: DataView) => void>(
      'notification',
    );

    await expectAsync(
      service.startNotifications('service-1', 'characteristic-1', callback),
    ).toBeRejectedWithError('No BLE device is connected.');
    expect(BleClient.startNotifications).not.toHaveBeenCalled();
  });

  it('should start and stop notifications with the connected device', async () => {
    const callback = jasmine.createSpy<(value: DataView) => void>(
      'notification',
    );
    await service.connect('device-1');

    await service.startNotifications(
      ' service-uuid ',
      ' characteristic-uuid ',
      callback,
    );

    expect(BleClient.startNotifications).toHaveBeenCalledOnceWith(
      'device-1',
      'service-uuid',
      'characteristic-uuid',
      callback,
    );

    await service.stopNotifications(
      'service-uuid',
      'characteristic-uuid',
    );

    expect(BleClient.stopNotifications).toHaveBeenCalledOnceWith(
      'device-1',
      'service-uuid',
      'characteristic-uuid',
    );
  });

  it('should not duplicate an active notification subscription', async () => {
    const firstCallback = jasmine.createSpy<(value: DataView) => void>(
      'firstNotification',
    );
    const secondCallback = jasmine.createSpy<(value: DataView) => void>(
      'secondNotification',
    );
    await service.connect('device-1');

    await Promise.all([
      service.startNotifications(
        'service-uuid',
        'characteristic-uuid',
        firstCallback,
      ),
      service.startNotifications(
        'SERVICE-UUID',
        'CHARACTERISTIC-UUID',
        secondCallback,
      ),
    ]);

    expect(BleClient.startNotifications).toHaveBeenCalledTimes(1);
  });

  it('should stop active notifications before a local disconnection', async () => {
    const callback = jasmine.createSpy<(value: DataView) => void>(
      'notification',
    );
    await service.connect('device-1');
    await service.startNotifications(
      'service-uuid',
      'characteristic-uuid',
      callback,
    );

    await service.disconnect();

    expect(BleClient.stopNotifications).toHaveBeenCalledOnceWith(
      'device-1',
      'service-uuid',
      'characteristic-uuid',
    );
    expect(BleClient.stopNotifications).toHaveBeenCalledBefore(
      BleClient.disconnect,
    );
  });

  it('should clear active notifications after a remote disconnection', async () => {
    let onDisconnect: ((deviceId: string) => void) | undefined;
    connectSpy.and.callFake(async (_deviceId, callback) => {
      onDisconnect = callback;
    });
    const callback = jasmine.createSpy<(value: DataView) => void>(
      'notification',
    );
    await service.connect('device-1');
    await service.startNotifications(
      'service-uuid',
      'characteristic-uuid',
      callback,
    );

    onDisconnect?.('device-1');
    await Promise.resolve();

    expect(BleClient.stopNotifications).toHaveBeenCalledOnceWith(
      'device-1',
      'service-uuid',
      'characteristic-uuid',
    );
  });
});

function createCharacteristicProperties(
  overrides: Partial<DiscoveredBleService['characteristics'][number]['properties']> = {},
): DiscoveredBleService['characteristics'][number]['properties'] {
  return {
    authenticatedSignedWrites: false,
    broadcast: false,
    indicate: false,
    notify: false,
    read: false,
    write: false,
    writeWithoutResponse: false,
    ...overrides,
  };
}
