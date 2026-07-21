webpackJsonp([8],{

/***/ 304:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HelpPageModule", function() { return HelpPageModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__help__ = __webpack_require__(672);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__ = __webpack_require__(104);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};




var HelpPageModule = /** @class */ (function () {
    function HelpPageModule() {
    }
    HelpPageModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_2__help__["a" /* HelpPage */],
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["i" /* IonicPageModule */].forChild(__WEBPACK_IMPORTED_MODULE_2__help__["a" /* HelpPage */]),
                __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__["b" /* TranslateModule */].forChild()
            ],
        })
    ], HelpPageModule);
    return HelpPageModule;
}());

//# sourceMappingURL=help.module.js.map

/***/ }),

/***/ 672:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return HelpPage; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__providers_logger_logger_service__ = __webpack_require__(30);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HelpPage = /** @class */ (function () {
    function HelpPage(navCtrl, navParams, platform, logger) {
        this.navCtrl = navCtrl;
        this.navParams = navParams;
        this.platform = platform;
        this.logger = logger;
        this.showPairing = false;
        this.showPairingTroubles = false;
        this.isAndroid = false;
        this.isIos = false;
        this.productName = '';
        this.TAG = 'HelpPage';
    }
    HelpPage.prototype.hAll = function () {
        this.showPairing = false;
        this.showPairingTroubles = false;
    };
    HelpPage.prototype.hsPairing = function () {
        var saveshowPairing = this.showPairing;
        this.hAll();
        this.showPairing = !saveshowPairing;
    };
    HelpPage.prototype.hsPairingTroubles = function () {
        var saveshowPairingTroubles = this.showPairingTroubles;
        this.hAll();
        this.showPairingTroubles = !saveshowPairingTroubles;
    };
    HelpPage.prototype.selectProduct = function (productName) {
        this.productName = productName;
    };
    HelpPage.prototype.ionViewDidLoad = function () {
        this.logger.debug(this.TAG, 'ionViewDidLoad');
    };
    HelpPage.prototype.ionViewWillEnter = function () {
        var _this = this;
        if (this.platform.is('android')) {
            this.isAndroid = true;
            this.isIos = false;
        }
        else if (this.platform.is('ios')) {
            this.isAndroid = false;
            this.isIos = true;
        }
        this.logger.info(this.TAG, 'Platform detected', { android: this.isAndroid, ios: this.isIos });
        this.platform.registerBackButtonAction(function () { return _this.setBackButtonActionHW(); });
        this.setBackButtonActionSW();
        this.logger.debug(this.TAG, 'ionViewWillEnter');
        this.showPairing = false;
    };
    //Method to override the default back button action
    HelpPage.prototype.setBackButtonActionSW = function () {
        var _this = this;
        this.navBar.backButtonClick = function () {
            //Write here wherever you wanna do
            _this.logger.debug(_this.TAG, 'Navbar back button clicked (SW)');
            _this.navCtrl.pop();
        };
    };
    HelpPage.prototype.setBackButtonActionHW = function () {
        this.navCtrl.pop();
        this.logger.debug(this.TAG, 'Hardware back button pressed');
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_8" /* ViewChild */])(__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["m" /* Navbar */]),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["m" /* Navbar */])
    ], HelpPage.prototype, "navBar", void 0);
    HelpPage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-help',template:/*ion-inline-start:"C:\Dev\Appli_ble\V2.0\src\pages\help\help.html"*/'<ion-header>\n  <ion-navbar color="navBarColor">\n\n    <ion-title>{{"HELP_PAGE.TITLE"| translate}}</ion-title>\n\n  </ion-navbar>\n\n</ion-header>\n\n\n\n\n\n<span [innerHTML]="\'title\' | translate"></span>\n\n\n\n<ion-content padding>\n\n    <div class="product-choice">\n      <p text-wrap>{{"HELP_PAGE.PRODUCT_CHOICE.TITLE"| translate}}</p>\n      <button ion-button block [outline]="productName !== \'WIDOOR\'" (click)="selectProduct(\'WIDOOR\')">\n        {{"HELP_PAGE.PRODUCT_CHOICE.WIDOOR"| translate}}\n      </button>\n      <button ion-button block [outline]="productName !== \'MOVENTIV/GARLINE\'" (click)="selectProduct(\'MOVENTIV/GARLINE\')">\n        {{"HELP_PAGE.PRODUCT_CHOICE.MOVENTIV"| translate}}\n      </button>\n    </div>\n   \n    <ion-list *ngIf="productName"> \n        <ion-item text-wrap (click)="hsPairing()">\n          <h2 text-wrap>{{"HELP_PAGE.PAIRING.TITLE"| translate}}</h2>\n          <div *ngIf="showPairing"><br/> </div>\n        <span  *ngIf="showPairing && isIos" text-wrap [innerHtml]="\'HELP_PAGE.PAIRING.IOS.TEXT\' | translate:{productName: productName}"></span>\n        <span  *ngIf="showPairing && isAndroid" text-wrap [innerHtml]="\'HELP_PAGE.PAIRING.ANDROID.TEXT\' | translate:{productName: productName}"></span>\n        </ion-item>\n        <ion-item text-wrap (click)="hsPairingTroubles()">\n            <h2 text-wrap>{{"HELP_PAGE.PAIRINGTROUBLES.TITLE"| translate}}</h2>\n            <div *ngIf="showPairingTroubles"><br/> </div>\n\n          <span  *ngIf="showPairingTroubles && isIos" text-wrap [innerHtml]="\'HELP_PAGE.PAIRINGTROUBLES.IOS.TEXT\' | translate"></span>\n\n          <span  *ngIf="showPairingTroubles && isAndroid" text-wrap [innerHtml]="\'HELP_PAGE.PAIRINGTROUBLES.ANDROID.TEXT\' | translate"></span>\n\n          </ion-item>\n\n        </ion-list> \n\n\n\n</ion-content>\n\n'/*ion-inline-end:"C:\Dev\Appli_ble\V2.0\src\pages\help\help.html"*/,
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["k" /* NavController */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["l" /* NavParams */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["o" /* Platform */],
            __WEBPACK_IMPORTED_MODULE_2__providers_logger_logger_service__["a" /* LoggerService */]])
    ], HelpPage);
    return HelpPage;
}());

//# sourceMappingURL=help.js.map

/***/ })

});
//# sourceMappingURL=8.js.map