import { BLE_UUIDS } from '../../core/services/ble-profile-catalog';
import { encodeLegacyLockMode } from
  '../../core/services/legacy-ble-write-catalog';
import { PRODUCT_PAGE_CONFIG } from './product-page.config';
import {
  createProductUserTimingAuthorization,
  isValidProductUserTimingValue,
  productUserTimingConfigsFor,
} from './product-user-timing';

describe('Product user-timing controls', () => {
  it('exposes timing controls from product configuration', () => {
    expect(productUserTimingConfigsFor(PRODUCT_PAGE_CONFIG.widoor).map(
      (config) => config.field,
    )).toEqual(['short-timing']);
    expect(productUserTimingConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    ).map((config) => config.field)).toEqual(['short-timing']);
    expect(productUserTimingConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-80'],
    ).map((config) => config.field)).toEqual(['short-timing']);
    expect(productUserTimingConfigsFor(PRODUCT_PAGE_CONFIG.garline).map(
      (config) => config.field,
    )).toEqual(['short-timing', 'long-timing']);
  });

  it('uses catalogued user-parameter writes for timing changes', () => {
    const configs = productUserTimingConfigsFor(PRODUCT_PAGE_CONFIG.garline);
    const short = configs[0].catalogFactory(0);
    const long = configs[1].catalogFactory(60);

    expect(short.serviceUuid).toBe(BLE_UUIDS.moventivGarlineService);
    expect(short.characteristicUuid)
      .toBe(BLE_UUIDS.userParametersCharacteristic);
    expect(short.payloadHex).toBe('03 00');
    expect(long.payloadHex).toBe('04 3c');
    expect(short.destructiveLevel).toBe('non-destructive-setting');
    expect(short.hardwareValidationStatus).toBe('phase1-reference-only');
  });

  it('validates integer values against profile timing ranges', () => {
    const widoorShort = productUserTimingConfigsFor(
      PRODUCT_PAGE_CONFIG.widoor,
    )[0];
    const garlineLong = productUserTimingConfigsFor(
      PRODUCT_PAGE_CONFIG.garline,
    )[1];

    expect(isValidProductUserTimingValue(widoorShort, 0)).toBeTrue();
    expect(isValidProductUserTimingValue(widoorShort, 60)).toBeTrue();
    expect(isValidProductUserTimingValue(widoorShort, 61)).toBeFalse();
    expect(isValidProductUserTimingValue(widoorShort, 10.5)).toBeFalse();
    expect(isValidProductUserTimingValue(garlineLong, 1)).toBeTrue();
    expect(isValidProductUserTimingValue(garlineLong, 0)).toBeFalse();
    expect(isValidProductUserTimingValue(garlineLong, 60)).toBeTrue();
  });

  it('creates scoped authorizations for catalogued timing writes', () => {
    const write = productUserTimingConfigsFor(PRODUCT_PAGE_CONFIG.garline)[1]
      .catalogFactory(10);
    const authorization = createProductUserTimingAuthorization({
      write,
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    });

    expect(authorization.confirmedByUser).toBeTrue();
    expect(authorization.profile).toBe('garline');
    expect(authorization.operation).toBe('long-timing');
    expect(authorization.payloadHex).toBe('04 0a');
    expect(authorization.motorMovementConfirmed).toBeUndefined();
  });

  it('rejects non-timing writes', () => {
    expect(() => createProductUserTimingAuthorization({
      write: encodeLegacyLockMode('widoor', 'none'),
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    })).toThrowError(/user-timing write/);
  });
});
