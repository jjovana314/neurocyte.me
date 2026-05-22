"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.Store = void 0;
const async_hooks_1 = require("async_hooks");
class Store {
    constructor(logger, responseLogger) {
        this.logger = logger;
        this.responseLogger = responseLogger;
    }
}
exports.Store = Store;
exports.storage = new async_hooks_1.AsyncLocalStorage();
//# sourceMappingURL=storage.js.map