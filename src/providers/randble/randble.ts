
declare var require: any;
import { Injectable } from '@angular/core'
const BleClient = require('@capacitor-community/bluetooth-le').BleClient;
import { Device } from '@capacitor/device';
import { Observable } from 'rxjs/Observable'
import { Platform } from 'ionic-angular'
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { LoggerService } from '../logger/logger.service';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';

interface ICharacteristicPath {
  address: string,
  service: string,
  characteristic: string
}

type PreScanReason = 'READY' | 'BLE_DISABLED' | 'LOCATION_DISABLED' | 'PERMISSION_DENIED' | 'PRECHECK_FAILED';

interface IPreScanCheckResult {
  ready: boolean;
  reason: PreScanReason;
  details?: any;
}

@Injectable()
export class RandBLE {

// --- CONSTANTES ---
  SCAN_MODE_OPPORTUNISTIC = -1;
  SCAN_MODE_LOW_POWER = 0;
  SCAN_MODE_BALANCED = 1;
  SCAN_MODE_LOW_LATENCY = 2;
  MATCH_NUM_ONE_ADVERTISEMENT = 1;
  MATCH_NUM_FEW_ADVERTISEMENT = 2;
  MATCH_NUM_MAX_ADVERTISEMENT = 3;
  MATCH_MODE_AGGRESSIVE = 1;
  MATCH_MODE_STICKY = 2;
  CALLBACK_TYPE_ALL_MATCHES = 1;
  CALLBACK_TYPE_FIRST_MATCH = 2;
  CALLBACK_TYPE_MATCH_LOST = 4;

  private isRequestingEnable = false;
  private isEnablingBt = false;
  private TAG = 'RandBLE';

  constructor(public platform: Platform, private logger: LoggerService) {
    this.platform.ready().then(async () => {
      try {
        if (this.platform.is('android')) {
          this.logger.info(this.TAG, 'BleClient initialization deferred until scan on Android');
          return;
        }
        await this.initializeBleClient('constructor');
        this.logger.info(this.TAG, 'BleClient initialized');
      } catch (e) {
        this.logger.error(this.TAG, 'BleClient initialization error', e);
      }
    });
  }

  // --- INITIALISATION ---

  initialize(params?: any): Promise<any> {
    return this.initializeBleClient('initialize').then(() => {
      return BleClient.isEnabled().then(enabled => {
        return { 
            status: enabled ? 'enabled' : 'disabled' 
        };
      });
    }, (error) => {
        return { status: 'disabled', message: error };
    });
}

  private initializeBleClient(context: string): Promise<void> {
    this.logger.info(this.TAG, 'BLE permission initialization requested', {
      context: context,
      androidNeverForLocation: false
    });

    return BleClient.initialize({ androidNeverForLocation: false }).then(() => {
      this.logger.info(this.TAG, 'BLE permissions accepted and client initialized', {
        context: context
      });
    });
  }

  isEnabled(): Promise<{ isEnabled: boolean }> {
    return BleClient.isEnabled().then(isEnabled => {
      return { isEnabled: isEnabled };
    });
  }

  isDisabled(): Promise<{ isDisabled: boolean }> {
    return BleClient.isEnabled().then(isEnabled => {
      return { isDisabled: !isEnabled };
    });
  }

  enable(): Promise<any> {
    const anyBle: any = BleClient as any;

    if (typeof anyBle.requestEnable === 'function') {
      return anyBle.requestEnable(); // versions récentes
    }

    // Fallback anciennes versions
    if (typeof anyBle.enable === 'function') {
      return anyBle.enable();
    }

    return Promise.reject(new Error('No enable method available on BleClient'));
  }

  disable(): Promise<any> {
    return this.openBluetoothSettings();
  }

  getAdapterInfo(): Promise<any> {
    return BleClient.isEnabled().then(enabled => ({
      name: 'Adapter',
      address: '00:00:00:00:00:00',
      isInitialized: true,
      isEnabled: enabled,
      isScanning: false,
      isDiscoverable: true
    }));
  }

