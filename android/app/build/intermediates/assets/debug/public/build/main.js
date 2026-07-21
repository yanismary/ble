webpackJsonp([13],{

/***/ 105:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return RandBLE; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__capacitor_device__ = __webpack_require__(106);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_rxjs_Observable__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_rxjs_Observable___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_rxjs_Observable__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__logger_logger_service__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_fromPromise__ = __webpack_require__(272);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_fromPromise___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_fromPromise__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_rxjs_add_observable_of__ = __webpack_require__(273);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_rxjs_add_observable_of___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6_rxjs_add_observable_of__);
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

var BleClient = __webpack_require__(209).BleClient;






var RandBLE = /** @class */ (function () {
    function RandBLE(platform, logger) {
        var _this = this;
        this.platform = platform;
        this.logger = logger;
        // --- CONSTANTES ---
        this.SCAN_MODE_OPPORTUNISTIC = -1;
        this.SCAN_MODE_LOW_POWER = 0;
        this.SCAN_MODE_BALANCED = 1;
        this.SCAN_MODE_LOW_LATENCY = 2;
        this.MATCH_NUM_ONE_ADVERTISEMENT = 1;
        this.MATCH_NUM_FEW_ADVERTISEMENT = 2;
        this.MATCH_NUM_MAX_ADVERTISEMENT = 3;
        this.MATCH_MODE_AGGRESSIVE = 1;
        this.MATCH_MODE_STICKY = 2;
        this.CALLBACK_TYPE_ALL_MATCHES = 1;
        this.CALLBACK_TYPE_FIRST_MATCH = 2;
        this.CALLBACK_TYPE_MATCH_LOST = 4;
        this.isEnablingBt = false;
        this.bleInitialized = false;
        this.TAG = 'RandBLE';
        this.platform.ready().then(function () { return __awaiter(_this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (this.platform.is('android')) {
                            this.logger.info(this.TAG, 'BleClient initialization deferred until scan on Android');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.initializeBleClient('constructor')];
                    case 1:
                        _a.sent();
                        this.logger.info(this.TAG, 'BleClient initialized');
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        this.logger.error(this.TAG, 'BleClient initialization error', e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    }
    // --- INITIALISATION ---
    RandBLE.prototype.initialize = function (_params) {
        return this.initializeBleClient('initialize').then(function () {
            return BleClient.isEnabled().then(function (enabled) {
                return {
                    status: enabled ? 'enabled' : 'disabled'
                };
            });
        }, function (error) {
            return { status: 'disabled', message: error };
        });
    };
    RandBLE.prototype.initializeBleClient = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.bleInitialized) {
                            this.logger.info(this.TAG, 'BLE already initialized, skipping', { context: context });
                            return [2 /*return*/];
                        }
                        this.logger.info(this.TAG, 'BLE permission initialization requested', {
                            context: context,
                            androidNeverForLocation: false
                        });
                        if (!this.platform.is('android')) return [3 /*break*/, 2];
                        return [4 /*yield*/, BleClient.initialize({ androidNeverForLocation: false })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, BleClient.initialize()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        this.bleInitialized = true;
                        this.logger.info(this.TAG, 'BLE initialized', {
                            context: context
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    RandBLE.prototype.isEnabled = function () {
        return BleClient.isEnabled().then(function (isEnabled) {
            return { isEnabled: isEnabled };
        });
    };
    RandBLE.prototype.isDisabled = function () {
        return BleClient.isEnabled().then(function (isEnabled) {
            return { isDisabled: !isEnabled };
        });
    };
    RandBLE.prototype.enable = function () {
        var anyBle = BleClient;
        if (typeof anyBle.requestEnable === 'function') {
            return anyBle.requestEnable(); // versions récentes
        }
        // Fallback anciennes versions
        if (typeof anyBle.enable === 'function') {
            return anyBle.enable();
        }
        return Promise.reject(new Error('No enable method available on BleClient'));
    };
    RandBLE.prototype.disable = function () {
        return this.openBluetoothSettings();
    };
    RandBLE.prototype.getAdapterInfo = function () {
        return BleClient.isEnabled().then(function (enabled) { return ({
            name: 'Adapter',
            address: '00:00:00:00:00:00',
            isInitialized: true,
            isEnabled: enabled,
            isScanning: false,
            isDiscoverable: true
        }); });
    };
    RandBLE.prototype.prepareForScan = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1, enabled, error_2, androidMajor, locationRequired, locationEnabled, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info(this.TAG, 'Pre-scan check started');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.initializeBleClient('prepareForScan')];
                    case 2:
                        _a.sent();
                        if (this.platform.is('android')) {
                            this.logger.info(this.TAG, 'Android location permission granted for BLE scan');
                            this.logger.info(this.TAG, 'Android bluetooth permission granted for BLE scan');
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        if (this.isPermissionDeniedError(error_1)) {
                            this.logger.warn(this.TAG, 'Pre-scan blocked: location/bluetooth permission denied during initialize', error_1);
                            return [2 /*return*/, { ready: false, reason: 'PERMISSION_DENIED', details: { stage: 'initialize', error: error_1 } }];
                        }
                        this.logger.error(this.TAG, 'Pre-scan failed during initialize', error_1);
                        return [2 /*return*/, { ready: false, reason: 'PRECHECK_FAILED', details: { stage: 'initialize', error: error_1 } }];
                    case 4:
                        enabled = false;
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, BleClient.isEnabled()];
                    case 6:
                        enabled = _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        error_2 = _a.sent();
                        if (this.isPermissionDeniedError(error_2)) {
                            this.logger.warn(this.TAG, 'Pre-scan blocked: permission denied during isEnabled', error_2);
                            return [2 /*return*/, { ready: false, reason: 'PERMISSION_DENIED', details: { stage: 'isEnabled', error: error_2 } }];
                        }
                        this.logger.error(this.TAG, 'Pre-scan failed during isEnabled', error_2);
                        return [2 /*return*/, { ready: false, reason: 'PRECHECK_FAILED', details: { stage: 'isEnabled', error: error_2 } }];
                    case 8:
                        if (!enabled) {
                            this.logger.warn(this.TAG, 'Pre-scan blocked: bluetooth disabled');
                            return [2 /*return*/, { ready: false, reason: 'BLE_DISABLED', details: { stage: 'isEnabled' } }];
                        }
                        this.logger.info(this.TAG, 'Pre-scan bluetooth permission/state check passed');
                        if (!this.platform.is('android')) return [3 /*break*/, 13];
                        return [4 /*yield*/, this.getAndroidMajorVersion()];
                    case 9:
                        androidMajor = _a.sent();
                        locationRequired = (androidMajor !== null && androidMajor <= 11);
                        this.logger.debug(this.TAG, 'Pre-scan Android policy evaluated', {
                            androidMajor: androidMajor,
                            locationRequired: locationRequired
                        });
                        if (!(locationRequired && typeof BleClient.isLocationEnabled === 'function')) return [3 /*break*/, 13];
                        _a.label = 10;
                    case 10:
                        _a.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, BleClient.isLocationEnabled()];
                    case 11:
                        locationEnabled = _a.sent();
                        if (!locationEnabled) {
                            this.logger.warn(this.TAG, 'Pre-scan blocked: location disabled on Android <= 11', {
                                androidMajor: androidMajor
                            });
                            return [2 /*return*/, { ready: false, reason: 'LOCATION_DISABLED', details: { stage: 'isLocationEnabled', androidMajor: androidMajor } }];
                        }
                        this.logger.info(this.TAG, 'Pre-scan Android location services enabled', {
                            androidMajor: androidMajor
                        });
                        return [3 /*break*/, 13];
                    case 12:
                        error_3 = _a.sent();
                        if (this.isPermissionDeniedError(error_3)) {
                            this.logger.warn(this.TAG, 'Pre-scan blocked: permission denied during location check', error_3);
                            return [2 /*return*/, { ready: false, reason: 'PERMISSION_DENIED', details: { stage: 'isLocationEnabled', error: error_3 } }];
                        }
                        this.logger.error(this.TAG, 'Pre-scan failed during location check', error_3);
                        return [2 /*return*/, { ready: false, reason: 'PRECHECK_FAILED', details: { stage: 'isLocationEnabled', error: error_3 } }];
                    case 13:
                        this.logger.info(this.TAG, 'Pre-scan check ready');
                        return [2 /*return*/, { ready: true, reason: 'READY' }];
                }
            });
        });
    };
    RandBLE.prototype.openLocationSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info(this.TAG, 'Opening location settings');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BleClient.openLocationSettings()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        this.logger.error(this.TAG, 'Open location settings failed', error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RandBLE.prototype.openBluetoothSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info(this.TAG, 'Opening bluetooth settings');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BleClient.openBluetoothSettings()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        this.logger.error(this.TAG, 'Open bluetooth settings failed', error_5);
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RandBLE.prototype.openAppSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info(this.TAG, 'Opening app settings');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BleClient.openAppSettings()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_6 = _a.sent();
                        this.logger.error(this.TAG, 'Open app settings failed', error_6);
                        throw error_6;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // --- SCANNING ---
    RandBLE.prototype.normalizeScanError = function (error, defaultCode) {
        if (defaultCode === void 0) { defaultCode = 'BLE_SCAN_FAILED'; }
        var rawText = error && (error.message || error.errorMessage || error.code || error.toString)
            ? String(error.message || error.errorMessage || error.code || error.toString())
            : String(error);
        var normalizedText = rawText.toLowerCase();
        var permissionKeywords = [
            'permission',
            'denied',
            'not authorized',
            'not permitted',
            'location',
            'bluetooth_scan',
            'bluetooth_connect'
        ];
        var code = defaultCode;
        var message = rawText || 'Scan failed';
        if (normalizedText.indexOf('ble_disabled') > -1 || normalizedText.indexOf('bluetooth disabled') > -1) {
            code = 'BLE_DISABLED';
            message = 'Bluetooth is disabled';
        }
        else {
            var isPermissionError = permissionKeywords.some(function (keyword) { return normalizedText.indexOf(keyword) > -1; });
            if (isPermissionError) {
                code = 'BLE_PERMISSION_DENIED';
                message = 'Bluetooth permission denied';
            }
        }
        return {
            code: code,
            message: message,
            raw: error
        };
    };
    RandBLE.prototype.createPreScanBlockedError = function (precheck) {
        var reason = precheck && precheck.reason ? precheck.reason : 'PRECHECK_FAILED';
        var code = 'BLE_PRECHECK_FAILED';
        var message = 'BLE pre-scan check failed';
        if (reason === 'BLE_DISABLED') {
            code = 'BLE_DISABLED';
            message = 'Bluetooth is disabled';
        }
        else if (reason === 'PERMISSION_DENIED') {
            code = 'BLE_PERMISSION_DENIED';
            message = 'Bluetooth/location permission denied';
        }
        else if (reason === 'LOCATION_DISABLED') {
            code = 'BLE_LOCATION_DISABLED';
            message = 'Location services disabled';
        }
        return {
            code: code,
            message: message,
            reason: reason,
            raw: precheck
        };
    };
    RandBLE.prototype.createMissingDeviceIdError = function (context, params) {
        var error = new Error('Identifiant Bluetooth manquant (deviceId/address/id).');
        error.code = 'BLE_DEVICE_ID_MISSING';
        error.context = context;
        error.params = params;
        return error;
    };
    RandBLE.prototype.isPermissionDeniedError = function (error) {
        var rawText = error && (error.message || error.errorMessage || error.code || error.toString)
            ? String(error.message || error.errorMessage || error.code || error.toString())
            : String(error);
        var normalizedText = rawText.toLowerCase();
        var permissionKeywords = [
            'permission',
            'denied',
            'not authorized',
            'not permitted',
            'unauthorized',
            'refused',
            'location',
            'bluetooth_scan',
            'bluetooth_connect'
        ];
        return permissionKeywords.some(function (keyword) { return normalizedText.indexOf(keyword) > -1; });
    };
    RandBLE.prototype.getAndroidMajorVersion = function () {
        return __awaiter(this, void 0, void 0, function () {
            var info, osVersion, match, major, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, __WEBPACK_IMPORTED_MODULE_1__capacitor_device__["a" /* Device */].getInfo()];
                    case 1:
                        info = _a.sent();
                        osVersion = info && info.osVersion ? String(info.osVersion) : '';
                        match = osVersion.match(/\d+/);
                        if (!match) {
                            return [2 /*return*/, null];
                        }
                        major = parseInt(match[0], 10);
                        return [2 /*return*/, isNaN(major) ? null : major];
                    case 2:
                        error_7 = _a.sent();
                        this.logger.warn(this.TAG, 'Unable to resolve Android version, location pre-check skipped', error_7);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RandBLE.prototype.startScan = function (params) {
        var _this = this;
        return new __WEBPACK_IMPORTED_MODULE_2_rxjs_Observable__["Observable"](function (observer) {
            var services = params.services || [];
            var scanMode = params.scanMode || _this.SCAN_MODE_LOW_LATENCY;
            var allowDuplicates = (params.allowDuplicates !== undefined ? params.allowDuplicates : true);
            _this.logger.info(_this.TAG, 'Scan start requested', {
                services: services,
                scanMode: scanMode,
                allowDuplicates: allowDuplicates
            });
            (function () { return __awaiter(_this, void 0, void 0, function () {
                var precheck, blockedError, e_2, normalizedError;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.prepareForScan()];
                        case 1:
                            precheck = _a.sent();
                            if (!precheck.ready) {
                                blockedError = this.createPreScanBlockedError(precheck);
                                this.logger.warn(this.TAG, 'Scan blocked before requestLEScan', blockedError);
                                observer.error(blockedError);
                                return [2 /*return*/];
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            e_2 = _a.sent();
                            normalizedError = this.normalizeScanError(e_2);
                            this.logger.error(this.TAG, 'Scan pre-check failed', normalizedError);
                            observer.error(normalizedError);
                            return [2 /*return*/];
                        case 3:
                            this.logger.info(this.TAG, 'Scan launched after permissions check', {
                                services: services,
                                scanMode: scanMode,
                                allowDuplicates: allowDuplicates
                            });
                            observer.next({ status: 'scanStarted' });
                            BleClient.requestLEScan({
                                services: services,
                                allowDuplicates: allowDuplicates,
                                scanMode: scanMode
                            }, function (result) {
                                var deviceId = (result && result.device) ? result.device.deviceId : null;
                                var name = (result && result.localName) ? result.localName
                                    : ((result && result.device && result.device.name) ? result.device.name : 'Unknown');
                                _this.logger.debug(_this.TAG, 'Scan result received', {
                                    deviceId: deviceId,
                                    name: name,
                                    rssi: result ? result.rssi : null
                                });
                                observer.next({
                                    status: 'scanResult',
                                    address: deviceId,
                                    id: deviceId,
                                    name: name,
                                    rssi: result.rssi,
                                    advertisement: {
                                        serviceUuids: result.uuids,
                                        localName: result.localName,
                                        manufacturerData: result.manufacturerData
                                    }
                                });
                            }).catch(function (err) {
                                var normalizedError = _this.normalizeScanError(err);
                                _this.logger.error(_this.TAG, 'Scan request failed', normalizedError);
                                observer.error(normalizedError);
                            });
                            return [2 /*return*/];
                    }
                });
            }); })();
        });
    };
    RandBLE.prototype.stopScan = function () {
        var _this = this;
        return BleClient.stopLEScan().then(function () {
            _this.logger.info(_this.TAG, 'Scan stopped');
            return { status: 'scanStopped' };
        }).catch(function (err) {
            var normalizedError = _this.normalizeScanError(err);
            _this.logger.error(_this.TAG, 'Scan stop failed', normalizedError);
            throw normalizedError;
        });
    };
    // --- CONNEXION ---
    RandBLE.prototype.connect = function (params) {
        var _this = this;
        return new __WEBPACK_IMPORTED_MODULE_2_rxjs_Observable__["Observable"](function (observer) {
            var active = true;
            var emitNext = function (payload, source) {
                if (!active) {
                    _this.logger.debug(_this.TAG, 'Connect emit skipped: observer inactive', {
                        source: source,
                        payload: payload
                    });
                    return;
                }
                observer.next(payload);
            };
            var emitError = function (error, source) {
                if (!active) {
                    _this.logger.debug(_this.TAG, 'Connect error skipped: observer inactive', {
                        source: source,
                        error: error
                    });
                    return;
                }
                active = false;
                observer.error(error);
            };
            var address = params && params.address ? String(params.address).trim() : '';
            if (!address) {
                var missingIdError = _this.createMissingDeviceIdError('connect', params);
                _this.logger.error(_this.TAG, 'Connection blocked: missing device id', missingIdError);
                emitError(missingIdError, 'missing_device_id');
                return;
            }
            _this.logger.info(_this.TAG, 'Connection attempt', { address: address });
            var CONNECT_TIMEOUT_MS = 15000;
            var timeoutHandle = setTimeout(function () {
                if (!active)
                    return;
                _this.logger.error(_this.TAG, 'Connection timeout', { address: address, timeoutMs: CONNECT_TIMEOUT_MS });
                emitError(new Error('BLE connect timeout after ' + CONNECT_TIMEOUT_MS + 'ms'), 'connect_timeout');
            }, CONNECT_TIMEOUT_MS);
            BleClient.connect(address, function (deviceId) {
                _this.logger.warn(_this.TAG, 'Runtime disconnection', { address: deviceId });
                emitNext({ status: 'disconnected', address: deviceId }, 'runtime_disconnection');
            })
                .then(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            clearTimeout(timeoutHandle);
                            return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 600); })];
                        case 1:
                            _a.sent();
                            this.logger.info(this.TAG, 'Connection established', { address: address });
                            emitNext({ status: 'connected', address: address }, 'connected');
                            return [2 /*return*/];
                    }
                });
            }); })
                .catch(function (err) {
                clearTimeout(timeoutHandle);
                _this.logger.error(_this.TAG, 'Connection failed', { address: address, error: err });
                emitError(err, 'connect_failure');
            });
            return function () {
                if (!active)
                    return;
                active = false;
                clearTimeout(timeoutHandle);
                _this.logger.debug(_this.TAG, 'Connect observable unsubscribed', { address: address });
            };
        });
    };
    RandBLE.prototype.disconnect = function (params) {
        var deviceId = this.resolveDeviceId(params);
        return BleClient.disconnect(deviceId).then(function () {
            return { status: 'disconnected', address: deviceId, name: '' };
        });
    };
    RandBLE.prototype.close = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!params || !params.address) {
                            this.logger.warn(this.TAG, 'Close called without address, ignoring');
                            return [2 /*return*/, Promise.resolve()];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BleClient.disconnect(params.address)];
                    case 2:
                        _a.sent();
                        this.logger.info(this.TAG, 'Disconnected', { address: params.address });
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _a.sent();
                        this.logger.error(this.TAG, 'Disconnect error', { address: params.address, error: e_3 });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // ATTENTION: sur iOS, getConnectedDevices() utilise CBCentralManager.retrieveConnectedPeripherals(withServices:)
    // qui ne renvoie RIEN si la liste de services est vide (documente par le plugin @capacitor-community/bluetooth-le).
    // Sur Android, la liste de services est ignoree (BluetoothManager.getConnectedDevices ne filtre pas dessus).
    // Sans le service concerne, cet appel renvoie donc toujours isConnected=false sur iOS, meme si l'appareil
    // est bien connecte : les appelants doivent fournir le(s) service(s) UUID de l'ecriture qu'ils s'appretent a faire.
    RandBLE.prototype.isConnected = function (params) {
        return __WEBPACK_IMPORTED_MODULE_2_rxjs_Observable__["Observable"].fromPromise(BleClient.getConnectedDevices(params.services || []).then(function (devices) {
            var found = devices.find(function (d) { return d.deviceId === params.address; });
            return { isConnected: !!found };
        }).catch(function () {
            return { isConnected: false };
        }));
    };
    // --- SERVICES / DISCOVERY ---
    RandBLE.prototype.getMtu = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var mtu, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, BleClient.getMtu(address)];
                    case 1:
                        mtu = _a.sent();
                        this.logger.debug(this.TAG, 'Current MTU resolved', { address: address, mtu: mtu });
                        return [2 /*return*/, mtu];
                    case 2:
                        e_4 = _a.sent();
                        this.logger.error(this.TAG, 'Could not get MTU', { address: address, error: e_4 });
                        return [2 /*return*/, 23];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RandBLE.prototype.discover = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var address, missingIdError, services, error, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        address = params && params.address ? String(params.address).trim() : '';
                        if (!address) {
                            missingIdError = this.createMissingDeviceIdError('discover', params);
                            this.logger.error(this.TAG, 'Discovery blocked: missing device id', missingIdError);
                            throw missingIdError;
                        }
                        this.logger.info(this.TAG, 'Discovery attempt', { address: address });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BleClient.getServices(address)];
                    case 2:
                        services = _a.sent();
                        if (!services || services.length === 0) {
                            error = new Error('Aucun service Bluetooth détecté sur l’appareil.');
                            this.logger.error(this.TAG, 'Discovery failed: no services found', { address: address, error: error });
                            throw error;
                        }
                        this.logger.info(this.TAG, 'Discovery success', { address: address, servicesCount: services.length });
                        return [2 /*return*/, {
                                status: 'discovered',
                                address: address,
                                services: services
                            }];
                    case 3:
                        error_8 = _a.sent();
                        this.logger.error(this.TAG, 'Discovery failed', { address: address, error: error_8 });
                        throw error_8;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RandBLE.prototype.resolveDeviceId = function (params) {
        var deviceId = (params && (params.deviceId || params.address || params.id)) ||
            (params && params.peripheral && (params.peripheral.deviceId || params.peripheral.address || params.peripheral.id));
        if (!deviceId) {
            var missingIdError = this.createMissingDeviceIdError('resolveDeviceId', params);
            this.logger.error(this.TAG, 'Missing deviceId in BLE call', missingIdError);
            throw missingIdError;
        }
        return deviceId;
    };
    // --- LECTURE / ECRITURE ---
    RandBLE.prototype.read = function (params) {
        var _this = this;
        var deviceId = this.resolveDeviceId(params);
        return BleClient.read(deviceId, params.service, params.characteristic)
            .then(function (dataView) {
            _this.logVersionWordDataViewDiagnostics(params, dataView);
            var base64 = _this.dataViewToEncodedString(dataView);
            return { value: base64, status: 'read', name: '', service: params.service, characteristic: params.characteristic };
        });
    };
    RandBLE.prototype.write = function (params) {
        var deviceId = this.resolveDeviceId(params);
        var dataView = this.str2ab(params.value);
        return BleClient.write(deviceId, params.service, params.characteristic, dataView)
            .then(function () {
            return { status: 'written', value: params.value };
        });
    };
    // --- NOTIFICATIONS ---
    RandBLE.prototype.subscribe = function (params) {
        var _this = this;
        return new __WEBPACK_IMPORTED_MODULE_2_rxjs_Observable__["Observable"](function (observer) {
            observer.next({ status: 'subscribed', value: '' });
            var deviceId;
            try {
                deviceId = _this.resolveDeviceId(params);
            }
            catch (e) {
                observer.error(e);
                return;
            }
            BleClient.startNotifications(deviceId, params.service, params.characteristic, function (value) {
                var base64 = _this.dataViewToEncodedString(value);
                observer.next({ status: 'subscribedResult', value: base64 });
            }).catch(function (err) { return observer.error(err); });
            return function () {
                BleClient.stopNotifications(deviceId, params.service, params.characteristic);
            };
        });
    };
    RandBLE.prototype.unsubscribe = function (params) {
        var deviceId = this.resolveDeviceId(params);
        return BleClient.stopNotifications(deviceId, params.service, params.characteristic);
    };
    // --- BONDING ---
    RandBLE.prototype.bond = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, BleClient.createBond(params.address)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { status: 'bonded' }];
                    case 2:
                        error_9 = _a.sent();
                        this.logger.error(this.TAG, 'Bonding failed', { address: params.address, error: error_9 });
                        throw error_9;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RandBLE.prototype.isBonded = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var isBonded, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, BleClient.isBonded(params.address)];
                    case 1:
                        isBonded = _a.sent();
                        return [2 /*return*/, { isBonded: isBonded }];
                    case 2:
                        error_10 = _a.sent();
                        return [2 /*return*/, { isBonded: false }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // --- UTILITAIRES DE CONVERSION ---
    RandBLE.prototype.dataViewToEncodedString = function (dataView) {
        var bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
        return this.uint8ArrayToEncodedString(bytes);
    };
    RandBLE.prototype.uint8ArrayToEncodedString = function (bytes) {
        var binary = '';
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };
    RandBLE.prototype.str2ab = function (base64) {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return new DataView(bytes.buffer);
    };
    RandBLE.prototype.bytesToEncodedString = function (bytes) {
        return this.uint8ArrayToEncodedString(bytes);
    };
    RandBLE.prototype.logVersionWordDataViewDiagnostics = function (params, dataView) {
        if (!params || String(params.characteristic || '').toLowerCase() !== '175d6bc8-5840-4037-95da-a778395a036c') {
            return;
        }
        var bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
        var productTypeByte = bytes.length > 12 ? bytes[12] : undefined;
        this.logger.debug(this.TAG, '[ProductDetection] BLE DataView read diagnostics', {
            service: params.service,
            characteristic: params.characteristic,
            dataViewByteOffset: dataView.byteOffset,
            dataViewByteLength: dataView.byteLength,
            bufferByteLength: dataView.buffer ? dataView.buffer.byteLength : 0,
            bytesHex: this.bytesToHex(bytes),
            productTypeByte: productTypeByte,
            productTypeByteType: typeof productTypeByte
        });
    };
    RandBLE.prototype.bytesToHex = function (bytes) {
        var hexParts = [];
        for (var i = 0; i < bytes.length; i++) {
            var value = Number(bytes[i]) & 0xFF;
            hexParts.push(('0' + value.toString(16)).slice(-2).toUpperCase());
        }
        return hexParts.join(' ');
    };
    RandBLE.prototype.encodedStringToBytes = function (encoded) {
        var binary_string = window.atob(encoded);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    };
    RandBLE.prototype.stringToBytes = function (string) {
        var bytes = new Uint8Array(string.length);
        for (var i = 0; i < string.length; i++) {
            bytes[i] = string.charCodeAt(i);
        }
        return bytes;
    };
    RandBLE.prototype.bytesToString = function (bytes) {
        return String.fromCharCode.apply(null, bytes);
    };
    RandBLE.prototype.sleep = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    RandBLE.prototype.enableAndWait = function () {
        return __awaiter(this, void 0, void 0, function () {
            var e_5, enabled;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isEnablingBt)
                            return [2 /*return*/, false];
                        this.isEnablingBt = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 16, 17]);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.enable()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_5 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5: return [4 /*yield*/, BleClient.isEnabled()];
                    case 6:
                        enabled = _a.sent();
                        if (!!enabled) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.sleep(400)];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, BleClient.isEnabled()];
                    case 8:
                        enabled = _a.sent();
                        _a.label = 9;
                    case 9:
                        if (!!enabled) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.sleep(600)];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, BleClient.isEnabled()];
                    case 11:
                        enabled = _a.sent();
                        _a.label = 12;
                    case 12:
                        if (!!enabled) return [3 /*break*/, 15];
                        return [4 /*yield*/, this.sleep(800)];
                    case 13:
                        _a.sent();
                        return [4 /*yield*/, BleClient.isEnabled()];
                    case 14:
                        enabled = _a.sent();
                        _a.label = 15;
                    case 15: return [2 /*return*/, enabled];
                    case 16:
                        this.isEnablingBt = false;
                        return [7 /*endfinally*/];
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    RandBLE = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])(),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_3_ionic_angular__["o" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__logger_logger_service__["a" /* LoggerService */]])
    ], RandBLE);
    return RandBLE;
}());

