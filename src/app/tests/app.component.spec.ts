import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppState } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { APP_LIFECYCLE, AppComponent } from '../app.component';

describe('AppComponent', () => {
  let appStateListener: ((state: AppState) => void) | undefined;
  let appStateListenerRegistration: jasmine.Spy;
  let applicationTick: jasmine.Spy;
  let fixture: ComponentFixture<AppComponent>;
  let frameCallback: FrameRequestCallback | undefined;
  let removeListener: jasmine.Spy;

  beforeEach(async () => {
    removeListener = jasmine.createSpy('removeListener');
    const listenerHandle: PluginListenerHandle = {
      remove: removeListener,
    };
    appStateListenerRegistration = jasmine.createSpy('addListener').and
      .returnValue(Promise.resolve(listenerHandle));
    spyOn(window, 'requestAnimationFrame').and.callFake((callback) => {
      frameCallback = callback;
      return 17;
    });
    spyOn(window, 'cancelAnimationFrame');

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        {
          provide: APP_LIFECYCLE,
          useValue: { addListener: appStateListenerRegistration },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    applicationTick = spyOn(TestBed.inject(ApplicationRef), 'tick');
    fixture.detectChanges();
    expect(appStateListenerRegistration).toHaveBeenCalledTimes(1);
    appStateListener = appStateListenerRegistration.calls.mostRecent()
      .args[1] as (state: AppState) => void;
    await Promise.resolve();
  });

  afterEach(() => {
    if (!fixture.componentRef.hostView.destroyed) {
      fixture.destroy();
    }
  });

  it('should create the app', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should ignore inactive app state changes', () => {
    appStateListener?.({ isActive: false });

    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    expect(applicationTick).not.toHaveBeenCalled();
  });

  it('should refresh Angular on the next frame when the app resumes', () => {
    appStateListener?.({ isActive: true });

    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(applicationTick).not.toHaveBeenCalled();

    frameCallback?.(performance.now());

    expect(applicationTick).toHaveBeenCalledTimes(1);
  });

  it('should remove the listener and cancel a pending frame on destroy', () => {
    appStateListener?.({ isActive: true });

    fixture.destroy();

    expect(window.cancelAnimationFrame).toHaveBeenCalledOnceWith(17);
    expect(removeListener).toHaveBeenCalledTimes(1);
  });
});
