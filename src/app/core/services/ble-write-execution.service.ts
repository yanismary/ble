import { Injectable, OnDestroy, inject } from '@angular/core';

import { BleService } from './ble';
import { BLE_UUIDS, ProductProfile } from './ble-profile-catalog';
import {
  KnownProductProfile,
  LegacyBleWrite,
  LegacyDestructiveLevel,
  LegacyHardwareValidationStatus,
  inspectCataloguedLegacyBleWrite,
  isCataloguedLegacyBleWrite,
} from './legacy-ble-write-catalog';
import { MotorCommandService } from './motor-command.service';

export type LegacyBleWriteExecutionStatus =
  | 'success'
  | 'blocked-by-policy'
  | 'invalid-request'
  | 'unavailable'
  | 'disconnected'
  | 'stale'
  | 'failed'
  | 'timeout';

export type LegacyBleWriteConfirmationStatus =
  | 'confirmed'
  | 'not-required'
  | 'unavailable'
  | 'not-validated'
  | 'timeout';

export type TimedCycleValidationStatus =
  | 'not-observed'
  | 'pending-physical-validation'
  | 'validated'
  | 'failed';

export type WidoorPhysicalValidationOperation =
  | 'motor-close'
  | 'motor-open-short-timed'
  | 'motor-open-long-timed';

export interface LegacyBleWriteAuthorization {
  readonly confirmedByUser: boolean;
  readonly confirmedAt: number;
  readonly expiresAt: number;
  readonly confirmationId: string;
  readonly operation: string;
  readonly payloadHex: string;
  readonly profile: ProductProfile;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly motorMovementConfirmed?: boolean;
}

export interface LegacyBleWriteIdentification {
  readonly profile: ProductProfile;
  readonly confidence: 'strong' | 'weak' | 'indeterminate';
}

export type LegacyBleWriteConfirmationPolicy =
  | {
      readonly kind: 'gatt-only';
    }
  | {
      readonly kind: 'widoor-open-state';
      readonly timeoutMs?: number;
    }
  | {
      readonly kind: 'widoor-close-state';
      readonly timeoutMs?: number;
    }
  | {
      readonly kind: 'widoor-timed-opening-state';
      readonly command: 'OPEN_SHORT_TIMED' | 'OPEN_LONG_TIMED';
      readonly timeoutMs?: number;
    };

export interface LegacyBleWriteExecutionPolicy {
  readonly allowPhase1ReferenceOnly?: true;
  readonly allowLearning?: true;
  readonly allowReset?: true;
  readonly allowPhysicalValidationAttempt?: {
    readonly operation: WidoorPhysicalValidationOperation;
    readonly profile: 'widoor';
  };
}

export interface LegacyBleWriteRequest {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly profile: ProductProfile;
  readonly connectionGeneration: number;
  readonly identification: LegacyBleWriteIdentification;
  readonly authorization: LegacyBleWriteAuthorization | null;
  readonly attemptId: string;
  readonly confirmationPolicy: LegacyBleWriteConfirmationPolicy;
  readonly policy?: LegacyBleWriteExecutionPolicy;
}

export interface LegacyBleWriteExecutionError {
  readonly code: string;
  readonly message: string;
  readonly nativeCause?: unknown;
}

export interface LegacyBleWriteExecutionResult {
  readonly status: LegacyBleWriteExecutionStatus;
  readonly operation: string;
  readonly profile: ProductProfile;
  readonly deviceId: string;
  readonly serviceUuid: string;
  readonly characteristicUuid: string;
  readonly payloadHex: string;
  readonly length: number;
  readonly destructiveLevel: LegacyDestructiveLevel | null;
  readonly hardwareValidationStatus: LegacyHardwareValidationStatus | null;
  readonly policyOverrideUsed: boolean;
  readonly startedAt: number;
  readonly completedAt: number;
  readonly connectionGeneration: number;
  readonly nativeWriteCompleted: boolean;
  readonly confirmationStatus: LegacyBleWriteConfirmationStatus;
  readonly confirmedMotorStateRaw: number | null;
  readonly movementStartConfirmed: boolean;
  readonly timedCycleValidationStatus: TimedCycleValidationStatus;
  readonly error: LegacyBleWriteExecutionError | null;
}

interface ExecutionContext {
  readonly deviceId: string;
  readonly generation: number;
  readonly attemptToken: symbol;
}

