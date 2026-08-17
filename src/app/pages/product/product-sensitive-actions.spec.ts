import {
  createProductSensitiveActionAuthorization,
  productSensitiveActionConfigsFor,
  productSensitiveActionWriteSteps,
} from './product-sensitive-actions';

describe('Phase 1 sensitive product actions', () => {
  it('exposes learning for every product profile', () => {
    for (const profile of [
      'widoor',
      'moventiv-60',
      'moventiv-80',
      'garline',
    ] as const) {
      expect(productSensitiveActionConfigsFor(profile)[0]).toEqual(
        jasmine.objectContaining({
          action: 'learning',
          profile,
          control: 'button',
          requiresConfirmation: true,
        }),
      );
      expect(productSensitiveActionWriteSteps(
        productSensitiveActionConfigsFor(profile)[0],
      )[0].write.payloadHex).toBe('00 12');
    }
  });

  it('exposes Widoor-only radar tests, peripheral lock and reset', () => {
    expect(productSensitiveActionConfigsFor('widoor').map((config) =>
      config.action,
    )).toEqual([
      'learning',
      'radar-test-1',
      'radar-test-2',
      'professional-peripheral-lock',
      'reset',
    ]);

    for (const profile of [
      'moventiv-60',
      'moventiv-80',
      'garline',
    ] as const) {
      expect(productSensitiveActionConfigsFor(profile).map((config) =>
        config.action,
      )).toEqual(['learning']);
    }
  });

  it('encodes Widoor radar and lock states through the legacy catalog', () => {
    const configs = productSensitiveActionConfigsFor('widoor');
    const radar1 = configs.find((config) =>
      config.action === 'radar-test-1')!;
    const radar2 = configs.find((config) =>
      config.action === 'radar-test-2')!;
    const lock = configs.find((config) =>
      config.action === 'professional-peripheral-lock')!;

    expect(productSensitiveActionWriteSteps(radar1, true)[0].write.payloadHex)
      .toBe('0a 04 01');
    expect(productSensitiveActionWriteSteps(radar1, false)[0].write.payloadHex)
      .toBe('0a 04 02');
    expect(productSensitiveActionWriteSteps(radar2, true)[0].write.payloadHex)
      .toBe('0a 03 01');
    expect(productSensitiveActionWriteSteps(radar2, false)[0].write.payloadHex)
      .toBe('0a 03 02');
    expect(productSensitiveActionWriteSteps(lock, true)[0].write.payloadHex)
      .toBe('0a 05 01');
    expect(productSensitiveActionWriteSteps(lock, false)[0].write.payloadHex)
      .toBe('0a 05 02');
  });

  it('keeps the exact nine-step Widoor Phase 1 reset sequence', () => {
    const reset = productSensitiveActionConfigsFor('widoor').find((config) =>
      config.action === 'reset')!;
    const steps = productSensitiveActionWriteSteps(reset);

    expect(steps.map((step) => step.write.payloadHex)).toEqual([
      '01 32',
      '02 32',
      '03 03',
      '01 05',
      '02 50',
      '03 46',
      '0a 07 02',
      '0a 06 02',
      '0a 05 02',
    ]);
    expect(steps.slice(0, -1).every((step) =>
      step.delayAfterMs === 250,
    )).toBeTrue();
    expect(steps.every((step) =>
      step.policy.allowReset === true &&
      step.policy.allowPhase1ReferenceOnly === true,
    )).toBeTrue();
  });

  it('creates one immutable authorization scoped to an exact step', () => {
    const learning = productSensitiveActionConfigsFor('garline')[0];
    const write = productSensitiveActionWriteSteps(learning)[0].write;

    const authorization = createProductSensitiveActionAuthorization({
      write,
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 1_000,
    });

    expect(authorization).toEqual(jasmine.objectContaining({
      operation: 'motor-learning',
      payloadHex: '00 12',
      profile: 'garline',
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmedByUser: true,
    }));
    expect(Object.isFrozen(authorization)).toBeTrue();
  });
});
