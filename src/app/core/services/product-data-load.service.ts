import { Injectable, OnDestroy, inject } from '@angular/core';

import { ProductProfile } from './ble-profile-catalog';
import {
  BleDatesAndCycles,
  BleMaintenance,
  BleProfessionalParameters,
  BleUserParameters,
  BleVersionFrame,
} from './ble-read-decoders';
import {
  BleReadService,
  BleTypedReadResult,
} from './ble-read.service';
import { BleService } from './ble';

export type KnownProductProfile = Exclude<
  ProductProfile,
  'unknown' | 'ambiguous'
>;

export type ProductDataLoadStep =
  | 'version'
  | 'datesAndCycles'
  | 'maintenance'
  | 'userParameters'
  | 'professionalParameters';

export interface ProductDataLoadOptions {
  readonly version?: boolean;
  readonly datesAndCycles?: boolean;
  readonly maintenance?: boolean;
  readonly userParameters?: boolean;
  readonly professionalParameters?: boolean;
}

export type ProductDataLoadStatus =
  | 'success'
  | 'partial-success'
  | 'disconnected'
  | 'stale'
  | 'failed'
  | 'cancelled';

export interface ProductDataLoadError {
  readonly code:
    | 'profile-not-readable'
    | 'not-connected'
    | 'wrong-device'
    | 'load-in-progress'
    | 'invalid-options'
    | 'no-reads-requested'
    | 'service-destroyed'
    | 'disconnected'
    | 'stale'
    | 'cancelled'
    | 'no-read-succeeded'
    | 'orchestration-failed';
  readonly message: string;
  readonly cause?: unknown;
}

export interface ProductDataLoadReadResults {
  readonly version?: BleTypedReadResult<BleVersionFrame>;
  readonly datesAndCycles?: BleTypedReadResult<BleDatesAndCycles>;
  readonly maintenance?: BleTypedReadResult<BleMaintenance>;
  readonly userParameters?: BleTypedReadResult<BleUserParameters>;
  readonly professionalParameters?: BleTypedReadResult<
    BleProfessionalParameters
  >;
}

export interface ProductDataLoadResult {
  readonly profile: ProductProfile;
  readonly deviceId: string | null;
  readonly connectionGeneration: number;
  readonly startedAt: number;
  readonly completedAt: number;
  readonly status: ProductDataLoadStatus;
  readonly executedOrder: readonly ProductDataLoadStep[];
  readonly results: ProductDataLoadReadResults;
  readonly notRequested: readonly ProductDataLoadStep[];
  readonly unavailable: readonly ProductDataLoadStep[];
  readonly partialSuccess: boolean;
  readonly error: ProductDataLoadError | null;
}

interface LoadToken {
  cancelled: boolean;
}

interface ProductDataLoadSelection {
  readonly valid: boolean;
  readonly selected: readonly ProductDataLoadStep[];
  readonly invalidReason: string | null;
}

interface LoadResultState {
  version?: BleTypedReadResult<BleVersionFrame>;
  datesAndCycles?: BleTypedReadResult<BleDatesAndCycles>;
  maintenance?: BleTypedReadResult<BleMaintenance>;
  userParameters?: BleTypedReadResult<BleUserParameters>;
  professionalParameters?: BleTypedReadResult<BleProfessionalParameters>;
}

const LOAD_ORDER: readonly ProductDataLoadStep[] = [
  'version',
  'datesAndCycles',
  'maintenance',
  'userParameters',
  'professionalParameters',
];

@Injectable({
  providedIn: 'root',
})
export class ProductDataLoadService implements OnDestroy {
  private readonly bleService = inject(BleService);
  private readonly bleReadService = inject(BleReadService);
  private activeToken: LoadToken | null = null;
  private destroyed = false;

  get isLoading(): boolean {
    return this.activeToken !== null;
  }

