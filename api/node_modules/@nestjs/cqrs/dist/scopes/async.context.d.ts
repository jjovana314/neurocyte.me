export declare const ASYNC_CONTEXT_ATTRIBUTE: unique symbol;
/**
 * Represents the context of an asynchronous operation.
 */
export declare class AsyncContext {
    readonly id: import("@nestjs/core").ContextId;
    /**
     * Attaches the context to an object.
     * @param target The object to attach the context to.
     */
    attachTo(target: object): void;
    /**
     * Checks if target is already attached to any async context.
     * @param target The object to check.
     * @returns "true" if the target is attached to an async context, "false" otherwise.
     */
    static isAttached(target: object): boolean;
    /**
     * Merges the context of an asynchronous operation from a given command, query, or event to another object.
     * @param from A command, query, or event.
     * @param to A command, query, or event to merge the context to.
     */
    static merge(from: object, to: object): void;
    /**
     * Gets the context of an asynchronous operation from a given object.
     * @param target A command, query, or event.
     * @returns An "AsyncContext" instance or "undefined" if the context is not found.
     */
    static of(target: object): AsyncContext | undefined;
}
