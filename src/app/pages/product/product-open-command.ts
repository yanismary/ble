import {
  LegacyBleWrite,
  LegacyHardwareValidationStatus,
  LegacyMotorCommand,
  isCataloguedLegacyBleWrite,
} from '../../core/services/legacy-ble-write-catalog';
import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteConfirmationStatus,
  LegacyBleWriteExecutionPolicy,
} from '../../core/services/ble-write-execution.service';
import {
  WIDOOR_CLOSING_STARTED_STATE,
  WIDOOR_OPENING_STARTED_STATE,
} from '../../core/services/motor-command-confirmation';

export const WIDOOR_COMMAND_AUTHORIZATION_TTL_MS = 15_000;
export const WIDOOR_OPEN_AUTHORIZATION_TTL_MS =
  WIDOOR_COMMAND_AUTHORIZATION_TTL_MS;

export type ProductMotorCommandOperation = 'motor-open' | 'motor-close';

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
  readonly operation: ProductMotorCommandOperation;
  readonly status: ProductOpenCommandStatus;
  readonly startedAt: number | null;
  readonly completedAt: number | null;
  readonly confirmationStatus: LegacyBleWriteConfirmationStatus | null;
  readonly nativeWriteCompleted: boolean;
  readonly message: string | null;
  readonly technicalErrorCode: string | null;
  readonly attemptId: string | null;
}

export type WidoorCommandTextKey =
  | 'open'
  | 'close'
  | 'openShortTimed'
  | 'openLongTimed'
  | 'learning';

export interface WidoorCommandUiConfig {
  readonly command: LegacyMotorCommand;
  readonly operation: string;
  readonly textKey: WidoorCommandTextKey;
  readonly enabled: boolean;
  readonly expectedMotorState: number | null;
  readonly confirmationPolicy: LegacyBleWriteConfirmationPolicy | null;
  readonly executionPolicy: LegacyBleWriteExecutionPolicy | undefined;
  readonly hardwareValidationStatus: LegacyHardwareValidationStatus;
  readonly disabledReason: 'physical-validation' | 'protected' | null;
}

export const WIDOOR_COMMAND_UI_CONFIGS: readonly WidoorCommandUiConfig[] =
  Object.freeze([
    commandConfig({
      command: 'OPEN',
      operation: 'motor-open',
      textKey: 'open',
      enabled: true,
      expectedMotorState: WIDOOR_OPENING_STARTED_STATE,
      confirmationPolicy: { kind: 'widoor-open-state' },
      hardwareValidationStatus: 'validated-widoor-old-firmware',
    }),
    commandConfig({
      command: 'CLOSE',
      operation: 'motor-close',
      textKey: 'close',
      enabled: true,
      expectedMotorState: WIDOOR_CLOSING_STARTED_STATE,
      confirmationPolicy: { kind: 'widoor-close-state' },
      executionPolicy: {
        allowPhysicalValidationAttempt: {
          operation: 'motor-close',
          profile: 'widoor',
        },
      },
      hardwareValidationStatus: 'phase1-reference-only',
    }),
    commandConfig({
      command: 'OPEN_SHORT_TIMED',
      operation: 'motor-open_short_timed',
      textKey: 'openShortTimed',
      enabled: false,
      hardwareValidationStatus: 'phase1-reference-only',
      disabledReason: 'physical-validation',
    }),
    commandConfig({
      command: 'OPEN_LONG_TIMED',
      operation: 'motor-open_long_timed',
      textKey: 'openLongTimed',
      enabled: false,
      hardwareValidationStatus: 'phase1-reference-only',
      disabledReason: 'physical-validation',
    }),
    commandConfig({
      command: 'LEARNING',
      operation: 'motor-learning',
      textKey: 'learning',
      enabled: false,
      hardwareValidationStatus: 'phase1-reference-only',
      disabledReason: 'protected',
    }),
  ]);

export interface WidoorCommandAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
  readonly validatedAt: number;
}

export type WidoorOpenAuthorizationInput = WidoorCommandAuthorizationInput;

export function createWidoorCommandAuthorization(
  input: WidoorCommandAuthorizationInput,
): LegacyBleWriteAuthorization {
  const expiresAt = input.confirmedAt + WIDOOR_COMMAND_AUTHORIZATION_TTL_MS;
  const validOpen = input.write.operation === 'motor-open' &&
    input.write.hardwareValidationStatus === 'validated-widoor-old-firmware';
  const validClose = input.write.operation === 'motor-close' &&
    input.write.hardwareValidationStatus === 'phase1-reference-only';
  if (!isCataloguedLegacyBleWrite(input.write) ||
      input.write.profile !== 'widoor' ||
      input.write.destructiveLevel !== 'motor-movement' ||
      (!validOpen && !validClose)) {
    throw new Error('A catalogued Widoor OPEN or CLOSE write is required.');
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
    throw new Error('The Widoor motor authorization context is invalid.');
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

export function createWidoorOpenAuthorization(
  input: WidoorOpenAuthorizationInput,
): LegacyBleWriteAuthorization {
  return createWidoorCommandAuthorization(input);
}

export function initialProductOpenCommandState(
  operation: ProductMotorCommandOperation = 'motor-open',
): ProductOpenCommandState {
  return Object.freeze({
    operation,
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

function commandConfig(
  value: Omit<WidoorCommandUiConfig,
    'confirmationPolicy' | 'executionPolicy' | 'expectedMotorState' |
    'disabledReason'> & Partial<Pick<WidoorCommandUiConfig,
    'confirmationPolicy' | 'executionPolicy' | 'expectedMotorState' |
    'disabledReason'>>,
): WidoorCommandUiConfig {
  const confirmationPolicy: LegacyBleWriteConfirmationPolicy | null =
    value.confirmationPolicy === undefined
      ? null
      : Object.freeze({ ...value.confirmationPolicy }) as
        LegacyBleWriteConfirmationPolicy;
  const config: WidoorCommandUiConfig = {
    ...value,
    expectedMotorState: value.expectedMotorState ?? null,
    confirmationPolicy,
    executionPolicy: value.executionPolicy === undefined
      ? undefined
      : Object.freeze({
          ...value.executionPolicy,
          ...(value.executionPolicy.allowPhysicalValidationAttempt ===
            undefined
            ? {}
            : {
                allowPhysicalValidationAttempt: Object.freeze({
                  ...value.executionPolicy.allowPhysicalValidationAttempt,
                }),
              }),
        }),
    disabledReason: value.disabledReason ?? null,
  };
  return Object.freeze(config);
}
