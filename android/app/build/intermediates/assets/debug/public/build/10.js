webpackJsonp([10],{

/***/ 302:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ContactPageModule", function() { return ContactPageModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__ = __webpack_require__(104);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__contact__ = __webpack_require__(670);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};




var ContactPageModule = /** @class */ (function () {
    function ContactPageModule() {
    }
    ContactPageModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_3__contact__["a" /* ContactPage */],
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["i" /* IonicPageModule */].forChild(__WEBPACK_IMPORTED_MODULE_3__contact__["a" /* ContactPage */]),
                __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__["b" /* TranslateModule */].forChild()
            ],
        })
    ], ContactPageModule);
    return ContactPageModule;
}());

//# sourceMappingURL=contact.module.js.map

/***/ }),

/***/ 670:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ContactPage; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__ = __webpack_require__(104);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__providers_logger_logger_service__ = __webpack_require__(30);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var ContactPage = /** @class */ (function () {
    function ContactPage(navCtrl, navParams, translate, platform, logger) {
        var _this = this;
        this.navCtrl = navCtrl;
        this.navParams = navParams;
        this.translate = translate;
        this.platform = platform;
        this.logger = logger;
        //translate string
        this.translate_cp_c1_sc = '';
        this.translate_cp_c1_to = '';
        this.translate_cp_c1_cc = '';
        this.translate_cp_c1_s = '';
        this.translate_cp_c1_body = '';
        this.translate_cp_c2_sc = '';
        this.translate_cp_c2_to = '';
        this.translate_cp_c2_cc = '';
        this.translate_cp_c2_s = '';
        this.translate_cp_c2_body = '';
        this.fromConnected = false;
        this.TAG = 'ContactPage';
        this.translate.get('CONTACT_PAGE.CONTACT_1.PHONE.SYSTEMCALL').subscribe(function (res) {
            _this.translate_cp_c1_sc = res;
        });
        this.translate.get('CONTACT_PAGE.CONTACT_1.SEND_MESSAGE.TO').subscribe(function (res) {
            _this.translate_cp_c1_to = res;
        });
        this.translate.get('CONTACT_PAGE.CONTACT_1.SEND_MESSAGE.CC').subscribe(function (res) {
            _this.translate_cp_c1_cc = res;
        });
        this.translate.get('CONTACT_PAGE.CONTACT_1.SEND_MESSAGE.SUBJECT').subscribe(function (res) {
            _this.translate_cp_c1_s = res;
        });
        this.translate.get('CONTACT_PAGE.CONTACT._1.SEND_MESSAGE.BODY').subscribe(function (res) {
            _this.translate_cp_c1_body = res;
        });
        this.translate.get('CONTACT_PAGE.CONTACT_2.PHONE.SYSTEMCALL').subscribe(function (res) {
            _this.translate_cp_c2_sc = res;
        });
        this.translate.get('CONTACT_PAGE.CONTACT_2.SEND_MESSAGE.TO').subscribe(function (res) {
            _this.translate_cp_c2_to = res;
        });
        this.translate.get('CONTACT_PAGE.CONTACT_2.SEND_MESSAGE.CC').subscribe(function (res) {
            _this.translate_cp_c2_cc = res;
        });
        this.translate.get('CONTACT_PAGE.CONTACT_2.SEND_MESSAGE.SUBJECT').subscribe(function (res) {
            _this.translate_cp_c2_s = res;
        });
        this.translate.get('CONTACT_PAGE.CONTACT_2.SEND_MESSAGE.BODY').subscribe(function (res) {
            _this.translate_cp_c2_body = res;
        });
    }
    // Fonction utilitaire pour construire le lien mailto proprement
    ContactPage.prototype.openMail = function (to, cc, subject, body) {
        var link = "mailto:" + to + "?cc=" + cc + "&subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
        window.open(link, '_system');
        this.logger.debug(this.TAG, 'Opening mailto link', { to: to, cc: cc, subject: subject });
    };
    ContactPage.prototype.sendMessageType1 = function () {
        this.openMail(this.translate_cp_c1_to, this.translate_cp_c1_cc, this.translate_cp_c1_s, this.translate_cp_c1_body);
        this.logger.info(this.TAG, 'sendMessageType1 triggered');
    };
    ContactPage.prototype.sendMessageType2 = function () {
        this.openMail(this.translate_cp_c2_to, this.translate_cp_c2_cc, this.translate_cp_c2_s, this.translate_cp_c2_body);
        this.logger.info(this.TAG, 'sendMessageType2 triggered');
    };
    ContactPage.prototype.callPhoneNumberType1 = function () {
        window.open('tel:' + this.translate_cp_c1_sc, '_system');
        this.logger.info(this.TAG, 'callPhoneNumberType1 triggered', this.translate_cp_c1_sc);
    };
    ContactPage.prototype.callPhoneNumberType2 = function () {
        window.open('tel:' + this.translate_cp_c2_sc, '_system');
        this.logger.info(this.TAG, 'callPhoneNumberType2 triggered', this.translate_cp_c2_sc);
    };
    //lifecycle
    ContactPage.prototype.ionViewDidLoad = function () {
        this.logger.debug(this.TAG, 'ionViewDidLoad');
    };
    ContactPage.prototype.ionViewWillEnter = function () {
        var _this = this;
        this.platform.registerBackButtonAction(function () { return _this.setBackButtonActionHW(); });
        this.setBackButtonActionSW();
        this.logger.debug(this.TAG, 'ionViewWillEnter');
    };
    ContactPage.prototype.ionViewDidEnter = function () {
        //cosmetic
    };
    ContactPage.prototype.ionViewCanLeave = function () {
        //this.navCtrl.popToRoot();
    };
    //Method to override the default back button action
    ContactPage.prototype.setBackButtonActionSW = function () {
        var _this = this;
        this.navBar.backButtonClick = function () {
            //Write here wherever you wanna do
            _this.logger.debug(_this.TAG, 'Navbar back button clicked (SW)');
            _this.navCtrl.pop();
        };
    };
    ContactPage.prototype.setBackButtonActionHW = function () {
        this.navCtrl.pop();
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_8" /* ViewChild */])(__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["m" /* Navbar */]),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["m" /* Navbar */])
    ], ContactPage.prototype, "navBar", void 0);
    ContactPage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-contact',template:/*ion-inline-start:"C:\Dev\Appli_ble\V2.0\src\pages\contact\contact.html"*/'<ion-header>\n\n\n  <ion-navbar color="navBarColor">\n\n    <ion-title>{{ "CONTACT_PAGE.NAVBAR_TITLE" | translate }}</ion-title>\n\n  </ion-navbar>\n\n\n\n</ion-header>\n\n\n\n\n\n\n\n\n\n<ion-content padding>\n\n    <ion-item-group> \n\n\n\n  <ion-list>  \n\n      <ion-list-header>  \n\n            <span class="contact-company-name">{{ "CONTACT_PAGE.CONTACT_2.ADDRESS.NAME" | translate }}</span><img src="./assets/img/logo_wimove.png" align="right" width="40px" height="40px"/>\n      </ion-list-header> \n\n\n\n      <ion-item>\n\n          <ion-icon  name="ai-send-message" item-start color="wimGreyColor"></ion-icon>\n\n          <a href="mailto:appsupport@mantion-smt.fr">{{ "CONTACT_PAGE.SEND_A_MESSAGE" | translate }}</a>\n\n      </ion-item> \n\n\n\n    <ion-item>\n\n        <ion-icon  name="ai-phone" item-start color="wimGreyColor"></ion-icon>\n\n        <a href="tel:+33380378571">{{ "CONTACT_PAGE.CONTACT_2.PHONE.USERSEE" | translate }}</a>\n\n    </ion-item> \n\n\n\n\n\n    <ion-item >\n\n        <ion-icon  name="locate" item-start color="wimGreyColor"></ion-icon>\n\n        <p class="contact-company-name">{{"CONTACT_PAGE.CONTACT_2.ADDRESS.NAME" | translate }}</p>\n        <p>{{"CONTACT_PAGE.CONTACT_2.ADDRESS.STATE" | translate }}</p>\n\n        <p>{{"CONTACT_PAGE.CONTACT_2.ADDRESS.STREET" | translate }}</p>\n\n        <p>{{"CONTACT_PAGE.CONTACT_2.ADDRESS.CITY" | translate }}</p>\n\n    </ion-item>     \n\n  </ion-list>     \n\n  </ion-item-group>    \n\n\n\n</ion-content>\n\n'/*ion-inline-end:"C:\Dev\Appli_ble\V2.0\src\pages\contact\contact.html"*/,
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["k" /* NavController */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["l" /* NavParams */],
            __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__["c" /* TranslateService */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["o" /* Platform */],
            __WEBPACK_IMPORTED_MODULE_3__providers_logger_logger_service__["a" /* LoggerService */]])
    ], ContactPage);
    return ContactPage;
}());

//# sourceMappingURL=contact.js.map

/***/ })

});
//# sourceMappingURL=10.js.map