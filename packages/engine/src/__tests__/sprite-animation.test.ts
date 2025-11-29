import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { AnimationManager } from '../animation/sprite/AnimationManager';
import { TextureAtlas } from '../rendering/TextureAtlas';
import type { AnimationClip, AnimationFrame } from '../animation/sprite/types';
import type { Texture, TextureAtlasDefinition } from '../rendering/types';

const testConfig = { numRuns: 100 };

// Helper to create a mock texture
function createMockTexture(id: string): Texture {
  return {
    id,
    width: 256,
    height: 256,
    source: null,
  };
}

// Helper to create a texture atlas with specified frame names
function createTestAtlas(frameNames: string[]): TextureAtlas {
  const texture = createMockTexture('test-texture');
  const frames: TextureAtlasDefinition = {};

  frameNames.forEach((name, index) => {
    frames[name] = {
      x: (index % 4) * 64,
      y: Math.floor(index / 4) * 64,
      width: 64,
      height: 64,
    };
  });

  return new TextureAtlas(texture, frames);
}

describe('SpriteAnimation - AnimationManager', () => {
  describe('Property 1: Animation clip registration validates frame references', () => {
    // Feature: sprite-frame-animation, Property 1: Animation clip registration validates frame references
    it('should accept clips where all frame names exist in atlas', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 10 }),
          fc.float({ min: Math.fround(0.05), max: Math.fround(0.5) }),
          fc.float({ min: Math.fround(0.5), max: Math.fround(2.0) }),
          (frameNames, duration, speed) => {
            // Filter out problematic property names
            const safeFrameNames = frameNames.filter(
              (name) => name !== '__proto__' && name !== 'constructor' && name !== 'prototype'
            );
            fc.pre(safeFrameNames.length >= 2);

            // Create atlas with all frame names
            const atlas = createTestAtlas(safeFrameNames);
            const manager = new AnimationManager();

            const frames: AnimationFrame[] = safeFrameNames.map((name) => ({
              frameName: name,
            }));

            const clip: AnimationClip = {
              name: 'test-clip',
              atlas,
              frames,
              defaultFrameDuration: duration,
              loopMode: 'loop',
              speed,
            };

            // Should not throw
            expect(() => manager.registerClip(clip)).not.toThrow();
            expect(manager.hasClip('test-clip')).toBe(true);
          }
        ),
        testConfig
      );
    });

    // Feature: sprite-frame-animation, Property 1: Animation clip registration validates frame references
    it('should reject clips where frame names do not exist in atlas', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.float({ min: Math.fround(0.05), max: Math.fround(0.5) }),
          fc.float({ min: Math.fround(0.5), max: Math.fround(2.0) }),
          (validFrameNames, invalidFrameName, duration, speed) => {
            // Ensure invalid frame name is not in valid names
            fc.pre(!validFrameNames.includes(invalidFrameName));

            // Create atlas with only valid frame names
            const atlas = createTestAtlas(validFrameNames);
            const manager = new AnimationManager();

            // Add invalid frame name to frames
            const frames: AnimationFrame[] = [
              ...validFrameNames.map((name) => ({ frameName: name })),
              { frameName: invalidFrameName },
            ];

            const clip: AnimationClip = {
              name: 'test-clip',
              atlas,
              frames,
              defaultFrameDuration: duration,
              loopMode: 'loop',
              speed,
            };

            // Should throw error about missing frame
            expect(() => manager.registerClip(clip)).toThrow(/not found in texture atlas/);
            expect(manager.hasClip('test-clip')).toBe(false);
          }
        ),
        testConfig
      );
    });

    it('should reject clips with non-positive default frame duration', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
          fc.float({ min: Math.fround(-1.0), max: Math.fround(0.0), noNaN: true }),
          (frameNames, invalidDuration) => {
            const safeFrameNames = frameNames.filter(
              (name) => name !== '__proto__' && name !== 'constructor' && name !== 'prototype'
            );
            fc.pre(safeFrameNames.length >= 2);

            const atlas = createTestAtlas(safeFrameNames);
            const manager = new AnimationManager();

            const frames: AnimationFrame[] = safeFrameNames.map((name) => ({
              frameName: name,
            }));

            const clip: AnimationClip = {
              name: 'test-clip',
              atlas,
              frames,
              defaultFrameDuration: invalidDuration,
              loopMode: 'loop',
              speed: 1.0,
            };

            expect(() => manager.registerClip(clip)).toThrow(/must be greater than zero/);
          }
        ),
        testConfig
      );
    });

    it('should reject clips with non-positive per-frame duration', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
          fc.float({ min: Math.fround(-1.0), max: Math.fround(0.0), noNaN: true }),
          (frameNames, invalidDuration) => {
            const safeFrameNames = frameNames.filter(
              (name) => name !== '__proto__' && name !== 'constructor' && name !== 'prototype'
            );
            fc.pre(safeFrameNames.length >= 2);

            const atlas = createTestAtlas(safeFrameNames);
            const manager = new AnimationManager();

            const frames: AnimationFrame[] = safeFrameNames.map((name, index) => ({
              frameName: name,
              duration: index === 0 ? invalidDuration : 0.1, // First frame has invalid duration
            }));

            const clip: AnimationClip = {
              name: 'test-clip',
              atlas,
              frames,
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: 1.0,
            };

            expect(() => manager.registerClip(clip)).toThrow(/must be greater than zero/);
          }
        ),
        testConfig
      );
    });

    it('should reject clips with non-positive speed', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
          fc.float({ min: Math.fround(-1.0), max: Math.fround(0.0), noNaN: true }),
          (frameNames, invalidSpeed) => {
            const safeFrameNames = frameNames.filter(
              (name) => name !== '__proto__' && name !== 'constructor' && name !== 'prototype'
            );
            fc.pre(safeFrameNames.length >= 2);

            const atlas = createTestAtlas(safeFrameNames);
            const manager = new AnimationManager();

            const frames: AnimationFrame[] = safeFrameNames.map((name) => ({
              frameName: name,
            }));

            const clip: AnimationClip = {
              name: 'test-clip',
              atlas,
              frames,
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: invalidSpeed,
            };

            expect(() => manager.registerClip(clip)).toThrow(/must be greater than zero/);
          }
        ),
        testConfig
      );
    });
  });

  describe('AnimationManager basic operations', () => {
    it('should allow frame reuse across multiple clips', () => {
      const frameNames = ['frame1', 'frame2', 'frame3'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const clip1: AnimationClip = {
        name: 'clip1',
        atlas,
        frames: [{ frameName: 'frame1' }, { frameName: 'frame2' }],
        defaultFrameDuration: 0.1,
        loopMode: 'loop',
        speed: 1.0,
      };

      const clip2: AnimationClip = {
        name: 'clip2',
        atlas,
        frames: [{ frameName: 'frame2' }, { frameName: 'frame3' }], // Reuses frame2
        defaultFrameDuration: 0.1,
        loopMode: 'loop',
        speed: 1.0,
      };

      manager.registerClip(clip1);
      manager.registerClip(clip2);

      expect(manager.hasClip('clip1')).toBe(true);
      expect(manager.hasClip('clip2')).toBe(true);
    });

    it('should list all registered clip names', () => {
      const frameNames = ['frame1', 'frame2'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const clip1: AnimationClip = {
        name: 'walk',
        atlas,
        frames: [{ frameName: 'frame1' }],
        defaultFrameDuration: 0.1,
        loopMode: 'loop',
        speed: 1.0,
      };

      const clip2: AnimationClip = {
        name: 'run',
        atlas,
        frames: [{ frameName: 'frame2' }],
        defaultFrameDuration: 0.1,
        loopMode: 'loop',
        speed: 1.0,
      };

      manager.registerClip(clip1);
      manager.registerClip(clip2);

      const clips = manager.listClips();
      expect(clips).toContain('walk');
      expect(clips).toContain('run');
      expect(clips).toHaveLength(2);
    });

    it('should unregister clips', () => {
      const frameNames = ['frame1'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const clip: AnimationClip = {
        name: 'test',
        atlas,
        frames: [{ frameName: 'frame1' }],
        defaultFrameDuration: 0.1,
        loopMode: 'loop',
        speed: 1.0,
      };

      manager.registerClip(clip);
      expect(manager.hasClip('test')).toBe(true);

      manager.unregisterClip('test');
      expect(manager.hasClip('test')).toBe(false);
    });
  });
});

import { World } from '../ecs/World';
import { SpriteAnimation } from '../animation/sprite/components';

describe('SpriteAnimation - Component', () => {
  describe('Property 2: Component initialization defaults', () => {
    // Feature: sprite-frame-animation, Property 2: Component initialization defaults
    it('should initialize with stopped state, frame 0, and zero accumulated time', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), (numComponents) => {
          const world = new World();

          // Create multiple entities with animation components
          for (let i = 0; i < numComponents; i++) {
            const entity = world.createEntity();
            const animData = SpriteAnimation.defaults!();
            world.addComponent(entity, SpriteAnimation, animData);

            const component = world.getComponent(entity, SpriteAnimation)!;

            // Verify initialization defaults
            expect(component).toBeDefined();
            expect(component.state).toBe('stopped');
            expect(component.frameIndex).toBe(0);
            expect(component.accumulatedTime).toBe(0);
            expect(component.speed).toBe(1.0);
            expect(component.loopMode).toBe('loop');
            expect(component.direction).toBe(1);
            expect(component.flipX).toBe(false);
            expect(component.flipY).toBe(false);
            expect(component.rotation).toBe(0);
            expect(component.clipName).toBe('');
          }
        }),
        testConfig
      );
    }, 10000);
  });

  describe('Property 3: Component state isolation', () => {
    // Feature: sprite-frame-animation, Property 3: Component state isolation
    it('should maintain independent state for each entity', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 100 }),
          fc.float({ min: Math.fround(0), max: Math.fround(10.0) }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(5.0) }),
          (clipName, frameIndex, accumulatedTime, speed) => {
            const world = new World();

            // Create two entities
            const entity1 = world.createEntity();
            const entity2 = world.createEntity();

            // Add animation components with default values
            world.addComponent(entity1, SpriteAnimation, SpriteAnimation.defaults!());
            world.addComponent(entity2, SpriteAnimation, SpriteAnimation.defaults!());

            // Modify entity1's animation state
            const anim1 = world.getComponent(entity1, SpriteAnimation)!;
            anim1.clipName = clipName;
            anim1.frameIndex = frameIndex;
            anim1.accumulatedTime = accumulatedTime;
            anim1.speed = speed;
            anim1.state = 'playing';

            // Verify entity2's state is unchanged
            const anim2 = world.getComponent(entity2, SpriteAnimation)!;
            expect(anim2.clipName).toBe('');
            expect(anim2.frameIndex).toBe(0);
            expect(anim2.accumulatedTime).toBe(0);
            expect(anim2.speed).toBe(1.0);
            expect(anim2.state).toBe('stopped');
          }
        ),
        testConfig
      );
    });
  });

  describe('Property 4: Component query completeness', () => {
    it('should return all required fields when querying component', () => {
      const world = new World();
      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      const component = world.getComponent(entity, SpriteAnimation)!;

      // Verify all required fields are present
      expect(component).toHaveProperty('frameIndex');
      expect(component).toHaveProperty('state');
      expect(component).toHaveProperty('accumulatedTime');
      expect(component).toHaveProperty('clipName');
      expect(component).toHaveProperty('speed');
      expect(component).toHaveProperty('loopMode');
      expect(component).toHaveProperty('direction');
      expect(component).toHaveProperty('flipX');
      expect(component).toHaveProperty('flipY');
      expect(component).toHaveProperty('rotation');
    });
  });
});

