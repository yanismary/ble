import { TestBed } from '@angular/core/testing';
import {
  BleClient,
  BleService as DiscoveredBleService,
} from '@capacitor-community/bluetooth-le';

import { BLE_UUIDS, ProductProfile } from './ble-profile-catalog';
import { BleReadService } from './ble-read.service';
import { BleService } from './ble';

describe('BleReadService', () => {
  let service: BleReadService;
  let bleService: BleService;
  let connectSpy: jasmine.Spy<typeof BleClient.connect>;
  let readSpy: jasmine.Spy<typeof BleClient.read>;
  let onDisconnect: ((deviceId: string) => void) | undefined;

  beforeEach(async () => {
    TestBed.configureTestingModule({});

    spyOn(BleClient, 'initialize').and.resolveTo();
    spyOn(BleClient, 'stopLEScan').and.resolveTo();
    spyOn(BleClient, 'disconnect').and.resolveTo();
    connectSpy = spyOn(BleClient, 'connect').and.callFake(
      async (_deviceId, callback) => {
        onDisconnect = callback;
      },
    );
    spyOn(BleClient, 'getServices').and.resolveTo(
      createReadableGattServices(),
    );
    readSpy = spyOn(BleClient, 'read').and.resolveTo(dataView(versionFrame()));
    spyOn(BleClient, 'write').and.resolveTo();
    spyOn(BleClient, 'writeWithoutResponse').and.resolveTo();

    bleService = TestBed.inject(BleService);
    service = TestBed.inject(BleReadService);
  });

  it('should be created without reading automatically', () => {
    expect(service).toBeTruthy();
    expect(BleClient.read).not.toHaveBeenCalled();
    expect(BleClient.write).not.toHaveBeenCalled();
    expect(BleClient.writeWithoutResponse).not.toHaveBeenCalled();
  });

  ['widoor', 'moventiv-60', 'moventiv-80', 'garline']
    .forEach((profile) => {
      it(`should accept the known ${profile} profile`, async () => {
        await connectAndDiscover();

        const result = await service.readVersion(profile as ProductProfile);

        expect(result.status).toBe('success');
        expect(result.profile).toBe(profile);
      });
    });

  ['unknown', 'ambiguous'].forEach((profile) => {
    it(`should reject ${profile} before a native read`, async () => {
      const result = await service.readVersion(profile as ProductProfile);

      expect(result.status).toBe('unavailable');
      expect(result.error?.code).toBe('profile-not-readable');
      expect(BleClient.read).not.toHaveBeenCalled();
    });
  });

  it('should report a missing connection', async () => {
    const result = await service.readVersion('widoor');

    expect(result.status).toBe('disconnected');
    expect(result.error?.code).toBe('not-connected');
    expect(BleClient.read).not.toHaveBeenCalled();
    expect(service.isReading).toBeFalse();
  });

  it('should reject a device other than the connected device', async () => {
    await connectAndDiscover();

    const result = await service.readVersion('widoor', 'device-2');

    expect(result.status).toBe('unavailable');
    expect(result.error?.code).toBe('wrong-device');
    expect(BleClient.read).not.toHaveBeenCalled();
  });

  it('should require prior GATT discovery', async () => {
    await bleService.connect('device-1');

    const result = await service.readVersion('widoor');

    expect(result.status).toBe('unavailable');
    expect(result.error?.code).toBe('services-not-discovered');
    expect(BleClient.read).not.toHaveBeenCalled();
    expect(service.isReading).toBeFalse();
  });

  it('should reject an absent service', async () => {
    setGattServices([]);
    await connectAndDiscover();

    const result = await service.readVersion('widoor');

    expect(result.status).toBe('unavailable');
    expect(result.error?.code).toBe('service-absent');
    expect(BleClient.read).not.toHaveBeenCalled();
  });

  it('should reject an absent characteristic', async () => {
    setGattServices([{
      uuid: BLE_UUIDS.shdoService,
      characteristics: [],
    }]);
    await connectAndDiscover();

    const result = await service.readVersion('widoor');

    expect(result.status).toBe('unavailable');
    expect(result.error?.code).toBe('characteristic-absent');
    expect(BleClient.read).not.toHaveBeenCalled();
  });

  it('should reject a characteristic without the read property', async () => {
    setGattServices(createReadableGattServices(
      BLE_UUIDS.versionCharacteristic,
      false,
    ));
    await connectAndDiscover();

    const result = await service.readVersion('widoor');

    expect(result.status).toBe('unavailable');
    expect(result.error?.code).toBe('not-readable');
    expect(BleClient.read).not.toHaveBeenCalled();
  });

  it('should call the native read with normalized catalog UUIDs', async () => {
    await connectAndDiscover();

    const result = await service.readVersion('widoor');

    expect(result.status).toBe('success');
    expect(readSpy).toHaveBeenCalledOnceWith(
      'device-1',
      BLE_UUIDS.shdoService,
      BLE_UUIDS.versionCharacteristic,
    );
    expect(result.serviceUuid).toBe(BLE_UUIDS.shdoService);
    expect(result.characteristicUuid).toBe(
      BLE_UUIDS.versionCharacteristic,
    );
    expect(result.startedAt).toEqual(jasmine.any(Number));
    expect(result.completedAt).toEqual(jasmine.any(Number));
    expect(result.completedAt).toBeGreaterThanOrEqual(result.startedAt);
  });

  it('should decode the real 21-byte Widoor version frame', async () => {
    readSpy.and.resolveTo(dataView([
      0x00, 0x03, 0x00, 0x05, 0x00, 0x03, 0x01, 0x5c,
      0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
      0x01, 0x00, 0x00, 0xca, 0x00,
    ]));
    await connectAndDiscover();

    const result = await service.readVersion('widoor');

    expect(result.status).toBe('success');
    expect(result.decoded?.valid).toBeTrue();
    if (result.decoded?.valid) {
      expect(result.decoded.length).toBe(21);
      expect(result.decoded.value.motorAddressHex).toBeNull();
      expect(result.decoded.value.crc).toBe(0x00ca);
    }
  });

  it('should return invalid-frame without inventing a value', async () => {
    readSpy.and.resolveTo(dataView([1, 2, 3]));
    await connectAndDiscover();

    const result = await service.readVersion('widoor');

    expect(result.status).toBe('invalid-frame');
    expect(result.error?.code).toBe('invalid-frame');
    expect(result.decoded?.valid).toBeFalse();
    expect(result.decoded?.value).toBeNull();
    expect(service.isReading).toBeFalse();
  });

  it('should preserve a native read error as failed', async () => {
    const nativeError = new Error('Native read failed');
    readSpy.and.rejectWith(nativeError);
    await connectAndDiscover();

    const result = await service.readVersion('widoor');

    expect(result.status).toBe('failed');
    expect(result.error).toEqual(jasmine.objectContaining({
      code: 'native-read-failed',
      message: 'Native read failed',
      cause: nativeError,
    }));
    expect(result.decoded).toBeNull();
    expect(service.isReading).toBeFalse();
  });

  it('should return disconnected when the device disconnects during a read',
    async () => {
      const pending = controlledRead();
      await connectAndDiscover();

      const resultPromise = service.readVersion('widoor');
      onDisconnect?.('device-1');
      pending.resolve(dataView(versionFrame()));
      const result = await resultPromise;

      expect(result.status).toBe('disconnected');
      expect(result.error?.code).toBe('disconnected');
      expect(service.isReading).toBeFalse();
    },
  );

  it('should not let a native error overwrite a disconnection', async () => {
    const pending = controlledRead();
    await connectAndDiscover();

    const resultPromise = service.readVersion('widoor');
    onDisconnect?.('device-1');
    pending.reject(new Error('Native failure after disconnect'));
    const result = await resultPromise;

    expect(result.status).toBe('disconnected');
    expect(result.error?.code).toBe('disconnected');
  });

  it('should return disconnected while a local disconnect is still pending',
    async () => {
      const pendingRead = controlledRead();
      let releaseDisconnect!: () => void;
      const disconnectSpy = BleClient.disconnect as jasmine.Spy<
        typeof BleClient.disconnect
      >;
      disconnectSpy.and.returnValue(new Promise<void>((resolve) => {
        releaseDisconnect = resolve;
      }));
      await connectAndDiscover();

      const resultPromise = service.readVersion('widoor');
      const disconnectPromise = bleService.disconnect();
      pendingRead.resolve(dataView(versionFrame()));
      const result = await resultPromise;

      expect(result.status).toBe('disconnected');
      expect(result.error?.code).toBe('disconnected');

      releaseDisconnect();
      await disconnectPromise;
    },
  );

  it('should mark a result stale after a device change', async () => {
    const pending = controlledRead();
    await connectAndDiscover();

    const resultPromise = service.readVersion('widoor');
    onDisconnect?.('device-1');
    await bleService.connect('device-2');
    pending.resolve(dataView(versionFrame()));
    const result = await resultPromise;

    expect(result.status).toBe('stale');
    expect(result.error?.code).toBe('stale');
    expect(result.deviceId).toBe('device-1');
  });

  it('should mark a result stale after reconnecting the same device', async () => {
    const pending = controlledRead();
    await connectAndDiscover();
    const initialGeneration = bleService.connectionGeneration;

    const resultPromise = service.readVersion('widoor');
    onDisconnect?.('device-1');
    await bleService.connect('device-1');
    expect(bleService.connectionGeneration).toBeGreaterThan(initialGeneration);
    pending.resolve(dataView(versionFrame()));
    const result = await resultPromise;

    expect(result.status).toBe('stale');
  });

  it('should mark a pending result stale after service destruction', async () => {
    const pending = controlledRead();
    await connectAndDiscover();

    const resultPromise = service.readVersion('widoor');
    service.ngOnDestroy();
    pending.resolve(dataView(versionFrame()));
    const result = await resultPromise;

    expect(result.status).toBe('stale');
    expect(service.isReading).toBeFalse();
  });

  it('should reject a second simultaneous read and release the lock', async () => {
    const pending = controlledRead();
    await connectAndDiscover();

    const first = service.readVersion('widoor');
    expect(service.isReading).toBeTrue();
    const second = await service.readMaintenance('widoor');

    expect(second.status).toBe('unavailable');
    expect(second.error?.code).toBe('read-in-progress');
    expect(readSpy).toHaveBeenCalledTimes(1);

    pending.resolve(dataView(versionFrame()));
    expect((await first).status).toBe('success');
    expect(service.isReading).toBeFalse();
  });

  it('should decode dates and cycles without converting historical dates',
    async () => {
      readSpy.and.resolveTo(dataView([
        24, 1, 2,
        0xff, 0xff, 0xff, 0xff,
        23, 12, 31, 14,
        0x01, 0x02, 0x03,
        0xff, 0xff, 0xff,
      ]));
      await connectAndDiscover();

      const result = await service.readDatesAndCycles('moventiv-60');

      expectNativeCharacteristic(BLE_UUIDS.datesAndCyclesCharacteristic);
      expect(result.status).toBe('success');
      if (result.decoded?.valid) {
        expect(result.decoded.value.firstCommissioningDate.status)
          .toBe('not-initialized');
        expect(result.decoded.value.totalCycles).toBe(0x010203);
        expect(result.decoded.value.cyclesSinceMaintenance).toBe(0xffffff);
      }
    },
  );

  it('should decode maintenance counters', async () => {
    readSpy.and.resolveTo(dataView([
      0, 0, 1, 0, 0, 2, 0, 0, 3,
      0, 0, 4, 0, 0, 5, 6, 7, 8,
    ]));
    await connectAndDiscover();

    const result = await service.readMaintenance('garline');

    expectNativeCharacteristic(BLE_UUIDS.maintenanceCharacteristic);
    expect(result.status).toBe('success');
    if (result.decoded?.valid) {
      expect(result.decoded.value.initializationCount).toBe(1);
      expect(result.decoded.value.wrongStopCloseCount).toBe(5);
      expect(result.decoded.value.motorErrorCount).toBe(8);
    }
  });

  it('should decode raw user parameters without applying write conventions',
    async () => {
      readSpy.and.resolveTo(dataView([2, 10, 20, 30, 40, 0xa8, 0x02]));
      await connectAndDiscover();

      const result = await service.readUserParameters('moventiv-80');

      expectNativeCharacteristic(
        BLE_UUIDS.userParametersCharacteristic,
        BLE_UUIDS.moventivGarlineService,
      );
      expect(result.status).toBe('success');
      if (result.decoded?.valid) {
        expect(result.decoded.value.lockMode).toBe('locked-closed');
        expect(result.decoded.value.peripheralByte1).toBe(0xa8);
        expect(result.decoded.value.peripheralByte2).toBe(0x02);
      }
    },
  );

  it('should read Widoor user parameters from the Widoor service',
    async () => {
      readSpy.and.resolveTo(dataView([0, 25, 35, 1, 5, 0x08, 0x00]));
      await connectAndDiscover();

      const result = await service.readUserParameters('widoor');

      expectNativeCharacteristic(
        BLE_UUIDS.userParametersCharacteristic,
        BLE_UUIDS.widoorService,
      );
      expect(result.status).toBe('success');
      if (result.decoded?.valid) {
        expect(result.decoded.value.openSpeed).toBe(25);
        expect(result.decoded.value.shortOpenTime).toBe(1);
      }
    },
  );

  it('should read Garline user parameters from the Moventiv/Garline MLPC service',
    async () => {
      readSpy.and.resolveTo(dataView([0, 25, 35, 1, 5, 0x08, 0x00]));
      await connectAndDiscover();

      const result = await service.readUserParameters('garline');

      expectNativeCharacteristic(
        BLE_UUIDS.userParametersCharacteristic,
        BLE_UUIDS.moventivGarlineService,
      );
      expect(result.status).toBe('success');
    },
  );

  [
    { profile: 'widoor', field: 'breakForceAtOpen' },
    { profile: 'moventiv-60', field: 'exactWeight' },
    { profile: 'moventiv-80', field: 'exactWeight' },
    { profile: 'garline', field: 'exactWeight' },
  ].forEach(({ profile, field }) => {
    it(`should decode professional parameters for ${profile}`, async () => {
      readSpy.and.resolveTo(dataView([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
      ]));
      await connectAndDiscover();

      const result = await service.readProfessionalParameters(
        profile as ProductProfile,
      );

      const expectedService = profile === 'widoor'
        ? BLE_UUIDS.widoorService
        : BLE_UUIDS.moventivGarlineService;
      expectNativeCharacteristic(
        BLE_UUIDS.professionalParametersCharacteristic,
        expectedService,
      );
      expect(result.status).toBe('success');
      if (result.decoded?.valid) {
        expect(result.decoded.value.profile).toBe(profile);
        if (result.decoded.value.profile === 'widoor') {
          expect(field).toBe('breakForceAtOpen');
          expect(result.decoded.value.breakForceAtOpen).toBe(3);
        } else {
          expect(field).toBe('exactWeight');
          expect(result.decoded.value.exactWeight).toBe(3);
        }
        expect(result.decoded.value.peripheralByte1).toBe(12);
        expect(result.decoded.value.peripheralByte2).toBe(13);
      }
    });
  });

  afterEach(() => {
    expect(BleClient.write).not.toHaveBeenCalled();
    expect(BleClient.writeWithoutResponse).not.toHaveBeenCalled();
  });

  async function connectAndDiscover(): Promise<void> {
    await bleService.connect('device-1');
    await bleService.discoverServices();
  }

  function setGattServices(services: DiscoveredBleService[]): void {
    const getServicesSpy = BleClient.getServices as jasmine.Spy<
      typeof BleClient.getServices
    >;
    getServicesSpy.and.resolveTo(services);
  }

  function expectNativeCharacteristic(
    characteristicUuid: string,
    serviceUuid: string = BLE_UUIDS.shdoService,
  ): void {
    expect(readSpy).toHaveBeenCalledOnceWith(
      'device-1',
      serviceUuid,
      characteristicUuid,
    );
  }

  function controlledRead(): {
    readonly resolve: (value: DataView) => void;
    readonly reject: (reason: unknown) => void;
  } {
    let resolve!: (value: DataView) => void;
    let reject!: (reason: unknown) => void;
    readSpy.and.returnValue(new Promise<DataView>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise;
      reject = rejectPromise;
    }));
    return { resolve, reject };
  }
});

