import { Provider } from '@nestjs/common';
import { PinoLogger } from './PinoLogger';
export declare function InjectPinoLogger(context?: string): PropertyDecorator & ParameterDecorator;
export declare function createProvidersForDecorated(): Array<Provider<PinoLogger>>;
export declare function getLoggerToken(context: string): string;
