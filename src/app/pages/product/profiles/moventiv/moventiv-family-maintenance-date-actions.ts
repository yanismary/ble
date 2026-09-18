import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteConfirmationPolicy,
  LegacyBleWriteExecutionPolicy,
  LegacyBleWriteRequest,
} from '../../../../core/services/ble-write-execution.service';
import { HistoricalBleDate } from
  '../../../../core/services/ble-read-decoders';
import {
  KnownProductProfile,
  LegacyBleDateFields,
  LegacyBleWrite,
  encodeLegacyDateWrite,
  isCataloguedLegacyBleWrite,
} from '../../../../core/services/legacy-ble-write-catalog';

export type ProductDateActionProfile =
  | 'moventiv-60'
  | 'moventiv-80'
  | 'garline';

export type ProductDateActionKind =
  | 'first-commissioning'
  | 'maintenance';

export type ProductDateMaintenanceFlowKind =
  | 'first-commissioning'
  | 'maintenance';

export type ProductDateActionFailureReason =
  | 'unsupported-profile'
  | 'invalid-context'
  | 'first-commissioning-already-initialized'
  | 'first-commissioning-date-invalid'
  | 'invalid-date';

export interface ProductDateActionContext {
  readonly profile: KnownProductProfile;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly identificationConfidence: 'strong' | 'weak' | 'indeterminate';
}

export interface ProductDateActionAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly context: ProductDateActionContext;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}

export interface ProductDateActionPreparationInput {
  readonly context: ProductDateActionContext | null;
  readonly now: Date;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}

export interface FirstCommissioningDatePreparationInput
  extends ProductDateActionPreparationInput {
  readonly firstCommissioningDate: HistoricalBleDate | null;
}

export interface ProductDateActionSuccess {
  readonly ok: true;
  readonly action: ProductDateActionKind;
  readonly write: LegacyBleWrite;
  readonly request: LegacyBleWriteRequest;
  readonly authorization: LegacyBleWriteAuthorization;
  readonly fields: LegacyBleDateFields;
  readonly historicalEffect: true;
  readonly resetsLocalCounters: false;
}

export interface ProductDateActionFailure {
  readonly ok: false;
  readonly reason: ProductDateActionFailureReason;
  readonly write: null;
  readonly request: null;
  readonly authorization: null;
  readonly historicalEffect: false;
  readonly resetsLocalCounters: false;
}

export type ProductDateActionPreparationResult =
  | ProductDateActionSuccess
  | ProductDateActionFailure;

export interface ProductDateMaintenanceFlowSuccess {
  readonly ok: true;
  readonly kind: ProductDateMaintenanceFlowKind;
  readonly actions: readonly ProductDateActionSuccess[];
  readonly historicalEffect: true;
  readonly resetsLocalCounters: false;
}

export interface ProductDateMaintenanceFlowFailure {
  readonly ok: false;
  readonly reason: ProductDateActionFailureReason;
  readonly actions: readonly ProductDateActionSuccess[];
  readonly historicalEffect: false;
  readonly resetsLocalCounters: false;
}

export type ProductDateMaintenanceFlowPreparationResult =
  | ProductDateMaintenanceFlowSuccess
  | ProductDateMaintenanceFlowFailure;

export const PRODUCT_DATE_ACTION_CONFIRMATION_POLICY:
  LegacyBleWriteConfirmationPolicy = Object.freeze({ kind: 'gatt-only' });

export const PRODUCT_DATE_ACTION_EXECUTION_POLICY:
  LegacyBleWriteExecutionPolicy = Object.freeze({
    allowPhase1ReferenceOnly: true,
  });

const PRODUCT_DATE_ACTION_AUTHORIZATION_TTL_MS = 30_000;

export function canInitializeFirstCommissioning(input: {
  readonly context: ProductDateActionContext | null;
  readonly firstCommissioningDate: HistoricalBleDate | null;
}): boolean {
  return validActionContext(input.context) &&
    input.firstCommissioningDate?.status === 'not-initialized';
}

export function canRecordMaintenance(
  context: ProductDateActionContext | null,
): boolean {
  return validActionContext(context);
}

export function legacyDateFieldsFromDate(date: Date): LegacyBleDateFields {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('date must be valid.');
  }
  const year = date.getFullYear() - 2000;
  const month = date.getMonth();
  const day = date.getDate();
  const hour = date.getHours();
  if (!Number.isInteger(year) || year < 0 || year > 255) {
    throw new Error('date year is outside the supported legacy range.');
  }
  return Object.freeze({ year, month, day, hour });
}

export function prepareFirstCommissioningDateAction(
  input: FirstCommissioningDatePreparationInput,
): ProductDateActionPreparationResult {
  const contextStatus = validateActionContext(input.context);
  if (contextStatus !== null) {
    return failure(contextStatus);
  }
  const context = input.context;
  if (context === null) {
    return failure('invalid-context');
  }
  if (input.firstCommissioningDate === null ||
      input.firstCommissioningDate.status === 'invalid') {
    return failure('first-commissioning-date-invalid');
  }
  if (input.firstCommissioningDate.status !== 'not-initialized') {
    return failure('first-commissioning-already-initialized');
  }
  return prepareDateAction({
    action: 'first-commissioning',
    context,
    now: input.now,
    attemptId: input.attemptId,
    confirmationId: input.confirmationId,
    confirmedAt: input.confirmedAt,
  });
}

export function prepareMaintenanceDateAction(
  input: ProductDateActionPreparationInput,
): ProductDateActionPreparationResult {
  const contextStatus = validateActionContext(input.context);
  if (contextStatus !== null) {
    return failure(contextStatus);
  }
  const context = input.context;
  if (context === null) {
    return failure('invalid-context');
  }
  return prepareDateAction({
    action: 'maintenance',
    context,
    now: input.now,
    attemptId: input.attemptId,
    confirmationId: input.confirmationId,
    confirmedAt: input.confirmedAt,
  });
}