  async prepareForScan(): Promise<IPreScanCheckResult> {
    this.logger.info(this.TAG, 'Pre-scan check started');

    try {
      await this.initializeBleClient('prepareForScan');
      if (this.platform.is('android')) {
        this.logger.info(this.TAG, 'Android location permission granted for BLE scan');
        this.logger.info(this.TAG, 'Android bluetooth permission granted for BLE scan');
      }
    } catch (error) {
      if (this.isPermissionDeniedError(error)) {
        this.logger.warn(this.TAG, 'Pre-scan blocked: location/bluetooth permission denied during initialize', error);
        return { ready: false, reason: 'PERMISSION_DENIED', details: { stage: 'initialize', error: error } };
      }
      this.logger.error(this.TAG, 'Pre-scan failed during initialize', error);
      return { ready: false, reason: 'PRECHECK_FAILED', details: { stage: 'initialize', error: error } };
    }

    let enabled = false;
    try {
      enabled = await BleClient.isEnabled();
    } catch (error) {
      if (this.isPermissionDeniedError(error)) {
        this.logger.warn(this.TAG, 'Pre-scan blocked: permission denied during isEnabled', error);
        return { ready: false, reason: 'PERMISSION_DENIED', details: { stage: 'isEnabled', error: error } };
      }
      this.logger.error(this.TAG, 'Pre-scan failed during isEnabled', error);
      return { ready: false, reason: 'PRECHECK_FAILED', details: { stage: 'isEnabled', error: error } };
    }

    if (!enabled) {
      this.logger.warn(this.TAG, 'Pre-scan blocked: bluetooth disabled');
      return { ready: false, reason: 'BLE_DISABLED', details: { stage: 'isEnabled' } };
    }
    this.logger.info(this.TAG, 'Pre-scan bluetooth permission/state check passed');

    if (this.platform.is('android')) {
      const androidMajor = await this.getAndroidMajorVersion();
      const locationRequired = (androidMajor !== null && androidMajor <= 11);
      this.logger.debug(this.TAG, 'Pre-scan Android policy evaluated', {
        androidMajor: androidMajor,
        locationRequired: locationRequired
      });

      if (locationRequired && typeof (BleClient as any).isLocationEnabled === 'function') {
        try {
          const locationEnabled = await BleClient.isLocationEnabled();
          if (!locationEnabled) {
            this.logger.warn(this.TAG, 'Pre-scan blocked: location disabled on Android <= 11', {
              androidMajor: androidMajor
            });
            return { ready: false, reason: 'LOCATION_DISABLED', details: { stage: 'isLocationEnabled', androidMajor: androidMajor } };
          }
          this.logger.info(this.TAG, 'Pre-scan Android location services enabled', {
            androidMajor: androidMajor
          });
        } catch (error) {
          if (this.isPermissionDeniedError(error)) {
            this.logger.warn(this.TAG, 'Pre-scan blocked: permission denied during location check', error);
            return { ready: false, reason: 'PERMISSION_DENIED', details: { stage: 'isLocationEnabled', error: error } };
          }
          this.logger.error(this.TAG, 'Pre-scan failed during location check', error);
          return { ready: false, reason: 'PRECHECK_FAILED', details: { stage: 'isLocationEnabled', error: error } };
        }
      }
    }

    this.logger.info(this.TAG, 'Pre-scan check ready');
    return { ready: true, reason: 'READY' };
  }

  async openLocationSettings(): Promise<void> {
    this.logger.info(this.TAG, 'Opening location settings');
    try {
      await BleClient.openLocationSettings();
    } catch (error) {
      this.logger.error(this.TAG, 'Open location settings failed', error);
      throw error;
    }
  }

  async openBluetoothSettings(): Promise<void> {
    this.logger.info(this.TAG, 'Opening bluetooth settings');
    try {
      await BleClient.openBluetoothSettings();
    } catch (error) {
      this.logger.error(this.TAG, 'Open bluetooth settings failed', error);
      throw error;
    }
  }

  async openAppSettings(): Promise<void> {
    this.logger.info(this.TAG, 'Opening app settings');
    try {
      await BleClient.openAppSettings();
    } catch (error) {
      this.logger.error(this.TAG, 'Open app settings failed', error);
      throw error;
    }
  }


  // --- SCANNING ---

  private normalizeScanError(error: any, defaultCode: string = 'BLE_SCAN_FAILED') {
    const rawText = error && (error.message || error.errorMessage || error.code || error.toString)
      ? String(error.message || error.errorMessage || error.code || error.toString())
      : String(error);
    const normalizedText = rawText.toLowerCase();

    const permissionKeywords = [
      'permission',
      'denied',
      'not authorized',
      'not permitted',
      'location',
      'bluetooth_scan',
      'bluetooth_connect'
    ];

    let code = defaultCode;
    let message = rawText || 'Scan failed';

    if (normalizedText.indexOf('ble_disabled') > -1 || normalizedText.indexOf('bluetooth disabled') > -1) {
      code = 'BLE_DISABLED';
      message = 'Bluetooth is disabled';
    } else {
      const isPermissionError = permissionKeywords.some(keyword => normalizedText.indexOf(keyword) > -1);
      if (isPermissionError) {
        code = 'BLE_PERMISSION_DENIED';
        message = 'Bluetooth permission denied';
      }
    }

    return {
      code: code,
      message: message,
      raw: error
    };
  }

