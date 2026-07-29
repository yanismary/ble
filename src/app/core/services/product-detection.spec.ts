import { TestBed } from '@angular/core/testing';
import { BleService as DiscoveredBleService } from '@capacitor-community/bluetooth-le';

import {
  BLE_UUIDS,
  DetectedProductType,
  mapDetectionResultToProductProfile,
  ProductDetection,
} from './product-detection';

describe('ProductDetection', () => {
  let service: ProductDetection;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductDetection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should interpret the confirmed seven-byte motor state frame', () => {
    const result = service.interpretMotorState(
      dataView([3, 0x01, 0x02, 0x03, 0x04, 5, 0xbd]),
    );

    expect(result.rawHex).toBe('03 01 02 03 04 05 bd');
    expect(result.length).toBe(7);
    expect(result.state).toBe(3);
    expect(result.currentPosition).toBe(258);
    expect(result.maximumPosition).toBe(772);
    expect(result.error).toBe(5);
    expect(result.switches).toEqual({
      raw: 0xbd,
      unknownHighBits: 0xa0,
      pushAndGo: true,
      ble: true,
      automaticManual: true,
      direction: false,
      pairing: true,
    });
  });

  it('should preserve zero positions in the observed Widoor frame', () => {
    const result = service.interpretMotorState(
      dataView([0x01, 0, 0, 0, 0, 0, 0x08]),
    );

    expect(result.rawHex).toBe('01 00 00 00 00 00 08');
    expect(result.state).toBe(1);
    expect(result.currentPosition).toBe(0);
    expect(result.maximumPosition).toBe(0);
    expect(result.error).toBe(0);
    expect(result.switches?.raw).toBe(0x08);
    expect(result.switches?.ble).toBeTrue();
    expect(result.switches?.direction).toBeFalse();
  });

  it('should interpret a short motor state frame without unsafe access', () => {
    const result = service.interpretMotorState(dataView([7, 0x01]));

    expect(result.rawHex).toBe('07 01');
    expect(result.length).toBe(2);
    expect(result.state).toBe(7);
    expect(result.currentPosition).toBeNull();
    expect(result.maximumPosition).toBeNull();
    expect(result.error).toBeNull();
    expect(result.switches).toBeNull();
  });

  it('should interpret a version word that is too short safely', () => {
    const result = service.interpretVersion(
      dataView([0xaa, 0xbb]),
      'Produit',
      'Inconnu',
    );

    expect(result.rawHex).toBe('aa bb');
    expect(result.length).toBe(2);
    expect(result.productByte).toBeNull();
    expect(result.subtypeByte).toBeNull();
    expect(result.detectedType).toBe('Inconnu');
    expect(result.detectionReason).toBe('Aucun indice de produit reconnu');
  });

  [
    { productByte: 0, expected: 'Moventiv 60 kg' },
    { productByte: 1, expected: 'Moventiv 80 kg' },
    { productByte: 2, expected: 'Garline' },
    { productByte: 99, expected: 'Inconnu' },
  ].forEach(({ productByte, expected }) => {
    it(`should map product byte ${productByte} to ${expected}`, () => {
      const result = service.interpretVersion(
        versionWord(productByte, 7),
        'Produit',
        'Moventiv / Garline',
      );

      expect(result.productByte).toBe(productByte);
      expect(result.subtypeByte).toBe(7);
      expect(result.detectedType).toBe(expected);
      expect(result.detectionReason).toBe(
        `Service Moventiv/Garline + octet produit ${productByte}`,
      );
    });
  });

  it('should detect an old Widoor by its service despite its name and product byte', () => {
    const result = service.interpretVersion(
      versionWord(1, 0),
      'Firma#CHA',
      'Widoor',
    );

    expect(result.productByte).toBe(1);
    expect(result.detectedType).toBe('Widoor');
    expect(result.ambiguous).toBeFalse();
    expect(result.detectionReason).toBe(
      'Service secondaire Widoor détecté',
    );
  });

  it('should detect Widoor from its service and a normalized WI name', () => {
    const result = service.interpretVersion(
      versionWord(1, 3),
      '  wi-door  ',
      'Widoor',
    );

    expect(result.detectedType).toBe('Widoor');
    expect(result.ambiguous).toBeFalse();
    expect(result.detectionReason).toBe(
      'Service secondaire Widoor détecté',
    );
  });

  it('should detect Widoor with lower confidence from its name alone', () => {
    const result = service.interpretVersion(
      versionWord(1, 3),
      'WI-001',
      'Inconnu',
    );

    expect(result.detectedType).toBe('Widoor');
    expect(result.ambiguous).toBeFalse();
    expect(result.detectionReason).toBe(
      'Nom Bluetooth WI sans service secondaire connu',
    );
    expect(result.detectionConfidence).toBe('Faible');
  });

  it('should expose contradictory identification clues as ambiguous', () => {
    spyOn(console, 'warn');

    const result = service.interpretVersion(
      versionWord(2, 3),
      'WI-001',
      'Moventiv / Garline',
    );

    expect(result.detectedType).toBe('Ambigu');
    expect(result.ambiguous).toBeTrue();
    expect(result.detectionReason).toContain(
      'contradictoire avec le nom Bluetooth WI',
    );
    expect(console.warn).toHaveBeenCalled();
  });

  it('should return unknown for a short Moventiv/Garline version word', () => {
    const result = service.interpretVersion(
      dataView([0, 1]),
      'Produit',
      'Moventiv / Garline',
    );

    expect(result.detectedType).toBe('Inconnu');
    expect(result.detectionReason).toBe(
      'Service Moventiv/Garline sans octet produit',
    );
  });

  it('should detect each known secondary profile by UUID', () => {
    expect(service.detectSecondaryProfile([
      discoveredService(BLE_UUIDS.widoorService.toUpperCase()),
    ])).toBe('Widoor');
    expect(service.detectSecondaryProfile([
      discoveredService(BLE_UUIDS.moventivGarlineService),
    ])).toBe('Moventiv / Garline');
    expect(service.detectSecondaryProfile([
      discoveredService('unknown-service'),
    ])).toBe('Inconnu');
  });

  it('should expose simultaneous secondary services as contradictory', () => {
    const profile = service.detectSecondaryProfile([
      discoveredService(BLE_UUIDS.widoorService),
      discoveredService(BLE_UUIDS.moventivGarlineService),
    ]);
    spyOn(console, 'warn');

    const result = service.interpretVersion(
      versionWord(1, 0),
      'Firma#CHA',
      profile,
    );

    expect(profile).toBe('Contradictoire');
    expect(result.detectedType).toBe('Ambigu');
    expect(result.detectionReason).toBe(
      'Services secondaires contradictoires',
    );
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('mapDetectionResultToProductProfile', () => {
  [
    { detectedType: 'Widoor', expected: 'widoor' },
    { detectedType: 'Moventiv 60 kg', expected: 'moventiv-60' },
    { detectedType: 'Moventiv 80 kg', expected: 'moventiv-80' },
    { detectedType: 'Garline', expected: 'garline' },
    { detectedType: 'Inconnu', expected: 'unknown' },
    { detectedType: 'Ambigu', expected: 'ambiguous' },
  ].forEach(({ detectedType, expected }) => {
    it(`should map ${detectedType} to ${expected}`, () => {
      expect(mapDetectionResultToProductProfile({
        detectedType: detectedType as DetectedProductType,
        ambiguous: detectedType === 'Ambigu',
        detectionConfidence: 'Forte',
      })).toBe(expected);
    });
  });

  it('should prefer ambiguous when otherwise known clues contradict', () => {
    expect(mapDetectionResultToProductProfile({
      detectedType: 'Widoor',
      ambiguous: true,
      detectionConfidence: 'Forte',
    })).toBe('ambiguous');
  });

  it('should not make a low-confidence detection writable', () => {
    expect(mapDetectionResultToProductProfile({
      detectedType: 'Widoor',
      ambiguous: false,
      detectionConfidence: 'Faible',
    })).toBe('unknown');
  });

  it('should safely map an unrecognized runtime value to unknown', () => {
    expect(mapDetectionResultToProductProfile({
      detectedType: 'Unexpected' as DetectedProductType,
      ambiguous: false,
      detectionConfidence: 'Forte',
    })).toBe('unknown');
  });
});

function dataView(bytes: readonly number[]): DataView {
  return new DataView(Uint8Array.from(bytes).buffer);
}

function versionWord(productByte: number, subtypeByte: number): DataView {
  return dataView([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    productByte,
    subtypeByte,
  ]);
}

function discoveredService(uuid: string): DiscoveredBleService {
  return { uuid, characteristics: [] };
}
