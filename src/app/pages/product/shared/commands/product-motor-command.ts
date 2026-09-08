import {
  LegacyBleWrite,
  LegacyHardwareValidationStatus,
  LegacyMotorCommand,
  LegacyMotorOperation,
  KnownProductProfile,
} from '../../../../core/services/legacy-ble-write-catalog';
import {
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteConfirmationStatus,
  LegacyBleWriteExecutionPolicy,
  TimedCycleValidationStatus,
} from '../../../../core/services/ble-write-execution.service';
import { PRODUCT_PAGE_TEXT } from
  '../localization/product-page-text';

export type ProductMotorCommandOperation = Exclude<LegacyMotorOperation,
  'motor-learning'>;

export type ProductMotorCommandStatus =
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

export interface ProductMotorCommandState {
  readonly operation: ProductMotorCommandOperation;
  readonly label: string;
  readonly status: ProductMotorCommandStatus;
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
  readonly status: ProductMotorCommandStatus;
  readonly confirmationStatus: LegacyBleWriteConfirmationStatus | null;
  readonly durationMs: number | null;
  readonly timedCycleValidationStatus: TimedCycleValidationStatus;
  readonly isTimedCommand: boolean;
  readonly technicalErrorCode: string | null;
}

export type ProductMotorCommandTextKey =
  | 'open'
  | 'close'
  | 'openShortTimed'
  | 'openLongTimed'
  | 'learning';

export interface ProductMotorCommandUiConfig {
  readonly profile: KnownProductProfile;
  readonly command: LegacyMotorCommand;
  readonly operation: LegacyMotorOperation;
  readonly textKey: ProductMotorCommandTextKey;
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

export function initialProductMotorCommandState(
  operation: ProductMotorCommandOperation = 'motor-open',
  label = '',
  expectedMotorStateRaw: number | null = null,
): ProductMotorCommandState {
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

export type ProductMotorCommandDefinition = Omit<ProductMotorCommandUiConfig,
    'confirmationPolicy' | 'physicalValidationPolicy' |
    'expectedMotorStateRaw' | 'label' | 'confirmationTitle' |
    'confirmationMessage' | 'confirmationButtonLabel' |
    'confirmationSuccessMessage' | 'unconfirmedMessage' |
    'disabledReason'> & Partial<Pick<ProductMotorCommandUiConfig,
    'confirmationPolicy' | 'physicalValidationPolicy' |
    'expectedMotorStateRaw' |
    'disabledReason'>>;

export function createProductMotorCommandUiConfig(
  value: ProductMotorCommandDefinition,
): ProductMotorCommandUiConfig {
  const confirmationPolicy: LegacyBleWriteConfirmationPolicy | null =
    value.confirmationPolicy === undefined
      ? null
      : Object.freeze({ ...value.confirmationPolicy }) as
        LegacyBleWriteConfirmationPolicy;
  const text = PRODUCT_PAGE_TEXT.widoorCommands[value.textKey];
  const config: ProductMotorCommandUiConfig = {
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

export function productMotorCommandConfigsForProfile(
  profile: KnownProductProfile,
  configs: readonly ProductMotorCommandUiConfig[],
): readonly ProductMotorCommandUiConfig[] {
  if (configs.some((config) => config.profile !== profile)) {
    throw new Error(`Motor command config profile mismatch for ${profile}.`);
  }
  return Object.freeze([...configs]);
}
