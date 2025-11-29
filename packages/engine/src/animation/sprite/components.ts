import type { ComponentDefinition } from '../../ecs/types';
import type { SpriteAnimationData } from './types';

/**
 * Component for sprite frame animation state
 */
export const SpriteAnimation: ComponentDefinition<SpriteAnimationData> = {
  name: 'SpriteAnimation',
  defaults: () => ({
    clipName: '',
    frameIndex: 0,
    accumulatedTime: 0,
    state: 'stopped',
    speed: 1.0,
    loopMode: 'loop',
    direction: 1,
    flipX: false,
    flipY: false,
    rotation: 0,
  }),
};
