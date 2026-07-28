import { TestBed } from '@angular/core/testing';

import { BleService } from './ble';
import {
  BLE_PROFILE_CATALOG,
  BLE_UUIDS,
  ProductProfile,
} from './ble-profile-catalog';
import { MotorCommandService } from './motor-command.service';
import {
  MotorCommandConfirmationService,
} from './motor-command-confirmation';

describe('MotorCommandService', () => {
  let service: MotorCommandService;
  let writeCharacteristic: jasmine.Spy;
  let executeWithConfirmation: jasmine.Spy;

  beforeEach(() => {
    writeCharacteristic = jasmine.createSpy('writeCharacteristic')
      .and.resolveTo();
    executeWithConfirmation = jasmine.createSpy('executeWithConfirmation')
      .and.callFake(async (
        request: { baselinePosition: number },
        write: () => Promise<void>,
      ) => {
        if (!Number.isFinite(request.baselinePosition)) {
          return confirmationResult('failed', 'Invalid baseline');
        }
        try {
          await write();
          return confirmationResult('confirmed');
        } catch (error: unknown) {
          return confirmationResult(
            'failed',
            error instanceof Error ? error.message : String(error),
          );
        }
      });
    TestBed.configureTestingModule({
      providers: [
        MotorCommandService,
        {
          provide: BleService,
          useValue: { writeCharacteristic },
        },
        {
          provide: MotorCommandConfirmationService,
          useValue: {
            executeWithMotorCommandConfirmation: executeWithConfirmation,
          },
        },
      ],
    });
    service = TestBed.inject(MotorCommandService);
  });

  it('should encode and send OPEN using the profile catalog', async () => {
    await service.sendMotorCommand('widoor', 'OPEN', 'device-1');

    expect(writeCharacteristic).toHaveBeenCalledOnceWith(
      BLE_PROFILE_CATALOG.widoor.writable
        ? BLE_PROFILE_CATALOG.widoor.primaryServiceUuid
        : '',
      BLE_PROFILE_CATALOG.widoor.writable
        ? BLE_PROFILE_CATALOG.widoor.motorCommandCharacteristicUuid
        : '',
      jasmine.any(Uint8Array),
      'device-1',
    );
    const value = writeCharacteristic.calls.mostRecent().args[2] as Uint8Array;
    expect(Array.from(value)).toEqual([0x00, 0x20, 0x00, 0x00]);
    expect(writeCharacteristic.calls.mostRecent().args[0]).toBe(
      BLE_UUIDS.shdoService,
    );
    expect(writeCharacteristic.calls.mostRecent().args[1]).toBe(
      BLE_UUIDS.motorCommandCharacteristic,
    );
  });

  ['unknown', 'ambiguous'].forEach((profile) => {
    it(`should reject ${profile} before accessing BLE`, async () => {
      await expectAsync(service.sendMotorCommand(
        profile as ProductProfile,
        'OPEN',
      )).toBeRejectedWithError(
        `BLE writes are forbidden for profile "${profile}".`,
      );
      expect(writeCharacteristic).not.toHaveBeenCalled();
    });
  });

  it('should propagate the BLE write error', async () => {
    const writeError = new Error('Write unavailable');
    writeCharacteristic.and.rejectWith(writeError);

    await expectAsync(
      service.sendMotorCommand('garline', 'OPEN'),
    ).toBeRejectedWith(writeError);
  });

  it('should install confirmation observation around the write', async () => {
    const result = await service.sendMotorCommandWithConfirmation(
      'widoor',
      'OPEN',
      120,
      'device-1',
      250,
    );

    expect(writeCharacteristic).toHaveBeenCalledTimes(1);
    expect(executeWithConfirmation).toHaveBeenCalledTimes(1);
    expect(executeWithConfirmation).toHaveBeenCalledBefore(
      writeCharacteristic,
    );
    expect(executeWithConfirmation.calls.mostRecent().args[0])
      .toEqual(jasmine.objectContaining({
        profile: 'widoor',
        command: 'OPEN',
        baselinePosition: 120,
        deviceId: 'device-1',
        timeoutMs: 250,
      }));
    expect(executeWithConfirmation.calls.mostRecent().args[1])
      .toEqual(jasmine.any(Function));
    expect(result.status).toBe('confirmed');
  });

  it('should report a write error as failed without waiting', async () => {
    writeCharacteristic.and.rejectWith(new Error('Native write failed'));

    const result = await service.sendMotorCommandWithConfirmation(
      'widoor',
      'OPEN',
      120,
    );

    expect(result.status).toBe('failed');
    expect(result.failureReason).toBe('Native write failed');
    expect(executeWithConfirmation).toHaveBeenCalledTimes(1);
  });

  it('should reject an invalid baseline before writing', async () => {
    const result = await service.sendMotorCommandWithConfirmation(
      'widoor',
      'OPEN',
      Number.NaN,
    );

    expect(result.status).toBe('failed');
    expect(result.failureReason).toContain('baseline');
    expect(writeCharacteristic).not.toHaveBeenCalled();
  });

  it('should reject a second business command during writing', async () => {
    let resolveWrite!: () => void;
    writeCharacteristic.and.returnValue(new Promise<void>(
      (resolve) => resolveWrite = resolve,
    ));
    const first = service.sendMotorCommandWithConfirmation(
      'widoor',
      'OPEN',
      100,
    );

    const second = await service.sendMotorCommandWithConfirmation(
      'widoor',
      'OPEN',
      100,
    );

    expect(second.status).toBe('failed');
    expect(second.failureReason).toContain('already in progress');
    expect(writeCharacteristic).toHaveBeenCalledTimes(1);
    resolveWrite();
    await first;
  });

  it('should reject a second business command while awaiting confirmation',
    async () => {
      let resolveConfirmation!: (
        value: ReturnType<typeof confirmationResult>,
      ) => void;
      executeWithConfirmation.and.callFake(async (
        _request: unknown,
        write: () => Promise<void>,
      ) => {
        await write();
        return new Promise<ReturnType<typeof confirmationResult>>(
          (resolve) => resolveConfirmation = resolve,
        );
      });
      const first = service.sendMotorCommandWithConfirmation(
        'widoor',
        'OPEN',
        100,
      );
      await Promise.resolve();

      const second = await service.sendMotorCommandWithConfirmation(
        'widoor',
        'OPEN',
        100,
      );

      expect(second.status).toBe('failed');
      expect(writeCharacteristic).toHaveBeenCalledTimes(1);
      resolveConfirmation(confirmationResult('timeout'));
      await first;
    },
  );

  it('should release the business lock after every terminal result', async () => {
    for (const status of [
      'confirmed',
      'timeout',
      'disconnected',
      'failed',
    ] as const) {
      executeWithConfirmation.and.resolveTo(confirmationResult(status));

      expect((await service.sendMotorCommandWithConfirmation(
        'widoor',
        'OPEN',
        100,
      )).status).toBe(status);
    }
    expect(executeWithConfirmation).toHaveBeenCalledTimes(4);
  });
});

function confirmationResult(
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
