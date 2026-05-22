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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const common_1 = require("@nestjs/common");
const params_1 = require("./params");
const PinoLogger_1 = require("./PinoLogger");
let Logger = class Logger {
    constructor(logger, { renameContext }) {
        this.logger = logger;
        this.contextName = renameContext || 'context';
    }
    verbose(message, ...optionalParams) {
        this.call('trace', message, ...optionalParams);
    }
    debug(message, ...optionalParams) {
        this.call('debug', message, ...optionalParams);
    }
    log(message, ...optionalParams) {
        this.call('info', message, ...optionalParams);
    }
    warn(message, ...optionalParams) {
        this.call('warn', message, ...optionalParams);
    }
    error(message, ...optionalParams) {
        this.call('error', message, ...optionalParams);
    }
    fatal(message, ...optionalParams) {
        this.call('fatal', message, ...optionalParams);
    }
    call(level, message, ...optionalParams) {
        const objArg = {};
        // optionalParams contains extra params passed to logger
        // context name is the last item
        let params = [];
        if (optionalParams.length !== 0) {
            objArg[this.contextName] = optionalParams[optionalParams.length - 1];
            params = optionalParams.slice(0, -1);
        }
        if (typeof message === 'object') {
            if (message instanceof Error) {
                objArg.err = message;
            }
            else {
                Object.assign(objArg, message);
            }
            this.logger[level](objArg, ...params);
        }
        else if (this.isWrongExceptionsHandlerContract(level, message, params)) {
            objArg.err = new Error(message);
            objArg.err.stack = params[0];
            this.logger[level](objArg);
        }
        else {
            this.logger[level](objArg, message, ...params);
        }
    }
    /**
     * Unfortunately built-in (not only) `^.*Exception(s?)Handler$` classes call `.error`
     * method with not supported contract:
     *
     * - ExceptionsHandler
     * @see https://github.com/nestjs/nest/blob/35baf7a077bb972469097c5fea2f184b7babadfc/packages/core/exceptions/base-exception-filter.ts#L60-L63
     *
     * - ExceptionHandler
     * @see https://github.com/nestjs/nest/blob/99ee3fd99341bcddfa408d1604050a9571b19bc9/packages/core/errors/exception-handler.ts#L9
     *
     * - WsExceptionsHandler
     * @see https://github.com/nestjs/nest/blob/9d0551ff25c5085703bcebfa7ff3b6952869e794/packages/websockets/exceptions/base-ws-exception-filter.ts#L47-L50
     *
     * - RpcExceptionsHandler @see https://github.com/nestjs/nest/blob/9d0551ff25c5085703bcebfa7ff3b6952869e794/packages/microservices/exceptions/base-rpc-exception-filter.ts#L26-L30
     *
     * - all of them
     * @see https://github.com/search?l=TypeScript&q=org%3Anestjs+logger+error+stack&type=Code
     */
    isWrongExceptionsHandlerContract(level, message, params) {
        return (level === 'error' &&
            typeof message === 'string' &&
            params.length === 1 &&
            typeof params[0] === 'string' &&
            /\n\s*at /.test(params[0]));
    }
};
exports.Logger = Logger;
exports.Logger = Logger = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(params_1.PARAMS_PROVIDER_TOKEN)),
    __metadata("design:paramtypes", [PinoLogger_1.PinoLogger, Object])
], Logger);
//# sourceMappingURL=Logger.js.map