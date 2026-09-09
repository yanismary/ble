import { Component, Input, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
} from '@ionic/angular/standalone';

import {
  AppMainMenuItem,
  appMainMenuItemsFor,
} from './app-main-menu.model';

@Component({
  selector: 'app-main-menu',
  templateUrl: './app-main-menu.component.html',
  styles: [`
    :host {
      display: contents;
    }

    .app-main-menu-button {
      height: 48px;
      width: 48px;
    }

    :host-context(.ios) .app-main-menu-button {
      --background: transparent;
      --background-activated: transparent;
      --background-focused: transparent;
      --background-hover: transparent;
    }

    :host-context(.ios) .scan-menu-icon {
      color: var(--mantion-blue-contrast);
    }

    .app-main-menu-icon {
      font-size: 26px;
    }

    .app-main-menu-list ion-label {
      text-align: start;
    }

  `],
  standalone: true,
  imports: [IonButton, IonItem, IonLabel, IonList, IonPopover],
})
export class AppMainMenuComponent {
  private readonly router = inject(Router);

  @ViewChild(IonPopover) private popover: IonPopover | undefined;
  @Input() buttonClass = '';
  @Input() iconClass = '';

  get items(): readonly AppMainMenuItem[] {
    return appMainMenuItemsFor();
  }
  menuOpen = false;
  private presenting = false;
  private navigationInProgress = false;

  async openMenu(event: Event): Promise<void> {
    if (this.menuOpen || this.presenting || this.navigationInProgress) {
      return;
    }
    this.presenting = true;
    try {
      await this.popover?.present(event as MouseEvent);
    } finally {
      this.presenting = false;
    }
  }

  markMenuPresented(): void {
    this.menuOpen = true;
  }

  dismissMenu(): void {
    this.menuOpen = false;
  }

  async select(item: AppMainMenuItem): Promise<void> {
    if (this.navigationInProgress) {
      return;
    }
    this.navigationInProgress = true;
    try {
      await this.popover?.dismiss();
      this.dismissMenu();
      await this.router.navigate(item.route);
    } finally {
      this.navigationInProgress = false;
    }
  }
}
