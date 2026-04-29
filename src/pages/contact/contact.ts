import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Platform, Navbar, IonicPage} from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { LoggerService } from '../../providers/logger/logger.service';


/**
 * Generated class for the ContactPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html',
})
export class ContactPage {

  @ViewChild(Navbar) navBar: Navbar;
  //translate string
  translate_cp_c1_sc: string;
  translate_cp_c1_to: string;
  translate_cp_c1_cc: string;
  translate_cp_c1_s: string;
  translate_cp_c1_body: string;
  translate_cp_c2_sc: string;
  translate_cp_c2_to: string;
  translate_cp_c2_cc: string;
  translate_cp_c2_s: string;
  translate_cp_c2_body: string;

  fromConnected: boolean;

  private TAG = 'ContactPage';

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private translate: TranslateService,
    public platform: Platform,
    private logger: LoggerService,
  ) {

    this.translate.get('CONTACT_PAGE.CONTACT_1.PHONE.SYSTEMCALL').subscribe(res => {
      this.translate_cp_c1_sc = res;
    });
    this.translate.get('CONTACT_PAGE.CONTACT_1.SEND_MESSAGE.TO').subscribe(res => {
      this.translate_cp_c1_to = res;
    });
    this.translate.get('CONTACT_PAGE.CONTACT_1.SEND_MESSAGE.CC').subscribe(res => {
      this.translate_cp_c1_cc = res;
    });
    this.translate.get('CONTACT_PAGE.CONTACT_1.SEND_MESSAGE.SUBJECT').subscribe(res => {
      this.translate_cp_c1_s = res;
    });
    this.translate.get('CONTACT_PAGE.CONTACT._1.SEND_MESSAGE.BODY').subscribe(res => {
      this.translate_cp_c1_body = res;
    });
    this.translate.get('CONTACT_PAGE.CONTACT_2.PHONE.SYSTEMCALL').subscribe(res => {
      this.translate_cp_c2_sc = res;
    });
    this.translate.get('CONTACT_PAGE.CONTACT_2.SEND_MESSAGE.TO').subscribe(res => {
      this.translate_cp_c2_to = res;
    });
    this.translate.get('CONTACT_PAGE.CONTACT_2.SEND_MESSAGE.CC').subscribe(res => {
      this.translate_cp_c2_cc = res;
    });
    this.translate.get('CONTACT_PAGE.CONTACT_2.SEND_MESSAGE.SUBJECT').subscribe(res => {
      this.translate_cp_c2_s = res;
    });
    this.translate.get('CONTACT_PAGE.CONTACT_2.SEND_MESSAGE.BODY').subscribe(res => {
      this.translate_cp_c2_body = res;
    });

  }

  // Fonction utilitaire pour construire le lien mailto proprement
  private openMail(to: string, cc: string, subject: string, body: string) {
    const link = `mailto:${to}?cc=${cc}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(link, '_system');
    this.logger.debug(this.TAG, 'Opening mailto link', { to, cc, subject });
  }

  sendMessageType1() {
    this.openMail(
      this.translate_cp_c1_to,
      this.translate_cp_c1_cc,
      this.translate_cp_c1_s,
      this.translate_cp_c1_body
    );
    this.logger.info(this.TAG, 'sendMessageType1 triggered');
  }

  sendMessageType2() {
    this.openMail(
      this.translate_cp_c2_to,
      this.translate_cp_c2_cc,
      this.translate_cp_c2_s,
      this.translate_cp_c2_body
    );
    this.logger.info(this.TAG, 'sendMessageType2 triggered');
  }

  callPhoneNumberType1() {
    window.open('tel:' + this.translate_cp_c1_sc, '_system');
    this.logger.info(this.TAG, 'callPhoneNumberType1 triggered', this.translate_cp_c1_sc);
  }

  callPhoneNumberType2() {
    window.open('tel:' + this.translate_cp_c2_sc, '_system');
    this.logger.info(this.TAG, 'callPhoneNumberType2 triggered', this.translate_cp_c2_sc);
  }

  //lifecycle

  ionViewDidLoad() {
    this.logger.debug(this.TAG, 'ionViewDidLoad');
  }

  ionViewWillEnter() {
    this.platform.registerBackButtonAction(() => this.setBackButtonActionHW());
    this.setBackButtonActionSW();
    this.logger.debug(this.TAG, 'ionViewWillEnter');
  }

  ionViewDidEnter() {
    //cosmetic

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
  }


}
