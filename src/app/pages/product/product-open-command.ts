import {
  LegacyBleWrite,
  LegacyHardwareValidationStatus,
  LegacyMotorCommand,
  LegacyMotorOperation,
  KnownProductProfile,
  encodeLegacyMotorCommand,
  isCataloguedLegacyBleWrite,
} from '../../core/services/legacy-ble-write-catalog';
import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteConfirmationStatus,
  LegacyBleWriteExecutionPolicy,
  TimedCycleValidationStatus,
} from '../../core/services/ble-write-execution.service';
import {
  WIDOOR_CLOSING_STARTED_STATE,
  WIDOOR_OPENING_STARTED_STATE,
} from '../../core/services/motor-command-confirmation';
import { PRODUCT_PAGE_TEXT } from './product-page.text';
import { ProductProfileDefinition } from
  './profiles/product-profile.types';

export const WIDOOR_COMMAND_AUTHORIZATION_TTL_MS = 15_000;
export const WIDOOR_OPEN_AUTHORIZATION_TTL_MS =
  WIDOOR_COMMAND_AUTHORIZATION_TTL_MS;

export type ProductMotorCommandOperation = Exclude<LegacyMotorOperation,
  'motor-learning'>;

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
  readonly label: string;
  readonly status: ProductOpenCommandStatus;
  readonly startedAt: number | null;
  readonly completedAt: number | null;
  readonly confirmationStatus: LegacyBleWriteConfirmationStatus | null;
  readonly nativeWriteCompleted: boolean;
  readonly message: string | null;
  readonly technicalErrorCode: string | null;
  readonly attemptId: string | null;
  readonly expectedMotorStateRaw: number | null;
  readonly receivedMotorStateRaw: number | null;
  readonly movementStartConfirmed: boolean;
  readonly timedCycleValidationStatus: TimedCycleValidationStatus;
  readonly secondaryMessage: string | null;
}

export interface ProductCommandHistoryEntry {
  readonly time: string;
  readonly label: string;
  readonly status: ProductOpenCommandStatus;
  readonly confirmationStatus: LegacyBleWriteConfirmationStatus | null;
  readonly durationMs: number | null;
  readonly timedCycleValidationStatus: TimedCycleValidationStatus;
  readonly isTimedCommand: boolean;
  readonly technicalErrorCode: string | null;
}

export type WidoorCommandTextKey =
  | 'open'
  | 'close'
  | 'openShortTimed'
  | 'openLongTimed'
  | 'learning';

export interface WidoorCommandUiConfig {
  readonly profile: KnownProductProfile;
  readonly command: LegacyMotorCommand;
  readonly operation: LegacyMotorOperation;
  readonly textKey: WidoorCommandTextKey;
  readonly label: string;
  readonly confirmationTitle: string;
  readonly confirmationMessage: string;
  readonly confirmationButtonLabel: string;
  readonly confirmationSuccessMessage: string;
  readonly unconfirmedMessage: string;
  readonly catalogFactory: () => LegacyBleWrite;
  readonly enabled: boolean;
  readonly expectedMotorStateRaw: number | null;
  readonly confirmationPolicy: LegacyBleWriteConfirmationPolicy | null;
  readonly physicalValidationPolicy: LegacyBleWriteExecutionPolicy | undefined;
  readonly hardwareValidationStatus: LegacyHardwareValidationStatus;
  readonly disabledReason: 'physical-validation' | 'protected' | null;
  readonly isTimedCommand: boolean;
}

