export const SHOW_BLE_IDENTIFIER_STORAGE_KEY = 'showBleIdentifier';
export const HAPTIC_FEEDBACK_STORAGE_KEY = 'hapticFeedback';

export interface AppPreferencesStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function readBooleanPreference(
  key: string,
  defaultValue: boolean,
  storage: Pick<AppPreferencesStorage, 'getItem'> = localStorage,
): boolean {
  const stored = storage.getItem(key);
  return stored === null ? defaultValue : stored === 'true';
}

function writeBooleanPreference(
  key: string,
  value: boolean,
  storage: Pick<AppPreferencesStorage, 'setItem'> = localStorage,
): boolean {
  storage.setItem(key, String(value));
  return value;
}

export function readShowBleIdentifier(
  storage: Pick<AppPreferencesStorage, 'getItem'> = localStorage,
): boolean {
  return readBooleanPreference(SHOW_BLE_IDENTIFIER_STORAGE_KEY, true, storage);
}

export function storeShowBleIdentifier(
  value: boolean,
  storage: Pick<AppPreferencesStorage, 'setItem'> = localStorage,
): boolean {
  return writeBooleanPreference(SHOW_BLE_IDENTIFIER_STORAGE_KEY, value, storage);
}

export function readHapticFeedback(
  storage: Pick<AppPreferencesStorage, 'getItem'> = localStorage,
): boolean {
  return readBooleanPreference(HAPTIC_FEEDBACK_STORAGE_KEY, false, storage);
}

export function storeHapticFeedback(
  value: boolean,
  storage: Pick<AppPreferencesStorage, 'setItem'> = localStorage,
): boolean {
  return writeBooleanPreference(HAPTIC_FEEDBACK_STORAGE_KEY, value, storage);
}
