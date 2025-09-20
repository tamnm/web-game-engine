export interface ReplaySnippet {
  description: string;
  data: unknown;
}

export interface LeaderboardEntry {
  id: string;
  initials: string;
  score: number;
  combo: number;
  mode: string;
  occurredAt: number;
  replay?: ReplaySnippet;
}

export interface LeaderboardConfig {
  maxEntries?: number;
  storageKey?: string;
  storage?: Storage;
}

export class LeaderboardStorage {
  private readonly maxEntries: number;
  private readonly key: string;
  private readonly storage: Storage | null;

  constructor(config: LeaderboardConfig = {}) {
    this.maxEntries = config.maxEntries ?? 10;
    this.key = config.storageKey ?? 'super-snake-leaderboard';
    this.storage = config.storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  }

  load(): LeaderboardEntry[] {
    if (!this.storage) return [];
    const raw = this.storage.getItem(this.key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as LeaderboardEntry[];
    } catch {
      return [];
    }
  }

  save(entries: LeaderboardEntry[]): void {
    if (!this.storage) return;
    const payload = JSON.stringify(entries.slice(0, this.maxEntries));
    this.storage.setItem(this.key, payload);
  }

  add(entry: LeaderboardEntry): LeaderboardEntry[] {
    const existing = this.load();
    const next = [...existing, entry]
      .sort((a, b) => b.score - a.score || b.combo - a.combo || b.occurredAt - a.occurredAt)
      .slice(0, this.maxEntries);
    this.save(next);
    return next;
  }

  remove(id: string): LeaderboardEntry[] {
    const existing = this.load();
    const next = existing.filter((entry) => entry.id !== id);
    this.save(next);
    return next;
  }
}
