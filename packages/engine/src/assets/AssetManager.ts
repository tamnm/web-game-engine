import { EventEmitter } from '../utils/EventEmitter';
import {
  AssetCacheEntry,
  AssetDescriptor,
  AssetLoader,
  AssetLoaderRegistration,
  AssetManagerEvents,
  AssetRequestContext,
  LoadOptions,
} from './types';

function defaultJsonLoader(source: string, ctx: AssetRequestContext): Promise<unknown> {
  if (typeof fetch !== 'function') {
    return Promise.reject(new Error('Global fetch API unavailable for JSON asset load'));
  }
  return fetch(source, { signal: ctx.signal }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load asset: ${source} (${response.status})`);
    }
    return response.json();
  });
}

function defaultTextLoader(source: string, ctx: AssetRequestContext): Promise<string> {
  if (typeof fetch !== 'function') {
    return Promise.reject(new Error('Global fetch API unavailable for text asset load'));
  }
  return fetch(source, { signal: ctx.signal }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load asset: ${source} (${response.status})`);
    }
    return response.text();
  });
}

export class AssetManager {
  private readonly cache = new Map<string, AssetCacheEntry>();
  private readonly loaders: AssetLoaderRegistration[] = [];
  private readonly eventsEmitter = new EventEmitter<AssetManagerEvents>();

  constructor() {
    this.registerLoader({
      id: 'json',
      match: (descriptor) => descriptor.source.endsWith('.json'),
      loader: defaultJsonLoader,
    });
    this.registerLoader({
      id: 'text',
      match: (descriptor) => descriptor.source.endsWith('.txt'),
      loader: defaultTextLoader,
    });
  }

  get events() {
    return this.eventsEmitter;
  }

  registerLoader(registration: AssetLoaderRegistration): void {
    this.loaders.push(registration);
  }

  async load<T>(descriptor: AssetDescriptor<T>, options?: LoadOptions): Promise<T>;
  async load<T>(descriptor: AssetDescriptor<T>[], options?: LoadOptions): Promise<T[]>;
  async load<T>(descriptor: AssetDescriptor<T> | AssetDescriptor<T>[]): Promise<T | T[]> {
    if (Array.isArray(descriptor)) {
      const total = descriptor.length;
      let loaded = 0;
      const results: T[] = [];
      for (const item of descriptor) {
        results.push(await this.loadSingle(item));
        loaded += 1;
        this.eventsEmitter.emit('progress', { loaded, total, key: item.key });
      }
      return results;
    }
    const result = await this.loadSingle(descriptor);
    this.eventsEmitter.emit('progress', { loaded: 1, total: 1, key: descriptor.key });
    return result;
  }

  get<T = unknown>(key: string): T | undefined {
    return this.cache.get(key)?.value as T | undefined;
  }

  release(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;
    entry.refCount -= 1;
    if (entry.refCount <= 0) {
      this.cache.delete(key);
    }
  }

  warm(descriptors: AssetDescriptor[]): void {
    descriptors.forEach((descriptor) => {
      const entry = this.cache.get(descriptor.key);
      if (entry) {
        entry.refCount += 1;
      }
    });
  }

  private async loadSingle<T>(descriptor: AssetDescriptor<T>): Promise<T> {
    const cached = this.cache.get(descriptor.key);
    if (cached) {
      cached.refCount += 1;
      return cached.value as T;
    }

    const loader = this.resolveLoader<T>(descriptor);
    try {
      const ctx: AssetRequestContext = {};
      const value = descriptor.data ?? (await loader(descriptor.source, ctx));
      this.cache.set(descriptor.key, { key: descriptor.key, value, refCount: 1 });
      this.eventsEmitter.emit('load', { key: descriptor.key });
      return value;
    } catch (error) {
      this.eventsEmitter.emit('error', { key: descriptor.key, error });
      throw error;
    }
  }

  private resolveLoader<T>(descriptor: AssetDescriptor<T>): AssetLoader<T> {
    if (descriptor.loader) {
      const match = this.loaders.find((entry) => entry.id === descriptor.loader);
      if (!match) {
        throw new Error(`Unknown asset loader: ${descriptor.loader}`);
      }
      return match.loader as AssetLoader<T>;
    }
    const match = this.loaders.find((registration) => registration.match(descriptor));
    if (!match) {
      throw new Error(`No loader registered for asset: ${descriptor.source}`);
    }
    return match.loader as AssetLoader<T>;
  }
}