import {
  AnimationController,
  animationToDrawOptions,
} from '../animation/sprite/AnimationController';

describe('SpriteAnimation - AnimationController', () => {
  describe('Property 5: Play operation state transition', () => {
    // Feature: sprite-frame-animation, Property 5: Play operation state transition
    it('should set state to playing and reset frame to 0', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (frameNames, clipName) => {
            const safeFrameNames = frameNames.filter(
              (name) => name !== '__proto__' && name !== 'constructor' && name !== 'prototype'
            );
            fc.pre(safeFrameNames.length >= 2);

            const world = new World();
            const manager = new AnimationManager();
            const controller = new AnimationController(world, manager);

            // Register clip
            const atlas = createTestAtlas(safeFrameNames);
            const clip: AnimationClip = {
              name: clipName,
              atlas,
              frames: safeFrameNames.map((name) => ({ frameName: name })),
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: 1.0,
            };
            manager.registerClip(clip);

            // Create entity with animation component
            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            // Set to non-zero frame and non-stopped state
            const anim = world.getComponent(entity, SpriteAnimation)!;
            anim.frameIndex = 5;
            anim.state = 'paused';

            // Play the animation
            controller.play(entity, clipName);

            // Verify state
            expect(anim.state).toBe('playing');
            expect(anim.frameIndex).toBe(0);
            expect(anim.clipName).toBe(clipName);
          }
        ),
        testConfig
      );
    });
  });

  describe('Property 6: Pause preserves state', () => {
    // Feature: sprite-frame-animation, Property 6: Pause preserves state
    it('should set state to paused and preserve frame and time', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          fc.float({ min: Math.fround(0), max: Math.fround(1.0) }),
          (frameIndex, accumulatedTime) => {
            const world = new World();
            const manager = new AnimationManager();
            const controller = new AnimationController(world, manager);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            const anim = world.getComponent(entity, SpriteAnimation)!;
            anim.state = 'playing';
            anim.frameIndex = frameIndex;
            anim.accumulatedTime = accumulatedTime;

            // Pause
            controller.pause(entity);

            // Verify state is paused and frame/time preserved
            expect(anim.state).toBe('paused');
            expect(anim.frameIndex).toBe(frameIndex);
            expect(anim.accumulatedTime).toBe(accumulatedTime);
          }
        ),
        testConfig
      );
    });
  });

  describe('Property 7: Stop resets state', () => {
    // Feature: sprite-frame-animation, Property 7: Stop resets state
    it('should set state to stopped and reset frame and time to 0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(1.0) }),
          (frameIndex, accumulatedTime) => {
            const world = new World();
            const manager = new AnimationManager();
            const controller = new AnimationController(world, manager);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            const anim = world.getComponent(entity, SpriteAnimation)!;
            anim.state = 'playing';
            anim.frameIndex = frameIndex;
            anim.accumulatedTime = accumulatedTime;

            // Stop
            controller.stop(entity);

            // Verify state is stopped and frame/time reset
            expect(anim.state).toBe('stopped');
            expect(anim.frameIndex).toBe(0);
            expect(anim.accumulatedTime).toBe(0);
          }
        ),
        testConfig
      );
    });
  });

  describe('Property 8: Resume continues from paused state', () => {
    // Feature: sprite-frame-animation, Property 8: Resume continues from paused state
    it('should set state to playing and maintain frame and time', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          fc.float({ min: Math.fround(0), max: Math.fround(1.0) }),
          (frameIndex, accumulatedTime) => {
            const world = new World();
            const manager = new AnimationManager();
            const controller = new AnimationController(world, manager);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            const anim = world.getComponent(entity, SpriteAnimation)!;
            anim.state = 'paused';
            anim.frameIndex = frameIndex;
            anim.accumulatedTime = accumulatedTime;

            // Resume
            controller.resume(entity);

            // Verify state is playing and frame/time maintained
            expect(anim.state).toBe('playing');
            expect(anim.frameIndex).toBe(frameIndex);
            expect(anim.accumulatedTime).toBe(accumulatedTime);
          }
        ),
        testConfig
      );
    });
  });

  describe('AnimationController additional operations', () => {
    it('should set animation speed', () => {
      const world = new World();
      const manager = new AnimationManager();
      const controller = new AnimationController(world, manager);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      controller.setSpeed(entity, 2.0);

      const anim = world.getComponent(entity, SpriteAnimation)!;
      expect(anim.speed).toBe(2.0);
    });

    it('should reject non-positive speed', () => {
      const world = new World();
      const manager = new AnimationManager();
      const controller = new AnimationController(world, manager);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      expect(() => controller.setSpeed(entity, 0)).toThrow(/must be greater than zero/);
      expect(() => controller.setSpeed(entity, -1)).toThrow(/must be greater than zero/);
    });

    it('should set loop mode', () => {
      const world = new World();
      const manager = new AnimationManager();
      const controller = new AnimationController(world, manager);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      controller.setLoopMode(entity, 'none');

      const anim = world.getComponent(entity, SpriteAnimation)!;
      expect(anim.loopMode).toBe('none');
    });

    it('should set flip transforms', () => {
      const world = new World();
      const manager = new AnimationManager();
      const controller = new AnimationController(world, manager);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      controller.setFlip(entity, true, false);

      const anim = world.getComponent(entity, SpriteAnimation)!;
      expect(anim.flipX).toBe(true);
      expect(anim.flipY).toBe(false);
    });

    it('should set rotation', () => {
      const world = new World();
      const manager = new AnimationManager();
      const controller = new AnimationController(world, manager);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      controller.setRotation(entity, Math.PI / 2);

      const anim = world.getComponent(entity, SpriteAnimation)!;
      expect(anim.rotation).toBe(Math.PI / 2);
    });

    it('should get current frame texture region', () => {
      const frameNames = ['frame1', 'frame2'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const clip: AnimationClip = {
        name: 'test',
        atlas,
        frames: frameNames.map((name) => ({ frameName: name })),
        defaultFrameDuration: 0.1,
        loopMode: 'loop',
        speed: 1.0,
      };
      manager.registerClip(clip);

      const world = new World();
      const controller = new AnimationController(world, manager);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      controller.play(entity, 'test');

      const region = controller.getCurrentFrame(entity);
      expect(region).toBeDefined();
      expect(region?.texture).toBeDefined();
    });

    it('should step through frames manually', () => {
      const frameNames = ['frame1', 'frame2', 'frame3'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const clip: AnimationClip = {
        name: 'test',
        atlas,
        frames: frameNames.map((name) => ({ frameName: name })),
        defaultFrameDuration: 0.1,
        loopMode: 'loop',
        speed: 1.0,
      };
      manager.registerClip(clip);

      const world = new World();
      const controller = new AnimationController(world, manager);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      controller.play(entity, 'test');

      const anim = world.getComponent(entity, SpriteAnimation)!;
      expect(anim.frameIndex).toBe(0);

      controller.step(entity, 1);
      expect(anim.frameIndex).toBe(1);

      controller.step(entity, -1);
      expect(anim.frameIndex).toBe(0);
    });
  });
});

