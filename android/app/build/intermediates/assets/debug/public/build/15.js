webpackJsonp([15],{

/***/ 669:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__capacitor_core__ = __webpack_require__(42);

class AppWeb extends __WEBPACK_IMPORTED_MODULE_0__capacitor_core__["b" /* WebPlugin */] {
    constructor() {
        super();
        this.handleVisibilityChange = () => {
            const data = {
                isActive: document.hidden !== true,
            };
            this.notifyListeners('appStateChange', data);
        };
        document.addEventListener('visibilitychange', this.handleVisibilityChange, false);
    }
    exitApp() {
        throw this.unimplemented('Not implemented on web.');
    }
    async getInfo() {
        throw this.unimplemented('Not implemented on web.');
    }
    async getLaunchUrl() {
        return { url: '' };
    }
    async getState() {
        return { isActive: document.hidden !== true };
    }
    async minimizeApp() {
        throw this.unimplemented('Not implemented on web.');
    }
}
/* harmony export (immutable) */ __webpack_exports__["AppWeb"] = AppWeb;

//# sourceMappingURL=web.js.map

/***/ })

});
//# sourceMappingURL=15.js.map