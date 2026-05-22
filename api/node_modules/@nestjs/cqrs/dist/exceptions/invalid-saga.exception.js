"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidSagaException = void 0;
/**
 * @publicApi
 */
class InvalidSagaException extends Error {
    constructor() {
        super(`Invalid saga. Each saga should return Observable stream.`);
    }
}
exports.InvalidSagaException = InvalidSagaException;
