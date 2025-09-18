import { Easings, EasingFunction } from './easing';

type TweenStatus = 'idle' | 'running' | 'completed' | 'cancelled';

type Interpolator = (progress: number) => void;

export interface TweenConfig<T> {
  from: T;
  to: T;
  duration: number;
  easing?: EasingFunction;
  onUpdate?: (value: T) => void;
  onComplete?: () => void;
}

export class Tween<T = number> {
  private elapsed = 0;
  private status: TweenStatus = 'idle';
  private readonly easing: EasingFunction;
  private readonly interpolator: Interpolator;

  constructor(private readonly config: TweenConfig<T>) {
    this.easing = config.easing ?? Easings.linear;
    if (typeof config.from === 'number' && typeof config.to === 'number') {
      const from = config.from;
      const delta = (config.to as unknown as number) - from;
      this.interpolator = (progress) => {
        const value = from + delta * progress;
        config.onUpdate?.(value as T);
      };
    } else if (Array.isArray(config.from) && Array.isArray(config.to)) {
      const from = config.from as unknown as number[];
      const to = config.to as unknown as number[];
      if (from.length !== to.length) {
        throw new Error('Tween arrays must match length');
      }
      this.interpolator = (progress) => {
        const value = from.map((start, index) => start + (to[index] - start) * progress);
        config.onUpdate?.(value as unknown as T);
      };
    } else if (typeof config.from === 'object' && typeof config.to === 'object') {
      const from = config.from as Record<string, number>;
      const to = config.to as Record<string, number>;
      const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
      this.interpolator = (progress) => {
        const value: Record<string, number> = {};
        keys.forEach((key) => {
          const a = from[key] ?? 0;
          const b = to[key] ?? a;
          value[key] = a + (b - a) * progress;
        });
        config.onUpdate?.(value as unknown as T);
      };
    } else {
      throw new Error('Unsupported tween value types');
    }
  }

  get isRunning(): boolean {
    return this.status === 'running';
  }

  start(): void {
    this.elapsed = 0;
    this.status = 'running';
    this.interpolator(0);
  }

  update(delta: number): void {
    if (this.status !== 'running') return;
    this.elapsed += delta;
    const progress = Math.min(1, this.elapsed / this.config.duration);
    const eased = this.easing(progress);
    this.interpolator(eased);
    if (progress >= 1) {
      this.status = 'completed';
      this.config.onComplete?.();
    }
  }

  cancel(): void {
    this.status = 'cancelled';
  }
}
