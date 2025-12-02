/**
 * Sprite animation demo showcasing frame-based animations.
 * Demonstrates loop modes, speed control, flip/rotation transforms, and the animation debug panel.
 */

import { BaseDemo } from './BaseDemo.js';
import {
  World,
  GameLoop,
  Renderer,
  AnimationManager,
  AnimationController,
  createSpriteAnimationSystem,
  SpriteAnimation,
  TextureAtlas,
  AnimationDebugPanel,
  DevOverlay,
  animationToDrawOptions,
} from '@web-game-engine/core';
import type { AnimationClip, Texture, TextureAtlasDefinition } from '@web-game-engine/core';
import { createAnimationFrames } from '../utils/graphics.js';

/**
 * AnimationDemo showcases the engine's sprite animation capabilities.
 *
 * Features demonstrated:
 * - Frame-based animations from sprite sheets (procedurally generated)
 * - Loop modes (none, loop, ping-pong)
 * - Animation speed control
 * - Flip and rotation transforms
 * - Animation transitions with blending
 * - Animation debug panel for inspection
 */
export class AnimationDemo extends BaseDemo {
  private animationManager!: AnimationManager;
  private controller!: AnimationController;
  private entity!: number;
  private debugPanel!: AnimationDebugPanel;
  private devOverlay!: DevOverlay;

  async init(): Promise<void> {
    console.info('AnimationDemo: Initializing sprite animation showcase');

    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;

    // Create ECS world
    this.world = new World() as unknown;

    // Create animation manager - central registry for animation clips
    this.animationManager = new AnimationManager();

    // Register animation system - updates all animated entities each frame
    const animationSystem = createSpriteAnimationSystem(this.animationManager);
    (this.world as World).registerSystem(animationSystem);

    // Create animation controller - provides high-level API for controlling animations
    this.controller = new AnimationController(this.world as World, this.animationManager);

    // Set up procedurally generated texture atlas and register animation clips
    this.setupTextureAtlas();
    this.registerAnimationClips();

    // Create an animated entity and set up event callbacks
    this.entity = this.createAnimatedEntity();
    this.setupEventCallbacks();

    // Create renderer for sprite rendering - force Canvas 2D (WebGL not implemented yet)
    this.renderer = new Renderer({
      contextProvider: () => this.canvas.getContext('2d'),
    }) as unknown;

    // Create game loop with fixed timestep for consistent animation playback
    this.gameLoop = new GameLoop({
      onSimulationStep: (delta: number) => this.update(delta),
      onRender: () => this.render(),
      targetFPS: 60,
    }) as unknown;

    // Enable dev tools overlay to show FPS and entity count
    this.devOverlay = new DevOverlay({
      position: 'top-left',
    });
    this.devOverlay.attach();

    // Create animation debug panel for interactive control and inspection
    this.debugPanel = new AnimationDebugPanel(this.world as World, this.controller, {
      position: 'top-right',
    });
    this.debugPanel.selectEntity(this.entity);
    this.debugPanel.attach();

    // Start with idle animation
    this.controller.play(this.entity, 'idle');

    // Start the game loop
    (this.gameLoop as GameLoop).start();

    console.info('AnimationDemo: Initialized successfully');
  }

  /**
   * Create a procedurally generated texture atlas with animation frames.
   * In a real game, this would load from an actual sprite sheet image.
   */
  private setupTextureAtlas(): TextureAtlas {
    // Generate procedural textures for animation frames
    const idleFrames = createAnimationFrames('#4a9eff', 4, 64); // Blue - 4 frames
    const walkFrames = createAnimationFrames('#50c878', 6, 64); // Green - 6 frames
    const runFrames = createAnimationFrames('#ff6b6b', 4, 64); // Red - 4 frames
    const jumpFrames = createAnimationFrames('#ffd93d', 3, 64); // Yellow - 3 frames

    // Create a sprite sheet canvas that contains all frames laid out
    const spriteSheetWidth = 512;
    const spriteSheetHeight = 256;
    const spriteSheet = document.createElement('canvas');
    spriteSheet.width = spriteSheetWidth;
    spriteSheet.height = spriteSheetHeight;
    const ctx = spriteSheet.getContext('2d');

    if (ctx) {
      // Draw idle frames (row 0)
      idleFrames.forEach((frame, i) => {
        ctx.drawImage(frame, i * 64, 0, 64, 64);
      });

      // Draw walk frames (row 1)
      walkFrames.forEach((frame, i) => {
        ctx.drawImage(frame, i * 64, 64, 64, 64);
      });

      // Draw run frames (row 2)
      runFrames.forEach((frame, i) => {
        ctx.drawImage(frame, i * 64, 128, 64, 64);
      });

      // Draw jump frames (row 3)
      jumpFrames.forEach((frame, i) => {
        ctx.drawImage(frame, i * 64, 192, 64, 64);
      });
    }

    // Create texture from the sprite sheet
    const texture: Texture = {
      id: 'character-spritesheet',
      width: spriteSheetWidth,
      height: spriteSheetHeight,
      source: spriteSheet,
    };

    // Define frame regions in the atlas
    // Each frame is positioned as if it were in a sprite sheet
    const frames: TextureAtlasDefinition = {
      // Idle animation frames (4 frames) - subtle breathing animation
      'idle-1': { x: 0, y: 0, width: 64, height: 64 },
      'idle-2': { x: 64, y: 0, width: 64, height: 64 },
      'idle-3': { x: 128, y: 0, width: 64, height: 64 },
      'idle-4': { x: 192, y: 0, width: 64, height: 64 },

      // Walk animation frames (6 frames) - smooth walking cycle
      'walk-1': { x: 0, y: 64, width: 64, height: 64 },
      'walk-2': { x: 64, y: 64, width: 64, height: 64 },
      'walk-3': { x: 128, y: 64, width: 64, height: 64 },
      'walk-4': { x: 192, y: 64, width: 64, height: 64 },
      'walk-5': { x: 256, y: 64, width: 64, height: 64 },
      'walk-6': { x: 320, y: 64, width: 64, height: 64 },

      // Run animation frames (4 frames) - faster movement cycle
      'run-1': { x: 0, y: 128, width: 64, height: 64 },
      'run-2': { x: 64, y: 128, width: 64, height: 64 },
      'run-3': { x: 128, y: 128, width: 64, height: 64 },
      'run-4': { x: 192, y: 128, width: 64, height: 64 },

      // Jump animation frames (3 frames) - takeoff, air, landing
      'jump-1': { x: 0, y: 192, width: 64, height: 64 },
      'jump-2': { x: 64, y: 192, width: 64, height: 64 },
      'jump-3': { x: 128, y: 192, width: 64, height: 64 },
    };

    return new TextureAtlas(texture, frames);
  }

