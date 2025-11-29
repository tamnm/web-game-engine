import type { Entity, World } from '../../ecs/types';
import type { SpriteDrawOptions, TextureRegion } from '../../rendering/types';
import type { AnimationManager } from './AnimationManager';
import type { LoopMode, SpriteAnimationData } from './types';
import { SpriteAnimation } from './components';

/**
 * Controller for managing animation playback on entities
 */
export class AnimationController {
  constructor(
    private readonly world: World,
    private readonly animationManager: AnimationManager
  ) {}

  /**
   * Play an animation clip on an entity
   * @param entity - The entity to animate
   * @param clipName - The name of the clip to play
   * @param resetFrame - Whether to reset to frame 0 (default: true)
   */
  play(entity: Entity, clipName: string, resetFrame = true): void {
    const anim = this.world.getComponent(entity, SpriteAnimation);
    if (!anim) {
      console.warn(`Entity ${entity} does not have SpriteAnimation component`);
      return;
    }

    const clip = this.animationManager.getClip(clipName);
    if (!clip) {
      console.warn(`Animation clip '${clipName}' not found`);
      return;
    }

    anim.clipName = clipName;
    anim.state = 'playing';

    if (resetFrame) {
      anim.frameIndex = 0;
      anim.accumulatedTime = 0;
    }
  }

  /**
   * Pause the current animation
   * @param entity - The entity to pause
   */
  pause(entity: Entity): void {
    const anim = this.world.getComponent(entity, SpriteAnimation);
    if (!anim) {
      console.warn(`Entity ${entity} does not have SpriteAnimation component`);
      return;
    }

    if (anim.state === 'playing') {
      anim.state = 'paused';
    }
  }

  /**
   * Resume a paused animation
   * @param entity - The entity to resume
   */
  resume(entity: Entity): void {
    const anim = this.world.getComponent(entity, SpriteAnimation);
    if (!anim) {
      console.warn(`Entity ${entity} does not have SpriteAnimation component`);
      return;
    }

    if (anim.state === 'paused') {
      anim.state = 'playing';
    }
  }

  /**
   * Stop the animation and reset to frame 0
   * @param entity - The entity to stop
   */
  stop(entity: Entity): void {
    const anim = this.world.getComponent(entity, SpriteAnimation);
    if (!anim) {
      console.warn(`Entity ${entity} does not have SpriteAnimation component`);
      return;
    }

    anim.state = 'stopped';
    anim.frameIndex = 0;
    anim.accumulatedTime = 0;
  }

  /**
   * Set the animation speed multiplier
   * @param entity - The entity to modify
   * @param speed - Speed multiplier (must be > 0)
   */
  setSpeed(entity: Entity, speed: number): void {
    if (speed <= 0) {
      throw new Error('Animation speed must be greater than zero');
    }

    const anim = this.world.getComponent(entity, SpriteAnimation);
    if (!anim) {
      console.warn(`Entity ${entity} does not have SpriteAnimation component`);
      return;
    }

    anim.speed = speed;
  }

  /**
   * Set the loop mode
   * @param entity - The entity to modify
   * @param mode - The loop mode
   */
  setLoopMode(entity: Entity, mode: LoopMode): void {
    const anim = this.world.getComponent(entity, SpriteAnimation);
    if (!anim) {
      console.warn(`Entity ${entity} does not have SpriteAnimation component`);
      return;
    }

    anim.loopMode = mode;
  }

  /**
   * Set flip transforms
   * @param entity - The entity to modify
   * @param flipX - Horizontal flip
   * @param flipY - Vertical flip
   */
  setFlip(entity: Entity, flipX: boolean, flipY: boolean): void {
    const anim = this.world.getComponent(entity, SpriteAnimation);
    if (!anim) {
      console.warn(`Entity ${entity} does not have SpriteAnimation component`);
      return;
    }

    anim.flipX = flipX;
    anim.flipY = flipY;
  }

