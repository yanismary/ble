import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { WhoPage } from './who';

@NgModule({
  declarations: [
    WhoPage,
  ],
  imports: [
    IonicPageModule.forChild(WhoPage),
    TranslateModule.forChild()
  ],
})
export class WhoModule {}
