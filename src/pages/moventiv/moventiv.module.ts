import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MoventivPage } from './moventiv';

@NgModule({
  declarations: [
    MoventivPage,
  ],
  imports: [
    IonicPageModule.forChild(MoventivPage),
    TranslateModule.forChild()
  ],
})
export class MoventivPageModule {}


