import { signal } from '@angular/core';

export const APP_LANGUAGES = ['fr', 'en', 'de', 'pl'] as const;

export type AppLanguage = typeof APP_LANGUAGES[number];
export type AppLanguageMode = 'automatic' | 'manual';

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'fr';
export const APP_LANGUAGE_STORAGE_KEY = 'lang';
export const APP_LANGUAGE_MODE_STORAGE_KEY = 'languageMode';
export const APP_MANUAL_LANGUAGE_STORAGE_KEY = 'manualLanguage';
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

function initialAppLanguage(): AppLanguage {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_APP_LANGUAGE;
  }
  return resolveAppLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY));
}

const activeAppLanguage = signal<AppLanguage>(initialAppLanguage());

export const currentAppLanguage = activeAppLanguage.asReadonly();

export function readStoredAppLanguage(
  storage: Pick<Storage, 'getItem'> = localStorage,
): AppLanguage {
  return resolveAppLanguage(storage.getItem(APP_LANGUAGE_STORAGE_KEY));
}

export function readAppLanguageMode(
  storage: Pick<Storage, 'getItem'> = localStorage,
): AppLanguageMode {
  const modernMode = storage.getItem(APP_LANGUAGE_MODE_STORAGE_KEY);
  if (modernMode === 'automatic' || modernMode === 'manual') {
    return modernMode;
  }
  return readLegacyJson<unknown>(LEGACY_LANGUAGE_AUTO_STORAGE_KEY, storage) ===
    true ? 'automatic' : 'manual';
}

export function readStoredManualAppLanguage(
  storage: Pick<Storage, 'getItem'> = localStorage,
): AppLanguage | null {
  const modernLanguage = storage.getItem(APP_MANUAL_LANGUAGE_STORAGE_KEY);
  if ((APP_LANGUAGES as readonly string[]).includes(modernLanguage ?? '')) {
    return modernLanguage as AppLanguage;
  }
  const legacyLanguage = readLegacyJson<unknown>(
    LEGACY_APP_LANGUAGE_STORAGE_KEY,
    storage,
  );
  return legacyManualLanguageToAppLanguageOrNull(legacyLanguage);
}

export function storeManualAppLanguage(
  language: AppLanguage,
  storage: Pick<Storage, 'setItem'> = localStorage,
): AppLanguage {
  storage.setItem(APP_LANGUAGE_MODE_STORAGE_KEY, 'manual');
  storage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
  storage.setItem(APP_MANUAL_LANGUAGE_STORAGE_KEY, language);
  storage.setItem(LEGACY_LANGUAGE_AUTO_STORAGE_KEY, JSON.stringify(false));
  storage.setItem(
    LEGACY_APP_LANGUAGE_STORAGE_KEY,
    JSON.stringify(appLanguageToLegacyManualLanguage(language)),
  );
  activeAppLanguage.set(language);
  return language;
}

export function storeManualAppLanguageMode(
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): AppLanguage {
  storage.setItem(APP_LANGUAGE_MODE_STORAGE_KEY, 'manual');
  storage.setItem(LEGACY_LANGUAGE_AUTO_STORAGE_KEY, JSON.stringify(false));
  if (readStoredManualAppLanguage(storage) === null) {
    // Phase 1 kept appLanguage untouched when automatic mode was disabled.
    storage.setItem(APP_MANUAL_LANGUAGE_STORAGE_KEY, '');
  }
  return activeAppLanguage();
}

export function storeAutomaticAppLanguage(
  browserLanguage: string | null | undefined,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): AppLanguage {
  const language = resolveAppLanguage(browserLanguage, 'en');
  storage.setItem(APP_LANGUAGE_MODE_STORAGE_KEY, 'automatic');
  storage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
  storage.setItem(LEGACY_LANGUAGE_AUTO_STORAGE_KEY, JSON.stringify(true));
  if (storage.getItem(LEGACY_APP_LANGUAGE_STORAGE_KEY) === null) {
    storage.setItem(LEGACY_APP_LANGUAGE_STORAGE_KEY, JSON.stringify(true));
  }
  activeAppLanguage.set(language);
  return language;
}

export function legacyManualLanguageToAppLanguage(
  value: unknown,
): AppLanguage {
  return legacyManualLanguageToAppLanguageOrNull(value) ?? 'en';
}

function legacyManualLanguageToAppLanguageOrNull(
  value: unknown,
): AppLanguage | null {
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
      return null;
  }
}

function appLanguageToLegacyManualLanguage(
  language: AppLanguage,
): string {
  return `manualLang_${language.toUpperCase()}`;
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
  const storedMode = storage.getItem(APP_LANGUAGE_MODE_STORAGE_KEY);
  if (storedMode === 'automatic') {
    return storeAutomaticAppLanguage(systemLanguage, storage);
  }
  if (storedMode === 'manual') {
    let manualLanguage = readStoredManualAppLanguage(storage);
    if (manualLanguage === null &&
        storage.getItem(APP_MANUAL_LANGUAGE_STORAGE_KEY) === null) {
      const previousPhase2Language = storage.getItem(APP_LANGUAGE_STORAGE_KEY);
      if (previousPhase2Language !== null) {
        manualLanguage = resolveAppLanguage(previousPhase2Language, 'en');
      }
    }
    return storeManualAppLanguage(manualLanguage ?? 'en', storage);
  }

  const legacyAuto = readLegacyJson<unknown>(
    LEGACY_LANGUAGE_AUTO_STORAGE_KEY,
    storage,
  );
  if (legacyAuto === false) {
    return storeManualAppLanguage(
      readStoredManualAppLanguage(storage) ?? 'en',
      storage,
    );
  }
  if (legacyAuto === true) {
    return storeAutomaticAppLanguage(systemLanguage, storage);
  }

  const previousPhase2Language = storage.getItem(APP_LANGUAGE_STORAGE_KEY);
  if (previousPhase2Language !== null) {
    return storeManualAppLanguage(
      resolveAppLanguage(previousPhase2Language, 'en'),
      storage,
    );
  }
  return storeAutomaticAppLanguage(systemLanguage, storage);
}
