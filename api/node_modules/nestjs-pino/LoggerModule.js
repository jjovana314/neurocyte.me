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
var LoggerModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerModule = void 0;
const common_1 = require("@nestjs/common");
const pino_http_1 = require("pino-http");
const InjectPinoLogger_1 = require("./InjectPinoLogger");
const Logger_1 = require("./Logger");
const NativeLogger_1 = require("./NativeLogger");
const params_1 = require("./params");
const PinoLogger_1 = require("./PinoLogger");
const storage_1 = require("./storage");
/**
 * As NestJS@11 still supports express@4 `*`-style routing by itself let's keep
 * it for the backward compatibility. On the next major NestJS release `*` we
 * can replace it with `/{*splat}`, and drop the support for NestJS@9 and below.
 */
const DEFAULT_ROUTES = [{ path: '*', method: common_1.RequestMethod.ALL }];
let LoggerModule = LoggerModule_1 = class LoggerModule {
    static forRoot(params) {
        const paramsProvider = {
            provide: params_1.PARAMS_PROVIDER_TOKEN,
            useValue: params || {},
        };
        const decorated = (0, InjectPinoLogger_1.createProvidersForDecorated)();
        return {
            module: LoggerModule_1,
            providers: [
                Logger_1.Logger,
                NativeLogger_1.NativeLogger,
                ...decorated,
                PinoLogger_1.PinoLogger,
                paramsProvider,
            ],
            exports: [Logger_1.Logger, NativeLogger_1.NativeLogger, ...decorated, PinoLogger_1.PinoLogger, paramsProvider],
        };
    }
    static forRootAsync(params) {
        const paramsProvider = {
            provide: params_1.PARAMS_PROVIDER_TOKEN,
            useFactory: params.useFactory,
            inject: params.inject,
        };
        const decorated = (0, InjectPinoLogger_1.createProvidersForDecorated)();
        const providers = [
            Logger_1.Logger,
            NativeLogger_1.NativeLogger,
            ...decorated,
            PinoLogger_1.PinoLogger,
            paramsProvider,
            ...(params.providers || []),
        ];
        return {
            module: LoggerModule_1,
            imports: params.imports,
            providers,
            exports: [Logger_1.Logger, NativeLogger_1.NativeLogger, ...decorated, PinoLogger_1.PinoLogger, paramsProvider],
        };
    }
    constructor(params) {
        this.params = params;
    }
    configure(consumer) {
        const { exclude, forRoutes = DEFAULT_ROUTES, pinoHttp, useExisting, assignResponse, } = this.params;
        const middlewares = createLoggerMiddlewares(pinoHttp || {}, useExisting, assignResponse);
        if (exclude) {
            consumer
                .apply(...middlewares)
                .exclude(...exclude)
                .forRoutes(...forRoutes);
        }
        else {
            consumer.apply(...middlewares).forRoutes(...forRoutes);
        }
    }
};
exports.LoggerModule = LoggerModule;
exports.LoggerModule = LoggerModule = LoggerModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({ providers: [Logger_1.Logger, NativeLogger_1.NativeLogger], exports: [Logger_1.Logger, NativeLogger_1.NativeLogger] }),
    __param(0, (0, common_1.Inject)(params_1.PARAMS_PROVIDER_TOKEN)),
    __metadata("design:paramtypes", [Object])
], LoggerModule);
function createLoggerMiddlewares(params, useExisting = false, assignResponse = false) {
    if (useExisting) {
        return [bindLoggerMiddlewareFactory(useExisting, assignResponse)];
    }
    const middleware = (0, pino_http_1.pinoHttp)(...(Array.isArray(params) ? params : [params]));
    // @ts-expect-error: root is readonly field, but this is the place where
    // it's set actually
    PinoLogger_1.PinoLogger.root = middleware.logger;
    // FIXME: params type here is pinoHttp.Options | pino.DestinationStream
    // pinoHttp has two overloads, each of them takes those types
    return [middleware, bindLoggerMiddlewareFactory(useExisting, assignResponse)];
}
function bindLoggerMiddlewareFactory(useExisting, assignResponse) {
    return function bindLoggerMiddleware(req, res, next) {
        let log = req.log;
        let resLog = assignResponse ? res.log : undefined;
        if (!useExisting && req.allLogs) {
            log = req.allLogs[req.allLogs.length - 1];
        }
        if (assignResponse && !useExisting && res.allLogs) {
            resLog = res.allLogs[res.allLogs.length - 1];
        }
        storage_1.storage.run(new storage_1.Store(log, resLog), next);
    };
}
//# sourceMappingURL=LoggerModule.js.map