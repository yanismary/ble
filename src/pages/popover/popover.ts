import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, App,Navbar } from 'ionic-angular';
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

  private rootNav(): NavController | null {
    const nav = this.app.getRootNavById('rootNav') as NavController;

    if (nav) {
      this.logger.info(this.TAG, 'Navigation rootNav utilisée');
    } else {
      this.logger.warn(this.TAG, 'Navigation rootNav introuvable');
    }

    return nav || null;
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
    if ( this.navCtrl.canGoBack()) {
      this.logger.debug(this.TAG, 'can go back true');
    this.viewCtrl.dismiss('popover').then(() => {
      const nav = this.rootNav();
      if (!nav) {
        return;
      }
      nav.push('ParamPage').then(() => {
        this.navCtrl.remove(1, 1);
      }); //we push from RootPage and not from PopoverNav, allow to use BackButton 
    });
    }
    else {
      this.logger.debug(this.TAG, 'can go back false');
      this.viewCtrl.dismiss('popover').then(() => {
        const nav = this.rootNav();
        if (nav) {
          nav.push('ParamPage');
        }
      }); 
    }
  }


  pushAboutPage(){
    this.viewCtrl.dismiss('popover').then(() => {
      const nav = this.rootNav();
      if (nav) {
        nav.push('AboutPage');
      }
      //.then(() => {
        //const startIndex = this.navCtrl.getActive().index - 1;
        //this.navCtrl.remove(startIndex, 1);
      }); //we push from RootPage and not from PopoverNav, allow to use BackButton 
   // });
  }

  pushWhoPage(){
    this.viewCtrl.dismiss('popover').then(() => {
      const nav = this.rootNav();
      if (nav) {
        nav.push('WhoPage');
      }
      //.then(() => {
        //const startIndex = this.navCtrl.getActive().index - 1;
        //this.navCtrl.remove(startIndex, 1);
      }); //we push from RootPage and not from PopoverNav, allow to use BackButton 
   // });
  }
  
  pushContactPage(){
    this.viewCtrl.dismiss('popover').then(() => {
      const nav = this.rootNav();
      if (nav) {
        nav.push('ContactPage');
      }
      //.then(() => {
      //  const startIndex = this.navCtrl.getActive().index - 1;
      // this.navCtrl.remove(startIndex, 1);
      }); //we push from RootPage and not from PopoverNav, allow to use BackButton 
    //}); 
  }


  pushGcuPage(){
    this.viewCtrl.dismiss('popover').then(() => {
      const nav = this.rootNav();
      if (nav) {
        nav.push('GcuPage');
      }
      //.then(() => {
      //  const startIndex = this.navCtrl.getActive().index - 1;
       // this.navCtrl.remove(startIndex, 1);
      }); //we push from RootPage and not from PopoverNav, allow to use BackButton 
    //}); 
  }

  pushHelpPage(){
    this.viewCtrl.dismiss('popover').then(() => {
      const nav = this.rootNav();
      if (nav) {
        nav.push('HelpPage');
      }
      //.then(() => {
      //  const startIndex = this.navCtrl.getActive().index - 1;
       // this.navCtrl.remove(startIndex, 1);
      }); //we push from RootPage and not from PopoverNav, allow to use BackButton 
    //}); 
  }


}



