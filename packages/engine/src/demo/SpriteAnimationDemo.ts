import { World } from '../ecs/World';
import { TextureAtlas } from '../rendering/TextureAtlas';
import type { Texture, TextureAtlasDefinition } from '../rendering/types';
import {
  AnimationManager,
  AnimationController,
  createSpriteAnimationSystem,
  SpriteAnimation,
} from '../animation/sprite';
import type { AnimationClip } from '../animation/sprite/types';
import { AnimationDebugPanel } from '../devtools/AnimationDebugPanel';

/**
 * Demo scene showcasing sprite frame animation capabilities
 *
 * This example demonstrates:
 * - Animation clip registration
 * - Playback controls (play, pause, stop, resume)
 * - Loop modes (none, loop, ping-pong)
 * - Animation speed control
 * - Flip and rotation transforms
 * - Animation transitions
 * - Event callbacks
 */
export class SpriteAnimationDemo {
  private world: World;
  private animationManager: AnimationManager;
  private controller: AnimationController;
  private entity: number;
  private debugPanel: AnimationDebugPanel;

  constructor() {
    // Create ECS world
    this.world = new World();

    // Create animation manager
    this.animationManager = new AnimationManager();

    // Register animation system
    const animationSystem = createSpriteAnimationSystem(this.animationManager);
    this.world.registerSystem(animationSystem);

    // Create animation controller
    this.controller = new AnimationController(this.world, this.animationManager);

    // Create debug panel for development tools
    this.debugPanel = new AnimationDebugPanel(this.world, this.controller, {
      position: 'top-right',
    });

    // Set up demo
    this.setupTextureAtlas();
    this.registerAnimationClips();
    this.entity = this.createAnimatedEntity();
    this.setupEventCallbacks();

    // Select the entity in debug panel
    this.debugPanel.selectEntity(this.entity);
  }

  /**
   * Create a mock texture atlas with animation frames
   */
  private setupTextureAtlas(): TextureAtlas {
    // Create mock texture
    const texture: Texture = {
      id: 'character-spritesheet',
      width: 512,
      height: 256,
      source: null,
    };

    // Define frame regions in the atlas
    const frames: TextureAtlasDefinition = {
      // Idle animation frames (4 frames)
      'idle-1': { x: 0, y: 0, width: 64, height: 64 },
      'idle-2': { x: 64, y: 0, width: 64, height: 64 },
      'idle-3': { x: 128, y: 0, width: 64, height: 64 },
      'idle-4': { x: 192, y: 0, width: 64, height: 64 },

      // Walk animation frames (6 frames)
      'walk-1': { x: 0, y: 64, width: 64, height: 64 },
      'walk-2': { x: 64, y: 64, width: 64, height: 64 },
      'walk-3': { x: 128, y: 64, width: 64, height: 64 },
      'walk-4': { x: 192, y: 64, width: 64, height: 64 },
      'walk-5': { x: 256, y: 64, width: 64, height: 64 },
      'walk-6': { x: 320, y: 64, width: 64, height: 64 },

      // Run animation frames (4 frames)
      'run-1': { x: 0, y: 128, width: 64, height: 64 },
      'run-2': { x: 64, y: 128, width: 64, height: 64 },
      'run-3': { x: 128, y: 128, width: 64, height: 64 },
      'run-4': { x: 192, y: 128, width: 64, height: 64 },

      // Jump animation frames (3 frames)
      'jump-1': { x: 0, y: 192, width: 64, height: 64 },
      'jump-2': { x: 64, y: 192, width: 64, height: 64 },
      'jump-3': { x: 128, y: 192, width: 64, height: 64 },
    };

    return new TextureAtlas(texture, frames);
  }

  /**
   * Register animation clips with the animation manager
   */
  private registerAnimationClips(): void {
    const atlas = this.setupTextureAtlas();

    // Idle animation - loops continuously
    const idleClip: AnimationClip = {
      name: 'idle',
      atlas,
      frames: [
        { frameName: 'idle-1' },
        { frameName: 'idle-2' },
        { frameName: 'idle-3' },
        { frameName: 'idle-4' },
      ],
      defaultFrameDuration: 0.2,
      loopMode: 'loop',
      speed: 1.0,
    };

    // Walk animation - loops continuously
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
      defaultFrameDuration: 0.15,
      loopMode: 'loop',
      speed: 1.0,
    };

    // Run animation - loops continuously, faster speed
    const runClip: AnimationClip = {
      name: 'run',
      atlas,
      frames: [
        { frameName: 'run-1' },
        { frameName: 'run-2' },
        { frameName: 'run-3' },
        { frameName: 'run-4' },
      ],
      defaultFrameDuration: 0.1,
      loopMode: 'loop',
      speed: 1.5,
    };

    // Jump animation - plays once with variable frame durations
    const jumpClip: AnimationClip = {
      name: 'jump',
      atlas,
      frames: [
        { frameName: 'jump-1', duration: 0.1 }, // Quick takeoff
        { frameName: 'jump-2', duration: 0.3 }, // Hang time
        { frameName: 'jump-3', duration: 0.1 }, // Quick landing
      ],
      defaultFrameDuration: 0.15,
      loopMode: 'none',
      speed: 1.0,
    };

