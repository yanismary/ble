import { NgTemplateOutlet } from '@angular/common';
import { Component, NgZone, OnDestroy, inject } from '@angular/core';
import {
  BleService as DiscoveredBleService,
  ScanResult,
} from '@capacitor-community/bluetooth-le';
import { Subscription } from 'rxjs';
import {
  AlertController,
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
  BleGattCharacteristicProperties,
  BleService,
} from '../../core/services/ble';
import {
  BLE_UUIDS,
  mapDetectionResultToProductProfile,
  MotorStateFrame,
  ProductDetection,
  SecondaryBleProfile,
  VersionIdentification,
} from '../../core/services/product-detection';
import { ProductProfile } from '../../core/services/ble-profile-catalog';
import {
  MotorCommandConfirmation,
  PositionConfirmationProfile,
} from '../../core/services/motor-command-confirmation';
import {
  MotorCommandService,
} from '../../core/services/motor-command.service';
import {
  KnownProductProfile,
  ProductDataLoadResult,
  ProductDataLoadService,
  ProductDataLoadStatus,
} from '../../core/services/product-data-load.service';
import {
  BleProfessionalParameters,
  BleSoftwareVersion,
  BleStackVersion,
  HistoricalBleDate,
  UserPeripheralFlags,
} from '../../core/services/ble-read-decoders';
import { BleReadStatus } from '../../core/services/ble-read.service';
import { SCAN_MOTOR_TEST_TEXT } from './scan-motor-test.text';
import { SCAN_PRODUCT_READ_TEXT } from './scan-product-read.text';

interface ScannedDevice {
  deviceId: string;
  name: string;
  rssi: number | null;
}

type MotorTestStatus =
  | 'idle'
  | 'awaiting-confirmation'
  | 'confirmed'
  | 'timeout'
  | 'disconnected'
  | 'failed';

interface MotorCommandAvailability {
  readonly enabled: boolean;
  readonly reason: string;
}

interface ProductReadAvailability {
  readonly enabled: boolean;
  readonly reason: string;
}

interface ProductReadSummary {
  readonly success: number;
  readonly invalid: number;
  readonly unavailable: number;
  readonly failed: number;
}

interface MotorStateSource {
  readonly deviceId: string;
  readonly serviceUuid: string;
  readonly characteristicUuid: string;
}

interface MotorNotificationDiagnostic {
  readonly sequence: number;
  readonly receivedAt: string;
  readonly frame: MotorStateFrame;
  readonly positionDelta: number | null;
}

const MOTOR_DIAGNOSTIC_HISTORY_LIMIT = 20;

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
    NgTemplateOutlet,
  ],
})
export class ScanPage implements OnDestroy {
  private readonly bleService = inject(BleService);
  private readonly alertController = inject(AlertController);
  private readonly motorCommandService = inject(MotorCommandService);
  private readonly ngZone = inject(NgZone);
  private readonly productDetection = inject(ProductDetection);
  private readonly productDataLoadService = inject(ProductDataLoadService);
  private readonly disconnectionSubscription: Subscription;
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private detectedSecondaryProfile: SecondaryBleProfile = 'Inconnu';
  private connectionGeneration = 0;
  private motorCommandInProgress = false;
  private motorConfirmationAlertOpen = false;
  private productReadCycle = 0;
  private productReadInProgress = false;
  private connectedBleGeneration: number | null = null;

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
  motorNotificationHistory: MotorNotificationDiagnostic[] = [];
  motorStateNotificationsActive = false;
  motorState: MotorStateFrame | null = null;
  motorStateSource: MotorStateSource | null = null;
  motorTestFailureReason: string | null = null;
  motorTestResult: MotorCommandConfirmation | null = null;
  motorTestStatus: MotorTestStatus = 'idle';
  readonly motorTestText = SCAN_MOTOR_TEST_TEXT;
  readonly productReadText = SCAN_PRODUCT_READ_TEXT;
  productReadResult: ProductDataLoadResult | null = null;
  productReadStatus: 'idle' | 'loading' | ProductDataLoadStatus = 'idle';
  productProfile: ProductProfile = 'unknown';
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

