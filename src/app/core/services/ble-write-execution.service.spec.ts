import { TestBed } from '@angular/core/testing';

import {
  BleWriteExecutionService,
  LegacyBleWriteRequest,
} from './ble-write-execution.service';
import { BleService } from './ble';
import {
  createWidoorLegacyResetSequence,
  encodeLegacyDateWrite,
  encodeLegacyNameWrite,
  encodeLegacyMotorCommand,
  encodeLegacyProfessionalScalar,
  encodeLegacyUserScalar,
} from './legacy-ble-write-catalog';
import { MotorCommandService } from './motor-command.service';

describe('BleWriteExecutionService', () => {
  let service: BleWriteExecutionService;
  let ble: {
    connectedDeviceId: string | null;
    connectionGeneration: number;
    disconnectingDeviceId: string | null;
    isWriting: boolean;
    getGattCharacteristicProperties: jasmine.Spy;
    writeCharacteristic: jasmine.Spy;
    writeWithoutResponse: jasmine.Spy;
  };
  let sendMotorCommandWithConfirmation: jasmine.Spy;
  let sendCataloguedWidoorMotorCommandWithConfirmation: jasmine.Spy;
  let authorizationSequence: number;

  beforeEach(() => {
    authorizationSequence = 0;
    ble = {
      connectedDeviceId: 'device-1',
      connectionGeneration: 7,
      disconnectingDeviceId: null,
      isWriting: false,
      getGattCharacteristicProperties:
        jasmine.createSpy('getGattCharacteristicProperties')
          .and.returnValue(gattProperties()),
      writeCharacteristic: jasmine.createSpy('writeCharacteristic')
        .and.resolveTo(),
      writeWithoutResponse: jasmine.createSpy('writeWithoutResponse'),
    };
    sendMotorCommandWithConfirmation =
      jasmine.createSpy('sendMotorCommandWithConfirmation')
        .and.resolveTo(motorConfirmation('confirmed'));
    sendCataloguedWidoorMotorCommandWithConfirmation = jasmine.createSpy(
      'sendCataloguedWidoorMotorCommandWithConfirmation',
    ).and.resolveTo(motorConfirmation('confirmed'));
    TestBed.configureTestingModule({
      providers: [
        BleWriteExecutionService,
        { provide: BleService, useValue: ble },
        {
          provide: MotorCommandService,
          useValue: {
            sendMotorCommandWithConfirmation,
            sendCataloguedWidoorMotorCommandWithConfirmation,
          },
        },
      ],
    });
    service = TestBed.inject(BleWriteExecutionService);
  });

  it('executes one catalogued setting with exact metadata and GATT write',
    async () => {
      const request = settingRequest();

      const result = await service.execute(request);

      expect(result).toEqual(jasmine.objectContaining({
        status: 'success',
        operation: 'open-speed',
        profile: 'widoor',
        deviceId: 'device-1',
        serviceUuid: request.write.serviceUuid,
        characteristicUuid: request.write.characteristicUuid,
        payloadHex: '01 19',
        length: 2,
        destructiveLevel: 'non-destructive-setting',
        hardwareValidationStatus: 'phase1-reference-only',
        policyOverrideUsed: true,
        nativeWriteCompleted: true,
        confirmationStatus: 'not-validated',
        error: null,
      }));
      expect(result.completedAt).toBeGreaterThanOrEqual(result.startedAt);
      expect(ble.getGattCharacteristicProperties).toHaveBeenCalledOnceWith(
        request.write.serviceUuid,
        request.write.characteristicUuid,
        'device-1',
      );
      expect(ble.writeCharacteristic).toHaveBeenCalledOnceWith(
        request.write.serviceUuid,
        request.write.characteristicUuid,
        jasmine.any(Uint8Array),
        'device-1',
      );
      expect(Array.from(
        ble.writeCharacteristic.calls.mostRecent().args[2] as Uint8Array,
      )).toEqual([0x01, 25]);
      expect(ble.writeWithoutResponse).not.toHaveBeenCalled();
      expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();
      expect(service.isExecuting).toBeFalse();
    });

  it('executes catalogued name writes on the SHDO name characteristic',
    async () => {
      const request = requestFor(
        encodeLegacyNameWrite('moventiv-60', 'Porte', '#SDB'),
      );

      const result = await service.execute(request);

      expect(result.status).toBe('success');
      expect(result.operation).toBe('name-room');
      expect(result.serviceUuid).toBe(request.write.serviceUuid);
      expect(result.characteristicUuid).toBe(request.write.characteristicUuid);
      expect(result.payloadHex).toBe('50 6f 72 74 65 23 53 44 42');
      expect(ble.writeCharacteristic).toHaveBeenCalledWith(
        request.write.serviceUuid,
        request.write.characteristicUuid,
        jasmine.any(Uint8Array),
        'device-1',
      );
    },
  );

  it('executes catalogued product date writes on SHDO dates and cycles',
    async () => {
      const request = requestFor(
        encodeLegacyDateWrite('garline', 'maintenance', {
          year: 26,
          month: 11,
          day: 31,
          hour: 23,
        }),
      );

      const result = await service.execute(request);

      expect(result.status).toBe('success');
      expect(result.operation).toBe('maintenance-date');
      expect(result.serviceUuid).toBe(request.write.serviceUuid);
      expect(result.characteristicUuid).toBe(request.write.characteristicUuid);
      expect(result.payloadHex).toBe('02 1a 0b 1f 17');
      expect(ble.writeCharacteristic).toHaveBeenCalledOnceWith(
        request.write.serviceUuid,
        request.write.characteristicUuid,
        jasmine.any(Uint8Array),
        'device-1',
      );
      expect(Array.from(
        ble.writeCharacteristic.calls.mostRecent().args[2] as Uint8Array,
      )).toEqual([0x02, 26, 11, 31, 23]);
    },
  );

  it('routes validated Widoor OPEN through the unchanged confirmation flow',
    async () => {
      const request = openRequest();

      const result = await service.execute(request);

      expect(result.status).toBe('success');
      expect(result.confirmationStatus).toBe('confirmed');
      expect(result.nativeWriteCompleted).toBeTrue();
      expect(result.policyOverrideUsed).toBeFalse();
      expect(sendMotorCommandWithConfirmation).toHaveBeenCalledOnceWith({
        profile: 'widoor',
        command: 'OPEN',
        deviceId: 'device-1',
        timeoutMs: 250,
      });
      expect(ble.writeCharacteristic).not.toHaveBeenCalled();
    });

  it('executes a catalogued professional setting only with the override',
    async () => {
      const request = requestFor(encodeLegacyProfessionalScalar(
        'moventiv-60',
        'near-open-speed',
        80,
      ));

      const result = await service.execute(request);

      expect(result.status).toBe('success');
      expect(result.policyOverrideUsed).toBeTrue();
      expect(Array.from(
        ble.writeCharacteristic.calls.mostRecent().args[2] as Uint8Array,
      )).toEqual([0x02, 80]);
    });

  it('maps Widoor OPEN timeout without claiming physical success', async () => {
    sendMotorCommandWithConfirmation.and.resolveTo(
      motorConfirmation('timeout', 'No compatible state.'),
    );

    const result = await service.execute(openRequest());

    expect(result.status).toBe('timeout');
    expect(result.nativeWriteCompleted).toBeTrue();
    expect(result.confirmationStatus).toBe('timeout');
    expect(result.error?.code).toBe('confirmation-timeout');
  });

  it('requires a current, explicit and single-use authorization', async () => {
    const missing = settingRequest();
    missing.authorization = null;
    expect((await service.execute(missing)).error?.code)
      .toBe('authorization-required');

    const denied = settingRequest();
    denied.authorization = {
      ...denied.authorization!,
      confirmedByUser: false,
    };
    expect((await service.execute(denied)).error?.code)
      .toBe('authorization-required');

    const expired = settingRequest();
    expired.authorization = {
      ...expired.authorization!,
      confirmedAt: Date.now() - 2_000,
      expiresAt: Date.now() - 1_000,
    };
    expect((await service.execute(expired)).error?.code)
      .toBe('authorization-expired');

    const reused = settingRequest();
    expect((await service.execute(reused)).status).toBe('success');
    expect((await service.execute(reused)).error?.code)
      .toBe('authorization-consumed');
    expect(ble.writeCharacteristic).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed authorization dates and identifiers', async () => {
    const emptyId = settingRequest();
    emptyId.authorization = {
      ...emptyId.authorization!,
      confirmationId: ' ',
    };
    expect((await service.execute(emptyId)).error?.code)
      .toBe('authorization-required');

    const future = settingRequest();
    future.authorization = {
      ...future.authorization!,
      confirmedAt: Date.now() + 60_000,
    };
    expect((await service.execute(future)).error?.code)
      .toBe('invalid-authorization-dates');

    const reversed = settingRequest();
    const reversedAt = Date.now();
    reversed.authorization = {
      ...reversed.authorization!,
      confirmedAt: reversedAt,
      expiresAt: reversedAt,
    };
    expect((await service.execute(reversed)).error?.code)
      .toBe('invalid-authorization-dates');
    expect(ble.writeCharacteristic).not.toHaveBeenCalled();
  });

  it('binds authorization to one exact operation and attempt', async () => {
    const first = settingRequest();
    const other = requestFor(encodeLegacyUserScalar(
      'widoor',
      'close-speed',
      35,
    ));
    other.authorization = first.authorization;

    const result = await service.execute(other);

    expect(result.status).toBe('invalid-request');
    expect(result.error?.code).toBe('authorization-scope-mismatch');
    expect(ble.writeCharacteristic).not.toHaveBeenCalled();
  });

  it('requires reinforced authorization and strong identification for movement',
    async () => {
      const weak = openRequest();
      weak.identification = { profile: 'widoor', confidence: 'weak' };
      expect((await service.execute(weak)).error?.code)
        .toBe('strong-identification-required');

      const basic = openRequest();
      basic.authorization = {
        ...basic.authorization!,
        motorMovementConfirmed: false,
      };
      expect((await service.execute(basic)).error?.code)
        .toBe('motor-authorization-required');
      expect(sendMotorCommandWithConfirmation).not.toHaveBeenCalled();
    });

  it('rejects unknown, ambiguous and mismatched profiles before GATT', async () => {
    for (const profile of ['unknown', 'ambiguous'] as const) {
      const request = settingRequest();
      request.profile = profile;
      request.identification = { profile, confidence: 'indeterminate' };
      expect((await service.execute(request)).error?.code)
        .toBe('invalid-profile');
    }

    const mismatch = settingRequest();
    mismatch.profile = 'garline';
    mismatch.identification = { profile: 'garline', confidence: 'strong' };
    expect((await service.execute(mismatch)).error?.code)
      .toBe('profile-mismatch');
    expect(ble.getGattCharacteristicProperties).not.toHaveBeenCalled();
  });

  it('rejects wrong devices, generations and disconnect-in-progress', async () => {
    const wrongDevice = settingRequest();
    wrongDevice.deviceId = 'device-2';
    expect((await service.execute(wrongDevice)).error?.code)
      .toBe('invalid-device');

    const oldGeneration = settingRequest();
    oldGeneration.connectionGeneration = 6;
    expect((await service.execute(oldGeneration)).status).toBe('stale');

    const invalidGeneration = settingRequest();
    invalidGeneration.connectionGeneration = -1;
    expect((await service.execute(invalidGeneration)).error?.code)
      .toBe('invalid-generation');

    ble.disconnectingDeviceId = 'device-1';
    expect((await service.execute(settingRequest())).status)
      .toBe('disconnected');
    expect(ble.writeCharacteristic).not.toHaveBeenCalled();
  });

  it('rejects copied, rebuilt and manually fabricated catalog values',
    async () => {
      const copied = settingRequest();
      copied.write = { ...copied.write };
      expect((await service.execute(copied)).error?.code)
        .toBe('unauthenticated-catalog-write');

      const rebuilt = settingRequest();
      rebuilt.write = JSON.parse(
        JSON.stringify(rebuilt.write),
      ) as LegacyBleWriteRequest['write'];
      expect((await service.execute(rebuilt)).error?.code)
        .toBe('unauthenticated-catalog-write');

      const fabricated = settingRequest();
      fabricated.write = {
        ...fabricated.write,
        payload: Uint8Array.from([0x01, 0x19]),
      };
      expect((await service.execute(fabricated)).error?.code)
        .toBe('unauthenticated-catalog-write');
      expect(ble.writeCharacteristic).not.toHaveBeenCalled();
    });

  it('refuses absent, unknown-capability and non-writable GATT targets',
    async () => {
      const cases = [
        {
          properties: gattProperties({
            servicePresent: false,
            characteristicPresent: false,
          }),
          code: 'service-unavailable',
        },
        {
          properties: gattProperties({ characteristicPresent: false }),
          code: 'characteristic-unavailable',
        },
        {
          properties: gattProperties({
            propertiesAvailable: false,
            write: null,
          }),
          code: 'write-property-unknown',
        },
        {
          properties: gattProperties({ write: false }),
          code: 'characteristic-not-writable',
        },
        {
          properties: gattProperties({
            write: false,
            writeWithoutResponse: true,
          }),
          code: 'characteristic-not-writable',
        },
      ];
      for (const testCase of cases) {
        ble.getGattCharacteristicProperties.and.returnValue(
          testCase.properties,
        );
        const result = await service.execute(settingRequest());
        expect(result.status).toBe('unavailable');
        expect(result.error?.code).toBe(testCase.code);
      }
      expect(ble.writeCharacteristic).not.toHaveBeenCalled();
    });

  it('blocks Phase 1 reference writes unless an override is explicit',
    async () => {
      const blocked = settingRequest();
      blocked.policy = {};

      const result = await service.execute(blocked);

      expect(result.status).toBe('blocked-by-policy');
      expect(result.error?.code).toBe('phase1-reference-blocked');
      expect(result.policyOverrideUsed).toBeFalse();
      expect(ble.writeCharacteristic).not.toHaveBeenCalled();
    });

  it('allows CLOSE only with its operation-scoped physical validation',
    async () => {
      const request = closeRequest();

      const result = await service.execute(request);

      expect(result.status).toBe('success');
      expect(result.policyOverrideUsed).toBeTrue();
      expect(result.confirmationStatus).toBe('confirmed');
      expect(sendCataloguedWidoorMotorCommandWithConfirmation)
        .toHaveBeenCalledOnceWith({
          write: request.write,
          command: 'CLOSE',
          deviceId: 'device-1',
          timeoutMs: 250,
        });
      expect(ble.writeCharacteristic).not.toHaveBeenCalled();
    });

  it('does not let the generic Phase 1 override enable CLOSE', async () => {
    const request = closeRequest();
    request.policy = { allowPhase1ReferenceOnly: true };

    const result = await service.execute(request);

    expect(result.status).toBe('invalid-request');
    expect(result.error?.code).toBe('widoor-close-validation-required');
    expect(sendCataloguedWidoorMotorCommandWithConfirmation)
      .not.toHaveBeenCalled();
    });

  it('does not extend the CLOSE validation policy to timed commands',
    async () => {
      const request = requestFor(
        encodeLegacyMotorCommand('widoor', 'OPEN_SHORT_TIMED'),
      );
      request.authorization = {
        ...request.authorization!,
        motorMovementConfirmed: true,
      };
      request.policy = {
        allowPhysicalValidationAttempt: {
          operation: 'motor-close',
          profile: 'widoor',
        },
      };

      const result = await service.execute(request);

      expect(result.status).toBe('blocked-by-policy');
      expect(result.error?.code).toBe('phase1-reference-blocked');
      expect(sendCataloguedWidoorMotorCommandWithConfirmation)
        .not.toHaveBeenCalled();
      expect(ble.writeCharacteristic).not.toHaveBeenCalled();
    });

  it('allows each timed opening only with its exact physical validation',
    async () => {
      for (const testCase of [
        {
          command: 'OPEN_SHORT_TIMED',
          operation: 'motor-open-short-timed',
        },
        {
          command: 'OPEN_LONG_TIMED',
          operation: 'motor-open-long-timed',
        },
      ] as const) {
        const request = timedRequest(testCase.command, testCase.operation);

        const result = await service.execute(request);

        expect(result.status).toBe('success');
        expect(result.confirmationStatus).toBe('confirmed');
        expect(result.movementStartConfirmed).toBeTrue();
        expect(result.timedCycleValidationStatus)
          .toBe('pending-physical-validation');
        expect(result.policyOverrideUsed).toBeTrue();
        expect(sendCataloguedWidoorMotorCommandWithConfirmation)
          .toHaveBeenCalledWith(jasmine.objectContaining({
            write: request.write,
            command: testCase.command,
          }));
      }
      expect(sendCataloguedWidoorMotorCommandWithConfirmation)
        .toHaveBeenCalledTimes(2);
      expect(ble.writeCharacteristic).not.toHaveBeenCalled();
    });

  it('does not let one timed operation authorize the other', async () => {
    const request = timedRequest(
      'OPEN_SHORT_TIMED',
      'motor-open-short-timed',
    );
    request.policy = {
      allowPhysicalValidationAttempt: {
        operation: 'motor-open-long-timed',
        profile: 'widoor',
      },
    };

    const result = await service.execute(request);

    expect(result.status).toBe('blocked-by-policy');
    expect(sendCataloguedWidoorMotorCommandWithConfirmation)
      .not.toHaveBeenCalled();
  });

  it('blocks learning and reset unless their dedicated policy is explicit',
    async () => {
      const learning = requestFor(
        encodeLegacyMotorCommand('widoor', 'LEARNING'),
      );
      learning.policy = { allowPhase1ReferenceOnly: true };
      const reset = requestFor(createWidoorLegacyResetSequence()[0]);
      reset.policy = { allowPhase1ReferenceOnly: true };

      expect((await service.execute(learning))).toEqual(
        jasmine.objectContaining({
          status: 'blocked-by-policy',
          error: jasmine.objectContaining({ code: 'learning-blocked' }),
        }),
      );
      expect((await service.execute(reset))).toEqual(
        jasmine.objectContaining({
          status: 'blocked-by-policy',
          error: jasmine.objectContaining({ code: 'reset-blocked' }),
        }),
      );
      expect(ble.writeCharacteristic).not.toHaveBeenCalled();
    });

  it('executes learning and reset only with their dedicated explicit policy',
    async () => {
      const learning = requestFor(
        encodeLegacyMotorCommand('moventiv-60', 'LEARNING'),
      );
      learning.policy = {
        allowPhase1ReferenceOnly: true,
        allowLearning: true,
      };
      const learningResult = await service.execute(learning);

      expect(learningResult.status).toBe('success');
      expect(learningResult.destructiveLevel).toBe('learning');
      expect(Array.from(
        ble.writeCharacteristic.calls.mostRecent().args[2] as Uint8Array,
      )).toEqual([0x00, 0x12]);

      const reset = requestFor(createWidoorLegacyResetSequence()[0]);
      reset.policy = {
        allowPhase1ReferenceOnly: true,
        allowReset: true,
      };
      const resetResult = await service.execute(reset);

      expect(resetResult.status).toBe('success');
      expect(resetResult.destructiveLevel).toBe('reset');
      expect(Array.from(
        ble.writeCharacteristic.calls.mostRecent().args[2] as Uint8Array,
      )).toEqual([0x01, 50]);
      expect(ble.writeCharacteristic).toHaveBeenCalledTimes(2);
    });

  it('rejects a second execution immediately and releases both locks',
    async () => {
      let releaseWrite!: () => void;
      ble.writeCharacteristic.and.returnValue(new Promise<void>((resolve) => {
        releaseWrite = resolve;
      }));
      const request = settingRequest();
      const first = service.execute(request);
      expect(service.isExecuting).toBeTrue();

      const second = await service.execute(request);

      expect(second.status).toBe('unavailable');
      expect(second.error?.code).toBe('write-in-progress');
      expect(ble.writeCharacteristic).toHaveBeenCalledTimes(1);
      releaseWrite();
      expect((await first).status).toBe('success');
      expect(service.isExecuting).toBeFalse();
      expect((await service.execute(request)).error?.code)
        .toBe('authorization-consumed');
    });

  it('snapshots request metadata before awaiting the native write', async () => {
    const pending = deferred<void>();
    ble.writeCharacteristic.and.returnValue(pending.promise);
    const request = settingRequest();
    const execution = service.execute(request);

    request.write = encodeLegacyUserScalar('garline', 'open-speed', 50);
    request.profile = 'garline';
    request.deviceId = 'other-device';
    request.connectionGeneration = 99;
    pending.resolve();

    const result = await execution;
    expect(result).toEqual(jasmine.objectContaining({
      status: 'success',
      operation: 'open-speed',
      profile: 'widoor',
      deviceId: 'device-1',
      payloadHex: '01 19',
      connectionGeneration: 7,
    }));
  });

  it('reports native failure distinctly and releases the execution lock',
    async () => {
      ble.writeCharacteristic.and.rejectWith(new Error('Native failure'));
      const request = settingRequest();

      const failed = await service.execute(request);

      expect(failed.status).toBe('failed');
      expect(failed.nativeWriteCompleted).toBeFalse();
      expect(failed.confirmationStatus).toBe('not-validated');
      expect(failed.error).toEqual(jasmine.objectContaining({
        code: 'native-write-failed',
        message: 'Native failure',
      }));
      expect(service.isExecuting).toBeFalse();
      expect((await service.execute(request)).error?.code)
        .toBe('authorization-consumed');
      expect(ble.writeCharacteristic).toHaveBeenCalledTimes(1);

      ble.writeCharacteristic.and.resolveTo();
      expect((await service.execute(settingRequest())).status).toBe('success');
    });

  it('does not consume authorization when GATT validation refuses the write',
    async () => {
      const request = settingRequest();
      ble.getGattCharacteristicProperties.and.returnValue(gattProperties({
        characteristicPresent: false,
      }));

      expect((await service.execute(request)).status).toBe('unavailable');
      ble.getGattCharacteristicProperties.and.returnValue(gattProperties());
      expect((await service.execute(request)).status).toBe('success');
      expect(ble.writeCharacteristic).toHaveBeenCalledTimes(1);
    });

  it('returns disconnected for a late native result after disconnection',
    async () => {
      const pending = deferred<void>();
      ble.writeCharacteristic.and.returnValue(pending.promise);
      const execution = service.execute(settingRequest());
      ble.connectedDeviceId = null;
      ble.connectionGeneration += 1;

      pending.resolve();
      const result = await execution;

      expect(result.status).toBe('disconnected');
      expect(result.nativeWriteCompleted).toBeTrue();
      expect(result.confirmationStatus).toBe('unavailable');
      expect(service.isExecuting).toBeFalse();
    });

  it('returns stale after reconnection to the same or another device',
    async () => {
      for (const reconnectedDevice of ['device-1', 'device-2']) {
        const pending = deferred<void>();
        ble.connectedDeviceId = 'device-1';
        ble.connectionGeneration = 7;
        ble.writeCharacteristic.and.returnValue(pending.promise);
        const execution = service.execute(settingRequest());
        ble.connectedDeviceId = reconnectedDevice;
        ble.connectionGeneration = 8;
        pending.resolve();

        expect((await execution).status).toBe('stale');
      }
    });

  it('does not let a late native error overwrite disconnection', async () => {
    const pending = deferred<void>();
    ble.writeCharacteristic.and.returnValue(pending.promise);
    const execution = service.execute(settingRequest());
    ble.connectedDeviceId = null;
    ble.connectionGeneration += 1;

    pending.reject(new Error('Late native error'));

    const result = await execution;
    expect(result.status).toBe('disconnected');
    expect(result.error?.code).toBe('device-disconnected');
  });

  it('marks an active result stale when the execution service is destroyed',
    async () => {
      const pending = deferred<void>();
      ble.writeCharacteristic.and.returnValue(pending.promise);
      const execution = service.execute(settingRequest());

      service.ngOnDestroy();
      pending.resolve();

      expect((await execution).status).toBe('stale');
      expect(service.isExecuting).toBeFalse();
      const afterDestroy = await service.execute(settingRequest());
      expect(afterDestroy.error?.code).toBe('service-destroyed');
    });

  function settingRequest(): MutableRequest {
    return requestFor(
      encodeLegacyUserScalar('widoor', 'open-speed', 25),
    );
  }

  function openRequest(): MutableRequest {
    const request = requestFor(
      encodeLegacyMotorCommand('widoor', 'OPEN'),
    );
    request.authorization = {
      ...request.authorization!,
      motorMovementConfirmed: true,
    };
    request.confirmationPolicy = {
      kind: 'widoor-open-state',
      timeoutMs: 250,
    };
    request.policy = {};
    return request;
  }

  function closeRequest(): MutableRequest {
    const request = requestFor(
      encodeLegacyMotorCommand('widoor', 'CLOSE'),
    );
    request.authorization = {
      ...request.authorization!,
      motorMovementConfirmed: true,
    };
    request.confirmationPolicy = {
      kind: 'widoor-close-state',
      timeoutMs: 250,
    };
    request.policy = {
      allowPhysicalValidationAttempt: {
        operation: 'motor-close',
        profile: 'widoor',
      },
    };
    return request;
  }

  function timedRequest(
    command: 'OPEN_SHORT_TIMED' | 'OPEN_LONG_TIMED',
    operation: 'motor-open-short-timed' | 'motor-open-long-timed',
  ): MutableRequest {
    const request = requestFor(
      encodeLegacyMotorCommand('widoor', command),
    );
    request.authorization = {
      ...request.authorization!,
      motorMovementConfirmed: true,
    };
    request.confirmationPolicy = {
      kind: 'widoor-timed-opening-state',
      command,
      timeoutMs: 250,
    };
    request.policy = {
      allowPhysicalValidationAttempt: {
        operation,
        profile: 'widoor',
      },
    };
    return request;
  }

  function requestFor(
    write: LegacyBleWriteRequest['write'],
  ): MutableRequest {
    authorizationSequence += 1;
    const attemptId = `attempt-${authorizationSequence}`;
    const request: MutableRequest = {
      write,
      deviceId: 'device-1',
      profile: write.profile,
      connectionGeneration: 7,
      identification: {
        profile: write.profile,
        confidence: 'strong',
      },
      authorization: null,
      attemptId,
      confirmationPolicy: { kind: 'gatt-only' },
      policy: { allowPhase1ReferenceOnly: true },
    };
    const now = Date.now();
    request.authorization = {
      confirmedByUser: true,
      confirmedAt: now - 10,
      expiresAt: now + 60_000,
      confirmationId: `confirmation-${authorizationSequence}`,
      operation: write.operation,
      payloadHex: write.payloadHex,
      profile: request.profile,
      deviceId: request.deviceId,
      connectionGeneration: request.connectionGeneration,
      attemptId,
    };
    return request;
  }
});

type MutableRequest = {
  -readonly [K in keyof LegacyBleWriteRequest]: LegacyBleWriteRequest[K];
};

function gattProperties(overrides: Record<string, unknown> = {}) {
  return {
    serviceUuid: 'service',
    characteristicUuid: 'characteristic',
    servicePresent: true,
    characteristicPresent: true,
    propertiesAvailable: true,
    read: false,
    write: true,
    writeWithoutResponse: false,
    notify: false,
    indicate: false,
    descriptorUuids: [],
    rawProperties: { write: true },
    ...overrides,
  };
}

function motorConfirmation(
  status: 'confirmed' | 'timeout' | 'disconnected' | 'failed',
  failureReason: string | null = null,
) {
  return {
    status,
    command: 'OPEN' as const,
    profile: 'widoor' as const,
    sentAt: 1,
    confirmedAt: status === 'confirmed' ? 2 : null,
    notification: null,
    failureReason,
  };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
