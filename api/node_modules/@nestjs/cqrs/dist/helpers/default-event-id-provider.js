"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultEventIdProvider = void 0;
const constants_1 = require("../decorators/constants");
class DefaultEventIdProvider {
    getEventId(event) {
        return Reflect.getMetadata(constants_1.EVENT_METADATA, event)?.id ?? null;
    }
}
exports.defaultEventIdProvider = new DefaultEventIdProvider();
