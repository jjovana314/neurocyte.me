"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidCommandHandlerException = void 0;
/**
 * @publicApi
 */
class InvalidCommandHandlerException extends Error {
    constructor() {
        super(`An invalid command handler has been provided. Please ensure that the provided handler is a class annotated with @CommandHandler and contains an 'execute' method.`);
    }
}
exports.InvalidCommandHandlerException = InvalidCommandHandlerException;
