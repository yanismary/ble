import { TestBed } from '@angular/core/testing';
import { BleClient } from '@capacitor-community/bluetooth-le';

import { BLE_UUIDS, ProductProfile } from './ble-profile-catalog';
import {
  BleDatesAndCycles,
  BleDecodeResult,
  BleMaintenance,
  BleProfessionalParameters,
  BleUserParameters,
  BleVersionFrame,
  decodeBleDatesAndCycles,
  decodeBleMaintenance,
  decodeBleProfessionalParameters,
  decodeBleUserParameters,
  decodeBleVersion,
} from './ble-read-decoders';
import {
  BleReadError,
  BleReadService,
  BleReadStatus,
  BleReadType,
  BleTypedReadResult,
} from './ble-read.service';
import { BleService } from './ble';
import {
  KnownProductProfile,
  ProductDataLoadOptions,
  ProductDataLoadStep,
  ProductDataLoadService,
} from './product-data-load.service';

describe('ProductDataLoadService', () => {
  let service: ProductDataLoadService;
  let connection: FakeBleConnection;
  let readService: BleReadService;
  let versionSpy: jasmine.Spy<BleReadService['readVersion']>;
  let datesSpy: jasmine.Spy<BleReadService['readDatesAndCycles']>;
  let maintenanceSpy: jasmine.Spy<BleReadService['readMaintenance']>;
  let userSpy: jasmine.Spy<BleReadService['readUserParameters']>;
  let professionalSpy: jasmine.Spy<
    BleReadService['readProfessionalParameters']
  >;
  let callOrder: ProductDataLoadStep[];

  beforeEach(() => {
    connection = new FakeBleConnection();
    TestBed.configureTestingModule({
      providers: [
        { provide: BleService, useValue: connection },
      ],
    });
    readService = TestBed.inject(BleReadService);
    callOrder = [];
    versionSpy = spyOn(readService, 'readVersion').and.callFake(
      async (profile, deviceId) => {
        callOrder.push('version');
        return versionResult(profile, deviceId);
      },
    );
    datesSpy = spyOn(readService, 'readDatesAndCycles').and.callFake(
      async (profile, deviceId) => {
        callOrder.push('datesAndCycles');
        return datesResult(profile, deviceId);
      },
    );
    maintenanceSpy = spyOn(readService, 'readMaintenance').and.callFake(
      async (profile, deviceId) => {
        callOrder.push('maintenance');
        return maintenanceResult(profile, deviceId);
      },
    );
    userSpy = spyOn(readService, 'readUserParameters').and.callFake(
      async (profile, deviceId) => {
        callOrder.push('userParameters');
        return userResult(profile, deviceId);
      },
    );
    professionalSpy = spyOn(
      readService,
      'readProfessionalParameters',
    ).and.callFake(async (profile, deviceId) => {
      callOrder.push('professionalParameters');
      return professionalResult(profile, deviceId);
    });
    spyOn(BleClient, 'write').and.resolveTo();
    spyOn(BleClient, 'writeWithoutResponse').and.resolveTo();
    service = TestBed.inject(ProductDataLoadService);
  });

  it('should load all five reads in their exact sequential order', async () => {
    const result = await service.loadProductData('widoor');

    expect(result.status).toBe('success');
    expect(callOrder).toEqual([
      'version',
      'datesAndCycles',
      'maintenance',
      'userParameters',
      'professionalParameters',
    ]);
    expect(result.executedOrder).toEqual(callOrder);
    expect(result.notRequested).toEqual([]);
  });

  it('should never execute two reads in parallel', async () => {
    const pending = controlledResult<BleVersionFrame>();
    versionSpy.and.returnValue(pending.promise);

    const load = service.loadProductData('widoor');
    await Promise.resolve();

    expect(versionSpy).toHaveBeenCalledTimes(1);
    expect(datesSpy).not.toHaveBeenCalled();

    pending.resolve(versionResult('widoor'));
    await load;
    expect(callOrder).toEqual([
      'datesAndCycles',
      'maintenance',
      'userParameters',
      'professionalParameters',
    ]);
  });

  it('should continue after unavailable and preserve partial success',
    async () => {
      datesSpy.and.resolveTo(withStatus(
        datesResult('widoor', 'device-1'),
        'unavailable',
      ));

      const result = await service.loadProductData('widoor');

      expect(result.status).toBe('partial-success');
      expect(result.partialSuccess).toBeTrue();
      expect(result.results.datesAndCycles?.status).toBe('unavailable');
      expect(result.results.maintenance?.status).toBe('success');
      expect(result.unavailable).toEqual(['datesAndCycles']);
      expect(callOrder).toContain('professionalParameters');
    },
  );

  it('should continue after invalid-frame', async () => {
    userSpy.and.resolveTo(withStatus(
      userResult('garline', 'device-1'),
      'invalid-frame',
    ));

    const result = await service.loadProductData('garline');

    expect(result.status).toBe('partial-success');
    expect(result.results.userParameters?.status).toBe('invalid-frame');
    expect(result.results.userParameters?.decoded?.valid).toBeFalse();
    expect(professionalSpy).toHaveBeenCalledTimes(1);
  });

  it('should continue after an isolated native failure', async () => {
    maintenanceSpy.and.resolveTo(withStatus(
      maintenanceResult('moventiv-60', 'device-1'),
      'failed',
    ));

    const result = await service.loadProductData('moventiv-60');

    expect(result.status).toBe('partial-success');
    expect(result.results.maintenance?.error?.code)
      .toBe('native-read-failed');
    expect(userSpy).toHaveBeenCalledTimes(1);
  });

  it('should produce partial success after several failures then a success',
    async () => {
      versionSpy.and.resolveTo(withStatus(
        versionResult('widoor', 'device-1'),
        'failed',
      ));
      datesSpy.and.resolveTo(withStatus(
        datesResult('widoor', 'device-1'),
        'invalid-frame',
      ));

      const result = await service.loadProductData('widoor', undefined, {
        version: true,
        datesAndCycles: true,
        maintenance: true,
        userParameters: false,
        professionalParameters: false,
      });

      expect(result.status).toBe('partial-success');
      expect(result.results.version?.status).toBe('failed');
      expect(result.results.datesAndCycles?.status).toBe('invalid-frame');
      expect(result.results.maintenance?.status).toBe('success');
      expect(result.executedOrder).toEqual([
        'version',
        'datesAndCycles',
        'maintenance',
      ]);
      expect(versionSpy).toHaveBeenCalledTimes(1);
      expect(datesSpy).toHaveBeenCalledTimes(1);
      expect(maintenanceSpy).toHaveBeenCalledTimes(1);
    },
  );

  it('should report failed when no requested read succeeds', async () => {
    versionSpy.and.resolveTo(withStatus(
      versionResult('widoor', 'device-1'),
      'invalid-frame',
    ));
    datesSpy.and.resolveTo(withStatus(
      datesResult('widoor', 'device-1'),
      'unavailable',
    ));

    const result = await service.loadProductData('widoor', undefined, {
      version: true,
      datesAndCycles: true,
      maintenance: false,
      userParameters: false,
      professionalParameters: false,
    });

    expect(result.status).toBe('failed');
    expect(result.partialSuccess).toBeFalse();
    expect(result.error?.code).toBe('no-read-succeeded');
    expect(result.results.version?.decoded?.value).toBeNull();
    expect(result.results.datesAndCycles?.decoded).toBeNull();
  });

  (['invalid-frame', 'unavailable'] as const).forEach((status) => {
    it(`should report failed when every read is ${status}`, async () => {
      versionSpy.and.resolveTo(withStatus(
        versionResult('widoor', 'device-1'),
        status,
      ));
      datesSpy.and.resolveTo(withStatus(
        datesResult('widoor', 'device-1'),
        status,
      ));

      const result = await service.loadProductData('widoor', undefined, {
        version: true,
        datesAndCycles: true,
        maintenance: false,
        userParameters: false,
        professionalParameters: false,
      });

      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('no-read-succeeded');
      expect(result.partialSuccess).toBeFalse();
    });
  });

  it('should execute only selected reads and list the others', async () => {
    const result = await service.loadProductData('moventiv-80', undefined, {
      version: true,
      datesAndCycles: false,
      maintenance: true,
      userParameters: false,
      professionalParameters: false,
    });

    expect(result.status).toBe('success');
    expect(callOrder).toEqual(['version', 'maintenance']);
    expect(result.executedOrder).toEqual(['version', 'maintenance']);
    expect(result.notRequested).toEqual([
      'datesAndCycles',
      'userParameters',
      'professionalParameters',
    ]);
    expect(result.results.datesAndCycles).toBeUndefined();
  });

  const selectedOrderCases: readonly {
    readonly options: ProductDataLoadOptions;
    readonly expected: readonly ProductDataLoadStep[];
  }[] = [
    {
      options: {
        version: false,
        datesAndCycles: false,
        maintenance: false,
        userParameters: true,
        professionalParameters: true,
      },
      expected: ['userParameters', 'professionalParameters'],
    },
    {
      options: {
        version: false,
        datesAndCycles: false,
        maintenance: false,
        userParameters: false,
        professionalParameters: true,
      },
      expected: ['professionalParameters'],
    },
  ];

  selectedOrderCases.forEach(({ options, expected }) => {
    it(`should preserve relative order for ${expected.join(', ')}`, async () => {
      const result = await service.loadProductData(
        'widoor',
        undefined,
        options,
      );

      expect(result.status).toBe('success');
      expect(result.executedOrder).toEqual(expected);
      expect(callOrder).toEqual(expected);
    });
  });

  it('should reject an empty selection without starting a read', async () => {
    const result = await service.loadProductData('widoor', undefined, {
      version: false,
      datesAndCycles: false,
      maintenance: false,
      userParameters: false,
      professionalParameters: false,
    });

    expect(result.status).toBe('failed');
    expect(result.error?.code).toBe('no-reads-requested');
    expect(callOrder).toEqual([]);
    expect(service.isLoading).toBeFalse();
  });

  ['unknown', 'ambiguous'].forEach((profile) => {
    it(`should reject the runtime ${profile} profile`, async () => {
      const result = await service.loadProductData(
        profile as KnownProductProfile,
      );

      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('profile-not-readable');
      expect(callOrder).toEqual([]);
    });
  });

  it('should reject a future unknown profile at runtime', async () => {
    const result = await service.loadProductData(
      'future-profile' as KnownProductProfile,
    );

    expect(result.status).toBe('failed');
    expect(result.error?.code).toBe('profile-not-readable');
    expect(callOrder).toEqual([]);
  });

  it('should reject an unknown option key at runtime', async () => {
    const result = await service.loadProductData(
      'widoor',
      undefined,
      { version: true, futureRead: true } as ProductDataLoadOptions,
    );

    expect(result.status).toBe('failed');
    expect(result.error?.code).toBe('invalid-options');
    expect(callOrder).toEqual([]);
  });

  it('should reject a non-boolean option value at runtime', async () => {
    const result = await service.loadProductData(
      'widoor',
      undefined,
      { version: 'false' } as unknown as ProductDataLoadOptions,
    );

    expect(result.status).toBe('failed');
    expect(result.error?.code).toBe('invalid-options');
    expect(callOrder).toEqual([]);
  });

  it('should refuse a load after service destruction', async () => {
    service.ngOnDestroy();

    const result = await service.loadProductData('widoor');

    expect(result.status).toBe('cancelled');
    expect(result.error?.code).toBe('service-destroyed');
    expect(result.completedAt).toBeGreaterThanOrEqual(result.startedAt);
    expect(callOrder).toEqual([]);
    expect(service.isLoading).toBeFalse();
  });

  it('should report no connection before the first read', async () => {
    connection.connectedDeviceId = null;

    const result = await service.loadProductData('widoor');

    expect(result.status).toBe('disconnected');
    expect(result.error?.code).toBe('not-connected');
    expect(callOrder).toEqual([]);
  });

  it('should reject a mismatched requested device', async () => {
    const result = await service.loadProductData('widoor', 'device-2');

    expect(result.status).toBe('failed');
    expect(result.error?.code).toBe('wrong-device');
    expect(callOrder).toEqual([]);
  });

  it('should stop before the first read after an immediate disconnection',
    async () => {
      const load = service.loadProductData('widoor');
      connection.connectedDeviceId = null;

      const result = await load;

      expect(result.status).toBe('disconnected');
      expect(callOrder).toEqual([]);
      expect(service.isLoading).toBeFalse();
    },
  );

  it('should ignore a pending result after disconnection', async () => {
    const pending = controlledResult<BleVersionFrame>();
    versionSpy.and.returnValue(pending.promise);
    const load = service.loadProductData('widoor');
    await Promise.resolve();
    connection.connectedDeviceId = null;
    pending.resolve(versionResult('widoor', 'device-1'));

    const result = await load;

    expect(result.status).toBe('disconnected');
    expect(result.results.version).toBeUndefined();
    expect(datesSpy).not.toHaveBeenCalled();
    expect(service.isLoading).toBeFalse();
  });

  it('should ignore a late failed result after disconnection', async () => {
    const pending = controlledResult<BleVersionFrame>();
    versionSpy.and.returnValue(pending.promise);
    const load = service.loadProductData('widoor');
    await Promise.resolve();
    connection.connectedDeviceId = null;
    pending.resolve(withStatus(
      versionResult('widoor', 'device-1'),
      'failed',
    ));

    const result = await load;

    expect(result.status).toBe('disconnected');
    expect(result.results.version).toBeUndefined();
    expect(datesSpy).not.toHaveBeenCalled();
  });

  it('should retain earlier successes when a later read is interrupted',
    async () => {
      const pending = controlledResult<BleDatesAndCycles>();
      datesSpy.and.returnValue(pending.promise);
      const load = service.loadProductData('widoor');
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      expect(datesSpy).toHaveBeenCalledTimes(1);

      connection.connectedDeviceId = null;
      pending.resolve(datesResult('widoor', 'device-1'));
      const result = await load;

      expect(result.status).toBe('disconnected');
      expect(result.partialSuccess).toBeTrue();
      expect(result.results.version?.status).toBe('success');
      expect(result.results.datesAndCycles).toBeUndefined();
      expect(maintenanceSpy).not.toHaveBeenCalled();
    },
  );

  it('should mark another-device reconnection stale', async () => {
    const pending = controlledResult<BleVersionFrame>();
    versionSpy.and.returnValue(pending.promise);
    const load = service.loadProductData('widoor');
    await Promise.resolve();
    connection.connectedDeviceId = 'device-2';
    connection.connectionGeneration += 1;
    pending.resolve(versionResult('widoor', 'device-1'));

    const result = await load;

    expect(result.status).toBe('stale');
    expect(result.results.version).toBeUndefined();
    expect(datesSpy).not.toHaveBeenCalled();
  });

  it('should mark same-device reconnection stale', async () => {
    const pending = controlledResult<BleVersionFrame>();
    versionSpy.and.returnValue(pending.promise);
    const load = service.loadProductData('widoor');
    await Promise.resolve();
    connection.connectionGeneration += 1;
    pending.resolve(versionResult('widoor', 'device-1'));

    const result = await load;

    expect(result.status).toBe('stale');
    expect(result.connectionGeneration).toBe(7);
    expect(result.results.version).toBeUndefined();
  });

  it('should stop on an individual disconnected result', async () => {
    versionSpy.and.resolveTo(withStatus(
      versionResult('widoor', 'device-1'),
      'disconnected',
    ));

    const result = await service.loadProductData('widoor');

    expect(result.status).toBe('disconnected');
    expect(result.results.version?.status).toBe('disconnected');
    expect(datesSpy).not.toHaveBeenCalled();
  });

  it('should stop on an individual stale result', async () => {
    versionSpy.and.resolveTo(withStatus(
      versionResult('widoor', 'device-1'),
      'stale',
    ));

    const result = await service.loadProductData('widoor');

    expect(result.status).toBe('stale');
    expect(result.results.version?.status).toBe('stale');
    expect(datesSpy).not.toHaveBeenCalled();
  });

  it('should reject a second load without starting a second read', async () => {
    const pending = controlledResult<BleVersionFrame>();
    versionSpy.and.returnValue(pending.promise);
    const first = service.loadProductData('widoor');
    await Promise.resolve();

    const second = await service.loadProductData('garline');

    expect(second.status).toBe('failed');
    expect(second.error?.code).toBe('load-in-progress');
    expect(versionSpy).toHaveBeenCalledTimes(1);
    expect(service.isLoading).toBeTrue();

    pending.resolve(versionResult('widoor', 'device-1'));
    await first;
    expect(service.isLoading).toBeFalse();
  });

  it('should cancel before the first read', async () => {
    const load = service.loadProductData('widoor');

    expect(service.cancelCurrentLoad()).toBeTrue();
    expect(service.cancelCurrentLoad()).toBeFalse();
    const result = await load;

    expect(result.status).toBe('cancelled');
    expect(callOrder).toEqual([]);
    expect(service.isLoading).toBeFalse();
    expect(service.cancelCurrentLoad()).toBeFalse();
  });

  it('should ignore the active result after cancellation', async () => {
    const pending = controlledResult<BleVersionFrame>();
    versionSpy.and.returnValue(pending.promise);
    const load = service.loadProductData('widoor');
    await Promise.resolve();

    expect(service.cancelCurrentLoad()).toBeTrue();
    pending.resolve(versionResult('widoor', 'device-1'));
    const result = await load;

    expect(result.status).toBe('cancelled');
    expect(result.results.version).toBeUndefined();
    expect(datesSpy).not.toHaveBeenCalled();
    expect(service.isLoading).toBeFalse();
  });

  it('should cancel a pending load when destroyed', async () => {
    const pending = controlledResult<BleVersionFrame>();
    versionSpy.and.returnValue(pending.promise);
    const load = service.loadProductData('widoor');
    await Promise.resolve();

    service.ngOnDestroy();
    pending.resolve(versionResult('widoor', 'device-1'));
    const result = await load;

    expect(result.status).toBe('cancelled');
    expect(result.results.version).toBeUndefined();
    expect(service.isLoading).toBeFalse();
  });

  it('should preserve identity and timing metadata', async () => {
    const result = await service.loadProductData(
      'garline',
      'device-1',
      {
        version: true,
        datesAndCycles: false,
        maintenance: false,
        userParameters: false,
        professionalParameters: false,
      },
    );

    expect(result.profile).toBe('garline');
    expect(result.deviceId).toBe('device-1');
    expect(result.connectionGeneration).toBe(7);
    expect(result.completedAt).toBeGreaterThanOrEqual(result.startedAt);
    expect(result.results.version?.profile).toBe('garline');
    expect(result.results.version?.deviceId).toBe('device-1');
  });

  it('should release its lock after an unexpected orchestration error',
    async () => {
      versionSpy.and.rejectWith(new Error('Unexpected test failure'));

      const result = await service.loadProductData('widoor');

      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('orchestration-failed');
      expect(result.error?.cause).toEqual(jasmine.any(Error));
      expect(service.isLoading).toBeFalse();
    },
  );

  afterEach(() => {
    expect(BleClient.write).not.toHaveBeenCalled();
    expect(BleClient.writeWithoutResponse).not.toHaveBeenCalled();
  });
});

