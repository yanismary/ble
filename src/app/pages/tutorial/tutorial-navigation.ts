export const TUTORIAL_FRESH_SCAN_STATE_KEY = 'tutorialFreshScan';

export function isTutorialFreshScanNavigation(
  state: unknown,
): boolean {
  return typeof state === 'object' &&
    state !== null &&
    (state as Record<string, unknown>)[TUTORIAL_FRESH_SCAN_STATE_KEY] === true;
}

export function withoutTutorialFreshScanNavigation(
  state: unknown,
): Record<string, unknown> {
  const nextState = typeof state === 'object' && state !== null
    ? { ...(state as Record<string, unknown>) }
    : {};
  delete nextState[TUTORIAL_FRESH_SCAN_STATE_KEY];
  return nextState;
}
