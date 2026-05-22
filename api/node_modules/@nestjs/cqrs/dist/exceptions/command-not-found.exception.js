"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHandlerNotFoundException = void 0;
/**
 * @publicApi
 */
class CommandHandlerNotFoundException extends Error {
    constructor(commandName) {
        super(`No handler found for the command: "${commandName}".`);
    }
}
exports.CommandHandlerNotFoundException = CommandHandlerNotFoundException;
