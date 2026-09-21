import {
  ApplicationRef,
  Component,
  InjectionToken,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';
import { App, AppPlugin } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

export const APP_LIFECYCLE = new InjectionToken<
  Pick<AppPlugin, 'addListener'>
>('APP_LIFECYCLE', {
  providedIn: 'root',
  factory: () => App,
});

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnDestroy {
  private readonly appLifecycle = inject(APP_LIFECYCLE);
  private readonly applicationRef = inject(ApplicationRef);
  private readonly ngZone = inject(NgZone);
  private appStateListener: PluginListenerHandle | null = null;
  private resumeFrame: number | null = null;
  private destroyed = false;

  constructor() {
    void this.appLifecycle.addListener('appStateChange', ({ isActive }) => {
      if (!isActive || this.destroyed) {
        return;
      }
      this.ngZone.run(() => {
        if (this.resumeFrame !== null) {
          cancelAnimationFrame(this.resumeFrame);
        }
        this.resumeFrame = requestAnimationFrame(() => {
          this.resumeFrame = null;
          if (this.destroyed) {
            return;
          }
          console.info('[APP RESUME] forcing UI refresh');
          this.applicationRef.tick();
        });
      });
    }).then((listener) => {
      if (this.destroyed) {
        void listener.remove();
        return;
      }
      this.appStateListener = listener;
    }).catch(() => undefined);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.resumeFrame !== null) {
      cancelAnimationFrame(this.resumeFrame);
      this.resumeFrame = null;
    }
    if (this.appStateListener !== null) {
      void this.appStateListener.remove();
      this.appStateListener = null;
    }
  }
}
