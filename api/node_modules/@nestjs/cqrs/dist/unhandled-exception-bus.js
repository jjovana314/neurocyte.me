"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnhandledExceptionBus = void 0;
const common_1 = require("@nestjs/common");
require("reflect-metadata");
const rxjs_1 = require("rxjs");
const constants_1 = require("./constants");
const default_unhandled_exception_pubsub_1 = require("./helpers/default-unhandled-exception-pubsub");
const observable_bus_1 = require("./utils/observable-bus");
/**
 * A bus that publishes unhandled exceptions.
 * @template Cause The type of the cause of the exception.
 */
let UnhandledExceptionBus = class UnhandledExceptionBus extends observable_bus_1.ObservableBus {
    constructor(options) {
        super();
        this.options = options;
        if (this.options?.unhandledExceptionPublisher) {
            this._publisher = this.options
                .unhandledExceptionPublisher;
        }
        else {
            this.useDefaultPublisher();
        }
    }
    /**
     * Filter values depending on their instance type (comparison is made
     * using native `instanceof`).
     *
     * @param types List of types to filter by.
     * @return A stream only emitting the filtered exceptions.
     */
    static ofType(...types) {
        const isInstanceOf = (exceptionInfo) => !!types.find((classType) => exceptionInfo.exception instanceof classType);
        return (source) => source.pipe((0, rxjs_1.filter)(isInstanceOf));
    }
    /**
     * Gets the publisher of the bus.
     */
    get publisher() {
        return this._publisher;
    }
    /**
     * Sets the publisher of the bus.
     */
    set publisher(_publisher) {
        this._publisher = _publisher;
    }
    /**
     * Publishes an unhandled exception.
     * @param info The exception information.
     */
    publish(info) {
        return this._publisher.publish(info);
    }
    useDefaultPublisher() {
        this._publisher = new default_unhandled_exception_pubsub_1.DefaultUnhandledExceptionPubSub(this.subject$);
    }
};
exports.UnhandledExceptionBus = UnhandledExceptionBus;
exports.UnhandledExceptionBus = UnhandledExceptionBus = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(constants_1.CQRS_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [Object])
], UnhandledExceptionBus);
