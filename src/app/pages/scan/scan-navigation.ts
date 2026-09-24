export const CLEAR_SCAN_RESULTS_STATE_KEY = 'clearScanResults';

export function shouldClearScanResults(state: unknown): boolean {
  return typeof state === 'object' &&
    state !== null &&
    (state as Record<string, unknown>)[CLEAR_SCAN_RESULTS_STATE_KEY] === true;
}

export function withoutClearScanResultsState(
  state: unknown,
): Record<string, unknown> {
  const nextState = typeof state === 'object' && state !== null
    ? { ...(state as Record<string, unknown>) }
    : {};
  delete nextState[CLEAR_SCAN_RESULTS_STATE_KEY];
  return nextState;
}