//# sourceMappingURL=randble.js.map

/***/ }),

/***/ 121:
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncatched exception popping up in devtools
	return Promise.resolve().then(function() {
		throw new Error("Cannot find module '" + req + "'.");
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = 121;

/***/ }),

/***/ 164:
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"../pages/about/about.module": [
		301,
		4
	],
	"../pages/contact/contact.module": [
		302,
		10
	],
	"../pages/gcu/gcu.module": [
		303,
		9
	],
	"../pages/help/help.module": [
		307,
		8
	],
	"../pages/infoSlide/infoSlide.module": [
		304,
		5
	],
	"../pages/moventiv/moventiv.module": [
		313,
		0
	],
	"../pages/param/param.module": [
		305,
		3
	],
	"../pages/popover/popover.module": [
		309,
		7
	],
	"../pages/scan/scan.module": [
		310,
		2
	],
	"../pages/who/who.module": [
		308,
		6
	],
	"../pages/widoor/widoor.module": [
		312,
		1
	]
};
function webpackAsyncContext(req) {
	var ids = map[req];
	if(!ids)
		return Promise.reject(new Error("Cannot find module '" + req + "'."));
	return __webpack_require__.e(ids[1]).then(function() {
		return __webpack_require__(ids[0]);
	});
};
webpackAsyncContext.keys = function webpackAsyncContextKeys() {
	return Object.keys(map);
};
webpackAsyncContext.id = 164;
module.exports = webpackAsyncContext;

