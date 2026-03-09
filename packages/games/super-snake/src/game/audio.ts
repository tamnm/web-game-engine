import { AudioEngine } from '@web-game-engine/core';

export interface SuperSnakeAudioSettings {
  enabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

type SoundName = 'eat' | 'powerup' | 'collision' | 'menu' | 'level-up';
type MusicHandle = { stop(): void; setVolume(volume: number): void };

const MUSIC_LOOP_KEY = 'music-loop';
const MUSIC_LOOP_URL = new URL('../assets/audio/music-loop.mp3', import.meta.url).href;

const SOUND_URLS: Record<SoundName, string> = {
  eat: new URL('../assets/audio/eat-spring.wav', import.meta.url).href,
  powerup: new URL('../assets/audio/powerup-strike.wav', import.meta.url).href,
  collision: new URL('../assets/audio/collision-hurt.wav', import.meta.url).href,
  menu: new URL('../assets/audio/menu-button.wav', import.meta.url).href,
  'level-up': new URL('../assets/audio/level-up-lift.wav', import.meta.url).href,
};

export class SuperSnakeAudio {
  private readonly engine = new AudioEngine();
  private readonly musicBus = this.engine.createBus('music', { volume: 0.45 });
  private readonly sfxBus = this.engine.createBus('sfx', { volume: 0.7 });
  private musicHandle: MusicHandle | null = null;
  private musicNodes: OscillatorNode[] = [];
  private musicGains: GainNode[] = [];
  private sampleLoadStarted = false;
  private started = false;
  private settings: SuperSnakeAudioSettings = {
    enabled: true,
    musicVolume: 0.45,
    sfxVolume: 0.7,
  };

  constructor() {
    this.primeClips();
    void this.loadSampleClips();
  }

  applySettings(settings: SuperSnakeAudioSettings): void {
    this.settings = { ...settings };
    this.musicBus.setVolume(settings.enabled ? settings.musicVolume : 0);
    this.sfxBus.setVolume(settings.enabled ? settings.sfxVolume : 0);
    this.updateReactiveMusic(0, false);
  }

  startMusic(): void {
    if (this.started || !this.settings.enabled) return;
    this.started = true;
    if (this.engine.getClip(MUSIC_LOOP_KEY)?.buffer) {
      void this.startSampleMusic();
      return;
    }
    this.startSynthMusic();
  }

  stopMusic(): void {
    this.stopSampleMusic();
    this.stopSynthMusic();
    this.started = false;
  }

  updateReactiveMusic(combo: number, intense: boolean): void {
    if (!this.started) return;
    if (this.musicHandle) {
      const intensityBoost = intense ? 0.18 : 0;
      const comboBoost = Math.min(0.22, combo * 0.025);
      this.musicHandle.setVolume(Math.min(1, 0.72 + intensityBoost + comboBoost));
      return;
    }
    if (this.musicGains.length < 2) return;
    const context = this.engine.audioContext;
    const now = context?.currentTime ?? 0;
    const baseVolume = this.settings.enabled ? this.settings.musicVolume * 0.14 : 0;
    const accentVolume = this.settings.enabled
      ? Math.min(0.22, this.settings.musicVolume * (combo / 10 + (intense ? 0.2 : 0)))
      : 0;
    this.musicGains[0].gain.setValueAtTime(baseVolume, now);
    this.musicGains[1].gain.setValueAtTime(accentVolume, now);
  }

  play(sound: SoundName): void {
    if (!this.settings.enabled) return;
    void this.engine.playSound(sound, { bus: 'sfx', volume: 1 });
  }

  dispose(): void {
    this.stopMusic();
  }

