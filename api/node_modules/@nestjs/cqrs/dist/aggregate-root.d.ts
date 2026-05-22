import { Type } from '@nestjs/common';
import { IEvent, IEventHandler } from './interfaces';
declare const INTERNAL_EVENTS: unique symbol;
declare const IS_AUTO_COMMIT_ENABLED: unique symbol;
/**
 * Represents an aggregate root.
 * An aggregate root is an entity that represents a meaningful concept in the domain.
 * It is the root of an aggregate, which is a cluster of domain objects that can be treated as a single unit.
 *
 * @template EventBase The base type of the events.
 */
export declare abstract class AggregateRoot<EventBase extends IEvent = IEvent> {
    [IS_AUTO_COMMIT_ENABLED]: boolean;
    private readonly [INTERNAL_EVENTS];
    /**
     * Sets whether the aggregate root should automatically commit events.
     */
    set autoCommit(value: boolean);
    /**
     * Gets whether the aggregate root should automatically commit events.
     */
    get autoCommit(): boolean;
    /**
     * Publishes an event. Must be merged with the publisher context in order to work.
     * @param event The event to publish.
     */
    publish<T extends EventBase = EventBase>(event: T): void;
    /**
     * Publishes multiple events. Must be merged with the publisher context in order to work.
     * @param events The events to publish.
     */
    publishAll<T extends EventBase = EventBase>(events: T[]): void;
    /**
     * Commits all uncommitted events.
     */
    commit(): void;
    /**
     * Uncommits all events.
     */
    uncommit(): void;
    /**
     * Returns all uncommitted events.
     * @returns All uncommitted events.
     */
    getUncommittedEvents(): EventBase[];
    /**
     * Loads events from history.
     * @param history The history to load.
     */
    loadFromHistory(history: EventBase[]): void;
    /**
     * Applies an event.
     * If auto commit is enabled, the event will be published immediately (note: must be merged with the publisher context in order to work).
     * Otherwise, the event will be stored in the internal events array, and will be published when the commit method is called.
     * Also, the corresponding event handler will be called (if exists).
     * For example, if the event is called UserCreatedEvent, the "onUserCreatedEvent" method will be called.
     *
     * @param event The event to apply.
     * @param isFromHistory Whether the event is from history.
     */
    apply<T extends EventBase = EventBase>(event: T, isFromHistory?: boolean): void;
    /**
     * Applies an event.
     * If auto commit is enabled, the event will be published immediately (note: must be merged with the publisher context in order to work).
     * Otherwise, the event will be stored in the internal events array, and will be published when the commit method is called.
     * Also, the corresponding event handler will be called (if exists).
     * For example, if the event is called UserCreatedEvent, the "onUserCreatedEvent" method will be called.
     *
     * @param event The event to apply.
     * @param options The options.
     */
    apply<T extends EventBase = EventBase>(event: T, options?: {
        fromHistory?: boolean;
        skipHandler?: boolean;
    }): void;
    protected getEventHandler<T extends EventBase = EventBase>(event: T): Type<IEventHandler> | undefined;
    protected getEventName(event: any): string;
}
export {};
