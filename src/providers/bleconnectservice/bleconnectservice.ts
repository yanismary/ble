import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class BleconnectserviceProvider {
  private readonly TAG = 'BleconnectserviceProvider';
  wasConnected: boolean = false;
  needConnect: boolean = false; 
  connectionStatus:string = "unknown";
  connectedPeripheral: any = {};

  constructor(public http: HttpClient, private logger: LoggerService) {
    this.logger.debug(this.TAG, 'Provider initialise');
    this.wasConnected = false;
  }

  getWasConnected() {
    return this.wasConnected;    
  }


  setWasConnected(value: boolean) {
    this.wasConnected = value;
    this.logger.debug(this.TAG, 'setWasConnected', { value: value });
  }

  getConnectedPeripheral() {
    return this.connectedPeripheral;    
  }

  setConnectedPeripheral(value: any) {
    this.connectedPeripheral = value;
  }

  getNeedConnect() {
    return this.needConnect;    
  }

  setNeedConnect(value: any) {
    this.needConnect = value;
  }

  getConnectionStatus() {
    return this.connectionStatus;    
  }

  setConnectionStatus(value: any) {
    this.connectionStatus = value;
  }



}
