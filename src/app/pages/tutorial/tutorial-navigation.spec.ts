import {
  isTutorialFreshScanNavigation,
  TUTORIAL_FRESH_SCAN_STATE_KEY,
  withoutTutorialFreshScanNavigation,
} from './tutorial-navigation';

describe('tutorial navigation state', () => {
  it('recognizes and consumes only the fresh Scan marker', () => {
    const state = {
      navigationId: 12,
      [TUTORIAL_FRESH_SCAN_STATE_KEY]: true,
    };

    expect(isTutorialFreshScanNavigation(state)).toBeTrue();
    expect(withoutTutorialFreshScanNavigation(state)).toEqual({
      navigationId: 12,
    });
    expect(state[TUTORIAL_FRESH_SCAN_STATE_KEY]).toBeTrue();
  });
});
