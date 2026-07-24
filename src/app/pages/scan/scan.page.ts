import { Component, NgZone, OnDestroy, inject } from '@angular/core';
import {
  BleService as DiscoveredBleService,
  ScanResult,
} from '@capacitor-community/bluetooth-le';
import { Subscription } from 'rxjs';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import {
  BleDisconnectionEvent,
  BleService,
} from '../../core/services/ble';
import {
  BLE_UUIDS,
  MotorStateFrame,
  ProductDetection,
  SecondaryBleProfile,
  VersionIdentification,
} from '../../core/services/product-detection';

interface ScannedDevice {
  deviceId: string;
  name: string;
  rssi: number | null;
}

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class ScanPage implements OnDestroy {
  private readonly bleService = inject(BleService);
  private readonly ngZone = inject(NgZone);
  private readonly productDetection = inject(ProductDetection);
  private readonly disconnectionSubscription: Subscription;
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private detectedSecondaryProfile: SecondaryBleProfile = 'Inconnu';

  devices: ScannedDevice[] = [];
  connectedDeviceId: string | null = null;
  connectionError: string | null = null;
  connecting = false;
  discoveringServices = false;
  discoveryError: string | null = null;
  errorMessage: string | null = null;
  hasScanned = false;
  identification: VersionIdentification | null = null;
  identificationError: string | null = null;
  lastMotorStateReceivedAt: string | null = null;
  motorNotificationCount = 0;
  motorNotificationError: string | null = null;
  motorState: MotorStateFrame | null = null;
  readingIdentification = false;
  scanning = false;
  secondaryProfile = 'Inconnu';
  services: DiscoveredBleService[] = [];
  selectedDeviceId: string | null = null;
  subscribingMotorState = false;

  constructor() {
    this.disconnectionSubscription = this.bleService.disconnections$.subscribe(
      (event: BleDisconnectionEvent) => {
        this.ngZone.run(() => this.handleDisconnection(event));
      },
    );
  }

  get selectedDevice(): ScannedDevice | null {
    return this.devices.find(
      ({ deviceId }) => deviceId === this.selectedDeviceId,
    ) ?? null;
  }

  async startScan(): Promise<void> {
    if (this.scanning || this.connecting || this.connectedDeviceId !== null) {
      return;
    }

    this.clearScanTimeout();
    this.devices = [];
    this.selectedDeviceId = null;
    this.errorMessage = null;
    this.hasScanned = true;
    this.scanning = true;

    try {
      const bluetoothEnabled = await this.bleService.isBluetoothEnabled();

      if (!bluetoothEnabled) {
        await this.bleService.requestBluetoothEnable();
      }

      if (!(await this.bleService.isBluetoothEnabled())) {
        throw new Error('Le Bluetooth doit être activé pour lancer le scan.');
      }

      if (this.destroyed) {
        return;
      }

      await this.bleService.startScan((result: ScanResult) => {
        this.ngZone.run(() => this.updateDevice(result));
      });

      if (this.destroyed) {
        await this.bleService.stopScan();
        return;
      }

      this.scanTimeout = setTimeout(() => {
        void this.stopScan();
      }, 10_000);
    } catch (error: unknown) {
      this.scanning = false;
      this.clearScanTimeout();
      this.errorMessage = this.toErrorMessage(error);
    }
  }

  async stopScan(): Promise<void> {
    this.clearScanTimeout();

    if (!this.scanning && !this.bleService.isScanning()) {
      return;
    }

    this.scanning = false;

    try {
      await this.bleService.stopScan();
    } catch (error: unknown) {
      if (!this.destroyed) {
        this.errorMessage = this.toErrorMessage(error);
      }
    }
  }

  selectDevice(device: ScannedDevice): void {
    if (!this.connecting) {
      this.selectedDeviceId = device.deviceId;
      this.connectionError = null;
    }
  }

  async connectSelectedDevice(): Promise<void> {
    const device = this.selectedDevice;

    if (device === null || this.connecting) {
      return;
    }

    this.connectionError = null;
    this.discoveryError = null;
    this.clearMotorState();
    this.clearIdentification();
    this.services = [];
    this.connecting = true;

    try {
      await this.stopScan();
      await this.bleService.connect(device.deviceId);
      this.connectedDeviceId = this.bleService.connectedDeviceId;
      this.connecting = false;
      await this.loadServices(device.deviceId);
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : String(error);
      this.connectionError = details
        ? `Impossible de se connecter : ${details}`
        : 'Impossible de se connecter à cet appareil.';
    } finally {
      this.connecting = false;
    }
  }

  ngOnDestroy(): void {
    const connectedDeviceId = this.connectedDeviceId;
    this.destroyed = true;
    this.scanning = false;
    this.clearScanTimeout();
    this.disconnectionSubscription.unsubscribe();
    void this.bleService.stopScan().catch(() => undefined);
    if (connectedDeviceId !== null) {
      void this.stopMotorStateNotifications(connectedDeviceId);
    }
  }

  private handleDisconnection(event: BleDisconnectionEvent): void {
    if (this.destroyed || this.connectedDeviceId !== event.deviceId) {
      return;
    }

    this.connectedDeviceId = null;
    this.connecting = false;
    this.discoveringServices = false;
    this.discoveryError = null;
    this.clearMotorState();
    this.clearIdentification();
    this.services = [];

    if (event.reason === 'remote') {
      this.connectionError = 'Connexion perdue avec l’appareil.';
    }
  }

  private async loadServices(deviceId: string): Promise<void> {
    this.discoveringServices = true;
    this.discoveryError = null;

    try {
      const services = await this.bleService.discoverServices(deviceId);

      if (!this.destroyed && this.connectedDeviceId === deviceId) {
        this.services = services;
        this.detectedSecondaryProfile =
          this.productDetection.detectSecondaryProfile(services);
        this.secondaryProfile = this.detectedSecondaryProfile;
        await this.loadIdentification(deviceId, services);
      }
    } catch (error: unknown) {
      if (!this.destroyed && this.connectedDeviceId === deviceId) {
        const details = error instanceof Error ? error.message : String(error);
        this.discoveryError = details
          ? `Impossible de découvrir les services BLE : ${details}`
          : 'Impossible de découvrir les services BLE.';
      }
    } finally {
      if (!this.destroyed && this.connectedDeviceId === deviceId) {
        this.discoveringServices = false;
      }
    }
  }

  private async loadIdentification(
    deviceId: string,
    services: readonly DiscoveredBleService[],
  ): Promise<void> {
    const versionCharacteristicExists = services.some(
      (service) =>
        this.normalizeUuid(service.uuid) === BLE_UUIDS.shdoService &&
        service.characteristics.some(
          ({ uuid }) =>
            this.normalizeUuid(uuid) === BLE_UUIDS.versionCharacteristic,
        ),
    );

    if (!versionCharacteristicExists) {
      this.identificationError =
        'La caractéristique du mot de version BLE est absente.';
      return;
    }

    this.readingIdentification = true;
    this.identificationError = null;

    try {
      const value = await this.bleService.readCharacteristic(
        BLE_UUIDS.shdoService,
        BLE_UUIDS.versionCharacteristic,
        deviceId,
      );

      if (!this.destroyed && this.connectedDeviceId === deviceId) {
        const identification = this.productDetection.interpretVersion(
          value,
          this.selectedDevice?.name,
          this.detectedSecondaryProfile,
        );
        this.identification = identification;
        this.secondaryProfile =
          `${this.detectedSecondaryProfile} — ` +
          `${identification.detectionReason} ` +
          `(confiance ${identification.detectionConfidence.toLowerCase()})`;
        await this.startMotorStateNotifications(deviceId, services);
      }
    } catch (error: unknown) {
      if (!this.destroyed && this.connectedDeviceId === deviceId) {
        const details = error instanceof Error ? error.message : String(error);
        this.identificationError = details
          ? `Impossible de lire l’identification BLE : ${details}`
          : 'Impossible de lire l’identification BLE.';
      }
    } finally {
      if (!this.destroyed && this.connectedDeviceId === deviceId) {
        this.readingIdentification = false;
      }
    }
  }

  private async startMotorStateNotifications(
    deviceId: string,
    services: readonly DiscoveredBleService[],
  ): Promise<void> {
    const motorStateCharacteristic = services
      .find(
        ({ uuid }) => this.normalizeUuid(uuid) === BLE_UUIDS.shdoService,
      )
      ?.characteristics.find(
        ({ uuid }) =>
          this.normalizeUuid(uuid) === BLE_UUIDS.motorStateCharacteristic,
      );

    if (motorStateCharacteristic === undefined) {
      this.motorNotificationError =
        'La caractéristique d’état moteur BLE est absente.';
      return;
    }

    if (!motorStateCharacteristic.properties.notify) {
      this.motorNotificationError =
        'La caractéristique d’état moteur ne supporte pas les notifications.';
      return;
    }

    this.subscribingMotorState = true;
    this.motorNotificationError = null;

    try {
      await this.bleService.startNotifications(
        BLE_UUIDS.shdoService,
        BLE_UUIDS.motorStateCharacteristic,
        (value: DataView) => {
          this.ngZone.run(() => {
            if (!this.destroyed && this.connectedDeviceId === deviceId) {
              this.motorState =
                this.productDetection.interpretMotorState(value);
              this.motorNotificationCount += 1;
              this.lastMotorStateReceivedAt =
                new Date().toLocaleTimeString();
            }
          });
        },
        deviceId,
      );
    } catch (error: unknown) {
      if (!this.destroyed && this.connectedDeviceId === deviceId) {
        const details = error instanceof Error ? error.message : String(error);
        this.motorNotificationError = details
          ? `Impossible de s’abonner à l’état moteur : ${details}`
          : 'Impossible de s’abonner à l’état moteur.';
      }
    } finally {
      if (!this.destroyed && this.connectedDeviceId === deviceId) {
        this.subscribingMotorState = false;
      }
    }
  }

  private async stopMotorStateNotifications(deviceId: string): Promise<void> {
    try {
      await this.bleService.stopNotifications(
        BLE_UUIDS.shdoService,
        BLE_UUIDS.motorStateCharacteristic,
        deviceId,
      );
    } catch {
      // BleService also clears native subscriptions on disconnection.
    }
  }

  private updateDevice(result: ScanResult): void {
    if (this.destroyed) {
      return;
    }

    const name = result.device.name?.trim() || 'Appareil sans nom';
    const device: ScannedDevice = {
      deviceId: result.device.deviceId,
      name,
      rssi: result.rssi ?? null,
    };
    const existingIndex = this.devices.findIndex(
      ({ deviceId }) => deviceId === device.deviceId,
    );

    if (existingIndex === -1) {
      this.devices = [...this.devices, device];
      return;
    }

    this.devices = this.devices.map((existingDevice, index) =>
      index === existingIndex ? device : existingDevice,
    );
  }

  private clearScanTimeout(): void {
    if (this.scanTimeout !== null) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }

  private clearIdentification(): void {
    this.identification = null;
    this.identificationError = null;
    this.readingIdentification = false;
    this.detectedSecondaryProfile = 'Inconnu';
    this.secondaryProfile = 'Inconnu';
  }

  private clearMotorState(): void {
    this.lastMotorStateReceivedAt = null;
    this.motorNotificationCount = 0;
    this.motorNotificationError = null;
    this.motorState = null;
    this.subscribingMotorState = false;
  }

  private normalizeUuid(uuid: string): string {
    return uuid.trim().toLowerCase();
  }

  private toErrorMessage(error: unknown): string {
    const details = error instanceof Error ? error.message : String(error);
    return details
      ? `Impossible d’effectuer le scan BLE : ${details}`
      : 'Impossible d’effectuer le scan BLE.';
  }
}
