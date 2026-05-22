"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var QueryBus_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBus = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
require("reflect-metadata");
const constants_1 = require("./constants");
const constants_2 = require("./decorators/constants");
const exceptions_1 = require("./exceptions");
const invalid_query_handler_exception_1 = require("./exceptions/invalid-query-handler.exception");
const default_query_pubsub_1 = require("./helpers/default-query-pubsub");
const scopes_1 = require("./scopes");
const observable_bus_1 = require("./utils/observable-bus");
/**
 * @publicApi
 */
let QueryBus = QueryBus_1 = class QueryBus extends observable_bus_1.ObservableBus {
    constructor(moduleRef, options) {
        super();
        this.moduleRef = moduleRef;
        this.options = options;
        this.logger = new common_1.Logger(QueryBus_1.name);
        this.handlers = new Map();
        if (this.options?.queryPublisher) {
            this._publisher = this.options.queryPublisher;
        }
        else {
            this.useDefaultPublisher();
        }
    }
    /**
     * Returns the publisher.
     */
    get publisher() {
        return this._publisher;
    }
    /**
     * Sets the publisher.
     * Default publisher is `DefaultQueryPubSub` (in memory).
     * @param _publisher The publisher to set.
     */
    set publisher(_publisher) {
        this._publisher = _publisher;
    }
    /**
     * Executes a query.
     * @param query The query to execute.
     */
    async execute(query, asyncContext) {
        const queryId = this.getQueryId(query);
        const handler = this.handlers.get(queryId);
        if (!handler) {
            const queryName = this.getQueryName(query);
            throw new exceptions_1.QueryHandlerNotFoundException(queryName);
        }
        this._publisher.publish(query);
        return (await handler(query, asyncContext));
    }
    bind(handler, queryId) {
        if (handler.isDependencyTreeStatic()) {
            const instance = handler.instance;
            if (!instance.execute) {
                throw new invalid_query_handler_exception_1.InvalidQueryHandlerException();
            }
            this.handlers.set(queryId, (query) => instance.execute(query));
            return;
        }
        this.handlers.set(queryId, async (query, context) => {
            context ??= scopes_1.AsyncContext.of(query) ?? new scopes_1.AsyncContext();
            this.moduleRef.registerRequestByContextId(context, context.id);
            const instance = await this.moduleRef.resolve(handler.metatype, context.id, {
                strict: false,
            });
            return instance.execute(query);
        });
    }
    register(handlers = []) {
        handlers.forEach((handler) => this.registerHandler(handler));
    }
    registerHandler(handler) {
        const typeRef = handler.metatype;
        const target = this.reflectQueryId(typeRef);
        if (!target) {
            throw new invalid_query_handler_exception_1.InvalidQueryHandlerException();
        }
        if (this.handlers.has(target)) {
            this.logger.warn(`Query handler [${typeRef.name}] is already registered. Overriding previously registered handler.`);
        }
        this.bind(handler, target);
    }
    getQueryId(query) {
        const { constructor: queryType } = Object.getPrototypeOf(query);
        const queryMetadata = Reflect.getMetadata(constants_2.QUERY_METADATA, queryType);
        if (!queryMetadata) {
            throw new exceptions_1.QueryHandlerNotFoundException(queryType.name);
        }
        return queryMetadata.id;
    }
    reflectQueryId(handler) {
        const query = Reflect.getMetadata(constants_2.QUERY_HANDLER_METADATA, handler);
        const queryMetadata = Reflect.getMetadata(constants_2.QUERY_METADATA, query);
        return queryMetadata.id;
    }
    useDefaultPublisher() {
        this._publisher = new default_query_pubsub_1.DefaultQueryPubSub(this.subject$);
    }
    getQueryName(query) {
        const { constructor } = Object.getPrototypeOf(query);
        return constructor.name;
    }
};
exports.QueryBus = QueryBus;
exports.QueryBus = QueryBus = QueryBus_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(constants_1.CQRS_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [core_1.ModuleRef, Object])
], QueryBus);
