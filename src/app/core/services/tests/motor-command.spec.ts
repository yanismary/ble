import { MotorCommand, ProductProfile } from '../ble-profile-catalog';
import { encodeMotorCommand } from '../motor-command';

describe('encodeMotorCommand', () => {
  const knownProfiles: readonly ProductProfile[] = [
    'widoor',
    'moventiv-60',
    'moventiv-80',
    'garline',
  ];

  knownProfiles.forEach((profile) => {
    it(`should encode OPEN for ${profile}`, () => {
      const result = encodeMotorCommand(profile, 'OPEN');

      expect(Array.from(result)).toEqual([0x00, 0x20, 0x00, 0x00]);
      expect(result.byteLength).toBe(4);
    });
  });

  it('should return an independent frame for each encoding', () => {
    const first = encodeMotorCommand('widoor', 'OPEN');
    const second = encodeMotorCommand('widoor', 'OPEN');

    first[0] = 0xff;

    expect(Array.from(second)).toEqual([0x00, 0x20, 0x00, 0x00]);
  });

  ['unknown', 'ambiguous'].forEach((profile) => {
    it(`should reject ${profile}`, () => {
      expect(() => encodeMotorCommand(
        profile as ProductProfile,
        'OPEN',
      )).toThrowError(`BLE writes are forbidden for profile "${profile}".`);
    });
  });

  it('should reject a command that is not in the profile catalog', () => {
    expect(() => encodeMotorCommand(
      'widoor',
      'CLOSE' as MotorCommand,
    )).toThrowError(
      'Motor command "CLOSE" is not allowed for profile "widoor".',
    );
  });
});
