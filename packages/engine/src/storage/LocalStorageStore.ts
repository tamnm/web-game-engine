import type { SaveStore } from './types';

export class LocalStorageStore implements SaveStore {
  constructor(private readonly storage: Storage = localStorage) {}

  get(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch {
      // ignore quota/security errors
    }
  }

  remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch {
      // ignore
    }
  }

  keys(prefix = ''): string[] {
    try {
      const out: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const k = this.storage.key(i);
        if (k && (!prefix || k.startsWith(prefix))) out.push(k);
      }
      return out;
    } catch {
      return [];
    }
  }
}
