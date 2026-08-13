import {
  readAppLanguageMode,
  readStoredAppLanguage,
  resolveAppLanguage,
  storeAutomaticAppLanguage,
  storeManualAppLanguage,
} from './app-language';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('app language', () => {
  it('normalizes supported regional language codes', () => {
    expect(resolveAppLanguage('fr-FR')).toBe('fr');
    expect(resolveAppLanguage('en-US')).toBe('en');
    expect(resolveAppLanguage('de-DE')).toBe('de');
    expect(resolveAppLanguage('pl-PL')).toBe('pl');
  });

  it('falls back to French for an unset stored language', () => {
    expect(readStoredAppLanguage(new MemoryStorage())).toBe('fr');
  });

  it('stores a manual language selection', () => {
    const storage = new MemoryStorage();

    expect(storeManualAppLanguage('de', storage)).toBe('de');
    expect(readStoredAppLanguage(storage)).toBe('de');
    expect(readAppLanguageMode(storage)).toBe('manual');
  });

  it('uses the phone/browser language in automatic mode', () => {
    const storage = new MemoryStorage();

    expect(storeAutomaticAppLanguage('pl-PL', storage)).toBe('pl');
    expect(readStoredAppLanguage(storage)).toBe('pl');
    expect(readAppLanguageMode(storage)).toBe('automatic');
  });

  it('falls back to English for an unsupported automatic language', () => {
    const storage = new MemoryStorage();

    expect(storeAutomaticAppLanguage('es-ES', storage)).toBe('en');
    expect(readStoredAppLanguage(storage)).toBe('en');
  });
});
