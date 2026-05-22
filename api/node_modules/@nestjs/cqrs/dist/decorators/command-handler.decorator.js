"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHandler = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
require("reflect-metadata");
const constants_1 = require("./constants");
/**
 * Decorator that marks a class as a Nest command handler. A command handler
 * handles commands (actions) executed by your application code.
 *
 * The decorated class must implement the `ICommandHandler` interface.
 *
 * @param command command *type* to be handled by this handler.
 * @param options injectable options passed on to the "@Injectable" decorator.
 *
 * @see https://docs.nestjs.com/recipes/cqrs#commands
 *
 * @publicApi
 */
const CommandHandler = (command, options) => {
    return (target) => {
        if (!Reflect.hasOwnMetadata(constants_1.COMMAND_METADATA, command)) {
            Reflect.defineMetadata(constants_1.COMMAND_METADATA, { id: (0, crypto_1.randomUUID)() }, command);
        }
        Reflect.defineMetadata(constants_1.COMMAND_HANDLER_METADATA, command, target);
        if (options) {
            (0, common_1.Injectable)(options)(target);
        }
    };
};
exports.CommandHandler = CommandHandler;
