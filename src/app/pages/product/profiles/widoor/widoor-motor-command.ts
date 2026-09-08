import {
  LegacyMotorCommand,
  encodeLegacyMotorCommand,
} from '../../../../core/services/legacy-ble-write-catalog';
import {
  WIDOOR_CLOSING_STARTED_STATE,
  WIDOOR_OPENING_STARTED_STATE,
} from '../../../../core/services/motor-command-confirmation';
import type { ProductMotorCommandDefinition } from
  '../../shared/commands/product-motor-command';

export const WIDOOR_COMMAND_AUTHORIZATION_TTL_MS = 15_000;
export const WIDOOR_OPEN_AUTHORIZATION_TTL_MS =
  WIDOOR_COMMAND_AUTHORIZATION_TTL_MS;

export const WIDOOR_MOTOR_COMMAND_DEFINITIONS: readonly (
  ProductMotorCommandDefinition
)[] = Object.freeze([
  Object.freeze({
    profile: 'widoor',
    command: 'OPEN',
    operation: 'motor-open',
    textKey: 'open',
    catalogFactory: commandFactory('OPEN'),
    enabled: true,
    expectedMotorStateRaw: WIDOOR_OPENING_STARTED_STATE,
    confirmationPolicy: Object.freeze({ kind: 'gatt-only' }),
    hardwareValidationStatus: 'validated-widoor-old-firmware',
    isTimedCommand: false,
  }),
  Object.freeze({
    profile: 'widoor',
    command: 'CLOSE',
    operation: 'motor-close',
    textKey: 'close',
    catalogFactory: commandFactory('CLOSE'),
    enabled: true,
    expectedMotorStateRaw: WIDOOR_CLOSING_STARTED_STATE,
    confirmationPolicy: Object.freeze({ kind: 'gatt-only' }),
    physicalValidationPolicy: Object.freeze({
      allowPhysicalValidationAttempt: Object.freeze({
        operation: 'motor-close',
        profile: 'widoor',
      }),
    }),
    hardwareValidationStatus: 'phase1-reference-only',
    isTimedCommand: false,
  }),
  Object.freeze({
    profile: 'widoor',
    command: 'OPEN_SHORT_TIMED',
    operation: 'motor-open-short-timed',
    textKey: 'openShortTimed',
    catalogFactory: commandFactory('OPEN_SHORT_TIMED'),
    enabled: true,
    expectedMotorStateRaw: WIDOOR_OPENING_STARTED_STATE,
    confirmationPolicy: Object.freeze({ kind: 'gatt-only' }),
    physicalValidationPolicy: Object.freeze({
      allowPhysicalValidationAttempt: Object.freeze({
        operation: 'motor-open-short-timed',
        profile: 'widoor',
      }),
    }),
    hardwareValidationStatus: 'phase1-reference-only',
    isTimedCommand: true,
  }),
]);

function commandFactory(command: LegacyMotorCommand) {
  return () => encodeLegacyMotorCommand('widoor', command);
}
