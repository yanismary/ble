import {
  HapticVibrate,
  triggerConfiguredHapticFeedback,
} from './app-haptics';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('configured haptic feedback', () => {
  it('does not vibrate while the preference is disabled', async () => {
    const storage = new MemoryStorage();
    const vibrate = jasmine.createSpy<HapticVibrate>('vibrate')
      .and.resolveTo();

    expect(
      await triggerConfiguredHapticFeedback(storage, vibrate),
    ).toBeFalse();
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('uses the legacy 90 ms vibration while enabled', async () => {
    const storage = new MemoryStorage();
    storage.setItem('hapticFeedback', 'true');
    const vibrate = jasmine.createSpy<HapticVibrate>('vibrate')
      .and.resolveTo();

    expect(
      await triggerConfiguredHapticFeedback(storage, vibrate),
    ).toBeTrue();
    expect(vibrate).toHaveBeenCalledOnceWith({ duration: 90 });
  });

  it('keeps interaction safe when native haptics are unavailable', async () => {
    const storage = new MemoryStorage();
    storage.setItem('hapticFeedback', 'true');
    const vibrate = jasmine.createSpy<HapticVibrate>('vibrate')
      .and.rejectWith(new Error('Haptics unavailable'));

    expect(
      await triggerConfiguredHapticFeedback(storage, vibrate),
    ).toBeFalse();
  });
});
