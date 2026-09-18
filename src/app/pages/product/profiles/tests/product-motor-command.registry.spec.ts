import { encodeLegacyMotorCommand } from
  '../../../../core/services/legacy-ble-write-catalog';
import { BLE_UUIDS } from '../../../../core/services/ble-profile-catalog';
import {
  MOTOR_COMMAND_UI_CONFIGS,
  WIDOOR_COMMAND_UI_CONFIGS,
  createProductMotorCommandAuthorization,
} from '../product-motor-command.registry';
import { WIDOOR_OPEN_AUTHORIZATION_TTL_MS } from
  '../widoor/widoor-motor-command';
import { formatCommandHistoryTime } from
  '../../shared/commands/product-motor-command';

describe('Widoor motor authorization factory', () => {
  it('should expose only the three Phase 1 Widoor commands', () => {
      expect(WIDOOR_COMMAND_UI_CONFIGS.map((config) => ({
        profile: config.profile,
        command: config.command,
        enabled: config.enabled,
        expectedState: config.expectedMotorStateRaw,
      }))).toEqual([
        { profile: 'widoor', command: 'OPEN', enabled: true,
          expectedState: 0x21 },
        { profile: 'widoor', command: 'CLOSE', enabled: true,
          expectedState: 0x31 },
        { profile: 'widoor', command: 'OPEN_SHORT_TIMED', enabled: true,
          expectedState: 0x21 },
      ]);
      expect(WIDOOR_COMMAND_UI_CONFIGS.some((config) =>
        config.command === 'OPEN_LONG_TIMED',
      )).toBeFalse();
      expect(WIDOOR_COMMAND_UI_CONFIGS.every(Object.isFrozen)).toBeTrue();
      expect(WIDOOR_COMMAND_UI_CONFIGS.every((config) =>
        config.confirmationPolicy?.kind === 'gatt-only',
      )).toBeTrue();
      expect(WIDOOR_COMMAND_UI_CONFIGS.map(
        (config) => config.catalogFactory().payloadHex,
      )).toEqual([
        '00 20 00 00',
        '00 30',
        '00 21 00 00',
      ]);
      expect(WIDOOR_COMMAND_UI_CONFIGS.every((config) =>
        Boolean(config.label && config.confirmationTitle &&
          config.confirmationMessage && config.confirmationButtonLabel &&
          config.confirmationSuccessMessage && config.unconfirmedMessage),
      )).toBeTrue();
    },
  );

  it('should expose only Phase 1 main Moventiv/Garline commands', () => {
    for (const profile of [
      'moventiv-60',
      'moventiv-80',
      'garline',
    ] as const) {
      const configs = MOTOR_COMMAND_UI_CONFIGS[profile];

      expect(configs.map((config) => config.command)).toEqual([
        'OPEN',
        'CLOSE',
        'OPEN_SHORT_TIMED',
      ]);
      expect(configs.every((config) => config.profile === profile &&
        config.enabled)).toBeTrue();
      expect(configs.map((config) =>
        config.catalogFactory().payloadHex,
      )).toEqual([
        '00 20 00 00',
        '00 30',
        '00 21 00 00',
      ]);
      expect(configs.every((config) =>
        config.catalogFactory().serviceUuid === BLE_UUIDS.shdoService &&
        config.catalogFactory().characteristicUuid ===
          BLE_UUIDS.motorCommandCharacteristic &&
        config.confirmationPolicy?.kind === 'gatt-only' &&
        config.physicalValidationPolicy?.allowPhase1ReferenceOnly === true,
      )).toBeTrue();
      expect(configs.some((config) =>
        config.command === 'OPEN_LONG_TIMED' ||
        config.command === 'LEARNING',
      )).toBeFalse();
    }
  });

  it('should authorize catalogued Moventiv/Garline motor writes only',
    () => {
      const write = MOTOR_COMMAND_UI_CONFIGS.garline[1].catalogFactory();
      const authorization = createProductMotorCommandAuthorization({
        write,
        deviceId: 'device-1',
        connectionGeneration: 4,
        attemptId: 'attempt-1',
        confirmationId: 'confirmation-1',
        confirmedAt: 1_000,
        validatedAt: 1_000,
      });

      expect(authorization.profile).toBe('garline');
      expect(authorization.operation).toBe('motor-close');
      expect(authorization.payloadHex).toBe('00 30');
      expect(authorization.motorMovementConfirmed).toBeTrue();
    },
  );
  it('should create an immutable authorization scoped to one exact attempt',
    () => {
      const write = encodeLegacyMotorCommand('widoor', 'OPEN');
      const authorization = createProductMotorCommandAuthorization({
        write,
        deviceId: 'device-1',
        connectionGeneration: 4,
        attemptId: 'attempt-1',
        confirmationId: 'confirmation-1',
        confirmedAt: 1_000,
        validatedAt: 1_000,
      });

      expect(authorization).toEqual({
        confirmedByUser: true,
        confirmedAt: 1_000,
        expiresAt: 1_000 + WIDOOR_OPEN_AUTHORIZATION_TTL_MS,
        confirmationId: 'confirmation-1',
        operation: 'motor-open',
        payloadHex: '00 20 00 00',
        profile: 'widoor',
        deviceId: 'device-1',
        connectionGeneration: 4,
        attemptId: 'attempt-1',
        motorMovementConfirmed: true,
      });
      expect(Object.isFrozen(authorization)).toBeTrue();
    },
  );

  it('should create distinct scopes for distinct attempts', () => {
    const write = encodeLegacyMotorCommand('widoor', 'OPEN');
    const first = createProductMotorCommandAuthorization({
      write,
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
      validatedAt: 1_000,
    });
    const second = createProductMotorCommandAuthorization({
      write,
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-2',
      confirmationId: 'confirmation-2',
      confirmedAt: 2_000,
      validatedAt: 2_000,
    });

    expect(first.attemptId).not.toBe(second.attemptId);
    expect(first.confirmationId).not.toBe(second.confirmationId);
  });

  it('should accept catalogued Widoor CLOSE with an exact attempt scope', () => {
    const authorization = createProductMotorCommandAuthorization({
      write: encodeLegacyMotorCommand('widoor', 'CLOSE'),
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'close-attempt',
      confirmationId: 'close-confirmation',
      confirmedAt: 1_000,
      validatedAt: 1_000,
    });

    expect(authorization.operation).toBe('motor-close');
    expect(authorization.payloadHex).toBe('00 30');
    expect(authorization.profile).toBe('widoor');
    expect(authorization.motorMovementConfirmed).toBeTrue();
  });

  it('should authorize each timed opening for one exact 15-second attempt',
    () => {
      for (const command of [
        'OPEN_SHORT_TIMED',
        'OPEN_LONG_TIMED',
      ] as const) {
        const write = encodeLegacyMotorCommand('widoor', command);
        const authorization = createProductMotorCommandAuthorization({
          write,
          deviceId: 'device-1',
          connectionGeneration: 4,
          attemptId: `attempt-${command}`,
          confirmationId: `confirmation-${command}`,
          confirmedAt: 1_000,
          validatedAt: 1_000,
        });

        expect(authorization.operation).toBe(write.operation);
        expect(authorization.payloadHex).toBe(write.payloadHex);
        expect(authorization.expiresAt - authorization.confirmedAt)
          .toBe(15_000);
        expect(authorization.motorMovementConfirmed).toBeTrue();
      }
    },
  );

  it('should format command history time without locale output', () => {
    expect(formatCommandHistoryTime(
      new Date(2026, 0, 1, 8, 5, 4).getTime(),
    )).toBe('08:05:04');
    expect(formatCommandHistoryTime(Number.NaN)).toBe('--:--:--');
  });

  it('should reject learning from the controlled command authorization', () => {
    expect(() => createProductMotorCommandAuthorization({
      write: encodeLegacyMotorCommand('widoor', 'LEARNING'),
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
      validatedAt: 1_000,
    })).toThrowError(/controlled catalogued motor write/);
  });

  it('should reject invalid or already expired authorization contexts', () => {
    const write = encodeLegacyMotorCommand('widoor', 'OPEN');
    const valid = {
      write,
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
      validatedAt: 1_000,
    };
    const invalidContexts = [
      { ...valid, deviceId: ' ' },
      { ...valid, connectionGeneration: -1 },
      { ...valid, connectionGeneration: 1.5 },
      { ...valid, attemptId: '' },
      { ...valid, confirmationId: '' },
      { ...valid, confirmedAt: Number.NaN },
      { ...valid, validatedAt: 999 },
      {
        ...valid,
        validatedAt: valid.confirmedAt + WIDOOR_OPEN_AUTHORIZATION_TTL_MS,
      },
    ];

    for (const context of invalidContexts) {
      expect(() => createProductMotorCommandAuthorization(context))
        .toThrowError(/authorization context is invalid/);
    }
  });
});