function createReadableGattServices(
  nonReadableCharacteristic?: string,
  readable = true,
): DiscoveredBleService[] {
  const shdoCharacteristicUuids = [
    BLE_UUIDS.versionCharacteristic,
    BLE_UUIDS.datesAndCyclesCharacteristic,
    BLE_UUIDS.maintenanceCharacteristic,
  ];
  const parameterCharacteristicUuids = [
    BLE_UUIDS.userParametersCharacteristic,
    BLE_UUIDS.professionalParametersCharacteristic,
  ];

  return [
    {
      uuid: BLE_UUIDS.shdoService.toUpperCase(),
      characteristics: [
        ...shdoCharacteristicUuids,
        ...parameterCharacteristicUuids,
      ].map((uuid) => ({
        uuid: uuid.toUpperCase(),
        properties: characteristicProperties({
          read: uuid === nonReadableCharacteristic ? readable : true,
        }),
        descriptors: [],
      })),
    },
    {
      uuid: BLE_UUIDS.widoorService.toUpperCase(),
      characteristics: parameterCharacteristicUuids.map((uuid) => ({
        uuid: uuid.toUpperCase(),
        properties: characteristicProperties({
          read: uuid === nonReadableCharacteristic ? readable : true,
        }),
        descriptors: [],
      })),
    },
    {
      uuid: BLE_UUIDS.moventivGarlineService.toUpperCase(),
      characteristics: parameterCharacteristicUuids.map((uuid) => ({
        uuid: uuid.toUpperCase(),
        properties: characteristicProperties({
          read: uuid === nonReadableCharacteristic ? readable : true,
        }),
        descriptors: [],
      })),
    },
  ];
}

function characteristicProperties(
  overrides: Partial<
    DiscoveredBleService['characteristics'][number]['properties']
  > = {},
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

function dataView(bytes: readonly number[]): DataView {
  return new DataView(Uint8Array.from(bytes).buffer);
}

function versionFrame(): number[] {
  return [
    0, 1, 0, 2, 0, 3, 0, 4,
    5, 6, 7, 8, 0, 0, 9, 10, 11, 12, 0x12, 0x34,
  ];
}
