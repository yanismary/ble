import {
  LegacyBleWrite,
  isCataloguedLegacyBleWrite,
} from '../../core/services/legacy-ble-write-catalog';
import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationStatus,
} from '../../core/services/ble-write-execution.service';

export const WIDOOR_OPEN_AUTHORIZATION_TTL_MS = 15_000;

export type ProductOpenCommandStatus =
  | 'idle'
  | 'awaiting-confirmation'
  | 'executing'
  | 'confirmed'
  | 'timeout'
  | 'failed'
  | 'disconnected'
  | 'stale'
  | 'unavailable'
  | 'cancelled';

export interface ProductOpenCommandState {
  readonly operation: 'motor-open';
  readonly status: ProductOpenCommandStatus;
  readonly startedAt: number | null;
  readonly completedAt: number | null;
  readonly confirmationStatus: LegacyBleWriteConfirmationStatus | null;
  readonly nativeWriteCompleted: boolean;
  readonly message: string | null;
  readonly technicalErrorCode: string | null;
  readonly attemptId: string | null;
}

export interface WidoorOpenAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
  readonly validatedAt: number;
}

export function createWidoorOpenAuthorization(
  input: WidoorOpenAuthorizationInput,
): LegacyBleWriteAuthorization {
  const expiresAt = input.confirmedAt + WIDOOR_OPEN_AUTHORIZATION_TTL_MS;
  if (!isCataloguedLegacyBleWrite(input.write) ||
      input.write.operation !== 'motor-open' ||
      input.write.profile !== 'widoor' ||
      input.write.destructiveLevel !== 'motor-movement' ||
      input.write.hardwareValidationStatus !==
        'validated-widoor-old-firmware') {
    throw new Error('A catalogued and validated Widoor OPEN write is required.');
  }
  if (!input.deviceId.trim() ||
      !input.attemptId.trim() ||
      !input.confirmationId.trim() ||
      !Number.isInteger(input.connectionGeneration) ||
      input.connectionGeneration < 0 ||
      !Number.isFinite(input.confirmedAt) ||
      input.confirmedAt < 0 ||
      !Number.isFinite(input.validatedAt) ||
      input.validatedAt < input.confirmedAt ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= input.validatedAt) {
    throw new Error('The Widoor OPEN authorization context is invalid.');
  }

  return Object.freeze({
    confirmedByUser: true,
    confirmedAt: input.confirmedAt,
    expiresAt,
    confirmationId: input.confirmationId,
    operation: input.write.operation,
    payloadHex: input.write.payloadHex,
    profile: 'widoor',
    deviceId: input.deviceId,
    connectionGeneration: input.connectionGeneration,
    attemptId: input.attemptId,
    motorMovementConfirmed: true,
  });
}

export function initialProductOpenCommandState(): ProductOpenCommandState {
  return Object.freeze({
    operation: 'motor-open',
    status: 'idle',
    startedAt: null,
    completedAt: null,
    confirmationStatus: null,
    nativeWriteCompleted: false,
    message: null,
    technicalErrorCode: null,
    attemptId: null,
  });
}
