import { Component } from '@angular/core';
import { NavController, NavParams, App } from 'ionic-angular';
import { IonicPage, ViewController } from 'ionic-angular';
import { LoggerService } from '../../providers/logger/logger.service';



/**
 * Generated class for the PopoverComponent component.
 *
 * See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
 * for more info on Angular Components.
 */
@IonicPage()
@Component({
  selector: 'popover',
  templateUrl: 'popover.html'
})
export class PopoverPage {
  private TAG = 'PopoverPage';
  private logger: LoggerService = new LoggerService();
  fromConnected :boolean;


  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public app: App,
    
  ) {
    this.fromConnected = this.navParams.get('fromConnected');
    this.logger.debug(this.TAG, 'Hello PopoverComponent Component');

  }
  //@ViewChild(Navbar) navBar: Navbar;

  private openPage(page: string): void {
    this.logger.info(this.TAG, 'Clic menu', { page: page });

    const nav = this.app.getRootNav();
    this.logger.info(this.TAG, 'Navigation menu via root nav', { page: page });

    this.viewCtrl.dismiss().then(() => {
      return nav.push(page);
    }).catch(error => {
      this.logger.error(this.TAG, 'Erreur navigation menu', error);
    });
  }

/*
  onViewDidLoad() {
    this.navBar.backButtonClick = () => {
      // you can set a full custom history here if you want 
        let pages = [
	      {
			page: 'ScanPage'
		  }
	    ];
	    this.navCtrl.setPages(pages);
	}
}
*/

  pushParamsPage(){
    this.logger.info(this.TAG, 'Clic pushParamsPage');
    this.openPage('ParamPage');
  }


  pushAboutPage(){
    this.logger.info(this.TAG, 'Clic pushAboutPage');
    this.openPage('AboutPage');
  }

  pushWhoPage(){
    this.logger.info(this.TAG, 'Clic pushWhoPage');
    this.openPage('WhoPage');
  }
  
  pushContactPage(){
    this.logger.info(this.TAG, 'Clic pushContactPage');
    this.openPage('ContactPage');
  }


  pushGcuPage(){
    this.logger.info(this.TAG, 'Clic pushGcuPage');
    this.openPage('GcuPage');
  }

  pushHelpPage(){
    this.logger.info(this.TAG, 'Clic pushHelpPage');
    this.openPage('HelpPage');
  }


}