/***/ }),

/***/ 207:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BleconnectserviceProvider; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_common_http__ = __webpack_require__(107);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__logger_logger_service__ = __webpack_require__(30);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var BleconnectserviceProvider = /** @class */ (function () {
    function BleconnectserviceProvider(http, logger) {
        this.http = http;
        this.logger = logger;
        this.TAG = 'BleconnectserviceProvider';
        this.wasConnected = false;
        this.needConnect = false;
        this.connectionStatus = "unknown";
        this.connectedPeripheral = {};
        this.logger.debug(this.TAG, 'Provider initialise');
        this.wasConnected = false;
    }
    BleconnectserviceProvider.prototype.getWasConnected = function () {
        return this.wasConnected;
    };
    BleconnectserviceProvider.prototype.setWasConnected = function (value) {
        this.wasConnected = value;
        this.logger.debug(this.TAG, 'setWasConnected', { value: value });
    };
    BleconnectserviceProvider.prototype.getConnectedPeripheral = function () {
        return this.connectedPeripheral;
    };
    BleconnectserviceProvider.prototype.setConnectedPeripheral = function (value) {
        this.connectedPeripheral = value;
    };
    BleconnectserviceProvider.prototype.getNeedConnect = function () {
        return this.needConnect;
    };
    BleconnectserviceProvider.prototype.setNeedConnect = function (value) {
        this.needConnect = value;
    };
    BleconnectserviceProvider.prototype.getConnectionStatus = function () {
        return this.connectionStatus;
    };
    BleconnectserviceProvider.prototype.setConnectionStatus = function (value) {
        this.connectionStatus = value;
    };
    BleconnectserviceProvider = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_1__angular_core__["A" /* Injectable */])(),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_0__angular_common_http__["a" /* HttpClient */], __WEBPACK_IMPORTED_MODULE_2__logger_logger_service__["a" /* LoggerService */]])
    ], BleconnectserviceProvider);
    return BleconnectserviceProvider;
}());

