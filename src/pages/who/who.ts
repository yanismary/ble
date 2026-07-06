import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, Navbar } from 'ionic-angular';
import { LoggerService } from '../../providers/logger/logger.service';

@IonicPage()
@Component({
  selector: 'page-who',
  templateUrl: 'who.html',
})
export class WhoPage {
  private TAG = 'WhoPage';

  @ViewChild(Navbar) navBar!: Navbar;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
    private logger: LoggerService,
  ) { }



  //page life cycle
  ionViewDidLoad() {
    this.logger.debug(this.TAG, 'ionViewDidLoad WhoPage');
  }

  ionViewWillEnter() {
    this.platform.registerBackButtonAction(() => this.setBackButtonActionHW());
    this.setBackButtonActionSW();
    this.logger.debug(this.TAG, 'ionViewWillEnter');
  }

  ionViewDidEnter() {
    //cosmetic
    //this.nativePageTransitions.fade(null);
  }

  ionViewCanLeave() {
    // this.navCtrl.popToRoot();
  }


  //Method to override the default back button action
  private setBackButtonActionSW() {
    this.navBar.backButtonClick = () => {
      //Write here wherever you wanna do
      this.logger.debug(this.TAG, 'backButtonFunc()');
      this.navCtrl.pop();
    }
  }

  private setBackButtonActionHW() {

    this.navCtrl.pop();

  }

}

