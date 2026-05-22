import { InjectableOptions } from '@nestjs/common';
import 'reflect-metadata';
import { IEvent } from '../index';
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
export declare const EventsHandler: (...events: (IEvent | (new (...args: any[]) => IEvent) | InjectableOptions)[]) => ClassDecorator;
