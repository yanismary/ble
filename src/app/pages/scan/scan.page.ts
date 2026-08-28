import { Component, NgZone, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { addIcons } from 'ionicons';
import { search } from 'ionicons/icons';
import {
  BleService as DiscoveredBleService,
  ScanResult,
} from '@capacitor-community/bluetooth-le';
import { Subscription } from 'rxjs';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRouterOutlet,
  IonSpinner,
  IonTitle,
  IonToolbar,
  Platform,
  ToastController,
} from '@ionic/angular/standalone';

import {
  BleDisconnectionEvent,
  BleGattCharacteristicProperties,
  BleOperationError,
  BleOperationErrorCode,
  BleService,
  isBleOperationError,
} from '../../core/services/ble';
import {
  BLE_UUIDS,
  mapDetectionResultToProductProfile,
  MotorStateFrame,
  ProductDetection,
  SecondaryBleProfile,
  VersionIdentification,
} from '../../core/services/product-detection';
import {
  BLE_SCAN_SERVICE_UUIDS,
  ProductProfile,
} from '../../core/services/ble-profile-catalog';
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
import {
  readAutoEnableBluetooth,
  readShowBleIdentifier,
} from '../../core/services/app-preferences';
import {
  readRoomCacheEntry,
} from '../../core/services/app-room-cache';
import {
  ProductExitStateService,
} from '../../core/services/product-exit-state.service';
import {
  currentAppLanguage,
  readStoredAppLanguage,
} from '../../core/services/app-language';
import {
  AppMainMenuComponent,
} from '../../shared/app-main-menu/app-main-menu.component';
import {
  PRODUCT_PAGE_CONFIG,
} from '../product/product-page.config';
import { PRODUCT_PAGE_TEXT } from '../product/product-page.text';
import {
  ProductPageNavigationState,
} from '../product/product-view.model';
import {
  PRODUCT_DEMO_CHOICES,
  ProductDemoProfile,
  createProductDemoNavigationState,
  productDemoTextFor,
} from '../product/product-demo';
import {
  getBleSignalQualityAsset,
  getScanRoomIconClass,
  splitScanDisplayName,
} from './scan-page-ui';
import {
  isTutorialFreshScanNavigation,
  withoutTutorialFreshScanNavigation,
} from
  '../tutorial/tutorial-navigation';
import {
  ScanBluetoothText,
  scanBluetoothTextFor,
} from './scan-bluetooth.text';
import { scanLocationTextFor } from './scan-location.text';
import { scanPermissionTextFor } from './scan-permission.text';
import { scanErrorTextFor } from './scan-error.text';
import {
  scanProductConnectionTextFor,
} from './scan-product-connection.text';
import { scanSurfaceTextFor } from './scan-surface.text';
import { scanExitTextFor } from './scan-exit.text';

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

type ScanBleErrorAction =
  | 'retry-scan'
  | 'enable-bluetooth'
  | 'open-app-settings';

interface ScanBleErrorState {
  readonly code: BleOperationErrorCode | 'unknown';
  readonly message: string;
  readonly action: ScanBleErrorAction;
  readonly actionLabel: string;
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

type ProductConnectionFailure =
  | 'connection'
  | 'discovery'
  | 'identification'
  | 'unknown-product';

const MOTOR_DIAGNOSTIC_HISTORY_LIMIT = 20;
const PHASE1_SCAN_TIMEOUT_MS = 8_000;
const PHASE1_CONNECT_STABILIZATION_DELAY_MS = 400;
const PHASE1_POST_CONNECTION_STABILIZATION_DELAY_MS = 500;
const PHASE1_CONNECT_ATTEMPTS = 3;
const PHASE1_CONNECT_RETRY_DELAYS_MS = [500, 1_000] as const;
const PHASE1_BLUETOOTH_ENABLE_CHECK_DELAYS_MS = [400, 600, 800] as const;
const EXIT_SCAN_CLEANUP_TIMEOUT_MS = 1_000;

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
    IonTitle,
    IonToolbar,
    AppMainMenuComponent,
  ],
})
export class ScanPage implements OnDestroy {
  private readonly bleService = inject(BleService);
  private readonly alertController = inject(AlertController);
  private readonly motorCommandService = inject(MotorCommandService);
  private readonly ngZone = inject(NgZone);
  private readonly productDetection = inject(ProductDetection);
  private readonly productDataLoadService = inject(ProductDataLoadService);
  private readonly productExitState = inject(ProductExitStateService);
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly routerOutlet = inject(IonRouterOutlet, { optional: true });
  private readonly toastController = inject(ToastController);
  private readonly disconnectionSubscription: Subscription;
  private readonly bluetoothEnabledSubscription: Subscription;
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private detectedSecondaryProfile: SecondaryBleProfile = 'Inconnu';
  private connectionGeneration = 0;
  private motorCommandInProgress = false;
  private motorConfirmationAlertOpen = false;
  private productReadCycle = 0;
  private productReadInProgress = false;
  private connectedBleGeneration: number | null = null;
  private retryingConnection = false;
  private scanPreparationInProgress = false;
  private bluetoothDisabledAlertOpen = false;
  private bluetoothSettingsAlertOpen = false;
  private locationDisabledAlertOpen = false;
  private permissionDeniedCount = 0;
  private permissionSettingsAlertOpen = false;
  private permissionSettingsRequired = false;
  private bluetoothDisabledDuringScanInProgress = false;
  private rootBackButtonSubscription: Subscription | null = null;
  private exitConfirmationOpen = false;
  private exitingApplication = false;

