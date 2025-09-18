import {
  AudioBus,
  AudioBusOptions,
  AudioClip,
  AudioEngineLike,
  AudioHandle,
  SoundOptions,
} from './types';

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const globalWindow = window as Window &
    typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };
  const Ctor: typeof AudioContext | undefined =
    globalWindow.AudioContext || globalWindow.webkitAudioContext;
  if (!Ctor) return null;
  return new Ctor();
};

class NoopHandle implements AudioHandle {
  stop(): void {}
  setVolume(): void {}
}

class NoopBus implements AudioBus {
  constructor(public readonly name: string) {}
  setVolume(): void {}
}

interface InternalBus {
  name: string;
  gainNode?: GainNode;
  volume: number;
}

export class AudioEngine implements AudioEngineLike {
  private readonly context: AudioContext | null;
  private readonly master: InternalBus;
  private readonly busses = new Map<string, InternalBus>();
  private readonly clips = new Map<string, AudioClip>();

  constructor(context?: AudioContext) {
    this.context = context ?? getAudioContext();
    if (this.context) {
      const masterGain = this.context.createGain();
      masterGain.gain.value = 1;
      masterGain.connect(this.context.destination);
      this.master = { name: 'master', gainNode: masterGain, volume: 1 };
    } else {
      this.master = { name: 'master', volume: 1 };
    }
    this.busses.set('master', this.master);
  }

  get audioContext(): AudioContext | null {
    return this.context;
  }

  createBus(name: string, options: AudioBusOptions = {}): AudioBus {
    if (this.busses.has(name)) {
      throw new Error(`Audio bus already exists: ${name}`);
    }
    if (!this.context) {
      const bus = new NoopBus(name);
      this.busses.set(name, { name, volume: options.volume ?? 1 });
      return bus;
    }
    const gain = this.context.createGain();
    gain.gain.value = options.volume ?? 1;
    gain.connect(this.master.gainNode!);
    const bus: InternalBus = { name, gainNode: gain, volume: gain.gain.value };
    this.busses.set(name, bus);
    return {
      name,
      setVolume: (volume: number) => {
        bus.volume = volume;
        bus.gainNode!.gain.value = volume;
      },
    };
  }

  setMasterVolume(volume: number): void {
    this.master.volume = volume;
    this.master.gainNode?.gain.setValueAtTime(volume, this.context?.currentTime ?? 0);
  }

  cacheClip(key: string, buffer: AudioBuffer | null): void {
    this.clips.set(key, { key, buffer });
  }

  getClip(key: string): AudioClip | undefined {
    return this.clips.get(key);
  }

  async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer | null> {
    if (!this.context) return null;
    return this.context.decodeAudioData(arrayBuffer);
  }

  async playSound(
    key: string,
    options: SoundOptions & { bus?: string } = {}
  ): Promise<AudioHandle> {
    const clip = this.clips.get(key);
    const volume = options.volume ?? 1;
    const busName = options.bus ?? 'master';
    const bus = this.busses.get(busName);
    if (!this.context || !clip?.buffer || !bus?.gainNode) {
      return new NoopHandle();
    }

    const source = this.context.createBufferSource();
    source.buffer = clip.buffer;
    source.loop = options.loop ?? false;
    const gain = this.context.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(bus.gainNode);
    source.start();

    return {
      stop: () => source.stop(),
      setVolume: (value: number) => {
        gain.gain.value = value;
      },
    };
  }
}
