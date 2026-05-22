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
exports.NativeLogger = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const common_1 = require("@nestjs/common");
const params_1 = require("./params");
const PinoLogger_1 = require("./PinoLogger");
let NativeLogger = class NativeLogger {
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
        this.callError(message, ...optionalParams);
    }
    fatal(message, ...optionalParams) {
        this.call('fatal', message, ...optionalParams);
    }
    call(level, message, ...optionalParams) {
        const args = [message, ...optionalParams];
        const { messages, context } = this.getContextAndMessagesToPrint(args);
        for (const msg of messages) {
            this.logSingleMessage(level, msg, context);
        }
    }
    callError(message, ...optionalParams) {
        const args = [message, ...optionalParams];
        const { messages, context, stack } = this.getContextAndStackAndMessagesToPrint(args);
        for (const msg of messages) {
            this.logSingleMessage('error', msg, context, stack);
        }
    }
    logSingleMessage(level, message, context, stack) {
        const objArg = {};
        if (context) {
            objArg[this.contextName] = context;
        }
        if (stack) {
            objArg.stack = stack;
        }
        if (typeof message === 'object' && message !== null) {
            if (message instanceof Error) {
                this.logger[level](objArg, message.stack || message.message);
            }
            else {
                this.logger[level](objArg, message);
            }
        }
        else {
            this.logger[level](objArg, String(message));
        }
    }
    getContextAndMessagesToPrint(args) {
        if (args.length <= 1) {
            return { messages: args, context: undefined };
        }
        const lastElement = args[args.length - 1];
        if (typeof lastElement === 'string') {
            return {
                context: lastElement,
                messages: args.slice(0, args.length - 1),
            };
        }
        return { messages: args, context: undefined };
    }
    getContextAndStackAndMessagesToPrint(args) {
        if (args.length === 2) {
            if (this.isStackFormat(args[1])) {
                return {
                    messages: [args[0]],
                    stack: args[1],
                    context: undefined,
                };
            }
            if (typeof args[1] === 'string') {
                return {
                    messages: [args[0]],
                    context: args[1],
                };
            }
        }
        const { messages, context } = this.getContextAndMessagesToPrint(args);
        if (messages.length <= 1) {
            return { messages, context };
        }
        const lastMessage = messages[messages.length - 1];
        if (typeof lastMessage === 'string' || typeof lastMessage === 'undefined') {
            return {
                stack: lastMessage,
                messages: messages.slice(0, messages.length - 1),
                context,
            };
        }
        return { messages, context };
    }
    isStackFormat(value) {
        if (typeof value !== 'string' && typeof value !== 'undefined') {
            return false;
        }
        return typeof value === 'string' && /^(.)+\n\s+at .+:\d+:\d+/.test(value);
    }
};
exports.NativeLogger = NativeLogger;
exports.NativeLogger = NativeLogger = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(params_1.PARAMS_PROVIDER_TOKEN)),
    __metadata("design:paramtypes", [PinoLogger_1.PinoLogger, Object])
], NativeLogger);
//# sourceMappingURL=NativeLogger.js.map