//# sourceMappingURL=bleconnectservice.js.map

/***/ }),

/***/ 208:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return RoomCacheProvider; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__ionic_storage__ = __webpack_require__(56);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__logger_logger_service__ = __webpack_require__(30);
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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



var STORAGE_KEY = 'StoredRoomAssignments';
// Source de verite locale pour l'affichage (icone de piece + nom du moteur) au scan et sur les
// pages produit (WIDOOR/MOVENTIV/GARLINE). Le protocole moteur ne change pas : la piece et le nom
// restent ecrits comme avant sur le moteur (nom BLE = nom + suffixe de piece). Ce cache sert
// uniquement a l'affichage app, pour ne plus dependre du nom BLE tel que remonte par le scan
// Android/iOS (parfois en cache/pas a jour tant que l'app n'a pas ete relancee).
// Un seul cache pour les deux car ils partagent la meme cle (deviceId/address/uuid) et la meme
// resolution d'affichage cote scan.ts : mutualise plutot que duplique.
var RoomCacheProvider = /** @class */ (function () {
    function RoomCacheProvider(storage, logger) {
        this.storage = storage;
        this.logger = logger;
        this.TAG = 'RoomCacheProvider';
        this.cache = {};
        this.loaded = false;
        this.loadPromise = null;
    }
    RoomCacheProvider.prototype.normalizeKey = function (deviceKey) {
        return (deviceKey || '').trim().toUpperCase();
    };
    // Charge le cache une seule fois (idempotent) ; a appeler tot (constructeur de page) pour
    // que getRoomSuffix()/getDeviceName() soient deja prets au moment du premier callback de scan.
    RoomCacheProvider.prototype.preload = function () {
        var _this = this;
        if (this.loaded) {
            return Promise.resolve();
        }
        if (!this.loadPromise) {
            this.loadPromise = this.storage.get(STORAGE_KEY).then(function (raw) {
                _this.cache = raw ? JSON.parse(raw) : {};
                _this.loaded = true;
                _this.logger.debug(_this.TAG, 'Cache local moteur charge', { count: Object.keys(_this.cache).length }, 'ROOM');
            }).catch(function (error) {
                _this.logger.warn(_this.TAG, 'Chargement cache local moteur echoue, cache vide utilise', error, 'ROOM');
                _this.cache = {};
                _this.loaded = true;
            });
        }
        return this.loadPromise;
    };
    RoomCacheProvider.prototype.persistEntry = function (key, patch) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.preload()];
                    case 1:
                        _a.sent();
                        existing = this.cache[key] || {};
                        this.cache[key] = __assign(__assign(__assign({}, existing), patch), { updatedAt: Date.now() });
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.storage.set(STORAGE_KEY, JSON.stringify(this.cache))];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        this.logger.warn(this.TAG, 'Sauvegarde locale moteur echouee (cache memoire conserve)', error_1, 'ROOM');
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    RoomCacheProvider.prototype.setRoomSuffix = function (deviceKey, suffix) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.normalizeKey(deviceKey);
                        if (!key) {
                            this.logger.warn(this.TAG, 'setRoomSuffix ignore: deviceKey absent', { suffix: suffix }, 'ROOM');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.persistEntry(key, { suffix: suffix || '' })];
                    case 1:
                        _a.sent();
                        this.logger.debug(this.TAG, 'Piece sauvegardee localement', { deviceKey: key, suffix: suffix }, 'ROOM');
                        return [2 /*return*/];
                }
            });
        });
    };
    RoomCacheProvider.prototype.setDeviceName = function (deviceKey, name) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.normalizeKey(deviceKey);
                        if (!key) {
                            this.logger.warn(this.TAG, '[NAME] local cache update ignore: deviceKey absent', { name: name }, 'NAME');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.persistEntry(key, { name: name || '' })];
                    case 1:
                        _a.sent();
                        this.logger.debug(this.TAG, '[NAME] local cache updated', { deviceKey: key, name: name }, 'NAME');
                        return [2 /*return*/];
                }
            });
        });
    };
    // Synchrones par design : utilises depuis le callback de scan (appele plusieurs fois par
    // seconde), donc pas question d'attendre une promesse Storage a chaque appel.
    // Renvoient null tant que le cache n'a pas fini son premier chargement (preload()).
    RoomCacheProvider.prototype.getRoomSuffix = function (deviceKey) {
        var key = this.normalizeKey(deviceKey);
        if (!key || !this.loaded) {
            return null;
        }
        var entry = this.cache[key];
        return entry && entry.suffix !== undefined ? entry.suffix : null;
    };
    RoomCacheProvider.prototype.getDeviceName = function (deviceKey) {
        var key = this.normalizeKey(deviceKey);
        if (!key || !this.loaded) {
            return null;
        }
        var entry = this.cache[key];
        return entry && entry.name !== undefined ? entry.name : null;
    };
    RoomCacheProvider = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])(),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__ionic_storage__["b" /* Storage */], __WEBPACK_IMPORTED_MODULE_2__logger_logger_service__["a" /* LoggerService */]])
    ], RoomCacheProvider);
    return RoomCacheProvider;
}());

