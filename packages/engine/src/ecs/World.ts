import {
  ComponentDefinition,
  ComponentStoreEntry,
  ComponentQuery,
  Entity,
  QueryResult,
  SerializedWorld,
  System,
  SystemContext,
  SystemStage,
  World as IWorld,
  WorldSnapshot,
} from './types';
import { createQueryResult } from './Query';

const STAGE_ORDER: SystemStage[] = [
  'init',
  'preUpdate',
  'update',
  'postUpdate',
  'render',
  'cleanup',
];

interface SystemRegistration {
  system: System;
  stageIndex: number;
  order: number;
}

export class World implements IWorld {
  private nextEntity: Entity = 1;
  private readonly entities: Set<Entity> = new Set();
  private readonly stores: Map<string, ComponentStoreEntry> = new Map();
  private readonly systems: SystemRegistration[] = [];
  private totalTime = 0;

  createEntity(): Entity {
    const entity = this.nextEntity++;
    this.entities.add(entity);
    return entity;
  }

  destroyEntity(entity: Entity): void {
    if (!this.entities.delete(entity)) return;
    for (const entry of this.stores.values()) {
      entry.data.delete(entity);
    }
  }

  hasEntity(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  private ensureStore(definition: ComponentDefinition<unknown>): ComponentStoreEntry {
    const existing = this.stores.get(definition.name);
    if (existing) return existing;
    const entry: ComponentStoreEntry = {
      definition,
      data: new Map(),
    };
    this.stores.set(definition.name, entry);
    return entry;
  }

  addComponent<T>(entity: Entity, definition: ComponentDefinition<T>, data: T): void {
    if (!this.entities.has(entity)) {
      throw new Error(`Entity ${entity} does not exist`);
    }
    const entry = this.ensureStore(definition);
    entry.data.set(entity, data);
  }

  upsertComponent<T>(entity: Entity, definition: ComponentDefinition<T>, data: T): void {
    const entry = this.ensureStore(definition);
    if (!this.entities.has(entity)) {
      this.entities.add(entity);
    }
    entry.data.set(entity, data);
  }

  getComponent<T>(entity: Entity, definition: ComponentDefinition<T>): T | undefined {
    const entry = this.stores.get(definition.name);
    if (!entry) return undefined;
    return entry.data.get(entity) as T | undefined;
  }

  ensureComponent<T>(entity: Entity, definition: ComponentDefinition<T>): T {
    const existing = this.getComponent(entity, definition);
    if (existing !== undefined) return existing;
    if (!definition.defaults) {
      throw new Error(`Component ${definition.name} not found for entity ${entity}`);
    }
    const data = definition.defaults();
    this.addComponent(entity, definition, data);
    return data;
  }

  removeComponent(entity: Entity, definition: ComponentDefinition<unknown>): void {
    const entry = this.stores.get(definition.name);
    entry?.data.delete(entity);
  }

  query<T extends Record<string, unknown> = Record<string, unknown>>(
    spec: ComponentQuery
  ): QueryResult<T> {
    return createQueryResult<T>(this, Array.from(this.entities), spec);
  }

  registerSystem(system: System): void {
    const stageIndex = STAGE_ORDER.indexOf(system.stage);
    if (stageIndex === -1) {
      throw new Error(`Unknown system stage: ${system.stage}`);
    }
    const order = system.order ?? 0;
    this.systems.push({ system, stageIndex, order });
    this.systems.sort((a, b) => a.stageIndex - b.stageIndex || a.order - b.order);
  }

  unregisterSystem(systemId: string): void {
    const index = this.systems.findIndex((entry) => entry.system.id === systemId);
    if (index >= 0) {
      this.systems.splice(index, 1);
    }
  }

  step(delta: number): void {
    this.totalTime += delta;
    const context: SystemContext = {
      world: this,
      delta,
      elapsed: this.totalTime,
      totalTime: this.totalTime,
    };
    const updateStages: SystemStage[] = ['init', 'preUpdate', 'update', 'postUpdate', 'cleanup'];
    for (const { system } of this.systems) {
      if (updateStages.includes(system.stage)) {
        system.execute(context);
      }
    }
  }

  render(alpha: number): void {
    const context: SystemContext = {
      world: this,
      delta: 0,
      elapsed: this.totalTime,
      totalTime: this.totalTime,
      alpha,
    };
    for (const { system } of this.systems) {
      if (system.stage === 'render') {
        system.execute(context);
      }
    }
  }

  serialize(): SerializedWorld {
    const entities = Array.from(this.entities.values());
    const components = Array.from(this.stores.values()).map((entry) => ({
      name: entry.definition.name,
      entities: Array.from(entry.data.keys()),
      data: Array.from(entry.data.values()),
    }));
    return { entities, components };
  }

  snapshot(entity: Entity): WorldSnapshot {
    if (!this.entities.has(entity)) {
      throw new Error(`Entity ${entity} does not exist`);
    }
    const components: Record<string, unknown> = {};
    for (const entry of this.stores.values()) {
      if (entry.data.has(entity)) {
        components[entry.definition.name] = entry.data.get(entity);
      }
    }
    return { entity, components };
  }

  clear(): void {
    this.entities.clear();
    this.stores.clear();
    this.systems.length = 0;
    this.totalTime = 0;
  }
}
