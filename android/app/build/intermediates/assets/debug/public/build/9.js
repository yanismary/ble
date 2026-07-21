webpackJsonp([9],{

/***/ 303:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GcuPageModule", function() { return GcuPageModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__gcu__ = __webpack_require__(671);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__ = __webpack_require__(104);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};




var GcuPageModule = /** @class */ (function () {
    function GcuPageModule() {
    }
    GcuPageModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_2__gcu__["a" /* GcuPage */],
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["i" /* IonicPageModule */].forChild(__WEBPACK_IMPORTED_MODULE_2__gcu__["a" /* GcuPage */]),
                __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__["b" /* TranslateModule */].forChild()
            ],
        })
    ], GcuPageModule);
    return GcuPageModule;
}());

//# sourceMappingURL=gcu.module.js.map

/***/ }),

/***/ 671:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return GcuPage; });
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



var GcuPage = /** @class */ (function () {
    function GcuPage(navCtrl, navParams, platform, logger) {
        this.navCtrl = navCtrl;
        this.navParams = navParams;
        this.platform = platform;
        this.logger = logger;
        this.TAG = 'GcuPage';
    }
    GcuPage.prototype.ionViewWillEnter = function () {
        var _this = this;
        this.platform.registerBackButtonAction(function () { return _this.setBackButtonActionHW(); });
        this.setBackButtonActionSW();
        this.logger.debug(this.TAG, 'ionViewWillEnter');
    };
    GcuPage.prototype.ionViewDidEnter = function () {
        //cosmetic
    };
    GcuPage.prototype.ionViewDidLoad = function () {
        this.logger.debug(this.TAG, 'ionViewDidLoad');
    };
    GcuPage.prototype.ionViewCanLeave = function () {
        //this.navCtrl.popToRoot();
    };
    //Method to override the default back button action
    GcuPage.prototype.setBackButtonActionSW = function () {
        var _this = this;
        this.navBar.backButtonClick = function () {
            //Write here wherever you wanna do
            _this.logger.debug(_this.TAG, 'Navbar back button clicked (SW)');
            _this.navCtrl.pop();
        };
    };
    GcuPage.prototype.setBackButtonActionHW = function () {
        this.navCtrl.pop();
        this.logger.debug(this.TAG, 'Hardware back button pressed');
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_8" /* ViewChild */])(__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["m" /* Navbar */]),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["m" /* Navbar */])
    ], GcuPage.prototype, "navBar", void 0);
    GcuPage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-gcu',template:/*ion-inline-start:"C:\Dev\Appli_ble\V2.0\src\pages\gcu\gcu.html"*/'<ion-header>\n\n\n  <ion-navbar color="navBarColor">\n\n    <ion-title text-wrap>{{ "GCU_PAGE.NAVBAR_TITLE" | translate }}</ion-title>\n\n  </ion-navbar>\n\n\n\n</ion-header>\n\n\n\n\n\n<ion-content padding>\n\n\n\n    <h2>{{ "GCU_PAGE.TITLE" | translate }}</h2>\n\n\n\n    <h5>{{ "GCU_PAGE.SUB_TITLE_1" | translate }}</h5>\n\n    <p>{{ "GCU_PAGE.CHAPTER_1.PARA_1" | translate }}</p>\n\n    <p>{{ "GCU_PAGE.CHAPTER_1.PARA_2" | translate }}</p>\n\n    <p>{{ "GCU_PAGE.CHAPTER_1.PARA_3" | translate }}</p>\n\n\n\n    <h5>{{ "GCU_PAGE.SUB_TITLE_2" | translate }}</h5>\n\n    <p>{{ "GCU_PAGE.CHAPTER_2.PARA_1" | translate }}</p>\n\n\n\n    <h5>{{ "GCU_PAGE.SUB_TITLE_3" | translate }}</h5>\n\n    <p><B>{{ "GCU_PAGE.CHAPTER_3.DEF_OBJECT_1" | translate }}</B>{{ "GCU_PAGE.CHAPTER_3.DEF_1" | translate }}</p>\n\n    <p><B>{{ "GCU_PAGE.CHAPTER_3.DEF_OBJECT_2" | translate }}</B>{{ "GCU_PAGE.CHAPTER_3.DEF_2" | translate }}</p>\n\n    <p><B>{{ "GCU_PAGE.CHAPTER_3.DEF_OBJECT_3" | translate }}</B>{{ "GCU_PAGE.CHAPTER_3.DEF_3" | translate }}</p>\n\n\n\n\n\n\n\n</ion-content>\n\n'/*ion-inline-end:"C:\Dev\Appli_ble\V2.0\src\pages\gcu\gcu.html"*/,
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["k" /* NavController */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["l" /* NavParams */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["o" /* Platform */],
            __WEBPACK_IMPORTED_MODULE_2__providers_logger_logger_service__["a" /* LoggerService */]])
    ], GcuPage);
    return GcuPage;
}());

//# sourceMappingURL=gcu.js.map

/***/ })

});
//# sourceMappingURL=9.js.map