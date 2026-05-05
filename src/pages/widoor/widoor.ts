import { OnInit, Component, NgZone, ViewChild } from '@angular/core';
import { NavController, NavParams, AlertController, ToastController, Content } from 'ionic-angular';
import { RandBLE } from '../../providers/randble/randble';
import { LoadingController } from 'ionic-angular';
import { Haptics } from '@capacitor/haptics';
import { Storage } from '@ionic/storage';
import { FormGroup, FormBuilder, FormControl, Validators, ValidatorFn, AbstractControl } from "@angular/forms"
import { PopoverController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from 'ionic-angular';
import { Buffer } from 'buffer';
import { IonicPage } from 'ionic-angular';
import { BleconnectserviceProvider } from '../../providers/bleconnectservice/bleconnectservice';
import { LoggerService } from '../../providers/logger/logger.service';																	  
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
const D_MLPC_USERPARAM_PC1_HOF = 5;
const D_MLPC_USERPARAM_PC2_HOF = 6;

const D_MLPC_PROPARAM_WR_01_HOF = 0;
const D_MLPC_PROPARAM_WR_00_HOF = 1;
const D_MLPC_PROPARAM_EW_HOF = 2;
const D_MLPC_PROPARAM_NOS_HOF = 3;
const D_MLPC_PROPARAM_NCS_HOF = 4;
const D_MLPC_PROPARAM_NOT_HOF = 5;
const D_MLPC_PROPARAM_NCT_HOF = 6;
const D_MLPC_PROPARAM_NOP_HOF = 7;
const D_MLPC_PROPARAM_NCP_HOF = 8;
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
const WIDOOR_SERVICE = '3206890a-650e-46f3-9c73-2bc0840e3b8e';
const MLPC_USERPARAM_CHARACTERISTIC = '7c7679a6-5a0d-4cbd-8cbe-93b6d6b4b80f';
const MLPC_PROPARAM_CHARACTERISTIC = '15e9eef3-939b-4e66-baf9-772d8bd18c41';
const MLPC_VERIFPARAM_CHARACTERISTIC = 'cc942243-7656-441f-880c-4617eeb8bacc';
const NAME_WRITE_TIMEOUT_MS = 15000;
const NAME_WRITE_PRE_DELAY_MS = 200;
const NAME_WRITE_COOLDOWN_MS = 1800;
const RESET_WRITE_DELAY_MS = 250;
const NAME_WRITE_MAX_LENGTH = 15;
const NAME_ALLOWED_PATTERN = /^[A-Za-z0-9 -]*$/;


@IonicPage({
  priority: 'high'
})
@Component({
  selector: 'page-widoor',
  templateUrl: 'widoor.html'
})
export class WidoorPage implements OnInit {
  private TAG = 'WidoorPage';
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

  userRangeWeight!: number;
  userRangeWeightBot!: number;
  userRangeWeightUp!: number;
  userOpenBreakForce!: number;
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

  rval_shDo_version: Uint8Array = new Uint8Array(20);
  rval_shDo_version_bleStack_major!: number;
  rval_shDo_version_bleStack_minor!: number;
  rval_shDo_version_bleStack_patch!: number;
  rval_shDo_version_bleStack_build!: number;

  displayLockSwitch = false;
  displayTestRadar = false;

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
  rval_mlpc_proParam_breakForceAtOpen!: number;
  rval_mlpc_proParam_nearOpenSpeed!: number;
  rval_mlpc_proParam_nearCloseSpeed!: number;
  rval_mlpc_proParam_nearOpenTorque!: number;
  rval_mlpc_proParam_nearCloseTorque!: number;
  rval_mlpc_proParam_nearOpenProportionnal!: number;
  rval_mlpc_proParam_nearCloseProportionnal!: number;
  rval_mlpc_proParam_nearOpenIntegral!: number;
  rval_mlpc_proParam_nearCloseIntegral!: number;
  rval_mlpc_proParam_periphs1!: number;
  rval_mlpc_proParam_periphs2!: number;
  rval_mlpc_proParam_periphs1_butOrRadar1!: boolean;
  rval_mlpc_proParam_periphs1_butOrRadar2!: boolean;
  rval_mlpc_proParam_periphs1_radarTest1!: boolean;
  rval_mlpc_proParam_periphs1_radarTest2!: boolean;
  rval_mlpc_proParam_periphs1_lock!: boolean;

  rval_mlpc_periphCommandLedStripStatic!: boolean;
  rval_mlpc_periphCommandLedStripDynamic!: boolean;
  rval_mlpc_periphCommandLight1!: boolean;
  rval_mlpc_periphCommandLight2!: boolean;
  rval_mlpc_periphCommandRGBIndic!: boolean;

  rval_mlpc_verifParam_weightRangeBot!: number;
  rval_mlpc_verifParam_weightRangeUp!: number;
  rval_mlpc_verifParam_exactWeight!: number;


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
  presentResetLoading: any = {};
  promptReading: any = {};
  peripheralNameAff!: any;
  isNameWriteInProgress: boolean = false;
  isBleBusy: boolean = false;
  isResetInProgress: boolean = false;
  isBleConnectionUnstable: boolean = false;
  retry: boolean = false;
  retryConnection: number = 6;
  menuType!: string;
  paramSubmenuType!: string;


  dispOptionalCom_MO!: boolean;
  dispOptionalCom_LC!: boolean;
  dispOptionalCom_LLB!: boolean;

  //date maintenance
  todayDate!: string;
  todayDateUint8Array!: Uint8Array;

  //test a effacer 
  ackData_SHDO_usercom!: Uint8Array;
  test_val_sub!: Uint8Array;
  ackData_SHDO_usercom_val!: string;


  constructor(
    public navCtrl: NavController,
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
      this.platform.pause.subscribe(() => {
        this.logger.debug(this.TAG, '****UserdashboardPage PAUSED****');
        //this.disconnectBeforeSleep();
      });
      this.platform.resume.subscribe(() => {
        this.logger.debug(this.TAG, '****UserdashboardPage RESUMED****');
      });
    });


    this.menuType = 'com';
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

  //********************************************************lifeCycle*****************************************************************************/
  ionViewDidEnter() {

    this.logger.debug(this.TAG, '[Widoor] ionViewDidEnter');

    //disable swipe back button
    this.navCtrl.swipeBackEnabled = false;

    //this.isVisibleLight = JSON.parse(localStorage.getItem('storeBolHide'));
    this.retryConnection = 8;

    // Récupère le device dès l’entrée de page (navParams en priorité)
    const navDevice =
      this.navParams.get('device')
      || this.navParams.get('peripheral')
      || (this.bleConnectService && (this.bleConnectService as any).getConnectedPeripheral
          ? (this.bleConnectService as any).getConnectedPeripheral()
          : null);

    if (navDevice) {
      if (!navDevice.address && navDevice.id) {
        navDevice.address = navDevice.id;
      }

      this.device = navDevice;
      this.peripheral = navDevice; 
      this.logger.debug(this.TAG, '[Widoor] Peripheral set:', this.peripheral.address);
      
      this.peripheralNameAff = this.navParams.get('displayName') || (this.peripheral ? (this.peripheral.customName || this.peripheral.name) : '') ||'';
      this.syncNameInputFromDisplayName();

      if (this.bleConnectService && (this.bleConnectService as any).setNeedConnect) {
        (this.bleConnectService as any).setNeedConnect(false);
      }
    } else {
      this.logger.error(this.TAG, '[Widoor] Aucun device trouvé dans navParams / service');
    }

    if (this.bleConnectService.getNeedConnect()) {
      this.presentLoadingDefault();
      this.bleConnect();
    }
  }

  ionViewDidLoad() {

  }

  ionViewWillEnter() {


    this.localisation = '';
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

    this.todayDate = moment().format('DD-MM-YYYY');
    this.todayDateArray = moment().toArray(); //[year, month, day, hour, minute, second, millisecond]
    this.logger.debug(this.TAG, 'todayArray' + this.todayDateArray);
    this.logger.debug(this.TAG, 'todayArrayYear' + this.todayDateArray[0]);
    this.todayDateArray[0] = this.todayDateArray[0] - 2000;
    this.todayDateUint8Array = this.todayDateArray;
    this.logger.debug(this.TAG, 'todayArrayYearArray' + this.todayDateUint8Array[0]);
  }


  ngOnDestroy() {
    // always unsubscribe your subscriptions to prevent leaks
    // this.platform.pause.subscribe().unsubscribe();
    //this.platform.resume.subscribe().unsubscribe();
  }

  // Disconnect peripheral when leaving the page
  ionViewWillLeave() {
    this.bleConnectService.setNeedConnect(false);
    this.navCtrl.swipeBackEnabled = true;



  }

  ionViewWillUnload() {
    this.platform.pause.subscribe().unsubscribe();
    this.platform.resume.subscribe().unsubscribe();
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

        this.randble.stopScan().catch(() => {})
          .then(() => this.randble.close({ address: device.address }))
          .then(() => new Promise(r => setTimeout(r, 500))) 
          .then(() => {
            this.randble.connect({ address: device.address }).subscribe(
              (peripheral: any) => {
                if (peripheral.status === 'connected') {
                  this.onConnected(peripheral);
                }
              },
              (err) => {
                this.logger.debug(this.TAG, '[BLE] Connection error, retrying in 1.5s...');
                setTimeout(() => this.bleConnect(), 1500);
              }
            );
          });
      } else {
        this.loading.dismiss().catch(() => {});
        this.navCtrl.push('ScanPage');
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

    setTimeout(() => {
      this.randble.discover({ address: this.getDeviceIdFromDevice(this.peripheral) })
        .then((data) => {
          this.logger.debug(this.TAG, '[STEP 2] Discovery Success', data);
          
          if (data.services && data.services.length > 0) {
            this.onDiscovered(this.peripheral);
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

  onDiscovered(peripheral: any) {
    this.logger.debug(this.TAG, '[STEP 3] Starting Data Sync');
    this.readAll();
    
    if (this.loading) {
      this.loading.dismiss().catch(() => {});
    }
  }

  handleConnectionError() {
    if (this.loading) this.loading.dismiss().catch(() => {});
    this.randble.close({ address: this.peripheral.address }).catch(() => {});
  }


  readAll() {
    this.resizeContent();

    if (this.isBleActionBlocked('readAll')) {
      return;
    }

    if ((this.device.isDemo) == "true") return;

    this.readMotorState();
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
    if ((this.device.isDemo) == "true") return;
    this.randble.read({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_MOTORSTATE_CHARACTERISTIC }).then(
      buffer => {
        let dataStringBytes = this.randble.encodedStringToBytes(buffer.value)
        this.ngZone.run(() => {
          this.rval_shdo_motorState_state = dataStringBytes[D_SHDO_MOTORSTATE_STATE_HOF];
          var buf = Buffer.from([dataStringBytes[D_SHDO_MOTORSTATE_POSMSB_HOF], dataStringBytes[D_SHDO_MOTORSTATE_POSLSB_HOF]]);
          this.rval_shdo_motorState_pos = buf.readUIntBE(0, 2);
          var buf = Buffer.from([dataStringBytes[D_SHDO_MOTORSTATE_MPOSMSB_HOF], dataStringBytes[D_SHDO_MOTORSTATE_MPOSLSB_HOF]]);
          this.rval_shdo_motorState_mpos = buf.readUIntBE(0, 2);
          this.rval_shdo_motorState_rpos = (this.rval_shdo_motorState_pos / this.rval_shdo_motorState_pos) * 100;
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
    )
  }


  readVersion() {
    if (this.isBleActionBlocked('readVersion')) {
      return;
    }
    if ((this.device.isDemo) == "true") return;
    this.randble.read({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_VERSION_CHARACTERISTIC }).then
      (
        buffer => {
          let data_shDo_version = this.randble.encodedStringToBytes(buffer.value)
          this.ngZone.run(() => {
            this.rval_shDo_version = data_shDo_version;
            var buf = Buffer.from([data_shDo_version[D_SHDO_VERSION_STACK_MAJORMSB_HOF], data_shDo_version[D_SHDO_VERSION_STACK_MAJORLSB_HOF]]);
            this.rval_shDo_version_bleStack_major = buf.readUIntBE(0, 2);
            var buf = Buffer.from([data_shDo_version[D_SHDO_VERSION_STACK_MINORMSB_HOF], data_shDo_version[D_SHDO_VERSION_STACK_MINORLSB_HOF]]);
            this.rval_shDo_version_bleStack_minor = buf.readUIntBE(0, 2);
            var buf = Buffer.from([data_shDo_version[D_SHDO_VERSION_STACK_PATCHMSB_HOF], data_shDo_version[D_SHDO_VERSION_STACK_PATCHLSB_HOF]]);
            this.rval_shDo_version_bleStack_patch = buf.readUIntBE(0, 2);
            var buf = Buffer.from([data_shDo_version[D_SHDO_VERSION_STACK_BUILDMSB_HOF], data_shDo_version[D_SHDO_VERSION_STACK_BUILDLSB_HOF]]);
            this.rval_shDo_version_bleStack_build = buf.readUIntBE(0, 2);
            if (this.isGreaterVersion3e(this.rval_shDo_version[14], this.rval_shDo_version[15], this.rval_shDo_version[16], 1, 0, 0)) {
              this.displayLockSwitch = true;
            }

          });
        }
      )
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
            var buf = Buffer.from([dataStringB[9], dataStringB[10], dataStringB[11]]);
            this.rval_shDo_proMaintenance_NbErrorEncoder = buf.readUIntBE(0, 3);
            var buf = Buffer.from([dataStringB[12], dataStringB[13], dataStringB[14]]);
            this.rval_shDo_proMaintenance_NbErrorMotor = buf.readUIntBE(0, 3);

          });
        }
      )
  }

  readUserDatesCycles() {
    if (this.isBleActionBlocked('readUserDatesCycles')) {
      return;
    }
    if ((this.device.isDemo) == "true") return;
    this.randble.read({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_USERDATESCYCLES_CHARACTERISTIC }).then(
      buffer => {
        let data_shDo_userDatesCycles = this.randble.encodedStringToBytes(buffer.value)
        this.ngZone.run(() => {
          this.rval_shDo_userDatesCycles = data_shDo_userDatesCycles;
          var buf = Buffer.from([data_shDo_userDatesCycles[D_SHDO_USERDATESCYCLESALL_TC_02_UOF], data_shDo_userDatesCycles[D_SHDO_USERDATESCYCLESALL_TC_01_UOF], data_shDo_userDatesCycles[D_SHDO_USERDATESCYCLESALL_TC_00_UOF]]);
          this.rval_shDo_userDatesCycles_totCyc = buf.readUIntBE(0, 3);
          var buf = Buffer.from([data_shDo_userDatesCycles[D_SHDO_USERDATESCYCLESALL_LMC_02_UOF], data_shDo_userDatesCycles[D_SHDO_USERDATESCYCLESALL_LMC_01_UOF], data_shDo_userDatesCycles[D_SHDO_USERDATESCYCLESALL_LMC_00_UOF]]);
          this.rval_shDo_userDatesCycles_maintCyc = buf.readUIntBE(0, 3);
          this.setShdoFirstDate();
        });
      }
    )
  }

  readUserParam() {
    if (this.isBleActionBlocked('readUserParam')) {
      return;
    }
    if ((this.device.isDemo) == "true") return;
    this.randble.read({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC }).then(
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
          this.rval_mlpc_userParam_openTimeLong = dataBytes[D_MLPC_USERPARAM_OTL_HOF];
          this.rval_mlpc_userParam_periphs1 = dataBytes[D_MLPC_USERPARAM_PC1_HOF];
          this.rval_mlpc_userParam_periphs2 = dataBytes[D_MLPC_USERPARAM_PC2_HOF];


          this.rval_mlpc_periphCommandLedStripDynamic = Boolean((1 << 7) & this.rval_mlpc_userParam_periphs1);
          this.rval_mlpc_periphCommandLedStripStatic = Boolean((1 << 6) & this.rval_mlpc_userParam_periphs1);
          this.rval_mlpc_periphCommandLight1 = Boolean((1 << 5) & this.rval_mlpc_userParam_periphs1);
          this.rval_mlpc_periphCommandLight2 = Boolean((1 << 4) & this.rval_mlpc_userParam_periphs1);
          this.rval_mlpc_periphCommandRGBIndic = Boolean((1 << 3) & this.rval_mlpc_userParam_periphs1);

        });
      }
    )
  }

  readProParam() {
    if (this.isBleActionBlocked('readProParam')) {
      return;
    }
    if ((this.device.isDemo) == "true") return;
    this.randble.read({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC }).then
      (
        buffer => {
          let dataStringB = this.randble.encodedStringToBytes(buffer.value)
          this.ngZone.run(() => {
            this.rval_mlpc_proParam_weightRangeBot = dataStringB[D_MLPC_PROPARAM_WR_01_HOF];

            this.rval_mlpc_proParam_weightRangeUp = dataStringB[D_MLPC_PROPARAM_WR_00_HOF];
            this.rval_mlpc_proParam_breakForceAtOpen = dataStringB[D_MLPC_PROPARAM_EW_HOF];
            this.rval_mlpc_proParam_nearOpenSpeed = dataStringB[D_MLPC_PROPARAM_NOS_HOF];
            this.logger.debug(this.TAG, 'rval_mlpc_proParam_nearOpenSpeed' + this.rval_mlpc_proParam_nearOpenSpeed)
            this.rval_mlpc_proParam_nearCloseSpeed = dataStringB[D_MLPC_PROPARAM_NCS_HOF];
            this.logger.debug(this.TAG, 'rval_mlpc_proParam_nearCloseSpeed' + this.rval_mlpc_proParam_nearCloseSpeed)
            this.rval_mlpc_proParam_nearOpenTorque = dataStringB[D_MLPC_PROPARAM_NOT_HOF];
            this.rval_mlpc_proParam_nearCloseTorque = dataStringB[D_MLPC_PROPARAM_NCT_HOF];
            this.rval_mlpc_proParam_nearOpenProportionnal = dataStringB[D_MLPC_PROPARAM_NOP_HOF];
            this.rval_mlpc_proParam_nearCloseProportionnal = dataStringB[D_MLPC_PROPARAM_NCP_HOF];
            this.rval_mlpc_proParam_nearOpenIntegral = dataStringB[D_MLPC_PROPARAM_NOI_HOF];
            this.rval_mlpc_proParam_nearCloseIntegral = dataStringB[D_MLPC_PROPARAM_NCI_HOF];
            this.rval_mlpc_proParam_periphs1 = dataStringB[D_MLPC_PROPARAM_PC1_HOF];
            this.rval_mlpc_proParam_periphs2 = dataStringB[D_MLPC_PROPARAM_PC2_HOF];
            this.rval_mlpc_proParam_periphs1_butOrRadar1 = Boolean((1 << 7) & this.rval_mlpc_proParam_periphs1);
            this.rval_mlpc_proParam_periphs1_butOrRadar2 = Boolean((1 << 6) & this.rval_mlpc_proParam_periphs1);
            this.rval_mlpc_proParam_periphs1_lock = Boolean((1 << 5) & this.rval_mlpc_proParam_periphs1);
            this.rval_mlpc_proParam_periphs1_radarTest1 = Boolean((1 << 4) & this.rval_mlpc_proParam_periphs1);
            this.rval_mlpc_proParam_periphs1_radarTest2 = Boolean((1 << 3) & this.rval_mlpc_proParam_periphs1);

          });
        }
      )
  }

  subscribeMotorState() {
    if ((this.device.isDemo) == "true") return;
    this.randble.subscribe({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_MOTORSTATE_CHARACTERISTIC }).subscribe(
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
            this.rval_shdo_motorState_rpos = (this.rval_shdo_motorState_pos / this.rval_shdo_motorState_pos) * 100;
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
      () => (this.loading.dismiss(), this.navCtrl.push('ScanPage'), this.logger.debug(this.TAG, 'dismiss debug1'))
    );


  }

  subscribeVerifParam() {
    if ((this.device.isDemo) == "true") return;
    this.randble.subscribe({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_VERIFPARAM_CHARACTERISTIC }).subscribe(
      parameter => {
        let value = parameter.value;
        this.logger.debug(this.TAG, 'Subscribed MLPC_VERIFPARAM_CHARACTERISTIC')
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
      () => (this.loading.dismiss(), this.navCtrl.push('ScanPage'), { animate: false }, this.logger.debug(this.TAG, 'dismiss debug2'))
    );
  }



  onStateChange(buffer: ArrayBuffer) {
  }



  setShutterOpenStime() {
    if (this.isBleActionBlocked('setShutterOpenStime')) {
      return;
    }
    if ((this.device.isDemo) == "true") return;
    this.logger.debug(this.TAG, 'SetDoorOpenStime');

    if (!this.peripheral || (!this.peripheral.address && !this.peripheral.id)) {
      this.logger.error(this.TAG, '[Widoor] peripheral/deviceId absent au moment de Ouvrir', this.peripheral);
      return;
    }
    if (!this.peripheral.address && this.peripheral.id) {
      this.peripheral.address = this.peripheral.id;
    }

    if (this.lockClose == 1) { this.lockAlert(); }
    else if (this.lockOpen == 1) { this.retentionAlert(); }
    else {
      this.vibrate();
      let commandData = new Uint8Array(4);
      commandData[0] = 0x00;
      commandData[1] = 0x21;

      let encodedString = this.randble.bytesToEncodedString(commandData);

      this.randble.write({
        deviceId: (this.peripheral && (this.peripheral.address || this.peripheral.id)) ? (this.peripheral.address || this.peripheral.id) : undefined,
        service: SHDO_SERVICE,
        characteristic: SHDO_COMMAND_CHARACTERISTIC,
        value: encodedString
      }).then(        
        (returnObj) => {
          let bytes = this.randble.encodedStringToBytes(returnObj.value);
          //let returnString = this.randble.bytesToString(bytes); //DEBUG
          this.logger.debug(this.TAG, 'page : ' + bytes[0] + 'setDoorOpenStime b0: ' + bytes[1] + 'b1: ' + bytes[2] + 'b2: ' + bytes[3]);
          if ((bytes[0] == commandData[0]) && (bytes[1] == commandData[1]) && (bytes[2] == commandData[2])) {
            this.logger.debug(this.TAG, 'BLE transmission OK')
          }
        },
      );
    }
  }

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

      this.randble.write({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_COMMAND_CHARACTERISTIC, value: encodedString }).then(
        (returnObj) => {
          let bytes = this.randble.encodedStringToBytes(returnObj.value);
          //let returnString = this.randble.bytesToString(bytes); //DEBUG
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
    if ((this.device.isDemo) != "true") return;
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
          //let returnString = this.randble.bytesToString(bytes); //DEBUG
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
    if ((this.device.isDemo) == "true") return;


    let commandData = new Uint8Array(2);
    commandData[0] = 0x00;
    commandData[1] = 0x12;

    let encodedString = this.randble.bytesToEncodedString(commandData);


    this.randble.write({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_COMMAND_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'page : ' + bytes[0] + 'setDoorLearning: ' + bytes[1] + 'b1: ' + bytes[2] + 'b2: ' + bytes[3]);
        if ((bytes[0] == commandData[0]) && (bytes[1] == commandData[1]) && (bytes[2] == commandData[2])) {
          this.logger.debug(this.TAG, 'BLE transmission OK')
        }
      },
    );
  }

  async setShutterResetParam(): Promise<void> {
    if (this.isResetInProgress) {
      this.logger.warn(this.TAG, 'Reset paramètres ignoré: reset déjà en cours');
      return;
    }
    if (this.isBleActionBlocked('setShutterResetParam')) {
      return;
    }
    this.logger.info(this.TAG, 'Reset confirmé');
    this.logger.info(this.TAG, 'Application des paramètres par défaut');
    this.vibrate();
    if (this.isDemoDevice()) {
      this.logger.info(this.TAG, 'Reset ignoré: mode démo');
      return;
    }

    const address = this.resolveResetDeviceId();

    if (!address) {
      this.logger.error(this.TAG, 'Erreur reset: périphérique introuvable', { peripheral: this.peripheral });
      this.showWidoorNameToastMessage('La réinitialisation des paramètres a échoué.');
      return;
    }

    let resetLoading: any = null;
    let resetSucceeded = false;
    this.isResetInProgress = true;
    this.isBleBusy = true;

    try {
      resetLoading = this.loadingCtrl.create({
        content: 'Réinitialisation en cours...'
      });
      await resetLoading.present();

      const connectionStatus = this.bleConnectService ? this.bleConnectService.getConnectionStatus() : 'unknown';
      const isConnected = await this.isDeviceConnected(address);
      this.logger.info(this.TAG, 'Etat connexion avant reset', {
        address: address,
        connectionStatus: connectionStatus,
        isConnected: isConnected
      });

      if (!isConnected) {
        throw new Error('Motorisation non connectée avant reset paramètres');
      }

      await this.applyResetDefaultParameters(address);
      resetSucceeded = true;
      this.logger.info(this.TAG, 'Succès reset paramètres', {
        address: address,
        productConfirmation: false,
        defaultsApplied: true
      });
      this.showWidoorNameToastMessage('Les paramètres ont été réinitialisés.');
    } catch (error) {
      this.logger.error(this.TAG, 'Erreur reset paramètres', error);
      this.showWidoorNameToastMessage('La réinitialisation a échoué. Veuillez réessayer.');
    } finally {
      if (resetLoading) {
        try {
          await resetLoading.dismiss();
        } catch (dismissError) {
          this.logger.warn(this.TAG, 'Fermeture loader reset impossible', dismissError);
        }
      }
      this.isBleBusy = false;
      this.isResetInProgress = false;
      this.logger.info(this.TAG, 'Sortie reset paramètres');
    }

    if (resetSucceeded) {
      this.readAll();
    }
  }


  setShdoMaintenanceDate() {
    if (this.isBleActionBlocked('setShdoMaintenanceDate')) {
      return;
    }
    this.logger.debug(this.TAG, 'setShdoMaintenanceDate');
    this.vibrate();
    if ((this.device.isDemo) == "true") return;

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
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'pageSel: ' + bytes[0] + 'setLastMaintDate YY: ' + bytes[1] + 'MM: ' + bytes[2] + 'DD: ' + bytes[3] + 'hh: ' + bytes[4]);
      },
    );
  }


  setShdoFirstDate() {
    if (this.isBleActionBlocked('setShdoFirstDate')) {
      return;
    }
    this.logger.debug(this.TAG, 'setShdoFirstDate');
    this.vibrate();
    if ((this.device.isDemo) == "true") return;
    this.logger.debug(this.TAG, 'this.rval_shDo_userDatesCycles[5]:' + this.rval_shDo_userDatesCycles[5]);
    this.logger.debug(this.TAG, 'this.rval_shDo_userDatesCycles[4]:' + this.rval_shDo_userDatesCycles[4]);
    this.logger.debug(this.TAG, 'this.rval_shDo_userDatesCycles[3]:' + this.rval_shDo_userDatesCycles[3]);
    if ((this.rval_shDo_userDatesCycles[5] == 0) && (this.rval_shDo_userDatesCycles[4] == 0) && (this.rval_shDo_userDatesCycles[3] == 0)) {
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
          let returnString = this.randble.bytesToString(bytes);
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
    this.vibrate();
    if ((this.device.isDemo) == "true") return;
    if (this.lockClose == 2) { this.lockAlert(); }
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
          let returnString = this.randble.bytesToString(bytes);
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
    this.vibrate();
    if ((this.device.isDemo) == "true") return;


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

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'setLockClose b0: ' + bytes[1]);
      },
    );
  }

  setLockOpen() {
    if (this.isBleActionBlocked('setLockOpen')) {
      return;
    }
    this.logger.debug(this.TAG, 'SetLockOpen');
    this.vibrate();
    if ((this.device.isDemo) == "true") return;


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

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'setLockClose b0: ' + bytes[1]);
      },
    );
  }



  setOpenSpeedTune() {
    if (this.isBleActionBlocked('setOpenSpeedTune')) {
      return;
    }
    this.logger.debug(this.TAG, 'SetSpeedOpenTune');

    if ((this.device.isDemo) == "true") return;

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x01;
    commandData[1] = this.rval_mlpc_userParam_speedOpenTune;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'SetSpeedOpenTune b0: ' + bytes[1]);
      },
    );
  }




  setCloseSpeedTune() {
    if (this.isBleActionBlocked('setCloseSpeedTune')) {
      return;
    }
    this.logger.debug(this.TAG, 'SetSpeedCloseTune');
    this.vibrate();
    if ((this.device.isDemo) == "true") return;


    let commandData = new Uint8Array(2);
    commandData[0] = 0x02;
    commandData[1] = this.rval_mlpc_userParam_speedCloseTune;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'SetSpeedCloseTune b0: ' + bytes[1]);
      },
    );
  }


  setNearOpenSpeed() {
    if (this.isBleActionBlocked('setNearOpenSpeed')) {
      return;
    }

    this.logger.debug(this.TAG, 'setNearOpenSpeed');
    this.vibrate();
    if ((this.device.isDemo) == "true") return;


    let commandData = new Uint8Array(2);
    commandData[0] = 0x02;
    commandData[1] = this.rval_mlpc_proParam_nearOpenSpeed;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);

      },
    );
  }

  setNearCloseSpeed() {
    if (this.isBleActionBlocked('setNearCloseSpeed')) {
      return;
    }
    this.logger.debug(this.TAG, 'setNearCloseSpeed');
    this.vibrate();
    if ((this.device.isDemo) == "true") return;


    let commandData = new Uint8Array(2);
    commandData[0] = 0x03;
    commandData[1] = this.rval_mlpc_proParam_nearCloseSpeed;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);

      },
    );
  }

  setNearOpenTorque() {
    if (this.isBleActionBlocked('setNearOpenTorque')) {
      return;
    }
    this.logger.debug(this.TAG, 'setNearOpenSpeed');
    this.vibrate();
    if ((this.device.isDemo) == "true") return;


    let commandData = new Uint8Array(2);
    commandData[0] = 0x04;
    commandData[1] = this.rval_mlpc_proParam_nearOpenTorque;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);

      },
    );
  }

  setNearCloseTorque() {
    if (this.isBleActionBlocked('setNearCloseTorque')) {
      return;
    }
    this.logger.debug(this.TAG, 'setNearCloseSpeed');
    this.vibrate();
    if ((this.device.isDemo) == "true") return;

    let commandData = new Uint8Array(2);
    commandData[0] = 0x05;
    commandData[1] = this.rval_mlpc_proParam_nearCloseTorque;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);

      },
    );
  }




  setShortTiming() {
    if (this.isBleActionBlocked('setShortTiming')) {
      return;
    }
    this.logger.debug(this.TAG, 'SetShortTiming');
    this.vibrate();

    if ((this.device.isDemo) == "true") return;

    let commandData = new Uint8Array(2);
    commandData[0] = 0x03;
    commandData[1] = this.rval_mlpc_userParam_openTimeShort;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'SetShortTiming b0: ' + bytes[1] + 'SetShortTiming b1: ' + bytes[2]);
      },
    );
  }

  setLongTiming() {
    if (this.isBleActionBlocked('setLongTiming')) {
      return;
    }
    this.logger.debug(this.TAG, 'SetShortTiming');

    if ((this.device.isDemo) == "true") return;

    this.vibrate();
    let commandData = new Uint8Array(2);
    commandData[0] = 0x04;
    commandData[1] = this.rval_mlpc_userParam_openTimeLong;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'SetShortTiming b0: ' + bytes[1] + 'SetShortTiming b1: ' + bytes[2]);
      },
    );
  }


  setUserStaticLight() {
    if (this.isBleActionBlocked('setUserStaticLight')) {
      return;
    }
    this.logger.debug(this.TAG, 'setUserStaticLight');
    this.vibrate();

    if ((this.device.isDemo) == "true") return;


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

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
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

    if ((this.device.isDemo) == "true") return;


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

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
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

    if ((this.device.isDemo) == "true") return;


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

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
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

    if ((this.device.isDemo) == "true") return;


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

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'periph nb ' + bytes[1] + 'periph set ' + bytes[2]);
      },
    );
  }

  setUserLock() {
    if (this.isBleActionBlocked('setUserLock')) {
      return;
    }
    this.logger.debug(this.TAG, 'setUserLocker');
    this.vibrate();

    if ((this.device.isDemo) == "true") return;


    let commandData = new Uint8Array(3);
    if (!this.rval_mlpc_proParam_periphs1_lock) {
      commandData[0] = 10;
      commandData[1] = 5
      commandData[2] = 0x02;
    }
    else {
      commandData[0] = 10;
      commandData[1] = 5;
      commandData[2] = 0x01;
    }

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'periph nb ' + bytes[1] + 'periph set ' + bytes[2]);
      },
    );
  }

  setUserRadarTest1() {
    if (this.isBleActionBlocked('setUserRadarTest1')) {
      return;
    }
    this.logger.debug(this.TAG, 'setUserRadarTest1');
    this.vibrate();

    if ((this.device.isDemo) == "true") return;


    let commandData = new Uint8Array(3);
    if (!this.rval_mlpc_proParam_periphs1_radarTest1) {
      commandData[0] = 10;
      commandData[1] = 4;
      commandData[2] = 0x02;
    }
    else {
      commandData[0] = 10;
      commandData[1] = 4;
      commandData[2] = 0x01;
    }

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'periph nb ' + bytes[1] + 'periph set ' + bytes[2]);
      },
    );
  }

  setUserRadarTest2() {
    if (this.isBleActionBlocked('setUserRadarTest2')) {
      return;
    }
    this.logger.debug(this.TAG, 'setUserRadarTest1');
    this.vibrate();

    if ((this.device.isDemo) == "true") return;


    let commandData = new Uint8Array(3);
    if (!this.rval_mlpc_proParam_periphs1_radarTest1) {
      commandData[0] = 10;
      commandData[1] = 3;
      commandData[2] = 0x02;
    }
    else {
      commandData[0] = 10;
      commandData[1] = 3;
      commandData[2] = 0x01;
    }

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
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

    if ((this.device.isDemo) == "true") return;


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

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'periph MSB set ' + bytes[1]);
      },
    );
  }

  setBreakForceAtOpen() {
    if (this.isBleActionBlocked('setBreakForceAtOpen')) {
      return;
    }
    this.logger.debug(this.TAG, 'setBreakForceAtOpen');
    this.vibrate();

    if ((this.device.isDemo) == "true") return;


    let commandData = new Uint8Array(2);
    commandData[0] = 0x01; //exact weight, in widdor : Set break force at open range
    commandData[1] = this.rval_mlpc_proParam_breakForceAtOpen;

    let encodedString = this.randble.bytesToEncodedString(commandData);

    this.randble.write({ address: this.peripheral.address, service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'page: ' + bytes[0] + 'open break force range' + bytes[1]);
      },
    );

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

  private resolveResetDeviceId(): string {
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
        this.logger.info(this.TAG, 'DeviceId reset retenu', {
          deviceId: deviceId,
          source: candidates[i].source
        });
        return deviceId;
      }
    }

    this.logger.error(this.TAG, 'DeviceId reset absent', {
      peripheral: this.peripheral,
      device: this.device,
      connectedPeripheral: connectedPeripheral
    });
    return '';
  }

  private applyResetDefaultLocalValues(): void {
    this.rval_mlpc_userParam_speedOpenTune = 50;
    this.rval_mlpc_userParam_speedCloseTune = 50;
    this.rval_mlpc_userParam_openTimeShort = 3;
    this.rval_mlpc_proParam_breakForceAtOpen = 5;
    this.rval_mlpc_proParam_nearOpenSpeed = 80;
    this.rval_mlpc_proParam_nearCloseSpeed = 70;
    this.rval_mlpc_proParam_periphs1_butOrRadar1 = false;
    this.rval_mlpc_proParam_periphs1_butOrRadar2 = false;
    this.rval_mlpc_proParam_periphs1_lock = false;

    this.logger.info(this.TAG, 'Variables locales reset mises à jour', {
      speedOpenTune: this.rval_mlpc_userParam_speedOpenTune,
      speedCloseTune: this.rval_mlpc_userParam_speedCloseTune,
      openTimeShort: this.rval_mlpc_userParam_openTimeShort,
      breakForceAtOpen: this.rval_mlpc_proParam_breakForceAtOpen,
      nearOpenSpeed: this.rval_mlpc_proParam_nearOpenSpeed,
      nearCloseSpeed: this.rval_mlpc_proParam_nearCloseSpeed,
      input1Button: !this.rval_mlpc_proParam_periphs1_butOrRadar1,
      input2Button: !this.rval_mlpc_proParam_periphs1_butOrRadar2,
      lockDisabled: !this.rval_mlpc_proParam_periphs1_lock
    });
  }

  private async applyResetDefaultParameters(deviceId: string): Promise<void> {
    const writes: Array<{ label: string; service: string; characteristic: string; bytes: number[] }> = [
      { label: 'vitesse ouverture', service: WIDOOR_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, bytes: [0x01, 50] },
      { label: 'vitesse fermeture', service: WIDOOR_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, bytes: [0x02, 50] },
      { label: 'temporisation fermeture courte', service: WIDOOR_SERVICE, characteristic: MLPC_USERPARAM_CHARACTERISTIC, bytes: [0x03, 3] },
      { label: 'force freinage ouverture', service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, bytes: [0x01, 5] },
      { label: 'vitesse fin ouverture', service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, bytes: [0x02, 80] },
      { label: 'vitesse fin fermeture', service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, bytes: [0x03, 70] },
      { label: 'entrée 1 bouton', service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, bytes: [10, 7, 0x02] },
      { label: 'entrée 2 bouton', service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, bytes: [10, 6, 0x02] },
      { label: 'verrou désactivé', service: WIDOOR_SERVICE, characteristic: MLPC_PROPARAM_CHARACTERISTIC, bytes: [10, 5, 0x02] }
    ];

    this.applyResetDefaultLocalValues();
    this.logger.info(this.TAG, 'Début écritures reset paramètres', {
      deviceId: deviceId,
      count: writes.length
    });

    for (let i = 0; i < writes.length; i++) {
      await this.writeResetDefaultStep(deviceId, writes[i]);

      if (i < writes.length - 1) {
        await this.waitResetWriteDelay();
      }
    }

    this.logger.info(this.TAG, 'Fin écritures reset paramètres');
  }

  private async writeResetDefaultStep(deviceId: string, writeStep: { label: string; service: string; characteristic: string; bytes: number[] }): Promise<void> {
    const commandData = new Uint8Array(writeStep.bytes);
    const encodedString = this.randble.bytesToEncodedString(commandData);

    this.logger.info(this.TAG, 'Méthode BLE reset appelée', {
      label: writeStep.label,
      method: 'RandBLE.write',
      address: deviceId,
      service: writeStep.service,
      characteristic: writeStep.characteristic,
      bytes: Array.prototype.slice.call(commandData),
      value: encodedString
    });

    try {
      const returnObj = await this.randble.write({
        address: deviceId,
        service: writeStep.service,
        characteristic: writeStep.characteristic,
        value: encodedString
      });

      this.logger.info(this.TAG, 'Succès écriture BLE reset', {
        label: writeStep.label,
        status: returnObj ? returnObj.status : null,
        value: returnObj ? returnObj.value : null
      });
    } catch (error) {
      this.logger.error(this.TAG, 'Erreur écriture BLE reset', {
        label: writeStep.label,
        service: writeStep.service,
        characteristic: writeStep.characteristic,
        bytes: Array.prototype.slice.call(commandData),
        error: error
      });
      throw error;
    }
  }

  private waitResetWriteDelay(): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), RESET_WRITE_DELAY_MS));
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

        this.logger.info(this.TAG, 'DeviceId Widoor retenu avant ecriture', {
          deviceId: deviceId,
          source: candidates[i].source
        });

        return deviceId;
      }
    }

    this.logger.error(this.TAG, 'DeviceId Widoor absent avant ecriture', {
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
          this.logger.warn(this.TAG, 'Verification connexion Widoor impossible', {
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

  private createNameWriteToastError(message: string, toastMessage: string): any {
    const error: any = new Error(message);
    error.toastMessage = toastMessage;
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
        'Timeout ecriture nom/piece Widoor',
        'WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.RECONNECT_REQUIRED',
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
    this.logger.info(this.TAG, 'Ecriture nom/piece Widoor avec reponse', {
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

    this.logger.info(this.TAG, 'Etat connexion Widoor avant ecriture', {
      deviceId: deviceId,
      connectionStatus: connectionStatus
    });

    if (!deviceId) {
      return Promise.reject(this.createNameWriteError(
        'DeviceId absent pour ecriture nom/piece Widoor',
        'WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_NOT_CONNECTED'
      ));
    }

    return this.isDeviceConnected(deviceId).then((isConnected) => {
      this.logger.info(this.TAG, 'Etat connecte Widoor verifie avant ecriture', {
        deviceId: deviceId,
        connectionStatus: connectionStatus,
        isConnected: isConnected
      });

      if (!isConnected) {
        throw this.createNameWriteError(
          'Motorisation Widoor non connectee avant ecriture nom/piece',
          'WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_NOT_CONNECTED'
        );
      }
    });
  }

  private isBleActionBlocked(action: string): boolean {
    if (this.isBleBusy) {
      this.logger.warn(this.TAG, 'Action BLE Widoor bloquee: operation en cours', { action: action });
      if (!this.isResetInProgress) {
        this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.BLE_BUSY');
      }
      return true;
    }

    if (this.isBleConnectionUnstable) {
      this.logger.warn(this.TAG, 'Action BLE Widoor bloquee: connexion instable', { action: action });
      this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.RECONNECT_REQUIRED');
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

    this.logger.warn(this.TAG, 'Connexion BLE Widoor declaree instable apres ecriture nom/piece', {
      deviceId: deviceId,
      error: error
    });

    if (deviceId) {
      this.logger.warn(this.TAG, 'Deconnexion propre Widoor demandee apres timeout/erreur ecriture nom/piece', {
        deviceId: deviceId
      });

      try {
        await BleClient.disconnect(deviceId);
        this.logger.info(this.TAG, 'Deconnexion propre Widoor effectuee apres ecriture nom/piece instable', {
          deviceId: deviceId
        });
      } catch (disconnectError) {
        this.logger.warn(this.TAG, 'Deconnexion propre Widoor impossible apres ecriture nom/piece instable', {
          deviceId: deviceId,
          error: disconnectError
        });
      }
    }

    this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.RECONNECT_REQUIRED');

    try {
      this.logger.warn(this.TAG, 'Retour page scan Widoor apres connexion instable nom/piece');
      await this.navCtrl.push('ScanPage');
    } catch (navigationError) {
      this.logger.warn(this.TAG, 'Retour page scan Widoor impossible apres connexion instable nom/piece', navigationError);
    }
  }


  SetName(nameToWrite?: string, deviceIdToUse?: string): Promise<any> {
    const valueToWrite = (typeof nameToWrite === 'string' ? nameToWrite : this.userConfig.mlpcName.concat(this.stringLoc)).trim();
    const deviceId = deviceIdToUse || this.resolveNameWriteDeviceId();

    this.logger.info(this.TAG, 'Debut ecriture nom/piece Widoor', {
      deviceId: deviceId,
      value: valueToWrite,
      length: valueToWrite.length
    });

    if (!valueToWrite) {
      return Promise.reject(this.createNameWriteError(
        'Valeur vide pour ecriture nom/piece Widoor',
        'WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.NAME_REQUIRED'
      ));
    }

    if (valueToWrite.length > NAME_WRITE_MAX_LENGTH) {
      return Promise.reject(this.createNameWriteError(
        'Valeur trop longue pour ecriture nom/piece Widoor',
        'WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.NAME_TOO_LONG'
      ));
    }

    const baseNameToWrite = this.stripLocationSuffix(valueToWrite).trim();
    if (!baseNameToWrite) {
      return Promise.reject(this.createNameWriteError(
        'Nom absent pour ecriture nom/piece Widoor',
        'WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.NAME_REQUIRED'
      ));
    }

    if (!this.isNameBaseValid(baseNameToWrite)) {
      return Promise.reject(this.createNameWriteError(
        'Caracteres interdits pour ecriture nom/piece Widoor',
        'WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_INVALID_CHARACTERS'
      ));
    }

    let bytes = this.randble.stringToBytes(valueToWrite);
    let encodedString = this.randble.bytesToEncodedString(bytes); //convertion bytes -> base64 string

    if (this.isDemoDevice()) {
      this.logger.info(this.TAG, 'Ecriture nom/piece Widoor simulee en mode demo', { value: valueToWrite });
      return Promise.resolve({ value: encodedString });
    }

    return this.ensureNameWriteConnection(deviceId).then(() => {
      return this.writeNameWithResponse(deviceId, bytes, encodedString, valueToWrite).then((returnObj) => {
        return {
          returnObj: returnObj
        };
      }).catch((error) => {
        if (this.isNameWriteTimeoutError(error)) {
          this.logger.warn(this.TAG, 'Timeout ecriture nom Widoor detecte: connexion declaree instable, aucune relecture', {
            deviceId: deviceId,
            value: valueToWrite,
            error: error
          });

          throw this.createNameWriteUnstableError(
            'Timeout ecriture nom/piece Widoor',
            'WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.RECONNECT_REQUIRED',
            error
          );
        }

        this.logger.error(this.TAG, 'Erreur ecriture nom Widoor: connexion declaree instable', {
          deviceId: deviceId,
          value: valueToWrite,
          error: error
        });

        throw this.createNameWriteUnstableError(
          'Erreur ecriture nom/piece Widoor',
          'WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.RECONNECT_REQUIRED',
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
        this.logger.info(this.TAG, 'Succes ecriture nom/piece Widoor', {
          deviceId: deviceId,
          value: valueToWrite,
          mode: returnObj && returnObj.mode ? returnObj.mode : 'writeWithResponse'
        });
        this.logger.info(this.TAG, 'Fin ecriture nom/piece Widoor');
        return returnObj;
      },
    ).catch((error) => {
      const normalizedError = this.normalizeNameWriteError(error);
      this.logger.error(this.TAG, 'Erreur ecriture nom/piece Widoor', {
        deviceId: deviceId,
        error: normalizedError
      });
      this.logger.info(this.TAG, 'Fin ecriture nom/piece Widoor en erreur');
      throw normalizedError;
    });


  }

  //dec and inc buttons fct
  private closeSpeedTuneInc() {
    this.vibrate();
    if ((this.device.isDemo) == "true") return;
    if (this.rval_mlpc_userParam_speedCloseTune < 100)
      this.rval_mlpc_userParam_speedCloseTune++;

    this.setCloseSpeedTune();
  }

  private closeSpeedTuneDec() {
    this.vibrate();
    if ((this.device.isDemo) == "true") return;
    if (this.rval_mlpc_userParam_speedCloseTune > 50)
      this.rval_mlpc_userParam_speedCloseTune--;

    this.setCloseSpeedTune();
  }

  private openSpeedTuneInc() {
    this.vibrate();
    if ((this.device.isDemo) == "true") return;
    if (this.rval_mlpc_userParam_speedOpenTune < 100)
      this.rval_mlpc_userParam_speedOpenTune++;

    this.setOpenSpeedTune();
  }

  private openSpeedTuneDec() {
    this.vibrate();
    if ((this.device.isDemo) == "true") return;
    if (this.rval_mlpc_userParam_speedOpenTune > 50)
      this.rval_mlpc_userParam_speedOpenTune--;

    this.setOpenSpeedTune();
  }

  private shortTimingInc() {
    this.vibrate();
    if ((this.device.isDemo) == "true") return;
    if (this.rval_mlpc_userParam_openTimeShort < 60)
      this.rval_mlpc_userParam_openTimeShort++;

    this.setShortTiming();
  }

  private shortTimingDec() {
    this.vibrate();
    if ((this.device.isDemo) == "true") return;
    if (this.rval_mlpc_userParam_openTimeShort > 0)
      this.rval_mlpc_userParam_openTimeShort--;

    this.setShortTiming();
  }

  private longTimingInc() {
    this.vibrate();
    if ((this.device.isDemo) == "true") return;
    if (this.rval_mlpc_userParam_openTimeLong < 60)
      this.rval_mlpc_userParam_openTimeLong++;

    this.setLongTiming();
  }

  private longTimingDec() {
    this.vibrate();
    if ((this.device.isDemo) == "true") return;
    if (this.rval_mlpc_userParam_openTimeLong > 0)
      this.rval_mlpc_userParam_openTimeLong--;

    this.setLongTiming();
  }



  addDemoValues() {


    // this.rval_shDo_userDatesCycles[5] = this.todayDateUint8Array[0];
    //this.rval_shDo_userDatesCycles[4] = this.todayDateUint8Array[1];
    //this.rval_shDo_userDatesCycles[3] = this.todayDateUint8Array[2];

    this.peripheralNameAff = "WidoorEx";

    this.rval_shDo_version_bleStack_major = 1;
    this.rval_shDo_version_bleStack_minor = 2;
    this.rval_shDo_version_bleStack_patch = 3;
    this.rval_shDo_version_bleStack_build = 4;
    this.displayLockSwitch = true;


    this.rval_shdo_motorState_switch_BLE = true;
    this.rval_shdo_motorState_switch_autoManu = false;
    this.rval_shdo_motorState_switch_direction = true
    this.rval_shdo_motorState_switch_pairing = false;


    this.rval_shDo_userDatesCycles_totCyc = 55989;



    this.rval_shDo_proMaintenance_NbInit = 10;
    this.rval_shDo_proMaintenance_NbCyclesSinceInit = 200;
    this.rval_shDo_proMaintenance_NbObsDetect = 2;

    this.rval_shDo_proMaintenance_NbOverHeatingMotor = 0;
    this.rval_shDo_proMaintenance_NbErrorEncoder = 0;
    this.rval_shDo_proMaintenance_NbErrorMotor = 0;

    this.rval_mlpc_userParam_speedOpenTune = 90;
    this.rval_mlpc_userParam_speedCloseTune = 95;
    this.rval_mlpc_userParam_openTimeShort = 4;

    //rval_mlpc_userParam_periphs1: number;
    //rval_mlpc_userParam_periphs2: number;

    this.rval_mlpc_proParam_breakForceAtOpen = 5;
    this.rval_mlpc_proParam_nearOpenSpeed = 90;
    this.rval_mlpc_proParam_nearCloseSpeed = 100;

    //rval_mlpc_proParam_periphs1: number;
    //rval_mlpc_proParam_periphs2: number;
    this.rval_mlpc_proParam_periphs1_butOrRadar1 = false;
    this.rval_mlpc_proParam_periphs1_butOrRadar2 = true;
    this.rval_mlpc_proParam_periphs1_radarTest1 = false;
    this.rval_mlpc_proParam_periphs1_radarTest2 = false;
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
    if (this.isActifVibrate)
      Haptics.vibrate();
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


  setStatus(message: string) {
    this.logger.debug(this.TAG, message);
    this.ngZone.run(() => {
      this.statusMessage = message;
    });
  }

  maintenancePrompt() {
    let trans: any = {};

    if (this.rval_shDo_userDatesCycles[5] != 255) {
      this.translate.get(['MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_MAINTENANCE.MESSAGE', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_MAINTENANCE.MESSAGE2', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.NO.TEXT', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.NO.ROLE', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.YES']).subscribe(
        res => {
          let alert = this.alertCtrl.create({
            title: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.TITLE"], //bien trouvé ca quand même
            message: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_MAINTENANCE.MESSAGE"] + "\n" + this.todayDate + " ?" + "\n\r" + res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_MAINTENANCE.MESSAGE2"],
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
                handler: () => {
                  //faire nécessaire maintenance 
                  this.logger.debug(this.TAG, 'clicked go maintenance done')
                  this.setShdoMaintenanceDate();
                  this.setShdoFirstDate();//La fonction check si c'est bien la première mise en service
                }
              }
            ],
            cssClass: 'alert-warning'
          });
          alert.present();
        });
    } else {
      this.translate.get(['MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_SETUP.MESSAGE', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_SETUP.MESSAGE2', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.NO.TEXT', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.NO.ROLE', 'MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.BUTTONS.YES']).subscribe(
        res => {
          let alert = this.alertCtrl.create({
            title: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.TITLE"], //bien trouvé ca quand même
            message: res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_SETUP.MESSAGE"] + "\n" + this.todayDate + " ?" + "\n\r" + res["MOVENTIV_PAGE.PUTTINGINTOSERVICE_TAB.MAINTENANCE.PROMPT.MESSAGE_SETUP.MESSAGE2"],
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
                handler: () => {
                  //faire nécessaire maintenance 
                  this.logger.debug(this.TAG, 'clicked go setup done')
                  this.setShdoMaintenanceDate();
                  this.setShdoFirstDate();//La fonction check si c'est bien la première mise en service
                  this.readAll();
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

  paramOnClick() {
    this.logger.debug(this.TAG, "paramOnClick()");
    this.readAll();
    this.content.scrollToTop();
    this.paramSubmenuType = 'basic';
  }

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

  async onSubmitformName() {
    if (this.isNameWriteInProgress) {
      this.logger.warn(this.TAG, 'Validation nom/piece Widoor ignoree: ecriture deja en cours');
      this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.WRITE_IN_PROGRESS');
      return;
    }

    if (this.isBleBusy) {
      this.logger.warn(this.TAG, 'Validation nom/piece Widoor ignoree: operation BLE en cours');
      this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.BLE_BUSY');
      return;
    }

    this.isNameWriteInProgress = true;
    this.isBleBusy = true;
    let writeSucceeded = false;
    let deviceId = '';
    this.logger.info(this.TAG, 'Debut validation nom/piece Widoor');

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

      this.logger.info(this.TAG, 'DeviceId utilise validation nom/piece Widoor', { deviceId: deviceId });
      this.logger.info(this.TAG, nameChanged ? 'Nom Widoor a ecrire' : 'Nom Widoor ignore car inchange', { name: baseName });
      this.logger.info(this.TAG, roomChanged ? 'Piece Widoor a ecrire' : 'Piece Widoor ignoree car inchangee', { room: locationSuffix });
      this.logger.info(this.TAG, 'Valeur nom/piece Widoor preparee', {
        deviceId: deviceId,
        value: valueToWrite,
        length: valueToWrite.length
      });

      if (typedName && control && control.hasError('pattern')) {
        control.markAsTouched();
        this.logger.warn(this.TAG, 'Validation nom/piece Widoor bloquee: caracteres interdits', {
          name: typedName
        });
        this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_INVALID_CHARACTERS');
        return;
      }

      if (baseName && !this.isNameBaseValid(baseName)) {
        if (control) {
          control.markAsTouched();
        }
        this.logger.warn(this.TAG, 'Validation nom/piece Widoor bloquee: nom courant contient des caracteres interdits', {
          name: baseName
        });
        this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_INVALID_CHARACTERS');
        return;
      }

      if (typedName && control && !control.valid) {
        control.markAsTouched();
        this.logger.warn(this.TAG, 'Validation nom/piece Widoor bloquee: nom invalide');
        this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_INVALID_NAME');
        return;
      }

      if (!baseName) {
        this.logger.warn(this.TAG, 'Validation nom/piece Widoor bloquee: nom absent');
        this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.NAME_REQUIRED');
        return;
      }

      if (!nameChanged && !roomChanged) {
        this.logger.info(this.TAG, 'Validation nom/piece Widoor terminee sans ecriture: aucune modification');
        this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.NO_CHANGE');
        return;
      }

      if (!valueToWrite) {
        this.logger.warn(this.TAG, 'Validation nom/piece Widoor bloquee: valeur vide');
        this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.NAME_REQUIRED');
        return;
      }

      if (valueToWrite.length > NAME_WRITE_MAX_LENGTH) {
        this.logger.warn(this.TAG, 'Validation nom/piece Widoor bloquee: valeur trop longue', {
          value: valueToWrite,
          length: valueToWrite.length,
          maxLength: NAME_WRITE_MAX_LENGTH
        });
        this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.NAME_TOO_LONG');
        return;
      }

      await this.delay(NAME_WRITE_PRE_DELAY_MS);
      await this.SetName(valueToWrite, deviceId);
      writeSucceeded = true;

      this.updateLocalNameDisplay(baseName, locationSuffix);
      this.logger.info(this.TAG, nameChanged ? 'Succes ecriture nom Widoor' : 'Ecriture nom Widoor non necessaire');
      this.logger.info(this.TAG, roomChanged ? 'Succes ecriture piece Widoor' : 'Ecriture piece Widoor non necessaire');
      this.logger.info(this.TAG, 'Validation nom/piece Widoor reussie');

      if (nameChanged && roomChanged) {
        this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_SUCCESS_NAME_ROOM');
      } else if (roomChanged) {
        this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_SUCCESS_ROOM');
      } else {
        this.showWidoorNameToast('WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_SUCCESS_NAME');
      }
    } catch (error) {
      const nameError: any = error;
      this.logger.error(this.TAG, 'Validation nom/piece Widoor en erreur', error);
      if (error && nameError.unstableConnection) {
        await this.handleNameWriteConnectionUnstable(deviceId, error);
      } else if (error && nameError.toastMessage) {
        this.showWidoorNameToastMessage(nameError.toastMessage);
      } else {
        this.showWidoorNameToast(error && nameError.translationKey ? nameError.translationKey : 'WIDOOR_PAGE.ADJUSTMENTS_TAB.BASIC.SAVE_ERROR');
      }
    } finally {
      if (writeSucceeded) {
        await this.delay(NAME_WRITE_COOLDOWN_MS);
      }
      this.isNameWriteInProgress = false;
      this.isBleBusy = false;
      this.logger.info(this.TAG, 'Fin validation nom/piece Widoor');
    }
  }

  onSubmitformPassword() {
    this.logger.debug(this.TAG, 'submitting form password');
    this.logger.debug(this.TAG, this.userPassword);
    if (this.userPassword == 'password') {
      this.passwordValid = true;
      this.logger.debug(this.TAG, 'Password ok');
    }
    else {
      this.passwordValid = false;
      this.logger.debug(this.TAG, 'Password nok');
    }
  }

  onSubmitformPasswordBCrypt() {
    this.logger.debug(this.TAG, 'submitting form password');
    this.logger.debug(this.TAG, this.userPassword);


    bcrypt.compare("wisavdoor", "$2y$10$28PK5/oKpPwAuLskXdujVu.LwRxiyy.bXXHNahfeiEbWVkvkHpmfq", (err: Error | null, match: boolean) => {
      this.logger.debug(this.TAG, 'BCryptCompare');
      this.logger.debug(this.TAG, 'Match result: ' + match);
      if (match == true) {
        // passwords match
        this.passwordValid = true;
        this.logger.debug(this.TAG, ' match Password BCrypt');
      } else {
        // passwords do not match
        this.logger.debug(this.TAG, 'Password BCrypt');
      }
    });
  }

  private isPasswordValid(field: string) {
    let formField = this.formPassword.get(field);
    this.logger.debug(this.TAG, 'formField');
    return true

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





  onLocChange(event: any) {
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
  stringToBytes(string: string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
      array[i] = string.charCodeAt(i);
    }
    return array.buffer;
  }


  bytesToString(buffer: ArrayBuffer) {
    return String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)));
  }


  //*******************  Popover/loader/toasts  *********************  
  presentPopover(ev: any) {
    let popover = this.popoverCtrl.create('PopoverPage', {
      fromConnected: true
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
          dismissOnPageChange: true,
          content: connectionTranslatePrompt,
          duration: 20000

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

  private showWidoorNameToast(translationKey: string): void {
    this.translate.get(translationKey).subscribe(
      res => {
        let toast = this.toastCtrl.create({
          message: res,
          duration: 3500,
          position: 'bottom'
        });
        toast.present();
      });
  }

  private showWidoorNameToastMessage(message: string): void {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3500,
      position: 'bottom'
    });
    toast.present();
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


  presentReset() {
    this.translate.get('WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.ALERT.PRESENT').subscribe(
      res => {
        let connectionTranslatePrompt = res;

        this.presentResetLoading = this.loadingCtrl.create({
          content: connectionTranslatePrompt,
          duration: 3000

        });

        this.presentResetLoading.present();
        this.logger.debug(this.TAG, 'this.loadingReset.present() : connection');
      });
  }

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

  resetAlert() {
    this.logger.info(this.TAG, 'Bouton reset paramètres cliqué', {
      productPage: 'Widoor',
      requiresPasswordInCurrentUi: false,
      passwordValid: this.passwordValid,
      paramSubmenuType: this.paramSubmenuType
    });
    this.translate.get(['WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.RESETALERT.TITLE', 'WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.RESETALERT.SUBTITLE', 'WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.RESETALERT.BUTTONS.NO.TEXT', 'WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.RESETALERT.BUTTONS.NO.ROLE', 'WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.RESETALERT.BUTTONS.YES']).subscribe(
      res => {
        let alert = this.alertCtrl.create({
          title: res["WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.RESETALERT.TITLE"],
          subTitle: res["WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.RESETALERT.SUBTITLE"],
          buttons: [
            {
              text: res["WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.RESETALERT.BUTTONS.NO.TEXT"],
              role: res["WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.RESETALERT.BUTTONS.NO.ROLE"],
              handler: () => {
                this.logger.debug(this.TAG, 'Reset paramètres annulé');


              }
            },
            {
              text: res["WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.RESETALERT.BUTTONS.YES"],
              handler: () => {
                this.logger.info(this.TAG, 'Confirmation utilisateur reset');
                this.setShutterResetParam();

              }
            }
          ],
        });
        alert.present().then(() => {
          this.logger.info(this.TAG, 'Confirmation reset ouverte');
        }).catch((error) => {
          this.logger.error(this.TAG, 'Erreur ouverture confirmation reset', error);
        });
      });
  }

  async delay(ms: number) {
    await new Promise<void>(resolve => setTimeout(() => resolve(), ms)).then(() => this.logger.debug(this.TAG, "fired"));
  }

  isGreaterVersion3e(majorA: number, minorA: number, patchA: number, patchB: number, majorB: number, minorB: number,) {
    let AisBigger = false;
    if (majorA > majorB) {
      AisBigger = true;
      return AisBigger;
    } else if (minorA > minorB) {
      AisBigger = true;
      return AisBigger;
    } else if (patchA > patchB) {
      AisBigger = true;
      return AisBigger;
    }
    else return AisBigger;

  }






}
