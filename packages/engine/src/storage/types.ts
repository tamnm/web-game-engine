export interface SaveRecord<T = unknown> {
  version: number;
  data: T;
}

export interface Migration<TIn = unknown, TOut = unknown> {
  from: number;
  to: number;
  migrate: (data: TIn) => TOut;
}

export interface SaveStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  keys(prefix?: string): string[];
}

export type MigrationUnknown = Migration<unknown, unknown>;

export interface SaveManagerOptions<T = unknown> {
  namespace: string;
  version: number;
  store?: SaveStore;
  migrations?: MigrationUnknown[];
  serializer?: (record: SaveRecord<T>) => string;
  deserializer?: (raw: string) => SaveRecord<T> | null;
}
