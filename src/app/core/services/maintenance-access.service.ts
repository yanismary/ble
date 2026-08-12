import { Injectable } from '@angular/core';

import { KnownProductProfile } from './product-data-load.service';

export interface MaintenanceAccessContext {
  readonly profile: KnownProductProfile;
  readonly deviceId: string;
  readonly connectionGeneration: number;
}

const LEGACY_MAINTENANCE_ACCESS_CODES = new Set(['MovMaint', 'service']);

@Injectable({ providedIn: 'root' })
export class MaintenanceAccessService {
  private authenticatedContext: MaintenanceAccessContext | null = null;

  isAuthenticated(context: MaintenanceAccessContext | null): boolean {
    return context !== null &&
      this.authenticatedContext !== null &&
      this.sameContext(this.authenticatedContext, context);
  }

  authenticate(
    context: MaintenanceAccessContext,
    accessCode: string,
  ): boolean {
    if (!LEGACY_MAINTENANCE_ACCESS_CODES.has(accessCode)) {
      return false;
    }
    this.authenticatedContext = Object.freeze({ ...context });
    return true;
  }

  reset(context?: MaintenanceAccessContext): void {
    if (context === undefined ||
        (this.authenticatedContext !== null &&
          this.sameContext(this.authenticatedContext, context))) {
      this.authenticatedContext = null;
    }
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
