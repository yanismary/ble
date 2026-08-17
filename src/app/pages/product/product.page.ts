import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonRange,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';

import {
  BleDisconnectionEvent,
  BleNotificationEvent,
  BleService,
} from '../../core/services/ble';
import { BLE_UUIDS } from '../../core/services/ble-profile-catalog';
import {
  LegacyBleWrite,
  LegacyInputMode,
  LegacyLockMode,
} from
  '../../core/services/legacy-ble-write-catalog';
import {
  BleWriteExecutionService,
  LegacyBleWriteExecutionResult,
} from '../../core/services/ble-write-execution.service';
import {
  BleProfessionalParameters,
  BleSoftwareVersion,
  BleStackVersion,
  BleUserParameters,
  HistoricalBleDate,
  decodeProfessionalPeripheralFlags,
} from '../../core/services/ble-read-decoders';
import {
  BleTypedReadResult,
} from '../../core/services/ble-read.service';
import {
  KnownProductProfile,
  ProductDataLoadResult,
  ProductDataLoadStatus,
  ProductDataLoadService,
} from '../../core/services/product-data-load.service';
import {
  MaintenanceAccessContext,
  MaintenanceAccessService,
} from '../../core/services/maintenance-access.service';
import {
  ProfessionalAccessContext,
  ProfessionalAccessService,
} from '../../core/services/professional-access.service';
import {
  readShowProductInformation,
  readShowProductSettings,
} from '../../core/services/app-preferences';
import {
  triggerConfiguredHapticFeedback,
} from '../../core/services/app-haptics';
import {
  MotorStateFrame,
  ProductDetection,
} from '../../core/services/product-detection';
import {
  PRODUCT_PAGE_CONFIG,
  ProductPageConfig,
  ProductProfessionalField,
  ProductWeightRange,
  ProductUserField,
  isKnownProductProfile,
} from './product-page.config';
import { PRODUCT_PAGE_TEXT } from './product-page.text';
import {
  normalizeProductPageLanguage,
  productPageTextFor,
} from './product-page-legacy-localization';
import { productProfessionalFieldRequiresAccess } from
  './product-professional-access';
import {
  ProductLockModeUiConfig,
  createProductLockModeAuthorization,
  productLockModeConfigsFor,
} from './product-lock-mode';
import {
  ProductUserSpeedField,
  ProductUserSpeedUiConfig,
  createProductUserSpeedAuthorization,
  isValidProductUserSpeedValue,
  productUserSpeedConfigsFor,
} from './product-user-speed';
import {
  ProductUserTimingField,
  ProductUserTimingUiConfig,
  createProductUserTimingAuthorization,
  isValidProductUserTimingValue,
  productUserTimingConfigsFor,
} from './product-user-timing';
import {
  ProductUserPeripheralField,
  ProductUserPeripheralUiConfig,
  createProductUserPeripheralAuthorization,
  productUserPeripheralConfigsFor,
} from './product-user-peripheral';
import {
  ProductWeightRangeUiConfig,
  createProductWeightRangeAuthorization,
  isSameProductWeightRange,
  isValidProductWeightRange,
  productWeightRangeConfigsFor,
} from './product-weight-range';
import {
  ProductProfessionalInputField,
  ProductProfessionalInputUiConfig,
  createProductProfessionalInputAuthorization,
  productProfessionalInputConfigsFor,
} from './product-professional-input';
import {
  createProfessionalPeripheralDiagnosticRows,
} from './product-professional-peripheral-diagnostics';
import {
  ProductSensitiveAction,
  ProductSensitiveActionUiConfig,
  createProductSensitiveActionAuthorization,
  productSensitiveActionConfigsFor,
  productSensitiveActionWriteSteps,
} from './product-sensitive-actions';
import {
  ProductProfessionalScalarField,
  ProductProfessionalScalarUiConfig,
  createProductProfessionalScalarAuthorization,
  isValidProductProfessionalScalarValue,
  productProfessionalScalarConfigsFor,
} from './product-professional-scalar';
import {
  ProductOpenCommandState,
  ProductCommandHistoryEntry,
  ProductOpenCommandStatus,
  ProductMotorCommandOperation,
  MOTOR_COMMAND_UI_CONFIGS,
  WIDOOR_COMMAND_UI_CONFIGS,
  WidoorCommandUiConfig,
  createProductMotorCommandAuthorization,
  formatCommandHistoryTime,
  initialProductOpenCommandState,
} from './product-open-command';
import {
  ProductConnectionState,
  ProductDisplayRow,
  ProductPageNavigationState,
  ProductReadViewState,
  ProductReadViewStates,
  ProductViewModel,
} from './product-view.model';
import {
  PRODUCT_NAME_ROOM_CONFIRMATION_POLICY,
  PRODUCT_NAME_ROOM_EXECUTION_POLICY,
  PRODUCT_ROOM_OPTIONS,
  ProductNameRoomDraft,
  ProductRoomSuffix,
  createProductNameRoomAuthorization,
  createProductNameRoomDraft,
  encodeProductNameRoomWrite,
  splitProductDisplayName,
  validateProductNameRoomDraft,
} from './product-name-room';
import {
  ProductDateActionContext,
  ProductDateMaintenanceFlowKind,
  prepareProductDateMaintenanceFlow,
} from './product-date-actions';
import {
  ProductDraftStepDirection,
  stepProductDraftValue,
} from './product-draft-step';
import { ProductControlLockRegistry } from './product-control-lock';

type ProductShellMainTab = 'commands' | 'settings' | 'information';
type ProductShellSettingsTab = 'basic' | 'advanced';

@Component({
  selector: 'app-product',
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonRange,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToggle,
    IonToolbar,
    NgTemplateOutlet,
  ],
})
export class ProductPage implements OnDestroy {
  private readonly alertController = inject(AlertController);
  private readonly bleService = inject(BleService);
  private readonly bleWriteExecutionService =
    inject(BleWriteExecutionService);
  private readonly ngZone = inject(NgZone);
  private readonly maintenanceAccessService =
    inject(MaintenanceAccessService);
  private readonly professionalAccessService =
    inject(ProfessionalAccessService);
  private readonly productDataLoadService = inject(ProductDataLoadService);
  private readonly productDetection = inject(ProductDetection);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly subscriptions = new Subscription();
  private readonly controlLocks = new ProductControlLockRegistry();
  private readonly context: ProductPageNavigationState | null;
  private loadCycle = 0;
  private commandCycle = 0;
  private commandIdentifierSequence = 0;
  private destroyed = false;
  private readonly productCommandWrites: Map<string, LegacyBleWrite>;
  private readonly lockModeWrites: Map<LegacyLockMode, LegacyBleWrite>;
  private readonly userSpeedWrites: Map<ProductUserSpeedField, LegacyBleWrite>;
  private readonly userSpeedDrafts = new Map<ProductUserSpeedField, number>();
  private readonly userTimingWrites: Map<ProductUserTimingField, LegacyBleWrite>;
  private readonly userTimingDrafts = new Map<ProductUserTimingField, number>();
  private weightRangeDraft: ProductWeightRange | null = null;
  private readonly professionalInputWrites: Map<
    ProductProfessionalInputField,
    LegacyBleWrite
  >;
  private readonly professionalScalarWrites: Map<
    ProductProfessionalScalarField,
    LegacyBleWrite
  >;
  private readonly professionalScalarDrafts = new Map<
    ProductProfessionalScalarField,
    number
  >();
  private nameRoomDraft: ProductNameRoomDraft | null = null;

