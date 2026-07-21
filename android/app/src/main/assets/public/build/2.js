webpackJsonp([2],{

/***/ 310:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ScanPageModule", function() { return ScanPageModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__ = __webpack_require__(104);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__scan__ = __webpack_require__(677);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};




var ScanPageModule = /** @class */ (function () {
    function ScanPageModule() {
    }
    ScanPageModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_3__scan__["a" /* ScanPage */],
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["i" /* IonicPageModule */].forChild(__WEBPACK_IMPORTED_MODULE_3__scan__["a" /* ScanPage */]),
                __WEBPACK_IMPORTED_MODULE_2__ngx_translate_core__["b" /* TranslateModule */].forChild()
            ],
        })
    ], ScanPageModule);
    return ScanPageModule;
}());

//# sourceMappingURL=scan.module.js.map

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

/***/ 366:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export EMPTY_BLE_DATE */
/* harmony export (immutable) */ __webpack_exports__["b"] = formatHexByte;
/* harmony export (immutable) */ __webpack_exports__["a"] = formatBleDate;
/* harmony export (immutable) */ __webpack_exports__["c"] = getSignalQualityFromRssi;
var EMPTY_BLE_DATE = '--/--/----';
function toNumber(value) {
    if (value === null || value === undefined) {
        return null;
    }
    var numericValue = Number(value);
    if (isNaN(numericValue) || !isFinite(numericValue)) {
        return null;
    }
    return numericValue;
}
function formatTwoDigits(value) {
    return ('0' + value).slice(-2);
}
function isValidByte(value) {
    return value !== null && value >= 0 && value <= 0xFF && Math.floor(value) === value;
}
function formatHexByte(value) {
    var numericValue = toNumber(value);
    if (!isValidByte(numericValue)) {
        return '';
    }
    return ('0' + numericValue.toString(16).toUpperCase()).slice(-2);
}
function formatBleDate(yearByte, monthByte, dayByte) {
    var yearValue = toNumber(yearByte);
    var monthValue = toNumber(monthByte);
    var dayValue = toNumber(dayByte);
    if (!isValidByte(yearValue) || !isValidByte(monthValue) || !isValidByte(dayValue)) {
        return EMPTY_BLE_DATE;
    }
    if (yearValue === 0xFF || monthValue === 0xFF || dayValue === 0xFF) {
        return EMPTY_BLE_DATE;
    }
    var year = 2000 + yearValue;
    var month = monthValue + 1;
    var day = dayValue;
    if (day <= 0 || day > 31 || month <= 0 || month > 12 || year < 2000 || year > 2099) {
        return EMPTY_BLE_DATE;
    }
    var date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return EMPTY_BLE_DATE;
    }
    return formatTwoDigits(day) + '/' + formatTwoDigits(month) + '/' + year;
}
function getSignalQualityFromRssi(rssi) {
    var numericRssi = toNumber(rssi);
    if (numericRssi === null) {
        return -1;
    }
    if (numericRssi >= -60) {
        return 4;
    }
    if (numericRssi >= -70) {
        return 3;
    }
    if (numericRssi >= -80) {
        return 2;
    }
    if (numericRssi >= -90) {
        return 1;
    }
    return 0;
}
//# sourceMappingURL=ble-format.js.map

/***/ }),

/***/ 677:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export PRODUCTS_CONFIG */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ScanPage; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ionic_storage__ = __webpack_require__(56);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__ = __webpack_require__(104);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__providers_randble_randble__ = __webpack_require__(105);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__providers_bleconnectservice_bleconnectservice__ = __webpack_require__(207);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__providers_logger_logger_service__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__providers_roomcache_roomcache__ = __webpack_require__(208);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__app_product_detection__ = __webpack_require__(364);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__app_ble_format__ = __webpack_require__(366);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__app_room_suffix__ = __webpack_require__(679);
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