  get showMotorTestPanel(): boolean {
    return this.connectedDeviceId !== null &&
      this.bleService.connectedDeviceId === this.connectedDeviceId &&
      !this.scanning &&
      !this.discoveringServices &&
      !this.readingIdentification &&
      this.services.length > 0 &&
      this.identification !== null &&
      this.isKnownProductProfile(this.productProfile);
  }

  get showProductReadPanel(): boolean {
    return this.connectedDeviceId !== null &&
      this.bleService.connectedDeviceId === this.connectedDeviceId &&
      this.connectedBleGeneration === this.bleService.connectionGeneration &&
      !this.scanning &&
      !this.discoveringServices &&
      !this.readingIdentification &&
      this.services.length > 0 &&
      this.identification !== null &&
      this.isKnownProductProfile(this.productProfile);
  }

  get showHistoricalGattDiagnostic(): boolean {
    return this.showProductReadPanel && this.productProfile === 'widoor';
  }

  get historicalGattDiagnostic(): BleGattCharacteristicProperties {
    return this.bleService.getGattCharacteristicProperties(
      BLE_UUIDS.shdoService,
      BLE_UUIDS.completeParametersCharacteristic,
      this.connectedDeviceId ?? undefined,
    );
  }

  get historicalGattRawProperties(): readonly [string, boolean][] {
    return Object.entries(this.historicalGattDiagnostic.rawProperties);
  }

  get productReadAvailability(): ProductReadAvailability {
    if (this.connectedDeviceId === null ||
        this.bleService.connectedDeviceId !== this.connectedDeviceId) {
      return this.productReadUnavailable(
        this.productReadText.disconnected,
      );
    }
    if (this.connectedBleGeneration !==
        this.bleService.connectionGeneration) {
      return this.productReadUnavailable(this.productReadText.staleContext);
    }
    if (this.scanning) {
      return this.productReadUnavailable(this.productReadText.scanInProgress);
    }
    if (!this.showProductReadPanel) {
      return this.productReadUnavailable(
        this.productReadText.detectionInProgress,
      );
    }
    if (this.productReadInProgress ||
        this.productDataLoadService.isLoading ||
        this.bleService.isWriting ||
        this.motorCommandInProgress) {
      return this.productReadUnavailable(
        this.productReadText.operationInProgress,
      );
    }
    return { enabled: true, reason: this.productReadText.ready };
  }

  get productReadSummary(): ProductReadSummary {
    const values = Object.values(this.productReadResult?.results ?? {});
    return {
      success: values.filter(({ status }) => status === 'success').length,
      invalid: values.filter(
        ({ status }) => status === 'invalid-frame',
      ).length,
      unavailable: values.filter(
        ({ status }) => status === 'unavailable',
      ).length,
      failed: values.filter(({ status }) => status === 'failed').length,
    };
  }

  get isProductReadLoading(): boolean {
    return this.productReadInProgress;
  }