  readonly config: ProductPageConfig;
  readonly text = productPageTextFor(
    normalizeProductPageLanguage(localStorage.getItem('lang')),
  );
  readonly roomOptions = PRODUCT_ROOM_OPTIONS;
  readonly sensitiveActions: readonly ProductSensitiveActionUiConfig[];
  readonly productCommands: readonly {
    readonly config: WidoorCommandUiConfig;
    readonly text: typeof PRODUCT_PAGE_TEXT.widoorCommands[
      WidoorCommandUiConfig['textKey']
    ];
    readonly disabledReason: string | null;
  }[];
  readonly widoorCommands: typeof this.productCommands;
  readonly lockModeControls: readonly {
    readonly config: ProductLockModeUiConfig;
    readonly text: typeof PRODUCT_PAGE_TEXT.lockModeControls[
      ProductLockModeUiConfig['textKey']
    ];
  }[];
  readonly userSpeedControls: readonly {
    readonly config: ProductUserSpeedUiConfig;
    readonly text: typeof PRODUCT_PAGE_TEXT.user[
      ProductUserSpeedUiConfig['textKey']
    ];
  }[];
  readonly userTimingControls: readonly {
    readonly config: ProductUserTimingUiConfig;
    readonly text: typeof PRODUCT_PAGE_TEXT.user[
      ProductUserTimingUiConfig['textKey']
    ];
  }[];
  readonly userPeripheralControls: readonly {
    readonly config: ProductUserPeripheralUiConfig;
    readonly text: typeof PRODUCT_PAGE_TEXT.user[
      ProductUserPeripheralUiConfig['textKey']
    ];
  }[];
  readonly weightRangeControls: readonly {
    readonly config: ProductWeightRangeUiConfig;
  }[];
  readonly professionalInputControls: readonly {
    readonly config: ProductProfessionalInputUiConfig;
    readonly text: string;
  }[];
  readonly professionalScalarControls: readonly {
    readonly config: ProductProfessionalScalarUiConfig;
    readonly text: typeof PRODUCT_PAGE_TEXT.professional[
      ProductProfessionalScalarUiConfig['textKey']
    ];
  }[];
  readonly emptyTechnicalRows: readonly ProductDisplayRow[] = [];
  viewModel: ProductViewModel;
  openCommandState = initialProductOpenCommandState();
  lockModeWriteState: {
    readonly status: 'idle' | 'executing' | 'sent' | 'failed';
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', message: null });
  userSpeedWriteState: {
    readonly status: 'idle' | 'executing' | 'sent' | 'failed';
    readonly field: ProductUserSpeedField | null;
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', field: null, message: null });
  userTimingWriteState: {
    readonly status: 'idle' | 'executing' | 'sent' | 'failed';
    readonly field: ProductUserTimingField | null;
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', field: null, message: null });
  userPeripheralWriteState: {
    readonly status: 'idle' | 'executing' | 'sent' | 'failed';
    readonly field: ProductUserPeripheralField | null;
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', field: null, message: null });
  weightRangeWriteState: {
    readonly status: 'idle' | 'executing' | 'sent' | 'failed';
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', message: null });
  professionalInputWriteState: {
    readonly status: 'idle' | 'executing' | 'sent' | 'failed';
    readonly field: ProductProfessionalInputField | null;
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', field: null, message: null });
  professionalScalarWriteState: {
    readonly status: 'idle' | 'executing' | 'sent' | 'failed';
    readonly field: ProductProfessionalScalarField | null;
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', field: null, message: null });
  professionalAccessState: {
    readonly status: 'locked' | 'unlocked' | 'failed';
    readonly message: string | null;
  } = Object.freeze({ status: 'locked', message: null });
  nameRoomWriteState: {
    readonly status: 'idle' | 'executing' | 'sent' | 'failed';
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', message: null });
  sensitiveActionState: {
    readonly status:
      | 'idle'
      | 'awaiting-confirmation'
      | 'executing'
      | 'sent'
      | 'failed'
      | 'cancelled';
    readonly action: ProductSensitiveAction | null;
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', action: null, message: null });
  productDateActionState: {
    readonly status:
      | 'idle'
      | 'awaiting-confirmation'
      | 'executing'
      | 'sent'
      | 'failed'
      | 'partial-failed'
      | 'cancelled';
    readonly action: ProductDateMaintenanceFlowKind | null;
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', action: null, message: null });
  private commandHistoryEntries: readonly ProductCommandHistoryEntry[] = [];
  returningToScan = false;
  returnToScanErrorMessage: string | null = null;
  activeMainTab: ProductShellMainTab = 'commands';
  activeSettingsTab: ProductShellSettingsTab = 'basic';
  readonly compareWeightRangeOptions = (
    first: ProductWeightRange | null,
    second: ProductWeightRange | null,
  ): boolean => isSameProductWeightRange(first, second);

  constructor() {
    const routeProfile = this.route.snapshot.data['profile'];
    const profile = isKnownProductProfile(routeProfile)
      ? routeProfile
      : 'widoor';
    this.config = PRODUCT_PAGE_CONFIG[profile];
    this.sensitiveActions = productSensitiveActionConfigsFor(profile);
    this.productCommands = Object.freeze(
      MOTOR_COMMAND_UI_CONFIGS[profile].map((config) =>
      Object.freeze({
        config,
        text: PRODUCT_PAGE_TEXT.widoorCommands[config.textKey],
        disabledReason: config.disabledReason === 'physical-validation'
          ? PRODUCT_PAGE_TEXT.widoorCommands.physicalValidationRequired
          : config.disabledReason === 'protected'
            ? PRODUCT_PAGE_TEXT.widoorCommands.protected
            : null,
      })),
    );
    this.widoorCommands = this.productCommands;
    this.productCommandWrites = new Map(
      this.productCommands.map(({ config }) => [
        config.command,
        config.catalogFactory(),
      ]),
    );
    this.lockModeControls = Object.freeze(
      productLockModeConfigsFor(this.config).map((config) =>
        Object.freeze({
          config,
          text: PRODUCT_PAGE_TEXT.lockModeControls[config.textKey],
        }),
      ),
    );
    const firstLockModeConfig = this.lockModeControls[0]?.config;
    this.lockModeWrites = new Map(
      firstLockModeConfig === undefined
        ? []
        : [
          ['none', firstLockModeConfig.catalogFactory('none')],
          ...this.lockModeControls.map(({ config }) =>
            [config.mode, config.catalogFactory(config.mode)] as const,
          ),
        ],
    );
    this.userSpeedControls = Object.freeze(
      productUserSpeedConfigsFor(this.config).map((config) =>
        Object.freeze({
          config,
          text: PRODUCT_PAGE_TEXT.user[config.textKey],
        }),
      ),
    );
    this.userSpeedWrites = new Map(
      this.userSpeedControls.map(({ config }) => [
        config.field,
        config.catalogFactory(config.range.min),
      ]),
    );
    this.userTimingControls = Object.freeze(
      productUserTimingConfigsFor(this.config).map((config) =>
        Object.freeze({
          config,
          text: PRODUCT_PAGE_TEXT.user[config.textKey],
        }),
      ),
    );
    this.userTimingWrites = new Map(
      this.userTimingControls.map(({ config }) => [
        config.field,
        config.catalogFactory(config.range.min),
      ]),
    );
    this.userPeripheralControls = Object.freeze(
      productUserPeripheralConfigsFor(this.config).map((config) =>
        Object.freeze({
          config,
          text: PRODUCT_PAGE_TEXT.user[config.textKey],
        }),
      ),
    );
    this.weightRangeControls = Object.freeze(
      productWeightRangeConfigsFor(this.config).map((config) =>
        Object.freeze({ config }),
      ),
    );
    this.professionalInputControls = Object.freeze(
      productProfessionalInputConfigsFor(this.config).map((config) =>
        Object.freeze({
          config,
          text: config.textKey === 'input1'
            ? PRODUCT_PAGE_TEXT.professionalInputControls.input1
            : PRODUCT_PAGE_TEXT.professionalInputControls.input2,
        }),
      ),
    );
    this.professionalInputWrites = new Map(
      this.professionalInputControls.map(({ config }) => [
        config.field,
        config.catalogFactory('button'),
      ]),
    );
    this.professionalScalarControls = Object.freeze(
      productProfessionalScalarConfigsFor(this.config).map((config) =>
        Object.freeze({
          config,
          text: PRODUCT_PAGE_TEXT.professional[config.textKey],
        }),
      ),
    );
    this.professionalScalarWrites = new Map(
      this.professionalScalarControls.map(({ config }) => [
        config.field,
        config.catalogFactory(config.range.min),
      ]),
    );
    this.context = this.resolveNavigationContext(routeProfile);
    if (this.context !== null) {
      this.maintenanceAccessService.reset(
        this.maintenanceAccessContext(this.context),
      );
      this.professionalAccessService.reset(
        this.professionalAccessContext(this.context),
      );
    }
    this.viewModel = this.createInitialViewModel(
      profile,
      this.context,
      this.initialConnectionState(routeProfile, this.context),
    );
    this.resetNameRoomEditing();

    if (this.context !== null &&
        this.viewModel.connectionState === 'connected') {
      this.subscriptions.add(this.bleService.disconnections$.subscribe(
        (event: BleDisconnectionEvent) => {
          this.ngZone.run(() => this.handleDisconnection(event));
        },
      ));
      this.subscriptions.add(this.bleService.notifications$.subscribe(
        (event: BleNotificationEvent) => {
          this.ngZone.run(() => this.handleMotorNotification(event));
        },
      ));
    }
  }

  get showProductSettingsSection(): boolean {
    return readShowProductSettings();
  }

  get showProductInformationSection(): boolean {
    return readShowProductInformation();
  }

  get showCommandsTab(): boolean {
    return this.hasProductNavigationContext;
  }

  get showSettingsTab(): boolean {
    return this.pageContextCurrent && this.showProductSettingsSection;
  }

  get showInformationTab(): boolean {
    return this.pageContextCurrent && this.showProductInformationSection;
  }

  get controlledDoorName(): string {
    return this.viewModel.displayedName ||
      this.viewModel.productName ||
      this.config.productName ||
      this.text.noValue;
  }

  setActiveMainTab(tab: ProductShellMainTab): void {
    if (
      (tab === 'commands' && !this.showCommandsTab) ||
      (tab === 'settings' && !this.showSettingsTab) ||
      (tab === 'information' && !this.showInformationTab)
    ) {
      return;
    }
    const previousTab = this.activeMainTab;
    this.activeMainTab = tab;
    if (tab === 'settings' && previousTab !== 'settings') {
      this.activeSettingsTab = 'basic';
    }
  }

  setActiveSettingsTab(tab: ProductShellSettingsTab): void {
    if (this.activeMainTab !== 'settings' || !this.showSettingsTab) {
      return;
    }
    this.activeSettingsTab = tab;
  }

  get canRefresh(): boolean {
    return this.isCurrentContext() &&
      !this.viewModel.loading &&
      !this.productDataLoadService.isLoading &&
      !this.bleService.isWriting &&
      this.lockModeWriteState.status !== 'executing' &&
      this.userSpeedWriteState.status !== 'executing' &&
      this.userTimingWriteState.status !== 'executing' &&
      this.userPeripheralWriteState.status !== 'executing' &&
      this.weightRangeWriteState.status !== 'executing' &&
      this.professionalInputWriteState.status !== 'executing' &&
      this.professionalScalarWriteState.status !== 'executing' &&
      this.nameRoomWriteState.status !== 'executing' &&
      !this.productDateActionBusy &&
      !this.sensitiveActionBusy;
  }

  get hasProductNavigationContext(): boolean {
    return this.context !== null;
  }

  get showWidoorOpenCommand(): boolean {
    return this.context?.profile === 'widoor' &&
      this.config.profile === 'widoor';
  }

  get showProductMotorCommands(): boolean {
    return this.context?.profile === this.config.profile &&
      this.productCommands.length > 0;
  }

  get showNameRoomControls(): boolean {
    return this.pageContextCurrent && this.nameRoomDraft !== null;
  }

  get showLockModeControls(): boolean {
    return this.pageContextCurrent &&
      this.userFieldVisible('lock-mode') &&
      this.lockModeControls.length > 0 &&
      this.viewModel.reads.userParameters.status === 'available';
  }

  get showUserSpeedControls(): boolean {
    return this.pageContextCurrent &&
      this.userSpeedControls.length > 0 &&
      this.viewModel.reads.userParameters.status === 'available';
  }

  get showUserTimingControls(): boolean {
    return this.pageContextCurrent &&
      this.userTimingControls.length > 0 &&
      this.viewModel.reads.userParameters.status === 'available';
  }

  get showUserPeripheralControls(): boolean {
    return this.pageContextCurrent &&
      this.userPeripheralControls.length > 0 &&
      this.viewModel.reads.userParameters.status === 'available';
  }

  get showWeightRangeControls(): boolean {
    return this.pageContextCurrent &&
      this.weightRangeControls.length > 0 &&
      this.viewModel.reads.professionalParameters.status === 'available';
  }

  get showProfessionalInputControls(): boolean {
    return this.pageContextCurrent &&
      this.professionalInputControls.length > 0 &&
      this.viewModel.reads.professionalParameters.status === 'available';
  }

  get showProfessionalScalarControls(): boolean {
    return this.pageContextCurrent &&
      this.visibleProfessionalScalarControls.length > 0 &&
      this.viewModel.reads.professionalParameters.status === 'available';
  }

  get hasUnlockedProductControls(): boolean {
    return this.controlLocks.hasUnlockedControls;
  }

  lockAllProductControls(): void {
    this.controlLocks.lockAll();
  }

  get showProductDateMaintenanceAction(): boolean {
    return this.currentProductDateMaintenanceActionKind() !== null;
  }

  get productDateMaintenanceActionLabel(): string {
    return this.currentProductDateMaintenanceActionKind() ===
      'first-commissioning'
      ? this.text.productDateActions.setupLabel
      : this.text.productDateActions.maintenanceLabel;
  }

  get productDateActionBusy(): boolean {
    return this.productDateActionState.status === 'awaiting-confirmation' ||
      this.productDateActionState.status === 'executing';
  }

  get sensitiveActionBusy(): boolean {
    return this.sensitiveActionState.status === 'awaiting-confirmation' ||
      this.sensitiveActionState.status === 'executing';
  }

  get visibleProfessionalScalarControls(): typeof this.professionalScalarControls {
    return this.professionalScalarControls.filter((control) =>
      this.canShowProfessionalField(control.config.field),
    );
  }

  get professionalAccessGranted(): boolean {
    return this.professionalAccessService.isAuthenticated(
      this.currentProfessionalAccessContext(),
    );
  }

  get showProfessionalAccessPrompt(): boolean {
    return this.pageContextCurrent &&
      this.viewModel.reads.professionalParameters.status === 'available' &&
      this.professionalAccessControlsAvailable &&
      !this.professionalAccessGranted;
  }

  get professionalAccessControlsAvailable(): boolean {
    return this.config.professionalFields.some((field) =>
      productProfessionalFieldRequiresAccess(this.config.profile, field),
    );
  }

  get canOpenWidoor(): boolean {
    return this.canExecuteWidoorCommand(WIDOOR_COMMAND_UI_CONFIGS[0]);
  }

  get canCloseWidoor(): boolean {
    return this.canExecuteWidoorCommand(WIDOOR_COMMAND_UI_CONFIGS[1]);
  }

  canExecuteWidoorCommand(config: WidoorCommandUiConfig): boolean {
    return this.canExecuteProductCommand(config);
  }

  canExecuteProductCommand(config: WidoorCommandUiConfig): boolean {
    if (!MOTOR_COMMAND_UI_CONFIGS[this.config.profile].includes(config) ||
        config.profile !== this.config.profile ||
        !config.enabled ||
        !this.showProductMotorCommands ||
        !this.isCurrentContext() ||
        this.viewModel.loading ||
        this.productDataLoadService.isLoading ||
        this.bleService.isWriting ||
        this.bleService.disconnectingDeviceId !== null ||
        this.bleWriteExecutionService.isExecuting ||
        this.lockModeWriteState.status === 'executing' ||
        this.userSpeedWriteState.status === 'executing' ||
        this.userTimingWriteState.status === 'executing' ||
        this.userPeripheralWriteState.status === 'executing' ||
        this.weightRangeWriteState.status === 'executing' ||
        this.professionalInputWriteState.status === 'executing' ||
        this.professionalScalarWriteState.status === 'executing' ||
        this.nameRoomWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.motorCommandsBlockedByLockMode() ||
        this.commandInProgress) {
      return false;
    }
    const write = this.productCommandWrites.get(config.command);
    if (write === undefined) {
      return false;
    }
    const properties = this.bleService.getGattCharacteristicProperties(
      write.serviceUuid,
      write.characteristicUuid,
      this.context?.deviceId,
    );
    return properties.servicePresent &&
      properties.characteristicPresent &&
      properties.propertiesAvailable &&
      properties.write === true;
  }

  get commandInProgress(): boolean {
    return this.openCommandState.status === 'awaiting-confirmation' ||
      this.openCommandState.status === 'executing';
  }

  get commandHistory(): readonly ProductCommandHistoryEntry[] {
    if (this.context !== null &&
        (this.bleService.connectedDeviceId !== this.context.deviceId ||
          this.bleService.connectionGeneration !==
            this.context.connectionGeneration)) {
      this.commandHistoryEntries = [];
    }
    return this.commandHistoryEntries;
  }

  get displayedOpenCommandStatus(): ProductOpenCommandStatus {
    if (this.showProductMotorCommands && !this.pageContextCurrent) {
      return this.bleService.connectedDeviceId === null
        ? 'disconnected'
        : 'stale';
    }
    return this.openCommandState.status;
  }

  get displayedOpenCommandMessage(): string | null {
    switch (this.displayedOpenCommandStatus) {
      case 'disconnected':
        return this.text.openCommand.disconnected;
      case 'stale':
        return this.text.openCommand.stale;
      default:
        return this.openCommandState.message;
    }
  }

  get openCommandTone(): 'success' | 'neutral' | 'warning' | 'error' {
    switch (this.displayedOpenCommandStatus) {
      case 'confirmed':
        return 'success';
      case 'timeout':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'neutral';
    }
  }

  commandHistoryStatusLabel(entry: ProductCommandHistoryEntry): string {
    const statuses = this.text.commandHistory.statuses;
    switch (entry.status) {
      case 'confirmed': return statuses.confirmed;
      case 'timeout': return statuses.timeout;
      case 'failed': return statuses.failed;
      case 'disconnected': return statuses.disconnected;
      case 'stale': return statuses.stale;
      case 'unavailable': return statuses.unavailable;
      case 'cancelled': return statuses.cancelled;
      default: return entry.status;
    }
  }

  commandHistoryConfirmationLabel(entry: ProductCommandHistoryEntry): string {
    const confirmations = this.text.commandHistory.confirmations;
    switch (entry.confirmationStatus) {
      case 'confirmed': return confirmations.confirmed;
      case 'timeout': return confirmations.timeout;
      case 'unavailable': return confirmations.unavailable;
      case 'not-required': return confirmations.notRequired;
      case 'not-validated': return confirmations.notValidated;
      case null: return confirmations.none;
    }
  }

  commandHistoryTimedCycleLabel(entry: ProductCommandHistoryEntry): string {
    const cycles = this.text.commandHistory.timedCycles;
    switch (entry.timedCycleValidationStatus) {
      case 'not-observed': return cycles.notObserved;
      case 'pending-physical-validation':
        return cycles.pendingPhysicalValidation;
      case 'validated': return cycles.validated;
      case 'failed': return cycles.failed;
    }
  }

  get pageContextCurrent(): boolean {
    return this.isCurrentContext();
  }

  get displayedConnectionState(): ProductConnectionState {
    return this.viewModel.connectionState === 'connected' &&
      !this.pageContextCurrent
      ? 'stale'
      : this.viewModel.connectionState;
  }

  get userRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.userParameters.value;
    return value === null ? [] : this.createUserRows(value);
  }

  get professionalRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.professionalParameters.value;
    return value === null ? [] : this.createProfessionalRows(value);
  }

  get userTechnicalRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.userParameters.value;
    if (value === null) {
      return [];
    }
    return [
      this.row('lock-mode-raw', this.text.user.lockModeRaw,
        String(value.lockModeRaw)),
      this.row('user-peripheral-byte-1', this.text.user.peripheralByte1,
        this.formatByte(value.peripheralByte1)),
      this.row('user-peripheral-byte-2', this.text.user.peripheralByte2,
        this.formatByte(value.peripheralByte2)),
    ];
  }

  get professionalPeripheralDiagnosticRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.professionalParameters.value;
    if (value === null || !this.professionalFieldVisible('peripherals')) {
      return [];
    }

    return createProfessionalPeripheralDiagnosticRows(
      value,
      this.text.professionalPeripheralDiagnostics,
      {
        includeLock: value.profile !== 'widoor' || this.widoorLockSupported(),
      },
    );
  }

  get professionalTechnicalRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.professionalParameters.value;
    if (value === null || !this.professionalFieldVisible('peripherals')) {
      return [];
    }
    const peripheralLabel = value.profile === 'widoor' &&
      !this.widoorLockSupported()
      ? this.text.professional.peripheralsWithoutLock
      : this.text.professional.peripherals;
    return [this.row(
      'professional-peripherals',
      peripheralLabel,
      this.formatBytes([value.peripheralByte1, value.peripheralByte2]),
    )];
  }

  get versionRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.version.value;
    if (value === null) {
      return [];
    }
    return [
      this.row('motor-version', this.text.version.motor,
        this.formatSoftwareVersion(value.motorSoftware)),
      this.row('ble-version', this.text.version.ble,
        this.formatSoftwareVersion(value.bleSoftware)),
      this.row('stack-version', this.text.version.stack,
        this.formatStackVersion(value.stack)),
      this.row('motor-address', this.text.version.motorAddress,
        value.motorAddressHex ?? this.text.noValue),
    ];
  }

  get versionTechnicalRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.version.value;
    return value === null ? [] : [
      this.row('product-type', this.text.version.productType,
        String(value.productType)),
      this.row('product-subtype', this.text.version.productSubtype,
        String(value.productSubtype)),
      this.row('crc', this.text.version.crc, String(value.crc)),
    ];
  }

  get datesRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.datesAndCycles.value;
    if (value === null) {
      return [];
    }
    return [
      this.row(
        'first-commissioning',
        this.text.dates.firstCommissioning,
        this.formatHistoricalDate(value.firstCommissioningDate),
      ),
      this.row(
        'last-maintenance',
        this.text.dates.lastMaintenance,
        this.formatHistoricalDate(value.lastMaintenanceDate),
      ),
      this.row(
        'total-cycles',
        this.text.dates.totalCycles,
        String(value.totalCycles),
      ),
      this.row(
        'cycles-since-maintenance',
        this.text.dates.cyclesSinceMaintenance,
        String(value.cyclesSinceMaintenance),
      ),
    ];
  }

  get datesTechnicalRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.datesAndCycles.value;
    return value === null ? [] : [this.row(
      'historical-fad',
      this.text.historicalFad,
      `${this.formatBytes(value.historicalFadDate.raw)} — ` +
        this.text.historicalFadNotice,
    )];
  }

  get hasTechnicalDetails(): boolean {
    return Object.values(this.viewModel.reads).some(
      ({ result }) => result !== null,
    );
  }

  get maintenanceRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.maintenance.value;
    if (value === null) {
      return [];
    }
    return [
      this.row('initializations', this.text.maintenance.initializationCount,
        String(value.initializationCount)),
      this.row('cycles-since-init',
        this.text.maintenance.cyclesSinceInitialization,
        String(value.cyclesSinceInitialization)),
      this.row('obstacles', this.text.maintenance.obstacleDetectionCount,
        String(value.obstacleDetectionCount)),
      this.row('wrong-open', this.text.maintenance.wrongStopOpenCount,
        String(value.wrongStopOpenCount)),
      this.row('wrong-close', this.text.maintenance.wrongStopCloseCount,
        String(value.wrongStopCloseCount)),
      this.row('learning', this.text.maintenance.learningCycleCount,
        String(value.learningCycleCount)),
      this.row('encoder-errors', this.text.maintenance.encoderErrorCount,
        String(value.encoderErrorCount)),
      this.row('motor-errors', this.text.maintenance.motorErrorCount,
        String(value.motorErrorCount)),
    ];
  }

  currentProductDateMaintenanceActionKind():
    ProductDateMaintenanceFlowKind | null {
    const dates = this.viewModel.reads.datesAndCycles.value;
    const context = this.currentProductDateActionContext();
    if (dates === null || context === null) {
      return null;
    }
    const flow = prepareProductDateMaintenanceFlow({
      context,
      firstCommissioningDate: dates.firstCommissioningDate,
      now: new Date(2000, 0, 1, 0),
      attemptId: 'preview',
      confirmationId: 'preview',
      confirmedAt: 0,
    });
    return flow.ok ? flow.kind : null;
  }

