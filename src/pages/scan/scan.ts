import { Component, NgZone } from '@angular/core';
import { LoadingController, NavController, AlertController, ToastController, NavParams, Platform } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { PopoverController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { IonicPage } from 'ionic-angular';

import { RandBLE } from '../../providers/randble/randble';
import { BleconnectserviceProvider } from '../../providers/bleconnectservice/bleconnectservice';
import { LoggerService } from '../../providers/logger/logger.service';
import {
  DetectedProductType,
  ProductDetectionResult,
  detectProductType,
  getProductConfigId,
  isWidoorBluetoothName,
  productTypeLabel,
  versionWordBytesToHex
} from '../../app/product-detection';


// --- CONFIGURATION DES PRODUITS ---
interface ProductConfig {
  id: string;
  name: string;
  serviceUUID: string;
  page: string;
  demoName: string;
}

interface ScanDevice {
  id?: string;
  address?: string;
  name?: string;
  rssi?: number;
  status?: string;
  isBonded?: boolean;
  isDemo?: boolean | string;
  advertising?: any;
  advertisement?: any;
  [key: string]: any;
}

const SHDO_SERVICE = 'dc06d52e-6ee8-471e-a5fd-0f40674a061d';
const SHDO_VERSION_CHARACTERISTIC = '175d6bc8-5840-4037-95da-a778395a036c';

export const PRODUCTS_CONFIG: ProductConfig[] = [
  {
    id: 'widoor',
    name: 'Widoor',
    serviceUUID: '3206890A-650E-46F3-9C73-2BC0840E3B8E', 
    page: 'WidoorPage',
    demoName: 'WidoorExemple'
  },
  {
    id: 'moventiv',
    name: 'Moventiv',
    serviceUUID: '978AE765-664C-45D8-9157-3B9031E6478E',
    page: 'MoventivPage',
    demoName: 'MoventivExemple'
  },
  {
    id: 'garline',
    name: 'Garline',
    serviceUUID: '978AE765-664C-45D8-9157-3B9031E6478E', // même que Moventiv
    page: 'MoventivPage',
    demoName: 'GarlineExemple'
  }
  /*{
    id: 'nouveau_produit',
    name: 'Nouveau Produit',
    serviceUUID: '00000000-0000-0000-0000-000000000000',
    page: 'NouveauProduitPage'
  }*/

];

@IonicPage({
  priority: 'high'
})
@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html'
})
export class ScanPage {

  devices: ScanDevice[] = [];
  device: ScanDevice = {};
  viewisIos: boolean = false;
  statusMessage: string = '';
  isVisibleMac: any;
  isVisiblePaired: any;
  isScanning: boolean = false;
  isPushOnce: boolean = false;
  private isConnectionFlowInProgress: boolean = false;

  private enablePopupAlreadyShown = false;
  private settingsPopupShown = false;
  private permissionPopupShown = false;
  private locationPopupShown = false;
  private initScanInProgress = false;
  private permissionDeniedCount = 0;
  private scanTimeoutHandle: any = null;			
  private scanSubscription: any = null;
  private detectedDeviceIds: { [key: string]: boolean } = {};
  private TAG = 'ScanPage';
  private UI_MESSAGES = {
    scanSearching: 'Recherche en cours...',
    scanPermissionDenied: 'Autorisations Bluetooth et localisation manquantes',
    scanPermissionPermanentlyDenied: 'Autorisations Bluetooth et localisation refusées définitivement',
    scanLocationDisabled: 'Localisation désactivée',
    scanPrepareFailed: 'Préparation Bluetooth impossible',
    scanError: 'Recherche Bluetooth impossible pour le moment',
    pairingInProgress: 'Appairage en cours...',
    pairingSuccess: 'Appairage réussi',
    pairingFailed: 'Échec de l\'appairage',
    missingIdentifier: 'Identifiant Bluetooth introuvable'
  };

  unbondOrBondColor: string = "mantionSmtRed";

