import {
  widoorSensitiveActionWriteSteps,
} from '../widoor-sensitive-action';

describe('Widoor sensitive-action writes', () => {
  it('owns the Widoor radar and peripheral-lock writes', () => {
    const radar = widoorSensitiveActionWriteSteps({
      profile: 'widoor',
      action: 'radar-test-1',
    }, true)[0];
    const lock = widoorSensitiveActionWriteSteps({
      profile: 'widoor',
      action: 'advanced-peripheral-lock',
    }, true)[0];

    expect(radar.write.operation).toBe('radar-test-1');
    expect(lock.write.operation).toBe('lock');
    expect(radar.policy.allowWidoorPhase1ImmediateWrite).toBeTrue();
    expect(lock.policy.allowWidoorPhase1ImmediateWrite).toBeTrue();
  });

  it('owns the complete Widoor reset sequence', () => {
    const steps = widoorSensitiveActionWriteSteps({
      profile: 'widoor',
      action: 'reset',
    });

    expect(steps.length).toBeGreaterThan(1);
    expect(steps.every((entry) => entry.policy.allowReset)).toBeTrue();
  });
});