  canRequestProductDateMaintenanceAction(): boolean {
    const dates = this.viewModel.reads.datesAndCycles.value;
    const context = this.context;
    if (dates === null ||
        context === null ||
        this.currentProductDateMaintenanceActionKind() === null ||
        !this.isCurrentContext() ||
        this.viewModel.loading ||
        this.productDataLoadService.isLoading ||
        this.bleService.isWriting ||
        this.bleService.disconnectingDeviceId !== null ||
        this.bleWriteExecutionService.isExecuting ||
        this.lockModeWriteState.status === 'executing' ||
        this.userSpeedWriteState.status === 'executing' ||
        this.userTimingWriteState.status === 'executing' ||
        this.userPeripheralWriteState.status === 'executing' ||
        this.weightRangeWriteState.status === 'executing' ||
        this.professionalInputWriteState.status === 'executing' ||
        this.professionalScalarWriteState.status === 'executing' ||
        this.nameRoomWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const flow = prepareProductDateMaintenanceFlow({
      context: this.productDateActionContext(context),
      firstCommissioningDate: dates.firstCommissioningDate,
      now: new Date(),
      attemptId: 'availability',
      confirmationId: 'availability',
      confirmedAt: Date.now(),
    });
    if (!flow.ok) {
      return false;
    }
    return flow.actions.every(({ write }) => {
      const properties = this.bleService.getGattCharacteristicProperties(
        write.serviceUuid,
        write.characteristicUuid,
        context.deviceId,
      );
      return properties.servicePresent &&
        properties.characteristicPresent &&
        properties.propertiesAvailable &&
        properties.write === true;
    });
  }

  get motorRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.motorState;
    if (value === null) {
      return [];
    }
    const rows: ProductDisplayRow[] = [
      this.row('motor-raw-state', this.text.motor.rawState,
        value.state === null ? this.text.noValue : this.formatByte(value.state)),
      this.row('motor-state-label', this.text.motor.stateLabel,
        this.motorStateLabel(value.state)),
      this.row('motor-position', this.text.motor.currentPosition,
        this.optionalNumber(value.currentPosition)),
      this.row('motor-maximum', this.text.motor.maximumPosition,
        this.optionalNumber(value.maximumPosition)),
    ];
    if (value.currentPosition !== null &&
        value.maximumPosition !== null &&
        value.maximumPosition > 0) {
      rows.push(this.row(
        'motor-percentage',
        this.text.motor.percentage,
        `${Math.round(
          (value.currentPosition / value.maximumPosition) * 100,
        )} %`,
      ));
    }
    rows.push(this.row(
      'motor-error',
      this.text.motor.error,
      this.optionalNumber(value.error),
    ));
    if (value.switches !== null) {
      rows.push(this.row(
        'motor-switches',
        this.text.motor.switchesRaw,
        this.formatByte(value.switches.raw),
      ));
      if (!this.config.hiddenMotorSwitches.includes('push-and-go')) {
        rows.push(this.booleanRow(
          'push-and-go',
          this.text.motor.pushAndGo,
          value.switches.pushAndGo,
        ));
      }
      rows.push(this.booleanRow(
        'ble-switch',
        this.text.motor.ble,
        value.switches.ble,
      ));
      if (!this.config.hiddenMotorSwitches.includes('automatic-manual')) {
        rows.push(this.booleanRow(
          'automatic-manual',
          this.text.motor.automaticManual,
          value.switches.automaticManual,
        ));
      }
      if (!this.config.hiddenMotorSwitches.includes('direction')) {
        rows.push(this.booleanRow(
          'direction',
          this.text.motor.direction,
          value.switches.direction,
        ));
      }
      rows.push(this.booleanRow(
        'pairing',
        this.text.motor.pairing,
        value.switches.pairing,
      ));
    }
    return rows;
  }

  get globalStatusLabel(): string {
    const status = this.viewModel.loadStatus;
    if (status === null) {
      return this.text.states.notLoaded;
    }
    switch (status) {
      case 'success':
        return this.text.states.success;
      case 'partial-success':
        return this.text.states.partialSuccess;
      case 'failed':
        return this.text.states.failed;
      case 'disconnected':
        return this.text.states.disconnected;
      case 'stale':
        return this.text.states.stale;
      case 'cancelled':
        return this.text.states.cancelled;
    }
  }

  async refreshProductData(): Promise<void> {
    if (!this.canRefresh || this.context === null) {
      return;
    }
    const cycle = ++this.loadCycle;
    const context = this.context;
    this.viewModel = {
      ...this.viewModel,
      loading: true,
      globalError: null,
    };

    try {
      const result = await this.productDataLoadService.loadProductData(
        context.profile,
        context.deviceId,
      );
      if (!this.isCurrentLoad(cycle, context)) {
        return;
      }
      if (result.profile !== context.profile ||
          result.deviceId !== context.deviceId ||
          result.connectionGeneration !== context.connectionGeneration) {
        return;
      }
      this.applyLoadResult(result);
    } finally {
      if (cycle === this.loadCycle && !this.destroyed) {
        this.viewModel = {
          ...this.viewModel,
          loading: false,
        };
      }
    }
  }

  readStatusLabel(state: ProductReadViewState<unknown>): string {
    const errorCode = state.result?.error?.code;
    switch (errorCode) {
      case 'service-absent':
      case 'services-not-discovered':
        return this.text.errors.serviceAbsent;
      case 'characteristic-absent':
        return this.text.errors.characteristicAbsent;
      case 'not-readable':
        return this.text.errors.notReadable;
      case 'disconnected':
      case 'not-connected':
        return this.text.states.disconnected;
      case 'stale':
        return this.text.states.stale;
      case 'invalid-frame':
        return this.text.states.invalid;
      case 'native-read-failed':
        return this.text.errors.unknown;
    }
    switch (state.status) {
      case 'available':
        return this.text.states.available;
      case 'unavailable':
        return this.text.states.unavailable;
      case 'invalid':
        return this.text.states.invalid;
      case 'failed':
        return this.text.states.failed;
      case 'disconnected':
        return this.text.states.disconnected;
      case 'stale':
        return this.text.states.stale;
      case 'not-loaded':
        return this.text.states.notLoaded;
    }
  }

  readStatusDetail(state: ProductReadViewState<unknown>): string | null {
    switch (state.result?.error?.code) {
      case 'service-absent':
      case 'services-not-discovered':
        return this.text.errorDetails.serviceAbsent;
      case 'characteristic-absent':
        return this.text.errorDetails.characteristicAbsent;
      case 'not-readable':
        return this.text.errorDetails.notReadable;
      default:
        return null;
    }
  }

  readStatusTone(
    state: ProductReadViewState<unknown>,
  ): 'success' | 'neutral' | 'warning' | 'error' {
    if (state.status === 'available') {
      return 'success';
    }
    if (state.status === 'invalid') {
      return 'warning';
    }
    return state.status === 'failed' ? 'error' : 'neutral';
  }

  connectionStateLabel(state: ProductConnectionState): string {
    switch (state) {
      case 'connected':
        return this.text.states.connected;
      case 'disconnected':
        return this.text.states.disconnected;
      case 'stale':
        return this.text.states.stale;
      case 'invalid-profile':
        return this.text.states.invalidProfile;
    }
  }

  formatTimestamp(value: number | null): string {
    return formatProductTimestamp(value) ?? this.text.states.notLoaded;
  }

  async requestWidoorOpen(): Promise<void> {
    return this.requestWidoorCommand(WIDOOR_COMMAND_UI_CONFIGS[0]);
  }

  async requestWidoorClose(): Promise<void> {
    return this.requestWidoorCommand(WIDOOR_COMMAND_UI_CONFIGS[1]);
  }

  async requestWidoorCommand(config: WidoorCommandUiConfig): Promise<void> {
    return this.requestProductCommand(config);
  }

  currentNameRoomValue(): ProductNameRoomDraft {
    return Object.freeze({
      name: this.viewModel.displayedName,
      roomSuffix: this.viewModel.roomSuffix as ProductRoomSuffix | null,
    });
  }

  nameRoomDraftValue(): ProductNameRoomDraft {
    return this.nameRoomDraft ?? createProductNameRoomDraft(
      this.currentNameRoomValue(),
    );
  }

  get nameRoomControlUnlocked(): boolean {
    return this.controlLocks.isUnlocked('name-room');
  }

  toggleNameRoomControlLock(): void {
    this.controlLocks.toggle('name-room');
  }

  setNameRoomDraftName(
    eventOrValue: CustomEvent<{ readonly value?: string | null }> | string,
  ): void {
    if (!this.showNameRoomControls) {
      return;
    }
    const value = typeof eventOrValue === 'string'
      ? eventOrValue
      : eventOrValue.detail.value ?? '';
    this.nameRoomDraft = Object.freeze({
      ...this.nameRoomDraftValue(),
      name: value,
    });
    this.resetSettledNameRoomWriteState();
  }

  setNameRoomDraftRoom(
    eventOrValue:
      CustomEvent<{ readonly value?: ProductRoomSuffix | null }> |
      ProductRoomSuffix |
      null,
  ): void {
    if (!this.showNameRoomControls) {
      return;
    }
    const value = typeof eventOrValue === 'string' ||
        eventOrValue === null
      ? eventOrValue
      : eventOrValue.detail.value ?? null;
    this.nameRoomDraft = Object.freeze({
      ...this.nameRoomDraftValue(),
      roomSuffix: value,
    });
    this.resetSettledNameRoomWriteState();
  }

  nameRoomValidationMessage(): string | null {
    const result = validateProductNameRoomDraft(
      this.currentNameRoomValue(),
      this.nameRoomDraftValue(),
    );
    if (result.valid || result.error === 'unchanged') {
      return null;
    }
    switch (result.error) {
      case 'empty':
        return this.text.nameRoomControls.errors.empty;
      case 'invalid-characters':
        return this.text.nameRoomControls.errors.invalidCharacters;
      case 'too-long':
        return this.text.nameRoomControls.errors.tooLong;
      case 'too-short':
        return this.text.nameRoomControls.errors.tooShort;
      case 'invalid-room':
        return this.text.nameRoomControls.errors.invalidRoom;
    }
  }

  currentNameRoomDisplay(): string {
    const current = this.currentNameRoomValue();
    return `${current.name}${current.roomSuffix ?? ''}`.trim() ||
      this.text.noValue;
  }

  nameRoomDraftDisplay(): string {
    const current = this.currentNameRoomValue();
    const draft = this.nameRoomDraftValue();
    const name = draft.name.trim() || current.name;
    return `${name}${draft.roomSuffix ?? ''}`.trim() || this.text.noValue;
  }

  canApplyNameRoom(): boolean {
    if (!this.showNameRoomControls ||
        !this.isCurrentContext() ||
        this.viewModel.loading ||
        this.productDataLoadService.isLoading ||
        this.bleService.isWriting ||
        this.bleService.disconnectingDeviceId !== null ||
        this.bleWriteExecutionService.isExecuting ||
        this.lockModeWriteState.status === 'executing' ||
        this.userSpeedWriteState.status === 'executing' ||
        this.userTimingWriteState.status === 'executing' ||
        this.userPeripheralWriteState.status === 'executing' ||
        this.weightRangeWriteState.status === 'executing' ||
        this.professionalInputWriteState.status === 'executing' ||
        this.professionalScalarWriteState.status === 'executing' ||
        this.nameRoomWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress ||
        this.context === null) {
      return false;
    }
    const validation = validateProductNameRoomDraft(
      this.currentNameRoomValue(),
      this.nameRoomDraftValue(),
    );
    if (!validation.valid) {
      return false;
    }
    const write = encodeProductNameRoomWrite(this.config.profile, validation);
    const properties = this.bleService.getGattCharacteristicProperties(
      write.serviceUuid,
      write.characteristicUuid,
      this.context.deviceId,
    );
    return properties.servicePresent &&
      properties.characteristicPresent &&
      properties.propertiesAvailable &&
      properties.write === true;
  }

  currentUserSpeedValue(config: ProductUserSpeedUiConfig): number | null {
    const value = this.viewModel.reads.userParameters.value;
    if (value === null) {
      return null;
    }
    return config.field === 'open-speed'
      ? value.openSpeed
      : value.closeSpeed;
  }

  userSpeedDraftValue(config: ProductUserSpeedUiConfig): number {
    return this.userSpeedDrafts.get(config.field) ??
      this.currentUserSpeedValue(config) ??
      config.range.min;
  }

  setUserSpeedDraftValue(
    config: ProductUserSpeedUiConfig,
    eventOrValue: Event | number,
  ): void {
    if (!this.isUserSpeedControl(config)) {
      return;
    }
    const value = typeof eventOrValue === 'number'
      ? eventOrValue
      : rangeEventNumber(eventOrValue);
    if (value === null || !isValidProductUserSpeedValue(config, value)) {
      return;
    }
    this.userSpeedDrafts.set(config.field, value);
    if (this.userSpeedWriteState.field === config.field &&
        this.userSpeedWriteState.status !== 'executing') {
      this.userSpeedWriteState = Object.freeze({
        status: 'idle',
        field: null,
        message: null,
      });
    }
  }

  isUserSpeedUnlocked(config: ProductUserSpeedUiConfig): boolean {
    return this.controlLocks.isUnlocked(`user-speed:${config.field}`);
  }

  toggleUserSpeedLock(config: ProductUserSpeedUiConfig): void {
    this.controlLocks.toggle(`user-speed:${config.field}`);
  }

  stepUserSpeedDraft(
    config: ProductUserSpeedUiConfig,
    direction: ProductDraftStepDirection,
  ): void {
    if (!this.isUserSpeedUnlocked(config)) {
      return;
    }
    this.setUserSpeedDraftValue(
      config,
      stepProductDraftValue(
        this.userSpeedDraftValue(config),
        direction,
        config.range,
      ),
    );
  }

