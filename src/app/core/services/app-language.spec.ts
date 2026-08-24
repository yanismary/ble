import {
  readAppLanguageMode,
  readStoredAppLanguage,
  resolveAppLanguage,
  initializePhase1Language,
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

  it('initializes automatic Phase 1 language from supported phone languages', () => {
    const frStorage = new MemoryStorage();
    const enStorage = new MemoryStorage();
    const deStorage = new MemoryStorage();
    const plStorage = new MemoryStorage();

    expect(initializePhase1Language('fr-FR', frStorage)).toBe('fr');
    expect(initializePhase1Language('en-US', enStorage)).toBe('en');
    expect(initializePhase1Language('de-DE', deStorage)).toBe('de');
    expect(initializePhase1Language('pl-PL', plStorage)).toBe('pl');
  });

  it('uses the Phase 1 English fallback for unsupported phone languages', () => {
    const storage = new MemoryStorage();

    expect(initializePhase1Language('es-ES', storage)).toBe('en');
    expect(readStoredAppLanguage(storage)).toBe('en');
    expect(readAppLanguageMode(storage)).toBe('automatic');
    expect(storage.getItem('StoredIsLanguageAuto')).toBe('true');
    expect(storage.getItem('appLanguage')).toBe('true');
  });

  it('does not replace an already stored user language', () => {
    const storage = new MemoryStorage();
    storeManualAppLanguage('de', storage);

    expect(initializePhase1Language('fr-FR', storage)).toBe('de');
    expect(readStoredAppLanguage(storage)).toBe('de');
    expect(readAppLanguageMode(storage)).toBe('manual');
  });

  it('migrates Phase 1 manual language keys', () => {
    const storage = new MemoryStorage();
    storage.setItem('StoredIsLanguageAuto', 'false');
    storage.setItem('appLanguage', '"manualLang_PL"');

    expect(initializePhase1Language('fr-FR', storage)).toBe('pl');
    expect(readStoredAppLanguage(storage)).toBe('pl');
    expect(readAppLanguageMode(storage)).toBe('manual');
  });
});
