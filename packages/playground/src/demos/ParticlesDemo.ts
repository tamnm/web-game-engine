/**
 * Particle system demo.
 * Demonstrates particle emitters, behaviors, and visual effects.
 */

import { BaseDemo } from './BaseDemo.js';
import { Renderer, GameLoop, Emitter, Behaviors, DevOverlay, Vec2 } from '@web-game-engine/core';
import type { Texture } from '@web-game-engine/core';
import { createCircleTexture } from '../utils/graphics.js';

/**
 * ParticlesDemo showcases the engine's particle system capabilities.
 *
 * Features demonstrated:
 * - Particle emitters with different configurations
 * - Particle behaviors (gravity, fade, scale)
 * - Burst and continuous emission modes
 * - Interactive particle spawning
 */
export class ParticlesDemo extends BaseDemo {
  private devOverlay!: DevOverlay;
  private emitters: Emitter[] = [];
  private mousePos: Vec2 = { x: 0, y: 0 };
  private particleTexture!: Texture;

  async init(): Promise<void> {
    console.info('ParticlesDemo: Initializing particle system showcase');

    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;

    // Create procedural particle texture
    this.particleTexture = {
      id: 'particle',
      width: 16,
      height: 16,
      source: createCircleTexture('#ffffff', 16),
    };

    // Create renderer - force Canvas 2D (WebGL not implemented yet)
    this.renderer = new Renderer({
      contextProvider: () => this.canvas.getContext('2d'),
    }) as unknown;

    // Create continuous emitter (fountain effect)
    const fountainEmitter = new Emitter({
      x: 200,
      y: 500,
      texture: this.particleTexture,
      emissionRate: 50, // 50 particles per second
      maxParticles: 500,
      speed: { min: 100, max: 200 },
      angle: { min: -Math.PI * 0.7, max: -Math.PI * 0.3 }, // Upward spray
      ttl: { min: 2, max: 3 },
      scale: { min: 0.5, max: 1.5 },
      alpha: { min: 0.8, max: 1 },
      behaviors: [
        Behaviors.gravity(300), // Gravity pulls particles down
        Behaviors.alphaOverLife(1, 0), // Fade out over lifetime
      ],
    });
    this.emitters.push(fountainEmitter);

    // Create burst emitter (explosion effect)
    const burstEmitter = new Emitter({
      x: 600,
      y: 300,
      texture: this.particleTexture,
      emissionRate: 0, // Manual emission only
      maxParticles: 200,
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: Math.PI * 2 }, // All directions
      ttl: { min: 1, max: 2 },
      scale: { min: 1, max: 2 },
      alpha: { min: 1, max: 1 },
      behaviors: [
        Behaviors.alphaOverLife(1, 0),
        Behaviors.scaleOverLife(1, 0), // Shrink over lifetime
      ],
    });
    this.emitters.push(burstEmitter);

    // Trigger burst every 2 seconds
    setInterval(() => {
      burstEmitter.emit(50);
    }, 2000);

    // Create game loop
    this.gameLoop = new GameLoop({
      onSimulationStep: (delta: number) => this.update(delta),
      onRender: () => this.render(),
      targetFPS: 60,
    }) as unknown;

    // Enable dev tools overlay
    this.devOverlay = new DevOverlay({ position: 'top-left' });
    this.devOverlay.attach();

    // Set up mouse interaction
    this.setupMouseInteraction();

    // Start the game loop
    (this.gameLoop as GameLoop).start();

    console.info('ParticlesDemo: Initialized successfully');
  }

  /**
   * Set up mouse interaction for spawning particles.
   */
  private setupMouseInteraction(): void {
    // Track mouse position
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = e.clientX - rect.left;
      this.mousePos.y = e.clientY - rect.top;
    });

    // Spawn particle burst on click
    this.canvas.addEventListener('click', () => {
      this.spawnBurstAtMouse();
    });
  }

  /**
   * Spawn a particle burst at the mouse position.
   */
  private spawnBurstAtMouse(): void {
    const clickEmitter = new Emitter({
      x: this.mousePos.x,
      y: this.mousePos.y,
      texture: this.particleTexture,
      emissionRate: 0,
      maxParticles: 100,
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: Math.PI * 2 },
      ttl: { min: 0.5, max: 1.5 },
      scale: { min: 0.8, max: 1.5 },
      alpha: { min: 0.8, max: 1 },
      behaviors: [Behaviors.gravity(200), Behaviors.alphaOverLife(1, 0)],
    });

    clickEmitter.emit(30);
    this.emitters.push(clickEmitter);

    // Remove emitter after particles die
    setTimeout(() => {
      const index = this.emitters.indexOf(clickEmitter);
      if (index !== -1) {
        this.emitters.splice(index, 1);
      }
    }, 2000);
  }

  /**
   * Update all particle emitters.
   */
  override update(delta: number): void {
    for (const emitter of this.emitters) {
      emitter.update(delta);
    }
  }

  /**
   * Render all particles.
   */
  override render(): void {
    const renderer = this.renderer as Renderer;

    // Begin rendering frame
    renderer.begin();

    // Render all emitters
    for (const emitter of this.emitters) {
      emitter.render(renderer);
    }

    // End rendering frame and get stats
    const stats = renderer.end();

    // Note: Particle count is shown in the sprite count since each particle is a sprite

    // Update dev overlay
    if (this.devOverlay) {
      this.devOverlay.update(stats);
    }
  }

  /**
   * Override cleanup to properly dispose particle resources.
   */
  override cleanup(): void {
    console.info('ParticlesDemo: Cleaning up resources');

    // Remove mouse event listeners
    this.canvas.removeEventListener('mousemove', () => {});
    this.canvas.removeEventListener('click', () => {});

    // Clear emitters
    this.emitters = [];

    // Detach dev overlay
    if (this.devOverlay) {
      this.devOverlay.detach();
    }

    // Call base cleanup
    super.cleanup();
  }
}
