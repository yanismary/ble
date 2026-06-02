import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { LoggerService } from '../logger/logger.service';
import 'rxjs/add/operator/map';

@Injectable()
export class DataProvider {
  private readonly TAG = 'DataProvider';

  constructor(public http: Http, private logger: LoggerService) {
    this.logger.debug(this.TAG, 'Provider initialise');
  }

}