//# sourceMappingURL=roomcache.js.map

/***/ }),

/***/ 210:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["b"] = createTranslateLoader;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppModule; });
/* unused harmony export FadeTansition */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__app_component__ = __webpack_require__(291);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__providers_randble_randble__ = __webpack_require__(105);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__providers_data_data__ = __webpack_require__(294);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__providers_bleconnectservice_bleconnectservice__ = __webpack_require__(207);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__providers_roomcache_roomcache__ = __webpack_require__(208);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__ionic_storage__ = __webpack_require__(56);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__angular_common__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__pipes_pipes_module__ = __webpack_require__(297);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__angular_common_http__ = __webpack_require__(107);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__ngx_translate_core__ = __webpack_require__(104);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__ngx_translate_http_loader__ = __webpack_require__(299);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__providers_logger_logger_service__ = __webpack_require__(30);
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};















function createTranslateLoader(http) {
    return new __WEBPACK_IMPORTED_MODULE_13__ngx_translate_http_loader__["a" /* TranslateHttpLoader */](http, './assets/i18n/', '.json');
}
var AppModule = /** @class */ (function () {
    function AppModule(config) {
        config.setTransition('fade', FadeTansition);
    }
    AppModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_3__app_component__["a" /* MyApp */],
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser__["a" /* BrowserModule */],
                __WEBPACK_IMPORTED_MODULE_2_ionic_angular__["h" /* IonicModule */].forRoot(__WEBPACK_IMPORTED_MODULE_3__app_component__["a" /* MyApp */], {
                    //mode: 'ios',
                    scrollAssist: false,
                    scrollPadding: false,
                    autoFocusAssist: false,
                    pageTransition: 'fade',
                    preloadModules: true
                }, {
                    links: [
                        { loadChildren: '../pages/about/about.module#AboutPageModule', name: 'AboutPage', segment: 'about', priority: 'low', defaultHistory: [] },
                        { loadChildren: '../pages/contact/contact.module#ContactPageModule', name: 'ContactPage', segment: 'contact', priority: 'low', defaultHistory: [] },
                        { loadChildren: '../pages/gcu/gcu.module#GcuPageModule', name: 'GcuPage', segment: 'gcu', priority: 'low', defaultHistory: [] },
                        { loadChildren: '../pages/infoSlide/infoSlide.module#InfoSlidePageModule', name: 'InfoSlidePage', segment: 'infoSlide', priority: 'low', defaultHistory: [] },
                        { loadChildren: '../pages/param/param.module#ParamPageModule', name: 'ParamPage', segment: 'param', priority: 'low', defaultHistory: [] },
                        { loadChildren: '../pages/help/help.module#HelpPageModule', name: 'HelpPage', segment: 'help', priority: 'low', defaultHistory: [] },
                        { loadChildren: '../pages/who/who.module#WhoModule', name: 'WhoPage', segment: 'who', priority: 'low', defaultHistory: [] },
                        { loadChildren: '../pages/popover/popover.module#PopoverPageModule', name: 'PopoverPage', segment: 'popover', priority: 'low', defaultHistory: [] },
                        { loadChildren: '../pages/scan/scan.module#ScanPageModule', name: 'ScanPage', segment: 'scan', priority: 'high', defaultHistory: [] },
                        { loadChildren: '../pages/widoor/widoor.module#WidoorPageModule', name: 'WidoorPage', segment: 'widoor', priority: 'high', defaultHistory: [] },
                        { loadChildren: '../pages/moventiv/moventiv.module#MoventivPageModule', name: 'MoventivPage', segment: 'moventiv', priority: 'high', defaultHistory: [] }
                    ]
                }),
                __WEBPACK_IMPORTED_MODULE_8__ionic_storage__["a" /* IonicStorageModule */].forRoot(),
                __WEBPACK_IMPORTED_MODULE_9__angular_common__["b" /* CommonModule */],
                __WEBPACK_IMPORTED_MODULE_11__angular_common_http__["b" /* HttpClientModule */],
                __WEBPACK_IMPORTED_MODULE_10__pipes_pipes_module__["a" /* PipesModule */],
                __WEBPACK_IMPORTED_MODULE_12__ngx_translate_core__["b" /* TranslateModule */].forRoot({
                    loader: {
                        provide: __WEBPACK_IMPORTED_MODULE_12__ngx_translate_core__["a" /* TranslateLoader */],
                        useFactory: createTranslateLoader,
                        deps: [__WEBPACK_IMPORTED_MODULE_11__angular_common_http__["a" /* HttpClient */]]
                    }
                })
            ],
            bootstrap: [__WEBPACK_IMPORTED_MODULE_2_ionic_angular__["f" /* IonicApp */]],
            entryComponents: [
                __WEBPACK_IMPORTED_MODULE_3__app_component__["a" /* MyApp */],
            ],
            providers: [
                { provide: __WEBPACK_IMPORTED_MODULE_0__angular_core__["u" /* ErrorHandler */], useClass: __WEBPACK_IMPORTED_MODULE_2_ionic_angular__["g" /* IonicErrorHandler */] },
                __WEBPACK_IMPORTED_MODULE_4__providers_randble_randble__["a" /* RandBLE */],
                __WEBPACK_IMPORTED_MODULE_5__providers_data_data__["a" /* DataProvider */],
                __WEBPACK_IMPORTED_MODULE_6__providers_bleconnectservice_bleconnectservice__["a" /* BleconnectserviceProvider */],
                __WEBPACK_IMPORTED_MODULE_7__providers_roomcache_roomcache__["a" /* RoomCacheProvider */],
                __WEBPACK_IMPORTED_MODULE_14__providers_logger_logger_service__["a" /* LoggerService */],
            ]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_2_ionic_angular__["d" /* Config */]])
    ], AppModule);
    return AppModule;
}());

