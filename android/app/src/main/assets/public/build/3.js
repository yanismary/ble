webpackJsonp([3],{

/***/ 306:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ParamPageModule", function() { return ParamPageModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__ = __webpack_require__(104);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__param__ = __webpack_require__(674);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_common_http__ = __webpack_require__(107);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__app_app_module__ = __webpack_require__(210);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};


 // TranslateLoader Required to change translation language.

// Required to change translation language.


var ParamPageModule = /** @class */ (function () {
    function ParamPageModule() {
    }
    ParamPageModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_3__param__["a" /* ParamPage */],
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["i" /* IonicPageModule */].forChild(__WEBPACK_IMPORTED_MODULE_3__param__["a" /* ParamPage */]),
                __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__["b" /* TranslateModule */].forChild({
                    loader: {
                        provide: __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__["a" /* TranslateLoader */],
                        useFactory: __WEBPACK_IMPORTED_MODULE_5__app_app_module__["b" /* createTranslateLoader */],
                        deps: [__WEBPACK_IMPORTED_MODULE_4__angular_common_http__["a" /* HttpClient */]]
                    }
                })
            ],
        })
    ], ParamPageModule);
    return ParamPageModule;
}());

//# sourceMappingURL=param.module.js.map

/***/ }),

/***/ 363:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ImpactStyle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return NotificationType; });
var ImpactStyle;
(function (ImpactStyle) {
    /**
     * A collision between large, heavy user interface elements
     *
     * @since 1.0.0
     */
    ImpactStyle["Heavy"] = "HEAVY";
    /**
     * A collision between moderately sized user interface elements
     *
     * @since 1.0.0
     */
    ImpactStyle["Medium"] = "MEDIUM";
    /**
     * A collision between small, light user interface elements
     *
     * @since 1.0.0
     */
    ImpactStyle["Light"] = "LIGHT";
})(ImpactStyle || (ImpactStyle = {}));
var NotificationType;
(function (NotificationType) {
    /**
     * A notification feedback type indicating that a task has completed successfully
     *
     * @since 1.0.0
     */
    NotificationType["Success"] = "SUCCESS";
    /**
     * A notification feedback type indicating that a task has produced a warning
     *
     * @since 1.0.0
     */
    NotificationType["Warning"] = "WARNING";
    /**
     * A notification feedback type indicating that a task has failed
     *
     * @since 1.0.0
     */
    NotificationType["Error"] = "ERROR";
})(NotificationType || (NotificationType = {}));
/**
 * @deprecated Use `NotificationType`.
 * @since 1.0.0
 */
const HapticsNotificationType = NotificationType;
/* unused harmony export HapticsNotificationType */

/**
 * @deprecated Use `ImpactStyle`.
 * @since 1.0.0
 */
const HapticsImpactStyle = ImpactStyle;
/* unused harmony export HapticsImpactStyle */

//# sourceMappingURL=definitions.js.map

/***/ }),

/***/ 365:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Haptics; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__capacitor_core__ = __webpack_require__(42);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__definitions__ = __webpack_require__(363);
/* unused harmony namespace reexport */

const Haptics = Object(__WEBPACK_IMPORTED_MODULE_0__capacitor_core__["c" /* registerPlugin */])('Haptics', {
    web: () => __webpack_require__.e/* import() */(14).then(__webpack_require__.bind(null, 552)).then(m => new m.HapticsWeb()),
});


//# sourceMappingURL=index.js.map

/***/ }),

/***/ 674:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ParamPage; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ionic_storage__ = __webpack_require__(56);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__ = __webpack_require__(104);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__capacitor_device__ = __webpack_require__(106);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__capacitor_haptics__ = __webpack_require__(365);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__providers_logger_logger_service__ = __webpack_require__(30);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};








