import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Navbar, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { LoggerService } from '../../providers/logger/logger.service';

/**
 * Generated class for the HelpPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-help',
  templateUrl: 'help.html',
})
export class HelpPage {

  showPairing:boolean;
  showPairingTroubles:boolean;
  isAndroid:boolean;
  isIos:boolean;
  private TAG = 'HelpPage';

  @ViewChild(Navbar) navBar: Navbar;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private translate: TranslateService,
    public platform: Platform,
    private logger: LoggerService,
    ) {
  }


  hAll(){
  this.showPairing = false;
  this.showPairingTroubles = false;
}

  hsPairing(){
    let saveshowPairing=this.showPairing;
    this.hAll();
    this.showPairing = !saveshowPairing; 
  }

  hsPairingTroubles(){
    let saveshowPairingTroubles=this.showPairingTroubles;
    this.hAll();
    this.showPairingTroubles = !saveshowPairingTroubles; 
  }




  ionViewDidLoad() {
    this.logger.debug(this.TAG, 'ionViewDidLoad');
  }

  ionViewWillEnter() {
    if (this.platform.is('android')){
      this.isAndroid = true;
      this.isIos = false;
      
    }
    else if (this.platform.is('ios')){
      this.isAndroid = false;
      this.isIos = true;
    }

    this.logger.info(this.TAG, 'Platform detected', { android: this.isAndroid, ios: this.isIos });
  
    this.platform.registerBackButtonAction(() => this.setBackButtonActionHW());
    this.setBackButtonActionSW();
    this.logger.debug(this.TAG, 'ionViewWillEnter');
    this.showPairing = false;
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
    this.logger.debug(this.TAG, 'Hardware back button pressed');

  }


}
