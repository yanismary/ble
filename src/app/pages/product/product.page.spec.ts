import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { Observable, Subject } from 'rxjs';

import {
  BleDisconnectionEvent,
  BleGattCharacteristicProperties,
  BleNotificationEvent,
  BleService,
} from '../../core/services/ble';
import { BLE_UUIDS } from '../../core/services/ble-profile-catalog';
import {
  BleDatesAndCycles,
  BleDecodeFailure,
  BleDecodeSuccess,
  BleMaintenance,
  BleProfessionalParameters,
  BleUserParameters,
  BleVersionFrame,
} from '../../core/services/ble-read-decoders';
import {
  BleReadStatus,
  BleReadError,
  BleReadType,
  BleTypedReadResult,
} from '../../core/services/ble-read.service';
import {
  KnownProductProfile,
  ProductDataLoadResult,
  ProductDataLoadService,
  ProductDataLoadStatus,
} from '../../core/services/product-data-load.service';
import {
  MaintenanceAccessContext,
  MaintenanceAccessService,
} from '../../core/services/maintenance-access.service';
import {
  ProfessionalAccessContext,
  ProfessionalAccessService,
} from
  '../../core/services/professional-access.service';
import { ProductDetection } from '../../core/services/product-detection';
import {
  BleWriteExecutionService,
  LegacyBleWriteExecutionResult,
  LegacyBleWriteRequest,
} from '../../core/services/ble-write-execution.service';
import {
  ROOM_ASSIGNMENTS_STORAGE_KEY,
  readRoomCacheEntry,
} from '../../core/services/app-room-cache';
import {
  ProductPage,
  formatProductTimestamp,
  isProductPageNavigationState,
} from './product.page';
import {
  MOTOR_COMMAND_UI_CONFIGS,
  WIDOOR_COMMAND_UI_CONFIGS,
} from './product-open-command';
import { PRODUCT_PAGE_CONFIG } from './product-page.config';
import { productUserSpeedConfigsFor } from './product-user-speed';
import { productUserTimingConfigsFor } from './product-user-timing';
import { productUserPeripheralConfigsFor } from './product-user-peripheral';
import { productProfessionalScalarConfigsFor } from
  './product-professional-scalar';
import {
  ProductPageNavigationState,
  ProductReadViewState,
} from './product-view.model';

class FakeBleService {
  private readonly disconnectionSubject =
    new Subject<BleDisconnectionEvent>();
  private readonly notificationSubject = new Subject<BleNotificationEvent>();
  connectedDeviceId: string | null = 'device-1';
  connectionGeneration = 4;
  disconnectingDeviceId: string | null = null;
  isWriting = false;
  readonly writeCharacteristic = jasmine.createSpy('writeCharacteristic');
  readonly getGattCharacteristicProperties = jasmine.createSpy(
    'getGattCharacteristicProperties',
  ).and.returnValue(writableGattProperties());

  readonly disconnections$: Observable<BleDisconnectionEvent> =
    this.disconnectionSubject.asObservable();
  readonly notifications$: Observable<BleNotificationEvent> =
    this.notificationSubject.asObservable();

  async disconnect(): Promise<void> {
    const deviceId = this.connectedDeviceId;
    this.connectedDeviceId = null;
    this.connectionGeneration += 1;
    if (deviceId !== null) {
      this.disconnectionSubject.next({ deviceId, reason: 'remote' });
    }
  }

  emitMotorState(bytes: readonly number[]): void {
    const array = Uint8Array.from(bytes);
    this.notificationSubject.next({
      deviceId: 'device-1',
      serviceUuid: BLE_UUIDS.shdoService,
      characteristicUuid: BLE_UUIDS.motorStateCharacteristic,
      value: new DataView(array.buffer),
      sequence: 1,
      receivedAt: 20,
    });
  }
}

class FakeBleWriteExecutionService {
  isExecuting = false;
  nextResult = openExecutionResult('success', 'confirmed');
  nextResults: LegacyBleWriteExecutionResult[] = [];
  readonly execute = jasmine.createSpy('execute')
    .and.callFake(async (_request: LegacyBleWriteRequest) =>
      this.nextResults.shift() ?? this.nextResult,
    );
}

class FakeProductDataLoadService {
  isLoading = false;
  nextResult = completeLoadResult('success');
  readonly loadProductData = jasmine.createSpy('loadProductData')
    .and.callFake(async () => this.nextResult);
  readonly cancelCurrentLoad = jasmine.createSpy('cancelCurrentLoad')
    .and.returnValue(true);
}

const PRODUCT_PAGE_PROFESSIONAL_ACCESS_TEST_CODE =
  'accepted-professional-access-code';

class FakeProfessionalAccessService {
  private authenticatedContext: ProfessionalAccessContext | null = null;

  isAuthenticated(context: ProfessionalAccessContext | null): boolean {
    return context !== null &&
      this.authenticatedContext !== null &&
      this.sameContext(this.authenticatedContext, context);
  }

  authenticate(
    context: ProfessionalAccessContext,
    accessCode: string,
  ): boolean {
    if (accessCode !== PRODUCT_PAGE_PROFESSIONAL_ACCESS_TEST_CODE) {
      return false;
    }
    this.authenticatedContext = Object.freeze({ ...context });
    return true;
  }

  reset(context?: ProfessionalAccessContext): void {
    if (context === undefined ||
        (this.authenticatedContext !== null &&
          this.sameContext(this.authenticatedContext, context))) {
      this.authenticatedContext = null;
    }
  }

  private sameContext(
    first: ProfessionalAccessContext,
    second: ProfessionalAccessContext,
  ): boolean {
    return first.profile === second.profile &&
      first.deviceId === second.deviceId &&
      first.connectionGeneration === second.connectionGeneration;
  }
}

const PRODUCT_PAGE_MAINTENANCE_ACCESS_TEST_CODE =
  'accepted-maintenance-access-code';

class FakeMaintenanceAccessService {
  private authenticatedContext: MaintenanceAccessContext | null = null;
  readonly authenticate = jasmine.createSpy('authenticate')
    .and.callFake((
      context: MaintenanceAccessContext,
      accessCode: string,
    ): boolean => {
      if (accessCode !== PRODUCT_PAGE_MAINTENANCE_ACCESS_TEST_CODE) {
        return false;
      }
      this.authenticatedContext = Object.freeze({ ...context });
      return true;
    });
  readonly reset = jasmine.createSpy('reset')
    .and.callFake((context?: MaintenanceAccessContext): void => {
      if (context === undefined ||
          (this.authenticatedContext !== null &&
            this.sameContext(this.authenticatedContext, context))) {
        this.authenticatedContext = null;
      }
    });

  isAuthenticated(context: MaintenanceAccessContext | null): boolean {
    return context !== null &&
      this.authenticatedContext !== null &&
      this.sameContext(this.authenticatedContext, context);
  }

  private sameContext(
    first: MaintenanceAccessContext,
    second: MaintenanceAccessContext,
  ): boolean {
    return first.profile === second.profile &&
      first.deviceId === second.deviceId &&
      first.connectionGeneration === second.connectionGeneration;
  }
}

