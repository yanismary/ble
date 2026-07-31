import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import {
  BleDisconnectionEvent,
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
  isWriting = false;
  readonly writeCharacteristic = jasmine.createSpy('writeCharacteristic');

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
  let routerNavigate: jasmine.Spy;
  let routerNavigationState: ProductPageNavigationState;

  beforeEach(async () => {
    bleService = new FakeBleService();
    loadService = new FakeProductDataLoadService();
    routerNavigate = jasmine.createSpy('navigate').and.resolveTo(true);
    routerNavigationState = navigationState('widoor');

    await TestBed.configureTestingModule({
      imports: [ProductPage],
      providers: [
        { provide: BleService, useValue: bleService },
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
      expect(element.textContent).not.toContain('Ouvrir');
      expect(element.textContent).not.toContain('Fermer');
    },
  );

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
    expect(isProductPageNavigationState(navigationState('widoor'))).toBeTrue();
  });
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
