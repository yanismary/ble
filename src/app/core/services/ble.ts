import { Injectable } from '@angular/core';
import {
  BleClient,
  ScanResult,
} from '@capacitor-community/bluetooth-le';
import { Observable, Subject } from 'rxjs';

export type BleDisconnectionReason = 'local' | 'remote';

export interface BleDisconnectionEvent {
  deviceId: string;
  reason: BleDisconnectionReason;
}

@Injectable({
  providedIn: 'root',
})
export class BleService {
  private readonly disconnectionSubject = new Subject<BleDisconnectionEvent>();
  private initializationPromise: Promise<void> | null = null;
  private stopPromise: Promise<void> | null = null;
  private connectionPromise: Promise<void> | null = null;
  private disconnectPromise: Promise<void> | null = null;
  private connectedDeviceIdValue: string | null = null;
  private connectingDeviceId: string | null = null;
  private locallyDisconnectingDeviceId: string | null = null;
  private connecting = false;
  private scanning = false;

  readonly disconnections$: Observable<BleDisconnectionEvent> =
    this.disconnectionSubject.asObservable();

  get connectedDeviceId(): string | null {
    return this.connectedDeviceIdValue;
  }

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

  async connect(deviceId: string): Promise<void> {
    const normalizedDeviceId = deviceId.trim();

    if (!normalizedDeviceId) {
      throw new Error('A deviceId is required to connect.');
    }

    if (this.connectionPromise !== null) {
      throw new Error('A BLE connection is already in progress.');
    }

    if (this.connectedDeviceIdValue !== null) {
      throw new Error('A BLE device is already connected.');
    }

    this.connecting = true;
    this.connectingDeviceId = normalizedDeviceId;
    const connection = this.connectToDevice(normalizedDeviceId);
    this.connectionPromise = connection;

    try {
      await connection;
    } finally {
      if (this.connectionPromise === connection) {
        this.connectionPromise = null;
      }
      this.connecting = false;
      this.connectingDeviceId = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectionPromise !== null) {
      throw new Error('A BLE connection is still in progress.');
    }

    if (this.disconnectPromise !== null) {
      await this.disconnectPromise;
      return;
    }

    const deviceId = this.connectedDeviceIdValue;

    if (deviceId === null) {
      return;
    }

    this.locallyDisconnectingDeviceId = deviceId;
    const disconnection = BleClient.disconnect(deviceId);
    this.disconnectPromise = disconnection;

    try {
      await disconnection;
      this.connectedDeviceIdValue = null;
      this.disconnectionSubject.next({ deviceId, reason: 'local' });
    } finally {
      this.locallyDisconnectingDeviceId = null;
      if (this.disconnectPromise === disconnection) {
        this.disconnectPromise = null;
      }
    }
  }

  isScanning(): boolean {
    return this.scanning;
  }

  private async connectToDevice(deviceId: string): Promise<void> {
    if (this.scanning) {
      await this.stopScan();
    }

    await this.initialize();
    let disconnectedDuringConnection = false;
    await BleClient.connect(deviceId, (disconnectedDeviceId: string) => {
      disconnectedDuringConnection = true;
      this.handleRemoteDisconnection(disconnectedDeviceId);
    });

    if (!disconnectedDuringConnection) {
      this.connectedDeviceIdValue = deviceId;
    }
  }

  private handleRemoteDisconnection(deviceId: string): void {
    if (this.locallyDisconnectingDeviceId === deviceId) {
      return;
    }

    const isActiveDevice =
      this.connectedDeviceIdValue === deviceId ||
      this.connectingDeviceId === deviceId;

    if (!isActiveDevice) {
      return;
    }

    this.connectedDeviceIdValue = null;
    this.connectingDeviceId = null;
    this.connecting = false;
    this.disconnectionSubject.next({ deviceId, reason: 'remote' });
  }
}
