export interface AudioHandle {
  stop(): void;
  setVolume(volume: number): void;
}

export interface SoundOptions {
  volume?: number;
  loop?: boolean;
}

export interface AudioBusOptions {
  volume?: number;
}

export interface AudioClip {
  readonly key: string;
  readonly buffer: AudioBuffer | null;
}

export interface AudioEngineLike {
  createBus(name: string, options?: AudioBusOptions): AudioBus;
  playSound(key: string, options?: SoundOptions & { bus?: string }): Promise<AudioHandle>;
  cacheClip(key: string, buffer: AudioBuffer | null): void;
}

export interface AudioBus {
  readonly name: string;
  setVolume(volume: number): void;
}
