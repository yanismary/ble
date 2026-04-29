import { Component, ViewChild } from '@angular/core';
import { Platform, AlertController, NavController, Config } from 'ionic-angular';

import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Device } from '@capacitor/device'; // Remplace Globalization
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
import { RandBLE } from '../providers/randble/randble';

import { LoggerService } from '../providers/logger/logger.service';


@Component({
  //templateUrl: 'app.html'
  template: '<ion-nav #myNav [root]="rootPage"></ion-nav>'
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
        } catch(e) { console.warn(e); }
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
              } catch(e) {
                this.logger.warn(this.TAG, 'Failed to get device language code', e);
              }

              this.logger.info(this.TAG, 'Device language detected', ln);
              if (ln.substring(0, 2) === 'fr') { //we select the first part of the BCP-47 id tag : sp ISO 639-1 alpha-2 (language tag)                 
                translate.use('fr');
                localStorage.setItem("lang", "fr");
              }
              else if (ln.substring(0, 2) === "en") {
                translate.use('en');
                localStorage.setItem("lang", "en");
              }
              else if (ln.substring(0, 2) === "de") {
                translate.use('de');
                localStorage.setItem("lang", "en");
              }
              else {
                // translate.setDefaultLang('en');//def language is english
                translate.use('en');
                localStorage.setItem("lang", "2");
              }
              //back arrow translation on ios
              this.translate.get('GENERIC.BACK').subscribe(
                (res: string) => {
                  // Let android keep using only arrow
                  this.config.set('ios', 'backButtonText', res);
                });
            }
            else {
              this.storage.get('appLanguage').then((val) => {
                this.selectNgModLang = JSON.parse(val);
                if (this.selectNgModLang === 'manualLang_FR') {
                  translate.use('fr');
                  localStorage.setItem("lang", "fr");
                }
                else if (this.selectNgModLang === "manualLang_EN") {
                  translate.use('en');
                  localStorage.setItem("lang", "en");
                }
                else if (this.selectNgModLang === "manualLang_DE") {
                  translate.use('de');
                  localStorage.use("lang", "en");
                }
                else {
                  translate.setDefaultLang('en');//def language is english
                  translate.use('en');
                  localStorage.setItem("lang", "2");
                }


              });
            }


          });

        }
        else {
          this.logger.info(this.TAG, 'First launch detected');

          let ln = 'en';
          try {
            const code = await Device.getLanguageCode();
            ln = code.value;
          } catch(e) {
            this.logger.warn(this.TAG, 'Failed to get device language', e);
          }

          this.logger.info(this.TAG, 'Detected device language', ln);
          if (ln.substring(0, 2) === 'fr') { //we select the first part of the BCP-47 id tag : sp ISO 639-1 alpha-2 (language tag)
            translate.use('fr');
            localStorage.setItem("lang", "fr");                
          }
          else if (ln.substring(0, 2) === "en") {
            translate.use('en');
            localStorage.setItem("lang", "en");
          }
          else if (ln.substring(0, 2) === "de") {
            translate.use('de');
            localStorage.setItem("lang", "de");
          }
          else {
            translate.use('en');
            localStorage.setItem("lang", "en");
          }
          //back arrow translation on ios
          this.translate.get('GENERIC.BACK').subscribe(
            (res: string) => {
              // Let android keep using only arrow
              this.config.set('ios', 'backButtonText', res);
            });
            this.storage.set('StoredIsLanguageAuto', JSON.stringify(true));
            this.storage.set('appLanguage', JSON.stringify(true));
            this.storage.set('StoredIsVisibleTabSettings', JSON.stringify(true));
            this.storage.set('StoredIsVisibleTabInfo', JSON.stringify(true));
            this.storage.set('StoredOptComs', JSON.stringify(["dispOptionalCom_MO", "dispOptionalCom_LC", "dispOptionalCom_LLB"]));
            this.storage.set('StoredIsVisibleMAC', JSON.stringify(false));
            this.storage.set('StoredIsActiveVibrate', JSON.stringify(false));
            this.storage.set('StoredFirstLaunch', JSON.stringify(true));
            this.storage.set('StoredIsAutoBluetooth', JSON.stringify(true));
        }

        this.rootPage = 'ScanPage'; //define when we know the language + pref are loaded (including lang pref...)
      });

      this.platform.registerBackButtonAction(() => {
        this.logger.debug(this.TAG, 'Back button pressed');

        if (this.nav.length() == 1) {
          if (!this.showedAlert) {
            this.confirmExitApp();
          } else {
            this.showedAlert = false;
            this.confirmAlert.dismiss();
          }
        }
        else {
          this.nav.pop({});
        }
      });

    });
  }


  confirmExitApp() {

    this.translate.get(['SCAN_PAGE.QUIT_PROMPT.MESSAGE', 'SCAN_PAGE.QUIT_PROMPT.BUTTONS.NO', 'SCAN_PAGE.QUIT_PROMPT.BUTTONS.YES']).subscribe(
      (res) => {
        this.logger.debug(this.TAG, 'Exit confirmation dialog opened', res);

        this.showedAlert = true;
        let confirmAlert = this.alertCtrl.create({
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
                          { this.randble.stopScan(); }
                        }
                      this.logger.debug(this.TAG, 'BLE enabled, stopping scan if required');
                    }
                  })
                });

                this.platform.exitApp();
              }
            }
          ]
        });

        confirmAlert.present();
      });
  }




}