import { createSpriteAnimationSystem } from '../animation/sprite/SpriteAnimationSystem';

describe('SpriteAnimation - System', () => {
  describe('Property 9: Time accumulation for playing animations', () => {
    // Feature: sprite-frame-animation, Property 9: Time accumulation for playing animations
    it('should accumulate time with delta * speed for playing animations', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.001), max: Math.fround(0.1), noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(2.0), noNaN: true }),
          (delta, speed) => {
            const frameNames = ['frame1', 'frame2'];
            const atlas = createTestAtlas(frameNames);
            const manager = new AnimationManager();

            const clip: AnimationClip = {
              name: 'test',
              atlas,
              frames: frameNames.map((name) => ({ frameName: name })),
              defaultFrameDuration: 1.0, // Long duration so we don't advance frames
              loopMode: 'loop',
              speed: 1.0,
            };
            manager.registerClip(clip);

            const world = new World();
            const system = createSpriteAnimationSystem(manager);
            world.registerSystem(system);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            const anim = world.getComponent(entity, SpriteAnimation)!;
            anim.clipName = 'test';
            anim.state = 'playing';
            anim.speed = speed;
            anim.accumulatedTime = 0;

            // Execute system
            world.step(delta);

            // Verify time accumulation
            const expectedTime = delta * speed;
            expect(anim.accumulatedTime).toBeCloseTo(expectedTime, 5);
          }
        ),
        testConfig
      );
    });
  });

  describe('Property 10: Paused animations do not accumulate time', () => {
    // Feature: sprite-frame-animation, Property 10: Paused animations do not accumulate time
    it('should not accumulate time for paused animations', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.001), max: Math.fround(0.1) }),
          fc.float({ min: Math.fround(0), max: Math.fround(1.0) }),
          (delta, initialTime) => {
            const frameNames = ['frame1', 'frame2'];
            const atlas = createTestAtlas(frameNames);
            const manager = new AnimationManager();

            const clip: AnimationClip = {
              name: 'test',
              atlas,
              frames: frameNames.map((name) => ({ frameName: name })),
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: 1.0,
            };
            manager.registerClip(clip);

            const world = new World();
            const system = createSpriteAnimationSystem(manager);
            world.registerSystem(system);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            const anim = world.getComponent(entity, SpriteAnimation)!;
            anim.clipName = 'test';
            anim.state = 'paused';
            anim.accumulatedTime = initialTime;

            // Execute system
            world.step(delta);

            // Verify time did not change
            expect(anim.accumulatedTime).toBe(initialTime);
          }
        ),
        testConfig
      );
    });
  });

  describe('Property 11: Frame advancement with time accumulation', () => {
    // Feature: sprite-frame-animation, Property 11: Frame advancement with time accumulation
    it('should advance frames when accumulated time exceeds duration', () => {
      const frameNames = ['frame1', 'frame2', 'frame3'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const frameDuration = 0.1;
      const clip: AnimationClip = {
        name: 'test',
        atlas,
        frames: frameNames.map((name) => ({ frameName: name })),
        defaultFrameDuration: frameDuration,
        loopMode: 'loop',
        speed: 1.0,
      };
      manager.registerClip(clip);

      const world = new World();
      const system = createSpriteAnimationSystem(manager);
      world.registerSystem(system);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      const anim = world.getComponent(entity, SpriteAnimation)!;
      anim.clipName = 'test';
      anim.state = 'playing';
      anim.frameIndex = 0;

      // Advance by 2.5 frame durations
      world.step(frameDuration * 2.5);

      // Should advance 2 frames
      expect(anim.frameIndex).toBe(2);
      expect(anim.accumulatedTime).toBeCloseTo(frameDuration * 0.5, 5);
    });
  });

  describe('Property 12: Animation speed affects frame rate', () => {
    // Feature: sprite-frame-animation, Property 12: Animation speed affects frame rate
    it('should advance frames faster with higher speed', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.5), max: Math.fround(2.5), noNaN: true }),
          (speed) => {
            const frameNames = ['frame1', 'frame2', 'frame3', 'frame4', 'frame5'];
            const atlas = createTestAtlas(frameNames);
            const manager = new AnimationManager();

            const frameDuration = 0.1;
            const clip: AnimationClip = {
              name: 'test',
              atlas,
              frames: frameNames.map((name) => ({ frameName: name })),
              defaultFrameDuration: frameDuration,
              loopMode: 'loop',
              speed: 1.0,
            };
            manager.registerClip(clip);

            const world = new World();
            const system = createSpriteAnimationSystem(manager);
            world.registerSystem(system);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            const anim = world.getComponent(entity, SpriteAnimation)!;
            anim.clipName = 'test';
            anim.state = 'playing';
            anim.speed = speed;
            anim.frameIndex = 0;

            // Advance by exactly one frame duration (at speed 1.0)
            world.step(frameDuration);

            // With speed multiplier, accumulated time should be frameDuration * speed
            // Expected frames advanced = floor(frameDuration * speed / frameDuration) = floor(speed)
            const expectedFrames = Math.floor(speed);

            if (speed >= 1.0) {
              expect(anim.frameIndex).toBeGreaterThanOrEqual(expectedFrames);
            } else {
              expect(anim.frameIndex).toBe(0);
              expect(anim.accumulatedTime).toBeCloseTo(frameDuration * speed, 5);
            }
          }
        ),
        testConfig
      );
    });
  });

  describe('Property 13: Loop mode wraps to frame zero', () => {
    // Feature: sprite-frame-animation, Property 13: Loop mode wraps to frame zero
    it('should wrap to frame 0 when exceeding last frame in loop mode', () => {
      const frameNames = ['frame1', 'frame2', 'frame3'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const frameDuration = 0.1;
      const clip: AnimationClip = {
        name: 'test',
        atlas,
        frames: frameNames.map((name) => ({ frameName: name })),
        defaultFrameDuration: frameDuration,
        loopMode: 'loop',
        speed: 1.0,
      };
      manager.registerClip(clip);

      const world = new World();
      const system = createSpriteAnimationSystem(manager);
      world.registerSystem(system);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      const anim = world.getComponent(entity, SpriteAnimation)!;
      anim.clipName = 'test';
      anim.state = 'playing';
      anim.loopMode = 'loop';
      anim.frameIndex = 2; // Last frame

      // Advance past last frame
      world.step(frameDuration * 1.5);

      // Should wrap to frame 0
      expect(anim.frameIndex).toBe(0);
      expect(anim.state).toBe('playing');
    });
  });

  describe('Property 14: None mode stops at final frame', () => {
    // Feature: sprite-frame-animation, Property 14: None mode stops at final frame
    it('should stop at final frame in none mode', () => {
      const frameNames = ['frame1', 'frame2', 'frame3'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const frameDuration = 0.1;
      const clip: AnimationClip = {
        name: 'test',
        atlas,
        frames: frameNames.map((name) => ({ frameName: name })),
        defaultFrameDuration: frameDuration,
        loopMode: 'none',
        speed: 1.0,
      };
      manager.registerClip(clip);

      const world = new World();
      const system = createSpriteAnimationSystem(manager);
      world.registerSystem(system);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      const anim = world.getComponent(entity, SpriteAnimation)!;
      anim.clipName = 'test';
      anim.state = 'playing';
      anim.loopMode = 'none';
      anim.frameIndex = 2; // Last frame

      // Advance past last frame
      world.step(frameDuration * 2);

      // Should stop at final frame
      expect(anim.frameIndex).toBe(2);
      expect(anim.state).toBe('stopped');
    });
  });

  describe('Property 15: Ping-pong reverses direction at boundaries', () => {
    // Feature: sprite-frame-animation, Property 15: Ping-pong reverses direction at boundaries
    it('should reverse direction at boundaries in ping-pong mode', () => {
      const frameNames = ['frame1', 'frame2', 'frame3'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const frameDuration = 0.1;
      const clip: AnimationClip = {
        name: 'test',
        atlas,
        frames: frameNames.map((name) => ({ frameName: name })),
        defaultFrameDuration: frameDuration,
        loopMode: 'ping-pong',
        speed: 1.0,
      };
      manager.registerClip(clip);

      const world = new World();
      const system = createSpriteAnimationSystem(manager);
      world.registerSystem(system);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      const anim = world.getComponent(entity, SpriteAnimation)!;
      anim.clipName = 'test';
      anim.state = 'playing';
      anim.loopMode = 'ping-pong';
      anim.frameIndex = 2; // Last frame
      anim.direction = 1;

      // Advance past last frame
      world.step(frameDuration * 1.5);

      // Should reverse direction and go backwards
      expect(anim.direction).toBe(-1);
      expect(anim.frameIndex).toBe(1);
    });
  });

  describe('Animation event callbacks', () => {
    it('should invoke onLoop callback when wrapping in loop mode', () => {
      const frameNames = ['frame1', 'frame2'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const frameDuration = 0.1;
      const clip: AnimationClip = {
        name: 'test',
        atlas,
        frames: frameNames.map((name) => ({ frameName: name })),
        defaultFrameDuration: frameDuration,
        loopMode: 'loop',
        speed: 1.0,
      };
      manager.registerClip(clip);

      const world = new World();
      const system = createSpriteAnimationSystem(manager);
      world.registerSystem(system);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      const anim = world.getComponent(entity, SpriteAnimation)!;
      anim.clipName = 'test';
      anim.state = 'playing';
      anim.loopMode = 'loop';
      anim.frameIndex = 1; // Last frame

      let loopCalled = false;
      anim.onLoop = () => {
        loopCalled = true;
      };

      // Advance past last frame
      world.step(frameDuration * 1.5);

      expect(loopCalled).toBe(true);
    });

    it('should invoke onComplete callback when stopping in none mode', () => {
      const frameNames = ['frame1', 'frame2'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const frameDuration = 0.1;
      const clip: AnimationClip = {
        name: 'test',
        atlas,
        frames: frameNames.map((name) => ({ frameName: name })),
        defaultFrameDuration: frameDuration,
        loopMode: 'none',
        speed: 1.0,
      };
      manager.registerClip(clip);

      const world = new World();
      const system = createSpriteAnimationSystem(manager);
      world.registerSystem(system);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      const anim = world.getComponent(entity, SpriteAnimation)!;
      anim.clipName = 'test';
      anim.state = 'playing';
      anim.loopMode = 'none';
      anim.frameIndex = 1; // Last frame

      let completeCalled = false;
      anim.onComplete = () => {
        completeCalled = true;
      };

      // Advance past last frame
      world.step(frameDuration * 1.5);

      expect(completeCalled).toBe(true);
    });

    it('should invoke onFrame callback when frame changes', () => {
      const frameNames = ['frame1', 'frame2', 'frame3'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const frameDuration = 0.1;
      const clip: AnimationClip = {
        name: 'test',
        atlas,
        frames: frameNames.map((name) => ({ frameName: name })),
        defaultFrameDuration: frameDuration,
        loopMode: 'loop',
        speed: 1.0,
      };
      manager.registerClip(clip);

      const world = new World();
      const system = createSpriteAnimationSystem(manager);
      world.registerSystem(system);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      const anim = world.getComponent(entity, SpriteAnimation)!;
      anim.clipName = 'test';
      anim.state = 'playing';
      anim.frameIndex = 0;

      const frameCalls: number[] = [];
      anim.onFrame = (_entity, _clipName, frameIndex) => {
        frameCalls.push(frameIndex);
      };

      // Advance by 2 frames
      world.step(frameDuration * 2);

      expect(frameCalls).toContain(1);
      expect(frameCalls).toContain(2);
    });

    it('should handle callback errors gracefully', () => {
      const frameNames = ['frame1', 'frame2'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const frameDuration = 0.1;
      const clip: AnimationClip = {
        name: 'test',
        atlas,
        frames: frameNames.map((name) => ({ frameName: name })),
        defaultFrameDuration: frameDuration,
        loopMode: 'loop',
        speed: 1.0,
      };
      manager.registerClip(clip);

      const world = new World();
      const system = createSpriteAnimationSystem(manager);
      world.registerSystem(system);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      const anim = world.getComponent(entity, SpriteAnimation)!;
      anim.clipName = 'test';
      anim.state = 'playing';
      anim.frameIndex = 0;

      // Callback that throws
      anim.onFrame = () => {
        throw new Error('Test error');
      };

      // Should not throw, system should continue
      expect(() => world.step(frameDuration * 1.5)).not.toThrow();
    });
  });
});

describe('SpriteAnimation - Rendering Integration', () => {
  describe('Property 21: Flip transforms affect rendering', () => {
    // Feature: sprite-frame-animation, Property 21: Flip transforms affect rendering
    it('should apply flip transforms to draw options', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          fc.float({ min: 0, max: Math.fround(Math.PI * 2) }),
          (flipX, flipY, rotation) => {
            const world = new World();
            const atlas = createTestAtlas(['frame1', 'frame2']);
            const manager = new AnimationManager();

            const clip: AnimationClip = {
              name: 'test-clip',
              atlas,
              frames: [{ frameName: 'frame1' }, { frameName: 'frame2' }],
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: 1.0,
            };

            manager.registerClip(clip);
            const controller = new AnimationController(world, manager);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            controller.play(entity, 'test-clip');
            controller.setFlip(entity, flipX, flipY);
            controller.setRotation(entity, rotation);

            const anim = world.getComponent(entity, SpriteAnimation);
            expect(anim).toBeDefined();
            expect(anim!.flipX).toBe(flipX);
            expect(anim!.flipY).toBe(flipY);
            expect(anim!.rotation).toBe(rotation);

            // Verify that animationToDrawOptions includes flip state
            const drawOptions = animationToDrawOptions(anim!, { x: 0, y: 0 });
            expect(drawOptions.flipX).toBe(flipX);
            expect(drawOptions.flipY).toBe(flipY);
            expect(drawOptions.rotation).toBe(rotation);
          }
        ),
        testConfig
      );
    });
  });

  describe('Property 22: Current frame provides texture region', () => {
    // Feature: sprite-frame-animation, Property 22: Current frame provides texture region
    it('should return valid texture region for current frame', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (frameNames, frameIndexSeed) => {
            const safeFrameNames = frameNames.filter(
              (name) => name !== '__proto__' && name !== 'constructor' && name !== 'prototype'
            );
            fc.pre(safeFrameNames.length >= 2);

            const world = new World();
            const atlas = createTestAtlas(safeFrameNames);
            const manager = new AnimationManager();

            const clip: AnimationClip = {
              name: 'test-clip',
              atlas,
              frames: safeFrameNames.map((name) => ({ frameName: name })),
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: 1.0,
            };

            manager.registerClip(clip);
            const controller = new AnimationController(world, manager);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());
            controller.play(entity, 'test-clip');

            // Set frame index to a valid value
            const anim = world.getComponent(entity, SpriteAnimation);
            if (!anim) {
              throw new Error('Animation component not found after adding');
            }
            const frameIndex = frameIndexSeed % safeFrameNames.length;
            anim.frameIndex = frameIndex;

            const region = controller.getCurrentFrame(entity);
            expect(region).toBeDefined();
            expect(region!.texture).toBeDefined();
            expect(region!.width).toBeGreaterThan(0);
            expect(region!.height).toBeGreaterThan(0);
          }
        ),
        testConfig
      );
    });
  });

  describe('Property 23: Invalid clip references are handled gracefully', () => {
    // Feature: sprite-frame-animation, Property 23: Invalid clip references are handled gracefully
    it('should return undefined for invalid clip name', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 20 }), (invalidClipName) => {
          fc.pre(invalidClipName !== 'test-clip');

          const world = new World();
          const atlas = createTestAtlas(['frame1', 'frame2']);
          const manager = new AnimationManager();

          const clip: AnimationClip = {
            name: 'test-clip',
            atlas,
            frames: [{ frameName: 'frame1' }, { frameName: 'frame2' }],
            defaultFrameDuration: 0.1,
            loopMode: 'loop',
            speed: 1.0,
          };

          manager.registerClip(clip);
          const controller = new AnimationController(world, manager);

          const entity = world.createEntity();
          world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

          // Set invalid clip name
          const anim = world.getComponent(entity, SpriteAnimation);
          if (!anim) {
            throw new Error('Animation component not found after adding');
          }
          anim.clipName = invalidClipName;

          const region = controller.getCurrentFrame(entity);
          expect(region).toBeUndefined();
        }),
        testConfig
      );
    });

    // Feature: sprite-frame-animation, Property 23: Invalid clip references are handled gracefully
    it('should return undefined for out-of-bounds frame index', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 100 }), (invalidFrameIndex) => {
          const world = new World();
          const atlas = createTestAtlas(['frame1', 'frame2']);
          const manager = new AnimationManager();

          const clip: AnimationClip = {
            name: 'test-clip',
            atlas,
            frames: [{ frameName: 'frame1' }, { frameName: 'frame2' }],
            defaultFrameDuration: 0.1,
            loopMode: 'loop',
            speed: 1.0,
          };

          manager.registerClip(clip);
          const controller = new AnimationController(world, manager);

          const entity = world.createEntity();
          world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());
          controller.play(entity, 'test-clip');

          // Set invalid frame index
          const anim = world.getComponent(entity, SpriteAnimation);
          if (!anim) {
            throw new Error('Animation component not found after adding');
          }
          anim.frameIndex = invalidFrameIndex;

          const region = controller.getCurrentFrame(entity);
          expect(region).toBeUndefined();
        }),
        testConfig
      );
    });

    // Feature: sprite-frame-animation, Property 23: Invalid clip references are handled gracefully
    it('should return undefined for entity without animation component', () => {
      const world = new World();
      const atlas = createTestAtlas(['frame1', 'frame2']);
      const manager = new AnimationManager();

      const clip: AnimationClip = {
        name: 'test-clip',
        atlas,
        frames: [{ frameName: 'frame1' }, { frameName: 'frame2' }],
        defaultFrameDuration: 0.1,
        loopMode: 'loop',
        speed: 1.0,
      };

      manager.registerClip(clip);
      const controller = new AnimationController(world, manager);

      const entity = world.createEntity();
      // Don't add animation component

      const region = controller.getCurrentFrame(entity);
      expect(region).toBeUndefined();
    });
  });
});

