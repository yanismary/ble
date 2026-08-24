export const ROOM_ASSIGNMENTS_STORAGE_KEY = 'StoredRoomAssignments';

export interface AppRoomCacheEntry {
  readonly suffix?: string;
  readonly name?: string;
  readonly updatedAt?: number;
}

export interface AppRoomCacheStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function normalizeRoomCacheKey(deviceKey: string): string {
  return deviceKey.trim().toUpperCase();
}

export function readRoomCache(
  storage: Pick<AppRoomCacheStorage, 'getItem'> = localStorage,
): Readonly<Record<string, AppRoomCacheEntry>> {
  const raw = storage.getItem(ROOM_ASSIGNMENTS_STORAGE_KEY);
  if (raw === null) {
    return Object.freeze({});
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Readonly<Record<string, AppRoomCacheEntry>>
      : Object.freeze({});
  } catch {
    return Object.freeze({});
  }
}

export function readRoomCacheEntry(
  deviceKey: string,
  storage: Pick<AppRoomCacheStorage, 'getItem'> = localStorage,
): AppRoomCacheEntry | null {
  const key = normalizeRoomCacheKey(deviceKey);
  if (!key) {
    return null;
  }
  const entry = readRoomCache(storage)[key];
  return entry === undefined ? null : entry;
}

export function writeRoomCacheEntry(
  deviceKey: string,
  patch: Pick<AppRoomCacheEntry, 'name' | 'suffix'>,
  storage: AppRoomCacheStorage = localStorage,
): AppRoomCacheEntry | null {
  const key = normalizeRoomCacheKey(deviceKey);
  if (!key) {
    return null;
  }
  const nextEntry: AppRoomCacheEntry = {
    ...(readRoomCache(storage)[key] ?? {}),
    ...patch,
    updatedAt: Date.now(),
  };
  storage.setItem(ROOM_ASSIGNMENTS_STORAGE_KEY, JSON.stringify({
    ...readRoomCache(storage),
    [key]: nextEntry,
  }));
  return nextEntry;
}