export const WIDOOR_COMMAND_UI_CONFIGS: readonly WidoorCommandUiConfig[] =
  commandConfigsForProfile('widoor', [
    commandConfig({
      profile: 'widoor',
      command: 'OPEN',
      operation: 'motor-open',
      textKey: 'open',
      catalogFactory: () => encodeLegacyMotorCommand('widoor', 'OPEN'),
      enabled: true,
      expectedMotorStateRaw: WIDOOR_OPENING_STARTED_STATE,
      confirmationPolicy: { kind: 'widoor-open-state' },
      hardwareValidationStatus: 'validated-widoor-old-firmware',
      isTimedCommand: false,
    }),
    commandConfig({
      profile: 'widoor',
      command: 'CLOSE',
      operation: 'motor-close',
      textKey: 'close',
      catalogFactory: () => encodeLegacyMotorCommand('widoor', 'CLOSE'),
      enabled: true,
      expectedMotorStateRaw: WIDOOR_CLOSING_STARTED_STATE,
      confirmationPolicy: { kind: 'widoor-close-state' },
      physicalValidationPolicy: {
        allowPhysicalValidationAttempt: {
          operation: 'motor-close',
          profile: 'widoor',
        },
      },
      hardwareValidationStatus: 'phase1-reference-only',
      isTimedCommand: false,
    }),
    commandConfig({
      profile: 'widoor',
      command: 'OPEN_SHORT_TIMED',
      operation: 'motor-open-short-timed',
      textKey: 'openShortTimed',
      catalogFactory: () => encodeLegacyMotorCommand(
        'widoor', 'OPEN_SHORT_TIMED',
      ),
      enabled: true,
      expectedMotorStateRaw: WIDOOR_OPENING_STARTED_STATE,
      confirmationPolicy: {
        kind: 'widoor-timed-opening-state',
        command: 'OPEN_SHORT_TIMED',
      },
      physicalValidationPolicy: {
        allowPhysicalValidationAttempt: {
          operation: 'motor-open-short-timed',
          profile: 'widoor',
        },
      },
      hardwareValidationStatus: 'phase1-reference-only',
      isTimedCommand: true,
    }),
  ]);

type MoventivGarlineMotorCommand = Extract<
  LegacyMotorCommand,
  'OPEN' | 'CLOSE' | 'OPEN_SHORT_TIMED'
>;

const MOVENTIV_GARLINE_COMMANDS: readonly MoventivGarlineMotorCommand[] = [
  'OPEN',
  'CLOSE',
  'OPEN_SHORT_TIMED',
];

export const MOTOR_COMMAND_UI_CONFIGS: Readonly<
  Record<KnownProductProfile, readonly WidoorCommandUiConfig[]>
> = Object.freeze({
  widoor: WIDOOR_COMMAND_UI_CONFIGS,
  'moventiv-60': commandConfigsForProfile('moventiv-60',
    MOVENTIV_GARLINE_COMMANDS.map((command) =>
      commandConfig(gattOnlyCommand('moventiv-60', command)),
    ),
  ),
  'moventiv-80': commandConfigsForProfile('moventiv-80',
    MOVENTIV_GARLINE_COMMANDS.map((command) =>
      commandConfig(gattOnlyCommand('moventiv-80', command)),
    ),
  ),
  garline: commandConfigsForProfile('garline',
    MOVENTIV_GARLINE_COMMANDS.map((command) =>
      commandConfig(gattOnlyCommand('garline', command)),
    ),
  ),
});

export function productMotorCommandConfigsFor(
  definition: Pick<ProductProfileDefinition, 'profile' | 'commands'>,
): readonly WidoorCommandUiConfig[] {
  const catalog = MOTOR_COMMAND_UI_CONFIGS[definition.profile];
  return Object.freeze(definition.commands.map((operation) => {
    const config = catalog.find((candidate) =>
      candidate.operation === operation,
    );
    if (config === undefined) {
      throw new Error(
        `Missing motor-command implementation for ${definition.profile}: ` +
        `${operation}.`,
      );
    }
    return config;
  }));
}

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
  return createProductMotorCommandAuthorization(input);
}

