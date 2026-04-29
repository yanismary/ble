import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { InfoSlidePage } from './infoSlide';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    InfoSlidePage,
  ],
  imports: [
    IonicPageModule.forChild(InfoSlidePage),
    TranslateModule.forChild()
  ],
})
export class InfoSlidePageModule {}