describe('SpriteAnimation - Per-Frame Durations', () => {
  describe('Property 24: Per-frame durations are used correctly', () => {
    // Feature: sprite-frame-animation, Property 24: Per-frame durations are used correctly
    it('should use per-frame duration when specified', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.05), max: Math.fround(0.2), noNaN: true }),
          fc.float({ min: Math.fround(0.3), max: Math.fround(0.5), noNaN: true }),
          (perFrameDuration, defaultDuration) => {
            const frameNames = ['frame1', 'frame2', 'frame3'];
            const atlas = createTestAtlas(frameNames);
            const manager = new AnimationManager();

            // Create clip with per-frame duration on first frame
            const clip: AnimationClip = {
              name: 'test-clip',
              atlas,
              frames: [
                { frameName: 'frame1', duration: perFrameDuration },
                { frameName: 'frame2' }, // Uses default
                { frameName: 'frame3' }, // Uses default
              ],
              defaultFrameDuration: defaultDuration,
              loopMode: 'loop',
              speed: 1.0,
            };

            manager.registerClip(clip);

            const world = new World();
            const system = createSpriteAnimationSystem(manager);
            world.registerSystem(system);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            const anim = world.getComponent(entity, SpriteAnimation)!;
            anim.clipName = 'test-clip';
            anim.state = 'playing';
            anim.frameIndex = 0;
            anim.accumulatedTime = 0;

            // Step with exactly the per-frame duration
            world.step(perFrameDuration);

            // Should advance to frame 1
            expect(anim.frameIndex).toBe(1);
            expect(anim.accumulatedTime).toBeCloseTo(0, 5);
          }
        ),
        testConfig
      );
    });
  });

  describe('Property 25: Default duration fallback', () => {
    // Feature: sprite-frame-animation, Property 25: Default duration fallback
    it('should use default duration when per-frame duration not specified', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.1), max: Math.fround(0.5), noNaN: true }),
          (defaultDuration) => {
            const frameNames = ['frame1', 'frame2', 'frame3'];
            const atlas = createTestAtlas(frameNames);
            const manager = new AnimationManager();

            // Create clip without per-frame durations
            const clip: AnimationClip = {
              name: 'test-clip',
              atlas,
              frames: frameNames.map((name) => ({ frameName: name })),
              defaultFrameDuration: defaultDuration,
              loopMode: 'loop',
              speed: 1.0,
            };

            manager.registerClip(clip);

            const world = new World();
            const system = createSpriteAnimationSystem(manager);
            world.registerSystem(system);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            const anim = world.getComponent(entity, SpriteAnimation)!;
            anim.clipName = 'test-clip';
            anim.state = 'playing';
            anim.frameIndex = 0;
            anim.accumulatedTime = 0;

            // Step with exactly the default duration
            world.step(defaultDuration);

            // Should advance to frame 1
            expect(anim.frameIndex).toBe(1);
            expect(anim.accumulatedTime).toBeCloseTo(0, 5);
          }
        ),
        testConfig
      );
    });
  });

  describe('Property 26: Variable duration frame advancement', () => {
    // Feature: sprite-frame-animation, Property 26: Variable duration frame advancement
    it('should correctly advance through frames with different durations', () => {
      const frameNames = ['frame1', 'frame2', 'frame3'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const duration1 = 0.1;
      const duration2 = 0.2;
      const duration3 = 0.15;

      // Create clip with different per-frame durations
      const clip: AnimationClip = {
        name: 'test-clip',
        atlas,
        frames: [
          { frameName: 'frame1', duration: duration1 },
          { frameName: 'frame2', duration: duration2 },
          { frameName: 'frame3', duration: duration3 },
        ],
        defaultFrameDuration: 0.1,
        loopMode: 'loop',
        speed: 1.0,
      };

      manager.registerClip(clip);

      const world = new World();
      const system = createSpriteAnimationSystem(manager);
      world.registerSystem(system);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      const anim = world.getComponent(entity, SpriteAnimation)!;
      anim.clipName = 'test-clip';
      anim.state = 'playing';
      anim.frameIndex = 0;
      anim.accumulatedTime = 0;

      // Advance through frame 1 (duration 0.1)
      world.step(duration1);
      expect(anim.frameIndex).toBe(1);

      // Advance through frame 2 (duration 0.2)
      world.step(duration2);
      expect(anim.frameIndex).toBe(2);

      // Advance through frame 3 (duration 0.15) - should wrap to frame 0
      world.step(duration3);
      expect(anim.frameIndex).toBe(0);
    });

    // Feature: sprite-frame-animation, Property 26: Variable duration frame advancement
    it('should handle accumulated time correctly across variable durations', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.05), max: Math.fround(0.1), noNaN: true }),
          fc.float({ min: Math.fround(0.15), max: Math.fround(0.25), noNaN: true }),
          fc.float({ min: Math.fround(0.3), max: Math.fround(0.5), noNaN: true }),
          (duration1, duration2, largeDelta) => {
            const frameNames = ['frame1', 'frame2'];
            const atlas = createTestAtlas(frameNames);
            const manager = new AnimationManager();

            const clip: AnimationClip = {
              name: 'test-clip',
              atlas,
              frames: [
                { frameName: 'frame1', duration: duration1 },
                { frameName: 'frame2', duration: duration2 },
              ],
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: 1.0,
            };

            manager.registerClip(clip);

            const world = new World();
            const system = createSpriteAnimationSystem(manager);
            world.registerSystem(system);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            const anim = world.getComponent(entity, SpriteAnimation)!;
            anim.clipName = 'test-clip';
            anim.state = 'playing';
            anim.frameIndex = 0;
            anim.accumulatedTime = 0;

            // Step with a large delta that should advance multiple frames
            world.step(largeDelta);

            // Calculate expected frame and accumulated time
            let expectedTime = largeDelta;
            let expectedFrame = 0;

            // Advance through frames with loop wrapping
            while (expectedTime >= (expectedFrame === 0 ? duration1 : duration2)) {
              if (expectedFrame === 0) {
                expectedTime -= duration1;
                expectedFrame = 1;
              } else {
                expectedTime -= duration2;
                expectedFrame = 0; // Wrap back to frame 0
              }
            }

            expect(anim.frameIndex).toBe(expectedFrame);
            expect(anim.accumulatedTime).toBeCloseTo(expectedTime, 4);
          }
        ),
        testConfig
      );
    });
  });
});

