import {
  AUTO_ENABLE_BLUETOOTH_STORAGE_KEY,
  HAPTIC_FEEDBACK_STORAGE_KEY,
  SHOW_BLE_IDENTIFIER_STORAGE_KEY,
  SHOW_PRODUCT_INFORMATION_STORAGE_KEY,
  SHOW_PRODUCT_SETTINGS_STORAGE_KEY,
} from './app-preferences';
import {
  APP_LANGUAGE_MODE_STORAGE_KEY,
  APP_LANGUAGE_STORAGE_KEY,
} from './app-language';
import {
  initializePhase1AppState,
} from './app-initialization';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('app initialization', () => {
  it('creates the Phase 1 first-launch language and preferences', () => {
    const storage = new MemoryStorage();

    initializePhase1AppState('fr-FR', storage);

    expect(storage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe('fr');
    expect(storage.getItem(APP_LANGUAGE_MODE_STORAGE_KEY)).toBe('automatic');
    expect(storage.getItem(SHOW_PRODUCT_SETTINGS_STORAGE_KEY)).toBe('true');
    expect(storage.getItem(SHOW_PRODUCT_INFORMATION_STORAGE_KEY)).toBe('true');
    expect(storage.getItem(SHOW_BLE_IDENTIFIER_STORAGE_KEY)).toBe('false');
    expect(storage.getItem(HAPTIC_FEEDBACK_STORAGE_KEY)).toBe('false');
    expect(storage.getItem(AUTO_ENABLE_BLUETOOTH_STORAGE_KEY)).toBe('true');
  });

  it('is idempotent and keeps existing modern user values', () => {
    const storage = new MemoryStorage();
    storage.setItem(APP_LANGUAGE_STORAGE_KEY, 'de');
    storage.setItem(APP_LANGUAGE_MODE_STORAGE_KEY, 'manual');
    storage.setItem(SHOW_BLE_IDENTIFIER_STORAGE_KEY, 'true');

    initializePhase1AppState('fr-FR', storage);
    initializePhase1AppState('en-US', storage);

    expect(storage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe('de');
    expect(storage.getItem(APP_LANGUAGE_MODE_STORAGE_KEY)).toBe('manual');
    expect(storage.getItem(SHOW_BLE_IDENTIFIER_STORAGE_KEY)).toBe('true');
  });
});
