import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, App,Navbar } from 'ionic-angular';
import { IonicPage, ViewController } from 'ionic-angular';



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
  fromConnected :boolean;


  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public app: App,
    
  ) {
    this.fromConnected = this.navParams.get('fromConnected');
    console.log('Hello PopoverComponent Component');

  }
  //@ViewChild(Navbar) navBar: Navbar;

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
      console.log('can go back true');
    this.viewCtrl.dismiss('popover').then(() => {
      this.app.getRootNav().push('ParamPage').then(() => {
        this.navCtrl.remove(1, 1);
      }); //we push from RootPage and not from PopoverNav, allow to use BackButton 
    });
    }
    else {
      console.log('can go back false');
      this.viewCtrl.dismiss('popover').then(() => {
        this.app.getRootNav().push('ParamPage');
      }); 
    }
  }


  pushAboutPage(){
    this.viewCtrl.dismiss('popover').then(() => {
      this.app.getRootNav().push('AboutPage');
      //.then(() => {
        //const startIndex = this.navCtrl.getActive().index - 1;
        //this.navCtrl.remove(startIndex, 1);
      }); //we push from RootPage and not from PopoverNav, allow to use BackButton 
   // });
  }

  pushWhoPage(){
    this.viewCtrl.dismiss('popover').then(() => {
      this.app.getRootNav().push('WhoPage');
      //.then(() => {
        //const startIndex = this.navCtrl.getActive().index - 1;
        //this.navCtrl.remove(startIndex, 1);
      }); //we push from RootPage and not from PopoverNav, allow to use BackButton 
   // });
  }
  
  pushContactPage(){
    this.viewCtrl.dismiss('popover').then(() => {
      this.app.getRootNav().push('ContactPage');
      //.then(() => {
      //  const startIndex = this.navCtrl.getActive().index - 1;
      // this.navCtrl.remove(startIndex, 1);
      }); //we push from RootPage and not from PopoverNav, allow to use BackButton 
    //}); 
  }


  pushGcuPage(){
    this.viewCtrl.dismiss('popover').then(() => {
      this.app.getRootNav().push('GcuPage');
      //.then(() => {
      //  const startIndex = this.navCtrl.getActive().index - 1;
       // this.navCtrl.remove(startIndex, 1);
      }); //we push from RootPage and not from PopoverNav, allow to use BackButton 
    //}); 
  }

  pushHelpPage(){
    this.viewCtrl.dismiss('popover').then(() => {
      this.app.getRootNav().push('HelpPage');
      //.then(() => {
      //  const startIndex = this.navCtrl.getActive().index - 1;
       // this.navCtrl.remove(startIndex, 1);
      }); //we push from RootPage and not from PopoverNav, allow to use BackButton 
    //}); 
  }


}