  canApplyUserSpeed(config: ProductUserSpeedUiConfig): boolean {
    if (!this.isUserSpeedControl(config) ||
        !this.showUserSpeedControls ||
        !this.isCurrentContext() ||
        this.viewModel.loading ||
        this.productDataLoadService.isLoading ||
        this.bleService.isWriting ||
        this.bleService.disconnectingDeviceId !== null ||
        this.bleWriteExecutionService.isExecuting ||
        this.lockModeWriteState.status === 'executing' ||
        this.userSpeedWriteState.status === 'executing' ||
        this.userTimingWriteState.status === 'executing' ||
        this.userPeripheralWriteState.status === 'executing' ||
        this.weightRangeWriteState.status === 'executing' ||
        this.professionalInputWriteState.status === 'executing' ||
        this.professionalScalarWriteState.status === 'executing' ||
        this.nameRoomWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const currentValue = this.currentUserSpeedValue(config);
    const draftValue = this.userSpeedDraftValue(config);
    if (currentValue === null ||
        draftValue === currentValue ||
        !isValidProductUserSpeedValue(config, draftValue)) {
      return false;
    }
    const write = this.userSpeedWrites.get(config.field);
    if (write === undefined) {
      return false;
    }
    const properties = this.bleService.getGattCharacteristicProperties(
      write.serviceUuid,
      write.characteristicUuid,
      this.context?.deviceId,
    );
    return properties.servicePresent &&
      properties.characteristicPresent &&
      properties.propertiesAvailable &&
      properties.write === true;
  }

  currentUserTimingValue(config: ProductUserTimingUiConfig): number | null {
    const value = this.viewModel.reads.userParameters.value;
    if (value === null) {
      return null;
    }
    return config.field === 'short-timing'
      ? value.shortOpenTime
      : value.longOpenTime;
  }

  userTimingDraftValue(config: ProductUserTimingUiConfig): number {
    return this.userTimingDrafts.get(config.field) ??
      this.currentUserTimingValue(config) ??
      config.range.min;
  }

  setUserTimingDraftValue(
    config: ProductUserTimingUiConfig,
    eventOrValue: Event | number,
  ): void {
    if (!this.isUserTimingControl(config)) {
      return;
    }
    const value = typeof eventOrValue === 'number'
      ? eventOrValue
      : rangeEventNumber(eventOrValue);
    if (value === null || !isValidProductUserTimingValue(config, value)) {
      return;
    }
    this.userTimingDrafts.set(config.field, value);
    if (this.userTimingWriteState.field === config.field &&
        this.userTimingWriteState.status !== 'executing') {
      this.userTimingWriteState = Object.freeze({
        status: 'idle',
        field: null,
        message: null,
      });
    }
  }

  isUserTimingUnlocked(config: ProductUserTimingUiConfig): boolean {
    return this.controlLocks.isUnlocked(`user-timing:${config.field}`);
  }

  toggleUserTimingLock(config: ProductUserTimingUiConfig): void {
    this.controlLocks.toggle(`user-timing:${config.field}`);
  }

  stepUserTimingDraft(
    config: ProductUserTimingUiConfig,
    direction: ProductDraftStepDirection,
  ): void {
    if (!this.isUserTimingUnlocked(config)) {
      return;
    }
    this.setUserTimingDraftValue(
      config,
      stepProductDraftValue(
        this.userTimingDraftValue(config),
        direction,
        config.range,
      ),
    );
  }

  canApplyUserTiming(config: ProductUserTimingUiConfig): boolean {
    if (!this.isUserTimingControl(config) ||
        !this.showUserTimingControls ||
        !this.isCurrentContext() ||
        this.viewModel.loading ||
        this.productDataLoadService.isLoading ||
        this.bleService.isWriting ||
        this.bleService.disconnectingDeviceId !== null ||
        this.bleWriteExecutionService.isExecuting ||
        this.lockModeWriteState.status === 'executing' ||
        this.userSpeedWriteState.status === 'executing' ||
        this.userTimingWriteState.status === 'executing' ||
        this.userPeripheralWriteState.status === 'executing' ||
        this.weightRangeWriteState.status === 'executing' ||
        this.professionalInputWriteState.status === 'executing' ||
        this.professionalScalarWriteState.status === 'executing' ||
        this.nameRoomWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const currentValue = this.currentUserTimingValue(config);
    const draftValue = this.userTimingDraftValue(config);
    if (currentValue === null ||
        draftValue === currentValue ||
        !isValidProductUserTimingValue(config, draftValue)) {
      return false;
    }
    const write = this.userTimingWrites.get(config.field);
    if (write === undefined) {
      return false;
    }
    const properties = this.bleService.getGattCharacteristicProperties(
      write.serviceUuid,
      write.characteristicUuid,
      this.context?.deviceId,
    );
    return properties.servicePresent &&
      properties.characteristicPresent &&
      properties.propertiesAvailable &&
      properties.write === true;
  }

  currentUserPeripheralState(
    config: ProductUserPeripheralUiConfig,
  ): boolean | null {
    const value = this.viewModel.reads.userParameters.value;
    if (value === null) {
      return null;
    }
    switch (config.field) {
      case 'static-light':
        return value.peripheralFlags.staticLight;
      case 'dynamic-light':
        return value.peripheralFlags.dynamicLight;
      case 'rgb':
        return value.peripheralFlags.rgbIndicator;
    }
  }

  canToggleUserPeripheral(config: ProductUserPeripheralUiConfig): boolean {
    if (!this.isUserPeripheralControl(config) ||
        !this.showUserPeripheralControls ||
        !this.isCurrentContext() ||
        this.viewModel.loading ||
        this.productDataLoadService.isLoading ||
        this.bleService.isWriting ||
        this.bleService.disconnectingDeviceId !== null ||
        this.bleWriteExecutionService.isExecuting ||
        this.lockModeWriteState.status === 'executing' ||
        this.userSpeedWriteState.status === 'executing' ||
        this.userTimingWriteState.status === 'executing' ||
        this.userPeripheralWriteState.status === 'executing' ||
        this.weightRangeWriteState.status === 'executing' ||
        this.professionalInputWriteState.status === 'executing' ||
        this.professionalScalarWriteState.status === 'executing' ||
        this.nameRoomWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const write = config.catalogFactory(true);
    const properties = this.bleService.getGattCharacteristicProperties(
      write.serviceUuid,
      write.characteristicUuid,
      this.context?.deviceId,
    );
    return properties.servicePresent &&
      properties.characteristicPresent &&
      properties.propertiesAvailable &&
      properties.write === true;
  }

  currentProfessionalInputMode(
    config: ProductProfessionalInputUiConfig,
  ): LegacyInputMode | null {
    const value = this.viewModel.reads.professionalParameters.value;
    if (value === null || value.profile !== config.profile) {
      return null;
    }
    const flags = decodeProfessionalPeripheralFlags(value.peripheralByte1);
    const radar = config.field === 'input-1'
      ? flags.input1Radar
      : flags.input2Radar;
    return radar ? 'radar' : 'button';
  }

  canChangeProfessionalInput(
    config: ProductProfessionalInputUiConfig,
    mode?: LegacyInputMode,
  ): boolean {
    if (!this.professionalInputControls.some((control) =>
          control.config === config,
        ) ||
        !this.showProfessionalInputControls ||
        !this.isCurrentContext() ||
        this.viewModel.loading ||
        this.productDataLoadService.isLoading ||
        this.bleService.isWriting ||
        this.bleService.disconnectingDeviceId !== null ||
        this.bleWriteExecutionService.isExecuting ||
        this.lockModeWriteState.status === 'executing' ||
        this.userSpeedWriteState.status === 'executing' ||
        this.userTimingWriteState.status === 'executing' ||
        this.userPeripheralWriteState.status === 'executing' ||
        this.weightRangeWriteState.status === 'executing' ||
        this.professionalInputWriteState.status === 'executing' ||
        this.professionalScalarWriteState.status === 'executing' ||
        this.nameRoomWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const current = this.currentProfessionalInputMode(config);
    if (current === null || (mode !== undefined && mode === current)) {
      return false;
    }
    const write = this.professionalInputWrites.get(config.field);
    if (write === undefined) {
      return false;
    }
    const properties = this.bleService.getGattCharacteristicProperties(
      write.serviceUuid,
      write.characteristicUuid,
      this.context?.deviceId,
    );
    return properties.servicePresent &&
      properties.characteristicPresent &&
      properties.propertiesAvailable &&
      properties.write === true;
  }

  get professionalInputControlUnlocked(): boolean {
    return this.controlLocks.isUnlocked('professional-inputs');
  }

  toggleProfessionalInputControlLock(): void {
    this.controlLocks.toggle('professional-inputs');
  }

  async requestProfessionalInputChange(
    config: ProductProfessionalInputUiConfig,
    eventOrMode: CustomEvent<{ readonly value?: LegacyInputMode }> |
      LegacyInputMode,
  ): Promise<void> {
    const mode = typeof eventOrMode === 'string'
      ? eventOrMode
      : eventOrMode.detail.value;
    if ((mode !== 'button' && mode !== 'radar') ||
        !this.canChangeProfessionalInput(config, mode) ||
        this.context === null) {
      return;
    }

    void triggerConfiguredHapticFeedback();
    const write = config.catalogFactory(mode);
    const context = this.context;
    const contextStatus = this.writeContextStatus(context, write);
    if (contextStatus !== null) {
      this.professionalInputWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.text.professionalInputControls.failed,
      });
      return;
    }
    const attemptId = this.nextCommandIdentifier('attempt');
    const confirmedAt = Date.now();
    const authorization = createProductProfessionalInputAuthorization({
      write,
      deviceId: context.deviceId,
      connectionGeneration: context.connectionGeneration,
      attemptId,
      confirmationId: this.nextCommandIdentifier('confirmation'),
      confirmedAt,
    });
    this.professionalInputWriteState = Object.freeze({
      status: 'executing',
      field: config.field,
      message: this.text.professionalInputControls.executing,
    });
    const result = await this.bleWriteExecutionService.execute({
      write,
      deviceId: context.deviceId,
      profile: config.profile,
      connectionGeneration: context.connectionGeneration,
      identification: { profile: config.profile, confidence: 'strong' },
      authorization,
      attemptId,
      confirmationPolicy: config.confirmationPolicy,
      policy: config.policy,
    });
    if (!this.isCurrentContext() || this.context !== context) {
      this.professionalInputWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.text.openCommand.stale,
      });
      return;
    }
    if (result.status === 'success') {
      this.professionalInputWriteState = Object.freeze({
        status: 'sent',
        field: config.field,
        message: this.text.professionalInputControls.sent,
      });
      if (this.canRefresh) {
        await this.refreshProductData();
      }
      return;
    }
    this.professionalInputWriteState = Object.freeze({
      status: 'failed',
      field: config.field,
      message: this.text.professionalInputControls.failed,
    });
  }

  currentWeightRangeValue(): ProductWeightRange | null {
    const value = this.viewModel.reads.professionalParameters.value;
    if (value === null) {
      return null;
    }
    return {
      lower: value.weightRangeLower,
      upper: value.weightRangeUpper,
    };
  }

  weightRangeDraftValue(): ProductWeightRange | null {
    const current = this.currentWeightRangeValue();
    return this.weightRangeDraft ??
      this.findWeightRangeControl(current)?.config.range ??
      null;
  }

  setWeightRangeDraftValue(
    eventOrRange: CustomEvent<{ readonly value?: unknown }> |
      ProductWeightRange,
  ): void {
    const candidate = isProductWeightRange(eventOrRange)
      ? eventOrRange
      : isProductWeightRange(eventOrRange.detail?.value)
        ? eventOrRange.detail.value
        : null;
    const config = this.findWeightRangeControl(candidate)?.config;
    if (config === undefined) {
      return;
    }
    this.weightRangeDraft = config.range;
    if (this.weightRangeWriteState.status !== 'executing') {
      this.weightRangeWriteState = Object.freeze({
        status: 'idle',
        message: null,
      });
    }
  }

  canApplyWeightRange(): boolean {
    if (!this.showWeightRangeControls ||
        !this.isCurrentContext() ||
        this.viewModel.loading ||
        this.productDataLoadService.isLoading ||
        this.bleService.isWriting ||
        this.bleService.disconnectingDeviceId !== null ||
        this.bleWriteExecutionService.isExecuting ||
        this.lockModeWriteState.status === 'executing' ||
        this.userSpeedWriteState.status === 'executing' ||
        this.userTimingWriteState.status === 'executing' ||
        this.userPeripheralWriteState.status === 'executing' ||
        this.weightRangeWriteState.status === 'executing' ||
        this.professionalInputWriteState.status === 'executing' ||
        this.professionalScalarWriteState.status === 'executing' ||
        this.nameRoomWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const currentValue = this.currentWeightRangeValue();
    const draftValue = this.weightRangeDraftValue();
    if (currentValue === null ||
        draftValue === null ||
        isSameProductWeightRange(currentValue, draftValue) ||
        !isValidProductWeightRange(this.weightRangeUiConfigs, draftValue)) {
      return false;
    }
    const config = this.findWeightRangeControl(draftValue)?.config;
    if (config === undefined) {
      return false;
    }
    const write = config.catalogFactory(draftValue);
    const properties = this.bleService.getGattCharacteristicProperties(
      write.serviceUuid,
      write.characteristicUuid,
      this.context?.deviceId,
    );
    return properties.servicePresent &&
      properties.characteristicPresent &&
      properties.propertiesAvailable &&
      properties.write === true;
  }

  currentProfessionalScalarValue(
    config: ProductProfessionalScalarUiConfig,
  ): number | null {
    const value = this.viewModel.reads.professionalParameters.value;
    if (value === null || value.profile !== config.profile) {
      return null;
    }
    switch (config.field) {
      case 'break-force-at-open':
        return value.profile === 'widoor' ? value.breakForceAtOpen : null;
      case 'near-open-speed':
        return value.nearOpenSpeed;
      case 'near-close-speed':
        return value.nearCloseSpeed;
      case 'near-open-torque':
        return value.profile === 'widoor' ? null : value.nearOpenTorque;
      case 'near-close-torque':
        return value.profile === 'widoor' ? null : value.nearCloseTorque;
      case 'braking-open-power':
        return value.profile === 'widoor' ? null : value.brakingOpenPower;
      case 'obstacle-sensitivity':
        return value.profile === 'widoor' ? null : value.obstacleSensitivity;
    }
  }

  professionalScalarDraftValue(
    config: ProductProfessionalScalarUiConfig,
  ): number {
    return this.professionalScalarDrafts.get(config.field) ??
      this.currentProfessionalScalarValue(config) ??
      config.range.min;
  }

  setProfessionalScalarDraftValue(
    config: ProductProfessionalScalarUiConfig,
    eventOrValue: Event | number,
  ): void {
    if (!this.isProfessionalScalarControl(config) ||
        !this.canShowProfessionalField(config.field)) {
      return;
    }
    const value = typeof eventOrValue === 'number'
      ? eventOrValue
      : rangeEventNumber(eventOrValue);
    if (value === null ||
        !isValidProductProfessionalScalarValue(config, value)) {
      return;
    }
    this.professionalScalarDrafts.set(config.field, value);
    if (this.professionalScalarWriteState.field === config.field &&
        this.professionalScalarWriteState.status !== 'executing') {
      this.professionalScalarWriteState = Object.freeze({
        status: 'idle',
        field: null,
        message: null,
      });
    }
  }

  isProfessionalScalarUnlocked(
    config: ProductProfessionalScalarUiConfig,
  ): boolean {
    return this.controlLocks.isUnlocked(
      `professional-scalar:${config.field}`,
    );
  }

  toggleProfessionalScalarLock(
    config: ProductProfessionalScalarUiConfig,
  ): void {
    this.controlLocks.toggle(`professional-scalar:${config.field}`);
  }

  stepProfessionalScalarDraft(
    config: ProductProfessionalScalarUiConfig,
    direction: ProductDraftStepDirection,
  ): void {
    if (!this.isProfessionalScalarUnlocked(config)) {
      return;
    }
    this.setProfessionalScalarDraftValue(
      config,
      stepProductDraftValue(
        this.professionalScalarDraftValue(config),
        direction,
        config.range,
      ),
    );
  }

  canApplyProfessionalScalar(
    config: ProductProfessionalScalarUiConfig,
  ): boolean {
    if (!this.isProfessionalScalarControl(config) ||
        !this.canShowProfessionalField(config.field) ||
        !this.showProfessionalScalarControls ||
        !this.isCurrentContext() ||
        this.viewModel.loading ||
        this.productDataLoadService.isLoading ||
        this.bleService.isWriting ||
        this.bleService.disconnectingDeviceId !== null ||
        this.bleWriteExecutionService.isExecuting ||
        this.lockModeWriteState.status === 'executing' ||
        this.userSpeedWriteState.status === 'executing' ||
        this.userTimingWriteState.status === 'executing' ||
        this.userPeripheralWriteState.status === 'executing' ||
        this.weightRangeWriteState.status === 'executing' ||
        this.professionalInputWriteState.status === 'executing' ||
        this.professionalScalarWriteState.status === 'executing' ||
        this.nameRoomWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const currentValue = this.currentProfessionalScalarValue(config);
    const draftValue = this.professionalScalarDraftValue(config);
    if (currentValue === null ||
        draftValue === currentValue ||
        !isValidProductProfessionalScalarValue(config, draftValue)) {
      return false;
    }
    const write = this.professionalScalarWrites.get(config.field);
    if (write === undefined) {
      return false;
    }
    const properties = this.bleService.getGattCharacteristicProperties(
      write.serviceUuid,
      write.characteristicUuid,
      this.context?.deviceId,
    );
    return properties.servicePresent &&
      properties.characteristicPresent &&
      properties.propertiesAvailable &&
      properties.write === true;
  }

  isLockModeActive(config: ProductLockModeUiConfig): boolean {
    return this.currentLockMode() === config.mode;
  }

  canToggleLockMode(config: ProductLockModeUiConfig): boolean {
    if (!this.lockModeControls.some((control) =>
          control.config === config,
        ) ||
        config.profile !== this.config.profile ||
        !this.showLockModeControls ||
        !this.isCurrentContext() ||
        this.viewModel.loading ||
        this.productDataLoadService.isLoading ||
        this.bleService.isWriting ||
        this.bleService.disconnectingDeviceId !== null ||
        this.bleWriteExecutionService.isExecuting ||
        this.lockModeWriteState.status === 'executing' ||
        this.userSpeedWriteState.status === 'executing' ||
        this.userTimingWriteState.status === 'executing' ||
        this.userPeripheralWriteState.status === 'executing' ||
        this.weightRangeWriteState.status === 'executing' ||
        this.professionalInputWriteState.status === 'executing' ||
        this.professionalScalarWriteState.status === 'executing' ||
        this.nameRoomWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const currentMode = this.currentLockMode();
    if (currentMode === null || currentMode === 'unknown') {
      return false;
    }
    if (currentMode !== 'none' && currentMode !== config.mode) {
      return false;
    }
    const nextMode = currentMode === config.mode ? 'none' : config.mode;
    const write = this.lockModeWrites.get(nextMode);
    if (write === undefined) {
      return false;
    }
    const properties = this.bleService.getGattCharacteristicProperties(
      write.serviceUuid,
      write.characteristicUuid,
      this.context?.deviceId,
    );
    return properties.servicePresent &&
      properties.characteristicPresent &&
      properties.propertiesAvailable &&
      properties.write === true;
  }

  sensitiveActionCurrentEnabled(
    config: ProductSensitiveActionUiConfig,
  ): boolean | null {
    if (config.control !== 'toggle') {
      return null;
    }
    const value = this.viewModel.reads.professionalParameters.value;
    if (value === null || value.profile !== 'widoor') {
      return null;
    }
    const flags = decodeProfessionalPeripheralFlags(value.peripheralByte1);
    switch (config.action) {
      case 'radar-test-1':
        return flags.radarTest1;
      case 'radar-test-2':
        return flags.radarTest2;
      case 'professional-peripheral-lock':
        return flags.locked;
      default:
        return null;
    }
  }

  canExecuteSensitiveAction(
    config: ProductSensitiveActionUiConfig,
  ): boolean {
    if (!this.sensitiveActions.includes(config) ||
        config.profile !== this.config.profile ||
        !this.isCurrentContext() ||
        this.context === null ||
        this.viewModel.loading ||
        this.productDataLoadService.isLoading ||
        this.bleService.isWriting ||
        this.bleService.disconnectingDeviceId !== null ||
        this.bleWriteExecutionService.isExecuting ||
        this.sensitiveActionBusy ||
        this.productDateActionBusy ||
        this.commandInProgress) {
      return false;
    }
    if (config.action === 'professional-peripheral-lock' &&
        !this.widoorLockSupported()) {
      return false;
    }
    const current = this.sensitiveActionCurrentEnabled(config);
    if (config.control === 'toggle' && current === null) {
      return false;
    }
    const steps = productSensitiveActionWriteSteps(
      config,
      config.control === 'toggle' ? !current! : undefined,
    );
    return steps.every(({ write }) => {
      const properties = this.bleService.getGattCharacteristicProperties(
        write.serviceUuid,
        write.characteristicUuid,
        this.context?.deviceId,
      );
      return properties.servicePresent &&
        properties.characteristicPresent &&
        properties.propertiesAvailable &&
        properties.write === true;
    });
  }

  async requestSensitiveAction(
    config: ProductSensitiveActionUiConfig,
    eventOrChecked?: CustomEvent<{ readonly checked: boolean }> | boolean,
  ): Promise<void> {
    if (!this.canExecuteSensitiveAction(config) || this.context === null) {
      return;
    }
    const current = this.sensitiveActionCurrentEnabled(config);
    const enabled = config.control === 'toggle'
      ? (typeof eventOrChecked === 'boolean'
          ? eventOrChecked
          : eventOrChecked?.detail.checked)
      : undefined;
    if (config.control === 'toggle' &&
        (enabled === undefined || enabled === current)) {
      return;
    }

    void triggerConfiguredHapticFeedback();
    const context = this.context;

    if (config.requiresConfirmation) {
      this.sensitiveActionState = Object.freeze({
        status: 'awaiting-confirmation',
        action: config.action,
        message: this.text.sensitiveActions.awaitingConfirmation,
      });
      const learning = config.action === 'learning';
      const alert = await this.alertController.create({
        header: learning
          ? this.text.sensitiveActions.learningConfirmTitle
          : this.text.sensitiveActions.resetConfirmTitle,
        message: learning
          ? this.text.sensitiveActions.learningConfirmMessage
          : this.text.sensitiveActions.resetConfirmMessage,
        buttons: [
          { text: this.text.sensitiveActions.cancel, role: 'cancel' },
          { text: this.text.sensitiveActions.confirm, role: 'confirm' },
        ],
      });
      await alert.present();
      const dismissal = await alert.onDidDismiss();
      if (dismissal.role !== 'confirm') {
        this.sensitiveActionState = Object.freeze({
          status: 'cancelled',
          action: config.action,
          message: this.text.sensitiveActions.cancelled,
        });
        return;
      }
      if (!this.isCurrentContext() || this.context !== context) {
        this.sensitiveActionState = Object.freeze({
          status: 'failed',
          action: config.action,
          message: this.text.openCommand.stale,
        });
        return;
      }
    }

    const steps = productSensitiveActionWriteSteps(config, enabled);
    this.sensitiveActionState = Object.freeze({
      status: 'executing',
      action: config.action,
      message: this.text.sensitiveActions.executing,
    });

    for (const [index, step] of steps.entries()) {
      const contextStatus = this.writeContextStatus(context, step.write);
      if (contextStatus !== null) {
        this.sensitiveActionState = Object.freeze({
          status: 'failed',
          action: config.action,
          message: this.text.sensitiveActions.failed,
        });
        return;
      }

      const attemptId = this.nextCommandIdentifier('attempt');
      const confirmedAt = Date.now();
      const authorization = createProductSensitiveActionAuthorization({
        write: step.write,
        deviceId: context.deviceId,
        connectionGeneration: context.connectionGeneration,
        attemptId,
        confirmationId: this.nextCommandIdentifier('confirmation'),
        confirmedAt,
      });
      const result = await this.bleWriteExecutionService.execute({
        write: step.write,
        deviceId: context.deviceId,
        profile: config.profile,
        connectionGeneration: context.connectionGeneration,
        identification: { profile: config.profile, confidence: 'strong' },
        authorization,
        attemptId,
        confirmationPolicy: { kind: 'gatt-only' },
        policy: step.policy,
      });

      if (!this.isCurrentContext() ||
          this.context !== context ||
          result.status !== 'success') {
        this.sensitiveActionState = Object.freeze({
          status: 'failed',
          action: config.action,
          message: this.text.sensitiveActions.failed,
        });
        return;
      }

      if (step.delayAfterMs > 0 && index < steps.length - 1) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, step.delayAfterMs),
        );
        if (!this.isCurrentContext() || this.context !== context) {
          this.sensitiveActionState = Object.freeze({
            status: 'failed',
            action: config.action,
            message: this.text.openCommand.stale,
          });
          return;
        }
      }
    }

    this.sensitiveActionState = Object.freeze({
      status: 'sent',
      action: config.action,
      message: this.text.sensitiveActions.sent,
    });
    if (this.canRefresh) {
      await this.refreshProductData();
    }
  }

