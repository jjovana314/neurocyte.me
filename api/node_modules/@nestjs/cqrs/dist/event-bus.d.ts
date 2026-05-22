import { OnModuleDestroy, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Observable, Subscription } from 'rxjs';
import { CommandBus } from './command-bus';
import { CqrsModuleOptions, EventIdProvider, IEvent, IEventBus, IEventHandler, IEventPublisher, ISaga } from './interfaces';
import { AsyncContext } from './scopes';
import { UnhandledExceptionBus } from './unhandled-exception-bus';
import { ObservableBus } from './utils';
export type EventHandlerType<EventBase extends IEvent = IEvent> = Type<IEventHandler<EventBase>>;
/**
 * @publicApi
 */
export declare class EventBus<EventBase extends IEvent = IEvent> extends ObservableBus<EventBase> implements IEventBus<EventBase>, OnModuleDestroy {
    private readonly commandBus;
    private readonly moduleRef;
    private readonly unhandledExceptionBus;
    private readonly options?;
    protected eventIdProvider: EventIdProvider<EventBase>;
    protected readonly subscriptions: Subscription[];
    private _publisher;
    private readonly _logger;
    constructor(commandBus: CommandBus, moduleRef: ModuleRef, unhandledExceptionBus: UnhandledExceptionBus, options?: CqrsModuleOptions | undefined);
    /**
     * Returns the publisher.
     * Default publisher is `DefaultPubSub` (in memory).
     */
    get publisher(): IEventPublisher<EventBase>;
    /**
     * Sets the publisher.
     * Default publisher is `DefaultPubSub` (in memory).
     * @param _publisher The publisher to set.
     */
    set publisher(_publisher: IEventPublisher<EventBase>);
    onModuleDestroy(): void;
    /**
     * Publishes an event.
     * @param event The event to publish.
     */
    publish<TEvent extends EventBase>(event: TEvent): any;
    /**
     * Publishes an event.
     * @param event The event to publish.
     * @param asyncContext Async context
     */
    publish<TEvent extends EventBase>(event: TEvent, asyncContext: AsyncContext): any;
    /**
     * Publishes an event.
     * @param event The event to publish.
     * @param dispatcherContext Dispatcher context
     */
    publish<TEvent extends EventBase, TContext = unknown>(event: TEvent, dispatcherContext: TContext): any;
    /**
     * Publishes an event.
     * @param event The event to publish.
     * @param dispatcherContext Dispatcher context
     * @param asyncContext Async context
     */
    publish<TEvent extends EventBase, TContext = unknown>(event: TEvent, dispatcherContext: TContext, asyncContext: AsyncContext): any;
    /**
     * Publishes multiple events.
     * @param events The events to publish.
     */
    publishAll<TEvent extends EventBase>(events: TEvent[]): any;
    /**
     * Publishes multiple events.
     * @param events The events to publish.
     * @param asyncContext Async context
     */
    publishAll<TEvent extends EventBase>(events: TEvent[], asyncContext: AsyncContext): any;
    /**
     * Publishes multiple events.
     * @param events The events to publish.
     * @param dispatcherContext Dispatcher context
     */
    publishAll<TEvent extends EventBase, TContext = unknown>(events: TEvent[], dispatcherContext: TContext): any;
    /**
     * Publishes multiple events.
     * @param events The events to publish.
     * @param dispatcherContext Dispatcher context
     * @param asyncContext Async context
     */
    publishAll<TEvent extends EventBase, TContext = unknown>(events: TEvent[], dispatcherContext: TContext, asyncContext: AsyncContext): any;
    bind(handler: InstanceWrapper<IEventHandler<EventBase>>, id: string): void;
    registerSagas(wrappers?: InstanceWrapper<object>[]): void;
    register(handlers?: InstanceWrapper<IEventHandler<EventBase>>[]): void;
    protected registerHandler(handler: InstanceWrapper<IEventHandler<EventBase>>): void;
    protected ofEventId(id: string): Observable<EventBase>;
    protected registerSaga(saga: ISaga<EventBase>): void;
    private reflectEvents;
    private useDefaultPublisher;
    private mapToUnhandledErrorInfo;
}
