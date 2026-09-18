import {
  TestBed,
  fakeAsync,
  flushMicrotasks,
  tick,
} from '@angular/core/testing';

import {
  CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS,
  ConnectedProductInactivityService,
} from '../connected-product-inactivity.service';

describe('ConnectedProductInactivityService', () => {
  let service: ConnectedProductInactivityService;
  let busy: boolean;
  let onTimeout: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConnectedProductInactivityService);
    busy = false;
    onTimeout = jasmine.createSpy('onTimeout');
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('keeps a real session before 10 minutes and expires it at 10 minutes',
    fakeAsync(() => {
      startSession();

      tick(CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS - 1_000);
      expect(onTimeout).not.toHaveBeenCalled();

      tick(1_000);
      expect(onTimeout).toHaveBeenCalledTimes(1);
    }),
  );

  it('restarts the full timeout after a global user interaction',
    fakeAsync(() => {
      startSession();
      tick(9 * 60 * 1_000);

      document.dispatchEvent(new Event('pointerdown'));
      tick(9 * 60 * 1_000);
      expect(onTimeout).not.toHaveBeenCalled();

      tick(60 * 1_000);
      expect(onTimeout).toHaveBeenCalledTimes(1);
    }),
  );

  it('does not restart for an unrelated automatic event', fakeAsync(() => {
    startSession();
    tick(5 * 60 * 1_000);

    const automaticBleNotification = jasmine.createSpy('bleNotification');
    automaticBleNotification();
    tick(5 * 60 * 1_000);

    expect(automaticBleNotification).toHaveBeenCalledTimes(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  }));

  it('expires immediately on foreground resume after 10 minutes',
    fakeAsync(() => {
      startSession();
      tick(3 * 60 * 1_000);
      service.handleAppStateChange(false);

      tick(12 * 60 * 1_000);
      expect(onTimeout).not.toHaveBeenCalled();

      service.handleAppStateChange(true);
      expect(onTimeout).toHaveBeenCalledTimes(1);
    }),
  );

  it('keeps the session on foreground resume before 10 minutes',
    fakeAsync(() => {
      startSession();
      tick(3 * 60 * 1_000);
      service.handleAppStateChange(false);
      tick(6 * 60 * 1_000);

      service.handleAppStateChange(true);
      expect(onTimeout).not.toHaveBeenCalled();

      tick(60 * 1_000);
      expect(onTimeout).toHaveBeenCalledTimes(1);
    }),
  );

  it('retries a completed background expiration when the app resumes',
    fakeAsync(() => {
      let resolveFirstAttempt!: (completed: boolean) => void;
      let attempt = 0;
      onTimeout.and.callFake(() => {
        attempt += 1;
        if (attempt === 1) {
          return new Promise<boolean>((resolve) => {
            resolveFirstAttempt = resolve;
          });
        }
        return true;
      });
      startSession();

      tick(CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS);
      expect(onTimeout).toHaveBeenCalledTimes(1);
      service.handleAppStateChange(false);
      resolveFirstAttempt(true);
      flushMicrotasks();

      expect(service.isExpirationPending('widoor:device-1:4')).toBeTrue();
      expect(service.isMonitoring('widoor:device-1:4')).toBeTrue();

      service.handleAppStateChange(true);
      flushMicrotasks();

      expect(onTimeout).toHaveBeenCalledTimes(2);
      expect(service.isMonitoring()).toBeFalse();
    }),
  );

  it('does not overlap expiration attempts on repeated resume events',
    fakeAsync(() => {
      let resolveAttempt!: (completed: boolean) => void;
      onTimeout.and.returnValue(new Promise<boolean>((resolve) => {
        resolveAttempt = resolve;
      }));
      startSession();
      service.handleAppStateChange(false);
      tick(CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS);

      service.handleAppStateChange(true);
      service.handleAppStateChange(true);

      expect(onTimeout).toHaveBeenCalledTimes(1);
      resolveAttempt(true);
      flushMicrotasks();
      expect(service.isMonitoring()).toBeFalse();
    }),
  );

  it('retries when timeout finalization reports failed navigation',
    fakeAsync(() => {
      onTimeout.and.returnValues(false, true);
      startSession();

      tick(CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS);
      flushMicrotasks();
      expect(onTimeout).toHaveBeenCalledTimes(1);
      expect(service.isExpirationPending()).toBeTrue();

      tick(250);
      flushMicrotasks();
      expect(onTimeout).toHaveBeenCalledTimes(2);
      expect(service.isMonitoring()).toBeFalse();
    }),
  );

  it('defers expiration until the active write finishes', fakeAsync(() => {
    busy = true;
    startSession();

    tick(CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS);
    expect(onTimeout).not.toHaveBeenCalled();

    busy = false;
    tick(250);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  }));

  it('cancels the timer and never invokes a timeout twice', fakeAsync(() => {
    startSession();
    service.stop('widoor:device-1:4');
    tick(CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS);
    expect(onTimeout).not.toHaveBeenCalled();

    startSession();
    tick(CONNECTED_PRODUCT_INACTIVITY_TIMEOUT_MS * 2);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  }));

  function startSession(): void {
    service.start({
      id: 'widoor:device-1:4',
      isWriteInProgress: () => busy,
      onTimeout,
    });
  }
});
