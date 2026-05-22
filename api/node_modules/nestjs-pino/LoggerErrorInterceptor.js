"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerErrorInterceptor = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let LoggerErrorInterceptor = class LoggerErrorInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, rxjs_1.catchError)((error) => {
            return (0, rxjs_1.throwError)(() => {
                const response = context.switchToHttp().getResponse();
                const isFastifyResponse = response.raw !== undefined;
                if (isFastifyResponse) {
                    response.raw.err = error;
                }
                else {
                    response.err = error;
                }
                return error;
            });
        }));
    }
};
exports.LoggerErrorInterceptor = LoggerErrorInterceptor;
exports.LoggerErrorInterceptor = LoggerErrorInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggerErrorInterceptor);
//# sourceMappingURL=LoggerErrorInterceptor.js.map