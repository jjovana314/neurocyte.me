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
var CommandBus_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandBus = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
require("reflect-metadata");
const constants_1 = require("./constants");
const constants_2 = require("./decorators/constants");
const command_not_found_exception_1 = require("./exceptions/command-not-found.exception");
const default_command_pubsub_1 = require("./helpers/default-command-pubsub");
const index_1 = require("./index");
const async_context_1 = require("./scopes/async.context");
const observable_bus_1 = require("./utils/observable-bus");
/**
 * @publicApi
 */
let CommandBus = CommandBus_1 = class CommandBus extends observable_bus_1.ObservableBus {
    constructor(moduleRef, options) {
        super();
        this.moduleRef = moduleRef;
        this.options = options;
        this.logger = new common_1.Logger(CommandBus_1.name);
        this.handlers = new Map();
        if (this.options?.commandPublisher) {
            this._publisher = this.options.commandPublisher;
        }
        else {
            this.useDefaultPublisher();
        }
    }
    /**
     * Returns the publisher.
     * Default publisher is `DefaultCommandPubSub` (in memory).
     */
    get publisher() {
        return this._publisher;
    }
    /**
     * Sets the publisher.
     * Default publisher is `DefaultCommandPubSub` (in memory).
     * @param _publisher The publisher to set.
     */
    set publisher(_publisher) {
        this._publisher = _publisher;
    }
    /**
     * Executes a command.
     * @param command The command to execute.
     * @param context The context to use. Optional.
     * @returns A promise that, when resolved, will contain the result returned by the command's handler.
     */
    execute(command, context) {
        const commandId = this.getCommandId(command);
        const executeFn = this.handlers.get(commandId);
        if (!executeFn) {
            const commandName = this.getCommandName(command);
            throw new command_not_found_exception_1.CommandHandlerNotFoundException(commandName);
        }
        this._publisher.publish(command);
        return executeFn(command, context);
    }
    bind(handler, id) {
        if (handler.isDependencyTreeStatic()) {
            const instance = handler.instance;
            if (!instance.execute) {
                throw new index_1.InvalidCommandHandlerException();
            }
            this.handlers.set(id, (command) => instance.execute(command));
            return;
        }
        this.handlers.set(id, async (command, context) => {
            context ??= async_context_1.AsyncContext.of(command) ?? new async_context_1.AsyncContext();
            if (!async_context_1.AsyncContext.isAttached(context)) {
                // Commands returned by sagas may already have an async context set
                // and a corresponding request provider registered.
                this.moduleRef.registerRequestByContextId(context, context.id);
                context.attachTo(command);
            }
            const instance = await this.moduleRef.resolve(handler.metatype, context.id, {
                strict: false,
            });
            return instance.execute(command);
        });
    }
    register(handlers = []) {
        handlers.forEach((handler) => this.registerHandler(handler));
    }
    registerHandler(handler) {
        const typeRef = handler.metatype;
        const target = this.reflectCommandId(typeRef);
        if (!target) {
            throw new index_1.InvalidCommandHandlerException();
        }
        if (this.handlers.has(target)) {
            this.logger.warn(`Command handler [${typeRef.name}] is already registered. Overriding previously registered handler.`);
        }
        this.bind(handler, target);
    }
    getCommandId(command) {
        const { constructor: commandType } = Object.getPrototypeOf(command);
        const commandMetadata = Reflect.getMetadata(constants_2.COMMAND_METADATA, commandType);
        if (!commandMetadata) {
            throw new command_not_found_exception_1.CommandHandlerNotFoundException(commandType.name);
        }
        return commandMetadata.id;
    }
    getCommandName(command) {
        const { constructor } = Object.getPrototypeOf(command);
        return constructor.name;
    }
    reflectCommandId(handler) {
        const command = Reflect.getMetadata(constants_2.COMMAND_HANDLER_METADATA, handler);
        const commandMetadata = Reflect.getMetadata(constants_2.COMMAND_METADATA, command);
        return commandMetadata.id;
    }
    useDefaultPublisher() {
        this._publisher = new default_command_pubsub_1.DefaultCommandPubSub(this.subject$);
    }
};
exports.CommandBus = CommandBus;
exports.CommandBus = CommandBus = CommandBus_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(constants_1.CQRS_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [core_1.ModuleRef, Object])
], CommandBus);