  //translation strings 

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    private randble: RandBLE,
    private ngZone: NgZone,
    private storage: Storage,
    private popoverCtrl: PopoverController,
    public navParams: NavParams,
    private platform: Platform,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private toastCtrl: ToastController,
    public bleConnectService: BleconnectserviceProvider,
    private logger: LoggerService
  ) {
    this.storage.get('StoredIsVisibleMAC').then((val) => {
      this.isVisibleMac = JSON.parse(val);
    });

  }

  //rafraichissement des paramètres
  ionViewWillEnter() {

    if (this.bleConnectService.getConnectionStatus()=="connecting")
    {
    this.clearDetectedDevices('connection_status_connecting');
    this.bleConnectService.setConnectionStatus("unknown");
  }

    if (this.navParams.get('clearDevices')) {
      this.clearDetectedDevices('nav_param_clearDevices');
    }

    this.logger.debug(this.TAG, 'ionViewWillEnter');

    this.storage.get('StoredIsVisibleMAC').then((val) => {
      this.isVisibleMac = JSON.parse(val);
    });

    if (this.platform.is('android')) {
      this.isVisiblePaired = true;
    }
    else { 
      this.isVisiblePaired = false; 
    }

    if (this.platform.is('ios')) {
      this.viewisIos = true;
    }
    else {
      this.viewisIos = false;
    }

    if (this.bleConnectService.getWasConnected()) {
      let peripheral = this.bleConnectService.getConnectedPeripheral();
      // On récupère l'adresse que ce soit un objet ou une string
      let address = (peripheral && peripheral.address) ? peripheral.address : peripheral;
      if (address) {
        this.disconnectSpecific(address);
      }
    }
  }

  disconnectSpecific(address: string) {
    // Force disconnect logic
    this.randble.close({ address: address }).then(
      () => {
        this.logger.info(this.TAG, 'Peripheral connection closed', { address: address });
        this.bleConnectService.setWasConnected(false);
        this.clearDetectedDevices('disconnect_success');
        this.showDeconnectedToast();
      },
      (error) => {
        this.logger.warn(this.TAG, 'Peripheral close failed', { address: address, error: error });
      }
    );
  }

  disconnect() {
    const peripheral = this.bleConnectService.getConnectedPeripheral() || null;
    const address = (peripheral && peripheral.address) ? peripheral.address : peripheral;

    if (address) {
      this.disconnectSpecific(String(address));
    } else {
      this.logger.warn(this.TAG, 'Disconnect ignored: no connected peripheral address');
    }
  }

  clearDetectedDevices(reason: string = 'disconnect_success'): void {
    if (this.isScanning) {
      this.logger.warn(this.TAG, 'Detected device list clear skipped: scan active', { reason: reason });
      return;
    }

    const previousDevices = this.devices || [];
    const previousSelectedDevice = this.device || {};

    this.ngZone.run(() => {
      this.devices = [];
      this.device = {};
      this.detectedDeviceIds = {};
    });

    const logDetails = {
      reason: reason,
      previousCount: previousDevices.length,
      previousSelectedId: previousSelectedDevice.id || previousSelectedDevice.address || '',
      previousSelectedName: previousSelectedDevice.name || ''
    };

    if (reason === 'disconnect_success' || reason === 'nav_param_clearDevices') {
      this.logger.info(this.TAG, 'Liste des produits détectés vidée après déconnexion', logDetails);
    } else {
      this.logger.info(this.TAG, 'Detected device list cleared', logDetails);
    }
  }

  async initScan() {
    if (this.initScanInProgress) {
      this.logger.debug(this.TAG, 'Init scan ignored: pre-check already running');
      return;
    }

    this.initScanInProgress = true;
    this.logger.info(this.TAG, 'Init scan started');

    try {
      const precheck = await this.randble.prepareForScan();
      this.logger.info(this.TAG, 'Pre-scan check result', precheck);

      if (precheck && precheck.ready && precheck.reason === 'READY') {
        this.enablePopupAlreadyShown = false;
        this.settingsPopupShown = false;
        this.permissionPopupShown = false;
        this.locationPopupShown = false;
		this.permissionDeniedCount = 0;							   
        this.logger.info(this.TAG, 'Pre-scan check passed, launching scan');
        this.scan();
        return;
      }

      const reason = precheck && precheck.reason ? String(precheck.reason) : 'PRECHECK_FAILED';

      if (reason === 'BLE_DISABLED') {
        this.logger.warn(this.TAG, 'Init scan blocked: bluetooth disabled', precheck ? precheck.details : null);
        if (!this.enablePopupAlreadyShown) {
          this.enablePopupAlreadyShown = true;
          this.showEnableBluetoothPopup();
        } else {
          this.showBluetoothSettingsPopup();
        }
        return;
      }

      if (reason === 'PERMISSION_DENIED') {
        this.permissionDeniedCount++;
        this.logger.warn(this.TAG, 'Init scan blocked: permission denied', {
          details: precheck ? precheck.details : null,
          permissionDeniedCount: this.permissionDeniedCount
        });

        this.setStatus(this.UI_MESSAGES.scanPermissionDenied);

        if (this.platform.is('ios') || this.permissionDeniedCount >= 2) {
          this.showPermissionSettingsPopup(precheck ? precheck.details : null, this.permissionDeniedCount >= 2);
        } else {
          this.showToast(
            'Impossible de lancer la recherche tant que les autorisations Bluetooth et localisation ne sont pas accordées.',
            3500
          );
        }
        return;
      }

      if (reason === 'PERMISSION_PERMANENTLY_DENIED') {
        this.permissionDeniedCount = Math.max(this.permissionDeniedCount, 2);
        this.logger.warn(this.TAG, 'Init scan blocked: permission permanently denied', precheck ? precheck.details : null);
        this.setStatus(this.UI_MESSAGES.scanPermissionPermanentlyDenied);
        this.showPermissionSettingsPopup(precheck ? precheck.details : null, true);
        return;
      }

      if (reason === 'LOCATION_DISABLED') {
        this.logger.warn(this.TAG, 'Init scan blocked: location disabled', precheck ? precheck.details : null);
        this.setStatus(this.UI_MESSAGES.scanLocationDisabled);
        this.showLocationSettingsPopup(precheck ? precheck.details : null);
        return;
      }

      this.logger.error(this.TAG, 'Init scan blocked: pre-check failed', precheck ? precheck.details : null);
      this.setStatus(this.UI_MESSAGES.scanPrepareFailed);					 
      this.showToast('La préparation Bluetooth est incomplète. Vérifiez les réglages, puis relancez la recherche.', 3500);			   	   
    } catch (error) {
      this.logger.error(this.TAG, 'Init scan failed unexpectedly', error);
      this.setStatus(this.UI_MESSAGES.scanPrepareFailed);				 
      this.showToast('Une erreur est survenue pendant la préparation Bluetooth.', 3000);	   
    } finally {
      this.initScanInProgress = false;
    }
  }










  scan() {
    if (this.isScanning) {
      this.logger.debug(this.TAG, 'Scan request ignored: already scanning');
      return;
    }

    this.clearScanTimeout();
    this.resetScanResults('new_scan');
    this.setStatus(this.UI_MESSAGES.scanSearching);
    this.isScanning = true;
    this.isPushOnce = false;

    const targetServices = PRODUCTS_CONFIG.map(p => p.serviceUUID);

    let scanParams = {
      services : targetServices,
      allowDuplicates: true, 
      matchNum: this.randble.MATCH_NUM_MAX_ADVERTISEMENT,
      callbackType: this.randble.CALLBACK_TYPE_ALL_MATCHES,
      scanMode: this.randble.SCAN_MODE_BALANCED,
    };

    this.logger.info(this.TAG, 'Starting BLE scan', scanParams);

    this.scanSubscription = this.randble.startScan(scanParams).subscribe(
      device => {
        if (device.status === 'scanResult') {
           /*this.logger.debug(this.TAG, 'Scan result', {
             id: device.id || device.address,
             name: device.name,
             rssi: device.rssi
           });*/
           this.onDeviceDiscovered(device);
        }
        else if (device.id || device.address) {
           this.onDeviceDiscovered(device);
        }
      },
      error => {
        const code = (error && error.code) ? String(error.code) : '';

        this.ngZone.run(() => this.isScanning = false);
        this.clearScanSubscription('scan_error');

        if (code === 'BLE_DISABLED') {
          this.logger.warn(this.TAG, 'Scan failed: bluetooth disabled', error);
          this.initScan();
          return;
        }

        if (code === 'BLE_PERMISSION_DENIED') {
          this.logger.warn(this.TAG, 'Scan failed: bluetooth/location permission denied', error);
          this.setStatus(this.UI_MESSAGES.scanPermissionDenied);
          this.showToast(
            'Les autorisations Bluetooth ou localisation ont été refusées. Veuillez relancer la recherche.',
            3500
          );
          this.initScan();
          return;
        }

        if (code === 'BLE_LOCATION_DISABLED') {
          this.logger.warn(this.TAG, 'Scan failed: location disabled', error);
          this.setStatus(this.UI_MESSAGES.scanLocationDisabled);
          this.showLocationSettingsPopup(error);
          return;
        }

        if (code === 'BLE_NOT_INITIALIZED') {
          this.logger.warn(this.TAG, 'Scan failed: BLE not initialized', error);
          this.setStatus(this.UI_MESSAGES.scanPrepareFailed);
          this.showToast('Le Bluetooth de l\'application n\'est pas prêt. Veuillez relancer la recherche.', 3000);
          return;
        }

        this.logger.error(this.TAG, 'Scan failed', error);
        this.setStatus(this.UI_MESSAGES.scanError);
		this.showToast('La recherche Bluetooth a échoué. Veuillez réessayer.', 3000);																				
      }
    );

    this.scanTimeoutHandle = setTimeout(() => {
      if (this.isScanning) {
        this.randble.stopScan().then(() => {
          this.logger.info(this.TAG, 'Scan timeout reached, scan stopped');
          this.ngZone.run(() => { this.isScanning = false; });
          this.clearScanSubscription('scan_timeout');
        }).catch((err) => {
          this.logger.error(this.TAG, 'Scan timeout stop failed', err);
          this.ngZone.run(() => { this.isScanning = false; });
          this.clearScanSubscription('scan_timeout_error');
		}).then(() => {
          this.clearScanTimeout();			   					  
        });
      }
    }, 8000);
  }

  isDeviceBonded(device: ScanDevice): void {
    if ((device.status) == "scanStarted") {
      return;
    }

    if (this.platform.is('android') && typeof (this.randble as any).isBonded === 'function') {
	  const address = device && (device.address || device.id) ? String(device.address || device.id) : '';
      if (!address) {
        this.logger.warn(this.TAG, 'Bond status skipped: missing address', { device: device });
        return;
      }																								 

      this.randble.isBonded({ address: address }).then(
        (deviceBond: { isBonded: boolean }) => {
          this.onDeviceDiscovered(Object.assign(device, deviceBond) as ScanDevice);
          this.logger.debug(this.TAG, 'Bond status resolved', {
            address: device ? device.address : null,
            isBonded: device ? device.isBonded : null
          });
        },
        (error: any) => {
          this.logger.warn(this.TAG, 'Bond status check failed', {
            address: device ? device.address : null,
            error: error
          });
        }
      );
    }
    else {
      this.onDeviceDiscovered(device);
      this.logger.debug(this.TAG, 'Device discovered without bond status check', {
        address: device ? device.address : null,
        id: device ? device.id : null
      });
    }

  }

  onDeviceDiscovered(device: ScanDevice): void {
    this.ngZone.run(() => {
      
      if (this.platform.is('android')) {
         // On ne force pas la valeur, on attend la réponse asynchrone ci-dessous
         // Mais pour l'affichage initial, on peut laisser undefined
      }

      const deviceKey = this.getDeviceKey(device);
      const nameInfo = this.resolveScanDeviceName(device);

      let existingDevice = this.devices.find((d: ScanDevice) => 
        (d.id && device.id && d.id === device.id) || 
        (d.address && device.address && d.address === device.address)
      );

      const oldName = existingDevice ? existingDevice.name : '';
      const knownBefore = !!(deviceKey && this.detectedDeviceIds[deviceKey]);

      if (deviceKey) {
        this.detectedDeviceIds[deviceKey] = true;
      }

      this.logger.info(this.TAG, 'Device detected during scan', {
        deviceKey: deviceKey,
        knownBefore: knownBefore,
        oldName: oldName,
        newName: nameInfo.name,
        nameSource: nameInfo.source,
        isFreshName: nameInfo.isFresh,
        rssi: device ? device.rssi : null
      });

      if (existingDevice) {
        let wasUpdated = false;

        if (!existingDevice.id && device.id) {
          existingDevice.id = device.id;
          wasUpdated = true;
        }
        if (!existingDevice.address && device.address) {
          existingDevice.address = device.address;
          wasUpdated = true;
        }
        if (device.rssi !== undefined) {
          existingDevice.rssi = device.rssi;
          wasUpdated = true;
        }
        if (device.advertising) {
          existingDevice.advertising = device.advertising;
          wasUpdated = true;
        }
        if (device.advertisement) {
          existingDevice.advertisement = device.advertisement;
          wasUpdated = true;
        }
        if (device.isBonded !== undefined) {
          existingDevice.isBonded = device.isBonded;
          wasUpdated = true;
        }
        if (this.shouldUpdateDisplayedName(existingDevice.name, nameInfo, !!existingDevice._hasFreshLocalName)) {
          existingDevice.name = nameInfo.name;
          wasUpdated = true;
        }
        if (nameInfo.name) {
          existingDevice._scanNameSource = nameInfo.source;
          existingDevice._hasFreshLocalName = !!existingDevice._hasFreshLocalName || nameInfo.isFresh;
        }

        if (wasUpdated) {
          this.logger.info(this.TAG, 'Existing scan device updated', {
            deviceKey: deviceKey,
            oldName: oldName,
            newName: existingDevice.name,
            nameSource: nameInfo.source
          });
          this.devices = this.devices.slice();
        }
      } else {
        if (nameInfo.name) {
          device.name = nameInfo.name;
          device._scanNameSource = nameInfo.source;
          device._hasFreshLocalName = nameInfo.isFresh;
        }
        if (device.isBonded === undefined) {
           device.isBonded = false;
        }
        this.devices.push(device);
        this.logger.info(this.TAG, 'New scan device added', {
          deviceKey: deviceKey,
          name: device.name,
          nameSource: nameInfo.source
        });
        
        this.checkBondStatus(device);
      }
    });
  }

  checkBondStatus(device: ScanDevice): void {
      if (this.platform.is('android')) {
          const address = device && (device.address || device.id) ? String(device.address || device.id) : '';
          if (!address) {
            this.logger.warn(this.TAG, 'Bond status async check skipped: missing address', { device: device });
            return;
          }

          this.randble.isBonded({ address: address }).then((res: { isBonded: boolean }) => {
              this.ngZone.run(() => {
                  let target = this.devices.find((d: ScanDevice) =>
                    (d.address && d.address === address) || (d.id && d.id === address)
                  );
                  if (target) {
                      target.isBonded = res.isBonded;
                  }
              });
          }).catch((error: any) => {
              this.logger.warn(this.TAG, 'Bond status async check failed', {
                address: device ? device.address : null,
                error: error
              });
          });
      }
  }
  /*
  onDeviceDiscovered(device) {
    this.ngZone.run(() => {

      let existingDevice = this.devices.find(d => 
        (d.id && device.id && d.id === device.id) || 
        (d.address && device.address && d.address === device.address)
      );

      if (existingDevice) {
        if (device.rssi) {
          existingDevice.rssi = device.rssi;
        }
        
        if (device.advertising) existingDevice.advertising = device.advertising;
        if (device.advertisement) existingDevice.advertisement = device.advertisement;

      } else {
          if (device.isBonded === undefined) {
            device.isBonded = false; 
          }

        this.devices.push(device);
      }
    });
  }*/

  // If location permission is denied, you'll end up here
  scanError(error: any): void {
    this.logger.error(this.TAG, 'scanError callback invoked', error);
    this.setStatus(this.UI_MESSAGES.scanError);
    this.showToast('Une erreur Bluetooth est survenue. Veuillez réessayer.', 3000);
  }

  setStatus(message: string): void {
    this.logger.debug(this.TAG, 'Status update', message);
    this.ngZone.run(() => {
      this.statusMessage = message;
    });
  }


  unbondOrBond(device: ScanDevice): void {
    if (!this.platform.is('android')) {
        return;
    }

    if (device.isBonded) {
										   
        this.showToast('Pour désappairer, ouvrez les réglages Bluetooth du téléphone puis choisissez "Oublier cet appareil".', 4000);
						   
							  
		   
						
        return;
    }

        this.setStatus(this.UI_MESSAGES.pairingInProgress);
    
    const address = device && (device.address || device.id) ? String(device.address || device.id) : '';
    if (!address) {
      this.setStatus(this.UI_MESSAGES.missingIdentifier);
      this.showToast('Impossible d\'appairer cet appareil. Identifiant Bluetooth manquant.', 2500);
      return;
    }

    this.randble.bond({ address: address }).then(() => {
        this.ngZone.run(() => {
            device.isBonded = true;
            this.unbondOrBondColor = "mantionSmtgreen";
        });
        this.setStatus(this.UI_MESSAGES.pairingSuccess);
        this.showToast(this.UI_MESSAGES.pairingSuccess, 2000);
		
		
		
		
		

    }).catch((err) => {
        this.logger.error(this.TAG, 'Bonding failed', err);
        this.setStatus(this.UI_MESSAGES.pairingFailed);
        
        let alert = this.alertCtrl.create({
            title: this.UI_MESSAGES.pairingFailed,
            message: 'Vérifiez que le produit est prêt à être appairé puis réessayez.',
            buttons: ['OK']
        });
        alert.present();
    });
  }

  swipe() {
    this.logger.debug(this.TAG, 'Swipe action detected');

  }
  
  async deviceSelected(device: ScanDevice): Promise<void> {
    this.logger.info(this.TAG, 'Device selected', {
      name: device ? device.name : null,
      address: device ? device.address : null,
      id: device ? device.id : null
    });

    if (this.isPushOnce || this.isConnectionFlowInProgress) {
      this.logger.warn(this.TAG, 'Device selection ignored: connection flow already in progress', {
        isPushOnce: this.isPushOnce,
        isConnectionFlowInProgress: this.isConnectionFlowInProgress
      });
      return;
    }

    this.isPushOnce = true;
    this.isConnectionFlowInProgress = true;

    let loading: any = null;
    let connectSubscription: any = null;
    let phase = 'selected';
    let flowActive = true;
    let cleanupDone = false;

    const dismissLoadingSafely = async () => {
      if (!loading) return;
      try {
        await loading.dismiss();
      } catch (e) {
        this.logger.debug(this.TAG, 'Loading dismiss ignored (already closed)', {
          phase: phase,
          error: e
        });
      } finally {
        loading = null;
      }
    };

    const cleanupConnectionFlow = async (reason: string, setConnectionStatusUnknown: boolean) => {
      if (cleanupDone) {
        this.logger.debug(this.TAG, 'Cleanup skipped (already done)', {
          reason: reason,
          phase: phase
        });
        return;
      }

      cleanupDone = true;
      flowActive = false;

      if (connectSubscription && typeof connectSubscription.unsubscribe === 'function') {
        try {
          connectSubscription.unsubscribe();
          this.logger.debug(this.TAG, 'Connect subscription unsubscribed', { reason: reason });
        } catch (e) {
          this.logger.warn(this.TAG, 'Error while unsubscribing connect subscription', {
            reason: reason,
            error: e
          });
        }
      }

      await dismissLoadingSafely();
      this.isScanning = false;
	  this.clearScanTimeout();					  
      this.isPushOnce = false;
      this.isConnectionFlowInProgress = false;

      if (setConnectionStatusUnknown) {
        this.bleConnectService.setConnectionStatus('unknown');
      }

      this.logger.info(this.TAG, 'Connection flow cleanup completed', {
        reason: reason,
        phase: phase,
        setConnectionStatusUnknown: setConnectionStatusUnknown
      });
    };

    try {
      phase = 'stoppingScan';
      try {
        await this.randble.stopScan();
      } catch (e) {
        this.logger.warn(this.TAG, 'stopScan before connect failed (ignored)', {
          error: e,
          device: device
        });
      }
      this.isScanning = false;

      await new Promise(r => setTimeout(r, 400)); // evite erreur gatt 133

      let detectedConfig: ProductConfig | undefined;
      let detectedProductType: DetectedProductType = 'unknown';
      let detectedProductLabel = 'Produit inconnu';
      let name = (device.name || "").toUpperCase();

      if (device.isDemo === true || device.isDemo === "true") {
        let demoProductId = device.demoProductId || device.productType;
        detectedConfig = demoProductId ? PRODUCTS_CONFIG.find(p => p.id === demoProductId) : undefined;

        if (!detectedConfig) {
          detectedConfig = PRODUCTS_CONFIG.find(p => p.id === 'widoor');
        }
        detectedProductType = detectedConfig && detectedConfig.id === 'widoor'
          ? 'widoor'
          : (detectedConfig && detectedConfig.id === 'garline' ? 'garline' : 'moventiv60');
        detectedProductLabel = productTypeLabel(detectedProductType);
      }
      else if (isWidoorBluetoothName(name)) {
        detectedProductType = 'widoor';
        detectedProductLabel = productTypeLabel(detectedProductType);
        detectedConfig = PRODUCTS_CONFIG.find(p => p.id === 'widoor');
      }
      else {
        detectedConfig = PRODUCTS_CONFIG.find(p => p.id === 'moventiv');
        this.logger.info(this.TAG, 'Non-Widoor product selected, waiting for version word detection', {
          bluetoothName: name,
          preliminaryPage: detectedConfig ? detectedConfig.page : null
        });
      }

      if (!detectedConfig) {
        this.toastCtrl.create({
          message: 'Produit non reconnu.',
          duration: 2000, position: 'bottom'
        }).present();
        await cleanupConnectionFlow('unknown_product', true);
        return;
      }

      this.logger.info(this.TAG, 'Product page resolved for selected device', {
        productType: detectedProductType,
        productLabel: detectedProductLabel,
        productConfigId: detectedConfig.id,
        productName: detectedConfig.name
      });

      // Si c'est un appareil de demo, on ouvre directement la page sans connecter
      if (device.isDemo === true || device.isDemo === "true") {
        phase = 'navigating';
        this.navCtrl.push(detectedConfig.page, {
          device: device,
          productType: detectedProductType,
          productName: detectedProductLabel
        }).then(async () => {
          this.logger.info(this.TAG, 'Demo navigation success');
          await cleanupConnectionFlow('demo_navigation_success', false);
        }).catch(async (navErr) => {
          this.logger.error(this.TAG, 'Demo navigation failed', navErr);
          await cleanupConnectionFlow('demo_navigation_failed', true);
        });
        return;
      }

      loading = this.loadingCtrl.create({ content: 'Connexion en cours...' });
      try {
        await loading.present();
      } catch (loadingErr) {
        this.logger.warn(this.TAG, 'Loading present failed, continuing flow', loadingErr);
      }

      // Securisation de l'adresse (ID pour iOS, Address pour Android)
      let targetAddress = (device && (device.address || device.id)) ? String(device.address || device.id).trim() : '';
      this.logger.info(this.TAG, 'Selected device identifier', {
        targetAddress: targetAddress,
        productType: detectedProductType,
        productConfigId: detectedConfig.id
      });

      if (!targetAddress) {
        this.logger.error(this.TAG, 'Missing device id/address in selected device', {
          code: 'BLE_DEVICE_ID_MISSING',
          device: device
        });
        this.toastCtrl.create({
          message: 'Connexion impossible. Identifiant Bluetooth manquant pour cet appareil.',
          duration: 3000,
          position: 'bottom'
        }).present();
        await cleanupConnectionFlow('missing_device_id', true);
        return;
      }

      phase = 'connecting';
      this.bleConnectService.setConnectionStatus('connecting');
      this.logger.info(this.TAG, 'Connecting to selected device', { address: targetAddress });

      connectSubscription = this.randble.connect({ address: targetAddress }).subscribe(
        (res) => {
          if (!flowActive) {
            this.logger.warn(this.TAG, 'Connect event ignored: flow already inactive', {
              event: res,
              phase: phase
            });
            return;
          }

          this.logger.debug(this.TAG, 'Connect event', {
            event: res,
            phase: phase
          });

          if (res.status === 'connected') {
            if (phase !== 'connecting') {
              this.logger.warn(this.TAG, 'Connected event ignored: unexpected phase', { phase: phase });
              return;
            }

            phase = 'discovering';
            this.logger.info(this.TAG, 'Connection succeeded, discovery starting', { address: targetAddress });

            // Ajout d'un delai pour stabiliser la connexion (fix frequent sur Android)
            setTimeout(() => {
              if (!flowActive) {
                this.logger.warn(this.TAG, 'Discovery skipped: flow inactive before start', { address: targetAddress });
                return;
              }

              this.randble.discover({ address: targetAddress })
                .then(async (discoverRes) => {
                  if (!flowActive) {
                    this.logger.warn(this.TAG, 'Discovery success ignored: flow inactive', { address: targetAddress });
                    return;
                  }

                  this.logger.info(this.TAG, 'Discovery success after connect', {
                    address: targetAddress,
                    status: discoverRes ? discoverRes.status : null
                  });

                  if (!device.address && device.id) {
                    device.address = device.id;
                  }

                  if (detectedProductType !== 'widoor') {
                    const versionDetection = await this.detectConnectedProduct(device, targetAddress);
                    detectedProductType = versionDetection.productType;
                    detectedProductLabel = productTypeLabel(detectedProductType);
                    const configFromVersion = this.getProductConfigForDetectedType(detectedProductType);
                    detectedConfig = configFromVersion || detectedConfig;
                  }

                  this.bleConnectService.setWasConnected(true);
                  this.bleConnectService.setConnectedPeripheral(device);
                  this.bleConnectService.setConnectionStatus('connected');

                  phase = 'navigating';
                  this.logger.info(this.TAG, 'Connection context updated, navigating to product page', {
                    address: targetAddress,
                    productType: detectedProductType,
                    productLabel: detectedProductLabel,
                    productConfigId: detectedConfig.id
                  });

                  this.navCtrl.push(detectedConfig.page, {
                    device: device,
                    productType: detectedProductType,
                    productName: detectedProductLabel
                  }).then(async () => {
                    this.logger.info(this.TAG, 'Navigation success after BLE connection', {
                      address: targetAddress,
                      productType: detectedProductType,
                      productLabel: detectedProductLabel,
                      productConfigId: detectedConfig.id
                    });
                    phase = 'completed';
                    await cleanupConnectionFlow('navigation_success', false);
                  }).catch(async (navErr) => {
                    this.logger.error(this.TAG, 'Navigation failed after BLE connection', {
                      address: targetAddress,
                      productType: detectedProductType,
                      productConfigId: detectedConfig.id,
                      error: navErr
                    });
                    this.toastCtrl.create({
                      message: 'Connexion établie, mais ouverture de la page impossible.',
                      duration: 3000,
                      position: 'bottom'
                    }).present();
                    await cleanupConnectionFlow('navigation_failed', true);
                  });
                })
                .catch((err) => {
                  if (!flowActive) {
                    this.logger.warn(this.TAG, 'Discovery error ignored: flow inactive', {
                      address: targetAddress,
                      error: err
                    });
                    return;
                  }

                  this.logger.error(this.TAG, 'Discovery failed after connect', {
                    address: targetAddress,
                    error: err
                  });

                  this.toastCtrl.create({
                    message: 'Decouverte des services Bluetooth impossible.',
                    duration: 3000,
                    position: 'bottom'
                  }).present();

                  cleanupConnectionFlow('discovery_failed', true);
                });
            }, 500);
          } else if (res.status === 'disconnected') {
            if (!flowActive) {
              this.logger.warn(this.TAG, 'Runtime disconnection ignored: flow inactive', { address: targetAddress });
              return;
            }

            this.logger.warn(this.TAG, 'Runtime disconnection during connection flow', {
              address: targetAddress,
              phase: phase,
              event: res
            });

            this.toastCtrl.create({
              message: 'Connexion Bluetooth interrompue. Veuillez réessayer.',
              duration: 3000,
              position: 'bottom'
            }).present();

            cleanupConnectionFlow('runtime_disconnected', true);
          }
        },
        (err) => {
          if (!flowActive) {
            this.logger.warn(this.TAG, 'Connect error ignored: flow inactive', { error: err, phase: phase });
            return;
          }

          this.logger.error(this.TAG, 'Connect failed on selected device', {
            address: targetAddress,
            error: err
          });

          this.toastCtrl.create({
            message: 'Connexion Bluetooth impossible. Veuillez réessayer.',
            duration: 3000,
            position: 'bottom'
          }).present();

          cleanupConnectionFlow('connect_failed', true);
        }
      );
    } catch (unexpectedError) {
      this.logger.error(this.TAG, 'Unexpected error in deviceSelected flow', {
        error: unexpectedError,
        phase: phase
      });
      this.toastCtrl.create({
        message: 'Erreur inattendue pendant la connexion Bluetooth. Veuillez réessayer.',
        duration: 3000,
        position: 'bottom'
      }).present();
      await cleanupConnectionFlow('unexpected_error', true);
    }
  }


  private async detectConnectedProduct(device: ScanDevice, targetAddress: string): Promise<ProductDetectionResult> {
    const bluetoothName = this.getBluetoothNameForDetection(device);

    if (isWidoorBluetoothName(bluetoothName)) {
      const widoorDetection = detectProductType(bluetoothName, null);
      this.logger.info(this.TAG, 'Product detection from Bluetooth name', {
        bluetoothName: bluetoothName,
        productType: widoorDetection.productType,
        productLabel: productTypeLabel(widoorDetection.productType),
        reason: widoorDetection.reason
      });
      return widoorDetection;
    }

    this.logger.info(this.TAG, 'Reading version word for product detection', {
      bluetoothName: bluetoothName,
      address: targetAddress,
      service: SHDO_SERVICE,
      characteristic: SHDO_VERSION_CHARACTERISTIC
    });

    try {
      const buffer = await this.randble.read({
        address: targetAddress,
        service: SHDO_SERVICE,
        characteristic: SHDO_VERSION_CHARACTERISTIC
      });
      const versionWordBytes = this.randble.encodedStringToBytes(buffer.value);
      const detection = detectProductType(bluetoothName, versionWordBytes);

      if (detection.productType === 'unknown') {
        this.logger.warn(this.TAG, 'Product detection from version word is unknown', {
          bluetoothName: bluetoothName,
          versionWordLength: versionWordBytes ? versionWordBytes.length : 0,
          versionWordHex: versionWordBytesToHex(versionWordBytes),
          productTypeByte: detection.productTypeByte,
          reason: detection.reason
        });
      } else {
        this.logger.info(this.TAG, 'Product detection from version word succeeded', {
          bluetoothName: bluetoothName,
          versionWordLength: versionWordBytes.length,
          versionWordHex: versionWordBytesToHex(versionWordBytes),
          productTypeByte: detection.productTypeByte,
          productType: detection.productType,
          productLabel: productTypeLabel(detection.productType),
          reason: detection.reason
        });
      }

      return detection;
    } catch (error) {
      this.logger.error(this.TAG, 'Version word read failed during product detection', {
        bluetoothName: bluetoothName,
        address: targetAddress,
        error: error
      });
      return detectProductType(bluetoothName, null);
    }
  }

  private getProductConfigForDetectedType(productType: DetectedProductType): ProductConfig | undefined {
    const configId = getProductConfigId(productType) || 'moventiv';
    return PRODUCTS_CONFIG.find(p => p.id === configId);
  }

  private getBluetoothNameForDetection(device: ScanDevice): string {
    return String(
      (device && (device.name || device.localName || device.displayName)) ||
      ''
    );
  }



  ionViewDidEnter() {
    this.logger.debug(this.TAG, 'ionViewDidEnter');
    this.isPushOnce = false;
  }


  presentPopover(ev: any): void {
    let popover = this.popoverCtrl.create('PopoverPage', {
      fromConnected: false
    });
    popover.present({
      ev: ev
    });
  }


  pushInfoSlide() {
    this.navCtrl.push('InfoSlidePage');
  }

  showDeconnectedToast() {
    this.translate.get('PROMPT.DISCONNECTED.TITLE').subscribe(
      res => {
        let toast = this.toastCtrl.create({
          message: res,
          duration: 500,
          position: 'middle',
          cssClass: "yourtoastclass"
        });
        toast.present();
      });
  }


  launchDemoMode() {
    this.logger.info(this.TAG, 'Demo mode selection requested');

    let alert = this.alertCtrl.create({
      title: 'Exemple',
      message: 'Choisissez un produit',
      buttons: [
        {
          text: 'Widoor',
          handler: () => {
            this.openDemoProduct('widoor');
          }
        },
        {
          text: 'Moventiv',
          handler: () => {
            this.openDemoProduct('moventiv');
          }
        },
        {
          text: 'Garline',
          handler: () => {
            this.openDemoProduct('garline');
          }
        },
        {
          text: 'Annuler',
          role: 'cancel'
        }
      ]
    });

    alert.present();
  }

  private openDemoProduct(productId: string) {
    const productConfig = PRODUCTS_CONFIG.find(p => p.id === productId);

    if (!productConfig) {
      this.logger.warn(this.TAG, 'Demo product not found', { productId: productId });
      this.toastCtrl.create({
        message: 'Exemple non disponible',
        duration: 2000,
        position: 'bottom'
      }).present();
      return;
    }

    let demoDevice = this.createDemoDevice(productConfig);

    this.logger.info(this.TAG, 'Opening demo product page', {
      productType: productConfig.id,
      productName: productConfig.name,
      demoName: demoDevice.name
    });

    this.ngZone.run(() => {
      this.navCtrl.push(productConfig.page, {
        device: demoDevice,
        productType: productConfig.id,
        productName: productConfig.name,
        displayName: demoDevice.name
      }).catch((navErr) => {
        this.logger.error(this.TAG, 'Demo navigation failed', navErr);
        this.toastCtrl.create({
          message: 'Impossible d’ouvrir cet exemple.',
          duration: 2500,
          position: 'bottom'
        }).present();
      });
    });
  }

  private createDemoDevice(productConfig: any) {
    return {
      rssi: -45,
      name: productConfig.demoName,
      address: productConfig.id.toUpperCase() + '-EXEMPLE-0001',
      id: productConfig.id.toUpperCase() + '-EXEMPLE-0001',
      isBonded: true,
      advertisement: {
        serviceUuids: [productConfig.serviceUUID]
      },
      advertising: {
        serviceUuids: [productConfig.serviceUUID]
      },
      isDemo: "true",
      demoProductId: productConfig.id,
      productType: productConfig.id
    };
  }

  bleIsNotEnabledAlert() {
    this.translate.get(['SCAN_PAGE.ALERT.BLENOTENABLE.TITLE', 'SCAN_PAGE.ALERT.BLENOTENABLE.MESSAGE', 'SCAN_PAGE.ALERT.BLENOTENABLE.BUTTONS.NO.TEXT', 'SCAN_PAGE.ALERT.BLENOTENABLE.BUTTONS.YES']).subscribe(
      res => {
        let alert = this.alertCtrl.create({
          title: res["SCAN_PAGE.ALERT.BLENOTENABLE.TITLE"],
          message: res["SCAN_PAGE.ALERT.BLENOTENABLE.MESSAGE"],
          buttons: [
            {
              text: res["SCAN_PAGE.ALERT.BLENOTENABLE.BUTTONS.NO.TEXT"],
              role: 'cancel'
            },
            {
              text: res["SCAN_PAGE.ALERT.BLENOTENABLE.BUTTONS.YES"],
              handler: () => {
                this.randble.enable().then(() => {
                   setTimeout(() => this.initScan(), 1000); 
                });
              }
            }
          ],
        });
        alert.present();
      });
  }

  private showEnableBluetoothPopup() {
    this.alertCtrl.create({
      title: 'Bluetooth désactivé',
      message: 'Le Bluetooth est actuellement désactivé sur le téléphone. Voulez-vous l\’activer et lancer une recherche ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          handler: () => {
            // si l'user annule, on autorise une nouvelle tentative plus tard
            this.enablePopupAlreadyShown = false;
          }
        },
        {
          text: 'Activer',
          handler: () => {
            this.randble.enableAndWait().then((ok) => {

              if (ok) {
                this.enablePopupAlreadyShown = false;
                this.settingsPopupShown = false;
                this.permissionPopupShown = false;
                this.locationPopupShown = false;
                this.logger.info(this.TAG, 'Bluetooth enabled from popup, re-running pre-scan check');
                this.initScan();
              } else {
                this.showBluetoothSettingsPopup();
              }

            });
          }
        }
      ]
    }).present();
  }

  private showBluetoothSettingsPopup() {
    if (this.settingsPopupShown) return;
    this.settingsPopupShown = true;

    this.alertCtrl.create({
      title: 'Activation nécessaire',
      message: 'Le Bluetooth n\’a pas été activé automatiquement. Activez-le dans les paramètres Bluetooth puis relancez la recherche.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            // autorise une nouvelle tentative plus tard
            this.enablePopupAlreadyShown = false;
            this.settingsPopupShown = false;
          }
        },
        {
          text: 'Ouvrir les paramètres Bluetooth',
          handler: () => this.openBluetoothSettings()
        }
      ]
    }).present();
  }

  private showPermissionSettingsPopup(details?: any, isPermanent: boolean = false) {
    if (this.permissionPopupShown) {
      this.logger.debug(this.TAG, 'Permission popup skipped: already visible');
      return;
    }

    this.permissionPopupShown = true;
    this.logger.warn(this.TAG, 'Permission settings action requested before scan', details || {});

    const message = isPermanent
      ? 'Impossible de lancer la recherche tant que les autorisations Bluetooth et localisation ne sont pas accordées. Veuillez les activer dans les réglages de l\'application.'
      : 'Activez les autorisations Bluetooth et localisation de l\'application dans les réglages, puis relancez la recherche.';

    this.alertCtrl.create({
      title: 'Autorisations requises',
      message: message,
	  buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          handler: () => {
            this.permissionPopupShown = false;
          }
        },
        {
          text: 'Ouvrir les réglages de l\’application',
          handler: () => {
            this.logger.info(this.TAG, 'Opening app settings from permission popup');
            this.randble.openAppSettings().catch((error) => {
              this.logger.error(this.TAG, 'Open app settings failed from permission popup', error);
            });
            this.permissionPopupShown = false;
          }
        }
      ]
    }).present();
  }

  private showLocationSettingsPopup(details?: any) {
    if (this.locationPopupShown) {
      this.logger.debug(this.TAG, 'Location popup skipped: already visible');
      return;
    }

    this.locationPopupShown = true;
    this.logger.warn(this.TAG, 'Location settings action requested before scan', details || {});

    this.alertCtrl.create({
      title: 'Localisation désactivée',
      message: 'Activez la localisation du téléphone pour autoriser le scan Bluetooth, puis relancez la recherche.',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          handler: () => {
            this.locationPopupShown = false;
          }
        },
        {
          text: 'Ouvrir les réglages de localisation',
          handler: () => {
            this.logger.info(this.TAG, 'Opening location settings from location popup');
            this.randble.openLocationSettings().catch((error) => {
              this.logger.error(this.TAG, 'Open location settings failed from location popup', error);
            });
            this.locationPopupShown = false;
          }
        }
      ]
    }).present();
  }

  private openBluetoothSettings() {
    if (this.platform.is('android')) {
      this.logger.info(this.TAG, 'Opening bluetooth settings from popup');
      this.randble.openBluetoothSettings().catch((error) => {
        this.logger.error(this.TAG, 'Open bluetooth settings failed from popup', error);
      });
    } else {
      this.logger.info(this.TAG, 'Opening app settings from popup (iOS)');
      this.randble.openAppSettings().catch((error) => {
        this.logger.error(this.TAG, 'Open app settings failed from popup (iOS)', error);
      });
    }

    this.enablePopupAlreadyShown = false;
    this.settingsPopupShown = false;
  }
  private showToast(message: string, duration: number = 3000): void {
    this.toastCtrl.create({
      message: message,
      duration: duration,
      position: 'bottom'
    }).present();
  }

  private clearScanTimeout(): void {
    if (this.scanTimeoutHandle) {
      clearTimeout(this.scanTimeoutHandle);
      this.scanTimeoutHandle = null;
    }
  }

  private clearScanSubscription(reason: string): void {
    if (this.scanSubscription && typeof this.scanSubscription.unsubscribe === 'function') {
      try {
        this.scanSubscription.unsubscribe();
        this.logger.debug(this.TAG, 'Scan subscription cleared', { reason: reason });
      } catch (error) {
        this.logger.warn(this.TAG, 'Scan subscription clear failed', { reason: reason, error: error });
      }
    }
    this.scanSubscription = null;
  }

  private resetScanResults(reason: string): void {
    const previousDevices = this.devices || [];
    const previousSelectedDevice = this.device || {};

    this.clearScanSubscription(reason);
    this.devices = [];
    this.device = {};
    this.detectedDeviceIds = {};

    this.logger.info(this.TAG, 'Scan device list cleared', {
      reason: reason,
      previousCount: previousDevices.length,
      previousSelectedId: previousSelectedDevice.id || previousSelectedDevice.address || '',
      previousSelectedName: previousSelectedDevice.name || ''
    });
  }

  private getDeviceKey(device: ScanDevice): string {
    return device && (device.address || device.id)
      ? String(device.address || device.id).trim()
      : '';
  }

  private firstNonEmptyString(values: any[]): string {
    for (let i = 0; i < values.length; i++) {
      if (values[i] !== undefined && values[i] !== null) {
        const value = String(values[i]).trim();
        if (value && value !== 'Unknown' && value !== 'Unnamed') {
          return value;
        }
      }
    }
    return '';
  }

  private resolveScanDeviceName(device: ScanDevice): { name: string, source: string, isFresh: boolean } {
    const advertisement = device && device.advertisement ? device.advertisement : {};
    const advertising = device && device.advertising ? device.advertising : {};
    const deviceObject = device && device.device ? device.device : {};

    const localName = this.firstNonEmptyString([
      advertisement.localName,
      advertising.localName,
      device ? device.localName : '',
      deviceObject.localName
    ]);

    if (localName) {
      return {
        name: localName,
        source: 'localName',
        isFresh: true
      };
    }

    const fallbackName = this.firstNonEmptyString([
      device ? device.name : '',
      deviceObject.name
    ]);

    return {
      name: fallbackName,
      source: fallbackName ? 'name' : 'empty',
      isFresh: false
    };
  }

  private shouldUpdateDisplayedName(currentName: string | undefined, nameInfo: { name: string, source: string, isFresh: boolean }, currentHasFreshLocalName: boolean): boolean {
    const current = currentName ? String(currentName).trim() : '';
    const next = nameInfo && nameInfo.name ? String(nameInfo.name).trim() : '';

    if (!next) {
      return false;
    }

    if (!current || current === 'Unknown' || current === 'Unnamed') {
      return true;
    }

    if (nameInfo.isFresh && current !== next) {
      return true;
    }

    return !currentHasFreshLocalName && current !== next;
  }
}
