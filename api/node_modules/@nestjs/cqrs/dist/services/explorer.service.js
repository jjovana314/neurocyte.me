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
exports.ExplorerService = void 0;
const common_1 = require("@nestjs/common");
const modules_container_1 = require("@nestjs/core/injector/modules-container");
const constants_1 = require("../decorators/constants");
let ExplorerService = class ExplorerService {
    constructor(modulesContainer) {
        this.modulesContainer = modulesContainer;
    }
    explore() {
        const modules = [...this.modulesContainer.values()];
        const commands = this.flatMap(modules, (instance) => this.filterByMetadataKey(instance, constants_1.COMMAND_HANDLER_METADATA));
        const queries = this.flatMap(modules, (instance) => this.filterByMetadataKey(instance, constants_1.QUERY_HANDLER_METADATA));
        const events = this.flatMap(modules, (instance) => this.filterByMetadataKey(instance, constants_1.EVENTS_HANDLER_METADATA));
        const sagas = this.flatMap(modules, (instance) => this.filterByMetadataKey(instance, constants_1.SAGA_METADATA));
        return { commands, queries, events, sagas };
    }
    flatMap(modules, callback) {
        const items = modules
            .map((moduleRef) => [...moduleRef.providers.values()].map(callback))
            .reduce((a, b) => a.concat(b), []);
        return items.filter((item) => !!item);
    }
    filterByMetadataKey(wrapper, metadataKey) {
        const { instance } = wrapper;
        if (!instance) {
            return;
        }
        if (!instance.constructor) {
            return;
        }
        const metadata = Reflect.getMetadata(metadataKey, instance.constructor);
        if (!metadata) {
            return;
        }
        return wrapper;
    }
};
exports.ExplorerService = ExplorerService;
exports.ExplorerService = ExplorerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [modules_container_1.ModulesContainer])
], ExplorerService);
