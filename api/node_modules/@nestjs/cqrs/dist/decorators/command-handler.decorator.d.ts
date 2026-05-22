import { InjectableOptions } from '@nestjs/common';
import 'reflect-metadata';
import { ICommand } from '../index';
/**
 * Decorator that marks a class as a Nest command handler. A command handler
 * handles commands (actions) executed by your application code.
 *
 * The decorated class must implement the `ICommandHandler` interface.
 *
 * @param command command *type* to be handled by this handler.
 * @param options injectable options passed on to the "@Injectable" decorator.
 *
 * @see https://docs.nestjs.com/recipes/cqrs#commands
 *
 * @publicApi
 */
export declare const CommandHandler: (command: ICommand | (new (...args: any[]) => ICommand), options?: InjectableOptions) => ClassDecorator;
