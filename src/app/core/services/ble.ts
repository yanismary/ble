import { Injectable } from '@angular/core';
import {
  BleClient,
  ScanResult,
} from '@capacitor-community/bluetooth-le';

@Injectable({
  providedIn: 'root',
})
export class BleService {
  private initializationPromise: Promise<void> | null = null;
  private stopPromise: Promise<void> | null = null;
  private scanning = false;

  async initialize(): Promise<void> {
    if (this.initializationPromise === null) {
      this.initializationPromise = BleClient.initialize({
        androidNeverForLocation: true,
      }).catch((error: unknown) => {
        this.initializationPromise = null;
        throw error;
      });
    }

    await this.initializationPromise;
  }

  async isBluetoothEnabled(): Promise<boolean> {
    await this.initialize();
    return BleClient.isEnabled();
  }

  async startScan(
    onDeviceFound: (result: ScanResult) => void,
  ): Promise<void> {
    if (this.stopPromise !== null) {
      await this.stopPromise;
    }

    await this.initialize();

    if (this.scanning) {
      throw new Error('A BLE scan is already in progress.');
    }

    this.scanning = true;

    try {
      await BleClient.requestLEScan(
        {
          allowDuplicates: false,
        },
        onDeviceFound,
      );
    } catch (error: unknown) {
      this.scanning = false;
      throw error;
    }
  }

  async stopScan(): Promise<void> {
    if (this.stopPromise !== null) {
      await this.stopPromise;
      return;
    }

    if (!this.scanning) {
      return;
    }

    this.scanning = false;
    this.stopPromise = BleClient.stopLEScan().finally(() => {
      this.stopPromise = null;
    });

    await this.stopPromise;
  }

  async requestBluetoothEnable(): Promise<void> {
    await this.initialize();
    await BleClient.requestEnable();
  }

  isScanning(): boolean {
    return this.scanning;
  }
}
