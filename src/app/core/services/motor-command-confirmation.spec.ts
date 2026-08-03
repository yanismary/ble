import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';

import {
  BleDisconnectionEvent,
  BleNotificationEvent,
  BleService,
} from './ble';
import { BLE_UUIDS } from './ble-profile-catalog';
import {
  getMotorCommandConfirmationStrategy,
  MotorCommandConfirmation,
  MotorCommandConfirmationRequest,
  MotorCommandConfirmationService,
  WIDOOR_CLOSING_STARTED_STATE,
  WIDOOR_OPENING_STARTED_STATE,
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

  it('should select the confirmation strategy by profile', () => {
    expect(getMotorCommandConfirmationStrategy('widoor', 'OPEN')).toEqual({
      kind: 'widoor-opening-state',
      expectedState: WIDOOR_OPENING_STARTED_STATE,
    });
    expect(getMotorCommandConfirmationStrategy('widoor', 'CLOSE')).toEqual({
      kind: 'widoor-closing-state',
      expectedState: WIDOOR_CLOSING_STARTED_STATE,
    });
    for (const profile of [
      'moventiv-60',
      'moventiv-80',
      'garline',
    ] as const) {
      expect(getMotorCommandConfirmationStrategy(profile, 'OPEN')).toEqual({
        kind: 'position-increase',
      });
    }
    expect(getMotorCommandConfirmationStrategy('unknown', 'OPEN')).toBeNull();
    expect(getMotorCommandConfirmationStrategy('ambiguous', 'OPEN')).toBeNull();
  });

  [0x20, 0x30, 0x31].forEach((ignoredState) => {
    it(`should ignore Widoor state 0x${ignoredState.toString(16)}`,
      fakeAsync(() => {
      let result: MotorCommandConfirmation | undefined;
      void service.executeWithMotorCommandConfirmation(
        request({ profile: 'widoor', timeoutMs: 0 }),
        async () => notifications.next(notification(
          11,
          1_000,
          0,
          0,
          ignoredState,
        )),
      ).then((value) => result = value);

      tick();
      expect(result?.status).toBe('timeout');
      }),
    );
  });

  it('should confirm Widoor from opening state 0x21', async () => {
    const confirmation = service.executeWithMotorCommandConfirmation(
      request({ profile: 'widoor' }),
      async () => notifications.next(notification(
        11,
        1_001,
        0,
        0,
        WIDOOR_OPENING_STARTED_STATE,
      )),
    );
    const result = await confirmation;
    expect(result.status).toBe('confirmed');
    expect(result.notification?.state).toBe(WIDOOR_OPENING_STARTED_STATE);
  });

  it('should ignore an old Widoor 0x21 notification', fakeAsync(() => {
    let result: MotorCommandConfirmation | undefined;
    void service.executeWithMotorCommandConfirmation(
      request({ profile: 'widoor', timeoutMs: 10 }),
      async () => notifications.next(notification(
        10,
        1_000,
        0,
        0,
        WIDOOR_OPENING_STARTED_STATE,
      )),
    ).then((value) => result = value);

    tick(10);
    expect(result?.status).toBe('timeout');
  }));

  it('should confirm Widoor CLOSE only from a new closing state 0x31',
    async () => {
      const confirmation = service.executeWithMotorCommandConfirmation(
        request({ profile: 'widoor', command: 'CLOSE' }),
        async () => notifications.next(notification(
          11,
          1_001,
          0,
          0,
          WIDOOR_CLOSING_STARTED_STATE,
        )),
      );

      const result = await confirmation;
      expect(result.status).toBe('confirmed');
      expect(result.command).toBe('CLOSE');
      expect(result.notification?.state).toBe(WIDOOR_CLOSING_STARTED_STATE);
    },
  );

  it('should ignore old 0x31 and stop-after-close state 0x30 for CLOSE',
    fakeAsync(() => {
      let result: MotorCommandConfirmation | undefined;
      void service.executeWithMotorCommandConfirmation(
        request({ profile: 'widoor', command: 'CLOSE', timeoutMs: 10 }),
        async () => {
          notifications.next(notification(10, 1_000, 0, 0, 0x31));
          notifications.next(notification(11, 1_001, 0, 0, 0x30));
          notifications.next(notification(12, 1_002, 0, 0, 0x21));
        },
      ).then((value) => result = value);

      tick(10);
      expect(result?.status).toBe('timeout');
    }),
  );

  it('should buffer Widoor 0x21 during write but reject it on write failure',
    async () => {
      const confirmed = await service.executeWithMotorCommandConfirmation(
        request({ profile: 'widoor' }),
        async () => notifications.next(notification(
          11,
          1_000,
          0,
          0,
          WIDOOR_OPENING_STARTED_STATE,
        )),
      );
      expect(confirmed.status).toBe('confirmed');

      fakeBleService.lastNotificationSequence = 11;
      const failed = await service.executeWithMotorCommandConfirmation(
        request({ profile: 'widoor' }),
        async () => {
          notifications.next(notification(
            12,
            1_001,
            0,
            0,
            WIDOOR_OPENING_STARTED_STATE,
          ));
          throw new Error('Native write failed');
        },
      );
      expect(failed.status).toBe('failed');
      expect(failed.notification).toBeNull();
    },
  );

  it('should not let state 0x21 bypass Moventiv position confirmation',
    fakeAsync(() => {
      let result: MotorCommandConfirmation | undefined;
      void execute(async () => {
        notifications.next(notification(
          11,
          1_000,
          100,
          500,
          WIDOOR_OPENING_STARTED_STATE,
        ));
      }).then((value) => result = value);

      tick(10);
      expect(result?.status).toBe('timeout');
    }),
  );

  (['moventiv-60', 'moventiv-80', 'garline'] as const).forEach((profile) => {
    it(`should keep position confirmation for ${profile}`, async () => {
      const result = await service.executeWithMotorCommandConfirmation(
        request({
          profile,
        }),
        async () => notifications.next(notification(
          11,
          1_000,
          101,
          500,
          0x20,
        )),
      );

      expect(result.status).toBe('confirmed');
      expect(result.notification?.currentPosition).toBe(101);
    });
  });

  (['moventiv-60', 'moventiv-80', 'garline'] as const).forEach((profile) => {
    it(`should reject a zero maximum for ${profile}`, async () => {
      const write = jasmine.createSpy('write').and.resolveTo();
      const result = await service.executeWithMotorCommandConfirmation(
        request({
          profile,
          baselineMaximumPosition: 0,
        }),
        write,
      );

      expect(result.status).toBe('failed');
      expect(write).not.toHaveBeenCalled();
    });
  });

  it('should resolve Widoor as disconnected while awaiting state 0x21',
    async () => {
      const confirmation = service.executeWithMotorCommandConfirmation(
        request({ profile: 'widoor' }),
        async () => undefined,
      );
      await Promise.resolve();

      disconnections.next({ deviceId: 'device-1', reason: 'remote' });

      expect((await confirmation).status).toBe('disconnected');
    },
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
  profile:
    | 'widoor'
    | 'moventiv-60'
    | 'moventiv-80'
    | 'garline'
    | 'unknown'
    | 'ambiguous';
  baselinePosition: number;
  baselineMaximumPosition: number;
  timeoutMs: number;
  command: 'OPEN' | 'CLOSE';
}> = {}): MotorCommandConfirmationRequest {
  const profile = overrides.profile ?? 'moventiv-60';
  const base = {
    command: overrides.command ?? 'OPEN',
    deviceId: 'device-1',
    timeoutMs: overrides.timeoutMs ?? 10,
  };
  if (profile === 'widoor' ||
      profile === 'unknown' ||
      profile === 'ambiguous') {
    return { ...base, profile };
  }
  return {
    ...base,
    command: 'OPEN',
    profile,
    baselinePosition: overrides.baselinePosition ?? 100,
    baselineMaximumPosition: overrides.baselineMaximumPosition ?? 500,
  };
}

function notification(
  sequence: number,
  receivedAt: number,
  position: number,
  maximum: number,
  state = 3,
): BleNotificationEvent {
  return {
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid: BLE_UUIDS.motorStateCharacteristic,
    sequence,
    receivedAt,
    value: frame([
      state,
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
