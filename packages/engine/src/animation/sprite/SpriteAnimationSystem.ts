import type { System, SystemContext } from '../../ecs/types';
import type { AnimationManager } from './AnimationManager';
import { SpriteAnimation } from './components';

/**
 * System for updating sprite animations based on delta time
 */
export function createSpriteAnimationSystem(manager: AnimationManager): System {
  return {
    id: 'sprite-animation',
    stage: 'update',
    order: 10,
    execute: (context: SystemContext) => {
      const { world, delta } = context;

      // Query all entities with SpriteAnimation component
      const query = world.query({ all: [SpriteAnimation] });

      for (const row of query) {
        const entity = row.entity as number;
        const anim = world.getComponent(entity, SpriteAnimation);

        if (!anim) continue;

        // Handle active transitions
        if (anim.transition) {
          anim.transition.elapsed += delta;

          // Check if transition is complete
          if (anim.transition.elapsed >= anim.transition.duration) {
            const targetClip = anim.transition.targetClip;
            anim.transition = undefined;

            // Switch to target clip
            anim.clipName = targetClip;
            anim.frameIndex = 0;
            anim.accumulatedTime = 0;
            anim.state = 'playing';

            // Invoke onTransitionComplete callback
            if (anim.onTransitionComplete) {
              try {
                anim.onTransitionComplete(entity, targetClip);
              } catch (error) {
                console.error('Error in onTransitionComplete callback:', error);
              }
            }
          }

          // Continue to next entity during transition
          continue;
        }

        // Skip if not playing
        if (anim.state !== 'playing') continue;

        // Get the clip
        const clip = manager.getClip(anim.clipName);
        if (!clip || clip.frames.length === 0) continue;

        // Calculate effective delta time with speed multiplier
        const effectiveDelta = delta * anim.speed;

        // Accumulate time
        anim.accumulatedTime += effectiveDelta;

        // Advance frames while accumulated time exceeds frame duration
        while (anim.accumulatedTime >= getCurrentFrameDuration(clip, anim.frameIndex)) {
          const frameDuration = getCurrentFrameDuration(clip, anim.frameIndex);
          anim.accumulatedTime -= frameDuration;

          // Advance frame based on direction
          const nextFrameIndex = anim.frameIndex + anim.direction;

          // Handle loop modes
          if (anim.loopMode === 'none') {
            // Stop at final frame
            if (nextFrameIndex >= clip.frames.length || nextFrameIndex < 0) {
              anim.frameIndex = Math.max(0, Math.min(clip.frames.length - 1, nextFrameIndex));
              anim.state = 'stopped';
              anim.accumulatedTime = 0;

              // Invoke onComplete callback
              if (anim.onComplete) {
                try {
                  anim.onComplete(entity, anim.clipName);
                } catch (error) {
                  console.error('Error in onComplete callback:', error);
                }
              }
              break;
            } else {
              anim.frameIndex = nextFrameIndex;

              // Invoke onFrame callback
              if (anim.onFrame) {
                try {
                  anim.onFrame(entity, anim.clipName, anim.frameIndex);
                } catch (error) {
                  console.error('Error in onFrame callback:', error);
                }
              }
            }
          } else if (anim.loopMode === 'loop') {
            // Wrap to beginning
            if (nextFrameIndex >= clip.frames.length) {
              anim.frameIndex = 0;

              // Invoke onLoop callback
              if (anim.onLoop) {
                try {
                  anim.onLoop(entity, anim.clipName);
                } catch (error) {
                  console.error('Error in onLoop callback:', error);
                }
              }
            } else if (nextFrameIndex < 0) {
              anim.frameIndex = clip.frames.length - 1;

              // Invoke onLoop callback
              if (anim.onLoop) {
                try {
                  anim.onLoop(entity, anim.clipName);
                } catch (error) {
                  console.error('Error in onLoop callback:', error);
                }
              }
            } else {
              anim.frameIndex = nextFrameIndex;
            }

            // Invoke onFrame callback
            if (anim.onFrame) {
              try {
                anim.onFrame(entity, anim.clipName, anim.frameIndex);
              } catch (error) {
                console.error('Error in onFrame callback:', error);
              }
            }
          } else if (anim.loopMode === 'ping-pong') {
            // Reverse direction at boundaries
            if (nextFrameIndex >= clip.frames.length) {
              anim.direction = -1;
              anim.frameIndex = clip.frames.length - 2;

              // Invoke onLoop callback
              if (anim.onLoop) {
                try {
                  anim.onLoop(entity, anim.clipName);
                } catch (error) {
                  console.error('Error in onLoop callback:', error);
                }
              }
            } else if (nextFrameIndex < 0) {
              anim.direction = 1;
              anim.frameIndex = 1;

              // Invoke onLoop callback
              if (anim.onLoop) {
                try {
                  anim.onLoop(entity, anim.clipName);
                } catch (error) {
                  console.error('Error in onLoop callback:', error);
                }
              }
            } else {
              anim.frameIndex = nextFrameIndex;
            }

            // Invoke onFrame callback
            if (anim.onFrame) {
              try {
                anim.onFrame(entity, anim.clipName, anim.frameIndex);
              } catch (error) {
                console.error('Error in onFrame callback:', error);
              }
            }
          }
        }
      }
    },
  };
}

/**
 * Get the duration for the current frame
 */
function getCurrentFrameDuration(
  clip: { frames: Array<{ duration?: number }>; defaultFrameDuration: number },
  frameIndex: number
): number {
  const frame = clip.frames[frameIndex];
  return frame?.duration ?? clip.defaultFrameDuration;
}
