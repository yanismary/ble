import { encodeLegacyMotorCommand } from
  '../../core/services/legacy-ble-write-catalog';
import {
  WIDOOR_OPEN_AUTHORIZATION_TTL_MS,
  createWidoorOpenAuthorization,
} from './product-open-command';

describe('Widoor OPEN authorization factory', () => {
  it('should create an immutable authorization scoped to one exact attempt',
    () => {
      const write = encodeLegacyMotorCommand('widoor', 'OPEN');
      const authorization = createWidoorOpenAuthorization({
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
    const first = createWidoorOpenAuthorization({
      write,
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
      validatedAt: 1_000,
    });
    const second = createWidoorOpenAuthorization({
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

  it('should reject a write other than validated Widoor OPEN', () => {
    expect(() => createWidoorOpenAuthorization({
      write: encodeLegacyMotorCommand('widoor', 'CLOSE'),
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
      validatedAt: 1_000,
    })).toThrowError(/validated Widoor OPEN/);
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
      expect(() => createWidoorOpenAuthorization(context))
        .toThrowError(/authorization context is invalid/);
    }
  });
});
