import {
  HISTORICAL_DATE_SENTINEL,
  bytesToHex,
  decodeBleDatesAndCycles,
  decodeBleMaintenance,
  decodeBleProfessionalParameters,
  decodeBleUserParameters,
  decodeBleVersion,
  readUint16BigEndian,
  readUint24BigEndian,
} from './ble-read-decoders';

describe('BLE read utilities', () => {
  it('reads uint16 and uint24 in big-endian order', () => {
    expect(readUint16BigEndian(bytes(0x12, 0x34), 0)).toBe(0x1234);
    expect(readUint24BigEndian(bytes(0x12, 0x34, 0x56), 0)).toBe(0x123456);
  });

  it('honors DataView boundaries and invalid offsets', () => {
    const source = bytes(0xff, 0x12, 0x34, 0xee);
    const view = new DataView(source.buffer, 1, 2);

    expect(readUint16BigEndian(view, 0)).toBe(0x1234);
    expect(readUint16BigEndian(view, 1)).toBeNull();
    expect(readUint16BigEndian(view, -1)).toBeNull();
    expect(readUint24BigEndian(bytes(1, 2, 3), 0.5)).toBeNull();
  });

  it('accepts the last valid offsets and rejects one-byte overflows', () => {
    const value = bytes(0xff, 0xff, 0xff, 0xff);

    expect(readUint16BigEndian(value, 2)).toBe(0xffff);
    expect(readUint16BigEndian(value, 3)).toBeNull();
    expect(readUint24BigEndian(value, 1)).toBe(0xffffff);
    expect(readUint24BigEndian(value, 2)).toBeNull();
  });

  it('honors the byteOffset and length of a Uint8Array subarray', () => {
    const source = bytes(0xee, 0x12, 0x34, 0x56, 0xdd);
    const partial = source.subarray(1, 4);

    expect(readUint16BigEndian(partial, 0)).toBe(0x1234);
    expect(readUint24BigEndian(partial, 0)).toBe(0x123456);
    expect(bytesToHex(partial)).toBe('12 34 56');
  });

  it('formats the complete sequence without Node Buffer', () => {
    expect(bytesToHex(bytes(0x00, 0x0a, 0xff))).toBe('00 0a ff');
  });

  it('returns null reads and an empty hexadecimal sequence for empty input', () => {
    const empty = new Uint8Array();

    expect(readUint16BigEndian(empty, 0)).toBeNull();
    expect(readUint24BigEndian(empty, 0)).toBeNull();
    expect(bytesToHex(empty)).toBe('');
  });
});

describe('decodeBleVersion', () => {
  it('decodes the complete historical 26-byte structure', () => {
    const result = decodeBleVersion(bytes(
      0x00, 0x03, 0x00, 0x05, 0x00, 0x03, 0x01, 0x5c,
      0x01, 0x02, 0x03, 0x04, 0x02, 0x07,
      0x05, 0x06, 0x07, 0x08, 0x12, 0x34,
      0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff,
    ));

    expect(result.valid).toBeTrue();
    if (!result.valid) return;

    expect(result.value.stack).toEqual({
      major: 3, minor: 5, patch: 3, build: 348,
    });
    expect(result.value.bleSoftware).toEqual({
      major: 1, minor: 2, patch: 3, specification: 4,
    });
    expect(result.value.productType).toBe(2);
    expect(result.value.productSubtype).toBe(7);
    expect(result.value.motorSoftware).toEqual({
      major: 5, minor: 6, patch: 7, specification: 8,
    });
    expect(result.value.crc).toBe(0x1234);
    expect(result.value.motorAddressHex).toBe('AA.BB.CC.DD.EE.FF');
  });

  it('accepts the observed 21-byte Widoor frame without a partial address', () => {
    const result = decodeBleVersion(bytes(
      0x00, 0x03, 0x00, 0x05, 0x00, 0x03, 0x01, 0x5c,
      0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0xca, 0x00,
    ));

    expect(result.valid).toBeTrue();
    if (!result.valid) return;

    expect(result.length).toBe(21);
    expect(result.value.productType).toBe(1);
    expect(result.value.productSubtype).toBe(0);
    expect(result.value.crc).toBe(0x00ca);
    expect(result.value.motorAddressHex).toBeNull();
  });

  it('accepts 25 bytes without fabricating a five-byte motor address', () => {
    const frame = new Uint8Array(25);
    frame.fill(0xaa, 20);
    const result = decodeBleVersion(frame);

    expect(result.valid).toBeTrue();
    if (result.valid) {
      expect(result.length).toBe(25);
      expect(result.rawHex.split(' ').length).toBe(25);
      expect(result.value.motorAddressHex).toBeNull();
    }
  });

  [0, 1, 2].forEach((productType) => {
    it(`preserves product byte ${productType}`, () => {
      const frame = new Uint8Array(20);
      frame[12] = productType;
      const result = decodeBleVersion(frame);

      expect(result.valid).toBeTrue();
      if (result.valid) expect(result.value.productType).toBe(productType);
    });
  });

  it('rejects a frame without the complete CRC', () => {
    const result = decodeBleVersion(new Uint8Array(19));

    expect(result.valid).toBeFalse();
    expect(result.value).toBeNull();
    expect(result.errors[0]).toContain('20 bytes');
  });
});

