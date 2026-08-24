import {
  initializePhase1DefaultPreferences,
} from './app-preferences';
import {
  initializePhase1Language,
} from './app-language';

export function initializePhase1AppState(
  systemLanguage: string | null | undefined = navigator.language,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): void {
  initializePhase1Language(systemLanguage, storage);
  initializePhase1DefaultPreferences(storage);
}
