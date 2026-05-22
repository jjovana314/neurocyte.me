"use strict";
/* eslint-disable @typescript-eslint/no-unused-vars */
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const INTERNAL_EVENTS = Symbol();
const IS_AUTO_COMMIT_ENABLED = Symbol();
/**
 * Represents an aggregate root.
 * An aggregate root is an entity that represents a meaningful concept in the domain.
 * It is the root of an aggregate, which is a cluster of domain objects that can be treated as a single unit.
 *
 * @template EventBase The base type of the events.
 */
class AggregateRoot {
    constructor() {
        this[_a] = false;
        this[_b] = [];
    }
    /**
     * Sets whether the aggregate root should automatically commit events.
     */
    set autoCommit(value) {
        this[IS_AUTO_COMMIT_ENABLED] = value;
    }
    /**
     * Gets whether the aggregate root should automatically commit events.
     */
    get autoCommit() {
        return this[IS_AUTO_COMMIT_ENABLED];
    }
    /**
     * Publishes an event. Must be merged with the publisher context in order to work.
     * @param event The event to publish.
     */
    publish(event) { }
    /**
     * Publishes multiple events. Must be merged with the publisher context in order to work.
     * @param events The events to publish.
     */
    publishAll(events) { }
    /**
     * Commits all uncommitted events.
     */
    commit() {
        this.publishAll(this[INTERNAL_EVENTS]);
        this[INTERNAL_EVENTS].length = 0;
    }
    /**
     * Uncommits all events.
     */
    uncommit() {
        this[INTERNAL_EVENTS].length = 0;
    }
    /**
     * Returns all uncommitted events.
     * @returns All uncommitted events.
     */
    getUncommittedEvents() {
        return this[INTERNAL_EVENTS];
    }
    /**
     * Loads events from history.
     * @param history The history to load.
     */
    loadFromHistory(history) {
        history.forEach((event) => this.apply(event, true));
    }
    apply(event, optionsOrIsFromHistory = {}) {
        const isFromHistory = (typeof optionsOrIsFromHistory === 'boolean'
            ? optionsOrIsFromHistory
            : optionsOrIsFromHistory.fromHistory) ?? false;
        const skipHandler = typeof optionsOrIsFromHistory === 'boolean'
            ? false
            : optionsOrIsFromHistory.skipHandler;
        if (!isFromHistory && !this.autoCommit) {
            this[INTERNAL_EVENTS].push(event);
        }
        this.autoCommit && this.publish(event);
        if (!skipHandler) {
            const handler = this.getEventHandler(event);
            handler && handler.call(this, event);
        }
    }
    getEventHandler(event) {
        const handler = `on${this.getEventName(event)}`;
        return this[handler];
    }
    getEventName(event) {
        const { constructor } = Object.getPrototypeOf(event);
        return constructor.name;
    }
}
exports.AggregateRoot = AggregateRoot;
_a = IS_AUTO_COMMIT_ENABLED, _b = INTERNAL_EVENTS;
