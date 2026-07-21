webpackJsonp([6],{

/***/ 309:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "WhoModule", function() { return WhoModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__ = __webpack_require__(104);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__who__ = __webpack_require__(676);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};




var WhoModule = /** @class */ (function () {
    function WhoModule() {
    }
    WhoModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_3__who__["a" /* WhoPage */],
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["i" /* IonicPageModule */].forChild(__WEBPACK_IMPORTED_MODULE_3__who__["a" /* WhoPage */]),
                __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__["b" /* TranslateModule */].forChild()
            ],
        })
    ], WhoModule);
    return WhoModule;
}());

//# sourceMappingURL=who.module.js.map

/***/ }),

/***/ 676:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return WhoPage; });
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



var WhoPage = /** @class */ (function () {
    function WhoPage(navCtrl, navParams, platform, logger) {
        this.navCtrl = navCtrl;
        this.navParams = navParams;
        this.platform = platform;
        this.logger = logger;
        this.TAG = 'WhoPage';
    }
    //page life cycle
    WhoPage.prototype.ionViewDidLoad = function () {
        this.logger.debug(this.TAG, 'ionViewDidLoad WhoPage');
    };
    WhoPage.prototype.ionViewWillEnter = function () {
        var _this = this;
        this.platform.registerBackButtonAction(function () { return _this.setBackButtonActionHW(); });
        this.setBackButtonActionSW();
        this.logger.debug(this.TAG, 'ionViewWillEnter');
    };
    WhoPage.prototype.ionViewDidEnter = function () {
        //cosmetic
        //this.nativePageTransitions.fade(null);
    };
    WhoPage.prototype.ionViewCanLeave = function () {
        // this.navCtrl.popToRoot();
    };
    //Method to override the default back button action
    WhoPage.prototype.setBackButtonActionSW = function () {
        var _this = this;
        this.navBar.backButtonClick = function () {
            //Write here wherever you wanna do
            _this.logger.debug(_this.TAG, 'backButtonFunc()');
            _this.navCtrl.pop();
        };
    };
    WhoPage.prototype.setBackButtonActionHW = function () {
        this.navCtrl.pop();
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_8" /* ViewChild */])(__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["m" /* Navbar */]),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["m" /* Navbar */])
    ], WhoPage.prototype, "navBar", void 0);
    WhoPage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-who',template:/*ion-inline-start:"C:\Dev\Appli_ble\V2.0\src\pages\who\who.html"*/'<ion-header>\n\n\n  <ion-navbar color="navBarColor">\n\n    <ion-title>{{ "WHO_PAGE.NAVBAR_TITLE" | translate }}</ion-title>\n\n  </ion-navbar>\n\n\n\n</ion-header>\n\n\n\n\n\n<ion-content padding>\n\n\n\n    <h2>{{ "WHO_PAGE.CONTENT_TITLE" | translate }}</h2>\n\n    <h5>{{ "WHO_PAGE.CONTENT_SUBTITLE" | translate }}</h5>\n\n\n\n    <p>{{ "WHO_PAGE.PARGRAPH1" | translate }}</p>\n\n    \n\n    <p>{{ "WHO_PAGE.PARGRAPH2" | translate }}</p>\n\n      <ul>\n\n          <li>{{ "WHO_PAGE.PARGRAPH2_LIST.ITEM1" | translate }}</li>\n\n          <li>{{ "WHO_PAGE.PARGRAPH2_LIST.ITEM2" | translate }}</li>\n\n          <li>{{ "WHO_PAGE.PARGRAPH2_LIST.ITEM3" | translate }}</li>\n\n      </ul>\n\n    <p>{{ "WHO_PAGE.PARGRAPH3" | translate }}</p>\n\n    <p>{{ "WHO_PAGE.PARGRAPH4" | translate }}</p>\n\n    \n\n  \n\n    <p>{{ "WHO_PAGE.ADDRESS.PRESENTATION" | translate }}</p> \n\n    <p>{{ "WHO_PAGE.ADDRESS.LOCALIZATION" | translate }}</p>\n\n\n\n   \n\n    <p style="text-align: center">\n\n        <img src="assets/img/mantionSMT_exterior.jpg">\n\n    </p>\n\n\n\n    <p style="text-align: center">\n\n        <img src="assets/img/mantionSMT_manufacturing.jpg">\n\n    </p>\n\n    \n\n      \n\n    \n\n</ion-content>\n\n'/*ion-inline-end:"C:\Dev\Appli_ble\V2.0\src\pages\who\who.html"*/,
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["k" /* NavController */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["l" /* NavParams */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["o" /* Platform */],
            __WEBPACK_IMPORTED_MODULE_2__providers_logger_logger_service__["a" /* LoggerService */]])
    ], WhoPage);
    return WhoPage;
}());

//# sourceMappingURL=who.js.map

/***/ })

});
//# sourceMappingURL=6.js.map