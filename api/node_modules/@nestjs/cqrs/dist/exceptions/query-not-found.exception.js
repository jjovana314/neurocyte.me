"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryHandlerNotFoundException = void 0;
/**
 * @publicApi
 */
class QueryHandlerNotFoundException extends Error {
    constructor(queryName) {
        super(`No handler found for the query: "${queryName}"`);
    }
}
exports.QueryHandlerNotFoundException = QueryHandlerNotFoundException;
