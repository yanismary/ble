import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, Navbar } from 'ionic-angular';


/**
 * Generated class for the WhoPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-who',
  templateUrl: 'who.html',
})
export class WhoPage {

  @ViewChild(Navbar) navBar: Navbar;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
  ) { }



  //page life cycle
  ionViewDidLoad() {
    console.log('ionViewDidLoad WhoPage');
  }

  ionViewWillEnter() {
    this.platform.registerBackButtonAction(() => this.setBackButtonActionHW());
    this.setBackButtonActionSW();
    console.log('ionViewWillEnter');
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
      console.log('backButtonFunc()');
      this.navCtrl.pop();
    }
  }

  private setBackButtonActionHW() {

    this.navCtrl.pop();

  }

}