describe('ProductPage', () => {
  let component: ProductPage;
  let fixture: ComponentFixture<ProductPage>;
  let bleService: FakeBleService;
  let loadService: FakeProductDataLoadService;
  let writeExecutionService: FakeBleWriteExecutionService;
  let alertRole: string | undefined;
  let alertCreate: jasmine.Spy;
  let alertOptions: Record<string, unknown>[];
  let routerNavigate: jasmine.Spy;
  let routerNavigationState: ProductPageNavigationState;

  beforeEach(async () => {
    localStorage.removeItem(ROOM_ASSIGNMENTS_STORAGE_KEY);
    bleService = new FakeBleService();
    loadService = new FakeProductDataLoadService();
    writeExecutionService = new FakeBleWriteExecutionService();
    alertRole = 'cancel';
    alertOptions = [];
    alertCreate = jasmine.createSpy('create').and.callFake(
      async (options: Record<string, unknown>) => {
        alertOptions.push(options);
        return {
          present: async () => undefined,
          onDidDismiss: async () => ({ role: alertRole }),
        };
      },
    );
    routerNavigate = jasmine.createSpy('navigate').and.resolveTo(true);
    routerNavigationState = navigationState('widoor');

    await TestBed.configureTestingModule({
      imports: [ProductPage],
      providers: [
        { provide: BleService, useValue: bleService },
        { provide: AlertController, useValue: { create: alertCreate } },
        {
          provide: BleWriteExecutionService,
          useValue: writeExecutionService,
        },
        { provide: ProductDataLoadService, useValue: loadService },
        { provide: ProductDetection, useClass: ProductDetection },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { profile: 'widoor' } } },
        },
        {
          provide: Router,
          useValue: {
            getCurrentNavigation: () => ({
              extras: { state: routerNavigationState },
            }),
            navigate: routerNavigate,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not load automatically and should keep explicit refresh internal',
    async () => {
      expect(loadService.loadProductData).not.toHaveBeenCalled();

      await component.refreshProductData();
      fixture.detectChanges();

      expect(loadService.loadProductData)
        .toHaveBeenCalledOnceWith('widoor', 'device-1', {});
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('ion-range.user-speed-range'))
        .not.toBeNull();
      expect(element.querySelector('ion-toggle.lock-mode-toggle'))
        .toBeNull();
    },
  );

  it('should show the Phase 1 product shell with commands selected by default',
    () => {
      const element = fixture.nativeElement as HTMLElement;
      const commandsSection = element.querySelector<HTMLElement>(
        '[aria-labelledby="commands-title"]',
      );
      const settingsSection = element.querySelector<HTMLElement>(
        '[aria-labelledby="settings-title"]',
      );
      const informationSection = element.querySelector<HTMLElement>(
        '[aria-labelledby="information-title"]',
      );

      expect(component.activeMainTab).toBe('commands');
      expect(component.activeSettingsTab).toBe('basic');
      expect(element.textContent).toContain(component.text.shell.controlledDoor);
      expect(commandsSection?.hidden).toBeFalse();
      expect(settingsSection?.hidden).toBeTrue();
      expect(informationSection?.hidden).toBeTrue();
    },
  );

  it('should hide V2.1-only global shell technical controls', async () => {
    await component.refreshProductData();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const textContent = element.textContent ?? '';
    const actionLabels = Array.from(
      element.querySelectorAll<HTMLIonButtonElement>(
        '.product-actions ion-button',
      ),
    ).map((button) => button.textContent?.trim() ?? '');

    expect(element.querySelector('.product-summary')).toBeNull();
    expect(element.querySelector('.product-identity-details')).toBeNull();
    expect(element.querySelector('.product-actions')).not.toBeNull();
    expect(actionLabels).toEqual([component.text.backToScan]);
    expect(textContent).not.toContain(component.text.refresh);
    expect(textContent).not.toContain('Verrouiller tous les réglages');
    expect(textContent).not.toContain(component.text.sections.identity);
    expect(textContent).not.toContain(component.text.profile);
    expect(textContent).not.toContain(component.text.deviceId);
    expect(textContent).not.toContain(component.text.connection);
    expect(textContent).not.toContain(component.text.lastRefresh);
    expect(textContent).not.toContain(routerNavigationState.deviceId);
  });

  it('should navigate the product shell without BLE writes', () => {
    component.setActiveMainTab('settings');
    fixture.detectChanges();

    let element = fixture.nativeElement as HTMLElement;
    expect(component.activeMainTab).toBe('settings');
    expect(component.activeSettingsTab).toBe('basic');
    expect(element.querySelector<HTMLElement>(
      '[aria-labelledby="commands-title"]',
    )?.hidden).toBeTrue();
    expect(element.querySelector<HTMLElement>(
      '[aria-labelledby="settings-title"]',
    )?.hidden).toBeFalse();

    component.setActiveSettingsTab('advanced');
    fixture.detectChanges();
    expect(component.activeSettingsTab).toBe('advanced');

    component.setActiveMainTab('information');
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector<HTMLElement>(
      '[aria-labelledby="information-title"]',
    )?.hidden).toBeFalse();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
    expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
  });

  it('should refresh on tab clicks even when the tab is already active',
    async () => {
      component.setActiveMainTab('commands');
      await waitForCondition(() =>
        loadService.loadProductData.calls.count() === 1 &&
        !component.viewModel.loading,
      );

      component.setActiveMainTab('commands');
      await waitForCondition(() =>
        loadService.loadProductData.calls.count() === 2 &&
        !component.viewModel.loading,
      );

      component.setActiveMainTab('settings');
      await waitForCondition(() =>
        loadService.loadProductData.calls.count() === 3 &&
        !component.viewModel.loading,
      );

      component.setActiveMainTab('settings');
      await waitForCondition(() =>
        loadService.loadProductData.calls.count() === 4 &&
        !component.viewModel.loading,
      );

      component.setActiveSettingsTab('basic');
      await waitForCondition(() =>
        loadService.loadProductData.calls.count() === 5 &&
        !component.viewModel.loading,
      );

      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should expose name and room editing from the navigation display name',
    () => {
      const element = fixture.nativeElement as HTMLElement;

      expect(component.showNameRoomControls).toBeTrue();
      expect(component.currentNameRoomValue()).toEqual({
        name: 'Porte',
        roomSuffix: '#CHA',
      });
      expect(component.nameRoomDraftValue()).toEqual({
        name: 'Porte',
        roomSuffix: '#CHA',
      });
      expect(element.querySelector('ion-input.name-room-name-input'))
        .not.toBeNull();
      expect(element.querySelector('ion-select.name-room-select'))
        .not.toBeNull();
      expect(component.canApplyNameRoom()).toBeFalse();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should write a product name change through the executor', async () => {
    writeExecutionService.nextResult = nameRoomExecutionResult(
      'widoor',
      '43 6f 75 6c 6f 69 72 23 43 48 41',
    );

    component.setNameRoomDraftName('Couloir');
    await component.requestNameRoomChange();

    expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
    const request = writeExecutionService.execute.calls.mostRecent()
      .args[0] as LegacyBleWriteRequest;
    expect(request.profile).toBe('widoor');
    expect(request.write.operation).toBe('name-room');
    expect(request.write.serviceUuid).toBe(BLE_UUIDS.shdoService);
    expect(request.write.characteristicUuid)
      .toBe(BLE_UUIDS.nameCharacteristic);
    expect(request.write.payloadHex)
      .toBe('43 6f 75 6c 6f 69 72 23 43 48 41');
    expect(Array.from(request.write.payload)).toEqual(
      Array.from('Couloir#CHA', (character) => character.charCodeAt(0)),
    );
    expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
    expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
    expect(request.authorization).toBeNull();
    expect(component.viewModel.displayedName).toBe('Couloir');
    expect(component.viewModel.roomSuffix).toBe('#CHA');
    expect(component.nameRoomWriteState.status).toBe('sent');
    expect(loadService.loadProductData).not.toHaveBeenCalled();
  });

  it('should write a room-only change while keeping the current name',
    async () => {
      writeExecutionService.nextResult = nameRoomExecutionResult(
        'widoor',
        '50 6f 72 74 65 23 53 44 42',
      );

      component.setNameRoomDraftRoom('#SDB');
      await component.requestNameRoomChange();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.write.payloadHex).toBe(
        '50 6f 72 74 65 23 53 44 42',
      );
      expect(Array.from(request.write.payload)).toEqual(
        Array.from('Porte#SDB', (character) => character.charCodeAt(0)),
      );
      expect(component.viewModel.displayedName).toBe('Porte');
      expect(component.viewModel.roomSuffix).toBe('#SDB');
      expect(component.nameRoomDraftValue()).toEqual({
        name: 'Porte',
        roomSuffix: '#SDB',
      });
    },
  );

  it('should write room removal without changing the current name',
    async () => {
      writeExecutionService.nextResult = nameRoomExecutionResult(
        'widoor',
        '50 6f 72 74 65',
      );

      component.setNameRoomDraftRoom(null);
      await component.requestNameRoomChange();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.write.payloadHex).toBe('50 6f 72 74 65');
      expect(Array.from(request.write.payload)).toEqual(
        Array.from('Porte', (character) => character.charCodeAt(0)),
      );
      expect(component.viewModel.displayedName).toBe('Porte');
      expect(component.viewModel.roomSuffix).toBeNull();
    },
  );

  it('should write product name and room changes together', async () => {
    writeExecutionService.nextResult = nameRoomExecutionResult(
      'widoor',
      '47 61 72 61 67 65 23 47 41 52',
    );

    component.setNameRoomDraftName('Garage');
    component.setNameRoomDraftRoom('#GAR');
    await component.requestNameRoomChange();

    expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
    const request = writeExecutionService.execute.calls.mostRecent()
      .args[0] as LegacyBleWriteRequest;
    expect(request.write.payloadHex)
      .toBe('47 61 72 61 67 65 23 47 41 52');
    expect(Array.from(request.write.payload)).toEqual(
      Array.from('Garage#GAR', (character) => character.charCodeAt(0)),
    );
    expect(component.viewModel.displayedName).toBe('Garage');
    expect(component.viewModel.roomSuffix).toBe('#GAR');
    expect(readRoomCacheEntry(' DEVICE-1 ')).toEqual(
      jasmine.objectContaining({
        name: 'Garage',
        suffix: '#GAR',
      }),
    );
  });

  it('should update the Phase 1 room cache after successful name-room writes for each migrated profile',
    async () => {
      for (const profile of [
        'widoor',
        'moventiv-60',
        'moventiv-80',
        'garline',
      ] as const) {
        localStorage.removeItem(ROOM_ASSIGNMENTS_STORAGE_KEY);
        const harness = await createNameRoomProfileHarness(profile);
        harness.writeExecutionService.nextResult = nameRoomExecutionResult(
          profile,
          '47 61 72 61 67 65 23 47 41 52',
        );

        harness.component.setNameRoomDraftName('Garage');
        harness.component.setNameRoomDraftRoom('#GAR');
        await harness.component.requestNameRoomChange();

        expect(readRoomCacheEntry(' device-1 ')).withContext(profile).toEqual(
          jasmine.objectContaining({
            name: 'Garage',
            suffix: '#GAR',
          }),
        );
        harness.fixture.destroy();
      }
    },
  );

  it('should reject invalid name and room drafts before any write', async () => {
    component.setNameRoomDraftName('Abc');

    expect(component.canApplyNameRoom()).toBeFalse();
    expect(component.nameRoomValidationMessage()).toBe(
      component.text.nameRoomControls.errors.tooShort,
    );
    await component.requestNameRoomChange();

    expect(writeExecutionService.execute).not.toHaveBeenCalled();
    component.setNameRoomDraftName('Porte_1');
    expect(component.canApplyNameRoom()).toBeFalse();
    expect(component.nameRoomValidationMessage()).toBe(
      component.text.nameRoomControls.errors.invalidCharacters,
    );
  });

  it('should keep current name and room when a name write fails', async () => {
    localStorage.setItem(ROOM_ASSIGNMENTS_STORAGE_KEY, JSON.stringify({
      'DEVICE-1': { name: 'Ancien', suffix: '#SAL', updatedAt: 42 },
    }));
    writeExecutionService.nextResult = {
      ...nameRoomExecutionResult(
        'widoor',
        '43 6f 75 6c 6f 69 72 23 43 48 41',
      ),
      status: 'failed',
      nativeWriteCompleted: false,
      error: {
        code: 'native-write-failed',
        message: 'Native failure',
      },
    };

    component.setNameRoomDraftName('Couloir');
    await component.requestNameRoomChange();

    expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
    expect(component.viewModel.displayedName).toBe('Porte');
    expect(component.viewModel.roomSuffix).toBe('#CHA');
    expect(component.nameRoomDraftValue()).toEqual({
      name: 'Couloir',
      roomSuffix: '#CHA',
    });
    expect(component.nameRoomWriteState.status).toBe('failed');
    expect(readRoomCacheEntry('device-1')).toEqual({
      name: 'Ancien',
      suffix: '#SAL',
      updatedAt: 42,
    });
  });

  it('should reset name and room drafts on reload and disconnection',
    async () => {
      component.setNameRoomDraftName('Couloir');
      component.setNameRoomDraftRoom('#SDB');
      expect(component.canApplyNameRoom()).toBeTrue();

      await component.refreshProductData();

      expect(component.nameRoomDraftValue()).toEqual({
        name: 'Porte',
        roomSuffix: '#CHA',
      });
      component.setNameRoomDraftName('Couloir');

      bleService.disconnect();

      expect(component.showNameRoomControls).toBeFalse();
      expect(component.canApplyNameRoom()).toBeFalse();
      expect(component.nameRoomWriteState.status).toBe('idle');
    },
  );

  it('should expose Widoor commands without executing automatically',
    () => {
      const element = fixture.nativeElement as HTMLElement;
      const openButton = element.querySelector<HTMLIonButtonElement>(
        'ion-button.widoor-open-command',
      );

      expect(openButton).not.toBeNull();
      expect(openButton?.disabled).toBeFalse();
      expect(element.textContent).toContain(
        component.text.widoorCommands.open.label,
      );
      expect(element.querySelector('ion-button.widoor-close-command'))
        .not.toBeNull();
      expect(element.textContent).toContain('Apprentissage');
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(alertCreate).not.toHaveBeenCalled();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should not expose Commandes lock controls from the decoded Widoor lock mode',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithLockMode('locked-open'),
      );

      await component.refreshProductData();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(component.lockModeControls).toEqual([]);
      expect(component.showLockModeControls).toBeFalse();
      expect(element.textContent).not.toContain(
        component.text.lockModeControls.lockedOpen.label,
      );
      expect(element.textContent).not.toContain(
        component.text.lockModeControls.lockedClosed.label,
      );
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should expose speed controls initialized from decoded user parameters',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithSpeeds(42, 57),
      );

      await component.refreshProductData();
      fixture.detectChanges();

      expect(component.showUserSpeedControls).toBeTrue();
      expect(component.userSpeedControls.map((control) =>
        control.config.field,
      )).toEqual(['open-speed', 'close-speed']);
      expect(component.currentUserSpeedValue(
        component.userSpeedControls[0].config,
      )).toBe(42);
      expect(component.userSpeedDraftValue(
        component.userSpeedControls[1].config,
      )).toBe(57);
      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain(component.text.user.openSpeed);
      expect(element.textContent).toContain(component.text.user.closeSpeed);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should write Widoor speed changes through the executor', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithSpeeds(25, 35),
    );
    await component.refreshProductData();
    const openControl = component.userSpeedControls[0].config;
    const closeControl = component.userSpeedControls[1].config;

    const transitions = [
      {
        config: openControl,
        changedValue: 26,
        operation: 'open-speed',
        payloadHex: '01 1a',
        payload: [0x01, 0x1a],
      },
      {
        config: closeControl,
        changedValue: 100,
        operation: 'close-speed',
        payloadHex: '02 64',
        payload: [0x02, 0x64],
      },
      {
        config: openControl,
        changedValue: 60,
        operation: 'open-speed',
        payloadHex: '01 3c',
        payload: [0x01, 0x3c],
      },
    ] as const;

    for (const transition of transitions) {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithSpeeds(25, 35),
      );
      writeExecutionService.nextResult = userSpeedExecutionResult(
        'widoor',
        transition.operation,
        transition.payloadHex,
      );
      writeExecutionService.execute.calls.reset();

      component.setUserSpeedDraftValue(
        transition.config,
        transition.changedValue,
      );
      await component.requestUserSpeedChange(transition.config);

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.profile).toBe('widoor');
      expect(request.write.operation).toBe(transition.operation);
      expect(request.write.serviceUuid).toBe(BLE_UUIDS.widoorService);
      expect(request.write.characteristicUuid)
        .toBe(BLE_UUIDS.userParametersCharacteristic);
      expect(request.write.payloadHex).toBe(transition.payloadHex);
      expect(Array.from(request.write.payload)).toEqual(transition.payload);
      expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
      expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
      expect(request.authorization).toBeNull();
      expect(component.userSpeedWriteState.status).toBe('sent');
    }
  });

  it('should keep speed drafts local until apply and reset them on reload',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithSpeeds(25, 35),
      );
      await component.refreshProductData();
      const openControl = component.userSpeedControls[0].config;

      component.setUserSpeedDraftValue(openControl, 42);

      expect(component.currentUserSpeedValue(openControl)).toBe(25);
      expect(component.userSpeedDraftValue(openControl)).toBe(42);
      expect(component.canApplyUserSpeed(openControl)).toBeTrue();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();

      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithSpeeds(55, 35),
      );
      await component.refreshProductData();

      expect(component.currentUserSpeedValue(openControl)).toBe(55);
      expect(component.userSpeedDraftValue(openControl)).toBe(55);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should clear speed drafts when the product disconnects', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithSpeeds(25, 35),
    );
    await component.refreshProductData();
    const openControl = component.userSpeedControls[0].config;

    component.setUserSpeedDraftValue(openControl, 42);
    bleService.disconnect();

    expect(component.currentUserSpeedValue(openControl)).toBeNull();
    expect(component.userSpeedDraftValue(openControl))
      .toBe(openControl.range.min);
    expect(component.canApplyUserSpeed(openControl)).toBeFalse();
    expect(component.userSpeedWriteState.status).toBe('idle');
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should reject speed controls from another profile', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithSpeeds(25, 35),
    );
    await component.refreshProductData();
    const widoorOpenControl = component.userSpeedControls[0].config;
    const moventivOpenControl = productUserSpeedConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    )[0];

    component.setUserSpeedDraftValue(moventivOpenControl, 50);
    await component.requestUserSpeedChange(moventivOpenControl);

    expect(component.userSpeedDraftValue(widoorOpenControl)).toBe(25);
    expect(component.canApplyUserSpeed(moventivOpenControl)).toBeFalse();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should reject invalid speed values without writing', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithSpeeds(25, 35),
    );
    await component.refreshProductData();
    const openControl = component.userSpeedControls[0].config;

    component.setUserSpeedDraftValue(openControl, 24);
    await component.requestUserSpeedChange(openControl);

    expect(component.userSpeedDraftValue(openControl)).toBe(25);
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should keep decoded speed as applied state when a write fails',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithSpeeds(25, 35),
      );
      writeExecutionService.nextResult = {
        ...userSpeedExecutionResult('widoor', 'open-speed', '01 1a'),
        status: 'failed',
        nativeWriteCompleted: false,
        error: { code: 'native-write-failed', message: 'Native failure' },
      };
      await component.refreshProductData();
      const openControl = component.userSpeedControls[0].config;

      component.setUserSpeedDraftValue(openControl, 26);
      await component.requestUserSpeedChange(openControl);

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.currentUserSpeedValue(openControl)).toBe(25);
      expect(component.userSpeedDraftValue(openControl)).toBe(26);
      expect(component.userSpeedWriteState.status).toBe('failed');
      expect(component.userSpeedWriteState.message)
        .toBe(component.text.userSpeedControls.failed);
    },
  );

  it('should expose timing controls initialized from decoded user parameters',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithTimings(3, 12),
      );

      await component.refreshProductData();
      fixture.detectChanges();

      expect(component.showUserTimingControls).toBeTrue();
      expect(component.userTimingControls.map((control) =>
        control.config.field,
      )).toEqual(['short-timing']);
      const shortControl = component.userTimingControls[0].config;
      expect(component.currentUserTimingValue(shortControl)).toBe(3);
      expect(component.userTimingDraftValue(shortControl)).toBe(3);
      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain(component.text.user.shortTiming);
      expect(element.textContent).not.toContain(component.text.user.longTiming);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should write Widoor short timing through the executor', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithTimings(1, 12),
    );
    await component.refreshProductData();
    const shortControl = component.userTimingControls[0].config;
    const transitions = [
      {
        value: 0,
        payloadHex: '03 00',
        payload: [0x03, 0x00],
      },
      {
        value: 60,
        payloadHex: '03 3c',
        payload: [0x03, 0x3c],
      },
      {
        value: 12,
        payloadHex: '03 0c',
        payload: [0x03, 0x0c],
      },
    ] as const;

    for (const transition of transitions) {
      writeExecutionService.nextResult = userTimingExecutionResult(
        'widoor',
        'short-timing',
        transition.payloadHex,
      );
      writeExecutionService.execute.calls.reset();

      component.setUserTimingDraftValue(shortControl, transition.value);
      await component.requestUserTimingChange(shortControl);

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.profile).toBe('widoor');
      expect(request.write.operation).toBe('short-timing');
      expect(request.write.serviceUuid).toBe(BLE_UUIDS.widoorService);
      expect(request.write.characteristicUuid)
        .toBe(BLE_UUIDS.userParametersCharacteristic);
      expect(request.write.payloadHex).toBe(transition.payloadHex);
      expect(Array.from(request.write.payload)).toEqual(transition.payload);
      expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
      expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
      expect(request.authorization).toBeNull();
      expect(component.userTimingWriteState.status).toBe('sent');
    }
  });

  it('should keep timing drafts local until apply and reset them on reload',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithTimings(3, 12),
      );
      await component.refreshProductData();
      const shortControl = component.userTimingControls[0].config;

      component.setUserTimingDraftValue(shortControl, 30);

      expect(component.currentUserTimingValue(shortControl)).toBe(3);
      expect(component.userTimingDraftValue(shortControl)).toBe(30);
      expect(component.canApplyUserTiming(shortControl)).toBeTrue();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();

      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithTimings(45, 12),
      );
      await component.refreshProductData();

      expect(component.currentUserTimingValue(shortControl)).toBe(45);
      expect(component.userTimingDraftValue(shortControl)).toBe(45);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should reject invalid timing values without writing', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithTimings(3, 12),
    );
    await component.refreshProductData();
    const shortControl = component.userTimingControls[0].config;

    component.setUserTimingDraftValue(shortControl, 61);
    await component.requestUserTimingChange(shortControl);

    expect(component.userTimingDraftValue(shortControl)).toBe(3);
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should keep decoded timing as applied state when a write fails',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithTimings(3, 12),
      );
      writeExecutionService.nextResult = {
        ...userTimingExecutionResult('widoor', 'short-timing', '03 0c'),
        status: 'failed',
        nativeWriteCompleted: false,
        error: { code: 'native-write-failed', message: 'Native failure' },
      };
      await component.refreshProductData();
      const shortControl = component.userTimingControls[0].config;

      component.setUserTimingDraftValue(shortControl, 12);
      await component.requestUserTimingChange(shortControl);

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.currentUserTimingValue(shortControl)).toBe(3);
      expect(component.userTimingDraftValue(shortControl)).toBe(12);
      expect(component.userTimingWriteState.status).toBe('failed');
      expect(component.userTimingWriteState.message)
        .toBe(component.text.userTimingControls.failed);
    },
  );

  it('should clear timing drafts when the product disconnects', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithTimings(3, 12),
    );
    await component.refreshProductData();
    const shortControl = component.userTimingControls[0].config;

    component.setUserTimingDraftValue(shortControl, 30);
    bleService.disconnect();

    expect(component.currentUserTimingValue(shortControl)).toBeNull();
    expect(component.userTimingDraftValue(shortControl))
      .toBe(shortControl.range.min);
    expect(component.canApplyUserTiming(shortControl)).toBeFalse();
    expect(component.userTimingWriteState.status).toBe('idle');
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should reject timing controls from another profile', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithTimings(3, 12),
    );
    await component.refreshProductData();
    const widoorShortControl = component.userTimingControls[0].config;
    const garlineLongControl = productUserTimingConfigsFor(
      PRODUCT_PAGE_CONFIG.garline,
    )[1];

    component.setUserTimingDraftValue(garlineLongControl, 10);
    await component.requestUserTimingChange(garlineLongControl);

    expect(component.userTimingDraftValue(widoorShortControl)).toBe(3);
    expect(component.canApplyUserTiming(garlineLongControl)).toBeFalse();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should expose only the Widoor RGB user lighting toggle from BLE state',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithPeripherals({
          staticLight: true,
          dynamicLight: true,
          rgbIndicator: true,
        }),
      );

      await component.refreshProductData();
      fixture.detectChanges();

      expect(component.showUserPeripheralControls).toBeTrue();
      expect(component.userPeripheralControls.map((control) =>
        control.config.field,
      )).toEqual(['rgb']);
      expect(component.currentUserPeripheralState(
        component.userPeripheralControls[0].config,
      )).toBeTrue();
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelectorAll('ion-toggle.user-peripheral-toggle')
        .length).toBe(1);
      expect(element.textContent).toContain(component.text.user.rgb);
      expect(element.textContent).not.toContain(
        component.text.user.staticLight,
      );
      expect(element.textContent).not.toContain(
        component.text.user.dynamicLight,
      );
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should write Widoor RGB changes through the executor', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithPeripherals({ rgbIndicator: false }),
    );
    writeExecutionService.nextResult = userPeripheralExecutionResult(
      'widoor',
      'rgb-indicator',
      '05 03 01',
    );

    await component.refreshProductData();
    const rgbControl = component.userPeripheralControls[0].config;
    await component.requestUserPeripheralChange(rgbControl, true);

    expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
    const request = writeExecutionService.execute.calls.mostRecent()
      .args[0] as LegacyBleWriteRequest;
    expect(request.profile).toBe('widoor');
    expect(request.write.operation).toBe('rgb-indicator');
    expect(request.write.serviceUuid).toBe(BLE_UUIDS.widoorService);
    expect(request.write.characteristicUuid)
      .toBe(BLE_UUIDS.userParametersCharacteristic);
    expect(request.write.payloadHex).toBe('05 03 01');
    expect(Array.from(request.write.payload)).toEqual([0x05, 0x03, 0x01]);
    expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
    expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
    expect(request.authorization).toBeNull();
    expect(component.userPeripheralWriteState.status).toBe('sent');
    expect(loadService.loadProductData).toHaveBeenCalledTimes(1);
  });

  it('should keep decoded user lighting state when a write fails',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithPeripherals({ rgbIndicator: false }),
      );
      writeExecutionService.nextResult = {
        ...userPeripheralExecutionResult(
          'widoor',
          'rgb-indicator',
          '05 03 01',
        ),
        status: 'failed',
        nativeWriteCompleted: false,
        error: {
          code: 'native-write-failed',
          message: 'Native failure',
        },
      };

      await component.refreshProductData();
      const rgbControl = component.userPeripheralControls[0].config;
      await component.requestUserPeripheralChange(rgbControl, true);

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.currentUserPeripheralState(rgbControl)).toBeFalse();
      expect(component.userPeripheralWriteState.status).toBe('failed');
      expect(component.userPeripheralWriteState.message)
        .toBe(component.text.userPeripheralControls.failed);
    },
  );

  it('should reject user lighting controls from another profile', async () => {
    loadService.nextResult = completeLoadResult(
      'success',
      'widoor',
      userValueWithPeripherals({ rgbIndicator: false }),
    );
    await component.refreshProductData();
    const moventivStaticControl = productUserPeripheralConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    )[0];

    await component.requestUserPeripheralChange(moventivStaticControl, true);

    expect(component.canToggleUserPeripheral(moventivStaticControl))
      .toBeFalse();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should block a second user lighting write while one is pending',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = completeLoadResult(
        'success',
        'moventiv-60',
        userValueWithPeripherals({
          staticLight: false,
          dynamicLight: true,
          rgbIndicator: false,
        }),
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      let resolveWrite!: (value: LegacyBleWriteExecutionResult) => void;
      writeExecutionService.execute.and.returnValue(new Promise((resolve) => {
        resolveWrite = resolve;
      }));

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create').and.resolveTo({
                present: async () => undefined,
                onDidDismiss: async () => ({ role: 'confirm' }),
              }),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { data: { profile: 'moventiv-60' } },
            },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('moventiv-60') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();
      const dynamicControl = component.userPeripheralControls.find(
        (candidate) => candidate.config.field === 'dynamic-light',
      )!.config;
      const rgbControl = component.userPeripheralControls.find(
        (candidate) => candidate.config.field === 'rgb',
      )!.config;

      const firstWrite = component.requestUserPeripheralChange(
        dynamicControl,
        false,
      );

      expect(component.userPeripheralWriteState.status).toBe('executing');
      expect(component.canToggleUserPeripheral(rgbControl)).toBeFalse();
      await component.requestUserPeripheralChange(rgbControl, true);
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);

      resolveWrite(userPeripheralExecutionResult(
        'moventiv-60',
        'dynamic-light',
        '05 07 02',
      ));
      await firstWrite;

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.userPeripheralWriteState.status).toBe('sent');
    },
  );

  it('should reset user lighting write state when the product disconnects',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithPeripherals({ rgbIndicator: false }),
      );
      writeExecutionService.nextResult = {
        ...userPeripheralExecutionResult(
          'widoor',
          'rgb-indicator',
          '05 03 01',
        ),
        status: 'failed',
        nativeWriteCompleted: false,
        error: {
          code: 'native-write-failed',
          message: 'Native failure',
        },
      };
      await component.refreshProductData();
      const rgbControl = component.userPeripheralControls[0].config;
      await component.requestUserPeripheralChange(rgbControl, true);

      bleService.disconnect();

      expect(component.currentUserPeripheralState(rgbControl)).toBeNull();
      expect(component.canToggleUserPeripheral(rgbControl)).toBeFalse();
      expect(component.userPeripheralWriteState.status).toBe('idle');
    },
  );

  it('should not expose Widoor Commandes lock-mode transitions',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithLockMode('locked-closed'),
      );
      await component.refreshProductData();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(component.lockModeControls).toEqual([]);
      expect(component.showLockModeControls).toBeFalse();
      expect(element.querySelector('.lock-mode-controls')).toBeNull();
      expect(element.querySelector('ion-toggle.lock-mode-toggle')).toBeNull();
      expect(element.textContent).not.toContain(
        component.text.lockModeControls.title,
      );
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should block all Widoor motor commands while locked and restore at none',
    async () => {
      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithLockMode('locked-closed'),
      );
      alertRole = 'confirm';
      await component.refreshProductData();

      expect(component.showLockModeControls).toBeFalse();
      for (const command of WIDOOR_COMMAND_UI_CONFIGS.filter((config) =>
        config.enabled,
      )) {
        expect(component.canExecuteProductCommand(command)).toBeTrue();
      }

      await component.requestProductCommand(WIDOOR_COMMAND_UI_CONFIGS[0]);

      expect(alertCreate).toHaveBeenCalledTimes(1);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();

      loadService.nextResult = completeLoadResult(
        'success',
        'widoor',
        userValueWithLockMode('none'),
      );
      await component.refreshProductData();

      for (const command of WIDOOR_COMMAND_UI_CONFIGS.filter((config) =>
        config.enabled,
      )) {
        expect(component.canExecuteProductCommand(command)).toBeTrue();
      }
    },
  );

  it('should execute Widoor OPEN without a user confirmation alert',
    async () => {
      await component.requestWidoorOpen();
      fixture.detectChanges();

      expect(alertCreate).not.toHaveBeenCalled();
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.openCommandState.status).toBe('confirmed');
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should ignore alert dismissal roles for immediate Widoor OPEN',
    async () => {
      alertRole = 'backdrop';

      await component.requestWidoorOpen();

      expect(alertCreate).not.toHaveBeenCalled();
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.openCommandState.status).toBe('confirmed');
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should execute catalogued Widoor OPEN once with scoped authorization',
    async () => {
      alertRole = 'confirm';

      await component.requestWidoorOpen();
      fixture.detectChanges();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.write.operation).toBe('motor-open');
      expect(request.write.payloadHex).toBe('00 20 00 00');
      expect(Array.from(request.write.payload)).toEqual([0x00, 0x20, 0, 0]);
      expect(request.profile).toBe('widoor');
      expect(request.deviceId).toBe('device-1');
      expect(request.connectionGeneration).toBe(4);
      expect(request.identification).toEqual({
        profile: 'widoor',
        confidence: 'strong',
      });
      expect(request.confirmationPolicy).toEqual({
        kind: 'widoor-open-state',
      });
      expect(request.policy).toEqual({
        allowWidoorPhase1ImmediateWrite: true,
      });
      expect(request.authorization).toBeNull();
      expect(component.openCommandState.status).toBe('confirmed');
      expect(component.openCommandState.confirmationStatus).toBe('confirmed');
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should execute CLOSE without creating a user authorization',
    async () => {
      await component.requestWidoorClose();

      expect(alertCreate).not.toHaveBeenCalled();
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.authorization).toBeNull();
      expect(component.openCommandState.status).toBe('confirmed');
    },
  );

  it('should ignore CLOSE backdrop dismissal for immediate Widoor CLOSE', async () => {
    alertRole = 'backdrop';

    await component.requestWidoorClose();

    expect(alertCreate).not.toHaveBeenCalled();
    expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
    expect(component.openCommandState.status).toBe('confirmed');
    expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
  });

  it('should execute catalogued Widoor CLOSE once with a limited policy',
    async () => {
      alertRole = 'confirm';
      writeExecutionService.nextResult = openExecutionResult(
        'success',
        'confirmed',
        null,
        'motor-close',
      );

      await component.requestWidoorClose();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.write.operation).toBe('motor-close');
      expect(request.write.payloadHex).toBe('00 30');
      expect(Array.from(request.write.payload)).toEqual([0x00, 0x30]);
      expect(request.confirmationPolicy).toEqual({
        kind: 'widoor-close-state',
      });
      expect(request.policy).toEqual({
        allowPhysicalValidationAttempt: {
          operation: 'motor-close',
          profile: 'widoor',
        },
        allowWidoorPhase1ImmediateWrite: true,
      });
      expect(request.policy?.allowPhase1ReferenceOnly).toBeUndefined();
      expect(request.authorization).toBeNull();
      expect(component.openCommandState.status).toBe('confirmed');
      expect(component.openCommandState.message)
        .toBe(component.text.widoorCommands.close.confirmed);
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should map CLOSE timeout without claiming a confirmed movement',
    async () => {
      alertRole = 'confirm';
      writeExecutionService.nextResult = openExecutionResult(
        'timeout',
        'timeout',
        'confirmation-timeout',
        'motor-close',
      );

      await component.requestWidoorClose();

      expect(component.openCommandState.status).toBe('timeout');
      expect(component.openCommandState.nativeWriteCompleted).toBeTrue();
      expect(component.openCommandState.confirmationStatus).toBe('timeout');
      expect(component.openCommandState.message)
        .toBe(component.text.widoorCommands.close.notConfirmed);
    },
  );

  it('should map every terminal CLOSE result without native text',
    async () => {
      alertRole = 'confirm';
      const cases: readonly [
        LegacyBleWriteExecutionResult,
        string,
        string,
      ][] = [
        [openExecutionResult('failed', 'unavailable', null, 'motor-close'),
          'failed', component.text.openCommand.failed],
        [openExecutionResult(
          'unavailable', 'unavailable', null, 'motor-close',
        ), 'unavailable', component.text.openCommand.unavailable],
        [openExecutionResult(
          'disconnected', 'unavailable', null, 'motor-close',
        ), 'disconnected', component.text.openCommand.disconnected],
        [openExecutionResult(
          'stale', 'unavailable', null, 'motor-close',
        ), 'stale', component.text.openCommand.stale],
        [openExecutionResult(
          'unavailable', 'unavailable', 'write-in-progress', 'motor-close',
        ), 'unavailable', component.text.openCommand.alreadyInProgress],
        [openExecutionResult(
          'success', 'not-validated', null, 'motor-close',
        ), 'timeout', component.text.widoorCommands.close.notConfirmed],
      ];

      for (const [result, expectedStatus, expectedMessage] of cases) {
        writeExecutionService.nextResult = result;
        await component.requestWidoorClose();
        expect(component.openCommandState.status).toBe(expectedStatus);
        expect(component.openCommandState.message).toBe(expectedMessage);
        expect(component.openCommandState.message).not.toContain(
          'Native CLOSE error',
        );
      }
      expect(component.openCommandState.nativeWriteCompleted).toBeTrue();
      expect(component.openCommandState.confirmationStatus)
        .toBe('not-validated');
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should ignore a late CLOSE result after same-device reconnection',
    async () => {
      alertRole = 'confirm';
      let resolveExecution!: (result: LegacyBleWriteExecutionResult) => void;
      writeExecutionService.execute.and.returnValue(new Promise((resolve) => {
        resolveExecution = resolve;
      }));
      const pending = component.requestWidoorClose();
      await waitForCondition(() =>
        writeExecutionService.execute.calls.count() === 1,
      );

      bleService.connectionGeneration += 1;
      resolveExecution(openExecutionResult(
        'success',
        'confirmed',
        null,
        'motor-close',
      ));
      await pending;

      expect(component.displayedOpenCommandStatus).toBe('stale');
      expect(component.openCommandState.status).toBe('stale');
      expect(component.openCommandState.message)
        .toBe(component.text.openCommand.stale);
      expect(component.commandHistory).toEqual([]);
    },
  );

  it('should keep timed commands active and expose Phase 1 sensitive actions',
    () => {
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelectorAll(
        'ion-button.widoor-command-disabled',
      ).length).toBe(0);
      expect(element.textContent).toContain(
        component.text.widoorCommands.openShortTimed.label,
      );
      expect(element.textContent).not.toContain(
        component.text.widoorCommands.openLongTimed.label,
      );
      expect(element.querySelectorAll(
        'ion-button.widoor-timed-command',
      ).length).toBe(1);
      expect(component.sensitiveActions.map((action) => action.action))
        .toEqual([
          'learning',
          'radar-test-1',
          'radar-test-2',
          'professional-peripheral-lock',
          'reset',
        ]);
      expect(element.textContent).toContain(
        component.text.sensitiveActions.learning,
      );
      expect(element.textContent).toContain(
        component.text.sensitiveActions.reset,
      );
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(alertCreate).not.toHaveBeenCalled();
    },
  );

  it('should execute short timed opening once with its exact limited scope',
    async () => {
      alertRole = 'confirm';
      const config = WIDOOR_COMMAND_UI_CONFIGS[2];
      writeExecutionService.nextResult = openExecutionResult(
        'success',
        'confirmed',
        null,
        'motor-open-short-timed',
      );

      await component.requestWidoorCommand(config);
      fixture.detectChanges();

      expect(alertCreate).not.toHaveBeenCalled();
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.write.payloadHex).toBe('00 21 00 00');
      expect(request.write.operation).toBe('motor-open-short-timed');
      expect(request.confirmationPolicy).toEqual({
        kind: 'widoor-timed-opening-state',
        command: 'OPEN_SHORT_TIMED',
      });
      expect(request.policy?.allowPhysicalValidationAttempt).toEqual({
        operation: 'motor-open-short-timed',
        profile: 'widoor',
      });
      expect(request.policy?.allowWidoorPhase1ImmediateWrite).toBeTrue();
      expect(request.policy?.allowPhase1ReferenceOnly).toBeUndefined();
      expect(request.authorization).toBeNull();
      expect(component.openCommandState.movementStartConfirmed).toBeTrue();
      expect(component.openCommandState.timedCycleValidationStatus)
        .toBe('pending-physical-validation');
      expect(component.openCommandState.message).toBe(
        component.text.widoorCommands.openShortTimed.confirmed,
      );
      expect(component.openCommandState.secondaryMessage).toBe(
        component.text.widoorCommands.timedCyclePending,
      );
      expect(component.commandHistory[0]).toEqual(jasmine.objectContaining({
        label: component.text.widoorCommands.openShortTimed.label,
        status: 'confirmed',
        confirmationStatus: 'confirmed',
        isTimedCommand: true,
        timedCycleValidationStatus: 'pending-physical-validation',
      }));
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should not expose long timed opening for Widoor', async () => {
    expect(WIDOOR_COMMAND_UI_CONFIGS.some((config) =>
      config.operation === 'motor-open-long-timed',
    )).toBeFalse();
    expect(component.productCommands.some((command) =>
      command.config.operation === 'motor-open-long-timed',
    )).toBeFalse();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should map timed timeout, failure, disconnection and stale results',
    async () => {
      alertRole = 'confirm';
      const config = WIDOOR_COMMAND_UI_CONFIGS[2];
      const cases = [
        ['timeout', 'timeout', 'timeout'],
        ['failed', 'unavailable', 'failed'],
        ['disconnected', 'unavailable', 'disconnected'],
        ['stale', 'unavailable', 'stale'],
      ] as const;

      for (const [resultStatus, confirmation, expectedStatus] of cases) {
        writeExecutionService.nextResult = openExecutionResult(
          resultStatus,
          confirmation,
          resultStatus === 'timeout' ? 'confirmation-timeout' : 'test-error',
          'motor-open-short-timed',
        );
        await component.requestWidoorCommand(config);
        expect(component.openCommandState.status).toBe(expectedStatus);
        expect(component.openCommandState.movementStartConfirmed).toBeFalse();
        expect(component.openCommandState.timedCycleValidationStatus)
          .not.toBe('validated');
        expect(component.openCommandState.message).not.toContain('Native');
      }
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should execute a timed opening without user authorization',
    async () => {
      alertRole = 'backdrop';

      await component.requestWidoorCommand(WIDOOR_COMMAND_UI_CONFIGS[2]);

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.authorization).toBeNull();
      expect(component.openCommandState.status).toBe('confirmed');
      expect(component.commandHistory.length).toBe(1);
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should block another motor command while a timed alert is pending',
    async () => {
      let dismissAlert!: () => void;
      alertCreate.and.callFake(async (options: Record<string, unknown>) => {
        alertOptions.push(options);
        return {
          present: async () => undefined,
          onDidDismiss: () => new Promise<{ role: string }>((resolve) => {
            dismissAlert = () => resolve({ role: 'cancel' });
          }),
        };
      });

      await component.requestWidoorCommand(WIDOOR_COMMAND_UI_CONFIGS[2]);

      expect(alertCreate).not.toHaveBeenCalled();
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(component.commandHistory[0]).toEqual(jasmine.objectContaining({
        label: component.text.widoorCommands.openShortTimed.label,
      }));
    },
  );

  it('should retain command history internally without rendering it',
    async () => {
      alertRole = 'confirm';
      for (let index = 0; index < 6; index += 1) {
        const config = WIDOOR_COMMAND_UI_CONFIGS[index % 2];
        writeExecutionService.nextResult = openExecutionResult(
          'success',
          'confirmed',
          null,
          config.operation,
        );
        await component.requestWidoorCommand(config);
      }
      fixture.detectChanges();

      expect(component.commandHistory.length).toBe(5);
      expect(component.commandHistory[0].label).toBe(
        component.text.widoorCommands.close.label,
      );
      const details = fixture.nativeElement.querySelector(
        'details.command-history',
      ) as HTMLDetailsElement;
      expect(details).toBeNull();
      expect((fixture.nativeElement as HTMLElement).textContent)
        .not.toContain(component.text.commandHistory.title);

      bleService.disconnect();
      expect(component.commandHistory).toEqual([]);
    },
  );

  it('should clear command history on a new connection generation',
    async () => {
      alertRole = 'confirm';
      await component.requestWidoorOpen();
      expect(component.commandHistory.length).toBe(1);

      bleService.connectionGeneration += 1;

      expect(component.commandHistory).toEqual([]);
    },
  );

  it('should reject rapid duplicate confirmation flows', async () => {
    let dismissAlert!: () => void;
    alertCreate.and.callFake(async (options: Record<string, unknown>) => {
      alertOptions.push(options);
      return {
        present: async () => undefined,
        onDidDismiss: () => new Promise<{ role: string }>((resolve) => {
          dismissAlert = () => resolve({ role: 'cancel' });
        }),
      };
    });

    await component.requestWidoorOpen();
    await component.requestWidoorOpen();

    expect(alertCreate).not.toHaveBeenCalled();
    expect(writeExecutionService.execute).toHaveBeenCalledTimes(2);
  });

  it('should reject rapid duplicate CLOSE confirmation flows', async () => {
    await component.requestWidoorClose();
    await component.requestWidoorClose();

    expect(alertCreate).not.toHaveBeenCalled();
    expect(writeExecutionService.execute).toHaveBeenCalledTimes(2);
  });

  it('should map every guarded OPEN execution result without native text',
    async () => {
      alertRole = 'confirm';
      const cases: readonly [
        LegacyBleWriteExecutionResult,
        string,
        string,
      ][] = [
        [openExecutionResult('success', 'confirmed'), 'confirmed',
          component.text.widoorCommands.open.confirmed],
        [openExecutionResult('timeout', 'timeout'), 'timeout',
          component.text.widoorCommands.open.notConfirmed],
        [openExecutionResult('failed', 'unavailable'), 'failed',
          component.text.openCommand.failed],
        [openExecutionResult('unavailable', 'unavailable'), 'unavailable',
          component.text.openCommand.unavailable],
        [openExecutionResult('disconnected', 'unavailable'), 'disconnected',
          component.text.openCommand.disconnected],
        [openExecutionResult('stale', 'unavailable'), 'stale',
          component.text.openCommand.stale],
        [openExecutionResult(
          'unavailable', 'unavailable', 'write-in-progress',
        ), 'unavailable', component.text.openCommand.alreadyInProgress],
        [openExecutionResult('success', 'not-validated'), 'timeout',
          component.text.widoorCommands.open.notConfirmed],
      ];

      for (const [result, expectedStatus, expectedMessage] of cases) {
        writeExecutionService.nextResult = result;
        await component.requestWidoorOpen();
        expect(component.openCommandState.status).toBe(expectedStatus);
        expect(component.openCommandState.message).toBe(expectedMessage);
        expect(component.openCommandState.message).not.toContain(
          'Native OPEN error',
        );
      }
      expect(component.openCommandState.nativeWriteCompleted).toBeTrue();
      expect(component.openCommandState.confirmationStatus)
        .toBe('not-validated');
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should disable OPEN when cached GATT write is unavailable', async () => {
    bleService.getGattCharacteristicProperties.and.returnValue(
      writableGattProperties({ write: false }),
    );
    fixture.detectChanges();

    const openButton = fixture.nativeElement.querySelector(
      'ion-button.widoor-open-command',
    ) as HTMLIonButtonElement | null;
    expect(openButton?.disabled).toBeTrue();
    await component.requestWidoorOpen();
    expect(alertCreate).not.toHaveBeenCalled();
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
  });

  it('should ignore confirmation after disconnection', async () => {
    bleService.disconnect();
    await component.requestWidoorOpen();

    expect(writeExecutionService.execute).not.toHaveBeenCalled();
    expect(component.displayedOpenCommandStatus).toBe('disconnected');
  });

  it('should reject a late result after same-device reconnection', async () => {
    alertRole = 'confirm';
    let resolveExecution!: (result: LegacyBleWriteExecutionResult) => void;
    writeExecutionService.execute.and.returnValue(new Promise((resolve) => {
      resolveExecution = resolve;
    }));
    const pending = component.requestWidoorOpen();
    await waitForCondition(() =>
      writeExecutionService.execute.calls.count() === 1,
    );

    fixture.detectChanges();
    expect(component.openCommandState.status).toBe('executing');
    expect((fixture.nativeElement.querySelector(
      'ion-button.widoor-open-command',
    ) as HTMLIonButtonElement | null)?.disabled).toBeTrue();

    bleService.connectionGeneration += 1;
    resolveExecution(openExecutionResult('success', 'confirmed'));
    await pending;

    expect(component.displayedOpenCommandStatus).toBe('stale');
    expect(component.displayedOpenCommandMessage)
      .toBe(component.text.openCommand.stale);
  });

  it('should reject a late result after connection to another device',
    async () => {
      alertRole = 'confirm';
      let resolveExecution!: (result: LegacyBleWriteExecutionResult) => void;
      writeExecutionService.execute.and.returnValue(new Promise((resolve) => {
        resolveExecution = resolve;
      }));
      const pending = component.requestWidoorOpen();
      await waitForCondition(() =>
        writeExecutionService.execute.calls.count() === 1,
      );

      bleService.connectedDeviceId = 'device-2';
      bleService.connectionGeneration += 1;
      resolveExecution(openExecutionResult('success', 'confirmed'));
      await pending;

      expect(component.displayedOpenCommandStatus).toBe('stale');
      expect(component.openCommandState.status).toBe('stale');
    },
  );

  it('should invalidate an active command on disconnection', async () => {
    alertRole = 'confirm';
    let resolveExecution!: (result: LegacyBleWriteExecutionResult) => void;
    writeExecutionService.execute.and.returnValue(new Promise((resolve) => {
      resolveExecution = resolve;
    }));
    const pending = component.requestWidoorOpen();
    await waitForCondition(() =>
      writeExecutionService.execute.calls.count() === 1,
    );

    bleService.disconnect();
    resolveExecution(openExecutionResult('success', 'confirmed'));
    await pending;

    expect(component.displayedOpenCommandStatus).toBe('disconnected');
    expect(component.openCommandState.status).toBe('disconnected');
  });

  it('should ignore a late result after page destruction', async () => {
    alertRole = 'confirm';
    let resolveExecution!: (result: LegacyBleWriteExecutionResult) => void;
    writeExecutionService.execute.and.returnValue(new Promise((resolve) => {
      resolveExecution = resolve;
    }));
    const pending = component.requestWidoorOpen();
    await waitForCondition(() =>
      writeExecutionService.execute.calls.count() === 1,
    );

    fixture.destroy();
    resolveExecution(openExecutionResult('success', 'confirmed'));
    await pending;

    expect(component.openCommandState.status).toBe('idle');
    expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
  });

  it('should reject a second refresh while the first load is pending',
    async () => {
      let resolveLoad!: (value: ProductDataLoadResult) => void;
      loadService.loadProductData.and.returnValue(new Promise((resolve) => {
        resolveLoad = resolve;
      }));

      const firstLoad = component.refreshProductData();
      await component.refreshProductData();

      expect(loadService.loadProductData).toHaveBeenCalledTimes(1);
      resolveLoad(completeLoadResult('success'));
      await firstLoad;
    },
  );

  it('should render successful values including zero and false', async () => {
    await component.refreshProductData();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('27/08/2019');
    expect(text).toContain('26580');
    expect(component.datesRows.some((row) =>
      row.key === 'cycles-since-maintenance' &&
      row.label === 'Cycles depuis maintenance',
    )).toBeTrue();
    expect(text).toContain('0');
    expect(text).toContain(component.text.user.rgb);
    expect(text).not.toContain(component.text.user.staticLight);
    expect(text).not.toContain(component.text.user.dynamicLight);
    expect(text).toContain('3.5.3.348');
    expect(text).toContain('Initialisations');
    expect(text).toContain('25');
  });

  it('should preserve partial successes and distinct read failures',
    async () => {
      loadService.nextResult = partialLoadResult();

      await component.refreshProductData();
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent as string;

      expect(component.viewModel.partialSuccess).toBeTrue();
      expect(component.globalStatusLabel)
        .toBe(component.text.states.partialSuccess);
      expect(fixture.nativeElement.querySelector('.product-summary'))
        .toBeNull();
      expect(component.readStatusLabel(component.viewModel.reads.userParameters))
        .toBe(component.text.states.invalid);
      expect(component.readStatusLabel(
        component.viewModel.reads.professionalParameters,
      )).toBe(component.text.errors.characteristicAbsent);
      expect(component.readStatusLabel(component.viewModel.reads.maintenance))
        .toBe(component.text.errors.unknown);
      expect(text).not.toContain('Native maintenance failure');
      expect(text).toContain('3.5.3.348');
    },
  );

  it('should render Widoor Phase 1 settings when parameter reads are unavailable',
    async () => {
      loadService.nextResult = oldWidoorLoadResult();

      await component.refreshProductData();
      component.setActiveMainTab('settings');
      component.setActiveSettingsTab('basic');
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const text = element.textContent as string;

      expect(component.viewModel.reads.userParameters.value).toBeNull();
      expect(component.viewModel.reads.professionalParameters.value).toBeNull();
      expect(component.showUserSpeedControls).toBeTrue();
      expect(component.showUserTimingControls).toBeTrue();
      expect(component.showBasicUserPeripheralControls).toBeTrue();
      expect(component.showNameRoomControls).toBeTrue();
      expect(element.querySelectorAll('ion-range.user-speed-range').length)
        .toBe(2);
      expect(element.querySelector('ion-range.user-timing-range'))
        .not.toBeNull();
      expect(element.querySelector('ion-toggle.user-peripheral-toggle'))
        .not.toBeNull();
      expect(element.querySelector('ion-input.name-room-name-input'))
        .not.toBeNull();
      expect(element.querySelector('ion-select.name-room-select'))
        .not.toBeNull();

      component.setActiveSettingsTab('advanced');
      fixture.detectChanges();

      expect(component.showProfessionalScalarControls).toBeTrue();
      expect(component.showProfessionalInputControls).toBeTrue();
      expect(element.querySelector(
        '[data-professional-scalar-field="break-force-at-open"]',
      )).not.toBeNull();
      expect(element.querySelector(
        '[data-professional-scalar-field="near-open-speed"]',
      )).not.toBeNull();
      expect(element.querySelector(
        '[data-professional-scalar-field="near-close-speed"]',
      )).not.toBeNull();
      expect(element.querySelector(
        '[data-professional-input-field="input-1"]',
      )).not.toBeNull();
      expect(element.querySelector(
        '[data-professional-input-field="input-2"]',
      )).not.toBeNull();
      expect(element.querySelector('[data-sensitive-action="learning"]'))
        .not.toBeNull();
      expect(element.querySelector('[data-sensitive-action="reset"]'))
        .not.toBeNull();
      expect(text).not.toContain('The required GATT characteristic');
      expect(text).toContain('27/08/2019');
      expect(text).toContain('Initialisations');
    },
  );

  it('should keep unavailable Widoor settings visible but block writes without a writable characteristic',
    async () => {
      loadService.nextResult = oldWidoorLoadResult();
      bleService.getGattCharacteristicProperties.and.returnValue(
        writableGattProperties({
          characteristicPresent: false,
          propertiesAvailable: false,
          write: false,
        }),
      );

      await component.refreshProductData();
      component.setActiveMainTab('settings');
      component.setActiveSettingsTab('basic');
      fixture.detectChanges();

      const openSpeed = component.userSpeedControls[0].config;
      component.toggleUserSpeedLock(openSpeed);
      component.setUserSpeedDraftValue(openSpeed, 40);

      expect(component.showUserSpeedControls).toBeTrue();
      expect(component.canApplyUserSpeed(openSpeed)).toBeFalse();
      await component.requestUserSpeedChange(openSpeed);

      component.setActiveSettingsTab('advanced');
      fixture.detectChanges();
      const breakForce = component.professionalScalarControls.find(
        (control) => control.config.field === 'break-force-at-open',
      )!.config;
      component.toggleProfessionalScalarLock(breakForce);
      component.setProfessionalScalarDraftValue(breakForce, 6);

      expect(component.showProfessionalScalarControls).toBeTrue();
      expect(component.canApplyProfessionalScalar(breakForce)).toBeFalse();
      await component.requestProfessionalScalarChange(breakForce);

      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should keep native errors and UUIDs out of the main presentation',
    async () => {
      loadService.nextResult = oldWidoorLoadResult();

      await component.refreshProductData();
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const details = element.querySelector<HTMLDetailsElement>(
        'details.product-technical-details',
      );

      expect(details).toBeNull();
      expect(element.textContent).not.toContain(
        BLE_UUIDS.userParametersCharacteristic,
      );
      expect(element.textContent).not.toContain(
        'The required GATT characteristic',
      );
    },
  );

  it('should hide raw frames in closed technical details by default',
    async () => {
      await component.refreshProductData();
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const details = element.querySelector<HTMLDetailsElement>(
        'details.product-technical-details',
      );

      expect(details).toBeNull();
      expect(element.textContent).not.toContain(
        component.text.rawFrame,
      );
    },
  );

  it('should format refresh timestamps internally without rendering shell data',
    async () => {
      const timestamp = new Date(2026, 6, 31, 11, 47, 3).getTime();
      loadService.nextResult = {
        ...completeLoadResult('success'),
        completedAt: timestamp,
      };

      await component.refreshProductData();
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent as string;

      expect(formatProductTimestamp(timestamp)).toBe('31/07/2026 11:47:03');
      expect(component.viewModel.lastUpdatedAt).toBe(timestamp);
      expect(text).not.toContain('31/07/2026 11:47:03');
      expect(text).not.toMatch(/\b(?:AM|PM)\b/);
      expect(text).not.toContain(component.text.lastRefresh);
      expect(text).not.toContain('suffixe Phase 1');
    },
  );

  it('should format timestamps without locale-dependent output', () => {
    expect(formatProductTimestamp(
      new Date(2026, 0, 1, 0, 0, 0).getTime(),
    )).toBe('01/01/2026 00:00:00');
    expect(formatProductTimestamp(
      new Date(2026, 11, 9, 8, 5, 4).getTime(),
    )).toBe('09/12/2026 08:05:04');
    expect(formatProductTimestamp(null)).toBeNull();
    expect(formatProductTimestamp(Number.NaN)).toBeNull();
    expect(formatProductTimestamp(Number.MAX_VALUE)).toBeNull();
  });

  it('should map known read errors without exposing native messages', () => {
    const cases: readonly [
      BleReadError['code'],
      Exclude<BleReadStatus, 'success'>,
      string,
    ][] = [
      ['service-absent', 'unavailable', component.text.errors.serviceAbsent],
      ['characteristic-absent', 'unavailable',
        component.text.errors.characteristicAbsent],
      ['not-readable', 'unavailable', component.text.errors.notReadable],
      ['disconnected', 'disconnected', component.text.states.disconnected],
      ['stale', 'stale', component.text.states.stale],
      ['invalid-frame', 'invalid-frame', component.text.states.invalid],
      ['native-read-failed', 'failed', component.text.errors.unknown],
    ];

    for (const [code, status, expected] of cases) {
      const state = failedViewState(code, status);
      expect(component.readStatusLabel(state)).withContext(code).toBe(expected);
      expect(component.readStatusLabel(state)).not.toContain('Native message');
    }
  });

  it('should cancel and clear data on disconnection while ignoring late data',
    async () => {
      let resolveLoad!: (value: ProductDataLoadResult) => void;
      loadService.loadProductData.and.returnValue(new Promise((resolve) => {
        resolveLoad = resolve;
      }));
      const pending = component.refreshProductData();

      bleService.disconnect();
      resolveLoad(completeLoadResult('success'));
      await pending;
      fixture.detectChanges();

      expect(loadService.cancelCurrentLoad).toHaveBeenCalledTimes(1);
      expect(component.viewModel.connectionState).toBe('disconnected');
      expect(component.viewModel.reads.version.value).toBeNull();
      expect(component.viewModel.loading).toBeFalse();
      expect(fixture.nativeElement.querySelector(
        '[aria-labelledby="settings-title"]',
      )).toBeNull();
      expect((fixture.nativeElement.querySelector(
        'ion-button.widoor-open-command',
      ) as HTMLIonButtonElement | null)?.disabled).toBeTrue();
    },
  );

  it('should cancel an active load when the page is destroyed', async () => {
    let resolveLoad!: (value: ProductDataLoadResult) => void;
    loadService.loadProductData.and.returnValue(new Promise((resolve) => {
      resolveLoad = resolve;
    }));
    const pending = component.refreshProductData();

    fixture.destroy();
    resolveLoad(completeLoadResult('success'));
    await pending;

    expect(loadService.cancelCurrentLoad).toHaveBeenCalledTimes(1);
    expect(component.viewModel.reads.version.value).toBeNull();
  });

  it('should ignore a late result after reconnection with the same deviceId',
    async () => {
      let resolveLoad!: (value: ProductDataLoadResult) => void;
      loadService.loadProductData.and.returnValue(new Promise((resolve) => {
        resolveLoad = resolve;
      }));
      const pending = component.refreshProductData();

      bleService.connectionGeneration += 1;
      resolveLoad(completeLoadResult('success'));
      await pending;
      fixture.detectChanges();

      expect(component.pageContextCurrent).toBeFalse();
      expect(component.displayedConnectionState).toBe('stale');
      expect(component.viewModel.reads.version.value).toBeNull();
      expect(fixture.nativeElement.querySelector(
        '[aria-labelledby="information-title"]',
      )).toBeNull();
      expect((fixture.nativeElement.querySelector(
        'ion-button.widoor-open-command',
      ) as HTMLIonButtonElement | null)?.disabled).toBeTrue();
    },
  );

  it('should reject an orchestrator result for another connection context',
    async () => {
      loadService.nextResult = {
        ...completeLoadResult('success'),
        deviceId: 'device-2',
        connectionGeneration: 5,
      };

      await component.refreshProductData();

      expect(component.viewModel.reads.version.value).toBeNull();
      expect(component.viewModel.lastUpdatedAt).toBeNull();
    },
  );

  it('should update read-only motor state from the existing notification flow',
    () => {
      bleService.emitMotorState([0x21, 0, 0, 0, 100, 0, 0x08]);
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const text = fixture.nativeElement.textContent as string;

      expect(text).toContain(component.text.motor.ble);
      expect(text).toContain(component.text.motor.automaticManual);
      expect(text).toContain(component.text.motor.direction);
      expect(text).toContain(component.text.motor.pairing);
      expect(element.querySelector(
        '.product-information-row[data-info-row="motor-state-label"]',
      )).toBeNull();
      expect(element.querySelector(
        '.product-information-row[data-info-row="motor-percentage"]',
      )).toBeNull();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should keep each global state internally without rendering shell summary',
    () => {
    expect(component.viewModel.loadStatus).toBeNull();
    expect(fixture.nativeElement.querySelector('.product-summary')).toBeNull();

    component.viewModel = { ...component.viewModel, loading: true };
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(component.text.loading);

    for (const status of [
      'success',
      'partial-success',
      'failed',
      'disconnected',
      'stale',
      'cancelled',
    ] as const) {
      component.viewModel = {
        ...component.viewModel,
        loading: false,
        loadStatus: status,
      };
      const label = component.globalStatusLabel;
      fixture.detectChanges();
      expect(label).withContext(status).toBeTruthy();
      const summary = fixture.nativeElement.querySelector(
        '.product-summary',
      ) as HTMLElement | null;
      expect(summary).withContext(status).toBeNull();
    }
  });

  it('should return to Scan from the product shell',
    async () => {
      const disconnectSpy = spyOn(bleService, 'disconnect')
        .and.callThrough();

      await component.backToScan();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
      expect(bleService.connectedDeviceId).toBeNull();
      expect(bleService.connectionGeneration).toBe(5);
    },
  );

  it('should ignore a second scan return while disconnect is pending',
    async () => {
      let releaseDisconnect!: () => void;
      const pendingDisconnect = new Promise<void>((resolve) => {
        releaseDisconnect = resolve;
      });
      const disconnectSpy = spyOn(bleService, 'disconnect')
        .and.returnValue(pendingDisconnect);

      const firstReturn = component.backToScan();
      await component.backToScan();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(routerNavigate).not.toHaveBeenCalled();

      releaseDisconnect();
      await firstReturn;

      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
    },
  );

  it('should stay on ProductPage and allow retry when disconnect fails while still connected',
    async () => {
      const disconnectSpy = spyOn(bleService, 'disconnect')
        .and.rejectWith(new Error('Native disconnect failed.'));

      await component.backToScan();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(routerNavigate).not.toHaveBeenCalled();
      expect(component.returningToScan).toBeFalse();
      expect(component.returnToScanErrorMessage).toBe(
        component.text.returnToScanFailed,
      );
      expect(bleService.connectedDeviceId).toBe('device-1');
    },
  );

  it('should navigate to Scan when disconnect rejects after a remote disconnection',
    async () => {
      spyOn(bleService, 'disconnect').and.callFake(async () => {
        bleService.connectedDeviceId = null;
        bleService.connectionGeneration += 1;
        throw new Error('Native disconnect failed after remote disconnect.');
      });

      await component.backToScan();

      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
      expect(component.returnToScanErrorMessage).toBeNull();
      expect(bleService.connectedDeviceId).toBeNull();
    },
  );

  it('should cancel an active initial load before returning to Scan',
    async () => {
      component.viewModel = {
        ...component.viewModel,
        loading: true,
      };
      loadService.isLoading = true;

      await component.backToScan();

      expect(loadService.cancelCurrentLoad).toHaveBeenCalled();
      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
    },
  );

  it('should return to Scan through the central disconnect while a write is in progress',
    async () => {
      bleService.isWriting = true;
      const disconnectSpy = spyOn(bleService, 'disconnect')
        .and.callThrough();

      await component.backToScan();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
      expect(bleService.connectedDeviceId).toBeNull();
    },
  );

  it('should reject incomplete or forged navigation state', () => {
    expect(isProductPageNavigationState(null)).toBeFalse();
    expect(isProductPageNavigationState({
      ...navigationState('widoor'),
      deviceId: '',
    })).toBeFalse();
    expect(isProductPageNavigationState({
      ...navigationState('widoor'),
      displayName: '   ',
    })).toBeFalse();
    expect(isProductPageNavigationState({
      ...navigationState('widoor'),
      motorState: {},
    })).toBeFalse();
    expect(isProductPageNavigationState({
      ...navigationState('widoor'),
      identificationConfidence: 'weak',
    })).toBeFalse();
    expect(isProductPageNavigationState(navigationState('widoor'))).toBeTrue();
  });
});

describe('ProductPage commands for other profiles', () => {
  for (const profile of [
    'moventiv-60',
    'moventiv-80',
    'garline',
  ] as const) {
    it(`should expose ${profile} main commands without auto execution`,
      async () => {
      const bleService = new FakeBleService();
      const writeExecutionService = new FakeBleWriteExecutionService();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: { create: jasmine.createSpy('create') },
          },
          { provide: BleWriteExecutionService, useValue: writeExecutionService },
          {
            provide: ProductDataLoadService,
            useValue: new FakeProductDataLoadService(),
          },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState(profile) },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(ProductPage);
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelector('ion-button.widoor-open-command'))
        .not.toBeNull();
      expect(element.textContent).toContain(
        fixture.componentInstance.text.widoorCommands.open.label,
      );
      expect(element.textContent).toContain(
        fixture.componentInstance.text.widoorCommands.close.label,
      );
      expect(element.textContent).toContain(
        fixture.componentInstance.text.widoorCommands.openShortTimed.label,
      );
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
      fixture.destroy();
    });
  }
});

