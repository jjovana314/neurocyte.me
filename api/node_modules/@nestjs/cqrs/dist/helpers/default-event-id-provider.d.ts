import { Type } from '@nestjs/common';
import { EventIdProvider, IEvent } from '../interfaces';
declare class DefaultEventIdProvider<EventBase extends IEvent = IEvent> implements EventIdProvider<EventBase> {
    getEventId(event: Type<EventBase>): string | null;
}
export declare const defaultEventIdProvider: DefaultEventIdProvider<IEvent>;
export {};
