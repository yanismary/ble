import { BLE_UUIDS } from './ble-profile-catalog';
import {
  createWidoorLegacyResetSequence,
  encodeLegacyDateWrite,
  encodeLegacyEnabledState,
  encodeLegacyInputMode,
  encodeLegacyLockState,
  encodeLegacyLockMode,
  encodeLegacyMotorCommand,
  encodeLegacyName,
  encodeLegacyProfessionalPeripheral,
  encodeLegacyProfessionalScalar,
  encodeLegacyUserPeripheral,
  encodeLegacyUserScalar,
  encodeLegacyWeightRange,
  inspectCataloguedLegacyBleWrite,
  isCataloguedLegacyBleWrite,
  LEGACY_VALUE_SEMANTICS,
  LEGACY_WRITE_CONSTRAINTS,
} from './legacy-ble-write-catalog';

describe('legacy BLE write catalog', () => {
  it('encodes every historical motor command exactly', () => {
    expect(bytes(encodeLegacyMotorCommand('widoor', 'OPEN')))
      .toEqual([0x00, 0x20, 0x00, 0x00]);
    expect(bytes(encodeLegacyMotorCommand('widoor', 'OPEN_SHORT_TIMED')))
      .toEqual([0x00, 0x21, 0x00, 0x00]);
    expect(bytes(encodeLegacyMotorCommand('moventiv-60', 'OPEN_LONG_TIMED')))
      .toEqual([0x00, 0x22]);
    expect(bytes(encodeLegacyMotorCommand('moventiv-80', 'CLOSE')))
      .toEqual([0x00, 0x30]);
    expect(bytes(encodeLegacyMotorCommand('garline', 'LEARNING')))
      .toEqual([0x00, 0x12]);
  });

  it('preserves OPEN validation metadata and independent payloads', () => {
    const first = encodeLegacyMotorCommand('widoor', 'OPEN');
    const second = encodeLegacyMotorCommand('widoor', 'OPEN');
    first.payload[0] = 0xff;
    expect(bytes(first)).toEqual([0x00, 0x20, 0x00, 0x00]);
    expect(bytes(second)).toEqual([0x00, 0x20, 0x00, 0x00]);
    expect(second.hardwareValidationStatus)
      .toBe('validated-widoor-old-firmware');
    expect(second.serviceUuid).toBe(BLE_UUIDS.shdoService);
  });

  it('authenticates only intact catalog instances, not copies or rebuilds', () => {
    const intact = encodeLegacyMotorCommand('widoor', 'OPEN');
    const copied = { ...intact };
    const rebuilt = JSON.parse(JSON.stringify(intact)) as unknown;
    const fabricated = {
      ...copied,
      payload: Uint8Array.from([0x00, 0x20, 0x00, 0x00]),
    };

    expect(isCataloguedLegacyBleWrite(intact)).toBeTrue();
    expect(inspectCataloguedLegacyBleWrite(intact)).toBe('authentic');
    expect(isCataloguedLegacyBleWrite(copied)).toBeFalse();
    expect(inspectCataloguedLegacyBleWrite(copied)).toBe('unauthenticated');
    expect(isCataloguedLegacyBleWrite(rebuilt)).toBeFalse();
    expect(isCataloguedLegacyBleWrite(fabricated)).toBeFalse();
  });

  it('freezes catalog metadata and returns a defensive payload copy', () => {
    const write = encodeLegacyMotorCommand('widoor', 'OPEN');
    const originalPayload = bytes(write);

    expect(Object.isFrozen(write)).toBeTrue();
    for (const [property, value] of [
      ['payload', Uint8Array.from([0x00, 0x30])],
      ['serviceUuid', 'different-service'],
      ['characteristicUuid', 'different-characteristic'],
      ['profile', 'garline'],
      ['operation', 'motor-close'],
      ['destructiveLevel', 'non-destructive-setting'],
      ['hardwareValidationStatus', 'phase1-reference-only'],
      ['length', 2],
      ['payloadHex', '00 30'],
    ] as const) {
      expect(() => Object.defineProperty(write, property, { value })).toThrow();
    }
    const exposedPayload = write.payload;
    exposedPayload[0] = 0xff;

    expect(bytes(write)).toEqual(originalPayload);
    expect(inspectCataloguedLegacyBleWrite(write)).toBe('authentic');
  });

  it('encodes lock modes and user scalar selectors', () => {
    expect(bytes(encodeLegacyLockMode('widoor', 'none'))).toEqual([0, 0]);
    expect(bytes(encodeLegacyLockMode('widoor', 'locked-open')))
      .toEqual([0, 1]);
    expect(bytes(encodeLegacyLockMode('widoor', 'locked-closed')))
      .toEqual([0, 2]);
    expect(bytes(encodeLegacyUserScalar('widoor', 'open-speed', 25)))
      .toEqual([1, 25]);
    expect(bytes(encodeLegacyUserScalar('widoor', 'close-speed', 35)))
      .toEqual([2, 35]);
    expect(bytes(encodeLegacyUserScalar('garline', 'short-timing', 0)))
      .toEqual([3, 0]);
    expect(bytes(encodeLegacyUserScalar('garline', 'long-timing', 60)))
      .toEqual([4, 60]);
  });

  it('rejects user scalar values outside profile ranges', () => {
    expect(() => encodeLegacyUserScalar('widoor', 'open-speed', 24))
      .toThrow();
    expect(() => encodeLegacyUserScalar('moventiv-60', 'open-speed', 49))
      .toThrow();
    expect(() => encodeLegacyUserScalar('garline', 'open-speed', 0))
      .not.toThrow();
    expect(() => encodeLegacyUserScalar('garline', 'long-timing', 0))
      .toThrow();
  });

  it('encodes explicit legacy 01/02 peripheral conventions', () => {
    expect(encodeLegacyEnabledState('enabled')).toBe(0x01);
    expect(encodeLegacyEnabledState('disabled')).toBe(0x02);
    expect(encodeLegacyInputMode('radar')).toBe(0x01);
    expect(encodeLegacyInputMode('button')).toBe(0x02);
    expect(encodeLegacyLockState('locked')).toBe(0x01);
    expect(encodeLegacyLockState('unlocked')).toBe(0x02);
    expect(bytes(encodeLegacyUserPeripheral(
      'widoor', 'static-light', 'enabled',
    ))).toEqual([0x05, 0x06, 0x01]);
    expect(bytes(encodeLegacyUserPeripheral(
      'widoor', 'static-light', 'disabled',
    ))).toEqual([0x05, 0x06, 0x02]);
    expect(bytes(encodeLegacyUserPeripheral(
      'moventiv-60', 'dynamic-light', 'disabled',
    ))).toEqual([0x05, 0x07, 0x02]);
    expect(bytes(encodeLegacyUserPeripheral(
      'garline', 'rgb-indicator', 'enabled',
    ))).toEqual([0x05, 0x03, 0x01]);
  });

  it('encodes profile-specific professional scalar parameters', () => {
    expect(bytes(encodeLegacyProfessionalScalar(
      'widoor', 'break-force-at-open', 5,
    ))).toEqual([0x01, 5]);
    expect(bytes(encodeLegacyProfessionalScalar(
      'moventiv-60', 'near-open-speed', 80,
    ))).toEqual([0x02, 80]);
    expect(bytes(encodeLegacyProfessionalScalar(
      'moventiv-80', 'near-close-torque', 200,
    ))).toEqual([0x05, 200]);
    expect(bytes(encodeLegacyProfessionalScalar(
      'garline', 'braking-open-power', 1,
    ))).toEqual([0x06, 1]);
    expect(bytes(encodeLegacyProfessionalScalar(
      'garline', 'obstacle-sensitivity', 5,
    ))).toEqual([0x07, 5]);
    expect(() => encodeLegacyProfessionalScalar(
      'moventiv-60', 'break-force-at-open', 5,
    )).toThrow();
  });

  it('encodes professional peripherals', () => {
    expect(bytes(encodeLegacyProfessionalPeripheral(
      'widoor', 'input-1-radar', 'radar',
    ))).toEqual([10, 7, 1]);
    expect(bytes(encodeLegacyProfessionalPeripheral(
      'widoor', 'input-1-radar', 'button',
    ))).toEqual([10, 7, 2]);
    expect(bytes(encodeLegacyProfessionalPeripheral(
      'moventiv-60', 'input-2-radar', 'button',
    ))).toEqual([10, 6, 2]);
    expect(bytes(encodeLegacyProfessionalPeripheral(
      'widoor', 'lock', 'locked',
    ))).toEqual([10, 5, 1]);
    expect(bytes(encodeLegacyProfessionalPeripheral(
      'widoor', 'lock', 'unlocked',
    ))).toEqual([10, 5, 2]);
    expect(bytes(encodeLegacyProfessionalPeripheral(
      'widoor', 'radar-test-1', 'enabled',
    ))).toEqual([10, 4, 1]);
    expect(bytes(encodeLegacyProfessionalPeripheral(
      'widoor', 'radar-test-2', 'disabled',
    ))).toEqual([10, 3, 2]);
  });

  it('encodes only historical weight ranges allowed by profile', () => {
    expect(bytes(encodeLegacyWeightRange('moventiv-60', 10, 20)))
      .toEqual([0, 10, 20]);
    expect(bytes(encodeLegacyWeightRange('moventiv-80', 120, 140)))
      .toEqual([0, 120, 140]);
    expect(bytes(encodeLegacyWeightRange('garline', 60, 80)))
      .toEqual([0, 60, 80]);
    expect(() => encodeLegacyWeightRange('garline', 10, 20)).toThrow();
  });

  it('exposes distinct legacy constraints for all profiles', () => {
    expect(LEGACY_WRITE_CONSTRAINTS.widoor.openSpeed).toEqual({
      min: 25, max: 100,
    });
    expect(LEGACY_WRITE_CONSTRAINTS['moventiv-60'].openSpeed.min).toBe(50);
    expect(LEGACY_WRITE_CONSTRAINTS['moventiv-80'].nearOpenTorque?.max)
      .toBe(200);
    expect(LEGACY_WRITE_CONSTRAINTS['moventiv-60'].nearOpenSpeed.max)
      .toBe(200);
    expect(LEGACY_WRITE_CONSTRAINTS['moventiv-60']
      .uiProfessionalRanges['nearOpenSpeed']).toEqual({ min: 1, max: 100 });
    expect(LEGACY_WRITE_CONSTRAINTS.garline.openSpeed.min).toBe(0);
    expect(LEGACY_WRITE_CONSTRAINTS.garline.nearOpenSpeed.min).toBe(0);
    expect(LEGACY_WRITE_CONSTRAINTS.garline.nearOpenSpeed.max).toBe(100);
    expect(LEGACY_VALUE_SEMANTICS.widoor.readableByteRange.max).toBe(255);
    expect(LEGACY_VALUE_SEMANTICS.widoor.invalidReadDefaults['shortTiming'])
      .toBe(1);
    expect(LEGACY_VALUE_SEMANTICS.widoor
      .historicalInternalDefaults['resetShortTiming']).toBe(3);
  });

  it('validates and encodes names with room suffixes', () => {
    const valid = encodeLegacyName('Door', ' - Room 1');
    expect(valid.valid).toBeTrue();
    if (valid.valid) {
      expect(valid.value).toBe('Door - Room 1');
      expect(Array.from(valid.bytes)).toEqual(
        Array.from('Door - Room 1', (value) => value.charCodeAt(0)),
      );
    }
    expect(encodeLegacyName('123456789012345').valid).toBeTrue();
    expect(encodeLegacyName('1234567890123456')).toEqual(jasmine.objectContaining({
      valid: false, error: 'too-long',
    }));
    expect(encodeLegacyName('Porte_1')).toEqual(jasmine.objectContaining({
      valid: false, error: 'invalid-characters',
    }));
  });

  it('encodes historical zero-based-month date writes', () => {
    expect(bytes(encodeLegacyDateWrite('widoor', 'first-commissioning', {
      year: 24, month: 0, day: 1, hour: 8,
    }))).toEqual([1, 24, 0, 1, 8]);
    expect(bytes(encodeLegacyDateWrite('garline', 'maintenance', {
      year: 24, month: 11, day: 31, hour: 23,
    }))).toEqual([2, 24, 11, 31, 23]);
    expect(() => encodeLegacyDateWrite('widoor', 'maintenance', {
      year: 24, month: 12, day: 1, hour: 8,
    })).toThrow();
    expect(() => encodeLegacyDateWrite('widoor', 'maintenance', {
      year: 23, month: 1, day: 29, hour: 8,
    })).toThrow();
    expect(() => encodeLegacyDateWrite('widoor', 'maintenance', {
      year: 24, month: 1, day: 29, hour: 8,
    })).not.toThrow();
  });

  it('describes the nine ordered Widoor reset writes without executing them',
    () => {
      const steps = createWidoorLegacyResetSequence();
      expect(steps.length).toBe(9);
      expect(steps.map(({ index }) => index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(steps.map(({ payload }) => Array.from(payload))).toEqual([
        [1, 50], [2, 50], [3, 3],
        [1, 5], [2, 80], [3, 70],
        [10, 7, 2], [10, 6, 2], [10, 5, 2],
      ]);
      expect(steps.every(({ delayAfterMs }) => delayAfterMs === 250)).toBeTrue();
      expect(steps.every(isCataloguedLegacyBleWrite)).toBeTrue();
      expect(Object.isFrozen(steps)).toBeTrue();
      expect(steps.every(Object.isFrozen)).toBeTrue();
      const firstPayload = steps[0].payload;
      firstPayload[0] = 0xff;
      expect(bytes(steps[0])).toEqual([1, 50]);
      expect(steps.slice(0, 3).every(({ characteristicUuid }) =>
        characteristicUuid === BLE_UUIDS.userParametersCharacteristic,
      )).toBeTrue();
      expect(steps.slice(3).every(({ characteristicUuid }) =>
        characteristicUuid === BLE_UUIDS.professionalParametersCharacteristic,
      )).toBeTrue();
    },
  );
});

function bytes(write: { readonly payload: Uint8Array }): number[] {
  return Array.from(write.payload);
}
