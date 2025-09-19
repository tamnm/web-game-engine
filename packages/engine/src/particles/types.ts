import type { Texture, TextureRegion } from '../rendering';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  rotation: number;
  angularVelocity: number;
  scale: number;
  alpha: number;
  age: number; // seconds
  ttl: number; // seconds
  texture?: Texture | TextureRegion;
}

export type Behavior = (p: Particle, dt: number) => void;

export interface EmitterOptions {
  x?: number;
  y?: number;
  texture?: Texture | TextureRegion;
  emissionRate?: number; // particles per second
  maxParticles?: number;
  // Initial particle ranges
  speed?: { min: number; max: number };
  angle?: { min: number; max: number }; // radians
  ttl?: { min: number; max: number }; // seconds
  scale?: { min: number; max: number };
  alpha?: { min: number; max: number };
  behaviors?: Behavior[];
  rng?: () => number;
}
