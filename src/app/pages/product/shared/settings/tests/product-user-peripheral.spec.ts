import { BLE_UUIDS } from '../../../../../core/services/ble-profile-catalog';
import { encodeLegacyLockMode } from
  '../../../../../core/services/legacy-ble-write-catalog';
import {
  PRODUCT_PAGE_CONFIG,
  ProductPageConfig,
} from '../../../profiles/product-page-config.facade';
import {
  createProductUserPeripheralAuthorization,
  productUserPeripheralConfigsFor,
} from '../product-user-peripheral';

describe('Product user peripheral controls', () => {
  it('exposes only Phase 1 user lighting controls by profile', () => {
    expect(productUserPeripheralConfigsFor(
      PRODUCT_PAGE_CONFIG.widoor,
    ).map((config) => config.field)).toEqual(['rgb']);
    expect(productUserPeripheralConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    ).map((config) => config.field)).toEqual([
      'static-light',
      'dynamic-light',
      'rgb',
    ]);
    expect(productUserPeripheralConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-80'],
    ).map((config) => config.field)).toEqual([
      'static-light',
      'dynamic-light',
      'rgb',
    ]);
    expect(productUserPeripheralConfigsFor(
      PRODUCT_PAGE_CONFIG.garline,
    ).map((config) => config.field)).toEqual([
      'static-light',
      'dynamic-light',
      'rgb',
    ]);
  });

  it('ignores unsupported profile-field pairs from forged configs', () => {
    const forgedWidoorConfig = {
      ...PRODUCT_PAGE_CONFIG.widoor,
      userFields: Object.freeze([
        ...PRODUCT_PAGE_CONFIG.widoor.userFields,
        'static-light',
        'dynamic-light',
      ]),
    } satisfies ProductPageConfig;

    expect(productUserPeripheralConfigsFor(
      forgedWidoorConfig,
    ).map((config) => config.field)).toEqual(['rgb']);
  });

  it('delegates payload creation to the catalogued peripheral encoder', () => {
    const widoorRgb = productUserPeripheralConfigsFor(
      PRODUCT_PAGE_CONFIG.widoor,
    )[0];
    const moventivControls = productUserPeripheralConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    );

    const rgbEnabled = widoorRgb.catalogFactory(true);
    const rgbDisabled = widoorRgb.catalogFactory(false);
    const staticEnabled = moventivControls[0].catalogFactory(true);
    const staticDisabled = moventivControls[0].catalogFactory(false);
    const dynamicEnabled = moventivControls[1].catalogFactory(true);
    const dynamicDisabled = moventivControls[1].catalogFactory(false);

    expect(rgbEnabled.serviceUuid).toBe(BLE_UUIDS.widoorService);
    expect(rgbEnabled.characteristicUuid)
      .toBe(BLE_UUIDS.userParametersCharacteristic);
    expect(rgbEnabled.payloadHex).toBe('05 03 01');
    expect(rgbDisabled.payloadHex).toBe('05 03 02');
    expect(staticEnabled.serviceUuid).toBe(
      BLE_UUIDS.moventivGarlineService,
    );
    expect(staticEnabled.payloadHex).toBe('05 06 01');
    expect(staticDisabled.payloadHex).toBe('05 06 02');
    expect(dynamicEnabled.payloadHex).toBe('05 07 01');
    expect(dynamicDisabled.payloadHex).toBe('05 07 02');
  });

  it('creates scoped authorizations for catalogued user peripheral writes',
    () => {
      const write = productUserPeripheralConfigsFor(
        PRODUCT_PAGE_CONFIG.garline,
      )[2].catalogFactory(true);
      const authorization = createProductUserPeripheralAuthorization({
        write,
        deviceId: 'device-1',
        connectionGeneration: 4,
        attemptId: 'attempt-1',
        confirmationId: 'confirmation-1',
        confirmedAt: 1_000,
      });

      expect(authorization.confirmedByUser).toBeTrue();
      expect(authorization.profile).toBe('garline');
      expect(authorization.operation).toBe('rgb-indicator');
      expect(authorization.payloadHex).toBe('05 03 01');
      expect(authorization.motorMovementConfirmed).toBeUndefined();
    },
  );

  it('rejects writes outside the selected user peripheral set', () => {
    expect(() => createProductUserPeripheralAuthorization({
      write: encodeLegacyLockMode('garline', 'none'),
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    })).toThrowError(/user-peripheral write/);
  });
});