  private createPreScanBlockedError(precheck: IPreScanCheckResult): any {
    const reason = precheck && precheck.reason ? precheck.reason : 'PRECHECK_FAILED';
    let code = 'BLE_PRECHECK_FAILED';
    let message = 'BLE pre-scan check failed';

    if (reason === 'BLE_DISABLED') {
      code = 'BLE_DISABLED';
      message = 'Bluetooth is disabled';
    } else if (reason === 'PERMISSION_DENIED') {
      code = 'BLE_PERMISSION_DENIED';
      message = 'Bluetooth/location permission denied';
    } else if (reason === 'LOCATION_DISABLED') {
      code = 'BLE_LOCATION_DISABLED';
      message = 'Location services disabled';
    }

    return {
      code: code,
      message: message,
      reason: reason,
      raw: precheck
    };
  }

  private createMissingDeviceIdError(context: string, params?: any): any {
    const error: any = new Error('Identifiant Bluetooth manquant (deviceId/address/id).');
    error.code = 'BLE_DEVICE_ID_MISSING';
    error.context = context;
    error.params = params;
    return error;
  }

  private isPermissionDeniedError(error: any): boolean {
    const rawText = error && (error.message || error.errorMessage || error.code || error.toString)
      ? String(error.message || error.errorMessage || error.code || error.toString())
      : String(error);
    const normalizedText = rawText.toLowerCase();

    const permissionKeywords = [
      'permission',
      'denied',
      'not authorized',
      'not permitted',
      'unauthorized',
      'refused',
      'location',
      'bluetooth_scan',
      'bluetooth_connect'
    ];

    return permissionKeywords.some(keyword => normalizedText.indexOf(keyword) > -1);
  }

  private async getAndroidMajorVersion(): Promise<number | null> {
    try {
      const info: any = await Device.getInfo();
      const osVersion = info && info.osVersion ? String(info.osVersion) : '';
      const match = osVersion.match(/\d+/);
      if (!match) {
        return null;
      }
      const major = parseInt(match[0], 10);
      return isNaN(major) ? null : major;
    } catch (error) {
      this.logger.warn(this.TAG, 'Unable to resolve Android version, location pre-check skipped', error);
      return null;
    }
  }

  startScan(params: any): Observable<any> {
    return new Observable(observer => {
      const services = params.services || [];
      const scanMode = params.scanMode || this.SCAN_MODE_LOW_LATENCY;
      const allowDuplicates = (params.allowDuplicates !== undefined ? params.allowDuplicates : true);

      this.logger.info(this.TAG, 'Scan start requested', {
        services: services,
        scanMode: scanMode,
        allowDuplicates: allowDuplicates
      });

      (async () => {
        try {
          const precheck = await this.prepareForScan();
          if (!precheck.ready) {
            const blockedError = this.createPreScanBlockedError(precheck);
            this.logger.warn(this.TAG, 'Scan blocked before requestLEScan', blockedError);
            observer.error(blockedError);
            return;
          }
        } catch (e) {
          const normalizedError = this.normalizeScanError(e);
          this.logger.error(this.TAG, 'Scan pre-check failed', normalizedError);
          observer.error(normalizedError);
          return;
        }

        this.logger.info(this.TAG, 'Scan launched after permissions check', {
          services: services,
          scanMode: scanMode,
          allowDuplicates: allowDuplicates
        });
        observer.next({ status: 'scanStarted' });

        BleClient.requestLEScan(
          {
            services: services,
            allowDuplicates: allowDuplicates,
            scanMode: scanMode
          },
          (result: any) => {
            const deviceId = (result && result.device) ? result.device.deviceId : null;
            const name = (result && result.localName) ? result.localName
              : ((result && result.device && result.device.name) ? result.device.name : 'Unknown');

            this.logger.debug(this.TAG, 'Scan result received', {
              deviceId: deviceId,
              name: name,
              rssi: result ? result.rssi : null
            });

            observer.next({
              status: 'scanResult',
              address: deviceId,
              id: deviceId,
              name: name,
              rssi: result.rssi,
              advertisement: {
                serviceUuids: result.uuids,
                localName: result.localName,
                manufacturerData: result.manufacturerData
              }
            });
          }
        ).catch(err => {
          const normalizedError = this.normalizeScanError(err);
          this.logger.error(this.TAG, 'Scan request failed', normalizedError);
          observer.error(normalizedError);
        });
      })();
    });
  }