describe('ProductPage direct navigation', () => {
  it('should show a controlled state without constructing assumed data',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      const routerNavigate = jasmine.createSpy('navigate').and.resolveTo(true);
      globalThis.history.replaceState({}, '', globalThis.location.pathname);
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create'),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: new FakeBleWriteExecutionService(),
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'widoor' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => null,
              navigate: routerNavigate,
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.viewModel.connectionState).toBe('invalid-profile');
      expect(component.pageContextCurrent).toBeFalse();
      expect(component.canRefresh).toBeFalse();
      expect(loadService.loadProductData).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector(
        '[aria-labelledby="settings-title"]',
      )).toBeNull();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );
});

describe('ProductPage Moventiv/Garline motor commands', () => {
  for (const profile of ['moventiv-60', 'garline'] as const) {
    it(`should expose ${profile} Phase 1 main motor commands through the ` +
      'Phase 2 write executor', async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      const writeExecutionService = new FakeBleWriteExecutionService();
      writeExecutionService.nextResult = {
        ...openExecutionResult(
          'success',
          'not-validated',
          null,
          'motor-close',
        ),
        profile,
        hardwareValidationStatus: 'phase1-reference-only',
        policyOverrideUsed: true,
      };
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'confirm' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState(profile) },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain(
        component.text.widoorCommands.open.label,
      );
      expect(element.textContent).toContain(
        component.text.widoorCommands.close.label,
      );
      expect(element.textContent).toContain(
        component.text.widoorCommands.openShortTimed.label,
      );
      expect(element.textContent).not.toContain(
        component.text.widoorCommands.openLongTimed.label,
      );

      await component.requestProductCommand(
        MOTOR_COMMAND_UI_CONFIGS[profile][1],
      );

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.profile).toBe(profile);
      expect(request.identification).toEqual({
        profile,
        confidence: 'strong',
      });
      expect(request.write.profile).toBe(profile);
      expect(request.write.operation).toBe('motor-close');
      expect(request.write.serviceUuid).toBe(BLE_UUIDS.shdoService);
      expect(request.write.characteristicUuid)
        .toBe(BLE_UUIDS.motorCommandCharacteristic);
      expect(request.write.payloadHex).toBe('00 30');
      expect(Array.from(request.write.payload)).toEqual([0x00, 0x30]);
      expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
      expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
      expect(alertCreate).not.toHaveBeenCalled();
      if (profile === 'moventiv-60') {
        expect(request.policy).toEqual(jasmine.objectContaining({
          allowMoventivPhase1ImmediateWrite: true,
        }));
      } else {
        expect(request.policy).toEqual(jasmine.objectContaining({
          allowGarlinePhase1ImmediateWrite: true,
        }));
      }
      expect(request.authorization).toBeNull();
      expect(component.openCommandState.status).toBe('confirmed');
      expect(component.openCommandState.confirmationStatus)
        .toBe('not-validated');
      expect(component.openCommandState.message)
        .toBe(component.text.openCommand.sent);
    });
  }

  it('should execute every visible Garline motor command immediately',
    async () => {
      const bleService = new FakeBleService();
      const writeExecutionService = new FakeBleWriteExecutionService();
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'confirm' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          {
            provide: ProductDataLoadService,
            useValue: new FakeProductDataLoadService(),
          },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'garline' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('garline') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      for (const command of MOTOR_COMMAND_UI_CONFIGS.garline) {
        writeExecutionService.nextResult = {
          ...openExecutionResult(
            'success',
            'not-validated',
            null,
            command.operation,
          ),
          profile: 'garline',
          hardwareValidationStatus: 'phase1-reference-only',
          policyOverrideUsed: true,
        };
        await component.requestProductCommand(command);
      }

      expect(MOTOR_COMMAND_UI_CONFIGS.garline.map((command) =>
        command.operation,
      )).toEqual([
        'motor-open',
        'motor-close',
        'motor-open-short-timed',
      ]);
      expect(writeExecutionService.execute).toHaveBeenCalledTimes(3);
      expect(alertCreate).not.toHaveBeenCalled();
      const requests = writeExecutionService.execute.calls.allArgs()
        .map(([request]) => request as LegacyBleWriteRequest);
      expect(requests.map((request) => request.write.operation)).toEqual([
        'motor-open',
        'motor-close',
        'motor-open-short-timed',
      ]);
      expect(requests.every((request) =>
        request.authorization === null &&
        request.policy?.allowGarlinePhase1ImmediateWrite === true &&
        request.policy?.allowPhase1ReferenceOnly === true,
      )).toBeTrue();
    },
  );

  it('should reject non-current or unsupported motor command configs',
    async () => {
      const bleService = new FakeBleService();
      const writeExecutionService = new FakeBleWriteExecutionService();
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'confirm' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          {
            provide: ProductDataLoadService,
            useValue: new FakeProductDataLoadService(),
          },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'moventiv-60' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('moventiv-60') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      expect(MOTOR_COMMAND_UI_CONFIGS['moventiv-60'].some((config) =>
        config.command === 'OPEN_LONG_TIMED',
      )).toBeFalse();

      await component.requestProductCommand(WIDOOR_COMMAND_UI_CONFIGS[3]);

      expect(alertCreate).not.toHaveBeenCalled();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  for (const profile of ['moventiv-80', 'garline'] as const) {
    it(`should show the Phase 1 advanced-tab alert for ${profile} and return to basic on cancel`,
      async () => {
      const bleService = new FakeBleService();
      const writeExecutionService = new FakeBleWriteExecutionService();
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'cancel' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          {
            provide: ProductDataLoadService,
            useValue: new FakeProductDataLoadService(),
          },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState(profile) },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      component.setActiveMainTab('settings');
      component.setActiveSettingsTab('advanced');
      await waitForCondition(() => component.activeSettingsTab === 'basic');

      expect(alertCreate).toHaveBeenCalledTimes(1);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      },
    );
  }
});

