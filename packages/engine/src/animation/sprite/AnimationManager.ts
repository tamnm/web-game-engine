import type { AnimationClip } from './types';

/**
 * Manages registration and retrieval of animation clips
 */
export class AnimationManager {
  private readonly clips = new Map<string, AnimationClip>();

  /**
   * Register an animation clip
   * @param clip - The animation clip to register
   * @throws Error if frame names don't exist in atlas or durations are invalid
   */
  registerClip(clip: AnimationClip): void {
    // Validate frame names exist in atlas
    for (const frame of clip.frames) {
      if (!clip.atlas.hasRegion(frame.frameName)) {
        throw new Error(
          `Frame '${frame.frameName}' not found in texture atlas for clip '${clip.name}'`
        );
      }

      // Validate per-frame duration if specified
      if (frame.duration !== undefined && frame.duration <= 0) {
        throw new Error(
          `Frame duration must be greater than zero for frame '${frame.frameName}' in clip '${clip.name}'`
        );
      }
    }

    // Validate default frame duration
    if (clip.defaultFrameDuration <= 0) {
      throw new Error(`Frame duration must be greater than zero for clip '${clip.name}'`);
    }

    // Validate speed
    if (clip.speed <= 0) {
      throw new Error(`Animation speed must be greater than zero for clip '${clip.name}'`);
    }

    this.clips.set(clip.name, clip);
  }

  /**
   * Get a registered clip by name
   * @param name - The clip name
   * @returns The animation clip or undefined if not found
   */
  getClip(name: string): AnimationClip | undefined {
    return this.clips.get(name);
  }

  /**
   * Check if a clip exists
   * @param name - The clip name
   * @returns True if the clip is registered
   */
  hasClip(name: string): boolean {
    return this.clips.has(name);
  }

  /**
   * List all registered clip names
   * @returns Array of clip names
   */
  listClips(): string[] {
    return Array.from(this.clips.keys());
  }

  /**
   * Unregister a clip
   * @param name - The clip name to remove
   */
  unregisterClip(name: string): void {
    this.clips.delete(name);
  }
}
