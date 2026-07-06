import { Component, ViewChild } from '@angular/core';
import { App, Config, Platform, NavController, NavParams, Navbar } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { Device } from '@capacitor/device';
import { Haptics } from '@capacitor/haptics';

import { LoadingController } from 'ionic-angular';

import { IonicPage } from 'ionic-angular';
import { LoggerService } from '../../providers/logger/logger.service';

@IonicPage()
@Component({
  selector: 'page-param',
  templateUrl: 'param.html',
})
export class ParamPage {
  private TAG = 'ParamPage';

  @ViewChild(Navbar) navBar!: Navbar;
  toggleLanguageAuto: any;
  selectNgModLang: string = '';
  toggleDispTabInformations: any;
  toggleDispTabSettings: any;
  dispOptionalCom: any;
  toggleMac: any;
  toggleVibrate: any;
  toggleBluetooth: any;
  contentReboot: string = '';
  view_isIos: boolean = false;
  view_isAndroid: boolean = false;
  private supportedLanguageCodes: string[] = ['fr', 'en', 'de', 'pl'];

  constructor(
    public navCtrl: NavController,
    public appCtrl: App,
    public loadingCtrl: LoadingController,
    public navParams: NavParams,
    private storage: Storage,
    private translate: TranslateService,
    private config: Config,
    public platform: Platform,
    private logger: LoggerService
  ) {


    //language
    this.loadStoredJson('StoredIsLanguageAuto', (value) => {
      this.toggleLanguageAuto = value;
    });
    this.loadStoredJson('appLanguage', (value) => {
      this.selectNgModLang = value;
    });
    //display tabs
    this.loadStoredJson('StoredIsVisibleTabInfo', (value) => {
      this.toggleDispTabInformations = value;
    });
    this.loadStoredJson('StoredIsVisibleTabSettings', (value) => {
      this.toggleDispTabSettings = value;
    });
    //display optionnal commands
    this.loadStoredJson('StoredOptComs', (value) => {
      this.dispOptionalCom = value;
    });

    // display mac address in scan page
    this.loadStoredJson('StoredIsVisibleMAC', (value) => {
      this.toggleMac = value;
    });
    // toggle vibrations
    this.loadStoredJson('StoredIsActiveVibrate', (value) => {
      this.toggleVibrate = value;
    });
    //toogle auto BLE
    this.loadStoredJson('StoredIsAutoBluetooth', (value) => {
      this.toggleBluetooth = value;
    });
  }

  private loadStoredJson(key: string, onValue: (value: any) => void) {
    this.storage.get(key).then((value) => {
      onValue(JSON.parse(value));
    }).catch((error) => {
      this.logPromiseError('Failed to read ' + key, error);
    });
  }

  private saveStoredJson(key: string, value: any) {
    this.storage.set(key, JSON.stringify(value)).catch((error) => {
      this.logPromiseError('Failed to save ' + key, error);
    });
  }

  private logPromiseError(message: string, error: any) {
    const typedError: any = error;
    this.logger.error(this.TAG, message, typedError);
  }

  private resolveSupportedLanguage(languageCode: any): string {
    const shortCode = String(languageCode || '').substring(0, 2).toLowerCase();
    return this.supportedLanguageCodes.indexOf(shortCode) > -1 ? shortCode : 'en';
  }

  private getManualLanguageCode(manualLanguage: any): string {
    switch (manualLanguage) {
      case 'manualLang_FR':
        return 'fr';
      case 'manualLang_EN':
        return 'en';
      case 'manualLang_DE':
        return 'de';
      case 'manualLang_PL':
        return 'pl';
      default:
        return 'en';
    }
  }

  private applyLanguage(languageCode: any) {
    const lang = this.resolveSupportedLanguage(languageCode);
    this.translate.use(lang);
    localStorage.setItem("lang", lang);
    this.updateBackButtonText();
  }

  private updateBackButtonText() {
    this.translate.get('GENERIC.BACK').subscribe(
      (res: string) => {
        // Let android keep using only arrow
        this.config.set('ios', 'backButtonText', res);
      });
  }

  //Toggles Functions
  async toggleFctLanguageAuto() {
    this.saveStoredJson('StoredIsLanguageAuto', this.toggleLanguageAuto);
    if (this.toggleLanguageAuto) {

      this.selectNgModLang = 'manualLang_NONE';
      let ln = '';

      try {
        const code = await Device.getLanguageCode();
        ln = code.value;

        this.logger.debug(this.TAG, ln);
        this.applyLanguage(ln);
        } catch(error) {
          const typedError: any = error;
          this.logger.warn(this.TAG, 'Failed to update automatic language', typedError);
        }
      }
    }

  ngModLangChange() {
    this.saveStoredJson('appLanguage', this.selectNgModLang);
    this.applyLanguage(this.getManualLanguageCode(this.selectNgModLang));
    //this.presentLoadingText();
  }

  optComChange() {
    this.logger.debug(this.TAG, 'optionaloptions', this.dispOptionalCom)
    this.saveStoredJson('StoredOptComs', this.dispOptionalCom);
  }

  toggleFctDispTabSet() {
    this.saveStoredJson('StoredIsVisibleTabSettings', this.toggleDispTabSettings);
  }

  toggleFctDispTabInfo() {
    this.saveStoredJson('StoredIsVisibleTabInfo', this.toggleDispTabInformations);
  }

  toggleFctMac() {
    this.saveStoredJson('StoredIsVisibleMAC', this.toggleMac);
  }

  toggleFctVibrate() {
    this.saveStoredJson('StoredIsActiveVibrate', this.toggleVibrate);
    if (this.toggleVibrate) {
        Haptics.vibrate().catch((error) => {
          this.logPromiseError('Failed to trigger vibration', error);
        });
    }
  }

  toggleFctBluetooth() {
    this.saveStoredJson('StoredIsAutoBluetooth', this.toggleBluetooth);
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

    loading.present().catch((error) => {
      this.logPromiseError('Failed to present reboot loading', error);
    });
  }

  //Method to override the default back button action
  private setBackButtonActionSW() {
    this.navBar.backButtonClick = () => {
      //Write here wherever you wanna do
      this.logger.debug(this.TAG, 'backButtonFunc()');
      this.navCtrl.pop().catch((error) => {
        this.logPromiseError('Failed to navigate back from navbar', error);
      });
    }
  }

  private setBackButtonActionHW() {

    this.navCtrl.pop().catch((error) => {
      this.logPromiseError('Failed to navigate back from hardware button', error);
    });

  }

  ionViewWillEnter() {
    this.platform.registerBackButtonAction(() => this.setBackButtonActionHW());
    this.setBackButtonActionSW();
    this.logger.debug(this.TAG, 'ionViewWillEnter');

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
    this.logger.debug(this.TAG, 'ionViewDidLoad ParamPage');
  }

  ionViewCanLeave() {
    //
  }

}
