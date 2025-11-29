import type { Entity } from '../../ecs/types';
import type { TextureAtlas } from '../../rendering/TextureAtlas';

/**
 * Playback state of an animation
 */
export type PlaybackState = 'playing' | 'paused' | 'stopped';

/**
 * Loop behavior when animation reaches the end
 */
export type LoopMode = 'none' | 'loop' | 'ping-pong';

/**
 * Playback direction: 1 for forward, -1 for reverse
 */
export type PlaybackDirection = 1 | -1;

/**
 * A single frame in an animation sequence
 */
export interface AnimationFrame {
  /** Frame name in texture atlas */
  frameName: string;

  /** Duration in seconds (optional, uses clip default if not specified) */
  duration?: number;
}

/**
 * An animation clip containing a sequence of frames
 */
export interface AnimationClip {
  /** Unique clip identifier */
  name: string;

  /** Texture atlas containing the frames */
  atlas: TextureAtlas;

  /** Ordered sequence of frames */
  frames: AnimationFrame[];

  /** Default frame duration in seconds */
  defaultFrameDuration: number;

  /** Default loop mode */
  loopMode: LoopMode;

  /** Default animation speed */
  speed: number;
}

/**
 * Transition state for blending between animations
 */
export interface AnimationTransition {
  /** Target clip to transition to */
  targetClip: string;

  /** Transition duration in seconds */
  duration: number;

  /** Elapsed time in transition */
  elapsed: number;
}

/**
 * Animation component data stored on entities
 */
export interface SpriteAnimationData {
  /** Current clip being played */
  clipName: string;

  /** Current frame index in the clip */
  frameIndex: number;

  /** Accumulated time in seconds since last frame change */
  accumulatedTime: number;

  /** Playback state */
  state: PlaybackState;

  /** Animation speed multiplier (1.0 = normal speed) */
  speed: number;

  /** Loop mode */
  loopMode: LoopMode;

  /** Playback direction (1 = forward, -1 = reverse) */
  direction: PlaybackDirection;

  /** Horizontal flip */
  flipX: boolean;

  /** Vertical flip */
  flipY: boolean;

  /** Rotation in radians */
  rotation: number;

  /** Callback invoked when animation completes (none mode) */
  onComplete?: (entity: Entity, clipName: string) => void;

  /** Callback invoked when animation loops */
  onLoop?: (entity: Entity, clipName: string) => void;

  /** Callback invoked when frame changes */
  onFrame?: (entity: Entity, clipName: string, frameIndex: number) => void;

  /** Callback invoked when transition completes */
  onTransitionComplete?: (entity: Entity, targetClip: string) => void;

  /** Active transition state (optional) */
  transition?: AnimationTransition;
}
