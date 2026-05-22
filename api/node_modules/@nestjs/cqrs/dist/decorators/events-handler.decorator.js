"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsHandler = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
require("reflect-metadata");
const constants_1 = require("./constants");
/**
 * Decorator that marks a class as a Nest event handler. An event handler
 * handles events executed by your application code.
 *
 * The decorated class must implement the `IEventHandler` interface.
 *
 * @param events one or more event *types* to be handled by this handler.
 * @param options injectable options passed on to the "@Injectable" decorator.
 *
 * @see https://docs.nestjs.com/recipes/cqrs#events
 *
 * @publicApi
 */
const EventsHandler = (...events) => {
    return (target) => {
        const last = events[events.length - 1];
        if (last && typeof last !== 'function' && 'scope' in last) {
            (0, common_1.Injectable)(last)(target);
            events.pop();
        }
        events.forEach((event) => {
            if (!Reflect.hasOwnMetadata(constants_1.EVENT_METADATA, event)) {
                Reflect.defineMetadata(constants_1.EVENT_METADATA, { id: (0, crypto_1.randomUUID)() }, event);
            }
        });
        Reflect.defineMetadata(constants_1.EVENTS_HANDLER_METADATA, events, target);
    };
};
exports.EventsHandler = EventsHandler;
