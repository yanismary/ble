import {
  deferredSensitiveActionsFor,
} from './product-deferred-sensitive-actions';

describe('deferred sensitive product actions', () => {
  it('keeps learning disabled for every supported product profile', () => {
    for (const profile of [
      'widoor',
      'moventiv-60',
      'moventiv-80',
      'garline',
    ] as const) {
      const learning = deferredSensitiveActionsFor(profile).find(
        (action) => action.action === 'learning',
      );

      expect(learning).toBeTruthy();
      expect(learning?.enabled).toBeFalse();
      expect(learning?.reason).toBe('physical-validation-required');
    }
  });

  it('keeps radar tests and professional peripheral lock disabled on supported profiles', () => {
    for (const profile of ['widoor', 'moventiv-60', 'moventiv-80'] as const) {
      const actions = deferredSensitiveActionsFor(profile);

      expect(actions.map((action) => action.action)).toEqual([
        'learning',
        'radar-test-1',
        'radar-test-2',
        'professional-peripheral-lock',
      ]);
      expect(actions.every((action) => action.enabled === false)).toBeTrue();
    }
  });

  it('does not expose radar or peripheral-lock placeholders on Garline', () => {
    expect(deferredSensitiveActionsFor('garline').map(
      (action) => action.action,
    )).toEqual(['learning']);
  });
});