var ParamPage = /** @class */ (function () {
    function ParamPage(navCtrl, appCtrl, loadingCtrl, navParams, storage, translate, config, platform, logger) {
        var _this = this;
        this.navCtrl = navCtrl;
        this.appCtrl = appCtrl;
        this.loadingCtrl = loadingCtrl;
        this.navParams = navParams;
        this.storage = storage;
        this.translate = translate;
        this.config = config;
        this.platform = platform;
        this.logger = logger;
        this.TAG = 'ParamPage';
        this.selectNgModLang = '';
        this.contentReboot = '';
        this.view_isIos = false;
        this.view_isAndroid = false;
        this.supportedLanguageCodes = ['fr', 'en', 'de', 'pl'];
        //language
        this.loadStoredJson('StoredIsLanguageAuto', function (value) {
            _this.toggleLanguageAuto = value;
        });
        this.loadStoredJson('appLanguage', function (value) {
            _this.selectNgModLang = value;
        });
        //display tabs
        this.loadStoredJson('StoredIsVisibleTabInfo', function (value) {
            _this.toggleDispTabInformations = value;
        });
        this.loadStoredJson('StoredIsVisibleTabSettings', function (value) {
            _this.toggleDispTabSettings = value;
        });
        //display optionnal commands
        this.loadStoredJson('StoredOptComs', function (value) {
            _this.dispOptionalCom = value;
        });
        // display mac address in scan page
        this.loadStoredJson('StoredIsVisibleMAC', function (value) {
            _this.toggleMac = value;
        });
        // toggle vibrations
        this.loadStoredJson('StoredIsActiveVibrate', function (value) {
            _this.toggleVibrate = value;
        });
        //toogle auto BLE
        this.loadStoredJson('StoredIsAutoBluetooth', function (value) {
            _this.toggleBluetooth = value;
        });
    }
    ParamPage.prototype.loadStoredJson = function (key, onValue) {
        var _this = this;
        this.storage.get(key).then(function (value) {
            onValue(JSON.parse(value));
        }).catch(function (error) {
            _this.logPromiseError('Failed to read ' + key, error);
        });
    };
    ParamPage.prototype.saveStoredJson = function (key, value) {
        var _this = this;
        this.storage.set(key, JSON.stringify(value)).catch(function (error) {
            _this.logPromiseError('Failed to save ' + key, error);
        });
    };
    ParamPage.prototype.logPromiseError = function (message, error) {
        var typedError = error;
        this.logger.error(this.TAG, message, typedError);
    };
    ParamPage.prototype.resolveSupportedLanguage = function (languageCode) {
        var shortCode = String(languageCode || '').substring(0, 2).toLowerCase();
        return this.supportedLanguageCodes.indexOf(shortCode) > -1 ? shortCode : 'en';
    };
    ParamPage.prototype.getManualLanguageCode = function (manualLanguage) {
        switch (manualLanguage) {
            case 'manualLang_FR':
                return 'fr';
            case 'manualLang_EN':
                return 'en';
            case 'manualLang_DE':
                return 'de';
            case 'manualLang_PL':
                return 'pl';
            default:
                return 'en';
        }
    };
    ParamPage.prototype.applyLanguage = function (languageCode) {
        var lang = this.resolveSupportedLanguage(languageCode);
        this.translate.use(lang);
        localStorage.setItem("lang", lang);
        this.updateBackButtonText();
    };
    ParamPage.prototype.updateBackButtonText = function () {
        var _this = this;
        this.translate.get('GENERIC.BACK').subscribe(function (res) {
            // Let android keep using only arrow
            _this.config.set('ios', 'backButtonText', res);
        });
    };
    //Toggles Functions
    ParamPage.prototype.toggleFctLanguageAuto = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ln, code, error_1, typedError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.saveStoredJson('StoredIsLanguageAuto', this.toggleLanguageAuto);
                        if (!this.toggleLanguageAuto) return [3 /*break*/, 4];
                        this.selectNgModLang = 'manualLang_NONE';
                        ln = '';
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, __WEBPACK_IMPORTED_MODULE_4__capacitor_device__["a" /* Device */].getLanguageCode()];
                    case 2:
                        code = _a.sent();
                        ln = code.value;
                        this.logger.debug(this.TAG, ln);
                        this.applyLanguage(ln);
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        typedError = error_1;
                        this.logger.warn(this.TAG, 'Failed to update automatic language', typedError);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ParamPage.prototype.ngModLangChange = function () {
        this.saveStoredJson('appLanguage', this.selectNgModLang);
        this.applyLanguage(this.getManualLanguageCode(this.selectNgModLang));
        //this.presentLoadingText();
    };
    ParamPage.prototype.optComChange = function () {
        this.logger.debug(this.TAG, 'optionaloptions', this.dispOptionalCom);
        this.saveStoredJson('StoredOptComs', this.dispOptionalCom);
    };
    ParamPage.prototype.toggleFctDispTabSet = function () {
        this.saveStoredJson('StoredIsVisibleTabSettings', this.toggleDispTabSettings);
    };
    ParamPage.prototype.toggleFctDispTabInfo = function () {
        this.saveStoredJson('StoredIsVisibleTabInfo', this.toggleDispTabInformations);
    };
    ParamPage.prototype.toggleFctMac = function () {
        this.saveStoredJson('StoredIsVisibleMAC', this.toggleMac);
    };
    ParamPage.prototype.toggleFctVibrate = function () {
        var _this = this;
        this.saveStoredJson('StoredIsActiveVibrate', this.toggleVibrate);
        if (this.toggleVibrate) {
            __WEBPACK_IMPORTED_MODULE_5__capacitor_haptics__["a" /* Haptics */].vibrate().catch(function (error) {
                _this.logPromiseError('Failed to trigger vibration', error);
            });
        }
    };
    ParamPage.prototype.toggleFctBluetooth = function () {
        this.saveStoredJson('StoredIsAutoBluetooth', this.toggleBluetooth);
    };
    ParamPage.prototype.presentLoadingText = function () {
        var _this = this;
        this.translate.get('PARAM_PAGE.LOADINGTEXT_REBOOT').subscribe(function (res) {
            _this.contentReboot = res;
        });
        var loading = this.loadingCtrl.create({
            spinner: 'hide',
            content: this.contentReboot,
            duration: 1000
        });
        loading.present().catch(function (error) {
            _this.logPromiseError('Failed to present reboot loading', error);
        });
    };
    //Method to override the default back button action
    ParamPage.prototype.setBackButtonActionSW = function () {
        var _this = this;
        this.navBar.backButtonClick = function () {
            //Write here wherever you wanna do
            _this.logger.debug(_this.TAG, 'backButtonFunc()');
            _this.navCtrl.pop().catch(function (error) {
                _this.logPromiseError('Failed to navigate back from navbar', error);
            });
        };
    };
    ParamPage.prototype.setBackButtonActionHW = function () {
        var _this = this;
        this.navCtrl.pop().catch(function (error) {
            _this.logPromiseError('Failed to navigate back from hardware button', error);
        });
    };
    ParamPage.prototype.ionViewWillEnter = function () {
        var _this = this;
        this.platform.registerBackButtonAction(function () { return _this.setBackButtonActionHW(); });
        this.setBackButtonActionSW();
        this.logger.debug(this.TAG, 'ionViewWillEnter');
        if (this.platform.is('ios')) {
            this.view_isIos = true;
        }
        else {
            this.view_isIos = false;
        }
        if (this.platform.is('android')) {
            this.view_isAndroid = true;
        }
        else {
            this.view_isAndroid = false;
        }
    };
    ParamPage.prototype.ionViewDidEnter = function () {
        //
    };
    ParamPage.prototype.ionViewDidLoad = function () {
        this.logger.debug(this.TAG, 'ionViewDidLoad ParamPage');
    };
    ParamPage.prototype.ionViewCanLeave = function () {
        //
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_8" /* ViewChild */])(__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["m" /* Navbar */]),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["m" /* Navbar */])
    ], ParamPage.prototype, "navBar", void 0);
    ParamPage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-param',template:/*ion-inline-start:"C:\Dev\Appli_ble\V2.0\src\pages\param\param.html"*/'<ion-header>\n\n\n  <ion-navbar color="navBarColor">\n\n    <ion-title text-wrap>{{ "PARAM_PAGE.NAVBAR_TITLE" | translate }}\n\n\n\n    </ion-title>\n\n  </ion-navbar>\n\n\n\n</ion-header>\n\n\n\n\n\n<ion-content class="outer-content">\n\n  <ion-list>\n\n    <ion-list-header text-wrap>\n\n        {{ "PARAM_PAGE.LISTHEADER_LANG" | translate }}\n\n    </ion-list-header>\n\n    <ion-item-group no-lines>\n\n      <ion-item no-lines>\n\n        <ion-icon name="chatbubbles" item-start color="wimGreyColor"></ion-icon>\n\n        <ion-label text-wrap >{{ "PARAM_PAGE.LABEL_LANG" | translate }}</ion-label>\n\n        <ion-toggle [(ngModel)]="toggleLanguageAuto" [checked]="toggleLanguageAuto" (ionChange)="toggleFctLanguageAuto()" color="mantionSmtgreen"></ion-toggle>\n\n      </ion-item>\n\n      <ion-item [hidden]="toggleLanguageAuto">\n\n          <ion-label text-wrap >{{ "PARAM_PAGE.SELECTLANG_FORMLABEL" | translate }}</ion-label>\n\n          <ion-select cancelText="{{ \'PARAM_PAGE.LANGUAGE_MENU.CANCELTEXT\' | translate }}" okText="{{ \'PARAM_PAGE.LANGUAGE_MENU.OKTEXT\' | translate }}" [ngModelOptions]="{standalone: true}" [(ngModel)]="selectNgModLang" (ionChange)="ngModLangChange($event)">\n\n              <ion-option value="manualLang_DE">{{ "PARAM_PAGE.LANGUAGE.DE" | translate }}</ion-option>              \n              <ion-option value="manualLang_EN">{{ "PARAM_PAGE.LANGUAGE.ENG" | translate }}</ion-option>\n              <ion-option value="manualLang_FR">{{ "PARAM_PAGE.LANGUAGE.FR" | translate }}</ion-option>\n              <ion-option value="manualLang_PL">{{ "PARAM_PAGE.LANGUAGE.PL" | translate }}</ion-option>          \n            </ion-select>\n        </ion-item>\n\n    </ion-item-group>\n\n  </ion-list>\n\n\n\n<ion-list>\n\n  <ion-list-header text-wrap *ngIf= "view_isIos">\n\n    {{ "PARAM_PAGE.SCAN_PAGE.HEADER.IOS" | translate }}\n\n  </ion-list-header>\n\n  <ion-list-header text-wrap *ngIf= "view_isAndroid">\n\n    {{ "PARAM_PAGE.SCAN_PAGE.HEADER.ANDROID" | translate }}\n\n  </ion-list-header>\n\n  <ion-item-group>\n\n    <ion-item>\n\n      <ion-icon name="list" item-start color="wimGreyColor"></ion-icon>\n\n      <ion-label *ngIf= "!view_isIos" text-wrap>{{ "PARAM_PAGE.SCAN_PAGE.MACADDRESS" | translate }}</ion-label>\n\n      <ion-label *ngIf= "view_isIos" text-wrap>{{ "PARAM_PAGE.SCAN_PAGE.UUID" | translate }}</ion-label>\n\n      <ion-toggle [(ngModel)]="toggleMac" [checked]="toggleMac"  (ionChange)="toggleFctMac()" color="mantionSmtgreen"></ion-toggle>\n\n    </ion-item>\n\n  </ion-item-group>\n\n</ion-list>\n\n\n\n\n\n  <ion-list>\n\n  <ion-item-group>\n\n      <ion-list-header text-wrap>\n\n          {{ "PARAM_PAGE.OPT_TAB.HEADER" | translate}}\n\n      </ion-list-header>\n\n      <ion-item>\n\n        <ion-icon name="ai-change-name" item-start color="wimGreyColor"></ion-icon>\n\n        <ion-label>  {{ "PARAM_PAGE.OPT_TAB.ADJUST" | translate}}</ion-label>\n\n        <ion-toggle [(ngModel)]="toggleDispTabSettings" [checked]="toggleDispTabSettings"(ionChange)="toggleFctDispTabSet()" color="mantionSmtgreen"></ion-toggle>\n\n      </ion-item>\n\n    </ion-item-group>\n\n    <ion-item-group>\n\n      <ion-item>\n\n        <ion-icon name="list" item-start color="wimGreyColor"></ion-icon>\n\n        <ion-label>  {{ "PARAM_PAGE.OPT_TAB.INFOS" | translate}}</ion-label>\n\n        <ion-toggle [(ngModel)]="toggleDispTabInformations" (ionChange)="toggleFctDispTabInfo()" color="mantionSmtgreen"></ion-toggle>\n\n      </ion-item>\n\n    </ion-item-group>\n\n  </ion-list>\n\n\n\n  <ion-list>\n\n    <ion-list-header text-wrap>\n\n        {{ "PARAM_PAGE.OTHER_OPTION.HEADER" | translate}}\n\n    </ion-list-header>\n\n    <ion-item-group>\n\n      <ion-item>\n\n        <ion-icon name="ai-vibrate" item-start color="wimGreyColor"></ion-icon>\n\n        <ion-label text-wrap>{{ "PARAM_PAGE.OTHER_OPTION.VIBRATE" | translate}}</ion-label>\n\n        <ion-toggle [(ngModel)]="toggleVibrate" (ionChange)="toggleFctVibrate()" color="mantionSmtgreen"></ion-toggle>\n\n      </ion-item>\n\n    </ion-item-group>\n\n    <ion-item-group *ngIf="view_isAndroid">\n\n      <ion-item>\n\n        <ion-icon name="bluetooth" item-start color="wimGreyColor"></ion-icon>\n\n        <ion-label text-wrap>{{ "PARAM_PAGE.OTHER_OPTION.BLUETOOTH" | translate}}</ion-label>\n\n        <ion-toggle [(ngModel)]="toggleBluetooth" (ionChange)="toggleFctBluetooth()" color="mantionSmtgreen"></ion-toggle>\n\n      </ion-item>\n\n    </ion-item-group>\n\n  </ion-list>\n\n\n\n</ion-content>\n'/*ion-inline-end:"C:\Dev\Appli_ble\V2.0\src\pages\param\param.html"*/,
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["k" /* NavController */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["c" /* App */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["j" /* LoadingController */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["l" /* NavParams */],
            __WEBPACK_IMPORTED_MODULE_2__ionic_storage__["b" /* Storage */],
            __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__["c" /* TranslateService */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["d" /* Config */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["o" /* Platform */],
            __WEBPACK_IMPORTED_MODULE_6__providers_logger_logger_service__["a" /* LoggerService */]])
    ], ParamPage);
    return ParamPage;
}());

//# sourceMappingURL=param.js.map

/***/ })

});
//# sourceMappingURL=3.js.map