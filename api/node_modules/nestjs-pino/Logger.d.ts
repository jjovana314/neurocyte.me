import { LoggerService } from '@nestjs/common';
import { Params } from './params';
import { PinoLogger } from './PinoLogger';
export declare class Logger implements LoggerService {
    protected readonly logger: PinoLogger;
    private readonly contextName;
    constructor(logger: PinoLogger, { renameContext }: Params);
    verbose(message: any, ...optionalParams: any[]): void;
    debug(message: any, ...optionalParams: any[]): void;
    log(message: any, ...optionalParams: any[]): void;
    warn(message: any, ...optionalParams: any[]): void;
    error(message: any, ...optionalParams: any[]): void;
    fatal(message: any, ...optionalParams: any[]): void;
    private call;
    /**
     * Unfortunately built-in (not only) `^.*Exception(s?)Handler$` classes call `.error`
     * method with not supported contract:
     *
     * - ExceptionsHandler
     * @see https://github.com/nestjs/nest/blob/35baf7a077bb972469097c5fea2f184b7babadfc/packages/core/exceptions/base-exception-filter.ts#L60-L63
     *
     * - ExceptionHandler
     * @see https://github.com/nestjs/nest/blob/99ee3fd99341bcddfa408d1604050a9571b19bc9/packages/core/errors/exception-handler.ts#L9
     *
     * - WsExceptionsHandler
     * @see https://github.com/nestjs/nest/blob/9d0551ff25c5085703bcebfa7ff3b6952869e794/packages/websockets/exceptions/base-ws-exception-filter.ts#L47-L50
     *
     * - RpcExceptionsHandler @see https://github.com/nestjs/nest/blob/9d0551ff25c5085703bcebfa7ff3b6952869e794/packages/microservices/exceptions/base-rpc-exception-filter.ts#L26-L30
     *
     * - all of them
     * @see https://github.com/search?l=TypeScript&q=org%3Anestjs+logger+error+stack&type=Code
     */
    private isWrongExceptionsHandlerContract;
}
