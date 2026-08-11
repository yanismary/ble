import { Injectable } from '@angular/core';

import { KnownProductProfile } from './product-data-load.service';

export interface ProfessionalAccessContext {
  readonly profile: KnownProductProfile;
  readonly deviceId: string;
  readonly connectionGeneration: number;
}

const LEGACY_EXPERT_ACCESS_CODES = new Set(['expert', 'WidoorSAV']);

@Injectable({ providedIn: 'root' })
export class ProfessionalAccessService {
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
    if (!LEGACY_EXPERT_ACCESS_CODES.has(accessCode)) {
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