var SHOW_BACK_BTN_CSS = 'show-back-button';
var FadeTansition = /** @class */ (function (_super) {
    __extends(FadeTansition, _super);
    function FadeTansition() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FadeTansition.prototype.init = function () {
        _super.prototype.init.call(this);
        var plt = this.plt;
        var enteringView = this.enteringView;
        var leavingView = this.leavingView;
        var opts = this.opts;
        // what direction is the transition going
        var backDirection = opts.direction === 'back';
        if (enteringView) {
            if (backDirection) {
                this.duration(200);
            }
            else {
                this.duration(200);
                this.enteringPage.fromTo('opacity', 0, 1, true);
            }
            if (enteringView.hasNavbar()) {
                var enteringPageEle = enteringView.pageRef().nativeElement;
                var enteringNavbarEle = enteringPageEle.querySelector('ion-navbar');
                var enteringNavBar = new __WEBPACK_IMPORTED_MODULE_2_ionic_angular__["b" /* Animation */](plt, enteringNavbarEle);
                this.add(enteringNavBar);
                var enteringBackButton = new __WEBPACK_IMPORTED_MODULE_2_ionic_angular__["b" /* Animation */](plt, enteringNavbarEle.querySelector('.back-button'));
                this.add(enteringBackButton);
                if (enteringView.enableBack()) {
                    enteringBackButton.beforeAddClass(SHOW_BACK_BTN_CSS);
                }
                else {
                    enteringBackButton.beforeRemoveClass(SHOW_BACK_BTN_CSS);
                }
            }
        }
        // setup leaving view
        if (leavingView && backDirection) {
            // leaving content
            this.duration(200);
            var leavingPage = new __WEBPACK_IMPORTED_MODULE_2_ionic_angular__["b" /* Animation */](plt, leavingView.pageRef());
            this.add(leavingPage.fromTo('opacity', 1, 0));
        }
    };
    return FadeTansition;
}(__WEBPACK_IMPORTED_MODULE_2_ionic_angular__["n" /* PageTransition */]));

//# sourceMappingURL=app.module.js.map

/***/ }),

/***/ 211:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser_dynamic__ = __webpack_require__(212);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__app_module__ = __webpack_require__(210);


//import {enableProdMode} from '@angular/core'
//enableProdMode();
Object(__WEBPACK_IMPORTED_MODULE_0__angular_platform_browser_dynamic__["a" /* platformBrowserDynamic */])().bootstrapModule(__WEBPACK_IMPORTED_MODULE_1__app_module__["a" /* AppModule */]);
//# sourceMappingURL=main.js.map

/***/ }),

/***/ 291:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return MyApp; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__capacitor_status_bar__ = __webpack_require__(292);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__capacitor_device__ = __webpack_require__(106);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__ngx_translate_core__ = __webpack_require__(104);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__ionic_storage__ = __webpack_require__(56);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__providers_randble_randble__ = __webpack_require__(105);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__providers_logger_logger_service__ = __webpack_require__(30);
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



 // Remplace Globalization




