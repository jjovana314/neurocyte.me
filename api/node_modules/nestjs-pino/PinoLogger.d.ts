import pino from 'pino';
import { Params } from './params';
type PinoMethods = Pick<pino.Logger, 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'>;
/**
 * This is copy of pino.LogFn but with possibilty to make method override.
 * Current usage works:
 *
 *  trace(msg: string, ...args: any[]): void;
 *  trace(obj: object, msg?: string, ...args: any[]): void;
 *  trace(...args: Parameters<LoggerFn>) {
 *    this.call('trace', ...args);
 *  }
 *
 * But if change local LoggerFn to pino.LogFn – this will say that overrides
 * are incompatible
 */
type LoggerFn = ((msg: string, ...args: any[]) => void) | ((obj: object, msg?: string, ...args: any[]) => void);
export declare function __resetOutOfContextForTests(): void;
export declare class PinoLogger implements PinoMethods {
    /**
     * root is the most root logger that can be used to change params at runtime.
     * Accessible only when `useExisting` is not set to `true` in `Params`.
     * Readonly, but you can change it's properties.
     */
    static readonly root: pino.Logger;
    protected context: string;
    protected readonly contextName: string;
    protected readonly errorKey: string;
    constructor({ pinoHttp, renameContext }: Params);
    get logger(): pino.Logger;
    trace(msg: string, ...args: any[]): void;
    trace(obj: unknown, msg?: string, ...args: any[]): void;
    debug(msg: string, ...args: any[]): void;
    debug(obj: unknown, msg?: string, ...args: any[]): void;
    info(msg: string, ...args: any[]): void;
    info(obj: unknown, msg?: string, ...args: any[]): void;
    warn(msg: string, ...args: any[]): void;
    warn(obj: unknown, msg?: string, ...args: any[]): void;
    error(msg: string, ...args: any[]): void;
    error(obj: unknown, msg?: string, ...args: any[]): void;
    fatal(msg: string, ...args: any[]): void;
    fatal(obj: unknown, msg?: string, ...args: any[]): void;
    setContext(value: string): void;
    assign(fields: pino.Bindings): void;
    protected call(method: pino.Level, ...args: Parameters<LoggerFn>): void;
}
export {};
