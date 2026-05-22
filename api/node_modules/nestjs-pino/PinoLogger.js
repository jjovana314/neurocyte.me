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
var PinoLogger_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinoLogger = void 0;
exports.__resetOutOfContextForTests = __resetOutOfContextForTests;
/* eslint-disable @typescript-eslint/no-explicit-any */
const common_1 = require("@nestjs/common");
const pino_1 = require("pino");
const params_1 = require("./params");
const storage_1 = require("./storage");
let outOfContext;
function __resetOutOfContextForTests() {
    outOfContext = undefined;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore reset root for tests only
    PinoLogger.root = undefined;
}
let PinoLogger = PinoLogger_1 = class PinoLogger {
    constructor({ pinoHttp, renameContext }) {
        var _a;
        this.context = '';
        this.errorKey = 'err';
        if (typeof pinoHttp === 'object' &&
            'customAttributeKeys' in pinoHttp &&
            typeof pinoHttp.customAttributeKeys !== 'undefined') {
            this.errorKey = (_a = pinoHttp.customAttributeKeys.err) !== null && _a !== void 0 ? _a : 'err';
        }
        if (!outOfContext) {
            if (Array.isArray(pinoHttp)) {
                outOfContext = (0, pino_1.default)(...pinoHttp);
            }
            else if ((0, params_1.isPassedLogger)(pinoHttp)) {
                outOfContext = pinoHttp.logger;
            }
            else if (typeof pinoHttp === 'object' &&
                'stream' in pinoHttp &&
                typeof pinoHttp.stream !== 'undefined') {
                outOfContext = (0, pino_1.default)(pinoHttp, pinoHttp.stream);
            }
            else {
                outOfContext = (0, pino_1.default)(pinoHttp);
            }
        }
        this.contextName = renameContext || 'context';
    }
    get logger() {
        // outOfContext is always set in runtime before starts using
        var _a;
        return ((_a = storage_1.storage.getStore()) === null || _a === void 0 ? void 0 : _a.logger) || outOfContext;
    }
    trace(...args) {
        this.call('trace', ...args);
    }
    debug(...args) {
        this.call('debug', ...args);
    }
    info(...args) {
        this.call('info', ...args);
    }
    warn(...args) {
        this.call('warn', ...args);
    }
    error(...args) {
        this.call('error', ...args);
    }
    fatal(...args) {
        this.call('fatal', ...args);
    }
    setContext(value) {
        this.context = value;
    }
    assign(fields) {
        var _a;
        const store = storage_1.storage.getStore();
        if (!store) {
            throw new Error(`${PinoLogger_1.name}: unable to assign extra fields out of request scope`);
        }
        store.logger = store.logger.child(fields);
        (_a = store.responseLogger) === null || _a === void 0 ? void 0 : _a.setBindings(fields);
    }
    call(method, ...args) {
        if (this.context) {
            if (isFirstArgObject(args)) {
                const firstArg = args[0];
                if (firstArg instanceof Error) {
                    args = [
                        Object.assign({ [this.contextName]: this.context }, { [this.errorKey]: firstArg }),
                        ...args.slice(1),
                    ];
                }
                else {
                    args = [
                        Object.assign({ [this.contextName]: this.context }, firstArg),
                        ...args.slice(1),
                    ];
                }
            }
            else {
                args = [{ [this.contextName]: this.context }, ...args];
            }
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore args are union of tuple types
        this.logger[method](...args);
    }
};
exports.PinoLogger = PinoLogger;
exports.PinoLogger = PinoLogger = PinoLogger_1 = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT }),
    __param(0, (0, common_1.Inject)(params_1.PARAMS_PROVIDER_TOKEN)),
    __metadata("design:paramtypes", [Object])
], PinoLogger);
function isFirstArgObject(args) {
    return typeof args[0] === 'object';
}
//# sourceMappingURL=PinoLogger.js.map