class FakeBleConnection {
  connectedDeviceId: string | null = 'device-1';
  connectionGeneration = 7;
  disconnectingDeviceId: string | null = null;
}

function versionResult(
  profile: ProductProfile,
  deviceId = 'device-1',
): BleTypedReadResult<BleVersionFrame> {
  return successResult(
    'version',
    profile,
    deviceId,
    BLE_UUIDS.versionCharacteristic,
    decodeBleVersion(dataView([
      0, 1, 0, 2, 0, 3, 0, 4,
      5, 6, 7, 8, 0, 0, 9, 10, 11, 12, 0x12, 0x34,
    ])),
  );
}

function datesResult(
  profile: ProductProfile,
  deviceId = 'device-1',
): BleTypedReadResult<BleDatesAndCycles> {
  return successResult(
    'dates-and-cycles',
    profile,
    deviceId,
    BLE_UUIDS.datesAndCyclesCharacteristic,
    decodeBleDatesAndCycles(dataView(new Array(17).fill(0))),
  );
}

function maintenanceResult(
  profile: ProductProfile,
  deviceId = 'device-1',
): BleTypedReadResult<BleMaintenance> {
  return successResult(
    'maintenance',
    profile,
    deviceId,
    BLE_UUIDS.maintenanceCharacteristic,
    decodeBleMaintenance(dataView(new Array(18).fill(0))),
  );
}