  async requestProductCommand(config: WidoorCommandUiConfig): Promise<void> {
    if (!this.canExecuteProductCommand(config) ||
        this.context === null ||
        config.confirmationPolicy === null ||
        config.operation === 'motor-learning') {
      return;
    }

    void triggerConfiguredHapticFeedback();
    const operation: ProductMotorCommandOperation = config.operation;
    const write = this.productCommandWrites.get(config.command);
    if (write === undefined) {
      return;
    }
    const cycle = ++this.commandCycle;
    const context = this.context;
    const requestedAt = Date.now();
    this.openCommandState = Object.freeze({
      ...initialProductOpenCommandState(
        operation,
        config.label,
        config.expectedMotorStateRaw,
      ),
      status: 'awaiting-confirmation',
      startedAt: requestedAt,
      message: this.text.openCommand.awaitingConfirmation,
    });

    try {
      const alert = await this.alertController.create({
        header: config.confirmationTitle,
        message: config.confirmationMessage,
        buttons: [
          { text: this.text.openCommand.cancel, role: 'cancel' },
          { text: config.confirmationButtonLabel, role: 'confirm' },
        ],
      });
      if (!this.isCurrentCommandCycle(cycle)) {
        return;
      }
      await alert.present();
      const dismissal = await alert.onDidDismiss();
      if (!this.isCurrentCommandCycle(cycle)) {
        return;
      }
      if (dismissal.role !== 'confirm') {
        this.openCommandState = Object.freeze({
          ...initialProductOpenCommandState(
            operation,
            config.label,
            config.expectedMotorStateRaw,
          ),
          status: 'cancelled',
          startedAt: requestedAt,
          completedAt: Date.now(),
          message: this.text.openCommand.cancelled,
        });
        this.addCommandHistory(this.openCommandState);
        return;
      }

      const contextStatus = this.writeContextStatus(context, write);
      if (contextStatus !== null) {
        this.setOpenCommandContextFailure(
          contextStatus,
          requestedAt,
          config,
        );
        return;
      }

      const attemptId = this.nextCommandIdentifier('attempt');
      const confirmationId = this.nextCommandIdentifier('confirmation');
      const confirmedAt = Date.now();
      const authorization = createProductMotorCommandAuthorization({
        write,
        deviceId: context.deviceId,
        connectionGeneration: context.connectionGeneration,
        attemptId,
        confirmationId,
        confirmedAt,
        validatedAt: confirmedAt,
      });
      this.openCommandState = Object.freeze({
        ...initialProductOpenCommandState(
          operation,
          config.label,
          config.expectedMotorStateRaw,
        ),
        status: 'executing',
        startedAt: confirmedAt,
        message: this.text.openCommand.executing,
        attemptId,
      });

      const result = await this.bleWriteExecutionService.execute({
        write,
        deviceId: context.deviceId,
        profile: config.profile,
        connectionGeneration: context.connectionGeneration,
        identification: { profile: config.profile, confidence: 'strong' },
        authorization,
        attemptId,
        confirmationPolicy: config.confirmationPolicy,
        ...(config.physicalValidationPolicy === undefined
          ? {}
          : { policy: config.physicalValidationPolicy }),
      });
      if (!this.isCurrentCommandCycle(cycle)) {
        return;
      }
      const terminalContextStatus = this.writeContextStatus(
        context,
        write,
      );
      if (terminalContextStatus !== null) {
        this.setOpenCommandContextFailure(
          terminalContextStatus,
          result.startedAt,
          config,
          result.nativeWriteCompleted,
        );
        return;
      }
      this.applyOpenCommandResult(result, attemptId, config);
    } catch {
      if (this.isCurrentCommandCycle(cycle)) {
        this.openCommandState = Object.freeze({
          ...initialProductOpenCommandState(
            operation,
            config.label,
            config.expectedMotorStateRaw,
          ),
          status: 'failed',
          startedAt: requestedAt,
          completedAt: Date.now(),
          message: this.text.openCommand.failed,
          technicalErrorCode: 'open-command-ui-failed',
        });
        this.addCommandHistory(this.openCommandState);
      }
    }
  }

