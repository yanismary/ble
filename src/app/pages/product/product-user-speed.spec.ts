import { BLE_UUIDS } from '../../core/services/ble-profile-catalog';
import { encodeLegacyLockMode } from
  '../../core/services/legacy-ble-write-catalog';
import { PRODUCT_PAGE_CONFIG } from './product-page.config';
import {
  createProductUserSpeedAuthorization,
  isValidProductUserSpeedValue,
  productUserSpeedConfigsFor,
} from './product-user-speed';

describe('Product user-speed controls', () => {
  it('exposes open and close speed controls from product configuration',
    () => {
      const widoor = productUserSpeedConfigsFor(PRODUCT_PAGE_CONFIG.widoor);
      const moventiv60 = productUserSpeedConfigsFor(
        PRODUCT_PAGE_CONFIG['moventiv-60'],
      );
      const moventiv80 = productUserSpeedConfigsFor(
        PRODUCT_PAGE_CONFIG['moventiv-80'],
      );
      const garline = productUserSpeedConfigsFor(PRODUCT_PAGE_CONFIG.garline);

      expect(widoor.map((config) => config.field)).toEqual([
        'open-speed',
        'close-speed',
      ]);
      expect(moventiv60.map((config) => config.range)).toEqual([
        { min: 50, max: 100 },
        { min: 50, max: 100 },
      ]);
      expect(moventiv80.map((config) => config.range)).toEqual([
        { min: 50, max: 100 },
        { min: 50, max: 100 },
      ]);
      expect(garline.map((config) => config.range)).toEqual([
        { min: 0, max: 100 },
        { min: 0, max: 100 },
      ]);
    });

  it('uses catalogued user-parameter writes for speed changes', () => {
    const configs = productUserSpeedConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    );
    const open = configs[0].catalogFactory(50);
    const close = configs[1].catalogFactory(75);

    expect(open.serviceUuid).toBe(BLE_UUIDS.moventivGarlineService);
    expect(open.characteristicUuid)
      .toBe(BLE_UUIDS.userParametersCharacteristic);
    expect(open.payloadHex).toBe('01 32');
    expect(close.payloadHex).toBe('02 4b');
    expect(open.destructiveLevel).toBe('non-destructive-setting');
    expect(open.hardwareValidationStatus).toBe('phase1-reference-only');
  });

  it('validates integer values against the configured profile range', () => {
    const widoorOpen = productUserSpeedConfigsFor(
      PRODUCT_PAGE_CONFIG.widoor,
    )[0];
    const garlineOpen = productUserSpeedConfigsFor(
      PRODUCT_PAGE_CONFIG.garline,
    )[0];

    expect(isValidProductUserSpeedValue(widoorOpen, 25)).toBeTrue();
    expect(isValidProductUserSpeedValue(widoorOpen, 100)).toBeTrue();
    expect(isValidProductUserSpeedValue(widoorOpen, 24)).toBeFalse();
    expect(isValidProductUserSpeedValue(widoorOpen, 25.5)).toBeFalse();
    expect(isValidProductUserSpeedValue(garlineOpen, 0)).toBeTrue();
    expect(isValidProductUserSpeedValue(garlineOpen, -1)).toBeFalse();
  });

  it('creates scoped authorizations for catalogued speed writes', () => {
    const write = productUserSpeedConfigsFor(PRODUCT_PAGE_CONFIG.widoor)[1]
      .catalogFactory(35);
    const authorization = createProductUserSpeedAuthorization({
      write,
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    });

    expect(authorization.confirmedByUser).toBeTrue();
    expect(authorization.profile).toBe('widoor');
    expect(authorization.operation).toBe('close-speed');
    expect(authorization.payloadHex).toBe('02 23');
    expect(authorization.motorMovementConfirmed).toBeUndefined();
  });

  it('rejects non-speed writes', () => {
    expect(() => createProductUserSpeedAuthorization({
      write: encodeLegacyLockMode('widoor', 'none'),
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    })).toThrowError(/user-speed write/);
  });
});
