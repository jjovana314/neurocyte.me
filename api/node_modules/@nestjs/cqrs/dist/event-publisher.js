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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventPublisher = void 0;
const common_1 = require("@nestjs/common");
const event_bus_1 = require("./event-bus");
/**
 * @publicApi
 */
let EventPublisher = class EventPublisher {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }
    /**
     * Merge the event publisher into the provided class.
     * This is required to make `publish` and `publishAll` available on the `AggregateRoot` class.
     * @param metatype The class to merge into.
     * @param asyncContext The async context (if scoped).
     */
    mergeClassContext(metatype, asyncContext) {
        const eventBus = this.eventBus;
        return class extends metatype {
            publish(event) {
                eventBus.publish(event, this, asyncContext);
            }
            publishAll(events) {
                eventBus.publishAll(events, this, asyncContext);
            }
        };
    }
    /**
     * Merge the event publisher into the provided object.
     * This is required to make `publish` and `publishAll` available on the `AggregateRoot` class instance.
     * @param object The object to merge into.
     * @param asyncContext The async context (if scoped).
     */
    mergeObjectContext(object, asyncContext) {
        const eventBus = this.eventBus;
        object.publish = (event) => {
            eventBus.publish(event, object, asyncContext);
        };
        object.publishAll = (events) => {
            eventBus.publishAll(events, object, asyncContext);
        };
        return object;
    }
};
exports.EventPublisher = EventPublisher;
exports.EventPublisher = EventPublisher = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_bus_1.EventBus])
], EventPublisher);
