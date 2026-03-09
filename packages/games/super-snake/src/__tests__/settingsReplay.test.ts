import { describe, expect, it } from 'vitest';
import { createSeededRandom, parseReplayData, SuperSnakeSettingsStore } from '../game';

function createMemoryStorage(): Storage {
  const backing: Record<string, string> = {};
  return {
    length: 0,
    clear: () => {
      Object.keys(backing).forEach((key) => delete backing[key]);
    },
    getItem: (key: string) => backing[key] ?? null,
    key: () => null,
    removeItem: (key: string) => {
      delete backing[key];
    },
    setItem: (key: string, value: string) => {
      backing[key] = value;
    },
  } as Storage;
}

describe('SuperSnakeSettingsStore', () => {
  it('persists and restores settings', () => {
    const storage = createMemoryStorage();
    const store = new SuperSnakeSettingsStore({ storage });
    const saved = store.update((current) => ({
      ...current,
      audio: { ...current.audio, enabled: false, musicVolume: 0.2 },
      display: { ...current.display, reducedMotion: true },
    }));

    const restored = store.load();
    expect(restored.audio.enabled).toBe(false);
    expect(restored.audio.musicVolume).toBe(0.2);
    expect(restored.display.reducedMotion).toBe(true);
    expect(saved.enabledModes).toEqual(restored.enabledModes);
  });
});

describe('Super Snake replay helpers', () => {
  it('parses replay payloads and reproduces seeded randomness', () => {
    const replay = parseReplayData({
      version: 1,
      seed: 12345,
      mode: 'classic',
      levelId: 'aurora-garden',
      durationMs: 1000,
      events: [{ time: 10, direction: 'up' }],
    });
    expect(replay.valid).toBe(true);
    expect(replay.replay?.events).toHaveLength(1);

    const randomA = createSeededRandom(12345);
    const randomB = createSeededRandom(12345);
    expect(randomA()).toBe(randomB());
    expect(randomA()).toBe(randomB());
  });
});
