import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';// TranslateLoader Required to change translation language.
import { ParamPage } from './param';

// Required to change translation language.
import { HttpClient } from '@angular/common/http';
import { createTranslateLoader } from '../../app/app.module';

@NgModule({
  declarations: [
    ParamPage,
  ],
  imports: [
    IonicPageModule.forChild(ParamPage),
    TranslateModule.forChild({
      loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient]
      }
  })
  ],
})
export class ParamPageModule {}