  get motorCommandAvailability(): MotorCommandAvailability {
    if (this.connectedDeviceId === null ||
        this.bleService.connectedDeviceId !== this.connectedDeviceId) {
      return this.unavailable(this.motorTestText.disconnected);
    }
    if (this.scanning) {
      return this.unavailable(this.motorTestText.scanning);
    }
    if (!this.isKnownProductProfile(this.productProfile)) {
      return this.unavailable(this.motorTestText.unconfirmedProfile);
    }
    if (!this.showMotorTestPanel) {
      return this.unavailable(this.motorTestText.detectionInProgress);
    }
    if (!this.motorStateNotificationsActive ||
        !this.hasMotorStateNotificationTarget()) {
      return this.unavailable(
        this.motorTestText.waitingMotorStateSubscription,
      );
    }
    if (this.motorCommandInProgress ||
        this.motorConfirmationAlertOpen ||
        this.bleService.isWriting) {
      return this.unavailable(this.motorTestText.commandInProgress);
    }
    if (this.productProfile === 'widoor') {
      return {
        enabled: true,
        reason: this.motorTestText.ready,
      };
    }
    if (this.motorState === null || !this.hasCurrentMotorStateSource()) {
      return this.unavailable(this.motorTestText.waitingFirstState);
    }
    const currentPosition = this.motorState.currentPosition;
    const maximumPosition = this.motorState.maximumPosition;
    if (currentPosition === null ||
        maximumPosition === null ||
        !Number.isFinite(currentPosition) ||
        !Number.isFinite(maximumPosition) ||
        currentPosition < 0 ||
        maximumPosition <= 0 ||
        currentPosition > maximumPosition) {
      return this.unavailable(this.motorTestText.invalidPosition);
    }
    if (currentPosition >= maximumPosition) {
      return this.unavailable(this.motorTestText.alreadyOpen);
    }
    return {
      enabled: true,
      reason: this.motorTestText.ready,
    };
  }

  get motorConfirmationDurationMs(): number | null {
    const result = this.motorTestResult;
    return result?.confirmedAt !== null &&
      result?.confirmedAt !== undefined &&
      result.sentAt > 0
      ? result.confirmedAt - result.sentAt
      : null;
  }