describe('SpriteAnimation - Transitions', () => {
  describe('Property 27: Transition completion switches clips', () => {
    // Feature: sprite-frame-animation, Property 27: Transition completion switches clips
    it('should switch to target clip after transition duration elapses', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.1), max: Math.fround(0.5), noNaN: true }),
          (transitionDuration) => {
            const frameNames1 = ['clip1-frame1', 'clip1-frame2'];
            const frameNames2 = ['clip2-frame1', 'clip2-frame2'];
            const atlas = createTestAtlas([...frameNames1, ...frameNames2]);
            const manager = new AnimationManager();

            const clip1: AnimationClip = {
              name: 'clip1',
              atlas,
              frames: frameNames1.map((name) => ({ frameName: name })),
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: 1.0,
            };

            const clip2: AnimationClip = {
              name: 'clip2',
              atlas,
              frames: frameNames2.map((name) => ({ frameName: name })),
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: 1.0,
            };

            manager.registerClip(clip1);
            manager.registerClip(clip2);

            const world = new World();
            const system = createSpriteAnimationSystem(manager);
            world.registerSystem(system);
            const controller = new AnimationController(world, manager);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            // Start with clip1
            controller.play(entity, 'clip1');

            // Initiate transition to clip2
            controller.transitionTo(entity, 'clip2', transitionDuration);

            const anim = world.getComponent(entity, SpriteAnimation)!;
            expect(anim.transition).toBeDefined();
            expect(anim.transition!.targetClip).toBe('clip2');

            // Step through transition duration
            world.step(transitionDuration);

            // Should have switched to clip2
            expect(anim.clipName).toBe('clip2');
            expect(anim.frameIndex).toBe(0);
            expect(anim.state).toBe('playing');
            expect(anim.transition).toBeUndefined();
          }
        ),
        testConfig
      );
    });

    // Feature: sprite-frame-animation, Property 27: Transition completion switches clips
    it('should invoke onTransitionComplete callback', () => {
      const frameNames1 = ['clip1-frame1'];
      const frameNames2 = ['clip2-frame1'];
      const atlas = createTestAtlas([...frameNames1, ...frameNames2]);
      const manager = new AnimationManager();

      const clip1: AnimationClip = {
        name: 'clip1',
        atlas,
        frames: frameNames1.map((name) => ({ frameName: name })),
        defaultFrameDuration: 0.1,
        loopMode: 'loop',
        speed: 1.0,
      };

      const clip2: AnimationClip = {
        name: 'clip2',
        atlas,
        frames: frameNames2.map((name) => ({ frameName: name })),
        defaultFrameDuration: 0.1,
        loopMode: 'loop',
        speed: 1.0,
      };

      manager.registerClip(clip1);
      manager.registerClip(clip2);

      const world = new World();
      const system = createSpriteAnimationSystem(manager);
      world.registerSystem(system);
      const controller = new AnimationController(world, manager);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      controller.play(entity, 'clip1');

      let callbackInvoked = false;
      let callbackTargetClip = '';

      const anim = world.getComponent(entity, SpriteAnimation)!;
      anim.onTransitionComplete = (_e, targetClip) => {
        callbackInvoked = true;
        callbackTargetClip = targetClip;
      };

      controller.transitionTo(entity, 'clip2', 0.2);

      // Step through transition
      world.step(0.2);

      expect(callbackInvoked).toBe(true);
      expect(callbackTargetClip).toBe('clip2');
    });
  });

  describe('Property 28: Transition interruption', () => {
    // Feature: sprite-frame-animation, Property 28: Transition interruption
    it('should cancel current transition when new transition is requested', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.2), max: Math.fround(0.5), noNaN: true }),
          fc.float({ min: Math.fround(0.05), max: Math.fround(0.15), noNaN: true }),
          (transitionDuration, partialTime) => {
            fc.pre(partialTime < transitionDuration);

            const frameNames1 = ['clip1-frame1'];
            const frameNames2 = ['clip2-frame1'];
            const frameNames3 = ['clip3-frame1'];
            const atlas = createTestAtlas([...frameNames1, ...frameNames2, ...frameNames3]);
            const manager = new AnimationManager();

            const clip1: AnimationClip = {
              name: 'clip1',
              atlas,
              frames: frameNames1.map((name) => ({ frameName: name })),
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: 1.0,
            };

            const clip2: AnimationClip = {
              name: 'clip2',
              atlas,
              frames: frameNames2.map((name) => ({ frameName: name })),
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: 1.0,
            };

            const clip3: AnimationClip = {
              name: 'clip3',
              atlas,
              frames: frameNames3.map((name) => ({ frameName: name })),
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: 1.0,
            };

            manager.registerClip(clip1);
            manager.registerClip(clip2);
            manager.registerClip(clip3);

            const world = new World();
            const system = createSpriteAnimationSystem(manager);
            world.registerSystem(system);
            const controller = new AnimationController(world, manager);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            controller.play(entity, 'clip1');

            // Start transition to clip2
            controller.transitionTo(entity, 'clip2', transitionDuration);

            // Partially advance the transition
            world.step(partialTime);

            const anim = world.getComponent(entity, SpriteAnimation)!;
            expect(anim.transition).toBeDefined();
            expect(anim.transition!.targetClip).toBe('clip2');

            // Interrupt with new transition to clip3
            controller.transitionTo(entity, 'clip3', transitionDuration);

            // Should have new transition
            expect(anim.transition).toBeDefined();
            expect(anim.transition!.targetClip).toBe('clip3');
            expect(anim.transition!.elapsed).toBe(0);

            // Complete the new transition
            world.step(transitionDuration);

            // Should end up on clip3, not clip2
            expect(anim.clipName).toBe('clip3');
            expect(anim.transition).toBeUndefined();
          }
        ),
        testConfig
      );
    });
  });
});

