import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, Navbar } from 'ionic-angular';
import { App } from '@capacitor/app';

import { LoggerService } from '../../providers/logger/logger.service';

/**
 * Generated class for the AboutPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-about',
  templateUrl: 'about.html',
})
export class AboutPage {

  @ViewChild(Navbar) navBar!: Navbar;

  app_Version: string = '';
  private TAG = 'AboutPage';

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
    private logger: LoggerService
  ) { }



  //page life cycle
  ionViewDidLoad() {
    this.logger.debug(this.TAG, 'ionViewDidLoad');
  }

  ionViewWillEnter() {
    this.platform.registerBackButtonAction(() => this.setBackButtonActionHW());
    this.setBackButtonActionSW();
    this.logger.debug(this.TAG, 'ionViewWillEnter');
  }

  ionViewDidEnter() {
    this.get_appVersion();
  }

  ionViewCanLeave() {
    // this.navCtrl.popToRoot();
  }


  //Method to override the default back button action
  private setBackButtonActionSW() {
    this.navBar.backButtonClick = () => {
      //Write here wherever you wanna do
      this.logger.debug(this.TAG, 'Navbar back button clicked (SW)');
      this.navCtrl.pop();
    }
  }

  private setBackButtonActionHW() {

    this.navCtrl.pop();
  }

  async get_appVersion() {
    try {
      const info = await App.getInfo();
      this.app_Version = info.version;
      this.logger.info(this.TAG, 'App version loaded', this.app_Version);
    } catch (e) {
      this.logger.error(this.TAG, 'Failed to get app version', e);
      this.app_Version = '1.0.0'; // Valeur par défaut si erreur
    }
  }

}