export function createProductMotorCommandAuthorization(
  input: WidoorCommandAuthorizationInput,
): LegacyBleWriteAuthorization {
  const expiresAt = input.confirmedAt + WIDOOR_COMMAND_AUTHORIZATION_TTL_MS;
  const validWidoorOpen = input.write.profile === 'widoor' &&
    input.write.operation === 'motor-open' &&
    input.write.hardwareValidationStatus === 'validated-widoor-old-firmware';
  const validPhase1MotorReference = (
    input.write.operation === 'motor-close' ||
    input.write.operation === 'motor-open' ||
    input.write.operation === 'motor-open-short-timed' ||
    input.write.operation === 'motor-open-long-timed'
  ) &&
    input.write.hardwareValidationStatus === 'phase1-reference-only';
  if (!isCataloguedLegacyBleWrite(input.write) ||
      input.write.destructiveLevel !== 'motor-movement' ||
      (!validWidoorOpen && !validPhase1MotorReference)) {
    throw new Error('A controlled catalogued motor write is required.');
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
    profile: input.write.profile,
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
  label = '',
  expectedMotorStateRaw: number | null = null,
): ProductOpenCommandState {
  return Object.freeze({
    operation,
    label,
    status: 'idle',
    startedAt: null,
    completedAt: null,
    confirmationStatus: null,
    nativeWriteCompleted: false,
    message: null,
    technicalErrorCode: null,
    attemptId: null,
    expectedMotorStateRaw,
    receivedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    secondaryMessage: null,
  });
}

export function formatCommandHistoryTime(timestamp: number): string {
  if (!Number.isFinite(timestamp)) {
    return '--:--:--';
  }
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) {
    return '--:--:--';
  }
  return [value.getHours(), value.getMinutes(), value.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

function commandConfig(
  value: Omit<WidoorCommandUiConfig,
    'confirmationPolicy' | 'physicalValidationPolicy' |
    'expectedMotorStateRaw' | 'label' | 'confirmationTitle' |
    'confirmationMessage' | 'confirmationButtonLabel' |
    'confirmationSuccessMessage' | 'unconfirmedMessage' |
    'disabledReason'> & Partial<Pick<WidoorCommandUiConfig,
    'confirmationPolicy' | 'physicalValidationPolicy' |
    'expectedMotorStateRaw' |
    'disabledReason'>>,
): WidoorCommandUiConfig {
  const confirmationPolicy: LegacyBleWriteConfirmationPolicy | null =
    value.confirmationPolicy === undefined
      ? null
      : Object.freeze({ ...value.confirmationPolicy }) as
        LegacyBleWriteConfirmationPolicy;
  const text = PRODUCT_PAGE_TEXT.widoorCommands[value.textKey];
  const config: WidoorCommandUiConfig = {
    ...value,
    label: text.label,
    confirmationTitle: text.confirmTitle,
    confirmationMessage: text.confirmMessage,
    confirmationButtonLabel: text.confirmAction,
    confirmationSuccessMessage: text.confirmed,
    unconfirmedMessage: text.notConfirmed,
    expectedMotorStateRaw: value.expectedMotorStateRaw ?? null,
    confirmationPolicy,
    physicalValidationPolicy: value.physicalValidationPolicy === undefined
      ? undefined
      : Object.freeze({
          ...value.physicalValidationPolicy,
          ...(value.physicalValidationPolicy.allowPhysicalValidationAttempt ===
            undefined
            ? {}
            : {
                allowPhysicalValidationAttempt: Object.freeze({
                  ...value.physicalValidationPolicy
                    .allowPhysicalValidationAttempt,
                }),
              }),
        }),
    disabledReason: value.disabledReason ?? null,
  };
  return Object.freeze(config);
}

function commandConfigsForProfile(
  profile: KnownProductProfile,
  configs: readonly WidoorCommandUiConfig[],
): readonly WidoorCommandUiConfig[] {
  if (configs.some((config) => config.profile !== profile)) {
    throw new Error(`Motor command config profile mismatch for ${profile}.`);
  }
  return Object.freeze([...configs]);
}

function gattOnlyCommand(
  profile: Exclude<KnownProductProfile, 'widoor'>,
  command: MoventivGarlineMotorCommand,
): Omit<WidoorCommandUiConfig,
  'confirmationPolicy' | 'physicalValidationPolicy' |
  'expectedMotorStateRaw' | 'label' | 'confirmationTitle' |
  'confirmationMessage' | 'confirmationButtonLabel' |
  'confirmationSuccessMessage' | 'unconfirmedMessage' |
  'disabledReason'> & Partial<Pick<WidoorCommandUiConfig,
  'confirmationPolicy' | 'physicalValidationPolicy' |
  'expectedMotorStateRaw' |
  'disabledReason'>> {
  const textKeys: Record<typeof command, WidoorCommandTextKey> = {
    OPEN: 'open',
    CLOSE: 'close',
    OPEN_SHORT_TIMED: 'openShortTimed',
  };
  const operations: Record<typeof command, LegacyMotorOperation> = {
    OPEN: 'motor-open',
    CLOSE: 'motor-close',
    OPEN_SHORT_TIMED: 'motor-open-short-timed',
  };
  return {
    profile,
    command,
    operation: operations[command],
    textKey: textKeys[command],
    catalogFactory: () => encodeLegacyMotorCommand(profile, command),
    enabled: true,
    expectedMotorStateRaw: null,
    confirmationPolicy: { kind: 'gatt-only' },
    physicalValidationPolicy: { allowPhase1ReferenceOnly: true },
    hardwareValidationStatus: 'phase1-reference-only',
    isTimedCommand: command === 'OPEN_SHORT_TIMED',
  };
}