describe('SpriteAnimation - Development Tools', () => {
  describe('Property 29: Manual frame stepping', () => {
    // Feature: sprite-frame-animation, Property 29: Manual frame stepping
    it('should advance frame index by exactly 1 when stepping forward', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }),
          fc.integer({ min: 0, max: 5 }),
          (numFrames, startFrame) => {
            fc.pre(startFrame < numFrames - 1);

            const frameNames = Array.from({ length: numFrames }, (_, i) => `frame${i}`);
            const atlas = createTestAtlas(frameNames);
            const manager = new AnimationManager();

            const clip: AnimationClip = {
              name: 'test-clip',
              atlas,
              frames: frameNames.map((name) => ({ frameName: name })),
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: 1.0,
            };

            manager.registerClip(clip);

            const world = new World();
            const controller = new AnimationController(world, manager);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            controller.play(entity, 'test-clip');

            const anim = world.getComponent(entity, SpriteAnimation)!;
            anim.frameIndex = startFrame;

            // Step forward by 1
            controller.step(entity, 1);

            expect(anim.frameIndex).toBe(startFrame + 1);
          }
        ),
        testConfig
      );
    });

    // Feature: sprite-frame-animation, Property 29: Manual frame stepping
    it('should decrement frame index by exactly 1 when stepping backward', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }),
          fc.integer({ min: 1, max: 5 }),
          (numFrames, startFrame) => {
            fc.pre(startFrame < numFrames);

            const frameNames = Array.from({ length: numFrames }, (_, i) => `frame${i}`);
            const atlas = createTestAtlas(frameNames);
            const manager = new AnimationManager();

            const clip: AnimationClip = {
              name: 'test-clip',
              atlas,
              frames: frameNames.map((name) => ({ frameName: name })),
              defaultFrameDuration: 0.1,
              loopMode: 'loop',
              speed: 1.0,
            };

            manager.registerClip(clip);

            const world = new World();
            const controller = new AnimationController(world, manager);

            const entity = world.createEntity();
            world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

            controller.play(entity, 'test-clip');

            const anim = world.getComponent(entity, SpriteAnimation)!;
            anim.frameIndex = startFrame;

            // Step backward by 1
            controller.step(entity, -1);

            expect(anim.frameIndex).toBe(startFrame - 1);
          }
        ),
        testConfig
      );
    });

    // Feature: sprite-frame-animation, Property 29: Manual frame stepping
    it('should clamp frame index to valid range', () => {
      const frameNames = ['frame1', 'frame2', 'frame3'];
      const atlas = createTestAtlas(frameNames);
      const manager = new AnimationManager();

      const clip: AnimationClip = {
        name: 'test-clip',
        atlas,
        frames: frameNames.map((name) => ({ frameName: name })),
        defaultFrameDuration: 0.1,
        loopMode: 'loop',
        speed: 1.0,
      };

      manager.registerClip(clip);

      const world = new World();
      const controller = new AnimationController(world, manager);

      const entity = world.createEntity();
      world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

      controller.play(entity, 'test-clip');

      const anim = world.getComponent(entity, SpriteAnimation)!;

      // Try to step beyond last frame
      anim.frameIndex = 2;
      controller.step(entity, 10);
      expect(anim.frameIndex).toBe(2); // Clamped to last frame

      // Try to step before first frame
      anim.frameIndex = 0;
      controller.step(entity, -10);
      expect(anim.frameIndex).toBe(0); // Clamped to first frame
    });
  });
});

