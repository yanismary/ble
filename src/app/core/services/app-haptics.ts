import { Haptics } from '@capacitor/haptics';

import {
  AppPreferencesStorage,
  readHapticFeedback,
} from './app-preferences';

export interface HapticVibrationOptions {
  readonly duration: number;
}

export type HapticVibrate = (
  options: HapticVibrationOptions,
) => Promise<void>;

const DEFAULT_HAPTIC_DURATION_MS = 90;

export async function triggerConfiguredHapticFeedback(
  storage: Pick<AppPreferencesStorage, 'getItem'> = localStorage,
  vibrate: HapticVibrate = (options) => Haptics.vibrate(options),
): Promise<boolean> {
  if (!readHapticFeedback(storage)) {
    return false;
  }

  try {
    await vibrate({ duration: DEFAULT_HAPTIC_DURATION_MS });
    return true;
  } catch {
    return false;
  }
}
