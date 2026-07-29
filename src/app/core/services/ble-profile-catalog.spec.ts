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

  it('should centralize every confirmed Phase 1 read UUID', () => {
    expect(BLE_UUIDS).toEqual(jasmine.objectContaining({
      shdoService: 'dc06d52e-6ee8-471e-a5fd-0f40674a061d',
      nameCharacteristic: 'e36d5943-cc43-4d59-89ed-bcd58a70d85d',
      versionCharacteristic: '175d6bc8-5840-4037-95da-a778395a036c',
      datesAndCyclesCharacteristic:
        '02e9b750-65dc-48c5-a269-78afe8528b71',
      motorStateCharacteristic:
        'e56b24a5-3309-487e-9aa6-079cd32270ae',
      maintenanceCharacteristic:
        '90a9b170-c180-4af6-8ca0-263170e8a315',
      userParametersCharacteristic:
        '7c7679a6-5a0d-4cbd-8cbe-93b6d6b4b80f',
      professionalParametersCharacteristic:
        '15e9eef3-939b-4e66-baf9-772d8bd18c41',
      completeParametersCharacteristic:
        'cc942243-7656-441f-880c-4617eeb8bacc',
    }));
  });

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