    // Register all clips
    this.animationManager.registerClip(idleClip);
    this.animationManager.registerClip(walkClip);
    this.animationManager.registerClip(runClip);
    this.animationManager.registerClip(jumpClip);
  }

  /**
   * Create an entity with sprite animation component
   */
  private createAnimatedEntity(): number {
    const entity = this.world.createEntity();
    this.world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());
    return entity;
  }

  /**
   * Set up event callbacks for animation events
   */
  private setupEventCallbacks(): void {
    const anim = this.world.getComponent(this.entity, SpriteAnimation);
    if (!anim) return;

    anim.onFrame = (_entity, clipName, frameIndex) => {
      console.info(`Animation frame changed: ${clipName} frame ${frameIndex}`);
    };

    anim.onLoop = (_entity, clipName) => {
      console.info(`Animation looped: ${clipName}`);
    };

    anim.onComplete = (entity, clipName) => {
      console.info(`Animation completed: ${clipName}`);
      // Transition back to idle after jump completes
      if (clipName === 'jump') {
        this.controller.transitionTo(entity, 'idle', 0.2);
      }
    };

    anim.onTransitionComplete = (_entity, targetClip) => {
      console.info(`Transition completed to: ${targetClip}`);
    };
  }

  /**
   * Demonstrate playback controls
   */
  playIdle(): void {
    this.controller.play(this.entity, 'idle');
  }

  playWalk(): void {
    this.controller.play(this.entity, 'walk');
  }

  playRun(): void {
    this.controller.play(this.entity, 'run');
  }

  playJump(): void {
    this.controller.play(this.entity, 'jump');
  }

  pause(): void {
    this.controller.pause(this.entity);
  }

  resume(): void {
    this.controller.resume(this.entity);
  }

  stop(): void {
    this.controller.stop(this.entity);
  }

  /**
   * Demonstrate flip transforms
   */
  flipHorizontal(flip: boolean): void {
    const anim = this.world.getComponent(this.entity, SpriteAnimation);
    if (anim) {
      this.controller.setFlip(this.entity, flip, anim.flipY);
    }
  }

  flipVertical(flip: boolean): void {
    const anim = this.world.getComponent(this.entity, SpriteAnimation);
    if (anim) {
      this.controller.setFlip(this.entity, anim.flipX, flip);
    }
  }

  /**
   * Demonstrate rotation
   */
  setRotation(radians: number): void {
    this.controller.setRotation(this.entity, radians);
  }

  /**
   * Demonstrate animation speed control
   */
  setSpeed(speed: number): void {
    this.controller.setSpeed(this.entity, speed);
  }

  /**
   * Demonstrate smooth transitions between animations
   */
  transitionToWalk(): void {
    this.controller.transitionTo(this.entity, 'walk', 0.3);
  }

  transitionToRun(): void {
    this.controller.transitionTo(this.entity, 'run', 0.2);
  }

  /**
   * Demonstrate manual frame stepping (for debugging)
   */
  stepForward(): void {
    this.controller.step(this.entity, 1);
  }

  stepBackward(): void {
    this.controller.step(this.entity, -1);
  }

  /**
   * Update the animation system
   */
  update(deltaTime: number): void {
    this.world.step(deltaTime);
    // Update debug panel display in real-time
    this.debugPanel.update();
  }

  /**
   * Get current animation state for debugging
   */
  getAnimationState() {
    return this.controller.getState(this.entity);
  }

  /**
   * Get current frame texture region
   */
  getCurrentFrame() {
    return this.controller.getCurrentFrame(this.entity);
  }

  /**
   * Show the debug panel
   */
  showDebugPanel(): void {
    this.debugPanel.attach();
  }

  /**
   * Hide the debug panel
   */
  hideDebugPanel(): void {
    this.debugPanel.detach();
  }

  /**
   * Get the debug panel instance
   */
  getDebugPanel(): AnimationDebugPanel {
    return this.debugPanel;
  }
}

/**
 * Example usage:
 *
 * ```typescript
 * const demo = new SpriteAnimationDemo();
 *
 * // Show debug panel for development
 * demo.showDebugPanel();
 *
 * // Start with idle animation
 * demo.playIdle();
 *
 * // Game loop
 * function gameLoop(deltaTime: number) {
 *   demo.update(deltaTime); // Updates animation and debug panel
 *
 *   // Get current frame for rendering
 *   const frame = demo.getCurrentFrame();
 *   if (frame) {
 *     // Render the frame...
 *   }
 * }
 *
 * // Respond to player input
 * onKeyPress('ArrowRight', () => {
 *   demo.transitionToWalk();
 *   demo.flipHorizontal(false);
 * });
 *
 * onKeyPress('ArrowLeft', () => {
 *   demo.transitionToWalk();
 *   demo.flipHorizontal(true);
 * });
 *
 * onKeyPress('Shift', () => {
 *   demo.transitionToRun();
 * });
 *
 * onKeyPress('Space', () => {
 *   demo.playJump();
 * });
 *
 * // The debug panel provides interactive controls:
 * // - Play/Pause/Stop buttons
 * // - Step forward/backward buttons
 * // - Real-time display of animation state
 * // - Current clip, frame, state, elapsed time
 * // - Speed, loop mode, direction, flip, rotation
 * ```
 */
