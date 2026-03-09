import type { SnakeDirection, SnakeGameMode } from './components';

export interface ReplayEvent {
  time: number;
  direction: SnakeDirection;
}

export interface SuperSnakeReplayData {
  version: 1;
  seed: number;
  mode: SnakeGameMode;
  levelId: string;
  durationMs: number;
  events: ReplayEvent[];
}

export interface ParsedReplayResult {
  valid: boolean;
  replay: SuperSnakeReplayData | null;
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function parseReplayData(value: unknown): ParsedReplayResult {
  if (!value || typeof value !== 'object') {
    return { valid: false, replay: null };
  }
  const candidate = value as Partial<SuperSnakeReplayData>;
  if (
    candidate.version !== 1 ||
    typeof candidate.seed !== 'number' ||
    typeof candidate.levelId !== 'string' ||
    typeof candidate.durationMs !== 'number' ||
    !Array.isArray(candidate.events) ||
    !(
      candidate.mode === 'classic' ||
      candidate.mode === 'timed' ||
      candidate.mode === 'endless' ||
      candidate.mode === 'challenge'
    )
  ) {
    return { valid: false, replay: null };
  }

  const events = candidate.events.filter((entry): entry is ReplayEvent =>
    Boolean(
      entry &&
        typeof entry.time === 'number' &&
        (entry.direction === 'up' ||
          entry.direction === 'down' ||
          entry.direction === 'left' ||
          entry.direction === 'right')
    )
  );

  return {
    valid: events.length === candidate.events.length,
    replay: {
      version: 1,
      seed: candidate.seed,
      mode: candidate.mode,
      levelId: candidate.levelId,
      durationMs: candidate.durationMs,
      events: events.map((event) => ({ ...event })),
    },
  };
}
