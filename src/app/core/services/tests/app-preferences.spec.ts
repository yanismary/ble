import {
  readAutoEnableBluetooth,
  readHapticFeedback,
  readShowBleIdentifier,
  readShowProductInformation,
  readShowProductSettings,
  initializePhase1DefaultPreferences,
  LEGACY_AUTO_ENABLE_BLUETOOTH_STORAGE_KEY,
  LEGACY_DEFAULT_OPTIONAL_COMMANDS,
  LEGACY_FIRST_LAUNCH_STORAGE_KEY,
  LEGACY_HAPTIC_FEEDBACK_STORAGE_KEY,
  LEGACY_OPTIONAL_COMMANDS_STORAGE_KEY,
  LEGACY_SHOW_BLE_IDENTIFIER_STORAGE_KEY,
  LEGACY_SHOW_PRODUCT_INFORMATION_STORAGE_KEY,
  LEGACY_SHOW_PRODUCT_SETTINGS_STORAGE_KEY,
  storeAutoEnableBluetooth,
  storeHapticFeedback,
  storeShowBleIdentifier,
  storeShowProductInformation,
  storeShowProductSettings,
} from '../app-preferences';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('app preferences', () => {
  it('keeps automatic Bluetooth enable active by default', () => {
    expect(readAutoEnableBluetooth(new MemoryStorage())).toBeTrue();
  });

  it('stores the automatic Bluetooth enable preference', () => {
    const storage = new MemoryStorage();

    expect(storeAutoEnableBluetooth(false, storage)).toBeFalse();
    expect(readAutoEnableBluetooth(storage)).toBeFalse();
    expect(storeAutoEnableBluetooth(true, storage)).toBeTrue();
    expect(readAutoEnableBluetooth(storage)).toBeTrue();
  });

  it('keeps BLE identifiers visible by default', () => {
    expect(readShowBleIdentifier(new MemoryStorage())).toBeFalse();
  });

  it('stores BLE identifier visibility', () => {
    const storage = new MemoryStorage();
    expect(storeShowBleIdentifier(false, storage)).toBeFalse();
    expect(readShowBleIdentifier(storage)).toBeFalse();
    expect(storeShowBleIdentifier(true, storage)).toBeTrue();
    expect(readShowBleIdentifier(storage)).toBeTrue();
  });

  it('keeps haptic feedback disabled by default', () => {
    expect(readHapticFeedback(new MemoryStorage())).toBeFalse();
  });

  it('stores the haptic feedback preference', () => {
    const storage = new MemoryStorage();
    expect(storeHapticFeedback(true, storage)).toBeTrue();
    expect(readHapticFeedback(storage)).toBeTrue();
    expect(storeHapticFeedback(false, storage)).toBeFalse();
    expect(readHapticFeedback(storage)).toBeFalse();
  });

  it('keeps product settings and information visible by default', () => {
    const storage = new MemoryStorage();

    expect(readShowProductSettings(storage)).toBeTrue();
    expect(readShowProductInformation(storage)).toBeTrue();
  });

  it('stores product settings visibility independently', () => {
    const storage = new MemoryStorage();

    expect(storeShowProductSettings(false, storage)).toBeFalse();
    expect(readShowProductSettings(storage)).toBeFalse();
    expect(readShowProductInformation(storage)).toBeTrue();
  });

  it('stores product information visibility independently', () => {
    const storage = new MemoryStorage();

    expect(storeShowProductInformation(false, storage)).toBeFalse();
    expect(readShowProductInformation(storage)).toBeFalse();
    expect(readShowProductSettings(storage)).toBeTrue();
  });

  it('initializes Phase 1 default preferences on first launch', () => {
    const storage = new MemoryStorage();

    initializePhase1DefaultPreferences(storage);

    expect(readShowProductSettings(storage)).toBeTrue();
    expect(readShowProductInformation(storage)).toBeTrue();
    expect(readShowBleIdentifier(storage)).toBeFalse();
    expect(readHapticFeedback(storage)).toBeFalse();
    expect(readAutoEnableBluetooth(storage)).toBeTrue();
    expect(storage.getItem(LEGACY_FIRST_LAUNCH_STORAGE_KEY)).toBe('true');
    expect(JSON.parse(
      storage.getItem(LEGACY_OPTIONAL_COMMANDS_STORAGE_KEY) ?? '[]',
    )).toEqual([...LEGACY_DEFAULT_OPTIONAL_COMMANDS]);
  });

  it('migrates existing Phase 1 preference keys without overwriting users', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_SHOW_BLE_IDENTIFIER_STORAGE_KEY, 'true');
    storage.setItem(LEGACY_HAPTIC_FEEDBACK_STORAGE_KEY, 'true');
    storage.setItem(LEGACY_SHOW_PRODUCT_SETTINGS_STORAGE_KEY, 'false');
    storage.setItem(LEGACY_SHOW_PRODUCT_INFORMATION_STORAGE_KEY, 'false');
    storage.setItem(LEGACY_AUTO_ENABLE_BLUETOOTH_STORAGE_KEY, 'false');

    initializePhase1DefaultPreferences(storage);

    expect(readShowBleIdentifier(storage)).toBeTrue();
    expect(readHapticFeedback(storage)).toBeTrue();
    expect(readShowProductSettings(storage)).toBeFalse();
    expect(readShowProductInformation(storage)).toBeFalse();
    expect(readAutoEnableBluetooth(storage)).toBeFalse();
  });

  it('keeps modern stored preferences when initialization runs again', () => {
    const storage = new MemoryStorage();
    storeShowBleIdentifier(true, storage);
    storage.setItem(LEGACY_SHOW_BLE_IDENTIFIER_STORAGE_KEY, 'false');

    initializePhase1DefaultPreferences(storage);
    initializePhase1DefaultPreferences(storage);

    expect(readShowBleIdentifier(storage)).toBeTrue();
  });
});
