webpackJsonp([7],{

/***/ 308:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PopoverPageModule", function() { return PopoverPageModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__popover__ = __webpack_require__(675);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__ = __webpack_require__(104);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};




var PopoverPageModule = /** @class */ (function () {
    function PopoverPageModule() {
    }
    PopoverPageModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_1__popover__["a" /* PopoverPage */],
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_2_ionic_angular__["i" /* IonicPageModule */].forChild(__WEBPACK_IMPORTED_MODULE_1__popover__["a" /* PopoverPage */]),
                __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__["b" /* TranslateModule */].forChild()
            ],
            exports: [__WEBPACK_IMPORTED_MODULE_1__popover__["a" /* PopoverPage */]]
        })
    ], PopoverPageModule);
    return PopoverPageModule;
}());

//# sourceMappingURL=popover.module.js.map

/***/ }),

/***/ 675:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return PopoverPage; });
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




var PopoverPage = /** @class */ (function () {
    function PopoverPage(viewCtrl, app, logger) {
        this.viewCtrl = viewCtrl;
        this.app = app;
        this.logger = logger;
        this.TAG = 'PopoverPage';
        this.logger.debug(this.TAG, 'Hello PopoverComponent Component');
    }
    PopoverPage.prototype.openPage = function (page) {
        var _this = this;
        this.logger.info(this.TAG, 'Clic menu', { page: page });
        var nav = this.app.getRootNav();
        this.logger.info(this.TAG, 'Navigation menu via root nav', { page: page });
        this.viewCtrl.dismiss().then(function () {
            return nav.push(page);
        }).catch(function (error) {
            var typedError = error;
            _this.logger.error(_this.TAG, 'Erreur navigation menu', typedError);
        });
    };
    PopoverPage.prototype.pushParamsPage = function () {
        this.logger.info(this.TAG, 'Clic pushParamsPage');
        this.openPage('ParamPage');
    };
    PopoverPage.prototype.pushAboutPage = function () {
        this.logger.info(this.TAG, 'Clic pushAboutPage');
        this.openPage('AboutPage');
    };
    PopoverPage.prototype.pushWhoPage = function () {
        this.logger.info(this.TAG, 'Clic pushWhoPage');
        this.openPage('WhoPage');
    };
    PopoverPage.prototype.pushContactPage = function () {
        this.logger.info(this.TAG, 'Clic pushContactPage');
        this.openPage('ContactPage');
    };
    PopoverPage.prototype.pushGcuPage = function () {
        this.logger.info(this.TAG, 'Clic pushGcuPage');
        this.openPage('GcuPage');
    };
    PopoverPage.prototype.pushHelpPage = function () {
        this.logger.info(this.TAG, 'Clic pushHelpPage');
        this.openPage('HelpPage');
    };
    PopoverPage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'popover',template:/*ion-inline-start:"C:\Dev\Appli_ble\V2.0\src\pages\popover\popover.html"*/'<ion-list>\n  <ion-item text-wrap (click)="pushParamsPage()">\n\n    {{ "POPOVER.PARAMETERS" | translate }}\n\n  </ion-item>\n\n  <ion-item text-wrap (click)="pushHelpPage()">\n\n    {{ "POPOVER.HELP" | translate }} \n\n  </ion-item>\n\n  <ion-item text-wrap (click)="pushAboutPage()">\n\n    {{ "POPOVER.ABOUT" | translate }} \n\n  </ion-item>\n\n  <ion-item text-wrap (click)="pushWhoPage()">\n\n    {{ "POPOVER.WHO" | translate }} \n\n  </ion-item>\n\n  <ion-item text-wrap (click)="pushContactPage()">\n\n    {{ "POPOVER.CONTACTS" | translate }}\n\n  </ion-item>\n\n  <ion-item text-wrap (click)="pushGcuPage()">\n\n    {{ "POPOVER.LEGAL_NOTICE" | translate }}\n\n  </ion-item>\n\n</ion-list>\n\n'/*ion-inline-end:"C:\Dev\Appli_ble\V2.0\src\pages\popover\popover.html"*/
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["r" /* ViewController */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["c" /* App */],
            __WEBPACK_IMPORTED_MODULE_2__providers_logger_logger_service__["a" /* LoggerService */]])
    ], PopoverPage);
    return PopoverPage;
}());

//# sourceMappingURL=popover.js.map

/***/ })

});
//# sourceMappingURL=7.js.map