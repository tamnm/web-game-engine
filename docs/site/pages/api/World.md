# World

Kind: symbol

## Members

- nextEntity
- entities
- stores
- systems
- elapsed
- createEntity — (): number
- destroyEntity — (entity: number): void
- hasEntity — (entity: number): boolean
- ensureStore — (definition: ComponentDefinition<unknown>): ComponentStoreEntry
- addComponent — <T>(entity: number, definition: ComponentDefinition<T>, data: T): void
- upsertComponent — <T>(entity: number, definition: ComponentDefinition<T>, data: T): void
- getComponent — <T>(entity: number, definition: ComponentDefinition<T>): T
- ensureComponent — <T>(entity: number, definition: ComponentDefinition<T>): T
- removeComponent — (entity: number, definition: ComponentDefinition<unknown>): void
- query — <T extends Record<string, unknown> = Record<string, unknown>>(spec: ComponentQuery): QueryResult<T>
- registerSystem — (system: System): void
- unregisterSystem — (systemId: string): void
- step — (delta: number): void
- serialize — (): SerializedWorld
- snapshot — (entity: number): WorldSnapshot
- clear — (): void
