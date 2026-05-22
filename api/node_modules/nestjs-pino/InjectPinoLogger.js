"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InjectPinoLogger = InjectPinoLogger;
exports.createProvidersForDecorated = createProvidersForDecorated;
exports.getLoggerToken = getLoggerToken;
const common_1 = require("@nestjs/common");
const PinoLogger_1 = require("./PinoLogger");
const decoratedTokenPrefix = 'PinoLogger:';
const decoratedLoggers = new Set();
function InjectPinoLogger(context = '') {
    decoratedLoggers.add(context);
    return (0, common_1.Inject)(getLoggerToken(context));
}
function createDecoratedLoggerProvider(context) {
    return {
        provide: getLoggerToken(context),
        useFactory: (logger) => {
            logger.setContext(context);
            return logger;
        },
        inject: [PinoLogger_1.PinoLogger],
    };
}
function createProvidersForDecorated() {
    return [...decoratedLoggers.values()].map(createDecoratedLoggerProvider);
}
function getLoggerToken(context) {
    return `${decoratedTokenPrefix}${context}`;
}
//# sourceMappingURL=InjectPinoLogger.js.map