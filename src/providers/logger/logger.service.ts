import { Injectable } from '@angular/core';

@Injectable()
export class LoggerService {

  // Passe a false avant un build de production pour couper le bruit des logs debug.
  // (Pas d'environment.ts dans ce projet Ionic 3 : c'est le seul interrupteur debug/prod.)
  private debugEnabled = true;

  constructor() {}

  setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  // Les objets passes en 2e argument de console.* sont perdus (affiches "[object Object]")
  // une fois remontes dans le logcat Android via le pont Capacitor. On les serialise donc
  // directement dans le message pour qu'ils restent lisibles sur appareil reel.
  private stringifyData(data: any): string {
    if (data === undefined || data === null) {
      return '';
    }

    if (data instanceof Error) {
      return JSON.stringify({ name: data.name, message: data.message, stack: data.stack });
    }

    try {
      const seen = new WeakSet();
      return JSON.stringify(data, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      });
    } catch (e) {
      return String(data);
    }
  }

  // category est optionnel (ex: 'SCAN', 'BLE', 'WRITE', 'ROOM') pour permettre de filtrer
  // Logcat par sujet en plus du tag de page (ex: filtre "WidoorPage.*\[WRITE\]").
  private format(tag: string, message: string, data?: any, category?: string): string {
    const time = new Date().toISOString();
    const tagPart = category ? `[${tag}][${category}]` : `[${tag}]`;
    const serializedData = this.stringifyData(data);
    return serializedData
      ? `[${time}] ${tagPart} ${message} ${serializedData}`
      : `[${time}] ${tagPart} ${message}`;
  }

  debug(tag: string, message: string, data?: any, category?: string) {
    if (!this.debugEnabled) return;
    console.debug(this.format(tag, message, data, category));
  }

  info(tag: string, message: string, data?: any, category?: string) {
    console.info(this.format(tag, message, data, category));
  }

  warn(tag: string, message: string, data?: any, category?: string) {
    console.warn(this.format(tag, message, data, category));
  }

  error(tag: string, message: string, error?: any, category?: string) {
    console.error(this.format(tag, message, error, category));
  }

}
