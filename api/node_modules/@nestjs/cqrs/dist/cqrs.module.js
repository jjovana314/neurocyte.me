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
var CqrsModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CqrsModule = void 0;
const common_1 = require("@nestjs/common");
const command_bus_1 = require("./command-bus");
const constants_1 = require("./constants");
const event_bus_1 = require("./event-bus");
const event_publisher_1 = require("./event-publisher");
const query_bus_1 = require("./query-bus");
const explorer_service_1 = require("./services/explorer.service");
const unhandled_exception_bus_1 = require("./unhandled-exception-bus");
const aggregate_root_storage_1 = require("./storages/aggregate-root.storage");
/**
 * @publicApi
 */
let CqrsModule = CqrsModule_1 = class CqrsModule {
    static forRoot(options) {
        return {
            module: CqrsModule_1,
            providers: [
                {
                    provide: constants_1.CQRS_MODULE_OPTIONS,
                    useValue: options ?? {},
                },
            ],
            global: true,
        };
    }
    static forRootAsync(options) {
        return {
            module: CqrsModule_1,
            global: true,
            imports: options.imports || [],
            providers: [...this.createAsyncProviders(options)],
            exports: [constants_1.CQRS_MODULE_OPTIONS],
        };
    }
    static createAsyncProviders(options) {
        if (options.useValue) {
            return [
                {
                    provide: constants_1.CQRS_MODULE_OPTIONS,
                    useValue: options.useValue,
                },
            ];
        }
        if (options.useFactory) {
            return [
                {
                    provide: constants_1.CQRS_MODULE_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
            ];
        }
        if (options.useClass) {
            return [
                {
                    provide: options.useClass,
                    useClass: options.useClass,
                },
                {
                    provide: constants_1.CQRS_MODULE_OPTIONS,
                    useFactory: async (optionsFactory) => optionsFactory.createCqrsOptions(),
                    inject: [options.useClass],
                },
            ];
        }
        if (options.useExisting) {
            return [
                {
                    provide: constants_1.CQRS_MODULE_OPTIONS,
                    useFactory: async (optionsFactory) => optionsFactory.createCqrsOptions(),
                    inject: [options.useExisting],
                },
            ];
        }
        throw new Error('Invalid CqrsModuleAsyncOptions configuration. Provide useValue, useFactory, useClass, or useExisting.');
    }
    constructor(explorerService, eventBus, commandBus, queryBus) {
        this.explorerService = explorerService;
        this.eventBus = eventBus;
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }
    onApplicationBootstrap() {
        const { events, queries, sagas, commands } = this.explorerService.explore();
        this.eventBus.register(events);
        this.commandBus.register(commands);
        this.queryBus.register(queries);
        this.eventBus.registerSagas(sagas);
        aggregate_root_storage_1.AggregateRootStorage.mergeContext(this.eventBus);
    }
};
exports.CqrsModule = CqrsModule;
exports.CqrsModule = CqrsModule = CqrsModule_1 = __decorate([
    (0, common_1.Module)({
        providers: [
            command_bus_1.CommandBus,
            query_bus_1.QueryBus,
            event_bus_1.EventBus,
            unhandled_exception_bus_1.UnhandledExceptionBus,
            event_publisher_1.EventPublisher,
            explorer_service_1.ExplorerService,
        ],
        exports: [
            command_bus_1.CommandBus,
            query_bus_1.QueryBus,
            event_bus_1.EventBus,
            unhandled_exception_bus_1.UnhandledExceptionBus,
            event_publisher_1.EventPublisher,
        ],
    }),
    __metadata("design:paramtypes", [explorer_service_1.ExplorerService,
        event_bus_1.EventBus,
        command_bus_1.CommandBus,
        query_bus_1.QueryBus])
], CqrsModule);
