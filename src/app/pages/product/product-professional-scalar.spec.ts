import { BLE_UUIDS } from '../../core/services/ble-profile-catalog';
import { encodeLegacyLockMode, encodeLegacyProfessionalScalar } from
  '../../core/services/legacy-ble-write-catalog';
import {
  PRODUCT_PAGE_CONFIG,
  ProductPageConfig,
} from './product-page.config';
import {
  createProductProfessionalScalarAuthorization,
  isValidProductProfessionalScalarValue,
  productProfessionalScalarConfigsFor,
} from './product-professional-scalar';

describe('Product professional scalar controls', () => {
  it('exposes only the force and obstacle controls selected for this lot',
    () => {
      expect(productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.widoor,
      ).map((config) => config.field)).toEqual(['break-force-at-open']);
      expect(productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG['moventiv-60'],
      ).map((config) => config.field)).toEqual([
        'braking-open-power',
        'obstacle-sensitivity',
      ]);
      expect(productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG['moventiv-80'],
      ).map((config) => config.field)).toEqual([
        'braking-open-power',
        'obstacle-sensitivity',
      ]);
      expect(productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.garline,
      ).map((config) => config.field)).toEqual(['obstacle-sensitivity']);
    },
  );

  it('uses UI ranges from central legacy constraints', () => {
    const widoorBreak = productProfessionalScalarConfigsFor(
      PRODUCT_PAGE_CONFIG.widoor,
    )[0];
    const moventivControls = productProfessionalScalarConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-80'],
    );
    const garlineObstacle = productProfessionalScalarConfigsFor(
      PRODUCT_PAGE_CONFIG.garline,
    )[0];

    expect(widoorBreak.range).toEqual({ min: 1, max: 10 });
    expect(moventivControls[0].range).toEqual({ min: 1, max: 100 });
    expect(moventivControls[1].range).toEqual({ min: 1, max: 5 });
    expect(garlineObstacle.range).toEqual({ min: 1, max: 5 });
    expect(moventivControls[0].unit).toBe('%');
    expect(moventivControls[1].unit).toBeNull();
  });

  it('validates min, max and intermediate values outside the template',
    () => {
      const widoorBreak = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.widoor,
      )[0];
      const moventivBraking = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG['moventiv-80'],
      )[0];
      const garlineObstacle = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.garline,
      )[0];

      expect(isValidProductProfessionalScalarValue(widoorBreak, 1))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(widoorBreak, 5))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(widoorBreak, 10))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(widoorBreak, 11))
        .toBeFalse();
      expect(isValidProductProfessionalScalarValue(widoorBreak, NaN))
        .toBeFalse();
      expect(isValidProductProfessionalScalarValue(widoorBreak, 4.5))
        .toBeFalse();
      expect(isValidProductProfessionalScalarValue(moventivBraking, 1))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivBraking, 50))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivBraking, 100))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivBraking, 101))
        .toBeFalse();
      expect(isValidProductProfessionalScalarValue(garlineObstacle, 1))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(garlineObstacle, 3))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(garlineObstacle, 5))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(garlineObstacle, 0))
        .toBeFalse();
    },
  );

  it('does not expose controls for unsupported profile-field pairs', () => {
    const garlineWithBraking = {
      ...PRODUCT_PAGE_CONFIG.garline,
      professionalFields: Object.freeze([
        ...PRODUCT_PAGE_CONFIG.garline.professionalFields,
        'braking-open-power',
      ]),
    } satisfies ProductPageConfig;
    const moventivWithBreakForce = {
      ...PRODUCT_PAGE_CONFIG['moventiv-60'],
      professionalFields: Object.freeze([
        ...PRODUCT_PAGE_CONFIG['moventiv-60'].professionalFields,
        'break-force-at-open',
      ]),
    } satisfies ProductPageConfig;
    const widoorWithObstacle = {
      ...PRODUCT_PAGE_CONFIG.widoor,
      professionalFields: Object.freeze([
        ...PRODUCT_PAGE_CONFIG.widoor.professionalFields,
        'obstacle-sensitivity',
      ]),
    } satisfies ProductPageConfig;

    expect(productProfessionalScalarConfigsFor(
      garlineWithBraking,
    ).map((config) => config.field)).toEqual(['obstacle-sensitivity']);
    expect(productProfessionalScalarConfigsFor(
      moventivWithBreakForce,
    ).map((config) => config.field)).toEqual([
      'braking-open-power',
      'obstacle-sensitivity',
    ]);
    expect(productProfessionalScalarConfigsFor(
      widoorWithObstacle,
    ).map((config) => config.field)).toEqual(['break-force-at-open']);
  });

  it('delegates payload creation to the catalogued professional encoder',
    () => {
      const widoorBreak = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.widoor,
      )[0].catalogFactory(5);
      const moventivBraking = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG['moventiv-80'],
      )[0].catalogFactory(100);
      const garlineObstacle = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.garline,
      )[0].catalogFactory(5);

      expect(widoorBreak.serviceUuid).toBe(BLE_UUIDS.widoorService);
      expect(widoorBreak.characteristicUuid)
        .toBe(BLE_UUIDS.professionalParametersCharacteristic);
      expect(widoorBreak.payloadHex).toBe('01 05');
      expect(moventivBraking.serviceUuid)
        .toBe(BLE_UUIDS.moventivGarlineService);
      expect(moventivBraking.payloadHex).toBe('06 64');
      expect(garlineObstacle.serviceUuid)
        .toBe(BLE_UUIDS.moventivGarlineService);
      expect(garlineObstacle.payloadHex).toBe('07 05');
    },
  );

  it('rejects values outside the UI range before building a write', () => {
    const moventivBraking = productProfessionalScalarConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-80'],
    )[0];

    expect(() => moventivBraking.catalogFactory(0))
      .toThrowError(/outside the UI range/);
    expect(() => moventivBraking.catalogFactory(101))
      .toThrowError(/outside the UI range/);
    expect(() => moventivBraking.catalogFactory(10.5))
      .toThrowError(/outside the UI range/);
    expect(() => moventivBraking.catalogFactory(NaN))
      .toThrowError(/outside the UI range/);
  });

  it('creates scoped authorizations for catalogued professional scalar writes',
    () => {
      const write = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.garline,
      )[0].catalogFactory(3);
      const authorization = createProductProfessionalScalarAuthorization({
        write,
        deviceId: 'device-1',
        connectionGeneration: 4,
        attemptId: 'attempt-1',
        confirmationId: 'confirmation-1',
        confirmedAt: 1_000,
      });

      expect(authorization.confirmedByUser).toBeTrue();
      expect(authorization.profile).toBe('garline');
      expect(authorization.operation).toBe('obstacle-sensitivity');
      expect(authorization.payloadHex).toBe('07 03');
      expect(authorization.motorMovementConfirmed).toBeUndefined();
    },
  );

  it('rejects writes outside the selected professional scalar set', () => {
    expect(() => createProductProfessionalScalarAuthorization({
      write: encodeLegacyLockMode('garline', 'none'),
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    })).toThrowError(/professional-scalar write/);
  });

  it('rejects catalogued scalar writes outside the supported profile set',
    () => {
      expect(() => createProductProfessionalScalarAuthorization({
        write: encodeLegacyProfessionalScalar(
          'garline',
          'braking-open-power',
          50,
        ),
        deviceId: 'device-1',
        connectionGeneration: 4,
        attemptId: 'attempt-1',
        confirmationId: 'confirmation-1',
        confirmedAt: 1_000,
      })).toThrowError(/professional-scalar write/);
    },
  );
});
