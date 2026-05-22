import { Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import 'reflect-metadata';
import { Query } from './classes/query';
import { CqrsModuleOptions, IQuery, IQueryBus, IQueryHandler, IQueryPublisher, IQueryResult } from './interfaces';
import { AsyncContext } from './scopes';
import { ObservableBus } from './utils/observable-bus';
export type QueryHandlerType<QueryBase extends IQuery = IQuery, QueryResultBase extends IQueryResult = IQueryResult> = Type<IQueryHandler<QueryBase, QueryResultBase>>;
/**
 * @publicApi
 */
export declare class QueryBus<QueryBase extends IQuery = IQuery> extends ObservableBus<QueryBase> implements IQueryBus<QueryBase> {
    private readonly moduleRef;
    private readonly options?;
    private readonly logger;
    private handlers;
    private _publisher;
    constructor(moduleRef: ModuleRef, options?: CqrsModuleOptions | undefined);
    /**
     * Returns the publisher.
     */
    get publisher(): IQueryPublisher<QueryBase>;
    /**
     * Sets the publisher.
     * Default publisher is `DefaultQueryPubSub` (in memory).
     * @param _publisher The publisher to set.
     */
    set publisher(_publisher: IQueryPublisher<QueryBase>);
    /**
     * Executes a query.
     * @param query The query to execute.
     */
    execute<TResult>(query: Query<TResult>): Promise<TResult>;
    /**
     * Executes a query.
     * @param query The query to execute.
     */
    execute<T extends QueryBase, TResult = any>(query: T): Promise<TResult>;
    /**
     * Executes a query.
     * @param query The query to execute.
     */
    execute<TResult>(query: Query<TResult>, asyncContext: AsyncContext): Promise<TResult>;
    /**
     * Executes a query.
     * @param query The query to execute.
     */
    execute<T extends QueryBase, TResult = any>(query: T, asyncContext: AsyncContext): Promise<TResult>;
    bind<T extends QueryBase, TResult extends IQueryResult = any>(handler: InstanceWrapper<IQueryHandler<T, TResult>>, queryId: string): void;
    register(handlers?: InstanceWrapper<IQueryHandler<QueryBase>>[]): void;
    protected registerHandler(handler: InstanceWrapper<IQueryHandler<QueryBase>>): void;
    private getQueryId;
    private reflectQueryId;
    private useDefaultPublisher;
    private getQueryName;
}