describe('ProductPage speed controls for profile variants', () => {
  for (const scenario of [
    {
      profile: 'moventiv-60',
      open: 60,
      close: 70,
      accepted: 50,
      invalid: 49,
      payloadHex: '01 32',
      serviceUuid: BLE_UUIDS.moventivGarlineService,
      range: { min: 50, max: 100 },
    },
    {
      profile: 'moventiv-80',
      open: 60,
      close: 70,
      accepted: 50,
      invalid: 49,
      payloadHex: '01 32',
      serviceUuid: BLE_UUIDS.moventivGarlineService,
      range: { min: 50, max: 100 },
    },
    {
      profile: 'garline',
      open: 10,
      close: 20,
      accepted: 0,
      invalid: -1,
      payloadHex: '01 00',
      serviceUuid: BLE_UUIDS.moventivGarlineService,
      range: { min: 0, max: 100 },
    },
  ] as const) {
    it(`should apply ${scenario.profile} speed ranges and writes`,
      async () => {
        const bleService = new FakeBleService();
        const loadService = new FakeProductDataLoadService();
        loadService.nextResult = completeLoadResult(
          'success',
          scenario.profile,
          userValueWithSpeeds(scenario.open, scenario.close),
        );
        const writeExecutionService = new FakeBleWriteExecutionService();
        writeExecutionService.nextResult = userSpeedExecutionResult(
          scenario.profile,
          'open-speed',
          scenario.payloadHex,
        );

        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
          imports: [ProductPage],
          providers: [
            { provide: BleService, useValue: bleService },
            {
              provide: AlertController,
              useValue: {
                create: jasmine.createSpy('create').and.resolveTo({
                  present: async () => undefined,
                  onDidDismiss: async () => ({ role: 'confirm' }),
                }),
              },
            },
            {
              provide: BleWriteExecutionService,
              useValue: writeExecutionService,
            },
            { provide: ProductDataLoadService, useValue: loadService },
            { provide: ProductDetection, useClass: ProductDetection },
            {
              provide: ActivatedRoute,
              useValue: {
                snapshot: { data: { profile: scenario.profile } },
              },
            },
            {
              provide: Router,
              useValue: {
                getCurrentNavigation: () => ({
                  extras: { state: navigationState(scenario.profile) },
                }),
                navigate: jasmine.createSpy('navigate').and.resolveTo(true),
              },
            },
          ],
        }).compileComponents();

        const fixture = TestBed.createComponent(ProductPage);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        await component.refreshProductData();
        const openControl = component.userSpeedControls[0].config;

        expect(openControl.range).toEqual(scenario.range);
        expect(component.currentUserSpeedValue(openControl))
          .toBe(scenario.open);

        component.setUserSpeedDraftValue(openControl, scenario.invalid);
        await component.requestUserSpeedChange(openControl);
        expect(writeExecutionService.execute).not.toHaveBeenCalled();

        component.setUserSpeedDraftValue(openControl, scenario.accepted);
        await component.requestUserSpeedChange(openControl);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.profile).toBe(scenario.profile);
        expect(request.write.operation).toBe('open-speed');
        expect(request.write.serviceUuid).toBe(scenario.serviceUuid);
        expect(request.write.characteristicUuid)
          .toBe(BLE_UUIDS.userParametersCharacteristic);
        expect(request.write.payloadHex).toBe(scenario.payloadHex);
        if (scenario.profile === 'garline') {
          expect(request.policy).toEqual(jasmine.objectContaining({
            allowGarlinePhase1ImmediateWrite: true,
          }));
          expect(request.authorization).toBeNull();
        }
      },
    );
  }

  it('should keep Moventiv settings visible when user and pro reads are unavailable',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = moventivGarlineUnavailableParameterLoadResult(
        'moventiv-60',
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'confirm' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'moventiv-60' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('moventiv-60') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();

      expect(component.showUserSpeedControls).toBeTrue();
      expect(component.showUserTimingControls).toBeTrue();
      expect(component.showUserPeripheralControls).toBeTrue();
      expect(component.showWeightRangeControls).toBeTrue();
      expect(component.showProfessionalInputControls).toBeTrue();
      expect(component.showProfessionalScalarControls).toBeTrue();
      expect(component.currentUserTimingValue(
        component.userTimingControls[0].config,
      )).toBe(1);
      expect(component.canChangeProfessionalInput(
        component.professionalInputControls[0].config,
        'radar',
      )).toBeFalse();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should keep Garline Phase 1 settings visible when user and pro reads are unavailable',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = moventivGarlineUnavailableParameterLoadResult(
        'garline',
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'confirm' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'garline' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('garline') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();

      expect(component.showUserSpeedControls).toBeTrue();
      expect(component.showUserTimingControls).toBeTrue();
      expect(component.showUserPeripheralControls).toBeTrue();
      expect(component.showProfessionalScalarControls).toBeTrue();
      expect(component.showProfessionalAccessPrompt).toBeTrue();
      expect(component.showLockModeControls).toBeFalse();
      expect(component.showWeightRangeControls).toBeFalse();
      expect(component.showProfessionalInputControls).toBeFalse();
      expect(component.currentUserTimingValue(
        component.userTimingControls[0].config,
      )).toBe(1);
      expect(component.userTimingControls.map((control) =>
        control.config.field,
      )).toEqual(['short-timing', 'long-timing']);
      expect(component.visibleProfessionalScalarControls.map((control) =>
        control.config.field,
      )).toEqual(['near-open-speed', 'near-close-speed']);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should write Moventiv speed on release and not create a false authorization',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = completeLoadResult(
        'success',
        'moventiv-60',
        userValueWithSpeeds(60, 70),
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      writeExecutionService.nextResult = userSpeedExecutionResult(
        'moventiv-60',
        'open-speed',
        '01 3d',
      );

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create').and.resolveTo({
                present: async () => undefined,
                onDidDismiss: async () => ({ role: 'confirm' }),
              }),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'moventiv-60' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('moventiv-60') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();
      const control = component.userSpeedControls[0].config;

      component.toggleUserSpeedLock(control);
      component.setUserSpeedDraftValue(control, 61);
      component.onUserSpeedSliderReleased(control);
      await waitForCondition(() =>
        writeExecutionService.execute.calls.count() === 1,
      );

      const request = writeExecutionService.execute.calls.mostRecent()
        .args[0] as LegacyBleWriteRequest;
      expect(request.authorization).toBeNull();
      expect(request.policy).toEqual(jasmine.objectContaining({
        allowMoventivPhase1ImmediateWrite: true,
      }));
      expect(component.showApplyButtonForProfile('moventiv-60')).toBeFalse();
      expect(component.showApplyButtonForProfile('garline')).toBeFalse();
    },
  );

  it('should write Moventiv +/- slider changes after the Phase 1 delay',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = completeLoadResult(
        'success',
        'moventiv-80',
        userValueWithSpeeds(60, 70),
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      writeExecutionService.nextResult = userSpeedExecutionResult(
        'moventiv-80',
        'open-speed',
        '01 3d',
      );

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create').and.resolveTo({
                present: async () => undefined,
                onDidDismiss: async () => ({ role: 'confirm' }),
              }),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'moventiv-80' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('moventiv-80') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();
      const control = component.userSpeedControls[0].config;

      component.toggleUserSpeedLock(control);
      component.stepUserSpeedDraft(control, 1);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      await new Promise((resolve) => window.setTimeout(resolve, 430));

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
    },
  );
});

describe('ProductPage timing controls for profile variants', () => {
  for (const scenario of [
    {
      profile: 'moventiv-60',
      controls: ['short-timing'],
      short: 4,
      long: 10,
      accepted: 0,
      invalid: 61,
      operation: 'short-timing',
      payloadHex: '03 00',
      serviceUuid: BLE_UUIDS.moventivGarlineService,
      range: { min: 0, max: 60 },
      unit: 's',
    },
    {
      profile: 'moventiv-80',
      controls: ['short-timing'],
      short: 4,
      long: 10,
      accepted: 60,
      invalid: -1,
      operation: 'short-timing',
      payloadHex: '03 3c',
      serviceUuid: BLE_UUIDS.moventivGarlineService,
      range: { min: 0, max: 60 },
      unit: 's',
    },
    {
      profile: 'garline',
      controls: ['short-timing', 'long-timing'],
      short: 4,
      long: 10,
      accepted: 30,
      invalid: 0,
      operation: 'long-timing',
      payloadHex: '04 1e',
      serviceUuid: BLE_UUIDS.moventivGarlineService,
      range: { min: 1, max: 60 },
      unit: 'min',
    },
  ] as const) {
    it(`should apply ${scenario.profile} timing ranges and writes`,
      async () => {
        const bleService = new FakeBleService();
        const loadService = new FakeProductDataLoadService();
        loadService.nextResult = completeLoadResult(
          'success',
          scenario.profile,
          userValueWithTimings(scenario.short, scenario.long),
        );
        const writeExecutionService = new FakeBleWriteExecutionService();
        writeExecutionService.nextResult = userTimingExecutionResult(
          scenario.profile,
          scenario.operation,
          scenario.payloadHex,
        );

        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
          imports: [ProductPage],
          providers: [
            { provide: BleService, useValue: bleService },
            {
              provide: AlertController,
              useValue: {
                create: jasmine.createSpy('create').and.resolveTo({
                  present: async () => undefined,
                  onDidDismiss: async () => ({ role: 'confirm' }),
                }),
              },
            },
            {
              provide: BleWriteExecutionService,
              useValue: writeExecutionService,
            },
            { provide: ProductDataLoadService, useValue: loadService },
            { provide: ProductDetection, useClass: ProductDetection },
            {
              provide: ActivatedRoute,
              useValue: {
                snapshot: { data: { profile: scenario.profile } },
              },
            },
            {
              provide: Router,
              useValue: {
                getCurrentNavigation: () => ({
                  extras: { state: navigationState(scenario.profile) },
                }),
                navigate: jasmine.createSpy('navigate').and.resolveTo(true),
              },
            },
          ],
        }).compileComponents();

        const fixture = TestBed.createComponent(ProductPage);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        await component.refreshProductData();
        const timingControl = component.userTimingControls.find((control) =>
          control.config.field === scenario.operation,
        )?.config;

        expect(component.userTimingControls.map((control) =>
          control.config.field,
        )).toEqual(scenario.controls);
        expect(timingControl).toBeDefined();
        expect(timingControl?.range).toEqual(scenario.range);
        expect(timingControl?.unit).toBe(scenario.unit);
        expect(component.currentUserTimingValue(timingControl!))
          .toBe(scenario.operation === 'short-timing'
            ? scenario.short
            : scenario.long);

        component.setUserTimingDraftValue(timingControl!, scenario.invalid);
        await component.requestUserTimingChange(timingControl!);
        expect(writeExecutionService.execute).not.toHaveBeenCalled();

        component.setUserTimingDraftValue(timingControl!, scenario.accepted);
        await component.requestUserTimingChange(timingControl!);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.profile).toBe(scenario.profile);
        expect(request.write.operation).toBe(scenario.operation);
        expect(request.write.serviceUuid).toBe(scenario.serviceUuid);
        expect(request.write.characteristicUuid)
          .toBe(BLE_UUIDS.userParametersCharacteristic);
        expect(request.write.payloadHex).toBe(scenario.payloadHex);
        if (scenario.profile === 'garline') {
          expect(request.policy).toEqual(jasmine.objectContaining({
            allowGarlinePhase1ImmediateWrite: true,
          }));
          expect(request.authorization).toBeNull();
        }
      },
    );
  }

  it('should keep Garline short and long timing drafts independent',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = completeLoadResult(
        'success',
        'garline',
        userValueWithTimings(4, 10),
      );
      const writeExecutionService = new FakeBleWriteExecutionService();

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create').and.resolveTo({
                present: async () => undefined,
                onDidDismiss: async () => ({ role: 'confirm' }),
              }),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'garline' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('garline') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();
      const shortControl = component.userTimingControls[0].config;
      const longControl = component.userTimingControls[1].config;

      component.setUserTimingDraftValue(longControl, 30);

      expect(component.userTimingDraftValue(shortControl)).toBe(4);
      expect(component.userTimingDraftValue(longControl)).toBe(30);
      expect(component.canApplyUserTiming(shortControl)).toBeFalse();
      expect(component.canApplyUserTiming(longControl)).toBeTrue();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );
});

describe('ProductPage user lighting controls for profile variants', () => {
  for (const scenario of [
    {
      profile: 'moventiv-60',
      current: {
        staticLight: true,
        dynamicLight: true,
        rgbIndicator: false,
      },
      controls: ['static-light', 'dynamic-light', 'rgb'],
      field: 'dynamic-light',
      checked: false,
      operation: 'dynamic-light',
      payloadHex: '05 07 02',
      payload: [0x05, 0x07, 0x02],
    },
    {
      profile: 'garline',
      current: {
        staticLight: false,
        dynamicLight: true,
        rgbIndicator: true,
      },
      controls: ['static-light', 'dynamic-light', 'rgb'],
      field: 'static-light',
      checked: true,
      operation: 'static-light',
      payloadHex: '05 06 01',
      payload: [0x05, 0x06, 0x01],
    },
  ] as const) {
    it(`should apply ${scenario.profile} user lighting writes`,
      async () => {
        const bleService = new FakeBleService();
        const loadService = new FakeProductDataLoadService();
        loadService.nextResult = completeLoadResult(
          'success',
          scenario.profile,
          userValueWithPeripherals(scenario.current),
        );
        const writeExecutionService = new FakeBleWriteExecutionService();
        writeExecutionService.nextResult = userPeripheralExecutionResult(
          scenario.profile,
          scenario.operation,
          scenario.payloadHex,
        );

        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
          imports: [ProductPage],
          providers: [
            { provide: BleService, useValue: bleService },
            {
              provide: AlertController,
              useValue: {
                create: jasmine.createSpy('create').and.resolveTo({
                  present: async () => undefined,
                  onDidDismiss: async () => ({ role: 'confirm' }),
                }),
              },
            },
            {
              provide: BleWriteExecutionService,
              useValue: writeExecutionService,
            },
            { provide: ProductDataLoadService, useValue: loadService },
            { provide: ProductDetection, useClass: ProductDetection },
            {
              provide: ActivatedRoute,
              useValue: {
                snapshot: { data: { profile: scenario.profile } },
              },
            },
            {
              provide: Router,
              useValue: {
                getCurrentNavigation: () => ({
                  extras: { state: navigationState(scenario.profile) },
                }),
                navigate: jasmine.createSpy('navigate').and.resolveTo(true),
              },
            },
          ],
        }).compileComponents();

        const fixture = TestBed.createComponent(ProductPage);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        await component.refreshProductData();
        fixture.detectChanges();
        const control = component.userPeripheralControls.find(
          (candidate) => candidate.config.field === scenario.field,
        )?.config;

        expect(component.showUserPeripheralControls).toBeTrue();
        expect(component.userPeripheralControls.map((candidate) =>
          candidate.config.field,
        )).toEqual(scenario.controls);
        expect(control).toBeDefined();
        await component.requestUserPeripheralChange(
          control!,
          scenario.checked,
        );

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.profile).toBe(scenario.profile);
        expect(request.write.operation).toBe(scenario.operation);
        expect(request.write.serviceUuid)
          .toBe(BLE_UUIDS.moventivGarlineService);
        expect(request.write.characteristicUuid)
          .toBe(BLE_UUIDS.userParametersCharacteristic);
        expect(request.write.payloadHex).toBe(scenario.payloadHex);
        expect(Array.from(request.write.payload)).toEqual(scenario.payload);
        expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
        expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
        if (scenario.profile === 'garline') {
          expect(request.policy).toEqual(jasmine.objectContaining({
            allowGarlinePhase1ImmediateWrite: true,
          }));
          expect(request.authorization).toBeNull();
        }
        expect(component.userPeripheralWriteState.status).toBe('sent');
      },
    );
  }
});

