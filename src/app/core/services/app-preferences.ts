export const SHOW_BLE_IDENTIFIER_STORAGE_KEY = 'showBleIdentifier';
export const HAPTIC_FEEDBACK_STORAGE_KEY = 'hapticFeedback';
export const SHOW_PRODUCT_SETTINGS_STORAGE_KEY = 'showProductSettings';
export const SHOW_PRODUCT_INFORMATION_STORAGE_KEY = 'showProductInformation';
export const AUTO_ENABLE_BLUETOOTH_STORAGE_KEY = 'autoEnableBluetooth';
export const LEGACY_FIRST_LAUNCH_STORAGE_KEY = 'StoredFirstLaunch';
export const LEGACY_SHOW_BLE_IDENTIFIER_STORAGE_KEY = 'StoredIsVisibleMAC';
export const LEGACY_HAPTIC_FEEDBACK_STORAGE_KEY = 'StoredIsActiveVibrate';
export const LEGACY_SHOW_PRODUCT_SETTINGS_STORAGE_KEY =
  'StoredIsVisibleTabSettings';
export const LEGACY_SHOW_PRODUCT_INFORMATION_STORAGE_KEY =
  'StoredIsVisibleTabInfo';
export const LEGACY_AUTO_ENABLE_BLUETOOTH_STORAGE_KEY =
  'StoredIsAutoBluetooth';
export const LEGACY_OPTIONAL_COMMANDS_STORAGE_KEY = 'StoredOptComs';
export const LEGACY_DEFAULT_OPTIONAL_COMMANDS = [
  'dispOptionalCom_MO',
  'dispOptionalCom_LC',
  'dispOptionalCom_LLB',
] as const;

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

export function readLegacyJsonPreference<T>(
  key: string,
  storage: Pick<AppPreferencesStorage, 'getItem'> = localStorage,
): T | null {
  const stored = storage.getItem(key);
  if (stored === null) {
    return null;
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}

function migrateBooleanPreference(
  key: string,
  legacyKey: string,
  defaultValue: boolean,
  storage: Pick<AppPreferencesStorage, 'getItem' | 'setItem'> = localStorage,
): boolean {
  const existing = storage.getItem(key);
  if (existing !== null) {
    return existing === 'true';
  }

  const legacy = readLegacyJsonPreference<unknown>(legacyKey, storage);
  if (typeof legacy === 'boolean') {
    storage.setItem(key, String(legacy));
    return legacy;
  }

  storage.setItem(key, String(defaultValue));
  return defaultValue;
}

export function readAutoEnableBluetooth(
  storage: Pick<AppPreferencesStorage, 'getItem'> = localStorage,
): boolean {
  return readBooleanPreference(
    AUTO_ENABLE_BLUETOOTH_STORAGE_KEY,
    true,
    storage,
  );
}

export function storeAutoEnableBluetooth(
  value: boolean,
  storage: Pick<AppPreferencesStorage, 'setItem'> = localStorage,
): boolean {
  return writeBooleanPreference(
    AUTO_ENABLE_BLUETOOTH_STORAGE_KEY,
    value,
    storage,
  );
}

export function readShowBleIdentifier(
  storage: Pick<AppPreferencesStorage, 'getItem'> = localStorage,
): boolean {
  return readBooleanPreference(SHOW_BLE_IDENTIFIER_STORAGE_KEY, false, storage);
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

export function readShowProductSettings(
  storage: Pick<AppPreferencesStorage, 'getItem'> = localStorage,
): boolean {
  return readBooleanPreference(
    SHOW_PRODUCT_SETTINGS_STORAGE_KEY,
    true,
    storage,
  );
}

export function storeShowProductSettings(
  value: boolean,
  storage: Pick<AppPreferencesStorage, 'setItem'> = localStorage,
): boolean {
  return writeBooleanPreference(
    SHOW_PRODUCT_SETTINGS_STORAGE_KEY,
    value,
    storage,
  );
}

export function readShowProductInformation(
  storage: Pick<AppPreferencesStorage, 'getItem'> = localStorage,
): boolean {
  return readBooleanPreference(
    SHOW_PRODUCT_INFORMATION_STORAGE_KEY,
    true,
    storage,
  );
}

export function storeShowProductInformation(
  value: boolean,
  storage: Pick<AppPreferencesStorage, 'setItem'> = localStorage,
): boolean {
  return writeBooleanPreference(
    SHOW_PRODUCT_INFORMATION_STORAGE_KEY,
    value,
    storage,
  );
}

export function initializePhase1DefaultPreferences(
  storage: Pick<AppPreferencesStorage, 'getItem' | 'setItem'> = localStorage,
): void {
  migrateBooleanPreference(
    SHOW_PRODUCT_SETTINGS_STORAGE_KEY,
    LEGACY_SHOW_PRODUCT_SETTINGS_STORAGE_KEY,
    true,
    storage,
  );
  migrateBooleanPreference(
    SHOW_PRODUCT_INFORMATION_STORAGE_KEY,
    LEGACY_SHOW_PRODUCT_INFORMATION_STORAGE_KEY,
    true,
    storage,
  );
  migrateBooleanPreference(
    SHOW_BLE_IDENTIFIER_STORAGE_KEY,
    LEGACY_SHOW_BLE_IDENTIFIER_STORAGE_KEY,
    false,
    storage,
  );
  migrateBooleanPreference(
    HAPTIC_FEEDBACK_STORAGE_KEY,
    LEGACY_HAPTIC_FEEDBACK_STORAGE_KEY,
    false,
    storage,
  );
  migrateBooleanPreference(
    AUTO_ENABLE_BLUETOOTH_STORAGE_KEY,
    LEGACY_AUTO_ENABLE_BLUETOOTH_STORAGE_KEY,
    true,
    storage,
  );

  if (storage.getItem(LEGACY_FIRST_LAUNCH_STORAGE_KEY) === null) {
    storage.setItem(LEGACY_FIRST_LAUNCH_STORAGE_KEY, JSON.stringify(true));
  }
  if (storage.getItem(LEGACY_OPTIONAL_COMMANDS_STORAGE_KEY) === null) {
    storage.setItem(
      LEGACY_OPTIONAL_COMMANDS_STORAGE_KEY,
      JSON.stringify(LEGACY_DEFAULT_OPTIONAL_COMMANDS),
    );
  }
}
