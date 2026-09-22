import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';

export const CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS =
  10 * 60 * 1000;

export const CONNECTED_PRODUCT_RESUME_CHECK_DELAY_MS = 300;
const WRITE_COMPLETION_RETRY_MS = 250;
const USER_ACTIVITY_EVENTS = Object.freeze([
  'pointerdown',
  'touchstart',
  'click',
  'keydown',
  'input',
  'change',
  'wheel',
  'scroll',
] as const);

export interface ConnectedProductInactivitySession {
  readonly id: string;
  readonly isWriteInProgress: () => boolean;
  readonly onTimeout: () => boolean | void | Promise<boolean | void>;
}

@Injectable({
  providedIn: 'root',
})
export class ConnectedProductInactivityService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly ngZone = inject(NgZone);
  private session: ConnectedProductInactivitySession | null = null;
  private lastUserInteractionAt = 0;
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  private resumeTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
  private appStateListener: PluginListenerHandle | null = null;
  private foreground = true;
  private expirationPending = false;
  private expirationInProgress = false;
  private destroyed = false;

  private readonly handleUserActivity = (): void => {
    this.recordUserInteraction();
  };

  constructor() {
    this.ngZone.runOutsideAngular(() => {
      for (const eventName of USER_ACTIVITY_EVENTS) {
        this.document.addEventListener(
          eventName,
          this.handleUserActivity,
          true,
        );
      }
      void App.addListener('appStateChange', ({ isActive }) => {
        this.handleAppStateChange(isActive);
      }).then((listener) => {
        if (this.destroyed) {
          void listener.remove();
          return;
        }
        this.appStateListener = listener;
      }).catch(() => undefined);
    });
  }

  start(session: ConnectedProductInactivitySession): void {
    if (this.destroyed) {
      return;
    }
    if (this.session?.id === session.id) {
      this.session = session;
      if (this.expirationPending && this.foreground &&
          !this.expirationInProgress) {
        this.checkForExpiration();
      }
      return;
    }
    this.clearResumeTimeout();
    this.session = session;
    this.lastUserInteractionAt = Date.now();
    this.expirationPending = false;
    this.expirationInProgress = false;
    this.scheduleForRemainingTime();
  }

  stop(sessionId?: string): void {
    if (sessionId !== undefined && this.session?.id !== sessionId) {
      return;
    }
    this.clearResumeTimeout();
    this.clearScheduledTimeout();
    this.session = null;
    this.lastUserInteractionAt = 0;
    this.expirationPending = false;
    this.expirationInProgress = false;
  }

  isMonitoring(sessionId?: string): boolean {
    return this.session !== null &&
      (sessionId === undefined || this.session.id === sessionId);
  }

  isAppActive(): boolean {
    return this.foreground;
  }

  isExpirationPending(sessionId?: string): boolean {
    return this.expirationPending && this.isMonitoring(sessionId);
  }

  recordUserInteraction(): void {
    if (this.session === null || this.expirationPending || this.destroyed) {
      return;
    }
    this.lastUserInteractionAt = Date.now();
    this.scheduleForRemainingTime();
  }

  handleAppStateChange(isActive: boolean): void {
    const wasForeground = this.foreground;
    this.foreground = isActive;
    if (!isActive) {
      this.clearResumeTimeout();
      this.clearScheduledTimeout();
      if (wasForeground && this.session !== null) {
        console.info('[INACTIVITY] background', JSON.stringify({
          sessionId: this.session.id,
        }));
      }
      return;
    }
    if (wasForeground || this.session === null || this.destroyed) {
      return;
    }

    const elapsedMs = Date.now() - this.lastUserInteractionAt;
    if (elapsedMs >= CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS) {
      this.expirationPending = true;
    }
    console.info('[INACTIVITY] resume-scheduled', JSON.stringify({
      sessionId: this.session.id,
      elapsedMs,
      expirationPending: this.expirationPending,
      delayMs: CONNECTED_PRODUCT_RESUME_CHECK_DELAY_MS,
    }));
    this.ngZone.runOutsideAngular(() => {
      this.resumeTimeoutHandle = setTimeout(() => {
        this.resumeTimeoutHandle = null;
        if (!this.foreground || this.destroyed) {
          return;
        }
        this.checkForExpiration();
      }, CONNECTED_PRODUCT_RESUME_CHECK_DELAY_MS);
    });
  }

  checkForExpiration(): void {
    if (this.session === null || this.destroyed ||
        !this.foreground || this.resumeTimeoutHandle !== null) {
      return;
    }
    if (!this.expirationPending) {
      const elapsed = Date.now() - this.lastUserInteractionAt;
      if (elapsed < CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS) {
        this.scheduleForRemainingTime();
        return;
      }
      this.expirationPending = true;
    }
    if (this.expirationInProgress) {
      return;
    }
    if (this.session.isWriteInProgress()) {
      this.scheduleAfter(WRITE_COMPLETION_RETRY_MS);
      return;
    }

    const session = this.session;
    this.expirationInProgress = true;
    this.clearScheduledTimeout();
    console.info('[INACTIVITY] expiration-start', JSON.stringify({
      sessionId: session.id,
      elapsedMs: Date.now() - this.lastUserInteractionAt,
    }));
    this.ngZone.run(() => {
      void Promise.resolve(session.onTimeout()).then(
        (completed) => this.completeExpirationAttempt(
          session,
          completed !== false,
        ),
        () => this.completeExpirationAttempt(session, false),
      );
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stop();
    for (const eventName of USER_ACTIVITY_EVENTS) {
      this.document.removeEventListener(
        eventName,
        this.handleUserActivity,
        true,
      );
    }
    if (this.appStateListener !== null) {
      void this.appStateListener.remove();
      this.appStateListener = null;
    }
  }

  private scheduleForRemainingTime(): void {
    if (this.session === null || this.expirationPending || !this.foreground) {
      this.clearScheduledTimeout();
      return;
    }
    const remaining = Math.max(
      0,
      this.lastUserInteractionAt +
        CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS - Date.now(),
    );
    this.scheduleAfter(remaining);
  }

  private scheduleAfter(delayMs: number): void {
    this.clearScheduledTimeout();
    this.ngZone.runOutsideAngular(() => {
      this.timeoutHandle = setTimeout(() => {
        this.timeoutHandle = null;
        this.checkForExpiration();
      }, delayMs);
    });
  }

  private clearScheduledTimeout(): void {
    if (this.timeoutHandle !== null) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }

  private clearResumeTimeout(): void {
    if (this.resumeTimeoutHandle !== null) {
      clearTimeout(this.resumeTimeoutHandle);
      this.resumeTimeoutHandle = null;
    }
  }

  private completeExpirationAttempt(
    session: ConnectedProductInactivitySession,
    completed: boolean,
  ): void {
    if (this.session?.id !== session.id) {
      return;
    }
    this.expirationInProgress = false;
    if (completed) {
      this.stop(session.id);
      return;
    }
    if (this.foreground) {
      this.scheduleAfter(WRITE_COMPLETION_RETRY_MS);
    }
  }
}


