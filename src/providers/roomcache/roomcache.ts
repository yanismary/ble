import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { LoggerService } from '../logger/logger.service';

interface RoomCacheEntry {
  suffix: string;
  updatedAt: number;
}

const STORAGE_KEY = 'StoredRoomAssignments';

// Source de verite locale pour l'icone de piece affichee au scan (WIDOOR/MOVENTIV/GARLINE).
// Le protocole moteur ne change pas : la piece reste ecrite en suffixe du nom BLE. Ce cache
// sert uniquement a l'affichage app, pour ne plus dependre du nom BLE tel que remonte par le
// scan Android (parfois en cache/pas a jour tant que l'app n'a pas ete relancee).
@Injectable()
export class RoomCacheProvider {
  private readonly TAG = 'RoomCacheProvider';
  private cache: { [deviceKey: string]: RoomCacheEntry } = {};
  private loaded = false;
  private loadPromise: Promise<void> | null = null;

  constructor(private storage: Storage, private logger: LoggerService) {}

  private normalizeKey(deviceKey: string): string {
    return (deviceKey || '').trim().toUpperCase();
  }

  // Charge le cache une seule fois (idempotent) ; a appeler tot (constructeur de page) pour
  // que getRoomSuffix() soit deja pret au moment du premier callback de scan.
  preload(): Promise<void> {
    if (this.loaded) {
      return Promise.resolve();
    }
    if (!this.loadPromise) {
      this.loadPromise = this.storage.get(STORAGE_KEY).then((raw) => {
        this.cache = raw ? JSON.parse(raw) : {};
        this.loaded = true;
        this.logger.debug(this.TAG, 'Cache pieces charge', { count: Object.keys(this.cache).length }, 'ROOM');
      }).catch((error) => {
        this.logger.warn(this.TAG, 'Chargement cache pieces echoue, cache vide utilise', error, 'ROOM');
        this.cache = {};
        this.loaded = true;
      });
    }
    return this.loadPromise;
  }

  async setRoomSuffix(deviceKey: string, suffix: string): Promise<void> {
    const key = this.normalizeKey(deviceKey);
    if (!key) {
      this.logger.warn(this.TAG, 'setRoomSuffix ignore: deviceKey absent', { suffix: suffix }, 'ROOM');
      return;
    }

    await this.preload();
    this.cache[key] = { suffix: suffix || '', updatedAt: Date.now() };

    try {
      await this.storage.set(STORAGE_KEY, JSON.stringify(this.cache));
      this.logger.debug(this.TAG, 'Piece sauvegardee localement', { deviceKey: key, suffix: suffix }, 'ROOM');
    } catch (error) {
      this.logger.warn(this.TAG, 'Sauvegarde locale piece echouee (cache memoire conserve)', error, 'ROOM');
    }
  }

  // Synchrone par design : utilise depuis le callback de scan (appele plusieurs fois par
  // seconde), donc pas question d'attendre une promesse Storage a chaque appel.
  // Renvoie null tant que le cache n'a pas fini son premier chargement (preload()).
  getRoomSuffix(deviceKey: string): string | null {
    const key = this.normalizeKey(deviceKey);
    if (!key || !this.loaded) {
      return null;
    }
    const entry = this.cache[key];
    return entry ? entry.suffix : null;
  }
}
