import { OnInit, Component, NgZone, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NavController, NavParams, AlertController, ToastController,  Content} from 'ionic-angular';
import { RandBLE } from '../../providers/randble/randble';
import { LoadingController } from 'ionic-angular';
import { Haptics } from '@capacitor/haptics';
import { Storage } from '@ionic/storage';
import { FormGroup, FormBuilder, FormControl, Validators } from "@angular/forms"
import { PopoverController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from 'ionic-angular';
import { Buffer } from 'buffer';
import { IonicPage } from 'ionic-angular';
import { BleconnectserviceProvider } from '../../providers/bleconnectservice/bleconnectservice';
import { LoggerService } from '../../providers/logger/logger.service';
import {
  DetectedProductType,
  detectProductType,
  getDemoProductTypeFromConfigId,
  getProductDisplayName,
  isGarlineProductType,
  isMoventivProductType,
  normalizeProductType,
  productTypeToVersionWordProductByte,
  productTypeLabel,
  versionWordBytesToHex
} from '../../app/product-detection';
//import { bcrypt } from '../../../node_modules';
import * as bcrypt from 'bcryptjs';
import moment from 'moment';

declare var require: any;
const BleClient = require('@capacitor-community/bluetooth-le').BleClient;


// HANDLE OFFSET
const D_SHDO_VERSION_STACK_MAJORMSB_HOF = 0;
const D_SHDO_VERSION_STACK_MAJORLSB_HOF = 1;
const D_SHDO_VERSION_STACK_MINORMSB_HOF = 2;
const D_SHDO_VERSION_STACK_MINORLSB_HOF = 3;
const D_SHDO_VERSION_STACK_PATCHMSB_HOF = 4;
const D_SHDO_VERSION_STACK_PATCHLSB_HOF = 5;
const D_SHDO_VERSION_STACK_BUILDMSB_HOF = 6;
const D_SHDO_VERSION_STACK_BUILDLSB_HOF = 7;
const D_SHDO_VERSION_BLESOFT_MAJOR_HOF = 8;
const D_SHDO_VERSION_BLESOFT_MINOR_HOF = 9;
const D_SHDO_VERSION_BLESOFT_PATCH_HOF = 10;
const D_SHDO_VERSION_BLESOFT_SPECI_HOF = 11;
const D_SHDO_VERSION_MOTID_HOF = 12;
const D_SHDO_VERSION_MOTIDSPE_HOF = 13;
const D_SHDO_VERSION_MOTSOFT_MAJOR_HOF = 14;
const D_SHDO_VERSION_MOTSOFT_MINOR_HOF = 15;
const D_SHDO_VERSION_MOTSOFT_PATCH_HOF = 16;
const D_SHDO_VERSION_MOTSOFT_SPECI_HOF = 17;
const D_SHDO_VERSION_CRCMSB_HOF = 18;
const D_SHDO_VERSION_CRCLSB_HOF = 19;

const D_SHDO_USERDATESCYCLESALL_FAD_YY_UOF = 0;
const D_SHDO_USERDATESCYCLESALL_FAD_MM_UOF = 1;
const D_SHDO_USERDATESCYCLESALL_FAD_DD_UOF = 2;
const D_SHDO_USERDATESCYCLESALL_FID_YY_UOF = 3;
const D_SHDO_USERDATESCYCLESALL_FID_MM_UOF = 4;
const D_SHDO_USERDATESCYCLESALL_FID_DD_UOF = 5;
const D_SHDO_USERDATESCYCLESALL_FID_HH_UOF = 6;
const D_SHDO_USERDATESCYCLESALL_LMD_YY_UOF = 7;
const D_SHDO_USERDATESCYCLESALL_LMD_MM_UOF = 8;
const D_SHDO_USERDATESCYCLESALL_LMD_DD_UOF = 9;
const D_SHDO_USERDATESCYCLESALL_LMD_HH_UOF = 10;
const D_SHDO_USERDATESCYCLESALL_TC_02_UOF = 11;
const D_SHDO_USERDATESCYCLESALL_TC_01_UOF = 12;
const D_SHDO_USERDATESCYCLESALL_TC_00_UOF = 13;
const D_SHDO_USERDATESCYCLESALL_LMC_02_UOF = 14;
const D_SHDO_USERDATESCYCLESALL_LMC_01_UOF = 15;
const D_SHDO_USERDATESCYCLESALL_LMC_00_UOF = 16;

const D_SHDO_PROMAINTENANCE_INIT_02_HOF = 0;
const D_SHDO_PROMAINTENANCE_INIT_01_HOF = 1;
const D_SHDO_PROMAINTENANCE_INIT_00_HOF = 2;
const D_SHDO_PROMAINTENANCE_CINIT_02_HOF = 3;
const D_SHDO_PROMAINTENANCE_CINIT_01_HOF = 4;
const D_SHDO_PROMAINTENANCE_CINIT_00_HOF = 5;
const D_SHDO_PROMAINTENANCE_OBSDETECT_02_HOF = 6;
const D_SHDO_PROMAINTENANCE_OBSDETECT_01_HOF = 7;
const D_SHDO_PROMAINTENANCE_OBSDETECT_00_HOF = 8;
const D_SHDO_PROMAINTENANCE_WSO_02_HOF = 9;
const D_SHDO_PROMAINTENANCE_WSO_01_HOF = 10;
const D_SHDO_PROMAINTENANCE_WSO_00_HOF = 11;
const D_SHDO_PROMAINTENANCE_WSC_02_HOF = 12;
const D_SHDO_PROMAINTENANCE_WSC_01_HOF = 13;
const D_SHDO_PROMAINTENANCE_WSC_00_HOF = 14;
const D_SHDO_PROMAINTENANCE_OHM_HOF = 15;
const D_SHDO_PROMAINTENANCE_EC_HOF = 16;
const D_SHDO_PROMAINTENANCE_EM_HOF = 17;

const D_SHDO_MOTORSTATE_STATE_HOF = 0;
const D_SHDO_MOTORSTATE_POSMSB_HOF = 1;
const D_SHDO_MOTORSTATE_POSLSB_HOF = 2;
const D_SHDO_MOTORSTATE_MPOSMSB_HOF = 3;
const D_SHDO_MOTORSTATE_MPOSLSB_HOF = 4;
const D_SHDO_MOTORSTATE_ERROR_HOF = 5;
const D_SHDO_MOTORSTATE_SWITCH_HOF = 6;

const D_MLPC_USERPARAM_MOC_HOF = 0;
const D_MLPC_USERPARAM_SOT_HOF = 1;
const D_MLPC_USERPARAM_SCT_HOF = 2;
const D_MLPC_USERPARAM_OTS_HOF = 3;
const D_MLPC_USERPARAM_OTL_HOF = 4;
const MLPC_USERPARAM_OPEN_TIME_LONG_MIN = 1;
const MLPC_USERPARAM_OPEN_TIME_LONG_MAX = 60;
const D_MLPC_USERPARAM_PC1_HOF = 5;
const D_MLPC_USERPARAM_PC2_HOF = 6;

const D_MLPC_PROPARAM_WR_01_HOF = 0;
const D_MLPC_PROPARAM_WR_00_HOF = 1;
const D_MLPC_PROPARAM_EW_HOF = 2;
const D_MLPC_PROPARAM_NOS_HOF = 3;
const D_MLPC_PROPARAM_NCS_HOF = 4;
const D_MLPC_PROPARAM_NOT_HOF = 5;
const D_MLPC_PROPARAM_NCT_HOF = 6;
const D_MLPC_PROPARAM_BOP_HOF = 7;
const D_MLPC_PROPARAM_ODS_HOF = 8;
const D_MLPC_PROPARAM_NOI_HOF = 9;
const D_MLPC_PROPARAM_NCI_HOF = 10;
const D_MLPC_PROPARAM_PC1_HOF = 11;
const D_MLPC_PROPARAM_PC2_HOF = 12;


// Bluetooth UUIDs
const SHDO_NAME_CHARACTERISTIC = 'e36d5943-cc43-4d59-89ed-bcd58a70d85d';

const SHDO_SERVICE = 'dc06d52e-6ee8-471e-a5fd-0f40674a061d';
const SHDO_VERSION_CHARACTERISTIC = '175d6bc8-5840-4037-95da-a778395a036c';
const SHDO_USERDATESCYCLES_CHARACTERISTIC = '02e9b750-65dc-48c5-a269-78afe8528b71';
const SHDO_COMMAND_CHARACTERISTIC = 'd5ff2020-f80b-4b61-a3d4-ce0e0e75360e';
const SHDO_MOTORSTATE_CHARACTERISTIC = 'e56b24a5-3309-487e-9aa6-079cd32270ae';
const SHDO_PROMAINTENANCE_CHARACTERISTIC = '90a9b170-c180-4af6-8ca0-263170e8a315';


const MLPC_SERVICE = '978ae765-664c-45d8-9157-3b9031e6478e';
const MLPC_USERPARAM_CHARACTERISTIC = '7c7679a6-5a0d-4cbd-8cbe-93b6d6b4b80f';
const MLPC_PROPARAM_CHARACTERISTIC = '15e9eef3-939b-4e66-baf9-772d8bd18c41';
// const MLPC_VERIFPARAM_CHARACTERISTIC = 'cc942243-7656-441f-880c-4617eeb8bacc';
const MLPC_PROPARAMALL_CHARACTERISTIC = 'cc942243-7656-441f-880c-4617eeb8bacc';
const NAME_WRITE_TIMEOUT_MS = 15000;
const NAME_WRITE_PRE_DELAY_MS = 200;
const NAME_WRITE_COOLDOWN_MS = 1800;
const NAME_WRITE_MAX_LENGTH = 15;
const NAME_ALLOWED_PATTERN = /^[A-Za-z0-9 -]*$/;
const MAINTENANCE_PASSWORD_OLD = 'MovMaint';
const MAINTENANCE_PASSWORD_ALT = 'service';
const EXPERT_PASSWORD_ALT      = 'expert';
const EXPERT_PASSWORD_OLD      = 'WidoorSAV';


@IonicPage({
  name: 'MoventivPage',
  priority: 'high'
})
@Component({
  selector: 'page-moventiv',
  templateUrl: 'moventiv.html'
})

export class MoventivPage implements OnInit, OnDestroy {
  private TAG = 'MoventivPage';
  private logger: LoggerService = new LoggerService();
  @ViewChild(Content) content!: Content;
  formName!: FormGroup;
  formPassword!: FormGroup;
  userConfig: { mlpcName: string } = { mlpcName: '' };

  devices: any[] = [];
  peripheral: any = {};
  power!: boolean;
  states!: string;
  statesColor!: string;
  periphCommand!: number;
  periphCommandAff!: number;
  periphCommandDynAff!: number;
  shutterPosition!: number;
  shutterPositionAff!: number;
  currentProductType: DetectedProductType = 'unknown'; // Différenciation Widoor/Moventiv/Garline centralisée

  userRangeWeight!: number;
  userRangeWeightBot!: number;
  userRangeWeightUp!: number;
  lock!: number;
  lockOpen!: number;
  lockClose!: number;

  animRead!: string;
  hideMenu!: boolean;
  statusMessage!: string;
  validation_messages!: any;
  //translation var strings

  userPassword!: string;
  todayDateArray: any = {};

  //read from BLE module

  // JDU V1.2.0 : Passage a 26 octet pour ID unique (20 avant) + ajout variable pour adresse
  rval_shDo_version: Uint8Array = new Uint8Array(26);
  rval_shDo_version_bleStack_major!: number;
  rval_shDo_version_bleStack_minor!: number;
  rval_shDo_version_bleStack_patch!: number;
  rval_shDo_version_bleStack_build!: number;
  rval_shDo_version_motAddress_0!: string;
  rval_shDo_version_motAddress_1!: string;
  rval_shDo_version_motAddress_2!: string;
  rval_shDo_version_motAddress_3!: string;
  rval_shDo_version_motAddress_4!: string;
  rval_shDo_version_motAddress_5!: string;

  rval_shdo_motorState_state!: number;
  rval_shdo_motorState_pos!: number;
  rval_shdo_motorState_mpos!: number;
  rval_shdo_motorState_rpos!: number;
  rval_shdo_motorState_error!: number;
  rval_shdo_motorState_switchs!: number;
  rval_shdo_motorState_switch_7!: boolean;
  rval_shdo_motorState_switch_6!: boolean;
  rval_shdo_motorState_switch_5!: boolean;
  rval_shdo_motorState_switch_PushAGo!: boolean;
  rval_shdo_motorState_switch_BLE!: boolean;
  rval_shdo_motorState_switch_autoManu!: boolean;
  rval_shdo_motorState_switch_direction!: boolean;
  rval_shdo_motorState_switch_pairing!: boolean;

  rval_shDo_userDatesCycles: Uint8Array = new Uint8Array(10);
  rval_shdo_userStates_01!: number;
  rval_mlpc_userStates: Uint8Array = new Uint8Array(10);
  rval_shDo_userDatesCycles_totCyc!: number;
  rval_shDo_userDatesCycles_maintCyc!: number;

  rval_mlpc_userparam_all: Uint8Array = new Uint8Array(10);
  rval_mlpc_proParamAll: Uint8Array = new Uint8Array(10);
  rval_shDo_proMaintenance: Uint8Array = new Uint8Array(10);

  rval_shDo_proMaintenance_NbInit!: number;
  rval_shDo_proMaintenance_NbCyclesSinceInit!: number;
  rval_shDo_proMaintenance_NbObsDetect!: number;
  rval_shDo_proMaintenance_NbWrongStopOpen!: number;
  rval_shDo_proMaintenance_NbWrongStopClose!: number;
  rval_shDo_proMaintenance_NbOverHeatingMotor!: number;
  rval_shDo_proMaintenance_NbLearningCycle!: number;
  rval_shDo_proMaintenance_NbErrorEncoder!: number;
  rval_shDo_proMaintenance_NbErrorMotor!: number;


  rval_mlpc_userParam_speedOpenTune!: number;
  rval_mlpc_userParam_speedCloseTune!: number;
  rval_mlpc_userParam_openTimeShort!: number;
  rval_mlpc_userParam_openTimeLong!: number;
  rval_mlpc_userParam_periphs1!: number;
  rval_mlpc_userParam_periphs2!: number;

  rval_mlpc_proParam_weightRangeBot!: number;
  rval_mlpc_proParam_weightRangeUp!: number;
  rval_mlpc_proParam_exactWeight!: number;
  rval_mlpc_proParam_nearOpenSpeed!: number;
  rval_mlpc_proParam_nearCloseSpeed!: number;
  rval_mlpc_proParam_nearOpenTorque!: number;
  rval_mlpc_proParam_brakingOpenPower!: number;
  rval_mlpc_proParam_nearCloseTorque!: number;
  rval_mlpc_proParam_obstacleSensibility!: number;
  rval_mlpc_proParam_nearOpenProportionnal!: number;
  rval_mlpc_proParam_nearCloseProportionnal!: number;
  rval_mlpc_proParam_nearOpenIntegral!: number;
  rval_mlpc_proParam_nearCloseIntegral!: number;
  rval_mlpc_proParam_periphs1!: number;
  rval_mlpc_proParam_periphs2!: number;
  rval_mlpc_proParam_periphs1_butOrRadar1!: boolean;
  rval_mlpc_proParam_periphs1_butOrRadar2!: boolean;
  rval_mlpc_proParam_periphs1_forceTest1!: boolean;
  rval_mlpc_proParam_periphs1_forceTest2!: boolean;
  rval_mlpc_proParam_periphs1_forceLock!: boolean;

  rval_mlpc_periphCommandLedStripStatic!: boolean;
  rval_mlpc_periphCommandLedStripDynamic!: boolean;
  rval_mlpc_periphCommandLight1!: boolean;
  rval_mlpc_periphCommandLight2!: boolean;
  rval_mlpc_periphCommandRGBIndic!: boolean;

  rval_mlpc_verifParam_weightRangeBot!: number;
  rval_mlpc_verifParam_weightRangeUp!: number;
  rval_mlpc_verifParam_exactWeight!: number;


  //a replacer :
  checkingWeightLoading: any = {};
  passwordValid: boolean = false;
  checkParamWeightRange!: boolean;
  passwordString: string = 'password';
  //hide/show varaibles
  isVisibleTabSet!: any;
  isVisibleTabInfo!: any;
  isActifVibrate!: any;

  device: any = {};
  //localisation
  localisation!: string;
  stringLoc: string = '';
  private currentLocationSuffix: string = '';
  private locationSuffixes: string[] = ['#CHA', '#ENT', '#SAL', '#CUI', '#SAM', '#SDB', '#WCS', '#GAR', '#SLL', '#SDJ'];

  //logic connection
  loading: any = {};
  promptReading: any = {};
  peripheralNameAff!: any;
  isNameWriteInProgress: boolean = false;
  isBleBusy: boolean = false;
  isBleConnectionUnstable: boolean = false;
  retry: boolean = false;
  retryConnection: number = 6;
  menuType!: string;
  paramSubmenuType!: string;
  activeSliderKey: string | null = null;
  openedPrecisionSliderKey: string | null = null;
  private readonly SLIDER_AUTO_LOCK_DELAY_MS = 3000;
  private sliderAutoLockTimeout: any = null;
  private readonly SLIDER_BUTTON_WRITE_DELAY_MS = 400;
  private sliderWriteTimeouts: { [key: string]: any } = {};
  private sliderCommittedValues: { [key: string]: number } = {};
  private sliderInteractionVersions: { [key: string]: number } = {};
  private pauseSubscription: Subscription | null = null;
  private resumeSubscription: Subscription | null = null;
  private motorStateSubscription: Subscription | null = null;
  private verifParamSubscription: Subscription | null = null;


  dispOptionalCom_MO!: boolean;
  dispOptionalCom_LC!: boolean;
  dispOptionalCom_LLB!: boolean;

  //date maintenance
  todayDate!: string;
  todayDateUint8Array!: Uint8Array;

  constructor(public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    public navParams: NavParams,
    private randble: RandBLE,
    private alertCtrl: AlertController,
    private ngZone: NgZone,
    private storage: Storage,
    public formBuilder: FormBuilder,
    private popoverCtrl: PopoverController,
    private platform: Platform,
    private translate: TranslateService,
    private toastCtrl: ToastController,
    public bleConnectService: BleconnectserviceProvider,

  ) {

    this.platform.ready().then(() => {
      this.pauseSubscription = this.platform.pause.subscribe(() => {
        this.logger.debug(this.TAG, '****UserdashboardPage PAUSED****');
      });
      this.resumeSubscription = this.platform.resume.subscribe(() => {
        this.logger.debug(this.TAG, '****UserdashboardPage RESUMED****');
      });
    });
    //cosmetic : loader
    //this.presentLoadingDefault();
    this.menuType = 'com';
    this.currentProductType = this.resolveInitialProductType();
    this.logger.debug(this.TAG, 'Produit détecté : ' + this.currentProductType);
    this.logProductDisplayState('constructor');
    this.paramSubmenuType = 'basic';
    //connection  
    

    //manage stored boolean for displaying/hide
    this.storage.get('StoredIsVisibleTabInfo').then((val) => {
      this.isVisibleTabInfo = JSON.parse(val);
    });
    this.storage.get('StoredIsVisibleTabSettings').then((val) => {
      this.isVisibleTabSet = JSON.parse(val);
    });
    this.storage.get('StoredIsActiveVibrate').then((val) => {
      this.isActifVibrate = JSON.parse(val);
    });


    var dispOptionalCom = ['dispOptionalCom_MO', 'dispOptionalCom_LC', 'dispOptionalCom_LLB'];
    if (dispOptionalCom.indexOf('dispOptionalCom_MO'))
      this.dispOptionalCom_MO = true;
    if (dispOptionalCom.indexOf('dispOptionalCom_LC'))
      this.dispOptionalCom_LC = true;
    if (dispOptionalCom.indexOf('dispOptionalCom_LLB'))
      this.dispOptionalCom_LLB = true;
  }


  private resolveInitialProductType(): DetectedProductType {
    const navDevice = this.navParams.get('device') || this.navParams.get('peripheral');
    const navDemoProductId = this.navParams.get('demoProductId');

    if (this.isDemoCandidate(navDevice) || navDemoProductId) {
      const demoProductType = getDemoProductTypeFromConfigId(
        navDemoProductId ||
        (navDevice && (navDevice.demoProductId || navDevice.productConfigId || navDevice.demoProductType || navDevice.productType))
      );

      if (demoProductType !== 'unknown') {
        return demoProductType;
      }
    }

    const productTypeFromNavigation = normalizeProductType(this.navParams.get('productType'));
    if (productTypeFromNavigation !== 'unknown') {
      return productTypeFromNavigation;
    }

    const productTypeFromDevice = normalizeProductType(
      navDevice && (navDevice.detectedProductType || navDevice.demoProductType || navDevice.productType)
    );
    if (productTypeFromDevice !== 'unknown') {
      return productTypeFromDevice;
    }

    return 'moventiv60';
  }

  private isDemoCandidate(device: any): boolean {
    return !!(device && (device.isDemo === true || device.isDemo === "true"));
  }

  private logProductDisplayState(context: string): void {
    const productTypeByte = this.rval_shDo_version && this.rval_shDo_version.length > D_SHDO_VERSION_MOTID_HOF
      ? this.rval_shDo_version[D_SHDO_VERSION_MOTID_HOF]
      : undefined;

    this.logger.debug(this.TAG, '[ProductDetection] Moventiv display state', {
      context: context,
      bluetoothName: this.getBluetoothNameForDetection(),
      currentProductType: this.currentProductType,
      isGarline: this.isGarline,
      isMoventiv: this.isMoventiv,
      versionWordLength: this.rval_shDo_version ? this.rval_shDo_version.length : 0,
      versionWordHex: versionWordBytesToHex(this.rval_shDo_version),
      productTypeByte: productTypeByte,
      productTypeByteType: typeof productTypeByte
    });
  }

  get displayProductName(): string {
    return getProductDisplayName(this.currentProductType);
  }

  get isGarline(): boolean {
    return isGarlineProductType(this.currentProductType);
  }

  get isMoventiv(): boolean {
    return isMoventivProductType(this.currentProductType);
  }

  get maxWeightLabel(): string {
    if (this.currentProductType === 'moventiv60') {
      return '60 kg';
    }
    if (this.currentProductType === 'moventiv80') {
      return '80 kg';
    }
    if (this.currentProductType === 'garline') {
      return '140 kg';
    }
    return 'inconnu kg';
  }

  private updateDetectedProductTypeFromVersion(versionWordBytes: Uint8Array): void {
    const bluetoothName = this.getBluetoothNameForDetection();
    const detection = detectProductType(bluetoothName, versionWordBytes);
    const productTypeByte = versionWordBytes && versionWordBytes.length > D_SHDO_VERSION_MOTID_HOF
      ? versionWordBytes[D_SHDO_VERSION_MOTID_HOF]
      : undefined;

    const logDetails = {
      bluetoothName: bluetoothName,
      versionWordLength: versionWordBytes ? versionWordBytes.length : 0,
      versionWordHex: versionWordBytesToHex(versionWordBytes),
      productTypeByte: productTypeByte,
      productTypeByteType: typeof productTypeByte,
      normalizedProductTypeByte: detection.productTypeByte,
      detectedProductType: detection.productType,
      detectedProductLabel: productTypeLabel(detection.productType),
      currentProductType: this.currentProductType,
      currentIsGarline: this.isGarline,
      detectedIsGarline: isGarlineProductType(detection.productType),
      reason: detection.reason
    };

    this.logger.debug(this.TAG, '[ProductDetection] Version word diagnostics on MoventivPage', logDetails);

    if (detection.productType === 'widoor') {
      this.logger.warn(this.TAG, 'Widoor detected while on MoventivPage', logDetails);
      return;
    }

    if (detection.productType === 'unknown') {
      this.logger.warn(this.TAG, 'Product type detection from version word is unknown', logDetails);
      return;
    }

    this.currentProductType = detection.productType;
    this.logger.info(this.TAG, 'Product type updated from version word', logDetails);
    this.logProductDisplayState('afterVersionWordDetection');
  }

  private getBluetoothNameForDetection(): string {
    return String(
      this.navParams.get('displayName') ||
      (this.peripheral ? (this.peripheral.customName || this.peripheral.name || this.peripheral.localName) : '') ||
      ''
    );
  }


  toggleSliderPrecision(key: string, event?: Event): void {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }

    if (!key || !this.isSliderUnlocked(key)) {
      return;
    }

    if (this.openedPrecisionSliderKey === key) {
      this.openedPrecisionSliderKey = null;
    } else {
      this.openedPrecisionSliderKey = key;
    }
  }

  isSliderPrecisionOpen(key: string): boolean {
    return this.openedPrecisionSliderKey === key;
  }

  isSliderUnlocked(key: string): boolean {
    return this.activeSliderKey === key;
  }

  toggleSliderLock(key: string, event?: Event): void {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }

    if (!key) {
      return;
    }

    if (this.activeSliderKey === key) {
      this.lockSlider(key);
      return;
    }

    if (this.activeSliderKey) {
      this.flushPendingSliderWrite(this.activeSliderKey);
    }

    this.clearSliderAutoLockTimer();
    this.activeSliderKey = key;
    this.openedPrecisionSliderKey = null;
    this.bumpSliderInteractionVersion(key);
    this.markSliderCommittedValue(key);
  }

  lockSlider(key?: string): void {
    if (!key || this.activeSliderKey === key) {
      this.flushPendingSliderWrite(key || this.activeSliderKey || '');
    }

    if (!key || this.activeSliderKey === key) {
      this.activeSliderKey = null;
      this.clearSliderAutoLockTimer();
    }

    if (!key || this.openedPrecisionSliderKey === key) {
      this.openedPrecisionSliderKey = null;
    }
  }

  resetSliderAutoLockTimer(key: string): void {
    if (!key || this.activeSliderKey !== key) {
      return;
    }

    this.clearSliderAutoLockTimer();
    this.sliderAutoLockTimeout = setTimeout(() => {
      this.ngZone.run(() => {
        if (this.activeSliderKey === key) {
          this.lockSlider(key);
        }
      });
    }, this.SLIDER_AUTO_LOCK_DELAY_MS);
  }

  private clearSliderAutoLockTimer(): void {
    if (this.sliderAutoLockTimeout) {
      clearTimeout(this.sliderAutoLockTimeout);
      this.sliderAutoLockTimeout = null;
    }
  }

  onSliderReleased(sliderKey: string): void {
    if (!this.isSliderUnlocked(sliderKey)) {
      return;
    }

    const interactionVersion = this.bumpSliderInteractionVersion(sliderKey);
    this.clearSliderButtonWriteTimer(sliderKey);
    this.writeSliderValue(sliderKey, interactionVersion);
  }

  onSliderInteractionStarted(sliderKey: string): void {
    if (!this.isSliderUnlocked(sliderKey)) {
      return;
    }

    this.bumpSliderInteractionVersion(sliderKey);
    this.clearSliderAutoLockTimer();
    this.clearSliderButtonWriteTimer(sliderKey);
  }

  scheduleSliderButtonWrite(sliderKey: string): void {
    if (!this.isSliderUnlocked(sliderKey)) {
      return;
    }

    const interactionVersion = this.bumpSliderInteractionVersion(sliderKey);
    this.clearSliderAutoLockTimer();
    this.clearSliderButtonWriteTimer(sliderKey);
    this.sliderWriteTimeouts[sliderKey] = setTimeout(() => {
      this.sliderWriteTimeouts[sliderKey] = null;
      this.writeSliderValue(sliderKey, interactionVersion);
    }, this.SLIDER_BUTTON_WRITE_DELAY_MS);
  }

  stopSliderButtonPointerEvent(event?: Event): void {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
  }

  onSliderIncrementClick(event: Event, sliderKey: string): void {
    this.handleSliderButtonClick(event, sliderKey, true);
  }

  onSliderDecrementClick(event: Event, sliderKey: string): void {
    this.handleSliderButtonClick(event, sliderKey, false);
  }

  private handleSliderButtonClick(event: Event, sliderKey: string, increment: boolean): void {
    if (event) {
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (event.stopPropagation) {
        event.stopPropagation();
      }
    }

    if (!this.isSliderUnlocked(sliderKey)) {
      return;
    }

    const stepAction = this.getSliderStepAction(sliderKey, increment);
    if (!stepAction) {
      return;
    }

    stepAction();
    this.scheduleSliderButtonWrite(sliderKey);
  }

  private writeSliderValue(sliderKey: string, interactionVersion?: number): Promise<any> {
    if (!this.isSliderUnlocked(sliderKey)) {
      return Promise.resolve(null);
    }

    const writeAction = this.getSliderWriteAction(sliderKey);
    if (!writeAction) {
      return Promise.resolve(null);
    }

    this.clearSliderAutoLockTimer();

    const valueToWrite = this.getSliderCurrentValue(sliderKey);
    const writeInteractionVersion = interactionVersion || this.getSliderInteractionVersion(sliderKey);
    if (this.sliderCommittedValues[sliderKey] === valueToWrite) {
      this.resetSliderAutoLockTimerIfCurrent(sliderKey, writeInteractionVersion);
      return Promise.resolve(null);
    }

    try {
      return Promise.resolve(writeAction())
        .then((returnObj) => {
          if (returnObj) {
            this.sliderCommittedValues[sliderKey] = valueToWrite;
          }
          return returnObj;
        })
        .catch((error) => {
          this.logger.error(this.TAG, 'Erreur ecriture slider', { sliderKey: sliderKey, error: error });
          return null;
        })
        .then((returnObj) => {
          this.resetSliderAutoLockTimerIfCurrent(sliderKey, writeInteractionVersion);
          return returnObj;
        });
    } catch (error) {
      this.logger.error(this.TAG, 'Erreur ecriture slider', { sliderKey: sliderKey, error: error });
      this.resetSliderAutoLockTimerIfCurrent(sliderKey, writeInteractionVersion);
      return Promise.resolve(null);
    }
  }

  private getSliderWriteAction(sliderKey: string): (() => Promise<any>) | null {
    switch (sliderKey) {
      case 'openSpeed':
        return () => this.setOpenSpeedTune();
      case 'closeSpeed':
        return () => this.setCloseSpeedTune();
      case 'shortTiming':
        return () => this.setShortTiming();
      case 'longTiming':
        return () => this.setLongTiming();
      case 'nearOpenSpeed':
        return () => this.setNearOpenSpeed();
      case 'nearCloseSpeed':
        return () => this.setNearCloseSpeed();
      case 'nearCloseTorque':
        return () => this.setNearCloseTorque();
      case 'nearOpenTorque':
        return () => this.setNearOpenTorque();
      case 'brakingOpenPower':
        return () => this.setBrakingOpenPower();
      case 'obstacleSensibility':
        return () => this.setObstacleSensibility();
      default:
        return null;
    }
  }

  private getSliderStepAction(sliderKey: string, increment: boolean): (() => void) | null {
    switch (sliderKey) {
      case 'openSpeed':
        return increment ? () => this.openSpeedTuneInc() : () => this.openSpeedTuneDec();
      case 'closeSpeed':
        return increment ? () => this.closeSpeedTuneInc() : () => this.closeSpeedTuneDec();
      case 'shortTiming':
        return increment ? () => this.shortTimingInc() : () => this.shortTimingDec();
      case 'longTiming':
        return increment ? () => this.longTimingInc() : () => this.longTimingDec();
      case 'nearOpenSpeed':
        return increment ? () => this.NearOpenSpeedInc() : () => this.NearOpenSpeedDec();
      case 'nearCloseSpeed':
        return increment ? () => this.NearCloseSpeedInc() : () => this.NearCloseSpeedDec();
      case 'nearCloseTorque':
        return increment ? () => this.NearCloseTorqueInc() : () => this.NearCloseTorqueDec();
      case 'nearOpenTorque':
        return increment ? () => this.NearOpenTorqueInc() : () => this.NearOpenTorqueDec();
      case 'brakingOpenPower':
        return increment ? () => this.BrakingPowerInc() : () => this.BrakingPowerDec();
      case 'obstacleSensibility':
        return increment ? () => this.ObstacleSensiInc() : () => this.ObstacleSensiDec();
      default:
        return null;
    }
  }

  private getSliderCurrentValue(sliderKey: string): number {
    switch (sliderKey) {
      case 'openSpeed':
        return Number(this.rval_mlpc_userParam_speedOpenTune);
      case 'closeSpeed':
        return Number(this.rval_mlpc_userParam_speedCloseTune);
      case 'shortTiming':
        return Number(this.rval_mlpc_userParam_openTimeShort);
      case 'longTiming':
        return Number(this.rval_mlpc_userParam_openTimeLong);
      case 'nearOpenSpeed':
        return Number(this.rval_mlpc_proParam_nearOpenSpeed);
      case 'nearCloseSpeed':
        return Number(this.rval_mlpc_proParam_nearCloseSpeed);
      case 'nearCloseTorque':
        return Number(this.rval_mlpc_proParam_nearCloseTorque);
      case 'nearOpenTorque':
        return Number(this.rval_mlpc_proParam_nearOpenTorque);
      case 'brakingOpenPower':
        return Number(this.rval_mlpc_proParam_brakingOpenPower);
      case 'obstacleSensibility':
        return Number(this.rval_mlpc_proParam_obstacleSensibility);
      default:
        return NaN;
    }
  }

  private markSliderCommittedValue(sliderKey: string): void {
    const currentValue = this.getSliderCurrentValue(sliderKey);
    if (!isNaN(currentValue)) {
      this.sliderCommittedValues[sliderKey] = currentValue;
    }
  }

  private bumpSliderInteractionVersion(sliderKey: string): number {
    const nextVersion = this.getSliderInteractionVersion(sliderKey) + 1;
    this.sliderInteractionVersions[sliderKey] = nextVersion;
    return nextVersion;
  }

  private getSliderInteractionVersion(sliderKey: string): number {
    return this.sliderInteractionVersions[sliderKey] || 0;
  }

  private resetSliderAutoLockTimerIfCurrent(sliderKey: string, interactionVersion: number): void {
    if (this.getSliderInteractionVersion(sliderKey) === interactionVersion) {
      this.resetSliderAutoLockTimer(sliderKey);
    }
  }

  private clearSliderButtonWriteTimer(sliderKey: string): void {
    if (this.sliderWriteTimeouts[sliderKey]) {
      clearTimeout(this.sliderWriteTimeouts[sliderKey]);
      this.sliderWriteTimeouts[sliderKey] = null;
    }
  }

  private clearAllSliderButtonWriteTimers(): void {
    Object.keys(this.sliderWriteTimeouts).forEach((sliderKey) => {
      this.clearSliderButtonWriteTimer(sliderKey);
    });
  }

  private flushPendingSliderWrite(sliderKey: string): void {
    if (!sliderKey || !this.sliderWriteTimeouts[sliderKey]) {
      return;
    }

    this.clearSliderButtonWriteTimer(sliderKey);
    const interactionVersion = this.bumpSliderInteractionVersion(sliderKey);
    this.writeSliderValue(sliderKey, interactionVersion);
  }

  private flushAllPendingSliderWrites(): void {
    Object.keys(this.sliderWriteTimeouts).forEach((sliderKey) => {
      this.flushPendingSliderWrite(sliderKey);
    });
  }



  ionViewDidEnter() {
    this.logger.debug(this.TAG, '[Moventiv] ionViewDidEnter');

    // disable swipe back button
    this.navCtrl.swipeBackEnabled = false;

    this.retryConnection = 8;

    // Récupération du device dès l'entrée de page
    const navDevice = this.navParams.get('device')
      || this.navParams.get('peripheral')
      || (this.bleConnectService && this.bleConnectService.getConnectedPeripheral
          ? this.bleConnectService.getConnectedPeripheral()
          : null);

    if (navDevice) {

      // Certains plugins utilisent "id" au lieu de "address"
      if (!navDevice.address && navDevice.id) {
        navDevice.address = navDevice.id;
      }

      this.device = navDevice;
      this.peripheral = navDevice; 
      this.logger.debug(this.TAG, '[Moventiv] Peripheral set:', this.peripheral.address);

    } else {
      this.logger.error(this.TAG, '[Moventiv] Aucun device trouvé dans navParams/service');
    }

    this.logProductDisplayState('ionViewDidEnter');

    if (this.bleConnectService.getNeedConnect()) {
      this.bleConnectService.setNeedConnect(false);
      this.presentLoadingDefault();
      this.bleConnect();
    }
  }

  ionViewWillEnter() {
    this.logger.debug(this.TAG, '[Moventiv] ionViewWillEnter');
    this.localisation = '';

    //  si peripheral perdu entre les pages, on le restaure
    if (!this.peripheral || !this.peripheral.address) {
      const navDevice = this.navParams.get('device')
        || this.navParams.get('peripheral')
        || (this.bleConnectService && this.bleConnectService.getConnectedPeripheral
            ? this.bleConnectService.getConnectedPeripheral()
            : null);
      if (navDevice) {
        if (!navDevice.address && navDevice.id) {
          navDevice.address = navDevice.id;
        }
        this.device = navDevice;
        this.peripheral = navDevice;
        this.logger.debug(this.TAG, '[Moventiv] Peripheral restored:', this.peripheral.address);
      } else {
        this.logger.error(this.TAG, '[Moventiv] Impossible de restaurer le peripheral');
      }
    }
    // manage stored boolean for displaying/hide
    this.storage.get('StoredIsVisibleTabInfo').then((val) => {
      this.isVisibleTabInfo = JSON.parse(val);
    });
    this.storage.get('StoredIsVisibleTabSettings').then((val) => {
      this.isVisibleTabSet = JSON.parse(val);
    });
    this.storage.get('StoredIsActiveVibrate').then((val) => {
      this.isActifVibrate = JSON.parse(val);
    });
    this.todayDate = moment().format('DD-MM-YYYY');
    this.todayDateArray = moment().toArray(); //[year, month, day, hour, minute, second, millisecond]

    this.logger.debug(this.TAG, 'todayArray' + this.todayDateArray);
    this.logger.debug(this.TAG, 'todayArrayYear' + this.todayDateArray[0]);

    this.todayDateArray[0] = this.todayDateArray[0] - 2000;
    this.todayDateUint8Array = this.todayDateArray;

    this.logger.debug(this.TAG, 'todayArrayYearArray' + this.todayDateUint8Array[0]);

    this.peripheralNameAff =
    this.navParams.get('displayName') || (this.peripheral ? (this.peripheral.customName || this.peripheral.name) : '') || '';
    this.syncNameInputFromDisplayName();
  }


  ngOnDestroy() {
    this.clearAllSliderButtonWriteTimers();
    this.clearSliderAutoLockTimer();
    this.pauseSubscription?.unsubscribe();
    this.resumeSubscription?.unsubscribe();
    this.motorStateSubscription?.unsubscribe();
    this.verifParamSubscription?.unsubscribe();
  }

  // Disconnect peripheral when leaving the page
  ionViewWillLeave() {
    this.flushAllPendingSliderWrites();
    this.clearAllSliderButtonWriteTimers();
    this.clearSliderAutoLockTimer();
    this.bleConnectService.setNeedConnect(false);
    this.navCtrl.swipeBackEnabled = true;


  }

  ionViewWillUnload() {
    this.pauseSubscription?.unsubscribe();
    this.resumeSubscription?.unsubscribe();
    this.motorStateSubscription?.unsubscribe();
    this.verifParamSubscription?.unsubscribe();
  }

  //***********************************************************************************************************************************************/


  resizeContent() {

    this.content.resize();

  }


  bleConnect() {
    this.bleConnectService.setConnectionStatus("unknown");
    let device = this.navParams.get('device');

    if (!device || !device.address) {
      this.logger.error(this.TAG, "No device address found in navParams");
      return;
    }

    if (device.isDemo !== "true") {
      this.bleConnectService.setConnectionStatus("connecting");

      if (this.retryConnection > 0) {
        this.retryConnection--;
        this.logger.debug(this.TAG, 'Reconnection try remaining:', this.retryConnection);

        this.randble.stopScan().catch((error) => {
          this.logger.warn(this.TAG, 'Arret scan ignore avant reconnexion Moventiv', error);
        })
          .then(() => this.randble.close({ address: device.address }))
          .then(() => new Promise(r => setTimeout(r, 500))) 
          .then(() => {
            this.randble.connect({ address: device.address }).subscribe(
              (peripheral: any) => {
                if (peripheral.status === 'connected') {
                  this.onConnected(peripheral);
                }
              },
              (_err) => {
                const attempt = 6 - this.retryConnection;
                const delay = Math.min(500 * Math.pow(2, attempt), 16000);
                this.logger.debug(this.TAG, `[BLE] Connection error, retrying in ${delay}ms (attempt ${attempt})`);
                setTimeout(() => this.bleConnect(), delay);
              }
            );
          })
          .catch((error) => {
            const attempt = 6 - this.retryConnection;
            const delay = Math.min(500 * Math.pow(2, attempt), 16000);
            this.logger.warn(this.TAG, `[BLE] Reconnexion Moventiv impossible, retry in ${delay}ms`, error);
            setTimeout(() => this.bleConnect(), delay);
          });
      } else {
        this.dismissLoading('bleConnect retry exhausted').then(() => {
          this.goToScanPage('bleConnect retry exhausted');
        });
      }
    } else {
      this.addDemoValues();
    }
  }


  bleConnectClose() {
    this.randble.close({ address: this.peripheral.address }).then(
      (conStates) => {
        this.logger.debug(this.TAG, 'Close' + conStates.status);
      },
      () => {
        this.logger.debug(this.TAG, 'Close connection error');
      }
    )
  }

  errorOnConnection(peripheral: any) {
    this.peripheral = peripheral;
  }

  onConnected(peripheral: any) {
    this.logger.debug(this.TAG, '[STEP 1] Connected to hardware');
    this.isBleConnectionUnstable = false;
    this.isBleBusy = false;
    this.peripheral = this.normalizeBleDevice(Object.assign(this.peripheral || {}, peripheral || {}));
    this.device = this.normalizeBleDevice(Object.assign(this.device || {}, this.peripheral || {}));
    this.bleConnectService.setConnectedPeripheral(this.peripheral);
    this.bleConnectService.setConnectionStatus('connected');

    const incomingName = this.navParams.get('displayName') || peripheral.customName || peripheral.name;
    if (incomingName) {
      this.peripheralNameAff = incomingName;
      this.syncNameInputFromDisplayName();
    }

    setTimeout(() => {
      this.randble.discover({ address: peripheral.address })
        .then((data) => {
          this.logger.debug(this.TAG, '[STEP 2] Discovery Success', data);
          
          if (data.services && data.services.length > 0) {
            this.onDiscovered(peripheral);
          } else {
            throw new Error("Empty services");
          }
        })
        .catch(err => {
          this.logger.error(this.TAG, '[STEP 2] Discovery Failed', err);
          this.handleConnectionError();
        });
    }, 500);
  }

  onDiscovered(_peripheral: any) {
    this.logger.debug(this.TAG, '[STEP 3] Starting Data Sync');
    this.readAll();
    
    this.dismissLoading('onDiscovered');
  }

  handleConnectionError() {
    const address = this.peripheral ? this.peripheral.address : '';
    this.dismissLoading('handleConnectionError');
    this.closePeripheralConnection(address, 'handleConnectionError');
  }

  private dismissLoading(context: string): Promise<any> {
    if (!this.loading || typeof this.loading.dismiss !== 'function') {
      return Promise.resolve();
    }

    return this.loading.dismiss().catch((error: any) => {
      const typedError: any = error;
      this.logger.warn(this.TAG, 'Fermeture du loader impossible', { context: context, error: typedError });
    });
  }

  private goToScanPage(context: string): Promise<any> {
    return this.navCtrl.push('ScanPage').catch((error) => {
      const typedError: any = error;
      this.logger.warn(this.TAG, 'Navigation vers ScanPage impossible', { context: context, error: typedError });
    });
  }

  private closePeripheralConnection(address: string, context: string): Promise<any> {
    if (!address) {
      this.logger.warn(this.TAG, 'Fermeture BLE ignoree: adresse absente', { context: context });
      return Promise.resolve();
    }

    return this.randble.close({ address: address }).catch((error) => {
      this.logger.warn(this.TAG, 'Fermeture BLE impossible', { context: context, error: error });
    });
  }


  readAll() {
    if (this.isBleActionBlocked('readAll')) {
      return;
    }

    if (!this.peripheral || !this.peripheral.address) {
      const navDevice = this.navParams.get('device') || this.bleConnectService.getConnectedPeripheral();
      if (navDevice) {
        if (!navDevice.address && navDevice.id) navDevice.address = navDevice.id;
        this.peripheral = navDevice;
      }
    }

    if (!this.peripheral || !this.peripheral.address) {
      this.logger.error(this.TAG, '[Moventiv] readAll() aborted: no peripheral.address');
      this.toastCtrl.create({
        message: 'Connexion BLE perdue : veuillez vous reconnecter.',
        duration: 2500,
        position: 'bottom'
      }).present();
      return;
    }
    this.readMotorState()
    this.readVersion();
    this.readUserDatesCycles();
    this.readProMaintenance();
    this.readUserParam();
    this.readProParam();
  }

  readMotorState() {
    if (this.isBleActionBlocked('readMotorState')) {
      return;
    }
    this.randble.read({ address: this.peripheral.address, 
                        service: SHDO_SERVICE, 
                        characteristic: SHDO_MOTORSTATE_CHARACTERISTIC 
                      }).then(
      buffer => {
        let dataStringBytes = this.randble.encodedStringToBytes(buffer.value)
        this.ngZone.run(() => {
          this.rval_shdo_motorState_state = dataStringBytes[D_SHDO_MOTORSTATE_STATE_HOF];
          var buf = Buffer.from([dataStringBytes[D_SHDO_MOTORSTATE_POSMSB_HOF], dataStringBytes[D_SHDO_MOTORSTATE_POSLSB_HOF]]);
          this.rval_shdo_motorState_pos = buf.readUIntBE(0, 2);
          var buf = Buffer.from([dataStringBytes[D_SHDO_MOTORSTATE_MPOSMSB_HOF], dataStringBytes[D_SHDO_MOTORSTATE_MPOSLSB_HOF]]);
          this.rval_shdo_motorState_mpos = buf.readUIntBE(0, 2);
          this.rval_shdo_motorState_rpos = this.rval_shdo_motorState_mpos > 0 ? (this.rval_shdo_motorState_pos / this.rval_shdo_motorState_mpos) * 100 : 0;
          this.rval_shdo_motorState_error = dataStringBytes[D_SHDO_MOTORSTATE_ERROR_HOF];
          this.rval_shdo_motorState_switchs = dataStringBytes[D_SHDO_MOTORSTATE_SWITCH_HOF];
          this.rval_shdo_motorState_switch_7 = Boolean((1 << 7) & this.rval_shdo_motorState_switchs);
          this.rval_shdo_motorState_switch_6 = Boolean((1 << 6) & this.rval_shdo_motorState_switchs);
          this.rval_shdo_motorState_switch_5 = Boolean((1 << 5) & this.rval_shdo_motorState_switchs);
          this.rval_shdo_motorState_switch_PushAGo = Boolean((1 << 4) & this.rval_shdo_motorState_switchs);
          this.rval_shdo_motorState_switch_BLE = Boolean((1 << 3) & this.rval_shdo_motorState_switchs);
          this.rval_shdo_motorState_switch_autoManu = Boolean((1 << 2) & this.rval_shdo_motorState_switchs);
          this.rval_shdo_motorState_switch_direction = Boolean(((1 << 1) & this.rval_shdo_motorState_switchs));
          this.rval_shdo_motorState_switch_pairing = Boolean((1 << 0) & this.rval_shdo_motorState_switchs);
        });
      }
    ).catch(err => { this.logger.warn(this.TAG, 'readMotorState failed', err); });
  }


  readVersion() {
    if (this.isBleActionBlocked('readVersion')) {
      return;
    }
    this.randble.read({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_VERSION_CHARACTERISTIC }).then
      (
        buffer => {
          let data_shDo_version = this.randble.encodedStringToBytes(buffer.value)
          this.ngZone.run(() => {
            this.rval_shDo_version = data_shDo_version;
            this.updateDetectedProductTypeFromVersion(data_shDo_version);

            if (data_shDo_version.length > D_SHDO_VERSION_STACK_BUILDLSB_HOF) {
              var buf = Buffer.from([data_shDo_version[D_SHDO_VERSION_STACK_MAJORMSB_HOF], data_shDo_version[D_SHDO_VERSION_STACK_MAJORLSB_HOF]]);
              this.rval_shDo_version_bleStack_major = buf.readUIntBE(0, 2);
              var buf = Buffer.from([data_shDo_version[D_SHDO_VERSION_STACK_MINORMSB_HOF], data_shDo_version[D_SHDO_VERSION_STACK_MINORLSB_HOF]]);
              this.rval_shDo_version_bleStack_minor = buf.readUIntBE(0, 2);
              var buf = Buffer.from([data_shDo_version[D_SHDO_VERSION_STACK_PATCHMSB_HOF], data_shDo_version[D_SHDO_VERSION_STACK_PATCHLSB_HOF]]);
              this.rval_shDo_version_bleStack_patch = buf.readUIntBE(0, 2);
              var buf = Buffer.from([data_shDo_version[D_SHDO_VERSION_STACK_BUILDMSB_HOF], data_shDo_version[D_SHDO_VERSION_STACK_BUILDLSB_HOF]]);
              this.rval_shDo_version_bleStack_build = buf.readUIntBE(0, 2);
            } else {
              this.logger.warn(this.TAG, 'Version word too short for BLE stack version display', {
                versionWordLength: data_shDo_version.length,
                versionWordHex: versionWordBytesToHex(data_shDo_version)
              });
            }

            //JDU V1.2.0 : conversion dec->Hex pour affichage
            if (this.rval_shDo_version.length >= 26) {
              this.rval_shDo_version_motAddress_0 = this.rval_shDo_version[20].toString(16);
              this.rval_shDo_version_motAddress_1 = this.rval_shDo_version[21].toString(16);
              this.rval_shDo_version_motAddress_2 = this.rval_shDo_version[22].toString(16);
              this.rval_shDo_version_motAddress_3 = this.rval_shDo_version[23].toString(16);
              this.rval_shDo_version_motAddress_4 = this.rval_shDo_version[24].toString(16);
              this.rval_shDo_version_motAddress_5 = this.rval_shDo_version[25].toString(16);
            } else {
              this.rval_shDo_version_motAddress_0 = '';
              this.rval_shDo_version_motAddress_1 = '';
              this.rval_shDo_version_motAddress_2 = '';
              this.rval_shDo_version_motAddress_3 = '';
              this.rval_shDo_version_motAddress_4 = '';
              this.rval_shDo_version_motAddress_5 = '';
              this.logger.warn(this.TAG, 'Version word too short for motor address display', {
                versionWordLength: this.rval_shDo_version.length,
                versionWordHex: versionWordBytesToHex(this.rval_shDo_version)
              });
            }


          });
        }
      ).catch(err => { this.logger.warn(this.TAG, 'readVersion failed', err); });
  }

  readProMaintenance() {
    if (this.isBleActionBlocked('readProMaintenance')) {
      return;
    }
    this.randble.read({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_PROMAINTENANCE_CHARACTERISTIC }).then
      (
        buffer => {
          let dataStringB = this.randble.encodedStringToBytes(buffer.value)
          this.ngZone.run(() => {
            this.rval_shDo_proMaintenance = dataStringB;
            var buf = Buffer.from([dataStringB[D_SHDO_PROMAINTENANCE_INIT_02_HOF], dataStringB[D_SHDO_PROMAINTENANCE_INIT_01_HOF], dataStringB[D_SHDO_PROMAINTENANCE_INIT_00_HOF]]);
            this.rval_shDo_proMaintenance_NbInit = buf.readUIntBE(0, 3);
            var buf = Buffer.from([dataStringB[D_SHDO_PROMAINTENANCE_CINIT_02_HOF], dataStringB[D_SHDO_PROMAINTENANCE_CINIT_01_HOF], dataStringB[D_SHDO_PROMAINTENANCE_CINIT_00_HOF]]);
            this.rval_shDo_proMaintenance_NbCyclesSinceInit = buf.readUIntBE(0, 3);
            var buf = Buffer.from([dataStringB[D_SHDO_PROMAINTENANCE_OBSDETECT_02_HOF], dataStringB[D_SHDO_PROMAINTENANCE_OBSDETECT_01_HOF], dataStringB[D_SHDO_PROMAINTENANCE_OBSDETECT_00_HOF]]);
            this.rval_shDo_proMaintenance_NbObsDetect = buf.readUIntBE(0, 3);
            var buf = Buffer.from([dataStringB[D_SHDO_PROMAINTENANCE_WSO_02_HOF], dataStringB[D_SHDO_PROMAINTENANCE_WSO_01_HOF], dataStringB[D_SHDO_PROMAINTENANCE_WSO_00_HOF]]);
            this.rval_shDo_proMaintenance_NbWrongStopOpen = buf.readUIntBE(0, 3);
            var buf = Buffer.from([dataStringB[D_SHDO_PROMAINTENANCE_WSC_02_HOF], dataStringB[D_SHDO_PROMAINTENANCE_WSC_01_HOF], dataStringB[D_SHDO_PROMAINTENANCE_WSC_00_HOF]]);
            this.rval_shDo_proMaintenance_NbWrongStopClose = buf.readUIntBE(0, 3);
            var buf = Buffer.from([dataStringB[D_SHDO_PROMAINTENANCE_OHM_HOF]]);
            this.rval_shDo_proMaintenance_NbLearningCycle = buf.readUIntBE(0, 1);
            var buf = Buffer.from([dataStringB[D_SHDO_PROMAINTENANCE_EC_HOF]]);
            this.rval_shDo_proMaintenance_NbErrorEncoder = buf.readUIntBE(0, 1);
            var buf = Buffer.from([dataStringB[D_SHDO_PROMAINTENANCE_EM_HOF]]);
            this.rval_shDo_proMaintenance_NbErrorMotor = buf.readUIntBE(0, 1);
          });
        }
      ).catch(err => { this.logger.warn(this.TAG, 'readProMaintenance failed', err); });
  }

  readUserDatesCycles() {
    if (this.isBleActionBlocked('readUserDatesCycles')) {
      return;
    }
    this.randble.read({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_USERDATESCYCLES_CHARACTERISTIC }).then(
      buffer => {
        let data_shDo_userDatesCycles = this.randble.encodedStringToBytes(buffer.value)
        this.ngZone.run(() => {
          this.rval_shDo_userDatesCycles = data_shDo_userDatesCycles;
          var buf = Buffer.from([data_shDo_userDatesCycles[D_SHDO_USERDATESCYCLESALL_TC_02_UOF], data_shDo_userDatesCycles[D_SHDO_USERDATESCYCLESALL_TC_01_UOF], data_shDo_userDatesCycles[D_SHDO_USERDATESCYCLESALL_TC_00_UOF]]);
          this.rval_shDo_userDatesCycles_totCyc = buf.readUIntBE(0, 3);
          var buf = Buffer.from([data_shDo_userDatesCycles[D_SHDO_USERDATESCYCLESALL_LMC_02_UOF], data_shDo_userDatesCycles[D_SHDO_USERDATESCYCLESALL_LMC_01_UOF], data_shDo_userDatesCycles[D_SHDO_USERDATESCYCLESALL_LMC_00_UOF]]);
          this.rval_shDo_userDatesCycles_maintCyc = buf.readUIntBE(0, 3);
        });
      }
    ).catch(err => { this.logger.warn(this.TAG, 'readUserDatesCycles failed', err); });
  }

  readUserParam() {
    if (this.isBleActionBlocked('readUserParam')) {
      return;
    }
    this.randble.read({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC }).then(
      buffer => {
        let dataBytes = this.randble.encodedStringToBytes(buffer.value)
        this.ngZone.run(() => {

          this.lock = dataBytes[D_MLPC_USERPARAM_MOC_HOF];
          if (this.lock == 0) {
            this.lockOpen = 0;
            this.lockClose = 0;
          }
          else if (this.lock == 1) {
            this.lockOpen = 1;
            this.lockClose = 0;
          }
          else if (this.lock == 2) {
            this.lockOpen = 0;
            this.lockClose = 1;
          }

          this.rval_mlpc_userParam_speedOpenTune = dataBytes[D_MLPC_USERPARAM_SOT_HOF];
          this.rval_mlpc_userParam_speedCloseTune = dataBytes[D_MLPC_USERPARAM_SCT_HOF];
          this.rval_mlpc_userParam_openTimeShort = dataBytes[D_MLPC_USERPARAM_OTS_HOF];
          this.rval_mlpc_userParam_openTimeLong = this.clampLongTiming(dataBytes[D_MLPC_USERPARAM_OTL_HOF]);
          this.rval_mlpc_userParam_periphs1 = dataBytes[D_MLPC_USERPARAM_PC1_HOF];
          this.rval_mlpc_userParam_periphs2 = dataBytes[D_MLPC_USERPARAM_PC2_HOF];


          this.rval_mlpc_periphCommandLedStripDynamic = Boolean((1 << 7) & this.rval_mlpc_userParam_periphs1);
          this.rval_mlpc_periphCommandLedStripStatic = Boolean((1 << 6) & this.rval_mlpc_userParam_periphs1);
          this.rval_mlpc_periphCommandLight1 = Boolean((1 << 5) & this.rval_mlpc_userParam_periphs1);
          this.rval_mlpc_periphCommandLight2 = Boolean((1 << 4) & this.rval_mlpc_userParam_periphs1);
          this.rval_mlpc_periphCommandRGBIndic = Boolean((1 << 3) & this.rval_mlpc_userParam_periphs1);

        });
      }
    ).catch(err => { this.logger.warn(this.TAG, 'readUserParam failed', err); });
  }

  readProParam() {
    if (this.isBleActionBlocked('readProParam')) {
      return;
    }
    this.randble.read({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC }).then
      (
        buffer => {
          let dataStringB = this.randble.encodedStringToBytes(buffer.value)
          this.ngZone.run(() => {
            this.rval_mlpc_proParam_weightRangeBot = dataStringB[D_MLPC_PROPARAM_WR_01_HOF];
            this.logger.debug(this.TAG, 'rval_mlpc_proParam_weightRangeBot' + this.rval_mlpc_proParam_weightRangeBot);

            //JDU V1.3.0 #App-09 : associe plage de poids à la valeur de la selection (pour preselection)
            if (this.rval_mlpc_proParam_weightRangeBot == 10)
            {
              this.userRangeWeight = 1;
            }
            else if (this.rval_mlpc_proParam_weightRangeBot == 20)
            {
              this.userRangeWeight = 2;
            }
            else if (this.rval_mlpc_proParam_weightRangeBot == 30)
            {
              this.userRangeWeight = 3;
            }
            else if (this.rval_mlpc_proParam_weightRangeBot == 40)
            {
              this.userRangeWeight = 4;
            }
            else if (this.rval_mlpc_proParam_weightRangeBot == 50)
            {
              this.userRangeWeight = 5;
            }
            else if (this.rval_mlpc_proParam_weightRangeBot == 60)
            {
              this.userRangeWeight = 6;
            }
            else if (this.rval_mlpc_proParam_weightRangeBot == 80)
            {
              this.userRangeWeight = 7;
            }
            else if (this.rval_mlpc_proParam_weightRangeBot == 100)
            {
              this.userRangeWeight = 8;
            }
            else if (this.rval_mlpc_proParam_weightRangeBot == 120)
            {
              this.userRangeWeight = 9;
            }

            this.rval_mlpc_proParam_weightRangeUp = dataStringB[D_MLPC_PROPARAM_WR_00_HOF];
            this.rval_mlpc_proParam_exactWeight = dataStringB[D_MLPC_PROPARAM_EW_HOF];
            this.rval_mlpc_proParam_nearOpenSpeed = dataStringB[D_MLPC_PROPARAM_NOS_HOF];
            this.logger.debug(this.TAG, 'rval_mlpc_proParam_nearOpenSpeed' + this.rval_mlpc_proParam_nearOpenSpeed)
            this.rval_mlpc_proParam_nearCloseSpeed = dataStringB[D_MLPC_PROPARAM_NCS_HOF];
            this.logger.debug(this.TAG, 'rval_mlpc_proParam_nearCloseSpeed' + this.rval_mlpc_proParam_nearCloseSpeed)
            this.rval_mlpc_proParam_brakingOpenPower = dataStringB[D_MLPC_PROPARAM_BOP_HOF];
            this.rval_mlpc_proParam_nearOpenTorque = dataStringB[D_MLPC_PROPARAM_NOT_HOF];
            this.rval_mlpc_proParam_nearCloseTorque = dataStringB[D_MLPC_PROPARAM_NCT_HOF];
            this.rval_mlpc_proParam_obstacleSensibility = dataStringB[D_MLPC_PROPARAM_ODS_HOF];
            // this.rval_mlpc_proParam_nearOpenProportionnal = dataStringB[D_MLPC_PROPARAM_NOP_HOF];
            // this.rval_mlpc_proParam_nearCloseProportionnal = dataStringB[D_MLPC_PROPARAM_NCP_HOF];
            this.rval_mlpc_proParam_nearOpenIntegral = dataStringB[D_MLPC_PROPARAM_NOI_HOF];
            this.rval_mlpc_proParam_nearCloseIntegral = dataStringB[D_MLPC_PROPARAM_NCI_HOF];
            this.rval_mlpc_proParam_periphs1 = dataStringB[D_MLPC_PROPARAM_PC1_HOF];
            this.rval_mlpc_proParam_periphs2 = dataStringB[D_MLPC_PROPARAM_PC2_HOF];
            this.rval_mlpc_proParam_periphs1_butOrRadar1 = Boolean((1 << 7) & this.rval_mlpc_proParam_periphs1);
            this.rval_mlpc_proParam_periphs1_butOrRadar2 = Boolean((1 << 6) & this.rval_mlpc_proParam_periphs1);
            this.rval_mlpc_proParam_periphs1_forceTest1 = Boolean((1 << 5) & this.rval_mlpc_proParam_periphs1);
            this.rval_mlpc_proParam_periphs1_forceTest2 = Boolean((1 << 4) & this.rval_mlpc_proParam_periphs1);
            this.rval_mlpc_proParam_periphs1_forceLock = Boolean((1 << 3) & this.rval_mlpc_proParam_periphs1);
          });
        }
      ).catch(err => { this.logger.warn(this.TAG, 'readProParam failed', err); });
  }

  subscribeMotorState() {
    this.motorStateSubscription?.unsubscribe();
    this.motorStateSubscription = this.randble.subscribe({ address: this.peripheral.address,
                             service: SHDO_SERVICE,
                             characteristic: SHDO_MOTORSTATE_CHARACTERISTIC
                            }).subscribe(
      parameter => {
        let value = parameter.value;
        this.logger.debug(this.TAG, 'Subscribed SHDO_MOTORSTATE_CHARACTERISTIC')
        if (typeof value != "undefined") {
          let dataStringBytes = this.randble.encodedStringToBytes(value);
          this.ngZone.run(() => {
            this.rval_shdo_motorState_state = dataStringBytes[D_SHDO_MOTORSTATE_STATE_HOF];
            var buf = Buffer.from([dataStringBytes[D_SHDO_MOTORSTATE_POSMSB_HOF], dataStringBytes[D_SHDO_MOTORSTATE_POSLSB_HOF]]);
            this.rval_shdo_motorState_pos = buf.readUIntBE(0, 2);
            var buf = Buffer.from([dataStringBytes[D_SHDO_MOTORSTATE_MPOSMSB_HOF], dataStringBytes[D_SHDO_MOTORSTATE_MPOSLSB_HOF]]);
            this.rval_shdo_motorState_mpos = buf.readUIntBE(0, 2);
            this.rval_shdo_motorState_rpos = this.rval_shdo_motorState_mpos > 0 ? (this.rval_shdo_motorState_pos / this.rval_shdo_motorState_mpos) * 100 : 0;
            this.rval_shdo_motorState_error = dataStringBytes[D_SHDO_MOTORSTATE_ERROR_HOF];
            this.rval_shdo_motorState_switchs = dataStringBytes[D_SHDO_MOTORSTATE_SWITCH_HOF];
            this.rval_shdo_motorState_switch_7 = Boolean((1 << 7) & this.rval_shdo_motorState_switchs);
            this.rval_shdo_motorState_switch_6 = Boolean((1 << 6) & this.rval_shdo_motorState_switchs);
            this.rval_shdo_motorState_switch_5 = Boolean((1 << 5) & this.rval_shdo_motorState_switchs);
            this.rval_shdo_motorState_switch_PushAGo = Boolean((1 << 4) & this.rval_shdo_motorState_switchs);
            this.rval_shdo_motorState_switch_BLE = Boolean((1 << 3) & this.rval_shdo_motorState_switchs);
            this.rval_shdo_motorState_switch_autoManu = Boolean((1 << 2) & this.rval_shdo_motorState_switchs);
            this.rval_shdo_motorState_switch_direction = Boolean((1 << 1) & this.rval_shdo_motorState_switchs);
            this.rval_shdo_motorState_switch_pairing = Boolean((1 << 0) & this.rval_shdo_motorState_switchs);
          });
        }
      },
      (error) => {
        this.logger.warn(this.TAG, 'Subscription etat moteur interrompue', error);
        this.dismissLoading('subscribeMotorState').then(() => {
          this.goToScanPage('subscribeMotorState');
        });
      }
    );


  }

  subscribeVerifParam() {
    this.verifParamSubscription?.unsubscribe();
    // this.randble.subscribe({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_PROPARAMALL_CHARACTERISTIC }).subscribe(
    this.verifParamSubscription = this.randble.subscribe({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC }).subscribe(
      parameter => {
        let value = parameter.value;
        this.logger.debug(this.TAG, 'Subscribed MLPC_PROPARAM_CHARACTERISTIC')
        if (typeof value != "undefined") {
          let dataBytes = this.randble.encodedStringToBytes(value);
          this.logger.debug(this.TAG, 'MLPC_VERIFPARAM WR : b0 ' + dataBytes[0] + 'b1 ' + dataBytes[1]);
          this.ngZone.run(() => {
            this.rval_mlpc_verifParam_weightRangeBot = dataBytes[0];
            this.rval_mlpc_verifParam_weightRangeUp = dataBytes[1];
            this.rval_mlpc_verifParam_exactWeight = dataBytes[2];
          });
        }
      },
      (error) => {
        this.logger.warn(this.TAG, 'Subscription verification parametres interrompue', error);
        this.dismissLoading('subscribeVerifParam').then(() => {
          this.goToScanPage('subscribeVerifParam');
        });
      }
    );
  }



  onStateChange(_buffer: ArrayBuffer) {
  }


  //  setTimings(event) {//???
  // let timingData = new Uint8Array(3);
  // timingData[0] = this.shortTiming;
  //timingData[1] = this.lockOpen;
  // timingData[2] = this.lockClose;
  //  let encodedString = this.randble.bytesToEncodedString(timingData);
  /*
    this.randble.write({address: this.peripheral.address, service: MLPC_SERVICE , characteristic:TIMING_CHARACTERISTIC, value:encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'returned timing value: ' + bytes[0]);
      }, 
    );
     */
  // }

  setShutterOpen() {
    if (this.isBleActionBlocked('setShutterOpen')) {
      return;
    }
    if ((this.device.isDemo) == "true") return;
    this.logger.debug(this.TAG, 'SetDoorOpen');
    if (this.lockClose == 1) { this.lockAlert(); }
    else if (this.lockOpen == 1) { this.retentionAlert(); }
    else {
      this.vibrate();
      let commandData = new Uint8Array(4);
      commandData[0] = 0x00;
      commandData[1] = 0x20;

      let encodedString = this.randble.bytesToEncodedString(commandData);

      this.randble.write({ address: this.peripheral.address, 
                           service: SHDO_SERVICE, 
                           characteristic: SHDO_COMMAND_CHARACTERISTIC, 
                           value: encodedString 
                          }).then(
        (returnObj) => {
          let bytes = this.randble.encodedStringToBytes(returnObj.value);
          this.logger.debug(this.TAG, 'page : ' + bytes[0] + 'setDoorOpenStime b0: ' + bytes[1] + 'b1: ' + bytes[2] + 'b2: ' + bytes[3]);
          if ((bytes[0] == commandData[0]) && (bytes[1] == commandData[1]) && (bytes[2] == commandData[2])) {
            this.logger.debug(this.TAG, 'BLE transmission OK')
          }
        },
      );
    }
  }
  

  setShutterOpenStime() {
    if (this.isBleActionBlocked('setShutterOpenStime')) {
      return;
    }
    this.logger.debug(this.TAG, 'SetDoorOpenStime');
    if (this.lockClose == 1) { this.lockAlert(); }
    else if (this.lockOpen == 1) { this.retentionAlert(); }
    else {
      this.vibrate();
      let commandData = new Uint8Array(4);
      commandData[0] = 0x00;
      commandData[1] = 0x21;

      let encodedString = this.randble.bytesToEncodedString(commandData);

      this.randble.write({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_COMMAND_CHARACTERISTIC, value: encodedString }).then(
        (returnObj) => {
          let bytes = this.randble.encodedStringToBytes(returnObj.value);
          this.logger.debug(this.TAG, 'page : ' + bytes[0] + 'setDoorOpenStime b0: ' + bytes[1] + 'b1: ' + bytes[2] + 'b2: ' + bytes[3]);
          if ((bytes[0] == commandData[0]) && (bytes[1] == commandData[1]) && (bytes[2] == commandData[2])) {
            this.logger.debug(this.TAG, 'BLE transmission OK')
          }
        },
      );
    }
  }

  setShutterOpenLtime() {
    if (this.isBleActionBlocked('setShutterOpenLtime')) {
      return;
    }
    this.logger.debug(this.TAG, 'SetDoorOpenLtime');
    if (this.lockClose == 1) { this.lockAlert(); }
    else if (this.lockOpen == 1) { this.retentionAlert(); }
    else {
      this.vibrate();
      let commandData = new Uint8Array(2);
      commandData[0] = 0x00;
      commandData[1] = 0x22;

      let encodedString = this.randble.bytesToEncodedString(commandData);

      this.randble.write({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_COMMAND_CHARACTERISTIC, value: encodedString }).then(
        (returnObj) => {
          let bytes = this.randble.encodedStringToBytes(returnObj.value);
          this.logger.debug(this.TAG, 'page : ' + bytes[0] + 'setDoorOpenStime b0: ' + bytes[1] + 'b1: ' + bytes[2] + 'b2: ' + bytes[3]);
          if ((bytes[0] == commandData[0]) && (bytes[1] == commandData[1]) && (bytes[2] == commandData[2])) {
            this.logger.debug(this.TAG, 'BLE transmission OK')
          }
        },
      );
    }
  }

  setShutterLearning() {
    if (this.isBleActionBlocked('setShutterLearning')) {
      return;
    }
    this.logger.debug(this.TAG, 'SetDoorLearning');

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x00;
    commandData[1] = 0x12;

    let encodedString = this.randble.bytesToEncodedString(commandData);


    this.randble.write({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_COMMAND_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'page : ' + bytes[0] + 'setDoorLearning: ' + bytes[1] + 'b1: ' + bytes[2] + 'b2: ' + bytes[3]);
        if ((bytes[0] == commandData[0]) && (bytes[1] == commandData[1]) && (bytes[2] == commandData[2])) {
          this.logger.debug(this.TAG, 'BLE transmission OK')
        }
      },
    );
  }

  setShdoMaintenanceDate() {
    if (this.isBleActionBlocked('setShdoMaintenanceDate')) {
      return;
    }
    this.logger.debug(this.TAG, 'setShdoMaintenanceDate');

    let commandData = new Uint8Array(5);
    commandData[0] = 2;
    commandData[1] = this.todayDateUint8Array[0];
    commandData[2] = this.todayDateUint8Array[1];
    commandData[3] = this.todayDateUint8Array[2];
    commandData[4] = this.todayDateUint8Array[3];
    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_USERDATESCYCLES_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'pageSel: ' + bytes[0] + 'setLastMaintDate YY: ' + bytes[1] + 'MM: ' + bytes[2] + 'DD: ' + bytes[3] + 'hh: ' + bytes[4]);
      },
    );
  }


  setShdoFirstDate() {
    if (this.isBleActionBlocked('setShdoFirstDate')) {
      return;
    }
    this.logger.debug(this.TAG, 'setShdoFirstDate');
    if ((this.rval_shDo_userDatesCycles[5] == 0xFF) && (this.rval_shDo_userDatesCycles[4] == 0xFF) && (this.rval_shDo_userDatesCycles[3] == 0xFF)) {
      this.logger.debug(this.TAG, 'firstUse');
      let commandData = new Uint8Array(5);  
      commandData[0] = 1;
      commandData[1] = this.todayDateUint8Array[0];
      commandData[2] = this.todayDateUint8Array[1];
      commandData[3] = this.todayDateUint8Array[2];
      commandData[4] = this.todayDateUint8Array[3];
      let encodedString = this.randble.bytesToEncodedString(commandData);

      this.randble.write({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_USERDATESCYCLES_CHARACTERISTIC, value: encodedString }).then(
        (returnObj) => {
          let bytes = this.randble.encodedStringToBytes(returnObj.value);
          this.logger.debug(this.TAG, 'pageSel: ' + bytes[0] + 'setFirstUseDate YY: ' + bytes[1] + 'MM: ' + bytes[2] + 'DD: ' + bytes[3] + 'hh: ' + bytes[4]);
        },
      );
    }
  }

  setShutterClose() {
    if (this.isBleActionBlocked('setShutterClose')) {
      return;
    }
    this.logger.debug(this.TAG, 'SetDoorClose');
    if (this.lockClose == 1) { this.lockAlert(); }
    else if (this.lockOpen == 1) { this.retentionAlert(); }
    else {
      this.vibrate();
      let commandData = new Uint8Array(2);
      commandData[0] = 0x00;// motor command
      commandData[1] = 0x30; //close 
      let encodedString = this.randble.bytesToEncodedString(commandData);

      this.randble.write({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_COMMAND_CHARACTERISTIC, value: encodedString }).then(
        (returnObj) => {
          let bytes = this.randble.encodedStringToBytes(returnObj.value);
          this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'setDoorClose b0: ' + bytes[1] + 'b1: ' + bytes[2] + 'b2: ' + bytes[3]);
        },
      );

    }
  }



  setLockClose() {
    if (this.isBleActionBlocked('setLockClose')) {
      return;
    }
    this.logger.debug(this.TAG, 'SetLockClose');

    if (this.lockClose != 0){
      this.lockConfirm();
    }

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x00;
    if (this.lock == 2) {
      this.lock = 0
      this.lockOpen = 0;
      this.lockClose = 0;
      commandData[1] = 0x00;
    }
    else {
      this.lock = 2
      this.lockOpen = 0;
      this.lockClose = 1;
      commandData[1] = 0x02;
    }

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'setLockClose b0: ' + bytes[1]);
      },
    );
  }

  //JDU : Ajout de la fenetre d'alerte si condamnation en fermeture
  lockConfirm(){
    this.translate.get(['MOVENTIV_PAGE.COMMANDS_TAB.LOCK_CONFIRM.TITLE', 'MOVENTIV_PAGE.COMMANDS_TAB.LOCK_CONFIRM.SUBTITLE', 'MOVENTIV_PAGE.COMMANDS_TAB.LOCK_CONFIRM.BUTTON_OK']).subscribe(
      res => {
        let alert = this.alertCtrl.create({
          title: res["MOVENTIV_PAGE.COMMANDS_TAB.LOCK_CONFIRM.TITLE"],
          subTitle: res["MOVENTIV_PAGE.COMMANDS_TAB.LOCK_CONFIRM.SUBTITLE"],
          buttons: [res["MOVENTIV_PAGE.COMMANDS_TAB.LOCK_CONFIRM.BUTTON_OK"]]
        });
        alert.present();
      });
  }

  setLockOpen() {
    if (this.isBleActionBlocked('setLockOpen')) {
      return;
    }
    this.logger.debug(this.TAG, 'SetLockOpen');

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x00; // PS_MO
    if (this.lock == 1) {
      this.lock = 0
      this.lockOpen = 0;
      this.lockClose = 0;
      commandData[1] = 0x00;
    }
    else {
      this.lock = 1
      this.lockOpen = 1;
      this.lockClose = 0;
      commandData[1] = 0x01;
    }

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'setLockClose b0: ' + bytes[1]);
      },
    );
  }



  setOpenSpeedTune(): Promise<any> {
    if (this.isBleActionBlocked('setOpenSpeedTune')) {
      return Promise.resolve(null);
    }
    this.logger.debug(this.TAG, 'SetSpeedOpenTune');

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x01;
    commandData[1] = this.rval_mlpc_userParam_speedOpenTune;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    return this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'SetSpeedOpenTune b0: ' + bytes[1]);
        return returnObj;
      },
    );
  }




  setCloseSpeedTune(): Promise<any> {
    if (this.isBleActionBlocked('setCloseSpeedTune')) {
      return Promise.resolve(null);
    }
    this.logger.debug(this.TAG, 'SetSpeedCloseTune');

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x02;
    commandData[1] = this.rval_mlpc_userParam_speedCloseTune;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    return this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'SetSpeedCloseTune b0: ' + bytes[1]);
        return returnObj;
      },
    );
  }


  setNearOpenSpeed(): Promise<any> {
    if (this.isBleActionBlocked('setNearOpenSpeed')) {
      return Promise.resolve(null);
    }
    this.logger.debug(this.TAG, 'setNearOpenSpeed');

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x02;
    commandData[1] = this.rval_mlpc_proParam_nearOpenSpeed;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    return this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString });
  }

  setNearCloseSpeed(): Promise<any> {
    if (this.isBleActionBlocked('setNearCloseSpeed')) {
      return Promise.resolve(null);
    }
    this.logger.debug(this.TAG, 'setNearCloseSpeed');

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x03;
    commandData[1] = this.rval_mlpc_proParam_nearCloseSpeed;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    return this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString });
  }

  setNearOpenTorque(): Promise<any> {
    if (this.isBleActionBlocked('setNearOpenTorque')) {
      return Promise.resolve(null);
    }
    this.logger.debug(this.TAG, 'setNearOpenTorque');

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x04;
    commandData[1] = this.rval_mlpc_proParam_nearOpenTorque;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    return this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString });
  }

  setBrakingOpenPower(): Promise<any> {
    if (this.isBleActionBlocked('setBrakingOpenPower')) {
      return Promise.resolve(null);
    }
    this.logger.debug(this.TAG, 'setBrakingOpenPowe');

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x06;
    commandData[1] = this.rval_mlpc_proParam_brakingOpenPower;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    return this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString });
  }

  setObstacleSensibility(): Promise<any> {
    if (this.isBleActionBlocked('setObstacleSensibility')) {
      return Promise.resolve(null);
    }
    this.logger.debug(this.TAG, 'setBrakingOpenPowe');

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x07;
    commandData[1] = this.rval_mlpc_proParam_obstacleSensibility;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    return this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString });
  }

  setNearCloseTorque(): Promise<any> {
    if (this.isBleActionBlocked('setNearCloseTorque')) {
      return Promise.resolve(null);
    }
    this.logger.debug(this.TAG, 'setNearCloseTorque');

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x05;
    commandData[1] = this.rval_mlpc_proParam_nearCloseTorque;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    return this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString });
  }




  setShortTiming(): Promise<any> {
    if (this.isBleActionBlocked('setShortTiming')) {
      return Promise.resolve(null);
    }
    this.logger.debug(this.TAG, 'SetShortTiming');

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x03;
    commandData[1] = this.rval_mlpc_userParam_openTimeShort;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    return this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'SetShortTiming b0: ' + bytes[1] + 'SetShortTiming b1: ' + bytes[2]);
        return returnObj;
      },
    );
  }

  setLongTiming(): Promise<any> {
    if (this.isBleActionBlocked('setLongTiming')) {
      return Promise.resolve(null);
    }
    this.logger.debug(this.TAG, 'SetShortTiming');

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x04;
    this.rval_mlpc_userParam_openTimeLong = this.clampLongTiming(this.rval_mlpc_userParam_openTimeLong);
    commandData[1] = this.rval_mlpc_userParam_openTimeLong;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    return this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'SetShortTiming b0: ' + bytes[1] + 'SetShortTiming b1: ' + bytes[2]);
        return returnObj;
      },
    );
  }


  setUserStaticLight() {
    if (this.isBleActionBlocked('setUserStaticLight')) {
      return;
    }
    this.logger.debug(this.TAG, 'setUserStaticLight');

    this.vibrate();
    let commandData = new Uint8Array(3);
    if (!this.rval_mlpc_periphCommandLedStripStatic) {
      commandData[0] = 0x05;
      commandData[1] = 0x06;
      commandData[2] = 0x02;
    }
    else {
      commandData[0] = 0x05;
      commandData[1] = 0x06;
      commandData[2] = 0x01;
    }

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'periph MSB set ' + bytes[1]);
      },
    );
  }

  setUserDynLight() {
    if (this.isBleActionBlocked('setUserDynLight')) {
      return;
    }
    this.logger.debug(this.TAG, 'setUserDynLight');

    this.vibrate();
    let commandData = new Uint8Array(3);
    if (!this.rval_mlpc_periphCommandLedStripDynamic) {
      commandData[0] = 0x05;
      commandData[1] = 0x07;
      commandData[2] = 0x02;
    }
    else {
      commandData[0] = 0x05;
      commandData[1] = 0x07;
      commandData[2] = 0x01;
    }

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'periph set ' + bytes[1] + 'periph set ' + bytes[2]);
      },
    );
  }

  setUserbutOrRadar1() {
    if (this.isBleActionBlocked('setUserbutOrRadar1')) {
      return;
    }
    this.logger.debug(this.TAG, 'setUserbutOrRadar1');

    this.vibrate();
    let commandData = new Uint8Array(3);
    if (!this.rval_mlpc_proParam_periphs1_butOrRadar1) {
      commandData[0] = 10;
      commandData[1] = 7;
      commandData[2] = 0x02;
    }
    else {
      commandData[0] = 10;
      commandData[1] = 7;
      commandData[2] = 0x01;
    }

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'periph nb ' + bytes[1] + 'periph set ' + bytes[2]);
      },
    );
  }

  setUserbutOrRadar2() {
    if (this.isBleActionBlocked('setUserbutOrRadar2')) {
      return;
    }
    this.logger.debug(this.TAG, 'setUserbutOrRadar2');

    this.vibrate();
    let commandData = new Uint8Array(3);
    if (!this.rval_mlpc_proParam_periphs1_butOrRadar2) {
      commandData[0] = 10;
      commandData[1] = 6;
      commandData[2] = 0x02;
    }
    else {
      commandData[0] = 10;
      commandData[1] = 6;
      commandData[2] = 0x01;
    }

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'periph nb ' + bytes[1] + 'periph set ' + bytes[2]);
      },
    );
  }


  setUserRGBIndic() {
    if (this.isBleActionBlocked('setUserRGBIndic')) {
      return;
    }
    this.logger.debug(this.TAG, 'setUserRGBIndic');

    this.vibrate();
    let commandData = new Uint8Array(3);
    if (!this.rval_mlpc_periphCommandRGBIndic) {
      commandData[0] = 0x05;
      commandData[1] = 0x03;
      commandData[2] = 0x02;
    }
    else {
      commandData[0] = 0x05;
      commandData[1] = 0x03;
      commandData[2] = 0x01;
    }

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'periph MSB set ' + bytes[1]);
      },
    );
  }

  setWeightRange() {
    if (this.isBleActionBlocked('setWeightRange')) {
      return;
    }
    this.logger.debug(this.TAG, 'setWeightRange');

    if (this.userRangeWeight == 255)
      return;

    this.vibrate();
    let commandData = new Uint8Array(3);

    if (this.userRangeWeight == 1 && this.isMoventiv) {
      this.userRangeWeightBot = 10;
      this.userRangeWeightUp = 20;
      this.rval_mlpc_userParam_speedOpenTune = 100;
      this.setOpenSpeedTune();
      this.rval_mlpc_userParam_speedCloseTune = 70;
      this.setCloseSpeedTune();
    }
    else if (this.userRangeWeight == 2 && this.isMoventiv) {
      this.userRangeWeightBot = 20;
      this.userRangeWeightUp = 30;
      this.rval_mlpc_userParam_speedOpenTune = 100;
      this.setOpenSpeedTune();
      this.rval_mlpc_userParam_speedCloseTune = 70;
      this.setCloseSpeedTune();
    }
    else if (this.userRangeWeight == 3 && this.isMoventiv) {
      this.userRangeWeightBot = 30;
      this.userRangeWeightUp = 40;
      this.rval_mlpc_userParam_speedOpenTune = 80;
      this.setOpenSpeedTune();
      this.rval_mlpc_userParam_speedCloseTune = 70;
      this.setCloseSpeedTune();
    }
    else if (this.userRangeWeight == 4 && this.isMoventiv) {
      this.userRangeWeightBot = 40;
      this.userRangeWeightUp = 50;
      this.rval_mlpc_userParam_speedOpenTune = 80;
      this.setOpenSpeedTune();
      this.rval_mlpc_userParam_speedCloseTune = 70;
      this.setCloseSpeedTune();
    }
    else if (this.userRangeWeight == 5 && this.isMoventiv) {
      this.userRangeWeightBot = 50;
      this.userRangeWeightUp = 60;
      this.rval_mlpc_userParam_speedOpenTune = 75;
      this.setOpenSpeedTune();
      this.rval_mlpc_userParam_speedCloseTune = 70;
      this.setCloseSpeedTune();
    }
    else if (this.userRangeWeight == 6) { 
      this.userRangeWeightBot = 60;
      this.userRangeWeightUp = 80;
      this.rval_mlpc_userParam_speedOpenTune = 75;
      this.setOpenSpeedTune();
      this.rval_mlpc_userParam_speedCloseTune = 70;
      this.setCloseSpeedTune();
    }
    else if (this.userRangeWeight == 7) {
      this.userRangeWeightBot = 80;
      this.userRangeWeightUp = 100;
      this.rval_mlpc_userParam_speedOpenTune = 70; 
      this.setOpenSpeedTune();
      this.rval_mlpc_userParam_speedCloseTune = 60;
      this.setCloseSpeedTune();
    }
    else if (this.userRangeWeight == 8) {
      this.userRangeWeightBot = 100;
      this.userRangeWeightUp = 120;
      this.rval_mlpc_userParam_speedOpenTune = 65; 
      this.setOpenSpeedTune();
      this.rval_mlpc_userParam_speedCloseTune = 60;
      this.setCloseSpeedTune();
    }
    else if (this.userRangeWeight == 9) {
      this.userRangeWeightBot = 120;
      this.userRangeWeightUp = 140;
      this.rval_mlpc_userParam_speedOpenTune = 60; 
      this.setOpenSpeedTune();
      this.rval_mlpc_userParam_speedCloseTune = 60;
      this.setCloseSpeedTune();
    }
    
    commandData[0] = 0x00; 
    commandData[1] = this.userRangeWeightBot;
    commandData[2] = this.userRangeWeightUp;

    // this.ngZone.run(() => {
    //    this.rval_mlpc_proParamAll[1] = this.userRangeWeight;
    //  });

    //reset des verifs
    this.rval_mlpc_verifParam_weightRangeBot = 0xFF;
    this.rval_mlpc_verifParam_weightRangeUp = 0xFF;
    

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: MLPC_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'weight range bot' + bytes[1] + 'weight range top' + bytes[2]);
      },
    );
    this.presentCheckWeight();


    setTimeout(() => {
      this.CheckParamWeightRange();
    }, 2000);
    setTimeout(() => {
      this.dismissCheckParamWeightRange();
    }, 2500);

  }

  CheckParamWeightRange() {

    this.rval_mlpc_verifParam_weightRangeBot = this.rval_mlpc_proParam_weightRangeBot;
    this.rval_mlpc_verifParam_weightRangeUp = this.rval_mlpc_proParam_weightRangeUp;

    this.logger.debug(this.TAG, 'checkParamWeightRange')
    this.logger.debug(this.TAG, 'this.rval_mlpc_verifParam_weightRangeBot : ' + this.rval_mlpc_verifParam_weightRangeBot)
    this.logger.debug(this.TAG, 'this.userRangeWeightBot : ' + this.userRangeWeightBot)
    this.logger.debug(this.TAG, 'this.rval_mlpc_verifParam_weightRangeUp : ' + this.rval_mlpc_verifParam_weightRangeUp)
    this.logger.debug(this.TAG, 'this.userRangeWeightUp : ' + this.userRangeWeightUp)

    if ((this.rval_mlpc_verifParam_weightRangeBot == this.userRangeWeightBot) && (this.rval_mlpc_verifParam_weightRangeUp == this.userRangeWeightUp)) {
      this.checkParamWeightRange = true;
      this.logger.debug(this.TAG, 'checkParamWeightRange==true')

    }
    else {
      this.checkParamWeightRange = false;
      this.logger.debug(this.TAG, 'checkParamWeightRange==false')

    }
  }

  //JDU V1.3.0 #App-10 : option specifique pour Alert de selection de poids  
  weightAlertOptions = {
    cssClass: 'messageWeight',
    message: this.translate.instant('MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.WEIGHT_TUNING.WARNING'),
  };



  dismissCheckParamWeightRange() {
    this.logger.debug(this.TAG, 'dismissCheckParamWeightRange')
    if (this.checkParamWeightRange == true) {
      if (this.checkingWeightLoading) {
        this.checkingWeightLoading.dismiss().catch();
        this.checkingWeightLoading = null;
        this.logger.debug(this.TAG, 'OKWeightRangeCheck')
        this.presentConfirmWeightRange(true);
      }
    } else if (this.checkParamWeightRange == false) {
      if (this.checkingWeightLoading) {
        this.checkingWeightLoading.dismiss().catch();
        this.checkingWeightLoading = null;
        this.logger.debug(this.TAG, 'ErrorWeightRangeCheck')
        this.presentConfirmWeightRange(false);
        this.userRangeWeight = 255;
      }
    }
  }


  private isDemoDevice(): boolean {
    return !!(this.device && (this.device.isDemo === true || this.device.isDemo === "true"));
  }

  private getDeviceIdFromDevice(device: any): string {
    return device && (device.deviceId || device.address || device.id)
      ? String(device.deviceId || device.address || device.id).trim()
      : '';
  }

  private normalizeBleDevice(device: any): any {
    const deviceId = this.getDeviceIdFromDevice(device);

    if (device && deviceId) {
      device.deviceId = device.deviceId || deviceId;
      device.address = device.address || deviceId;
      device.id = device.id || deviceId;
    }

    return device;
  }

  private resolveNameWriteDeviceId(): string {
    const connectedPeripheral = this.bleConnectService ? this.bleConnectService.getConnectedPeripheral() : null;
    const navDevice = this.navParams.get('device') || this.navParams.get('peripheral');
    const candidates = [
      { source: 'this.peripheral', device: this.peripheral },
      { source: 'this.device', device: this.device },
      { source: 'navParams.device', device: navDevice },
      { source: 'bleConnectService.connectedPeripheral', device: connectedPeripheral }
    ];

    for (let i = 0; i < candidates.length; i++) {
      const deviceId = this.getDeviceIdFromDevice(candidates[i].device);

      if (deviceId) {
        if (!this.getDeviceIdFromDevice(this.peripheral) && candidates[i].device) {
          this.peripheral = this.normalizeBleDevice(Object.assign({}, candidates[i].device));
        }
        if (!this.getDeviceIdFromDevice(this.device) && candidates[i].device) {
          this.device = this.normalizeBleDevice(Object.assign({}, candidates[i].device));
        }

        this.logger.info(this.TAG, 'DeviceId Moventiv retenu avant ecriture', {
          deviceId: deviceId,
          source: candidates[i].source
        });

        return deviceId;
      }
    }

    this.logger.error(this.TAG, 'DeviceId Moventiv absent avant ecriture', {
      peripheral: this.peripheral,
      device: this.device,
      connectedPeripheral: connectedPeripheral
    });
    return '';
  }

  private isDeviceConnected(deviceId: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let subscription: any = null;
      let settled = false;

      subscription = this.randble.isConnected({ address: deviceId }).subscribe(
        (res) => {
          if (!settled) {
            settled = true;
            resolve(!!(res && res.isConnected));
          }
          if (subscription) {
            subscription.unsubscribe();
          }
        },
        (error) => {
          this.logger.warn(this.TAG, 'Verification connexion Moventiv impossible', {
            deviceId: deviceId,
            error: error
          });
          if (!settled) {
            settled = true;
            resolve(false);
          }
          if (subscription) {
            subscription.unsubscribe();
          }
        }
      );
    });
  }

  private createNameWriteError(message: string, translationKey: string): any {
    const error: any = new Error(message);
    error.translationKey = translationKey;
    return error;
  }

  private createNameWriteUnstableError(message: string, translationKey: string, originalError?: any): any {
    const error = this.createNameWriteError(message, translationKey);
    error.unstableConnection = true;
    error.originalError = originalError;
    return error;
  }

  private isNameWriteTimeoutError(error: any): boolean {
    const message = String(error && (error.message || error.errorMessage || error.toString()) || '').toLowerCase();
    return message.indexOf('timeout') > -1;
  }

  private normalizeNameWriteError(error: any): any {
    if (error && error.unstableConnection) {
      return error;
    }

    if (error && error.toastMessage) {
      return error;
    }

    if (this.isNameWriteTimeoutError(error)) {
      return this.createNameWriteUnstableError(
        'Timeout ecriture nom/piece Moventiv',
        'MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.RECONNECT_REQUIRED',
        error
      );
    }

    return error;
  }

  private bytesToDataView(bytes: Uint8Array): DataView {
    const buffer = new ArrayBuffer(bytes.length);
    const view = new Uint8Array(buffer);
    view.set(bytes);
    return new DataView(buffer);
  }

  private writeNameWithResponse(deviceId: string, bytes: Uint8Array, encodedString: string, valueToWrite: string): Promise<any> {
    this.logger.info(this.TAG, 'Ecriture nom/piece Moventiv avec reponse', {
      deviceId: deviceId,
      service: SHDO_SERVICE,
      characteristic: SHDO_NAME_CHARACTERISTIC,
      value: valueToWrite,
      length: bytes.length,
      timeout: NAME_WRITE_TIMEOUT_MS
    });

    return BleClient.write(
      deviceId,
      SHDO_SERVICE,
      SHDO_NAME_CHARACTERISTIC,
      this.bytesToDataView(bytes),
      { timeout: NAME_WRITE_TIMEOUT_MS }
    ).then(() => {
      return {
        status: 'written',
        value: encodedString,
        mode: 'writeWithResponse'
      };
    });
  }

  private ensureNameWriteConnection(deviceId: string): Promise<void> {
    const connectionStatus = this.bleConnectService ? this.bleConnectService.getConnectionStatus() : 'unknown';

    this.logger.info(this.TAG, 'Etat connexion Moventiv avant ecriture', {
      deviceId: deviceId,
      connectionStatus: connectionStatus
    });

    if (!deviceId) {
      return Promise.reject(this.createNameWriteError(
        'DeviceId absent pour ecriture nom/piece Moventiv',
        'MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_NOT_CONNECTED'
      ));
    }

    return this.isDeviceConnected(deviceId).then((isConnected) => {
      this.logger.info(this.TAG, 'Etat connecte Moventiv verifie avant ecriture', {
        deviceId: deviceId,
        connectionStatus: connectionStatus,
        isConnected: isConnected
      });

      if (!isConnected) {
        throw this.createNameWriteError(
          'Motorisation Moventiv non connectee avant ecriture nom/piece',
          'MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_NOT_CONNECTED'
        );
      }
    });
  }

  private isBleActionBlocked(action: string): boolean {
    if (this.isBleBusy) {
      this.logger.warn(this.TAG, 'Action BLE Moventiv bloquee: operation en cours', { action: action });
      this.showMoventivNameToast('MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.BLE_BUSY');
      return true;
    }

    if (this.isBleConnectionUnstable) {
      this.logger.warn(this.TAG, 'Action BLE Moventiv bloquee: connexion instable', { action: action });
      this.showMoventivNameToast('MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.RECONNECT_REQUIRED');
      return true;
    }

    return false;
  }

  private async handleNameWriteConnectionUnstable(deviceId: string, error: any): Promise<void> {
    this.isBleConnectionUnstable = true;

    if (this.peripheral) {
      this.peripheral.status = 'disconnected';
      this.peripheral.isConnected = false;
    }
    if (this.device) {
      this.device.status = 'disconnected';
      this.device.isConnected = false;
    }
    if (this.bleConnectService) {
      this.bleConnectService.setConnectionStatus('disconnected');
      this.bleConnectService.setNeedConnect(false);
    }

    this.logger.warn(this.TAG, 'Connexion BLE Moventiv declaree instable apres ecriture nom/piece', {
      deviceId: deviceId,
      error: error
    });

    if (deviceId) {
      this.logger.warn(this.TAG, 'Deconnexion propre Moventiv demandee apres timeout/erreur ecriture nom/piece', {
        deviceId: deviceId
      });

      try {
        await BleClient.disconnect(deviceId);
        this.logger.info(this.TAG, 'Deconnexion propre Moventiv effectuee apres ecriture nom/piece instable', {
          deviceId: deviceId
        });
      } catch (disconnectError) {
        this.logger.warn(this.TAG, 'Deconnexion propre Moventiv impossible apres ecriture nom/piece instable', {
          deviceId: deviceId,
          error: disconnectError
        });
      }
    }

    this.showMoventivNameToast('MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.RECONNECT_REQUIRED');

    try {
      this.logger.warn(this.TAG, 'Retour page scan Moventiv apres connexion instable nom/piece');
      await this.navCtrl.push('ScanPage');
    } catch (navigationError) {
      this.logger.warn(this.TAG, 'Retour page scan Moventiv impossible apres connexion instable nom/piece', navigationError);
    }
  }

  SetName(nameToWrite?: string, deviceIdToUse?: string): Promise<any> {
    const valueToWrite = (typeof nameToWrite === 'string' ? nameToWrite : this.userConfig.mlpcName.concat(this.stringLoc)).trim();
    const deviceId = deviceIdToUse || this.resolveNameWriteDeviceId();

    this.logger.info(this.TAG, 'Debut ecriture nom/piece Moventiv', {
      deviceId: deviceId,
      value: valueToWrite,
      length: valueToWrite.length
    });

    if (!valueToWrite) {
      return Promise.reject(this.createNameWriteError(
        'Valeur vide pour ecriture nom/piece Moventiv',
        'MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.NAME_REQUIRED'
      ));
    }

    if (valueToWrite.length > NAME_WRITE_MAX_LENGTH) {
      return Promise.reject(this.createNameWriteError(
        'Valeur trop longue pour ecriture nom/piece Moventiv',
        'MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.NAME_TOO_LONG'
      ));
    }

    const baseNameToWrite = this.stripLocationSuffix(valueToWrite).trim();
    if (!baseNameToWrite) {
      return Promise.reject(this.createNameWriteError(
        'Nom absent pour ecriture nom/piece Moventiv',
        'MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.NAME_REQUIRED'
      ));
    }

    if (!this.isNameBaseValid(baseNameToWrite)) {
      return Promise.reject(this.createNameWriteError(
        'Caracteres interdits pour ecriture nom/piece Moventiv',
        'MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_INVALID_CHARACTERS'
      ));
    }

    let bytes = this.randble.stringToBytes(valueToWrite);
    let encodedString = this.randble.bytesToEncodedString(bytes);

    if (this.isDemoDevice()) {
      this.logger.info(this.TAG, 'Ecriture nom/piece Moventiv simulee en mode demo', { value: valueToWrite });
      return Promise.resolve({ value: encodedString });
    }

    return this.ensureNameWriteConnection(deviceId).then(() => {
      return this.writeNameWithResponse(deviceId, bytes, encodedString, valueToWrite).then((returnObj) => {
        return {
          returnObj: returnObj
        };
      }).catch((error) => {
        if (this.isNameWriteTimeoutError(error)) {
          this.logger.warn(this.TAG, 'Timeout ecriture nom Moventiv detecte: connexion declaree instable, aucune relecture', {
            deviceId: deviceId,
            value: valueToWrite,
            error: error
          });

          throw this.createNameWriteUnstableError(
            'Timeout ecriture nom/piece Moventiv',
            'MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.RECONNECT_REQUIRED',
            error
          );
        }

        this.logger.error(this.TAG, 'Erreur ecriture nom Moventiv: connexion declaree instable', {
          deviceId: deviceId,
          value: valueToWrite,
          error: error
        });

        throw this.createNameWriteUnstableError(
          'Erreur ecriture nom/piece Moventiv',
          'MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.RECONNECT_REQUIRED',
          error
        );
      });
    }).then((writeResult) => {
      return writeResult.returnObj || {
        status: 'written',
        value: encodedString,
        mode: 'writeWithResponse'
      };
    }).then(
      (returnObj) => {
        this.logger.info(this.TAG, 'Succes ecriture nom/piece Moventiv', {
          deviceId: deviceId,
          value: valueToWrite,
          mode: returnObj && returnObj.mode ? returnObj.mode : 'writeWithResponse'
        });
        this.logger.info(this.TAG, 'Fin ecriture nom/piece Moventiv');
        return returnObj;
      },
    ).catch((error) => {
      const normalizedError = this.normalizeNameWriteError(error);
      this.logger.error(this.TAG, 'Erreur ecriture nom/piece Moventiv', {
        deviceId: deviceId,
        error: normalizedError
      });
      this.logger.info(this.TAG, 'Fin ecriture nom/piece Moventiv en erreur');
      throw normalizedError;
    });
  }

  //dec and inc buttons fct
  private getSpeedTuneMin(): number {
    return this.isGarline ? 0 : 50;
  }

  closeSpeedTuneInc() {
    if (this.rval_mlpc_userParam_speedCloseTune < 100)
      this.rval_mlpc_userParam_speedCloseTune++;
  }

  closeSpeedTuneDec() {
    if (this.rval_mlpc_userParam_speedCloseTune > this.getSpeedTuneMin())
      this.rval_mlpc_userParam_speedCloseTune--;
  }

  openSpeedTuneInc() {
    if (this.rval_mlpc_userParam_speedOpenTune < 100)
      this.rval_mlpc_userParam_speedOpenTune++;
  }

  openSpeedTuneDec() {
    if (this.rval_mlpc_userParam_speedOpenTune > this.getSpeedTuneMin())
      this.rval_mlpc_userParam_speedOpenTune--;
  }

  private getNearSpeedTuneMax(): number {
    return this.isGarline ? 100 : 200;
  }

  private clampLongTiming(value: number): number {
    if (isNaN(value) || value < MLPC_USERPARAM_OPEN_TIME_LONG_MIN) {
      return MLPC_USERPARAM_OPEN_TIME_LONG_MIN;
    }
    if (value > MLPC_USERPARAM_OPEN_TIME_LONG_MAX) {
      return MLPC_USERPARAM_OPEN_TIME_LONG_MAX;
    }
    return value;
  }

  shortTimingInc() {
    if (this.rval_mlpc_userParam_openTimeShort < 60)
      this.rval_mlpc_userParam_openTimeShort++;
  }

  shortTimingDec() {
    if (this.rval_mlpc_userParam_openTimeShort > 0)
      this.rval_mlpc_userParam_openTimeShort--;
  }

  longTimingInc() {
    if (this.rval_mlpc_userParam_openTimeLong < MLPC_USERPARAM_OPEN_TIME_LONG_MAX)
      this.rval_mlpc_userParam_openTimeLong++;
  }

  longTimingDec() {
    if (this.rval_mlpc_userParam_openTimeLong > MLPC_USERPARAM_OPEN_TIME_LONG_MIN)
      this.rval_mlpc_userParam_openTimeLong--;
  }

 
  //JDU : ajout bouton d'inc/dec sur vitesse fin ouverture/fermeture
  NearOpenSpeedInc(){
    if (this.rval_mlpc_proParam_nearOpenSpeed < this.getNearSpeedTuneMax())
      this.rval_mlpc_proParam_nearOpenSpeed++;
  }

  NearOpenSpeedDec(){
    if (this.rval_mlpc_proParam_nearOpenSpeed > 0)
      this.rval_mlpc_proParam_nearOpenSpeed--;
  }

  NearCloseSpeedInc(){
    if (this.rval_mlpc_proParam_nearCloseSpeed < this.getNearSpeedTuneMax())
      this.rval_mlpc_proParam_nearCloseSpeed++;
  }

  NearCloseSpeedDec(){
    if (this.rval_mlpc_proParam_nearCloseSpeed > 0)
      this.rval_mlpc_proParam_nearCloseSpeed--;
  }

  NearCloseTorqueInc(){
    if (this.rval_mlpc_proParam_nearCloseTorque < 200)
    this.rval_mlpc_proParam_nearCloseTorque++;
  }

  NearCloseTorqueDec(){
    if (this.rval_mlpc_proParam_nearCloseTorque > 0)
    this.rval_mlpc_proParam_nearCloseTorque--;
  }

  NearOpenTorqueInc(){
    if (this.rval_mlpc_proParam_nearOpenTorque < 200)
    this.rval_mlpc_proParam_nearOpenTorque++;
  }

  NearOpenTorqueDec(){
    if (this.rval_mlpc_proParam_nearOpenTorque > 0)
    this.rval_mlpc_proParam_nearOpenTorque--;
  }

  BrakingPowerInc(){
    if (this.rval_mlpc_proParam_brakingOpenPower < 200)
    this.rval_mlpc_proParam_brakingOpenPower++;
  }

  BrakingPowerDec(){
    if (this.rval_mlpc_proParam_brakingOpenPower > 0)
    this.rval_mlpc_proParam_brakingOpenPower--;
  }

  ObstacleSensiInc(){
    if (this.rval_mlpc_proParam_obstacleSensibility < 200)
    this.rval_mlpc_proParam_obstacleSensibility++;
  }

  ObstacleSensiDec(){
    if (this.rval_mlpc_proParam_obstacleSensibility > 0)
    this.rval_mlpc_proParam_obstacleSensibility--;
  }







  addDemoValues() {


    // this.rval_shDo_userDatesCycles[5] = this.todayDateUint8Array[0];
    //this.rval_shDo_userDatesCycles[4] = this.todayDateUint8Array[1];
    //this.rval_shDo_userDatesCycles[3] = this.todayDateUint8Array[2];

    this.peripheralNameAff =
      this.navParams.get('displayName') ||
      (this.device ? (this.device.customName || this.device.name) : '') ||
      (this.isGarline ? "GarlineEx" : "MoventivEx");
    this.syncNameInputFromDisplayName();

    this.rval_shDo_version = new Uint8Array(26);
    const demoProductByte = productTypeToVersionWordProductByte(this.currentProductType);
    if (demoProductByte !== null) {
      this.rval_shDo_version[D_SHDO_VERSION_MOTID_HOF] = demoProductByte;
    }

    this.rval_shDo_version_bleStack_major = 1;
    this.rval_shDo_version_bleStack_minor = 2;
    this.rval_shDo_version_bleStack_patch = 3;
    this.rval_shDo_version_bleStack_build = 4;
    //this.displayLockSwitch = true;


    this.rval_shdo_motorState_switch_BLE = true;
    this.rval_shdo_motorState_switch_autoManu = false;
    this.rval_shdo_motorState_switch_direction = true
    this.rval_shdo_motorState_switch_pairing = false;


    this.rval_shDo_userDatesCycles_totCyc = 55989;



    this.rval_shDo_proMaintenance_NbInit = 10;
    this.rval_shDo_proMaintenance_NbCyclesSinceInit = 200;
    this.rval_shDo_proMaintenance_NbObsDetect = 2;

    this.rval_shDo_proMaintenance_NbLearningCycle = 0;
    this.rval_shDo_proMaintenance_NbErrorEncoder = 0;
    this.rval_shDo_proMaintenance_NbErrorMotor = 0;

    this.rval_mlpc_userParam_speedOpenTune = 90;
    this.rval_mlpc_userParam_speedCloseTune = 95;
    this.rval_mlpc_userParam_openTimeShort = 4;
    this.rval_mlpc_userParam_openTimeLong = 10;

    //rval_mlpc_userParam_periphs1: number;
    //rval_mlpc_userParam_periphs2: number;

    //this.rval_mlpc_proParam_breakForceAtOpen = 5;
    this.rval_mlpc_proParam_nearOpenSpeed = 90;
    this.rval_mlpc_proParam_nearCloseSpeed = 100;

    //rval_mlpc_proParam_periphs1: number;
    //rval_mlpc_proParam_periphs2: number;
    this.rval_mlpc_proParam_periphs1_butOrRadar1 = false;
    this.rval_mlpc_proParam_periphs1_butOrRadar2 = true;
    //this.rval_mlpc_proParam_periphs1_radarTest1 = false;
    //this.rval_mlpc_proParam_periphs1_radarTest2 = false;
    //rval_mlpc_proParam_periphs1_lock: boolean;


    this.rval_mlpc_periphCommandRGBIndic = true;


  }


  disconnectBeforeSleep() {
    this.logger.debug(this.TAG, 'disconnectBeforeSleep()');


    if (this.peripheral) { //if there is a peripheral 
      this.logger.debug(this.TAG, 'peripheralExist');
      let peripheralAddress = '';
      peripheralAddress = this.peripheral.address;
      //iOS and android use 2 differents flow to disconnect
      if (this.platform.is('ios')) {
        setTimeout(() => { //add 50 ms between disconnect and close( force disconnect to 50ms delay)
          this.randble.disconnect({ address: peripheralAddress }).then(
            (val) => {
              this.logger.debug(this.TAG, 'Disconnect status' + val.status);
              setTimeout(() => {
                this.randble.close({ address: peripheralAddress }).then(
                  (conStates) => {
                    this.logger.debug(this.TAG, 'Close' + conStates.status);
                    this.showDeconnectedToast();
                  },
                  () => {
                    this.logger.debug(this.TAG, 'Close connection error');
                  },
                )
              }, 50);
            },
            () => {
              this.logger.debug(this.TAG, 'Disconnect error');
            },
          )
        }, 50);

      }
      else if (this.platform.is('android')) {
        this.randble.close({ address: peripheralAddress }).then(
          (conStates) => {
            this.logger.debug(this.TAG, 'Close' + conStates.status);
            this.showDeconnectedToast();
          },
          () => {
            this.logger.debug(this.TAG, 'Close connection eroor');
          },
        )

      }
    }
    else this.logger.debug(this.TAG, 'peripheralDontExist');

  }


  vibrate() {
    if (this.isActifVibrate) {
      Haptics.vibrate({ duration: 90 });
    }
  }


  lockAlert() {
    this.translate.get(['MOVENTIV_PAGE.COMMANDS_TAB.LOCK_PROMPT.TITLE', 'MOVENTIV_PAGE.COMMANDS_TAB.LOCK_PROMPT.SUBTITLE', 'MOVENTIV_PAGE.COMMANDS_TAB.LOCK_PROMPT.BUTTON_OK']).subscribe(
      res => {
        let alert = this.alertCtrl.create({
          title: res["MOVENTIV_PAGE.COMMANDS_TAB.LOCK_PROMPT.TITLE"],
          subTitle: res["MOVENTIV_PAGE.COMMANDS_TAB.LOCK_PROMPT.SUBTITLE"],
          buttons: [res["MOVENTIV_PAGE.COMMANDS_TAB.LOCK_PROMPT.BUTTON_OK"]]
        });
        alert.present();
      });
  }

  retentionAlert() {
    this.translate.get(['MOVENTIV_PAGE.COMMANDS_TAB.RETENTION_PROMPT.TITLE', 'MOVENTIV_PAGE.COMMANDS_TAB.RETENTION_PROMPT.SUBTITLE', 'MOVENTIV_PAGE.COMMANDS_TAB.RETENTION_PROMPT.BUTTON_OK']).subscribe(
      res => {
        let alert = this.alertCtrl.create({
          title: res["MOVENTIV_PAGE.COMMANDS_TAB.RETENTION_PROMPT.TITLE"],
          subTitle: res["MOVENTIV_PAGE.COMMANDS_TAB.RETENTION_PROMPT.SUBTITLE"],
          buttons: [res["MOVENTIV_PAGE.COMMANDS_TAB.RETENTION_PROMPT.BUTTON_OK"]]
        });
        alert.present();
      });
  }


  setStatus(message: any) {
    this.logger.debug(this.TAG, message);
    this.ngZone.run(() => {
      this.statusMessage = message;
    });
  }

  private isMaintenancePasswordValid(password: string): boolean {
    return password === MAINTENANCE_PASSWORD_OLD || password === MAINTENANCE_PASSWORD_ALT;
  }

  private isExpertPasswordValid(password: string): boolean {
    return password === EXPERT_PASSWORD_ALT || password === EXPERT_PASSWORD_OLD;
  }

  maintenancePrompt() {
    if (this.rval_shDo_userDatesCycles[5] != 255) {
      this.translate.get(['MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_MAINTENANCE.MESSAGE', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_MAINTENANCE.MESSAGE2', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.NO.TEXT', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.NO.ROLE', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.YES','MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.PASSWORD','MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.WRONG_PASSWORD']).subscribe(
        res => {
          let alert = this.alertCtrl.create({
            title: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.TITLE"], //bien trouvé ca quand même
            message: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_MAINTENANCE.MESSAGE"] + "\n" + this.todayDate + " ?" + "\n\r" + res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_MAINTENANCE.MESSAGE2"],
            //JDU : MDP
            inputs: [
              {
                name: 'MaintenancePassword',
                type: 'password',
                placeholder: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.PASSWORD"],
              }
            ],
            buttons: [
              {
                text: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.NO.TEXT"],
                role: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.NO.ROLE"],
                handler: () => {
                  this.logger.debug(this.TAG, 'clicked Cancel');
                }
              },
              {
                text: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.YES"],
                handler: data => {
                  if (this.isMaintenancePasswordValid(data.MaintenancePassword)) {
                    //faire nécessaire maintenance 
                    this.logger.debug(this.TAG, 'clicked go maintenance done')
                    this.setShdoMaintenanceDate();
                    this.setShdoFirstDate();//La fonction check si c'est bien la première mise en service
                  }
                  else{
                    this.logger.debug(this.TAG, 'Wrong password')
                    let WPAlert = this.alertCtrl.create({
                      subTitle: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.WRONG_PASSWORD"],
                      buttons: [{
                        text:'OK'
                      }]
                    })
                    WPAlert.present();
                  }
                  
                }
              }
            ],
            cssClass: 'alert-warning'
          });
          alert.present();
        });
    } else {
      this.translate.get(['MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_SETUP.MESSAGE', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_SETUP.MESSAGE2', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.NO.TEXT', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.NO.ROLE', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.YES', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.PASSWORD','MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.WRONG_PASSWORD']).subscribe(
        res => {
          let alert = this.alertCtrl.create({
            title: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.TITLE"], //bien trouvé ca quand même
            message: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_SETUP.MESSAGE"] + "\n" + this.todayDate + " ?" + "\n\r" + res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_SETUP.MESSAGE2"],
            //JDU : MDP
            inputs: [
              {
                name: 'MaintenancePassword',
                type: 'password',
                placeholder: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.PASSWORD"],
              }
            ],
            buttons: [
              {
                text: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.NO.TEXT"],
                role: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.NO.ROLE"],
                handler: () => {
                  this.logger.debug(this.TAG, 'clicked Cancel');
                }
              },
              {
                text: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.YES"],
                handler: data => {
                  if (this.isMaintenancePasswordValid(data.MaintenancePassword)) {
                    //faire nécessaire maintenance 
                    this.logger.debug(this.TAG, 'clicked go setup done')
                    this.setShdoMaintenanceDate();
                    this.setShdoFirstDate();//La fonction check si c'est bien la première mise en service
                    this.readAll();
                  }
                  else{
                    this.logger.debug(this.TAG, 'Wrong password')
                    let WPAlert = this.alertCtrl.create({
                      subTitle: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.WRONG_PASSWORD"]
                    })
                    WPAlert.present();
                  }
                }
              }
            ],
            cssClass: 'alert-warning'
          });
          alert.present();
        });
    }
  }


  scan() {
    this.setStatus('Scanning for MLPC Device');



    let scanParams = {
      allowDuplicates: false,
      matchNum: this.randble.MATCH_NUM_MAX_ADVERTISEMENT,
      callbackType: this.randble.CALLBACK_TYPE_ALL_MATCHES,
      scanMode: this.randble.SCAN_MODE_BALANCED, //more efficient scan for crowed place (the LE mode seems not efficient for common use)
      services: [MLPC_SERVICE],
    };

    this.devices = [];  // clear list

    this.randble.startScan(scanParams);

    setTimeout(() => {
      this.randble.stopScan().then(
        () => {
          this.logger.debug(this.TAG, "Scanning has stopped");

        },
        () => {
          this.logger.debug(this.TAG, "Error at stop scan");

        }
      );

    }, 6000);

  }

  //JDU : ajout des fonction pour sous-onglet dans REGLAGE
  paramBasicOnclick() {
    this.logger.debug(this.TAG, "paramBAsicOnClick()");
    this.readAll();
    this.content.scrollToTop();

  }

  paramAdvancedOnclick() {
    this.logger.debug(this.TAG, "paramAdvancedOnClick()");
    this.readAll();
    this.content.scrollToTop();
    this.advancedAlert();
  }

  //Alerte si appuis sur onglet ADVANCED
  advancedAlert() {
    this.translate.get(['WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.ALERT.TITLE', 'WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.ALERT.SUBTITLE', 'WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.ALERT.BUTTONS.NO.TEXT', 'WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.ALERT.BUTTONS.NO.ROLE', 'WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.ALERT.BUTTONS.YES']).subscribe(
      res => {
        let alert = this.alertCtrl.create({
          title: res["WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.ALERT.TITLE"],
          subTitle: res["WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.ALERT.SUBTITLE"],
          buttons: [
            {
              text: res["WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.ALERT.BUTTONS.NO.TEXT"],
              role: res["WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.ALERT.BUTTONS.NO.ROLE"],
              handler: () => {
                this.logger.debug(this.TAG, 'clicked Cancel');
                this.paramSubmenuType = 'basic';

              }
            },
            {
              text: res["WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.ALERT.BUTTONS.YES"],
              handler: () => {

              }
            }
          ],
        });
        alert.present();
      });
  }

  //*******************  Formulaire  ******************************************************************************************************/
  ngOnInit(): any {
    this.translate.get(['MOVENTIV_PAGE.ADJUSTMENTS_TAB.ASSOCIATEFORM.VALMESSAGE.REQUIRED', 'MOVENTIV_PAGE.ADJUSTMENTS_TAB.ASSOCIATEFORM.VALMESSAGE.MINLENGHT', 'MOVENTIV_PAGE.ADJUSTMENTS_TAB.ASSOCIATEFORM.VALMESSAGE.MAXLENGHT', 'MOVENTIV_PAGE.ADJUSTMENTS_TAB.ASSOCIATEFORM.VALMESSAGE.PATTERN', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.SUPERADVANCEDTUNING.PASSWORD.VALMESSAGE.NAME', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.SUPERADVANCEDTUNING.PASSWORD.VALMESSAGE.MAXLENGHT']).subscribe(
      res => {

        this.validation_messages = {

          'mlpcName': [
            { type: 'required', message: res["MOVENTIV_PAGE.ADJUSTMENTS_TAB.ASSOCIATEFORM.VALMESSAGE.REQUIRED"] },
            { type: 'minlength', message: res["MOVENTIV_PAGE.ADJUSTMENTS_TAB.ASSOCIATEFORM.VALMESSAGE.MINLENGHT"] },
            { type: 'maxlength', message: res["MOVENTIV_PAGE.ADJUSTMENTS_TAB.ASSOCIATEFORM.VALMESSAGE.MAXLENGHT"] },
            { type: 'pattern', message: res["MOVENTIV_PAGE.ADJUSTMENTS_TAB.ASSOCIATEFORM.VALMESSAGE.PATTERN"] },
          ],

          'mlpcPassword': [
            { type: 'required', message: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.SUPERADVANCEDTUNING.PASSWORD.VALMESSAGE.NAME"] },
            { type: 'maxlength', message: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.SUPERADVANCEDTUNING.PASSWORD.VALMESSAGE.MAXLENGHT"] },
          ]
        }

      });


    this.formName = this.formBuilder.group({
      'mlpcName': ['', [Validators.minLength(5), Validators.maxLength(15), Validators.pattern(NAME_ALLOWED_PATTERN)]]
    });
    this.formPassword = this.formBuilder.group({
      'mlpcPassword': ['', [Validators.required, Validators.maxLength(20)]]
    });
    this.syncNameInputFromDisplayName();
  }





  private getCurrentDisplayName(): string {
    return String(
      this.peripheralNameAff
      || (this.peripheral ? (this.peripheral.customName || this.peripheral.name) : '')
      || ''
    );
  }

  private stripLocationSuffix(name: string): string {
    let value = name || '';
    for (let i = 0; i < this.locationSuffixes.length; i++) {
      const suffix = this.locationSuffixes[i];
      if (value.lastIndexOf(suffix) === value.length - suffix.length) {
        value = value.substring(0, value.length - suffix.length);
      }
    }
    return value;
  }

  private extractLocationSuffix(name: string): string {
    const value = name || '';
    for (let i = 0; i < this.locationSuffixes.length; i++) {
      const suffix = this.locationSuffixes[i];
      if (value.lastIndexOf(suffix) === value.length - suffix.length) {
        return suffix;
      }
    }
    return '';
  }

  private getCurrentBaseName(): string {
    return this.stripLocationSuffix(this.getCurrentDisplayName()).trim();
  }

  private isNameBaseValid(name: string): boolean {
    return NAME_ALLOWED_PATTERN.test(name || '');
  }

  private syncNameInputFromDisplayName(): void {
    const displayName = this.getCurrentDisplayName();
    const locationSuffix = this.extractLocationSuffix(displayName);
    const baseName = this.stripLocationSuffix(displayName).trim();

    if (locationSuffix) {
      this.currentLocationSuffix = locationSuffix;
    }

    if (!baseName) {
      return;
    }

    this.peripheralNameAff = baseName;
    this.userConfig.mlpcName = baseName;
    const control = this.formName ? this.formName.get('mlpcName') : null;
    if (control) {
      control.setValue(baseName, { emitEvent: false });
      control.markAsPristine();
    }
  }

  private updateLocalNameDisplay(baseName: string, locationSuffix: string): void {
    const fullName = baseName + (locationSuffix || '');
    this.currentLocationSuffix = locationSuffix || '';

    this.ngZone.run(() => {
      this.peripheralNameAff = baseName;
      this.userConfig.mlpcName = baseName;

      if (this.peripheral) {
        this.peripheral.customName = fullName;
        this.peripheral.name = fullName;
      }

      const control = this.formName ? this.formName.get('mlpcName') : null;
      if (control) {
        control.setValue(baseName, { emitEvent: false });
        control.markAsPristine();
      }
    });
  }

  canSubmitNameAssociation(): boolean {
    if (this.isBleBusy || this.isNameWriteInProgress || this.isBleConnectionUnstable) {
      return false;
    }

    const control = this.formName ? this.formName.get('mlpcName') : null;
    const typedName = (this.userConfig.mlpcName || '').trim();
    const currentBaseName = this.getCurrentBaseName();

    if (typedName && control && !control.valid) {
      return false;
    }

    if ((typedName || currentBaseName) && !this.isNameBaseValid(typedName || currentBaseName)) {
      return false;
    }

    return !!typedName || !!this.stringLoc || !!currentBaseName;
  }

  private getNameSaveSuccessTranslationKey(nameChanged: boolean, roomChanged: boolean): string {
    if (nameChanged && roomChanged) {
      return 'MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_SUCCESS_NAME_ROOM';
    }

    if (roomChanged) {
      return 'MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_SUCCESS_ROOM';
    }

    return 'MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_SUCCESS_NAME';
  }

  async onSubmitformName() {
    if (this.isNameWriteInProgress) {
      this.logger.warn(this.TAG, 'Validation nom/piece Moventiv ignoree: ecriture deja en cours');
      this.showMoventivNameToast('MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.WRITE_IN_PROGRESS');
      return;
    }

    if (this.isBleBusy) {
      this.logger.warn(this.TAG, 'Validation nom/piece Moventiv ignoree: operation BLE en cours');
      this.showMoventivNameToast('MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.BLE_BUSY');
      return;
    }

    this.isNameWriteInProgress = true;
    this.isBleBusy = true;
    let writeSucceeded = false;
    let deviceId = '';
    this.logger.info(this.TAG, 'Debut validation nom/piece Moventiv');

    try {
      const control = this.formName ? this.formName.get('mlpcName') : null;
      const typedName = (this.userConfig.mlpcName || '').trim();
      const currentDisplayName = this.getCurrentDisplayName();
      const currentBaseName = this.stripLocationSuffix(currentDisplayName).trim();
      const baseName = typedName || currentBaseName;
      const locationSuffix = this.stringLoc || this.currentLocationSuffix || this.extractLocationSuffix(currentDisplayName);
      const valueToWrite = (baseName + locationSuffix).trim();
      const nameChanged = !!typedName && typedName !== currentBaseName;
      const roomChanged = !!this.stringLoc;
      deviceId = this.resolveNameWriteDeviceId();

      this.logger.info(this.TAG, 'DeviceId utilise validation nom/piece Moventiv', { deviceId: deviceId });
      this.logger.info(this.TAG, nameChanged ? 'Nom Moventiv a ecrire' : 'Nom Moventiv ignore car inchange', { name: baseName });
      this.logger.info(this.TAG, roomChanged ? 'Piece Moventiv a ecrire' : 'Piece Moventiv ignoree car inchangee', { room: locationSuffix });
      this.logger.info(this.TAG, 'Valeur nom/piece Moventiv preparee', {
        deviceId: deviceId,
        value: valueToWrite,
        length: valueToWrite.length
      });

      if (typedName && control && control.hasError('pattern')) {
        control.markAsTouched();
        this.logger.warn(this.TAG, 'Validation nom/piece Moventiv bloquee: caracteres interdits', {
          name: typedName
        });
        this.showMoventivNameToast('MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_INVALID_CHARACTERS');
        return;
      }

      if (baseName && !this.isNameBaseValid(baseName)) {
        if (control) {
          control.markAsTouched();
        }
        this.logger.warn(this.TAG, 'Validation nom/piece Moventiv bloquee: nom courant contient des caracteres interdits', {
          name: baseName
        });
        this.showMoventivNameToast('MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_INVALID_CHARACTERS');
        return;
      }

      if (typedName && control && !control.valid) {
        control.markAsTouched();
        this.logger.warn(this.TAG, 'Validation nom/piece Moventiv bloquee: nom invalide');
        this.showMoventivNameToast('MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_INVALID_NAME');
        return;
      }

      if (!baseName) {
        this.logger.warn(this.TAG, 'Validation nom/piece Moventiv bloquee: nom absent');
        this.showMoventivNameToast('MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.NAME_REQUIRED');
        return;
      }

      if (!nameChanged && !roomChanged) {
        this.logger.info(this.TAG, 'Validation nom/piece Moventiv terminee sans ecriture: aucune modification');
        this.showMoventivNameToast('MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.NO_CHANGE');
        return;
      }

      if (!valueToWrite) {
        this.logger.warn(this.TAG, 'Validation nom/piece Moventiv bloquee: valeur vide');
        this.showMoventivNameToast('MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.NAME_REQUIRED');
        return;
      }

      if (valueToWrite.length > NAME_WRITE_MAX_LENGTH) {
        this.logger.warn(this.TAG, 'Validation nom/piece Moventiv bloquee: valeur trop longue', {
          value: valueToWrite,
          length: valueToWrite.length,
          maxLength: NAME_WRITE_MAX_LENGTH
        });
        this.showMoventivNameToast('MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.NAME_TOO_LONG');
        return;
      }

      await this.delay(NAME_WRITE_PRE_DELAY_MS);
      await this.SetName(valueToWrite, deviceId);
      writeSucceeded = true;

      this.updateLocalNameDisplay(baseName, locationSuffix);
      this.logger.info(this.TAG, nameChanged ? 'Succes ecriture nom Moventiv' : 'Ecriture nom Moventiv non necessaire');
      this.logger.info(this.TAG, roomChanged ? 'Succes ecriture piece Moventiv' : 'Ecriture piece Moventiv non necessaire');
      this.logger.info(this.TAG, 'Validation nom/piece Moventiv reussie');

      this.showMoventivNameToast(this.getNameSaveSuccessTranslationKey(nameChanged, roomChanged));
    } catch (error) {
      const nameError: any = error;
      this.logger.error(this.TAG, 'Validation nom/piece Moventiv en erreur', error);
      if (error && nameError.unstableConnection) {
        await this.handleNameWriteConnectionUnstable(deviceId, error);
      } else if (error && nameError.toastMessage) {
        this.showMoventivNameToastMessage(nameError.toastMessage);
      } else {
        this.showMoventivNameToast(error && nameError.translationKey ? nameError.translationKey : 'MOVENTIV_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_ERROR');
      }
    } finally {
      if (writeSucceeded) {
        await this.delay(NAME_WRITE_COOLDOWN_MS);
      }
      this.isNameWriteInProgress = false;
      this.isBleBusy = false;
      this.logger.info(this.TAG, 'Fin validation nom/piece Moventiv');
    }
  }




  private showIncorrectPasswordToast(): void {
    let toast = this.toastCtrl.create({
      message: 'Mot de passe incorrect',
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  
  onSubmitformPasswordBCrypt() {
    this.logger.debug(this.TAG, 'submitting form password');


    bcrypt.compare("wisavdoor", "$2y$10$28PK5/oKpPwAuLskXdujVu.LwRxiyy.bXXHNahfeiEbWVkvkHpmfq", (_err: Error | null, match: boolean) => {
          this.logger.debug(this.TAG, 'BCryptCompare');
          this.logger.debug(this.TAG, 'Match result: ' + match);
          
          if (match == true) {
            // passwords match
            this.passwordValid = true;
            this.logger.debug(this.TAG, ' match Password BCrypt');
          } else {
            // passwords do not match
            this.logger.debug(this.TAG, 'Password BCrypt');
            this.showIncorrectPasswordToast();
          }
        });
  }

  onSubmitformPassword() {
    this.logger.debug(this.TAG, 'submitting form password');
    if (this.isExpertPasswordValid(this.userPassword)) {
      this.passwordValid = true;
      this.logger.debug(this.TAG, 'Password ok');
    }
    else {
      this.passwordValid = false;
      this.logger.debug(this.TAG, 'Password nok');
      this.showIncorrectPasswordToast();
    }
  }


  isValid(field: string) {
    const formField = this.formName.get(field);
    return !!formField && (formField.valid || formField.pristine);
  }


  nameValidator(control: FormControl): { [s: string]: boolean } | null {
    if (control.value && !NAME_ALLOWED_PATTERN.test(control.value)) {
      return { invalidName: true };
    }
    return null;
  }





  onLocChange() {
    this.logger.debug(this.TAG, "Selected localisation");

    switch (this.localisation) {
      case "locValRoom":
        this.stringLoc = "#CHA"
        break;
      case "locValEntree":
        this.stringLoc = "#ENT"
        break;
      case "locValLivingRoom":
        this.stringLoc = "#SAL"
        break;
      case "locValKitchen":
        this.stringLoc = "#CUI"
        break;
      case "locValDiningRoom":
        this.stringLoc = "#SAM"
        break;
      case "locValBathroom":
        this.stringLoc = "#SDB"
        break;
      case "locValToilet":
        this.stringLoc = "#WCS"
        break;
      case "LocValGarage_UtilityRoom":
        this.stringLoc = "#GAR"
        break;
      case "LocValSalle":
        this.stringLoc = "#SLL"
        break;
      case "LocValPlayroom":
        this.stringLoc = "#SDJ"
        break;
      default:
        this.stringLoc = '';
        break;
    }
  }





  //*******************  ConversionFct  *********************  
  stringToBytes(string: any) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
      array[i] = string.charCodeAt(i);
    }
    return array.buffer;
  }


  bytesToString(buffer: any) {
    return String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)));
  }


  //*******************  Popover/loader/toasts  *********************  
  presentPopover(ev: any) {
    let popover = this.popoverCtrl.create('PopoverPage', {
    });
    popover.present({
      ev: ev
    });
  }

  presentLoadingDefault() {
    this.translate.get('PROMPT.CONNECTION.TITLE').subscribe(
      res => {
        let connectionTranslatePrompt = res;

        this.loading = this.loadingCtrl.create({
          content: connectionTranslatePrompt,
          duration: 30000

        });

      });

    this.loading.present();
    this.logger.debug(this.TAG, 'this.loading.present() : connection');
  }

  presentReadingDefault() {
    this.translate.get('PROMPT.CONNECTION.TITLE').subscribe(
      res => {
        let connectionTranslatePrompt = res;

        this.promptReading = this.loadingCtrl.create({
          content: connectionTranslatePrompt,
          duration: 7000

        });

      });

    this.promptReading.present();
  }

  presentCheckWeight() {
    this.translate.get('MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.WEIGHT_TUNING.WEIGHTCHECK.LOADER').subscribe(
      res => {
        let TranslatePrompt = res;

        this.readProParam();

        this.checkingWeightLoading = this.loadingCtrl.create({
          content: TranslatePrompt,
          duration: 7000

        });

      });

    this.checkingWeightLoading.present();
  }

  presentConfirmWeightRange(confirm: boolean) {


    if (confirm) {
      this.translate.get(['MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.WEIGHT_TUNING.WEIGHTCHECK.OK.TITLE', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.WEIGHT_TUNING.WEIGHTCHECK.OK.MESSAGE', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.WEIGHT_TUNING.WEIGHTCHECK.BUTTON.OK']).subscribe(
        res => {
          let alert = this.alertCtrl.create({
            // title: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.WEIGHT_TUNING.WEIGHTCHECK.OK.TITLE"], //bien trouvé ca quand même
            message: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.WEIGHT_TUNING.WEIGHTCHECK.OK.MESSAGE"],
            buttons: [

              {
                text: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.WEIGHT_TUNING.WEIGHTCHECK.BUTTON.OK"],
                handler: () => {

                  this.logger.debug(this.TAG, 'clicked')
                }
              }
            ]
          });
          alert.present();
        });
    }
    else {
      this.translate.get(['MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.WEIGHT_TUNING.WEIGHTCHECK.ERROR.TITLE', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.WEIGHT_TUNING.WEIGHTCHECK.ERROR.MESSAGE', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.WEIGHT_TUNING.WEIGHTCHECK.BUTTON.OK']).subscribe(
        res => {
          let alert = this.alertCtrl.create({

            message: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.WEIGHT_TUNING.WEIGHTCHECK.ERROR.MESSAGE"],
            buttons: [

              {
                text: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.WEIGHT_TUNING.WEIGHTCHECK.BUTTON.OK"],
                handler: () => {

                  this.logger.debug(this.TAG, 'clicked')
                }
              }
            ]
          });
          alert.present();
        });
    }

  }

  private showMoventivNameToast(translationKey: string): void {
    this.translate.get(translationKey).subscribe(
      res => {
        this.showMoventivNameToastMessage(res);
      });
  }

  private showMoventivNameToastMessage(message: string): void {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 2500,
      position: 'middle',
      cssClass: "yourtoastclass"
    });
    toast.present(toast);
  }

  showDeconnectedToast() {
    this.translate.get('PROMPT.DISCONNECTED.TITLE').subscribe(
      res => {
        let disconnectedTranslatePrompt = res;
        let toast = this.toastCtrl.create({
          message: disconnectedTranslatePrompt,
          duration: 500,
          position: 'middle',
          //cssClass: "customToast.scss",
          cssClass: "yourtoastclass"
        });
        toast.present(toast);
      });
  }

  async delay(ms: number) {
    await new Promise<void>(resolve => setTimeout(() => resolve(), ms)).then(() => this.logger.debug(this.TAG, "fired"));
  }
}
