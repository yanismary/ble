import { NgModule } from '@angular/core';
import { UppercasefirstPipe } from './uppercasefirst/uppercasefirst';
@NgModule({
	declarations: [UppercasefirstPipe],
	imports: [],
	exports: [UppercasefirstPipe]
})
export class PipesModule {}
