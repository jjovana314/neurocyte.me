import { Type } from '@nestjs/common';
import 'reflect-metadata';
import { Observable } from 'rxjs';
import { CqrsModuleOptions, ICommand, IEvent, IUnhandledExceptionPublisher, UnhandledExceptionInfo } from './interfaces';
import { ObservableBus } from './utils/observable-bus';
/**
 * A bus that publishes unhandled exceptions.
 * @template Cause The type of the cause of the exception.
 */
export declare class UnhandledExceptionBus<Cause = IEvent | ICommand> extends ObservableBus<UnhandledExceptionInfo<Cause>> {
    private readonly options?;
    private _publisher;
    constructor(options?: CqrsModuleOptions | undefined);
    /**
     * Filter values depending on their instance type (comparison is made
     * using native `instanceof`).
     *
     * @param types List of types to filter by.
     * @return A stream only emitting the filtered exceptions.
     */
    static ofType<TInput extends IEvent | ICommand, TOutput extends IEvent | ICommand>(...types: Type<TOutput>[]): (source: Observable<UnhandledExceptionInfo<TInput>>) => Observable<UnhandledExceptionInfo<TOutput>>;
    /**
     * Gets the publisher of the bus.
     */
    get publisher(): IUnhandledExceptionPublisher<Cause>;
    /**
     * Sets the publisher of the bus.
     */
    set publisher(_publisher: IUnhandledExceptionPublisher<Cause>);
    /**
     * Publishes an unhandled exception.
     * @param info The exception information.
     */
    publish(info: UnhandledExceptionInfo<Cause>): any;
    private useDefaultPublisher;
}
