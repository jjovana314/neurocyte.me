import { AggregateRoot } from './aggregate-root';
import { EventBus } from './event-bus';
import { IEvent } from './interfaces';
import { AsyncContext } from './scopes';
export interface Constructor<T> {
    new (...args: any[]): T;
}
/**
 * @publicApi
 */
export declare class EventPublisher<EventBase extends IEvent = IEvent> {
    private readonly eventBus;
    constructor(eventBus: EventBus<EventBase>);
    /**
     * Merge the event publisher into the provided class.
     * This is required to make `publish` and `publishAll` available on the `AggregateRoot` class.
     * @param metatype The class to merge into.
     * @param asyncContext The async context (if scoped).
     */
    mergeClassContext<T extends Constructor<AggregateRoot<EventBase>>>(metatype: T, asyncContext?: AsyncContext): T;
    /**
     * Merge the event publisher into the provided object.
     * This is required to make `publish` and `publishAll` available on the `AggregateRoot` class instance.
     * @param object The object to merge into.
     * @param asyncContext The async context (if scoped).
     */
    mergeObjectContext<T extends AggregateRoot<EventBase>>(object: T, asyncContext?: AsyncContext): T;
}
