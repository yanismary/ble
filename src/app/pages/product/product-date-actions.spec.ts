import { BLE_UUIDS } from '../../core/services/ble-profile-catalog';
import { HistoricalBleDate } from '../../core/services/ble-read-decoders';
import {
  encodeLegacyNameWrite,
} from '../../core/services/legacy-ble-write-catalog';
import {
  canInitializeFirstCommissioning,
  canRecordMaintenance,
  createProductDateActionAuthorization,
  legacyDateFieldsFromDate,
  prepareFirstCommissioningDateAction,
  prepareMaintenanceDateAction,
  prepareProductDateMaintenanceFlow,
} from './product-date-actions';

describe('Product date actions', () => {
  it('converts Date to the legacy YY/MM0/DD/HH fields', () => {
    expect(legacyDateFieldsFromDate(
      new Date(2026, 0, 2, 3, 59, 58),
    )).toEqual({
      year: 26,
      month: 0,
      day: 2,
      hour: 3,
    });
    expect(legacyDateFieldsFromDate(
      new Date(2026, 11, 31, 23, 1, 2),
    )).toEqual({
      year: 26,
      month: 11,
      day: 31,
      hour: 23,
    });
    expect(legacyDateFieldsFromDate(
      new Date(2027, 6, 14, 11, 47, 30),
    )).toEqual({
      year: 27,
      month: 6,
      day: 14,
      hour: 11,
    });
    expect(legacyDateFieldsFromDate(
      new Date(2000, 0, 1, 0),
    )).toEqual({
      year: 0,
      month: 0,
      day: 1,
      hour: 0,
    });
    expect(legacyDateFieldsFromDate(
      new Date(2255, 11, 31, 23),
    )).toEqual({
      year: 255,
      month: 11,
      day: 31,
      hour: 23,
    });
    expect(() => legacyDateFieldsFromDate(new Date(1999, 0, 1, 0)))
      .toThrowError(/legacy range/);
    expect(() => legacyDateFieldsFromDate(new Date(2256, 0, 1, 0)))
      .toThrowError(/legacy range/);
    expect(() => legacyDateFieldsFromDate(new Date(Number.NaN)))
      .toThrowError(/valid/);
  });

  it('allows first commissioning only for supported profiles with an empty date',
    () => {
      for (const profile of ['moventiv-60', 'moventiv-80', 'garline'] as const) {
        expect(canInitializeFirstCommissioning({
          context: contextFor(profile),
          firstCommissioningDate: notInitializedDate(),
        })).toBeTrue();
      }
      expect(canInitializeFirstCommissioning({
        context: contextFor('widoor'),
        firstCommissioningDate: notInitializedDate(),
      })).toBeFalse();
      expect(canInitializeFirstCommissioning({
        context: null,
        firstCommissioningDate: notInitializedDate(),
      })).toBeFalse();
      expect(canInitializeFirstCommissioning({
        context: contextFor('moventiv-60'),
        firstCommissioningDate: presentDate(),
      })).toBeFalse();
      expect(canInitializeFirstCommissioning({
        context: contextFor('moventiv-60'),
        firstCommissioningDate: invalidDate(),
      })).toBeFalse();
    },
  );

  it('prepares exactly one first-commissioning write with the expected payload',
    () => {
      const result = prepareFirstCommissioningDateAction({
        context: contextFor('moventiv-60'),
        firstCommissioningDate: notInitializedDate(),
        now: new Date(2026, 0, 2, 3, 59, 58),
        attemptId: 'attempt-1',
        confirmationId: 'confirmation-1',
        confirmedAt: 1_000,
      });

      expect(result.ok).toBeTrue();
      if (!result.ok) {
        return;
      }
      expect(result.write.operation).toBe('first-commissioning-date');
      expect(result.write.serviceUuid).toBe(BLE_UUIDS.shdoService);
      expect(result.write.characteristicUuid)
        .toBe(BLE_UUIDS.datesAndCyclesCharacteristic);
      expect(result.write.payloadHex).toBe('01 1a 00 02 03');
      expect(Array.from(result.write.payload)).toEqual([0x01, 26, 0, 2, 3]);
      expect(result.request.write).toBe(result.write);
      expect(result.request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
      expect(result.request.policy).toEqual({
        allowPhase1ReferenceOnly: true,
      });
      expect(result.historicalEffect).toBeTrue();
      expect(result.resetsLocalCounters).toBeFalse();
    },
  );

  it('prepares first commissioning for every supported product date profile',
    () => {
      for (const profile of ['moventiv-60', 'moventiv-80', 'garline'] as const) {
        const result = prepareFirstCommissioningDateAction({
          context: contextFor(profile),
          firstCommissioningDate: notInitializedDate(),
          now: new Date(2026, 0, 2, 3),
          attemptId: `attempt-${profile}`,
          confirmationId: `confirmation-${profile}`,
          confirmedAt: 1_000,
        });

        expect(result.ok).toBeTrue();
        if (!result.ok) {
          return;
        }
        expect(result.write.profile).toBe(profile);
        expect(result.write.operation).toBe('first-commissioning-date');
        expect(result.write.payloadHex).toBe('01 1a 00 02 03');
        expect(result.request.profile).toBe(profile);
        expect(result.request.deviceId).toBe('device-1');
        expect(result.request.connectionGeneration).toBe(4);
      }
    },
  );

  it('refuses first commissioning when the product history is not empty',
    () => {
      expect(prepareFirstCommissioningDateAction({
        context: contextFor('moventiv-80'),
        firstCommissioningDate: presentDate(),
        now: new Date(2026, 0, 2, 3),
        attemptId: 'attempt-1',
        confirmationId: 'confirmation-1',
        confirmedAt: 1_000,
      })).toEqual(jasmine.objectContaining({
        ok: false,
        reason: 'first-commissioning-already-initialized',
        write: null,
        request: null,
      }));
      expect(prepareFirstCommissioningDateAction({
        context: contextFor('garline'),
        firstCommissioningDate: invalidDate(),
        now: new Date(2026, 0, 2, 3),
        attemptId: 'attempt-1',
        confirmationId: 'confirmation-1',
        confirmedAt: 1_000,
      })).toEqual(jasmine.objectContaining({
        ok: false,
        reason: 'first-commissioning-date-invalid',
        write: null,
        request: null,
      }));
    },
  );

  it('allows maintenance for supported profiles without resetting local counters',
    () => {
      for (const profile of ['moventiv-60', 'moventiv-80', 'garline'] as const) {
        expect(canRecordMaintenance(contextFor(profile))).toBeTrue();
        const result = prepareMaintenanceDateAction({
          context: contextFor(profile),
          now: new Date(2026, 11, 31, 23, 12, 30),
          attemptId: `attempt-${profile}`,
          confirmationId: `confirmation-${profile}`,
          confirmedAt: 2_000,
        });

        expect(result.ok).toBeTrue();
        if (!result.ok) {
          return;
        }
        expect(result.action).toBe('maintenance');
        expect(result.write.operation).toBe('maintenance-date');
        expect(result.write.payloadHex).toBe('02 1a 0b 1f 17');
        expect(Array.from(result.write.payload))
          .toEqual([0x02, 26, 11, 31, 23]);
        expect(result.historicalEffect).toBeTrue();
        expect(result.resetsLocalCounters).toBeFalse();
        expect(result.request.write).toBe(result.write);
      }
    },
  );

  it('prepares the Phase 1 setup flow as maintenance then first commissioning',
    () => {
      const result = prepareProductDateMaintenanceFlow({
        context: contextFor('garline'),
        firstCommissioningDate: notInitializedDate(),
        now: new Date(2026, 0, 2, 3),
        attemptId: 'attempt-1',
        confirmationId: 'confirmation-1',
        confirmedAt: 1_000,
      });

      expect(result.ok).toBeTrue();
      if (!result.ok) {
        return;
      }
      expect(result.kind).toBe('first-commissioning');
      expect(result.actions.length).toBe(2);
      expect(result.actions.map(({ write }) => write.operation)).toEqual([
        'maintenance-date',
        'first-commissioning-date',
      ]);
      expect(result.actions.map(({ write }) => write.payloadHex)).toEqual([
        '02 1a 00 02 03',
        '01 1a 00 02 03',
      ]);
      expect(result.historicalEffect).toBeTrue();
      expect(result.resetsLocalCounters).toBeFalse();
    },
  );

  it('prepares the Phase 1 maintenance flow as maintenance only',
    () => {
      const result = prepareProductDateMaintenanceFlow({
        context: contextFor('moventiv-80'),
        firstCommissioningDate: presentDate(),
        now: new Date(2026, 11, 31, 23),
        attemptId: 'attempt-1',
        confirmationId: 'confirmation-1',
        confirmedAt: 1_000,
      });

      expect(result.ok).toBeTrue();
      if (!result.ok) {
        return;
      }
      expect(result.kind).toBe('maintenance');
      expect(result.actions.length).toBe(1);
      expect(result.actions[0].write.operation).toBe('maintenance-date');
      expect(result.actions[0].write.payloadHex).toBe('02 1a 0b 1f 17');
    },
  );

  it('refuses the maintenance flow for Widoor and invalid contexts', () => {
    expect(prepareProductDateMaintenanceFlow({
      context: contextFor('widoor'),
      firstCommissioningDate: notInitializedDate(),
      now: new Date(2026, 0, 2, 3),
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    })).toEqual(jasmine.objectContaining({
      ok: false,
      reason: 'unsupported-profile',
      actions: [],
    }));
    expect(prepareProductDateMaintenanceFlow({
      context: null,
      firstCommissioningDate: notInitializedDate(),
      now: new Date(2026, 0, 2, 3),
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    })).toEqual(jasmine.objectContaining({
      ok: false,
      reason: 'invalid-context',
      actions: [],
    }));
  });

  it('refuses unsupported profile and invalid contexts before any write',
    () => {
      for (const input of [
        { ...contextFor('moventiv-60'), deviceId: ' ' },
        { ...contextFor('moventiv-60'), connectionGeneration: -1 },
        { ...contextFor('moventiv-60'), identificationConfidence: 'weak' as const },
      ]) {
        expect(prepareMaintenanceDateAction({
          context: input,
          now: new Date(2026, 0, 2, 3),
          attemptId: 'attempt-1',
          confirmationId: 'confirmation-1',
          confirmedAt: 1_000,
        })).toEqual(jasmine.objectContaining({
          ok: false,
          reason: 'invalid-context',
          write: null,
          request: null,
        }));
      }
      expect(canRecordMaintenance(contextFor('widoor'))).toBeFalse();
      expect(prepareFirstCommissioningDateAction({
        context: contextFor('widoor'),
        firstCommissioningDate: notInitializedDate(),
        now: new Date(2026, 0, 2, 3),
        attemptId: 'attempt-1',
        confirmationId: 'confirmation-1',
        confirmedAt: 1_000,
      })).toEqual(jasmine.objectContaining({
        ok: false,
        reason: 'unsupported-profile',
        write: null,
        request: null,
      }));
      expect(prepareMaintenanceDateAction({
        context: contextFor('widoor'),
        now: new Date(2026, 0, 2, 3),
        attemptId: 'attempt-1',
        confirmationId: 'confirmation-1',
        confirmedAt: 1_000,
      })).toEqual(jasmine.objectContaining({
        ok: false,
        reason: 'unsupported-profile',
        write: null,
        request: null,
      }));
    },
  );

  it('creates scoped authorizations only for product date writes', () => {
    const prepared = prepareMaintenanceDateAction({
      context: contextFor('garline'),
      now: new Date(2026, 0, 2, 3),
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    });

    expect(prepared.ok).toBeTrue();
    if (!prepared.ok) {
      return;
    }
    expect(prepared.authorization).toEqual(jasmine.objectContaining({
      operation: 'maintenance-date',
      payloadHex: '02 1a 00 02 03',
      profile: 'garline',
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
    }));
    expect(() => createProductDateActionAuthorization({
      write: encodeLegacyNameWrite('garline', 'Porte'),
      context: contextFor('garline'),
      attemptId: 'attempt-2',
      confirmationId: 'confirmation-2',
      confirmedAt: 1_000,
    })).toThrowError(/product date write/);
  });
});

function contextFor(profile: 'widoor' | 'moventiv-60' | 'moventiv-80' | 'garline') {
  return Object.freeze({
    profile,
    deviceId: 'device-1',
    connectionGeneration: 4,
    identificationConfidence: 'strong' as const,
  });
}

function notInitializedDate(): HistoricalBleDate {
  return Object.freeze({
    rawYear: 0xff,
    rawMonth: 0xff,
    rawDay: 0xff,
    rawHour: 0xff,
    year: null,
    month: null,
    day: null,
    hour: null,
    status: 'not-initialized',
    invalidReason: null,
    raw: [0xff, 0xff, 0xff, 0xff],
  });
}

function presentDate(): HistoricalBleDate {
  return Object.freeze({
    rawYear: 26,
    rawMonth: 0,
    rawDay: 2,
    rawHour: 3,
    year: 2026,
    month: 1,
    day: 2,
    hour: 3,
    status: 'present',
    invalidReason: null,
    raw: [26, 0, 2, 3],
  });
}

function invalidDate(): HistoricalBleDate {
  return Object.freeze({
    rawYear: 0,
    rawMonth: 0,
    rawDay: 0,
    rawHour: 0,
    year: null,
    month: null,
    day: null,
    hour: null,
    status: 'invalid',
    invalidReason: 'zero-date',
    raw: [0, 0, 0, 0],
  });
}
