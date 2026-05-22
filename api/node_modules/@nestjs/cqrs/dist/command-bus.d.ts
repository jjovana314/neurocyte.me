import { Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import 'reflect-metadata';
import { Command } from './classes';
import { CqrsModuleOptions, ICommand, ICommandBus, ICommandHandler, ICommandPublisher } from './interfaces/index';
import { AsyncContext } from './scopes/async.context';
import { ObservableBus } from './utils/observable-bus';
export type CommandHandlerType<T extends ICommand = ICommand> = Type<ICommandHandler<T>>;
/**
 * @publicApi
 */
export declare class CommandBus<CommandBase extends ICommand = ICommand> extends ObservableBus<CommandBase> implements ICommandBus<CommandBase> {
    private readonly moduleRef;
    private readonly options?;
    private readonly logger;
    private handlers;
    private _publisher;
    constructor(moduleRef: ModuleRef, options?: CqrsModuleOptions | undefined);
    /**
     * Returns the publisher.
     * Default publisher is `DefaultCommandPubSub` (in memory).
     */
    get publisher(): ICommandPublisher<CommandBase>;
    /**
     * Sets the publisher.
     * Default publisher is `DefaultCommandPubSub` (in memory).
     * @param _publisher The publisher to set.
     */
    set publisher(_publisher: ICommandPublisher<CommandBase>);
    /**
     * Executes a command.
     * @param command The command to execute.
     * @returns A promise that, when resolved, will contain the result returned by the command's handler.
     */
    execute<R = void>(command: Command<R>): Promise<R>;
    /**
     * Executes a command.
     * @param command The command to execute.
     * @param context The context to use. Optional.
     * @returns A promise that, when resolved, will contain the result returned by the command's handler.
     */
    execute<R = void>(command: Command<R>, context?: AsyncContext): Promise<R>;
    /**
     * Executes a command.
     * @param command The command to execute.
     * @param context The context to use. Optional.
     * @returns A promise that, when resolved, will contain the result returned by the command's handler.
     */
    execute<T extends CommandBase, R = any>(command: T, context?: AsyncContext): Promise<R>;
    bind<T extends CommandBase>(handler: InstanceWrapper<ICommandHandler<T>>, id: string): void;
    register(handlers?: InstanceWrapper<ICommandHandler<CommandBase>>[]): void;
    protected registerHandler(handler: InstanceWrapper<ICommandHandler<CommandBase>>): void;
    private getCommandId;
    private getCommandName;
    private reflectCommandId;
    private useDefaultPublisher;
}