describe('decodeBleDatesAndCycles', () => {
  it('decodes dates and cycle counters at Phase 1 offsets', () => {
    const result = decodeBleDatesAndCycles(bytes(
      24, 1, 2, 24, 3, 4, 5, 25, 6, 7, 8,
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
    ));

    expect(result.valid).toBeTrue();
    if (!result.valid) return;

    expect(result.value.historicalFadDate).toEqual({
      status: 'raw-only',
      rawYear: 24,
      rawMonth: 1,
      rawDay: 2,
      raw: [24, 1, 2],
    });
    expect(result.value.firstCommissioningDate).toEqual({
      rawYear: 24,
      rawMonth: 3,
      rawDay: 4,
      rawHour: 5,
      year: 2024,
      month: 4,
      day: 4,
      hour: 5,
      status: 'present',
      invalidReason: null,
      raw: [24, 3, 4, 5],
    });
    expect(result.value.firstCommissioningDate.hour).toBe(5);
    expect(result.value.lastMaintenanceDate.hour).toBe(8);
    expect(result.value.totalCycles).toBe(0x010203);
    expect(result.value.cyclesSinceMaintenance).toBe(0x040506);
  });

  it('marks all-255 dates as historically not initialized', () => {
    const frame = new Uint8Array(17);
    frame.fill(HISTORICAL_DATE_SENTINEL, 0, 11);
    const result = decodeBleDatesAndCycles(frame);

    expect(result.valid).toBeTrue();
    if (!result.valid) return;

    expect(result.value.historicalFadDate.status).toBe('raw-only');
    expect(result.value.firstCommissioningDate.status).toBe('not-initialized');
    expect(result.value.lastMaintenanceDate.status).toBe('not-initialized');
  });

  it('marks a date absent when one calendar component is 255', () => {
    const frame = bytes(
      24, 0xff, 2, 24, 3, 4, 5, 25, 6, 7, 8,
      0, 0, 0, 0, 0, 0,
    );
    const result = decodeBleDatesAndCycles(frame);

    expect(result.valid).toBeTrue();
    if (result.valid) {
      expect(result.value.historicalFadDate.status).toBe('raw-only');
      expect(result.value.firstCommissioningDate.status).toBe('present');
    }
  });

  it('keeps zero counters but rejects a zero calendar date', () => {
    const result = decodeBleDatesAndCycles(new Uint8Array(17));

    expect(result.valid).toBeTrue();
    if (result.valid) {
      expect(result.value.firstCommissioningDate.status).toBe('invalid');
      expect(result.value.firstCommissioningDate.invalidReason)
        .toBe('zero-date');
      expect(result.value.totalCycles).toBe(0);
      expect(result.value.cyclesSinceMaintenance).toBe(0);
    }
  });

  it('reproduces the physical Widoor dates and cycles frame', () => {
    const result = decodeBleDatesAndCycles(bytes(
      0x00, 0x00, 0x00,
      0x13, 0x07, 0x1b, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x67, 0xd4,
      0x00, 0x00, 0x00,
    ));

    expect(result.valid).toBeTrue();
    if (!result.valid) return;

    expect(result.value.historicalFadDate.raw).toEqual([0, 0, 0]);
    expect(result.value.firstCommissioningDate).toEqual({
      rawYear: 19,
      rawMonth: 7,
      rawDay: 27,
      rawHour: 0,
      year: 2019,
      month: 8,
      day: 27,
      hour: 0,
      status: 'present',
      invalidReason: null,
      raw: [19, 7, 27, 0],
    });
    expect(result.value.lastMaintenanceDate.status).toBe('invalid');
    expect(result.value.lastMaintenanceDate.invalidReason).toBe('zero-date');
    expect(result.value.lastMaintenanceDate.raw).toEqual([0, 0, 0, 0]);
    expect(result.value.totalCycles).toBe(26580);
    expect(result.value.cyclesSinceMaintenance).toBe(0);
  });

  it('normalizes raw month zero to January', () => {
    const frame = bytes(
      0, 0, 0, 20, 0, 1, 0, 20, 0, 1, 0,
      0, 0, 0, 0, 0, 0,
    );
    const result = decodeBleDatesAndCycles(frame);

    expect(result.valid).toBeTrue();
    if (result.valid) {
      expect(result.value.firstCommissioningDate.year).toBe(2020);
      expect(result.value.firstCommissioningDate.month).toBe(1);
      expect(result.value.firstCommissioningDate.day).toBe(1);
      expect(result.value.firstCommissioningDate.status).toBe('present');
    }
  });

  it('normalizes raw month eleven to December', () => {
    const frame = bytes(
      0, 0, 0, 20, 11, 31, 0, 20, 0, 1, 0,
      0, 0, 0, 0, 0, 0,
    );
    const result = decodeBleDatesAndCycles(frame);

    expect(result.valid).toBeTrue();
    if (result.valid) {
      expect(result.value.firstCommissioningDate.month).toBe(12);
      expect(result.value.firstCommissioningDate.status).toBe('present');
    }
  });

  it('rejects invalid day and normalized month values', () => {
    const invalidDay = bytes(
      0, 0, 0, 20, 0, 0, 0, 20, 0, 1, 0,
      0, 0, 0, 0, 0, 0,
    );
    const invalidMonth = bytes(
      0, 0, 0, 20, 12, 1, 0, 20, 0, 1, 0,
      0, 0, 0, 0, 0, 0,
    );
    const dayResult = decodeBleDatesAndCycles(invalidDay);
    const monthResult = decodeBleDatesAndCycles(invalidMonth);

    expect(dayResult.valid).toBeTrue();
    expect(monthResult.valid).toBeTrue();
    if (dayResult.valid && monthResult.valid) {
      expect(dayResult.value.firstCommissioningDate.status).toBe('invalid');
      expect(monthResult.value.firstCommissioningDate.status).toBe('invalid');
    }
  });

  it('accepts February 29 only in leap years', () => {
    const leap = bytes(
      0, 0, 0, 20, 1, 29, 0, 20, 0, 1, 0,
      0, 0, 0, 0, 0, 0,
    );
    const nonLeap = bytes(
      0, 0, 0, 21, 1, 29, 0, 20, 0, 1, 0,
      0, 0, 0, 0, 0, 0,
    );
    const leapResult = decodeBleDatesAndCycles(leap);
    const nonLeapResult = decodeBleDatesAndCycles(nonLeap);

    expect(leapResult.valid).toBeTrue();
    expect(nonLeapResult.valid).toBeTrue();
    if (leapResult.valid && nonLeapResult.valid) {
      expect(leapResult.value.firstCommissioningDate.status).toBe('present');
      expect(nonLeapResult.value.firstCommissioningDate.status).toBe('invalid');
    }
  });

  it('supports maximum uint24 counters', () => {
    const frame = new Uint8Array(17);
    frame.fill(0xff, 11);
    const result = decodeBleDatesAndCycles(frame);

    expect(result.valid).toBeTrue();
    if (result.valid) {
      expect(result.value.totalCycles).toBe(0xffffff);
      expect(result.value.cyclesSinceMaintenance).toBe(0xffffff);
    }
  });

  it('rejects an incomplete frame', () => {
    expect(decodeBleDatesAndCycles(new Uint8Array(16)).valid).toBeFalse();
  });
});

