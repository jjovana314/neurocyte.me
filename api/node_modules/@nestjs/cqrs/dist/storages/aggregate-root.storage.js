"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRootStorage = void 0;
class AggregateRootStorage {
    static add(type) {
        this.storage.push(type);
    }
    static mergeContext(eventBus) {
        for (const item of this.storage) {
            item.prototype.publish = function (event) {
                eventBus.publish(event);
            };
            item.prototype.publishAll = function (events) {
                eventBus.publishAll(events);
            };
        }
        this.storage = [];
    }
}
exports.AggregateRootStorage = AggregateRootStorage;
AggregateRootStorage.storage = [];