@Injectable({
  providedIn: 'root',
})
export class BleWriteExecutionService implements OnDestroy {
  private readonly bleService = inject(BleService);
  private readonly motorCommandService = inject(MotorCommandService);
  private readonly consumedAuthorizations = new Map<string, number>();
  private activeAttemptToken: symbol | null = null;
  private destroyed = false;

  get isExecuting(): boolean {
    return this.activeAttemptToken !== null;
  }

  async execute(
    request: LegacyBleWriteRequest,
  ): Promise<LegacyBleWriteExecutionResult> {
    const startedAt = Date.now();
    const stableRequest = snapshotRequest(request);
    if (this.activeAttemptToken !== null) {
      return this.result(
        stableRequest,
        startedAt,
        'unavailable',
        false,
        'unavailable',
        false,
        'write-in-progress',
        'Another BLE write execution is already in progress.',
      );
    }

    const attemptToken = Symbol(stableRequest.attemptId);
    this.activeAttemptToken = attemptToken;
    try {
      return await this.executeLocked(
        stableRequest,
        startedAt,
        attemptToken,
      );
    } catch (error: unknown) {
      return this.result(
        stableRequest,
        startedAt,
        'failed',
        false,
        'unavailable',
        false,
        'unexpected-error',
        errorMessage(error),
        error,
      );
    } finally {
      if (this.activeAttemptToken === attemptToken) {
        this.activeAttemptToken = null;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.activeAttemptToken = null;
  }

  private async executeLocked(
    request: LegacyBleWriteRequest,
    startedAt: number,
    attemptToken: symbol,
  ): Promise<LegacyBleWriteExecutionResult> {
    const invalid = this.validateRequest(request, startedAt);
    if (invalid !== null) {
      return invalid;
    }

    const write = request.write;
    const policy = this.validatePolicy(request, startedAt);
    if (policy !== null) {
      return policy;
    }

    const properties = this.bleService.getGattCharacteristicProperties(
      write.serviceUuid,
      write.characteristicUuid,
      request.deviceId,
    );
    if (!properties.servicePresent) {
      return this.result(
        request, startedAt, 'unavailable', false, 'unavailable', false,
        'service-unavailable', 'The catalogued BLE service is not available.',
      );
    }
    if (!properties.characteristicPresent) {
      return this.result(
        request, startedAt, 'unavailable', false, 'unavailable', false,
        'characteristic-unavailable',
        'The catalogued BLE characteristic is not available.',
      );
    }
    if (!properties.propertiesAvailable || properties.write === null) {
      return this.result(
        request, startedAt, 'unavailable', false, 'unavailable', false,
        'write-property-unknown',
        'The platform did not report the write-with-response capability.',
      );
    }
    if (!properties.write) {
      return this.result(
        request, startedAt, 'unavailable', false, 'unavailable', false,
        'characteristic-not-writable',
        'The characteristic does not advertise write with response.',
      );
    }

    const context: ExecutionContext = {
      deviceId: request.deviceId,
      generation: request.connectionGeneration,
      attemptToken,
    };
    const contextFailure = this.contextFailure(
      request,
      startedAt,
      context,
      false,
    );
    if (contextFailure !== null) {
      return contextFailure;
    }

    const authorizationFailure = this.validateAuthorization(
      request,
      startedAt,
    );
    if (authorizationFailure !== null) {
      return authorizationFailure;
    }
    // Authorization is consumed at the last synchronous boundary before the
    // native write (or a Widoor motor-state confirmation flow) begins.
    this.consumeAuthorization(request.authorization);
    if (isControlledWidoorMotorWrite(write)) {
      return this.executeWidoorMotorCommand(request, startedAt, context);
    }
    return this.executeGattWrite(request, startedAt, context);
  }

  private validateRequest(
    request: LegacyBleWriteRequest,
    startedAt: number,
  ): LegacyBleWriteExecutionResult | null {
    if (this.destroyed) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'service-destroyed', 'The BLE write execution service is destroyed.',
      );
    }
    if (!request.attemptId?.trim()) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'invalid-attempt-id', 'A non-empty attempt identifier is required.',
      );
    }
    if (!isKnownProfile(request.profile) ||
        !isKnownProfile(request.identification?.profile)) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'invalid-profile', 'A known product profile is required.',
      );
    }
    const authenticity = inspectCataloguedLegacyBleWrite(request.write);
    if (authenticity !== 'authentic') {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        authenticity === 'altered'
          ? 'altered-catalog-write'
          : 'unauthenticated-catalog-write',
        authenticity === 'altered'
          ? 'The catalogued write was altered after creation.'
          : 'The write was not produced by the legacy catalog.',
      );
    }
    if (request.write.profile !== request.profile ||
        request.identification.profile !== request.profile) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'profile-mismatch',
        'The requested, detected, and catalogued profiles must match.',
      );
    }
    if (!isTargetCompatible(request.write)) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'profile-target-mismatch',
        'The catalogued service is incompatible with this profile and write.',
      );
    }
    if ((request.write.destructiveLevel === 'motor-movement' ||
        request.write.destructiveLevel === 'learning' ||
        request.write.destructiveLevel === 'reset') &&
        request.identification.confidence !== 'strong') {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'strong-identification-required',
        'Motor movement requires a strong product identification.',
      );
    }
    if (!request.deviceId?.trim() ||
        request.deviceId !== this.bleService.connectedDeviceId) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'invalid-device',
        'The target device is not the connected BLE device.',
      );
    }
    if (!Number.isInteger(request.connectionGeneration) ||
        request.connectionGeneration < 0) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'invalid-generation',
        'A non-negative integer connection generation is required.',
      );
    }
    if (
        request.connectionGeneration !==
          this.bleService.connectionGeneration) {
      return this.result(
        request, startedAt, 'stale', false, 'unavailable', false,
        'generation-mismatch',
        'The request belongs to a different BLE connection generation.',
      );
    }
    if (this.bleService.disconnectingDeviceId !== null) {
      return this.result(
        request, startedAt, 'disconnected', false, 'unavailable', false,
        'disconnect-in-progress', 'The BLE device is disconnecting.',
      );
    }
    if (this.bleService.isWriting) {
      return this.result(
        request, startedAt, 'unavailable', false, 'unavailable', false,
        'native-write-in-progress', 'A native BLE write is already active.',
      );
    }

    return this.validateAuthorization(request, startedAt);
  }

  private validateAuthorization(
    request: LegacyBleWriteRequest,
    startedAt: number,
  ): LegacyBleWriteExecutionResult | null {
    const authorization = request.authorization;
    const now = Date.now();
    this.pruneAuthorizations(now);
    if (authorization == null || authorization.confirmedByUser !== true) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'authorization-required',
        'An explicit user authorization is required.',
      );
    }
    if (!authorization.confirmationId?.trim()) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'authorization-required',
        'A non-empty authorization identifier is required.',
      );
    }
    if (
        !Number.isFinite(authorization.confirmedAt) ||
        !Number.isFinite(authorization.expiresAt) ||
        authorization.confirmedAt > now ||
        authorization.expiresAt <= authorization.confirmedAt) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'invalid-authorization-dates',
        'The authorization dates are invalid.',
      );
    }
    if (authorization.expiresAt <= now) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'authorization-expired',
        'The explicit user authorization has expired.',
      );
    }
    if (this.consumedAuthorizations.has(authorization.confirmationId)) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'authorization-consumed',
        'This user authorization has already been consumed.',
      );
    }
    if (authorization.operation !== request.write.operation ||
        authorization.payloadHex !== request.write.payloadHex ||
        authorization.profile !== request.profile ||
        authorization.deviceId !== request.deviceId ||
        authorization.connectionGeneration !==
          request.connectionGeneration ||
        authorization.attemptId !== request.attemptId) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'authorization-scope-mismatch',
        'The authorization does not match this exact write attempt.',
      );
    }
    if (request.write.destructiveLevel === 'motor-movement' &&
        authorization.motorMovementConfirmed !== true) {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable', false,
        'motor-authorization-required',
        'Motor movement requires an explicit reinforced authorization.',
      );
    }
    return null;
  }

  private validatePolicy(
    request: LegacyBleWriteRequest,
    startedAt: number,
  ): LegacyBleWriteExecutionResult | null {
    const write = request.write;
    if (write.destructiveLevel === 'learning' &&
        request.policy?.allowLearning !== true) {
      return this.result(
        request, startedAt, 'blocked-by-policy', false, 'unavailable', false,
        'learning-blocked',
        'Learning writes require the explicit learning policy.',
      );
    }
    if (write.destructiveLevel === 'reset' &&
        request.policy?.allowReset !== true) {
      return this.result(
        request, startedAt, 'blocked-by-policy', false, 'unavailable', false,
        'reset-blocked',
        'Reset writes require the explicit reset policy.',
      );
    }

    if (write.hardwareValidationStatus === 'not-yet-validated') {
      return this.result(
        request, startedAt, 'blocked-by-policy', false, 'not-validated', false,
        'hardware-not-validated',
        'This write has not been validated and cannot be overridden.',
      );
    }
    const overrideUsed =
      write.hardwareValidationStatus === 'phase1-reference-only' &&
      (request.policy?.allowPhase1ReferenceOnly === true ||
        this.isPhysicalValidationAttempt(request));
    if (write.hardwareValidationStatus === 'phase1-reference-only' &&
        !overrideUsed) {
      return this.result(
        request, startedAt, 'blocked-by-policy', false, 'not-validated', false,
        'phase1-reference-blocked',
        'Phase 1 reference-only writes require an explicit internal override.',
      );
    }

    if (isWidoorOpen(write)) {
      if (request.confirmationPolicy.kind !== 'widoor-open-state') {
        return this.result(
          request, startedAt, 'invalid-request', false, 'unavailable',
          overrideUsed, 'widoor-confirmation-required',
          'Widoor OPEN must use the existing motor-state confirmation.',
        );
      }
    } else if (isWidoorClose(write)) {
      if (request.confirmationPolicy.kind !== 'widoor-close-state' ||
          !this.isPhysicalValidationAttempt(request)) {
        return this.result(
          request, startedAt, 'invalid-request', false, 'unavailable',
          overrideUsed, 'widoor-close-validation-required',
          'Widoor CLOSE requires its operation-scoped physical validation.',
        );
      }
    } else if (isWidoorTimedOpen(write)) {
      const expectedCommand = write.operation === 'motor-open-short-timed'
        ? 'OPEN_SHORT_TIMED'
        : 'OPEN_LONG_TIMED';
      if (request.confirmationPolicy.kind !==
          'widoor-timed-opening-state' ||
          request.confirmationPolicy.command !== expectedCommand ||
          !this.isPhysicalValidationAttempt(request)) {
        return this.result(
          request, startedAt, 'invalid-request', false, 'unavailable',
          overrideUsed, 'widoor-timed-validation-required',
          'Timed Widoor OPEN requires its operation-scoped validation.',
        );
      }
    } else if (request.confirmationPolicy.kind !== 'gatt-only') {
      return this.result(
        request, startedAt, 'invalid-request', false, 'unavailable',
        overrideUsed, 'invalid-confirmation-policy',
        'Only controlled Widoor motor commands support state confirmation.',
      );
    }
    return null;
  }

  private async executeGattWrite(
    request: LegacyBleWriteRequest,
    startedAt: number,
    context: ExecutionContext,
  ): Promise<LegacyBleWriteExecutionResult> {
    try {
      await this.bleService.writeCharacteristic(
        request.write.serviceUuid,
        request.write.characteristicUuid,
        Uint8Array.from(request.write.payload),
        request.deviceId,
      );
    } catch (error: unknown) {
      return this.contextFailure(request, startedAt, context, false) ??
        this.result(
          request, startedAt, 'failed', false, 'not-validated',
          this.overrideUsed(request), 'native-write-failed',
          errorMessage(error), error,
        );
    }

    return this.contextFailure(request, startedAt, context, true) ??
      this.result(
        request, startedAt, 'success', true,
        request.write.hardwareValidationStatus ===
          'validated-widoor-old-firmware'
          ? 'not-required'
          : 'not-validated',
        this.overrideUsed(request),
      );
  }

  private async executeWidoorMotorCommand(
    request: LegacyBleWriteRequest,
    startedAt: number,
    context: ExecutionContext,
  ): Promise<LegacyBleWriteExecutionResult> {
    const policy = request.confirmationPolicy;
    const overrideUsed = this.overrideUsed(request);
    const confirmation = policy.kind === 'widoor-open-state'
      ? await this.motorCommandService.sendMotorCommandWithConfirmation({
          profile: 'widoor',
          command: 'OPEN',
          deviceId: request.deviceId,
          timeoutMs: policy.timeoutMs,
        })
      : policy.kind === 'widoor-close-state'
        ? await this.motorCommandService
          .sendCataloguedWidoorMotorCommandWithConfirmation({
            write: request.write,
            command: 'CLOSE',
            deviceId: request.deviceId,
            timeoutMs: policy.timeoutMs,
          })
        : policy.kind === 'widoor-timed-opening-state'
          ? await this.motorCommandService
            .sendCataloguedWidoorMotorCommandWithConfirmation({
              write: request.write,
              command: policy.command,
              deviceId: request.deviceId,
              timeoutMs: policy.timeoutMs,
            })
          : (() => {
              throw new Error(
                'The Widoor motor confirmation policy was not validated.',
              );
            })();
    const nativeWriteCompleted =
      confirmation.status === 'confirmed' || confirmation.status === 'timeout';
    const contextFailure = this.contextFailure(
      request,
      startedAt,
      context,
      nativeWriteCompleted,
    );
    if (contextFailure !== null) {
      return contextFailure;
    }
    switch (confirmation.status) {
      case 'confirmed':
        return this.result(
          request, startedAt, 'success', true, 'confirmed', overrideUsed,
          undefined, undefined, undefined,
          confirmation.notification?.state ?? null,
        );
      case 'timeout':
        return this.result(
          request, startedAt, 'timeout', true, 'timeout', overrideUsed,
          'confirmation-timeout',
          confirmation.failureReason ??
            'No compatible Widoor motor state was received in time.',
        );
      case 'disconnected':
        return this.result(
          request, startedAt, 'disconnected', false, 'unavailable', overrideUsed,
          'device-disconnected',
          confirmation.failureReason ?? 'The BLE device disconnected.',
        );
      case 'failed':
        return this.result(
          request, startedAt, 'failed', false, 'unavailable', overrideUsed,
          'motor-command-failed',
          confirmation.failureReason ?? 'The motor command failed.',
        );
      case 'pending':
        return this.result(
          request, startedAt, 'failed', false, 'unavailable', overrideUsed,
          'non-terminal-confirmation',
          'The motor command returned a non-terminal confirmation.',
        );
    }
  }

  private contextFailure(
    request: LegacyBleWriteRequest,
    startedAt: number,
    context: ExecutionContext,
    nativeWriteCompleted: boolean,
  ): LegacyBleWriteExecutionResult | null {
    if (this.destroyed || this.activeAttemptToken !== context.attemptToken) {
      return this.result(
        request, startedAt, 'stale', nativeWriteCompleted, 'unavailable',
        this.overrideUsed(request), 'execution-stale',
        'The write result belongs to an inactive execution attempt.',
      );
    }
    if (this.bleService.connectionGeneration !== context.generation) {
      const disconnected = this.bleService.connectedDeviceId === null;
      return this.result(
        request,
        startedAt,
        disconnected ? 'disconnected' : 'stale',
        nativeWriteCompleted,
        'unavailable',
        this.overrideUsed(request),
        disconnected ? 'device-disconnected' : 'connection-stale',
        disconnected
          ? 'The BLE device disconnected during the write.'
          : 'The BLE connection changed during the write.',
      );
    }
    if (this.bleService.connectedDeviceId !== context.deviceId) {
      return this.result(
        request, startedAt, 'stale', nativeWriteCompleted, 'unavailable',
        this.overrideUsed(request), 'device-stale',
        'The connected BLE device changed during the write.',
      );
    }
    return null;
  }

  private consumeAuthorization(
    authorization: LegacyBleWriteAuthorization | null,
  ): void {
    if (authorization !== null) {
      this.consumedAuthorizations.set(
        authorization.confirmationId,
        authorization.expiresAt,
      );
    }
  }

  private pruneAuthorizations(now: number): void {
    for (const [confirmationId, expiresAt] of this.consumedAuthorizations) {
      if (expiresAt <= now) {
        this.consumedAuthorizations.delete(confirmationId);
      }
    }
  }

  private overrideUsed(request: LegacyBleWriteRequest): boolean {
    return request.write?.hardwareValidationStatus ===
      'phase1-reference-only' &&
      (request.policy?.allowPhase1ReferenceOnly === true ||
        this.isPhysicalValidationAttempt(request));
  }

  private isPhysicalValidationAttempt(
    request: LegacyBleWriteRequest,
  ): boolean {
    const attempt = request.policy?.allowPhysicalValidationAttempt;
    return (isWidoorClose(request.write) ||
        isWidoorTimedOpen(request.write)) &&
      attempt?.operation === request.write.operation &&
      attempt.profile === 'widoor';
  }

  private result(
    request: LegacyBleWriteRequest,
    startedAt: number,
    status: LegacyBleWriteExecutionStatus,
    nativeWriteCompleted: boolean,
    confirmationStatus: LegacyBleWriteConfirmationStatus,
    policyOverrideUsed: boolean,
    errorCode?: string,
    errorMessageValue?: string,
    nativeCause?: unknown,
    confirmedMotorStateRaw: number | null = null,
  ): LegacyBleWriteExecutionResult {
    const write = isCataloguedLegacyBleWrite(request.write)
      ? request.write
      : null;
    return {
      status,
      operation: write?.operation ?? 'invalid',
      profile: request.profile,
      deviceId: request.deviceId?.trim() ?? '',
      serviceUuid: write?.serviceUuid ?? '',
      characteristicUuid: write?.characteristicUuid ?? '',
      payloadHex: write?.payloadHex ?? '',
      length: write?.length ?? 0,
      destructiveLevel: write?.destructiveLevel ?? null,
      hardwareValidationStatus: write?.hardwareValidationStatus ?? null,
      policyOverrideUsed,
      startedAt,
      completedAt: Date.now(),
      connectionGeneration: request.connectionGeneration,
      nativeWriteCompleted,
      confirmationStatus,
      confirmedMotorStateRaw,
      movementStartConfirmed: confirmationStatus === 'confirmed',
      timedCycleValidationStatus: timedCycleStatus(
        write,
        status,
        confirmationStatus,
      ),
      error: errorCode === undefined
        ? null
        : {
            code: errorCode,
            message: errorMessageValue ?? errorCode,
            ...(nativeCause === undefined ? {} : { nativeCause }),
          },
    };
  }
}

