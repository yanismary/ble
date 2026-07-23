import { TestBed } from '@angular/core/testing';
import { BleService as DiscoveredBleService } from '@capacitor-community/bluetooth-le';

import {
  BLE_UUIDS,
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
