import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { IEvent } from '../interfaces';
import { ProvidersIntrospectionResult } from '../interfaces/providers-introspection-result.interface';
export declare class ExplorerService<EventBase extends IEvent = IEvent> {
    private readonly modulesContainer;
    constructor(modulesContainer: ModulesContainer);
    explore(): ProvidersIntrospectionResult;
    flatMap<T extends object>(modules: Module[], callback: (instance: InstanceWrapper) => InstanceWrapper<any> | undefined): InstanceWrapper<T>[];
    filterByMetadataKey(wrapper: InstanceWrapper, metadataKey: string): InstanceWrapper<any> | undefined;
}
