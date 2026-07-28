import { Injectable } from '@angular/core';
import {
  BleClient,
  BleService as DiscoveredBleService,
  ScanResult,
} from '@capacitor-community/bluetooth-le';
import { Observable, Subject } from 'rxjs';

export type BleDisconnectionReason = 'local' | 'remote';

export interface BleDisconnectionEvent {
  deviceId: string;
  reason: BleDisconnectionReason;
}

export interface BleNotificationEvent {
  readonly deviceId: string;
  readonly serviceUuid: string;
  readonly characteristicUuid: string;
  readonly value: DataView;
  readonly sequence: number;
  readonly receivedAt: number;
}

interface NotificationSubscription {
  readonly deviceId: string;
  readonly serviceUuid: string;
  readonly characteristicUuid: string;
  readonly startPromise: Promise<void>;
}

@Injectable({
  providedIn: 'root',
})
export class BleService {
  private readonly disconnectionSubject = new Subject<BleDisconnectionEvent>();
  private readonly notificationSubject = new Subject<BleNotificationEvent>();
  private readonly notificationSubscriptions =
    new Map<string, NotificationSubscription>();
  private initializationPromise: Promise<void> | null = null;
  private stopPromise: Promise<void> | null = null;
  private connectionPromise: Promise<void> | null = null;
  private disconnectPromise: Promise<void> | null = null;
  private connectedDeviceIdValue: string | null = null;
  private connectingDeviceId: string | null = null;
  private locallyDisconnectingDeviceId: string | null = null;
  private writePromise: Promise<void> | null = null;
  private notificationSequenceValue = 0;
  private connecting = false;
  private scanning = false;

  readonly disconnections$: Observable<BleDisconnectionEvent> =
    this.disconnectionSubject.asObservable();
  readonly notifications$: Observable<BleNotificationEvent> =
    this.notificationSubject.asObservable();

  get connectedDeviceId(): string | null {
    return this.connectedDeviceIdValue;
  }

  get isWriting(): boolean {
    return this.writePromise !== null;
  }

