export type Entity = number;

export interface ComponentDefinition<T> {
  readonly name: string;
  readonly defaults?: () => T;
}

export interface ComponentInstance<T> {
  entity: Entity;
  data: T;
}

export type ComponentDataMap = Map<Entity, unknown>;

export interface ComponentQuery {
  /** Components an entity must include */
  all?: ComponentDefinition<unknown>[];
  /** At least one of the components that an entity must include */
  any?: ComponentDefinition<unknown>[];
  /** Components an entity must exclude */
  none?: ComponentDefinition<unknown>[];
}

export type SystemStage = 'init' | 'preUpdate' | 'update' | 'postUpdate' | 'render' | 'cleanup';

export interface SystemContext {
  world: World;
  delta: number;
  elapsed: number;
}

export interface System {
  readonly id: string;
  readonly stage: SystemStage;
  readonly order?: number;
  execute(context: SystemContext): void | Promise<void>;
}

export interface QueryResult<T extends Record<string, unknown>> extends Iterable<T> {
  size: number;
}

export interface ComponentStoreEntry {
  definition: ComponentDefinition<unknown>;
  data: ComponentDataMap;
}

export interface SerializedWorld {
  entities: Entity[];
  components: Array<{
    name: string;
    entities: Entity[];
    data: unknown[];
  }>;
}

export interface WorldSnapshot {
  entity: Entity;
  components: Record<string, unknown>;
}

// Forward declarations to avoid circular deps in type file
export interface World {
  createEntity(): Entity;
  destroyEntity(entity: Entity): void;
  hasEntity(entity: Entity): boolean;
  addComponent<T>(entity: Entity, definition: ComponentDefinition<T>, data: T): void;
  getComponent<T>(entity: Entity, definition: ComponentDefinition<T>): T | undefined;
  removeComponent(entity: Entity, definition: ComponentDefinition<unknown>): void;
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    spec: ComponentQuery
  ): QueryResult<T>;
}