  private primeClips(): void {
    const context = this.engine.audioContext;
    if (!context) return;
    this.engine.cacheClip('eat', this.createTone(context, 660, 0.08, 'sine'));
    this.engine.cacheClip('powerup', this.createTone(context, 520, 0.16, 'triangle'));
    this.engine.cacheClip('collision', this.createTone(context, 140, 0.24, 'sawtooth'));
    this.engine.cacheClip('menu', this.createTone(context, 440, 0.05, 'sine'));
    this.engine.cacheClip('level-up', this.createChord(context, [392, 523.25, 659.25], 0.3));
  }

  private async loadSampleClips(): Promise<void> {
    if (this.sampleLoadStarted) {
      return;
    }
    this.sampleLoadStarted = true;

    const context = this.engine.audioContext;
    if (!context || typeof fetch !== 'function') {
      return;
    }

    const clipEntries = [...Object.entries(SOUND_URLS), [MUSIC_LOOP_KEY, MUSIC_LOOP_URL] as const];

    await Promise.all(
      clipEntries.map(async ([key, url]) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            return;
          }
          const arrayBuffer = await response.arrayBuffer();
          const buffer = await this.engine.decodeAudioData(arrayBuffer);
          if (buffer) {
            this.engine.cacheClip(key, buffer);
            if (key === MUSIC_LOOP_KEY && this.started && !this.musicHandle) {
              this.stopSynthMusic();
              await this.startSampleMusic();
            }
          }
        } catch {
          // Keep synthesized fallback clips if asset loading fails.
        }
      })
    );
  }

  private startSynthMusic(): void {
    const context = this.engine.audioContext;
    if (!context) return;
    const baseGain = context.createGain();
    const accentGain = context.createGain();
    baseGain.gain.value = this.settings.musicVolume * 0.16;
    accentGain.gain.value = 0;
    baseGain.connect(context.destination);
    accentGain.connect(context.destination);

    const base = context.createOscillator();
    base.type = 'triangle';
    base.frequency.value = 164.81;
    base.connect(baseGain);
    base.start();

    const accent = context.createOscillator();
    accent.type = 'sine';
    accent.frequency.value = 329.63;
    accent.connect(accentGain);
    accent.start();

    this.musicNodes = [base, accent];
    this.musicGains = [baseGain, accentGain];
  }

  private stopSynthMusic(): void {
    for (const node of this.musicNodes) {
      try {
        node.stop();
      } catch {
        // Ignore nodes that have already been stopped.
      }
    }
    this.musicNodes = [];
    this.musicGains = [];
  }

  private async startSampleMusic(): Promise<void> {
    this.stopSampleMusic();
    this.musicHandle = await this.engine.playSound(MUSIC_LOOP_KEY, {
      bus: 'music',
      loop: true,
      volume: 0.8,
    });
    this.updateReactiveMusic(0, false);
  }

  private stopSampleMusic(): void {
    this.musicHandle?.stop();
    this.musicHandle = null;
  }

  private createTone(
    context: AudioContext,
    frequency: number,
    duration: number,
    type: OscillatorType
  ): AudioBuffer {
    const sampleRate = context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = context.createBuffer(1, length, sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const t = i / sampleRate;
      const env = Math.exp((-6 * t) / duration);
      const phase = Math.PI * 2 * frequency * t;
      channel[i] =
        env *
        (type === 'triangle'
          ? (2 / Math.PI) * Math.asin(Math.sin(phase))
          : type === 'sawtooth'
            ? 2 * (t * frequency - Math.floor(0.5 + t * frequency))
            : Math.sin(phase)) *
        0.25;
    }
    return buffer;
  }

  private createChord(context: AudioContext, frequencies: number[], duration: number): AudioBuffer {
    const sampleRate = context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = context.createBuffer(1, length, sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const t = i / sampleRate;
      const env = Math.exp((-4 * t) / duration);
      let sample = 0;
      for (const frequency of frequencies) {
        sample += Math.sin(Math.PI * 2 * frequency * t);
      }
      channel[i] = (sample / frequencies.length) * env * 0.22;
    }
    return buffer;
  }
}
