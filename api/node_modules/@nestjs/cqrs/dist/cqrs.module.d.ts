import { DynamicModule, OnApplicationBootstrap } from '@nestjs/common';
import { CommandBus } from './command-bus';
import { EventBus } from './event-bus';
import { CqrsModuleAsyncOptions, CqrsModuleOptions, IEvent } from './interfaces';
import { QueryBus } from './query-bus';
import { ExplorerService } from './services/explorer.service';
/**
 * @publicApi
 */
export declare class CqrsModule<EventBase extends IEvent = IEvent> implements OnApplicationBootstrap {
    private readonly explorerService;
    private readonly eventBus;
    private readonly commandBus;
    private readonly queryBus;
    static forRoot(options?: CqrsModuleOptions): DynamicModule;
    static forRootAsync(options: CqrsModuleAsyncOptions): DynamicModule;
    private static createAsyncProviders;
    constructor(explorerService: ExplorerService<EventBase>, eventBus: EventBus<EventBase>, commandBus: CommandBus, queryBus: QueryBus);
    onApplicationBootstrap(): void;
}