describe('ProductPage Phase 1 commands tab presentation', () => {
  for (const scenario of [
    {
      profile: 'widoor',
      commands: [
        'motor-open',
        'motor-close',
        'motor-open-short-timed',
      ],
      commandLighting: [],
      basicLighting: ['rgb'],
      locks: [],
      timedAssetCount: 1,
    },
    {
      profile: 'moventiv-60',
      commands: [
        'motor-open',
        'motor-close',
        'motor-open-short-timed',
      ],
      commandLighting: ['static-light'],
      basicLighting: ['dynamic-light', 'rgb'],
      locks: ['locked-closed'],
      timedAssetCount: 1,
    },
    {
      profile: 'moventiv-80',
      commands: [
        'motor-open',
        'motor-close',
        'motor-open-short-timed',
      ],
      commandLighting: ['static-light'],
      basicLighting: ['dynamic-light', 'rgb'],
      locks: ['locked-closed'],
      timedAssetCount: 1,
    },
    {
      profile: 'garline',
      commands: [
        'motor-open',
        'motor-close',
        'motor-open-short-timed',
      ],
      commandLighting: ['static-light'],
      basicLighting: ['dynamic-light', 'rgb'],
      locks: [],
      timedAssetCount: 1,
    },
  ] as const) {
    it(`should render Phase 1 command affordances for ${scenario.profile}`,
      async () => {
        const {
          fixture,
          component,
          writeExecutionService,
          bleService,
        } = await createProductCommandsUiPage(scenario.profile);
        const element = fixture.nativeElement as HTMLElement;

        expect(component.activeMainTab).toBe('commands');
        expect(component.productCommands.map((command) =>
          command.config.operation,
        )).toEqual([...scenario.commands]);
        expect(component.lockModeControls.map((control) =>
          control.config.mode,
        )).toEqual([...scenario.locks]);
        expect(component.commandUserPeripheralControls.map((control) =>
          control.config.field,
        )).toEqual([...scenario.commandLighting]);
        expect(component.basicUserPeripheralControls.map((control) =>
          control.config.field,
        )).toEqual([...scenario.basicLighting]);

        expect(element.querySelector<HTMLImageElement>(
          '.widoor-open-command img',
        )?.getAttribute('src')).toBe('assets/img/icon_command_open.svg');
        expect(element.querySelector<HTMLImageElement>(
          '.widoor-close-command img',
        )?.getAttribute('src')).toBe('assets/img/icon_command_close.svg');
        expect(Array.from(element.querySelectorAll<HTMLImageElement>(
          '.widoor-timed-command img',
        )).map((image) => image.getAttribute('src'))).toEqual(
          Array.from(
            { length: scenario.timedAssetCount },
            () => 'assets/img/icon_command_openThenClose.svg',
          ),
        );
        expect(
          element.querySelectorAll(
            '.user-peripheral-command-controls .user-peripheral-toggle',
          ).length,
        ).toBe(scenario.commandLighting.length);
        expect(element.querySelectorAll(
          '.lock-mode-controls .lock-mode-toggle',
        ).length).toBe(scenario.locks.length);
        expect(element.textContent).not.toContain(
          component.text.lockModeControls.lockedOpen.label,
        );
        if (scenario.profile === 'widoor' || scenario.profile === 'garline') {
          expect(element.querySelector('.lock-mode-controls')).toBeNull();
          expect(element.textContent).not.toContain(
            component.text.lockModeControls.lockedClosed.label,
          );
        }
        if (scenario.profile === 'moventiv-60' ||
            scenario.profile === 'moventiv-80') {
          expect(element.querySelector('.moventiv-close-lock-command'))
            .not.toBeNull();
          expect(element.textContent).not.toContain(
            component.text.lockModeControls.title,
          );
          expect(element.textContent).toContain(
            component.text.lockModeControls.lockedClosed.label,
          );
        }
        if (scenario.commandLighting.length > 0) {
          expect(element.querySelector<HTMLImageElement>(
            '.user-peripheral-command-controls .cmd-row-icon',
          )?.getAttribute('src')).toBe('assets/img/icon_light_on.svg');
        }
        const commandsSection = element.querySelector<HTMLElement>(
          '[aria-labelledby="commands-title"]',
        );
        expect(commandsSection).not.toBeNull();
        expect(commandsSection?.querySelector('.command-history')).toBeNull();
        expect(commandsSection?.querySelector('.command-warning')).toBeNull();
        expect(commandsSection?.querySelector('.command-state')).toBeNull();
        expect(commandsSection?.querySelector('.command-secondary-message'))
          .toBeNull();
        expect(commandsSection?.textContent).not.toContain(
          component.text.commandHistory.title,
        );
        expect(commandsSection?.textContent).not.toContain(
          component.text.widoorCommands.warning,
        );
        expect(commandsSection?.textContent).not.toContain('payload');
        expect(commandsSection?.textContent).not.toContain('Code :');
        expect(writeExecutionService.execute).not.toHaveBeenCalled();
        expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
      },
    );
  }

  it('should keep product command clicks routed through the existing handler',
    async () => {
      const { fixture, component, writeExecutionService } =
        await createProductCommandsUiPage('moventiv-60');
      const element = fixture.nativeElement as HTMLElement;
      const openButton = element
        .querySelector<HTMLIonButtonElement>('ion-button.widoor-open-command');
      const requestProductCommand = spyOn(component, 'requestProductCommand')
        .and.resolveTo();

      openButton?.click();
      fixture.detectChanges();

      expect(requestProductCommand).toHaveBeenCalledOnceWith(
        component.productCommands[0].config,
      );
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  for (const profile of ['moventiv-60', 'moventiv-80'] as const) {
    it(`should write only the Phase 1 close lock command for ${profile}`,
      async () => {
        const { fixture, component, writeExecutionService, loadService } =
          await createProductCommandsUiPage(profile);
        const closeControl = component.lockModeControls[0].config;

        expect(component.lockModeControls.map((control) =>
          control.config.mode,
        )).toEqual(['locked-closed']);
        expect(component.showLockModeControls).toBeTrue();
        expect(component.moventivCloseLockControl?.config)
          .toBe(closeControl);
        expect(fixture.nativeElement.textContent).not.toContain(
          component.text.lockModeControls.lockedOpen.label,
        );

        for (const transition of [
          {
            checked: true,
            payloadHex: '00 02',
            payload: [0x00, 0x02],
            current: 'none',
          },
          {
            checked: false,
            payloadHex: '00 00',
            payload: [0x00, 0x00],
            current: 'locked-closed',
          },
        ] as const) {
          loadService.nextResult = completeLoadResult(
            'success',
            profile,
            userValueWithLockMode(transition.current),
          );
          writeExecutionService.nextResult = lockModeExecutionResult(
            profile,
            transition.payloadHex,
          );
          writeExecutionService.execute.calls.reset();
          await component.refreshProductData();

          await component.requestLockModeChange(
            closeControl,
            transition.checked,
          );

          expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
          const request = writeExecutionService.execute.calls.mostRecent()
            .args[0] as LegacyBleWriteRequest;
          expect(request.profile).toBe(profile);
          expect(request.write.operation).toBe('lock-mode');
          expect(request.write.serviceUuid)
            .toBe(BLE_UUIDS.moventivGarlineService);
          expect(request.write.characteristicUuid)
            .toBe(BLE_UUIDS.userParametersCharacteristic);
          expect(request.write.payloadHex).toBe(transition.payloadHex);
          expect(Array.from(request.write.payload))
            .toEqual(transition.payload);
          expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
          expect(request.policy).toEqual(jasmine.objectContaining({
            allowMoventivPhase1ImmediateWrite: true,
          }));
          expect(request.authorization).toBeNull();
          expect(component.lockModeWriteState.status).toBe('sent');
        }
      },
    );
  }

  for (const scenario of [
    {
      profile: 'widoor',
      basicLighting: ['rgb'],
      timings: ['short-timing'],
      basicWeight: false,
      advancedWeight: false,
    },
    {
      profile: 'moventiv-60',
      basicLighting: ['dynamic-light', 'rgb'],
      timings: ['short-timing'],
      basicWeight: true,
      advancedWeight: false,
    },
    {
      profile: 'moventiv-80',
      basicLighting: ['dynamic-light', 'rgb'],
      timings: ['short-timing'],
      basicWeight: true,
      advancedWeight: false,
    },
    {
      profile: 'garline',
      basicLighting: ['dynamic-light', 'rgb'],
      timings: ['short-timing', 'long-timing'],
      basicWeight: false,
      advancedWeight: false,
    },
  ] as const) {
    it(`should render Phase 1 basic settings affordances for ${scenario.profile}`,
      async () => {
        const { fixture, component, writeExecutionService, bleService } =
          await createProductCommandsUiPage(scenario.profile);

        component.setActiveMainTab('settings');
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const basicPanel = element.querySelector<HTMLElement>(
          '.basic-settings-panel',
        );

        expect(basicPanel).not.toBeNull();
        expect(component.userSpeedControls.map((control) =>
          control.config.field,
        )).toEqual(['open-speed', 'close-speed']);
        expect(component.userTimingControls.map((control) =>
          control.config.field,
        )).toEqual([...scenario.timings]);
        expect(component.basicUserPeripheralControls.map((control) =>
          control.config.field,
        )).toEqual([...scenario.basicLighting]);
        expect(component.showBasicWeightRangeControls)
          .toBe(scenario.basicWeight);
        expect(component.showAdvancedWeightRangeControls)
          .toBe(scenario.advancedWeight);

        const basicText = basicPanel?.textContent ?? '';
        expect(basicPanel?.querySelector('.read-state')).toBeNull();
        expect(basicPanel?.querySelector('.read-state-detail')).toBeNull();
        expect(basicPanel?.querySelector('.basic-technical-details')).toBeNull();
        expect(basicText).not.toContain(component.text.readonlyNotice);
        expect(basicText).not.toContain(component.text.technicalDetails);
        expect(basicText).not.toContain(component.text.rawFrame);
        expect(basicText).not.toContain(component.text.serviceUuid);
        expect(basicText).not.toContain(component.text.characteristicUuid);
        expect(basicText).not.toContain(
          component.text.errors.characteristicAbsent,
        );

        expect(basicPanel?.querySelector<HTMLImageElement>(
          'img[src="assets/img/icon_speed.svg"]',
        )).not.toBeNull();
        expect(basicPanel?.querySelector<HTMLImageElement>(
          'img[src="assets/img/icon_delay.svg"]',
        )).not.toBeNull();
        expect(basicPanel?.querySelector<HTMLImageElement>(
          'img[src="assets/img/icon_room_other.svg"]',
        )).not.toBeNull();
        expect(basicPanel?.querySelectorAll<HTMLImageElement>(
          'img[src="assets/img/icon_light_off.svg"]',
        ).length).toBe(scenario.basicLighting.length);
        const basicToggleLabels = Array.from(
          basicPanel?.querySelectorAll<HTMLElement>(
            '.basic-toggle-row ion-label',
          ) ?? [],
        ).map((label) => label.textContent?.trim() ?? '');
        expect(basicToggleLabels).not.toContain(
          component.text.user.staticLight,
        );

        expect(writeExecutionService.execute).not.toHaveBeenCalled();
        expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
      },
    );
  }

  for (const scenario of [
    {
      profile: 'widoor',
      advancedScalars: [
        'break-force-at-open',
        'near-open-speed',
        'near-close-speed',
      ],
      sensitiveActions: ['learning', 'reset'],
      absentActions: [],
    },
    {
      profile: 'moventiv-60',
      advancedScalars: ['near-open-speed', 'near-close-speed'],
      sensitiveActions: ['learning'],
      absentActions: ['reset'],
    },
    {
      profile: 'moventiv-80',
      advancedScalars: ['near-open-speed', 'near-close-speed'],
      sensitiveActions: ['learning'],
      absentActions: ['reset'],
    },
    {
      profile: 'garline',
      advancedScalars: ['near-open-speed', 'near-close-speed'],
      sensitiveActions: ['learning'],
      absentActions: ['reset'],
    },
  ] as const) {
    it(`should render Phase 1 advanced settings without V2.1 diagnostics for ${scenario.profile}`,
      async () => {
        const { fixture, component, writeExecutionService, bleService } =
          await createProductCommandsUiPage(scenario.profile);

        component.setActiveMainTab('settings');
        component.setActiveSettingsTab('advanced');
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const settingsSection = element.querySelector<HTMLElement>(
          'section[aria-labelledby="settings-title"]',
        );
        const settingsText = settingsSection?.textContent ?? '';

        expect(settingsSection).not.toBeNull();
        expect(settingsSection?.querySelector('.read-state')).toBeNull();
        expect(settingsSection?.querySelector('.read-state-detail')).toBeNull();
        expect(settingsSection?.querySelector('.basic-technical-details'))
          .toBeNull();
        expect(settingsSection?.querySelector('.advanced-technical-details'))
          .toBeNull();
        expect(settingsText).not.toContain(component.text.technicalDetails);
        expect(settingsText).not.toContain(component.text.rawFrame);
        expect(settingsText).not.toContain(component.text.serviceUuid);
        expect(settingsText).not.toContain(component.text.characteristicUuid);
        expect(settingsText).not.toContain(component.text.sensitiveActions.title);
        expect(settingsText).not.toContain(
          component.text.sensitiveActions.notice,
        );
        expect(settingsText).not.toContain(
          component.text.professionalPeripheralDiagnostics.title,
        );
        expect(settingsText).not.toContain(
          component.text.errors.characteristicAbsent,
        );
        expect(settingsText).not.toContain('Phase 1');
        expect(settingsText).not.toContain('Phase 2');

        for (const field of scenario.advancedScalars) {
          expect(settingsSection?.querySelector(
            `[data-professional-scalar-field="${field}"]`,
          )).not.toBeNull();
        }
        for (const action of scenario.sensitiveActions) {
          expect(settingsSection?.querySelector(
            `[data-sensitive-action="${action}"]`,
          )).not.toBeNull();
        }
        for (const action of scenario.absentActions) {
          expect(settingsSection?.querySelector(
            `[data-sensitive-action="${action}"]`,
          )).toBeNull();
        }

        expect(writeExecutionService.execute).not.toHaveBeenCalled();
        expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
      },
    );
  }

  it('should keep basic slider lock and steppers on the existing draft flow',
    async () => {
      const { fixture, component, writeExecutionService } =
        await createProductCommandsUiPage('widoor');
      const openSpeed = component.userSpeedControls[0].config;

      component.setActiveMainTab('settings');
      fixture.detectChanges();

      let element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('.basic-precision-row')).toBeNull();

      component.toggleUserSpeedLock(openSpeed);
      fixture.detectChanges();
      element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('.basic-precision-row')).not.toBeNull();

      component.setUserSpeedDraftValue(openSpeed, openSpeed.range.min);
      component.stepUserSpeedDraft(openSpeed, -1);
      expect(component.userSpeedDraftValue(openSpeed)).toBe(openSpeed.range.min);

      component.setUserSpeedDraftValue(openSpeed, openSpeed.range.max);
      component.stepUserSpeedDraft(openSpeed, 1);
      expect(component.userSpeedDraftValue(openSpeed)).toBe(openSpeed.range.max);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  for (const scenario of [
    {
      profile: 'widoor',
      generalRows: [],
      absentGeneralRows: ['maximum-weight', 'current-weight-range'],
      maintenanceRows: [],
      absentMaintenanceRows: ['last-maintenance', 'cycles-since-maintenance'],
      supplementalRows: [
        'initializations',
        'cycles-since-init',
        'obstacles',
        'encoder-errors',
        'motor-errors',
      ],
      absentSupplementalRows: ['learning', 'wrong-open', 'wrong-close'],
    },
    {
      profile: 'moventiv-60',
      generalRows: ['maximum-weight', 'current-weight-range'],
      absentGeneralRows: [],
      maintenanceRows: ['last-maintenance', 'cycles-since-maintenance'],
      absentMaintenanceRows: [],
      supplementalRows: [
        'initializations',
        'cycles-since-init',
        'obstacles',
        'learning',
      ],
      absentSupplementalRows: [
        'encoder-errors',
        'motor-errors',
        'wrong-open',
        'wrong-close',
      ],
    },
    {
      profile: 'moventiv-80',
      generalRows: ['maximum-weight', 'current-weight-range'],
      absentGeneralRows: [],
      maintenanceRows: ['last-maintenance', 'cycles-since-maintenance'],
      absentMaintenanceRows: [],
      supplementalRows: [
        'initializations',
        'cycles-since-init',
        'obstacles',
        'learning',
      ],
      absentSupplementalRows: [
        'encoder-errors',
        'motor-errors',
        'wrong-open',
        'wrong-close',
      ],
    },
    {
      profile: 'garline',
      generalRows: ['maximum-weight', 'current-weight-range'],
      absentGeneralRows: [],
      maintenanceRows: ['last-maintenance', 'cycles-since-maintenance'],
      absentMaintenanceRows: [],
      supplementalRows: [
        'initializations',
        'cycles-since-init',
        'obstacles',
        'learning',
      ],
      absentSupplementalRows: [
        'encoder-errors',
        'motor-errors',
        'wrong-open',
        'wrong-close',
      ],
    },
  ] as const) {
    it(`should render Phase 1 information lists for ${scenario.profile}`,
      async () => {
        const { fixture, component, writeExecutionService, bleService } =
          await createProductCommandsUiPage(scenario.profile);

        component.setActiveMainTab('information');
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const informationSection = element.querySelector<HTMLElement>(
          'section[aria-labelledby="information-title"]',
        );
        const informationLists = informationSection?.querySelectorAll(
          '.product-information-list',
        );
        const informationText = informationSection?.textContent ?? '';

        expect(informationSection).not.toBeNull();
        expect(informationLists?.length).toBeGreaterThanOrEqual(4);
        expect(informationSection?.querySelector('.read-state')).toBeNull();
        expect(informationSection?.querySelector('.read-state-detail'))
          .toBeNull();
        expect(informationSection?.querySelector('.product-information-technical'))
          .toBeNull();
        expect(informationText).not.toContain(component.text.technicalDetails);
        expect(informationText).not.toContain(component.text.rawFrame);
        expect(informationText).not.toContain(component.text.serviceUuid);
        expect(informationText).not.toContain(component.text.characteristicUuid);
        expect(informationText).not.toContain('Phase 1');
        expect(informationText).not.toContain('Phase 2');
        for (const row of scenario.generalRows) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).not.toBeNull();
        }
        for (const row of scenario.absentGeneralRows) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).toBeNull();
        }
        expect(informationSection?.textContent)
          .toContain(component.text.noMotorState);
        expect(informationSection?.querySelector(
          '.product-information-row[data-info-row="first-commissioning"]',
        )).not.toBeNull();
        expect(informationSection?.querySelector(
          '.product-information-row[data-info-row="total-cycles"]',
        )).not.toBeNull();
        for (const row of scenario.maintenanceRows) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).not.toBeNull();
        }
        for (const row of scenario.absentMaintenanceRows) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).toBeNull();
        }
        for (const row of scenario.supplementalRows) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).not.toBeNull();
        }
        for (const row of scenario.absentSupplementalRows) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).toBeNull();
        }
        expect(informationSection?.querySelector(
          '.product-information-row[data-info-row="motor-version"]',
        )).not.toBeNull();
        expect(informationSection?.querySelector(
          '.product-information-row[data-info-row="ble-version"]',
        )).not.toBeNull();
        expect(informationSection?.querySelector(
          '.product-information-row[data-info-row="stack-version"]',
        )).not.toBeNull();
        expect(informationSection?.querySelector(
          '.product-information-row[data-info-row="control-hardware"]',
        )).not.toBeNull();
        if (scenario.profile === 'widoor') {
          expect(informationSection?.querySelector(
            '.product-information-row[data-info-row="motor-address"]',
          )).toBeNull();
        } else {
          expect(informationSection?.querySelector(
            '.product-information-row[data-info-row="motor-address"]',
          )).not.toBeNull();
        }
        if (scenario.profile === 'garline') {
          expect(informationText).toContain('140 kg');
        }
        expect(informationSection?.querySelector(
          'ion-button',
        )).toBeNull();
        expect(writeExecutionService.execute).not.toHaveBeenCalled();
        expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
      },
    );
  }

  for (const scenario of [
    {
      profile: 'widoor',
      visibleSwitches: ['ble-switch', 'automatic-manual', 'direction', 'pairing'],
      hiddenSwitches: ['push-and-go'],
    },
    {
      profile: 'moventiv-60',
      visibleSwitches: [
        'push-and-go',
        'ble-switch',
        'automatic-manual',
        'direction',
        'pairing',
      ],
      hiddenSwitches: [],
    },
    {
      profile: 'moventiv-80',
      visibleSwitches: [
        'push-and-go',
        'ble-switch',
        'automatic-manual',
        'direction',
        'pairing',
      ],
      hiddenSwitches: [],
    },
    {
      profile: 'garline',
      visibleSwitches: ['ble-switch', 'pairing'],
      hiddenSwitches: ['push-and-go', 'automatic-manual', 'direction'],
    },
  ] as const) {
    it(`should render only Phase 1 motor switch information for ${scenario.profile}`,
      async () => {
        const { fixture, component } =
          await createProductCommandsUiPage(scenario.profile);

        component.viewModel = {
          ...component.viewModel,
          motorState: {
            rawHex: '01 0a 64 07 ff',
            length: 5,
            state: 1,
            currentPosition: 10,
            maximumPosition: 100,
            error: 7,
            switches: {
              raw: 0xff,
              unknownHighBits: 0xf8,
              pushAndGo: true,
              ble: true,
              automaticManual: false,
              direction: true,
              pairing: false,
            },
          },
        };
        component.setActiveMainTab('information');
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const informationSection = element.querySelector<HTMLElement>(
          'section[aria-labelledby="information-title"]',
        );
        const informationText = informationSection?.textContent ?? '';

        for (const row of scenario.visibleSwitches) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).not.toBeNull();
        }
        for (const row of scenario.hiddenSwitches) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).toBeNull();
        }
        for (const row of [
          'motor-raw-state',
          'motor-state-label',
          'motor-position',
          'motor-maximum',
          'motor-percentage',
          'motor-error',
          'motor-switches',
        ]) {
          expect(informationSection?.querySelector(
            `.product-information-row[data-info-row="${row}"]`,
          )).toBeNull();
        }
        expect(informationText).not.toContain(component.text.motor.rawState);
        expect(informationText).not.toContain(component.text.motor.stateLabel);
        expect(informationText).not.toContain(component.text.motor.switchesRaw);
      },
    );
  }

  it('should hide V2.1 technical information without triggering writes',
    async () => {
      const { fixture, component, writeExecutionService, bleService } =
        await createProductCommandsUiPage('moventiv-80');

      component.setActiveMainTab('information');
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const technicalDetails = element.querySelector<HTMLDetailsElement>(
        '.product-information-technical',
      );

      expect(technicalDetails).toBeNull();
      expect(element.textContent).not.toContain(component.text.technicalDetails);
      expect(element.textContent).not.toContain(component.text.rawFrame);
      expect(element.textContent).not.toContain(component.text.serviceUuid);
      expect(element.textContent).not.toContain(
        component.text.characteristicUuid,
      );

      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  async function createProductCommandsUiPage(
    profile: KnownProductProfile,
  ): Promise<{
    readonly fixture: ComponentFixture<ProductPage>;
    readonly component: ProductPage;
    readonly bleService: FakeBleService;
    readonly loadService: FakeProductDataLoadService;
    readonly writeExecutionService: FakeBleWriteExecutionService;
  }> {
    const bleService = new FakeBleService();
    const loadService = new FakeProductDataLoadService();
    loadService.nextResult = completeLoadResult(
      'success',
      profile,
      userValueWithPeripherals({
        staticLight: true,
        dynamicLight: false,
        rgbIndicator: false,
      }),
    );
    const writeExecutionService = new FakeBleWriteExecutionService();

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProductPage],
      providers: [
        { provide: BleService, useValue: bleService },
        {
          provide: AlertController,
          useValue: {
            create: jasmine.createSpy('create').and.resolveTo({
              present: async () => undefined,
              onDidDismiss: async () => ({ role: 'confirm' }),
            }),
          },
        },
        { provide: BleWriteExecutionService, useValue: writeExecutionService },
        { provide: ProductDataLoadService, useValue: loadService },
        { provide: ProductDetection, useClass: ProductDetection },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { profile } } },
        },
        {
          provide: Router,
          useValue: {
            getCurrentNavigation: () => ({
              extras: { state: navigationState(profile) },
            }),
            navigate: jasmine.createSpy('navigate').and.resolveTo(true),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await component.refreshProductData();
    fixture.detectChanges();

    return {
      fixture,
      component,
      bleService,
      loadService,
      writeExecutionService,
    };
  }
});