export function prepareProductDateMaintenanceFlow(
  input: FirstCommissioningDatePreparationInput,
): ProductDateMaintenanceFlowPreparationResult {
  if (input.firstCommissioningDate === null ||
      input.firstCommissioningDate.status === 'invalid') {
    return flowFailure('first-commissioning-date-invalid');
  }
  if (input.firstCommissioningDate.status === 'not-initialized') {
    const maintenance = prepareMaintenanceDateAction(input);
    if (!maintenance.ok) {
      return flowFailure(maintenance.reason);
    }
    const firstCommissioning = prepareFirstCommissioningDateAction({
      ...input,
      confirmationId: `${input.confirmationId}:first-commissioning`,
    });
    return firstCommissioning.ok
      ? flowSuccess('first-commissioning', [
          maintenance,
          firstCommissioning,
        ])
      : flowFailure(firstCommissioning.reason);
  }
  const maintenance = prepareMaintenanceDateAction(input);
  return maintenance.ok
    ? flowSuccess('maintenance', [maintenance])
    : flowFailure(maintenance.reason);
}

export function createProductDateActionAuthorization(
  input: ProductDateActionAuthorizationInput,
): LegacyBleWriteAuthorization {
  if (!isCataloguedLegacyBleWrite(input.write) ||
      (input.write.operation !== 'first-commissioning-date' &&
        input.write.operation !== 'maintenance-date') ||
      input.write.profile !== input.context.profile ||
      input.write.destructiveLevel !== 'non-destructive-setting' ||
      input.write.hardwareValidationStatus !== 'phase1-reference-only') {
    throw new Error('A controlled catalogued product date write is required.');
  }
  if (validateActionContext(input.context) !== null ||
      !input.attemptId.trim() ||
      !input.confirmationId.trim() ||
      !Number.isFinite(input.confirmedAt)) {
    throw new Error('Product date authorization context is invalid.');
  }
  return Object.freeze({
    confirmedByUser: true,
    confirmedAt: input.confirmedAt,
    expiresAt: input.confirmedAt + PRODUCT_DATE_ACTION_AUTHORIZATION_TTL_MS,
    confirmationId: input.confirmationId,
    operation: input.write.operation,
    payloadHex: input.write.payloadHex,
    profile: input.write.profile,
    deviceId: input.context.deviceId,
    connectionGeneration: input.context.connectionGeneration,
    attemptId: input.attemptId,
  });
}

function prepareDateAction(input: {
  readonly action: ProductDateActionKind;
  readonly context: ProductDateActionContext;
  readonly now: Date;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}): ProductDateActionPreparationResult {
  try {
    const fields = legacyDateFieldsFromDate(input.now);
    const write = encodeLegacyDateWrite(
      input.context.profile,
      input.action,
      fields,
    );
    const authorization = createProductDateActionAuthorization({
      write,
      context: input.context,
      attemptId: input.attemptId,
      confirmationId: input.confirmationId,
      confirmedAt: input.confirmedAt,
    });
    const request: LegacyBleWriteRequest = Object.freeze({
      write,
      deviceId: input.context.deviceId,
      profile: input.context.profile,
      connectionGeneration: input.context.connectionGeneration,
      identification: {
        profile: input.context.profile,
        confidence: input.context.identificationConfidence,
      },
      authorization,
      attemptId: input.attemptId,
      confirmationPolicy: PRODUCT_DATE_ACTION_CONFIRMATION_POLICY,
      policy: PRODUCT_DATE_ACTION_EXECUTION_POLICY,
    });
    return Object.freeze({
      ok: true,
      action: input.action,
      write,
      request,
      authorization,
      fields,
      historicalEffect: true,
      resetsLocalCounters: false,
    });
  } catch {
    return failure('invalid-date');
  }
}

function validActionContext(
  context: ProductDateActionContext | null,
): context is ProductDateActionContext & {
  readonly profile: ProductDateActionProfile;
} {
  return validateActionContext(context) === null;
}

function validateActionContext(
  context: ProductDateActionContext | null,
): 'unsupported-profile' | 'invalid-context' | null {
  if (context === null ||
      !context.deviceId.trim() ||
      !Number.isInteger(context.connectionGeneration) ||
      context.connectionGeneration < 0 ||
      context.identificationConfidence !== 'strong') {
    return 'invalid-context';
  }
  switch (context.profile) {
    case 'moventiv-60':
    case 'moventiv-80':
    case 'garline':
      return null;
    case 'widoor':
      return 'unsupported-profile';
  }
}

function failure(
  reason: ProductDateActionFailureReason,
): ProductDateActionFailure {
  return Object.freeze({
    ok: false,
    reason,
    write: null,
    request: null,
    authorization: null,
    historicalEffect: false,
    resetsLocalCounters: false,
  });
}

function flowSuccess(
  kind: ProductDateMaintenanceFlowKind,
  actions: readonly ProductDateActionSuccess[],
): ProductDateMaintenanceFlowSuccess {
  return Object.freeze({
    ok: true,
    kind,
    actions: Object.freeze([...actions]),
    historicalEffect: true,
    resetsLocalCounters: false,
  });
}

function flowFailure(
  reason: ProductDateActionFailureReason,
): ProductDateMaintenanceFlowFailure {
  return Object.freeze({
    ok: false,
    reason,
    actions: Object.freeze([]),
    historicalEffect: false,
    resetsLocalCounters: false,
  });
}
