import { TestBed } from '@angular/core/testing';

import { BleService } from './ble';
import {
  BLE_PROFILE_CATALOG,
  BLE_UUIDS,
  ProductProfile,
} from './ble-profile-catalog';
import { MotorCommandService } from './motor-command.service';

describe('MotorCommandService', () => {
  let service: MotorCommandService;
  let writeCharacteristic: jasmine.Spy;

  beforeEach(() => {
    writeCharacteristic = jasmine.createSpy('writeCharacteristic')
      .and.resolveTo();
    TestBed.configureTestingModule({
      providers: [
        MotorCommandService,
        {
          provide: BleService,
          useValue: { writeCharacteristic },
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
});
