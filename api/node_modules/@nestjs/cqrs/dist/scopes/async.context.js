"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncContext = exports.ASYNC_CONTEXT_ATTRIBUTE = void 0;
const core_1 = require("@nestjs/core");
exports.ASYNC_CONTEXT_ATTRIBUTE = Symbol('ASYNC_CONTEXT_ATTRIBUTE');
/**
 * Represents the context of an asynchronous operation.
 */
class AsyncContext {
    constructor() {
        this.id = core_1.ContextIdFactory.create();
    }
    /**
     * Attaches the context to an object.
     * @param target The object to attach the context to.
     */
    attachTo(target) {
        Object.defineProperty(target, exports.ASYNC_CONTEXT_ATTRIBUTE, {
            value: this,
            enumerable: false,
        });
    }
    /**
     * Checks if target is already attached to any async context.
     * @param target The object to check.
     * @returns "true" if the target is attached to an async context, "false" otherwise.
     */
    static isAttached(target) {
        return !!target[exports.ASYNC_CONTEXT_ATTRIBUTE];
    }
    /**
     * Merges the context of an asynchronous operation from a given command, query, or event to another object.
     * @param from A command, query, or event.
     * @param to A command, query, or event to merge the context to.
     */
    static merge(from, to) {
        if (!from || !to) {
            return;
        }
        const fromContext = from[exports.ASYNC_CONTEXT_ATTRIBUTE];
        if (!fromContext) {
            return;
        }
        Object.defineProperty(to, exports.ASYNC_CONTEXT_ATTRIBUTE, {
            value: fromContext,
            enumerable: false,
        });
    }
    /**
     * Gets the context of an asynchronous operation from a given object.
     * @param target A command, query, or event.
     * @returns An "AsyncContext" instance or "undefined" if the context is not found.
     */
    static of(target) {
        return target[exports.ASYNC_CONTEXT_ATTRIBUTE];
    }
}
exports.AsyncContext = AsyncContext;