describe('decodeBleMaintenance', () => {
  it('decodes all maintenance offsets', () => {
    const result = decodeBleMaintenance(bytes(
      0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0, 4, 0, 0, 5, 6, 7, 8,
    ));

    expect(result.valid).toBeTrue();
    if (!result.valid) return;

    expect(result.value).toEqual({
      initializationCount: 1,
      cyclesSinceInitialization: 2,
      obstacleDetectionCount: 3,
      wrongStopOpenCount: 4,
      wrongStopCloseCount: 5,
      learningCycleCount: 6,
      encoderErrorCount: 7,
      motorErrorCount: 8,
    });
  });

  it('preserves zero values', () => {
    const result = decodeBleMaintenance(new Uint8Array(18));

    expect(result.valid).toBeTrue();
    if (result.valid) expect(result.value.initializationCount).toBe(0);
  });

  it('supports maximum uint24 values without overflow', () => {
    const frame = new Uint8Array(18);
    frame.fill(0xff);
    const result = decodeBleMaintenance(frame);

    expect(result.valid).toBeTrue();
    if (result.valid) {
      expect(result.value.initializationCount).toBe(0xffffff);
      expect(result.value.wrongStopCloseCount).toBe(0xffffff);
      expect(result.value.motorErrorCount).toBe(0xff);
    }
  });

  it('rejects a 17-byte frame', () => {
    expect(decodeBleMaintenance(new Uint8Array(17)).valid).toBeFalse();
  });
});

