import { Subject } from 'rxjs';
import { ICommand, IEvent, IUnhandledExceptionPublisher, UnhandledExceptionInfo } from '../interfaces';
/**
 * Default implementation of the `IUnhandledExceptionPublisher` interface.
 */
export declare class DefaultUnhandledExceptionPubSub<Cause = IEvent | ICommand> implements IUnhandledExceptionPublisher<Cause> {
    private subject$;
    constructor(subject$: Subject<UnhandledExceptionInfo<Cause>>);
    publish(info: UnhandledExceptionInfo<Cause>): void;
}