describe('ProductPage weight-range controls for profile variants', () => {
  async function createWeightRangePage(
    profile: Exclude<KnownProductProfile, 'widoor'>,
    lower: number,
    upper: number,
    result: LegacyBleWriteExecutionResult = weightRangeExecutionResult(
      profile,
      '00 32 3c',
    ),
  ): Promise<{
    readonly component: ProductPage;
    readonly fixture: ComponentFixture<ProductPage>;
    readonly bleService: FakeBleService;
    readonly loadService: FakeProductDataLoadService;
    readonly writeExecutionService: FakeBleWriteExecutionService;
  }> {
    const bleService = new FakeBleService();
    const loadService = new FakeProductDataLoadService();
    loadService.nextResult = completeLoadResult(
      'success',
      profile,
      userValue(),
      professionalValue(profile, lower, upper),
    );
    const writeExecutionService = new FakeBleWriteExecutionService();
    writeExecutionService.nextResult = result;

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProductPage],
      providers: [
        { provide: BleService, useValue: bleService },
        {
          provide: AlertController,
          useValue: {
            create: jasmine.createSpy('create').and.resolveTo({
              present: async () => undefined,
              onDidDismiss: async () => ({ role: 'confirm' }),
            }),
          },
        },
        {
          provide: BleWriteExecutionService,
          useValue: writeExecutionService,
        },
        {
          provide: MaintenanceAccessService,
          useValue: new FakeMaintenanceAccessService(),
        },
        { provide: ProductDataLoadService, useValue: loadService },
        { provide: ProductDetection, useClass: ProductDetection },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { profile } } },
        },
        {
          provide: Router,
          useValue: {
            getCurrentNavigation: () => ({
              extras: { state: navigationState(profile) },
            }),
            navigate: jasmine.createSpy('navigate').and.resolveTo(true),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await component.refreshProductData();
    fixture.detectChanges();

    return {
      component,
      fixture,
      bleService,
      loadService,
      writeExecutionService,
    };
  }

  for (const scenario of [
    {
      profile: 'moventiv-60',
      current: { lower: 40, upper: 50 },
      accepted: { lower: 60, upper: 80 },
      invalid: { lower: 80, upper: 100 },
      payloadHex: '00 3c 50',
      ranges: [
        { lower: 10, upper: 20 },
        { lower: 20, upper: 30 },
        { lower: 30, upper: 40 },
        { lower: 40, upper: 50 },
        { lower: 50, upper: 60 },
        { lower: 60, upper: 80 },
      ],
    },
    {
      profile: 'moventiv-80',
      current: { lower: 50, upper: 60 },
      accepted: { lower: 60, upper: 80 },
      invalid: { lower: 80, upper: 100 },
      payloadHex: '00 3c 50',
      ranges: [
        { lower: 10, upper: 20 },
        { lower: 20, upper: 30 },
        { lower: 30, upper: 40 },
        { lower: 40, upper: 50 },
        { lower: 50, upper: 60 },
        { lower: 60, upper: 80 },
      ],
    },
  ] as const) {
    it(`should apply ${scenario.profile} weight ranges and writes`,
      async () => {
        const {
          component,
          fixture,
          writeExecutionService,
        } = await createWeightRangePage(
          scenario.profile,
          scenario.current.lower,
          scenario.current.upper,
          weightRangeExecutionResult(scenario.profile, scenario.payloadHex),
        );

        expect(component.weightRangeControls.map((control) =>
          control.config.range,
        )).toEqual(scenario.ranges);
        expect(component.currentWeightRangeValue()).toEqual(scenario.current);
        expect(component.weightRangeDraftValue()).toEqual(scenario.current);
        expect(fixture.nativeElement.textContent)
          .toContain(`${scenario.current.lower}–${scenario.current.upper}`);

        component.setWeightRangeDraftValue(scenario.invalid);
        await component.requestWeightRangeChange();
        expect(writeExecutionService.execute).not.toHaveBeenCalled();
        expect(component.weightRangeDraftValue()).toEqual(scenario.current);

        component.setWeightRangeDraftValue(scenario.accepted);
        expect(component.weightRangeDraftValue()).toEqual(scenario.accepted);
        expect(component.canApplyWeightRange()).toBeTrue();
        expect(writeExecutionService.execute).not.toHaveBeenCalled();

        await component.requestWeightRangeChange();

        expect(writeExecutionService.execute)
          .toHaveBeenCalledTimes(3);
        const requests = writeExecutionService.execute.calls.allArgs()
          .map(([request]) => request as LegacyBleWriteRequest);
        expect(requests.map((request) => request.write.operation))
          .toEqual(['open-speed', 'close-speed', 'weight-range']);
        expect(requests.map((request) => request.write.payloadHex))
          .toEqual(['01 4b', '02 46', scenario.payloadHex]);
        expect(requests.every((request) => request.authorization === null))
          .toBeTrue();
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.profile).toBe(scenario.profile);
        expect(request.write.operation).toBe('weight-range');
        expect(request.write.serviceUuid)
          .toBe(BLE_UUIDS.moventivGarlineService);
        expect(request.write.characteristicUuid)
          .toBe(BLE_UUIDS.professionalParametersCharacteristic);
        expect(request.write.payloadHex).toBe(scenario.payloadHex);
        expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
        expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
        expect(request.policy).toEqual(jasmine.objectContaining({
          allowMoventivPhase1ImmediateWrite: true,
        }));
        expect(request.authorization).toBeNull();
      },
    );
  }

  it('should not expose interactive Garline weight range tuning',
    async () => {
      const {
        component,
        fixture,
        writeExecutionService,
      } = await createWeightRangePage('garline', 80, 100);

      expect(component.weightRangeControls).toEqual([]);
      expect(component.showWeightRangeControls).toBeFalse();
      expect(component.showBasicWeightRangeControls).toBeFalse();
      expect(component.showAdvancedWeightRangeControls).toBeFalse();
      expect(fixture.nativeElement.querySelector('[data-weight-range]'))
        .toBeNull();

      await component.requestWeightRangeChange();

      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should keep Widoor weight range read-only and preserve other controls',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = completeLoadResult('success', 'widoor');
      const writeExecutionService = new FakeBleWriteExecutionService();

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create').and.resolveTo({
                present: async () => undefined,
                onDidDismiss: async () => ({ role: 'confirm' }),
              }),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'widoor' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('widoor') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();

      expect(component.showWeightRangeControls).toBeFalse();
      expect(component.weightRangeControls).toEqual([]);
      expect(component.showUserSpeedControls).toBeTrue();
      expect(component.showUserTimingControls).toBeTrue();
      expect(component.showLockModeControls).toBeFalse();
      expect(component.showProductMotorCommands).toBeTrue();

      await component.requestWeightRangeChange();

      expect(writeExecutionService.execute).not.toHaveBeenCalled();
    },
  );

  it('should leave the BLE value unchanged when a weight write fails',
    async () => {
      const {
        component,
        writeExecutionService,
      } = await createWeightRangePage(
        'moventiv-80',
        50,
        60,
        weightRangeExecutionResult('moventiv-80', '00 3c 50', 'failed'),
      );

      component.setWeightRangeDraftValue({ lower: 60, upper: 80 });
      writeExecutionService.nextResults = [
        userSpeedExecutionResult('moventiv-80', 'open-speed', '01 4b'),
        userSpeedExecutionResult('moventiv-80', 'close-speed', '02 46'),
        weightRangeExecutionResult('moventiv-80', '00 3c 50', 'failed'),
      ];
      await component.requestWeightRangeChange();

      expect(writeExecutionService.execute).toHaveBeenCalledTimes(3);
      expect(component.currentWeightRangeValue())
        .toEqual({ lower: 50, upper: 60 });
      expect(component.weightRangeDraftValue())
        .toEqual({ lower: 60, upper: 80 });
      expect(component.weightRangeWriteState.status).toBe('failed');
    },
  );

  it('should reset the weight draft after a BLE reload',
    async () => {
      const {
        component,
        loadService,
      } = await createWeightRangePage('moventiv-80', 50, 60);

      component.setWeightRangeDraftValue({ lower: 60, upper: 80 });
      expect(component.weightRangeDraftValue())
        .toEqual({ lower: 60, upper: 80 });

      loadService.nextResult = completeLoadResult(
        'success',
        'moventiv-80',
        userValue(),
        professionalValue('moventiv-80', 40, 50),
      );
      await component.refreshProductData();

      expect(component.currentWeightRangeValue())
        .toEqual({ lower: 40, upper: 50 });
      expect(component.weightRangeDraftValue())
        .toEqual({ lower: 40, upper: 50 });
    },
  );

  it('should reset weight editing on disconnection',
    async () => {
      const {
        component,
        bleService,
      } = await createWeightRangePage('moventiv-80', 50, 60);

      component.setWeightRangeDraftValue({ lower: 60, upper: 80 });
      component.weightRangeWriteState = Object.freeze({
        status: 'failed',
        message: 'failed',
      });

      bleService.disconnect();

      expect(component.weightRangeDraftValue()).toBeNull();
      expect(component.weightRangeWriteState).toEqual({
        status: 'idle',
        message: null,
      });
      expect(component.canApplyWeightRange()).toBeFalse();
    },
  );

  it('should require an explicit draft when the BLE weight range is unknown',
    async () => {
      const {
        component,
        writeExecutionService,
      } = await createWeightRangePage('moventiv-80', 255, 255);

      expect(component.currentWeightRangeValue())
        .toEqual({ lower: 255, upper: 255 });
      expect(component.weightRangeDraftValue()).toBeNull();
      expect(component.canApplyWeightRange()).toBeFalse();

      await component.requestWeightRangeChange();
      expect(writeExecutionService.execute).not.toHaveBeenCalled();

      component.setWeightRangeDraftValue({ lower: 60, upper: 80 });
      expect(component.canApplyWeightRange()).toBeTrue();
    },
  );
});

describe('ProductPage professional scalar controls',
  () => {
    async function createProfessionalScalarPage(
      profile: KnownProductProfile,
      professionalParameters: BleProfessionalParameters,
      result: LegacyBleWriteExecutionResult =
        professionalScalarExecutionResult(
          profile,
          profile === 'widoor'
            ? 'break-force-at-open'
            : 'obstacle-sensitivity',
          profile === 'widoor' ? '01 05' : '07 03',
        ),
      professionalAccessDismissal: {
        readonly role: string;
        readonly data?: {
          readonly values?: {
            readonly professionalAccessCode?: string;
          };
        };
      } = {
        role: 'confirm',
        data: {
          values: {
            professionalAccessCode: PRODUCT_PAGE_PROFESSIONAL_ACCESS_TEST_CODE,
          },
        },
      },
    ): Promise<{
      readonly component: ProductPage;
      readonly fixture: ComponentFixture<ProductPage>;
      readonly bleService: FakeBleService;
      readonly loadService: FakeProductDataLoadService;
      readonly professionalAccessService: FakeProfessionalAccessService;
      readonly writeExecutionService: FakeBleWriteExecutionService;
    }> {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      const professionalAccessService = new FakeProfessionalAccessService();
      loadService.nextResult = completeLoadResult(
        'success',
        profile,
        userValue(),
        professionalParameters,
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      writeExecutionService.nextResult = result;

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          {
            provide: AlertController,
            useValue: {
              create: jasmine.createSpy('create').and.resolveTo({
                present: async () => undefined,
                onDidDismiss: async () => professionalAccessDismissal,
              }),
            },
          },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          {
            provide: ProfessionalAccessService,
            useValue: professionalAccessService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState(profile) },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await component.refreshProductData();
      fixture.detectChanges();

      return {
        component,
        fixture,
        bleService,
        loadService,
        professionalAccessService,
        writeExecutionService,
      };
    }

    for (const scenario of [
      {
        profile: 'widoor',
        current: professionalValue('widoor', 0, 0, {
          breakForceAtOpen: 5,
          nearOpenSpeed: 80,
          nearCloseSpeed: 70,
        }),
        field: 'break-force-at-open',
        controls: [
          'break-force-at-open',
          'near-open-speed',
          'near-close-speed',
        ],
        accepted: 10,
        invalid: 11,
        range: { min: 1, max: 10 },
        unit: null,
        currentValue: 5,
        payloadHex: '01 0a',
        serviceUuid: BLE_UUIDS.widoorService,
      },
      {
        profile: 'widoor',
        current: professionalValue('widoor', 0, 0, {
          breakForceAtOpen: 5,
          nearOpenSpeed: 80,
          nearCloseSpeed: 70,
        }),
        field: 'near-open-speed',
        controls: [
          'break-force-at-open',
          'near-open-speed',
          'near-close-speed',
        ],
        accepted: 85,
        invalid: 69,
        range: { min: 70, max: 100 },
        unit: '%',
        currentValue: 80,
        payloadHex: '02 55',
        serviceUuid: BLE_UUIDS.widoorService,
      },
      {
        profile: 'widoor',
        current: professionalValue('widoor', 0, 0, {
          breakForceAtOpen: 5,
          nearOpenSpeed: 80,
          nearCloseSpeed: 70,
        }),
        field: 'near-close-speed',
        controls: [
          'break-force-at-open',
          'near-open-speed',
          'near-close-speed',
        ],
        accepted: 75,
        invalid: 49,
        range: { min: 50, max: 100 },
        unit: '%',
        currentValue: 70,
        payloadHex: '03 4b',
        serviceUuid: BLE_UUIDS.widoorService,
      },
      {
        profile: 'moventiv-80',
        current: professionalValue('moventiv-80', 50, 60, {
          nearOpenSpeed: 45,
          nearCloseSpeed: 55,
          nearOpenTorque: 90,
          nearCloseTorque: 110,
          brakingOpenPower: 40,
          obstacleSensitivity: 2,
        }),
        field: 'near-open-speed',
        controls: [
          'near-open-speed',
          'near-close-speed',
          'near-open-torque',
          'near-close-torque',
          'braking-open-power',
          'obstacle-sensitivity',
        ],
        accepted: 50,
        invalid: 0,
        range: { min: 1, max: 100 },
        unit: '%',
        currentValue: 45,
        payloadHex: '02 32',
        serviceUuid: BLE_UUIDS.moventivGarlineService,
      },
      {
        profile: 'garline',
        current: professionalValue('garline', 80, 100, {
          nearOpenSpeed: 20,
          nearCloseSpeed: 30,
          obstacleSensitivity: 2,
        }),
        field: 'near-close-speed',
        controls: [
          'near-open-speed',
          'near-close-speed',
          'obstacle-sensitivity',
        ],
        accepted: 0,
        invalid: 101,
        range: { min: 0, max: 100 },
        unit: '%',
        currentValue: 30,
        payloadHex: '03 00',
        serviceUuid: BLE_UUIDS.moventivGarlineService,
      },
      {
        profile: 'moventiv-80',
        current: professionalValue('moventiv-80', 50, 60, {
          nearOpenSpeed: 45,
          nearCloseSpeed: 55,
          nearOpenTorque: 90,
          nearCloseTorque: 110,
          brakingOpenPower: 40,
          obstacleSensitivity: 2,
        }),
        field: 'near-open-torque',
        controls: [
          'near-open-speed',
          'near-close-speed',
          'near-open-torque',
          'near-close-torque',
          'braking-open-power',
          'obstacle-sensitivity',
        ],
        accepted: 120,
        invalid: 201,
        range: { min: 1, max: 200 },
        unit: '%',
        currentValue: 90,
        payloadHex: '04 78',
        serviceUuid: BLE_UUIDS.moventivGarlineService,
      },
      {
        profile: 'moventiv-60',
        current: professionalValue('moventiv-60', 50, 60, {
          nearOpenSpeed: 45,
          nearCloseSpeed: 55,
          nearOpenTorque: 90,
          nearCloseTorque: 110,
          brakingOpenPower: 40,
          obstacleSensitivity: 2,
        }),
        field: 'near-close-torque',
        controls: [
          'near-open-speed',
          'near-close-speed',
          'near-open-torque',
          'near-close-torque',
          'braking-open-power',
          'obstacle-sensitivity',
        ],
        accepted: 130,
        invalid: 0,
        range: { min: 1, max: 200 },
        unit: '%',
        currentValue: 110,
        payloadHex: '05 82',
        serviceUuid: BLE_UUIDS.moventivGarlineService,
      },
      {
        profile: 'moventiv-80',
        current: professionalValue('moventiv-80', 50, 60, {
          nearOpenSpeed: 45,
          nearCloseSpeed: 55,
          nearOpenTorque: 90,
          nearCloseTorque: 110,
          brakingOpenPower: 40,
          obstacleSensitivity: 2,
        }),
        field: 'braking-open-power',
        controls: [
          'near-open-speed',
          'near-close-speed',
          'near-open-torque',
          'near-close-torque',
          'braking-open-power',
          'obstacle-sensitivity',
        ],
        accepted: 50,
        invalid: 101,
        range: { min: 1, max: 100 },
        unit: '%',
        currentValue: 40,
        payloadHex: '06 32',
        serviceUuid: BLE_UUIDS.moventivGarlineService,
      },
      {
        profile: 'garline',
        current: professionalValue('garline', 80, 100, {
          nearOpenSpeed: 20,
          nearCloseSpeed: 30,
          obstacleSensitivity: 2,
        }),
        field: 'obstacle-sensitivity',
        controls: [
          'near-open-speed',
          'near-close-speed',
          'obstacle-sensitivity',
        ],
        accepted: 5,
        invalid: 6,
        range: { min: 1, max: 5 },
        unit: null,
        currentValue: 2,
        payloadHex: '07 05',
        serviceUuid: BLE_UUIDS.moventivGarlineService,
      },
    ] as const) {
      it(`should apply ${scenario.profile} ${scenario.field}`,
        async () => {
          const {
            component,
            professionalAccessService,
            writeExecutionService,
          } = await createProfessionalScalarPage(
            scenario.profile,
            scenario.current,
            professionalScalarExecutionResult(
              scenario.profile,
              scenario.field,
              scenario.payloadHex,
            ),
          );
          const control = component.professionalScalarControls.find(
            (candidate) => candidate.config.field === scenario.field,
          )?.config;

          expect(component.professionalScalarControls.map((candidate) =>
            candidate.config.field,
          )).toEqual(scenario.controls);
          expect(control).toBeDefined();
          if (control?.requiresProfessionalAccess) {
            expect(component.visibleProfessionalScalarControls.map(
              (candidate) => candidate.config.field,
            )).not.toContain(scenario.field);
            expect(component.canApplyProfessionalScalar(control))
              .toBeFalse();
            expect(professionalAccessService.authenticate({
              profile: scenario.profile,
              deviceId: 'device-1',
              connectionGeneration: 4,
            }, PRODUCT_PAGE_PROFESSIONAL_ACCESS_TEST_CODE)).toBeTrue();
          }
          expect(control?.range).toEqual(scenario.range);
          expect(control?.unit).toBe(scenario.unit);
          expect(component.currentProfessionalScalarValue(control!))
            .toBe(scenario.currentValue);

          component.setProfessionalScalarDraftValue(control!, scenario.invalid);
          await component.requestProfessionalScalarChange(control!);
          expect(writeExecutionService.execute).not.toHaveBeenCalled();

          component.setProfessionalScalarDraftValue(
            control!,
            scenario.accepted,
          );
          expect(component.professionalScalarDraftValue(control!))
            .toBe(scenario.accepted);
          expect(component.canApplyProfessionalScalar(control!)).toBeTrue();
          expect(writeExecutionService.execute).not.toHaveBeenCalled();

          await component.requestProfessionalScalarChange(control!);

          expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
          const request = writeExecutionService.execute.calls.mostRecent()
            .args[0] as LegacyBleWriteRequest;
          expect(request.profile).toBe(scenario.profile);
          expect(request.write.operation).toBe(scenario.field);
          expect(request.write.serviceUuid).toBe(scenario.serviceUuid);
          expect(request.write.characteristicUuid)
            .toBe(BLE_UUIDS.professionalParametersCharacteristic);
          expect(request.write.payloadHex).toBe(scenario.payloadHex);
          expect(request.confirmationPolicy).toEqual({ kind: 'gatt-only' });
          expect(request.policy).toEqual(jasmine.objectContaining({ allowPhase1ReferenceOnly: true }));
          if (scenario.profile === 'garline') {
            expect(request.policy).toEqual(jasmine.objectContaining({
              allowGarlinePhase1ImmediateWrite: true,
            }));
            expect(request.authorization).toBeNull();
          }
        },
      );
    }

    it('should leave the BLE value unchanged when a professional write fails',
      async () => {
        const {
          component,
          professionalAccessService,
          writeExecutionService,
        } = await createProfessionalScalarPage(
          'garline',
          professionalValue('garline', 80, 100, {
            obstacleSensitivity: 2,
          }),
          professionalScalarExecutionResult(
            'garline',
            'obstacle-sensitivity',
            '07 03',
            'failed',
          ),
        );
        const control = component.professionalScalarControls.find(
          (candidate) =>
            candidate.config.field === 'obstacle-sensitivity',
        )!.config;
        expect(professionalAccessService.authenticate({
          profile: 'garline',
          deviceId: 'device-1',
          connectionGeneration: 4,
        }, PRODUCT_PAGE_PROFESSIONAL_ACCESS_TEST_CODE)).toBeTrue();

        component.setProfessionalScalarDraftValue(control, 3);
        await component.requestProfessionalScalarChange(control);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        expect(component.currentProfessionalScalarValue(control)).toBe(2);
        expect(component.professionalScalarDraftValue(control)).toBe(3);
        expect(component.professionalScalarWriteState.status).toBe('failed');
      },
    );

    it('should reset professional scalar drafts after a BLE reload',
      async () => {
        const {
          component,
          loadService,
        } = await createProfessionalScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, { breakForceAtOpen: 5 }),
        );
        const control = component.professionalScalarControls[0].config;

        component.setProfessionalScalarDraftValue(control, 8);
        expect(component.professionalScalarDraftValue(control)).toBe(8);

        loadService.nextResult = completeLoadResult(
          'success',
          'widoor',
          userValue(),
          professionalValue('widoor', 0, 0, { breakForceAtOpen: 2 }),
        );
        await component.refreshProductData();

        expect(component.currentProfessionalScalarValue(control)).toBe(2);
        expect(component.professionalScalarDraftValue(control)).toBe(2);
      },
    );

    it('should reset professional scalar editing on disconnection',
      async () => {
        const {
          component,
          bleService,
          professionalAccessService,
        } = await createProfessionalScalarPage(
          'moventiv-80',
          professionalValue('moventiv-80', 50, 60, {
            nearOpenSpeed: 45,
            nearCloseSpeed: 55,
            nearOpenTorque: 90,
            nearCloseTorque: 110,
            brakingOpenPower: 40,
            obstacleSensitivity: 2,
          }),
        );
        const control = component.professionalScalarControls[0].config;
        expect(professionalAccessService.authenticate({
          profile: 'moventiv-80',
          deviceId: 'device-1',
          connectionGeneration: 4,
        }, PRODUCT_PAGE_PROFESSIONAL_ACCESS_TEST_CODE)).toBeTrue();

        component.setProfessionalScalarDraftValue(control, 50);
        component.professionalScalarWriteState = Object.freeze({
          status: 'failed',
          field: control.field,
          message: 'failed',
        });

        bleService.disconnect();

        expect(component.professionalScalarDraftValue(control))
          .toBe(control.range.min);
        expect(component.professionalScalarWriteState).toEqual({
          status: 'idle',
          field: null,
          message: null,
        });
        expect(component.professionalAccessGranted).toBeFalse();
        expect(component.canApplyProfessionalScalar(control)).toBeFalse();
      },
    );

    it('should keep protected professional settings hidden before access',
      async () => {
        const {
          component,
        } = await createProfessionalScalarPage(
          'moventiv-80',
          professionalValue('moventiv-80', 50, 60, {
            nearOpenSpeed: 45,
            nearCloseSpeed: 55,
            brakingOpenPower: 40,
            obstacleSensitivity: 2,
            nearOpenTorque: 10,
            nearCloseTorque: 20,
          }),
        );

        expect(component.professionalAccessGranted).toBeFalse();
        expect(component.showProfessionalAccessPrompt).toBeTrue();
        expect(component.visibleProfessionalScalarControls.map((control) =>
          control.config.field,
        )).toEqual(['near-open-speed', 'near-close-speed']);
        expect(component.professionalRows.map((row) => row.key))
          .not.toContain('braking-open-power');
        expect(component.professionalRows.map((row) => row.key))
          .not.toContain('obstacle-sensitivity');
        expect(component.professionalRows.map((row) => row.key))
          .not.toContain('near-open-torque');
        expect(component.professionalRows.map((row) => row.key))
          .not.toContain('near-close-torque');
        expect(component.professionalRows.map((row) => row.key))
          .toContain('near-open-speed');
        expect(component.professionalRows.map((row) => row.key))
          .toContain('near-close-speed');
        expect(component.professionalRows.map((row) => row.key))
          .toContain('weight-range');
      },
    );

    it('should unlock protected professional settings with a valid code',
      async () => {
        const {
          component,
          fixture,
        } = await createProfessionalScalarPage(
          'moventiv-80',
          professionalValue('moventiv-80', 50, 60, {
            nearOpenSpeed: 45,
            nearCloseSpeed: 55,
            brakingOpenPower: 40,
            obstacleSensitivity: 2,
          }),
        );

        await component.requestProfessionalAccess();
        fixture.detectChanges();

        expect(component.professionalAccessGranted).toBeTrue();
        expect(component.professionalAccessState.status).toBe('unlocked');
        expect(component.showProfessionalAccessPrompt).toBeFalse();
        expect(component.visibleProfessionalScalarControls.map((control) =>
          control.config.field,
        )).toEqual([
          'near-open-speed',
          'near-close-speed',
          'near-open-torque',
          'near-close-torque',
          'braking-open-power',
          'obstacle-sensitivity',
        ]);
        expect(component.professionalRows.map((row) => row.key))
          .toContain('braking-open-power');
        expect(component.professionalRows.map((row) => row.key))
          .toContain('near-open-torque');
      },
    );

    it('should render Phase 1 advanced settings without bypassing access',
      async () => {
        const {
          component,
          fixture,
          writeExecutionService,
        } = await createProfessionalScalarPage(
          'moventiv-80',
          professionalValue('moventiv-80', 50, 60, {
            nearOpenSpeed: 45,
            nearCloseSpeed: 55,
            brakingOpenPower: 40,
            obstacleSensitivity: 2,
            nearOpenTorque: 90,
            nearCloseTorque: 110,
          }),
        );
        const protectedControl = component.professionalScalarControls.find(
          (candidate) => candidate.config.field === 'braking-open-power',
        )!.config;

        component.setActiveMainTab('settings');
        component.setActiveSettingsTab('advanced');
        component.toggleProfessionalScalarLock(protectedControl);
        fixture.detectChanges();

        let element = fixture.nativeElement as HTMLElement;
        const advancedPanel = element.querySelector<HTMLElement>(
          '.advanced-settings-panel',
        );
        expect(advancedPanel).not.toBeNull();
        expect(component.professionalAccessGranted).toBeFalse();
        expect(component.visibleProfessionalScalarControls.map((control) =>
          control.config.field,
        )).toEqual(['near-open-speed', 'near-close-speed']);
        expect(component.canApplyProfessionalScalar(protectedControl))
          .toBeFalse();
        expect(Array.from(element.querySelectorAll<HTMLElement>(
          '[data-professional-scalar-field]',
        )).map((row) => row.getAttribute('data-professional-scalar-field')))
          .toEqual(['near-open-speed', 'near-close-speed']);
        expect(element.querySelector<HTMLImageElement>(
          'img[src="assets/img/icon_speed.svg"]',
        )).not.toBeNull();
        expect(element.querySelector<HTMLImageElement>(
          'img[src="assets/img/icon_lock_on.svg"]',
        )).not.toBeNull();

        await component.requestProfessionalAccess();
        fixture.detectChanges();
        element = fixture.nativeElement as HTMLElement;

        expect(component.professionalAccessGranted).toBeTrue();
        expect(Array.from(element.querySelectorAll<HTMLElement>(
          '[data-professional-scalar-field]',
        )).map((row) => row.getAttribute('data-professional-scalar-field')))
          .toEqual([
            'near-open-speed',
            'near-close-speed',
            'near-open-torque',
            'near-close-torque',
            'braking-open-power',
            'obstacle-sensitivity',
          ]);
        expect(element.querySelector<HTMLImageElement>(
          'img[src="assets/img/icon_force.svg"]',
        )).not.toBeNull();
        expect(writeExecutionService.execute).not.toHaveBeenCalled();
      },
    );

    it('should keep Widoor advanced actions routed through existing handlers',
      async () => {
        const {
          component,
          fixture,
          writeExecutionService,
        } = await createProfessionalScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, {
            breakForceAtOpen: 5,
            nearOpenSpeed: 25,
            nearCloseSpeed: 35,
          }),
        );
        const requestSensitiveAction = spyOn(component, 'requestSensitiveAction')
          .and.resolveTo();

        component.setActiveMainTab('settings');
        component.setActiveSettingsTab('advanced');
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        expect(Array.from(element.querySelectorAll<HTMLElement>(
          '[data-sensitive-action]',
        )).map((row) => row.getAttribute('data-sensitive-action'))).toEqual([
          'learning',
          'radar-test-1',
          'radar-test-2',
          'professional-peripheral-lock',
          'reset',
        ]);
        expect(element.querySelector<HTMLImageElement>(
          'img[src="assets/img/icon_test_off.svg"]',
        )).not.toBeNull();
        expect(element.querySelector<HTMLImageElement>(
          'img[src="assets/img/icon_lock_off.svg"]',
        )).not.toBeNull();
        expect(component.showProfessionalAccessPrompt).toBeFalse();
        expect(component.canExecuteSensitiveAction(
          component.sensitiveActions.find((action) =>
            action.action === 'radar-test-1',
          )!,
        )).toBeFalse();
        expect(component.canExecuteSensitiveAction(
          component.sensitiveActions.find((action) =>
            action.action === 'professional-peripheral-lock',
          )!,
        )).toBeFalse();

        const learningButton = element.querySelector<HTMLIonButtonElement>(
          '[data-sensitive-action="learning"] ion-button',
        );
        learningButton?.click();
        fixture.detectChanges();

        expect(requestSensitiveAction)
          .toHaveBeenCalledOnceWith(component.sensitiveActions[0]);
        expect(writeExecutionService.execute).not.toHaveBeenCalled();
      },
    );

    it('should execute Garline learning immediately without user authorization',
      async () => {
        const {
          component,
          fixture,
          loadService,
          writeExecutionService,
        } = await createProfessionalScalarPage(
          'garline',
          professionalValue('garline', 80, 100, {
            nearOpenSpeed: 25,
            nearCloseSpeed: 35,
            obstacleSensitivity: 2,
          }),
        );

        component.setActiveMainTab('settings');
        component.setActiveSettingsTab('advanced');
        await waitForCondition(() =>
          !component.viewModel.loading &&
          loadService.loadProductData.calls.count() >= 2,
        );
        fixture.detectChanges();
        const action = component.sensitiveActions.find((candidate) =>
          candidate.action === 'learning',
        )!;

        expect(component.canExecuteSensitiveAction(action)).toBeTrue();

        await component.requestSensitiveAction(action);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.profile).toBe('garline');
        expect(request.write.operation).toBe('motor-learning');
        expect(request.write.payloadHex).toBe('00 12');
        expect(request.policy).toEqual(jasmine.objectContaining({
          allowPhase1ReferenceOnly: true,
          allowGarlinePhase1ImmediateWrite: true,
          allowLearning: true,
        }));
        expect(request.authorization).toBeNull();
      },
    );

    for (const actionName of [
      'radar-test-1',
      'radar-test-2',
      'professional-peripheral-lock',
    ] as const) {
      it(`should execute Widoor ${actionName} without professional access`,
        async () => {
          const {
            component,
            writeExecutionService,
          } = await createProfessionalScalarPage(
            'widoor',
            professionalValue('widoor', 0, 0, {
              breakForceAtOpen: 5,
              nearOpenSpeed: 25,
              nearCloseSpeed: 35,
            }),
          );
          const action = component.sensitiveActions.find((candidate) =>
            candidate.action === actionName,
          )!;

          expect(component.professionalAccessGranted).toBeFalse();
          expect(component.canExecuteSensitiveAction(action)).toBeTrue();

          await component.requestSensitiveAction(action, true);

          expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
          const request = writeExecutionService.execute.calls.mostRecent()
            .args[0] as LegacyBleWriteRequest;
          expect(request.authorization).toBeNull();
        },
      );
    }

    it('should execute Widoor sensitive actions without professional access',
      async () => {
        const {
          component,
          writeExecutionService,
        } = await createProfessionalScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, {
            breakForceAtOpen: 5,
            nearOpenSpeed: 25,
            nearCloseSpeed: 35,
          }),
        );
        const radarTest = component.sensitiveActions.find((action) =>
          action.action === 'radar-test-1',
        )!;
        const scalar = component.professionalScalarControls.find((control) =>
          control.config.field === 'break-force-at-open',
        )!.config;

        component.toggleProfessionalScalarLock(scalar);
        component.toggleProfessionalInputControlLock();

        expect(component.professionalAccessGranted).toBeFalse();
        expect(component.canExecuteSensitiveAction(radarTest)).toBeTrue();

        await component.requestSensitiveAction(radarTest, true);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.authorization).toBeNull();
      },
    );

    it('should keep near open and near close speed drafts independent',
      async () => {
        const {
          component,
          writeExecutionService,
        } = await createProfessionalScalarPage(
          'moventiv-80',
          professionalValue('moventiv-80', 50, 60, {
            nearOpenSpeed: 45,
            nearCloseSpeed: 55,
            nearOpenTorque: 90,
            nearCloseTorque: 110,
            brakingOpenPower: 40,
            obstacleSensitivity: 2,
          }),
          professionalScalarExecutionResult(
            'moventiv-80',
            'near-open-speed',
            '02 32',
          ),
        );
        const nearOpenSpeed = component.professionalScalarControls.find(
          (candidate) => candidate.config.field === 'near-open-speed',
        )!.config;
        const nearCloseSpeed = component.professionalScalarControls.find(
          (candidate) => candidate.config.field === 'near-close-speed',
        )!.config;

        component.setProfessionalScalarDraftValue(nearOpenSpeed, 50);

        expect(component.professionalScalarDraftValue(nearOpenSpeed))
          .toBe(50);
        expect(component.professionalScalarDraftValue(nearCloseSpeed))
          .toBe(55);

        await component.requestProfessionalScalarChange(nearOpenSpeed);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.write.operation).toBe('near-open-speed');
        expect(request.write.payloadHex).toBe('02 32');
      },
    );

    it('should keep near open and near close torque drafts independent',
      async () => {
        const {
          component,
          professionalAccessService,
          writeExecutionService,
        } = await createProfessionalScalarPage(
          'moventiv-80',
          professionalValue('moventiv-80', 50, 60, {
            nearOpenSpeed: 45,
            nearCloseSpeed: 55,
            nearOpenTorque: 90,
            nearCloseTorque: 110,
            brakingOpenPower: 40,
            obstacleSensitivity: 2,
          }),
          professionalScalarExecutionResult(
            'moventiv-80',
            'near-open-torque',
            '04 78',
          ),
        );
        expect(professionalAccessService.authenticate({
          profile: 'moventiv-80',
          deviceId: 'device-1',
          connectionGeneration: 4,
        }, PRODUCT_PAGE_PROFESSIONAL_ACCESS_TEST_CODE)).toBeTrue();
        const nearOpenTorque = component.professionalScalarControls.find(
          (candidate) => candidate.config.field === 'near-open-torque',
        )!.config;
        const nearCloseTorque = component.professionalScalarControls.find(
          (candidate) => candidate.config.field === 'near-close-torque',
        )!.config;

        component.setProfessionalScalarDraftValue(nearOpenTorque, 120);

        expect(component.professionalScalarDraftValue(nearOpenTorque))
          .toBe(120);
        expect(component.professionalScalarDraftValue(nearCloseTorque))
          .toBe(110);

        await component.requestProfessionalScalarChange(nearOpenTorque);

        expect(writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = writeExecutionService.execute.calls.mostRecent()
          .args[0] as LegacyBleWriteRequest;
        expect(request.write.operation).toBe('near-open-torque');
        expect(request.write.payloadHex).toBe('04 78');
      },
    );

    it('should reject an incorrect professional access code without writing',
      async () => {
        const {
          component,
          writeExecutionService,
        } = await createProfessionalScalarPage(
          'garline',
          professionalValue('garline', 80, 100, {
            obstacleSensitivity: 2,
          }),
          professionalScalarExecutionResult(
            'garline',
            'obstacle-sensitivity',
            '07 03',
          ),
          {
            role: 'confirm',
            data: { values: { professionalAccessCode: 'bad-code' } },
          },
        );

        await component.requestProfessionalAccess();

        expect(component.professionalAccessGranted).toBeFalse();
        expect(component.professionalAccessState.status).toBe('failed');
        expect(component.visibleProfessionalScalarControls.map((control) =>
          control.config.field,
        )).toEqual(['near-open-speed', 'near-close-speed']);
        expect(writeExecutionService.execute).not.toHaveBeenCalled();
      },
    );

    it('should reject a professional scalar config from another profile',
      async () => {
        const {
          component,
          writeExecutionService,
        } = await createProfessionalScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, { breakForceAtOpen: 5 }),
        );
        const garlineObstacle = productProfessionalScalarConfigsFor(
          PRODUCT_PAGE_CONFIG.garline,
        )[0];

        component.setProfessionalScalarDraftValue(garlineObstacle, 3);
        await component.requestProfessionalScalarChange(garlineObstacle);

        expect(writeExecutionService.execute).not.toHaveBeenCalled();
        expect(component.canApplyProfessionalScalar(garlineObstacle))
          .toBeFalse();
      },
    );

    it('should keep previous setting groups and motor commands available',
      async () => {
        const {
          component,
        } = await createProfessionalScalarPage(
          'widoor',
          professionalValue('widoor', 0, 0, { breakForceAtOpen: 5 }),
        );

        expect(component.showProfessionalScalarControls).toBeTrue();
        expect(component.showWeightRangeControls).toBeFalse();
        expect(component.showUserSpeedControls).toBeTrue();
        expect(component.showUserTimingControls).toBeTrue();
        expect(component.showLockModeControls).toBeFalse();
        expect(component.showProductMotorCommands).toBeTrue();
      },
    );
  },
);

