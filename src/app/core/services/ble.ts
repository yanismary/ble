import { Injectable, OnDestroy } from '@angular/core';
import {
  BleClient,
  BleService as DiscoveredBleService,
  ScanResult,
} from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import { Observable, Subject } from 'rxjs';

export type BleOperationErrorCode =
  | 'initialization-failed'
  | 'permission-denied'
  | 'permission-settings-required'
  | 'bluetooth-disabled'
  | 'bluetooth-enable-unavailable'
  | 'bluetooth-enable-failed'
  | 'connection-timeout'
  | 'connection-failed'
  | 'service-discovery-failed'
  | 'connection-interrupted'
  | 'scan-failed'
  | 'app-settings-unavailable'
  | 'app-settings-failed';

export class BleOperationError extends Error {
  constructor(
    readonly code: BleOperationErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'BleOperationError';
    Object.setPrototypeOf(this, BleOperationError.prototype);
  }
}

export function isBleOperationError(
  error: unknown,
): error is BleOperationError {
  return error instanceof BleOperationError;
}

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

export type BleGattCharacteristicAvailability =
  | 'available'
  | 'services-not-discovered'
  | 'service-absent'
  | 'characteristic-absent'
  | 'not-readable';

export interface BleGattCharacteristicProperties {
  readonly serviceUuid: string;
  readonly characteristicUuid: string;
  readonly servicePresent: boolean;
  readonly characteristicPresent: boolean;
  readonly propertiesAvailable: boolean;
  readonly read: boolean | null;
  readonly write: boolean | null;
  readonly writeWithoutResponse: boolean | null;
  readonly notify: boolean | null;
  readonly indicate: boolean | null;
  readonly descriptorUuids: readonly string[];
  readonly rawProperties: Readonly<Record<string, boolean>>;
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
export class BleService implements OnDestroy {
  private readonly disconnectionSubject = new Subject<BleDisconnectionEvent>();
  private readonly notificationSubject = new Subject<BleNotificationEvent>();
  private readonly notificationSubscriptions =
    new Map<string, NotificationSubscription>();
  private initializationPromise: Promise<void> | null = null;
  private stopPromise: Promise<void> | null = null;
  private connectionPromise: Promise<void> | null = null;
  private disconnectPromise: Promise<void> | null = null;
  private connectedDeviceIdValue: string | null = null;
  private discoveredServicesValue: readonly DiscoveredBleService[] = [];
  private discoveredServicesDeviceIdValue: string | null = null;
  private connectingDeviceId: string | null = null;
  private locallyDisconnectingDeviceId: string | null = null;
  private readonly remoteDuringLocalDisconnectDeviceIds = new Set<string>();
  private writePromise: Promise<void> | null = null;
  private notificationSequenceValue = 0;
  private connectionGenerationValue = 0;
  private activeConnectionToken: symbol | null = null;
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

  get connectionGeneration(): number {
    return this.connectionGenerationValue;
  }

  get disconnectingDeviceId(): string | null {
    return this.locallyDisconnectingDeviceId;
  }

  get lastNotificationSequence(): number {
    return this.notificationSequenceValue;
  }

  get canRequestBluetoothEnable(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  get canOpenAppSettings(): boolean {
    return Capacitor.getPlatform() !== 'web';
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise === null) {
      this.initializationPromise = BleClient.initialize({
        androidNeverForLocation: true,
      }).catch((error: unknown) => {
        this.initializationPromise = null;
        throw this.toBleOperationError(error, 'initialization-failed');
      });
    }

    await this.initializationPromise;
  }

  async isBluetoothEnabled(): Promise<boolean> {
    await this.initialize();
    try {
      return await BleClient.isEnabled();
    } catch (error: unknown) {
      throw this.toBleOperationError(error, 'initialization-failed');
    }
  }

