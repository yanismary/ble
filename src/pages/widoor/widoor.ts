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

  //logic connection
  loading: any = {};
  presentResetLoading: any = {};
  promptReading: any = {};
  peripheralNameAff!: any;
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
    this.peripheral = peripheral;

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

    if ((this.device.isDemo) == "true") return;

    this.readMotorState();
    this.readVersion();
    this.readUserDatesCycles();
    this.readProMaintenance();
    this.readUserParam();
    this.readProParam();
  }

  readMotorState() {
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

  setShutterResetParam() {
    this.logger.debug(this.TAG, 'SetDoorResetParam');
    this.vibrate();
    if ((this.device.isDemo) == "true") return;


    let commandData = new Uint8Array(2);
    commandData[0] = 0x00;
    commandData[1] = 0x01;

    let encodedString = this.randble.bytesToEncodedString(commandData);


    this.randble.write({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_COMMAND_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'page : ' + bytes[0] + 'setDoorResetParam ' + bytes[1] + 'b1: ' + bytes[2] + 'b2: ' + bytes[3]);
        if ((bytes[0] == commandData[0]) && (bytes[1] == commandData[1]) && (bytes[2] == commandData[2])) {
          this.logger.debug(this.TAG, 'BLE transmission OK');
          this.presentReset();
          this.readAll();
        }
      },
    );
  }


  setShdoMaintenanceDate() {
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


  SetName() {
    this.logger.debug(this.TAG, 'SetName');

    let bytes = this.randble.stringToBytes(this.userConfig.mlpcName.concat(this.stringLoc));
    let encodedString = this.randble.bytesToEncodedString(bytes); //convertion bytes -> base64 string

    this.randble.write({ address: this.peripheral.address, service: SHDO_SERVICE, characteristic: SHDO_NAME_CHARACTERISTIC, value: encodedString }).then(
      (returnObj) => {
        let bytes = this.randble.encodedStringToBytes(returnObj.value);
        let returnString = this.randble.bytesToString(bytes);
        this.logger.debug(this.TAG, 'setName :' + returnString);
      },
    );


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
      'mlpcName': ['wtf', [Validators.required, Validators.minLength(5), Validators.maxLength(15), Validators.pattern('[a-zA-Z0-9,.;:_-]*')]]
    });
    this.formPassword = this.formBuilder.group({
      'mlpcPassword': ['', [Validators.required, Validators.maxLength(20)]]
    });
  }





  onSubmitformName() {
    this.logger.debug(this.TAG, 'submitting form Name');
    this.SetName();
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
    if (!control.value.match('[a-zA-Z0-9,.;:_-]*')) {
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

      });

    this.presentResetLoading.present();
    this.logger.debug(this.TAG, 'this.loadingReset.present() : connection');
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
                this.logger.debug(this.TAG, 'clicked Cancel');


              }
            },
            {
              text: res["WIDOOR_PAGE.ADJUSTMENTS_TAB.ADVANCED.RESETALERT.BUTTONS.YES"],
              handler: () => {
                this.setShutterResetParam();

              }
            }
          ],
        });
        alert.present();
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


