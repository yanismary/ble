import { NgModule } from '@angular/core';
import { PopoverPage } from './popover';
import { IonicModule } from 'ionic-angular';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
	declarations: [
		PopoverPage,
    ],
	imports: [
		IonicPageModule.forChild(PopoverPage),
		TranslateModule.forChild()
	],
	exports: [PopoverPage]
})
export class PopoverPageModule {}
