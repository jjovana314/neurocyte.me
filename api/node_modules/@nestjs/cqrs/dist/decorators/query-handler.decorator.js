"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryHandler = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
require("reflect-metadata");
const constants_1 = require("./constants");
/**
 * Decorator that marks a class as a Nest query handler. A query handler
 * handles queries executed by your application code.
 *
 * The decorated class must implement the `IQueryHandler` interface.
 *
 * @param query query *type* to be handled by this handler.
 * @param options injectable options passed on to the "@Injectable" decorator.
 *
 * @see https://docs.nestjs.com/recipes/cqrs#queries
 *
 * @publicApi
 */
const QueryHandler = (query, options) => {
    return (target) => {
        if (!Reflect.hasOwnMetadata(constants_1.QUERY_METADATA, query)) {
            Reflect.defineMetadata(constants_1.QUERY_METADATA, { id: (0, crypto_1.randomUUID)() }, query);
        }
        Reflect.defineMetadata(constants_1.QUERY_HANDLER_METADATA, query, target);
        if (options) {
            (0, common_1.Injectable)(options)(target);
        }
    };
};
exports.QueryHandler = QueryHandler;