var MyApp = /** @class */ (function () {
    function MyApp(platform, alertCtrl, translate, storage, randble, config, logger) {
        var _this = this;
        this.platform = platform;
        this.alertCtrl = alertCtrl;
        this.translate = translate;
        this.storage = storage;
        this.randble = randble;
        this.config = config;
        this.logger = logger;
        this.confirmAlert = {};
        this.TAG = 'AppComponent';
        this.supportedLanguageCodes = ['fr', 'en', 'de', 'pl'];
        platform.ready().then(function () { return __awaiter(_this, void 0, void 0, function () {
            var error_1, typedError;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Okay, so the platform is ready and our plugins are available.
                        // Here you can do any higher level native things you might need.
                        this.logger.info(this.TAG, 'Platform ready');
                        translate.setDefaultLang('fr');
                        if (!this.platform.is('hybrid')) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, __WEBPACK_IMPORTED_MODULE_2__capacitor_status_bar__["a" /* StatusBar */].setOverlaysWebView({ overlay: false })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, __WEBPACK_IMPORTED_MODULE_2__capacitor_status_bar__["a" /* StatusBar */].setBackgroundColor({ color: '#ffffff' })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        typedError = error_1;
                        this.logger.warn(this.TAG, 'Failed to configure status bar', typedError);
                        return [3 /*break*/, 5];
                    case 5:
                        this.storage.get('StoredFirstLaunch').then(function (result) { return __awaiter(_this, void 0, void 0, function () {
                            var ln, code, error_2, typedError;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!result) return [3 /*break*/, 1];
                                        this.logger.info(this.TAG, 'Application already launched before', result);
                                        this.storage.get('StoredIsLanguageAuto').then(function (val) { return __awaiter(_this, void 0, void 0, function () {
                                            var ln, code, error_3, typedError;
                                            var _this = this;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        this.isLanguageAuto = JSON.parse(val);
                                                        if (!this.isLanguageAuto) return [3 /*break*/, 5];
                                                        ln = 'en';
                                                        _a.label = 1;
                                                    case 1:
                                                        _a.trys.push([1, 3, , 4]);
                                                        return [4 /*yield*/, __WEBPACK_IMPORTED_MODULE_3__capacitor_device__["a" /* Device */].getLanguageCode()];
                                                    case 2:
                                                        code = _a.sent();
                                                        ln = code.value; // renvoie 'fr', 'en', etc.
                                                        return [3 /*break*/, 4];
                                                    case 3:
                                                        error_3 = _a.sent();
                                                        typedError = error_3;
                                                        this.logger.warn(this.TAG, 'Failed to get device language code', typedError);
                                                        return [3 /*break*/, 4];
                                                    case 4:
                                                        this.logger.info(this.TAG, 'Device language detected', ln);
                                                        this.applyLanguage(ln);
                                                        return [3 /*break*/, 6];
                                                    case 5:
                                                        this.storage.get('appLanguage').then(function (val) {
                                                            _this.selectNgModLang = JSON.parse(val);
                                                            _this.applyLanguage(_this.getManualLanguageCode(_this.selectNgModLang));
                                                        }).catch(function (error) {
                                                            _this.logPromiseError('Failed to read appLanguage', error);
                                                        });
                                                        _a.label = 6;
                                                    case 6: return [2 /*return*/];
                                                }
                                            });
                                        }); }).catch(function (error) {
                                            _this.logPromiseError('Failed to read StoredIsLanguageAuto', error);
                                        });
                                        return [3 /*break*/, 6];
                                    case 1:
                                        this.logger.info(this.TAG, 'First launch detected');
                                        ln = 'en';
                                        _a.label = 2;
                                    case 2:
                                        _a.trys.push([2, 4, , 5]);
                                        return [4 /*yield*/, __WEBPACK_IMPORTED_MODULE_3__capacitor_device__["a" /* Device */].getLanguageCode()];
                                    case 3:
                                        code = _a.sent();
                                        ln = code.value;
                                        return [3 /*break*/, 5];
                                    case 4:
                                        error_2 = _a.sent();
                                        typedError = error_2;
                                        this.logger.warn(this.TAG, 'Failed to get device language', typedError);
                                        return [3 /*break*/, 5];
                                    case 5:
                                        this.logger.info(this.TAG, 'Detected device language', ln);
                                        this.applyLanguage(ln);
                                        this.setStoredJson('StoredIsLanguageAuto', true);
                                        this.setStoredJson('appLanguage', true);
                                        this.setStoredJson('StoredIsVisibleTabSettings', true);
                                        this.setStoredJson('StoredIsVisibleTabInfo', true);
                                        this.setStoredJson('StoredOptComs', ["dispOptionalCom_MO", "dispOptionalCom_LC", "dispOptionalCom_LLB"]);
                                        this.setStoredJson('StoredIsVisibleMAC', false);
                                        this.setStoredJson('StoredIsActiveVibrate', false);
                                        this.setStoredJson('StoredFirstLaunch', true);
                                        this.setStoredJson('StoredIsAutoBluetooth', true);
                                        _a.label = 6;
                                    case 6:
                                        this.rootPage = 'ScanPage'; //define when we know the language + pref are loaded (including lang pref...)
                                        return [2 /*return*/];
                                }
                            });
                        }); }).catch(function (error) {
                            _this.logPromiseError('Failed to read StoredFirstLaunch', error);
                        });
                        this.platform.registerBackButtonAction(function () {
                            _this.logger.debug(_this.TAG, 'Back button pressed');
                            if (_this.nav.length() == 1) {
                                if (!_this.showedAlert) {
                                    _this.confirmExitApp();
                                }
                                else {
                                    _this.showedAlert = false;
                                    if (_this.confirmAlert && _this.confirmAlert.dismiss) {
                                        _this.confirmAlert.dismiss().catch(function (error) {
                                            _this.logPromiseError('Failed to dismiss exit confirmation dialog', error);
                                        });
                                    }
                                }
                            }
                            else {
                                _this.nav.pop({}).catch(function (error) {
                                    _this.logPromiseError('Failed to navigate back', error);
                                });
                            }
                        });
                        return [2 /*return*/];
                }
            });
        }); }).catch(function (error) {
            _this.logPromiseError('Platform ready failed', error);
        });
    }
    MyApp.prototype.setStoredJson = function (key, value) {
        var _this = this;
        this.storage.set(key, JSON.stringify(value)).catch(function (error) {
            _this.logPromiseError('Failed to save ' + key, error);
        });
    };
    MyApp.prototype.resolveSupportedLanguage = function (languageCode) {
        var shortCode = String(languageCode || '').substring(0, 2).toLowerCase();
        return this.supportedLanguageCodes.indexOf(shortCode) > -1 ? shortCode : 'en';
    };
    MyApp.prototype.getManualLanguageCode = function (manualLanguage) {
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
    MyApp.prototype.applyLanguage = function (languageCode) {
        var lang = this.resolveSupportedLanguage(languageCode);
        this.translate.use(lang);
        localStorage.setItem("lang", lang);
        this.updateBackButtonText();
    };
    MyApp.prototype.updateBackButtonText = function () {
        var _this = this;
        this.translate.get('GENERIC.BACK').subscribe(function (res) {
            // Let android keep using only arrow
            _this.config.set('ios', 'backButtonText', res);
        });
    };
    MyApp.prototype.logPromiseError = function (message, error) {
        var typedError = error;
        this.logger.error(this.TAG, message, typedError);
    };
    MyApp.prototype.confirmExitApp = function () {
        var _this = this;
        this.translate.get(['SCAN_PAGE.QUIT_PROMPT.MESSAGE', 'SCAN_PAGE.QUIT_PROMPT.BUTTONS.NO', 'SCAN_PAGE.QUIT_PROMPT.BUTTONS.YES']).subscribe(function (res) {
            _this.logger.debug(_this.TAG, 'Exit confirmation dialog opened', res);
            _this.showedAlert = true;
            _this.confirmAlert = _this.alertCtrl.create({
                title: "",
                message: res["SCAN_PAGE.QUIT_PROMPT.MESSAGE"],
                buttons: [
                    {
                        text: res["SCAN_PAGE.QUIT_PROMPT.BUTTONS.NO"],
                        handler: function () {
                            _this.showedAlert = false;
                            return;
                        }
                    },
                    {
                        text: res["SCAN_PAGE.QUIT_PROMPT.BUTTONS.YES"],
                        handler: function () {
                            //désactivation du Bluetooth
                            _this.storage.get('StoredIsAutoBluetooth').then(function (val) {
                                var bleAutoTrue = JSON.parse(val);
                                _this.randble.isEnabled().then(function (val) {
                                    _this.logger.info(_this.TAG, 'BLE state', val.isEnabled);
                                    // if Enable then disable it if auto true
                                    if (val.isEnabled) {
                                        if (bleAutoTrue)
                                            if (_this.platform.is('android')) {
                                                {
                                                    _this.randble.stopScan().catch(function (error) {
                                                        _this.logPromiseError('Failed to stop BLE scan before exit', error);
                                                    });
                                                }
                                            }
                                        _this.logger.debug(_this.TAG, 'BLE enabled, stopping scan if required');
                                    }
                                }).catch(function (error) {
                                    _this.logPromiseError('Failed to read BLE state before exit', error);
                                });
                            }).catch(function (error) {
                                _this.logPromiseError('Failed to read StoredIsAutoBluetooth before exit', error);
                            });
                            _this.platform.exitApp();
                        }
                    }
                ]
            });
            _this.confirmAlert.present().catch(function (error) {
                _this.logPromiseError('Failed to present exit confirmation dialog', error);
            });
        });
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_8" /* ViewChild */])('myNav'),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["k" /* NavController */]
        //public rootPage:any = 'ScanPage';
        )
    ], MyApp.prototype, "nav", void 0);
    MyApp = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            //template:/*ion-inline-start:"C:\Dev\Appli_ble\V2.0\src\app\app.html"*/'<ion-nav id="rootNav" [root]="rootPage"></ion-nav>\n'/*ion-inline-end:"C:\Dev\Appli_ble\V2.0\src\app\app.html"*/
            template: '<ion-nav id="rootNav" #myNav [root]="rootPage"></ion-nav>'
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["o" /* Platform */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["a" /* AlertController */],
            __WEBPACK_IMPORTED_MODULE_4__ngx_translate_core__["c" /* TranslateService */],
            __WEBPACK_IMPORTED_MODULE_5__ionic_storage__["b" /* Storage */],
            __WEBPACK_IMPORTED_MODULE_6__providers_randble_randble__["a" /* RandBLE */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["d" /* Config */],
            __WEBPACK_IMPORTED_MODULE_7__providers_logger_logger_service__["a" /* LoggerService */]])
    ], MyApp);
    return MyApp;
}());

