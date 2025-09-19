import type { Texture, TextureRegion, SpriteDrawOptions } from '../rendering';
import type { Behavior, EmitterOptions, Particle } from './types';

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export class Emitter {
  x = 0;
  y = 0;
  texture?: Texture | TextureRegion;
  emissionRate = 0;
  maxParticles = 1000;
  private particles: Particle[] = [];
  private accumulator = 0; // particles to emit
  private behaviors: Behavior[] = [];
  private rng: () => number = Math.random;

  // Ranges
  private speed = { min: 10, max: 50 };
  private angle = { min: 0, max: Math.PI * 2 };
  private ttl = { min: 1, max: 2 };
  private scale = { min: 1, max: 1 };
  private alpha = { min: 1, max: 1 };

  constructor(options: EmitterOptions = {}) {
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.texture = options.texture;
    this.emissionRate = Math.max(0, options.emissionRate ?? 0);
    this.maxParticles = Math.max(1, options.maxParticles ?? 1000);
    if (options.speed) this.speed = options.speed;
    if (options.angle) this.angle = options.angle;
    if (options.ttl) this.ttl = options.ttl;
    if (options.scale) this.scale = options.scale;
    if (options.alpha) this.alpha = options.alpha;
    this.behaviors = options.behaviors ? [...options.behaviors] : [];
    if (options.rng) this.rng = options.rng;
  }

  get count(): number {
    return this.particles.length;
  }

  emit(count: number): void {
    const n = Math.floor(Math.max(0, count));
    for (let i = 0; i < n && this.particles.length < this.maxParticles; i++) {
      this.particles.push(this.spawn());
    }
  }

  update(dtMs: number): void {
    const dt = Math.max(0, dtMs) / 1000;
    // Emission
    this.accumulator += this.emissionRate * dt;
    let toEmit = Math.floor(this.accumulator);
    this.accumulator -= toEmit;
    while (toEmit > 0 && this.particles.length < this.maxParticles) {
      this.particles.push(this.spawn());
      toEmit -= 1;
    }
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.ttl) {
        this.particles.splice(i, 1);
        continue;
      }
      for (const b of this.behaviors) b(p, dt);
      // Default integration
      p.vx += p.ax * dt;
      p.vy += p.ay * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.angularVelocity * dt;
    }
  }

  render(renderer: {
    drawSprite: (src: Texture | TextureRegion, opts: SpriteDrawOptions) => void;
  }): void {
    if (!this.texture) return;
    const source = this.texture;
    const baseW = (source as TextureRegion).width;
    const baseH = (source as TextureRegion).height;
    for (const p of this.particles) {
      const w = baseW * p.scale;
      const h = baseH * p.scale;
      renderer.drawSprite(source, {
        x: p.x,
        y: p.y,
        width: w,
        height: h,
        rotation: p.rotation,
        origin: [0.5, 0.5],
        parallax: [1, 1],
        tint: [1, 1, 1, clamp01(p.alpha)],
      });
    }
  }

  private spawn(): Particle {
    const r = this.rng();
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const angle = lerp(this.angle.min, this.angle.max, r);
    const speed = lerp(this.speed.min, this.speed.max, this.rng());
    const ttl = lerp(this.ttl.min, this.ttl.max, this.rng());
    const sc = lerp(this.scale.min, this.scale.max, this.rng());
    const al = lerp(this.alpha.min, this.alpha.max, this.rng());
    return {
      x: this.x,
      y: this.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ax: 0,
      ay: 0,
      rotation: 0,
      angularVelocity: 0,
      scale: sc,
      alpha: al,
      age: 0,
      ttl,
      texture: this.texture,
    };
  }

  // Public debug/utility APIs
  withParticles(fn: (list: Particle[]) => void): void {
    fn(this.particles);
  }

  setBehaviors(behaviors: Behavior[]): void {
    this.behaviors = [...behaviors];
  }
}

export const Behaviors = {
  gravity:
    (g: number): Behavior =>
    (p) => {
      p.ay = g;
    },
  alphaOverLife:
    (from: number, to: number): Behavior =>
    (p) => {
      const t = clamp01(p.age / p.ttl);
      p.alpha = from + (to - from) * t;
    },
  scaleOverLife:
    (from: number, to: number): Behavior =>
    (p) => {
      const t = clamp01(p.age / p.ttl);
      p.scale = from + (to - from) * t;
    },
};