  get isWidoorProfile(): boolean {
    return this.productProfile === 'widoor';
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
    this.connectionGeneration += 1;
    this.resetProductRead(true);
    this.resetMotorTest();
    this.clearMotorState();
    this.clearIdentification();
    this.services = [];
    this.connecting = true;

    try {
      await this.stopScan();
      await this.bleService.connect(device.deviceId);
      this.connectedDeviceId = this.bleService.connectedDeviceId;
      this.connectedBleGeneration = this.bleService.connectionGeneration;
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

  async requestOpenMotorTest(): Promise<void> {
    if (!this.motorCommandAvailability.enabled ||
        this.motorConfirmationAlertOpen) {
      return;
    }

    const deviceId = this.connectedDeviceId;
    const connectionGeneration = this.connectionGeneration;
    const state = this.motorState;
    if (deviceId === null) {
      return;
    }

    const deviceName = this.selectedDevice?.name ??
      this.motorTestText.unknownDeviceName;
    const details = this.productProfile === 'widoor'
      ? [
          this.motorTestText.widoorNoPosition,
          this.motorTestText.widoorExpectedConfirmation,
        ]
      : state?.currentPosition !== null &&
        state?.currentPosition !== undefined &&
        state.maximumPosition !== null
        ? [
            `${this.motorTestText.currentPosition} : ` +
              `${state.currentPosition}`,
            `${this.motorTestText.maximumPosition} : ` +
              `${state.maximumPosition}`,
          ]
        : [];
    this.motorConfirmationAlertOpen = true;
    try {
      const alert = await this.alertController.create({
        header: this.motorTestText.confirmTitle,
        message: [
          `${this.motorTestText.confirmMessage}`,
          `${this.motorTestText.profile} : ${this.productProfile}`,
          `${this.motorTestText.deviceName} : ` +
            `${this.escapeAlertText(deviceName)}`,
          ...details,
        ].join('<br>'),
        buttons: [
          {
            text: this.motorTestText.cancel,
            role: 'cancel',
          },
          {
            text: this.motorTestText.open,
            role: 'confirm',
            handler: () => {
              this.motorConfirmationAlertOpen = false;
              void this.executeOpenMotorTest(
                deviceId,
                connectionGeneration,
              );
            },
          },
        ],
      });
      await alert.present();
      await alert.onDidDismiss();
    } finally {
      this.motorConfirmationAlertOpen = false;
    }
  }

  resetMotorTest(): void {
    if (this.motorCommandInProgress) {
      return;
    }
    this.motorTestFailureReason = null;
    this.motorTestResult = null;
    this.motorTestStatus = 'idle';
  }

  async loadProductInformation(): Promise<void> {
    if (!this.productReadAvailability.enabled ||
        this.productReadInProgress ||
        this.connectedDeviceId === null ||
        !this.isKnownProductProfile(this.productProfile)) {
      return;
    }

    const deviceId = this.connectedDeviceId;
    const profile = this.productProfile;
    const nativeGeneration = this.bleService.connectionGeneration;
    const cycle = ++this.productReadCycle;
    this.productReadInProgress = true;
    this.productReadStatus = 'loading';
    this.productReadResult = null;

    try {
      const result = await this.productDataLoadService.loadProductData(
        profile,
        deviceId,
      );
      if (!this.isCurrentProductRead(
        cycle,
        deviceId,
        nativeGeneration,
        profile,
      )) {
        return;
      }
      this.productReadResult = result;
      this.productReadStatus = result.status;
    } finally {
      if (cycle === this.productReadCycle) {
        this.productReadInProgress = false;
        if (this.productReadStatus === 'loading') {
          this.productReadStatus = 'idle';
        }
      }
    }
  }

  cancelProductInformationLoad(): void {
    if (this.productReadInProgress) {
      this.productDataLoadService.cancelCurrentLoad();
    }
  }

  ngOnDestroy(): void {
    const connectedDeviceId = this.connectedDeviceId;
    this.destroyed = true;
    this.resetProductRead(true);
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

    const commandWasActive = this.motorCommandInProgress;
    this.connectionGeneration += 1;
    this.resetProductRead(true);
    this.connectedDeviceId = null;
    this.connectedBleGeneration = null;
    this.connecting = false;
    this.discoveringServices = false;
    this.discoveryError = null;
    this.clearMotorState();
    this.clearIdentification();
    this.services = [];
    this.motorTestStatus = commandWasActive ? 'disconnected' : 'idle';

    if (event.reason === 'remote') {
      this.connectionError = 'Connexion perdue avec l’appareil.';
    }
  }

  private async executeOpenMotorTest(
    expectedDeviceId: string,
    expectedConnectionGeneration: number,
  ): Promise<void> {
    if (this.motorCommandInProgress) {
      return;
    }

    const availability = this.motorCommandAvailability;
    const deviceId = this.connectedDeviceId;
    const state = this.motorState;
    if (expectedConnectionGeneration !== this.connectionGeneration) {
      return;
    }
    if (!availability.enabled ||
        deviceId === null ||
        deviceId !== expectedDeviceId ||
        !this.isKnownProductProfile(this.productProfile)) {
      this.motorTestStatus = 'failed';
      this.motorTestFailureReason = deviceId !== expectedDeviceId
        ? this.motorTestText.deviceChanged
        : availability.reason;
      return;
    }

    const profile = this.productProfile;
    this.motorCommandInProgress = true;
    this.motorTestStatus = 'awaiting-confirmation';
    this.motorTestFailureReason = null;
    this.motorTestResult = null;

    try {
      const result =
        profile === 'widoor'
          ? await this.motorCommandService.sendMotorCommandWithConfirmation({
              profile,
              command: 'OPEN',
              deviceId,
            })
          : this.isPositionConfirmationProfile(profile) &&
            state !== null &&
            state.currentPosition !== null &&
            state.maximumPosition !== null
            ? await this.motorCommandService.sendMotorCommandWithConfirmation({
                profile,
                command: 'OPEN',
                baselinePosition: state.currentPosition,
                baselineMaximumPosition: state.maximumPosition,
                deviceId,
              })
            : null;
      if (result === null) {
        this.motorTestStatus = 'failed';
        this.motorTestFailureReason = this.motorTestText.invalidPosition;
        return;
      }
      if (expectedConnectionGeneration !== this.connectionGeneration ||
          this.connectedDeviceId !== deviceId) {
        return;
      }
      this.motorTestResult = result;
      this.motorTestStatus = result.status === 'pending'
        ? 'awaiting-confirmation'
        : result.status;
      this.motorTestFailureReason = result.status === 'failed'
        ? result.failureReason
        : null;
    } catch (error: unknown) {
      if (expectedConnectionGeneration === this.connectionGeneration &&
          this.connectedDeviceId === deviceId) {
        this.motorTestStatus = 'failed';
        this.motorTestFailureReason =
          error instanceof Error ? error.message : String(error);
      }
    } finally {
      this.motorCommandInProgress = false;
      if (this.connectedDeviceId !== null &&
          (expectedConnectionGeneration !== this.connectionGeneration ||
           this.connectedDeviceId !== deviceId)) {
        this.motorTestFailureReason = null;
        this.motorTestResult = null;
        this.motorTestStatus = 'idle';
      }
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
        this.productProfile =
          mapDetectionResultToProductProfile(identification);
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
    this.motorStateNotificationsActive = false;
    this.motorNotificationError = null;

    try {
      await this.bleService.startNotifications(
        BLE_UUIDS.shdoService,
        BLE_UUIDS.motorStateCharacteristic,
        (value: DataView) => {
          this.ngZone.run(() => {
            if (!this.destroyed && this.connectedDeviceId === deviceId) {
              const frame = this.productDetection.interpretMotorState(value);
              const previousFrame =
                this.motorNotificationHistory[
                  this.motorNotificationHistory.length - 1
                ]?.frame ?? null;
              const positionDelta = frame.currentPosition !== null &&
                previousFrame?.currentPosition !== null &&
                previousFrame?.currentPosition !== undefined
                ? frame.currentPosition - previousFrame.currentPosition
                : null;
              const receivedAt = new Date().toLocaleTimeString();
              const sequence = this.motorNotificationCount + 1;
              this.motorState = frame;
              this.motorStateSource = {
                deviceId,
                serviceUuid: BLE_UUIDS.shdoService,
                characteristicUuid: BLE_UUIDS.motorStateCharacteristic,
              };
              this.motorNotificationCount = sequence;
              this.lastMotorStateReceivedAt = receivedAt;
              this.motorNotificationHistory = [
                ...this.motorNotificationHistory,
                { sequence, receivedAt, frame, positionDelta },
              ].slice(-MOTOR_DIAGNOSTIC_HISTORY_LIMIT);
            }
          });
        },
        deviceId,
      );
      if (!this.destroyed && this.connectedDeviceId === deviceId) {
        this.motorStateNotificationsActive = true;
      }
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
    this.productProfile = 'unknown';
    this.detectedSecondaryProfile = 'Inconnu';
    this.secondaryProfile = 'Inconnu';
  }

  private clearMotorState(): void {
    this.lastMotorStateReceivedAt = null;
    this.motorNotificationCount = 0;
    this.motorNotificationHistory = [];
    this.motorNotificationError = null;
    this.motorState = null;
    this.motorStateSource = null;
    this.motorStateNotificationsActive = false;
    this.subscribingMotorState = false;
  }

  formatTimestamp(value: number): string {
    return new Date(value).toLocaleTimeString();
  }

  formatStackVersion(value: BleStackVersion): string {
    return `${value.major}.${value.minor}.${value.patch}.${value.build}`;
  }

  formatSoftwareVersion(value: BleSoftwareVersion): string {
    return `${value.major}.${value.minor}.${value.patch}.` +
      `${value.specification}`;
  }

  formatHistoricalDate(value: HistoricalBleDate): string {
    if (value.status === 'not-initialized') {
      return this.productReadText.notInitialized;
    }
    if (
      value.status === 'invalid'
      || value.day === null
      || value.month === null
      || value.year === null
    ) {
      return value.invalidReason === 'zero-date'
        ? this.productReadText.notInitialized
        : this.productReadText.invalidDate;
    }

    return [
      value.day.toString().padStart(2, '0'),
      value.month.toString().padStart(2, '0'),
      value.year.toString().padStart(4, '0'),
    ].join('/');
  }

  formatBytes(values: readonly number[]): string {
    return values.map((value) =>
      value.toString(16).padStart(2, '0'),
    ).join(' ');
  }

  formatGattCapability(value: boolean | null): string {
    return value === null
      ? this.productReadText.unknown
      : value
        ? this.productReadText.yes
        : this.productReadText.no;
  }

  formatPeripheralBytes(first: number, second: number): string {
    return this.formatBytes([first, second]);
  }

  formatPeripheralFlags(value: UserPeripheralFlags): string {
    const labels = this.productReadText.peripheralFlagLabels;
    return `${labels.dynamicLight}=${value.dynamicLight}, ` +
      `${labels.staticLight}=${value.staticLight}, ` +
      `${labels.light1}=${value.light1}, ` +
      `${labels.light2}=${value.light2}, ` +
      `${labels.rgbIndicator}=${value.rgbIndicator}`;
  }

  productReadStatusLabel(
    status: ProductDataLoadStatus | BleReadStatus,
  ): string {
    return this.productReadText.status[status];
  }

  isWidoorProfessionalParameters(
    value: BleProfessionalParameters,
  ): value is Extract<BleProfessionalParameters, { profile: 'widoor' }> {
    return value.profile === 'widoor';
  }

  private resetProductRead(cancelActive: boolean): void {
    if (cancelActive && this.productDataLoadService.isLoading) {
      this.productDataLoadService.cancelCurrentLoad();
    }
    this.productReadCycle += 1;
    this.productReadInProgress = false;
    this.productReadResult = null;
    this.productReadStatus = 'idle';
  }

  private isCurrentProductRead(
    cycle: number,
    deviceId: string,
    nativeGeneration: number,
    profile: ProductProfile,
  ): boolean {
    return !this.destroyed &&
      cycle === this.productReadCycle &&
      this.connectedDeviceId === deviceId &&
      this.bleService.connectedDeviceId === deviceId &&
      this.connectedBleGeneration === nativeGeneration &&
      this.bleService.connectionGeneration === nativeGeneration &&
      this.productProfile === profile;
  }

  private productReadUnavailable(reason: string): ProductReadAvailability {
    return { enabled: false, reason };
  }

  private isKnownProductProfile(
    profile: ProductProfile,
  ): profile is KnownProductProfile {
    return profile !== 'unknown' && profile !== 'ambiguous';
  }

  private isPositionConfirmationProfile(
    profile: ProductProfile,
  ): profile is PositionConfirmationProfile {
    return profile === 'moventiv-60' ||
      profile === 'moventiv-80' ||
      profile === 'garline';
  }

  private hasCurrentMotorStateSource(): boolean {
    const source = this.motorStateSource;
    return source !== null &&
      source.deviceId === this.connectedDeviceId &&
      this.normalizeUuid(source.serviceUuid) === BLE_UUIDS.shdoService &&
      this.normalizeUuid(source.characteristicUuid) ===
        BLE_UUIDS.motorStateCharacteristic;
  }

  private hasMotorStateNotificationTarget(): boolean {
    return this.services.some(
      ({ uuid, characteristics }) =>
        this.normalizeUuid(uuid) === BLE_UUIDS.shdoService &&
        characteristics.some(
          ({ uuid: characteristicUuid, properties }) =>
            this.normalizeUuid(characteristicUuid) ===
              BLE_UUIDS.motorStateCharacteristic &&
            properties.notify,
        ),
    );
  }

  private escapeAlertText(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private unavailable(reason: string): MotorCommandAvailability {
    return { enabled: false, reason };
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
