import { NgModule} from '@angular/core';
import { IonicPageModule} from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { WidoorPage } from './widoor';
//import { PipesModule  } from '../../pipes/pipes.module';


@NgModule({
  declarations: [
    WidoorPage,
   // PipesModule 
  ],
  imports: [   
    IonicPageModule.forChild(WidoorPage),
    TranslateModule.forChild()
  
  ],
})
export class WidoorPageModule {
 
}
