import {
  BleDatesAndCycles,
  BleMaintenance,
  BleAdvancedParameters,
  BleUserParameters,
  BleVersionFrame,
} from '../../../../core/services/ble-read-decoders';
import {
  BleReadStatus,
  BleTypedReadResult,
} from '../../../../core/services/ble-read.service';
import {
  KnownProductProfile,
  ProductDataLoadStatus,
} from '../../../../core/services/product-data-load.service';
import { MotorStateFrame } from
  '../../../../core/services/product-detection';

export type ProductConnectionState =
  | 'connected'
  | 'demo'
  | 'disconnected'
  | 'stale'
  | 'invalid-profile';

export type ProductReadViewStatus =
  | 'not-loaded'
  | 'available'
  | 'invalid'
  | 'unavailable'
  | 'failed'
  | 'disconnected'
  | 'stale';

interface ProductReadViewAvailable<T> {
  readonly status: 'available';
  readonly readStatus: 'success';
  readonly value: T;
  readonly result: BleTypedReadResult<T> | null;
}

interface ProductReadViewUnavailable<T> {
  readonly status: Exclude<ProductReadViewStatus, 'available'>;
  readonly readStatus: BleReadStatus | null;
  readonly value: null;
  readonly result: BleTypedReadResult<T> | null;
}

export type ProductReadViewState<T> =
  | ProductReadViewAvailable<T>
  | ProductReadViewUnavailable<T>;

export interface ProductReadViewStates {
  readonly version: ProductReadViewState<BleVersionFrame>;
  readonly datesAndCycles: ProductReadViewState<BleDatesAndCycles>;
  readonly maintenance: ProductReadViewState<BleMaintenance>;
  readonly userParameters: ProductReadViewState<BleUserParameters>;
  readonly advancedParameters: ProductReadViewState<
    BleAdvancedParameters
  >;
}

export interface ProductViewModel {
  readonly profile: KnownProductProfile;
  readonly productName: string;
  readonly displayedName: string;
  readonly roomSuffix: string | null;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly connectionState: ProductConnectionState;
  readonly motorState: MotorStateFrame | null;
  readonly reads: ProductReadViewStates;
  readonly loading: boolean;
  readonly loadStatus: ProductDataLoadStatus | null;
  readonly partialSuccess: boolean;
  readonly lastUpdatedAt: number | null;
  readonly globalError: string | null;
}

export interface ProductPageNavigationState {
  readonly mode?: 'connected' | 'demo';
  readonly profile: KnownProductProfile;
  readonly deviceId: string;
  readonly connectionGeneration: number;
  readonly connectionPerformanceStartedAt?: number;
  readonly displayName: string;
  readonly identificationConfidence: 'strong' | 'demo';
  readonly motorState: MotorStateFrame | null;
}

export interface ProductDisplayRow {
  readonly key: string;
  readonly label: string;
  readonly value: string;
}