  async requestUserSpeedChange(
    config: ProductUserSpeedUiConfig,
  ): Promise<void> {
    if (!this.canApplyUserSpeed(config) || this.context === null) {
      return;
    }

    void triggerConfiguredHapticFeedback();
    const draftValue = this.userSpeedDraftValue(config);
    if (!isValidProductUserSpeedValue(config, draftValue)) {
      return;
    }
    const write = config.catalogFactory(draftValue);
    const context = this.context;
    const contextStatus = this.writeContextStatus(context, write);
    if (contextStatus !== null) {
      this.userSpeedWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.userSpeedFailureMessage(contextStatus),
      });
      return;
    }

    const attemptId = this.nextCommandIdentifier('attempt');
    const confirmedAt = Date.now();
    const authorization = createProductUserSpeedAuthorization({
      write,
      deviceId: context.deviceId,
      connectionGeneration: context.connectionGeneration,
      attemptId,
      confirmationId: this.nextCommandIdentifier('confirmation'),
      confirmedAt,
    });
    this.userSpeedWriteState = Object.freeze({
      status: 'executing',
      field: config.field,
      message: this.text.userSpeedControls.executing,
    });

    const result = await this.bleWriteExecutionService.execute({
      write,
      deviceId: context.deviceId,
      profile: config.profile,
      connectionGeneration: context.connectionGeneration,
      identification: { profile: config.profile, confidence: 'strong' },
      authorization,
      attemptId,
      confirmationPolicy: config.confirmationPolicy,
      policy: config.policy,
    });
    if (!this.isCurrentContext() || this.context !== context) {
      this.userSpeedWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.text.openCommand.stale,
      });
      return;
    }
    if (result.status === 'success') {
      this.userSpeedWriteState = Object.freeze({
        status: 'sent',
        field: config.field,
        message: this.text.userSpeedControls.sent,
      });
      if (this.canRefresh) {
        await this.refreshProductData();
      }
      return;
    }
    this.userSpeedWriteState = Object.freeze({
      status: 'failed',
      field: config.field,
      message: this.text.userSpeedControls.failed,
    });
  }

  async requestUserTimingChange(
    config: ProductUserTimingUiConfig,
  ): Promise<void> {
    if (!this.canApplyUserTiming(config) || this.context === null) {
      return;
    }

    void triggerConfiguredHapticFeedback();
    const draftValue = this.userTimingDraftValue(config);
    if (!isValidProductUserTimingValue(config, draftValue)) {
      return;
    }
    const write = config.catalogFactory(draftValue);
    const context = this.context;
    const contextStatus = this.writeContextStatus(context, write);
    if (contextStatus !== null) {
      this.userTimingWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.userTimingFailureMessage(contextStatus),
      });
      return;
    }

    const attemptId = this.nextCommandIdentifier('attempt');
    const confirmedAt = Date.now();
    const authorization = createProductUserTimingAuthorization({
      write,
      deviceId: context.deviceId,
      connectionGeneration: context.connectionGeneration,
      attemptId,
      confirmationId: this.nextCommandIdentifier('confirmation'),
      confirmedAt,
    });
    this.userTimingWriteState = Object.freeze({
      status: 'executing',
      field: config.field,
      message: this.text.userTimingControls.executing,
    });

    const result = await this.bleWriteExecutionService.execute({
      write,
      deviceId: context.deviceId,
      profile: config.profile,
      connectionGeneration: context.connectionGeneration,
      identification: { profile: config.profile, confidence: 'strong' },
      authorization,
      attemptId,
      confirmationPolicy: config.confirmationPolicy,
      policy: config.policy,
    });
    if (!this.isCurrentContext() || this.context !== context) {
      this.userTimingWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.text.openCommand.stale,
      });
      return;
    }
    if (result.status === 'success') {
      this.userTimingWriteState = Object.freeze({
        status: 'sent',
        field: config.field,
        message: this.text.userTimingControls.sent,
      });
      if (this.canRefresh) {
        await this.refreshProductData();
      }
      return;
    }
    this.userTimingWriteState = Object.freeze({
      status: 'failed',
      field: config.field,
      message: this.text.userTimingControls.failed,
    });
  }

  get userPeripheralControlUnlocked(): boolean {
    return this.controlLocks.isUnlocked('user-peripherals');
  }

  toggleUserPeripheralControlLock(): void {
    this.controlLocks.toggle('user-peripherals');
  }

  async requestUserPeripheralChange(
    config: ProductUserPeripheralUiConfig,
    eventOrChecked: CustomEvent<{ readonly checked: boolean }> | boolean,
  ): Promise<void> {
    const checked = typeof eventOrChecked === 'boolean'
      ? eventOrChecked
      : eventOrChecked.detail.checked;
    const currentState = this.currentUserPeripheralState(config);
    if (currentState === null ||
        checked === currentState ||
        !this.canToggleUserPeripheral(config) ||
        this.context === null) {
      return;
    }

    void triggerConfiguredHapticFeedback();
    const write = config.catalogFactory(checked);
    const context = this.context;
    const contextStatus = this.writeContextStatus(context, write);
    if (contextStatus !== null) {
      this.userPeripheralWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.userPeripheralFailureMessage(contextStatus),
      });
      return;
    }

    const attemptId = this.nextCommandIdentifier('attempt');
    const confirmedAt = Date.now();
    const authorization = createProductUserPeripheralAuthorization({
      write,
      deviceId: context.deviceId,
      connectionGeneration: context.connectionGeneration,
      attemptId,
      confirmationId: this.nextCommandIdentifier('confirmation'),
      confirmedAt,
    });
    this.userPeripheralWriteState = Object.freeze({
      status: 'executing',
      field: config.field,
      message: this.text.userPeripheralControls.executing,
    });

    const result = await this.bleWriteExecutionService.execute({
      write,
      deviceId: context.deviceId,
      profile: config.profile,
      connectionGeneration: context.connectionGeneration,
      identification: { profile: config.profile, confidence: 'strong' },
      authorization,
      attemptId,
      confirmationPolicy: config.confirmationPolicy,
      policy: config.policy,
    });
    if (!this.isCurrentContext() || this.context !== context) {
      this.userPeripheralWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.text.openCommand.stale,
      });
      return;
    }
    if (result.status === 'success') {
      this.userPeripheralWriteState = Object.freeze({
        status: 'sent',
        field: config.field,
        message: this.text.userPeripheralControls.sent,
      });
      if (this.canRefresh) {
        await this.refreshProductData();
      }
      return;
    }
    this.userPeripheralWriteState = Object.freeze({
      status: 'failed',
      field: config.field,
      message: this.text.userPeripheralControls.failed,
    });
  }

  get weightRangeControlUnlocked(): boolean {
    return this.controlLocks.isUnlocked('weight-range');
  }

  toggleWeightRangeControlLock(): void {
    this.controlLocks.toggle('weight-range');
  }

  async requestWeightRangeChange(): Promise<void> {
    if (!this.canApplyWeightRange() || this.context === null) {
      return;
    }

    void triggerConfiguredHapticFeedback();
    const draftValue = this.weightRangeDraftValue();
    if (!isValidProductWeightRange(this.weightRangeUiConfigs, draftValue)) {
      return;
    }
    const config = this.findWeightRangeControl(draftValue)?.config;
    if (config === undefined || draftValue === null) {
      return;
    }
    const write = config.catalogFactory(draftValue);
    const context = this.context;
    const contextStatus = this.writeContextStatus(context, write);
    if (contextStatus !== null) {
      this.weightRangeWriteState = Object.freeze({
        status: 'failed',
        message: this.weightRangeFailureMessage(contextStatus),
      });
      return;
    }

    const attemptId = this.nextCommandIdentifier('attempt');
    const confirmedAt = Date.now();
    const authorization = createProductWeightRangeAuthorization({
      write,
      deviceId: context.deviceId,
      connectionGeneration: context.connectionGeneration,
      attemptId,
      confirmationId: this.nextCommandIdentifier('confirmation'),
      confirmedAt,
    });
    this.weightRangeWriteState = Object.freeze({
      status: 'executing',
      message: this.text.weightRangeControls.executing,
    });

    const result = await this.bleWriteExecutionService.execute({
      write,
      deviceId: context.deviceId,
      profile: config.profile,
      connectionGeneration: context.connectionGeneration,
      identification: { profile: config.profile, confidence: 'strong' },
      authorization,
      attemptId,
      confirmationPolicy: config.confirmationPolicy,
      policy: config.policy,
    });
    if (!this.isCurrentContext() || this.context !== context) {
      this.weightRangeWriteState = Object.freeze({
        status: 'failed',
        message: this.text.openCommand.stale,
      });
      return;
    }
    if (result.status === 'success') {
      this.weightRangeWriteState = Object.freeze({
        status: 'sent',
        message: this.text.weightRangeControls.sent,
      });
      if (this.canRefresh) {
        await this.refreshProductData();
      }
      return;
    }
    this.weightRangeWriteState = Object.freeze({
      status: 'failed',
      message: this.text.weightRangeControls.failed,
    });
  }

  async requestProfessionalScalarChange(
    config: ProductProfessionalScalarUiConfig,
  ): Promise<void> {
    if (!this.canApplyProfessionalScalar(config) || this.context === null) {
      return;
    }

    void triggerConfiguredHapticFeedback();
    const draftValue = this.professionalScalarDraftValue(config);
    if (!isValidProductProfessionalScalarValue(config, draftValue)) {
      return;
    }
    const write = config.catalogFactory(draftValue);
    const context = this.context;
    const contextStatus = this.writeContextStatus(context, write);
    if (contextStatus !== null) {
      this.professionalScalarWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.professionalScalarFailureMessage(contextStatus),
      });
      return;
    }

    const attemptId = this.nextCommandIdentifier('attempt');
    const confirmedAt = Date.now();
    const authorization = createProductProfessionalScalarAuthorization({
      write,
      deviceId: context.deviceId,
      connectionGeneration: context.connectionGeneration,
      attemptId,
      confirmationId: this.nextCommandIdentifier('confirmation'),
      confirmedAt,
    });
    this.professionalScalarWriteState = Object.freeze({
      status: 'executing',
      field: config.field,
      message: this.text.professionalScalarControls.executing,
    });

    const result = await this.bleWriteExecutionService.execute({
      write,
      deviceId: context.deviceId,
      profile: config.profile,
      connectionGeneration: context.connectionGeneration,
      identification: { profile: config.profile, confidence: 'strong' },
      authorization,
      attemptId,
      confirmationPolicy: config.confirmationPolicy,
      policy: config.policy,
    });
    if (!this.isCurrentContext() || this.context !== context) {
      this.professionalScalarWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.text.openCommand.stale,
      });
      return;
    }
    if (result.status === 'success') {
      this.professionalScalarWriteState = Object.freeze({
        status: 'sent',
        field: config.field,
        message: this.text.professionalScalarControls.sent,
      });
      if (this.canRefresh) {
        await this.refreshProductData();
      }
      return;
    }
    this.professionalScalarWriteState = Object.freeze({
      status: 'failed',
      field: config.field,
      message: this.text.professionalScalarControls.failed,
    });
  }

  async requestProfessionalAccess(): Promise<void> {
    const context = this.currentProfessionalAccessContext();
    if (context === null || !this.professionalAccessControlsAvailable) {
      return;
    }
    const alert = await this.alertController.create({
      header: this.text.professionalAccess.title,
      message: this.text.professionalAccess.message,
      inputs: [
        {
          name: 'professionalAccessCode',
          type: 'password',
          placeholder: this.text.professionalAccess.placeholder,
        },
      ],
      buttons: [
        {
          text: this.text.professionalAccess.cancel,
          role: 'cancel',
        },
        {
          text: this.text.professionalAccess.confirm,
          role: 'confirm',
        },
      ],
    });
    await alert.present();
    const dismissal = await alert.onDidDismiss<{
      readonly professionalAccessCode?: string;
      readonly values?: {
        readonly professionalAccessCode?: string;
      };
    }>();
    if (dismissal.role !== 'confirm') {
      return;
    }
    const code = dismissal.data?.values?.professionalAccessCode ??
      dismissal.data?.professionalAccessCode ??
      '';
    if (this.professionalAccessService.authenticate(context, code)) {
      this.professionalAccessState = Object.freeze({
        status: 'unlocked',
        message: this.text.professionalAccess.unlocked,
      });
      return;
    }
    this.professionalAccessState = Object.freeze({
      status: 'failed',
      message: this.text.professionalAccess.failed,
    });
  }

  async requestProductDateMaintenanceAction(): Promise<void> {
    if (!this.canRequestProductDateMaintenanceAction() ||
        this.context === null ||
        this.viewModel.reads.datesAndCycles.value === null) {
      return;
    }
    const context = this.context;
    const dates = this.viewModel.reads.datesAndCycles.value;
    const actionKind = this.currentProductDateMaintenanceActionKind();
    if (actionKind === null) {
      return;
    }
    const accessContext = this.maintenanceAccessContext(context);
    const now = new Date();
    this.productDateActionState = Object.freeze({
      status: 'awaiting-confirmation',
      action: actionKind,
      message: this.text.productDateActions.awaitingConfirmation,
    });
    let dismissal: {
      readonly role?: string;
      readonly data?: {
        readonly maintenanceAccessCode?: string;
        readonly values?: {
          readonly maintenanceAccessCode?: string;
        };
      };
    };
    try {
      const alert = await this.alertController.create({
        header: this.text.productDateActions.confirmTitle,
        message: this.productDateActionConfirmationMessage(actionKind, now),
        inputs: [
          {
            name: 'maintenanceAccessCode',
            type: 'password',
            placeholder: this.text.productDateActions.passwordPlaceholder,
          },
        ],
        buttons: [
          {
            text: this.text.productDateActions.cancel,
            role: 'cancel',
          },
          {
            text: this.text.productDateActions.confirm,
            role: 'confirm',
          },
        ],
      });
      await alert.present();
      dismissal = await alert.onDidDismiss<{
        readonly maintenanceAccessCode?: string;
        readonly values?: {
          readonly maintenanceAccessCode?: string;
        };
      }>();
    } catch {
      this.productDateActionState = Object.freeze({
        status: 'failed',
        action: actionKind,
        message: this.text.productDateActions.failed,
      });
      return;
    }
    if (!this.isCurrentContext() || this.context !== context) {
      this.productDateActionState = Object.freeze({
        status: 'failed',
        action: actionKind,
        message: this.text.openCommand.stale,
      });
      return;
    }
    if (dismissal.role !== 'confirm') {
      this.productDateActionState = Object.freeze({
        status: 'cancelled',
        action: actionKind,
        message: this.text.productDateActions.cancelled,
      });
      return;
    }
    const accessCode = dismissal.data?.values?.maintenanceAccessCode ??
      dismissal.data?.maintenanceAccessCode ??
      '';
    if (!this.maintenanceAccessService.authenticate(
          accessContext,
          accessCode,
        )) {
      this.productDateActionState = Object.freeze({
        status: 'failed',
        action: actionKind,
        message: this.text.productDateActions.wrongCode,
      });
      return;
    }
    this.maintenanceAccessService.reset(accessContext);

    const attemptId = this.nextCommandIdentifier('attempt');
    const confirmedAt = Date.now();
    const flow = prepareProductDateMaintenanceFlow({
      context: this.productDateActionContext(context),
      firstCommissioningDate: dates.firstCommissioningDate,
      now,
      attemptId,
      confirmationId: this.nextCommandIdentifier('confirmation'),
      confirmedAt,
    });
    if (!flow.ok) {
      this.productDateActionState = Object.freeze({
        status: 'failed',
        action: actionKind,
        message: this.text.productDateActions.unavailable,
      });
      return;
    }

    this.productDateActionState = Object.freeze({
      status: 'executing',
      action: flow.kind,
      message: this.text.productDateActions.executing,
    });
    let successfulWrites = 0;
    for (const action of flow.actions) {
      const contextStatus = this.writeContextStatus(context, action.write);
      if (contextStatus !== null) {
        this.setProductDateActionFailure(
          flow.kind,
          successfulWrites > 0,
          this.productDateActionFailureMessage(contextStatus),
        );
        await this.refreshAfterProductDateAction();
        return;
      }
      const result = await this.bleWriteExecutionService.execute(
        action.request,
      );
      if (result.status === 'success') {
        successfulWrites += 1;
      }
      if (!this.isCurrentContext() || this.context !== context) {
        this.setProductDateActionFailure(
          flow.kind,
          successfulWrites > 0,
          this.text.openCommand.stale,
        );
        await this.refreshAfterProductDateAction();
        return;
      }
      if (result.status !== 'success') {
        this.setProductDateActionFailure(
          flow.kind,
          successfulWrites > 0,
          this.text.productDateActions.failed,
        );
        await this.refreshAfterProductDateAction();
        return;
      }
    }

    this.productDateActionState = Object.freeze({
      status: 'sent',
      action: flow.kind,
      message: flow.kind === 'first-commissioning'
        ? this.text.productDateActions.setupSent
        : this.text.productDateActions.maintenanceSent,
    });
    await this.refreshAfterProductDateAction();
  }

  async requestNameRoomChange(): Promise<void> {
    if (!this.canApplyNameRoom() || this.context === null) {
      return;
    }

    void triggerConfiguredHapticFeedback();
    const validation = validateProductNameRoomDraft(
      this.currentNameRoomValue(),
      this.nameRoomDraftValue(),
    );
    if (!validation.valid) {
      return;
    }
    const write = encodeProductNameRoomWrite(this.config.profile, validation);
    const context = this.context;
    const contextStatus = this.writeContextStatus(context, write);
    if (contextStatus !== null) {
      this.nameRoomWriteState = Object.freeze({
        status: 'failed',
        message: this.nameRoomFailureMessage(contextStatus),
      });
      return;
    }

    const attemptId = this.nextCommandIdentifier('attempt');
    const confirmedAt = Date.now();
    const authorization = createProductNameRoomAuthorization({
      write,
      deviceId: context.deviceId,
      connectionGeneration: context.connectionGeneration,
      attemptId,
      confirmationId: this.nextCommandIdentifier('confirmation'),
      confirmedAt,
    });
    this.nameRoomWriteState = Object.freeze({
      status: 'executing',
      message: this.text.nameRoomControls.executing,
    });

    const result = await this.bleWriteExecutionService.execute({
      write,
      deviceId: context.deviceId,
      profile: this.config.profile,
      connectionGeneration: context.connectionGeneration,
      identification: { profile: this.config.profile, confidence: 'strong' },
      authorization,
      attemptId,
      confirmationPolicy: PRODUCT_NAME_ROOM_CONFIRMATION_POLICY,
      policy: PRODUCT_NAME_ROOM_EXECUTION_POLICY,
    });
    if (!this.isCurrentContext() || this.context !== context) {
      this.nameRoomWriteState = Object.freeze({
        status: 'failed',
        message: this.text.openCommand.stale,
      });
      return;
    }
    if (result.status === 'success') {
      this.viewModel = {
        ...this.viewModel,
        displayedName: validation.baseName,
        roomSuffix: validation.roomSuffix,
      };
      this.resetNameRoomDraft();
      this.nameRoomWriteState = Object.freeze({
        status: 'sent',
        message: this.text.nameRoomControls.sent,
      });
      if (this.canRefresh) {
        await this.refreshProductData();
      }
      return;
    }
    this.nameRoomWriteState = Object.freeze({
      status: 'failed',
      message: this.text.nameRoomControls.failed,
    });
  }

  get lockModeControlUnlocked(): boolean {
    return this.controlLocks.isUnlocked('lock-mode');
  }

  toggleLockModeControlLock(): void {
    this.controlLocks.toggle('lock-mode');
  }

  async requestLockModeChange(
    config: ProductLockModeUiConfig,
    eventOrChecked: CustomEvent<{ readonly checked: boolean }> | boolean,
  ): Promise<void> {
    const checked = typeof eventOrChecked === 'boolean'
      ? eventOrChecked
      : eventOrChecked.detail.checked;
    const currentMode = this.currentLockMode();
    const nextMode = checked ? config.mode : 'none';
    if (currentMode === nextMode ||
        currentMode === null ||
        currentMode === 'unknown' ||
        (checked && currentMode !== 'none') ||
        (!checked && currentMode !== config.mode) ||
        !this.canToggleLockMode(config) ||
        this.context === null) {
      return;
    }

    void triggerConfiguredHapticFeedback();
    const write = this.lockModeWrites.get(nextMode);
    if (write === undefined) {
      return;
    }

    const context = this.context;
    const contextStatus = this.writeContextStatus(context, write);
    if (contextStatus !== null) {
      this.lockModeWriteState = Object.freeze({
        status: 'failed',
        message: this.lockModeFailureMessage(contextStatus),
      });
      return;
    }

    const attemptId = this.nextCommandIdentifier('attempt');
    const confirmedAt = Date.now();
    const authorization = createProductLockModeAuthorization({
      write,
      deviceId: context.deviceId,
      connectionGeneration: context.connectionGeneration,
      attemptId,
      confirmationId: this.nextCommandIdentifier('confirmation'),
      confirmedAt,
    });
    this.lockModeWriteState = Object.freeze({
      status: 'executing',
      message: this.text.lockModeControls.executing,
    });

    const result = await this.bleWriteExecutionService.execute({
      write,
      deviceId: context.deviceId,
      profile: config.profile,
      connectionGeneration: context.connectionGeneration,
      identification: { profile: config.profile, confidence: 'strong' },
      authorization,
      attemptId,
      confirmationPolicy: config.confirmationPolicy,
      policy: config.policy,
    });
    if (!this.isCurrentContext() || this.context !== context) {
      this.lockModeWriteState = Object.freeze({
        status: 'failed',
        message: this.text.openCommand.stale,
      });
      return;
    }
    if (result.status === 'success') {
      this.lockModeWriteState = Object.freeze({
        status: 'sent',
        message: this.text.lockModeControls.sent,
      });
      if (this.canRefresh) {
        await this.refreshProductData();
      }
      return;
    }
    this.lockModeWriteState = Object.freeze({
      status: 'failed',
      message: this.text.lockModeControls.failed,
    });
  }

  async backToScan(): Promise<void> {
    if (this.returningToScan) {
      return;
    }
    this.returningToScan = true;
    this.returnToScanErrorMessage = null;
    this.resetOpenCommandState();
    if (this.viewModel.loading || this.productDataLoadService.isLoading) {
      this.productDataLoadService.cancelCurrentLoad();
    }
    try {
      try {
        await this.bleService.disconnect();
      } catch {
        if (this.bleService.connectedDeviceId !== null) {
          this.returnToScanErrorMessage = this.text.returnToScanFailed;
          return;
        }
      }
      await this.router.navigate(['/scan']);
    } finally {
      if (!this.destroyed) {
        this.returningToScan = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.loadCycle += 1;
    this.resetOpenCommandState();
    if (this.viewModel.loading) {
      this.productDataLoadService.cancelCurrentLoad();
    }
    this.resetNameRoomEditing();
    this.resetUserSpeedEditing();
    this.resetUserTimingEditing();
    this.resetUserPeripheralEditing();
    this.resetWeightRangeEditing();
    this.resetProfessionalScalarEditing();
    this.resetProfessionalAccess();
    this.resetProductDateAction();
    this.subscriptions.unsubscribe();
  }

  private resolveNavigationContext(
    routeProfile: unknown,
  ): ProductPageNavigationState | null {
    const value = this.router.getCurrentNavigation()?.extras.state ??
      globalThis.history?.state;
    if (!isProductPageNavigationState(value) ||
        value.profile !== routeProfile) {
      return null;
    }
    return Object.freeze({
      ...value,
      motorState: value.motorState === null
        ? null
        : Object.freeze({
            ...value.motorState,
            switches: value.motorState.switches === null
              ? null
              : Object.freeze({ ...value.motorState.switches }),
          }),
    });
  }

  private initialConnectionState(
    routeProfile: unknown,
    context: ProductPageNavigationState | null,
  ): ProductConnectionState {
    if (!isKnownProductProfile(routeProfile) ||
        context === null ||
        context.profile !== routeProfile) {
      return 'invalid-profile';
    }
    if (this.bleService.connectedDeviceId === null) {
      return 'disconnected';
    }
    return this.bleService.connectedDeviceId !== context.deviceId ||
      this.bleService.connectionGeneration !== context.connectionGeneration
      ? 'stale'
      : 'connected';
  }

  private createInitialViewModel(
    profile: KnownProductProfile,
    context: ProductPageNavigationState | null,
    connectionState: ProductConnectionState,
  ): ProductViewModel {
    const displayName = context?.displayName.trim() || this.config.productName;
    const { name, roomSuffix } = splitProductDisplayName(displayName);
    return {
      profile,
      productName: this.config.productName,
      displayedName: name,
      roomSuffix,
      deviceId: context?.deviceId ?? '',
      connectionGeneration: context?.connectionGeneration ?? -1,
      connectionState,
      motorState: connectionState === 'connected'
        ? context?.motorState ?? null
        : null,
      reads: initialReadStates(),
      loading: false,
      loadStatus: null,
      partialSuccess: false,
      lastUpdatedAt: null,
      globalError: connectionState === 'connected'
        ? null
        : this.connectionStateLabel(connectionState),
    };
  }

  private isCurrentContext(): boolean {
    const context = this.context;
    return !this.destroyed &&
      context !== null &&
      this.viewModel.connectionState === 'connected' &&
      this.viewModel.profile === context.profile &&
      this.bleService.connectedDeviceId === context.deviceId &&
      this.bleService.connectionGeneration === context.connectionGeneration;
  }

  private isCurrentLoad(
    cycle: number,
    context: ProductPageNavigationState,
  ): boolean {
    return cycle === this.loadCycle &&
      this.context === context &&
      this.isCurrentContext();
  }

  private applyLoadResult(result: ProductDataLoadResult): void {
    const terminalConnectionState =
      result.status === 'disconnected'
        ? 'disconnected'
        : result.status === 'stale'
          ? 'stale'
          : this.viewModel.connectionState;
    this.viewModel = {
      ...this.viewModel,
      connectionState: terminalConnectionState,
      reads: {
        version: readView(result.results.version, result.status),
        datesAndCycles: readView(
          result.results.datesAndCycles,
          result.status,
        ),
        maintenance: readView(result.results.maintenance, result.status),
        userParameters: readView(
          result.results.userParameters,
          result.status,
        ),
        professionalParameters: readView(
          result.results.professionalParameters,
          result.status,
        ),
      },
      loadStatus: result.status,
      partialSuccess: result.partialSuccess,
      lastUpdatedAt: result.completedAt,
      globalError: result.error?.message ?? null,
    };
    this.controlLocks.lockAll();
    this.userSpeedDrafts.clear();
    this.userTimingDrafts.clear();
    this.resetNameRoomDraft();
    this.weightRangeDraft = null;
    this.professionalScalarDrafts.clear();
  }

  private handleDisconnection(event: BleDisconnectionEvent): void {
    if (this.context === null || event.deviceId !== this.context.deviceId) {
      return;
    }
    this.commandCycle += 1;
    const operation = this.openCommandState.operation;
    this.openCommandState = Object.freeze({
      ...initialProductOpenCommandState(
        operation,
        this.openCommandState.label,
        this.openCommandState.expectedMotorStateRaw,
      ),
      status: 'disconnected',
      completedAt: Date.now(),
      message: this.text.openCommand.disconnected,
    });
    this.commandHistoryEntries = [];
    this.invalidateContext('disconnected');
  }

  private handleMotorNotification(event: BleNotificationEvent): void {
    if (!this.isCurrentContext() ||
        this.context === null ||
        event.deviceId !== this.context.deviceId ||
        normalizeUuid(event.serviceUuid) !== BLE_UUIDS.shdoService ||
        normalizeUuid(event.characteristicUuid) !==
          BLE_UUIDS.motorStateCharacteristic) {
      return;
    }
    this.viewModel = {
      ...this.viewModel,
      motorState: this.productDetection.interpretMotorState(event.value),
    };
  }

  private invalidateContext(state: 'disconnected' | 'stale'): void {
    this.loadCycle += 1;
    if (this.viewModel.loading) {
      this.productDataLoadService.cancelCurrentLoad();
    }
    this.viewModel = {
      ...this.viewModel,
      connectionState: state,
      motorState: null,
      reads: initialReadStates(),
      loading: false,
      loadStatus: state,
      partialSuccess: false,
      lastUpdatedAt: null,
      globalError: this.connectionStateLabel(state),
    };
    this.controlLocks.lockAll();
    this.resetUserSpeedEditing();
    this.resetUserTimingEditing();
    this.resetNameRoomEditing();
    this.resetUserPeripheralEditing();
    this.resetWeightRangeEditing();
    this.resetProfessionalScalarEditing();
    this.resetProfessionalAccess();
    this.resetProductDateAction();
    this.sensitiveActionState = Object.freeze({
      status: 'idle',
      action: null,
      message: null,
    });
  }

  private resetNameRoomDraft(): void {
    this.nameRoomDraft = this.pageContextCurrent
      ? createProductNameRoomDraft(this.currentNameRoomValue())
      : null;
  }

  private resetNameRoomEditing(): void {
    this.resetNameRoomDraft();
    this.nameRoomWriteState = Object.freeze({
      status: 'idle',
      message: null,
    });
  }

  private resetSettledNameRoomWriteState(): void {
    if (this.nameRoomWriteState.status !== 'executing') {
      this.nameRoomWriteState = Object.freeze({
        status: 'idle',
        message: null,
      });
    }
  }

  private resetUserSpeedEditing(): void {
    this.userSpeedDrafts.clear();
    this.userSpeedWriteState = Object.freeze({
      status: 'idle',
      field: null,
      message: null,
    });
  }

  private isUserSpeedControl(config: ProductUserSpeedUiConfig): boolean {
    return config.profile === this.config.profile &&
      this.userSpeedControls.some((control) => control.config === config);
  }

  private resetUserTimingEditing(): void {
    this.userTimingDrafts.clear();
    this.userTimingWriteState = Object.freeze({
      status: 'idle',
      field: null,
      message: null,
    });
  }

  private isUserTimingControl(config: ProductUserTimingUiConfig): boolean {
    return config.profile === this.config.profile &&
      this.userTimingControls.some((control) => control.config === config);
  }

  private resetUserPeripheralEditing(): void {
    this.userPeripheralWriteState = Object.freeze({
      status: 'idle',
      field: null,
      message: null,
    });
  }

  private isUserPeripheralControl(
    config: ProductUserPeripheralUiConfig,
  ): boolean {
    return config.profile === this.config.profile &&
      this.userPeripheralControls.some((control) => control.config === config);
  }

  private resetWeightRangeEditing(): void {
    this.weightRangeDraft = null;
    this.weightRangeWriteState = Object.freeze({
      status: 'idle',
      message: null,
    });
  }

  private get weightRangeUiConfigs(): readonly ProductWeightRangeUiConfig[] {
    return this.weightRangeControls.map((control) => control.config);
  }

  private findWeightRangeControl(
    range: ProductWeightRange | null,
  ): { readonly config: ProductWeightRangeUiConfig } | undefined {
    if (range === null) {
      return undefined;
    }
    return this.weightRangeControls.find((control) =>
      isSameProductWeightRange(control.config.range, range),
    );
  }

  private resetProfessionalScalarEditing(): void {
    this.professionalScalarDrafts.clear();
    this.professionalScalarWriteState = Object.freeze({
      status: 'idle',
      field: null,
      message: null,
    });
  }

  private resetProfessionalAccess(): void {
    const context = this.currentProfessionalAccessContext();
    if (context === null) {
      this.professionalAccessService.reset();
    } else {
      this.professionalAccessService.reset(context);
    }
    this.professionalAccessState = Object.freeze({
      status: 'locked',
      message: null,
    });
  }

  private resetProductDateAction(): void {
    const context = this.currentMaintenanceAccessContext();
    if (context === null) {
      this.maintenanceAccessService.reset();
    } else {
      this.maintenanceAccessService.reset(context);
    }
    this.productDateActionState = Object.freeze({
      status: 'idle',
      action: null,
      message: null,
    });
  }

  private currentMaintenanceAccessContext():
    MaintenanceAccessContext | null {
    if (this.context === null || !this.isCurrentContext()) {
      return null;
    }
    return this.maintenanceAccessContext(this.context);
  }

  private maintenanceAccessContext(
    context: ProductPageNavigationState,
  ): MaintenanceAccessContext {
    return {
      profile: context.profile,
      deviceId: context.deviceId,
      connectionGeneration: context.connectionGeneration,
    };
  }

  private currentProductDateActionContext(): ProductDateActionContext | null {
    if (this.context === null || !this.isCurrentContext()) {
      return null;
    }
    return this.productDateActionContext(this.context);
  }

  private productDateActionContext(
    context: ProductPageNavigationState,
  ): ProductDateActionContext {
    return {
      profile: context.profile,
      deviceId: context.deviceId,
      connectionGeneration: context.connectionGeneration,
      identificationConfidence: context.identificationConfidence,
    };
  }

  private productDateActionConfirmationMessage(
    action: ProductDateMaintenanceFlowKind,
    date: Date,
  ): string {
    const dateText = this.formatProductDateActionDate(date);
    return action === 'first-commissioning'
      ? this.text.productDateActions.setupConfirmation(dateText)
      : this.text.productDateActions.maintenanceConfirmation(dateText);
  }

  private formatProductDateActionDate(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
    }).format(date);
  }

  private productDateActionFailureMessage(
    status: 'disconnected' | 'stale' | 'unavailable',
  ): string {
    switch (status) {
      case 'disconnected':
        return this.text.openCommand.disconnected;
      case 'stale':
        return this.text.openCommand.stale;
      case 'unavailable':
        return this.text.productDateActions.unavailable;
    }
  }

  private setProductDateActionFailure(
    action: ProductDateMaintenanceFlowKind,
    partial: boolean,
    fallbackMessage: string,
  ): void {
    this.productDateActionState = Object.freeze({
      status: partial ? 'partial-failed' : 'failed',
      action,
      message: partial
        ? this.text.productDateActions.partialFailed
        : fallbackMessage,
    });
  }

  private async refreshAfterProductDateAction(): Promise<void> {
    if (!this.canRefresh) {
      return;
    }
    try {
      await this.refreshProductData();
    } catch {
      this.markProductDateActionReloadFailed();
      return;
    }
    if (this.viewModel.loadStatus === 'failed') {
      this.markProductDateActionReloadFailed();
    }
  }

  private markProductDateActionReloadFailed(): void {
    const state = this.productDateActionState;
    if (state.status === 'sent') {
      this.productDateActionState = Object.freeze({
        ...state,
        message: state.action === 'first-commissioning'
          ? this.text.productDateActions.setupSentReloadFailed
          : this.text.productDateActions.maintenanceSentReloadFailed,
      });
    } else if (state.status === 'partial-failed') {
      this.productDateActionState = Object.freeze({
        ...state,
        message: this.text.productDateActions.partialReloadFailed,
      });
    }
  }

  private isProfessionalScalarControl(
    config: ProductProfessionalScalarUiConfig,
  ): boolean {
    return config.profile === this.config.profile &&
      this.professionalScalarControls.some((control) =>
        control.config === config,
      );
  }

  private canShowProfessionalField(field: ProductProfessionalField): boolean {
    return !productProfessionalFieldRequiresAccess(
      this.config.profile,
      field,
    ) || this.professionalAccessGranted;
  }

  private currentProfessionalAccessContext():
    ProfessionalAccessContext | null {
    if (this.context === null || !this.isCurrentContext()) {
      return null;
    }
    return this.professionalAccessContext(this.context);
  }

  private professionalAccessContext(
    context: ProductPageNavigationState,
  ): ProfessionalAccessContext {
    return {
      profile: context.profile,
      deviceId: context.deviceId,
      connectionGeneration: context.connectionGeneration,
    };
  }

  private isCurrentCommandCycle(cycle: number): boolean {
    return !this.destroyed && cycle === this.commandCycle;
  }

  private writeContextStatus(
    context: ProductPageNavigationState,
    write: LegacyBleWrite,
  ): 'disconnected' | 'stale' | 'unavailable' | null {
    if (this.destroyed || this.context !== context ||
        context.profile !== write.profile ||
        this.config.profile !== write.profile) {
      return 'stale';
    }
    if (this.bleService.connectedDeviceId === null ||
        this.bleService.disconnectingDeviceId === context.deviceId ||
        this.viewModel.connectionState === 'disconnected') {
      return 'disconnected';
    }
    if (this.bleService.connectedDeviceId !== context.deviceId ||
        this.bleService.connectionGeneration !==
          context.connectionGeneration ||
        this.viewModel.connectionState !== 'connected') {
      return 'stale';
    }
    if (this.viewModel.loading ||
        this.productDataLoadService.isLoading ||
        this.bleService.isWriting) {
      return 'unavailable';
    }
    const properties = this.bleService.getGattCharacteristicProperties(
      write.serviceUuid,
      write.characteristicUuid,
      context.deviceId,
    );
    return properties.servicePresent &&
      properties.characteristicPresent &&
      properties.propertiesAvailable &&
      properties.write === true
      ? null
      : 'unavailable';
  }

  private currentLockMode(): LegacyLockMode | 'unknown' | null {
    return this.viewModel.reads.userParameters.value?.lockMode ?? null;
  }

  private motorCommandsBlockedByLockMode(): boolean {
    const lockMode = this.currentLockMode();
    return lockMode === 'locked-open' || lockMode === 'locked-closed';
  }

  private nameRoomFailureMessage(
    status: 'disconnected' | 'stale' | 'unavailable',
  ): string {
    switch (status) {
      case 'disconnected':
        return this.text.openCommand.disconnected;
      case 'stale':
        return this.text.openCommand.stale;
      case 'unavailable':
        return this.text.nameRoomControls.unavailable;
    }
  }

  private lockModeFailureMessage(
    status: 'disconnected' | 'stale' | 'unavailable',
  ): string {
    switch (status) {
      case 'disconnected':
        return this.text.openCommand.disconnected;
      case 'stale':
        return this.text.openCommand.stale;
      case 'unavailable':
        return this.text.lockModeControls.unavailable;
    }
  }

  private userSpeedFailureMessage(
    status: 'disconnected' | 'stale' | 'unavailable',
  ): string {
    switch (status) {
      case 'disconnected':
        return this.text.openCommand.disconnected;
      case 'stale':
        return this.text.openCommand.stale;
      case 'unavailable':
        return this.text.userSpeedControls.unavailable;
    }
  }

  private userTimingFailureMessage(
    status: 'disconnected' | 'stale' | 'unavailable',
  ): string {
    switch (status) {
      case 'disconnected':
        return this.text.openCommand.disconnected;
      case 'stale':
        return this.text.openCommand.stale;
      case 'unavailable':
        return this.text.userTimingControls.unavailable;
    }
  }

  private userPeripheralFailureMessage(
    status: 'disconnected' | 'stale' | 'unavailable',
  ): string {
    switch (status) {
      case 'disconnected':
        return this.text.openCommand.disconnected;
      case 'stale':
        return this.text.openCommand.stale;
      case 'unavailable':
        return this.text.userPeripheralControls.unavailable;
    }
  }

  private weightRangeFailureMessage(
    status: 'disconnected' | 'stale' | 'unavailable',
  ): string {
    switch (status) {
      case 'disconnected':
        return this.text.openCommand.disconnected;
      case 'stale':
        return this.text.openCommand.stale;
      case 'unavailable':
        return this.text.weightRangeControls.unavailable;
    }
  }

  private professionalScalarFailureMessage(
    status: 'disconnected' | 'stale' | 'unavailable',
  ): string {
    switch (status) {
      case 'disconnected':
        return this.text.openCommand.disconnected;
      case 'stale':
        return this.text.openCommand.stale;
      case 'unavailable':
        return this.text.professionalScalarControls.unavailable;
    }
  }

  private setOpenCommandContextFailure(
    status: 'disconnected' | 'stale' | 'unavailable',
    startedAt: number,
    config: WidoorCommandUiConfig,
    nativeWriteCompleted = false,
  ): void {
    const message = status === 'disconnected'
      ? this.text.openCommand.disconnected
      : status === 'stale'
        ? this.text.openCommand.stale
        : this.text.openCommand.unavailable;
    this.openCommandState = Object.freeze({
      ...initialProductOpenCommandState(
        config.operation as ProductMotorCommandOperation,
        config.label,
        config.expectedMotorStateRaw,
      ),
      status,
      startedAt,
      completedAt: Date.now(),
      nativeWriteCompleted,
      message,
    });
    if (status === 'stale' || status === 'disconnected') {
      this.commandHistoryEntries = [];
    } else {
      this.addCommandHistory(this.openCommandState);
    }
  }

  private applyOpenCommandResult(
    result: LegacyBleWriteExecutionResult,
    attemptId: string,
    config: WidoorCommandUiConfig,
  ): void {
    let status: ProductOpenCommandStatus;
    let message: string;
    switch (result.status) {
      case 'success':
        if (config.confirmationPolicy?.kind === 'gatt-only') {
          status = 'confirmed';
          message = this.text.openCommand.sent;
        } else if (result.confirmationStatus === 'confirmed') {
          status = 'confirmed';
          message = config.confirmationSuccessMessage;
        } else {
          status = 'timeout';
          message = config.unconfirmedMessage;
        }
        break;
      case 'timeout':
        status = 'timeout';
        message = config.unconfirmedMessage;
        break;
      case 'unavailable':
        status = 'unavailable';
        message = result.error?.code === 'write-in-progress' ||
          result.error?.code === 'native-write-in-progress'
          ? this.text.openCommand.alreadyInProgress
          : this.text.openCommand.unavailable;
        break;
      case 'disconnected':
        status = 'disconnected';
        message = this.text.openCommand.disconnected;
        break;
      case 'stale':
        status = 'stale';
        message = this.text.openCommand.stale;
        break;
      case 'failed':
      case 'blocked-by-policy':
      case 'invalid-request':
        status = 'failed';
        message = this.text.openCommand.failed;
        break;
    }
    this.openCommandState = Object.freeze({
      operation: config.operation as ProductMotorCommandOperation,
      label: config.label,
      status,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      confirmationStatus: result.confirmationStatus,
      nativeWriteCompleted: result.nativeWriteCompleted,
      message,
      technicalErrorCode: result.error?.code ?? null,
      attemptId,
      expectedMotorStateRaw: config.expectedMotorStateRaw,
      receivedMotorStateRaw: result.confirmedMotorStateRaw,
      movementStartConfirmed: result.movementStartConfirmed,
      timedCycleValidationStatus: result.timedCycleValidationStatus,
      secondaryMessage: config.isTimedCommand &&
        result.movementStartConfirmed
        ? this.text.widoorCommands.timedCyclePending
        : null,
    });
    if (status === 'stale' || status === 'disconnected') {
      this.commandHistoryEntries = [];
    } else {
      this.addCommandHistory(this.openCommandState);
    }
  }

  private nextCommandIdentifier(kind: 'attempt' | 'confirmation'): string {
    this.commandIdentifierSequence += 1;
    const randomId = globalThis.crypto?.randomUUID?.();
    return `${kind}-${randomId ??
      `${Date.now()}-${this.commandIdentifierSequence}`}`;
  }

  private resetOpenCommandState(): void {
    this.commandCycle += 1;
    this.openCommandState = initialProductOpenCommandState();
    this.commandHistoryEntries = [];
  }

  private addCommandHistory(state: ProductOpenCommandState): void {
    if (state.status === 'idle' ||
        state.status === 'awaiting-confirmation' ||
        state.status === 'executing' ||
        state.completedAt === null) {
      return;
    }
    const durationMs = state.startedAt === null
      ? null
      : Math.max(0, state.completedAt - state.startedAt);
    this.commandHistoryEntries = Object.freeze([
      Object.freeze({
        time: formatCommandHistoryTime(state.completedAt),
        label: state.label,
        status: state.status,
        confirmationStatus: state.confirmationStatus,
        durationMs,
        timedCycleValidationStatus: state.timedCycleValidationStatus,
        isTimedCommand: state.operation === 'motor-open-short-timed' ||
          state.operation === 'motor-open-long-timed',
        technicalErrorCode: state.technicalErrorCode,
      }),
      ...this.commandHistoryEntries,
    ].slice(0, 5));
  }

  private createUserRows(
    value: BleUserParameters,
  ): readonly ProductDisplayRow[] {
    const rows: ProductDisplayRow[] = [];
    if (this.userFieldVisible('lock-mode') &&
        this.config.visibleLockModes.includes(value.lockMode)) {
      rows.push(this.row(
        'lock-mode',
        this.text.user.lockMode,
        value.lockMode,
      ));
    }
    this.addUserScalar(rows, 'open-speed', this.text.user.openSpeed,
      value.openSpeed, ' %');
    this.addUserScalar(rows, 'close-speed', this.text.user.closeSpeed,
      value.closeSpeed, ' %');
    this.addUserScalar(rows, 'short-timing', this.text.user.shortTiming,
      value.shortOpenTime, ' s');
    this.addUserScalar(rows, 'long-timing', this.text.user.longTiming,
      value.longOpenTime, ' min');
    this.addUserBoolean(rows, 'static-light', this.text.user.staticLight,
      value.peripheralFlags.staticLight);
    this.addUserBoolean(rows, 'dynamic-light', this.text.user.dynamicLight,
      value.peripheralFlags.dynamicLight);
    this.addUserBoolean(rows, 'rgb', this.text.user.rgb,
      value.peripheralFlags.rgbIndicator);
    return rows;
  }

  private createProfessionalRows(
    value: BleProfessionalParameters,
  ): readonly ProductDisplayRow[] {
    const rows: ProductDisplayRow[] = [];
    this.addProfessionalScalar(
      rows,
      'weight-range',
      this.text.professional.weightRange,
      `${value.weightRangeLower}–${value.weightRangeUpper} kg`,
    );
    if (value.profile === 'widoor') {
      this.addProfessionalScalar(rows, 'break-force-at-open',
        this.text.professional.breakForceAtOpen,
        String(value.breakForceAtOpen));
      this.addProfessionalScalar(rows, 'near-open-proportional',
        this.text.professional.nearOpenProportional,
        String(value.nearOpenProportional));
      this.addProfessionalScalar(rows, 'near-close-proportional',
        this.text.professional.nearCloseProportional,
        String(value.nearCloseProportional));
    } else {
      this.addProfessionalScalar(rows, 'exact-weight',
        this.text.professional.exactWeight, `${value.exactWeight} kg`);
      this.addProfessionalScalar(rows, 'braking-open-power',
        this.text.professional.brakingOpenPower,
        String(value.brakingOpenPower));
      this.addProfessionalScalar(rows, 'obstacle-sensitivity',
        this.text.professional.obstacleSensitivity,
        String(value.obstacleSensitivity));
    }
    this.addProfessionalScalar(rows, 'near-open-speed',
      this.text.professional.nearOpenSpeed, `${value.nearOpenSpeed} %`);
    this.addProfessionalScalar(rows, 'near-close-speed',
      this.text.professional.nearCloseSpeed, `${value.nearCloseSpeed} %`);
    this.addProfessionalScalar(rows, 'near-open-torque',
      this.text.professional.nearOpenTorque, String(value.nearOpenTorque));
    this.addProfessionalScalar(rows, 'near-close-torque',
      this.text.professional.nearCloseTorque, String(value.nearCloseTorque));
    this.addProfessionalScalar(rows, 'near-open-integral',
      this.text.professional.nearOpenIntegral,
      String(value.nearOpenIntegral));
    this.addProfessionalScalar(rows, 'near-close-integral',
      this.text.professional.nearCloseIntegral,
      String(value.nearCloseIntegral));
    return rows;
  }

  private addUserScalar(
    rows: ProductDisplayRow[],
    key: ProductUserField,
    label: string,
    value: number,
    suffix: string,
  ): void {
    if (this.userFieldVisible(key)) {
      rows.push(this.row(key, label, `${value}${suffix}`));
    }
  }

  private addUserBoolean(
    rows: ProductDisplayRow[],
    key: ProductUserField,
    label: string,
    value: boolean,
  ): void {
    if (this.userFieldVisible(key)) {
      rows.push(this.booleanRow(key, label, value));
    }
  }

  private addProfessionalScalar(
    rows: ProductDisplayRow[],
    key: ProductProfessionalField,
    label: string,
    value: string,
  ): void {
    if (this.professionalFieldVisible(key)) {
      rows.push(this.row(key, label, value));
    }
  }

  private userFieldVisible(field: ProductUserField): boolean {
    return this.config.userFields.includes(field);
  }

  private professionalFieldVisible(
    field: ProductProfessionalField,
  ): boolean {
    return this.config.professionalFields.includes(field) &&
      this.canShowProfessionalField(field);
  }

  private widoorLockSupported(): boolean {
    const minimum = this.config.lockMinimumMotorVersionExclusive;
    const version = this.viewModel.reads.version.value?.motorSoftware;
    if (minimum === null || version === undefined) {
      return false;
    }
    return compareVersion(
      [version.major, version.minor, version.patch],
      minimum,
    ) > 0;
  }

  private motorStateLabel(state: number | null): string {
    if (state === null || this.viewModel.profile !== 'widoor') {
      return state === null
        ? this.text.noValue
        : this.text.motor.unknown;
    }
    switch (state) {
      case 0x21:
        return this.text.motor.openingStarted;
      case 0x20:
        return this.text.motor.stoppedAfterOpening;
      case 0x31:
        return this.text.motor.closingStarted;
      case 0x30:
        return this.text.motor.stoppedAfterClosing;
      default:
        return this.text.motor.unknown;
    }
  }

  private row(key: string, label: string, value: string): ProductDisplayRow {
    return { key, label, value };
  }

  private booleanRow(
    key: string,
    label: string,
    value: boolean,
  ): ProductDisplayRow {
    return this.row(key, label, value ? this.text.yes : this.text.no);
  }

  private optionalNumber(value: number | null): string {
    return value === null ? this.text.noValue : String(value);
  }

  private formatByte(value: number): string {
    return `0x${value.toString(16).padStart(2, '0').toUpperCase()}`;
  }

  private formatBytes(values: readonly number[]): string {
    return values.map((value) =>
      value.toString(16).padStart(2, '0').toUpperCase(),
    ).join(' ');
  }

  private formatStackVersion(value: BleStackVersion): string {
    return `${value.major}.${value.minor}.${value.patch}.${value.build}`;
  }

  private formatSoftwareVersion(value: BleSoftwareVersion): string {
    return `${value.major}.${value.minor}.${value.patch}.` +
      `${value.specification}`;
  }

  private formatHistoricalDate(value: HistoricalBleDate): string {
    if (value.status === 'not-initialized' ||
        value.invalidReason === 'zero-date') {
      return this.text.notInitialized;
    }
    if (value.status !== 'present') {
      return this.text.invalidHistoricalDate;
    }
    return [
      value.day.toString().padStart(2, '0'),
      value.month.toString().padStart(2, '0'),
      value.year.toString().padStart(4, '0'),
    ].join('/');
  }
}

