import {
  LegacyBleWrite,
  LegacyMotorCommand,
  LegacyMotorOperation,
  KnownProductProfile,
  encodeLegacyMotorCommand,
  isCataloguedLegacyBleWrite,
} from '../../../core/services/legacy-ble-write-catalog';
import { LegacyBleWriteAuthorization } from
  '../../../core/services/ble-write-execution.service';
import {
  ProductMotorCommandDefinition,
  ProductMotorCommandUiConfig,
  createProductMotorCommandUiConfig,
  productMotorCommandConfigsForProfile,
} from '../shared/commands/product-motor-command';
import type { ProductProfileDefinition } from './product-profile.types';
import {
  WIDOOR_COMMAND_AUTHORIZATION_TTL_MS,
  WIDOOR_MOTOR_COMMAND_DEFINITIONS,
} from './widoor/widoor-motor-command';

export const WIDOOR_COMMAND_UI_CONFIGS:
readonly ProductMotorCommandUiConfig[] = productMotorCommandConfigsForProfile(
  'widoor',
  WIDOOR_MOTOR_COMMAND_DEFINITIONS.map((definition) =>
    createProductMotorCommandUiConfig(definition),
  ),
);

type MoventivFamilyMotorCommand = Extract<
  LegacyMotorCommand,
  'OPEN' | 'CLOSE' | 'OPEN_SHORT_TIMED'
>;

const MOVENTIV_FAMILY_COMMANDS: readonly MoventivFamilyMotorCommand[] = [
  'OPEN',
  'CLOSE',
  'OPEN_SHORT_TIMED',
];

export const MOTOR_COMMAND_UI_CONFIGS: Readonly<
  Record<KnownProductProfile, readonly ProductMotorCommandUiConfig[]>
> = Object.freeze({
  widoor: WIDOOR_COMMAND_UI_CONFIGS,
  'moventiv-60': moventivFamilyCommandConfigsFor('moventiv-60'),
  'moventiv-80': moventivFamilyCommandConfigsFor('moventiv-80'),
  garline: moventivFamilyCommandConfigsFor('garline'),
});

export function productMotorCommandConfigsFor(
  definition: Pick<ProductProfileDefinition, 'profile' | 'commands'>,
): readonly ProductMotorCommandUiConfig[] {
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

export interface ProductMotorCommandAuthorizationInput {
  readonly write: LegacyBleWrite;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly attemptId: string;
  readonly confirmationId: string;
  readonly confirmedAt: number;
  readonly validatedAt: number;
}

export function createProductMotorCommandAuthorization(
  input: ProductMotorCommandAuthorizationInput,
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
    throw new Error('The motor authorization context is invalid.');
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

function moventivFamilyCommandConfigsFor(
  profile: Exclude<KnownProductProfile, 'widoor'>,
): readonly ProductMotorCommandUiConfig[] {
  return productMotorCommandConfigsForProfile(
    profile,
    MOVENTIV_FAMILY_COMMANDS.map((command) =>
      createProductMotorCommandUiConfig(
        moventivFamilyCommandDefinition(profile, command),
      ),
    ),
  );
}

function moventivFamilyCommandDefinition(
  profile: Exclude<KnownProductProfile, 'widoor'>,
  command: MoventivFamilyMotorCommand,
): ProductMotorCommandDefinition {
  const textKeys = {
    OPEN: 'open',
    CLOSE: 'close',
    OPEN_SHORT_TIMED: 'openShortTimed',
  } as const;
  const operations: Record<MoventivFamilyMotorCommand,
    LegacyMotorOperation> = {
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