  async loadProductData(
    profile: KnownProductProfile,
    deviceId?: string,
    options: ProductDataLoadOptions = {},
  ): Promise<ProductDataLoadResult> {
    const startedAt = Date.now();
    const connectedDeviceId = this.bleService.connectedDeviceId;
    const targetDeviceId = deviceId === undefined
      ? connectedDeviceId
      : deviceId.trim();
    const connectionGeneration = this.bleService.connectionGeneration;
    const selection = this.selectSteps(options);
    const selected = selection.selected;
    const notRequested = LOAD_ORDER.filter((step) => !selected.includes(step));
    const base = {
      profile,
      deviceId: targetDeviceId || null,
      connectionGeneration,
      startedAt,
      notRequested,
    } as const;

    if (this.activeToken !== null) {
      return this.terminal(base, 'failed', [], {}, {
        code: 'load-in-progress',
        message: 'A product data load is already in progress.',
      });
    }

    const token: LoadToken = { cancelled: false };
    this.activeToken = token;
    const executedOrder: ProductDataLoadStep[] = [];
    const results: LoadResultState = {};

    try {
      if (this.destroyed) {
        return this.terminal(base, 'cancelled', executedOrder, results, {
          code: 'service-destroyed',
          message: 'The product data load service has been destroyed.',
        });
      }

      if (!this.isKnownProfile(profile)) {
        return this.terminal(base, 'failed', executedOrder, results, {
          code: 'profile-not-readable',
          message: `Product data cannot be loaded for profile "${profile}".`,
        });
      }

      if (connectedDeviceId === null) {
        return this.terminal(base, 'disconnected', executedOrder, results, {
          code: 'not-connected',
          message: 'No BLE device is connected.',
        });
      }

      if (!targetDeviceId || targetDeviceId !== connectedDeviceId) {
        return this.terminal(base, 'failed', executedOrder, results, {
          code: 'wrong-device',
          message: 'The target device is not the connected BLE device.',
        });
      }

      if (!selection.valid) {
        return this.terminal(base, 'failed', executedOrder, results, {
          code: 'invalid-options',
          message: selection.invalidReason
            ?? 'The product data load options are invalid.',
        });
      }

      if (selected.length === 0) {
        return this.terminal(base, 'failed', executedOrder, results, {
          code: 'no-reads-requested',
          message: 'At least one product data read must be selected.',
        });
      }

      // Yield once so an immediate logical cancellation starts no native read.
      await Promise.resolve();

      for (const step of selected) {
        const beforeStep = this.interruptionStatus(
          token,
          targetDeviceId,
          connectionGeneration,
        );

        if (beforeStep !== null) {
          return this.interrupted(
            base,
            beforeStep,
            executedOrder,
            results,
          );
        }

        executedOrder.push(step);

        switch (step) {
          case 'version':
            results.version = await this.bleReadService.readVersion(
              profile,
              targetDeviceId,
            );
            break;
          case 'datesAndCycles':
            results.datesAndCycles =
              await this.bleReadService.readDatesAndCycles(
                profile,
                targetDeviceId,
              );
            break;
          case 'maintenance':
            results.maintenance = await this.bleReadService.readMaintenance(
              profile,
              targetDeviceId,
            );
            break;
          case 'userParameters':
            results.userParameters =
              await this.bleReadService.readUserParameters(
                profile,
                targetDeviceId,
              );
            break;
          case 'professionalParameters':
            results.professionalParameters =
              await this.bleReadService.readProfessionalParameters(
                profile,
                targetDeviceId,
              );
            break;
        }

        const afterStep = this.interruptionStatus(
          token,
          targetDeviceId,
          connectionGeneration,
        );

        if (afterStep !== null) {
          this.removeResult(results, step);
          return this.interrupted(
            base,
            afterStep,
            executedOrder,
            results,
          );
        }

        const readStatus = this.resultForStep(results, step)?.status;

        if (readStatus === 'disconnected' || readStatus === 'stale') {
          return this.interrupted(
            base,
            readStatus,
            executedOrder,
            results,
          );
        }
      }

      return this.completed(base, executedOrder, results, selected.length);
    } catch (cause: unknown) {
      const interruption = targetDeviceId
        ? this.interruptionStatus(
            token,
            targetDeviceId,
            connectionGeneration,
          )
        : null;

      if (interruption !== null) {
        return this.interrupted(
          base,
          interruption,
          executedOrder,
          results,
        );
      }

      return this.terminal(base, 'failed', executedOrder, results, {
        code: 'orchestration-failed',
        message: cause instanceof Error
          ? cause.message
          : 'The product data load failed unexpectedly.',
        cause,
      });
    } finally {
      if (this.activeToken === token) {
        this.activeToken = null;
      }
    }
  }

  cancelCurrentLoad(): boolean {
    if (this.activeToken === null || this.activeToken.cancelled) {
      return false;
    }

    this.activeToken.cancelled = true;
    return true;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cancelCurrentLoad();
  }

