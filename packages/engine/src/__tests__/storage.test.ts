import { describe, expect, it, beforeEach } from 'vitest';
import { LocalStorageStore, SaveManager } from '../storage';

function clearLocal(prefix: string) {
  const storage = window.localStorage;
  for (let i = storage.length - 1; i >= 0; i--) {
    const k = storage.key(i);
    if (k && k.startsWith(prefix)) storage.removeItem(k);
  }
}

describe('SaveManager with LocalStorage', () => {
  const ns = 'wge-test';
  beforeEach(() => clearLocal(ns));

  it('saves and loads records by slot', () => {
    const store = new LocalStorageStore();
    const saves = new SaveManager<{ score: number }>({ namespace: ns, version: 2, store });
    saves.save({ score: 42 }, 'slot1');
    const rec = saves.load('slot1');
    expect(rec?.version).toBe(2);
    expect(rec?.data.score).toBe(42);
    expect(saves.listSlots()).toContain('slot1');
  });

  it('applies migrations forward to current version', () => {
    const store = new LocalStorageStore();
    // pre-seed a v1 record
    window.localStorage.setItem(
      `${ns}:default`,
      JSON.stringify({ version: 1, data: { score: '7' } })
    );
    const saves = new SaveManager<{ score: number }>({
      namespace: ns,
      version: 3,
      store,
      migrations: [
        {
          from: 1,
          to: 2,
          migrate: (d: unknown) => ({ score: parseInt((d as { score: string }).score, 10) }),
        },
        {
          from: 2,
          to: 3,
          migrate: (d: unknown) => ({ score: (d as { score: number }).score + 1 }),
        },
      ],
    });
    const rec = saves.load();
    expect(rec?.version).toBe(3);
    expect(rec?.data.score).toBe(8);
    // should overwrite stored record with upgraded version
    const raw = window.localStorage.getItem(`${ns}:default`)!;
    const parsed = JSON.parse(raw) as { version: number; data: { score: number } };
    expect(parsed.version).toBe(3);
    expect(parsed.data.score).toBe(8);
  });

  it('returns null when migration path is missing', () => {
    const store = new LocalStorageStore();
    window.localStorage.setItem(`${ns}:default`, JSON.stringify({ version: 1, data: { x: 1 } }));
    const saves = new SaveManager({
      namespace: ns,
      version: 5,
      store,
      migrations: [{ from: 2, to: 5, migrate: (d: unknown) => d }],
    });
    expect(saves.load()).toBeNull();
  });
});