var SHDO_SERVICE = 'dc06d52e-6ee8-471e-a5fd-0f40674a061d';
var SHDO_VERSION_CHARACTERISTIC = '175d6bc8-5840-4037-95da-a778395a036c';
var PRODUCTS_CONFIG = [
    {
        id: 'widoor',
        name: 'Widoor',
        serviceUUID: '3206890A-650E-46F3-9C73-2BC0840E3B8E',
        page: 'WidoorPage',
        demoName: 'WidoorExemple'
    },
    {
        id: 'moventiv',
        name: 'Moventiv',
        serviceUUID: '978AE765-664C-45D8-9157-3B9031E6478E',
        page: 'MoventivPage',
        demoName: 'MoventivExemple'
    },
    {
        id: 'garline',
        name: 'Garline',
        serviceUUID: '978AE765-664C-45D8-9157-3B9031E6478E',
        page: 'MoventivPage',
        demoName: 'GarlineExemple'
    }
    /*{
      id: 'nouveau_produit',
      name: 'Nouveau Produit',
      serviceUUID: '00000000-0000-0000-0000-000000000000',
      page: 'NouveauProduitPage'
    }*/
];
var ScanPage = /** @class */ (function () {
    //translation strings 
    function ScanPage(navCtrl, loadingCtrl, randble, ngZone, storage, popoverCtrl, navParams, platform, alertCtrl, translate, toastCtrl, bleConnectService, logger, roomCache) {
        var _this = this;
        this.navCtrl = navCtrl;
        this.loadingCtrl = loadingCtrl;
        this.randble = randble;
        this.ngZone = ngZone;
        this.storage = storage;
        this.popoverCtrl = popoverCtrl;
        this.navParams = navParams;
        this.platform = platform;
        this.alertCtrl = alertCtrl;
        this.translate = translate;
        this.toastCtrl = toastCtrl;
        this.bleConnectService = bleConnectService;
        this.logger = logger;
        this.roomCache = roomCache;
        this.devices = [];
        this.device = {};
        this.viewisIos = false;
        this.statusMessage = '';
        this.isScanning = false;
        this.isPushOnce = false;
        this.isConnectionFlowInProgress = false;
        this.enablePopupAlreadyShown = false;
        this.settingsPopupShown = false;
        this.permissionPopupShown = false;
        this.locationPopupShown = false;
        this.initScanInProgress = false;
        this.permissionDeniedCount = 0;
        this.scanTimeoutHandle = null;
        this.scanSubscription = null;
        this.detectedDeviceIds = {};
        // Evite de logguer la qualite de signal a chaque callback de scan (plusieurs fois/seconde) :
        // on ne re-logue que si le palier de qualite a change pour cet appareil.
        this.lastLoggedSignalQuality = {};
        this.TAG = 'ScanPage';
        this.UI_MESSAGES = {
            scanSearching: 'Recherche en cours...',
            scanPermissionDenied: 'Autorisations Bluetooth et localisation manquantes',
            scanPermissionPermanentlyDenied: 'Autorisations Bluetooth et localisation refusées définitivement',
            scanLocationDisabled: 'Localisation désactivée',
            scanPrepareFailed: 'Préparation Bluetooth impossible',
            scanError: 'Recherche Bluetooth impossible pour le moment',
            pairingInProgress: 'Appairage en cours...',
            pairingSuccess: 'Appairage réussi',
            pairingFailed: 'Échec de l\'appairage',
            missingIdentifier: 'Identifiant Bluetooth introuvable'
        };
        this.unbondOrBondColor = "mantionSmtRed";
        this.storage.get('StoredIsVisibleMAC').then(function (val) {
            _this.isVisibleMac = JSON.parse(val);
        });
        // Charge tot le cache piece local pour qu'il soit deja disponible au premier callback de scan.
        this.roomCache.preload();
    }
    //rafraichissement des paramètres
    ScanPage.prototype.ionViewWillEnter = function () {
        var _this = this;
        if (this.bleConnectService.getConnectionStatus() == "connecting") {
            this.clearDetectedDevices('connection_status_connecting');
            this.bleConnectService.setConnectionStatus("unknown");
        }
        if (this.navParams.get('clearDevices')) {
            this.clearDetectedDevices('nav_param_clearDevices');
        }
        this.logger.debug(this.TAG, 'ionViewWillEnter');
        this.storage.get('StoredIsVisibleMAC').then(function (val) {
            _this.isVisibleMac = JSON.parse(val);
        });
        if (this.platform.is('ios')) {
            this.viewisIos = true;
        }
        else {
            this.viewisIos = false;
        }
        if (this.bleConnectService.getWasConnected()) {
            var peripheral = this.bleConnectService.getConnectedPeripheral();
            // On récupère l'adresse que ce soit un objet ou une string
            var address = (peripheral && peripheral.address) ? peripheral.address : peripheral;
            if (address) {
                this.disconnectSpecific(address);
            }
        }
    };
    ScanPage.prototype.disconnectSpecific = function (address) {
        var _this = this;
        // Force disconnect logic
        this.randble.close({ address: address }).then(function () {
            _this.logger.info(_this.TAG, 'Peripheral connection closed', { address: address });
            _this.bleConnectService.setWasConnected(false);
            _this.clearDetectedDevices('disconnect_success');
            _this.showDeconnectedToast();
        }, function (error) {
            _this.logger.warn(_this.TAG, 'Peripheral close failed', { address: address, error: error });
        });
    };
    ScanPage.prototype.disconnect = function () {
        var peripheral = this.bleConnectService.getConnectedPeripheral() || null;
        var address = (peripheral && peripheral.address) ? peripheral.address : peripheral;
        if (address) {
            this.disconnectSpecific(String(address));
        }
        else {
            this.logger.warn(this.TAG, 'Disconnect ignored: no connected peripheral address');
        }
    };
    ScanPage.prototype.clearDetectedDevices = function (reason) {
        var _this = this;
        if (reason === void 0) { reason = 'disconnect_success'; }
        if (this.isScanning) {
            this.logger.warn(this.TAG, 'Detected device list clear skipped: scan active', { reason: reason });
            return;
        }
        var previousDevices = this.devices || [];
        var previousSelectedDevice = this.device || {};
        this.ngZone.run(function () {
            _this.devices = [];
            _this.device = {};
            _this.detectedDeviceIds = {};
            _this.lastLoggedSignalQuality = {};
        });
        var logDetails = {
            reason: reason,
            previousCount: previousDevices.length,
            previousSelectedId: previousSelectedDevice.id || previousSelectedDevice.address || '',
            previousSelectedName: previousSelectedDevice.name || ''
        };
        if (reason === 'disconnect_success' || reason === 'nav_param_clearDevices') {
            this.logger.info(this.TAG, 'Liste des produits détectés vidée après déconnexion', logDetails);
        }
        else {
            this.logger.info(this.TAG, 'Detected device list cleared', logDetails);
        }
    };
    ScanPage.prototype.initScan = function () {
        return __awaiter(this, void 0, void 0, function () {
            var precheck, reason, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.initScanInProgress) {
                            this.logger.debug(this.TAG, 'Init scan ignored: pre-check already running');
                            return [2 /*return*/];
                        }
                        this.initScanInProgress = true;
                        this.logger.info(this.TAG, 'Init scan started');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, this.randble.prepareForScan()];
                    case 2:
                        precheck = _a.sent();
                        this.logger.info(this.TAG, 'Pre-scan check result', precheck);
                        if (precheck && precheck.ready && precheck.reason === 'READY') {
                            this.enablePopupAlreadyShown = false;
                            this.settingsPopupShown = false;
                            this.permissionPopupShown = false;
                            this.locationPopupShown = false;
                            this.permissionDeniedCount = 0;
                            this.logger.info(this.TAG, 'Pre-scan check passed, launching scan');
                            this.scan();
                            return [2 /*return*/];
                        }
                        reason = precheck && precheck.reason ? String(precheck.reason) : 'PRECHECK_FAILED';
                        if (reason === 'BLE_DISABLED') {
                            this.logger.warn(this.TAG, 'Init scan blocked: bluetooth disabled', precheck ? precheck.details : null);
                            if (!this.enablePopupAlreadyShown) {
                                this.enablePopupAlreadyShown = true;
                                this.showEnableBluetoothPopup();
                            }
                            else {
                                this.showBluetoothSettingsPopup();
                            }
                            return [2 /*return*/];
                        }
                        if (reason === 'PERMISSION_DENIED') {
                            this.permissionDeniedCount++;
                            this.logger.warn(this.TAG, 'Init scan blocked: permission denied', {
                                details: precheck ? precheck.details : null,
                                permissionDeniedCount: this.permissionDeniedCount
                            });
                            this.setStatus(this.UI_MESSAGES.scanPermissionDenied);
                            if (this.platform.is('ios') || this.permissionDeniedCount >= 2) {
                                this.showPermissionSettingsPopup(precheck ? precheck.details : null, this.permissionDeniedCount >= 2);
                            }
                            else {
                                this.showToast('Impossible de lancer la recherche tant que les autorisations Bluetooth et localisation ne sont pas accordées.', 3500);
                            }
                            return [2 /*return*/];
                        }
                        if (reason === 'PERMISSION_PERMANENTLY_DENIED') {
                            this.permissionDeniedCount = Math.max(this.permissionDeniedCount, 2);
                            this.logger.warn(this.TAG, 'Init scan blocked: permission permanently denied', precheck ? precheck.details : null);
                            this.setStatus(this.UI_MESSAGES.scanPermissionPermanentlyDenied);
                            this.showPermissionSettingsPopup(precheck ? precheck.details : null, true);
                            return [2 /*return*/];
                        }
                        if (reason === 'LOCATION_DISABLED') {
                            this.logger.warn(this.TAG, 'Init scan blocked: location disabled', precheck ? precheck.details : null);
                            this.setStatus(this.UI_MESSAGES.scanLocationDisabled);
                            this.showLocationSettingsPopup(precheck ? precheck.details : null);
                            return [2 /*return*/];
                        }
                        this.logger.error(this.TAG, 'Init scan blocked: pre-check failed', precheck ? precheck.details : null);
                        this.setStatus(this.UI_MESSAGES.scanPrepareFailed);
                        this.showToast('La préparation Bluetooth est incomplète. Vérifiez les réglages, puis relancez la recherche.', 3500);
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _a.sent();
                        this.logger.error(this.TAG, 'Init scan failed unexpectedly', error_1);
                        this.setStatus(this.UI_MESSAGES.scanPrepareFailed);
                        this.showToast('Une erreur est survenue pendant la préparation Bluetooth.', 3000);
                        return [3 /*break*/, 5];
                    case 4:
                        this.initScanInProgress = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ScanPage.prototype.scan = function () {
        var _this = this;
        if (this.isScanning) {
            this.logger.debug(this.TAG, 'Scan request ignored: already scanning');
            return;
        }
        this.clearScanTimeout();
        this.resetScanResults('new_scan');
        this.setStatus(this.UI_MESSAGES.scanSearching);
        this.isScanning = true;
        this.isPushOnce = false;
        var targetServices = PRODUCTS_CONFIG.map(function (p) { return p.serviceUUID; });
        var scanParams = {
            services: targetServices,
            allowDuplicates: true,
            matchNum: this.randble.MATCH_NUM_MAX_ADVERTISEMENT,
            callbackType: this.randble.CALLBACK_TYPE_ALL_MATCHES,
            scanMode: this.randble.SCAN_MODE_BALANCED,
        };
        this.logger.info(this.TAG, 'Starting BLE scan', scanParams);
        this.scanSubscription = this.randble.startScan(scanParams).subscribe(function (device) {
            if (device.status === 'scanResult') {
                /*this.logger.debug(this.TAG, 'Scan result', {
                  id: device.id || device.address,
                  name: device.name,
                  rssi: device.rssi
                });*/
                _this.onDeviceDiscovered(device);
            }
            else if (device.id || device.address) {
                _this.onDeviceDiscovered(device);
            }
        }, function (error) {
            var code = (error && error.code) ? String(error.code) : '';
            _this.ngZone.run(function () { return _this.isScanning = false; });
            _this.clearScanSubscription('scan_error');
            if (code === 'BLE_DISABLED') {
                _this.logger.warn(_this.TAG, 'Scan failed: bluetooth disabled', error);
                _this.initScan();
                return;
            }
            if (code === 'BLE_PERMISSION_DENIED') {
                _this.logger.warn(_this.TAG, 'Scan failed: bluetooth/location permission denied', error);
                _this.setStatus(_this.UI_MESSAGES.scanPermissionDenied);
                _this.showToast('Les autorisations Bluetooth ou localisation ont été refusées. Veuillez relancer la recherche.', 3500);
                _this.initScan();
                return;
            }
            if (code === 'BLE_LOCATION_DISABLED') {
                _this.logger.warn(_this.TAG, 'Scan failed: location disabled', error);
                _this.setStatus(_this.UI_MESSAGES.scanLocationDisabled);
                _this.showLocationSettingsPopup(error);
                return;
            }
            if (code === 'BLE_NOT_INITIALIZED') {
                _this.logger.warn(_this.TAG, 'Scan failed: BLE not initialized', error);
                _this.setStatus(_this.UI_MESSAGES.scanPrepareFailed);
                _this.showToast('Le Bluetooth de l\'application n\'est pas prêt. Veuillez relancer la recherche.', 3000);
                return;
            }
            _this.logger.error(_this.TAG, 'Scan failed', error);
            _this.setStatus(_this.UI_MESSAGES.scanError);
            _this.showToast('La recherche Bluetooth a échoué. Veuillez réessayer.', 3000);
        });
        this.scanTimeoutHandle = setTimeout(function () {
            if (_this.isScanning) {
                _this.randble.stopScan().then(function () {
                    _this.logger.info(_this.TAG, 'Scan timeout reached, scan stopped');
                    _this.ngZone.run(function () { _this.isScanning = false; });
                    _this.clearScanSubscription('scan_timeout');
                }).catch(function (err) {
                    _this.logger.error(_this.TAG, 'Scan timeout stop failed', err);
                    _this.ngZone.run(function () { _this.isScanning = false; });
                    _this.clearScanSubscription('scan_timeout_error');
                }).then(function () {
                    _this.clearScanTimeout();
                });
            }
        }, 8000);
    };
    ScanPage.prototype.isDeviceBonded = function (device) {
        var _this = this;
        if ((device.status) == "scanStarted") {
            return;
        }
        if (this.platform.is('android') && typeof this.randble.isBonded === 'function') {
            var address = device && (device.address || device.id) ? String(device.address || device.id) : '';
            if (!address) {
                this.logger.warn(this.TAG, 'Bond status skipped: missing address', { device: device });
                return;
            }
            this.randble.isBonded({ address: address }).then(function (deviceBond) {
                _this.onDeviceDiscovered(Object.assign(device, deviceBond));
                _this.logger.debug(_this.TAG, 'Bond status resolved', {
                    address: device ? device.address : null,
                    isBonded: device ? device.isBonded : null
                });
            }, function (error) {
                _this.logger.warn(_this.TAG, 'Bond status check failed', {
                    address: device ? device.address : null,
                    error: error
                });
            });
        }
        else {
            this.onDeviceDiscovered(device);
            this.logger.debug(this.TAG, 'Device discovered without bond status check', {
                address: device ? device.address : null,
                id: device ? device.id : null
            });
        }
    };
    ScanPage.prototype.onDeviceDiscovered = function (device) {
        var _this = this;
        this.ngZone.run(function () {
            if (_this.platform.is('android')) {
                // On ne force pas la valeur, on attend la réponse asynchrone ci-dessous
                // Mais pour l'affichage initial, on peut laisser undefined
            }
            var deviceKey = _this.getDeviceKey(device);
            var nameInfo = _this.resolveScanDeviceName(device);
            var normalizedRssi = _this.resolveDeviceRssi(device);
            if (normalizedRssi !== undefined) {
                device.rssi = normalizedRssi;
            }
            _this.logScanSignalQuality(deviceKey, nameInfo.name || device.name, normalizedRssi);
            // Le cache local (rempli juste apres une ecriture BLE reussie sur la page produit) est
            // prioritaire sur le nom BLE tel que scanne : Android/iOS ne remontent pas toujours le nom
            // a jour immediatement, ce qui laissait l'icone/le nom bloques sur l'ancienne valeur.
            var cachedRoomSuffix = _this.roomCache.getRoomSuffix(deviceKey);
            var effectiveRoomSuffix = cachedRoomSuffix !== null && cachedRoomSuffix !== undefined
                ? cachedRoomSuffix
                : Object(__WEBPACK_IMPORTED_MODULE_10__app_room_suffix__["a" /* extractRoomSuffix */])(nameInfo.name || device.name || '');
            var cachedDeviceName = _this.roomCache.getDeviceName(deviceKey);
            var scannedBaseName = Object(__WEBPACK_IMPORTED_MODULE_10__app_room_suffix__["b" /* stripRoomSuffix */])(nameInfo.name || device.name || '');
            var effectiveDisplayName = cachedDeviceName !== null && cachedDeviceName !== undefined
                ? cachedDeviceName
                : scannedBaseName;
            _this.logger.debug(_this.TAG, '[NAME] scan resolved name source', {
                deviceKey: deviceKey,
                source: cachedDeviceName !== null && cachedDeviceName !== undefined ? 'local cache' : 'BLE scan',
                effectiveDisplayName: effectiveDisplayName
            }, 'NAME');
            var existingDevice = _this.devices.find(function (d) {
                return (d.id && device.id && d.id === device.id) ||
                    (d.address && device.address && d.address === device.address);
            });
            var oldName = existingDevice ? existingDevice.name : '';
            var oldRoomSuffix = existingDevice ? existingDevice._roomSuffix : '';
            var oldDisplayName = existingDevice ? existingDevice._displayName : '';
            var knownBefore = !!(deviceKey && _this.detectedDeviceIds[deviceKey]);
            if (deviceKey) {
                _this.detectedDeviceIds[deviceKey] = true;
            }
            // Ce callback peut se declencher plusieurs fois par seconde (allowDuplicates=true) :
            // niveau debug pour ne pas polluer Logcat, categorie SCAN pour un filtre facile.
            _this.logger.debug(_this.TAG, 'Device detected during scan', {
                deviceKey: deviceKey,
                knownBefore: knownBefore,
                oldName: oldName,
                newName: nameInfo.name,
                nameSource: nameInfo.source,
                isFreshName: nameInfo.isFresh,
                rssi: device ? device.rssi : null,
                effectiveRoomSuffix: effectiveRoomSuffix,
                roomSource: cachedRoomSuffix !== null && cachedRoomSuffix !== undefined ? 'cache' : 'scan'
            }, 'SCAN');
            if (existingDevice) {
                var wasUpdated = false;
                if (!existingDevice.id && device.id) {
                    existingDevice.id = device.id;
                    wasUpdated = true;
                }
                if (!existingDevice.address && device.address) {
                    existingDevice.address = device.address;
                    wasUpdated = true;
                }
                if (normalizedRssi !== undefined) {
                    existingDevice.rssi = normalizedRssi;
                    wasUpdated = true;
                }
                if (device.advertising) {
                    existingDevice.advertising = device.advertising;
                    wasUpdated = true;
                }
                if (device.advertisement) {
                    existingDevice.advertisement = device.advertisement;
                    wasUpdated = true;
                }
                if (device.isBonded !== undefined) {
                    existingDevice.isBonded = device.isBonded;
                    wasUpdated = true;
                }
                if (_this.shouldUpdateDisplayedName(existingDevice.name, nameInfo)) {
                    existingDevice.name = nameInfo.name;
                    wasUpdated = true;
                }
                if (nameInfo.name) {
                    existingDevice._scanNameSource = nameInfo.source;
                    existingDevice._hasFreshLocalName = !!existingDevice._hasFreshLocalName || nameInfo.isFresh;
                }
                if (existingDevice._roomSuffix !== effectiveRoomSuffix) {
                    existingDevice._roomSuffix = effectiveRoomSuffix;
                    wasUpdated = true;
                }
                if (existingDevice._displayName !== effectiveDisplayName) {
                    existingDevice._displayName = effectiveDisplayName;
                    wasUpdated = true;
                }
                if (wasUpdated) {
                    var nameChanged = oldName !== existingDevice.name;
                    var roomSuffixChanged = oldRoomSuffix !== existingDevice._roomSuffix;
                    var displayNameChanged = oldDisplayName !== existingDevice._displayName;
                    // Un changement de nom ou d'icone de piece est loggue en info, car peu frequent
                    // et utile au diagnostic. Une simple maj RSSI/metadata reste en debug pour ne pas
                    // polluer Logcat a chaque callback de scan.
                    if (nameChanged || roomSuffixChanged || displayNameChanged) {
                        _this.logger.info(_this.TAG, 'Existing scan device updated (name/piece changed)', {
                            deviceKey: deviceKey,
                            oldName: oldName,
                            newName: existingDevice.name,
                            nameSource: nameInfo.source,
                            oldRoomSuffix: oldRoomSuffix,
                            newRoomSuffix: existingDevice._roomSuffix,
                            oldDisplayName: oldDisplayName,
                            newDisplayName: existingDevice._displayName
                        }, 'SCAN');
                    }
                    else {
                        _this.logger.debug(_this.TAG, 'Existing scan device updated', {
                            deviceKey: deviceKey,
                            name: existingDevice.name,
                            rssi: existingDevice.rssi
                        }, 'SCAN');
                    }
                    _this.devices = _this.devices.slice();
                }
            }
            else {
                if (nameInfo.name) {
                    device.name = nameInfo.name;
                    device._scanNameSource = nameInfo.source;
                    device._hasFreshLocalName = nameInfo.isFresh;
                }
                if (device.isBonded === undefined) {
                    device.isBonded = false;
                }
                device._roomSuffix = effectiveRoomSuffix;
                device._displayName = effectiveDisplayName;
                _this.devices.push(device);
                _this.logger.info(_this.TAG, 'New scan device added', {
                    deviceKey: deviceKey,
                    name: device.name,
                    nameSource: nameInfo.source,
                    roomSuffix: effectiveRoomSuffix,
                    roomSource: cachedRoomSuffix !== null && cachedRoomSuffix !== undefined ? 'cache' : 'scan',
                    displayName: effectiveDisplayName,
                    displayNameSource: cachedDeviceName !== null && cachedDeviceName !== undefined ? 'cache' : 'scan'
                }, 'SCAN');
                _this.checkBondStatus(device);
            }
        });
    };
    ScanPage.prototype.checkBondStatus = function (device) {
        var _this = this;
        if (this.platform.is('android')) {
            var address_1 = device && (device.address || device.id) ? String(device.address || device.id) : '';
            if (!address_1) {
                this.logger.warn(this.TAG, 'Bond status async check skipped: missing address', { device: device });
                return;
            }
            this.randble.isBonded({ address: address_1 }).then(function (res) {
                _this.ngZone.run(function () {
                    var target = _this.devices.find(function (d) {
                        return (d.address && d.address === address_1) || (d.id && d.id === address_1);
                    });
                    if (target) {
                        target.isBonded = res.isBonded;
                    }
                });
            }).catch(function (error) {
                _this.logger.warn(_this.TAG, 'Bond status async check failed', {
                    address: device ? device.address : null,
                    error: error
                });
            });
        }
    };
    // If location permission is denied, you'll end up here
    ScanPage.prototype.scanError = function (error) {
        this.logger.error(this.TAG, 'scanError callback invoked', error);
        this.setStatus(this.UI_MESSAGES.scanError);
        this.showToast('Une erreur Bluetooth est survenue. Veuillez réessayer.', 3000);
    };
    ScanPage.prototype.setStatus = function (message) {
        var _this = this;
        this.logger.debug(this.TAG, 'Status update', message);
        this.ngZone.run(function () {
            _this.statusMessage = message;
        });
    };
    ScanPage.prototype.getSignalQualityIcon = function (rssi) {
        var signalQuality = this.getDisplayedSignalQuality(rssi);
        return 'assets/img/img_ble_strenght_' + signalQuality + '_4.svg';
    };
    ScanPage.prototype.getDisplayedSignalQuality = function (rssi) {
        var signalQuality = Object(__WEBPACK_IMPORTED_MODULE_9__app_ble_format__["c" /* getSignalQualityFromRssi */])(rssi);
        return signalQuality >= 0 ? signalQuality : 0;
    };
    ScanPage.prototype.resolveDeviceRssi = function (device) {
        if (!device) {
            return undefined;
        }
        if (device.rssi !== undefined && device.rssi !== null) {
            return device.rssi;
        }
        if (device.advertising && device.advertising.rssi !== undefined && device.advertising.rssi !== null) {
            return device.advertising.rssi;
        }
        if (device.advertisement && device.advertisement.rssi !== undefined && device.advertisement.rssi !== null) {
            return device.advertisement.rssi;
        }
        if (device.peripheral && device.peripheral.rssi !== undefined && device.peripheral.rssi !== null) {
            return device.peripheral.rssi;
        }
        return device.rssi !== undefined ? device.rssi : undefined;
    };
    ScanPage.prototype.logScanSignalQuality = function (deviceKey, deviceName, rssi) {
        var signalQuality = Object(__WEBPACK_IMPORTED_MODULE_9__app_ble_format__["c" /* getSignalQualityFromRssi */])(rssi);
        var qualityLabel = signalQuality >= 0 ? signalQuality : 'unknown';
        // Ce callback peut arriver plusieurs fois par seconde par appareil (allowDuplicates=true) :
        // on ne logue que lorsque le palier de qualite change, pas a chaque annonce BLE recue.
        if (deviceKey && this.lastLoggedSignalQuality[deviceKey] === qualityLabel) {
            return;
        }
        if (deviceKey) {
            this.lastLoggedSignalQuality[deviceKey] = qualityLabel;
        }
        var rssiLabel = rssi === undefined || rssi === null ? 'unknown' : rssi;
        this.logger.debug(this.TAG, 'RSSI ' + (deviceName || 'Unknown') + ' = ' + rssiLabel + ' -> quality ' + qualityLabel, undefined, 'SCAN');
    };
    ScanPage.prototype.unbondOrBond = function (device) {
        var _this = this;
        if (!this.platform.is('android')) {
            return;
        }
        if (device.isBonded) {
            this.showToast('Pour désappairer, ouvrez les réglages Bluetooth du téléphone puis choisissez "Oublier cet appareil".', 4000);
            return;
        }
        this.setStatus(this.UI_MESSAGES.pairingInProgress);
        var address = device && (device.address || device.id) ? String(device.address || device.id) : '';
        if (!address) {
            this.setStatus(this.UI_MESSAGES.missingIdentifier);
            this.showToast('Impossible d\'appairer cet appareil. Identifiant Bluetooth manquant.', 2500);
            return;
        }
        this.randble.bond({ address: address }).then(function () {
            _this.ngZone.run(function () {
                device.isBonded = true;
                _this.unbondOrBondColor = "mantionSmtgreen";
            });
            _this.setStatus(_this.UI_MESSAGES.pairingSuccess);
            _this.showToast(_this.UI_MESSAGES.pairingSuccess, 2000);
        }).catch(function (err) {
            _this.logger.error(_this.TAG, 'Bonding failed', err);
            _this.setStatus(_this.UI_MESSAGES.pairingFailed);
            var alert = _this.alertCtrl.create({
                title: _this.UI_MESSAGES.pairingFailed,
                message: 'Vérifiez que le produit est prêt à être appairé puis réessayez.',
                buttons: ['OK']
            });
            alert.present();
        });
    };
    ScanPage.prototype.swipe = function () {
        this.logger.debug(this.TAG, 'Swipe action detected');
    };
    ScanPage.prototype.deviceSelected = function (device) {
        return __awaiter(this, void 0, void 0, function () {
            var loading, connectSubscription, phase, flowActive, cleanupDone, dismissLoadingSafely, cleanupConnectionFlow, loadingErr_1, detectedConfig, detectedProductType_1, detectedProductLabel_1, name_1, demoProductId_1, demoProductType, resolvedConfig_1, targetAddress_1, unexpectedError_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info(this.TAG, 'Device selected', {
                            name: device ? device.name : null,
                            address: device ? device.address : null,
                            id: device ? device.id : null
                        });
                        if (this.isPushOnce || this.isConnectionFlowInProgress) {
                            this.logger.warn(this.TAG, 'Device selection ignored: connection flow already in progress', {
                                isPushOnce: this.isPushOnce,
                                isConnectionFlowInProgress: this.isConnectionFlowInProgress
                            });
                            this.showToast('Connexion deja en cours...', 1200);
                            return [2 /*return*/];
                        }
                        this.isPushOnce = true;
                        this.isConnectionFlowInProgress = true;
                        loading = null;
                        connectSubscription = null;
                        phase = 'selected';
                        flowActive = true;
                        cleanupDone = false;
                        dismissLoadingSafely = function () { return __awaiter(_this, void 0, void 0, function () {
                            var e_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!loading)
                                            return [2 /*return*/];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, 4, 5]);
                                        return [4 /*yield*/, loading.dismiss()];
                                    case 2:
                                        _a.sent();
                                        return [3 /*break*/, 5];
                                    case 3:
                                        e_1 = _a.sent();
                                        this.logger.debug(this.TAG, 'Loading dismiss ignored (already closed)', {
                                            phase: phase,
                                            error: e_1
                                        });
                                        return [3 /*break*/, 5];
                                    case 4:
                                        loading = null;
                                        return [7 /*endfinally*/];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); };
                        cleanupConnectionFlow = function (reason, setConnectionStatusUnknown) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (cleanupDone) {
                                            this.logger.debug(this.TAG, 'Cleanup skipped (already done)', {
                                                reason: reason,
                                                phase: phase
                                            });
                                            return [2 /*return*/];
                                        }
                                        cleanupDone = true;
                                        flowActive = false;
                                        if (connectSubscription && typeof connectSubscription.unsubscribe === 'function') {
                                            try {
                                                connectSubscription.unsubscribe();
                                                this.logger.debug(this.TAG, 'Connect subscription unsubscribed', { reason: reason });
                                            }
                                            catch (e) {
                                                this.logger.warn(this.TAG, 'Error while unsubscribing connect subscription', {
                                                    reason: reason,
                                                    error: e
                                                });
                                            }
                                        }
                                        this.isScanning = false;
                                        this.clearScanTimeout();
                                        this.isPushOnce = false;
                                        this.isConnectionFlowInProgress = false;
                                        if (setConnectionStatusUnknown) {
                                            this.bleConnectService.setConnectionStatus('unknown');
                                        }
                                        return [4 /*yield*/, dismissLoadingSafely()];
                                    case 1:
                                        _a.sent();
                                        this.logger.info(this.TAG, 'Connection flow cleanup completed', {
                                            reason: reason,
                                            phase: phase,
                                            setConnectionStatusUnknown: setConnectionStatusUnknown
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        }); };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 14, , 16]);
                        if (!loading) {
                            loading = this.loadingCtrl.create({ content: 'Connexion en cours...' });
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, loading.present()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        loadingErr_1 = _a.sent();
                        this.logger.warn(this.TAG, 'Loading present failed, continuing flow', loadingErr_1);
                        return [3 /*break*/, 5];
                    case 5:
                        phase = 'stoppingScan';
                        this.clearScanTimeout();
                        this.clearScanSubscription('connect_start');
                        if (!this.isScanning) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.withTimeout(this.randble.stopScan(), 1800, 'stopScan before connect')];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        this.logger.debug(this.TAG, 'stopScan before connect skipped: scan not active', {
                            device: device
                        });
                        _a.label = 8;
                    case 8:
                        this.isScanning = false;
                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 400); })];
                    case 9:
                        _a.sent(); // evite erreur gatt 133
                        detectedConfig = void 0;
                        detectedProductType_1 = 'unknown';
                        detectedProductLabel_1 = 'Produit inconnu';
                        name_1 = (device.name || "").toUpperCase();
                        if (device.isDemo === true || device.isDemo === "true") {
                            demoProductId_1 = device.demoProductId || device.productConfigId || device.productType;
                            demoProductType = Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["c" /* getDemoProductTypeFromConfigId */])(demoProductId_1);
                            detectedConfig = demoProductId_1 ? PRODUCTS_CONFIG.find(function (p) { return p.id === demoProductId_1; }) : undefined;
                            if (!detectedConfig && demoProductType !== 'unknown') {
                                detectedConfig = this.getProductConfigForDetectedType(demoProductType);
                            }
                            if (!detectedConfig) {
                                detectedConfig = PRODUCTS_CONFIG.find(function (p) { return p.id === 'widoor'; });
                            }
                            detectedProductType_1 = demoProductType !== 'unknown'
                                ? demoProductType
                                : Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["c" /* getDemoProductTypeFromConfigId */])(detectedConfig ? detectedConfig.id : null);
                            detectedProductLabel_1 = Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["j" /* productTypeLabel */])(detectedProductType_1);
                        }
                        else if (Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["h" /* isWidoorBluetoothName */])(name_1)) {
                            detectedProductType_1 = 'widoor';
                            detectedProductLabel_1 = Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["j" /* productTypeLabel */])(detectedProductType_1);
                            detectedConfig = PRODUCTS_CONFIG.find(function (p) { return p.id === 'widoor'; });
                        }
                        else {
                            detectedConfig = PRODUCTS_CONFIG.find(function (p) { return p.id === 'moventiv'; });
                            this.logger.info(this.TAG, 'Non-Widoor product selected, waiting for version word detection', {
                                bluetoothName: name_1,
                                preliminaryPage: detectedConfig ? detectedConfig.page : null
                            });
                        }
                        if (!!detectedConfig) return [3 /*break*/, 11];
                        this.toastCtrl.create({
                            message: 'Produit non reconnu.',
                            duration: 2000, position: 'bottom'
                        }).present();
                        return [4 /*yield*/, cleanupConnectionFlow('unknown_product', true)];
                    case 10:
                        _a.sent();
                        return [2 /*return*/];
                    case 11:
                        resolvedConfig_1 = detectedConfig;
                        this.logger.info(this.TAG, 'Product page resolved for selected device', {
                            productType: detectedProductType_1,
                            productLabel: detectedProductLabel_1,
                            productConfigId: resolvedConfig_1.id,
                            productName: resolvedConfig_1.name
                        });
                        // Si c'est un appareil de demo, on ouvre directement la page sans connecter
                        if (device.isDemo === true || device.isDemo === "true") {
                            phase = 'navigating';
                            this.navCtrl.push(resolvedConfig_1.page, {
                                device: device,
                                productType: detectedProductType_1,
                                productName: detectedProductLabel_1
                            }).then(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            this.logger.info(this.TAG, 'Demo navigation success');
                                            return [4 /*yield*/, cleanupConnectionFlow('demo_navigation_success', false)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }).catch(function (navErr) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            this.logger.error(this.TAG, 'Demo navigation failed', navErr);
                                            return [4 /*yield*/, cleanupConnectionFlow('demo_navigation_failed', true)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); });
                            return [2 /*return*/];
                        }
                        targetAddress_1 = (device && (device.address || device.id)) ? String(device.address || device.id).trim() : '';
                        this.logger.info(this.TAG, 'Selected device identifier', {
                            targetAddress: targetAddress_1,
                            productType: detectedProductType_1,
                            productConfigId: resolvedConfig_1.id
                        });
                        if (!!targetAddress_1) return [3 /*break*/, 13];
                        this.logger.error(this.TAG, 'Missing device id/address in selected device', {
                            code: 'BLE_DEVICE_ID_MISSING',
                            device: device
                        });
                        this.toastCtrl.create({
                            message: 'Connexion impossible. Identifiant Bluetooth manquant pour cet appareil.',
                            duration: 3000,
                            position: 'bottom'
                        }).present();
                        return [4 /*yield*/, cleanupConnectionFlow('missing_device_id', true)];
                    case 12:
                        _a.sent();
                        return [2 /*return*/];
                    case 13:
                        phase = 'connecting';
                        this.bleConnectService.setConnectionStatus('connecting');
                        this.logger.info(this.TAG, 'Connecting to selected device', { address: targetAddress_1 });
                        connectSubscription = this.connectWithRetry(targetAddress_1, 3).subscribe(function (res) {
                            if (!flowActive) {
                                _this.logger.warn(_this.TAG, 'Connect event ignored: flow already inactive', {
                                    event: res,
                                    phase: phase
                                });
                                return;
                            }
                            _this.logger.debug(_this.TAG, 'Connect event', {
                                event: res,
                                phase: phase
                            });
                            if (res.status === 'connected') {
                                if (phase !== 'connecting') {
                                    _this.logger.warn(_this.TAG, 'Connected event ignored: unexpected phase', { phase: phase });
                                    return;
                                }
                                phase = 'discovering';
                                _this.logger.info(_this.TAG, 'Connection succeeded, discovery starting', { address: targetAddress_1 });
                                // Ajout d'un delai pour stabiliser la connexion (fix frequent sur Android)
                                setTimeout(function () {
                                    if (!flowActive) {
                                        _this.logger.warn(_this.TAG, 'Discovery skipped: flow inactive before start', { address: targetAddress_1 });
                                        return;
                                    }
                                    _this.randble.discover({ address: targetAddress_1 })
                                        .then(function (discoverRes) { return __awaiter(_this, void 0, void 0, function () {
                                        var versionDetection, configFromVersion;
                                        var _this = this;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    if (!flowActive) {
                                                        this.logger.warn(this.TAG, 'Discovery success ignored: flow inactive', { address: targetAddress_1 });
                                                        return [2 /*return*/];
                                                    }
                                                    this.logger.info(this.TAG, 'Discovery success after connect', {
                                                        address: targetAddress_1,
                                                        status: discoverRes ? discoverRes.status : null
                                                    });
                                                    if (!device.address && device.id) {
                                                        device.address = device.id;
                                                    }
                                                    if (!(detectedProductType_1 !== 'widoor')) return [3 /*break*/, 2];
                                                    return [4 /*yield*/, this.detectConnectedProduct(device, targetAddress_1)];
                                                case 1:
                                                    versionDetection = _a.sent();
                                                    detectedProductType_1 = versionDetection.productType;
                                                    detectedProductLabel_1 = Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["j" /* productTypeLabel */])(detectedProductType_1);
                                                    configFromVersion = this.getProductConfigForDetectedType(detectedProductType_1);
                                                    resolvedConfig_1 = configFromVersion || resolvedConfig_1;
                                                    _a.label = 2;
                                                case 2:
                                                    this.bleConnectService.setWasConnected(true);
                                                    this.bleConnectService.setConnectedPeripheral(device);
                                                    this.bleConnectService.setConnectionStatus('connected');
                                                    phase = 'navigating';
                                                    this.logger.info(this.TAG, 'Connection context updated, navigating to product page', {
                                                        address: targetAddress_1,
                                                        productType: detectedProductType_1,
                                                        productLabel: detectedProductLabel_1,
                                                        productConfigId: resolvedConfig_1.id
                                                    });
                                                    this.navCtrl.push(resolvedConfig_1.page, {
                                                        device: device,
                                                        productType: detectedProductType_1,
                                                        productName: detectedProductLabel_1
                                                    }).then(function () { return __awaiter(_this, void 0, void 0, function () {
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0:
                                                                    this.logger.info(this.TAG, 'Navigation success after BLE connection', {
                                                                        address: targetAddress_1,
                                                                        productType: detectedProductType_1,
                                                                        productLabel: detectedProductLabel_1,
                                                                        productConfigId: resolvedConfig_1.id
                                                                    });
                                                                    phase = 'completed';
                                                                    return [4 /*yield*/, cleanupConnectionFlow('navigation_success', false)];
                                                                case 1:
                                                                    _a.sent();
                                                                    return [2 /*return*/];
                                                            }
                                                        });
                                                    }); }).catch(function (navErr) { return __awaiter(_this, void 0, void 0, function () {
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0:
                                                                    this.logger.error(this.TAG, 'Navigation failed after BLE connection', {
                                                                        address: targetAddress_1,
                                                                        productType: detectedProductType_1,
                                                                        productConfigId: resolvedConfig_1.id,
                                                                        error: navErr
                                                                    });
                                                                    this.toastCtrl.create({
                                                                        message: 'Connexion établie, mais ouverture de la page impossible.',
                                                                        duration: 3000,
                                                                        position: 'bottom'
                                                                    }).present();
                                                                    return [4 /*yield*/, cleanupConnectionFlow('navigation_failed', true)];
                                                                case 1:
                                                                    _a.sent();
                                                                    return [2 /*return*/];
                                                            }
                                                        });
                                                    }); });
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); })
                                        .catch(function (err) {
                                        if (!flowActive) {
                                            _this.logger.warn(_this.TAG, 'Discovery error ignored: flow inactive', {
                                                address: targetAddress_1,
                                                error: err
                                            });
                                            return;
                                        }
                                        _this.logger.error(_this.TAG, 'Discovery failed after connect', {
                                            address: targetAddress_1,
                                            error: err
                                        });
                                        _this.toastCtrl.create({
                                            message: 'Decouverte des services Bluetooth impossible.',
                                            duration: 3000,
                                            position: 'bottom'
                                        }).present();
                                        cleanupConnectionFlow('discovery_failed', true);
                                    });
                                }, 500);
                            }
                            else if (res.status === 'disconnected') {
                                if (!flowActive) {
                                    _this.logger.warn(_this.TAG, 'Runtime disconnection ignored: flow inactive', { address: targetAddress_1 });
                                    return;
                                }
                                _this.logger.warn(_this.TAG, 'Runtime disconnection during connection flow', {
                                    address: targetAddress_1,
                                    phase: phase,
                                    event: res
                                });
                                if (phase === 'navigating' || phase === 'completed') {
                                    // Déconnexion survenue pendant/après la navigation (typique du bond Android).
                                    // La page produit va gérer la reconnexion via needConnect=true.
                                    _this.bleConnectService.setNeedConnect(true);
                                    cleanupConnectionFlow('runtime_disconnected_during_nav', false);
                                    return;
                                }
                                _this.toastCtrl.create({
                                    message: 'Connexion Bluetooth interrompue. Veuillez réessayer.',
                                    duration: 3000,
                                    position: 'bottom'
                                }).present();
                                cleanupConnectionFlow('runtime_disconnected', true);
                            }
                        }, function (err) {
                            if (!flowActive) {
                                _this.logger.warn(_this.TAG, 'Connect error ignored: flow inactive', { error: err, phase: phase });
                                return;
                            }
                            _this.logger.error(_this.TAG, 'Connect failed on selected device', {
                                address: targetAddress_1,
                                error: err
                            });
                            _this.toastCtrl.create({
                                message: 'Connexion Bluetooth impossible. Veuillez réessayer.',
                                duration: 3000,
                                position: 'bottom'
                            }).present();
                            cleanupConnectionFlow('connect_failed', true);
                        });
                        return [3 /*break*/, 16];
                    case 14:
                        unexpectedError_1 = _a.sent();
                        this.logger.error(this.TAG, 'Unexpected error in deviceSelected flow', {
                            error: unexpectedError_1,
                            phase: phase
                        });
                        this.toastCtrl.create({
                            message: 'Erreur inattendue pendant la connexion Bluetooth. Veuillez réessayer.',
                            duration: 3000,
                            position: 'bottom'
                        }).present();
                        return [4 /*yield*/, cleanupConnectionFlow('unexpected_error', true)];
                    case 15:
                        _a.sent();
                        return [3 /*break*/, 16];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    ScanPage.prototype.detectConnectedProduct = function (device, targetAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var bluetoothName, widoorDetection, buffer, versionWordBytes, detection, productTypeByte, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bluetoothName = this.getBluetoothNameForDetection(device);
                        if (Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["h" /* isWidoorBluetoothName */])(bluetoothName)) {
                            widoorDetection = Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["b" /* detectProductType */])(bluetoothName, null);
                            this.logger.info(this.TAG, 'Product detection from Bluetooth name', {
                                bluetoothName: bluetoothName,
                                productType: widoorDetection.productType,
                                productLabel: Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["j" /* productTypeLabel */])(widoorDetection.productType),
                                reason: widoorDetection.reason
                            });
                            return [2 /*return*/, widoorDetection];
                        }
                        this.logger.info(this.TAG, 'Reading version word for product detection', {
                            bluetoothName: bluetoothName,
                            address: targetAddress,
                            service: SHDO_SERVICE,
                            characteristic: SHDO_VERSION_CHARACTERISTIC
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.randble.read({
                                address: targetAddress,
                                service: SHDO_SERVICE,
                                characteristic: SHDO_VERSION_CHARACTERISTIC
                            })];
                    case 2:
                        buffer = _a.sent();
                        versionWordBytes = this.randble.encodedStringToBytes(buffer.value);
                        detection = Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["b" /* detectProductType */])(bluetoothName, versionWordBytes);
                        productTypeByte = versionWordBytes && versionWordBytes.length > __WEBPACK_IMPORTED_MODULE_8__app_product_detection__["a" /* VERSION_WORD_PRODUCT_TYPE_INDEX */]
                            ? versionWordBytes[__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["a" /* VERSION_WORD_PRODUCT_TYPE_INDEX */]]
                            : undefined;
                        this.logger.debug(this.TAG, '[ProductDetection] Version word diagnostics before navigation', {
                            bluetoothName: bluetoothName,
                            versionWordLength: versionWordBytes ? versionWordBytes.length : 0,
                            versionWordHex: Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["l" /* versionWordBytesToHex */])(versionWordBytes),
                            productTypeByte: productTypeByte,
                            productTypeByteType: typeof productTypeByte,
                            detectedProductType: detection.productType,
                            detectedProductLabel: Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["j" /* productTypeLabel */])(detection.productType),
                            detectedIsGarline: Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["f" /* isGarlineProductType */])(detection.productType),
                            reason: detection.reason
                        });
                        if (detection.productType === 'unknown') {
                            this.logger.warn(this.TAG, 'Product detection from version word is unknown', {
                                bluetoothName: bluetoothName,
                                versionWordLength: versionWordBytes ? versionWordBytes.length : 0,
                                versionWordHex: Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["l" /* versionWordBytesToHex */])(versionWordBytes),
                                productTypeByte: detection.productTypeByte,
                                reason: detection.reason
                            });
                        }
                        else {
                            this.logger.info(this.TAG, 'Product detection from version word succeeded', {
                                bluetoothName: bluetoothName,
                                versionWordLength: versionWordBytes.length,
                                versionWordHex: Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["l" /* versionWordBytesToHex */])(versionWordBytes),
                                productTypeByte: detection.productTypeByte,
                                productType: detection.productType,
                                productLabel: Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["j" /* productTypeLabel */])(detection.productType),
                                reason: detection.reason
                            });
                        }
                        return [2 /*return*/, detection];
                    case 3:
                        error_2 = _a.sent();
                        this.logger.error(this.TAG, 'Version word read failed during product detection', {
                            bluetoothName: bluetoothName,
                            address: targetAddress,
                            error: error_2
                        });
                        return [2 /*return*/, Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["b" /* detectProductType */])(bluetoothName, null)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ScanPage.prototype.getProductConfigForDetectedType = function (productType) {
        var configId = Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["d" /* getProductConfigId */])(productType) || 'moventiv';
        return PRODUCTS_CONFIG.find(function (p) { return p.id === configId; });
    };
    ScanPage.prototype.getBluetoothNameForDetection = function (device) {
        return String((device && (device.name || device.localName || device.displayName)) ||
            '');
    };
    ScanPage.prototype.ionViewDidEnter = function () {
        this.logger.debug(this.TAG, 'ionViewDidEnter');
        this.isPushOnce = false;
    };
    ScanPage.prototype.presentPopover = function (ev) {
        var popover = this.popoverCtrl.create('PopoverPage', {
            fromConnected: false
        });
        popover.present({
            ev: ev
        });
    };
    ScanPage.prototype.pushInfoSlide = function () {
        this.navCtrl.push('InfoSlidePage');
    };
    ScanPage.prototype.showDeconnectedToast = function () {
        var _this = this;
        this.translate.get('PROMPT.DISCONNECTED.TITLE').subscribe(function (res) {
            var toast = _this.toastCtrl.create({
                message: res,
                duration: 500,
                position: 'middle',
                cssClass: "yourtoastclass"
            });
            toast.present();
        });
    };
    ScanPage.prototype.launchDemoMode = function () {
        var _this = this;
        this.logger.info(this.TAG, 'Demo mode selection requested');
        var demoProducts = [
            {
                id: 'moventiv',
                title: this.getTranslatedText('SCAN_PAGE.DEMO_SELECTOR.MOVENTIV_EXAMPLE', 'MOVENTIV exemple')
            },
            {
                id: 'garline',
                title: this.getTranslatedText('SCAN_PAGE.DEMO_SELECTOR.GARLINE_EXAMPLE', 'GARLINE exemple')
            },
            {
                id: 'widoor',
                title: this.getTranslatedText('SCAN_PAGE.DEMO_SELECTOR.WIDOOR_EXAMPLE', 'WIDOOR exemple')
            }
        ];
        var cancelText = this.getTranslatedText('SCAN_PAGE.DEMO_SELECTOR.CANCEL', 'Annuler');
        var alert = this.alertCtrl.create({
            title: this.getTranslatedText('SCAN_PAGE.CIRCLEBUTTONS.EXAMPLE', 'Exemple'),
            cssClass: 'demo-product-alert',
            buttons: [
                {
                    text: demoProducts[0].title,
                    cssClass: 'demo-product-button demo-product-button-moventiv',
                    handler: function () {
                        _this.openDemoProduct(demoProducts[0].id);
                    }
                },
                {
                    text: demoProducts[1].title,
                    cssClass: 'demo-product-button demo-product-button-garline',
                    handler: function () {
                        _this.openDemoProduct(demoProducts[1].id);
                    }
                },
                {
                    text: demoProducts[2].title,
                    cssClass: 'demo-product-button demo-product-button-widoor',
                    handler: function () {
                        _this.openDemoProduct(demoProducts[2].id);
                    }
                },
                {
                    text: cancelText,
                    role: 'cancel',
                    cssClass: 'demo-product-cancel-button'
                }
            ]
        });
        alert.present();
    };
    ScanPage.prototype.getTranslatedText = function (key, fallback) {
        var translatedText = this.translate.instant(key);
        if (!translatedText || translatedText === key) {
            return fallback;
        }
        return translatedText;
    };
    ScanPage.prototype.openDemoProduct = function (productId) {
        var _this = this;
        var productConfig = PRODUCTS_CONFIG.find(function (p) { return p.id === productId; });
        if (!productConfig) {
            this.logger.warn(this.TAG, 'Demo product not found', { productId: productId });
            this.toastCtrl.create({
                message: 'Exemple non disponible',
                duration: 2000,
                position: 'bottom'
            }).present();
            return;
        }
        var demoProductType = Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["c" /* getDemoProductTypeFromConfigId */])(productConfig.id);
        var demoDevice = this.createDemoDevice(productConfig, demoProductType);
        this.logger.info(this.TAG, 'Opening demo product page', {
            productType: demoProductType,
            productName: productConfig.name,
            demoName: demoDevice.name
        });
        this.ngZone.run(function () {
            _this.navCtrl.push(productConfig.page, {
                device: demoDevice,
                productType: demoProductType,
                productName: Object(__WEBPACK_IMPORTED_MODULE_8__app_product_detection__["j" /* productTypeLabel */])(demoProductType),
                demoProductId: productConfig.id,
                displayName: demoDevice.name
            }).catch(function (navErr) {
                _this.logger.error(_this.TAG, 'Demo navigation failed', navErr);
                _this.toastCtrl.create({
                    message: 'Impossible d’ouvrir cet exemple.',
                    duration: 2500,
                    position: 'bottom'
                }).present();
            });
        });
    };
    ScanPage.prototype.createDemoDevice = function (productConfig, demoProductType) {
        return {
            rssi: -45,
            name: productConfig.demoName,
            address: productConfig.id.toUpperCase() + '-EXEMPLE-0001',
            id: productConfig.id.toUpperCase() + '-EXEMPLE-0001',
            isBonded: true,
            advertisement: {
                serviceUuids: [productConfig.serviceUUID]
            },
            advertising: {
                serviceUuids: [productConfig.serviceUUID]
            },
            isDemo: "true",
            demoProductId: productConfig.id,
            demoProductType: demoProductType,
            productType: demoProductType
        };
    };
    ScanPage.prototype.bleIsNotEnabledAlert = function () {
        var _this = this;
        this.translate.get(['SCAN_PAGE.ALERT.BLENOTENABLE.TITLE', 'SCAN_PAGE.ALERT.BLENOTENABLE.MESSAGE', 'SCAN_PAGE.ALERT.BLENOTENABLE.BUTTONS.NO.TEXT', 'SCAN_PAGE.ALERT.BLENOTENABLE.BUTTONS.YES']).subscribe(function (res) {
            var alert = _this.alertCtrl.create({
                title: res["SCAN_PAGE.ALERT.BLENOTENABLE.TITLE"],
                message: res["SCAN_PAGE.ALERT.BLENOTENABLE.MESSAGE"],
                buttons: [
                    {
                        text: res["SCAN_PAGE.ALERT.BLENOTENABLE.BUTTONS.NO.TEXT"],
                        role: 'cancel'
                    },
                    {
                        text: res["SCAN_PAGE.ALERT.BLENOTENABLE.BUTTONS.YES"],
                        handler: function () {
                            _this.randble.enable().then(function () {
                                setTimeout(function () { return _this.initScan(); }, 1000);
                            });
                        }
                    }
                ],
            });
            alert.present();
        });
    };
    ScanPage.prototype.showEnableBluetoothPopup = function () {
        var _this = this;
        this.alertCtrl.create({
            title: 'Bluetooth désactivé',
            message: 'Le Bluetooth est actuellement désactivé sur le téléphone. Voulez-vous l\’activer et lancer une recherche ?',
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel',
                    handler: function () {
                        // si l'user annule, on autorise une nouvelle tentative plus tard
                        _this.enablePopupAlreadyShown = false;
                    }
                },
                {
                    text: 'Activer',
                    handler: function () {
                        _this.randble.enableAndWait().then(function (ok) {
                            if (ok) {
                                _this.enablePopupAlreadyShown = false;
                                _this.settingsPopupShown = false;
                                _this.permissionPopupShown = false;
                                _this.locationPopupShown = false;
                                _this.logger.info(_this.TAG, 'Bluetooth enabled from popup, re-running pre-scan check');
                                _this.initScan();
                            }
                            else {
                                _this.showBluetoothSettingsPopup();
                            }
                        });
                    }
                }
            ]
        }).present();
    };
    ScanPage.prototype.showBluetoothSettingsPopup = function () {
        var _this = this;
        if (this.settingsPopupShown)
            return;
        this.settingsPopupShown = true;
        this.alertCtrl.create({
            title: 'Activation nécessaire',
            message: 'Le Bluetooth n\’a pas été activé automatiquement. Activez-le dans les paramètres Bluetooth puis relancez la recherche.',
            buttons: [
                {
                    text: 'OK',
                    handler: function () {
                        // autorise une nouvelle tentative plus tard
                        _this.enablePopupAlreadyShown = false;
                        _this.settingsPopupShown = false;
                    }
                },
                {
                    text: 'Ouvrir les paramètres Bluetooth',
                    handler: function () { return _this.openBluetoothSettings(); }
                }
            ]
        }).present();
    };
    ScanPage.prototype.showPermissionSettingsPopup = function (details, isPermanent) {
        var _this = this;
        if (isPermanent === void 0) { isPermanent = false; }
        if (this.permissionPopupShown) {
            this.logger.debug(this.TAG, 'Permission popup skipped: already visible');
            return;
        }
        this.permissionPopupShown = true;
        this.logger.warn(this.TAG, 'Permission settings action requested before scan', details || {});
        var message = isPermanent
            ? 'Impossible de lancer la recherche tant que les autorisations Bluetooth et localisation ne sont pas accordées. Veuillez les activer dans les réglages de l\'application.'
            : 'Activez les autorisations Bluetooth et localisation de l\'application dans les réglages, puis relancez la recherche.';
        this.alertCtrl.create({
            title: 'Autorisations requises',
            message: message,
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel',
                    handler: function () {
                        _this.permissionPopupShown = false;
                    }
                },
                {
                    text: 'Ouvrir les réglages de l\’application',
                    handler: function () {
                        _this.logger.info(_this.TAG, 'Opening app settings from permission popup');
                        _this.randble.openAppSettings().catch(function (error) {
                            _this.logger.error(_this.TAG, 'Open app settings failed from permission popup', error);
                        });
                        _this.permissionPopupShown = false;
                    }
                }
            ]
        }).present();
    };
    ScanPage.prototype.showLocationSettingsPopup = function (details) {
        var _this = this;
        if (this.locationPopupShown) {
            this.logger.debug(this.TAG, 'Location popup skipped: already visible');
            return;
        }
        this.locationPopupShown = true;
        this.logger.warn(this.TAG, 'Location settings action requested before scan', details || {});
        this.alertCtrl.create({
            title: 'Localisation désactivée',
            message: 'Activez la localisation du téléphone pour autoriser le scan Bluetooth, puis relancez la recherche.',
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel',
                    handler: function () {
                        _this.locationPopupShown = false;
                    }
                },
                {
                    text: 'Ouvrir les réglages de localisation',
                    handler: function () {
                        _this.logger.info(_this.TAG, 'Opening location settings from location popup');
                        _this.randble.openLocationSettings().catch(function (error) {
                            _this.logger.error(_this.TAG, 'Open location settings failed from location popup', error);
                        });
                        _this.locationPopupShown = false;
                    }
                }
            ]
        }).present();
    };
    ScanPage.prototype.openBluetoothSettings = function () {
        var _this = this;
        if (this.platform.is('android')) {
            this.logger.info(this.TAG, 'Opening bluetooth settings from popup');
            this.randble.openBluetoothSettings().catch(function (error) {
                _this.logger.error(_this.TAG, 'Open bluetooth settings failed from popup', error);
            });
        }
        else {
            this.logger.info(this.TAG, 'Opening app settings from popup (iOS)');
            this.randble.openAppSettings().catch(function (error) {
                _this.logger.error(_this.TAG, 'Open app settings failed from popup (iOS)', error);
            });
        }
        this.enablePopupAlreadyShown = false;
        this.settingsPopupShown = false;
    };
    ScanPage.prototype.showToast = function (message, duration) {
        if (duration === void 0) { duration = 3000; }
        this.toastCtrl.create({
            message: message,
            duration: duration,
            position: 'bottom'
        }).present();
    };
    ScanPage.prototype.withTimeout = function (promise, timeoutMs, label) {
        var _this = this;
        return new Promise(function (resolve) {
            var settled = false;
            var timeoutHandle = setTimeout(function () {
                if (settled)
                    return;
                settled = true;
                _this.logger.warn(_this.TAG, label + ' timed out', { timeoutMs: timeoutMs });
                resolve(null);
            }, timeoutMs);
            promise.then(function (result) {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timeoutHandle);
                resolve(result);
            }).catch(function (error) {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timeoutHandle);
                _this.logger.warn(_this.TAG, label + ' failed', { error: error });
                resolve(null);
            });
        });
    };
    ScanPage.prototype.connectWithRetry = function (address, attempts) {
        var _this = this;
        if (attempts === void 0) { attempts = 3; }
        var retryDelays = [500, 1000];
        return {
            subscribe: function (next, error) {
                var active = true;
                var attempt = 0;
                var connectedOnce = false;
                var currentSubscription = null;
                var retryTimeout = null;
                var lastError = null;
                var clearRetryTimeout = function () {
                    if (retryTimeout) {
                        clearTimeout(retryTimeout);
                        retryTimeout = null;
                    }
                };
                var unsubscribeCurrent = function () {
                    if (currentSubscription && typeof currentSubscription.unsubscribe === 'function') {
                        try {
                            currentSubscription.unsubscribe();
                        }
                        catch (unsubscribeError) {
                            _this.logger.warn(_this.TAG, 'BLE connect retry unsubscribe failed', {
                                address: address,
                                attempt: attempt,
                                error: unsubscribeError
                            });
                        }
                    }
                    currentSubscription = null;
                };
                var failAttempt = function (attemptError, source) {
                    if (!active)
                        return;
                    if (connectedOnce) {
                        _this.logger.warn(_this.TAG, 'BLE connect stream error after successful connection', {
                            address: address,
                            attempt: attempt,
                            source: source,
                            error: attemptError
                        });
                        error(attemptError);
                        return;
                    }
                    lastError = attemptError;
                    _this.logger.warn(_this.TAG, 'BLE connect attempt failed', {
                        address: address,
                        attempt: attempt,
                        attempts: attempts,
                        source: source,
                        error: attemptError
                    });
                    unsubscribeCurrent();
                    _this.cleanupAfterFailedConnectAttempt(address, attempt, attempts, attemptError).then(function () {
                        if (!active)
                            return;
                        if (attempt >= attempts) {
                            active = false;
                            _this.logger.error(_this.TAG, 'BLE connect failed after retries', {
                                address: address,
                                attempts: attempts,
                                error: lastError
                            });
                            error(lastError || attemptError);
                            return;
                        }
                        var delay = retryDelays[Math.min(attempt - 1, retryDelays.length - 1)];
                        _this.logger.info(_this.TAG, 'BLE connect retry scheduled', {
                            address: address,
                            nextAttempt: attempt + 1,
                            attempts: attempts,
                            delayMs: delay
                        });
                        clearRetryTimeout();
                        retryTimeout = setTimeout(function () { return startAttempt(); }, delay);
                    });
                };
                var startAttempt = function () {
                    if (!active)
                        return;
                    attempt++;
                    _this.logger.info(_this.TAG, 'BLE connect attempt ' + attempt + '/' + attempts, {
                        address: address,
                        attempt: attempt,
                        attempts: attempts
                    });
                    try {
                        currentSubscription = _this.randble.connect({ address: address }).subscribe(function (res) {
                            if (!active)
                                return;
                            if (res && res.status === 'connected') {
                                connectedOnce = true;
                                _this.logger.info(_this.TAG, 'BLE connect attempt succeeded', {
                                    address: address,
                                    attempt: attempt,
                                    attempts: attempts
                                });
                                next(res);
                                return;
                            }
                            if (res && res.status === 'disconnected' && !connectedOnce) {
                                var disconnectError = new Error('BLE disconnected before connection completed');
                                disconnectError.event = res;
                                failAttempt(disconnectError, 'disconnected_before_connected');
                                return;
                            }
                            next(res);
                        }, function (err) { return failAttempt(err, 'connect_error'); });
                    }
                    catch (connectError) {
                        failAttempt(connectError, 'connect_exception');
                    }
                };
                startAttempt();
                return {
                    unsubscribe: function () {
                        active = false;
                        clearRetryTimeout();
                        unsubscribeCurrent();
                    }
                };
            }
        };
    };
    ScanPage.prototype.cleanupAfterFailedConnectAttempt = function (address, attempt, attempts, error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!address || !this.randble || typeof this.randble.close !== 'function') {
                            return [2 /*return*/];
                        }
                        this.logger.debug(this.TAG, 'BLE cleanup after failed connect attempt', {
                            address: address,
                            attempt: attempt,
                            attempts: attempts,
                            error: error
                        });
                        return [4 /*yield*/, this.withTimeout(this.randble.close({ address: address }), 1000, 'BLE close after failed connect attempt')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ScanPage.prototype.clearScanTimeout = function () {
        if (this.scanTimeoutHandle) {
            clearTimeout(this.scanTimeoutHandle);
            this.scanTimeoutHandle = null;
        }
    };
    ScanPage.prototype.clearScanSubscription = function (reason) {
        if (this.scanSubscription && typeof this.scanSubscription.unsubscribe === 'function') {
            try {
                this.scanSubscription.unsubscribe();
                this.logger.debug(this.TAG, 'Scan subscription cleared', { reason: reason });
            }
            catch (error) {
                this.logger.warn(this.TAG, 'Scan subscription clear failed', { reason: reason, error: error });
            }
        }
        this.scanSubscription = null;
    };
    ScanPage.prototype.resetScanResults = function (reason) {
        var previousDevices = this.devices || [];
        var previousSelectedDevice = this.device || {};
        this.clearScanSubscription(reason);
        this.devices = [];
        this.device = {};
        this.detectedDeviceIds = {};
        this.lastLoggedSignalQuality = {};
        this.logger.info(this.TAG, 'Scan device list cleared', {
            reason: reason,
            previousCount: previousDevices.length,
            previousSelectedId: previousSelectedDevice.id || previousSelectedDevice.address || '',
            previousSelectedName: previousSelectedDevice.name || ''
        });
    };
    ScanPage.prototype.getDeviceKey = function (device) {
        return device && (device.address || device.id)
            ? String(device.address || device.id).trim()
            : '';
    };
    ScanPage.prototype.firstNonEmptyString = function (values) {
        for (var i = 0; i < values.length; i++) {
            if (values[i] !== undefined && values[i] !== null) {
                var value = String(values[i]).trim();
                if (value && value !== 'Unknown' && value !== 'Unnamed') {
                    return value;
                }
            }
        }
        return '';
    };
    ScanPage.prototype.resolveScanDeviceName = function (device) {
        var advertisement = device && device.advertisement ? device.advertisement : {};
        var advertising = device && device.advertising ? device.advertising : {};
        var deviceObject = device && device.device ? device.device : {};
        var localName = this.firstNonEmptyString([
            advertisement.localName,
            advertising.localName,
            device ? device.localName : '',
            deviceObject.localName
        ]);
        if (localName) {
            return {
                name: localName,
                source: 'localName',
                isFresh: true
            };
        }
        var fallbackName = this.firstNonEmptyString([
            device ? device.name : '',
            deviceObject.name
        ]);
        return {
            name: fallbackName,
            source: fallbackName ? 'name' : 'empty',
            isFresh: false
        };
    };
    ScanPage.prototype.shouldUpdateDisplayedName = function (currentName, nameInfo) {
        var current = currentName ? String(currentName).trim() : '';
        var next = nameInfo && nameInfo.name ? String(nameInfo.name).trim() : '';
        if (!next) {
            return false;
        }
        // Avant, une fois qu'un nom "frais" (advertisement.localName) avait ete vu, tout futur
        // callback non-fresh (device.name, moins fiable sur certains stacks Android) etait ignore
        // meme s'il refletait un vrai changement (ex: pièce reaffectee sur Widoor/Moventiv/Garline).
        // Resultat : apres un changement de piece, la liste de scan restait bloquee sur l'ancien nom.
        // Les deux sources sont deja filtrees des valeurs "Unknown"/"Unnamed" en amont
        // (firstNonEmptyString), donc un nom different ici est toujours un vrai changement a refleter.
        return current !== next;
    };
    ScanPage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-scan',template:/*ion-inline-start:"C:\Dev\Appli_ble\V2.0\src\pages\scan\scan.html"*/'<ion-header>\n\n  <ion-navbar hideBackButton color="navBarColor">\n\n    <ion-title>\n\n      {{ "SCAN_PAGE.NAVBAR.SELECTION" | translate }}\n\n    </ion-title>\n\n    <ion-buttons end>\n\n      <button ion-button icon-only (click)="presentPopover($event)">\n\n        <ion-icon name="ai-param"></ion-icon>\n\n      </button>\n\n    </ion-buttons>\n\n\n\n  </ion-navbar>\n\n  <ion-toolbar no-border-top color="navBarColor">\n\n    <ion-grid>\n\n      <ion-row>\n\n        <ion-col>\n\n        </ion-col>\n\n        <ion-col>\n\n\n\n          <button justify-content-center align-items-center icon-start [disabled]="isScanning" ion-button\n\n            style="width:100%; height:60px" (click)="initScan()" color="light">\n\n            <ion-icon color="navBarColor" name="search"></ion-icon>\n\n            <div class="searchText" color="navBarColor">{{ "SCAN_PAGE.NAVBAR.SEARCH" | translate }}</div>\n\n          </button>\n\n\n\n        </ion-col>\n\n        <ion-col >\n\n          <ion-spinner color="light" [hidden]="!isScanning" name="crescent" style="zoom:1.5;"></ion-spinner>\n\n        </ion-col>\n\n       \n\n      </ion-row>\n\n    </ion-grid>\n\n  </ion-toolbar>\n\n</ion-header>\n\n\n\n\n\n<ion-content class="outer-content">\n\n  <ion-list *ngIf=\'devices.length !== 0\'>\n\n    <ion-item-sliding *ngFor="let device of devices" (ionDrag)="itemDragged($event, device)" (ionSwipe)="swipe()">\n\n      <button ion-item (click)="deviceSelected(device)">\n\n        <h2 text-wrap>\n\n          <b>{{ "SCAN_PAGE.NAME" | translate }}</b> {{device?._displayName || \'Unnamed\' }}</h2>\n\n\n\n        <p text-wrap *ngIf="(isVisibleMac) && (!viewisIos)">\n\n          {{ "SCAN_PAGE.MAC_ADDRESS" | translate }}\n\n          {{device?.address}}\n\n        </p>\n\n        <p text-wrap *ngIf="(isVisibleMac) && (viewisIos)">\n\n          {{ "SCAN_PAGE.UUID_ADDRESS" | translate }}\n\n          {{device?.address}}\n\n        </p>\n\n\n\n        <p *ngIf="getSignalQualityIcon(device?.rssi)">{{ "SCAN_PAGE.SIGNAL_QUALITY" | translate }}\n\n          <span> <img [src]="getSignalQualityIcon(device?.rssi)" class="img-full"> </span>\n\n        </p>\n\n\n\n        <ion-icon item-start *ngIf="device?._roomSuffix === \'#CHA\'" name="ai-loc-cha" large color="wimGreyColor">\n\n        </ion-icon>\n\n        <ion-icon item-start *ngIf="device?._roomSuffix === \'#SAL\'" name="ai-loc-sal" large color="wimGreyColor">\n\n        </ion-icon>\n\n        <ion-icon item-start *ngIf="device?._roomSuffix === \'#CUI\'" name="ai-loc-cui" large color="wimGreyColor">\n\n        </ion-icon>\n\n        <ion-icon item-start *ngIf="device?._roomSuffix === \'#SAM\'" name="ai-loc-sam" large color="wimGreyColor">\n\n        </ion-icon>\n\n        <ion-icon item-start *ngIf="device?._roomSuffix === \'#SDB\'" name="ai-loc-sdb" large color="wimGreyColor">\n\n        </ion-icon>\n\n        <ion-icon item-start *ngIf="device?._roomSuffix === \'#WCS\'" name="ai-loc-wcs" large color="wimGreyColor">\n\n        </ion-icon>\n\n        <ion-icon item-start *ngIf="device?._roomSuffix === \'#GAR\'" name="ai-loc-garage" large color="wimGreyColor">\n\n        </ion-icon>\n\n        <ion-icon item-start *ngIf="device?._roomSuffix === \'#SDJ\'" name="ai-loc-sdj" large color="wimGreyColor">\n\n        </ion-icon>\n\n        <ion-icon item-start *ngIf="device?._roomSuffix === \'#SLL\' || device?._roomSuffix === \'#ENT\'" name="ai-loc-autre" large color="wimGreyColor">\n\n        </ion-icon>\n\n        <ion-icon item-start *ngIf="!device?._roomSuffix" name="moventiv-room_other" large color="wimGreyColor">\n\n        </ion-icon>\n\n      </button>\n\n\n\n\n\n    </ion-item-sliding>\n\n  </ion-list>\n\n  <div *ngIf=\'devices.length === 0\'>\n\n    <div *ngIf="isScanning" class="noMotDiv" text-center justify-content-center align-items-center>\n\n      <p justify-content-center align-items-center style="height: 100%">\n\n        {{ "SCAN_PAGE.SEARCHING_INPROGRESS" | translate }}</p>\n\n    </div>\n\n\n\n    <div *ngIf="!isScanning" class="noMotDiv" text-center justify-content-center align-items-center>\n\n      <p justify-content-center align-items-center style="height: 100%">{{ "SCAN_PAGE.SEARCHING_NOMOT" | translate }}\n\n      </p>\n\n    </div>\n\n\n\n  </div>\n\n\n\n\n\n  <ion-fab right bottom>\n\n    <button ion-fab color="mantionSmtgreen" (click)="pushInfoSlide()">\n\n      Infos\n\n    </button>\n\n  </ion-fab>\n\n\n\n  <ion-fab left bottom>\n\n      <button ion-fab color="mantionSmtblue" (click)="launchDemoMode()">\n\n          {{ "SCAN_PAGE.CIRCLEBUTTONS.EXAMPLE" | translate }}\n\n      </button>\n\n    </ion-fab>\n\n\n\n</ion-content>\n\n'/*ion-inline-end:"C:\Dev\Appli_ble\V2.0\src\pages\scan\scan.html"*/
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["k" /* NavController */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["j" /* LoadingController */],
            __WEBPACK_IMPORTED_MODULE_4__providers_randble_randble__["a" /* RandBLE */],
            __WEBPACK_IMPORTED_MODULE_0__angular_core__["M" /* NgZone */],
            __WEBPACK_IMPORTED_MODULE_2__ionic_storage__["b" /* Storage */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["p" /* PopoverController */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["l" /* NavParams */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["o" /* Platform */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["a" /* AlertController */],
            __WEBPACK_IMPORTED_MODULE_3__ngx_translate_core__["c" /* TranslateService */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["q" /* ToastController */],
            __WEBPACK_IMPORTED_MODULE_5__providers_bleconnectservice_bleconnectservice__["a" /* BleconnectserviceProvider */],
            __WEBPACK_IMPORTED_MODULE_6__providers_logger_logger_service__["a" /* LoggerService */],
            __WEBPACK_IMPORTED_MODULE_7__providers_roomcache_roomcache__["a" /* RoomCacheProvider */]])
    ], ScanPage);
    return ScanPage;
}());

//# sourceMappingURL=scan.js.map

/***/ }),

