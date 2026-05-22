"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Publishable = Publishable;
const aggregate_root_storage_1 = require("../storages/aggregate-root.storage");
/**
 * Merges event publisher with the decorated class.
 * Implements the `publish` and `publishAll` methods in a similar way to {@link EventPublisher#mergeClassContext}.
 *
 * @publicApi
 */
function Publishable() {
    return (target) => {
        aggregate_root_storage_1.AggregateRootStorage.add(target);
    };
}
