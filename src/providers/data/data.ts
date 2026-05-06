import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { LoggerService } from '../logger/logger.service';
import 'rxjs/add/operator/map';

/*
  Generated class for the DataProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class DataProvider {
  private readonly TAG = 'DataProvider';

  constructor(public http: Http, private logger: LoggerService) {
    this.logger.debug(this.TAG, 'Provider initialise');
  }

}
