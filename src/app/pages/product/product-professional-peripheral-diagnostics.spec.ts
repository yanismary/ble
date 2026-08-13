import {
  createProfessionalPeripheralDiagnosticRows,
} from './product-professional-peripheral-diagnostics';
import {
  BleProfessionalParameters,
} from '../../core/services/ble-read-decoders';

const text = {
  radarTest1: 'Test radar 1',
  radarTest2: 'Test radar 2',
  peripheralLock: 'Verrouillage périphériques',
  enabled: 'Activé',
  disabled: 'Désactivé',
} as const;

function moventivParameters(
  peripheralByte1: number,
): BleProfessionalParameters {
  return {
    profile: 'moventiv-60',
    weightRangeLower: 10,
    weightRangeUpper: 20,
    exactWeight: 15,
    brakingOpenPower: 1,
    obstacleSensitivity: 1,
    nearOpenSpeed: 1,
    nearCloseSpeed: 1,
    nearOpenTorque: 1,
    nearCloseTorque: 1,
    nearOpenIntegral: 1,
    nearCloseIntegral: 1,
    peripheralByte1,
    peripheralByte2: 0,
  };
}

describe('professional peripheral diagnostics', () => {
  it('maps the Phase 1 radar-test and lock bits as read-only states', () => {
    const rows = createProfessionalPeripheralDiagnosticRows(
      moventivParameters(0x38),
      text,
      { includeLock: true },
    );

    expect(rows.map((row) => row.value)).toEqual([
      'Activé',
      'Activé',
      'Activé',
    ]);
  });

  it('keeps cleared diagnostic bits disabled', () => {
    const rows = createProfessionalPeripheralDiagnosticRows(
      moventivParameters(0x00),
      text,
      { includeLock: true },
    );

    expect(rows.map((row) => row.value)).toEqual([
      'Désactivé',
      'Désactivé',
      'Désactivé',
    ]);
  });

  it('can hide the lock state when the profile/version does not support it', () => {
    const rows = createProfessionalPeripheralDiagnosticRows(
      moventivParameters(0x38),
      text,
      { includeLock: false },
    );

    expect(rows.map((row) => row.key)).toEqual([
      'professional-radar-test-1',
      'professional-radar-test-2',
    ]);
  });
});
