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
import { ProductDetection } from '../../core/services/product-detection';
import {
  BleWriteExecutionService,
  LegacyBleWriteExecutionResult,
  LegacyBleWriteRequest,
} from '../../core/services/ble-write-execution.service';
import {
  ProductPage,
  formatProductTimestamp,
  isProductPageNavigationState,
} from './product.page';
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

  disconnect(): void {
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
  readonly execute = jasmine.createSpy('execute')
    .and.callFake(async (_request: LegacyBleWriteRequest) => this.nextResult);
}

class FakeProductDataLoadService {
  isLoading = false;
  nextResult = completeLoadResult('success');
  readonly loadProductData = jasmine.createSpy('loadProductData')
    .and.callFake(async () => this.nextResult);
  readonly cancelCurrentLoad = jasmine.createSpy('cancelCurrentLoad')
    .and.returnValue(true);
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

  it('should not load automatically and should expose only manual refresh',
    async () => {
      expect(loadService.loadProductData).not.toHaveBeenCalled();

      await component.refreshProductData();

      expect(loadService.loadProductData)
        .toHaveBeenCalledOnceWith('widoor', 'device-1');
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('ion-range')).toBeNull();
      expect(element.querySelector('ion-toggle')).toBeNull();
      expect(element.textContent).not.toContain('Fermer');
    },
  );

  it('should expose only Widoor OPEN without executing it automatically',
    () => {
      const element = fixture.nativeElement as HTMLElement;
      const openButton = element.querySelector<HTMLIonButtonElement>(
        'ion-button.widoor-open-command',
      );

      expect(openButton).not.toBeNull();
      expect(openButton?.disabled).toBeFalse();
      expect(element.textContent).toContain(component.text.openCommand.open);
      expect(element.textContent).not.toContain('Fermer');
      expect(element.textContent).not.toContain('Apprentissage');
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(alertCreate).not.toHaveBeenCalled();
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should cancel user confirmation without creating an execution request',
    async () => {
      await component.requestWidoorOpen();
      fixture.detectChanges();

      expect(alertCreate).toHaveBeenCalledTimes(1);
      expect(alertOptions[0]['header'])
        .toBe(component.text.openCommand.confirmTitle);
      expect(alertOptions[0]['message'])
        .toBe(component.text.openCommand.confirmMessage);
      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(component.openCommandState.status).toBe('cancelled');
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should treat Android back or backdrop dismissal as cancellation',
    async () => {
      alertRole = 'backdrop';

      await component.requestWidoorOpen();

      expect(writeExecutionService.execute).not.toHaveBeenCalled();
      expect(component.openCommandState.status).toBe('cancelled');
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
      expect(request.policy).toBeUndefined();
      expect(request.authorization?.confirmedByUser).toBeTrue();
      expect(request.authorization?.motorMovementConfirmed).toBeTrue();
      expect(request.authorization?.attemptId).toBe(request.attemptId);
      expect(request.authorization?.operation).toBe(request.write.operation);
      expect(request.authorization?.payloadHex).toBe(request.write.payloadHex);
      expect((request.authorization?.expiresAt ?? 0) -
        (request.authorization?.confirmedAt ?? 0)).toBe(15_000);
      expect(component.openCommandState.status).toBe('confirmed');
      expect(component.openCommandState.confirmationStatus).toBe('confirmed');
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
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

    const first = component.requestWidoorOpen();
    await Promise.resolve();
    const second = component.requestWidoorOpen();
    await second;

    expect(alertCreate).toHaveBeenCalledTimes(1);
    expect(writeExecutionService.execute).not.toHaveBeenCalled();
    dismissAlert();
    await first;
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
          component.text.openCommand.confirmed],
        [openExecutionResult('timeout', 'timeout'), 'timeout',
          component.text.openCommand.notConfirmed],
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
          component.text.openCommand.notConfirmed],
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
    let confirmAlert!: () => void;
    alertCreate.and.callFake(async (options: Record<string, unknown>) => {
      alertOptions.push(options);
      return {
        present: async () => undefined,
        onDidDismiss: () => new Promise<{ role: string }>((resolve) => {
          confirmAlert = () => resolve({ role: 'confirm' });
        }),
      };
    });
    const pending = component.requestWidoorOpen();
    await waitForCondition(() => confirmAlert !== undefined);

    bleService.disconnect();
    confirmAlert();
    await pending;

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
    expect(text).toContain('Cycles depuis maintenance');
    expect(text).toContain('0');
    expect(text).toContain('Éclairage statique');
    expect(text).toContain('Non');
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
      expect(text).toContain(component.text.states.partialSuccess);
      expect(text.match(/Succès partiel/g)?.length).toBe(1);
      expect(text).not.toContain('Succès partiel — Succès partiel');
      expect(text).toContain(component.text.states.invalid);
      expect(text).toContain(component.text.states.unavailable);
      expect(text).toContain(component.text.errors.unknown);
      expect(text).not.toContain('Native maintenance failure');
      expect(text).toContain('3.5.3.348');
    },
  );

  it('should clearly support an old Widoor with unavailable settings',
    async () => {
      loadService.nextResult = oldWidoorLoadResult();

      await component.refreshProductData();
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent as string;

      expect(component.viewModel.reads.userParameters.value).toBeNull();
      expect(component.viewModel.reads.professionalParameters.value).toBeNull();
      expect(text.match(/Non disponible sur ce firmware/g)?.length ?? 0)
        .toBeGreaterThan(1);
      expect(text).not.toContain('The required GATT characteristic');
      expect(text).toContain('27/08/2019');
      expect(text).toContain('Initialisations');
    },
  );

  it('should keep native errors and UUIDs out of the main presentation',
    async () => {
      loadService.nextResult = oldWidoorLoadResult();

      await component.refreshProductData();
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const details = element.querySelector<HTMLDetailsElement>(
        'details.technical-details',
      );

      expect(details).not.toBeNull();
      expect(details?.open).toBeFalse();
      expect(details?.textContent).toContain(
        BLE_UUIDS.userParametersCharacteristic,
      );
      const mainPresentation = element.cloneNode(true) as HTMLElement;
      mainPresentation.querySelector('details.technical-details')?.remove();
      expect(mainPresentation.textContent).not.toContain(
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
        'details.technical-details',
      );

      expect(details).not.toBeNull();
      expect(details?.hasAttribute('open')).toBeFalse();
      expect(details?.textContent).toContain(component.text.rawFrame);
      const mainPresentation = element.cloneNode(true) as HTMLElement;
      mainPresentation.querySelector('details.technical-details')?.remove();
      expect(mainPresentation.textContent).not.toContain(
        component.text.rawFrame,
      );
    },
  );

  it('should display a deterministic French refresh timestamp and room label',
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
      expect(text).toContain('31/07/2026 11:47:03');
      expect(text).not.toMatch(/\b(?:AM|PM)\b/);
      expect(text).toContain(component.text.room);
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
      const text = fixture.nativeElement.textContent as string;

      expect(text).toContain('Début ouverture');
      expect(text).toContain('0 %');
      expect(bleService.writeCharacteristic).not.toHaveBeenCalled();
    },
  );

  it('should expose each global state once without inventing data', () => {
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
      expect(summary?.textContent?.trim())
        .withContext(status)
        .toBe(label);
    }
  });

  it('should contain a responsive read-only layout and return to Scan', () => {
    expect(fixture.nativeElement.querySelector(
      '.product-readonly-grid',
    )).not.toBeNull();

    component.backToScan();

    expect(routerNavigate).toHaveBeenCalledOnceWith(['/scan']);
  });

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
    it(`should keep ${profile} commands non-interactive`, async () => {
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
        .toBeNull();
      expect(element.textContent).toContain(
        fixture.componentInstance.text.commandsUnavailable,
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
): LegacyBleWriteExecutionResult {
  const nativeWriteCompleted = status === 'success' || status === 'timeout';
  return {
    status,
    operation: 'motor-open',
    profile: 'widoor',
    deviceId: 'device-1',
    serviceUuid: BLE_UUIDS.shdoService,
    characteristicUuid: BLE_UUIDS.motorCommandCharacteristic,
    payloadHex: '00 20 00 00',
    length: 4,
    destructiveLevel: 'motor-movement',
    hardwareValidationStatus: 'validated-widoor-old-firmware',
    policyOverrideUsed: false,
    startedAt: 100,
    completedAt: 200,
    connectionGeneration: 4,
    nativeWriteCompleted,
    confirmationStatus,
    error: errorCode === null
      ? null
      : { code: errorCode, message: 'Native OPEN error' },
  };
}

function completeLoadResult(
  status: ProductDataLoadStatus,
): ProductDataLoadResult {
  return {
    profile: 'widoor',
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
        userValue(),
      ),
      professionalParameters: successRead(
        'professional-parameters',
        BLE_UUIDS.professionalParametersCharacteristic,
        professionalValue(),
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

function professionalValue(): BleProfessionalParameters {
  return {
    profile: 'widoor',
    weightRangeLower: 0,
    weightRangeUpper: 0,
    breakForceAtOpen: 1,
    nearOpenSpeed: 70,
    nearCloseSpeed: 50,
    nearOpenTorque: 0,
    nearCloseTorque: 0,
    nearOpenProportional: 0,
    nearCloseProportional: 0,
    nearOpenIntegral: 0,
    nearCloseIntegral: 0,
    peripheralByte1: 0,
    peripheralByte2: 0,
  };
}
