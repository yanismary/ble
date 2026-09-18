import {
  APP_MANUAL_LANGUAGE_STORAGE_KEY,
  currentAppLanguage,
  initializePhase1Language,
  readAppLanguageMode,
  readStoredAppLanguage,
  readStoredManualAppLanguage,
  resolveAppLanguage,
  storeAutomaticAppLanguage,
  storeManualAppLanguage,
  storeManualAppLanguageMode,
} from '../app-language';

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
  afterEach(() => {
    storeManualAppLanguage('fr');
    localStorage.clear();
  });

  it('normalizes supported regional language codes', () => {
    expect(resolveAppLanguage('fr-FR')).toBe('fr');
    expect(resolveAppLanguage('en-US')).toBe('en');
    expect(resolveAppLanguage('de-DE')).toBe('de');
    expect(resolveAppLanguage('pl-PL')).toBe('pl');
    expect(resolveAppLanguage('DE_de')).toBe('de');
  });

  it('falls back to French for an unset stored language', () => {
    expect(readStoredAppLanguage(new MemoryStorage())).toBe('fr');
  });

  it('stores a manual language with modern and Phase 1 keys', () => {
    const storage = new MemoryStorage();

    expect(storeManualAppLanguage('de', storage)).toBe('de');
    expect(readStoredAppLanguage(storage)).toBe('de');
    expect(readStoredManualAppLanguage(storage)).toBe('de');
    expect(readAppLanguageMode(storage)).toBe('manual');
    expect(storage.getItem('StoredIsLanguageAuto')).toBe('false');
    expect(storage.getItem('appLanguage')).toBe('"manualLang_DE"');
  });

  it('uses the phone language and English fallback in automatic mode', () => {
    const storage = new MemoryStorage();

    expect(storeAutomaticAppLanguage('pl-PL', storage)).toBe('pl');
    expect(readStoredAppLanguage(storage)).toBe('pl');
    expect(readAppLanguageMode(storage)).toBe('automatic');
    expect(storage.getItem('StoredIsLanguageAuto')).toBe('true');

    expect(storeAutomaticAppLanguage('es-ES', storage)).toBe('en');
    expect(readStoredAppLanguage(storage)).toBe('en');
  });

  it('initializes automatic Phase 1 language from each supported phone language', () => {
    expect(initializePhase1Language('fr-FR', new MemoryStorage())).toBe('fr');
    expect(initializePhase1Language('en-US', new MemoryStorage())).toBe('en');
    expect(initializePhase1Language('de-DE', new MemoryStorage())).toBe('de');
    expect(initializePhase1Language('pl-PL', new MemoryStorage())).toBe('pl');
    expect(initializePhase1Language('es-ES', new MemoryStorage())).toBe('en');
  });

  it('redetects the phone language on every automatic startup', () => {
    const storage = new MemoryStorage();
    storeAutomaticAppLanguage('fr-FR', storage);

    expect(initializePhase1Language('de-DE', storage)).toBe('de');
    expect(readStoredAppLanguage(storage)).toBe('de');
    expect(readAppLanguageMode(storage)).toBe('automatic');
  });

  it('keeps a manual language across subsequent startups', () => {
    const storage = new MemoryStorage();
    storeManualAppLanguage('pl', storage);

    expect(initializePhase1Language('fr-FR', storage)).toBe('pl');
    expect(readAppLanguageMode(storage)).toBe('manual');
  });

  it('preserves the previous manual choice while automatic mode is active', () => {
    const storage = new MemoryStorage();
    storeManualAppLanguage('en', storage);
    storeAutomaticAppLanguage('de-DE', storage);

    expect(readStoredManualAppLanguage(storage)).toBe('en');
    expect(storage.getItem('appLanguage')).toBe('"manualLang_EN"');

    storeManualAppLanguageMode(storage);

    expect(readStoredAppLanguage(storage)).toBe('de');
    expect(readStoredManualAppLanguage(storage)).toBe('en');
    expect(initializePhase1Language('fr-FR', storage)).toBe('en');
  });

  it('falls back to English after disabling first-launch automatic mode', () => {
    const storage = new MemoryStorage();
    storeAutomaticAppLanguage('de-DE', storage);

    storeManualAppLanguageMode(storage);

    expect(storage.getItem(APP_MANUAL_LANGUAGE_STORAGE_KEY)).toBe('');
    expect(readStoredAppLanguage(storage)).toBe('de');
    expect(initializePhase1Language('fr-FR', storage)).toBe('en');
  });

  it('migrates Phase 1 manual language keys', () => {
    const storage = new MemoryStorage();
    storage.setItem('StoredIsLanguageAuto', 'false');
    storage.setItem('appLanguage', '"manualLang_PL"');

    expect(initializePhase1Language('fr-FR', storage)).toBe('pl');
    expect(readStoredAppLanguage(storage)).toBe('pl');
    expect(readAppLanguageMode(storage)).toBe('manual');
  });

  it('publishes language changes through the global reactive state', () => {
    storeManualAppLanguage('fr');
    expect(currentAppLanguage()).toBe('fr');

    storeManualAppLanguage('de');
    expect(currentAppLanguage()).toBe('de');

    storeAutomaticAppLanguage('pl-PL');
    expect(currentAppLanguage()).toBe('pl');
  });
});
