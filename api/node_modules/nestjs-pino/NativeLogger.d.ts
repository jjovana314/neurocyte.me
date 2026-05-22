import { LoggerService } from '@nestjs/common';
import { Params } from './params';
import { PinoLogger } from './PinoLogger';
export declare class NativeLogger implements LoggerService {
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
    private callError;
    private logSingleMessage;
    private getContextAndMessagesToPrint;
    private getContextAndStackAndMessagesToPrint;
    private isStackFormat;
}
