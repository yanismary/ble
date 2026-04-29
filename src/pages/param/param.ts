import { Component, NgZone, ViewChild } from '@angular/core';
import { App, Config, Platform, NavController, NavParams, Navbar } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { Device } from '@capacitor/device';
import { Haptics } from '@capacitor/haptics';

import { LoadingController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { FormGroup, FormBuilder, FormControl, Validators, ValidatorFn, AbstractControl } from "@angular/forms"
import 'rxjs/add/operator/toPromise';

import { IonicPage } from 'ionic-angular';

/**
 * Generated class for the ParamPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-param',
  templateUrl: 'param.html',
})
export class ParamPage {

  @ViewChild(Navbar) navBar: Navbar;
  //var declaration
  toggleLanguageAuto: any;
  selectNgModLang: string;
  toogleMac: any;
  toggleDispTabInformations: any;
  toggleDispTabSettings: any;
  dispOptionalCom: any;
  toggleMac: any;
  toggleVibrate: any;
  toggleBluetooth: any;
  contentReboot: string;
  view_isIos: boolean;
  view_isAndroid: boolean;
  userPassword: string;
  passwordValid: boolean = false;
  formPassword: FormGroup;
  validation_messages: any;
  formName: FormGroup;

  constructor(
    public navCtrl: NavController,
    public appCtrl: App,
    public loadingCtrl: LoadingController,
    public navParams: NavParams,
    private storage: Storage,
    private translate: TranslateService,
    private config: Config,
    private ngZone: NgZone,
    public platform: Platform,
    public formBuilder: FormBuilder
  ) {


    //language
    this.storage.get('StoredIsLanguageAuto').then((val) => {
      this.toggleLanguageAuto = JSON.parse(val);
    });
    this.storage.get('appLanguage').then((val) => {
      this.selectNgModLang = JSON.parse(val);
    });
    //display tabs
    this.storage.get('StoredIsVisibleTabInfo').then((val) => {
      this.toggleDispTabInformations = JSON.parse(val);
    });
    this.storage.get('StoredIsVisibleTabSettings').then((val) => {
      this.toggleDispTabSettings = JSON.parse(val);
    });
    //display optionnal commands
    this.storage.get('StoredOptComs').then((val) => {
      this.dispOptionalCom = JSON.parse(val);
    });

    // display mac address in scan page
    this.storage.get('StoredIsVisibleMAC').then((val) => {
      this.toggleMac = JSON.parse(val);
    });
    // toggle vibrations
    this.storage.get('StoredIsActiveVibrate').then((val) => {
      this.toggleVibrate = JSON.parse(val);
    });
    //toogle auto BLE
    this.storage.get('StoredIsAutoBluetooth').then((val) => {
      this.toggleBluetooth = JSON.parse(val);
    });
  }

  //Toggles Functions
  async toggleFctLanguageAuto() {
    this.storage.set('StoredIsLanguageAuto', JSON.stringify(this.toggleLanguageAuto));
    if (this.toggleLanguageAuto) {

      this.selectNgModLang = 'manualLang_NONE';
      let ln = '';

      try {
        const code = await Device.getLanguageCode();
        ln = code.value;

        console.log(ln);
        if (ln.substring(0, 2) === 'fr') { //we select the first part of the BCP-47 id tag : sp ISO 639-1 alpha-2 (language tag)                 
          this.translate.use('fr');
          localStorage.setItem("lang", "fr");
        }
        else if (ln.substring(0, 2) === "en") {
          this.translate.use('en');
          localStorage.setItem("lang", "en");
        }
        else if (ln.substring(0, 2) === "de") {
          this.translate.use('de');
          localStorage.setItem("lang", "de");
        }
        else {
          // translate.setDefaultLang('en');//def language is english
          this.translate.use('en');
          localStorage.setItem("lang", "en");
        }
        //back arrow translation on ios
        this.translate.get('GENERIC.BACK').subscribe(
          (res: string) => {
            // Let android keep using only arrow
            this.config.set('ios', 'backButtonText', res);
          });
        } catch(e) { 
          console.log(e);
        }
      }
    }

  ngModLangChange() {
    this.storage.set('appLanguage', JSON.stringify(this.selectNgModLang));
    if (this.selectNgModLang === 'manualLang_FR') {
      this.translate.use('fr');
      localStorage.setItem("lang", "fr");
      this.translate.get('GENERIC.BACK').subscribe(
        (res: string) => {
          // Let android keep using only arrow
          this.config.set('ios', 'backButtonText', res);
        });
    }
    else if (this.selectNgModLang === 'manualLang_EN') {
      this.translate.use('en');
      localStorage.setItem("lang", "en");
      this.translate.get('GENERIC.BACK').subscribe(
        (res: string) => {
          // Let android keep using only arrow
          this.config.set('ios', 'backButtonText', res);
        });
    }
    else if (this.selectNgModLang === 'manualLang_DE') {
      this.translate.use('de');
      localStorage.setItem("lang", "de");
      this.translate.get('GENERIC.BACK').subscribe(
        (res: string) => {
          // Let android keep using only arrow
          this.config.set('ios', 'backButtonText', res);
        });
    }
    else {
      this.translate.use('en');
      localStorage.setItem("lang", "en");
      this.translate.get('GENERIC.BACK').subscribe(
        (res: string) => {
          // Let android keep using only arrow
          this.config.set('ios', 'backButtonText', res);
        });
    }
    //this.presentLoadingText();
  }

  optComChange() {
    console.log('optionaloptions', this.dispOptionalCom)
    this.storage.set('StoredOptComs', JSON.stringify(this.dispOptionalCom));
  }

  toggleFctDispTabSet() {
    this.storage.set('StoredIsVisibleTabSettings', JSON.stringify(this.toggleDispTabSettings));
  }

  toggleFctDispTabInfo() {
    this.storage.set('StoredIsVisibleTabInfo', JSON.stringify(this.toggleDispTabInformations));
  }

  toggleFctMac() {
    this.storage.set('StoredIsVisibleMAC', JSON.stringify(this.toggleMac));
  }

  toggleFctVibrate() {
    this.storage.set('StoredIsActiveVibrate', JSON.stringify(this.toggleVibrate));
    if (this.toggleVibrate) {
        Haptics.vibrate();
    }
  }

  toggleFctBluetooth() {
    this.storage.set('StoredIsAutoBluetooth', JSON.stringify(this.toggleBluetooth));
  }

  presentLoadingText() {
    this.translate.get('PARAM_PAGE.LOADINGTEXT_REBOOT').subscribe(res => {
      this.contentReboot = res;
    });
    let loading = this.loadingCtrl.create({
      spinner: 'hide',
      content: this.contentReboot,
      duration: 1000
    });

    loading.present();
  }

  onSubmitformPassword() {
    console.log('submitting form password');
    console.log(this.userPassword);
    if (this.userPassword == 'wisavdoor') {
      this.passwordValid = true;
      console.log('Password ok');
    }
    else {
      this.passwordValid = false;
      console.log('Password nok');
    }
  }

  private isPasswordValid(field: string) {
    let formField = this.formPassword.get(field);
    console.log('formField');
    return true

  }

  //Method to override the default back button action
  private setBackButtonActionSW() {
    this.navBar.backButtonClick = () => {
      //Write here wherever you wanna do
      console.log('backButtonFunc()');
      this.navCtrl.pop();
    }
  }

  private setBackButtonActionHW() {

    this.navCtrl.pop();

  }

  /*********************************************************************************************************************************************************************/
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


  ionViewWillEnter() {
    this.platform.registerBackButtonAction(() => this.setBackButtonActionHW());
    this.setBackButtonActionSW();
    console.log('ionViewWillEnter');

    if (this.platform.is('ios')) {
      this.view_isIos = true;
    }
    else {
      this.view_isIos = false;
    }
    if (this.platform.is('android')) {
      this.view_isAndroid = true;
    }
    else {
      this.view_isAndroid = false;
    }

  }

  ionViewDidEnter() {
    //
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ParamPage');
  }

  ionViewCanLeave() {
    //
  }

}
