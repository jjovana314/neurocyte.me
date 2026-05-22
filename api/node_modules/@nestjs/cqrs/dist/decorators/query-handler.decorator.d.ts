import { InjectableOptions } from '@nestjs/common';
import 'reflect-metadata';
import { IQuery } from '../interfaces';
/**
 * Decorator that marks a class as a Nest query handler. A query handler
 * handles queries executed by your application code.
 *
 * The decorated class must implement the `IQueryHandler` interface.
 *
 * @param query query *type* to be handled by this handler.
 * @param options injectable options passed on to the "@Injectable" decorator.
 *
 * @see https://docs.nestjs.com/recipes/cqrs#queries
 *
 * @publicApi
 */
export declare const QueryHandler: (query: IQuery, options?: InjectableOptions) => ClassDecorator;
