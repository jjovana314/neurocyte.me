"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultReflectEventId = exports.defaultGetEventId = void 0;
const constants_1 = require("../decorators/constants");
/**
 * Null if the published class is not connected to any handler
 * @param event
 * @returns
 */
const defaultGetEventId = (event) => {
    const { constructor } = Object.getPrototypeOf(event);
    return Reflect.getMetadata(constants_1.EVENT_METADATA, constructor)?.id ?? null;
};
exports.defaultGetEventId = defaultGetEventId;
const defaultReflectEventId = (event) => {
    return Reflect.getMetadata(constants_1.EVENT_METADATA, event).id;
};
exports.defaultReflectEventId = defaultReflectEventId;
