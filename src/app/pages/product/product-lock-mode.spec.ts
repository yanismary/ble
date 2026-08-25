import { BLE_UUIDS } from '../../core/services/ble-profile-catalog';
import { encodeLegacyMotorCommand } from
  '../../core/services/legacy-ble-write-catalog';
import { PRODUCT_PAGE_CONFIG } from './product-page.config';
import {
  createProductLockModeAuthorization,
  productLockModeConfigsFor,
} from './product-lock-mode';

describe('Product lock-mode controls', () => {
  it('exposes lock modes from product page configuration', () => {
    expect(productLockModeConfigsFor(PRODUCT_PAGE_CONFIG.widoor).map(
      (config) => config.mode,
    )).toEqual([]);
    expect(productLockModeConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    ).map((config) => config.mode)).toEqual(['locked-closed']);
    expect(productLockModeConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-80'],
    ).map((config) => config.mode)).toEqual(['locked-closed']);
    expect(productLockModeConfigsFor(PRODUCT_PAGE_CONFIG.garline).map(
      (config) => config.mode,
    )).toEqual([]);
  });

  it('uses the catalogued user-parameter write for Moventiv close lock', () => {
    const configs = productLockModeConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    );
    const lockedClosed = configs[0].catalogFactory('locked-closed');
    const unlocked = configs[0].catalogFactory('none');

    expect(lockedClosed.serviceUuid).toBe(BLE_UUIDS.moventivGarlineService);
    expect(lockedClosed.characteristicUuid)
      .toBe(BLE_UUIDS.userParametersCharacteristic);
    expect(lockedClosed.payloadHex).toBe('00 02');
    expect(unlocked.payloadHex).toBe('00 00');
    expect(lockedClosed.destructiveLevel).toBe('non-destructive-setting');
    expect(lockedClosed.hardwareValidationStatus)
      .toBe('phase1-reference-only');
  });

  it('prevents controls from creating unsupported lock-mode writes', () => {
    const moventivCloseLock = productLockModeConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    )[0];

    expect(moventivCloseLock.catalogFactory('none').payloadHex)
      .toBe('00 00');
    expect(moventivCloseLock.catalogFactory('locked-closed').payloadHex)
      .toBe('00 02');
    expect(() => moventivCloseLock.catalogFactory('locked-open'))
      .toThrowError(/not supported/);
  });

  it('creates scoped authorizations for catalogued lock-mode writes', () => {
    const write = productLockModeConfigsFor(PRODUCT_PAGE_CONFIG['moventiv-60'])[0]
      .catalogFactory('locked-closed');
    const authorization = createProductLockModeAuthorization({
      write,
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    });

    expect(authorization.confirmedByUser).toBeTrue();
    expect(authorization.profile).toBe('moventiv-60');
    expect(authorization.operation).toBe('lock-mode');
    expect(authorization.payloadHex).toBe('00 02');
    expect(authorization.motorMovementConfirmed).toBeUndefined();
  });

  it('rejects non-lock writes', () => {
    expect(() => createProductLockModeAuthorization({
      write: encodeLegacyMotorCommand('widoor', 'OPEN'),
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    })).toThrowError(/lock-mode write/);
  });
});