  get lastNotificationSequence(): number {
    return this.notificationSequenceValue;
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
    await this.stopAllNotifications(deviceId);
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

  async discoverServices(deviceId?: string): Promise<DiscoveredBleService[]> {
    if (this.connectedDeviceIdValue === null) {
      throw new Error('No BLE device is connected.');
    }

    const targetDeviceId = deviceId === undefined
      ? this.connectedDeviceIdValue
      : deviceId.trim();

    if (!targetDeviceId) {
      throw new Error('A deviceId is required to discover services.');
    }

    return BleClient.getServices(targetDeviceId);
  }

  async readCharacteristic(
    serviceUuid: string,
    characteristicUuid: string,
    deviceId?: string,
  ): Promise<DataView> {
    if (this.connectedDeviceIdValue === null) {
      throw new Error('No BLE device is connected.');
    }

    const normalizedServiceUuid = serviceUuid.trim();
    const normalizedCharacteristicUuid = characteristicUuid.trim();
    const targetDeviceId = deviceId === undefined
      ? this.connectedDeviceIdValue
      : deviceId.trim();

    if (!normalizedServiceUuid) {
      throw new Error('A service UUID is required to read a characteristic.');
    }

    if (!normalizedCharacteristicUuid) {
      throw new Error(
        'A characteristic UUID is required to read a characteristic.',
      );
    }

    if (!targetDeviceId) {
      throw new Error('A deviceId is required to read a characteristic.');
    }

    return BleClient.read(
      targetDeviceId,
      normalizedServiceUuid,
      normalizedCharacteristicUuid,
    );
  }

  async writeCharacteristic(
    serviceUuid: string,
    characteristicUuid: string,
    value: DataView | Uint8Array,
    deviceId?: string,
  ): Promise<void> {
    const connectedDeviceId = this.connectedDeviceIdValue;

    if (connectedDeviceId === null) {
      throw new Error('No BLE device is connected.');
    }

    const normalizedServiceUuid = serviceUuid.trim().toLowerCase();
    const normalizedCharacteristicUuid =
      characteristicUuid.trim().toLowerCase();
    const targetDeviceId = deviceId === undefined
      ? connectedDeviceId
      : deviceId.trim();

    if (!normalizedServiceUuid) {
      throw new Error('A service UUID is required to write a characteristic.');
    }

    if (!normalizedCharacteristicUuid) {
      throw new Error(
        'A characteristic UUID is required to write a characteristic.',
      );
    }

    if (!targetDeviceId) {
      throw new Error('A deviceId is required to write a characteristic.');
    }

    if (targetDeviceId !== connectedDeviceId) {
      throw new Error('The target device is not the connected BLE device.');
    }

    if (value.byteLength === 0) {
      throw new Error('A non-empty value is required for a BLE write.');
    }

    if (this.writePromise !== null) {
      throw new Error('A BLE write is already in progress.');
    }

    const dataView = new DataView(value.buffer, value.byteOffset, value.byteLength);
    const write = BleClient.write(
      targetDeviceId,
      normalizedServiceUuid,
      normalizedCharacteristicUuid,
      dataView,
    );
    this.writePromise = write;

    try {
      await write;

      if (this.connectedDeviceIdValue !== targetDeviceId) {
        throw new Error('The BLE device disconnected during the write.');
      }
    } finally {
      if (this.writePromise === write) {
        this.writePromise = null;
      }
    }
  }

  async startNotifications(
    serviceUuid: string,
    characteristicUuid: string,
    callback: (value: DataView) => void,
    deviceId?: string,
  ): Promise<void> {
    const target = this.validateNotificationTarget(
      serviceUuid,
      characteristicUuid,
      deviceId,
    );
    const key = this.notificationKey(target);
    const existingSubscription = this.notificationSubscriptions.get(key);

    if (existingSubscription !== undefined) {
      await existingSubscription.startPromise;
      return;
    }

    const startPromise = BleClient.startNotifications(
      target.deviceId,
      target.serviceUuid,
      target.characteristicUuid,
      (value: DataView) => {
        this.notificationSequenceValue += 1;
        this.notificationSubject.next({
          ...target,
          value,
          sequence: this.notificationSequenceValue,
          receivedAt: Date.now(),
        });
        callback(value);
      },
    );
    const subscription: NotificationSubscription = {
      ...target,
      startPromise,
    };
    this.notificationSubscriptions.set(key, subscription);

    try {
      await startPromise;
    } catch (error: unknown) {
      if (this.notificationSubscriptions.get(key) === subscription) {
        this.notificationSubscriptions.delete(key);
      }
      throw error;
    }
  }

  async stopNotifications(
    serviceUuid: string,
    characteristicUuid: string,
    deviceId?: string,
  ): Promise<void> {
    const target = this.validateNotificationTarget(
      serviceUuid,
      characteristicUuid,
      deviceId,
    );
    await this.stopNotificationSubscription(target);
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

    void this.stopAllNotifications(deviceId);
    this.connectedDeviceIdValue = null;
    this.connectingDeviceId = null;
    this.connecting = false;
    this.disconnectionSubject.next({ deviceId, reason: 'remote' });
  }

  private validateNotificationTarget(
    serviceUuid: string,
    characteristicUuid: string,
    deviceId?: string,
  ): Omit<NotificationSubscription, 'startPromise'> {
    if (this.connectedDeviceIdValue === null) {
      throw new Error('No BLE device is connected.');
    }

    const normalizedServiceUuid = serviceUuid.trim();
    const normalizedCharacteristicUuid = characteristicUuid.trim();
    const targetDeviceId = deviceId === undefined
      ? this.connectedDeviceIdValue
      : deviceId.trim();

    if (!normalizedServiceUuid) {
      throw new Error(
        'A service UUID is required to manage notifications.',
      );
    }

    if (!normalizedCharacteristicUuid) {
      throw new Error(
        'A characteristic UUID is required to manage notifications.',
      );
    }

    if (!targetDeviceId) {
      throw new Error('A deviceId is required to manage notifications.');
    }

    return {
      deviceId: targetDeviceId,
      serviceUuid: normalizedServiceUuid,
      characteristicUuid: normalizedCharacteristicUuid,
    };
  }

  private notificationKey(
    target: Omit<NotificationSubscription, 'startPromise'>,
  ): string {
    return [
      target.deviceId,
      target.serviceUuid.toLowerCase(),
      target.characteristicUuid.toLowerCase(),
    ].join('|');
  }

  private async stopNotificationSubscription(
    target: Omit<NotificationSubscription, 'startPromise'>,
  ): Promise<void> {
    const key = this.notificationKey(target);
    const subscription = this.notificationSubscriptions.get(key);

    if (subscription === undefined) {
      return;
    }

    this.notificationSubscriptions.delete(key);
    await subscription.startPromise;
    await BleClient.stopNotifications(
      subscription.deviceId,
      subscription.serviceUuid,
      subscription.characteristicUuid,
    );
  }

  private async stopAllNotifications(deviceId: string): Promise<void> {
    const subscriptions = [...this.notificationSubscriptions.entries()]
      .filter(([, subscription]) => subscription.deviceId === deviceId);

    subscriptions.forEach(([key]) => {
      this.notificationSubscriptions.delete(key);
    });

    await Promise.all(subscriptions.map(async ([, subscription]) => {
      try {
        await subscription.startPromise;
        await BleClient.stopNotifications(
          subscription.deviceId,
          subscription.serviceUuid,
          subscription.characteristicUuid,
        );
      } catch {
        // A physical disconnection already stops native notifications.
      }
    }));
  }
}
