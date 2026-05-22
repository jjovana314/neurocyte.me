import { AsyncLocalStorage } from 'async_hooks';
import { Logger } from 'pino';
export declare class Store {
    logger: Logger;
    responseLogger?: Logger | undefined;
    constructor(logger: Logger, responseLogger?: Logger | undefined);
}
export declare const storage: AsyncLocalStorage<Store>;
