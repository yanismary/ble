webpackJsonp([14],{

/***/ 552:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__capacitor_core__ = __webpack_require__(42);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__definitions__ = __webpack_require__(363);


class HapticsWeb extends __WEBPACK_IMPORTED_MODULE_0__capacitor_core__["b" /* WebPlugin */] {
    constructor() {
        super(...arguments);
        this.selectionStarted = false;
    }
    async impact(options) {
        const pattern = this.patternForImpact(options === null || options === void 0 ? void 0 : options.style);
        this.vibrateWithPattern(pattern);
    }
    async notification(options) {
        const pattern = this.patternForNotification(options === null || options === void 0 ? void 0 : options.type);
        this.vibrateWithPattern(pattern);
    }
    async vibrate(options) {
        const duration = (options === null || options === void 0 ? void 0 : options.duration) || 300;
        this.vibrateWithPattern([duration]);
    }
    async selectionStart() {
        this.selectionStarted = true;
    }
    async selectionChanged() {
        if (this.selectionStarted) {
            this.vibrateWithPattern([70]);
        }
    }
    async selectionEnd() {
        this.selectionStarted = false;
    }
    patternForImpact(style = __WEBPACK_IMPORTED_MODULE_1__definitions__["a" /* ImpactStyle */].Heavy) {
        if (style === __WEBPACK_IMPORTED_MODULE_1__definitions__["a" /* ImpactStyle */].Medium) {
            return [43];
        }
        else if (style === __WEBPACK_IMPORTED_MODULE_1__definitions__["a" /* ImpactStyle */].Light) {
            return [20];
        }
        return [61];
    }
    patternForNotification(type = __WEBPACK_IMPORTED_MODULE_1__definitions__["b" /* NotificationType */].Success) {
        if (type === __WEBPACK_IMPORTED_MODULE_1__definitions__["b" /* NotificationType */].Warning) {
            return [30, 40, 30, 50, 60];
        }
        else if (type === __WEBPACK_IMPORTED_MODULE_1__definitions__["b" /* NotificationType */].Error) {
            return [27, 45, 50];
        }
        return [35, 65, 21];
    }
    vibrateWithPattern(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
        else {
            throw this.unavailable('Browser does not support the vibrate API');
        }
    }
}
/* harmony export (immutable) */ __webpack_exports__["HapticsWeb"] = HapticsWeb;

//# sourceMappingURL=web.js.map

/***/ })

});
//# sourceMappingURL=14.js.map