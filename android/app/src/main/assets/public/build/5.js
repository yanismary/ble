webpackJsonp([5],{

/***/ 305:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InfoSlidePageModule", function() { return InfoSlidePageModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__infoSlide__ = __webpack_require__(673);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__ = __webpack_require__(104);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};




var InfoSlidePageModule = /** @class */ (function () {
    function InfoSlidePageModule() {
    }
    InfoSlidePageModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_2__infoSlide__["a" /* InfoSlidePage */],
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["i" /* IonicPageModule */].forChild(__WEBPACK_IMPORTED_MODULE_2__infoSlide__["a" /* InfoSlidePage */]),
                __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__["b" /* TranslateModule */].forChild()
            ],
        })
    ], InfoSlidePageModule);
    return InfoSlidePageModule;
}());

//# sourceMappingURL=infoSlide.module.js.map

/***/ }),

/***/ 364:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return VERSION_WORD_PRODUCT_TYPE_INDEX; });
/* harmony export (immutable) */ __webpack_exports__["h"] = isWidoorBluetoothName;
/* harmony export (immutable) */ __webpack_exports__["b"] = detectProductType;
/* harmony export (immutable) */ __webpack_exports__["i"] = normalizeProductType;
/* harmony export (immutable) */ __webpack_exports__["c"] = getDemoProductTypeFromConfigId;
/* harmony export (immutable) */ __webpack_exports__["k"] = productTypeToVersionWordProductByte;
/* harmony export (immutable) */ __webpack_exports__["f"] = isGarlineProductType;
/* harmony export (immutable) */ __webpack_exports__["g"] = isMoventivProductType;
/* harmony export (immutable) */ __webpack_exports__["e"] = getProductDisplayName;
/* harmony export (immutable) */ __webpack_exports__["d"] = getProductConfigId;
/* harmony export (immutable) */ __webpack_exports__["j"] = productTypeLabel;
/* harmony export (immutable) */ __webpack_exports__["l"] = versionWordBytesToHex;
var VERSION_WORD_PRODUCT_TYPE_INDEX = 12;
function isWidoorBluetoothName(deviceName) {
    return normalizeDeviceName(deviceName).indexOf('WI') === 0;
}
function detectProductType(deviceName, versionWordBytes) {
    if (isWidoorBluetoothName(deviceName)) {
        return {
            productType: 'widoor',
            family: 'widoor',
            productTypeByte: null,
            reason: 'bluetooth_name_prefix_wi'
        };
    }
    if (!versionWordBytes || versionWordBytes.length <= VERSION_WORD_PRODUCT_TYPE_INDEX) {
        return {
            productType: 'unknown',
            family: 'unknown',
            productTypeByte: null,
            reason: 'version_word_missing_or_too_short'
        };
    }
    var productTypeByte = Number(versionWordBytes[VERSION_WORD_PRODUCT_TYPE_INDEX]);
    switch (productTypeByte) {
        case 0:
            return {
                productType: 'moventiv60',
                family: 'moventiv',
                productTypeByte: productTypeByte,
                reason: 'version_word_byte_12'
            };
        case 1:
            return {
                productType: 'moventiv80',
                family: 'moventiv',
                productTypeByte: productTypeByte,
                reason: 'version_word_byte_12'
            };
        case 2:
            return {
                productType: 'garline',
                family: 'garline',
                productTypeByte: productTypeByte,
                reason: 'version_word_byte_12'
            };
        default:
            return {
                productType: 'unknown',
                family: 'unknown',
                productTypeByte: productTypeByte,
                reason: 'version_word_unknown_product_byte'
            };
    }
}
function normalizeProductType(productType) {
    var normalizedType = String(productType || '').toLowerCase();
    if (normalizedType === 'widoor') {
        return 'widoor';
    }
    if (normalizedType === 'garline') {
        return 'garline';
    }
    if (normalizedType === 'moventiv60' || normalizedType === 'moventiv_60' || normalizedType === 'moventiv-60') {
        return 'moventiv60';
    }
    if (normalizedType === 'moventiv80' || normalizedType === 'moventiv_80' || normalizedType === 'moventiv-80') {
        return 'moventiv80';
    }
    if (normalizedType === 'moventiv') {
        return 'moventiv60';
    }
    return 'unknown';
}
function getDemoProductTypeFromConfigId(productConfigId) {
    return normalizeProductType(productConfigId);
}
function productTypeToVersionWordProductByte(productType) {
    switch (normalizeProductType(productType)) {
        case 'moventiv60':
            return 0;
        case 'moventiv80':
            return 1;
        case 'garline':
            return 2;
        default:
            return null;
    }
}
function isGarlineProductType(productType) {
    return normalizeProductType(productType) === 'garline';
}
function isMoventivProductType(productType) {
    var normalizedType = normalizeProductType(productType);
    return normalizedType === 'moventiv60' || normalizedType === 'moventiv80';
}
function getProductDisplayName(productType) {
    return isGarlineProductType(productType) ? 'GARLINE' : 'MOVENTIV';
}
function getProductConfigId(productType) {
    if (productType === 'widoor') {
        return 'widoor';
    }
    if (productType === 'garline') {
        return 'garline';
    }
    if (productType === 'moventiv60' || productType === 'moventiv80') {
        return 'moventiv';
    }
    return null;
}
function productTypeLabel(productType) {
    switch (productType) {
        case 'widoor':
            return 'Widoor';
        case 'moventiv60':
            return 'Moventiv 60 kg';
        case 'moventiv80':
            return 'Moventiv 80 kg';
        case 'garline':
            return 'Garline';
        default:
            return 'Produit inconnu';
    }
}
function versionWordBytesToHex(versionWordBytes) {
    if (!versionWordBytes || versionWordBytes.length === 0) {
        return '';
    }
    var hexParts = [];
    for (var i = 0; i < versionWordBytes.length; i++) {
        var value = Number(versionWordBytes[i]) & 0xFF;
        hexParts.push(('0' + value.toString(16)).slice(-2).toUpperCase());
    }
    return hexParts.join(' ');
}
function normalizeDeviceName(deviceName) {
    return String(deviceName || '').trim().toUpperCase();
}
//# sourceMappingURL=product-detection.js.map

