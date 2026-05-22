"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultUnhandledExceptionPubSub = void 0;
/**
 * Default implementation of the `IUnhandledExceptionPublisher` interface.
 */
class DefaultUnhandledExceptionPubSub {
    constructor(subject$) {
        this.subject$ = subject$;
    }
    publish(info) {
        this.subject$.next(info);
    }
}
exports.DefaultUnhandledExceptionPubSub = DefaultUnhandledExceptionPubSub;
