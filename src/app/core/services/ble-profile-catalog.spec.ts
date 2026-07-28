import {
  BLE_PROFILE_CATALOG,
  BLE_UUIDS,
  ProductProfile,
} from './ble-profile-catalog';

describe('BLE profile catalog', () => {
  const knownProfiles: readonly ProductProfile[] = [
    'widoor',
    'moventiv-60',
    'moventiv-80',
    'garline',
  ];

  it('should expose the confirmed common motor UUIDs for known profiles', () => {
    knownProfiles.forEach((profile) => {
      const configuration = BLE_PROFILE_CATALOG[profile];

      expect(configuration.writable).toBeTrue();
      if (configuration.writable) {
        expect(configuration.primaryServiceUuid).toBe(BLE_UUIDS.shdoService);
        expect(configuration.motorCommandCharacteristicUuid).toBe(
          BLE_UUIDS.motorCommandCharacteristic,
        );
        expect(configuration.motorStateCharacteristicUuid).toBe(
          BLE_UUIDS.motorStateCharacteristic,
        );
        expect(configuration.writeWithResponse).toBeTrue();
        expect(configuration.allowedCommands).toEqual(['OPEN']);
      }
    });
  });

  it('should expose the confirmed secondary service for each known profile', () => {
    const widoor = BLE_PROFILE_CATALOG.widoor;
    const moventiv60 = BLE_PROFILE_CATALOG['moventiv-60'];
    const moventiv80 = BLE_PROFILE_CATALOG['moventiv-80'];
    const garline = BLE_PROFILE_CATALOG.garline;

    expect(widoor.writable && widoor.secondaryServiceUuid).toBe(
      BLE_UUIDS.widoorService,
    );
    [moventiv60, moventiv80, garline].forEach((configuration) => {
      expect(
        configuration.writable && configuration.secondaryServiceUuid,
      ).toBe(BLE_UUIDS.moventivGarlineService);
    });
  });

  it('should forbid writes for unknown and ambiguous profiles', () => {
    expect(BLE_PROFILE_CATALOG.unknown).toEqual({
      writable: false,
      allowedCommands: [],
    });
    expect(BLE_PROFILE_CATALOG.ambiguous).toEqual({
      writable: false,
      allowedCommands: [],
    });
  });
});
