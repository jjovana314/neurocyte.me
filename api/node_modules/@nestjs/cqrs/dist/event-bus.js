"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EventBus_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const command_bus_1 = require("./command-bus");
const constants_1 = require("./constants");
const constants_2 = require("./decorators/constants");
const exceptions_1 = require("./exceptions");
const default_event_id_provider_1 = require("./helpers/default-event-id-provider");
const default_pubsub_1 = require("./helpers/default-pubsub");
const scopes_1 = require("./scopes");
const unhandled_exception_bus_1 = require("./unhandled-exception-bus");
const utils_1 = require("./utils");
/**
 * @publicApi
 */
let EventBus = EventBus_1 = class EventBus extends utils_1.ObservableBus {
    constructor(commandBus, moduleRef, unhandledExceptionBus, options) {
        super();
        this.commandBus = commandBus;
        this.moduleRef = moduleRef;
        this.unhandledExceptionBus = unhandledExceptionBus;
        this.options = options;
        this._logger = new common_1.Logger(EventBus_1.name);
        this.subscriptions = [];
        this.eventIdProvider =
            this.options?.eventIdProvider ?? default_event_id_provider_1.defaultEventIdProvider;
        if (this.options?.eventPublisher) {
            this._publisher = this.options.eventPublisher;
        }
        else {
            this.useDefaultPublisher();
        }
    }
    /**
     * Returns the publisher.
     * Default publisher is `DefaultPubSub` (in memory).
     */
    get publisher() {
        return this._publisher;
    }
    /**
     * Sets the publisher.
     * Default publisher is `DefaultPubSub` (in memory).
     * @param _publisher The publisher to set.
     */
    set publisher(_publisher) {
        this._publisher = _publisher;
    }
    onModuleDestroy() {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
    /**
     * Publishes an event.
     * @param event The event to publish.
     * @param dispatcherOrAsyncContext Dispatcher context or async context
     * @param asyncContext Async context
     */
    publish(event, dispatcherOrAsyncContext, asyncContext) {
        if (!asyncContext && dispatcherOrAsyncContext instanceof scopes_1.AsyncContext) {
            asyncContext = dispatcherOrAsyncContext;
            dispatcherOrAsyncContext = undefined;
        }
        if (asyncContext) {
            asyncContext.attachTo(event);
        }
        return this._publisher.publish(event, dispatcherOrAsyncContext, asyncContext);
    }
    /**
     * Publishes multiple events.
     * @param events The events to publish.
     * @param dispatcherOrAsyncContext Dispatcher context or async context
     * @param asyncContext Async context
     */
    publishAll(events, dispatcherOrAsyncContext, asyncContext) {
        if (!asyncContext && dispatcherOrAsyncContext instanceof scopes_1.AsyncContext) {
            asyncContext = dispatcherOrAsyncContext;
            dispatcherOrAsyncContext = undefined;
        }
        if (asyncContext) {
            events.forEach((event) => {
                if (scopes_1.AsyncContext.isAttached(event)) {
                    return;
                }
                asyncContext.attachTo(event);
            });
        }
        if (this._publisher.publishAll) {
            return this._publisher.publishAll(events, dispatcherOrAsyncContext, asyncContext);
        }
        return (events || []).map((event) => this._publisher.publish(event, dispatcherOrAsyncContext, asyncContext));
    }
    bind(handler, id) {
        const stream$ = id ? this.ofEventId(id) : this.subject$;
        const deferred = handler.isDependencyTreeStatic()
            ? (event) => () => {
                return Promise.resolve(handler.instance.handle(event));
            }
            : (event) => async () => {
                const asyncContext = scopes_1.AsyncContext.of(event) ?? new scopes_1.AsyncContext();
                const instance = await this.moduleRef.resolve(handler.metatype, asyncContext.id, {
                    strict: false,
                });
                return instance.handle(event);
            };
        const subscription = stream$
            .pipe((0, operators_1.mergeMap)((event) => (0, rxjs_1.defer)(deferred(event)).pipe((0, operators_1.catchError)((error) => {
            if (this.options?.rethrowUnhandled) {
                throw error;
            }
            const unhandledError = this.mapToUnhandledErrorInfo(event, error);
            this.unhandledExceptionBus.publish(unhandledError);
            this._logger.error(`"${handler.constructor.name}" has thrown an unhandled exception.`, error);
            return (0, rxjs_1.of)();
        }))))
            .subscribe();
        this.subscriptions.push(subscription);
    }
    registerSagas(wrappers = []) {
        const sagas = wrappers
            .map((wrapper) => {
            const { metatype: target } = wrapper;
            const metadata = Reflect.getMetadata(constants_2.SAGA_METADATA, target) ?? [];
            if (!wrapper.isDependencyTreeStatic()) {
                throw new exceptions_1.UnsupportedSagaScopeException();
            }
            const instance = wrapper.instance;
            return metadata.map((key) => {
                const sagaFn = instance[key].bind(instance);
                Object.defineProperty(sagaFn, 'name', {
                    value: key,
                    writable: false,
                    configurable: false,
                });
                return sagaFn;
            });
        })
            .reduce((a, b) => a.concat(b), []);
        sagas.forEach((saga) => this.registerSaga(saga));
    }
    register(handlers = []) {
        handlers.forEach((handler) => this.registerHandler(handler));
    }
    registerHandler(handler) {
        const typeRef = (handler.metatype || handler.inject
            ? handler.instance?.constructor
            : handler.metatype);
        const events = this.reflectEvents(typeRef);
        events.forEach((event) => {
            const eventId = this.eventIdProvider.getEventId(event);
            this.bind(handler, eventId);
        });
    }
    ofEventId(id) {
        return this.subject$.pipe((0, operators_1.filter)((event) => {
            const { constructor } = Object.getPrototypeOf(event);
            if (!constructor) {
                return false;
            }
            return this.eventIdProvider.getEventId(constructor) === id;
        }));
    }
    registerSaga(saga) {
        if (typeof saga !== 'function') {
            throw new exceptions_1.InvalidSagaException();
        }
        const stream$ = saga(this);
        if (!(stream$ instanceof rxjs_1.Observable)) {
            throw new exceptions_1.InvalidSagaException();
        }
        const subscription = stream$
            .pipe((0, operators_1.filter)((e) => !!e), (0, operators_1.catchError)((error) => {
            if (this.options?.rethrowUnhandled) {
                throw error;
            }
            const unhandledError = this.mapToUnhandledErrorInfo(saga.name, error);
            this.unhandledExceptionBus.publish(unhandledError);
            this._logger.error(`Saga "${saga.name}" has thrown an unhandled exception.`, error);
            return (0, rxjs_1.of)();
        }), (0, operators_1.mergeMap)((command) => (0, rxjs_1.defer)(() => this.commandBus.execute(command)).pipe((0, operators_1.catchError)((error) => {
            if (this.options?.rethrowUnhandled) {
                throw error;
            }
            const unhandledError = this.mapToUnhandledErrorInfo(command, error);
            this.unhandledExceptionBus.publish(unhandledError);
            this._logger.error(`Command handler which execution was triggered by Saga has thrown an unhandled exception.`, error);
            return (0, rxjs_1.of)();
        }))))
            .subscribe();
        this.subscriptions.push(subscription);
    }
    reflectEvents(handler) {
        return Reflect.getMetadata(constants_2.EVENTS_HANDLER_METADATA, handler);
    }
    useDefaultPublisher() {
        this._publisher = new default_pubsub_1.DefaultPubSub(this.subject$);
    }
    mapToUnhandledErrorInfo(eventOrCommand, exception) {
        return {
            cause: eventOrCommand,
            exception,
        };
    }
};
exports.EventBus = EventBus;
exports.EventBus = EventBus = EventBus_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Optional)()),
    __param(3, (0, common_1.Inject)(constants_1.CQRS_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [command_bus_1.CommandBus,
        core_1.ModuleRef,
        unhandled_exception_bus_1.UnhandledExceptionBus, Object])
], EventBus);
