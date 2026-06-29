import { Component, ViewChild } from '@angular/core';
import { Platform, AlertController, NavController, Config } from 'ionic-angular';

import { StatusBar } from '@capacitor/status-bar';
import { Device } from '@capacitor/device'; // Remplace Globalization
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
import { RandBLE } from '../providers/randble/randble';

import { LoggerService } from '../providers/logger/logger.service';


@Component({
  //templateUrl: 'app.html'
  template: '<ion-nav id="rootNav" #myNav [root]="rootPage"></ion-nav>'
})
export class MyApp {
  @ViewChild('myNav') nav: NavController
  //public rootPage:any = 'ScanPage';
  public rootPage: any; // the root page is not defined until plateform.ready is resolved
  showedAlert: boolean;
  confirmAlert: any = {};
  isLanguageAuto: any;
  selectNgModLang: string;
  private TAG = 'AppComponent';
  private supportedLanguageCodes: string[] = ['fr', 'en', 'de', 'pl'];

  constructor(
    public platform: Platform,
    public alertCtrl: AlertController,
    private translate: TranslateService,
    private storage: Storage,
    private randble: RandBLE,
    private config: Config,
    private logger: LoggerService
  ) {

    platform.ready().then(async () => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.logger.info(this.TAG, 'Platform ready');
      translate.setDefaultLang('fr');

      // -- GESTION STATUS BAR & SPLASH SCREEN --
      if (this.platform.is('hybrid')) {
        try {
          await StatusBar.setOverlaysWebView({ overlay: false });
  
          await StatusBar.setBackgroundColor({ color: '#ffffff' }); 
        } catch(error) {
          const typedError: any = error;
          this.logger.warn(this.TAG, 'Failed to configure status bar', typedError);
        }
      }

      this.storage.get('StoredFirstLaunch').then(async (result) => {

        if (result) {
          this.logger.info(this.TAG, 'Application already launched before', result);

          this.storage.get('StoredIsLanguageAuto').then(async(val) => {
            this.isLanguageAuto = JSON.parse(val);

            if (this.isLanguageAuto) {
              let ln = 'en';
              try {
                const code = await Device.getLanguageCode();
                ln = code.value; // renvoie 'fr', 'en', etc.
              } catch(error) {
                const typedError: any = error;
                this.logger.warn(this.TAG, 'Failed to get device language code', typedError);
              }

              this.logger.info(this.TAG, 'Device language detected', ln);
              this.applyLanguage(ln);
            }
            else {
              this.storage.get('appLanguage').then((val) => {
                this.selectNgModLang = JSON.parse(val);
                this.applyLanguage(this.getManualLanguageCode(this.selectNgModLang));
              }).catch((error) => {
                this.logPromiseError('Failed to read appLanguage', error);
              });
            }


          }).catch((error) => {
            this.logPromiseError('Failed to read StoredIsLanguageAuto', error);
          });

        }
        else {
          this.logger.info(this.TAG, 'First launch detected');

          let ln = 'en';
          try {
            const code = await Device.getLanguageCode();
            ln = code.value;
          } catch(error) {
            const typedError: any = error;
            this.logger.warn(this.TAG, 'Failed to get device language', typedError);
          }

          this.logger.info(this.TAG, 'Detected device language', ln);
          this.applyLanguage(ln);
            this.setStoredJson('StoredIsLanguageAuto', true);
            this.setStoredJson('appLanguage', true);
            this.setStoredJson('StoredIsVisibleTabSettings', true);
            this.setStoredJson('StoredIsVisibleTabInfo', true);
            this.setStoredJson('StoredOptComs', ["dispOptionalCom_MO", "dispOptionalCom_LC", "dispOptionalCom_LLB"]);
            this.setStoredJson('StoredIsVisibleMAC', false);
            this.setStoredJson('StoredIsActiveVibrate', false);
            this.setStoredJson('StoredFirstLaunch', true);
            this.setStoredJson('StoredIsAutoBluetooth', true);
        }

        this.rootPage = 'ScanPage'; //define when we know the language + pref are loaded (including lang pref...)
      }).catch((error) => {
        this.logPromiseError('Failed to read StoredFirstLaunch', error);
      });

      this.platform.registerBackButtonAction(() => {
        this.logger.debug(this.TAG, 'Back button pressed');

        if (this.nav.length() == 1) {
          if (!this.showedAlert) {
            this.confirmExitApp();
          } else {
            this.showedAlert = false;
            if (this.confirmAlert && this.confirmAlert.dismiss) {
              this.confirmAlert.dismiss().catch((error) => {
                this.logPromiseError('Failed to dismiss exit confirmation dialog', error);
              });
            }
          }
        }
        else {
          this.nav.pop({}).catch((error) => {
            this.logPromiseError('Failed to navigate back', error);
          });
        }
      });

    }).catch((error) => {
      this.logPromiseError('Platform ready failed', error);
    });
  }

  private setStoredJson(key: string, value: any) {
    this.storage.set(key, JSON.stringify(value)).catch((error) => {
      this.logPromiseError('Failed to save ' + key, error);
    });
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

  private logPromiseError(message: string, error: any) {
    const typedError: any = error;
    this.logger.error(this.TAG, message, typedError);
  }


  confirmExitApp() {

    this.translate.get(['SCAN_PAGE.QUIT_PROMPT.MESSAGE', 'SCAN_PAGE.QUIT_PROMPT.BUTTONS.NO', 'SCAN_PAGE.QUIT_PROMPT.BUTTONS.YES']).subscribe(
      (res) => {
        this.logger.debug(this.TAG, 'Exit confirmation dialog opened', res);

        this.showedAlert = true;
        this.confirmAlert = this.alertCtrl.create({
          title: "",
          message: res["SCAN_PAGE.QUIT_PROMPT.MESSAGE"],
          buttons: [
            {
              text: res["SCAN_PAGE.QUIT_PROMPT.BUTTONS.NO"],
              handler: () => {
                this.showedAlert = false;
                return;
              }
            },
            {
              text: res["SCAN_PAGE.QUIT_PROMPT.BUTTONS.YES"],
              handler: () => {

                //désactivation du Bluetooth
                this.storage.get('StoredIsAutoBluetooth').then((val) => {
                  let bleAutoTrue = JSON.parse(val);

                  this.randble.isEnabled().then((val) => {
                    this.logger.info(this.TAG, 'BLE state', val.isEnabled);
                    // if Enable then disable it if auto true
                    if (val.isEnabled) {
                      if (bleAutoTrue)
                        if (this.platform.is('android')) {
                          { this.randble.stopScan().catch((error) => {
                            this.logPromiseError('Failed to stop BLE scan before exit', error);
                          }); }
                        }
                      this.logger.debug(this.TAG, 'BLE enabled, stopping scan if required');
                    }
                  }).catch((error) => {
                    this.logPromiseError('Failed to read BLE state before exit', error);
                  });
                }).catch((error) => {
                  this.logPromiseError('Failed to read StoredIsAutoBluetooth before exit', error);
                });

                this.platform.exitApp();
              }
            }
          ]
        });

        this.confirmAlert.present().catch((error) => {
          this.logPromiseError('Failed to present exit confirmation dialog', error);
        });
      });
  }




}