  /**
   * Register animation clips with the animation manager.
   * Each clip defines a sequence of frames and playback parameters.
   */
  private registerAnimationClips(): void {
    const atlas = this.setupTextureAtlas();

    // Idle animation - loops continuously with slow, steady pace
    const idleClip: AnimationClip = {
      name: 'idle',
      atlas,
      frames: [
        { frameName: 'idle-1' },
        { frameName: 'idle-2' },
        { frameName: 'idle-3' },
        { frameName: 'idle-4' },
      ],
      defaultFrameDuration: 0.2, // 200ms per frame
      loopMode: 'loop', // Continuously loop
      speed: 1.0,
    };

    // Walk animation - loops continuously with moderate pace
    const walkClip: AnimationClip = {
      name: 'walk',
      atlas,
      frames: [
        { frameName: 'walk-1' },
        { frameName: 'walk-2' },
        { frameName: 'walk-3' },
        { frameName: 'walk-4' },
        { frameName: 'walk-5' },
        { frameName: 'walk-6' },
      ],
      defaultFrameDuration: 0.15, // 150ms per frame
      loopMode: 'loop',
      speed: 1.0,
    };

    // Run animation - loops continuously with fast pace
    const runClip: AnimationClip = {
      name: 'run',
      atlas,
      frames: [
        { frameName: 'run-1' },
        { frameName: 'run-2' },
        { frameName: 'run-3' },
        { frameName: 'run-4' },
      ],
      defaultFrameDuration: 0.1, // 100ms per frame
      loopMode: 'loop',
      speed: 1.5, // 50% faster playback
    };

    // Jump animation - plays once with variable frame durations
    const jumpClip: AnimationClip = {
      name: 'jump',
      atlas,
      frames: [
        { frameName: 'jump-1', duration: 0.1 }, // Quick takeoff
        { frameName: 'jump-2', duration: 0.3 }, // Hang time in air
        { frameName: 'jump-3', duration: 0.1 }, // Quick landing
      ],
      defaultFrameDuration: 0.15,
      loopMode: 'none', // Play once and stop
      speed: 1.0,
    };

    // Register all clips with the animation manager
    this.animationManager.registerClip(idleClip);
    this.animationManager.registerClip(walkClip);
    this.animationManager.registerClip(runClip);
    this.animationManager.registerClip(jumpClip);
  }

  /**
   * Create an entity with sprite animation component.
   * The animation system will update this entity's animation state each frame.
   */
  private createAnimatedEntity(): number {
    const world = this.world as World;
    const entity = world.createEntity();
    world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());
    return entity;
  }

  /**
   * Set up event callbacks for animation events.
   * These callbacks provide hooks for game logic to respond to animation state changes.
   */
  private setupEventCallbacks(): void {
    const world = this.world as World;
    const anim = world.getComponent(this.entity, SpriteAnimation);
    if (!anim) return;

    // Called when a non-looping animation completes
    anim.onComplete = (entity: number, clipName: string) => {
      // Automatically transition back to idle after jump completes
      if (clipName === 'jump') {
        this.controller.transitionTo(entity, 'idle', 0.2);
      }
    };
  }

  /**
   * Override render to use the engine's proper rendering pipeline.
   */
  override render(): void {
    const renderer = this.renderer as Renderer;
    const world = this.world as World;

    // Begin rendering frame
    renderer.begin();

    // Get current animation frame and state
    const frame = this.controller.getCurrentFrame(this.entity);
    const animData = world.getComponent(this.entity, SpriteAnimation);

    if (frame && animData) {
      // Convert animation data to draw options
      const drawOptions = animationToDrawOptions(animData, {
        x: this.canvas.width / 2,
        y: this.canvas.height / 2,
        width: 128,
        height: 128,
      });

      // Draw the animated sprite using the engine's renderer
      renderer.drawSprite(frame, drawOptions);
    }

    // End rendering frame and get stats
    const stats = renderer.end();

    // Update dev overlay with actual render stats
    if (this.devOverlay) {
      this.devOverlay.update(stats);
    }
  }

  /**
   * Override cleanup to properly dispose animation resources.
   */
  override cleanup(): void {
    console.info('AnimationDemo: Cleaning up resources');

    // Detach debug panel
    if (this.debugPanel) {
      this.debugPanel.detach();
    }

    // Detach dev overlay
    if (this.devOverlay) {
      this.devOverlay.detach();
    }

    // Call base cleanup to stop game loop and dispose world/renderer
    super.cleanup();
  }
}
