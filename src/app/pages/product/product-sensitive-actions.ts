import {
  LegacyBleWriteAuthorization,
  LegacyBleWriteExecutionPolicy,
} from '../../core/services/ble-write-execution.service';
import {
  KnownProductProfile,
  LegacyBleWrite,
  createWidoorLegacyResetSequence,
  encodeLegacyMotorCommand,
  encodeLegacyProfessionalPeripheral,
  isCataloguedLegacyBleWrite,
} from '../../core/services/legacy-ble-write-catalog';
import { productProfileRegistry } from
  './profiles/product-profile.registry';

export type ProductSensitiveAction =
  | 'learning'
  | 'radar-test-1'
  | 'radar-test-2'
  | 'professional-peripheral-lock'
  | 'reset';

export type ProductSensitiveActionTextKey =
  | 'learning'
  | 'radarTest1'
  | 'radarTest2'
  | 'peripheralLock'
  | 'reset';

export interface ProductSensitiveActionUiConfig {
  readonly action: ProductSensitiveAction;
  readonly profile: KnownProductProfile;
  readonly textKey: ProductSensitiveActionTextKey;
  readonly control: 'button' | 'toggle';
  readonly requiresConfirmation: boolean;
}

export interface ProductSensitiveActionWriteStep {
  readonly write: LegacyBleWrite;
  readonly delayAfterMs: number;
  readonly policy: LegacyBleWriteExecutionPolicy;
}

export interface ProductSensitiveActionAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
}

const AUTHORIZATION_TTL_MS = 60_000;

const SENSITIVE_ACTION_PRESENTATION = {
  learning: {
    textKey: 'learning',
    control: 'button',
    requiresConfirmation: false,
  },
  'radar-test-1': {
    textKey: 'radarTest1',
    control: 'toggle',
    requiresConfirmation: false,
  },
  'radar-test-2': {
    textKey: 'radarTest2',
    control: 'toggle',
    requiresConfirmation: false,
  },
  'professional-peripheral-lock': {
    textKey: 'peripheralLock',
    control: 'toggle',
    requiresConfirmation: false,
  },
  reset: {
    textKey: 'reset',
    control: 'button',
    requiresConfirmation: true,
  },
} as const satisfies Readonly<Record<ProductSensitiveAction, Readonly<{
  textKey: ProductSensitiveActionTextKey;
  control: ProductSensitiveActionUiConfig['control'];
  requiresConfirmation: boolean;
}>>>;

export function productSensitiveActionConfigsFor(
  profile: KnownProductProfile,
): readonly ProductSensitiveActionUiConfig[] {
  const definition = productProfileRegistry.get(profile);
  return Object.freeze(definition.sensitiveActions.map((action) =>
    Object.freeze({
      action,
      profile,
      ...SENSITIVE_ACTION_PRESENTATION[action],
    }),
  ));
}

export function productSensitiveActionWriteSteps(
  config: ProductSensitiveActionUiConfig,
  enabled?: boolean,
): readonly ProductSensitiveActionWriteStep[] {
  if (config.action === 'learning') {
    const immediatePolicy = learningImmediateWritePolicy(config.profile);
    return Object.freeze([
      step(
        encodeLegacyMotorCommand(config.profile, 'LEARNING'),
        0,
        {
          allowPhase1ReferenceOnly: true,
          ...immediatePolicy,
          allowLearning: true,
        },
      ),
    ]);
  }

  if (config.profile !== 'widoor') {
    throw new Error(`${config.action} is not available for ${config.profile}.`);
  }

  if (config.action === 'reset') {
    return Object.freeze(createWidoorLegacyResetSequence().map((write) =>
      step(
        write,
        write.delayAfterMs,
        {
          allowPhase1ReferenceOnly: true,
          allowReset: true,
        },
      ),
    ));
  }

  if (enabled === undefined) {
    throw new Error(`${config.action} requires an explicit target state.`);
  }

  const write = config.action === 'radar-test-1'
    ? encodeLegacyProfessionalPeripheral(
        'widoor',
        'radar-test-1',
        enabled ? 'enabled' : 'disabled',
      )
    : config.action === 'radar-test-2'
      ? encodeLegacyProfessionalPeripheral(
          'widoor',
          'radar-test-2',
          enabled ? 'enabled' : 'disabled',
        )
      : encodeLegacyProfessionalPeripheral(
          'widoor',
          'lock',
          enabled ? 'locked' : 'unlocked',
        );

  return Object.freeze([
    step(write, 0, {
      allowPhase1ReferenceOnly: true,
      allowWidoorPhase1ImmediateWrite: true,
    }),
  ]);
}

export function createProductSensitiveActionAuthorization(
  input: ProductSensitiveActionAuthorizationInput,
): LegacyBleWriteAuthorization {
  if (!isCataloguedLegacyBleWrite(input.write) ||
      !isSensitiveActionWrite(input.write)) {
    throw new Error('A controlled catalogued sensitive-action write is required.');
  }
  if (!input.deviceId.trim() ||
      !input.attemptId.trim() ||
      !input.confirmationId.trim() ||
      !Number.isInteger(input.connectionGeneration) ||
      input.connectionGeneration < 0 ||
      !Number.isFinite(input.confirmedAt)) {
    throw new Error('Sensitive-action authorization context is invalid.');
  }

  return Object.freeze({
    confirmedByUser: true,
    confirmedAt: input.confirmedAt,
    expiresAt: input.confirmedAt + AUTHORIZATION_TTL_MS,
    confirmationId: input.confirmationId,
    operation: input.write.operation,
    payloadHex: input.write.payloadHex,
    profile: input.write.profile,
    deviceId: input.deviceId,
    connectionGeneration: input.connectionGeneration,
    attemptId: input.attemptId,
  });
}

function learningImmediateWritePolicy(
  profile: KnownProductProfile,
): LegacyBleWriteExecutionPolicy {
  switch (productProfileRegistry.get(profile).behavior.immediateWritePolicy) {
    case 'widoor':
      return { allowWidoorPhase1ImmediateWrite: true };
    case 'moventiv':
      return { allowMoventivPhase1ImmediateWrite: true };
    case 'garline':
      return { allowGarlinePhase1ImmediateWrite: true };
    case 'none':
      return {};
  }
}

function step(
  write: LegacyBleWrite,
  delayAfterMs: number,
  policy: LegacyBleWriteExecutionPolicy,
): ProductSensitiveActionWriteStep {
  return Object.freeze({
    write,
    delayAfterMs,
    policy: Object.freeze({ ...policy }),
  });
}

function isSensitiveActionWrite(write: LegacyBleWrite): boolean {
  return write.operation === 'motor-learning' ||
    write.operation === 'radar-test-1' ||
    write.operation === 'radar-test-2' ||
    write.operation === 'lock' ||
    write.operation.startsWith('reset-step-');
}