function userResult(
  profile: ProductProfile,
  deviceId = 'device-1',
): BleTypedReadResult<BleUserParameters> {
  return successResult(
    'user-parameters',
    profile,
    deviceId,
    BLE_UUIDS.userParametersCharacteristic,
    decodeBleUserParameters(dataView(new Array(7).fill(0))),
  );
}

function professionalResult(
  profile: ProductProfile,
  deviceId = 'device-1',
): BleTypedReadResult<BleProfessionalParameters> {
  return successResult(
    'professional-parameters',
    profile,
    deviceId,
    BLE_UUIDS.professionalParametersCharacteristic,
    decodeBleProfessionalParameters(
      profile,
      dataView(new Array(13).fill(0)),
    ),
  );
}

function successResult<T>(
  type: BleReadType,
  profile: ProductProfile,
  deviceId: string,
  characteristicUuid: string,
  decoded: BleDecodeResult<T>,
): BleTypedReadResult<T> {
  if (!decoded.valid) {
    throw new Error('The test fixture must decode successfully.');
  }

  return {
    type,
    profile,
    deviceId,
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid,
    startedAt: 1,
    completedAt: 2,
    status: 'success',
    decoded,
    error: null,
  };
}

function withStatus<T>(
  result: BleTypedReadResult<T>,
  status: Exclude<BleReadStatus, 'success'>,
): BleTypedReadResult<T> {
  const invalidFrame = status === 'invalid-frame';
  const code: BleReadError['code'] = invalidFrame
    ? 'invalid-frame'
    : status === 'failed'
      ? 'native-read-failed'
      : status === 'unavailable'
        ? 'characteristic-absent'
        : status;
  const error: BleReadError = {
    code,
    message: `Test ${status}`,
    ...(status === 'failed' ? { cause: new Error('Native test error') } : {}),
  };

  return {
    ...result,
    status,
    decoded: invalidFrame
      ? {
          valid: false,
          value: null,
          rawHex: '00',
          length: 1,
          errors: ['Invalid test frame.'],
        }
      : null,
    error,
  };
}

function controlledResult<T>(): {
  readonly promise: Promise<BleTypedReadResult<T>>;
  readonly resolve: (result: BleTypedReadResult<T>) => void;
} {
  let resolve!: (result: BleTypedReadResult<T>) => void;
  const promise = new Promise<BleTypedReadResult<T>>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function dataView(bytes: readonly number[]): DataView {
  return new DataView(Uint8Array.from(bytes).buffer);
}
