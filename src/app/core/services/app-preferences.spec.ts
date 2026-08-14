import {
  readHapticFeedback,
  readShowBleIdentifier,
  readShowProductInformation,
  readShowProductSettings,
  storeHapticFeedback,
  storeShowBleIdentifier,
  storeShowProductInformation,
  storeShowProductSettings,
} from './app-preferences';

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
  it('keeps BLE identifiers visible by default', () => {
    expect(readShowBleIdentifier(new MemoryStorage())).toBeTrue();
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
});
