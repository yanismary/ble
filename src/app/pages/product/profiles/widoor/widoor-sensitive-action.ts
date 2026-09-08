import {
  LegacyBleWriteExecutionPolicy,
} from '../../../../core/services/ble-write-execution.service';
import {
  KnownProductProfile,
  LegacyBleWrite,
  createWidoorLegacyResetSequence,
  encodeLegacyProfessionalPeripheral,
} from '../../../../core/services/legacy-ble-write-catalog';

export interface WidoorSensitiveActionConfig {
  readonly action: string;
  readonly profile: KnownProductProfile;
}

export interface WidoorSensitiveActionWriteStep {
  readonly write: LegacyBleWrite;
  readonly delayAfterMs: number;
  readonly policy: LegacyBleWriteExecutionPolicy;
}

export function widoorSensitiveActionWriteSteps(
  config: WidoorSensitiveActionConfig,
  enabled?: boolean,
): readonly WidoorSensitiveActionWriteStep[] {
  if (config.profile !== 'widoor') {
    throw new Error(`${config.action} is not available for ${config.profile}.`);
  }

  if (config.action === 'reset') {
    return Object.freeze(createWidoorLegacyResetSequence().map((write) =>
      Object.freeze({
        write,
        delayAfterMs: write.delayAfterMs,
        policy: Object.freeze({
          allowPhase1ReferenceOnly: true,
          allowReset: true,
        }),
      }),
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
    Object.freeze({
      write,
      delayAfterMs: 0,
      policy: Object.freeze({
        allowPhase1ReferenceOnly: true,
        allowWidoorPhase1ImmediateWrite: true,
      }),
    }),
  ]);
}