/***/ }),

/***/ 673:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return InfoSlidePage; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__ = __webpack_require__(104);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__providers_logger_logger_service__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__app_product_detection__ = __webpack_require__(364);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var InfoSlidePage = /** @class */ (function () {
    function InfoSlidePage(platform, navCtrl, navParams, logger, translate) {
        this.platform = platform;
        this.navCtrl = navCtrl;
        this.navParams = navParams;
        this.logger = logger;
        this.translate = translate;
        this.slides = [];
        this.slidesWidoor = [];
        this.slidesMoventiv = [];
        this.slidesGarline = [];
        this.selectedTutorial = null;
        this.selectedReadyTitle = '';
        this.readyWidoor = '';
        this.readyMoventiv = '';
        this.readyGarline = '';
        this.TAG = 'InfoSlidePage';
    }
    InfoSlidePage.prototype.ngOnInit = function () {
        var _this = this;
        this.logger.debug(this.TAG, 'ngOnInit started');
        var platformKey = this.platform.is('ios') ? 'IOS' : 'ANDROID';
        this.selectedTutorial = this.resolveInitialTutorial();
        this.translate.get([
            'INFOSLIDE.SLIDE1.TITLE', 'INFOSLIDE.SLIDE1.DESC',
            'INFOSLIDE.SLIDE2.TITLE', 'INFOSLIDE.SLIDE2.DESC',
            'INFOSLIDE.SLIDE3.TITLE', 'INFOSLIDE.SLIDE3.DESC',
            'INFOSLIDE.SLIDE4.TITLE', 'INFOSLIDE.SLIDE4.DESC',
            'INFOSLIDE.SLIDE5.TITLE', 'INFOSLIDE.SLIDE5.DESC',
            'INFOSLIDE.SLIDE6.TITLE', 'INFOSLIDE.SLIDE6.DESC',
            'INFOSLIDE.SLIDE7.' + platformKey + '.TITLE',
            'INFOSLIDE.SLIDE7.' + platformKey + '.DESC',
            'INFOSLIDE.SLIDE8.' + platformKey + '.TITLE',
            'INFOSLIDE.SLIDE8.' + platformKey + '.DESC',
            'INFOSLIDE.END.READY'
        ]).subscribe(function (res) {
            _this.logger.info(_this.TAG, 'Slides loaded');
            _this.readyWidoor = _this.productText(res["INFOSLIDE.END.READY"], 'widoor');
            _this.readyMoventiv = _this.productText(res["INFOSLIDE.END.READY"], 'moventiv');
            _this.readyGarline = _this.productText(res["INFOSLIDE.END.READY"], 'garline');
            _this.slidesWidoor = _this.buildSlides(res, platformKey, 'widoor');
            _this.slidesMoventiv = _this.buildSlides(res, platformKey, 'moventiv');
            _this.slidesGarline = _this.buildSlides(res, platformKey, 'garline');
            _this.applySelectedTutorial();
        });
        this.logger.info(this.TAG, 'Platform detected', {
            android: this.platform.is('android'),
            ios: this.platform.is('ios')
        });
    };
    InfoSlidePage.prototype.selectTutorial = function (product) {
        this.selectedTutorial = product;
        this.applySelectedTutorial();
        this.logger.info(this.TAG, 'Tutorial selected', { product: product });
    };
    InfoSlidePage.prototype.applySelectedTutorial = function () {
        if (!this.selectedTutorial) {
            this.slides = [];
            this.selectedReadyTitle = '';
            return;
        }
        if (this.selectedTutorial === 'widoor') {
            this.slides = this.slidesWidoor;
            this.selectedReadyTitle = this.readyWidoor;
            return;
        }
        if (this.selectedTutorial === 'garline') {
            this.slides = this.slidesGarline;
            this.selectedReadyTitle = this.readyGarline;
            return;
        }
        this.slides = this.slidesMoventiv;
        this.selectedReadyTitle = this.readyMoventiv;
    };
    InfoSlidePage.prototype.buildSlides = function (res, platformKey, product) {
        var images = this.getSlideImages(product);
        return [
            {
                title: this.productText(res["INFOSLIDE.SLIDE1.TITLE"], product),
                description: this.productText(res["INFOSLIDE.SLIDE1.DESC"], product),
                image: images.slide1
            },
            {
                title: this.productText(res["INFOSLIDE.SLIDE2.TITLE"], product),
                description: this.productText(res["INFOSLIDE.SLIDE2.DESC"], product),
                image: images.slide2
            },
            {
                title: this.productText(res["INFOSLIDE.SLIDE3.TITLE"], product),
                description: this.productText(res["INFOSLIDE.SLIDE3.DESC"], product),
                image: images.slide3
            },
            {
                title: this.productText(res["INFOSLIDE.SLIDE4.TITLE"], product),
                description: this.productText(res["INFOSLIDE.SLIDE4.DESC"], product),
                image: images.slide4
            },
            {
                title: this.productText(res["INFOSLIDE.SLIDE5.TITLE"], product),
                description: this.productText(res["INFOSLIDE.SLIDE5.DESC"], product),
                image: images.slide5
            },
            {
                title: this.productText(res["INFOSLIDE.SLIDE6.TITLE"], product),
                description: this.productText(res["INFOSLIDE.SLIDE6.DESC"], product),
                image: images.slide6
            },
            {
                title: this.productText(res["INFOSLIDE.SLIDE7." + platformKey + ".TITLE"], product),
                description: this.productText(res["INFOSLIDE.SLIDE7." + platformKey + ".DESC"], product)
            },
            {
                title: this.productText(res["INFOSLIDE.SLIDE8." + platformKey + ".TITLE"], product),
                description: this.productText(res["INFOSLIDE.SLIDE8." + platformKey + ".DESC"], product)
            },
        ];
    };
    InfoSlidePage.prototype.getSlideImages = function (product) {
        var basePath = 'assets/img/tuto_' + product + '/';
        var lang = localStorage.getItem("lang") === "fr" ? "fr" : "en";
        if (this.platform.is('ios')) {
            return {
                slide1: basePath + 'slide1_' + product + '.png',
                slide2: basePath + 'slide2_ios_' + lang + '_' + product + '.PNG',
                slide3: basePath + 'slide3_ios_' + lang + '_' + product + '.PNG',
                slide4: basePath + 'slide4_ios_' + lang + '_' + product + '.PNG',
                slide5: basePath + 'slide5_ios_' + lang + '_' + product + '.PNG',
                slide6: basePath + 'slide6_ios_' + lang + '_' + product + '.PNG'
            };
        }
        var androidSlide4 = product === 'widoor' && lang === 'fr'
            ? basePath + 'slide4_anroid_fr_widoor.jpg'
            : basePath + 'slide4_android_' + lang + '_' + product + '.jpg';
        return {
            slide1: basePath + 'slide1_' + product + '.png',
            slide2: basePath + 'slide2_android_' + lang + '_' + product + '.jpg',
            slide3: basePath + 'slide3_android_' + lang + '_' + product + '.jpg',
            slide4: androidSlide4,
            slide5: basePath + 'slide5_android_' + lang + '_' + product + '.jpg',
            slide6: basePath + 'slide6_android_' + lang + '_' + product + '.jpg'
        };
    };
    InfoSlidePage.prototype.productText = function (value, product) {
        if (!value) {
            return value;
        }
        if (product === 'garline') {
            return value
                .replace(/MOVENTIV/g, 'GARLINE')
                .replace(/WIDOOR/g, 'GARLINE')
                .replace(/WIDOR/g, 'GARLINE')
                .replace(/Moventiv/g, 'GARLINE')
                .replace(/Widoor/g, 'GARLINE')
                .replace(/widoor/g, 'garline')
                .replace(/moventiv/g, 'garline');
        }
        if (product === 'widoor') {
            return value
                .replace(/MOVENTIV/g, 'WIDOOR')
                .replace(/Moventiv/g, 'Widoor')
                .replace(/moventiv/g, 'widoor');
        }
        return value
            .replace(/WIDOOR/g, 'MOVENTIV')
            .replace(/WIDOR/g, 'MOVENTIV')
            .replace(/Widoor/g, 'Moventiv')
            .replace(/widoor/g, 'moventiv');
    };
    InfoSlidePage.prototype.resolveInitialTutorial = function () {
        var explicitTutorial = this.normalizeTutorialProduct(this.navParams.get('tutorialProduct')
            || this.navParams.get('tutorial')
            || this.navParams.get('productConfigId')
            || this.navParams.get('demoProductId'));
        if (explicitTutorial) {
            return explicitTutorial;
        }
        var productType = Object(__WEBPACK_IMPORTED_MODULE_4__app_product_detection__["i" /* normalizeProductType */])(this.navParams.get('productType')
            || this.navParams.get('demoProductType'));
        var productTutorial = this.normalizeTutorialProduct(Object(__WEBPACK_IMPORTED_MODULE_4__app_product_detection__["d" /* getProductConfigId */])(productType));
        if (productTutorial) {
            return productTutorial;
        }
        var device = this.navParams.get('device') || {};
        var deviceTutorial = this.normalizeTutorialProduct(device.demoProductId
            || device.productConfigId
            || device.demoProductType
            || device.productType);
        if (deviceTutorial) {
            return deviceTutorial;
        }
        var deviceProductType = Object(__WEBPACK_IMPORTED_MODULE_4__app_product_detection__["i" /* normalizeProductType */])(device.detectedProductType || device.productType || device.demoProductType);
        return this.normalizeTutorialProduct(Object(__WEBPACK_IMPORTED_MODULE_4__app_product_detection__["d" /* getProductConfigId */])(deviceProductType));
    };
    InfoSlidePage.prototype.normalizeTutorialProduct = function (value) {
        var normalizedValue = String(value || '').toLowerCase();
        if (normalizedValue === 'widoor') {
            return 'widoor';
        }
        if (normalizedValue === 'garline') {
            return 'garline';
        }
        if (normalizedValue === 'moventiv' || normalizedValue === 'moventiv60' || normalizedValue === 'moventiv80') {
            return 'moventiv';
        }
        return null;
    };
    InfoSlidePage.prototype.ionViewDidEnter = function () {
        //cosmetic"",
    };
    InfoSlidePage.prototype.pushScan = function () {
        this.navCtrl.push('ScanPage');
        this.logger.debug(this.TAG, 'Navigating to ScanPage');
    };
    InfoSlidePage.prototype.ionViewDidLoad = function () {
        this.logger.debug(this.TAG, 'ionViewDidLoad');
    };
    InfoSlidePage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-infoSlide',template:/*ion-inline-start:"C:\Dev\Appli_ble\V2.0\src\pages\infoSlide\infoSlide.html"*/'<ion-header>\n</ion-header>\n\n\n\n\n<ion-content class="tutorial-content" padding>\n\n  <div *ngIf="!selectedTutorial" class="tutorial-choice">\n    <h2>{{ "INFOSLIDE.CHOICE.TITLE" | translate }}</h2>\n    <div class="tutorial-choice-buttons">\n      <button ion-button large block color="primary" (click)="selectTutorial(\'widoor\')">\n        {{ "INFOSLIDE.CHOICE.WIDOOR" | translate }}\n      </button>\n      <button ion-button large block color="secondary" (click)="selectTutorial(\'moventiv\')">\n        {{ "INFOSLIDE.CHOICE.MOVENTIV" | translate }}\n      </button>\n      <button ion-button large block color="mantionSmtgreen" (click)="selectTutorial(\'garline\')">\n        {{ "INFOSLIDE.CHOICE.GARLINE" | translate }}\n      </button>\n    </div>\n  </div>\n\n  <button *ngIf="selectedTutorial" ion-button clear type="button" class="tutorial-skip-button" (click)="pushScan()">\n    {{"INFOSLIDE.SKIP"| translate }}\n  </button>\n\n  <ion-slides *ngIf="selectedTutorial" pager>\n    <ion-slide *ngFor="let slide of slides" style="height:100%">\n      <ion-toolbar>\n      </ion-toolbar>\n      <div class="tutorial-slide-content">\n        <img *ngIf="slide.image" [src]="slide.image" class="slide-image"/>\n        <h2 class="slide-title" [innerHTML]="slide.title"></h2>\n        <p [innerHTML]="slide.description"></p>\n      </div>\n    </ion-slide>\n    <ion-slide>\n      <ion-toolbar>\n      </ion-toolbar>\n      <div class="tutorial-slide-content">\n        <h2 class="slide-title">{{ selectedReadyTitle }}</h2>\n        <button ion-button large clear icon-end (click)="pushScan()" color="primary">\n          {{"INFOSLIDE.END.CONTINUE"| translate }}\n          <ion-icon name="arrow-forward"></ion-icon>\n        </button>\n      </div>\n    </ion-slide>\n  </ion-slides>\n</ion-content>\n'/*ion-inline-end:"C:\Dev\Appli_ble\V2.0\src\pages\infoSlide\infoSlide.html"*/,
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["o" /* Platform */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["k" /* NavController */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["l" /* NavParams */],
            __WEBPACK_IMPORTED_MODULE_3__providers_logger_logger_service__["a" /* LoggerService */],
            __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__["c" /* TranslateService */]])
    ], InfoSlidePage);
    return InfoSlidePage;
}());

//# sourceMappingURL=infoSlide.js.map

/***/ })

});
//# sourceMappingURL=5.js.map