function isKnownProfile(profile: unknown): profile is KnownProductProfile {
  return profile === 'widoor' ||
    profile === 'moventiv-60' ||
    profile === 'moventiv-80' ||
    profile === 'garline';
}

function isWidoorOpen(write: LegacyBleWrite): boolean {
  return write.profile === 'widoor' &&
    write.operation === 'motor-open' &&
    write.hardwareValidationStatus === 'validated-widoor-old-firmware';
}

function isWidoorClose(write: LegacyBleWrite): boolean {
  return write.profile === 'widoor' &&
    write.operation === 'motor-close' &&
    write.hardwareValidationStatus === 'phase1-reference-only';
}

function isWidoorTimedOpen(write: LegacyBleWrite): boolean {
  return write.profile === 'widoor' &&
    (write.operation === 'motor-open-short-timed' ||
      write.operation === 'motor-open-long-timed') &&
    write.hardwareValidationStatus === 'phase1-reference-only';
}

function isControlledWidoorMotorWrite(write: LegacyBleWrite): boolean {
  return isWidoorOpen(write) || isWidoorClose(write) ||
    isWidoorTimedOpen(write);
}

function timedCycleStatus(
  write: LegacyBleWrite | null,
  status: LegacyBleWriteExecutionStatus,
  confirmationStatus: LegacyBleWriteConfirmationStatus,
): TimedCycleValidationStatus {
  if (write === null || !isWidoorTimedOpen(write)) {
    return 'not-observed';
  }
  if (confirmationStatus === 'confirmed') {
    return 'pending-physical-validation';
  }
  if (status === 'timeout') {
    return 'not-observed';
  }
  return 'failed';
}

