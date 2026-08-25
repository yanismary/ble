import { Injectable } from '@angular/core';

export type ProductExitDisconnectStatus = 'success' | 'failed';

export interface ProductExitState {
  readonly deviceId: string;
  readonly disconnectStatus: ProductExitDisconnectStatus;
}

@Injectable({ providedIn: 'root' })
export class ProductExitStateService {
  private pendingState: ProductExitState | null = null;

  record(state: ProductExitState): void {
    this.pendingState = Object.freeze({ ...state });
  }

  consume(): ProductExitState | null {
    const state = this.pendingState;
    this.pendingState = null;
    return state;
  }

  clear(): void {
    this.pendingState = null;
  }
}