  async startScan(
    onDeviceFound: (result: ScanResult) => void,
    serviceUuids: readonly string[] = [],
  ): Promise<void> {
    if (this.stopPromise !== null) {
      await this.stopPromise;
    }

    await this.initialize();

    if (this.scanning) {
      throw new Error('A BLE scan is already in progress.');
    }

    this.scanning = true;

    const services = Array.from(new Set(
      serviceUuids
        .map((uuid) => uuid.trim().toLowerCase())
        .filter((uuid) => uuid.length > 0),
    ));

    try {
      await BleClient.requestLEScan(
        {
          ...(services.length > 0 ? { services } : {}),
          allowDuplicates: true,
        },
        onDeviceFound,
      );
    } catch (error: unknown) {
      this.scanning = false;
      throw this.toBleOperationError(error, 'scan-failed');
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
    if (!this.canRequestBluetoothEnable) {
      throw new BleOperationError(
        'bluetooth-enable-unavailable',
        'Bluetooth enable request is not available on this platform.',
      );
    }
    await this.initialize();
    try {
      await BleClient.requestEnable();
    } catch (error: unknown) {
      throw new BleOperationError(
        'bluetooth-enable-failed',
        'Bluetooth enable request failed.',
        error,
      );
    }
  }

  async openAppSettings(): Promise<void> {
    if (!this.canOpenAppSettings) {
      throw new BleOperationError(
        'app-settings-unavailable',
        'App settings are not available on this platform.',
      );
    }
    try {
      await BleClient.openAppSettings();
    } catch (error: unknown) {
      throw new BleOperationError(
        'app-settings-failed',
        'Opening app settings failed.',
        error,
      );
    }
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

    this.clearDiscoveredServices();
    this.connecting = true;
    this.connectingDeviceId = normalizedDeviceId;
    const connectionGenerationBeforeAttempt = this.connectionGenerationValue;
    const connection = this.connectToDevice(normalizedDeviceId);
    this.connectionPromise = connection;

    try {
      await connection;
    } catch (error: unknown) {
      const connectionError = isBleOperationError(error)
        ? error
        : this.toBleConnectionError(error);
      if (this.isConnectionErrorCode(connectionError.code)) {
        await this.cleanupFailedConnectionAttempt(
          normalizedDeviceId,
          connectionGenerationBeforeAttempt,
        );
      }
      throw connectionError;
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
    this.remoteDuringLocalDisconnectDeviceIds.delete(deviceId);
    await this.stopAllNotifications(deviceId);
    const disconnection = BleClient.disconnect(deviceId);
    this.disconnectPromise = disconnection;

    try {
      await disconnection;
      this.completeLocalDisconnection(deviceId);
    } catch (error: unknown) {
      if (this.remoteDuringLocalDisconnectDeviceIds.has(deviceId)) {
        this.completeLocalDisconnection(deviceId);
        return;
      }
      throw error;
    } finally {
      this.locallyDisconnectingDeviceId = null;
      this.remoteDuringLocalDisconnectDeviceIds.delete(deviceId);
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
    const connectionGeneration = this.connectionGenerationValue;

    if (!targetDeviceId) {
      throw new Error('A deviceId is required to discover services.');
    }

    if (targetDeviceId !== this.connectedDeviceIdValue) {
      throw new Error('The target device is not the connected BLE device.');
    }

    const services = await BleClient.getServices(targetDeviceId);

    if (
      this.connectedDeviceIdValue !== targetDeviceId
      || this.connectionGenerationValue !== connectionGeneration
    ) {
      throw new Error('The BLE device disconnected during service discovery.');
    }

    this.discoveredServicesValue = this.copyDiscoveredServices(services);
    this.discoveredServicesDeviceIdValue = targetDeviceId;
    return this.copyDiscoveredServices(services);
  }

  getGattCharacteristicAvailability(
    serviceUuid: string,
    characteristicUuid: string,
    deviceId?: string,
  ): BleGattCharacteristicAvailability {
    const targetDeviceId = deviceId?.trim() ?? this.connectedDeviceIdValue;

    if (
      targetDeviceId === null
      || this.discoveredServicesDeviceIdValue !== targetDeviceId
    ) {
      return 'services-not-discovered';
    }

    const normalizedServiceUuid = serviceUuid.trim().toLowerCase();
    const normalizedCharacteristicUuid =
      characteristicUuid.trim().toLowerCase();
    const service = this.discoveredServicesValue.find(({ uuid }) =>
      uuid.trim().toLowerCase() === normalizedServiceUuid,
    );

    if (service === undefined) {
      return 'service-absent';
    }

    const characteristic = service.characteristics.find(({ uuid }) =>
      uuid.trim().toLowerCase() === normalizedCharacteristicUuid,
    );

    if (characteristic === undefined) {
      return 'characteristic-absent';
    }

    return characteristic.properties.read ? 'available' : 'not-readable';
  }

  getGattCharacteristicProperties(
    serviceUuid: string,
    characteristicUuid: string,
    deviceId?: string,
  ): BleGattCharacteristicProperties {
    const normalizedServiceUuid = serviceUuid.trim().toLowerCase();
    const normalizedCharacteristicUuid =
      characteristicUuid.trim().toLowerCase();
    const targetDeviceId = deviceId?.trim() ?? this.connectedDeviceIdValue;
    const empty = (
      servicePresent: boolean,
      characteristicPresent: boolean,
    ): BleGattCharacteristicProperties => ({
      serviceUuid: normalizedServiceUuid,
      characteristicUuid: normalizedCharacteristicUuid,
      servicePresent,
      characteristicPresent,
      propertiesAvailable: false,
      read: null,
      write: null,
      writeWithoutResponse: null,
      notify: null,
      indicate: null,
      descriptorUuids: [],
      rawProperties: {},
    });

    if (
      targetDeviceId === null
      || this.connectedDeviceIdValue !== targetDeviceId
      || this.discoveredServicesDeviceIdValue !== targetDeviceId
    ) {
      return empty(false, false);
    }

    const service = this.discoveredServicesValue.find(({ uuid }) =>
      uuid.trim().toLowerCase() === normalizedServiceUuid,
    );

    if (service === undefined) {
      return empty(false, false);
    }

    const characteristic = service.characteristics.find(({ uuid }) =>
      uuid.trim().toLowerCase() === normalizedCharacteristicUuid,
    );

    if (characteristic === undefined) {
      return empty(true, false);
    }

    const rawProperties: Record<string, boolean> = {};
    for (const [name, value] of Object.entries(
      characteristic.properties ?? {},
    )) {
      if (typeof value === 'boolean') {
        rawProperties[name] = value;
      }
    }
    const propertiesAvailable = Object.keys(rawProperties).length > 0;
    const property = (name: string): boolean | null =>
      propertiesAvailable && typeof rawProperties[name] === 'boolean'
        ? rawProperties[name]
        : null;

    return {
      serviceUuid: normalizedServiceUuid,
      characteristicUuid: normalizedCharacteristicUuid,
      servicePresent: true,
      characteristicPresent: true,
      propertiesAvailable,
      read: property('read'),
      write: property('write'),
      writeWithoutResponse: property('writeWithoutResponse'),
      notify: property('notify'),
      indicate: property('indicate'),
      descriptorUuids: characteristic.descriptors.map(({ uuid }) => uuid),
      rawProperties: { ...rawProperties },
    };
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

  ngOnDestroy(): void {
    this.clearDiscoveredServices();
    this.connectionGenerationValue += 1;
  }

  private async connectToDevice(deviceId: string): Promise<void> {
    if (this.scanning) {
      await this.stopScan();
    }

    await this.initialize();
    let disconnectedDuringConnection = false;
    const connectionToken = Symbol(deviceId);
    this.activeConnectionToken = connectionToken;
    try {
      await BleClient.connect(deviceId, (disconnectedDeviceId: string) => {
        if (this.activeConnectionToken !== connectionToken) {
          return;
        }
        disconnectedDuringConnection = true;
        this.handleRemoteDisconnection(disconnectedDeviceId);
      });
    } catch (error: unknown) {
      if (this.activeConnectionToken === connectionToken) {
        this.activeConnectionToken = null;
      }
      throw this.toBleConnectionError(error);
    }

    if (
      !disconnectedDuringConnection &&
      this.activeConnectionToken === connectionToken
    ) {
      this.connectedDeviceIdValue = deviceId;
      this.clearDiscoveredServices();
      this.connectionGenerationValue += 1;
      return;
    }

    throw new BleOperationError(
      'connection-interrupted',
      'BLE connection was interrupted before completion.',
    );
  }

  private async cleanupFailedConnectionAttempt(
    deviceId: string,
    generationBeforeAttempt: number,
  ): Promise<void> {
    const shouldDisconnectNative =
      this.connectingDeviceId === deviceId ||
      this.connectedDeviceIdValue === deviceId;
    const remoteAlreadyCleaned =
      !shouldDisconnectNative &&
      this.connectionGenerationValue !== generationBeforeAttempt;

    await this.stopAllNotifications(deviceId);
    if (this.connectedDeviceIdValue === deviceId) {
      this.connectedDeviceIdValue = null;
    }
    if (this.connectingDeviceId === deviceId) {
      this.activeConnectionToken = null;
    }
    this.clearDiscoveredServices();

    if (
      !remoteAlreadyCleaned &&
      this.connectionGenerationValue === generationBeforeAttempt
    ) {
      this.connectionGenerationValue += 1;
    }

    if (!shouldDisconnectNative) {
      return;
    }

    try {
      await BleClient.disconnect(deviceId);
    } catch {
      // Keep the original connection failure as the user-visible cause.
    }
  }

  private handleRemoteDisconnection(deviceId: string): void {
    if (this.locallyDisconnectingDeviceId === deviceId) {
      this.remoteDuringLocalDisconnectDeviceIds.add(deviceId);
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
    this.clearDiscoveredServices();
    this.connectionGenerationValue += 1;
    this.activeConnectionToken = null;
    this.connectingDeviceId = null;
    this.connecting = false;
    this.disconnectionSubject.next({ deviceId, reason: 'remote' });
  }

  private completeLocalDisconnection(deviceId: string): void {
    if (this.connectedDeviceIdValue !== deviceId) {
      return;
    }
    this.connectedDeviceIdValue = null;
    this.clearDiscoveredServices();
    this.connectionGenerationValue += 1;
    this.activeConnectionToken = null;
    this.disconnectionSubject.next({ deviceId, reason: 'local' });
  }

  private toBleOperationError(
    error: unknown,
    fallbackCode: BleOperationErrorCode,
  ): BleOperationError {
    if (isBleOperationError(error)) {
      return error;
    }
    if (this.isPermissionDeniedError(error)) {
      const code: BleOperationErrorCode =
        Capacitor.getPlatform() === 'ios'
          ? 'permission-settings-required'
          : 'permission-denied';
      return new BleOperationError(
        code,
        'BLE permission denied.',
        error,
      );
    }
    return new BleOperationError(
      fallbackCode,
      fallbackCode === 'scan-failed'
        ? 'BLE scan failed.'
        : 'BLE initialization failed.',
      error,
    );
  }

  private toBleConnectionError(error: unknown): BleOperationError {
    if (isBleOperationError(error)) {
      return error;
    }
    const message = this.errorMessage(error).trim();
    const normalized = message.toLowerCase().replace(/[.!]+$/, '');

    if (normalized === 'connection timeout') {
      return new BleOperationError(
        'connection-timeout',
        'BLE connection timed out.',
        error,
      );
    }
    if (
      normalized === 'starting service discovery failed' ||
      normalized.startsWith('service discovery failed')
    ) {
      return new BleOperationError(
        'service-discovery-failed',
        'BLE service discovery failed during connection.',
        error,
      );
    }
    if (normalized === 'disconnected before connection completed') {
      return new BleOperationError(
        'connection-interrupted',
        'BLE connection was interrupted before completion.',
        error,
      );
    }

    return new BleOperationError(
      'connection-failed',
      'BLE connection failed.',
      error,
    );
  }

  private isConnectionErrorCode(code: BleOperationErrorCode): boolean {
    return code === 'connection-timeout' ||
      code === 'connection-failed' ||
      code === 'service-discovery-failed' ||
      code === 'connection-interrupted';
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private isPermissionDeniedError(error: unknown): boolean {
    const message = error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
    const normalized = message.trim().toLowerCase().replace(/[.!]+$/, '');
    return normalized === 'permission denied' ||
      normalized === 'ble permission denied';
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

  private clearDiscoveredServices(): void {
    this.discoveredServicesValue = [];
    this.discoveredServicesDeviceIdValue = null;
  }

  private copyDiscoveredServices(
    services: readonly DiscoveredBleService[],
  ): DiscoveredBleService[] {
    return services.map((service) => ({
      ...service,
      characteristics: service.characteristics.map((characteristic) => ({
        ...characteristic,
        properties: { ...characteristic.properties },
        descriptors: characteristic.descriptors.map((descriptor) => ({
          ...descriptor,
        })),
      })),
    }));
  }
}