  /**
   * Set rotation in radians
   * @param entity - The entity to modify
   * @param rotation - Rotation angle in radians
   */
  setRotation(entity: Entity, rotation: number): void {
    const anim = this.world.getComponent(entity, SpriteAnimation);
    if (!anim) {
      console.warn(`Entity ${entity} does not have SpriteAnimation component`);
      return;
    }

    anim.rotation = rotation;
  }

  /**
   * Initiate a transition to another animation
   * @param entity - The entity to transition
   * @param targetClip - The target clip name
   * @param duration - Transition duration in seconds
   */
  transitionTo(entity: Entity, targetClip: string, duration: number): void {
    const anim = this.world.getComponent(entity, SpriteAnimation);
    if (!anim) {
      console.warn(`Entity ${entity} does not have SpriteAnimation component`);
      return;
    }

    const clip = this.animationManager.getClip(targetClip);
    if (!clip) {
      console.warn(`Animation clip '${targetClip}' not found`);
      return;
    }

    anim.transition = {
      targetClip,
      duration,
      elapsed: 0,
    };
  }

  /**
   * Get the current animation state
   * @param entity - The entity to query
   * @returns The animation data or undefined
   */
  getState(entity: Entity): SpriteAnimationData | undefined {
    return this.world.getComponent(entity, SpriteAnimation);
  }

  /**
   * Get the current frame's texture region
   * @param entity - The entity to query
   * @returns The texture region or undefined
   */
  getCurrentFrame(entity: Entity): TextureRegion | undefined {
    const anim = this.world.getComponent(entity, SpriteAnimation);
    if (!anim) {
      return undefined;
    }

    const clip = this.animationManager.getClip(anim.clipName);
    if (!clip) {
      console.error(`Animation clip '${anim.clipName}' not found`);
      return undefined;
    }

    if (anim.frameIndex < 0 || anim.frameIndex >= clip.frames.length) {
      console.error(
        `Frame index ${anim.frameIndex} out of bounds for clip '${anim.clipName}' (length: ${clip.frames.length})`
      );
      return undefined;
    }

    const frame = clip.frames[anim.frameIndex];
    try {
      return clip.atlas.getRegion(frame.frameName);
    } catch (error) {
      console.error(`Error getting frame '${frame.frameName}':`, error);
      return undefined;
    }
  }

  /**
   * Manually step through frames (for debugging)
   * @param entity - The entity to step
   * @param steps - Number of frames to step (positive or negative)
   */
  step(entity: Entity, steps: number): void {
    const anim = this.world.getComponent(entity, SpriteAnimation);
    if (!anim) {
      console.warn(`Entity ${entity} does not have SpriteAnimation component`);
      return;
    }

    const clip = this.animationManager.getClip(anim.clipName);
    if (!clip) {
      console.warn(`Animation clip '${anim.clipName}' not found`);
      return;
    }

    // Clamp to valid range
    anim.frameIndex = Math.max(0, Math.min(clip.frames.length - 1, anim.frameIndex + steps));
  }
}

/**
 * Convert animation component data to sprite draw options
 * @param animData - The animation component data
 * @param baseOptions - Base draw options (position, size, etc.)
 * @returns Sprite draw options with flip and rotation applied
 */
export function animationToDrawOptions(
  animData: SpriteAnimationData,
  baseOptions: Partial<SpriteDrawOptions>
): SpriteDrawOptions {
  const options: SpriteDrawOptions = {
    x: baseOptions.x ?? 0,
    y: baseOptions.y ?? 0,
    width: baseOptions.width,
    height: baseOptions.height,
    rotation: baseOptions.rotation ?? animData.rotation,
    flipX: animData.flipX,
    flipY: animData.flipY,
    tint: baseOptions.tint,
    origin: baseOptions.origin,
    parallax: baseOptions.parallax,
    blend: baseOptions.blend,
  };

  return options;
}
