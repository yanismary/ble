export const APP_LANGUAGES = ['fr', 'en', 'de', 'pl'] as const;

export type AppLanguage = typeof APP_LANGUAGES[number];
export type AppLanguageMode = 'automatic' | 'manual';

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'fr';
export const APP_LANGUAGE_STORAGE_KEY = 'lang';
export const APP_LANGUAGE_MODE_STORAGE_KEY = 'languageMode';
export const LEGACY_LANGUAGE_AUTO_STORAGE_KEY = 'StoredIsLanguageAuto';
export const LEGACY_APP_LANGUAGE_STORAGE_KEY = 'appLanguage';

export function resolveAppLanguage(
  value: string | null | undefined,
  fallback: AppLanguage = DEFAULT_APP_LANGUAGE,
): AppLanguage {
  const shortCode = String(value ?? '').trim().slice(0, 2).toLowerCase();
  return (APP_LANGUAGES as readonly string[]).includes(shortCode)
    ? shortCode as AppLanguage
    : fallback;
}

export function readStoredAppLanguage(
  storage: Pick<Storage, 'getItem'> = localStorage,
): AppLanguage {
  return resolveAppLanguage(storage.getItem(APP_LANGUAGE_STORAGE_KEY));
}

export function readAppLanguageMode(
  storage: Pick<Storage, 'getItem'> = localStorage,
): AppLanguageMode {
  return storage.getItem(APP_LANGUAGE_MODE_STORAGE_KEY) === 'automatic'
    ? 'automatic'
    : 'manual';
}

export function storeManualAppLanguage(
  language: AppLanguage,
  storage: Pick<Storage, 'setItem'> = localStorage,
): AppLanguage {
  storage.setItem(APP_LANGUAGE_MODE_STORAGE_KEY, 'manual');
  storage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
  return language;
}

export function storeAutomaticAppLanguage(
  browserLanguage: string | null | undefined,
  storage: Pick<Storage, 'setItem'> = localStorage,
): AppLanguage {
  const language = resolveAppLanguage(browserLanguage, 'en');
  storage.setItem(APP_LANGUAGE_MODE_STORAGE_KEY, 'automatic');
  storage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
  return language;
}

export function legacyManualLanguageToAppLanguage(
  value: unknown,
): AppLanguage {
  switch (value) {
    case 'manualLang_FR':
      return 'fr';
    case 'manualLang_EN':
      return 'en';
    case 'manualLang_DE':
      return 'de';
    case 'manualLang_PL':
      return 'pl';
    default:
      return 'en';
  }
}

function readLegacyJson<T>(
  key: string,
  storage: Pick<Storage, 'getItem'>,
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

export function initializePhase1Language(
  systemLanguage: string | null | undefined,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): AppLanguage {
  const storedLanguage = storage.getItem(APP_LANGUAGE_STORAGE_KEY);
  const storedMode = storage.getItem(APP_LANGUAGE_MODE_STORAGE_KEY);

  if (storedLanguage !== null) {
    const language = resolveAppLanguage(storedLanguage, 'en');
    storage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
    if (storedMode !== 'automatic' && storedMode !== 'manual') {
      storage.setItem(APP_LANGUAGE_MODE_STORAGE_KEY, 'manual');
    }
    return language;
  }

  const legacyAuto = readLegacyJson<unknown>(
    LEGACY_LANGUAGE_AUTO_STORAGE_KEY,
    storage,
  );
  if (legacyAuto === false) {
    const legacyManual = readLegacyJson<unknown>(
      LEGACY_APP_LANGUAGE_STORAGE_KEY,
      storage,
    );
    return storeManualAppLanguage(
      legacyManualLanguageToAppLanguage(legacyManual),
      storage,
    );
  }

  if (storage.getItem(LEGACY_LANGUAGE_AUTO_STORAGE_KEY) === null) {
    storage.setItem(LEGACY_LANGUAGE_AUTO_STORAGE_KEY, JSON.stringify(true));
  }
  if (storage.getItem(LEGACY_APP_LANGUAGE_STORAGE_KEY) === null) {
    storage.setItem(LEGACY_APP_LANGUAGE_STORAGE_KEY, JSON.stringify(true));
  }
  return storeAutomaticAppLanguage(systemLanguage, storage);
}
