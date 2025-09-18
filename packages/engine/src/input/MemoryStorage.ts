import { StorageAdapter, ActionBinding } from './types';

export class MemoryStorage implements StorageAdapter {
  private cache: Record<string, ActionBinding[]> = {};

  load(): Record<string, ActionBinding[]> {
    return { ...this.cache };
  }

  save(bindings: Record<string, ActionBinding[]>): void {
    this.cache = { ...bindings };
  }
}

export class BrowserStorage implements StorageAdapter {
  constructor(private readonly key = 'web-game-engine-bindings') {}

  load(): Record<string, ActionBinding[]> {
    if (typeof localStorage === 'undefined') {
      return {};
    }
    try {
      const value = localStorage.getItem(this.key);
      if (!value) return {};
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  save(bindings: Record<string, ActionBinding[]>): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.key, JSON.stringify(bindings));
  }
}
