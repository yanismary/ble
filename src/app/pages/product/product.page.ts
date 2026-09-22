import {
  Component,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import {
  add,
  arrowBack,
  caretBack,
  caretForward,
  lockClosed,
  lockOpen,
  remove,
} from 'ionicons/icons';
import {
  AlertController,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonRange,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToggle,
  IonToolbar,
  IonRouterOutlet,
  Platform,
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';

import {
  BleDisconnectionEvent,
  BleNotificationEvent,
  BleService,
} from '../../core/services/ble';
import { BLE_UUIDS } from '../../core/services/ble-profile-catalog';
import {
  LEGACY_WRITE_CONSTRAINTS,
  LegacyBleWrite,
  LegacyInputMode,
  LegacyLockMode,
} from
  '../../core/services/legacy-ble-write-catalog';
import {
  BleWriteExecutionService,
  LegacyBleWriteExecutionPolicy,
  LegacyBleWriteExecutionResult,
} from '../../core/services/ble-write-execution.service';
import {
  BleAdvancedParameters,
  BleSoftwareVersion,
  BleStackVersion,
  BleUserParameters,
  HistoricalBleDate,
  decodeAdvancedPeripheralFlags,
} from '../../core/services/ble-read-decoders';
import {
  BleTypedReadResult,
} from '../../core/services/ble-read.service';
import {
  KnownProductProfile,
  ProductDataLoadOptions,
  ProductDataLoadResult,
  ProductDataLoadStatus,
  ProductDataLoadService,
} from '../../core/services/product-data-load.service';
import {
  MaintenanceAccessContext,
  MaintenanceAccessService,
} from '../../core/services/maintenance-access.service';
import {
  ExpertAccessContext,
  ExpertAccessService,
} from '../../core/services/expert-access.service';
import {
  readShowProductInformation,
  readShowProductSettings,
} from '../../core/services/app-preferences';
import {
  triggerConfiguredHapticFeedback,
} from '../../core/services/app-haptics';
import { currentAppLanguage } from '../../core/services/app-language';
import {
  AppMainMenuComponent,
} from '../../shared/app-main-menu/app-main-menu.component';
import {
  ProductExitStateService,
} from '../../core/services/product-exit-state.service';
import { normalizeBleProductName } from '../../core/services/ble-product-name';
import {
  ConnectedProductInactivityService,
} from '../../core/services/connected-product-inactivity.service';
import {
  MotorStateFrame,
  ProductDetection,
} from '../../core/services/product-detection';
import {
  ProductExpertField,
  ProductWeightRange,
  ProductUserField,
} from './profiles/product-page-config.facade';
import {
  isMoventivProductProfile,
  productProfileRegistry,
} from './profiles/product-profile.registry';
import { ProductProfileDefinition } from
  './profiles/product-profile.types';
import {
  moventivMotorStateLabelFor,
  productPageTextFor,
  widoorDelayedOpenLabelFor,
  widoorMotorStateLabelFor,
  WidoorMotorStateKey,
} from './shared/localization/product-page-localization';
import { productExpertFieldRequiresAccess } from
  './shared/expert/product-expert-access';
import {
  ProductLockModeUiConfig,
  createProductLockModeAuthorization,
  productLockModeConfigsFor,
} from './profiles/moventiv/moventiv-lock-mode';
import {
  ProductUserSpeedField,
  ProductUserSpeedUiConfig,
  createProductUserSpeedAuthorization,
  isValidProductUserSpeedValue,
  productUserSpeedConfigsFor,
} from './shared/settings/product-user-speed';
import {
  ProductUserTimingField,
  ProductUserTimingUiConfig,
  createProductUserTimingAuthorization,
  isValidProductUserTimingValue,
  productUserTimingConfigsFor,
} from './shared/settings/product-user-timing';
import {
  ProductUserPeripheralField,
  ProductUserPeripheralUiConfig,
  createProductUserPeripheralAuthorization,
  productUserPeripheralConfigsFor,
} from './shared/settings/product-user-peripheral';
import {
  ProductWeightRangeUiConfig,
  createProductWeightRangeAuthorization,
  formatProductWeightRangeLabel,
  isSameProductWeightRange,
  isValidProductWeightRange,
  productWeightRangeConfigsFor,
} from './profiles/moventiv/moventiv-weight-range';
import {
  ProductExpertInputField,
  ProductExpertInputUiConfig,
  createProductExpertInputAuthorization,
  productExpertInputConfigsFor,
} from './shared/expert/product-expert-input';
import {
  createExpertPeripheralDiagnosticRows,
} from './shared/expert/product-expert-peripheral-diagnostics';
import {
  ProductSensitiveAction,
  ProductSensitiveActionUiConfig,
  createProductSensitiveActionAuthorization,
  productSensitiveActionConfigsFor,
} from './shared/actions/product-sensitive-action';
import { productSensitiveActionWriteSteps } from
  './profiles/product-sensitive-action.registry';
import {
  ProductExpertScalarField,
  ProductExpertScalarUiConfig,
  createProductExpertScalarAuthorization,
  isValidProductExpertScalarValue,
  productExpertScalarConfigsFor,
} from './shared/expert/product-expert-scalar';
import {
  ProductMotorCommandState,
  ProductCommandHistoryEntry,
  ProductMotorCommandStatus,
  ProductMotorCommandOperation,
  ProductMotorCommandUiConfig,
  formatCommandHistoryTime,
  initialProductMotorCommandState,
} from './shared/commands/product-motor-command';
import {
  WIDOOR_COMMAND_UI_CONFIGS,
  createProductMotorCommandAuthorization,
  productMotorCommandConfigsFor,
} from './profiles/product-motor-command.registry';
import {
  ProductConnectionState,
  ProductDisplayRow,
  ProductPageNavigationState,
  ProductReadViewState,
  ProductReadViewStates,
  ProductViewModel,
} from './shared/models/product-view.model';
import {
  PRODUCT_ROOM_NAME_CONFIRMATION_POLICY,
  PRODUCT_ROOM_NAME_EXECUTION_POLICY,
  PRODUCT_ROOM_NAME_POST_WRITE_COOLDOWN_MS,
  PRODUCT_ROOM_NAME_PRE_WRITE_DELAY_MS,
  PRODUCT_ROOM_OPTIONS,
  ProductRoomNameDraft,
  ProductRoomSuffix,
  createProductRoomNameAuthorization,
  createProductRoomNameDraft,
  encodeProductRoomNameWrite,
  splitProductDisplayName,
  validateProductRoomNameDraft,
} from './shared/settings/product-room-name';
import {
  ProductDateActionContext,
  ProductDateMaintenanceFlowKind,
  prepareProductDateMaintenanceFlow,
} from './profiles/moventiv/moventiv-family-maintenance-date-actions';
import {
  ProductDraftStepDirection,
  stepProductDraftValue,
} from './shared/controls/product-draft-value-step';
import { ProductControlUnlockRegistry } from
  './shared/controls/product-control-unlock-registry';
import {
  ProductDemoSnapshot,
  createProductDemoSnapshot,
  isProductDemoProfile,
} from './shared/demo/product-demo';

type ProductShellMainTab = 'commands' | 'settings' | 'information';
type ProductShellSettingsTab = 'basic' | 'advanced';
type ProductBackToScanOptions = Readonly<{
  preserveInactivityExpiration?: boolean;
}>;
type LocalizedProductPageText = ReturnType<typeof productPageTextFor>;
type WidoorHistoricalHeadings = Readonly<{
  outputs: string;
  additionalActions: string;
  hardware: string;
}>;

@Component({
  selector: 'app-product',
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
  standalone: true,
  imports: [
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonRange,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToggle,
    IonToolbar,
    AppMainMenuComponent,
  ],
})
export class ProductPage implements OnDestroy {
  @ViewChild(IonContent) private content?: IonContent;

  private readonly alertController = inject(AlertController);
  private readonly bleService = inject(BleService);
  private readonly bleWriteExecutionService =
    inject(BleWriteExecutionService);
  private readonly ngZone = inject(NgZone);
  private readonly maintenanceAccessService =
    inject(MaintenanceAccessService);
  private readonly expertAccessService =
    inject(ExpertAccessService);
  private readonly productDataLoadService = inject(ProductDataLoadService);
  private readonly productDetection = inject(ProductDetection);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platform = inject(Platform);
  private readonly routerOutlet = inject(IonRouterOutlet, { optional: true });
  private readonly productExitState = inject(ProductExitStateService);
  private readonly connectedProductInactivity =
    inject(ConnectedProductInactivityService);
  private readonly subscriptions = new Subscription();
  private productBackButtonSubscription: Subscription | null = null;
  private initialPageInitializationInProgress = false;
  private readonly controlLocks = new ProductControlUnlockRegistry();
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
  private appStateListener: PluginListenerHandle | null = null;
  private motorNotificationsPausedForBackground = false;
  private motorNotificationLifecycle: Promise<void> = Promise.resolve();
  private readonly expertInputWrites: Map<
    ProductExpertInputField,
    LegacyBleWrite
  >;
  private readonly requestedExpertInputModes = new Map<
    ProductExpertInputField,
    LegacyInputMode
  >();
  private readonly expertScalarWrites: Map<
    ProductExpertScalarField,
    LegacyBleWrite
  >;
  private readonly expertScalarDrafts = new Map<
    ProductExpertScalarField,
    number
  >();
  private widoorActiveSliderKey: string | null = null;
  private widoorPrecisionSliderKey: string | null = null;
  private readonly widoorSliderWriteTimeouts = new Map<string, {
    readonly timeout: number;
    readonly write: () => Promise<void>;
  }>();
  private readonly widoorSliderButtonWriteDelayMs = 400;
  private readonly widoorShortTimingFallback = 1;
  private roomNameDraft: ProductRoomNameDraft | null = null;

  readonly config: ProductProfileDefinition;
  get text(): ReturnType<typeof productPageTextFor> {
    return productPageTextFor(currentAppLanguage(), this.config.profile);
  }

  get widoorHistoricalHeadings(): WidoorHistoricalHeadings {
    const text = this.text as LocalizedProductPageText & {
      readonly sections: { readonly hardware: string };
      readonly sensitiveActions: {
        readonly outputsTitle: string;
        readonly additionalTitle: string;
      };
    };
    return Object.freeze({
      outputs: text.sensitiveActions.outputsTitle,
      additionalActions: text.sensitiveActions.additionalTitle,
      hardware: text.sections.hardware,
    });
  }
  readonly roomOptions = PRODUCT_ROOM_OPTIONS;
  readonly sensitiveActions: readonly ProductSensitiveActionUiConfig[];
  readonly productCommands: readonly {
    readonly config: ProductMotorCommandUiConfig;
    readonly text: LocalizedProductPageText['widoorCommands'][
      ProductMotorCommandUiConfig['textKey']
    ];
    readonly disabledReason: string | null;
  }[];
  readonly widoorCommands: typeof this.productCommands;
  readonly lockModeControls: readonly {
    readonly config: ProductLockModeUiConfig;
    readonly text: LocalizedProductPageText['lockModeControls'][
      ProductLockModeUiConfig['textKey']
    ];
  }[];
  readonly userSpeedControls: readonly {
    readonly config: ProductUserSpeedUiConfig;
    readonly text: LocalizedProductPageText['user'][
      ProductUserSpeedUiConfig['textKey']
    ];
  }[];
  readonly userTimingControls: readonly {
    readonly config: ProductUserTimingUiConfig;
    readonly text: LocalizedProductPageText['user'][
      ProductUserTimingUiConfig['textKey']
    ];
  }[];
  readonly userPeripheralControls: readonly {
    readonly config: ProductUserPeripheralUiConfig;
    readonly text: LocalizedProductPageText['user'][
      ProductUserPeripheralUiConfig['textKey']
    ];
  }[];
  readonly weightRangeControls: readonly {
    readonly config: ProductWeightRangeUiConfig;
  }[];
  readonly expertInputControls: readonly {
    readonly config: ProductExpertInputUiConfig;
    readonly text: string;
  }[];
  readonly expertScalarControls: readonly {
    readonly config: ProductExpertScalarUiConfig;
    readonly text: LocalizedProductPageText['expert'][
      ProductExpertScalarUiConfig['textKey']
    ];
  }[];
  readonly emptyTechnicalRows: readonly ProductDisplayRow[] = [];
  viewModel: ProductViewModel;
  openCommandState = initialProductMotorCommandState();
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
    readonly targetEnabled?: boolean;
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', field: null, message: null });
  weightRangeWriteState: {
    readonly status: 'idle' | 'executing' | 'sent' | 'failed';
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', message: null });
  expertInputWriteState: {
    readonly status: 'idle' | 'executing' | 'sent' | 'failed';
    readonly field: ProductExpertInputField | null;
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', field: null, message: null });
  expertScalarWriteState: {
    readonly status: 'idle' | 'executing' | 'sent' | 'failed';
    readonly field: ProductExpertScalarField | null;
    readonly message: string | null;
  } = Object.freeze({ status: 'idle', field: null, message: null });
  expertAccessState: {
    readonly status: 'locked' | 'unlocked' | 'failed';
    readonly message: string | null;
  } = Object.freeze({ status: 'locked', message: null });
  expertAccessCode = '';
  roomNameWriteState: {
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
    readonly targetEnabled?: boolean;
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
    addIcons({
      add,
      arrowBack,
      caretBack,
      caretForward,
      lockClosed,
      lockOpen,
      remove,
    });
    const routeProfile = this.route.snapshot.data['profile'];
    this.config = productProfileRegistry.resolve(routeProfile) ??
      productProfileRegistry.get('widoor');
    const profile = this.config.profile;
    this.sensitiveActions = productSensitiveActionConfigsFor(this.config);
    this.productCommands = Object.freeze(
      productMotorCommandConfigsFor(this.config).map((config) =>
      Object.freeze({
        config,
        get text() {
          return productPageTextFor(currentAppLanguage(), profile)
            .widoorCommands[config.textKey];
        },
        get disabledReason() {
          const text = productPageTextFor(currentAppLanguage(), profile);
          return config.disabledReason === 'physical-validation'
            ? text.widoorCommands.physicalValidationRequired
            : config.disabledReason === 'protected'
              ? text.widoorCommands.protected
              : null;
        },
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
          get text() {
            return productPageTextFor(currentAppLanguage(), profile)
              .lockModeControls[config.textKey];
          },
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
          get text() {
            return productPageTextFor(currentAppLanguage(), profile)
              .user[config.textKey];
          },
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
          get text() {
            return productPageTextFor(currentAppLanguage(), profile)
              .user[config.textKey];
          },
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
          get text() {
            return productPageTextFor(currentAppLanguage(), profile)
              .user[config.textKey];
          },
        }),
      ),
    );
    this.weightRangeControls = Object.freeze(
      productWeightRangeConfigsFor(this.config).map((config) =>
        Object.freeze({ config }),
      ),
    );
    this.expertInputControls = Object.freeze(
      productExpertInputConfigsFor(this.config).map((config) =>
        Object.freeze({
          config,
          get text() {
            const text = productPageTextFor(currentAppLanguage(), profile);
            return config.textKey === 'input1'
              ? text.expertInputControls.input1
              : text.expertInputControls.input2;
          },
        }),
      ),
    );
    this.expertInputWrites = new Map(
      this.expertInputControls.map(({ config }) => [
        config.field,
        config.catalogFactory('button'),
      ]),
    );
    this.expertScalarControls = Object.freeze(
      productExpertScalarConfigsFor(this.config).map((config) =>
        Object.freeze({
          config,
          get text() {
            return productPageTextFor(currentAppLanguage(), profile)
              .expert[config.textKey];
          },
        }),
      ),
    );
    this.expertScalarWrites = new Map(
      this.expertScalarControls.map(({ config }) => [
        config.field,
        config.catalogFactory(config.range.min),
      ]),
    );
    this.context = this.resolveNavigationContext(routeProfile);
    if (this.context !== null) {
      this.maintenanceAccessService.reset(
        this.maintenanceAccessContext(this.context),
      );
      this.expertAccessService.reset(
        this.expertAccessContext(this.context),
      );
    }
    this.viewModel = this.createInitialViewModel(
      profile,
      this.context,
      this.initialConnectionState(routeProfile, this.context),
    );
    this.resetRoomNameEditing();

    const inactivitySessionId = this.connectedProductInactivitySessionId();
    if (inactivitySessionId !== null &&
        this.viewModel.connectionState === 'connected') {
      this.connectedProductInactivity.start({
        id: inactivitySessionId,
        isWriteInProgress: () => this.productWriteInProgress(),
        onTimeout: () => this.handleConnectedProductInactivityTimeout(),
      });
    }

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

    void App.addListener('appStateChange', ({ isActive }) => {
      if (this.destroyed || this.isDemoMode) {
        return;
      }

      this.motorNotificationLifecycle = this.motorNotificationLifecycle
        .then(async () => {
          if (isActive) {
            await this.resumeMotorNotificationsAfterBackground();
          } else {
            await this.pauseMotorNotificationsForBackground();
          }
        })
        .catch((error: unknown) => {
          console.warn(
            '[BLE LIFECYCLE] notification lifecycle failed',
            error,
          );
        });
    }).then((listener) => {
      if (this.destroyed) {
        void listener.remove();
        return;
      }

      this.appStateListener = listener;
    });
  }

  private async pauseMotorNotificationsForBackground(): Promise<void> {
    const context = this.context;

    if (
      context === null ||
      this.isDemoMode ||
      this.motorNotificationsPausedForBackground ||
      this.bleService.connectedDeviceId !== context.deviceId
    ) {
      return;
    }

    console.info(
      '[BLE LIFECYCLE] pausing motor notifications for background',
    );

    try {
      await this.bleService.stopNotifications(
        BLE_UUIDS.shdoService,
        BLE_UUIDS.motorStateCharacteristic,
        context.deviceId,
      );

      if (!this.destroyed) {
        this.motorNotificationsPausedForBackground = true;

        console.info(
          '[BLE LIFECYCLE] motor notifications paused',
        );
      }
    } catch (error: unknown) {
      console.warn(
        '[BLE LIFECYCLE] failed to pause motor notifications',
        error,
      );
    }
  }

  private async resumeMotorNotificationsAfterBackground(): Promise<void> {
    const context = this.context;

    if (
      context === null ||
      this.isDemoMode ||
      !this.motorNotificationsPausedForBackground
    ) {
      return;
    }

    if (this.bleService.connectedDeviceId !== context.deviceId) {
      this.motorNotificationsPausedForBackground = false;
      return;
    }

    console.info(
      '[BLE LIFECYCLE] resuming motor notifications',
    );

    try {
      await this.bleService.startNotifications(
        BLE_UUIDS.shdoService,
        BLE_UUIDS.motorStateCharacteristic,
        () => {
          // ProductPage receives the notification through
          // bleService.notifications$.
        },
        context.deviceId,
      );

      if (!this.destroyed) {
        this.motorNotificationsPausedForBackground = false;

        console.info(
          '[BLE LIFECYCLE] motor notifications resumed',
        );
      }
    } catch (error: unknown) {
      console.warn(
        '[BLE LIFECYCLE] failed to resume motor notifications',
        error,
      );
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
    if (tab === previousTab) {
      return;
    }
    this.activeMainTab = tab;
    if (tab === 'settings' && previousTab !== 'settings') {
      this.activeSettingsTab = 'basic';
      void this.refreshSettingsOnEntry();
    } else if (tab === 'information') {
      void this.refreshInformationOnEntry();
    }
    this.scrollContentToTop();
  }

  get isDemoMode(): boolean {
    return this.context?.mode === 'demo';
  }

  get isMoventivProfile(): boolean {
    return this.config.family === 'moventiv';
  }

  get usesMoventivLayout(): boolean {
    return this.config.ui.moventivLayout;
  }

  get usesPhase1SliderInteraction(): boolean {
    return this.config.ui.phase1SliderInteraction;
  }

  get moventivWeightAlertOptions(): Readonly<{
    header: string;
    message: string;
    cssClass: string;
  }> {
    return Object.freeze({
      header: this.text.weightRangeControls.selectTitle,
      message: this.text.weightRangeControls.warning,
      cssClass: 'product-mov-weight-alert',
    });
  }

  setActiveSettingsTab(tab: ProductShellSettingsTab): void {
    if (this.activeMainTab !== 'settings' || !this.pageContextCurrent ||
        this.activeSettingsTab === tab) {
      return;
    }
    this.activeSettingsTab = tab;
    this.scrollContentToTop();
  }

  requestActiveSettingsTab(tab: ProductShellSettingsTab): void {
    this.setActiveSettingsTab(tab);
    if (tab === 'advanced' &&
        this.config.behavior.advancedSettingsConfirmation) {
      void this.presentAdvancedSettingsAlert();
    }
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
      this.expertInputWriteState.status !== 'executing' &&
      this.expertScalarWriteState.status !== 'executing' &&
      this.roomNameWriteState.status !== 'executing' &&
      !this.productDateActionBusy &&
      !this.sensitiveActionBusy;
  }

  get hasProductNavigationContext(): boolean {
    return this.context !== null;
  }

  get showWidoorOpenCommand(): boolean {
    return this.context?.profile === this.config.profile &&
      this.config.ui.widoorLayout;
  }

  get showProductMotorCommands(): boolean {
    return this.context?.profile === this.config.profile &&
      this.productCommands.length > 0;
  }

  get showRoomNameControls(): boolean {
    return this.pageContextCurrent && this.roomNameDraft !== null;
  }

  get showLockModeControls(): boolean {
    return this.pageContextCurrent &&
      this.userFieldVisible('lock-mode') &&
      this.lockModeControls.length > 0 &&
      this.phase1ShowsUserParameterControls();
  }

  get moventivCloseLockControl(): {
    readonly config: ProductLockModeUiConfig;
    readonly text: LocalizedProductPageText['lockModeControls'][
      ProductLockModeUiConfig['textKey']
    ];
  } | null {
    if (!this.showLockModeControls ||
        this.config.family !== 'moventiv') {
      return null;
    }
    return this.lockModeControls.find((control) =>
      control.config.mode === 'locked-closed',
    ) ?? null;
  }

  get showUserSpeedControls(): boolean {
    return this.pageContextCurrent &&
      this.userSpeedControls.length > 0 &&
      this.phase1ShowsUserParameterControls();
  }

  get showUserTimingControls(): boolean {
    return this.pageContextCurrent &&
      this.userTimingControls.length > 0 &&
      this.phase1ShowsUserParameterControls();
  }

  get showUserPeripheralControls(): boolean {
    return this.pageContextCurrent &&
      this.userPeripheralControls.length > 0 &&
      this.phase1ShowsUserParameterControls();
  }

  get commandUserPeripheralControls(): typeof this.userPeripheralControls {
    if (!this.showUserPeripheralControls) {
      return [];
    }
    return this.userPeripheralControls.filter((control) =>
      control.config.field === 'static-light',
    );
  }

  get basicUserPeripheralControls(): typeof this.userPeripheralControls {
    return this.userPeripheralControls.filter((control) =>
      control.config.field !== 'static-light',
    );
  }

  get showCommandPeripheralControls(): boolean {
    return this.commandUserPeripheralControls.length > 0;
  }

  get showBasicUserPeripheralControls(): boolean {
    return this.showUserPeripheralControls &&
      this.basicUserPeripheralControls.length > 0;
  }

  productCommandIconSrc(config: ProductMotorCommandUiConfig): string {
    switch (config.operation) {
      case 'motor-close':
        return 'assets/img/icon_command_close.svg';
      case 'motor-open-short-timed':
      case 'motor-open-long-timed':
        return 'assets/img/icon_command_openThenClose.svg';
      case 'motor-open':
        return 'assets/img/icon_command_open.svg';
    }
    return 'assets/img/icon_command_open.svg';
  }

  productCommandDisplayLabel(
    command: typeof this.productCommands[number],
  ): string {
    const userParameters = this.viewModel.reads.userParameters.value;
    if (command.config.operation === 'motor-open-short-timed') {
      const timingControl = this.userTimingControls.find((control) =>
        control.config.field === 'short-timing',
      );
      if (timingControl !== undefined) {
        return widoorDelayedOpenLabelFor(
          currentAppLanguage(),
          this.userTimingDraftValue(timingControl.config),
        );
      }
    }
    if (command.config.operation === 'motor-open-long-timed' &&
        userParameters !== null) {
      return `${command.text.label} (${userParameters.longOpenTime} min)`;
    }
    return command.text.label;
  }

  expertInputIconSrc(
    config: ProductExpertInputUiConfig,
  ): string | null {
    const mode = this.currentExpertInputMode(config);
    return mode === null ? null : mode === 'radar'
      ? 'assets/img/icon_radar.svg'
      : 'assets/img/icon_button.svg';
  }

  expertScalarIconSrc(
    config: ProductExpertScalarUiConfig,
  ): string {
    switch (config.field) {
      case 'near-open-speed':
      case 'near-close-speed':
        return 'assets/img/icon_speed.svg';
      case 'break-force-at-open':
      case 'near-open-torque':
      case 'near-close-torque':
      case 'braking-open-power':
      case 'obstacle-sensitivity':
        return 'assets/img/icon_force.svg';
    }
  }

  sensitiveActionIconSrc(
    config: ProductSensitiveActionUiConfig,
  ): string | null {
    switch (config.action) {
      case 'radar-test-1':
      case 'radar-test-2':
        return this.sensitiveActionCurrentEnabled(config) === true
          ? 'assets/img/icon_test_on.svg'
          : 'assets/img/icon_test_off.svg';
      case 'advanced-peripheral-lock':
        return null;
      case 'learning':
      case 'reset':
        return null;
    }
  }

  sensitiveActionButtonColor(
    config: ProductSensitiveActionUiConfig,
  ): string | undefined {
    if (config.action === 'reset') {
      return 'danger';
    }
    if (config.action === 'learning') {
      return 'warning';
    }
    return undefined;
  }

  get showWeightRangeControls(): boolean {
    return this.pageContextCurrent &&
      this.weightRangeControls.length > 0 &&
      (this.viewModel.reads.advancedParameters.status === 'available' ||
        this.config.family === 'moventiv');
  }

  get showBasicWeightRangeControls(): boolean {
    return this.showWeightRangeControls &&
      this.config.capabilities.weightRangeControl === 'basic';
  }

  get showAdvancedWeightRangeControls(): boolean {
    return this.showWeightRangeControls &&
      this.config.capabilities.weightRangeControl === 'advanced';
  }

  get showExpertInputControls(): boolean {
    return this.pageContextCurrent &&
      this.expertInputControls.length > 0 &&
      this.phase1ShowsExpertControls();
  }

  get showExpertScalarControls(): boolean {
    return this.pageContextCurrent &&
      this.visibleExpertScalarControls.length > 0 &&
      this.phase1ShowsExpertControls();
  }

  get showBasicSettingsControls(): boolean {
    return this.showBasicUserPeripheralControls ||
      this.showUserSpeedControls ||
      this.showUserTimingControls ||
      this.showBasicWeightRangeControls ||
      this.showRoomNameControls ||
      this.viewModel.reads.userParameters.status === 'available';
  }

  get showAdvancedSettingsControls(): boolean {
    return this.showExpertInputControls ||
      this.showAdvancedWeightRangeControls ||
      this.showExpertScalarControls ||
      this.showExpertAccessPrompt ||
      this.expertAccessState.message !== null ||
      this.expertPeripheralDiagnosticRows.length > 0 ||
      this.viewModel.reads.advancedParameters.status === 'available';
  }

  get hasUnlockedProductControls(): boolean {
    return this.controlLocks.hasUnlockedControls;
  }

  lockAllProductControls(): void {
    this.controlLocks.lockAll();
    this.widoorActiveSliderKey = null;
    this.widoorPrecisionSliderKey = null;
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

  get visibleExpertScalarControls(): typeof this.expertScalarControls {
    return this.expertScalarControls.filter((control) =>
      this.canShowExpertField(control.config.field),
    );
  }

  get expertAccessGranted(): boolean {
    return this.expertAccessService.isAuthenticated(
      this.currentExpertAccessContext(),
    );
  }

  get showExpertAccessPrompt(): boolean {
    return this.pageContextCurrent &&
      (this.viewModel.reads.advancedParameters.status === 'available' ||
        this.config.family === 'garline') &&
      this.expertAccessControlsAvailable &&
      !this.expertAccessGranted;
  }

  get expertAccessControlsAvailable(): boolean {
    return this.config.expertFields.some((field) =>
      productExpertFieldRequiresAccess(this.config, field),
    ) || this.sensitiveActions.some((action) =>
      this.sensitiveActionRequiresExpertAccess(action),
    );
  }

  get canOpenWidoor(): boolean {
    return this.canExecuteWidoorCommand(WIDOOR_COMMAND_UI_CONFIGS[0]);
  }

  get canCloseWidoor(): boolean {
    return this.canExecuteWidoorCommand(WIDOOR_COMMAND_UI_CONFIGS[1]);
  }

  canExecuteWidoorCommand(config: ProductMotorCommandUiConfig): boolean {
    return this.canExecuteProductCommand(config);
  }

  canExecuteProductCommand(config: ProductMotorCommandUiConfig): boolean {
    if (!this.productCommands.some((command) => command.config === config) ||
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
        this.expertInputWriteState.status === 'executing' ||
        this.expertScalarWriteState.status === 'executing' ||
        this.roomNameWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const write = this.productCommandWrites.get(config.command);
    if (write === undefined) {
      return false;
    }
    if (this.isDemoMode) {
      return true;
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

  get displayedOpenCommandStatus(): ProductMotorCommandStatus {
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

  get expertRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.advancedParameters.value;
    return value === null ? [] : this.createExpertRows(value);
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

  get expertPeripheralDiagnosticRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.advancedParameters.value;
    if (value === null || !this.expertFieldVisible('peripherals')) {
      return [];
    }

    return createExpertPeripheralDiagnosticRows(
      value,
      this.text.expertPeripheralDiagnostics,
      {
        includeLock: value.profile !== 'widoor' || this.widoorLockSupported(),
      },
    );
  }

  get expertTechnicalRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.advancedParameters.value;
    if (value === null || !this.expertFieldVisible('peripherals')) {
      return [];
    }
    const peripheralLabel = value.profile === 'widoor' &&
      !this.widoorLockSupported()
      ? this.text.expert.peripheralsWithoutLock
      : this.text.expert.peripherals;
    return [this.row(
      'advanced-peripherals',
      peripheralLabel,
      this.formatBytes([value.peripheralByte1, value.peripheralByte2]),
    )];
  }

  get versionRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.reads.version.value;
    if (value === null) {
      return [];
    }
    const rows: ProductDisplayRow[] = [
      this.row('motor-version', this.text.version.motor,
        this.formatSoftwareVersion(value.motorSoftware)),
      this.row('stack-version', this.text.version.stack,
        this.formatStackVersion(value.stack)),
      this.row('ble-version', this.text.version.ble,
        this.formatSoftwareVersion(value.bleSoftware)),
      this.row('control-hardware', this.text.version.controlHardware,
        `${value.productType}.${value.productSubtype}`),
    ];
    if (this.config.information.showMotorAddress) {
      rows.push(this.row('motor-address', this.text.version.motorAddress,
        value.motorAddressHex ?? this.text.noValue));
    }
    return rows;
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

  get informationGeneralRows(): readonly ProductDisplayRow[] {
    const rows: ProductDisplayRow[] = [];
    const weightRange = this.config.information.showCurrentWeightRange
      ? this.currentWeightRangeValue()
      : null;
    if (weightRange !== null) {
      rows.push(this.row(
        'current-weight-range',
        this.usesMoventivLayout
          ? this.text.information.currentWeightProfile
          : this.text.expert.weightRange,
        this.formatInformationWeightRange(weightRange),
      ));
    }
    if (this.config.maximumWeightLabel !== null) {
      rows.push(this.row(
        'maximum-weight',
        this.text.information.maximumWeight,
        this.config.maximumWeightLabel,
      ));
    }
    return rows;
  }

  get commandSwitchWriteInProgress(): boolean {
    return this.usesMoventivLayout &&
      (this.lockModeWriteState.status === 'executing' ||
        this.userPeripheralWriteState.status === 'executing');
  }

  get informationDateRows(): readonly ProductDisplayRow[] {
    return this.datesRows.filter(({ key }) =>
      key === 'first-commissioning' || key === 'total-cycles',
    );
  }

  get informationMaintenanceRows(): readonly ProductDisplayRow[] {
    if (!this.config.information.showMaintenanceDates) {
      return [];
    }
    return this.datesRows.filter(({ key }) =>
      key === 'last-maintenance' || key === 'cycles-since-maintenance',
    );
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

  get informationSupplementalRows(): readonly ProductDisplayRow[] {
    return this.maintenanceRows.filter(({ key }) =>
      this.config.information.supplementalMaintenanceFields.includes(
        key as typeof this.config.information
          .supplementalMaintenanceFields[number],
      ),
    );
  }

  currentProductDateMaintenanceActionKind():
    ProductDateMaintenanceFlowKind | null {
    const dates = this.viewModel.reads.datesAndCycles.value;
    if (this.isDemoMode && dates !== null) {
      return dates.firstCommissioningDate.status === 'not-initialized'
        ? 'first-commissioning'
        : 'maintenance';
    }
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
        this.expertInputWriteState.status === 'executing' ||
        this.expertScalarWriteState.status === 'executing' ||
        this.roomNameWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    if (this.isDemoMode) {
      return true;
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

  canRenderProductDateMaintenanceActionEnabled(): boolean {
    if (!this.showProductDateMaintenanceAction ||
        !this.isCurrentContext() ||
        this.context === null ||
        this.productDateActionBusy ||
        this.viewModel.connectionState === 'disconnected') {
      return false;
    }
    if (this.isDemoMode) {
      return true;
    }
    const flow = prepareProductDateMaintenanceFlow({
      context: this.productDateActionContext(this.context),
      firstCommissioningDate:
        this.viewModel.reads.datesAndCycles.value!.firstCommissioningDate,
      now: new Date(),
      attemptId: 'display',
      confirmationId: 'display',
      confirmedAt: Date.now(),
    });
    return flow.ok && flow.actions.every(({ write }) => {
      const properties = this.bleService.getGattCharacteristicProperties(
        write.serviceUuid, write.characteristicUuid, this.context!.deviceId,
      );
      return properties.servicePresent &&
        properties.characteristicPresent &&
        properties.propertiesAvailable && properties.write === true;
    });
  }

  get motorRows(): readonly ProductDisplayRow[] {
    const value = this.viewModel.motorState;
    if (value === null || value.switches === null) {
      return [];
    }
    const rows: ProductDisplayRow[] = [];
    if (!this.config.hiddenMotorSwitches.includes('push-and-go')) {
      rows.push(this.motorSwitchRow(
        'push-and-go',
        this.text.motor.pushAndGo,
        value.switches.pushAndGo,
      ));
    }
    rows.push(this.motorSwitchRow(
      'ble-switch',
      this.text.motor.ble,
      value.switches.ble,
    ));
    if (!this.config.hiddenMotorSwitches.includes('automatic-manual')) {
      rows.push(this.motorSwitchRow(
        'automatic-manual',
        this.text.motor.automaticManual,
        value.switches.automaticManual,
      ));
    }
    if (!this.config.hiddenMotorSwitches.includes('direction')) {
      rows.push(this.motorSwitchRow(
        'direction',
        this.text.motor.direction,
        value.switches.direction,
      ));
    }
    rows.push(this.motorSwitchRow(
      'pairing',
      this.text.motor.pairing,
      value.switches.pairing,
    ));
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

  async refreshProductData(
    options: ProductDataLoadOptions = {},
    showLoading = true,
    settingsRefresh = false,
  ): Promise<void> {
    if (!this.canRefresh || this.context === null || this.isDemoMode) {
      return;
    }
    const cycle = ++this.loadCycle;
    const context = this.context;
    this.viewModel = {
      ...this.viewModel,
      loading: showLoading,
      globalError: null,
    };
    try {
      const result = await this.productDataLoadService.loadProductData(
        context.profile,
        context.deviceId,
        options,
      );
      if (!this.isCurrentLoad(cycle, context)) {
        return;
      }
      if (result.profile !== context.profile ||
          result.deviceId !== context.deviceId ||
          result.connectionGeneration !== context.connectionGeneration) {
        return;
      }
      this.applyLoadResult(result, settingsRefresh);
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
      case 'demo':
        return 'Demo';
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

  async requestWidoorCommand(
    config: ProductMotorCommandUiConfig,
  ): Promise<void> {
    return this.requestProductCommand(config);
  }

  currentRoomNameValue(): ProductRoomNameDraft {
    return Object.freeze({
      name: this.viewModel.displayedName,
      roomSuffix: this.viewModel.roomSuffix as ProductRoomSuffix | null,
    });
  }

  roomNameDraftValue(): ProductRoomNameDraft {
    return this.roomNameDraft ?? createProductRoomNameDraft(
      this.currentRoomNameValue(),
    );
  }

  get roomNameControlUnlocked(): boolean {
    return this.controlLocks.isUnlocked('name-room');
  }

  toggleRoomNameControlLock(): void {
    this.controlLocks.toggle('name-room');
  }

  setRoomNameDraftName(
    eventOrValue: CustomEvent<{ readonly value?: string | null }> | string,
  ): void {
    if (!this.showRoomNameControls) {
      return;
    }
    const value = typeof eventOrValue === 'string'
      ? eventOrValue
      : eventOrValue.detail.value ?? '';
    this.roomNameDraft = Object.freeze({
      ...this.roomNameDraftValue(),
      name: value,
    });
    this.resetSettledRoomNameWriteState();
  }

  setRoomNameDraftRoom(
    eventOrValue:
      CustomEvent<{ readonly value?: ProductRoomSuffix | '' | null }> |
      ProductRoomSuffix |
      '' |
      null,
  ): void {
    if (!this.showRoomNameControls) {
      return;
    }
    const selected = typeof eventOrValue === 'string' ||
        eventOrValue === null
      ? eventOrValue
      : eventOrValue.detail.value ?? null;
    const value = selected === '' ? null : selected;
    this.roomNameDraft = Object.freeze({
      ...this.roomNameDraftValue(),
      roomSuffix: value,
    });
    this.resetSettledRoomNameWriteState();
  }

  roomNameValidationMessage(): string | null {
    const result = validateProductRoomNameDraft(
      this.currentRoomNameValue(),
      this.roomNameDraftValue(),
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

  currentRoomNameDisplay(): string {
    const current = this.currentRoomNameValue();
    return `${current.name}${current.roomSuffix ?? ''}`.trim() ||
      this.text.noValue;
  }

  roomNameDraftDisplay(): string {
    const current = this.currentRoomNameValue();
    const draft = this.roomNameDraftValue();
    const name = draft.name.trim() || current.name;
    return `${name}${draft.roomSuffix ?? ''}`.trim() || this.text.noValue;
  }

  canApplyRoomName(): boolean {
    if (!this.roomNameRequestContextAvailable()) {
      return false;
    }
    const validation = validateProductRoomNameDraft(
      this.currentRoomNameValue(),
      this.roomNameDraftValue(),
    );
    if (!validation.valid) {
      return false;
    }
    const write = encodeProductRoomNameWrite(this.config.profile, validation);
    if (this.isDemoMode) {
      return true;
    }
    const context = this.context;
    if (context === null) {
      return false;
    }
    const properties = this.bleService.getGattCharacteristicProperties(
      write.serviceUuid,
      write.characteristicUuid,
      context.deviceId,
    );
    return properties.servicePresent &&
      properties.characteristicPresent &&
      properties.propertiesAvailable &&
      properties.write === true;
  }

  canRequestRoomNameChange(): boolean {
    if (!this.roomNameRequestContextAvailable()) {
      return false;
    }
    const validation = validateProductRoomNameDraft(
      this.currentRoomNameValue(),
      this.roomNameDraftValue(),
    );
    return validation.valid
      ? this.canApplyRoomName()
      : validation.error !== 'unchanged';
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
    const key = `user-speed:${config.field}`;
    this.toggleProductSliderLock(
      key,
      productProfileRegistry.get(config.profile).ui.phase1SliderInteraction,
    );
  }

  unlockUserSpeedFromZone(config: ProductUserSpeedUiConfig): void {
    this.unlockWidoorSlider(`user-speed:${config.field}`);
  }

  isUserSpeedPrecisionOpen(config: ProductUserSpeedUiConfig): boolean {
    return this.widoorPrecisionSliderKey === `user-speed:${config.field}`;
  }

  toggleUserSpeedPrecision(
    config: ProductUserSpeedUiConfig,
    event: Event,
  ): void {
    this.toggleWidoorSliderPrecision(
      `user-speed:${config.field}`,
      this.isUserSpeedUnlocked(config),
      event,
    );
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
    this.scheduleWidoorSliderWrite(`user-speed:${config.field}`, () =>
      this.requestUserSpeedChange(config),
    );
  }

  onUserSpeedSliderReleased(config: ProductUserSpeedUiConfig): void {
    this.flushWidoorSliderWrite(`user-speed:${config.field}`, () =>
      this.requestUserSpeedChange(config),
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
        this.expertInputWriteState.status === 'executing' ||
        this.expertScalarWriteState.status === 'executing' ||
        this.roomNameWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const currentValue = this.currentUserSpeedValue(config);
    const draftValue = this.userSpeedDraftValue(config);
    if ((currentValue === null && !this.userSpeedDrafts.has(config.field)) ||
        (currentValue !== null && draftValue === currentValue) ||
        !isValidProductUserSpeedValue(config, draftValue)) {
      return false;
    }
    const write = this.userSpeedWrites.get(config.field);
    if (write === undefined) {
      return false;
    }
    if (this.isDemoMode) {
      return true;
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
      if (productProfileRegistry.get(config.profile).behavior
            .showControlsBeforeRead &&
          config.field === 'short-timing' &&
          this.pageContextCurrent) {
        return productProfileRegistry.get(config.profile).family === 'widoor'
          ? this.widoorShortTimingFallback
          : LEGACY_WRITE_CONSTRAINTS[config.profile]
            .shortTimingInvalidReadDefault;
      }
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
    const key = `user-timing:${config.field}`;
    this.toggleProductSliderLock(
      key,
      productProfileRegistry.get(config.profile).ui.phase1SliderInteraction,
    );
  }

  unlockUserTimingFromZone(config: ProductUserTimingUiConfig): void {
    this.unlockWidoorSlider(`user-timing:${config.field}`);
  }

  isUserTimingPrecisionOpen(config: ProductUserTimingUiConfig): boolean {
    return this.widoorPrecisionSliderKey === `user-timing:${config.field}`;
  }

  toggleUserTimingPrecision(
    config: ProductUserTimingUiConfig,
    event: Event,
  ): void {
    this.toggleWidoorSliderPrecision(
      `user-timing:${config.field}`,
      this.isUserTimingUnlocked(config),
      event,
    );
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
    this.scheduleWidoorSliderWrite(`user-timing:${config.field}`, () =>
      this.requestUserTimingChange(config),
    );
  }

  onUserTimingSliderReleased(config: ProductUserTimingUiConfig): void {
    this.flushWidoorSliderWrite(`user-timing:${config.field}`, () =>
      this.requestUserTimingChange(config),
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
        this.expertInputWriteState.status === 'executing' ||
        this.expertScalarWriteState.status === 'executing' ||
        this.roomNameWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const currentValue = this.currentUserTimingValue(config);
    const draftValue = this.userTimingDraftValue(config);
    if ((currentValue === null && !this.userTimingDrafts.has(config.field)) ||
        (currentValue !== null && draftValue === currentValue) ||
        !isValidProductUserTimingValue(config, draftValue)) {
      return false;
    }
    const write = this.userTimingWrites.get(config.field);
    if (write === undefined) {
      return false;
    }
    if (this.isDemoMode) {
      return true;
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
      if (this.userPeripheralWriteState.field === config.field &&
          (this.userPeripheralWriteState.status === 'executing' ||
            this.userPeripheralWriteState.status === 'sent') &&
          this.userPeripheralWriteState.targetEnabled !== undefined) {
        return this.userPeripheralWriteState.targetEnabled;
      }
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
        this.expertInputWriteState.status === 'executing' ||
        this.expertScalarWriteState.status === 'executing' ||
        this.roomNameWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const write = config.catalogFactory(true);
    if (this.isDemoMode) {
      return true;
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

  currentExpertInputMode(
    config: ProductExpertInputUiConfig,
  ): LegacyInputMode | null {
    if (this.config.profile !== config.profile) {
      return null;
    }
    const requested = this.requestedExpertInputModes.get(config.field);
    if (requested !== undefined) {
      return requested;
    }
    const radar = this.isDemoMode
      ? this.demoExpertInputRadar(config)
      : this.viewModel.reads.userParameters.value?.peripheralFlags[
          config.field === 'input-1' ? 'input1Radar' : 'input2Radar'
        ];
    if (radar === undefined || radar === null) {
      return config.profile === 'widoor' ? 'button' : null;
    }
    return radar ? 'radar' : 'button';
  }

  private demoExpertInputRadar(
    config: ProductExpertInputUiConfig,
  ): boolean | null {
    const value = this.viewModel.reads.advancedParameters.value;
    if (value === null || value.profile !== config.profile) {
      return null;
    }
    const flags = decodeAdvancedPeripheralFlags(value.peripheralByte1);
    return config.field === 'input-1' ? flags.bit7Set : flags.bit6Set;
  }

  canChangeExpertInput(
    config: ProductExpertInputUiConfig,
    mode?: LegacyInputMode,
  ): boolean {
    if (!this.expertInputControls.some((control) =>
          control.config === config,
        ) ||
        !this.showExpertInputControls ||
        !this.isCurrentContext() ||
        (this.config.profile !== 'widoor' &&
          (this.viewModel.loading || this.productDataLoadService.isLoading)) ||
        this.bleService.isWriting ||
        this.bleService.disconnectingDeviceId !== null ||
        this.bleWriteExecutionService.isExecuting ||
        this.lockModeWriteState.status === 'executing' ||
        this.userSpeedWriteState.status === 'executing' ||
        this.userTimingWriteState.status === 'executing' ||
        this.userPeripheralWriteState.status === 'executing' ||
        this.weightRangeWriteState.status === 'executing' ||
        this.expertInputWriteState.status === 'executing' ||
        this.expertScalarWriteState.status === 'executing' ||
        this.roomNameWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const current = this.currentExpertInputMode(config);
    if (current === null ||
        (mode !== undefined && mode === current)) {
      return false;
    }
    const write = this.expertInputWrites.get(config.field);
    if (write === undefined) {
      return false;
    }
    if (this.isDemoMode) {
      return true;
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

  get expertInputControlUnlocked(): boolean {
    return this.controlLocks.isUnlocked('expert-inputs');
  }

  toggleExpertInputControlLock(): void {
    this.controlLocks.toggle('expert-inputs');
  }

  onExpertInputToggleChange(
    config: ProductExpertInputUiConfig,
    event: CustomEvent<{ readonly checked: boolean }>,
  ): void {
    const toggle = event.target as HTMLIonToggleElement | null;
    void this.requestExpertInputChange(
      config, event.detail.checked ? 'radar' : 'button',
    ).then(() => {
      if (toggle !== null && this.isCurrentContext()) {
        toggle.checked = this.currentExpertInputMode(config) === 'radar';
      }
    });
  }

  async requestExpertInputChange(
    config: ProductExpertInputUiConfig,
    eventOrMode: CustomEvent<{ readonly value?: LegacyInputMode }> |
      LegacyInputMode,
  ): Promise<void> {
    const mode = typeof eventOrMode === 'string'
      ? eventOrMode
      : eventOrMode.detail.value;
    console.info('[INPUT] change-event', JSON.stringify({
      input: config.field === 'input-1' ? 1 : 2,
      requestedMode: mode,
      confirmedMode: this.currentExpertInputMode(config),
      profile: config.profile,
      deviceId: this.context?.deviceId ?? null,
    }));
    if ((mode !== 'button' && mode !== 'radar') ||
        !this.canChangeExpertInput(config, mode) ||
        this.context === null) {
      console.info('[INPUT] change-ignored', JSON.stringify({
        field: config.field,
        requestedMode: mode,
        readStatus: this.viewModel.reads.advancedParameters.status,
        at: Date.now(),
      }));
      return;
    }

    void triggerConfiguredHapticFeedback();
    if (this.isDemoMode) {
      this.updateExpertInputDisplay(config.field, mode);
      this.expertInputWriteState = Object.freeze({
        status: 'sent',
        field: config.field,
        message: this.text.expertInputControls.sent,
      });
      return;
    }
    const write = config.catalogFactory(mode);
    const context = this.context;
    console.info('[INPUT] write-prepared', JSON.stringify({
      input: config.field === 'input-1' ? 1 : 2,
      requestedMode: mode,
      payloadHex: write.payloadHex,
      serviceUuid: write.serviceUuid,
      characteristicUuid: write.characteristicUuid,
      profile: config.profile,
      deviceId: context.deviceId,
    }));
    const contextStatus = this.writeContextStatus(
      context, write, config.profile === 'widoor',
    );
    if (contextStatus !== null) {
      console.info('[INPUT] write-result', JSON.stringify({
        input: config.field === 'input-1' ? 1 : 2,
        requestedMode: mode,
        status: 'blocked',
        error: contextStatus,
      }));
      this.expertInputWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.text.expertInputControls.failed,
      });
      return;
    }
    this.requestedExpertInputModes.set(config.field, mode);
    const attemptId = this.nextCommandIdentifier('attempt');
    const confirmedAt = Date.now();
    const authorization = this.usesPhase1ImmediateWrite(config.profile)
      ? null
      : createProductExpertInputAuthorization({
          write,
          deviceId: context.deviceId,
          connectionGeneration: context.connectionGeneration,
          attemptId,
          confirmationId: this.nextCommandIdentifier('confirmation'),
          confirmedAt,
        });
    this.expertInputWriteState = Object.freeze({
      status: 'executing',
      field: config.field,
      message: this.text.expertInputControls.executing,
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
      policy: this.withPhase1ImmediatePolicy(config.profile, config.policy),
    });
    console.info('[INPUT] write-result', JSON.stringify({
      input: config.field === 'input-1' ? 1 : 2,
      requestedMode: mode,
      status: result.status,
      error: result.error,
    }));
    if (!this.isCurrentContext() || this.context !== context) {
      this.expertInputWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.text.openCommand.stale,
      });
      return;
    }
    if (result.status === 'success') {
      this.expertInputWriteState = Object.freeze({
        status: 'sent',
        field: config.field,
        message: this.text.expertInputControls.sent,
      });
      return;
    }
    this.expertInputWriteState = Object.freeze({
      status: 'failed',
      field: config.field,
      message: this.text.expertInputControls.failed,
    });
  }

  currentWeightRangeValue(): ProductWeightRange | null {
    const value = this.viewModel.reads.advancedParameters.value;
    if (value === null) {
      return null;
    }
    return {
      lower: value.weightRangeLower,
      upper: value.weightRangeUpper,
    };
  }

  private formatInformationWeightRange(range: ProductWeightRange): string {
    return formatProductWeightRangeLabel(range);
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

  onWeightRangeSelectionChanged(
    event: CustomEvent<{ readonly value?: unknown }>,
  ): void {
    this.setWeightRangeDraftValue(event);
    if (this.config.family === 'moventiv') {
      void this.requestWeightRangeChange();
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
        this.expertInputWriteState.status === 'executing' ||
        this.expertScalarWriteState.status === 'executing' ||
        this.roomNameWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const currentValue = this.currentWeightRangeValue();
    const draftValue = this.weightRangeDraftValue();
    if ((currentValue === null && this.config.family !== 'moventiv') ||
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
    if (this.isDemoMode) {
      return true;
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

  currentExpertScalarValue(
    config: ProductExpertScalarUiConfig,
  ): number | null {
    const value = this.viewModel.reads.advancedParameters.value;
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

  expertScalarDraftValue(
    config: ProductExpertScalarUiConfig,
  ): number {
    return this.expertScalarDrafts.get(config.field) ??
      this.currentExpertScalarValue(config) ??
      config.range.min;
  }

  setExpertScalarDraftValue(
    config: ProductExpertScalarUiConfig,
    eventOrValue: Event | number,
  ): void {
    if (!this.isExpertScalarControl(config) ||
        !this.canShowExpertField(config.field)) {
      return;
    }
    const value = typeof eventOrValue === 'number'
      ? eventOrValue
      : rangeEventNumber(eventOrValue);
    if (value === null ||
        !isValidProductExpertScalarValue(config, value)) {
      return;
    }
    this.expertScalarDrafts.set(config.field, value);
    if (this.expertScalarWriteState.field === config.field &&
        this.expertScalarWriteState.status !== 'executing') {
      this.expertScalarWriteState = Object.freeze({
        status: 'idle',
        field: null,
        message: null,
      });
    }
  }

  isExpertScalarUnlocked(
    config: ProductExpertScalarUiConfig,
  ): boolean {
    return this.controlLocks.isUnlocked(
      `expert-scalar:${config.field}`,
    );
  }

  toggleExpertScalarLock(
    config: ProductExpertScalarUiConfig,
  ): void {
    const key = `expert-scalar:${config.field}`;
    this.toggleProductSliderLock(
      key,
      productProfileRegistry.get(config.profile).ui.phase1SliderInteraction,
    );
  }

  unlockExpertScalarFromZone(
    config: ProductExpertScalarUiConfig,
  ): void {
    this.unlockWidoorSlider(`expert-scalar:${config.field}`);
  }

  isExpertScalarPrecisionOpen(
    config: ProductExpertScalarUiConfig,
  ): boolean {
    return this.widoorPrecisionSliderKey ===
      `expert-scalar:${config.field}`;
  }

  toggleExpertScalarPrecision(
    config: ProductExpertScalarUiConfig,
    event: Event,
  ): void {
    this.toggleWidoorSliderPrecision(
      `expert-scalar:${config.field}`,
      this.isExpertScalarUnlocked(config),
      event,
    );
  }

  stepExpertScalarDraft(
    config: ProductExpertScalarUiConfig,
    direction: ProductDraftStepDirection,
  ): void {
    if (!this.isExpertScalarUnlocked(config)) {
      return;
    }
    this.setExpertScalarDraftValue(
      config,
      stepProductDraftValue(
        this.expertScalarDraftValue(config),
        direction,
        config.range,
      ),
    );
    this.scheduleWidoorSliderWrite(
      `expert-scalar:${config.field}`,
      () => this.requestExpertScalarChange(config),
    );
  }

  onExpertScalarSliderReleased(
    config: ProductExpertScalarUiConfig,
  ): void {
    this.flushWidoorSliderWrite(
      `expert-scalar:${config.field}`,
      () => this.requestExpertScalarChange(config),
    );
  }

  canApplyExpertScalar(
    config: ProductExpertScalarUiConfig,
  ): boolean {
    if (!this.isExpertScalarControl(config) ||
        !this.canShowExpertField(config.field) ||
        !this.showExpertScalarControls ||
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
        this.expertInputWriteState.status === 'executing' ||
        this.expertScalarWriteState.status === 'executing' ||
        this.roomNameWriteState.status === 'executing' ||
        this.productDateActionBusy ||
        this.sensitiveActionBusy ||
        this.commandInProgress) {
      return false;
    }
    const currentValue = this.currentExpertScalarValue(config);
    const draftValue = this.expertScalarDraftValue(config);
    if ((currentValue === null &&
          !this.expertScalarDrafts.has(config.field)) ||
        (currentValue !== null && draftValue === currentValue) ||
        !isValidProductExpertScalarValue(config, draftValue)) {
      return false;
    }
    const write = this.expertScalarWrites.get(config.field);
    if (write === undefined) {
      return false;
    }
    if (this.isDemoMode) {
      return true;
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
        this.expertInputWriteState.status === 'executing' ||
        this.expertScalarWriteState.status === 'executing' ||
        this.roomNameWriteState.status === 'executing' ||
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
    if (this.isDemoMode) {
      return true;
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
    const value = this.viewModel.reads.advancedParameters.value;
    if (value === null || value.profile !== 'widoor') {
      if (value === null &&
          this.sensitiveActionState.action === config.action &&
          (this.sensitiveActionState.status === 'executing' ||
            this.sensitiveActionState.status === 'sent') &&
          this.sensitiveActionState.targetEnabled !== undefined) {
        return this.sensitiveActionState.targetEnabled;
      }
      return null;
    }
    const flags = decodeAdvancedPeripheralFlags(value.peripheralByte1);
    switch (config.action) {
      case 'radar-test-1':
        return flags.radarTest1;
      case 'radar-test-2':
        return flags.radarTest2;
      case 'advanced-peripheral-lock':
        return flags.locked;
      default:
        return null;
    }
  }

  canExecuteSensitiveAction(
    config: ProductSensitiveActionUiConfig,
  ): boolean {
    return this.canRenderSensitiveActionEnabled(config) &&
      !this.viewModel.loading &&
      !this.productDataLoadService.isLoading &&
      !this.productWriteInProgress() &&
      !this.productDateActionBusy &&
      !this.commandInProgress;
  }

  canRenderSensitiveActionEnabled(
    config: ProductSensitiveActionUiConfig,
  ): boolean {
    if (!this.sensitiveActions.includes(config) ||
        config.profile !== this.config.profile ||
        !this.isCurrentContext() ||
        this.context === null ||
        this.viewModel.connectionState === 'disconnected' ||
        this.bleService.disconnectingDeviceId !== null ||
        (this.sensitiveActionBusy &&
          this.sensitiveActionState.action === config.action)) {
      return false;
    }
    if (!this.isDemoMode &&
        config.action === 'advanced-peripheral-lock' &&
        !this.widoorLockSupported()) {
      return false;
    }
    if (this.sensitiveActionRequiresExpertAccess(config) &&
        !this.expertAccessGranted) {
      return false;
    }
    const current = this.sensitiveActionCurrentEnabled(config);
    if (config.control === 'toggle' &&
        current === null &&
        config.profile !== 'widoor') {
      return false;
    }
    const targetEnabled = config.control === 'toggle'
      ? current === null ? true : !current
      : undefined;
    const steps = productSensitiveActionWriteSteps(
      config,
      targetEnabled,
    );
    if (this.isDemoMode) {
      return true;
    }
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

    if (this.isDemoMode) {
      if (config.control === 'toggle' && enabled !== undefined) {
        this.updateSensitiveToggleDisplay(config.action, enabled);
      }
      this.sensitiveActionState = Object.freeze({
        status: 'sent',
        action: config.action,
        ...(enabled === undefined ? {} : { targetEnabled: enabled }),
        message: this.text.sensitiveActions.sent,
      });
      return;
    }

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

    if (this.productWriteInProgress() ||
        this.productDateActionBusy ||
        this.commandInProgress) {
      this.sensitiveActionState = Object.freeze({
        status: 'failed',
        action: config.action,
        message: this.text.sensitiveActions.failed,
      });
      return;
    }

    const steps = productSensitiveActionWriteSteps(config, enabled);
    this.sensitiveActionState = Object.freeze({
      status: 'executing',
      action: config.action,
      ...(enabled === undefined ? {} : { targetEnabled: enabled }),
      message: this.text.sensitiveActions.executing,
    });
    if (config.control === 'toggle' && enabled !== undefined) {
      this.updateSensitiveToggleDisplay(config.action, enabled);
    }

    for (const [index, step] of steps.entries()) {
      const contextStatus = this.writeContextStatus(context, step.write);
      if (contextStatus !== null) {
        if (config.control === 'toggle' && current !== null) {
          this.updateSensitiveToggleDisplay(config.action, current);
        }
        this.sensitiveActionState = Object.freeze({
          status: 'failed',
          action: config.action,
          message: this.text.sensitiveActions.failed,
        });
        return;
      }

      const attemptId = this.nextCommandIdentifier('attempt');
      const confirmedAt = Date.now();
      const authorization = config.requiresConfirmation
        ? createProductSensitiveActionAuthorization({
            write: step.write,
            deviceId: context.deviceId,
            connectionGeneration: context.connectionGeneration,
            attemptId,
            confirmationId: this.nextCommandIdentifier('confirmation'),
            confirmedAt,
          })
        : null;
      const result = await this.bleWriteExecutionService.execute({
        write: step.write,
        deviceId: context.deviceId,
        profile: config.profile,
        connectionGeneration: context.connectionGeneration,
        identification: { profile: config.profile, confidence: 'strong' },
        authorization,
        attemptId,
        confirmationPolicy: { kind: 'gatt-only' },
        policy: this.withPhase1ImmediatePolicy(config.profile, step.policy),
      });

      if (!this.isCurrentContext() || this.context !== context) {
        this.sensitiveActionState = Object.freeze({
          status: 'failed',
          action: config.action,
          message: this.text.sensitiveActions.failed,
        });
        return;
      }
      if (result.status !== 'success') {
        if (config.control === 'toggle' && current !== null) {
          this.updateSensitiveToggleDisplay(config.action, current);
        }
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
      ...(enabled === undefined ? {} : { targetEnabled: enabled }),
      message: this.text.sensitiveActions.sent,
    });
    if (config.control === 'toggle' && enabled !== undefined) {
      this.updateSensitiveToggleDisplay(config.action, enabled);
    }
    if ((config.action === 'reset' || this.shouldRefreshAfterSettledWrite()) &&
        this.canRefresh) {
      await this.refreshProductData({}, false);
    }
  }

  async requestProductCommand(
    config: ProductMotorCommandUiConfig,
  ): Promise<void> {
    if (!this.canExecuteProductCommand(config) ||
        this.context === null ||
        config.confirmationPolicy === null ||
        config.operation === 'motor-learning') {
      return;
    }

    const commandText = this.text.widoorCommands[config.textKey];

    if (this.isDemoMode) {
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

    try {
      const widoorBlock = this.widoorPhase1CommandBlock(config);
      if (widoorBlock !== null) {
        await this.presentWidoorCommandBlockedAlert(widoorBlock);
        if (this.isCurrentCommandCycle(cycle)) {
          this.openCommandState = Object.freeze({
            ...initialProductMotorCommandState(
              operation,
              commandText.label,
              config.expectedMotorStateRaw,
            ),
            status: 'unavailable',
            startedAt: requestedAt,
            completedAt: Date.now(),
            message: widoorBlock === 'lock'
              ? this.text.widoorCommandAlerts.lock.subtitle
              : this.text.widoorCommandAlerts.retention.subtitle,
          });
          this.addCommandHistory(this.openCommandState);
        }
        return;
      }

      const immediatePhase1Command =
        this.usesPhase1ImmediateWrite(config.profile);
      let confirmedAt = requestedAt;
      if (!immediatePhase1Command) {
        this.openCommandState = Object.freeze({
          ...initialProductMotorCommandState(
            operation,
            commandText.label,
            config.expectedMotorStateRaw,
          ),
          status: 'awaiting-confirmation',
          startedAt: requestedAt,
          message: this.text.openCommand.awaitingConfirmation,
        });
        const alert = await this.alertController.create({
          header: commandText.confirmTitle,
          message: commandText.confirmMessage,
          buttons: [
            { text: this.text.openCommand.cancel, role: 'cancel' },
            { text: commandText.confirmAction, role: 'confirm' },
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
            ...initialProductMotorCommandState(
              operation,
              commandText.label,
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
        confirmedAt = Date.now();
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
      const authorization = immediatePhase1Command
        ? null
        : createProductMotorCommandAuthorization({
            write,
            deviceId: context.deviceId,
            connectionGeneration: context.connectionGeneration,
            attemptId,
            confirmationId,
            confirmedAt,
            validatedAt: confirmedAt,
          });
      this.openCommandState = Object.freeze({
        ...initialProductMotorCommandState(
          operation,
          commandText.label,
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
        policy: this.withPhase1ImmediatePolicy(
          config.profile,
          config.physicalValidationPolicy,
        ),
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
          ...initialProductMotorCommandState(
            operation,
            commandText.label,
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
    if (this.isDemoMode) {
      this.updateDemoUserParameters(config.field === 'open-speed'
        ? { openSpeed: draftValue }
        : { closeSpeed: draftValue });
      this.userSpeedDrafts.delete(config.field);
      this.userSpeedWriteState = Object.freeze({
        status: 'sent',
        field: config.field,
        message: this.text.userSpeedControls.sent,
      });
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
    const authorization = this.usesPhase1ImmediateWrite(config.profile)
      ? null
      : createProductUserSpeedAuthorization({
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
      policy: this.withPhase1ImmediatePolicy(config.profile, config.policy),
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
      if (this.shouldRefreshAfterSettledWrite() && this.canRefresh) {
        await this.refreshProductData({}, false);
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
    if (this.isDemoMode) {
      this.updateDemoUserParameters(config.field === 'short-timing'
        ? { shortOpenTime: draftValue }
        : { longOpenTime: draftValue });
      this.userTimingDrafts.delete(config.field);
      this.userTimingWriteState = Object.freeze({
        status: 'sent',
        field: config.field,
        message: this.text.userTimingControls.sent,
      });
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
    const authorization = this.usesPhase1ImmediateWrite(config.profile)
      ? null
      : createProductUserTimingAuthorization({
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
      policy: this.withPhase1ImmediatePolicy(config.profile, config.policy),
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
      if (this.shouldRefreshAfterSettledWrite() && this.canRefresh) {
        await this.refreshProductData({}, false);
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
    if ((currentState === null &&
          !this.usesPhase1ImmediateWrite(config.profile)) ||
        checked === currentState ||
        !this.canToggleUserPeripheral(config) ||
        this.context === null) {
      return;
    }

    void triggerConfiguredHapticFeedback();
    if (this.isDemoMode) {
      this.updateDemoUserPeripheral(config.field, checked);
      this.userPeripheralWriteState = Object.freeze({
        status: 'sent',
        field: config.field,
        targetEnabled: checked,
        message: this.text.userPeripheralControls.sent,
      });
      return;
    }
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
    const authorization = this.usesPhase1ImmediateWrite(config.profile)
      ? null
      : createProductUserPeripheralAuthorization({
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
      targetEnabled: checked,
      message: this.text.userPeripheralControls.executing,
    });
    this.updateUserPeripheralDisplay(config.field, checked);

    const result = await this.bleWriteExecutionService.execute({
      write,
      deviceId: context.deviceId,
      profile: config.profile,
      connectionGeneration: context.connectionGeneration,
      identification: { profile: config.profile, confidence: 'strong' },
      authorization,
      attemptId,
      confirmationPolicy: config.confirmationPolicy,
      policy: this.withPhase1ImmediatePolicy(config.profile, config.policy),
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
        targetEnabled: checked,
        message: this.text.userPeripheralControls.sent,
      });
      if (this.shouldRefreshAfterSettledWrite() && this.canRefresh) {
        await this.refreshProductData({}, false);
      }
      return;
    }
    if (currentState !== null) {
      this.updateUserPeripheralDisplay(config.field, currentState);
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

  weightRangeSelectDisabled(): boolean {
    return this.config.family !== 'moventiv' &&
      !this.weightRangeControlUnlocked;
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
    if (this.isDemoMode) {
      this.updateDemoWeightRange(draftValue);
      this.weightRangeDraft = null;
      this.weightRangeWriteState = Object.freeze({
        status: 'sent',
        message: this.text.weightRangeControls.sent,
      });
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
    const authorization = this.usesPhase1ImmediateWrite(config.profile)
      ? null
      : createProductWeightRangeAuthorization({
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

    if (isMoventivProductProfile(config.profile)) {
      const speedResult = await this.writeMoventivWeightAssociatedSpeeds(
        config.profile,
        draftValue,
        context,
      );
      if (!speedResult) {
        this.weightRangeWriteState = Object.freeze({
          status: 'failed',
          message: this.text.weightRangeControls.failed,
        });
        return;
      }
    }

    const result = await this.bleWriteExecutionService.execute({
      write,
      deviceId: context.deviceId,
      profile: config.profile,
      connectionGeneration: context.connectionGeneration,
      identification: { profile: config.profile, confidence: 'strong' },
      authorization,
      attemptId,
      confirmationPolicy: config.confirmationPolicy,
      policy: this.withPhase1ImmediatePolicy(config.profile, config.policy),
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
      if (productProfileRegistry.get(config.profile).family === 'moventiv') {
        await this.maybeRefreshAfterMoventivWeightChange();
      } else if (this.canRefresh) {
        await this.refreshProductData({}, false);
      }
      return;
    }
    this.weightRangeWriteState = Object.freeze({
      status: 'failed',
      message: this.text.weightRangeControls.failed,
    });
  }

  private async writeMoventivWeightAssociatedSpeeds(
    profile: KnownProductProfile,
    range: ProductWeightRange,
    context: ProductPageNavigationState,
  ): Promise<boolean> {
    const associated = this.moventivWeightAssociatedSpeeds(range);
    if (associated === null) {
      return false;
    }
    const writes: readonly {
      readonly field: ProductUserSpeedField;
      readonly value: number;
    }[] = [
      { field: 'open-speed', value: associated.openSpeed },
      { field: 'close-speed', value: associated.closeSpeed },
    ];

    for (const item of writes) {
      const control = this.userSpeedControls.find((candidate) =>
        candidate.config.field === item.field,
      )?.config;
      if (control === undefined) {
        return false;
      }
      const write = control.catalogFactory(item.value);
      const contextStatus = this.writeContextStatus(context, write);
      if (contextStatus !== null) {
        return false;
      }
      const result = await this.bleWriteExecutionService.execute({
        write,
        deviceId: context.deviceId,
        profile,
        connectionGeneration: context.connectionGeneration,
        identification: { profile, confidence: 'strong' },
        authorization: null,
        attemptId: this.nextCommandIdentifier('attempt'),
        confirmationPolicy: control.confirmationPolicy,
        policy: this.withPhase1ImmediatePolicy(profile, control.policy),
      });
      if (!this.isCurrentContext() ||
          this.context !== context ||
          result.status !== 'success') {
        return false;
      }
      this.userSpeedDrafts.set(item.field, item.value);
    }
    return true;
  }

  private moventivWeightAssociatedSpeeds(
    range: ProductWeightRange,
  ): { readonly openSpeed: number; readonly closeSpeed: number } | null {
    if (
        (range.lower === 10 && range.upper === 20) ||
        (range.lower === 20 && range.upper === 30)) {
      return { openSpeed: 100, closeSpeed: 70 };
    }
    if (
        (range.lower === 30 && range.upper === 40) ||
        (range.lower === 40 && range.upper === 50)) {
      return { openSpeed: 80, closeSpeed: 70 };
    }
    if (
        (range.lower === 50 && range.upper === 60) ||
        (range.lower === 60 && range.upper === 80)) {
      return { openSpeed: 75, closeSpeed: 70 };
    }
    return null;
  }

  async requestExpertScalarChange(
    config: ProductExpertScalarUiConfig,
  ): Promise<void> {
    if (!this.canApplyExpertScalar(config) || this.context === null) {
      return;
    }

    void triggerConfiguredHapticFeedback();
    const draftValue = this.expertScalarDraftValue(config);
    if (!isValidProductExpertScalarValue(config, draftValue)) {
      return;
    }
    if (this.isDemoMode) {
      this.updateDemoExpertScalar(config.field, draftValue);
      this.expertScalarDrafts.delete(config.field);
      this.expertScalarWriteState = Object.freeze({
        status: 'sent',
        field: config.field,
        message: this.text.expertScalarControls.sent,
      });
      return;
    }
    const write = config.catalogFactory(draftValue);
    const context = this.context;
    const contextStatus = this.writeContextStatus(context, write);
    if (contextStatus !== null) {
      this.expertScalarWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.expertScalarFailureMessage(contextStatus),
      });
      return;
    }

    const attemptId = this.nextCommandIdentifier('attempt');
    const confirmedAt = Date.now();
    const authorization = this.usesPhase1ImmediateWrite(config.profile)
      ? null
      : createProductExpertScalarAuthorization({
          write,
          deviceId: context.deviceId,
          connectionGeneration: context.connectionGeneration,
          attemptId,
          confirmationId: this.nextCommandIdentifier('confirmation'),
          confirmedAt,
        });
    this.expertScalarWriteState = Object.freeze({
      status: 'executing',
      field: config.field,
      message: this.text.expertScalarControls.executing,
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
      policy: this.withPhase1ImmediatePolicy(config.profile, config.policy),
    });
    if (!this.isCurrentContext() || this.context !== context) {
      this.expertScalarWriteState = Object.freeze({
        status: 'failed',
        field: config.field,
        message: this.text.openCommand.stale,
      });
      return;
    }
    if (result.status === 'success') {
      this.expertScalarWriteState = Object.freeze({
        status: 'sent',
        field: config.field,
        message: this.text.expertScalarControls.sent,
      });
      if (this.shouldRefreshAfterSettledWrite() && this.canRefresh) {
        await this.refreshProductData({}, false);
      }
      return;
    }
    this.expertScalarWriteState = Object.freeze({
      status: 'failed',
      field: config.field,
      message: this.text.expertScalarControls.failed,
    });
  }

  async requestExpertAccess(): Promise<void> {
    const context = this.currentExpertAccessContext();
    if (context === null || !this.expertAccessControlsAvailable) {
      return;
    }
    const alert = await this.alertController.create({
      header: this.text.expertAccess.title,
      message: this.text.expertAccess.message,
      inputs: [
        {
          name: 'expertAccessCode',
          type: 'password',
          placeholder: this.text.expertAccess.placeholder,
        },
      ],
      buttons: [
        {
          text: this.text.expertAccess.cancel,
          role: 'cancel',
        },
        {
          text: this.text.expertAccess.confirm,
          role: 'confirm',
        },
      ],
    });
    await alert.present();
    const dismissal = await alert.onDidDismiss<{
      readonly expertAccessCode?: string;
      readonly values?: {
        readonly expertAccessCode?: string;
      };
    }>();
    if (dismissal.role !== 'confirm') {
      return;
    }
    const code = dismissal.data?.values?.expertAccessCode ??
      dismissal.data?.expertAccessCode ??
      '';
    this.applyExpertAccessCode(context, code);
  }

  setExpertAccessCode(
    eventOrValue: CustomEvent<{ readonly value?: string | null }> | string,
  ): void {
    this.expertAccessCode = typeof eventOrValue === 'string'
      ? eventOrValue
      : eventOrValue.detail.value ?? '';
  }

  submitExpertAccessCode(): void {
    const context = this.currentExpertAccessContext();
    if (context === null || !this.expertAccessControlsAvailable) {
      return;
    }
    this.applyExpertAccessCode(context, this.expertAccessCode);
  }

  private applyExpertAccessCode(
    context: ExpertAccessContext,
    code: string,
  ): void {
    if (this.expertAccessService.authenticate(context, code)) {
      this.expertAccessCode = '';
      this.expertAccessState = Object.freeze({
        status: 'unlocked',
        message: this.text.expertAccess.unlocked,
      });
      return;
    }
    this.expertAccessState = Object.freeze({
      status: 'failed',
      message: this.text.expertAccess.failed,
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
    this.traceCommissioning('requested', {
      profile: context.profile,
      deviceId: context.deviceId,
      action: actionKind,
      firstCommissioningDate: dates.firstCommissioningDate,
      lastMaintenanceDate: dates.lastMaintenanceDate,
      buttonState: this.productDateMaintenanceActionLabel,
    });
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

    if (this.isDemoMode) {
      this.productDateActionState = Object.freeze({
        status: 'sent',
        action: actionKind,
        message: actionKind === 'first-commissioning'
          ? this.text.productDateActions.setupSent
          : this.text.productDateActions.maintenanceSent,
      });
      return;
    }

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
      const step = action.action === 'maintenance'
        ? 'maintenance-write' : 'first-write';
      this.traceCommissioning(`${step}-start`, {
        profile: context.profile,
        deviceId: context.deviceId,
        payloadHex: action.write.payloadHex,
        characteristicUuid: action.write.characteristicUuid,
      });
      const contextStatus = this.writeContextStatus(context, action.write);
      if (contextStatus !== null) {
        this.traceCommissioning(`${step}-result`, {
          status: contextStatus,
          error: this.productDateActionFailureMessage(contextStatus),
        });
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
      this.traceCommissioning(`${step}-result`, {
        status: result.status,
        payloadHex: result.payloadHex,
        nativeWriteCompleted: result.nativeWriteCompleted,
        error: result.error,
      });
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

    if (flow.kind === 'first-commissioning') {
      const verification = await this.verifyFirstCommissioningDate(context);
      if (!this.isCurrentContext() || this.context !== context) {
        this.traceCommissioning('final-state', {
          status: 'stale',
          verification,
          profile: context.profile,
          deviceId: context.deviceId,
        });
        return;
      }
      this.productDateActionState = Object.freeze({
        status: verification === 'confirmed' ? 'sent' : 'failed',
        action: flow.kind,
        message: verification === 'confirmed'
          ? this.text.productDateActions.setupSent
          : verification === 'read-failed'
            ? this.text.productDateActions.setupSentReloadFailed
            : this.text.productDateActions.setupNotConfirmed,
      });
      this.traceCommissioning('final-state', {
        status: this.productDateActionState.status,
        verification,
        firstCommissioningDate:
          this.viewModel.reads.datesAndCycles.value?.firstCommissioningDate,
        lastMaintenanceDate:
          this.viewModel.reads.datesAndCycles.value?.lastMaintenanceDate,
        buttonState: this.productDateMaintenanceActionLabel,
      });
      return;
    }

    this.productDateActionState = Object.freeze({
      status: 'sent',
      action: flow.kind,
      message: this.text.productDateActions.maintenanceSent,
    });
    if (this.shouldRefreshAfterProductDateAction(flow.kind)) {
      await this.refreshAfterProductDateAction();
    }
    this.traceCommissioning('final-state', {
      status: this.productDateActionState.status,
      firstCommissioningDate:
        this.viewModel.reads.datesAndCycles.value?.firstCommissioningDate,
      lastMaintenanceDate:
        this.viewModel.reads.datesAndCycles.value?.lastMaintenanceDate,
      buttonState: this.productDateMaintenanceActionLabel,
    });
  }

  async requestRoomNameChange(): Promise<void> {
    if (!this.canRequestRoomNameChange() || this.context === null) {
      return;
    }

    const validation = validateProductRoomNameDraft(
      this.currentRoomNameValue(),
      this.roomNameDraftValue(),
    );
    if (!validation.valid) {
      const message = this.roomNameValidationMessage();
      if (message !== null) {
        this.roomNameWriteState = Object.freeze({
          status: 'failed',
          message,
        });
        await this.presentRoomNameWriteFailure(message);
      }
      return;
    }
    void triggerConfiguredHapticFeedback();
    if (this.isDemoMode) {
      this.viewModel = {
        ...this.viewModel,
        displayedName: validation.baseName,
        roomSuffix: validation.roomSuffix,
      };
      this.resetRoomNameDraft();
      this.roomNameWriteState = Object.freeze({
        status: 'sent',
        message: this.text.nameRoomControls.sent,
      });
      return;
    }
    const write = encodeProductRoomNameWrite(this.config.profile, validation);
    const context = this.context;
    const contextStatus = this.writeContextStatus(context, write);
    if (contextStatus !== null) {
      const message = this.roomNameFailureMessage(contextStatus);
      this.roomNameWriteState = Object.freeze({
        status: 'failed',
        message,
      });
      await this.presentRoomNameWriteFailure(message);
      return;
    }

    const attemptId = this.nextCommandIdentifier('attempt');
    const confirmedAt = Date.now();
    const authorization = this.usesPhase1ImmediateWrite(this.config.profile)
      ? null
      : createProductRoomNameAuthorization({
          write,
          deviceId: context.deviceId,
          connectionGeneration: context.connectionGeneration,
          attemptId,
          confirmationId: this.nextCommandIdentifier('confirmation'),
          confirmedAt,
        });
    this.roomNameWriteState = Object.freeze({
      status: 'executing',
      message: this.text.nameRoomControls.executing,
    });

    await this.delay(PRODUCT_ROOM_NAME_PRE_WRITE_DELAY_MS);
    if (!this.isCurrentContext() || this.context !== context) {
      const message = this.text.openCommand.stale;
      this.roomNameWriteState = Object.freeze({
        status: 'failed',
        message,
      });
      await this.presentRoomNameWriteFailure(message);
      return;
    }

    const result = await this.bleWriteExecutionService.execute({
      write,
      deviceId: context.deviceId,
      profile: this.config.profile,
      connectionGeneration: context.connectionGeneration,
      identification: { profile: this.config.profile, confidence: 'strong' },
      authorization,
      attemptId,
      confirmationPolicy: PRODUCT_ROOM_NAME_CONFIRMATION_POLICY,
      policy: this.withPhase1ImmediatePolicy(
        this.config.profile,
        PRODUCT_ROOM_NAME_EXECUTION_POLICY,
      ),
    });
    if (!this.isCurrentContext() || this.context !== context) {
      const message = this.text.openCommand.stale;
      this.roomNameWriteState = Object.freeze({
        status: 'failed',
        message,
      });
      await this.presentRoomNameWriteFailure(message);
      return;
    }
    if (result.status === 'success') {
      this.viewModel = {
        ...this.viewModel,
        displayedName: validation.baseName,
        roomSuffix: validation.roomSuffix,
      };
      this.resetRoomNameDraft();
      this.roomNameWriteState = Object.freeze({
        status: 'sent',
        message: this.text.nameRoomControls.sent,
      });
      await this.delay(PRODUCT_ROOM_NAME_POST_WRITE_COOLDOWN_MS);
      if (this.shouldRefreshAfterSettledWrite() && this.canRefresh) {
        await this.refreshProductData({}, false);
      }
      return;
    }
    const message = this.text.nameRoomControls.failed;
    this.roomNameWriteState = Object.freeze({
      status: 'failed',
      message,
    });
    await this.presentRoomNameWriteFailure(message);
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

    if (checked && config.mode === 'locked-closed' &&
        this.isMoventivProfile) {
      void this.presentMoventivCloseLockInformation();
    }

    void triggerConfiguredHapticFeedback();
    if (this.isDemoMode) {
      this.updateDemoLockMode(nextMode);
      this.lockModeWriteState = Object.freeze({
        status: 'sent',
        message: this.text.lockModeControls.sent,
      });
      return;
    }
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
    const authorization = this.usesPhase1ImmediateWrite(config.profile)
      ? null
      : createProductLockModeAuthorization({
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
    this.updateLockModeDisplay(nextMode);

    const result = await this.bleWriteExecutionService.execute({
      write,
      deviceId: context.deviceId,
      profile: config.profile,
      connectionGeneration: context.connectionGeneration,
      identification: { profile: config.profile, confidence: 'strong' },
      authorization,
      attemptId,
      confirmationPolicy: config.confirmationPolicy,
      policy: this.withPhase1ImmediatePolicy(config.profile, config.policy),
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
      if (this.shouldRefreshAfterSettledWrite() && this.canRefresh) {
        await this.refreshProductData({}, false);
      }
      return;
    }
    this.updateLockModeDisplay(currentMode);
    this.lockModeWriteState = Object.freeze({
      status: 'failed',
      message: this.text.lockModeControls.failed,
    });
  }

  async backToScan(
    options: ProductBackToScanOptions = {},
  ): Promise<boolean> {
    if (this.returningToScan) {
      return false;
    }
    this.returningToScan = true;
    if (!options.preserveInactivityExpiration) {
      this.stopConnectedProductInactivity();
    }
    this.returnToScanErrorMessage = null;
    const deviceId = this.context?.deviceId ?? this.bleService.connectedDeviceId;
    let disconnectStatus: 'success' | 'failed' = 'success';
    try {
      await this.flushPendingSliderWrites();
      this.resetOpenCommandState();
      this.loadCycle += 1;
      if (this.viewModel.loading || this.productDataLoadService.isLoading) {
        this.productDataLoadService.cancelCurrentLoad();
      }
      if (this.isDemoMode) {
        return await this.navigateToScan();
      }
      if (this.bleService.connectedDeviceId !== null) {
        try {
          await this.bleService.disconnect();
        } catch {
          disconnectStatus = this.bleService.connectedDeviceId === null
            ? 'success'
            : 'failed';
        }
      }
      this.invalidateContext(
        disconnectStatus === 'success' ? 'disconnected' : 'stale',
      );
      if (deviceId !== null) {
        this.productExitState.record({ deviceId, disconnectStatus });
      }
      const navigated = await this.navigateToScan();
      if (!navigated) {
        this.productExitState.clear();
      }
      return navigated;
    } finally {
      if (!this.destroyed) {
        this.returningToScan = false;
      }
    }
  }

  ionViewWillEnter(): void {
    console.info('[INPUT] product-page-entered', JSON.stringify({
      profile: this.config.profile,
      deviceId: this.context?.deviceId ?? null,
      connectionState: this.viewModel.connectionState,
      userReadStatus: this.viewModel.reads.userParameters.status,
      at: Date.now(),
    }));
    this.productBackButtonSubscription?.unsubscribe();
    this.productBackButtonSubscription =
      this.platform.backButton.subscribeWithPriority(10, () =>
        this.backToScan(),
      );
    if (this.routerOutlet !== null) {
      this.routerOutlet.swipeGesture = false;
    }
    if (this.viewModel.lastUpdatedAt === null && this.canRefresh) {
      void this.initializeConnectedProductPage();
    } else if (this.activeMainTab === 'settings') {
      void this.refreshSettingsOnEntry();
    } else if (this.activeMainTab === 'information') {
      void this.refreshInformationOnEntry();
    }
  }

  ionViewWillLeave(): void {
    this.productBackButtonSubscription?.unsubscribe();
    this.productBackButtonSubscription = null;
    if (this.routerOutlet !== null) {
      this.routerOutlet.swipeGesture = true;
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stopConnectedProductInactivity();
    this.loadCycle += 1;
    this.resetOpenCommandState();
    if (this.viewModel.loading) {
      this.productDataLoadService.cancelCurrentLoad();
    }
    this.resetRoomNameEditing();
    this.resetUserSpeedEditing();
    this.resetUserTimingEditing();
    this.resetUserPeripheralEditing();
    this.resetWeightRangeEditing();
    this.resetExpertScalarEditing();
    this.resetExpertAccess();
    this.resetProductDateAction();
    this.clearWidoorSliderWrites();
    this.productBackButtonSubscription?.unsubscribe();
    this.productBackButtonSubscription = null;
    if (this.appStateListener !== null) {
      void this.appStateListener.remove();
      this.appStateListener = null;
    }
    this.subscriptions.unsubscribe();
  }

  private scrollContentToTop(): void {
    void this.content?.scrollToTop(0);
  }

  private async initializeConnectedProductPage(): Promise<void> {
    const context = this.context;
    if (context === null || this.isDemoMode ||
        this.initialPageInitializationInProgress || !this.canRefresh) {
      return;
    }

    this.initialPageInitializationInProgress = true;
    this.viewModel = { ...this.viewModel, loading: true };
    try {
      await this.bleService.waitForNotificationStart(
        BLE_UUIDS.shdoService,
        BLE_UUIDS.motorStateCharacteristic,
        context.deviceId,
      );
    } catch (error: unknown) {
      console.warn('Motor notification wait failed.', error);
    } finally {
      if (!this.destroyed) {
        this.viewModel = { ...this.viewModel, loading: false };
      }
    }

    try {
      if (this.canRefresh) {
        await this.refreshProductData();
      }
    } finally {
      this.initialPageInitializationInProgress = false;
    }
  }

  private connectedProductInactivitySessionId(): string | null {
    const context = this.context;
    if (context === null || context.mode === 'demo') {
      return null;
    }
    return `${context.profile}:${context.deviceId}:` +
      `${context.connectionGeneration}`;
  }

  private stopConnectedProductInactivity(): void {
    const sessionId = this.connectedProductInactivitySessionId();
    if (sessionId !== null) {
      this.connectedProductInactivity.stop(sessionId);
    }
  }

  private navigateToScan(): Promise<boolean> {
    return this.ngZone.run(() => this.router.navigate(['/scan']));
  }

  private productWriteInProgress(): boolean {
    return this.bleService.isWriting ||
      this.bleWriteExecutionService.isExecuting ||
      this.widoorSliderWriteTimeouts.size > 0 ||
      this.openCommandState.status === 'executing' ||
      this.lockModeWriteState.status === 'executing' ||
      this.userSpeedWriteState.status === 'executing' ||
      this.userTimingWriteState.status === 'executing' ||
      this.userPeripheralWriteState.status === 'executing' ||
      this.weightRangeWriteState.status === 'executing' ||
      this.expertInputWriteState.status === 'executing' ||
      this.expertScalarWriteState.status === 'executing' ||
      this.roomNameWriteState.status === 'executing' ||
      this.productDateActionState.status === 'executing' ||
      this.sensitiveActionState.status === 'executing';
  }

  private async handleConnectedProductInactivityTimeout(): Promise<boolean> {
    try {
      const alert = await this.alertController.getTop();
      await alert?.dismiss(undefined, 'product-inactivity-timeout');
    } catch {
      // An overlay can disappear between lookup and dismissal.
    }
    return await this.backToScan({ preserveInactivityExpiration: true });
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
    if (!productProfileRegistry.has(routeProfile) ||
        context === null ||
        context.profile !== routeProfile) {
      return 'invalid-profile';
    }
    if (context.mode === 'demo') {
      return 'demo';
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
    const rawValue = context?.displayName ?? '';
    const physicalName = normalizeBleProductName(rawValue) || this.config.productName;
    const { name, roomSuffix } = splitProductDisplayName(physicalName);
    const demoSnapshot = context?.mode === 'demo' &&
      isProductDemoProfile(this.config)
      ? createProductDemoSnapshot(this.config)
      : null;
    return {
      profile,
      productName: this.config.productName,
      displayedName: name,
      roomSuffix,
      deviceId: context?.deviceId ?? '',
      connectionGeneration: context?.connectionGeneration ?? -1,
      connectionState,
      motorState: demoSnapshot?.motorState ??
        (connectionState === 'connected' ? context?.motorState ?? null : null),
      reads: demoSnapshot === null
        ? initialReadStates()
        : demoReadStates(demoSnapshot),
      loading: false,
      loadStatus: demoSnapshot === null ? null : 'success',
      partialSuccess: false,
      lastUpdatedAt: demoSnapshot === null ? null : Date.now(),
      globalError: connectionState === 'connected' || connectionState === 'demo'
        ? null
        : this.connectionStateLabel(connectionState),
    };
  }

  private isCurrentContext(): boolean {
    const context = this.context;
    if (this.destroyed || context === null ||
        this.viewModel.profile !== context.profile) {
      return false;
    }
    if (context.mode === 'demo') {
      return this.viewModel.connectionState === 'demo';
    }
    return context !== null &&
      this.viewModel.connectionState === 'connected' &&
      this.viewModel.profile === context.profile &&
      this.bleService.connectedDeviceId === context.deviceId &&
      this.bleService.connectionGeneration === context.connectionGeneration;
  }

  private async presentAdvancedSettingsAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.text.moventivAdvancedAlert.title,
      message: this.text.moventivAdvancedAlert.message,
      buttons: [
        {
          text: this.text.moventivAdvancedAlert.no,
          role: 'cancel',
        },
        {
          text: this.text.moventivAdvancedAlert.yes,
          role: 'confirm',
        },
      ],
    });
    await alert.present();
    const dismissal = await alert.onDidDismiss();
    if (dismissal.role !== 'confirm' &&
        this.config.behavior.advancedSettingsConfirmation &&
        this.activeMainTab === 'settings' &&
        this.activeSettingsTab === 'advanced') {
      this.setActiveSettingsTab('basic');
    }
  }

  private async presentMoventivCloseLockInformation(): Promise<void> {
    const text = this.text.moventivCloseLockAlert;
    const alert = await this.alertController.create({
      header: text.title,
      message: text.message,
      buttons: [text.ok],
    });
    await alert.present();
  }

  private async presentRoomNameWriteFailure(message: string): Promise<void> {
    const alert = await this.alertController.create({
      message,
      buttons: [
        {
          text: this.text.widoorCommandAlerts.lock.ok,
          role: 'cancel',
        },
      ],
    });
    await alert.present();
  }

  private roomNameRequestContextAvailable(): boolean {
    return this.showRoomNameControls &&
      this.isCurrentContext() &&
      !this.viewModel.loading &&
      !this.productDataLoadService.isLoading &&
      !this.bleService.isWriting &&
      this.bleService.disconnectingDeviceId === null &&
      !this.bleWriteExecutionService.isExecuting &&
      this.lockModeWriteState.status !== 'executing' &&
      this.userSpeedWriteState.status !== 'executing' &&
      this.userTimingWriteState.status !== 'executing' &&
      this.userPeripheralWriteState.status !== 'executing' &&
      this.weightRangeWriteState.status !== 'executing' &&
      this.expertInputWriteState.status !== 'executing' &&
      this.expertScalarWriteState.status !== 'executing' &&
      this.roomNameWriteState.status !== 'executing' &&
      !this.productDateActionBusy &&
      !this.sensitiveActionBusy &&
      !this.commandInProgress &&
      this.context !== null;
  }

  private shouldRefreshAfterSettledWrite(): boolean {
    return !this.usesPhase1ImmediateWrite(this.config.profile);
  }

  private phase1ShowsUserParameterControls(): boolean {
    return this.viewModel.reads.userParameters.status === 'available' ||
      this.config.behavior.showControlsBeforeRead;
  }

  private phase1ShowsExpertControls(): boolean {
    return this.viewModel.reads.advancedParameters.status === 'available' ||
      this.config.behavior.showControlsBeforeRead;
  }

  private withPhase1ImmediatePolicy(
    profile: KnownProductProfile,
    policy: LegacyBleWriteExecutionPolicy | undefined,
  ): LegacyBleWriteExecutionPolicy | undefined {
    switch (productProfileRegistry.get(profile).behavior
      .immediateWritePolicy) {
      case 'widoor':
        return Object.freeze({
          ...(policy ?? {}),
          allowWidoorPhase1ImmediateWrite: true,
        });
      case 'moventiv':
        return Object.freeze({
          ...(policy ?? {}),
          allowMoventivPhase1ImmediateWrite: true,
        });
      case 'garline':
        return Object.freeze({
          ...(policy ?? {}),
          allowGarlinePhase1ImmediateWrite: true,
        });
      case 'none':
        return policy;
    }
  }

  private usesPhase1ImmediateWrite(profile: KnownProductProfile): boolean {
    return productProfileRegistry.get(profile).behavior
      .immediateWritePolicy !== 'none';
  }

  private usesPhase1SliderAutoWrite(): boolean {
    return this.config.behavior.sliderAutoWrite;
  }

  showApplyButtonForProfile(profile: KnownProductProfile): boolean {
    return !this.usesPhase1ImmediateWrite(profile);
  }

  private maybeRefreshAfterMoventivWeightChange(): Promise<void> {
    if (this.config.family !== 'moventiv' || !this.canRefresh) {
      return Promise.resolve();
    }
    return this.refreshProductData({
      version: false,
      datesAndCycles: false,
      maintenance: false,
      userParameters: false,
      advancedParameters: true,
    }, false);
  }

  private scheduleWidoorSliderWrite(
    key: string,
    write: () => Promise<void>,
  ): void {
    if (!this.usesPhase1SliderAutoWrite()) {
      return;
    }
    this.clearWidoorSliderWrite(key);
    const timeout = window.setTimeout(() => {
      const pending = this.widoorSliderWriteTimeouts.get(key);
      if (pending?.timeout !== timeout) {
        return;
      }
      this.widoorSliderWriteTimeouts.delete(key);
      void pending.write();
    }, this.widoorSliderButtonWriteDelayMs);
    this.widoorSliderWriteTimeouts.set(key, { timeout, write });
  }

  private flushWidoorSliderWrite(
    key: string,
    write: () => Promise<void>,
  ): void {
    if (!this.usesPhase1SliderAutoWrite()) {
      return;
    }
    this.clearWidoorSliderWrite(key);
    void write();
  }

  private clearWidoorSliderWrite(key: string): void {
    const pending = this.widoorSliderWriteTimeouts.get(key);
    if (pending !== undefined) {
      window.clearTimeout(pending.timeout);
      this.widoorSliderWriteTimeouts.delete(key);
    }
  }

  private clearWidoorSliderWrites(): void {
    for (const pending of this.widoorSliderWriteTimeouts.values()) {
      window.clearTimeout(pending.timeout);
    }
    this.widoorSliderWriteTimeouts.clear();
  }

  private unlockWidoorSlider(key: string): void {
    if (this.widoorActiveSliderKey !== key) {
      this.activateWidoorSlider(key);
    }
  }

  private toggleProductSliderLock(
    key: string,
    usesExclusiveSliderInteraction: boolean,
  ): void {
    if (!usesExclusiveSliderInteraction) {
      this.controlLocks.toggle(key);
      return;
    }
    if (this.widoorActiveSliderKey === key) {
      this.controlLocks.lock(key);
      this.widoorActiveSliderKey = null;
      this.widoorPrecisionSliderKey = null;
      return;
    }
    this.activateWidoorSlider(key);
  }

  private activateWidoorSlider(key: string): void {
    if (this.widoorActiveSliderKey !== null) {
      this.controlLocks.lock(this.widoorActiveSliderKey);
    }
    if (!this.controlLocks.isUnlocked(key)) {
      this.controlLocks.toggle(key);
    }
    this.widoorActiveSliderKey = key;
    this.widoorPrecisionSliderKey = null;
  }

  private toggleWidoorSliderPrecision(
    key: string,
    unlocked: boolean,
    event: Event,
  ): void {
    event.stopPropagation();
    if (!unlocked) {
      return;
    }
    this.widoorPrecisionSliderKey =
      this.widoorPrecisionSliderKey === key ? null : key;
  }

  private async flushPendingSliderWrites(): Promise<void> {
    const pendingWrites = [...this.widoorSliderWriteTimeouts.values()];
    this.clearWidoorSliderWrites();
    for (const pending of pendingWrites) {
      await pending.write();
    }
  }

  private async delay(milliseconds: number): Promise<void> {
    await new Promise<void>((resolve) =>
      window.setTimeout(resolve, milliseconds),
    );
  }

  private widoorPhase1CommandBlock(
    config: ProductMotorCommandUiConfig,
  ): 'lock' | 'retention' | null {
    if (config.profile !== 'widoor') {
      return null;
    }
    const lockMode = this.currentLockMode();
    if (
        (config.operation === 'motor-open' ||
          config.operation === 'motor-open-short-timed') &&
        lockMode === 'locked-closed') {
      return 'lock';
    }
    if (
        (config.operation === 'motor-open' ||
          config.operation === 'motor-open-short-timed' ||
          config.operation === 'motor-close') &&
        lockMode === 'locked-open') {
      return 'retention';
    }
    return null;
  }

  private async presentWidoorCommandBlockedAlert(
    reason: 'lock' | 'retention',
  ): Promise<void> {
    const text = this.text.widoorCommandAlerts[reason];
    const alert = await this.alertController.create({
      header: text.title,
      message: text.subtitle,
      buttons: [text.ok],
    });
    await alert.present();
  }

  private isCurrentLoad(
    cycle: number,
    context: ProductPageNavigationState,
  ): boolean {
    return cycle === this.loadCycle &&
      this.context === context &&
      this.isCurrentContext();
  }

  private async refreshSettingsOnEntry(): Promise<void> {
    if (!this.canRefresh || this.context === null || this.isDemoMode) {
      return;
    }
    const { profile, deviceId } = this.context;
    this.userSpeedDrafts.clear();
    this.userTimingDrafts.clear();
    this.weightRangeDraft = null;
    this.expertScalarDrafts.clear();
    console.info('[SETTINGS REFRESH] start', JSON.stringify({ profile, deviceId }));
    try {
      await this.refreshProductData({
        version: false,
        datesAndCycles: false,
        maintenance: false,
        userParameters: true,
        advancedParameters: true,
      }, false, true);
    } catch (error: unknown) {
      console.warn('[SETTINGS REFRESH] read failed', JSON.stringify({
        profile,
        deviceId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  private async refreshInformationOnEntry(): Promise<void> {
    if (!this.canRefresh || this.isDemoMode) {
      return;
    }
    await this.refreshProductData({
      version: true,
      datesAndCycles: true,
      maintenance: true,
      userParameters: false,
      advancedParameters: this.config.information.showCurrentWeightRange,
    }, false);
  }

  private applyLoadResult(
    result: ProductDataLoadResult,
    settingsRefresh = false,
  ): void {
    if (settingsRefresh) {
      console.info('[SETTINGS REFRESH] completed', JSON.stringify({
        profile: result.profile,
        deviceId: result.deviceId,
        status: result.status,
        userParameters: result.results.userParameters?.status ?? null,
        advancedParameters: result.results.advancedParameters?.status ?? null,
        error: result.error,
      }));
      for (const step of ['userParameters', 'advancedParameters'] as const) {
        const read = result.results[step];
        if (read !== undefined && read.status !== 'success') {
          console.warn('[SETTINGS REFRESH] read failed', JSON.stringify({
            profile: result.profile,
            deviceId: result.deviceId,
            step,
            status: read.status,
            error: read.error,
          }));
        }
      }
    }
    const terminalConnectionState =
      result.status === 'disconnected'
        ? 'disconnected'
        : result.status === 'stale'
          ? 'stale'
          : this.viewModel.connectionState;
    const keepMissingRead = result.status !== 'disconnected' &&
      result.status !== 'stale';
    const fullLoad = result.notRequested.length === 0;
    const hadConfirmedUserParameters =
      this.viewModel.reads.userParameters.value !== null;
    if (result.results.userParameters !== undefined &&
        result.results.userParameters.status !== 'success') {
      for (const control of this.expertInputControls) {
        const mode = this.currentExpertInputMode(control.config);
        if (mode !== null) {
          this.requestedExpertInputModes.set(control.config.field, mode);
        }
      }
    }
    this.viewModel = {
      ...this.viewModel,
      connectionState: terminalConnectionState,
      reads: {
        version: result.results.version === undefined && keepMissingRead
          ? this.viewModel.reads.version
          : readView(result.results.version, result.status),
        datesAndCycles: result.results.datesAndCycles === undefined &&
          keepMissingRead
          ? this.viewModel.reads.datesAndCycles
          : readView(result.results.datesAndCycles, result.status),
        maintenance: result.results.maintenance === undefined &&
          keepMissingRead
          ? this.viewModel.reads.maintenance
          : readView(result.results.maintenance, result.status),
        userParameters: (result.results.userParameters === undefined &&
          keepMissingRead) || (settingsRefresh && keepMissingRead &&
          result.results.userParameters?.status !== 'success' &&
          this.viewModel.reads.userParameters.value !== null)
          ? this.viewModel.reads.userParameters
          : readView(result.results.userParameters, result.status),
        advancedParameters:
          (result.results.advancedParameters === undefined &&
            keepMissingRead) || (settingsRefresh && keepMissingRead &&
            result.results.advancedParameters?.status !== 'success' &&
            this.viewModel.reads.advancedParameters.value !== null)
            ? this.viewModel.reads.advancedParameters
            : readView(result.results.advancedParameters, result.status),
      },
      loadStatus: result.status,
      partialSuccess: result.partialSuccess,
      lastUpdatedAt: result.completedAt,
      globalError: result.error?.message ?? null,
    };
    if (result.results.userParameters?.status === 'success') {
      this.requestedExpertInputModes.clear();
    }
    if (result.results.userParameters !== undefined) {
      const inputFlags = this.viewModel.reads.userParameters.value
        ?.peripheralFlags ?? null;
      console.info('[INPUT] ui-read-applied', JSON.stringify({
        profile: this.config.profile,
        deviceId: this.context?.deviceId ?? null,
        status: result.results.userParameters.status,
        viewStatus: this.viewModel.reads.userParameters.status,
        rawHex: result.results.userParameters.decoded?.rawHex ?? null,
        peripheralByte1:
          this.viewModel.reads.userParameters.value?.peripheralByte1 ?? null,
        input1Radar: inputFlags?.input1Radar ?? null,
        input2Radar: inputFlags?.input2Radar ?? null,
        error: result.results.userParameters.error,
        at: Date.now(),
      }));
    }
    const receivedInitialUserParameters =
      !hadConfirmedUserParameters &&
      result.results.userParameters !== undefined &&
      this.viewModel.reads.userParameters.value !== null;
    if (receivedInitialUserParameters) {
      this.userSpeedDrafts.clear();
      this.userTimingDrafts.clear();
    }
    if (settingsRefresh && result.results.userParameters?.status === 'success') {
      this.userSpeedDrafts.clear();
      this.userTimingDrafts.clear();
    }
    if (settingsRefresh && result.results.advancedParameters?.status === 'success') {
      this.weightRangeDraft = null;
      this.expertScalarDrafts.clear();
    }
    if (fullLoad) {
      this.controlLocks.lockAll();
      this.widoorActiveSliderKey = null;
      this.widoorPrecisionSliderKey = null;
      this.userSpeedDrafts.clear();
      this.userTimingDrafts.clear();
      this.resetRoomNameDraft();
      this.weightRangeDraft = null;
      this.expertScalarDrafts.clear();
    }
  }

  private handleDisconnection(event: BleDisconnectionEvent): void {
    if (this.context === null || event.deviceId !== this.context.deviceId) {
      return;
    }
    const inactivitySessionId = this.connectedProductInactivitySessionId();
    const preserveInactivityExpiration = inactivitySessionId !== null &&
      (!this.connectedProductInactivity.isAppActive() ||
        this.connectedProductInactivity.isExpirationPending(
          inactivitySessionId,
        ));
    if (!preserveInactivityExpiration) {
      this.stopConnectedProductInactivity();
    }
    this.commandCycle += 1;
    const operation = this.openCommandState.operation;
    this.openCommandState = Object.freeze({
      ...initialProductMotorCommandState(
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
    for (const control of this.expertInputControls) {
      const mode = this.currentExpertInputMode(control.config);
      if (mode !== null) {
        this.requestedExpertInputModes.set(control.config.field, mode);
      }
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
    this.widoorActiveSliderKey = null;
    this.widoorPrecisionSliderKey = null;
    this.resetUserSpeedEditing();
    this.resetUserTimingEditing();
    this.resetRoomNameEditing();
    this.resetUserPeripheralEditing();
    this.resetWeightRangeEditing();
    this.resetExpertScalarEditing();
    this.resetExpertAccess();
    this.resetProductDateAction();
    this.sensitiveActionState = Object.freeze({
      status: 'idle',
      action: null,
      message: null,
    });
  }

  private resetRoomNameDraft(): void {
    this.roomNameDraft = this.pageContextCurrent
      ? createProductRoomNameDraft(this.currentRoomNameValue())
      : null;
  }

  private resetRoomNameEditing(): void {
    this.resetRoomNameDraft();
    this.roomNameWriteState = Object.freeze({
      status: 'idle',
      message: null,
    });
  }

  private resetSettledRoomNameWriteState(): void {
    if (this.roomNameWriteState.status !== 'executing') {
      this.roomNameWriteState = Object.freeze({
        status: 'idle',
        message: null,
      });
    }
  }

  private updateDemoUserParameters(
    patch: Partial<BleUserParameters>,
  ): void {
    if (!this.isDemoMode) {
      return;
    }
    this.updateUserParametersDisplay(patch);
  }

  private updateUserParametersDisplay(
    patch: Partial<BleUserParameters>,
  ): void {
    const current = this.viewModel.reads.userParameters.value;
    if (current === null) {
      return;
    }
    this.viewModel = {
      ...this.viewModel,
      reads: {
        ...this.viewModel.reads,
        userParameters: {
          status: 'available',
          readStatus: 'success',
          value: Object.freeze({ ...current, ...patch }),
          result: null,
        },
      },
    };
  }

  private updateDemoExpertParameters(
    patch: Partial<BleAdvancedParameters>,
  ): void {
    if (!this.isDemoMode) {
      return;
    }
    this.updateExpertParametersDisplay(patch);
  }

  private updateExpertParametersDisplay(
    patch: Partial<BleAdvancedParameters>,
  ): void {
    const current = this.viewModel.reads.advancedParameters.value;
    if (current === null) {
      return;
    }
    this.viewModel = {
      ...this.viewModel,
      reads: {
        ...this.viewModel.reads,
        advancedParameters: {
          status: 'available',
          readStatus: 'success',
          value: Object.freeze({
            ...current,
            ...patch,
          }) as BleAdvancedParameters,
          result: null,
        },
      },
    };
  }

  private updateDemoUserPeripheral(
    field: ProductUserPeripheralField,
    enabled: boolean,
  ): void {
    if (!this.isDemoMode) {
      return;
    }
    this.updateUserPeripheralDisplay(field, enabled);
  }

  private updateUserPeripheralDisplay(
    field: ProductUserPeripheralField,
    enabled: boolean,
  ): void {
    const current = this.viewModel.reads.userParameters.value;
    if (current === null) {
      return;
    }
    const key = field === 'static-light'
      ? 'staticLight'
      : field === 'dynamic-light'
        ? 'dynamicLight'
        : 'rgbIndicator';
    this.updateUserParametersDisplay({
      peripheralFlags: Object.freeze({
        ...current.peripheralFlags,
        [key]: enabled,
      }),
    });
  }

  private updateExpertInputDisplay(
    field: ProductExpertInputField,
    mode: LegacyInputMode,
  ): void {
    const current = this.viewModel.reads.advancedParameters.value;
    if (current === null) {
      return;
    }
    const mask = field === 'input-1' ? 0x80 : 0x40;
    this.updateDemoExpertParameters({
      peripheralByte1: mode === 'radar'
        ? current.peripheralByte1 | mask
        : current.peripheralByte1 & ~mask,
    });
  }

  private updateDemoWeightRange(range: ProductWeightRange): void {
    this.updateDemoExpertParameters({
      weightRangeLower: range.lower,
      weightRangeUpper: range.upper,
    });
    const speeds = this.moventivWeightAssociatedSpeeds(range);
    if (speeds !== null) {
      this.updateDemoUserParameters({
        openSpeed: speeds.openSpeed,
        closeSpeed: speeds.closeSpeed,
      });
    }
  }

  private updateDemoExpertScalar(
    field: ProductExpertScalarField,
    value: number,
  ): void {
    switch (field) {
      case 'break-force-at-open':
        this.updateDemoExpertParameters({ breakForceAtOpen: value });
        return;
      case 'near-open-speed':
        this.updateDemoExpertParameters({ nearOpenSpeed: value });
        return;
      case 'near-close-speed':
        this.updateDemoExpertParameters({ nearCloseSpeed: value });
        return;
      case 'near-open-torque':
        this.updateDemoExpertParameters({ nearOpenTorque: value });
        return;
      case 'near-close-torque':
        this.updateDemoExpertParameters({ nearCloseTorque: value });
        return;
      case 'braking-open-power':
        this.updateDemoExpertParameters({ brakingOpenPower: value });
        return;
      case 'obstacle-sensitivity':
        this.updateDemoExpertParameters({ obstacleSensitivity: value });
        return;
    }
  }

  private updateSensitiveToggleDisplay(
    action: ProductSensitiveAction,
    enabled: boolean,
  ): void {
    const current = this.viewModel.reads.advancedParameters.value;
    if (current === null) {
      return;
    }
    const mask = action === 'radar-test-1'
      ? 0x20
      : action === 'radar-test-2'
        ? 0x10
        : action === 'advanced-peripheral-lock'
          ? 0x08
          : 0;
    if (mask === 0) {
      return;
    }
    this.updateExpertParametersDisplay({
      peripheralByte1: enabled
        ? current.peripheralByte1 | mask
        : current.peripheralByte1 & ~mask,
    });
  }

  private updateDemoLockMode(mode: LegacyLockMode): void {
    if (!this.isDemoMode) {
      return;
    }
    this.updateLockModeDisplay(mode);
  }

  private updateLockModeDisplay(mode: LegacyLockMode): void {
    this.updateUserParametersDisplay({ lockMode: mode });
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

  private resetExpertScalarEditing(): void {
    this.expertScalarDrafts.clear();
    this.expertScalarWriteState = Object.freeze({
      status: 'idle',
      field: null,
      message: null,
    });
  }

  private resetExpertAccess(): void {
    const context = this.currentExpertAccessContext();
    if (context === null) {
      this.expertAccessService.reset();
    } else {
      this.expertAccessService.reset(context);
    }
    this.expertAccessState = Object.freeze({
      status: 'locked',
      message: null,
    });
    this.expertAccessCode = '';
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
    if (context.mode === 'demo') {
      throw new Error('Demo mode has no BLE date-action context.');
    }
    return {
      profile: context.profile,
      deviceId: context.deviceId,
      connectionGeneration: context.connectionGeneration,
      identificationConfidence: 'strong',
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
    this.traceCommissioning('final-state', {
      status: this.productDateActionState.status,
      action,
      message: this.productDateActionState.message,
      buttonState: this.productDateMaintenanceActionLabel,
    });
  }

  private traceCommissioning(event: string, details: object): void {
    console.info(`[COMMISSIONING] ${event} ${JSON.stringify(details)}`);
  }

  private async verifyFirstCommissioningDate(
    context: ProductPageNavigationState,
  ): Promise<'confirmed' | 'not-confirmed' | 'read-failed'> {
    this.traceCommissioning('readback-start', {
      profile: context.profile,
      deviceId: context.deviceId,
    });
    try {
      const result = await this.productDataLoadService.loadProductData(
        context.profile,
        context.deviceId,
        {
          version: false,
          datesAndCycles: true,
          maintenance: false,
          userParameters: false,
          advancedParameters: false,
        },
      );
      const dates = result.results.datesAndCycles;
      this.traceCommissioning('readback-result', {
        status: dates?.status ?? result.status,
        rawHex: dates?.decoded?.rawHex,
        firstCommissioningDate: dates?.decoded?.valid
          ? dates.decoded.value.firstCommissioningDate : null,
        lastMaintenanceDate: dates?.decoded?.valid
          ? dates.decoded.value.lastMaintenanceDate : null,
        error: dates?.error,
      });
      if (!this.isCurrentContext() || this.context !== context ||
          result.profile !== context.profile ||
          result.deviceId !== context.deviceId ||
          result.connectionGeneration !== context.connectionGeneration) {
        return 'read-failed';
      }
      this.applyLoadResult(result);
      if (result.status !== 'success' ||
          dates?.status !== 'success' || !dates.decoded?.valid) {
        return 'read-failed';
      }
      return dates.decoded.value.firstCommissioningDate.status === 'present'
        ? 'confirmed'
        : 'not-confirmed';
    } catch (error) {
      this.traceCommissioning('readback-result', {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
      return 'read-failed';
    }
  }

  private async refreshAfterProductDateAction(): Promise<void> {
    if (!this.canRefresh) {
      return;
    }
    try {
      await this.refreshProductData({}, false);
    } catch {
      this.markProductDateActionReloadFailed();
      return;
    }
    if (this.viewModel.loadStatus === 'failed') {
      this.markProductDateActionReloadFailed();
    }
  }

  private shouldRefreshAfterProductDateAction(
    action: ProductDateMaintenanceFlowKind,
  ): boolean {
    return action !== 'maintenance' ||
      this.config.behavior.refreshAfterMaintenanceAction;
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

  private isExpertScalarControl(
    config: ProductExpertScalarUiConfig,
  ): boolean {
    return config.profile === this.config.profile &&
      this.expertScalarControls.some((control) =>
        control.config === config,
      );
  }

  private canShowExpertField(field: ProductExpertField): boolean {
    return !productExpertFieldRequiresAccess(
      this.config,
      field,
    ) || this.expertAccessGranted;
  }

  private sensitiveActionRequiresExpertAccess(
    config: ProductSensitiveActionUiConfig,
  ): boolean {
    void config;
    return false;
  }

  private currentExpertAccessContext():
    ExpertAccessContext | null {
    if (this.context === null || !this.isCurrentContext()) {
      return null;
    }
    return this.expertAccessContext(this.context);
  }

  private expertAccessContext(
    context: ProductPageNavigationState,
  ): ExpertAccessContext {
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
    allowDuringLoad = false,
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
    if ((!allowDuringLoad &&
          (this.viewModel.loading || this.productDataLoadService.isLoading)) ||
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

  private roomNameFailureMessage(
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

  private expertScalarFailureMessage(
    status: 'disconnected' | 'stale' | 'unavailable',
  ): string {
    switch (status) {
      case 'disconnected':
        return this.text.openCommand.disconnected;
      case 'stale':
        return this.text.openCommand.stale;
      case 'unavailable':
        return this.text.expertScalarControls.unavailable;
    }
  }

  private setOpenCommandContextFailure(
    status: 'disconnected' | 'stale' | 'unavailable',
    startedAt: number,
    config: ProductMotorCommandUiConfig,
    nativeWriteCompleted = false,
  ): void {
    const commandText = this.text.widoorCommands[config.textKey];
    const message = status === 'disconnected'
      ? this.text.openCommand.disconnected
      : status === 'stale'
        ? this.text.openCommand.stale
        : this.text.openCommand.unavailable;
    this.openCommandState = Object.freeze({
      ...initialProductMotorCommandState(
        config.operation as ProductMotorCommandOperation,
        commandText.label,
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
    config: ProductMotorCommandUiConfig,
  ): void {
    const commandText = this.text.widoorCommands[config.textKey];
    let status: ProductMotorCommandStatus;
    let message: string;
    switch (result.status) {
      case 'success':
        if (config.confirmationPolicy?.kind === 'gatt-only') {
          status = 'confirmed';
          message = this.text.openCommand.sent;
        } else if (result.confirmationStatus === 'confirmed') {
          status = 'confirmed';
          message = commandText.confirmed;
        } else {
          status = 'timeout';
          message = commandText.notConfirmed;
        }
        break;
      case 'timeout':
        status = 'timeout';
        message = commandText.notConfirmed;
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
      label: commandText.label,
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
    this.openCommandState = initialProductMotorCommandState();
    this.commandHistoryEntries = [];
  }

  private addCommandHistory(state: ProductMotorCommandState): void {
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

  private createExpertRows(
    value: BleAdvancedParameters,
  ): readonly ProductDisplayRow[] {
    const rows: ProductDisplayRow[] = [];
    this.addExpertScalar(
      rows,
      'weight-range',
      this.text.expert.weightRange,
      `${value.weightRangeLower}–${value.weightRangeUpper} kg`,
    );
    if (value.profile === 'widoor') {
      this.addExpertScalar(rows, 'break-force-at-open',
        this.text.expert.breakForceAtOpen,
        String(value.breakForceAtOpen));
      this.addExpertScalar(rows, 'near-open-proportional',
        this.text.expert.nearOpenProportional,
        String(value.nearOpenProportional));
      this.addExpertScalar(rows, 'near-close-proportional',
        this.text.expert.nearCloseProportional,
        String(value.nearCloseProportional));
    } else {
      this.addExpertScalar(rows, 'exact-weight',
        this.text.expert.exactWeight, `${value.exactWeight} kg`);
      this.addExpertScalar(rows, 'braking-open-power',
        this.text.expert.brakingOpenPower,
        String(value.brakingOpenPower));
      this.addExpertScalar(rows, 'obstacle-sensitivity',
        this.text.expert.obstacleSensitivity,
        String(value.obstacleSensitivity));
    }
    this.addExpertScalar(rows, 'near-open-speed',
      this.text.expert.nearOpenSpeed, `${value.nearOpenSpeed} %`);
    this.addExpertScalar(rows, 'near-close-speed',
      this.text.expert.nearCloseSpeed, `${value.nearCloseSpeed} %`);
    this.addExpertScalar(rows, 'near-open-torque',
      this.text.expert.nearOpenTorque, String(value.nearOpenTorque));
    this.addExpertScalar(rows, 'near-close-torque',
      this.text.expert.nearCloseTorque, String(value.nearCloseTorque));
    this.addExpertScalar(rows, 'near-open-integral',
      this.text.expert.nearOpenIntegral,
      String(value.nearOpenIntegral));
    this.addExpertScalar(rows, 'near-close-integral',
      this.text.expert.nearCloseIntegral,
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

  private addExpertScalar(
    rows: ProductDisplayRow[],
    key: ProductExpertField,
    label: string,
    value: string,
  ): void {
    if (this.expertFieldVisible(key)) {
      rows.push(this.row(key, label, value));
    }
  }

  private userFieldVisible(field: ProductUserField): boolean {
    return this.config.userFields.includes(field);
  }

  private expertFieldVisible(
    field: ProductExpertField,
  ): boolean {
    return this.config.expertFields.includes(field) &&
      this.canShowExpertField(field);
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

  private motorSwitchRow(
    key: WidoorMotorStateKey,
    label: string,
    value: boolean,
  ): ProductDisplayRow {
    if (!this.usesMoventivLayout && this.config.profile !== 'widoor') {
      return this.booleanRow(key, label, value);
    }
    return this.row(
      key,
      label,
      this.usesMoventivLayout
        ? moventivMotorStateLabelFor(currentAppLanguage(), key, value)
        : widoorMotorStateLabelFor(currentAppLanguage(), key, value),
    );
  }

  isPositiveMotorRow(row: ProductDisplayRow): boolean {
    if (!this.usesMoventivLayout && this.config.profile !== 'widoor') {
      return row.value === this.text.yes;
    }
    const switches = this.viewModel.motorState?.switches;
    if (switches === null || switches === undefined) {
      return false;
    }
    switch (row.key as WidoorMotorStateKey) {
      case 'push-and-go':
        return switches.pushAndGo;
      case 'ble-switch':
        return switches.ble;
      case 'automatic-manual':
        return this.usesMoventivLayout
          ? switches.direction
          : switches.automaticManual;
      case 'direction':
        return switches.direction;
      case 'pairing':
        return switches.pairing;
    }
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
    advancedParameters: initialReadState(),
  };
}

function demoReadStates(snapshot: ProductDemoSnapshot): ProductReadViewStates {
  const available = <T>(value: T): ProductReadViewState<T> => ({
    status: 'available',
    readStatus: 'success',
    value,
    result: null,
  });
  return {
    version: available(snapshot.version),
    datesAndCycles: available(snapshot.datesAndCycles),
    maintenance: available(snapshot.maintenance),
    userParameters: available(snapshot.userParameters),
    advancedParameters: available(snapshot.advancedParameters),
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
  const mode = candidate.mode ?? 'connected';
  const definition = productProfileRegistry.resolve(candidate.profile);
  return (mode === 'connected' || mode === 'demo') &&
    definition !== undefined &&
    (mode !== 'demo' || isProductDemoProfile(definition)) &&
    typeof candidate.deviceId === 'string' &&
    candidate.deviceId.trim().length > 0 &&
    Number.isInteger(candidate.connectionGeneration) &&
    (candidate.connectionGeneration ?? -1) >= 0 &&
    typeof candidate.displayName === 'string' &&
    candidate.displayName.trim().length > 0 &&
    candidate.identificationConfidence ===
      (mode === 'demo' ? 'demo' : 'strong') &&
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