describe('decodeBleUserParameters', () => {
  [
    { raw: 0, mode: 'none' },
    { raw: 1, mode: 'locked-open' },
    { raw: 2, mode: 'locked-closed' },
    { raw: 3, mode: 'unknown' },
  ].forEach(({ raw, mode }) => {
    it(`maps raw lock mode ${raw} to ${mode}`, () => {
      const result = decodeBleUserParameters(bytes(raw, 0, 0, 0, 0, 0, 0));

      expect(result.valid).toBeTrue();
      if (result.valid) {
        expect(result.value.lockModeRaw).toBe(raw);
        expect(result.value.lockMode).toBe(mode);
      }
    });
  });

  it('preserves timing, raw bytes and confirmed peripheral flags', () => {
    const result = decodeBleUserParameters(
      bytes(0, 50, 60, 3, 12, 0xf8, 0xa5),
    );

    expect(result.valid).toBeTrue();
    if (!result.valid) return;

    expect(result.value.openSpeed).toBe(50);
    expect(result.value.closeSpeed).toBe(60);
    expect(result.value.shortOpenTime).toBe(3);
    expect(result.value.longOpenTime).toBe(12);
    expect(result.value.peripheralByte1).toBe(0xf8);
    expect(result.value.peripheralByte2).toBe(0xa5);
    expect(result.value.peripheralFlags).toEqual({
      dynamicLight: true,
      staticLight: true,
      light1: true,
      light2: true,
      rgbIndicator: true,
    });
  });

  it('preserves zero parameter values', () => {
    const result = decodeBleUserParameters(new Uint8Array(7));

    expect(result.valid).toBeTrue();
    if (result.valid) expect(result.value.openSpeed).toBe(0);
  });

  it('rejects a short frame', () => {
    expect(decodeBleUserParameters(new Uint8Array(6)).valid).toBeFalse();
  });
});

describe('decodeBleProfessionalParameters', () => {
  const frame = bytes(
    10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 0xa5, 0x5a,
  );

  it('gives offset 2 its Widoor meaning', () => {
    const result = decodeBleProfessionalParameters('widoor', frame);

    expect(result.valid).toBeTrue();
    if (result.valid && result.value.profile === 'widoor') {
      expect(result.value.breakForceAtOpen).toBe(30);
      expect(result.value.nearOpenProportional).toBe(80);
      expect(result.value.nearCloseProportional).toBe(90);
      expect(result.value.peripheralByte1).toBe(0xa5);
      expect(result.value.peripheralByte2).toBe(0x5a);
    }
  });

  (['moventiv-60', 'moventiv-80'] as const).forEach((profile) => {
    it(`gives offset 2 its ${profile} meaning`, () => {
      const result = decodeBleProfessionalParameters(profile, frame);

      expect(result.valid).toBeTrue();
      if (result.valid && result.value.profile !== 'widoor') {
        expect(result.value.exactWeight).toBe(30);
        expect(result.value.brakingOpenPower).toBe(80);
        expect(result.value.obstacleSensitivity).toBe(90);
      }
    });
  });

  it('retains the layout while discriminating Garline', () => {
    const result = decodeBleProfessionalParameters('garline', frame);

    expect(result.valid).toBeTrue();
    if (result.valid) {
      expect(result.value.profile).toBe('garline');
      expect(result.value.weightRangeLower).toBe(10);
      expect(result.value.weightRangeUpper).toBe(20);
    }
  });

  it('rejects unknown and ambiguous profiles', () => {
    const unknown = decodeBleProfessionalParameters('unknown', frame);
    const ambiguous = decodeBleProfessionalParameters('ambiguous', frame);

    expect(unknown.valid).toBeFalse();
    expect(ambiguous.valid).toBeFalse();
    expect(unknown.errors[0]).toContain('unknown');
    expect(ambiguous.errors[0]).toContain('ambiguous');
  });

  it('rejects a short frame', () => {
    expect(
      decodeBleProfessionalParameters('moventiv-60', new Uint8Array(12)).valid,
    ).toBeFalse();
  });
});

function bytes(...values: number[]): Uint8Array {
  return Uint8Array.from(values);
}
