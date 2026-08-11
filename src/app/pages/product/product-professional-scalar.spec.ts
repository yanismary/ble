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
  it('exposes only the professional scalar controls selected so far',
    () => {
      expect(productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.widoor,
      ).map((config) => config.field)).toEqual([
        'break-force-at-open',
        'near-open-speed',
        'near-close-speed',
      ]);
      expect(productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG['moventiv-60'],
      ).map((config) => config.field)).toEqual([
        'near-open-speed',
        'near-close-speed',
        'near-open-torque',
        'near-close-torque',
        'braking-open-power',
        'obstacle-sensitivity',
      ]);
      expect(productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG['moventiv-80'],
      ).map((config) => config.field)).toEqual([
        'near-open-speed',
        'near-close-speed',
        'near-open-torque',
        'near-close-torque',
        'braking-open-power',
        'obstacle-sensitivity',
      ]);
      expect(productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.garline,
      ).map((config) => config.field)).toEqual([
        'near-open-speed',
        'near-close-speed',
        'obstacle-sensitivity',
      ]);
    },
  );

  it('uses UI ranges from central legacy constraints', () => {
    const widoorControls = productProfessionalScalarConfigsFor(
      PRODUCT_PAGE_CONFIG.widoor,
    );
    const moventivControls = productProfessionalScalarConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-80'],
    );
    const garlineControls = productProfessionalScalarConfigsFor(
      PRODUCT_PAGE_CONFIG.garline,
    );

    expect(widoorControls[0].range).toEqual({ min: 1, max: 10 });
    expect(widoorControls[1].range).toEqual({ min: 70, max: 100 });
    expect(widoorControls[2].range).toEqual({ min: 50, max: 100 });
    expect(moventivControls[0].range).toEqual({ min: 1, max: 100 });
    expect(moventivControls[1].range).toEqual({ min: 1, max: 100 });
    expect(moventivControls[2].range).toEqual({ min: 1, max: 200 });
    expect(moventivControls[3].range).toEqual({ min: 1, max: 200 });
    expect(moventivControls[4].range).toEqual({ min: 1, max: 100 });
    expect(moventivControls[5].range).toEqual({ min: 1, max: 5 });
    expect(garlineControls[0].range).toEqual({ min: 0, max: 100 });
    expect(garlineControls[1].range).toEqual({ min: 0, max: 100 });
    expect(garlineControls[2].range).toEqual({ min: 1, max: 5 });
    expect(widoorControls[1].unit).toBe('%');
    expect(widoorControls[2].unit).toBe('%');
    expect(moventivControls[0].unit).toBe('%');
    expect(moventivControls[1].unit).toBe('%');
    expect(moventivControls[2].unit).toBe('%');
    expect(moventivControls[3].unit).toBe('%');
    expect(moventivControls[4].unit).toBe('%');
    expect(moventivControls[5].unit).toBeNull();
    expect(widoorControls.every((config) =>
      !config.requiresProfessionalAccess,
    )).toBeTrue();
    expect(moventivControls[0].requiresProfessionalAccess).toBeFalse();
    expect(moventivControls[1].requiresProfessionalAccess).toBeFalse();
    expect(moventivControls[2].requiresProfessionalAccess).toBeTrue();
    expect(moventivControls[3].requiresProfessionalAccess).toBeTrue();
    expect(moventivControls[4].requiresProfessionalAccess).toBeTrue();
    expect(moventivControls[5].requiresProfessionalAccess).toBeTrue();
    expect(garlineControls[0].requiresProfessionalAccess).toBeFalse();
    expect(garlineControls[1].requiresProfessionalAccess).toBeFalse();
    expect(garlineControls[2].requiresProfessionalAccess).toBeTrue();
  });

  it('validates min, max and intermediate values outside the template',
    () => {
      const widoorControls = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.widoor,
      );
      const widoorBreak = widoorControls[0];
      const widoorNearOpenSpeed = widoorControls[1];
      const widoorNearCloseSpeed = widoorControls[2];
      const moventivControls = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG['moventiv-80'],
      );
      const moventivNearOpenSpeed = moventivControls[0];
      const moventivNearCloseSpeed = moventivControls[1];
      const moventivOpenTorque = moventivControls[2];
      const moventivCloseTorque = moventivControls[3];
      const moventivBraking = moventivControls[4];
      const garlineNearOpenSpeed = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.garline,
      )[0];
      const garlineObstacle = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.garline,
      )[2];

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
      expect(isValidProductProfessionalScalarValue(widoorNearOpenSpeed, 70))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(widoorNearOpenSpeed, 85))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(widoorNearOpenSpeed, 100))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(widoorNearOpenSpeed, 69))
        .toBeFalse();
      expect(isValidProductProfessionalScalarValue(widoorNearCloseSpeed, 50))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(widoorNearCloseSpeed, 75))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(widoorNearCloseSpeed, 100))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(widoorNearCloseSpeed, 49))
        .toBeFalse();
      expect(isValidProductProfessionalScalarValue(moventivNearOpenSpeed, 1))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivNearOpenSpeed, 50))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivNearOpenSpeed, 100))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivNearOpenSpeed, 0))
        .toBeFalse();
      expect(isValidProductProfessionalScalarValue(moventivNearCloseSpeed, 1))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivNearCloseSpeed, 50))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(
        moventivNearCloseSpeed,
        100,
      )).toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivNearCloseSpeed, 101))
        .toBeFalse();
      expect(isValidProductProfessionalScalarValue(garlineNearOpenSpeed, 0))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(garlineNearOpenSpeed, 50))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(garlineNearOpenSpeed, 100))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(garlineNearOpenSpeed, NaN))
        .toBeFalse();
      expect(isValidProductProfessionalScalarValue(garlineNearOpenSpeed, 10.5))
        .toBeFalse();
      expect(isValidProductProfessionalScalarValue(moventivOpenTorque, 1))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivOpenTorque, 100))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivOpenTorque, 200))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivOpenTorque, 0))
        .toBeFalse();
      expect(isValidProductProfessionalScalarValue(moventivOpenTorque, NaN))
        .toBeFalse();
      expect(isValidProductProfessionalScalarValue(moventivOpenTorque, 10.5))
        .toBeFalse();
      expect(isValidProductProfessionalScalarValue(moventivCloseTorque, 1))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivCloseTorque, 100))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivCloseTorque, 200))
        .toBeTrue();
      expect(isValidProductProfessionalScalarValue(moventivCloseTorque, 201))
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
        'near-open-torque',
        'near-close-torque',
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
    ).map((config) => config.field)).toEqual([
      'near-open-speed',
      'near-close-speed',
      'obstacle-sensitivity',
    ]);
    expect(productProfessionalScalarConfigsFor(
      moventivWithBreakForce,
    ).map((config) => config.field)).toEqual([
      'near-open-speed',
      'near-close-speed',
      'near-open-torque',
      'near-close-torque',
      'braking-open-power',
      'obstacle-sensitivity',
    ]);
    expect(productProfessionalScalarConfigsFor(
      widoorWithObstacle,
    ).map((config) => config.field)).toEqual([
      'break-force-at-open',
      'near-open-speed',
      'near-close-speed',
    ]);
  });

  it('delegates payload creation to the catalogued professional encoder',
    () => {
      const widoorControls = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.widoor,
      );
      const moventivControls = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG['moventiv-80'],
      );
      const garlineControls = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.garline,
      );
      const widoorBreak = widoorControls[0].catalogFactory(5);
      const widoorNearOpenSpeed = widoorControls[1].catalogFactory(85);
      const widoorNearCloseSpeed = widoorControls[2].catalogFactory(75);
      const moventivNearOpenSpeed = moventivControls[0].catalogFactory(50);
      const moventivNearCloseSpeed = moventivControls[1].catalogFactory(60);
      const moventivOpenTorque = moventivControls[2].catalogFactory(120);
      const moventivCloseTorque = moventivControls[3].catalogFactory(200);
      const moventivBraking = moventivControls[4].catalogFactory(100);
      const garlineNearOpenSpeed = garlineControls[0].catalogFactory(0);
      const garlineNearCloseSpeed = garlineControls[1].catalogFactory(100);
      const garlineObstacle = garlineControls[2].catalogFactory(5);

      expect(widoorBreak.serviceUuid).toBe(BLE_UUIDS.widoorService);
      expect(widoorBreak.characteristicUuid)
        .toBe(BLE_UUIDS.professionalParametersCharacteristic);
      expect(widoorBreak.payloadHex).toBe('01 05');
      expect(widoorNearOpenSpeed.serviceUuid).toBe(BLE_UUIDS.widoorService);
      expect(widoorNearOpenSpeed.payloadHex).toBe('02 55');
      expect(widoorNearCloseSpeed.serviceUuid).toBe(BLE_UUIDS.widoorService);
      expect(widoorNearCloseSpeed.payloadHex).toBe('03 4b');
      expect(moventivNearOpenSpeed.serviceUuid)
        .toBe(BLE_UUIDS.moventivGarlineService);
      expect(moventivNearOpenSpeed.payloadHex).toBe('02 32');
      expect(moventivNearCloseSpeed.serviceUuid)
        .toBe(BLE_UUIDS.moventivGarlineService);
      expect(moventivNearCloseSpeed.payloadHex).toBe('03 3c');
      expect(moventivOpenTorque.serviceUuid)
        .toBe(BLE_UUIDS.moventivGarlineService);
      expect(moventivOpenTorque.characteristicUuid)
        .toBe(BLE_UUIDS.professionalParametersCharacteristic);
      expect(moventivOpenTorque.payloadHex).toBe('04 78');
      expect(moventivCloseTorque.serviceUuid)
        .toBe(BLE_UUIDS.moventivGarlineService);
      expect(moventivCloseTorque.characteristicUuid)
        .toBe(BLE_UUIDS.professionalParametersCharacteristic);
      expect(moventivCloseTorque.payloadHex).toBe('05 c8');
      expect(moventivBraking.serviceUuid)
        .toBe(BLE_UUIDS.moventivGarlineService);
      expect(moventivBraking.payloadHex).toBe('06 64');
      expect(garlineObstacle.serviceUuid)
        .toBe(BLE_UUIDS.moventivGarlineService);
      expect(garlineNearOpenSpeed.payloadHex).toBe('02 00');
      expect(garlineNearCloseSpeed.payloadHex).toBe('03 64');
      expect(garlineObstacle.payloadHex).toBe('07 05');
    },
  );

  it('rejects values outside the UI range before building a write', () => {
    const moventivOpenSpeed = productProfessionalScalarConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-80'],
    )[0];

    expect(() => moventivOpenSpeed.catalogFactory(0))
      .toThrowError(/outside the UI range/);
    expect(() => moventivOpenSpeed.catalogFactory(101))
      .toThrowError(/outside the UI range/);
    expect(() => moventivOpenSpeed.catalogFactory(10.5))
      .toThrowError(/outside the UI range/);
    expect(() => moventivOpenSpeed.catalogFactory(NaN))
      .toThrowError(/outside the UI range/);
  });

  it('creates scoped authorizations for catalogued professional scalar writes',
    () => {
      const write = productProfessionalScalarConfigsFor(
        PRODUCT_PAGE_CONFIG.garline,
      )[2].catalogFactory(3);
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
      expect(() => createProductProfessionalScalarAuthorization({
        write: encodeLegacyProfessionalScalar(
          'widoor',
          'near-open-torque',
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
