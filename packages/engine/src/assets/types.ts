import { EventEmitter } from '../utils/EventEmitter';

export interface AssetRequestContext {
  signal?: AbortSignal;
}

export type AssetLoader<T, Source = string> = (
  source: Source,
  ctx: AssetRequestContext
) => Promise<T>;

export interface AssetManagerEvents {
  progress: { loaded: number; total: number; key: string };
  load: { key: string };
  error: { key: string; error: unknown };
  [key: string]: unknown;
}

export interface AssetDescriptor<T = unknown> {
  key: string;
  source: string;
  loader?: string;
  data?: T;
}

export interface AssetCacheEntry<T = unknown> {
  key: string;
  refCount: number;
  value: T;
}

export interface AssetLoaderRegistration<T = unknown> {
  id: string;
  match: (descriptor: AssetDescriptor) => boolean;
  loader: AssetLoader<T>;
}

export interface LoadOptions {
  warm?: boolean;
  signal?: AbortSignal;
}

export interface AssetManager {
  load<T = unknown>(
    descriptor: AssetDescriptor<T> | AssetDescriptor<T>[],
    options?: LoadOptions
  ): Promise<T | T[]>;
  get<T = unknown>(key: string): T | undefined;
  release(key: string): void;
}

export type { EventEmitter };
