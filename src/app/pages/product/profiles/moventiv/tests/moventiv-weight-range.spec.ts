import { BLE_UUIDS } from '../../../../../core/services/ble-profile-catalog';
import { encodeLegacyLockMode } from
  '../../../../../core/services/legacy-ble-write-catalog';
import { PRODUCT_PAGE_CONFIG } from
  '../../product-page-config.facade';
import {
  createProductWeightRangeAuthorization,
  formatProductWeightRangeLabel,
  isSameProductWeightRange,
  isValidProductWeightRange,
  productWeightRangeConfigsFor,
} from '../moventiv-weight-range';

describe('Product weight-range controls', () => {
  it('uses the exact Phase 1 labels for every Moventiv range', () => {
    const labels = productWeightRangeConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    ).map((config) => config.label);

    expect(labels).toEqual([
      '< 20Kg',
      '20-30Kg',
      '30-40Kg',
      '40-50Kg',
      '50-60Kg',
      '60-80Kg',
    ]);
    expect(formatProductWeightRangeLabel({ lower: 10, upper: 20 }))
      .toBe('< 20Kg');
  });

  it('exposes weight ranges from product configuration', () => {
    expect(productWeightRangeConfigsFor(PRODUCT_PAGE_CONFIG.widoor))
      .toEqual([]);
    expect(productWeightRangeConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    ).map((config) => config.range)).toEqual([
      { lower: 10, upper: 20 },
      { lower: 20, upper: 30 },
      { lower: 30, upper: 40 },
      { lower: 40, upper: 50 },
      { lower: 50, upper: 60 },
      { lower: 60, upper: 80 },
    ]);
    expect(productWeightRangeConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-80'],
    ).map((config) => config.range)).toEqual([
      { lower: 10, upper: 20 },
      { lower: 20, upper: 30 },
      { lower: 30, upper: 40 },
      { lower: 40, upper: 50 },
      { lower: 50, upper: 60 },
      { lower: 60, upper: 80 },
    ]);
    expect(PRODUCT_PAGE_CONFIG.garline.weightRanges).toEqual([
      { lower: 60, upper: 80 },
      { lower: 80, upper: 100 },
      { lower: 100, upper: 120 },
      { lower: 120, upper: 140 },
    ]);
    expect(productWeightRangeConfigsFor(PRODUCT_PAGE_CONFIG.garline))
      .toEqual([]);
  });

  it('uses catalogued writes only for interactive weight ranges', () => {
    const moventiv60 = productWeightRangeConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    )[5];
    const moventiv80 = productWeightRangeConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-80'],
    )[5];

    expect(moventiv60.catalogFactory(moventiv60.range).payloadHex)
      .toBe('00 3c 50');
    const write = moventiv80.catalogFactory(moventiv80.range);
    expect(write.serviceUuid).toBe(BLE_UUIDS.moventivGarlineService);
    expect(write.characteristicUuid)
      .toBe(BLE_UUIDS.professionalParametersCharacteristic);
    expect(write.payloadHex).toBe('00 3c 50');
    expect(write.destructiveLevel).toBe('non-destructive-setting');
    expect(write.hardwareValidationStatus).toBe('phase1-reference-only');
    expect(productWeightRangeConfigsFor(PRODUCT_PAGE_CONFIG.garline))
      .toEqual([]);
  });

  it('validates complete lower and upper bounds by profile', () => {
    const moventiv60 = productWeightRangeConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    );
    const moventiv80 = productWeightRangeConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-80'],
    );
    const garline = productWeightRangeConfigsFor(PRODUCT_PAGE_CONFIG.garline);

    expect(isValidProductWeightRange(
      moventiv60,
      { lower: 50, upper: 60 },
    )).toBeTrue();
    expect(isValidProductWeightRange(
      moventiv60,
      { lower: 60, upper: 80 },
    )).toBeTrue();
    expect(isValidProductWeightRange(
      moventiv80,
      { lower: 60, upper: 80 },
    )).toBeTrue();
    expect(isValidProductWeightRange(
      moventiv80,
      { lower: 80, upper: 100 },
    )).toBeFalse();
    expect(isValidProductWeightRange(
      garline,
      { lower: 120, upper: 140 },
    )).toBeFalse();
    expect(isValidProductWeightRange(
      garline,
      { lower: 50, upper: 60 },
    )).toBeFalse();
  });

  it('compares ranges by lower and upper values', () => {
    expect(isSameProductWeightRange(
      { lower: 50, upper: 60 },
      { lower: 50, upper: 60 },
    )).toBeTrue();
    expect(isSameProductWeightRange(
      { lower: 50, upper: 60 },
      { lower: 60, upper: 80 },
    )).toBeFalse();
  });

  it('creates scoped authorizations for catalogued weight-range writes', () => {
    const config = productWeightRangeConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-80'],
    )[5];
    const write = config.catalogFactory(config.range);
    const authorization = createProductWeightRangeAuthorization({
      write,
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    });

    expect(authorization.confirmedByUser).toBeTrue();
    expect(authorization.profile).toBe('moventiv-80');
    expect(authorization.operation).toBe('weight-range');
    expect(authorization.payloadHex).toBe('00 3c 50');
    expect(authorization.motorMovementConfirmed).toBeUndefined();
  });

  it('rejects non-weight-range writes', () => {
    expect(() => createProductWeightRangeAuthorization({
      write: encodeLegacyLockMode('moventiv-80', 'none'),
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    })).toThrowError(/weight-range write/);
  });
});