function initialReadState<T>(): ProductReadViewState<T> {
  return {
    status: 'not-loaded',
    readStatus: null,
    value: null,
    result: null,
  };
}

function initialReadStates(): ProductReadViewStates {
  return {
    version: initialReadState(),
    datesAndCycles: initialReadState(),
    maintenance: initialReadState(),
    userParameters: initialReadState(),
    professionalParameters: initialReadState(),
  };
}

function readView<T>(
  result: BleTypedReadResult<T> | undefined,
  loadStatus: ProductDataLoadStatus,
): ProductReadViewState<T> {
  if (result === undefined) {
    const interruptedStatus =
      loadStatus === 'disconnected' || loadStatus === 'stale'
        ? loadStatus
        : 'not-loaded';
    return {
      status: interruptedStatus,
      readStatus: null,
      value: null,
      result: null,
    };
  }
  const value = result.status === 'success' && result.decoded?.valid
    ? result.decoded.value
    : null;
  if (value !== null) {
    return {
      status: 'available',
      readStatus: 'success',
      value,
      result,
    };
  }
  const status = result.status === 'success' ||
      result.status === 'invalid-frame'
    ? 'invalid'
    : result.status;
  return {
    status,
    readStatus: result.status,
    value: null,
    result,
  };
}

export function isProductPageNavigationState(
  value: unknown,
): value is ProductPageNavigationState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<ProductPageNavigationState>;
  return isKnownProductProfile(candidate.profile) &&
    typeof candidate.deviceId === 'string' &&
    candidate.deviceId.trim().length > 0 &&
    Number.isInteger(candidate.connectionGeneration) &&
    (candidate.connectionGeneration ?? -1) >= 0 &&
    typeof candidate.displayName === 'string' &&
    candidate.displayName.trim().length > 0 &&
    candidate.identificationConfidence === 'strong' &&
    (candidate.motorState === null ||
      isMotorStateFrame(candidate.motorState));
}