/***/ 679:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export ROOM_SUFFIXES */
/* harmony export (immutable) */ __webpack_exports__["a"] = extractRoomSuffix;
/* harmony export (immutable) */ __webpack_exports__["b"] = stripRoomSuffix;
/* unused harmony export roomIconForSuffix */
// L'affectation de piece est encodee en suffixe (4 caracteres) ajoute a la fin du nom BLE
// du moteur (ex: "Firma#SDJ"), partage par WIDOOR / MOVENTIV / GARLINE. Ce module centralise
// la liste des suffixes et leur resolution en icone pour le nouveau cache local piece
// (voir RoomCacheService) et scan.ts, sans toucher aux copies deja existantes dans
// widoor.ts/moventiv.ts (qui gerent en plus le formulaire d'edition).
var ROOM_SUFFIXES = [
    '#CHA', '#ENT', '#SAL', '#CUI', '#SAM', '#SDB', '#WCS', '#GAR', '#SLL', '#SDJ'
];
function extractRoomSuffix(name) {
    var value = name || '';
    for (var i = 0; i < ROOM_SUFFIXES.length; i++) {
        var suffix = ROOM_SUFFIXES[i];
        if (value.lastIndexOf(suffix) === value.length - suffix.length) {
            return suffix;
        }
    }
    return '';
}
// Nom de base (sans suffixe de piece), utilise pour l'affichage du nom du moteur au scan.
function stripRoomSuffix(name) {
    var value = name || '';
    for (var i = 0; i < ROOM_SUFFIXES.length; i++) {
        var suffix = ROOM_SUFFIXES[i];
        if (value.lastIndexOf(suffix) === value.length - suffix.length) {
            value = value.substring(0, value.length - suffix.length);
        }
    }
    return value;
}
function roomIconForSuffix(suffix) {
    switch (suffix) {
        case '#CHA': return 'ai-loc-cha';
        case '#SAL': return 'ai-loc-sal';
        case '#CUI': return 'ai-loc-cui';
        case '#SAM': return 'ai-loc-sam';
        case '#SDB': return 'ai-loc-sdb';
        case '#WCS': return 'ai-loc-wcs';
        case '#GAR': return 'ai-loc-garage';
        case '#SDJ': return 'ai-loc-sdj';
        case '#SLL':
        case '#ENT':
            return 'ai-loc-autre';
        default:
            return '';
    }
}
//# sourceMappingURL=room-suffix.js.map

/***/ })

});
//# sourceMappingURL=2.js.map