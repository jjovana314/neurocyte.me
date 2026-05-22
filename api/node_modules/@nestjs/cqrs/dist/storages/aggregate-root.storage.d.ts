import { Type } from '@nestjs/common';
import { AggregateRoot } from '../aggregate-root';
import { EventBus } from '../event-bus';
export declare class AggregateRootStorage {
    private static storage;
    static add(type: Type<AggregateRoot>): void;
    static mergeContext(eventBus: EventBus): void;
}