//# sourceMappingURL=app.component.js.map

/***/ }),

/***/ 294:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return DataProvider; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_http__ = __webpack_require__(295);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__logger_logger_service__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_rxjs_add_operator_map__ = __webpack_require__(296);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_rxjs_add_operator_map___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_rxjs_add_operator_map__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var DataProvider = /** @class */ (function () {
    function DataProvider(http, logger) {
        this.http = http;
        this.logger = logger;
        this.TAG = 'DataProvider';
        this.logger.debug(this.TAG, 'Provider initialise');
    }
    DataProvider = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])(),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__angular_http__["a" /* Http */], __WEBPACK_IMPORTED_MODULE_2__logger_logger_service__["a" /* LoggerService */]])
    ], DataProvider);
    return DataProvider;
}());

//# sourceMappingURL=data.js.map

/***/ }),

/***/ 297:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return PipesModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__uppercasefirst_uppercasefirst__ = __webpack_require__(298);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};


var PipesModule = /** @class */ (function () {
    function PipesModule() {
    }
    PipesModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [__WEBPACK_IMPORTED_MODULE_1__uppercasefirst_uppercasefirst__["a" /* UppercasefirstPipe */]],
            imports: [],
            exports: [__WEBPACK_IMPORTED_MODULE_1__uppercasefirst_uppercasefirst__["a" /* UppercasefirstPipe */]]
        })
    ], PipesModule);
    return PipesModule;
}());

//# sourceMappingURL=pipes.module.js.map

/***/ }),

/***/ 298:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return UppercasefirstPipe; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var UppercasefirstPipe = /** @class */ (function () {
    function UppercasefirstPipe() {
    }
    /**
     * Takes a value and make the first caracter uppercase.
     */
    UppercasefirstPipe.prototype.transform = function (value) {
        if (value === null)
            return 'Not assigned';
        return value.charAt(0).toUpperCase() + value.slice(1);
    };
    UppercasefirstPipe = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["S" /* Pipe */])({
            name: 'uppercasefirst',
        })
    ], UppercasefirstPipe);
    return UppercasefirstPipe;
}());

//# sourceMappingURL=uppercasefirst.js.map

/***/ }),

/***/ 30:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return LoggerService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var LoggerService = /** @class */ (function () {
    function LoggerService() {
        // Passe a false avant un build de production pour couper le bruit des logs debug.
        // (Pas d'environment.ts dans ce projet Ionic 3 : c'est le seul interrupteur debug/prod.)
        this.debugEnabled = true;
    }
    LoggerService.prototype.setDebugEnabled = function (enabled) {
        this.debugEnabled = enabled;
    };
    // Les objets passes en 2e argument de console.* sont perdus (affiches "[object Object]")
    // une fois remontes dans le logcat Android via le pont Capacitor. On les serialise donc
    // directement dans le message pour qu'ils restent lisibles sur appareil reel.
    LoggerService.prototype.stringifyData = function (data) {
        if (data === undefined || data === null) {
            return '';
        }
        if (data instanceof Error) {
            return JSON.stringify({ name: data.name, message: data.message, stack: data.stack });
        }
        try {
            var seen_1 = new WeakSet();
            return JSON.stringify(data, function (_key, value) {
                if (typeof value === 'object' && value !== null) {
                    if (seen_1.has(value)) {
                        return '[Circular]';
                    }
                    seen_1.add(value);
                }
                return value;
            });
        }
        catch (e) {
            return String(data);
        }
    };
    // category est optionnel (ex: 'SCAN', 'BLE', 'WRITE', 'ROOM') pour permettre de filtrer
    // Logcat par sujet en plus du tag de page (ex: filtre "WidoorPage.*\[WRITE\]").
    LoggerService.prototype.format = function (tag, message, data, category) {
        var time = new Date().toISOString();
        var tagPart = category ? "[" + tag + "][" + category + "]" : "[" + tag + "]";
        var serializedData = this.stringifyData(data);
        return serializedData
            ? "[" + time + "] " + tagPart + " " + message + " " + serializedData
            : "[" + time + "] " + tagPart + " " + message;
    };
    LoggerService.prototype.debug = function (tag, message, data, category) {
        if (!this.debugEnabled)
            return;
        console.debug(this.format(tag, message, data, category));
    };
    LoggerService.prototype.info = function (tag, message, data, category) {
        console.info(this.format(tag, message, data, category));
    };
    LoggerService.prototype.warn = function (tag, message, data, category) {
        console.warn(this.format(tag, message, data, category));
    };
    LoggerService.prototype.error = function (tag, message, error, category) {
        console.error(this.format(tag, message, error, category));
    };
    LoggerService = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])(),
        __metadata("design:paramtypes", [])
    ], LoggerService);
    return LoggerService;
}());

//# sourceMappingURL=logger.service.js.map

/***/ })

},[211]);
//# sourceMappingURL=main.js.map