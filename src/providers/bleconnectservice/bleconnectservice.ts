import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/*
  Generated class for the BleconnectserviceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class BleconnectserviceProvider {
  wasConnected: boolean = false;
  needConnect: boolean = false; 
  connectionStatus:string = "unknown";
  connectedPeripheral: any = {};

  constructor(public http: HttpClient) {
    console.log('Hello BleconnectserviceProvider Provider');
    this.wasConnected = false;
  }

  getWasConnected() {
    return this.wasConnected;    
  }


  setWasConnected(value: boolean) {
    this.wasConnected = value;
    console.log('setWasConnected' + value);
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