  devices: ScannedDevice[] = [];
  connectedDeviceId: string | null = null;
  connectionError: string | null = null;
  connectionRetryDeviceId: string | null = null;
  serviceDiscoveryRetryDeviceId: string | null = null;
  serviceDiscoveryRetryGeneration: number | null = null;
  retryingServiceDiscovery = false;
  disconnectingAfterDiscoveryError = false;
  connecting = false;
  entryConnectionCleanupInProgress = false;
  bleRecoveryInProgress = false;
  discoveringServices = false;
  discoveryError: string | null = null;
  errorMessage: string | null = null;
  scanBleError: ScanBleErrorState | null = null;
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
  readonly productPageText = PRODUCT_PAGE_TEXT;
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
    addIcons({ search });
    this.disconnectionSubscription = this.bleService.disconnections$.subscribe(
      (event: BleDisconnectionEvent) => {
        this.ngZone.run(() => this.handleDisconnection(event));
      },
    );
    this.bluetoothEnabledSubscription =
      this.bleService.bluetoothEnabledChanges$.subscribe((enabled: boolean) => {
        if (!enabled) {
          this.ngZone.run(() => {
            void this.handleBluetoothDisabledDuringScan();
          });
        }
      });
  }

  async ionViewWillEnter(): Promise<void> {
    this.registerRootBackButton();
    const navigationState = this.router.getCurrentNavigation?.()?.extras.state ??
      globalThis.history?.state;
    if (isTutorialFreshScanNavigation(navigationState)) {
      this.devices = [];
      if (isTutorialFreshScanNavigation(globalThis.history?.state)) {
        globalThis.history.replaceState(
          withoutTutorialFreshScanNavigation(globalThis.history.state),
          '',
        );
      }
      return;
    }
    const productExit = this.productExitState.consume();
    if (productExit !== null) {
      this.resetAfterProductExit(productExit.disconnectStatus === 'success');
      if (productExit.disconnectStatus === 'success') {
        await this.presentDisconnectedToast();
      }
      return;
    }
    await this.disconnectExistingNativeConnectionForScanEntry();
  }

  ionViewWillLeave(): void {
    this.unregisterRootBackButton();
  }

  async openTutorial(): Promise<void> {
    await this.router.navigate(['/tutorial']);
  }

  async openHelp(): Promise<void> {
    await this.router.navigate(['/help']);
  }

  async openSettings(): Promise<void> {
    await this.router.navigate(['/settings']);
  }

  getScanDisplayName(device: ScannedDevice): string {
    const cachedName = readRoomCacheEntry(device.deviceId)?.name;
    return cachedName !== undefined && cachedName !== null
      ? cachedName
      : splitScanDisplayName(device.name).displayName || device.name;
  }

  async launchDemoMode(): Promise<void> {
    const text = productDemoTextFor(readStoredAppLanguage());
    const alert = await this.alertController.create({
      header: text.title,
      buttons: [
        ...PRODUCT_DEMO_CHOICES.map(({ profile }) => ({
          text: text.profileLabels[profile],
          handler: () => {
            void this.openDemoProduct(profile);
          },
        })),
        { text: text.cancel, role: 'cancel' },
      ],
    });
    await alert.present();
  }

  private async openDemoProduct(profile: ProductDemoProfile): Promise<void> {
    if (this.scanning || this.bleService.isScanning()) {
      await this.stopScan();
    }
    const state = createProductDemoNavigationState(
      profile,
      readStoredAppLanguage(),
    );
    await this.router.navigate([`/product/${profile}`], { state });
  }

  getScanRoomSuffix(device: ScannedDevice): string | null {
    const cachedSuffix = readRoomCacheEntry(device.deviceId)?.suffix;
    return cachedSuffix !== undefined && cachedSuffix !== null
      ? cachedSuffix || null
      : splitScanDisplayName(device.name).roomSuffix;
  }

  getScanRoomIconClass(device: ScannedDevice): string | null {
    return getScanRoomIconClass(this.getScanRoomSuffix(device));
  }

  getSignalQualityAsset(device: ScannedDevice): string {
    return getBleSignalQualityAsset(device.rssi);
  }

  get showBleIdentifier(): boolean {
    return readShowBleIdentifier();
  }

  get scanText() {
    return scanSurfaceTextFor(currentAppLanguage());
  }

  get bleIdentifierLabel(): string {
    return this.bleService.platform === 'ios'
      ? this.scanText.uuidAddress
      : this.scanText.macAddress;
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

  get canOpenProductPage(): boolean {
    return this.showProductReadPanel &&
      this.identification?.detectionConfidence === 'Forte' &&
      !this.productReadInProgress &&
      !this.productDataLoadService.isLoading &&
      !this.bleService.isWriting &&
      !this.motorCommandInProgress;
  }

  get canStartScan(): boolean {
    return !this.scanning &&
      !this.scanPreparationInProgress &&
      !this.connecting &&
      !this.bleRecoveryInProgress &&
      !this.entryConnectionCleanupInProgress &&
      this.connectedDeviceId === null;
  }

  get canRunScanBleErrorAction(): boolean {
    return this.scanBleError !== null &&
      !this.scanning &&
      !this.connecting &&
      !this.bleRecoveryInProgress &&
      !this.entryConnectionCleanupInProgress;
  }

  get canRetryConnection(): boolean {
    return this.connectionRetryDeviceId !== null &&
      this.selectedDeviceId === this.connectionRetryDeviceId &&
      !this.connecting &&
      !this.scanning &&
      !this.bleRecoveryInProgress &&
      !this.entryConnectionCleanupInProgress &&
      this.connectedDeviceId === null &&
      this.bleService.connectedDeviceId === null;
  }

  get canRetryServiceDiscovery(): boolean {
    const deviceId = this.serviceDiscoveryRetryDeviceId;
    const generation = this.serviceDiscoveryRetryGeneration;
    return this.discoveryError !== null &&
      deviceId !== null &&
      generation !== null &&
      this.selectedDeviceId === deviceId &&
      this.isCurrentBleConnection(deviceId, generation) &&
      !this.connecting &&
      !this.scanning &&
      !this.discoveringServices &&
      !this.readingIdentification &&
      !this.bleRecoveryInProgress &&
      !this.entryConnectionCleanupInProgress &&
      !this.disconnectingAfterDiscoveryError;
  }

  get canDisconnectAfterDiscoveryError(): boolean {
    const deviceId = this.serviceDiscoveryRetryDeviceId;
    const generation = this.serviceDiscoveryRetryGeneration;
    return this.discoveryError !== null &&
      deviceId !== null &&
      generation !== null &&
      this.selectedDeviceId === deviceId &&
      this.isCurrentBleConnection(deviceId, generation) &&
      !this.connecting &&
      !this.scanning &&
      !this.discoveringServices &&
      !this.readingIdentification &&
      !this.entryConnectionCleanupInProgress &&
      !this.disconnectingAfterDiscoveryError;
  }

  get connectionStatusLabel(): string {
    return this.retryingConnection
      ? 'Nouvelle tentative de connexion…'
      : 'Connexion en cours…';
  }

  get serviceDiscoveryStatusLabel(): string {
    return this.retryingServiceDiscovery
      ? 'Nouveau chargement des services…'
      : 'Découverte des services…';
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
    if (!this.canStartScan) {
      return;
    }

    if (this.bleService.connectedDeviceId !== null) {
      const disconnected =
        await this.disconnectExistingNativeConnectionForScanEntry();
      if (!disconnected) {
        return;
      }
      this.devices = [];
      await this.presentDisconnectedToast();
    }

    if (!this.canStartScan || this.bleService.connectedDeviceId !== null) {
      return;
    }

    if (this.permissionSettingsRequired) {
      await this.presentPermissionSettingsAlert(
        this.bleService.platform === 'android',
      );
      return;
    }

    this.scanPreparationInProgress = true;
    try {
      const bluetoothReady = await this.ensureBluetoothReadyForScan();

      if (!bluetoothReady || this.destroyed) {
        return;
      }

      const pendingResults: ScanResult[] = [];
      let scanAccepted = false;

      await this.bleService.startScan(
        (result: ScanResult) => {
          if (!scanAccepted) {
            pendingResults.push(result);
            return;
          }
          this.ngZone.run(() => this.updateDevice(result));
        },
        BLE_SCAN_SERVICE_UUIDS,
      );

      if (this.destroyed) {
        await this.bleService.stopScan();
        return;
      }

      this.resetPermissionDenialState();
      this.clearScanTimeout();
      this.devices = [];
      this.selectedDeviceId = null;
      this.errorMessage = null;
      this.scanBleError = null;
      this.hasScanned = true;
      this.scanning = true;
      scanAccepted = true;
      for (const result of pendingResults) {
        this.ngZone.run(() => this.updateDevice(result));
      }

      this.scanTimeout = setTimeout(() => {
        void this.stopScan();
      }, PHASE1_SCAN_TIMEOUT_MS);
    } catch (error: unknown) {
      if (!this.destroyed) {
        this.scanning = false;
        this.clearScanTimeout();
        if (await this.handlePermissionPrecheckError(error)) {
          return;
        }
        await this.handleScanStartError(error);
      }
    } finally {
      this.scanPreparationInProgress = false;
    }
  }

  async runScanBleErrorAction(): Promise<void> {
    const state = this.scanBleError;

    if (state === null || !this.canRunScanBleErrorAction) {
      return;
    }

    if (state.action === 'retry-scan') {
      await this.startScan();
      return;
    }

    this.bleRecoveryInProgress = true;
    try {
      if (state.action === 'enable-bluetooth') {
        await this.bleService.requestBluetoothEnable();
        if (this.destroyed) {
          return;
        }
        if (!(await this.bleService.isBluetoothEnabled())) {
          throw new BleOperationError(
            'bluetooth-disabled',
            'Bluetooth is still disabled.',
          );
        }
        this.bleRecoveryInProgress = false;
        await this.startScan();
        return;
      }

      await this.bleService.openAppSettings();
    } catch (error: unknown) {
      if (!this.destroyed) {
        this.applyScanBleError(error);
      }
    } finally {
      if (!this.destroyed) {
        this.bleRecoveryInProgress = false;
      }
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
      console.warn('Unable to stop BLE scan.', error);
    }
  }

  private registerRootBackButton(): void {
    this.unregisterRootBackButton();
    if (this.bleService.platform !== 'android') {
      return;
    }
    this.rootBackButtonSubscription =
      this.platform.backButton.subscribeWithPriority(
        1,
        (processNextHandler: () => void) => {
          if (this.routerOutlet?.canGoBack()) {
            processNextHandler();
            return;
          }
          void this.presentExitConfirmation();
        },
      );
  }

  private unregisterRootBackButton(): void {
    this.rootBackButtonSubscription?.unsubscribe();
    this.rootBackButtonSubscription = null;
    this.exitConfirmationOpen = false;
  }

  private async presentExitConfirmation(): Promise<void> {
    if (this.exitConfirmationOpen || this.destroyed) {
      return;
    }
    this.exitConfirmationOpen = true;
    const text = scanExitTextFor(readStoredAppLanguage());
    try {
      const alert = await this.alertController.create({
        message: text.message,
        buttons: [
          {
            text: text.cancel,
            role: 'cancel',
            handler: () => {
              this.exitConfirmationOpen = false;
            },
          },
          {
            text: text.exit,
            handler: () => this.exitAndroidApplication(),
          },
        ],
      });
      await alert.present();
      void alert.onDidDismiss().then(() => {
        this.exitConfirmationOpen = false;
      });
    } catch (error: unknown) {
      this.exitConfirmationOpen = false;
      console.warn('Unable to present app exit confirmation.', error);
    }
  }

  private async exitAndroidApplication(): Promise<void> {
    if (this.bleService.platform !== 'android' || this.exitingApplication) {
      return;
    }
    this.exitingApplication = true;
    try {
      if (readAutoEnableBluetooth()) {
        await this.stopScanBeforeExit();
      }
      await this.exitNativeApplication();
    } catch (error: unknown) {
      this.exitingApplication = false;
      console.warn('Unable to exit application.', error);
    }
  }

  private async stopScanBeforeExit(): Promise<void> {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    await Promise.race([
      this.stopScan(),
      new Promise<void>((resolve) => {
        timeout = setTimeout(resolve, EXIT_SCAN_CLEANUP_TIMEOUT_MS);
      }),
    ]);
    if (timeout !== null) {
      clearTimeout(timeout);
    }
  }

  private exitNativeApplication(): Promise<void> {
    return App.exitApp();
  }

  selectDevice(device: ScannedDevice): void {
    if (!this.connecting) {
      this.selectedDeviceId = device.deviceId;
      this.connectionError = null;
    }
  }

  async selectAndConnectDevice(device: ScannedDevice): Promise<void> {
    if (
      this.connecting ||
      this.connectedDeviceId !== null ||
      this.bleService.connectedDeviceId !== null
    ) {
      return;
    }

    this.selectDevice(device);
    await this.connectSelectedDevice();
  }

  isConnectingDevice(device: ScannedDevice): boolean {
    return this.connecting && this.selectedDeviceId === device.deviceId;
  }

  async connectSelectedDevice(): Promise<void> {
    const device = this.selectedDevice;

    if (device === null || this.connecting) {
      return;
    }

    this.connectionError = null;
    this.connectionRetryDeviceId = null;
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
      await this.delay(PHASE1_CONNECT_STABILIZATION_DELAY_MS);
      await this.connectDeviceWithPhase1Retries(device.deviceId);
      if (this.destroyed || this.selectedDeviceId !== device.deviceId) {
        await this.bleService.disconnect().catch(() => undefined);
        return;
      }
      if (
        this.selectedDeviceId !== device.deviceId ||
        this.bleService.connectedDeviceId !== device.deviceId
      ) {
        return;
      }
      const nativeGeneration = this.bleService.connectionGeneration;
      this.connectedDeviceId = this.bleService.connectedDeviceId;
      this.connectedBleGeneration = nativeGeneration;
      await this.delay(PHASE1_POST_CONNECTION_STABILIZATION_DELAY_MS);
      if (!this.isCurrentBleConnection(device.deviceId, nativeGeneration)) {
        if (
          this.bleService.connectedDeviceId === device.deviceId &&
          this.bleService.connectionGeneration === nativeGeneration
        ) {
          await this.bleService.disconnect().catch(() => undefined);
        }
        return;
      }
      this.connecting = false;
      await this.loadServices(device.deviceId, nativeGeneration);
      await this.openProductPageIfReady(device.deviceId, nativeGeneration);
    } catch (error: unknown) {
      if (this.destroyed) {
        return;
      }
      await this.recoverFromProductConnectionFailure(
        'connection',
        device.deviceId,
        error,
      );
    } finally {
      this.connecting = false;
      this.retryingConnection = false;
    }
  }

  async retryConnection(): Promise<void> {
    if (!this.canRetryConnection) {
      return;
    }
    this.retryingConnection = true;
    await this.connectSelectedDevice();
  }

  async retryLoadServices(): Promise<void> {
    if (
      this.serviceDiscoveryRetryDeviceId === null ||
      this.serviceDiscoveryRetryGeneration === null ||
      this.discoveringServices ||
      this.readingIdentification ||
      this.disconnectingAfterDiscoveryError
    ) {
      return;
    }

    const deviceId = this.serviceDiscoveryRetryDeviceId;
    const generation = this.serviceDiscoveryRetryGeneration;
    if (!this.isCurrentBleConnection(deviceId, generation)) {
      this.clearStaleServiceDiscoveryRecovery();
      return;
    }

    this.retryingServiceDiscovery = true;
    await this.loadServices(deviceId, generation);
    await this.openProductPageIfReady(deviceId, generation);
  }

  async disconnectAfterDiscoveryError(): Promise<void> {
    if (!this.canDisconnectAfterDiscoveryError) {
      return;
    }

    this.disconnectingAfterDiscoveryError = true;
    this.errorMessage = null;

    try {
      await this.bleService.disconnect();
      if (!this.destroyed && this.bleService.connectedDeviceId === null) {
        this.clearConnectedState();
      }
    } catch (error: unknown) {
      if (!this.destroyed) {
        this.errorMessage = this.toErrorMessage(error);
      }
    } finally {
      if (!this.destroyed) {
        this.disconnectingAfterDiscoveryError = false;
      }
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

  async openProductPage(): Promise<void> {
    const profile = this.productProfile;
    const deviceId = this.connectedDeviceId;
    const generation = this.connectedBleGeneration;
    if (!this.canOpenProductPage ||
        !this.isKnownProductProfile(profile) ||
        deviceId === null ||
        generation === null) {
      return;
    }

    const state: ProductPageNavigationState = {
      profile,
      deviceId,
      connectionGeneration: generation,
      displayName: this.selectedDevice?.name ??
        PRODUCT_PAGE_CONFIG[profile].productName,
      identificationConfidence: 'strong',
      motorState: this.hasCurrentMotorStateSource() ? this.motorState : null,
    };
    await this.router.navigate(
      [PRODUCT_PAGE_CONFIG[profile].route],
      { state },
    );
  }

  private async openProductPageIfReady(
    deviceId: string,
    expectedConnectionGeneration: number,
  ): Promise<void> {
    if (
      this.isCurrentBleConnection(deviceId, expectedConnectionGeneration) &&
      this.canOpenProductPage
    ) {
      await this.openProductPage();
    }
  }

  ngOnDestroy(): void {
    const connectedDeviceId = this.connectedDeviceId;
    this.destroyed = true;
    this.resetProductRead(true);
    this.scanning = false;
    this.bleRecoveryInProgress = false;
    this.clearScanTimeout();
    this.disconnectionSubscription.unsubscribe();
    this.bluetoothEnabledSubscription.unsubscribe();
    this.unregisterRootBackButton();
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
    this.retryingServiceDiscovery = false;
    this.disconnectingAfterDiscoveryError = false;
    this.serviceDiscoveryRetryDeviceId = null;
    this.serviceDiscoveryRetryGeneration = null;
    this.discoveryError = null;
    this.clearMotorState();
    this.clearIdentification();
    this.services = [];
    this.motorTestStatus = commandWasActive ? 'disconnected' : 'idle';

    if (event.reason === 'remote') {
      this.connectionError = 'Connexion perdue avec l’appareil.';
    }
  }

  private async disconnectExistingNativeConnectionForScanEntry():
    Promise<boolean> {
    if (this.bleService.connectedDeviceId === null) {
      return true;
    }

    this.entryConnectionCleanupInProgress = true;
    this.connectionError = null;
    this.resetProductRead(true);
    this.resetMotorTest();
    this.clearMotorState();
    this.clearIdentification();
    this.services = [];

    try {
      await this.bleService.disconnect();
      return this.bleService.connectedDeviceId === null;
    } catch {
      return false;
    } finally {
      if (!this.destroyed) {
        this.connectedDeviceId = null;
        this.connectedBleGeneration = null;
        this.connecting = false;
        this.discoveringServices = false;
        this.retryingServiceDiscovery = false;
        this.disconnectingAfterDiscoveryError = false;
        this.serviceDiscoveryRetryDeviceId = null;
        this.serviceDiscoveryRetryGeneration = null;
        this.entryConnectionCleanupInProgress = false;
      }
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

  private async loadServices(
    deviceId: string,
    expectedConnectionGeneration: number,
  ): Promise<void> {
    if (!this.isCurrentBleConnection(deviceId, expectedConnectionGeneration)) {
      this.clearStaleServiceDiscoveryRecovery();
      return;
    }

    this.discoveringServices = true;
    this.discoveryError = null;
    this.serviceDiscoveryRetryDeviceId = null;
    this.serviceDiscoveryRetryGeneration = null;
    this.clearIdentification();
    this.clearMotorState();
    this.services = [];

    try {
      const services = await this.bleService.discoverServices(deviceId);

      if (this.isCurrentBleConnection(deviceId, expectedConnectionGeneration)) {
        this.services = services;
        this.detectedSecondaryProfile =
          this.productDetection.detectSecondaryProfile(services);
        this.secondaryProfile = this.detectedSecondaryProfile;
        await this.loadIdentification(
          deviceId,
          expectedConnectionGeneration,
          services,
        );
      }
    } catch (error: unknown) {
      if (this.isCurrentBleConnection(deviceId, expectedConnectionGeneration)) {
        await this.recoverFromProductConnectionFailure(
          'discovery',
          deviceId,
          error,
        );
      }
    } finally {
      if (this.isCurrentBleConnection(deviceId, expectedConnectionGeneration)) {
        this.discoveringServices = false;
      }
      this.retryingServiceDiscovery = false;
    }
  }

  private async loadIdentification(
    deviceId: string,
    expectedConnectionGeneration: number,
    services: readonly DiscoveredBleService[],
  ): Promise<void> {
    if (!this.isCurrentBleConnection(deviceId, expectedConnectionGeneration)) {
      return;
    }

    const versionCharacteristicExists = services.some(
      (service) =>
        this.normalizeUuid(service.uuid) === BLE_UUIDS.shdoService &&
        service.characteristics.some(
          ({ uuid }) =>
            this.normalizeUuid(uuid) === BLE_UUIDS.versionCharacteristic,
        ),
    );

    if (!versionCharacteristicExists) {
      if (await this.applyPhase1WidoorNameFallbackIfAllowed(
        deviceId,
        expectedConnectionGeneration,
        services,
        'Nom Bluetooth WI + service secondaire Widoor sans mot de version lisible',
      )) {
        return;
      }
      await this.recoverFromProductConnectionFailure(
        'identification',
        deviceId,
      );
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

      if (this.isCurrentBleConnection(deviceId, expectedConnectionGeneration)) {
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
        if (!this.isKnownProductProfile(this.productProfile)) {
          await this.recoverFromProductConnectionFailure(
            'unknown-product',
            deviceId,
          );
          return;
        }
        await this.startMotorStateNotifications(
          deviceId,
          expectedConnectionGeneration,
          services,
        );
      }
    } catch (error: unknown) {
      if (this.isCurrentBleConnection(deviceId, expectedConnectionGeneration)) {
        if (await this.applyPhase1WidoorNameFallbackIfAllowed(
          deviceId,
          expectedConnectionGeneration,
          services,
          'Nom Bluetooth WI + service secondaire Widoor après échec de lecture du mot de version',
        )) {
          return;
        }
        await this.recoverFromProductConnectionFailure(
          'identification',
          deviceId,
          error,
        );
      }
    } finally {
      if (this.isCurrentBleConnection(deviceId, expectedConnectionGeneration)) {
        this.readingIdentification = false;
      }
    }
  }

  private resetAfterProductExit(clearDevices: boolean): void {
    this.resetProductRead(true);
    this.resetMotorTest();
    this.clearMotorState();
    this.clearIdentification();
    this.services = [];
    this.connectedDeviceId = null;
    this.connectedBleGeneration = null;
    this.connecting = false;
    this.discoveringServices = false;
    this.retryingServiceDiscovery = false;
    this.disconnectingAfterDiscoveryError = false;
    this.serviceDiscoveryRetryDeviceId = null;
    this.serviceDiscoveryRetryGeneration = null;
    this.discoveryError = null;
    this.connectionError = null;
    this.selectedDeviceId = null;
    this.scanning = false;
    this.clearScanTimeout();
    if (clearDevices) {
      this.devices = [];
    }
  }

  private async presentDisconnectedToast(): Promise<void> {
    if (this.destroyed) {
      return;
    }
    const toast = await this.toastController.create({
      message: this.productPageText.states.disconnected,
      duration: 500,
      position: 'middle',
    });
    await toast.present();
  }

  private async recoverFromProductConnectionFailure(
    failure: ProductConnectionFailure,
    deviceId: string,
    technicalError?: unknown,
  ): Promise<void> {
    console.warn(
      `BLE product connection recovery: ${failure}.`,
      technicalError,
    );

    if (this.bleService.connectedDeviceId === deviceId) {
      try {
        await this.bleService.disconnect();
      } catch (cleanupError: unknown) {
        console.warn(
          'Native BLE disconnect failed during product connection recovery.',
          cleanupError,
        );
      }
    }

    if (this.destroyed) {
      return;
    }

    this.clearConnectedState();
    this.connectionError = null;
    this.connectionRetryDeviceId = null;
    this.discoveryError = null;
    this.identificationError = null;
    this.selectedDeviceId = null;
    this.scanning = false;
    this.clearScanTimeout();

    const text = scanProductConnectionTextFor(readStoredAppLanguage());
    const message = failure === 'connection'
      ? text.connectionFailed
      : failure === 'discovery'
        ? text.discoveryFailed
        : text.productNotRecognized;
    const toast = await this.toastController.create({
      message,
      duration: failure === 'unknown-product' ? 2_000 : 3_000,
      position: 'bottom',
    });
    await toast.present();
  }

  private async connectDeviceWithPhase1Retries(deviceId: string):
    Promise<void> {
    let lastError: unknown = null;
    const manualRetryInProgress = this.retryingConnection;

    for (let attempt = 1; attempt <= PHASE1_CONNECT_ATTEMPTS; attempt += 1) {
      if (this.destroyed || this.selectedDeviceId !== deviceId) {
        throw lastError ?? new Error('Connection flow was cancelled.');
      }

      this.retryingConnection = manualRetryInProgress || attempt > 1;
      try {
        await this.bleService.connect(deviceId);
        return;
      } catch (error: unknown) {
        lastError = error;
        await this.cleanupFailedPhase1ConnectionAttempt(deviceId);

        if (attempt >= PHASE1_CONNECT_ATTEMPTS) {
          break;
        }

        await this.delay(
          PHASE1_CONNECT_RETRY_DELAYS_MS[
            Math.min(attempt - 1, PHASE1_CONNECT_RETRY_DELAYS_MS.length - 1)
          ],
        );
      }
    }

    throw lastError ?? new Error('BLE connection failed.');
  }

  private async cleanupFailedPhase1ConnectionAttempt(
    deviceId: string,
  ): Promise<void> {
    if (this.bleService.connectedDeviceId === deviceId) {
      await this.bleService.disconnect().catch(() => undefined);
    }
  }

  private async applyPhase1WidoorNameFallbackIfAllowed(
    deviceId: string,
    expectedConnectionGeneration: number,
    services: readonly DiscoveredBleService[],
    reason: string,
  ): Promise<boolean> {
    if (!this.isCurrentBleConnection(deviceId, expectedConnectionGeneration) ||
        this.detectedSecondaryProfile !== 'Widoor' ||
        !this.isPhase1WidoorBluetoothName(this.selectedDevice?.name)) {
      return false;
    }

    this.identification = {
      rawHex: '',
      length: 0,
      productByte: null,
      subtypeByte: null,
      detectedType: 'Widoor',
      ambiguous: false,
      detectionReason: reason,
      detectionConfidence: 'Forte',
    };
    this.productProfile = 'widoor';
    this.secondaryProfile =
      `${this.detectedSecondaryProfile} — ${reason} ` +
      '(confiance forte)';
    this.identificationError = null;
    await this.startMotorStateNotifications(
      deviceId,
      expectedConnectionGeneration,
      services,
    );
    return true;
  }

  private isPhase1WidoorBluetoothName(
    name: string | null | undefined,
  ): boolean {
    return (name ?? '').trim().toUpperCase().startsWith('WI');
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  private async startMotorStateNotifications(
    deviceId: string,
    expectedConnectionGeneration: number,
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
            if (
              this.isCurrentBleConnection(
                deviceId,
                expectedConnectionGeneration,
              )
            ) {
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
      if (this.isCurrentBleConnection(deviceId, expectedConnectionGeneration)) {
        this.motorStateNotificationsActive = true;
      }
    } catch (error: unknown) {
      if (this.isCurrentBleConnection(deviceId, expectedConnectionGeneration)) {
        const details = error instanceof Error ? error.message : String(error);
        this.motorNotificationError = details
          ? `Impossible de s’abonner à l’état moteur : ${details}`
          : 'Impossible de s’abonner à l’état moteur.';
      }
    } finally {
      if (this.isCurrentBleConnection(deviceId, expectedConnectionGeneration)) {
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

    const deviceId = result.device.deviceId;
    const existingIndex = this.devices.findIndex(
      (device) => device.deviceId === deviceId,
    );
    const existingDevice = existingIndex === -1
      ? null
      : this.devices[existingIndex];
    const localName = result.localName?.trim() ?? '';
    const deviceName = result.device.name?.trim() ?? '';
    const previousName = existingDevice?.name ?? '';
    const previousUsableName = previousName !== 'Appareil sans nom'
      ? previousName
      : '';
    const name = localName
      || previousUsableName
      || deviceName
      || previousName
      || 'Appareil sans nom';
    const device: ScannedDevice = {
      deviceId,
      name,
      rssi: result.rssi ?? existingDevice?.rssi ?? null,
    };

    if (existingIndex === -1) {
      this.devices = [...this.devices, device];
      return;
    }

    if (
      existingDevice?.name === device.name &&
      existingDevice.rssi === device.rssi
    ) {
      return;
    }

    this.devices = this.devices.map((currentDevice, index) =>
      index === existingIndex ? device : currentDevice,
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

  private isCurrentBleConnection(
    deviceId: string,
    nativeGeneration: number,
  ): boolean {
    return !this.destroyed &&
      this.connectedDeviceId === deviceId &&
      this.bleService.connectedDeviceId === deviceId &&
      this.connectedBleGeneration === nativeGeneration &&
      this.bleService.connectionGeneration === nativeGeneration;
  }

  private clearConnectedState(): void {
    const hadConnectedDevice = this.connectedDeviceId !== null;
    this.resetProductRead(true);
    this.connectedDeviceId = null;
    this.connectedBleGeneration = null;
    this.connecting = false;
    this.discoveringServices = false;
    this.retryingServiceDiscovery = false;
    this.disconnectingAfterDiscoveryError = false;
    this.serviceDiscoveryRetryDeviceId = null;
    this.serviceDiscoveryRetryGeneration = null;
    this.discoveryError = null;
    this.services = [];
    this.clearMotorState();
    this.clearIdentification();
    if (hadConnectedDevice) {
      this.connectionGeneration += 1;
    }
  }

  private clearStaleServiceDiscoveryRecovery(): void {
    this.discoveryError = null;
    this.discoveringServices = false;
    this.retryingServiceDiscovery = false;
    this.serviceDiscoveryRetryDeviceId = null;
    this.serviceDiscoveryRetryGeneration = null;
    if (this.bleService.connectedDeviceId === null) {
      this.clearConnectedState();
    }
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

  private async ensureBluetoothReadyForScan(): Promise<boolean> {
    if (!await this.bleService.isBluetoothEnabled()) {
      await this.presentBluetoothDisabledAlert();
      return false;
    }

    if (
      await this.bleService.requiresLegacyAndroidLocationService() &&
      !await this.bleService.isLocationEnabled()
    ) {
      await this.presentLocationDisabledAlert();
      return false;
    }

    return true;
  }

  private async presentLocationDisabledAlert(): Promise<void> {
    if (this.locationDisabledAlertOpen || this.destroyed) {
      return;
    }

    this.locationDisabledAlertOpen = true;
    const text = scanLocationTextFor(readStoredAppLanguage());
    const alert = await this.alertController.create({
      header: text.disabledTitle,
      message: text.disabledMessage,
      backdropDismiss: false,
      buttons: [
        {
          text: text.cancel,
          role: 'cancel',
          handler: () => {
            this.locationDisabledAlertOpen = false;
          },
        },
        {
          text: text.openSettings,
          handler: () => {
            this.locationDisabledAlertOpen = false;
            return this.openLocationSettings();
          },
        },
      ],
    });
    await alert.present();
  }

  private async openLocationSettings(): Promise<void> {
    try {
      await this.bleService.openLocationSettings();
    } catch {
      // Phase 1 did not add another user-facing error for this failure.
    }
  }

  private async presentBluetoothDisabledAlert(): Promise<void> {
    if (this.bluetoothDisabledAlertOpen || this.destroyed) {
      return;
    }

    this.clearBluetoothOffInlineFeedback();
    this.bluetoothDisabledAlertOpen = true;
    const text = scanBluetoothTextFor(readStoredAppLanguage());
    const alert = await this.alertController.create({
      header: text.disabledTitle,
      message: text.disabledMessage,
      backdropDismiss: false,
      buttons: [
        {
          text: text.cancel,
          role: 'cancel',
          handler: () => {
            this.bluetoothDisabledAlertOpen = false;
          },
        },
        {
          text: text.enable,
          handler: () => {
            this.bluetoothDisabledAlertOpen = false;
            return this.handleBluetoothEnableRequest(text);
          },
        },
      ],
    });
    await alert.present();
  }

  private async handleBluetoothEnableRequest(
    text: ScanBluetoothText,
  ): Promise<void> {
    if (this.bleRecoveryInProgress || this.destroyed) {
      return;
    }

    this.bleRecoveryInProgress = true;
    try {
      if (
        this.bleService.platform !== 'android' ||
        !this.bleService.canRequestBluetoothEnable
      ) {
        await this.presentBluetoothSettingsAlert(text);
        return;
      }

      let enabled = false;
      try {
        await this.bleService.requestBluetoothEnable();
        enabled = await this.waitForBluetoothEnabled();
      } catch {
        enabled = false;
      }

      if (!enabled || this.destroyed) {
        if (!this.destroyed) {
          await this.presentBluetoothSettingsAlert(text);
        }
        return;
      }

      this.bleRecoveryInProgress = false;
      await this.startScan();
    } finally {
      this.bleRecoveryInProgress = false;
    }
  }

  private async waitForBluetoothEnabled(): Promise<boolean> {
    if (await this.bleService.isBluetoothEnabled()) {
      return true;
    }

    for (const delayMs of PHASE1_BLUETOOTH_ENABLE_CHECK_DELAYS_MS) {
      await this.delay(delayMs);
      if (this.destroyed) {
        return false;
      }
      if (await this.bleService.isBluetoothEnabled()) {
        return true;
      }
    }
    return false;
  }

  private async presentBluetoothSettingsAlert(
    text: ScanBluetoothText,
  ): Promise<void> {
    if (this.bluetoothSettingsAlertOpen || this.destroyed) {
      return;
    }

    const android = this.bleService.platform === 'android';
    this.bluetoothSettingsAlertOpen = true;
    const alert = await this.alertController.create({
      header: text.settingsTitle,
      message: android
        ? text.androidSettingsMessage
        : text.iosSettingsMessage,
      backdropDismiss: false,
      buttons: [
        {
          text: text.ok,
          handler: () => {
            this.bluetoothSettingsAlertOpen = false;
          },
        },
        {
          text: android
            ? text.openBluetoothSettings
            : text.openAppSettings,
          handler: () => {
            this.bluetoothSettingsAlertOpen = false;
            return this.openBluetoothSettingsForCurrentPlatform();
          },
        },
      ],
    });
    await alert.present();
  }

  private async openBluetoothSettingsForCurrentPlatform(): Promise<void> {
    try {
      if (this.bleService.platform === 'android') {
        await this.bleService.openBluetoothSettings();
      } else {
        await this.bleService.openAppSettings();
      }
    } catch {
      // Phase 1 kept ScanPage usable and did not expose settings errors.
    }
  }

  private clearBluetoothOffInlineFeedback(): void {
    if (
      this.scanBleError?.code === 'bluetooth-disabled' ||
      this.scanBleError?.code === 'bluetooth-enable-unavailable' ||
      this.scanBleError?.code === 'bluetooth-enable-failed' ||
      this.scanBleError?.code === 'bluetooth-settings-unavailable' ||
      this.scanBleError?.code === 'bluetooth-settings-failed'
    ) {
      this.scanBleError = null;
      this.errorMessage = null;
    }
  }

  private async handlePermissionPrecheckError(
    error: unknown,
  ): Promise<boolean> {
    if (
      !isBleOperationError(error) ||
      (error.code !== 'permission-denied' &&
        error.code !== 'permission-settings-required')
    ) {
      return false;
    }

    this.clearPermissionInlineFeedback();
    if (
      error.code === 'permission-settings-required' ||
      this.bleService.platform === 'ios'
    ) {
      this.permissionDeniedCount = Math.max(this.permissionDeniedCount, 1);
      this.permissionSettingsRequired = true;
      await this.presentPermissionSettingsAlert(
        this.bleService.platform === 'android',
      );
      return true;
    }

    this.permissionDeniedCount += 1;
    if (this.permissionDeniedCount === 1) {
      await this.presentPermissionDeniedToast();
      return true;
    }

    await this.presentPermissionSettingsAlert(true);
    return true;
  }

  private async presentPermissionDeniedToast(): Promise<void> {
    const text = scanPermissionTextFor(readStoredAppLanguage());
    const toast = await this.toastController.create({
      message: text.firstDenial,
      duration: 3_500,
      position: 'bottom',
    });
    await toast.present();
  }

  private async presentPermissionSettingsAlert(
    blocked: boolean,
  ): Promise<void> {
    if (this.permissionSettingsAlertOpen || this.destroyed) {
      return;
    }

    this.clearPermissionInlineFeedback();
    this.permissionSettingsAlertOpen = true;
    const text = scanPermissionTextFor(readStoredAppLanguage());
    const alert = await this.alertController.create({
      header: text.settingsTitle,
      message: blocked ? text.blockedDenial : text.repeatedDenial,
      backdropDismiss: false,
      buttons: [
        {
          text: text.cancel,
          role: 'cancel',
          handler: () => {
            this.permissionSettingsAlertOpen = false;
          },
        },
        {
          text: text.openAppSettings,
          handler: () => {
            this.permissionSettingsAlertOpen = false;
            this.permissionSettingsRequired = false;
            return this.openAppSettingsAfterPermissionDenial();
          },
        },
      ],
    });
    await alert.present();
  }

  private async openAppSettingsAfterPermissionDenial(): Promise<void> {
    try {
      await this.bleService.openAppSettings();
    } catch {
      // Phase 1 did not add a second user-facing error for this failure.
    }
  }

  private clearPermissionInlineFeedback(): void {
    if (
      this.scanBleError?.code === 'permission-denied' ||
      this.scanBleError?.code === 'permission-settings-required'
    ) {
      this.scanBleError = null;
      this.errorMessage = null;
    }
  }

  private resetPermissionDenialState(): void {
    this.permissionDeniedCount = 0;
    this.permissionSettingsRequired = false;
    this.permissionSettingsAlertOpen = false;
  }

  private async handleScanStartError(error: unknown): Promise<void> {
    console.warn('BLE scan failed to start.', error);
    if (isBleOperationError(error)) {
      if (error.code === 'bluetooth-disabled') {
        await this.presentBluetoothDisabledAlert();
        return;
      }
      if (error.code === 'initialization-failed') {
        await this.presentScanErrorToast(true);
        return;
      }
    }
    await this.presentScanErrorToast(false);
  }

  private async presentScanErrorToast(bluetoothNotReady: boolean): Promise<void> {
    const text = scanErrorTextFor(readStoredAppLanguage());
    const toast = await this.toastController.create({
      message: bluetoothNotReady
        ? text.bluetoothNotReady
        : text.genericFailure,
      duration: 3_000,
      position: 'bottom',
    });
    await toast.present();
  }

  private async handleBluetoothDisabledDuringScan(): Promise<void> {
    if (
      this.destroyed ||
      !this.scanning ||
      this.bluetoothDisabledDuringScanInProgress
    ) {
      return;
    }
    this.bluetoothDisabledDuringScanInProgress = true;
    try {
      await this.stopScan();
      if (!this.destroyed) {
        await this.presentBluetoothDisabledAlert();
      }
    } finally {
      this.bluetoothDisabledDuringScanInProgress = false;
    }
  }

  private applyScanBleError(error: unknown): void {
    this.scanBleError = this.describeScanBleError(error);
    this.errorMessage = this.scanBleError.message;
  }

  private describeScanBleError(error: unknown): ScanBleErrorState {
    const details = this.scanErrorDetails(error);
    if (isBleOperationError(error)) {
      switch (error.code) {
        case 'bluetooth-disabled':
          return this.bleService.canRequestBluetoothEnable
            ? {
              code: error.code,
              message: 'Bluetooth est désactivé. Activez-le pour lancer le scan.',
              action: 'enable-bluetooth',
              actionLabel: 'Activer Bluetooth',
            }
            : {
              code: error.code,
              message:
                'Bluetooth est désactivé. Activez-le dans les réglages système puis réessayez.',
              action: 'retry-scan',
              actionLabel: 'Réessayer',
            };
        case 'permission-denied':
          return {
            code: error.code,
            message:
              'Permission Bluetooth refusée. Autorisez le Bluetooth puis réessayez.',
            action: 'retry-scan',
            actionLabel: 'Réessayer',
          };
        case 'permission-settings-required':
          return this.bleService.canOpenAppSettings
            ? {
              code: error.code,
              message:
                'Permission Bluetooth refusée. Ouvrez les réglages de l’application pour l’autoriser.',
              action: 'open-app-settings',
              actionLabel: 'Ouvrir les réglages',
            }
            : {
              code: error.code,
              message:
                'Permission Bluetooth refusée. Autorisez le Bluetooth dans les réglages système puis réessayez.',
              action: 'retry-scan',
              actionLabel: 'Réessayer',
            };
        case 'initialization-failed':
          return {
            code: error.code,
            message: details
              ? `Initialisation BLE impossible : ${details}`
              : 'Initialisation BLE impossible.',
            action: 'retry-scan',
            actionLabel: 'Réessayer',
          };
        case 'bluetooth-enable-unavailable':
        case 'bluetooth-enable-failed':
          return {
            code: error.code,
            message:
              'Bluetooth n’a pas pu être activé depuis l’application. Activez-le dans les réglages système puis réessayez.',
            action: 'retry-scan',
            actionLabel: 'Réessayer',
          };
        case 'app-settings-unavailable':
        case 'app-settings-failed':
          return {
            code: error.code,
            message:
              'Les réglages de l’application n’ont pas pu être ouverts. Autorisez le Bluetooth depuis les réglages système puis réessayez.',
            action: 'retry-scan',
            actionLabel: 'Réessayer',
          };
        case 'scan-failed':
          return {
            code: error.code,
            message: details
              ? `Impossible d’effectuer le scan BLE : ${details}`
              : 'Impossible d’effectuer le scan BLE.',
            action: 'retry-scan',
            actionLabel: 'Réessayer',
          };
      }
    }
    return {
      code: 'unknown',
      message: this.toErrorMessage(error),
      action: 'retry-scan',
      actionLabel: 'Réessayer',
    };
  }

  private scanErrorDetails(error: unknown): string {
    if (isBleOperationError(error)) {
      const cause = error.cause;
      return cause instanceof Error
        ? cause.message
        : typeof cause === 'string'
          ? cause
          : '';
    }
    return '';
  }

  private toErrorMessage(error: unknown): string {
    const details = error instanceof Error ? error.message : String(error);
    return details
      ? `Impossible d’effectuer le scan BLE : ${details}`
      : 'Impossible d’effectuer le scan BLE.';
  }

  private isRetryableConnectionError(error: unknown): boolean {
    if (!isBleOperationError(error)) {
      return false;
    }
    return error.code === 'connection-timeout' ||
      error.code === 'connection-failed' ||
      error.code === 'service-discovery-failed' ||
      error.code === 'connection-interrupted';
  }
}
