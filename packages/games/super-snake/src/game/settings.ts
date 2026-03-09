import type { ActionBinding } from '@web-game-engine/core';
import type { ControlAction } from './input/SuperSnakeInput';
import type { SnakeGameMode } from './components';

export interface AudioSettings {
  enabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

export interface DisplaySettings {
  reducedMotion: boolean;
  pixelPerfect: boolean;
}

export interface SuperSnakeSettings {
  enabledModes: SnakeGameMode[];
  audio: AudioSettings;
  display: DisplaySettings;
  bindings: Partial<Record<ControlAction, ActionBinding[]>>;
}

export interface SuperSnakeSettingsStoreOptions {
  storage?: Storage;
  storageKey?: string;
}

const DEFAULT_SETTINGS: SuperSnakeSettings = {
  enabledModes: ['classic', 'timed', 'endless', 'challenge'],
  audio: {
    enabled: true,
    musicVolume: 0.45,
    sfxVolume: 0.7,
  },
  display: {
    reducedMotion: false,
    pixelPerfect: false,
  },
  bindings: {},
};

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function sanitizeBindings(value: unknown): Partial<Record<ControlAction, ActionBinding[]>> {
  if (!value || typeof value !== 'object') {
    return {};
  }
  const result: Partial<Record<ControlAction, ActionBinding[]>> = {};
  for (const [action, bindings] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(bindings)) continue;
    result[action as ControlAction] = bindings
      .filter((binding): binding is ActionBinding =>
        Boolean(
          binding &&
            typeof binding === 'object' &&
            typeof (binding as ActionBinding).action === 'string' &&
            typeof (binding as ActionBinding).device === 'string' &&
            typeof (binding as ActionBinding).code === 'string'
        )
      )
      .map((binding) => ({ ...binding }));
  }
  return result;
}

function sanitizeSettings(value: unknown): SuperSnakeSettings {
  if (!value || typeof value !== 'object') {
    return structuredClone(DEFAULT_SETTINGS);
  }
  const candidate = value as Partial<SuperSnakeSettings>;
  return {
    enabledModes: Array.isArray(candidate.enabledModes)
      ? candidate.enabledModes.filter(
          (mode): mode is SnakeGameMode =>
            mode === 'classic' || mode === 'timed' || mode === 'endless' || mode === 'challenge'
        )
      : [...DEFAULT_SETTINGS.enabledModes],
    audio: {
      enabled: candidate.audio?.enabled ?? DEFAULT_SETTINGS.audio.enabled,
      musicVolume: clampUnit(candidate.audio?.musicVolume ?? DEFAULT_SETTINGS.audio.musicVolume),
      sfxVolume: clampUnit(candidate.audio?.sfxVolume ?? DEFAULT_SETTINGS.audio.sfxVolume),
    },
    display: {
      reducedMotion: candidate.display?.reducedMotion ?? DEFAULT_SETTINGS.display.reducedMotion,
      pixelPerfect: candidate.display?.pixelPerfect ?? DEFAULT_SETTINGS.display.pixelPerfect,
    },
    bindings: sanitizeBindings(candidate.bindings),
  };
}

export class SuperSnakeSettingsStore {
  private readonly storage: Storage | null;
  private readonly key: string;

  constructor(options: SuperSnakeSettingsStoreOptions = {}) {
    this.storage = options.storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    this.key = options.storageKey ?? 'super-snake-settings';
  }

  load(): SuperSnakeSettings {
    if (!this.storage) {
      return structuredClone(DEFAULT_SETTINGS);
    }
    const raw = this.storage.getItem(this.key);
    if (!raw) {
      return structuredClone(DEFAULT_SETTINGS);
    }
    try {
      return sanitizeSettings(JSON.parse(raw));
    } catch {
      return structuredClone(DEFAULT_SETTINGS);
    }
  }

  save(settings: SuperSnakeSettings): void {
    if (!this.storage) return;
    this.storage.setItem(this.key, JSON.stringify(settings));
  }

  update(updater: (current: SuperSnakeSettings) => SuperSnakeSettings): SuperSnakeSettings {
    const next = updater(this.load());
    this.save(next);
    return next;
  }
}

export function getDefaultSuperSnakeSettings(): SuperSnakeSettings {
  return structuredClone(DEFAULT_SETTINGS);
}