function isMotorStateFrame(value: unknown): value is MotorStateFrame {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<MotorStateFrame>;
  return typeof candidate.rawHex === 'string' &&
    isNonNegativeInteger(candidate.length) &&
    isNullableNonNegativeInteger(candidate.state) &&
    isNullableNonNegativeInteger(candidate.currentPosition) &&
    isNullableNonNegativeInteger(candidate.maximumPosition) &&
    isNullableNonNegativeInteger(candidate.error) &&
    (candidate.switches === null || isMotorSwitchState(candidate.switches));
}

function isMotorSwitchState(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return isNonNegativeInteger(candidate['raw']) &&
    isNonNegativeInteger(candidate['unknownHighBits']) &&
    typeof candidate['pushAndGo'] === 'boolean' &&
    typeof candidate['ble'] === 'boolean' &&
    typeof candidate['automaticManual'] === 'boolean' &&
    typeof candidate['direction'] === 'boolean' &&
    typeof candidate['pairing'] === 'boolean';
}

function isNullableNonNegativeInteger(value: unknown): boolean {
  return value === null || isNonNegativeInteger(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function rangeEventNumber(event: Event): number | null {
  const detail = (event as CustomEvent<{ readonly value?: unknown }>).detail;
  const value = detail?.value;
  if (typeof value === 'number') {
    return value;
  }
  return null;
}

function isProductWeightRange(value: unknown): value is ProductWeightRange {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<ProductWeightRange>;
  return Number.isInteger(candidate.lower) &&
    Number.isInteger(candidate.upper);
}

function compareVersion(
  first: readonly [number, number, number],
  second: readonly [number, number, number],
): number {
  for (let index = 0; index < first.length; index += 1) {
    if (first[index] !== second[index]) {
      return first[index] - second[index];
    }
  }
  return 0;
}

function normalizeUuid(value: string): string {
  return value.trim().toLowerCase();
}

export function formatProductTimestamp(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const twoDigits = (part: number): string =>
    part.toString().padStart(2, '0');
  return `${twoDigits(date.getDate())}/` +
    `${twoDigits(date.getMonth() + 1)}/` +
    `${date.getFullYear().toString().padStart(4, '0')} ` +
    `${twoDigits(date.getHours())}:` +
    `${twoDigits(date.getMinutes())}:` +
    twoDigits(date.getSeconds());
}