  stopScan(): Promise<{ status: 'scanStopped' }> {
    return BleClient.stopLEScan().then(() => {
      this.logger.info(this.TAG, 'Scan stopped');
      return { status: 'scanStopped' as 'scanStopped' };
    }).catch(err => {
      const normalizedError = this.normalizeScanError(err);
      this.logger.error(this.TAG, 'Scan stop failed', normalizedError);
      throw normalizedError;
    });
  }

  // --- CONNEXION ---

  connect(params: { address: string }): Observable<any> {
    return new Observable(observer => {
      let active = true;
      const emitNext = (payload: any, source: string) => {
        if (!active) {
          this.logger.debug(this.TAG, 'Connect emit skipped: observer inactive', {
            source: source,
            payload: payload
          });
          return;
        }
        observer.next(payload);
      };
      const emitError = (error: any, source: string) => {
        if (!active) {
          this.logger.debug(this.TAG, 'Connect error skipped: observer inactive', {
            source: source,
            error: error
          });
          return;
        }
        active = false;
        observer.error(error);
      };

      const address = params && params.address ? String(params.address).trim() : '';
      if (!address) {
        const missingIdError = this.createMissingDeviceIdError('connect', params);
        this.logger.error(this.TAG, 'Connection blocked: missing device id', missingIdError);
        emitError(missingIdError, 'missing_device_id');
        return;
      }

      this.logger.info(this.TAG, 'Connection attempt', { address: address });

      BleClient.connect(address, (deviceId) => {
        this.logger.warn(this.TAG, 'Runtime disconnection', { address: deviceId });
        emitNext({ status: 'disconnected', address: deviceId }, 'runtime_disconnection');
      })
      .then(async () => {
        await new Promise(r => setTimeout(r, 600)); 
        
        this.logger.info(this.TAG, 'Connection established', { address: address });
        emitNext({ status: 'connected', address: address }, 'connected');
      })
      .catch(err => {
        this.logger.error(this.TAG, 'Connection failed', { address: address, error: err });
        emitError(err, 'connect_failure');
      });

      return () => {
        if (!active) return;
        active = false;
        this.logger.debug(this.TAG, 'Connect observable unsubscribed', { address: address });
      };
    });
  }

  disconnect(params: { address?: string, deviceId?: string, id?: string }): Promise<any> {
    const deviceId = this.resolveDeviceId(params);

    return BleClient.disconnect(deviceId).then(() => {
      return { status: 'disconnected', address: deviceId, name: '' };
    });
  }

  async close(params: { address: string }): Promise<any> {
  if (!params || !params.address) {
    this.logger.warn(this.TAG, 'Close called without address, ignoring');
    return Promise.resolve();
  }
  try {
    await BleClient.disconnect(params.address);
    this.logger.info(this.TAG, 'Disconnected', { address: params.address });
  } catch (e) {
    this.logger.error(this.TAG, 'Disconnect error', { address: params.address, error: e });
  }
}

  isConnected(params: { address: string }): Observable<{ isConnected: boolean }> {
      return Observable.fromPromise(
          BleClient.getDevices([params.address]).then(devices => {
              const found = devices.find(d => d.deviceId === params.address);
              return { isConnected: !!found };
          }).catch(() => {
              return { isConnected: false};
          })
      );
  }

  // --- SERVICES / DISCOVERY ---

  async getMtu(address: string): Promise<number> {
  try {
    const mtu = await BleClient.getMtu(address);
    this.logger.debug(this.TAG, 'Current MTU resolved', { address: address, mtu: mtu });
    return mtu;
  } catch (e) {
    this.logger.error(this.TAG, 'Could not get MTU', { address: address, error: e });
    return 23;
  }
}

  async discover(params: { address: string }): Promise<any> {
    const address = params && params.address ? String(params.address).trim() : '';
    if (!address) {
      const missingIdError = this.createMissingDeviceIdError('discover', params);
      this.logger.error(this.TAG, 'Discovery blocked: missing device id', missingIdError);
      throw missingIdError;
    }

    this.logger.info(this.TAG, 'Discovery attempt', { address: address });

    try {
      const services = await BleClient.getServices(address);

      if (!services || services.length === 0) {
        const error = new Error('Aucun service Bluetooth détecté sur l’appareil.');
        this.logger.error(this.TAG, 'Discovery failed: no services found', { address: address, error: error });
        throw error;
      }

      this.logger.info(this.TAG, 'Discovery success', { address: address, servicesCount: services.length });
      return {
        status: 'discovered',
        address: address,
        services: services
      };
    } catch (error) {
      this.logger.error(this.TAG, 'Discovery failed', { address: address, error: error });
      throw error;
    }
  }

