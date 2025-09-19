import type { Migration, SaveManagerOptions, SaveRecord, SaveStore } from './types';
import { LocalStorageStore } from './LocalStorageStore';

export class SaveManager<T = unknown> {
  private readonly ns: string;
  private readonly version: number;
  private readonly store: SaveStore;
  private readonly migrations: Migration[];
  private readonly serialize: (record: SaveRecord<T>) => string;
  private readonly deserialize: (raw: string) => SaveRecord<T> | null;

  constructor(options: SaveManagerOptions<T>) {
    this.ns = options.namespace;
    this.version = options.version;
    this.store = options.store ?? new LocalStorageStore();
    this.migrations = [...(options.migrations ?? [])].sort((a, b) => a.from - b.from);
    this.serialize = options.serializer ?? ((record) => JSON.stringify(record));
    this.deserialize =
      options.deserializer ??
      ((raw) => {
        try {
          const parsed = JSON.parse(raw) as SaveRecord<T>;
          if (typeof parsed?.version === 'number' && 'data' in parsed) return parsed;
        } catch {
          /* ignore */
        }
        return null;
      });
  }

  private key(slot = 'default'): string {
    return `${this.ns}:${slot}`;
  }

  listSlots(): string[] {
    const prefix = `${this.ns}:`;
    return this.store
      .keys(prefix)
      .map((k) => k.substring(prefix.length))
      .sort();
  }

  load(slot = 'default'): SaveRecord<T> | null {
    const raw = this.store.get(this.key(slot));
    if (!raw) return null;
    const record = this.deserialize(raw);
    if (!record) return null;
    if (record.version === this.version) return record;
    const migrated = this.applyMigrations(record);
    if (migrated && migrated.version === this.version) {
      // persist upgraded record
      this.store.set(this.key(slot), this.serialize(migrated));
    }
    return migrated;
  }

  save(data: T, slot = 'default'): void {
    const record: SaveRecord<T> = { version: this.version, data };
    this.store.set(this.key(slot), this.serialize(record));
  }

  erase(slot = 'default'): void {
    this.store.remove(this.key(slot));
  }

  private applyMigrations(record: SaveRecord<T>): SaveRecord<T> | null {
    let current: SaveRecord<unknown> = record as SaveRecord<unknown>;
    // chain migrations until reaching target version
    const guard = new Set<number>();
    while (current.version !== this.version) {
      if (guard.has(current.version)) return null; // cycle
      guard.add(current.version);
      const step = this.migrations.find((m) => m.from === current.version);
      if (!step) return null; // missing migration path
      current = { version: step.to, data: step.migrate(current.data) } as SaveRecord<unknown>;
    }
    return current as SaveRecord<T>;
  }
}
