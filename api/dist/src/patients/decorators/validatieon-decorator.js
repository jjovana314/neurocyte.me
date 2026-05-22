"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
        try {
            return await originalMethod.apply(this, args);
        }
        catch (error) {
            this.logger.error(`Error in ${propertyKey}: ${error.message}`);
            throw error;
        }
    };
    return descriptor;
}
//# sourceMappingURL=validatieon-decorator.js.map