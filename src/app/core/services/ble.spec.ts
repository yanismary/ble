import { TestBed } from '@angular/core/testing';
import {
  BleClient,
  BleService as DiscoveredBleService,
  ScanResult,
} from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

import {
  BleDisconnectionEvent,
  BleOperationError,
  BleService,
} from './ble';

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
    spyOn(BleClient, 'openBluetoothSettings').and.resolveTo();
    spyOn(BleClient, 'openAppSettings').and.resolveTo();
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

  it('should expose permission denied as a typed initialize error', async () => {
    const permissionError = new Error('Permission denied.');
    (BleClient.initialize as jasmine.Spy<typeof BleClient.initialize>)
      .and.rejectWith(permissionError);

    try {
      await service.initialize();
      fail('initialize should reject');
    } catch (error: unknown) {
      expect(error).toEqual(jasmine.any(BleOperationError));
      expect((error as BleOperationError).code).toBe('permission-denied');
      expect((error as BleOperationError).cause).toBe(permissionError);
    }
  });

  it('should expose iOS permission denial as requiring app settings',
    async () => {
      spyOn(Capacitor, 'getPlatform').and.returnValue('ios');
      const permissionError = new Error('BLE permission denied');
      (BleClient.initialize as jasmine.Spy<typeof BleClient.initialize>)
        .and.rejectWith(permissionError);

      try {
        await service.initialize();
        fail('initialize should reject');
      } catch (error: unknown) {
        expect(error).toEqual(jasmine.any(BleOperationError));
        expect((error as BleOperationError).code).toBe(
          'permission-settings-required',
        );
      }
    },
  );

  it('should not classify arbitrary text containing permission denied as a permission error',
    async () => {
      const initializeError = new Error(
        'Unexpected status: permission denied cache entry is stale',
      );
      (BleClient.initialize as jasmine.Spy<typeof BleClient.initialize>)
        .and.rejectWith(initializeError);

      try {
        await service.initialize();
        fail('initialize should reject');
      } catch (error: unknown) {
        expect(error).toEqual(jasmine.any(BleOperationError));
        expect((error as BleOperationError).code).toBe(
          'initialization-failed',
        );
        expect((error as BleOperationError).cause).toBe(initializeError);
      }
    },
  );

  it('should expose generic initialization failures as typed errors',
    async () => {
      const initializeError = new Error('BLE unavailable');
      (BleClient.initialize as jasmine.Spy<typeof BleClient.initialize>)
        .and.rejectWith(initializeError);

      try {
        await service.initialize();
        fail('initialize should reject');
      } catch (error: unknown) {
        expect(error).toEqual(jasmine.any(BleOperationError));
        expect((error as BleOperationError).code).toBe(
          'initialization-failed',
        );
        expect((error as BleOperationError).cause).toBe(initializeError);
      }
    },
  );

  it('should report whether Bluetooth is enabled', async () => {
    await expectAsync(service.isBluetoothEnabled()).toBeResolvedTo(true);

    (BleClient.isEnabled as jasmine.Spy<typeof BleClient.isEnabled>)
      .and.resolveTo(false);

    await expectAsync(service.isBluetoothEnabled()).toBeResolvedTo(false);
  });

  it('should request enabling Bluetooth only on Android', async () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');

    await service.requestBluetoothEnable();

    expect(BleClient.requestEnable).toHaveBeenCalledTimes(1);
  });

  it('should reject Bluetooth enable request on iOS without calling the Android API',
    async () => {
      spyOn(Capacitor, 'getPlatform').and.returnValue('ios');

      try {
        await service.requestBluetoothEnable();
        fail('requestBluetoothEnable should reject');
      } catch (error: unknown) {
        expect(error).toEqual(jasmine.any(BleOperationError));
        expect((error as BleOperationError).code).toBe(
          'bluetooth-enable-unavailable',
        );
      }
      expect(BleClient.requestEnable).not.toHaveBeenCalled();
    },
  );

  it('should expose requestEnable failures as typed errors', async () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    const enableError = new Error('User cancelled');
    (BleClient.requestEnable as jasmine.Spy<typeof BleClient.requestEnable>)
      .and.rejectWith(enableError);

    try {
      await service.requestBluetoothEnable();
      fail('requestBluetoothEnable should reject');
    } catch (error: unknown) {
      expect(error).toEqual(jasmine.any(BleOperationError));
      expect((error as BleOperationError).code).toBe(
        'bluetooth-enable-failed',
      );
      expect((error as BleOperationError).cause).toBe(enableError);
    }
  });

  it('should open app settings when supported', async () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');

    await service.openAppSettings();

    expect(BleClient.openAppSettings).toHaveBeenCalledTimes(1);
  });

  it('should expose app settings failures as typed errors', async () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    const settingsError = new Error('Settings unavailable');
    (BleClient.openAppSettings as jasmine.Spy<typeof BleClient.openAppSettings>)
      .and.rejectWith(settingsError);

    try {
      await service.openAppSettings();
      fail('openAppSettings should reject');
    } catch (error: unknown) {
      expect(error).toEqual(jasmine.any(BleOperationError));
      expect((error as BleOperationError).code).toBe('app-settings-failed');
      expect((error as BleOperationError).cause).toBe(settingsError);
    }
  });

  it('should open Bluetooth settings only on Android', async () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');

    await service.openBluetoothSettings();

    expect(BleClient.openBluetoothSettings).toHaveBeenCalledTimes(1);
  });

  it('should reject Bluetooth settings on iOS without calling Android APIs',
    async () => {
      spyOn(Capacitor, 'getPlatform').and.returnValue('ios');

      await expectAsync(service.openBluetoothSettings()).toBeRejectedWith(
        jasmine.objectContaining({
          code: 'bluetooth-settings-unavailable',
        }),
      );
      expect(BleClient.openBluetoothSettings).not.toHaveBeenCalled();
    },
  );

  it('should expose Bluetooth settings failures as typed errors', async () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    const settingsError = new Error('Bluetooth settings unavailable');
    (BleClient.openBluetoothSettings as jasmine.Spy<
      typeof BleClient.openBluetoothSettings
    >).and.rejectWith(settingsError);

    await expectAsync(service.openBluetoothSettings()).toBeRejectedWith(
      jasmine.objectContaining({
        code: 'bluetooth-settings-failed',
        cause: settingsError,
      }),
    );
  });

  it('should start a scan with duplicate advertisements enabled', async () => {
    const callback = jasmine.createSpy<(result: ScanResult) => void>(
      'deviceFound',
    );

    await service.startScan(callback);

    expect(BleClient.requestLEScan).toHaveBeenCalledOnceWith(
      { allowDuplicates: true },
      callback,
    );
    expect(service.isScanning()).toBeTrue();
  });

  it('should normalize and deduplicate service filters when starting a scan',
    async () => {
      const callback = jasmine.createSpy<(result: ScanResult) => void>(
        'deviceFound',
      );
      const firstService = '3206890A-650E-46F3-9C73-2BC0840E3B8E';
      const secondService = '978AE765-664C-45D8-9157-3B9031E6478E';

      await service.startScan(callback, [
        firstService,
        ` ${firstService.toLowerCase()} `,
        secondService,
        '',
      ]);

      expect(BleClient.requestLEScan).toHaveBeenCalledOnceWith(
        {
          services: [firstService.toLowerCase(), secondService.toLowerCase()],
          allowDuplicates: true,
        },
        callback,
      );
      expect(service.isScanning()).toBeTrue();
    },
  );

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

    try {
      await service.startScan(callback);
      fail('startScan should reject');
    } catch (error: unknown) {
      expect(error).toEqual(jasmine.any(BleOperationError));
      expect((error as BleOperationError).code).toBe('scan-failed');
      expect((error as BleOperationError).cause).toBe(scanError);
    }
    expect(service.isScanning()).toBeFalse();
  });

  it('should connect to a device and expose its identifier', async () => {
    await service.connect('device-1');

    expect(BleClient.connect).toHaveBeenCalledOnceWith(
      'device-1',
      jasmine.any(Function),
    );
    expect(service.connectedDeviceId).toBe('device-1');
    expect(service.connectionGeneration).toBe(1);
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

    try {
      await service.connect('device-1');
      fail('connect should reject');
    } catch (error: unknown) {
      expect(error).toEqual(jasmine.any(BleOperationError));
      expect((error as BleOperationError).code).toBe('connection-failed');
      expect((error as BleOperationError).cause).toBe(connectionError);
    }
    expect(BleClient.disconnect).toHaveBeenCalledOnceWith('device-1');
    expect(service.connectedDeviceId).toBeNull();
    expect(service.connectionGeneration).toBe(1);

    connectSpy.and.resolveTo();
    await expectAsync(service.connect('device-1')).toBeResolved();
    expect(service.connectedDeviceId).toBe('device-1');
    expect(service.connectionGeneration).toBe(2);
  });

  it('should expose a typed connection timeout and cleanup the native device',
    async () => {
      const connectionError = new Error('Connection timeout.');
      connectSpy.and.rejectWith(connectionError);

      try {
        await service.connect('device-1');
        fail('connect should reject');
      } catch (error: unknown) {
        expect(error).toEqual(jasmine.any(BleOperationError));
        expect((error as BleOperationError).code)
          .toBe('connection-timeout');
        expect((error as BleOperationError).cause).toBe(connectionError);
      }
      expect(BleClient.disconnect).toHaveBeenCalledOnceWith('device-1');
      expect(service.connectedDeviceId).toBeNull();
      expect(service.connectionGeneration).toBe(1);
    },
  );

  it('should connect after a timeout cleanup', async () => {
    connectSpy.and.rejectWith(new Error('Connection timeout.'));

    await expectAsync(service.connect('device-1')).toBeRejected();
    connectSpy.and.resolveTo();
    await service.connect('device-1');

    expect(service.connectedDeviceId).toBe('device-1');
    expect(service.connectionGeneration).toBe(2);
    expect(BleClient.disconnect).toHaveBeenCalledOnceWith('device-1');
  });

  it('should expose service discovery failures raised during native connect',
    async () => {
      const connectionError = new Error('Service discovery failed.');
      connectSpy.and.rejectWith(connectionError);

      try {
        await service.connect('device-1');
        fail('connect should reject');
      } catch (error: unknown) {
        expect(error).toEqual(jasmine.any(BleOperationError));
        expect((error as BleOperationError).code)
          .toBe('service-discovery-failed');
        expect((error as BleOperationError).cause).toBe(connectionError);
      }
      expect(BleClient.disconnect).toHaveBeenCalledOnceWith('device-1');
      expect(service.connectedDeviceId).toBeNull();
    },
  );

  it('should preserve the connection error when cleanup disconnect fails',
    async () => {
      const connectionError = new Error('Connection timeout.');
      connectSpy.and.rejectWith(connectionError);
      (BleClient.disconnect as jasmine.Spy<typeof BleClient.disconnect>)
        .and.rejectWith(new Error('Disconnect failed'));

      try {
        await service.connect('device-1');
        fail('connect should reject');
      } catch (error: unknown) {
        expect(error).toEqual(jasmine.any(BleOperationError));
        expect((error as BleOperationError).code)
          .toBe('connection-timeout');
        expect((error as BleOperationError).cause).toBe(connectionError);
      }
      expect(service.connectedDeviceId).toBeNull();
      expect(service.connectionGeneration).toBe(1);
    },
  );

  it('should allow a new attempt after cleanup disconnect fails',
    async () => {
      connectSpy.and.rejectWith(new Error('Connection timeout.'));
      (BleClient.disconnect as jasmine.Spy<typeof BleClient.disconnect>)
        .and.rejectWith(new Error('Disconnect failed'));

      await expectAsync(service.connect('device-1')).toBeRejected();
      connectSpy.and.resolveTo();
      (BleClient.disconnect as jasmine.Spy<typeof BleClient.disconnect>)
        .and.resolveTo();

      await service.connect('device-1');

      expect(service.connectedDeviceId).toBe('device-1');
      expect(service.connectionGeneration).toBe(2);
    },
  );

  it('should not run native cleanup twice after a remote disconnect during connect',
    async () => {
      let onDisconnect: ((deviceId: string) => void) | undefined;
      connectSpy.and.callFake(async (_deviceId, callback) => {
        onDisconnect = callback;
        onDisconnect?.('device-1');
      });
      const disconnectSpy = BleClient.disconnect as jasmine.Spy<
        typeof BleClient.disconnect
      >;

      try {
        await service.connect('device-1');
        fail('connect should reject');
      } catch (error: unknown) {
        expect(error).toEqual(jasmine.any(BleOperationError));
        expect((error as BleOperationError).code)
          .toBe('connection-interrupted');
      }
      expect(disconnectSpy).not.toHaveBeenCalled();
      expect(service.connectedDeviceId).toBeNull();
      expect(service.connectionGeneration).toBe(1);
    },
  );

  it('should connect after an interrupted connection attempt', async () => {
    let onDisconnect: ((deviceId: string) => void) | undefined;
    connectSpy.and.callFake(async (_deviceId, callback) => {
      onDisconnect = callback;
      onDisconnect?.('device-1');
    });

    await expectAsync(service.connect('device-1')).toBeRejected();
    connectSpy.and.callFake(async () => undefined);
    await service.connect('device-1');

    expect(service.connectedDeviceId).toBe('device-1');
    expect(service.connectionGeneration).toBe(2);
  });

  it('should recover after multiple connection failures', async () => {
    let attempts = 0;
    connectSpy.and.callFake(async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('Connection failed');
      }
      if (attempts === 2) {
        throw new Error('Connection timeout.');
      }
    });

    await expectAsync(service.connect('device-1')).toBeRejected();
    await expectAsync(service.connect('device-1')).toBeRejected();
    await service.connect('device-1');

    expect(service.connectedDeviceId).toBe('device-1');
    expect(service.connectionGeneration).toBe(3);
    expect(BleClient.disconnect).toHaveBeenCalledTimes(2);
  });

  it('should ignore an old disconnect callback after a successful reconnect',
    async () => {
      let oldDisconnect!: (deviceId: string) => void;
      let newDisconnect!: (deviceId: string) => void;
      const firstError = new Error('Connection failed');
      connectSpy.and.callFake(async (_deviceId, callback) => {
        if (callback === undefined) {
          fail('connect should register a disconnect callback');
          return;
        }
        oldDisconnect = callback;
        throw firstError;
      });

      await expectAsync(service.connect('device-1')).toBeRejected();
      connectSpy.and.callFake(async (_deviceId, callback) => {
        if (callback === undefined) {
          fail('connect should register a disconnect callback');
          return;
        }
        newDisconnect = callback;
      });
      await service.connect('device-1');
      const generation = service.connectionGeneration;

      oldDisconnect('device-1');

      expect(service.connectedDeviceId).toBe('device-1');
      expect(service.connectionGeneration).toBe(generation);

      newDisconnect('device-1');
      expect(service.connectedDeviceId).toBeNull();
      expect(service.connectionGeneration).toBe(generation + 1);
    },
  );

  it('should reconnect after a voluntary disconnect', async () => {
    await service.connect('device-1');
    await service.disconnect();
    await service.connect('device-1');

    expect(service.connectedDeviceId).toBe('device-1');
    expect(service.connectionGeneration).toBe(3);
  });

  it('should reconnect after an active remote disconnect', async () => {
    let onDisconnect: ((deviceId: string) => void) | undefined;
    connectSpy.and.callFake(async (_deviceId, callback) => {
      onDisconnect = callback;
    });

    await service.connect('device-1');
    onDisconnect?.('device-1');
    await service.connect('device-1');

    expect(service.connectedDeviceId).toBe('device-1');
    expect(service.connectionGeneration).toBe(3);
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

  it('should treat a remote callback during local disconnection as disconnected even when native disconnect rejects',
    async () => {
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
        throw new Error('Native disconnect failed after remote disconnect.');
      });

      await service.disconnect();

      expect(service.connectedDeviceId).toBeNull();
      expect(service.connectionGeneration).toBe(2);
      expect(events).toEqual([
        { deviceId: 'device-1', reason: 'local' },
      ]);
    },
  );

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
            descriptors: [{ uuid: 'descriptor-1' }],
          },
        ],
      },
    ];
    const getServicesSpy = BleClient.getServices as jasmine.Spy<
      typeof BleClient.getServices
    >;
    getServicesSpy.and.resolveTo(services);
    await service.connect('device-1');
    const generation = service.connectionGeneration;

    const result = await service.discoverServices();

    expect(getServicesSpy).toHaveBeenCalledOnceWith('device-1');
    expect(result).toEqual(services);
    expect(result).not.toBe(services);
    expect(result[0]).not.toBe(services[0]);
    expect(result[0].characteristics[0]).not.toBe(
      services[0].characteristics[0],
    );
    expect(result[0].characteristics[0].properties).not.toBe(
      services[0].characteristics[0].properties,
    );
    expect(result[0].characteristics[0].descriptors[0]).not.toBe(
      services[0].characteristics[0].descriptors[0],
    );
    expect(service.getGattCharacteristicAvailability(
      'SERVICE-1',
      'CHARACTERISTIC-1',
    )).toBe('available');
    expect(service.connectionGeneration).toBe(generation);
  });

  it('should report precise GATT characteristic availability', async () => {
    expect(service.getGattCharacteristicAvailability(
      'service-1',
      'characteristic-1',
    )).toBe('services-not-discovered');
    await service.connect('device-1');
    const getServicesSpy = BleClient.getServices as jasmine.Spy<
      typeof BleClient.getServices
    >;
    getServicesSpy.and.resolveTo([
      {
        uuid: 'service-1',
        characteristics: [
          {
            uuid: 'characteristic-1',
            properties: createCharacteristicProperties(),
            descriptors: [],
          },
        ],
      },
    ]);
    await service.discoverServices();

    expect(service.getGattCharacteristicAvailability(
      'missing-service',
      'characteristic-1',
    )).toBe('service-absent');
    expect(service.getGattCharacteristicAvailability(
      'service-1',
      'missing-characteristic',
    )).toBe('characteristic-absent');
    expect(service.getGattCharacteristicAvailability(
      'service-1',
      'characteristic-1',
    )).toBe('not-readable');
  });

  it('should expose a defensive passive copy of cached GATT properties',
    async () => {
      const getServicesSpy = BleClient.getServices as jasmine.Spy<
        typeof BleClient.getServices
      >;
      getServicesSpy.and.resolveTo([{
        uuid: ' SERVICE-1 ',
        characteristics: [{
          uuid: ' CHARACTERISTIC-1 ',
          properties: createCharacteristicProperties({
            indicate: true,
            notify: true,
            read: true,
            reliableWrite: true,
            writeWithoutResponse: true,
          }),
          descriptors: [
            { uuid: 'descriptor-1' },
            { uuid: 'descriptor-2' },
          ],
        }],
      }]);
      await service.connect('device-1');
      await service.discoverServices();

      const result = service.getGattCharacteristicProperties(
        'service-1',
        'characteristic-1',
      );

      expect(result).toEqual(jasmine.objectContaining({
        serviceUuid: 'service-1',
        characteristicUuid: 'characteristic-1',
        servicePresent: true,
        characteristicPresent: true,
        propertiesAvailable: true,
        read: true,
        write: false,
        writeWithoutResponse: true,
        notify: true,
        indicate: true,
        descriptorUuids: ['descriptor-1', 'descriptor-2'],
      }));
      expect(result.rawProperties['reliableWrite']).toBeTrue();

      (result.descriptorUuids as string[]).push('mutated');
      (result.rawProperties as Record<string, boolean>)['read'] = false;
      const second = service.getGattCharacteristicProperties(
        'SERVICE-1',
        'CHARACTERISTIC-1',
      );
      expect(second.descriptorUuids).toEqual(['descriptor-1', 'descriptor-2']);
      expect(second.read).toBeTrue();
      expect(BleClient.read).not.toHaveBeenCalled();
      expect(BleClient.write).not.toHaveBeenCalled();
      expect(BleClient.writeWithoutResponse).not.toHaveBeenCalled();
      expect(BleClient.startNotifications).not.toHaveBeenCalled();
      expect(BleClient.stopNotifications).not.toHaveBeenCalled();
    },
  );

  it('should distinguish absent GATT members and unavailable properties',
    async () => {
      const getServicesSpy = BleClient.getServices as jasmine.Spy<
        typeof BleClient.getServices
      >;
      getServicesSpy.and.resolveTo([{
        uuid: 'service-1',
        characteristics: [{
          uuid: 'characteristic-1',
          properties: {} as DiscoveredBleService[
            'characteristics'
          ][number]['properties'],
          descriptors: [],
        }],
      }]);
      await service.connect('device-1');
      await service.discoverServices();

      expect(service.getGattCharacteristicProperties(
        'missing',
        'characteristic-1',
      )).toEqual(jasmine.objectContaining({
        servicePresent: false,
        characteristicPresent: false,
      }));
      expect(service.getGattCharacteristicProperties(
        'service-1',
        'missing',
      )).toEqual(jasmine.objectContaining({
        servicePresent: true,
        characteristicPresent: false,
      }));
      expect(service.getGattCharacteristicProperties(
        'service-1',
        'characteristic-1',
      )).toEqual(jasmine.objectContaining({
        servicePresent: true,
        characteristicPresent: true,
        propertiesAvailable: false,
        read: null,
        notify: null,
      }));
    },
  );

  it('should reject an empty or stale-device GATT cache', async () => {
    expect(service.getGattCharacteristicProperties(
      'service-1',
      'characteristic-1',
    )).toEqual(jasmine.objectContaining({
      servicePresent: false,
      characteristicPresent: false,
      propertiesAvailable: false,
    }));

    const getServicesSpy = BleClient.getServices as jasmine.Spy<
      typeof BleClient.getServices
    >;
    getServicesSpy.and.resolveTo([{
      uuid: 'service-1',
      characteristics: [{
        uuid: 'characteristic-1',
        properties: createCharacteristicProperties({ read: true }),
        descriptors: [],
      }],
    }]);
    await service.connect('device-1');
    await service.discoverServices();

    expect(service.getGattCharacteristicProperties(
      'service-1',
      'characteristic-1',
      'device-2',
    )).toEqual(jasmine.objectContaining({
      servicePresent: false,
      characteristicPresent: false,
      propertiesAvailable: false,
      read: null,
    }));
  });

  it('should reject stale service discovery after reconnecting the same device',
    async () => {
      let onDisconnect: ((deviceId: string) => void) | undefined;
      connectSpy.and.callFake(async (_deviceId, callback) => {
        onDisconnect = callback;
      });
      let releaseServices!: (services: DiscoveredBleService[]) => void;
      const getServicesSpy = BleClient.getServices as jasmine.Spy<
        typeof BleClient.getServices
      >;
      getServicesSpy.and.returnValue(
        new Promise<DiscoveredBleService[]>((resolve) => {
          releaseServices = resolve;
        }),
      );
      await service.connect('device-1');

      const discovery = service.discoverServices();
      onDisconnect?.('device-1');
      await service.connect('device-1');
      releaseServices([]);

      await expectAsync(discovery).toBeRejectedWithError(
        'The BLE device disconnected during service discovery.',
      );
      expect(service.getGattCharacteristicAvailability(
        'service-1',
        'characteristic-1',
      )).toBe('services-not-discovered');
    },
  );

  it('should match complete normalized GATT UUIDs only', async () => {
    const getServicesSpy = BleClient.getServices as jasmine.Spy<
      typeof BleClient.getServices
    >;
    getServicesSpy.and.resolveTo([
      {
        uuid: 'service-10',
        characteristics: [
          {
            uuid: 'characteristic-1',
            properties: createCharacteristicProperties({ read: true }),
            descriptors: [],
          },
        ],
      },
      {
        uuid: ' SERVICE-1 ',
        characteristics: [
          {
            uuid: 'characteristic-10',
            properties: createCharacteristicProperties({ read: true }),
            descriptors: [],
          },
          {
            uuid: ' CHARACTERISTIC-1 ',
            properties: createCharacteristicProperties({ read: true }),
            descriptors: [],
          },
        ],
      },
    ]);
    await service.connect('device-1');
    await service.discoverServices();

    expect(service.getGattCharacteristicAvailability(
      'service-1',
      'characteristic-1',
    )).toBe('available');
    expect(service.getGattCharacteristicAvailability(
      'service-1',
      'characteristic',
    )).toBe('characteristic-absent');
  });

  it('should clear GATT discovery when the service is destroyed', async () => {
    const getServicesSpy = BleClient.getServices as jasmine.Spy<
      typeof BleClient.getServices
    >;
    getServicesSpy.and.resolveTo([
      {
        uuid: 'service-1',
        characteristics: [],
      },
    ]);
    await service.connect('device-1');
    await service.discoverServices();
    const generation = service.connectionGeneration;

    service.ngOnDestroy();

    expect(service.connectionGeneration).toBe(generation + 1);
    expect(service.getGattCharacteristicAvailability(
      'service-1',
      'characteristic-1',
    )).toBe('services-not-discovered');
  });

  it('should clear GATT discovery and advance generation on disconnection',
    async () => {
      const getServicesSpy = BleClient.getServices as jasmine.Spy<
        typeof BleClient.getServices
      >;
      getServicesSpy.and.resolveTo([
        {
          uuid: 'service-1',
          characteristics: [],
        },
      ]);
      await service.connect('device-1');
      await service.discoverServices();

      await service.disconnect();

      expect(service.connectionGeneration).toBe(2);
      expect(service.getGattCharacteristicAvailability(
        'service-1',
        'characteristic-1',
        'device-1',
      )).toBe('services-not-discovered');
    },
  );

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
      jasmine.any(Function),
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

  it('should publish notification metadata without changing the callback',
    async () => {
      const callback = jasmine.createSpy<(value: DataView) => void>(
        'notification',
      );
      const observer = jasmine.createSpy('observer');
      service.notifications$.subscribe(observer);
      await service.connect('device-1');
      await service.startNotifications(
        'service-uuid',
        'characteristic-uuid',
        callback,
      );
      const nativeCallback =
        (BleClient.startNotifications as jasmine.Spy)
          .calls.mostRecent().args[3] as (value: DataView) => void;
      const value = new DataView(Uint8Array.from([1, 2, 3]).buffer);

      nativeCallback(value);

      expect(callback).toHaveBeenCalledOnceWith(value);
      expect(observer).toHaveBeenCalledTimes(1);
      expect(observer.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
        deviceId: 'device-1',
        serviceUuid: 'service-uuid',
        characteristicUuid: 'characteristic-uuid',
        sequence: 1,
        value,
      }));
      expect(observer.calls.mostRecent().args[0].receivedAt)
        .toEqual(jasmine.any(Number));
      expect(service.lastNotificationSequence).toBe(1);
    },
  );

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