describe('SpriteAnimation - ECS Integration', () => {
  it('should handle multiple animated entities independently', () => {
    const frameNames = ['frame1', 'frame2', 'frame3'];
    const atlas = createTestAtlas(frameNames);
    const manager = new AnimationManager();

    const clip: AnimationClip = {
      name: 'test-clip',
      atlas,
      frames: frameNames.map((name) => ({ frameName: name })),
      defaultFrameDuration: 0.1,
      loopMode: 'loop',
      speed: 1.0,
    };

    manager.registerClip(clip);

    const world = new World();
    const system = createSpriteAnimationSystem(manager);
    world.registerSystem(system);
    const controller = new AnimationController(world, manager);

    // Create multiple entities
    const entity1 = world.createEntity();
    const entity2 = world.createEntity();
    const entity3 = world.createEntity();

    world.addComponent(entity1, SpriteAnimation, SpriteAnimation.defaults!());
    world.addComponent(entity2, SpriteAnimation, SpriteAnimation.defaults!());
    world.addComponent(entity3, SpriteAnimation, SpriteAnimation.defaults!());

    // Start animations at different states
    controller.play(entity1, 'test-clip');
    controller.play(entity2, 'test-clip');
    controller.play(entity3, 'test-clip');

    const anim1 = world.getComponent(entity1, SpriteAnimation)!;
    const anim2 = world.getComponent(entity2, SpriteAnimation)!;
    const anim3 = world.getComponent(entity3, SpriteAnimation)!;

    // Set different speeds
    anim1.speed = 1.0;
    anim2.speed = 2.0;
    anim3.speed = 0.5;

    // Update world
    world.step(0.1);

    // Entity 1 should advance 1 frame
    expect(anim1.frameIndex).toBe(1);

    // Entity 2 should advance 2 frames (faster speed)
    expect(anim2.frameIndex).toBe(2);

    // Entity 3 should stay on frame 0 (slower speed, not enough time)
    expect(anim3.frameIndex).toBe(0);
  });

  it('should handle entity lifecycle correctly', () => {
    const frameNames = ['frame1', 'frame2'];
    const atlas = createTestAtlas(frameNames);
    const manager = new AnimationManager();

    const clip: AnimationClip = {
      name: 'test-clip',
      atlas,
      frames: frameNames.map((name) => ({ frameName: name })),
      defaultFrameDuration: 0.1,
      loopMode: 'loop',
      speed: 1.0,
    };

    manager.registerClip(clip);

    const world = new World();
    const system = createSpriteAnimationSystem(manager);
    world.registerSystem(system);
    const controller = new AnimationController(world, manager);

    // Create entity with animation
    const entity = world.createEntity();
    world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());
    controller.play(entity, 'test-clip');

    // Update
    world.step(0.1);

    const anim = world.getComponent(entity, SpriteAnimation);
    expect(anim).toBeDefined();
    expect(anim!.frameIndex).toBe(1);

    // Destroy entity
    world.destroyEntity(entity);

    // System should handle destroyed entity gracefully
    expect(() => world.step(0.1)).not.toThrow();

    // Component should no longer exist
    const animAfterDestroy = world.getComponent(entity, SpriteAnimation);
    expect(animAfterDestroy).toBeUndefined();
  });

  it('should work with animation system in world update cycle', () => {
    const frameNames = ['frame1', 'frame2', 'frame3', 'frame4'];
    const atlas = createTestAtlas(frameNames);
    const manager = new AnimationManager();

    const clip: AnimationClip = {
      name: 'test-clip',
      atlas,
      frames: frameNames.map((name) => ({ frameName: name })),
      defaultFrameDuration: 0.05,
      loopMode: 'loop',
      speed: 1.0,
    };

    manager.registerClip(clip);

    const world = new World();
    const system = createSpriteAnimationSystem(manager);
    world.registerSystem(system);
    const controller = new AnimationController(world, manager);

    const entity = world.createEntity();
    world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());
    controller.play(entity, 'test-clip');

    // Simulate multiple update cycles
    for (let i = 0; i < 10; i++) {
      world.step(0.016); // ~60 FPS
    }

    const anim = world.getComponent(entity, SpriteAnimation)!;

    // Should have advanced through multiple frames
    expect(anim.frameIndex).toBeGreaterThan(0);
    expect(anim.state).toBe('playing');
  });
});
