# SaveManager

Kind: symbol

## Members

- ns
- version
- store
- migrations
- serialize — (record: SaveRecord<T>): string
- deserialize — (raw: string): SaveRecord<T>
- (anonymous)
- key — (slot?: string): string
- listSlots — (): string[]
- load — (slot?: string): SaveRecord<T>
- save — (data: T, slot?: string): void
- erase — (slot?: string): void
- applyMigrations — (record: SaveRecord<T>): SaveRecord<T>