describe('ProductPage lock-mode controls for profile variants', () => {
  it('should not expose Garline lock-mode controls',
    async () => {
      const bleService = new FakeBleService();
      const loadService = new FakeProductDataLoadService();
      loadService.nextResult = completeLoadResult(
        'success',
        'garline',
        userValueWithLockMode('none'),
      );
      const writeExecutionService = new FakeBleWriteExecutionService();
      const alertCreate = jasmine.createSpy('create').and.resolveTo({
        present: async () => undefined,
        onDidDismiss: async () => ({ role: 'confirm' }),
      });

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProductPage],
        providers: [
          { provide: BleService, useValue: bleService },
          { provide: AlertController, useValue: { create: alertCreate } },
          {
            provide: BleWriteExecutionService,
            useValue: writeExecutionService,
          },
          { provide: ProductDataLoadService, useValue: loadService },
          { provide: ProductDetection, useClass: ProductDetection },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { profile: 'garline' } } },
          },
          {
            provide: Router,
            useValue: {
              getCurrentNavigation: () => ({
                extras: { state: navigationState('garline') },
              }),
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProductPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      await component.refreshProductData();
      fixture.detectChanges();

      expect(component.lockModeControls.map((control) =>
        control.config.mode,
      )).toEqual([]);
      expect(component.showLockModeControls).toBeFalse();
      expect(fixture.nativeElement.textContent).not.toContain(
        component.text.lockModeControls.lockedOpen.label,
      );
      expect(fixture.nativeElement.textContent).not.toContain(
        component.text.lockModeControls.lockedClosed.label,
      );

      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(alertCreate).not.toHaveBeenCalled();
    },
  );
});

describe('ProductPage product date maintenance actions', () => {
  for (const profile of [
    'moventiv-60',
    'moventiv-80',
    'garline',
  ] as const) {
    it(`should expose setup action for ${profile} when first date is empty`,
      async () => {
        const harness = await createProductDateHarness(
          profile,
          notInitializedHistoricalDate(),
        );

        expect(harness.component.showProductDateMaintenanceAction).toBeTrue();
        expect(harness.component.productDateMaintenanceActionLabel)
          .toBe(harness.component.text.productDateActions.setupLabel);
        expect(harness.fixture.nativeElement.textContent).toContain(
          harness.component.text.productDateActions.setupLabel,
        );
        expect(harness.component.canRequestProductDateMaintenanceAction())
          .toBeTrue();
      },
    );
  }

  it('should expose maintenance action when first date is already present',
    async () => {
      const harness = await createProductDateHarness(
        'moventiv-80',
        presentHistoricalDate(),
      );

      expect(harness.component.showProductDateMaintenanceAction).toBeTrue();
      expect(harness.component.productDateMaintenanceActionLabel)
        .toBe(harness.component.text.productDateActions.maintenanceLabel);
      expect(harness.fixture.nativeElement.textContent).toContain(
        harness.component.text.productDateActions.maintenanceLabel,
      );
    },
  );

  it('should place maintenance actions in the advanced settings tab',
    async () => {
      const harness = await createProductDateHarness(
        'garline',
        presentHistoricalDate(),
      );
      const requestProductDateMaintenanceAction = spyOn(
        harness.component,
        'requestProductDateMaintenanceAction',
      ).and.resolveTo();

      harness.component.setActiveMainTab('settings');
      harness.component.setActiveSettingsTab('advanced');
      harness.fixture.detectChanges();

      const element = harness.fixture.nativeElement as HTMLElement;
      const advancedButton = element.querySelector<HTMLIonButtonElement>(
        '.advanced-historical-action',
      );
      expect(advancedButton?.textContent).toContain(
        harness.component.text.productDateActions.maintenanceLabel,
      );

      advancedButton?.click();
      harness.fixture.detectChanges();

      expect(requestProductDateMaintenanceAction).toHaveBeenCalledTimes(1);

      harness.component.setActiveMainTab('information');
      harness.fixture.detectChanges();
      expect(element.querySelector<HTMLIonButtonElement>(
        'section[aria-labelledby="information-title"] ion-button[color="warning"]',
      )).toBeNull();
    },
  );

  it('should never expose product date actions on Widoor', async () => {
    const harness = await createProductDateHarness(
      'widoor',
      notInitializedHistoricalDate(),
    );

    expect(harness.component.showProductDateMaintenanceAction).toBeFalse();
    expect(harness.component.canRequestProductDateMaintenanceAction())
      .toBeFalse();
    expect(harness.fixture.nativeElement.textContent).not.toContain(
      harness.component.text.productDateActions.setupLabel,
    );
    expect(harness.fixture.nativeElement.textContent).not.toContain(
      harness.component.text.productDateActions.maintenanceLabel,
    );
  });

  it('should ask the maintenance code and write maintenance then first date',
    async () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2026, 0, 2, 3, 59, 58));
      try {
        const harness = await createProductDateHarness(
          'garline',
          notInitializedHistoricalDate(),
        );
        harness.writeExecutionService.nextResults = [
          productDateExecutionResult(
            'garline',
            'maintenance-date',
            '02 1a 00 02 03',
          ),
          productDateExecutionResult(
            'garline',
            'first-commissioning-date',
            '01 1a 00 02 03',
          ),
        ];

        await harness.component.requestProductDateMaintenanceAction();

        expect(harness.alertCreate).toHaveBeenCalledTimes(1);
        expect(harness.alertOptions[0]['message']).toContain(
          'mise en service',
        );
        expect(harness.maintenanceAccessService.authenticate)
          .toHaveBeenCalledOnceWith(jasmine.objectContaining({
            profile: 'garline',
            deviceId: 'device-1',
            connectionGeneration: 4,
          }), PRODUCT_PAGE_MAINTENANCE_ACCESS_TEST_CODE);
        expect(harness.maintenanceAccessService.reset).toHaveBeenCalledWith(
          jasmine.objectContaining({
            profile: 'garline',
            deviceId: 'device-1',
            connectionGeneration: 4,
          }),
        );
        expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(2);
        const requests = harness.writeExecutionService.execute.calls.allArgs()
          .map(([request]) => request as LegacyBleWriteRequest);
        expect(requests.map(({ write }) => write.operation)).toEqual([
          'maintenance-date',
          'first-commissioning-date',
        ]);
        expect(requests.map(({ write }) => write.payloadHex)).toEqual([
          '02 1a 00 02 03',
          '01 1a 00 02 03',
        ]);
        expect(requests.every((request) =>
          request.profile === 'garline' &&
          request.deviceId === 'device-1' &&
          request.connectionGeneration === 4,
        )).toBeTrue();
        expect(harness.component.productDateActionState.status).toBe('sent');
        expect(harness.component.productDateActionState.message)
          .toBe(harness.component.text.productDateActions.setupSent);
        expect(harness.loadService.loadProductData).toHaveBeenCalledTimes(2);
      } finally {
        jasmine.clock().uninstall();
      }
    },
  );

  it('should ask the maintenance code again for each maintenance action',
    async () => {
      const harness = await createProductDateHarness(
        'garline',
        presentHistoricalDate(),
      );

      await harness.component.requestProductDateMaintenanceAction();
      await harness.component.requestProductDateMaintenanceAction();

      expect(harness.alertCreate).toHaveBeenCalledTimes(2);
      expect(harness.maintenanceAccessService.authenticate)
        .toHaveBeenCalledTimes(2);
      expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(2);
    },
  );

  for (const profile of ['moventiv-60', 'garline'] as const) {
    it(`should write ${profile} maintenance only when first date is already initialized`,
      async () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2026, 11, 31, 23, 12, 30));
      try {
        const harness = await createProductDateHarness(
          profile,
          presentHistoricalDate(),
        );
        harness.writeExecutionService.nextResult = productDateExecutionResult(
          profile,
          'maintenance-date',
          '02 1a 0b 1f 17',
        );

        await harness.component.requestProductDateMaintenanceAction();

        expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(1);
        const request = harness.writeExecutionService.execute.calls
          .mostRecent().args[0] as LegacyBleWriteRequest;
        expect(request.write.operation).toBe('maintenance-date');
        expect(request.write.payloadHex).toBe('02 1a 0b 1f 17');
        expect(harness.component.productDateActionState.status).toBe('sent');
        expect(harness.component.productDateActionState.message)
          .toBe(harness.component.text.productDateActions.maintenanceSent);
        expect(harness.loadService.loadProductData).toHaveBeenCalledTimes(1);
      } finally {
        jasmine.clock().uninstall();
      }
      },
    );
  }

  it('should reject wrong maintenance code and cancellation before any write',
    async () => {
      const wrongCodeHarness = await createProductDateHarness(
        'garline',
        presentHistoricalDate(),
        { accessCode: 'bad-code' },
      );

      await wrongCodeHarness.component.requestProductDateMaintenanceAction();

      expect(wrongCodeHarness.writeExecutionService.execute)
        .not.toHaveBeenCalled();
      expect(wrongCodeHarness.component.productDateActionState.status)
        .toBe('failed');
      expect(wrongCodeHarness.component.productDateActionState.message)
        .toBe(wrongCodeHarness.component.text.productDateActions.wrongCode);

      const cancelledHarness = await createProductDateHarness(
        'garline',
        presentHistoricalDate(),
        { alertRole: 'cancel' },
      );

      await cancelledHarness.component.requestProductDateMaintenanceAction();

      expect(cancelledHarness.maintenanceAccessService.authenticate)
        .not.toHaveBeenCalled();
      expect(cancelledHarness.writeExecutionService.execute)
        .not.toHaveBeenCalled();
      expect(cancelledHarness.component.productDateActionState.status)
        .toBe('cancelled');
    },
  );

  it('should report partial failure when setup maintenance succeeds and first date fails',
    async () => {
      const harness = await createProductDateHarness(
        'moventiv-80',
        notInitializedHistoricalDate(),
      );
      harness.writeExecutionService.nextResults = [
        productDateExecutionResult(
          'moventiv-80',
          'maintenance-date',
          '02 1a 00 02 03',
        ),
        productDateExecutionResult(
          'moventiv-80',
          'first-commissioning-date',
          '01 1a 00 02 03',
          'failed',
        ),
      ];

      await harness.component.requestProductDateMaintenanceAction();

      expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(2);
      expect(harness.component.productDateActionState.status)
        .toBe('partial-failed');
      expect(harness.component.productDateActionState.message)
        .toBe(harness.component.text.productDateActions.partialFailed);
      expect(harness.loadService.loadProductData).toHaveBeenCalledTimes(2);
    },
  );

  it('should not write first date when the maintenance write fails',
    async () => {
      const harness = await createProductDateHarness(
        'garline',
        notInitializedHistoricalDate(),
      );
      harness.writeExecutionService.nextResult = productDateExecutionResult(
        'garline',
        'maintenance-date',
        '02 1a 00 02 03',
        'failed',
      );

      await harness.component.requestProductDateMaintenanceAction();

      expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(1);
      const request = harness.writeExecutionService.execute.calls
        .mostRecent().args[0] as LegacyBleWriteRequest;
      expect(request.write.operation).toBe('maintenance-date');
      expect(harness.component.productDateActionState.status).toBe('failed');
      expect(harness.loadService.loadProductData).toHaveBeenCalledTimes(2);
    },
  );

  it('should keep Garline initialized maintenance success without final refresh',
    async () => {
      const harness = await createProductDateHarness(
        'garline',
        presentHistoricalDate(),
      );
      harness.loadService.nextResult = productDateLoadResult(
        'garline',
        presentHistoricalDate(),
        'failed',
      );

      await harness.component.requestProductDateMaintenanceAction();

      expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(harness.component.productDateActionState.status).toBe('sent');
      expect(harness.component.productDateActionState.message)
        .toBe(harness.component.text.productDateActions.maintenanceSent);
      expect(harness.loadService.loadProductData).toHaveBeenCalledTimes(1);
    },
  );

  it('should report partial failure when the product disconnects after maintenance',
    async () => {
      const harness = await createProductDateHarness(
        'garline',
        notInitializedHistoricalDate(),
      );
      harness.writeExecutionService.execute.and.callFake(
        async () => {
          harness.bleService.disconnect();
          return productDateExecutionResult(
            'garline',
            'maintenance-date',
            '02 1a 00 02 03',
          );
        },
      );

      await harness.component.requestProductDateMaintenanceAction();

      expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(harness.component.productDateActionState.status)
        .toBe('partial-failed');
      expect(harness.component.productDateActionState.message)
        .toBe(harness.component.text.productDateActions.partialFailed);
    },
  );

  it('should report partial failure when the context becomes stale after maintenance',
    async () => {
      const harness = await createProductDateHarness(
        'moventiv-80',
        notInitializedHistoricalDate(),
      );
      harness.writeExecutionService.execute.and.callFake(
        async () => {
          harness.bleService.connectionGeneration = 5;
          return productDateExecutionResult(
            'moventiv-80',
            'maintenance-date',
            '02 1a 00 02 03',
          );
        },
      );

      await harness.component.requestProductDateMaintenanceAction();

      expect(harness.writeExecutionService.execute).toHaveBeenCalledTimes(1);
      expect(harness.component.productDateActionState.status)
        .toBe('partial-failed');
      expect(harness.component.productDateActionState.message)
        .toBe(harness.component.text.productDateActions.partialFailed);
    },
  );

  it('should block double action and reset maintenance access on disconnection',
    async () => {
      const harness = await createProductDateHarness(
        'garline',
        presentHistoricalDate(),
      );

      harness.component.productDateActionState = Object.freeze({
        status: 'awaiting-confirmation',
        action: 'maintenance',
        message: harness.component.text.productDateActions
          .awaitingConfirmation,
      });
      expect(harness.component.canRequestProductDateMaintenanceAction())
        .toBeFalse();

      harness.bleService.disconnect();

      expect(harness.component.productDateActionState.status).toBe('idle');
      expect(harness.component.showProductDateMaintenanceAction).toBeFalse();
      expect(harness.maintenanceAccessService.reset).toHaveBeenCalled();
    },
  );
});

