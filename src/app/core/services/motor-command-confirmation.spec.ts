import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';

import {
  BleDisconnectionEvent,
  BleNotificationEvent,
  BleService,
} from './ble';
import { BLE_UUIDS } from './ble-profile-catalog';
import {
  MotorCommandConfirmation,
  MotorCommandConfirmationService,
} from './motor-command-confirmation';

describe('MotorCommandConfirmationService', () => {
  let service: MotorCommandConfirmationService;
  let notifications: Subject<BleNotificationEvent>;
  let disconnections: Subject<BleDisconnectionEvent>;
  let fakeBleService: {
    connectedDeviceId: string | null;
    lastNotificationSequence: number;
    notifications$: Subject<BleNotificationEvent>;
    disconnections$: Subject<BleDisconnectionEvent>;
  };

  beforeEach(() => {
    notifications = new Subject<BleNotificationEvent>();
    disconnections = new Subject<BleDisconnectionEvent>();
    fakeBleService = {
      connectedDeviceId: 'device-1',
      lastNotificationSequence: 10,
      notifications$: notifications,
      disconnections$: disconnections,
    };
    TestBed.configureTestingModule({
      providers: [
        MotorCommandConfirmationService,
        { provide: BleService, useValue: fakeBleService },
      ],
    });
    service = TestBed.inject(MotorCommandConfirmationService);
  });

  it('should observe and buffer a synchronous notification during write',
    async () => {
      const result = await execute(async () => {
        notifications.next(notification(11, 1_000, 101, 500));
      });

      expect(result.status).toBe('confirmed');
      expect(result.notification?.currentPosition).toBe(101);
    },
  );

  it('should buffer a notification immediately before write resolves',
    async () => {
      let resolveWrite!: () => void;
      const write = new Promise<void>((resolve) => resolveWrite = resolve);
      const confirmation = execute(() => write);

      notifications.next(notification(11, 1_001, 102, 500));
      resolveWrite();

      expect((await confirmation).status).toBe('confirmed');
    },
  );

  it('should confirm a notification emitted after write resolves', async () => {
    const confirmation = execute(async () => undefined);
    await Promise.resolve();

    notifications.next(notification(11, 1_001, 103, 500));

    expect((await confirmation).status).toBe('confirmed');
  });

  it('should ignore a replayed event from before the send boundary',
    fakeAsync(() => {
      let result: MotorCommandConfirmation | undefined;
      void execute(async () => {
        notifications.next(notification(10, 2_000, 101, 500));
      }).then((value) => result = value);
      tick(10);

      expect(result?.status).toBe('timeout');
    }),
  );

  it('should use sequence when timestamps are identical', fakeAsync(() => {
    let result: MotorCommandConfirmation | undefined;
    void execute(async () => {
      notifications.next(notification(10, 1_000, 101, 500));
      notifications.next(notification(11, 1_000, 102, 500));
    }).then((value) => result = value);
    tick();

    expect(result?.status).toBe('confirmed');
    expect(result?.notification?.currentPosition).toBe(102);
  }));

  it('should ignore unchanged, decreasing, incomplete, or invalid positions',
    fakeAsync(() => {
      let result: MotorCommandConfirmation | undefined;
      void execute(async () => {
        notifications.next(notification(11, 1_001, 100, 500));
        notifications.next(notification(12, 1_002, 99, 500));
        notifications.next(notification(13, 1_003, 101, 0));
        notifications.next({
          ...notification(14, 1_004, 101, 500),
          value: frame([3, 0x00]),
        });
      }).then((value) => result = value);
      tick(10);

      expect(result?.status).toBe('timeout');
    }),
  );

  it('should cancel observation immediately after a write error', async () => {
    const result = await execute(async () => {
      throw new Error('Native write failed');
    });

    expect(result.status).toBe('failed');
    expect(result.failureReason).toBe('Native write failed');
    expect(notifications.observed).toBeFalse();
    expect(disconnections.observed).toBeFalse();
  });

  it('should deterministically resolve disconnected during write', async () => {
    let resolveWrite!: () => void;
    const write = new Promise<void>((resolve) => resolveWrite = resolve);
    const confirmation = execute(() => write);

    disconnections.next({ deviceId: 'device-1', reason: 'remote' });
    resolveWrite();

    expect((await confirmation).status).toBe('disconnected');
  });

  it('should not overwrite disconnection with a concurrent write error',
    async () => {
      let rejectWrite!: (error: Error) => void;
      const write = new Promise<void>((_resolve, reject) => {
        rejectWrite = reject;
      });
      const confirmation = execute(() => write);

      disconnections.next({ deviceId: 'device-1', reason: 'remote' });
      rejectWrite(new Error('Disconnected native write'));

      const result = await confirmation;
      expect(result.status).toBe('disconnected');
      expect(result.failureReason).toBe('The BLE device disconnected.');
      expect(notifications.observed).toBeFalse();
      expect(disconnections.observed).toBeFalse();
    },
  );

  it('should resolve disconnected while awaiting a notification', async () => {
    const confirmation = execute(async () => undefined);
    await Promise.resolve();

    disconnections.next({ deviceId: 'device-1', reason: 'remote' });

    expect((await confirmation).status).toBe('disconnected');
    expect(notifications.observed).toBeFalse();
    expect(disconnections.observed).toBeFalse();
  });

  it('should reject a second observer without invoking its write', async () => {
    let resolveFirst!: () => void;
    const first = execute(() => new Promise<void>(
      (resolve) => resolveFirst = resolve,
    ));
    const secondWrite = jasmine.createSpy('secondWrite').and.resolveTo();

    const second = await service.executeWithMotorCommandConfirmation(
      request(),
      secondWrite,
    );

    expect(second.status).toBe('failed');
    expect(secondWrite).not.toHaveBeenCalled();
    disconnections.next({ deviceId: 'device-1', reason: 'remote' });
    resolveFirst();
    await first;
  });

  it('should release its observer lock after every terminal status',
    fakeAsync(() => {
      const statuses: string[] = [];
      void execute(async () => {
        notifications.next(notification(11, 1_001, 101, 500));
      }).then((result) => statuses.push(result.status));
      tick();

      fakeBleService.lastNotificationSequence = 11;
      void execute(async () => undefined)
        .then((result) => statuses.push(result.status));
      tick(10);

      void execute(async () => {
        throw new Error('failed');
      }).then((result) => statuses.push(result.status));
      tick();

      void execute(async () => undefined)
        .then((result) => statuses.push(result.status));
      tick();
      disconnections.next({ deviceId: 'device-1', reason: 'remote' });
      tick();

      expect(statuses).toEqual([
        'confirmed',
        'timeout',
        'failed',
        'disconnected',
      ]);
      expect(notifications.observed).toBeFalse();
      expect(disconnections.observed).toBeFalse();
    }),
  );

  it('should reject unsafe profiles and an already-open baseline before write',
    async () => {
      for (const profile of ['unknown', 'ambiguous'] as const) {
        const write = jasmine.createSpy('write').and.resolveTo();
        const result = await service.executeWithMotorCommandConfirmation(
          request({ profile }),
          write,
        );
        expect(result.status).toBe('failed');
        expect(write).not.toHaveBeenCalled();
      }

      const write = jasmine.createSpy('openWrite').and.resolveTo();
      const result = await service.executeWithMotorCommandConfirmation(
        request({
          baselinePosition: 500,
          baselineMaximumPosition: 500,
        }),
        write,
      );
      expect(result.status).toBe('failed');
      expect(result.failureReason).toContain('fully open');
      expect(write).not.toHaveBeenCalled();
    },
  );

  function execute(write: () => Promise<void>) {
    return service.executeWithMotorCommandConfirmation(request(), write);
  }
});

function request(overrides: Partial<{
  profile: 'widoor' | 'unknown' | 'ambiguous';
  baselinePosition: number;
  baselineMaximumPosition: number;
}> = {}) {
  return {
    profile: overrides.profile ?? 'widoor',
    command: 'OPEN' as const,
    baselinePosition: overrides.baselinePosition ?? 100,
    baselineMaximumPosition: overrides.baselineMaximumPosition,
    deviceId: 'device-1',
    timeoutMs: 10,
  };
}

function notification(
  sequence: number,
  receivedAt: number,
  position: number,
  maximum: number,
): BleNotificationEvent {
  return {
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid: BLE_UUIDS.motorStateCharacteristic,
    sequence,
    receivedAt,
    value: frame([
      3,
      position >> 8,
      position & 0xff,
      maximum >> 8,
      maximum & 0xff,
      0,
      0,
    ]),
  };
}

function frame(bytes: readonly number[]): DataView {
  return new DataView(Uint8Array.from(bytes).buffer);
}
