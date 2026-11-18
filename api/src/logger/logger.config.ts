import pino, { Logger } from 'pino';
import pretty, { PrettyOptions } from 'pino-pretty';

/** pino-pretty formatting shared by the API and the mail-service. */
export const prettyOptions: PrettyOptions = {
  colorize: true,
  translateTime: 'dd.mm.yyyy, HH:MM:ss',
  ignore: 'pid,hostname',
};

/** pino-http options for nestjs-pino's LoggerModule in the API. */
export const pinoHttpOptions = {
  useLevel: 'info' as const,
  serializers: {
    timestamp: () => `time: ${new Date(Date.now()).toISOString()}`,
  },
  transport: { target: 'pino-pretty', options: prettyOptions },
  autoLogging: false,
};

/**
 * A standalone pino logger with the same formatting, for code that runs
 * outside Nest's DI (the mail-service Lambda and scripts).
 *
 * pino-pretty is used as an in-process stream rather than a `transport`:
 * transports run in a worker thread loaded by module name at runtime, which
 * doesn't survive esbuild bundling for Lambda. Colors are only enabled on a
 * terminal so CloudWatch logs don't fill up with ANSI escape codes.
 */
export function createLogger(name: string): Logger {
  return pino(
    { name, level: 'info' },
    pretty({ ...prettyOptions, colorize: Boolean(process.stdout.isTTY) }),
  );
}