    private resolveDeviceId(params: any): string {
      const deviceId =
        (params && (params.deviceId || params.address || params.id)) ||
        (params && params.peripheral && (params.peripheral.deviceId || params.peripheral.address || params.peripheral.id));

      if (!deviceId) {
        const missingIdError = this.createMissingDeviceIdError('resolveDeviceId', params);
        this.logger.error(this.TAG, 'Missing deviceId in BLE call', missingIdError);
        throw missingIdError;
      }
      return deviceId;
    }

  // --- LECTURE / ECRITURE ---

  read(params: { address?: string, deviceId?: string, id?: string, service: string, characteristic: string }): Promise<any> {
    const deviceId = this.resolveDeviceId(params);

    return BleClient.read(deviceId, params.service, params.characteristic)
      .then((dataView: DataView) => {
        const base64 = this.ab2str(dataView.buffer as any);
        return { value: base64, status: 'read', name: '', service: params.service, characteristic: params.characteristic };
      });
  }

  write(params: { address?: string, deviceId?: string, id?: string, service: string, characteristic: string, value: string }): Promise<any> {
    const deviceId = this.resolveDeviceId(params);
    const dataView = this.str2ab(params.value);

    return BleClient.write(deviceId, params.service, params.characteristic, dataView)
      .then(() => {
        return { status: 'written', value: params.value };
      });
  }

  // --- NOTIFICATIONS ---

  subscribe(params: { address?: string, deviceId?: string, id?: string, service: string, characteristic: string }): Observable<any> {
    return new Observable(observer => {
      observer.next({ status: 'subscribed', value: '' });

      let deviceId: string;
      try {
        deviceId = this.resolveDeviceId(params);
      } catch (e) {
        observer.error(e);
        return;
      }

      BleClient.startNotifications(
        deviceId,
        params.service,
        params.characteristic,
        (value: DataView) => {
          const base64 = this.ab2str(value.buffer as any);
          observer.next({ status: 'subscribedResult', value: base64 });
        }
      ).catch(err => observer.error(err));

      return () => {
        BleClient.stopNotifications(deviceId, params.service, params.characteristic);
      };
    });
  }

  unsubscribe(params: { address?: string, deviceId?: string, id?: string, service: string, characteristic: string }): Promise<any> {
    const deviceId = this.resolveDeviceId(params);
    return BleClient.stopNotifications(deviceId, params.service, params.characteristic);
  }

  // --- BONDING ---

  async bond(params: { address: string }): Promise<any> {
    try {
      await BleClient.createBond(params.address);
      return { status: 'bonded' };
    } catch (error) {
      this.logger.error(this.TAG, 'Bonding failed', { address: params.address, error: error });
      throw error;
    }
  }

  async isBonded(params: { address: string }): Promise<{ isBonded: boolean }> {
    try {
      const isBonded = await BleClient.isBonded(params.address);
      return { isBonded: isBonded };
    } catch (error) {
      return { isBonded: false };
    }
  }

  // --- UTILITAIRES DE CONVERSION ---

  private ab2str(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private str2ab(base64: string): DataView {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return new DataView(bytes.buffer);
  }

  bytesToEncodedString(bytes: Uint8Array): string {
    return this.ab2str(bytes.buffer as any);
  }

  encodedStringToBytes(encoded: string): Uint8Array {
      const binary_string = window.atob(encoded);
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes;
  }
  
  stringToBytes(string: string): Uint8Array {
    const bytes = new Uint8Array(string.length);
    for (let i = 0; i < string.length; i++) {
        bytes[i] = string.charCodeAt(i);
    }
    return bytes;
  }
  
  bytesToString(bytes: Uint8Array): string {
      return String.fromCharCode.apply(null, bytes);
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async enableAndWait(): Promise<boolean> {
    if (this.isEnablingBt) return false;
    this.isEnablingBt = true;

    try {
      try {
        await this.enable();
      } catch (e) {
        // user refuse / OS refuse
      }
      let enabled = await BleClient.isEnabled();
      if (!enabled) { await this.sleep(400); enabled = await BleClient.isEnabled(); }
      if (!enabled) { await this.sleep(600); enabled = await BleClient.isEnabled(); }
      if (!enabled) { await this.sleep(800); enabled = await BleClient.isEnabled(); }

      return enabled;
    } finally {
      this.isEnablingBt = false;
    }
  }
}
