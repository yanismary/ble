import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams,  Navbar, Platform} from 'ionic-angular';
import { LoggerService } from '../../providers/logger/logger.service';

@IonicPage()
@Component({
  selector: 'page-gcu',
  templateUrl: 'gcu.html',
})
export class GcuPage {

  private TAG = 'GcuPage';
  @ViewChild(Navbar) navBar!: Navbar;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
    private logger: LoggerService,
    ) {
  }

  ionViewWillEnter() {
    this.platform.registerBackButtonAction(() => this.setBackButtonActionHW());
    this.setBackButtonActionSW();
    this.logger.debug(this.TAG, 'ionViewWillEnter');
  }

  ionViewDidEnter() {
    //cosmetic
        }

  ionViewDidLoad() {
    this.logger.debug(this.TAG, 'ionViewDidLoad');
  }

  ionViewCanLeave() {
    //this.navCtrl.popToRoot();
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