function isTargetCompatible(write: LegacyBleWrite): boolean {
  if (write.characteristicUuid === BLE_UUIDS.motorCommandCharacteristic ||
      write.characteristicUuid === BLE_UUIDS.nameCharacteristic ||
      write.characteristicUuid === BLE_UUIDS.datesAndCyclesCharacteristic) {
    return write.serviceUuid === BLE_UUIDS.shdoService;
  }
  if (write.characteristicUuid === BLE_UUIDS.userParametersCharacteristic ||
      write.characteristicUuid ===
        BLE_UUIDS.professionalParametersCharacteristic) {
    const expectedService = write.profile === 'widoor'
      ? BLE_UUIDS.widoorService
      : BLE_UUIDS.moventivGarlineService;
    return write.serviceUuid === expectedService;
  }
  return false;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function snapshotRequest(
  request: LegacyBleWriteRequest,
): LegacyBleWriteRequest {
  return Object.freeze({
    write: request.write,
    deviceId: request.deviceId,
    profile: request.profile,
    connectionGeneration: request.connectionGeneration,
    identification: Object.freeze({ ...request.identification }),
    authorization: request.authorization === null
      ? null
      : Object.freeze({ ...request.authorization }),
    attemptId: request.attemptId,
    confirmationPolicy: Object.freeze({ ...request.confirmationPolicy }),
    ...(request.policy === undefined
      ? {}
      : {
          policy: Object.freeze({
            ...request.policy,
            ...(request.policy.allowPhysicalValidationAttempt === undefined
              ? {}
              : {
                  allowPhysicalValidationAttempt: Object.freeze({
                    ...request.policy.allowPhysicalValidationAttempt,
                  }),
                }),
          }),
        }),
  });
}
