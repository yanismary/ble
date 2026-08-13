import { KnownProductProfile } from '../../core/services/product-data-load.service';

export type DeferredSensitiveAction =
  | 'learning'
  | 'radar-test-1'
  | 'radar-test-2'
  | 'professional-peripheral-lock';

export interface DeferredSensitiveActionUiConfig {
  readonly action: DeferredSensitiveAction;
  readonly profile: KnownProductProfile;
  readonly textKey:
    | 'learning'
    | 'radarTest1'
    | 'radarTest2'
    | 'peripheralLock';
  readonly reason: 'physical-validation-required';
  readonly enabled: false;
}

export function deferredSensitiveActionsFor(
  profile: KnownProductProfile,
): readonly DeferredSensitiveActionUiConfig[] {
  const actions: DeferredSensitiveActionUiConfig[] = [
    {
      action: 'learning',
      profile,
      textKey: 'learning',
      reason: 'physical-validation-required',
      enabled: false,
    },
  ];

  if (profile !== 'garline') {
    actions.push(
      {
        action: 'radar-test-1',
        profile,
        textKey: 'radarTest1',
        reason: 'physical-validation-required',
        enabled: false,
      },
      {
        action: 'radar-test-2',
        profile,
        textKey: 'radarTest2',
        reason: 'physical-validation-required',
        enabled: false,
      },
      {
        action: 'professional-peripheral-lock',
        profile,
        textKey: 'peripheralLock',
        reason: 'physical-validation-required',
        enabled: false,
      },
    );
  }

  return Object.freeze(actions.map((action) => Object.freeze(action)));
}
