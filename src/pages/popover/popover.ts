import { Component } from '@angular/core';
import { App } from 'ionic-angular';
import { IonicPage, ViewController } from 'ionic-angular';
import { LoggerService } from '../../providers/logger/logger.service';

@IonicPage()
@Component({
  selector: 'popover',
  templateUrl: 'popover.html'
})
export class PopoverPage {
  private TAG = 'PopoverPage';

  constructor(
    public viewCtrl: ViewController,
    public app: App,
    private logger: LoggerService,

  ) {
    this.logger.debug(this.TAG, 'Hello PopoverComponent Component');

  }

  private openPage(page: string): void {
    this.logger.info(this.TAG, 'Clic menu', { page: page });

    const nav = this.app.getRootNav();
    this.logger.info(this.TAG, 'Navigation menu via root nav', { page: page });

    this.viewCtrl.dismiss().then(() => {
      return nav.push(page);
    }).catch(error => {
      const typedError: any = error;
      this.logger.error(this.TAG, 'Erreur navigation menu', typedError);
    });
  }

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



