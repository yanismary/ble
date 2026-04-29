import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { GcuPage } from './gcu';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    GcuPage,
  ],
  imports: [
    IonicPageModule.forChild(GcuPage),
    TranslateModule.forChild()
  ],
})
export class GcuPageModule {}