  private selectSteps(
    options: ProductDataLoadOptions,
  ): ProductDataLoadSelection {
    if (typeof options !== 'object' || options === null) {
      return {
        valid: false,
        selected: [],
        invalidReason: 'Product data load options must be an object.',
      };
    }

    const keys = Object.keys(options);
    const unknownKey = keys.find((key) => !this.isLoadStep(key));

    if (unknownKey !== undefined) {
      return {
        valid: false,
        selected: [],
        invalidReason: `Unknown product data load option "${unknownKey}".`,
      };
    }

    const knownKeys = keys.filter(
      (key): key is ProductDataLoadStep => this.isLoadStep(key),
    );
    const invalidValueKey = knownKeys.find((key) => {
      const value = options[key];
      return value !== undefined && typeof value !== 'boolean';
    });

    if (invalidValueKey !== undefined) {
      return {
        valid: false,
        selected: [],
        invalidReason:
          `Product data load option "${invalidValueKey}" must be boolean.`,
      };
    }

    return {
      valid: true,
      selected: LOAD_ORDER.filter((step) => options[step] !== false),
      invalidReason: null,
    };
  }

  private isKnownProfile(profile: ProductProfile): profile is KnownProductProfile {
    switch (profile) {
      case 'widoor':
      case 'moventiv-60':
      case 'moventiv-80':
      case 'garline':
        return true;
      case 'unknown':
      case 'ambiguous':
      default:
        return false;
    }
  }

  private isLoadStep(value: string): value is ProductDataLoadStep {
    return LOAD_ORDER.some((step) => step === value);
  }

  private interruptionStatus(
    token: LoadToken,
    deviceId: string,
    connectionGeneration: number,
  ): 'cancelled' | 'disconnected' | 'stale' | null {
    if (token.cancelled || this.destroyed) {
      return 'cancelled';
    }

    if (
      this.bleService.connectedDeviceId === null
      || this.bleService.disconnectingDeviceId === deviceId
    ) {
      return 'disconnected';
    }

    if (
      this.bleService.connectedDeviceId !== deviceId
      || this.bleService.connectionGeneration !== connectionGeneration
    ) {
      return 'stale';
    }

    return null;
  }

  private completed(
    base: Pick<
      ProductDataLoadResult,
      | 'profile'
      | 'deviceId'
      | 'connectionGeneration'
      | 'startedAt'
      | 'notRequested'
    >,
    executedOrder: readonly ProductDataLoadStep[],
    results: LoadResultState,
    requestedCount: number,
  ): ProductDataLoadResult {
    const successfulCount = Object.values(results)
      .filter((result) => result.status === 'success')
      .length;

    if (successfulCount === requestedCount) {
      return this.terminal(base, 'success', executedOrder, results, null);
    }

    if (successfulCount > 0) {
      return this.terminal(
        base,
        'partial-success',
        executedOrder,
        results,
        null,
      );
    }

    return this.terminal(base, 'failed', executedOrder, results, {
      code: 'no-read-succeeded',
      message: 'None of the requested product data reads succeeded.',
    });
  }

  private interrupted(
    base: Pick<
      ProductDataLoadResult,
      | 'profile'
      | 'deviceId'
      | 'connectionGeneration'
      | 'startedAt'
      | 'notRequested'
    >,
    status: 'cancelled' | 'disconnected' | 'stale',
    executedOrder: readonly ProductDataLoadStep[],
    results: LoadResultState,
  ): ProductDataLoadResult {
    const messages = {
      cancelled: 'The product data load was cancelled.',
      disconnected: 'The BLE device disconnected during the data load.',
      stale: 'The product data load belongs to an obsolete connection.',
    } as const;

    return this.terminal(base, status, executedOrder, results, {
      code: status,
      message: messages[status],
    });
  }

  private terminal(
    base: Pick<
      ProductDataLoadResult,
      | 'profile'
      | 'deviceId'
      | 'connectionGeneration'
      | 'startedAt'
      | 'notRequested'
    >,
    status: ProductDataLoadStatus,
    executedOrder: readonly ProductDataLoadStep[],
    results: LoadResultState,
    error: ProductDataLoadError | null,
  ): ProductDataLoadResult {
    const readResults: ProductDataLoadReadResults = { ...results };
    const unavailable = executedOrder.filter((step) =>
      this.resultForStep(results, step)?.status === 'unavailable',
    );
    const hasSuccessfulResult = Object.values(results)
      .some((result) => result.status === 'success');

    return {
      ...base,
      completedAt: Date.now(),
      status,
      executedOrder: [...executedOrder],
      results: readResults,
      unavailable,
      partialSuccess: status !== 'success' && hasSuccessfulResult,
      error,
    };
  }

  private resultForStep(
    results: LoadResultState,
    step: ProductDataLoadStep,
  ):
    | BleTypedReadResult<unknown>
    | undefined {
    return results[step];
  }

  private removeResult(
    results: LoadResultState,
    step: ProductDataLoadStep,
  ): void {
    delete results[step];
  }
}
