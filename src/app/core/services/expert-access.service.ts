import { Injectable } from '@angular/core';

import { KnownProductProfile } from './product-data-load.service';

export interface ExpertAccessContext {
  readonly profile: KnownProductProfile;
  readonly deviceId: string;
  readonly connectionGeneration: number;
}

const LEGACY_EXPERT_ACCESS_CODES = new Set(['expert', 'WidoorSAV']);

@Injectable({ providedIn: 'root' })
export class ExpertAccessService {
  private authenticatedContext: ExpertAccessContext | null = null;

  isAuthenticated(context: ExpertAccessContext | null): boolean {
    return context !== null &&
      this.authenticatedContext !== null &&
      this.sameContext(this.authenticatedContext, context);
  }

  authenticate(
    context: ExpertAccessContext,
    accessCode: string,
  ): boolean {
    if (!LEGACY_EXPERT_ACCESS_CODES.has(accessCode)) {
      return false;
    }
    this.authenticatedContext = Object.freeze({ ...context });
    return true;
  }

  reset(context?: ExpertAccessContext): void {
    if (context === undefined ||
        (this.authenticatedContext !== null &&
          this.sameContext(this.authenticatedContext, context))) {
      this.authenticatedContext = null;
    }
  }

  private sameContext(
    first: ExpertAccessContext,
    second: ExpertAccessContext,
  ): boolean {
    return first.profile === second.profile &&
      first.deviceId === second.deviceId &&
      first.connectionGeneration === second.connectionGeneration;
  }
}
