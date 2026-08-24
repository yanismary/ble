import {
  ROOM_ASSIGNMENTS_STORAGE_KEY,
  normalizeRoomCacheKey,
  readRoomCacheEntry,
  writeRoomCacheEntry,
} from './app-room-cache';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('app room cache', () => {
  it('normalizes BLE identifiers like the Phase 1 room cache', () => {
    expect(normalizeRoomCacheKey(' aa:bb ')).toBe('AA:BB');
  });

  it('reads legacy StoredRoomAssignments entries after restart', () => {
    const storage = new MemoryStorage();
    storage.setItem(ROOM_ASSIGNMENTS_STORAGE_KEY, JSON.stringify({
      'AA:BB': { name: 'Cuisine', suffix: '#CUI', updatedAt: 42 },
    }));

    expect(readRoomCacheEntry('aa:bb', storage)).toEqual({
      name: 'Cuisine',
      suffix: '#CUI',
      updatedAt: 42,
    });
  });

  it('persists display-only name and room fallback entries', () => {
    const storage = new MemoryStorage();

    const entry = writeRoomCacheEntry(
      'device-1',
      { name: 'Salon', suffix: '#SAL' },
      storage,
    );

    expect(entry?.name).toBe('Salon');
    expect(entry?.suffix).toBe('#SAL');
    expect(readRoomCacheEntry('DEVICE-1', storage)?.name).toBe('Salon');
  });
});
