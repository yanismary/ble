import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { LoggerService } from '../logger/logger.service';

interface RoomCacheEntry {
  suffix?: string;
  name?: string;
  updatedAt: number;
}

const STORAGE_KEY = 'StoredRoomAssignments';

// Source de verite locale pour l'affichage (icone de piece + nom du moteur) au scan et sur les
// pages produit (WIDOOR/MOVENTIV/GARLINE). Le protocole moteur ne change pas : la piece et le nom
// restent ecrits comme avant sur le moteur (nom BLE = nom + suffixe de piece). Ce cache sert
// uniquement a l'affichage app, pour ne plus dependre du nom BLE tel que remonte par le scan
// Android/iOS (parfois en cache/pas a jour tant que l'app n'a pas ete relancee).
// Un seul cache pour les deux car ils partagent la meme cle (deviceId/address/uuid) et la meme
// resolution d'affichage cote scan.ts : mutualise plutot que duplique.
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
  // que getRoomSuffix()/getDeviceName() soient deja prets au moment du premier callback de scan.
  preload(): Promise<void> {
    if (this.loaded) {
      return Promise.resolve();
    }
    if (!this.loadPromise) {
      this.loadPromise = this.storage.get(STORAGE_KEY).then((raw) => {
        this.cache = raw ? JSON.parse(raw) : {};
        this.loaded = true;
        this.logger.debug(this.TAG, 'Cache local moteur charge', { count: Object.keys(this.cache).length }, 'ROOM');
      }).catch((error) => {
        this.logger.warn(this.TAG, 'Chargement cache local moteur echoue, cache vide utilise', error, 'ROOM');
        this.cache = {};
        this.loaded = true;
      });
    }
    return this.loadPromise;
  }

  private async persistEntry(key: string, patch: Partial<RoomCacheEntry>): Promise<void> {
    await this.preload();
    const existing = this.cache[key] || {};
    this.cache[key] = { ...existing, ...patch, updatedAt: Date.now() };

    try {
      await this.storage.set(STORAGE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      this.logger.warn(this.TAG, 'Sauvegarde locale moteur echouee (cache memoire conserve)', error, 'ROOM');
    }
  }

  async setRoomSuffix(deviceKey: string, suffix: string): Promise<void> {
    const key = this.normalizeKey(deviceKey);
    if (!key) {
      this.logger.warn(this.TAG, 'setRoomSuffix ignore: deviceKey absent', { suffix: suffix }, 'ROOM');
      return;
    }

    await this.persistEntry(key, { suffix: suffix || '' });
    this.logger.debug(this.TAG, 'Piece sauvegardee localement', { deviceKey: key, suffix: suffix }, 'ROOM');
  }

  async setDeviceName(deviceKey: string, name: string): Promise<void> {
    const key = this.normalizeKey(deviceKey);
    if (!key) {
      this.logger.warn(this.TAG, '[NAME] local cache update ignore: deviceKey absent', { name: name }, 'NAME');
      return;
    }

    await this.persistEntry(key, { name: name || '' });
    this.logger.debug(this.TAG, '[NAME] local cache updated', { deviceKey: key, name: name }, 'NAME');
  }

  // Synchrones par design : utilises depuis le callback de scan (appele plusieurs fois par
  // seconde), donc pas question d'attendre une promesse Storage a chaque appel.
  // Renvoient null tant que le cache n'a pas fini son premier chargement (preload()).
  getRoomSuffix(deviceKey: string): string | null {
    const key = this.normalizeKey(deviceKey);
    if (!key || !this.loaded) {
      return null;
    }
    const entry = this.cache[key];
    return entry && entry.suffix !== undefined ? entry.suffix : null;
  }

  getDeviceName(deviceKey: string): string | null {
    const key = this.normalizeKey(deviceKey);
    if (!key || !this.loaded) {
      return null;
    }
    const entry = this.cache[key];
    return entry && entry.name !== undefined ? entry.name : null;
  }
}
