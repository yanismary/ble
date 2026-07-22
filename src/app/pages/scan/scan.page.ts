import { Component, NgZone, OnDestroy, inject } from '@angular/core';
import { ScanResult } from '@capacitor-community/bluetooth-le';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { BleService } from '../../core/services/ble';

interface ScannedDevice {
  deviceId: string;
  name: string;
  rssi: number | null;
}

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class ScanPage implements OnDestroy {
  private readonly bleService = inject(BleService);
  private readonly ngZone = inject(NgZone);
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  devices: ScannedDevice[] = [];
  errorMessage: string | null = null;
  hasScanned = false;
  scanning = false;

  async startScan(): Promise<void> {
    if (this.scanning) {
      return;
    }

    this.clearScanTimeout();
    this.devices = [];
    this.errorMessage = null;
    this.hasScanned = true;
    this.scanning = true;

    try {
      const bluetoothEnabled = await this.bleService.isBluetoothEnabled();

      if (!bluetoothEnabled) {
        await this.bleService.requestBluetoothEnable();
      }

      if (!(await this.bleService.isBluetoothEnabled())) {
        throw new Error('Le Bluetooth doit être activé pour lancer le scan.');
      }

      if (this.destroyed) {
        return;
      }

      await this.bleService.startScan((result: ScanResult) => {
        this.ngZone.run(() => this.updateDevice(result));
      });

      if (this.destroyed) {
        await this.bleService.stopScan();
        return;
      }

      this.scanTimeout = setTimeout(() => {
        void this.stopScan();
      }, 10_000);
    } catch (error: unknown) {
      this.scanning = false;
      this.clearScanTimeout();
      this.errorMessage = this.toErrorMessage(error);
    }
  }

  async stopScan(): Promise<void> {
    this.clearScanTimeout();

    if (!this.scanning && !this.bleService.isScanning()) {
      return;
    }

    this.scanning = false;

    try {
      await this.bleService.stopScan();
    } catch (error: unknown) {
      if (!this.destroyed) {
        this.errorMessage = this.toErrorMessage(error);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.scanning = false;
    this.clearScanTimeout();
    void this.bleService.stopScan().catch(() => undefined);
  }

  private updateDevice(result: ScanResult): void {
    if (this.destroyed) {
      return;
    }

    const name = result.device.name?.trim() || 'Appareil sans nom';
    const device: ScannedDevice = {
      deviceId: result.device.deviceId,
      name,
      rssi: result.rssi ?? null,
    };
    const existingIndex = this.devices.findIndex(
      ({ deviceId }) => deviceId === device.deviceId,
    );

    if (existingIndex === -1) {
      this.devices = [...this.devices, device];
      return;
    }

    this.devices = this.devices.map((existingDevice, index) =>
      index === existingIndex ? device : existingDevice,
    );
  }

  private clearScanTimeout(): void {
    if (this.scanTimeout !== null) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }

  private toErrorMessage(error: unknown): string {
    const details = error instanceof Error ? error.message : String(error);
    return details
      ? `Impossible d’effectuer le scan BLE : ${details}`
      : 'Impossible d’effectuer le scan BLE.';
  }
}
