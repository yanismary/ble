import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler, Config,PageTransition,Animation,} from 'ionic-angular';
import { MyApp } from './app.component';

import { RandBLE } from '../providers/randble/randble';
import { DataProvider } from '../providers/data/data';
import { BleconnectserviceProvider } from '../providers/bleconnectservice/bleconnectservice';
import { RoomCacheProvider } from '../providers/roomcache/roomcache';

import { IonicStorageModule } from '@ionic/storage';
import { CommonModule } from '@angular/common';
import { PipesModule } from '../pipes/pipes.module';
import { HttpClientModule, HttpClient } from '@angular/common/http';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { LoggerService } from '../providers/logger/logger.service';



export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MyApp,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {
      
        //mode: 'ios',
        scrollAssist: false,
        scrollPadding: false,
        autoFocusAssist: false,

      
      pageTransition: 'fade',
      preloadModules: true
    }),
    IonicStorageModule.forRoot(),
    CommonModule,
    HttpClientModule,
    PipesModule,
    TranslateModule.forRoot({
      loader: {
      provide: TranslateLoader,
      useFactory: createTranslateLoader,
      deps: [HttpClient]
      }
    })

   
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    ],
  providers: [
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    RandBLE,
    DataProvider,
    BleconnectserviceProvider,
    RoomCacheProvider,
    LoggerService,
  ]
})
export class AppModule {constructor(config: Config) {
  config.setTransition('fade', FadeTansition);
}}


const SHOW_BACK_BTN_CSS = 'show-back-button';
export class FadeTansition extends PageTransition {
  init() {
    super.init();
    const plt = this.plt;
    const enteringView = this.enteringView;
    const leavingView = this.leavingView;
    const opts = this.opts;

    // what direction is the transition going
    const backDirection = opts.direction === 'back';

    if (enteringView) {
      if (backDirection) {
        this.duration(200);
      } else {
        this.duration(200);
        this.enteringPage.fromTo('opacity', 0, 1, true);
      }

      if (enteringView.hasNavbar()) {
        const enteringPageEle: Element = enteringView.pageRef().nativeElement;
        const enteringNavbarEle: Element = enteringPageEle.querySelector(
          'ion-navbar'
        );

        const enteringNavBar = new Animation(plt, enteringNavbarEle);
        this.add(enteringNavBar);

        const enteringBackButton = new Animation(
          plt,
          enteringNavbarEle.querySelector('.back-button')
        );
        this.add(enteringBackButton);
        if (enteringView.enableBack()) {
          enteringBackButton.beforeAddClass(SHOW_BACK_BTN_CSS);
        } else {
          enteringBackButton.beforeRemoveClass(SHOW_BACK_BTN_CSS);
        }
      }
    }

    // setup leaving view
    if (leavingView && backDirection) {
      // leaving content
      this.duration(200);
      const leavingPage = new Animation(plt, leavingView.pageRef());
      this.add(leavingPage.fromTo('opacity', 1, 0));
    }
  }
}
