export const APP_LANGUAGES = ['fr', 'en', 'de', 'pl'] as const;

export type AppLanguage = typeof APP_LANGUAGES[number];
export type AppLanguageMode = 'automatic' | 'manual';

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'fr';
export const APP_LANGUAGE_STORAGE_KEY = 'lang';
export const APP_LANGUAGE_MODE_STORAGE_KEY = 'languageMode';

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
