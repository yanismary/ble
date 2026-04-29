import { Injectable } from '@angular/core';

@Injectable()
export class LoggerService {

  private DEBUG = true; // mettre false pour désactiver les logs debug

  constructor() {}

  private format(tag: string, message: string, data?: any) {
    const time = new Date().toISOString();
    if (data !== undefined) {
      return `[${time}] [${tag}] ${message}`;
    }
    return `[${time}] [${tag}] ${message}`;
  }

  debug(tag: string, message: string, data?: any) {
    if (!this.DEBUG) return;
    console.debug(this.format(tag, message), data || '');
  }

  info(tag: string, message: string, data?: any) {
    console.info(this.format(tag, message), data || '');
  }

  warn(tag: string, message: string, data?: any) {
    console.warn(this.format(tag, message), data || '');
  }

  error(tag: string, message: string, error?: any) {
    console.error(this.format(tag, message), error || '');
  }

}