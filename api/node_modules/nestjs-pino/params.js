"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARAMS_PROVIDER_TOKEN = void 0;
exports.isPassedLogger = isPassedLogger;
function isPassedLogger(pinoHttpProp) {
    return !!pinoHttpProp && 'logger' in pinoHttpProp;
}
exports.PARAMS_PROVIDER_TOKEN = 'pino-params';
//# sourceMappingURL=params.js.map