function navigationState(
  profile: KnownProductProfile,
): ProductPageNavigationState {
  return {
    profile,
    deviceId: 'device-1',
    connectionGeneration: 4,
    displayName: 'Porte#CHA',
    identificationConfidence: 'strong',
    motorState: null,
  };
}

async function createNameRoomProfileHarness(
  profile: KnownProductProfile,
): Promise<{
  readonly fixture: ComponentFixture<ProductPage>;
  readonly component: ProductPage;
  readonly writeExecutionService: FakeBleWriteExecutionService;
}> {
  const bleService = new FakeBleService();
  const loadService = new FakeProductDataLoadService();
  const writeExecutionService = new FakeBleWriteExecutionService();

  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [ProductPage],
    providers: [
      { provide: BleService, useValue: bleService },
      {
        provide: AlertController,
        useValue: {
          create: jasmine.createSpy('create').and.resolveTo({
            present: async () => undefined,
            onDidDismiss: async () => ({ role: 'confirm' }),
          }),
        },
      },
      { provide: BleWriteExecutionService, useValue: writeExecutionService },
      { provide: ProductDataLoadService, useValue: loadService },
      { provide: ProductDetection, useClass: ProductDetection },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data: { profile } } },
      },
      {
        provide: Router,
        useValue: {
          getCurrentNavigation: () => ({
            extras: { state: navigationState(profile) },
          }),
          navigate: jasmine.createSpy('navigate').and.resolveTo(true),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProductPage);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return {
    fixture,
    component,
    writeExecutionService,
  };
}

async function createProductDateHarness(
  profile: KnownProductProfile,
  firstCommissioningDate: BleDatesAndCycles['firstCommissioningDate'],
  options: {
    readonly alertRole?: string;
    readonly accessCode?: string;
  } = {},
): Promise<{
  readonly fixture: ComponentFixture<ProductPage>;
  readonly component: ProductPage;
  readonly bleService: FakeBleService;
  readonly loadService: FakeProductDataLoadService;
  readonly writeExecutionService: FakeBleWriteExecutionService;
  readonly maintenanceAccessService: FakeMaintenanceAccessService;
  readonly alertCreate: jasmine.Spy;
  readonly alertOptions: Record<string, unknown>[];
}> {
  const bleService = new FakeBleService();
  const loadService = new FakeProductDataLoadService();
  loadService.nextResult = productDateLoadResult(
    profile,
    firstCommissioningDate,
  );
  const writeExecutionService = new FakeBleWriteExecutionService();
  writeExecutionService.nextResult = productDateExecutionResult(
    profile,
    'maintenance-date',
    '02 1a 00 02 03',
  );
  const maintenanceAccessService = new FakeMaintenanceAccessService();
  const alertOptions: Record<string, unknown>[] = [];
  const alertCreate = jasmine.createSpy('create').and.callFake(
    async (alert: Record<string, unknown>) => {
      alertOptions.push(alert);
      return {
        present: async () => undefined,
        onDidDismiss: async () => ({
          role: options.alertRole ?? 'confirm',
          data: {
            values: {
              maintenanceAccessCode: options.accessCode ??
                PRODUCT_PAGE_MAINTENANCE_ACCESS_TEST_CODE,
            },
          },
        }),
      };
    },
  );

  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [ProductPage],
    providers: [
      { provide: BleService, useValue: bleService },
      { provide: AlertController, useValue: { create: alertCreate } },
      {
        provide: BleWriteExecutionService,
        useValue: writeExecutionService,
      },
      {
        provide: MaintenanceAccessService,
        useValue: maintenanceAccessService,
      },
      { provide: ProductDataLoadService, useValue: loadService },
      { provide: ProductDetection, useClass: ProductDetection },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data: { profile } } },
      },
      {
        provide: Router,
        useValue: {
          getCurrentNavigation: () => ({
            extras: { state: navigationState(profile) },
          }),
          navigate: jasmine.createSpy('navigate').and.resolveTo(true),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProductPage);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  await component.refreshProductData();
  fixture.detectChanges();

  return {
    fixture,
    component,
    bleService,
    loadService,
    writeExecutionService,
    maintenanceAccessService,
    alertCreate,
    alertOptions,
  };
}

function productDateLoadResult(
  profile: KnownProductProfile,
  firstCommissioningDate: BleDatesAndCycles['firstCommissioningDate'],
  status: ProductDataLoadStatus = 'success',
): ProductDataLoadResult {
  const base = completeLoadResult(status, profile);
  return {
    ...base,
    results: {
      ...base.results,
      datesAndCycles: successRead(
        'dates-and-cycles',
        BLE_UUIDS.datesAndCyclesCharacteristic,
        {
          ...datesValue(),
          firstCommissioningDate,
        },
      ),
    },
  };
}

function productDateExecutionResult(
  profile: KnownProductProfile,
  operation: 'maintenance-date' | 'first-commissioning-date',
  payloadHex: string,
  status: LegacyBleWriteExecutionResult['status'] = 'success',
): LegacyBleWriteExecutionResult {
  return {
    status,
    operation,
    profile,
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid: BLE_UUIDS.datesAndCyclesCharacteristic,
    payloadHex,
    length: 5,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: status === 'success',
    confirmationStatus: status === 'success' ? 'not-required' : 'unavailable',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: status === 'success'
      ? null
      : { code: 'product-date-test-error', message: 'Product date error' },
  };
}

function notInitializedHistoricalDate():
  BleDatesAndCycles['firstCommissioningDate'] {
  return {
    status: 'not-initialized',
    rawYear: 0xff,
    rawMonth: 0xff,
    rawDay: 0xff,
    rawHour: 0xff,
    raw: [0xff, 0xff, 0xff, 0xff],
    year: null,
    month: null,
    day: null,
    hour: null,
    invalidReason: null,
  };
}

function presentHistoricalDate(): BleDatesAndCycles['firstCommissioningDate'] {
  return {
    status: 'present',
    rawYear: 26,
    rawMonth: 0,
    rawDay: 2,
    rawHour: 3,
    raw: [26, 0, 2, 3],
    year: 2026,
    month: 1,
    day: 2,
    hour: 3,
    invalidReason: null,
  };
}

async function waitForCondition(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) {
      return;
    }
    await Promise.resolve();
  }
  throw new Error('The asynchronous test condition was not reached.');
}

function writableGattProperties(
  overrides: Partial<BleGattCharacteristicProperties> = {},
): BleGattCharacteristicProperties {
  return {
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid: BLE_UUIDS.motorCommandCharacteristic,
    servicePresent: true,
    characteristicPresent: true,
    propertiesAvailable: true,
    read: false,
    write: true,
    writeWithoutResponse: false,
    notify: false,
    indicate: false,
    descriptorUuids: [],
    rawProperties: { write: true },
    ...overrides,
  };
}

function openExecutionResult(
  status: LegacyBleWriteExecutionResult['status'],
  confirmationStatus: LegacyBleWriteExecutionResult['confirmationStatus'],
  errorCode: string | null = status === 'success' ? null : 'open-test-error',
  operation = 'motor-open',
): LegacyBleWriteExecutionResult {
  const nativeWriteCompleted = status === 'success' || status === 'timeout';
  const timed = operation === 'motor-open-short-timed' ||
    operation === 'motor-open-long-timed';
  const confirmed = confirmationStatus === 'confirmed';
  const payloadHex = operation === 'motor-close'
    ? '00 30'
    : operation === 'motor-open-short-timed'
      ? '00 21 00 00'
      : operation === 'motor-open-long-timed'
        ? '00 22'
        : '00 20 00 00';
  return {
    status,
    operation,
    profile: 'widoor',
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid: BLE_UUIDS.motorCommandCharacteristic,
    payloadHex,
    length: payloadHex.split(' ').length,
    destructiveLevel: 'motor-movement',
    hardwareValidationStatus: operation === 'motor-open'
      ? 'validated-widoor-old-firmware'
      : 'phase1-reference-only',
    policyOverrideUsed: operation !== 'motor-open',
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted,
    confirmationStatus,
    confirmedMotorStateRaw: confirmed
      ? operation === 'motor-close' ? 0x31 : 0x21
      : null,
    movementStartConfirmed: confirmed,
    timedCycleValidationStatus: timed
      ? confirmed
        ? 'pending-physical-validation'
        : status === 'timeout'
          ? 'not-observed'
          : 'failed'
      : 'not-observed',
    error: errorCode === null
      ? null
      : { code: errorCode, message: 'Native OPEN error' },
  };
}

function lockModeExecutionResult(
  profile: KnownProductProfile,
  payloadHex: '00 00' | '00 01' | '00 02',
): LegacyBleWriteExecutionResult {
  return {
    status: 'success',
    operation: 'lock-mode',
    profile,
    deviceId: 'device-1',
    serviceUuid: profile === 'widoor'
      ? BLE_UUIDS.widoorService
      : BLE_UUIDS.moventivGarlineService,
    characteristicUuid: BLE_UUIDS.userParametersCharacteristic,
    payloadHex,
    length: 2,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: true,
    confirmationStatus: 'not-required',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: null,
  };
}

function userSpeedExecutionResult(
  profile: KnownProductProfile,
  operation: 'open-speed' | 'close-speed',
  payloadHex: string,
): LegacyBleWriteExecutionResult {
  return {
    status: 'success',
    operation,
    profile,
    deviceId: 'device-1',
    serviceUuid: profile === 'widoor'
      ? BLE_UUIDS.widoorService
      : BLE_UUIDS.moventivGarlineService,
    characteristicUuid: BLE_UUIDS.userParametersCharacteristic,
    payloadHex,
    length: 2,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: true,
    confirmationStatus: 'not-required',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: null,
  };
}

function userTimingExecutionResult(
  profile: KnownProductProfile,
  operation: 'short-timing' | 'long-timing',
  payloadHex: string,
): LegacyBleWriteExecutionResult {
  return {
    status: 'success',
    operation,
    profile,
    deviceId: 'device-1',
    serviceUuid: profile === 'widoor'
      ? BLE_UUIDS.widoorService
      : BLE_UUIDS.moventivGarlineService,
    characteristicUuid: BLE_UUIDS.userParametersCharacteristic,
    payloadHex,
    length: 2,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: true,
    confirmationStatus: 'not-required',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: null,
  };
}

function userPeripheralExecutionResult(
  profile: KnownProductProfile,
  operation: 'static-light' | 'dynamic-light' | 'rgb-indicator',
  payloadHex: string,
): LegacyBleWriteExecutionResult {
  return {
    status: 'success',
    operation,
    profile,
    deviceId: 'device-1',
    serviceUuid: profile === 'widoor'
      ? BLE_UUIDS.widoorService
      : BLE_UUIDS.moventivGarlineService,
    characteristicUuid: BLE_UUIDS.userParametersCharacteristic,
    payloadHex,
    length: 3,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: true,
    confirmationStatus: 'not-required',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: null,
  };
}

function nameRoomExecutionResult(
  profile: KnownProductProfile,
  payloadHex: string,
): LegacyBleWriteExecutionResult {
  return {
    status: 'success',
    operation: 'name-room',
    profile,
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid: BLE_UUIDS.nameCharacteristic,
    payloadHex,
    length: payloadHex.split(' ').length,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: true,
    confirmationStatus: 'not-required',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: null,
  };
}

function weightRangeExecutionResult(
  profile: Exclude<KnownProductProfile, 'widoor'>,
  payloadHex: string,
  status: LegacyBleWriteExecutionResult['status'] = 'success',
): LegacyBleWriteExecutionResult {
  return {
    status,
    operation: 'weight-range',
    profile,
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.moventivGarlineService,
    characteristicUuid: BLE_UUIDS.professionalParametersCharacteristic,
    payloadHex,
    length: 3,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: status === 'success',
    confirmationStatus: status === 'success' ? 'not-required' : 'unavailable',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: status === 'success'
      ? null
      : { code: 'weight-range-test-error', message: 'Weight range error' },
  };
}

function professionalScalarExecutionResult(
  profile: KnownProductProfile,
  operation:
    | 'break-force-at-open'
    | 'near-open-speed'
    | 'near-close-speed'
    | 'near-open-torque'
    | 'near-close-torque'
    | 'braking-open-power'
    | 'obstacle-sensitivity',
  payloadHex: string,
  status: LegacyBleWriteExecutionResult['status'] = 'success',
): LegacyBleWriteExecutionResult {
  return {
    status,
    operation,
    profile,
    deviceId: 'device-1',
    serviceUuid: profile === 'widoor'
      ? BLE_UUIDS.widoorService
      : BLE_UUIDS.moventivGarlineService,
    characteristicUuid: BLE_UUIDS.professionalParametersCharacteristic,
    payloadHex,
    length: 2,
    destructiveLevel: 'non-destructive-setting',
    hardwareValidationStatus: 'phase1-reference-only',
    policyOverrideUsed: true,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted: status === 'success',
    confirmationStatus: status === 'success' ? 'not-required' : 'unavailable',
    confirmedMotorStateRaw: null,
    movementStartConfirmed: false,
    timedCycleValidationStatus: 'not-observed',
    error: status === 'success'
      ? null
      : {
        code: 'professional-scalar-test-error',
        message: 'Professional scalar error',
      },
  };
}

function completeLoadResult(
  status: ProductDataLoadStatus,
  profile: KnownProductProfile = 'widoor',
  userParameters: BleUserParameters = userValue(),
  professionalParameters: BleProfessionalParameters = professionalValue(
    profile,
  ),
): ProductDataLoadResult {
  return {
    profile,
    deviceId: 'device-1',
    connectionGeneration: 4,
    startedAt: 10,
    completedAt: 20,
    status,
    executedOrder: [
      'version',
      'datesAndCycles',
      'maintenance',
      'userParameters',
      'professionalParameters',
    ],
    results: {
      version: successRead(
        'version',
        BLE_UUIDS.versionCharacteristic,
        versionValue(),
      ),
      datesAndCycles: successRead(
        'dates-and-cycles',
        BLE_UUIDS.datesAndCyclesCharacteristic,
        datesValue(),
      ),
      maintenance: successRead(
        'maintenance',
        BLE_UUIDS.maintenanceCharacteristic,
        maintenanceValue(),
      ),
      userParameters: successRead(
        'user-parameters',
        BLE_UUIDS.userParametersCharacteristic,
        userParameters,
      ),
      professionalParameters: successRead(
        'professional-parameters',
        BLE_UUIDS.professionalParametersCharacteristic,
        professionalParameters,
      ),
    },
    notRequested: [],
    unavailable: [],
    partialSuccess: status === 'partial-success',
    error: null,
  };
}

function partialLoadResult(): ProductDataLoadResult {
  const base = completeLoadResult('partial-success');
  return {
    ...base,
    results: {
      version: base.results.version,
      datesAndCycles: base.results.datesAndCycles,
      maintenance: failedRead(
        'maintenance',
        BLE_UUIDS.maintenanceCharacteristic,
        'Native maintenance failure',
      ),
      userParameters: invalidRead(
        'user-parameters',
        BLE_UUIDS.userParametersCharacteristic,
      ),
      professionalParameters: unavailableRead(
        'professional-parameters',
        BLE_UUIDS.professionalParametersCharacteristic,
      ),
    },
    unavailable: ['professionalParameters'],
    partialSuccess: true,
  };
}

function oldWidoorLoadResult(): ProductDataLoadResult {
  const base = completeLoadResult('partial-success');
  return {
    ...base,
    results: {
      version: base.results.version,
      datesAndCycles: base.results.datesAndCycles,
      maintenance: base.results.maintenance,
      userParameters: unavailableRead(
        'user-parameters',
        BLE_UUIDS.userParametersCharacteristic,
      ),
      professionalParameters: unavailableRead(
        'professional-parameters',
        BLE_UUIDS.professionalParametersCharacteristic,
      ),
    },
    unavailable: ['userParameters', 'professionalParameters'],
    partialSuccess: true,
  };
}

function moventivGarlineUnavailableParameterLoadResult(
  profile: 'moventiv-60' | 'moventiv-80' | 'garline',
): ProductDataLoadResult {
  const base = completeLoadResult('partial-success', profile);
  return {
    ...base,
    profile,
    results: {
      version: base.results.version,
      datesAndCycles: base.results.datesAndCycles,
      maintenance: base.results.maintenance,
      userParameters: unavailableRead(
        'user-parameters',
        BLE_UUIDS.userParametersCharacteristic,
      ),
      professionalParameters: unavailableRead(
        'professional-parameters',
        BLE_UUIDS.professionalParametersCharacteristic,
      ),
    },
    unavailable: ['userParameters', 'professionalParameters'],
    partialSuccess: true,
  };
}

function successRead<T>(
  type: BleReadType,
  characteristicUuid: string,
  value: T,
): BleTypedReadResult<T> {
  const decoded: BleDecodeSuccess<T> = {
    valid: true,
    value,
    rawHex: '00',
    length: 1,
    errors: [],
  };
  return readResult(type, characteristicUuid, 'success', decoded, null);
}

function invalidRead<T>(
  type: BleReadType,
  characteristicUuid: string,
): BleTypedReadResult<T> {
  const decoded: BleDecodeFailure = {
    valid: false,
    value: null,
    rawHex: '00',
    length: 1,
    errors: ['Invalid fixture'],
  };
  return readResult<T>(type, characteristicUuid, 'invalid-frame', decoded, {
    code: 'invalid-frame',
    message: 'Invalid fixture',
  });
}

function unavailableRead<T>(
  type: BleReadType,
  characteristicUuid: string,
): BleTypedReadResult<T> {
  return readResult(type, characteristicUuid, 'unavailable', null, {
    code: 'characteristic-absent',
    message: `The required GATT characteristic ${characteristicUuid} ` +
      'is absent.',
  });
}

function failedRead<T>(
  type: BleReadType,
  characteristicUuid: string,
  message: string,
): BleTypedReadResult<T> {
  return readResult(type, characteristicUuid, 'failed', null, {
    code: 'native-read-failed',
    message,
  });
}

function readResult<T>(
  type: BleReadType,
  characteristicUuid: string,
  status: BleReadStatus,
  decoded: BleTypedReadResult<T>['decoded'],
  error: BleTypedReadResult<T>['error'],
): BleTypedReadResult<T> {
  return {
    type,
    profile: 'widoor',
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid,
    startedAt: 10,
    completedAt: 20,
    status,
    decoded,
    error,
  };
}

function failedViewState(
  code: BleReadError['code'],
  status: Exclude<BleReadStatus, 'success'>,
): ProductReadViewState<never> {
  return {
    status: status === 'invalid-frame'
      ? 'invalid'
      : status,
    readStatus: status,
    value: null,
    result: readResult<never>(
      'version',
      BLE_UUIDS.versionCharacteristic,
      status,
      null,
      { code, message: 'Native message' },
    ),
  };
}

function versionValue(): BleVersionFrame {
  return {
    stack: { major: 3, minor: 5, patch: 3, build: 348 },
    bleSoftware: { major: 1, minor: 0, patch: 0, specification: 0 },
    productType: 1,
    productSubtype: 0,
    motorSoftware: { major: 1, minor: 0, patch: 1, specification: 0 },
    crc: 202,
    motorAddressHex: null,
  };
}

function datesValue(): BleDatesAndCycles {
  return {
    historicalFadDate: {
      status: 'raw-only',
      rawYear: 0,
      rawMonth: 0,
      rawDay: 0,
      raw: [0, 0, 0],
    },
    firstCommissioningDate: {
      status: 'present',
      rawYear: 19,
      rawMonth: 7,
      rawDay: 27,
      rawHour: 0,
      raw: [19, 7, 27, 0],
      year: 2019,
      month: 8,
      day: 27,
      hour: 0,
      invalidReason: null,
    },
    lastMaintenanceDate: {
      status: 'invalid',
      rawYear: 0,
      rawMonth: 0,
      rawDay: 0,
      rawHour: 0,
      raw: [0, 0, 0, 0],
      year: null,
      month: null,
      day: null,
      hour: null,
      invalidReason: 'zero-date',
    },
    totalCycles: 26580,
    cyclesSinceMaintenance: 0,
  };
}

function maintenanceValue(): BleMaintenance {
  return {
    initializationCount: 25,
    cyclesSinceInitialization: 14,
    obstacleDetectionCount: 80,
    wrongStopOpenCount: 5,
    wrongStopCloseCount: 0,
    learningCycleCount: 0,
    encoderErrorCount: 0,
    motorErrorCount: 0,
  };
}

function userValue(): BleUserParameters {
  return {
    lockModeRaw: 0,
    lockMode: 'none',
    openSpeed: 25,
    closeSpeed: 35,
    shortOpenTime: 0,
    longOpenTime: 1,
    peripheralByte1: 0,
    peripheralByte2: 0,
    peripheralFlags: {
      dynamicLight: false,
      staticLight: false,
      light1: false,
      light2: false,
      rgbIndicator: false,
    },
  };
}

function userValueWithLockMode(
  lockMode: BleUserParameters['lockMode'],
): BleUserParameters {
  const raw: Record<BleUserParameters['lockMode'], number> = {
    none: 0,
    'locked-open': 1,
    'locked-closed': 2,
    unknown: 9,
  };
  return {
    ...userValue(),
    lockMode,
    lockModeRaw: raw[lockMode],
  };
}

function userValueWithSpeeds(
  openSpeed: number,
  closeSpeed: number,
): BleUserParameters {
  return {
    ...userValue(),
    openSpeed,
    closeSpeed,
  };
}

function userValueWithTimings(
  shortOpenTime: number,
  longOpenTime: number,
): BleUserParameters {
  return {
    ...userValue(),
    shortOpenTime,
    longOpenTime,
  };
}

function userValueWithPeripherals(
  flags: Partial<BleUserParameters['peripheralFlags']>,
): BleUserParameters {
  return {
    ...userValue(),
    peripheralFlags: {
      ...userValue().peripheralFlags,
      ...flags,
    },
  };
}

interface ProfessionalValueOverrides {
  readonly breakForceAtOpen?: number;
  readonly nearOpenSpeed?: number;
  readonly nearCloseSpeed?: number;
  readonly brakingOpenPower?: number;
  readonly obstacleSensitivity?: number;
  readonly nearOpenTorque?: number;
  readonly nearCloseTorque?: number;
}

function professionalValue(
  profile: KnownProductProfile = 'widoor',
  weightRangeLower = 0,
  weightRangeUpper = 0,
  overrides: ProfessionalValueOverrides = {},
): BleProfessionalParameters {
  const common = {
    weightRangeLower,
    weightRangeUpper,
    nearOpenSpeed: overrides.nearOpenSpeed ?? 70,
    nearCloseSpeed: overrides.nearCloseSpeed ?? 50,
    nearOpenTorque: overrides.nearOpenTorque ?? 0,
    nearCloseTorque: overrides.nearCloseTorque ?? 0,
    peripheralByte1: 0,
    peripheralByte2: 0,
  };
  if (profile === 'widoor') {
    return {
      ...common,
      profile,
      breakForceAtOpen: overrides.breakForceAtOpen ?? 1,
      nearOpenProportional: 0,
      nearCloseProportional: 0,
      nearOpenIntegral: 0,
      nearCloseIntegral: 0,
    };
  }
  return {
    ...common,
    profile,
    exactWeight: 0,
    brakingOpenPower: overrides.brakingOpenPower ?? 0,
    obstacleSensitivity: overrides.obstacleSensitivity ?? 0,
    nearOpenIntegral: 0,
    nearCloseIntegral: 0,
  };
}
