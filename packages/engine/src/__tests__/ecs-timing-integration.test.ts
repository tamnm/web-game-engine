import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { World, ComponentDefinition, System, SystemContext } from '../ecs/index.js';
import { TimeManager } from '../loop/TimeManager.js';

interface TestComponent {
  value: number;
}

const TestComponentDef: ComponentDefinition<TestComponent> = {
  name: 'test',
  defaults: () => ({ value: 0 }),
};

describe('ECS Timing Integration', () => {
  describe('Property-Based Tests', () => {
    // **Feature: game-loop-time-management, Property 12: ECS simulation timing**
    it('should provide same fixed delta to all update-stage systems', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: Math.fround(1), max: Math.fround(50), noNaN: true }), {
            minLength: 1,
            maxLength: 10,
          }),
          fc.float({ min: Math.fround(0.5), max: Math.fround(2), noNaN: true }),
          (frameDeltas, timeScale) => {
            const fixedDelta = 16.67;
            const timeManager = new TimeManager({ fixedDelta, timeScale });
            const world = new World();

            // Track deltas received by each system
            const system1Deltas: number[] = [];
            const system2Deltas: number[] = [];
            const system3Deltas: number[] = [];

            // Register multiple update-stage systems
            const system1: System = {
              id: 'system1',
              stage: 'update',
              execute: (context: SystemContext) => {
                system1Deltas.push(context.delta);
              },
            };

            const system2: System = {
              id: 'system2',
              stage: 'preUpdate',
              execute: (context: SystemContext) => {
                system2Deltas.push(context.delta);
              },
            };

            const system3: System = {
              id: 'system3',
              stage: 'postUpdate',
              execute: (context: SystemContext) => {
                system3Deltas.push(context.delta);
              },
            };

            world.registerSystem(system1);
            world.registerSystem(system2);
            world.registerSystem(system3);

            // Simulate frames
            for (const frameDelta of frameDeltas) {
              const steps = timeManager.update(frameDelta);

              for (let i = 0; i < steps; i++) {
                world.step(timeManager.getScaledDelta());
              }
            }

            // Verify all systems received the same deltas
            expect(system1Deltas.length).toBe(system2Deltas.length);
            expect(system1Deltas.length).toBe(system3Deltas.length);

            const expectedDelta = fixedDelta * timeScale;

            // Verify all deltas are the fixed delta * timeScale
            for (let i = 0; i < system1Deltas.length; i++) {
              expect(system1Deltas[i]).toBeCloseTo(expectedDelta, 5);
              expect(system2Deltas[i]).toBeCloseTo(expectedDelta, 5);
              expect(system3Deltas[i]).toBeCloseTo(expectedDelta, 5);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Feature: game-loop-time-management, Property 13: ECS render timing**
    it('should provide same interpolation alpha to all render-stage systems', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: Math.fround(1), max: Math.fround(50), noNaN: true }), {
            minLength: 1,
            maxLength: 10,
          }),
          (frameDeltas) => {
            const fixedDelta = 16.67;
            const timeManager = new TimeManager({ fixedDelta });
            const world = new World();

            // Track alphas received by each render system
            const renderSystem1Alphas: number[] = [];
            const renderSystem2Alphas: number[] = [];

            // Register multiple render-stage systems
            const renderSystem1: System = {
              id: 'render1',
              stage: 'render',
              execute: (context: SystemContext) => {
                if (context.alpha !== undefined) {
                  renderSystem1Alphas.push(context.alpha);
                }
              },
            };

            const renderSystem2: System = {
              id: 'render2',
              stage: 'render',
              execute: (context: SystemContext) => {
                if (context.alpha !== undefined) {
                  renderSystem2Alphas.push(context.alpha);
                }
              },
            };

            world.registerSystem(renderSystem1);
            world.registerSystem(renderSystem2);

            // Simulate frames
            for (const frameDelta of frameDeltas) {
              const steps = timeManager.update(frameDelta);

              // Execute simulation steps
              for (let i = 0; i < steps; i++) {
                world.step(timeManager.getScaledDelta());
              }

              // Execute render with interpolation
              const alpha = timeManager.getInterpolationAlpha();
              world.render(alpha);
            }

            // Verify both systems received the same number of render calls
            expect(renderSystem1Alphas.length).toBe(renderSystem2Alphas.length);
            expect(renderSystem1Alphas.length).toBe(frameDeltas.length);

            // Verify all alphas are the same for each frame
            for (let i = 0; i < renderSystem1Alphas.length; i++) {
              expect(renderSystem1Alphas[i]).toBeCloseTo(renderSystem2Alphas[i], 10);

              // Verify alpha is in [0, 1]
              expect(renderSystem1Alphas[i]).toBeGreaterThanOrEqual(0);
              expect(renderSystem1Alphas[i]).toBeLessThanOrEqual(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Feature: game-loop-time-management, Property 14: Pause affects only simulation**
    it('should not invoke update systems when paused but continue render systems', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: Math.fround(1), max: Math.fround(50), noNaN: true }), {
            minLength: 2,
            maxLength: 10,
          }),
          (frameDeltas) => {
            const fixedDelta = 16.67;
            const timeManager = new TimeManager({ fixedDelta });
            const world = new World();

            // Track system invocations
            let updateInvocations = 0;
            let renderInvocations = 0;

            // Register systems
            const updateSystem: System = {
              id: 'update',
              stage: 'update',
              execute: () => {
                updateInvocations++;
              },
            };

            const renderSystem: System = {
              id: 'render',
              stage: 'render',
              execute: () => {
                renderInvocations++;
              },
            };

            world.registerSystem(updateSystem);
            world.registerSystem(renderSystem);

            // Process first frame normally
            const firstDelta = frameDeltas[0];
            const steps1 = timeManager.update(firstDelta);
            for (let i = 0; i < steps1; i++) {
              world.step(timeManager.getScaledDelta());
            }
            world.render(timeManager.getInterpolationAlpha());

            const updateInvocationsBeforePause = updateInvocations;
            const renderInvocationsBeforePause = renderInvocations;

            // Pause
            timeManager.pause();

            // Process remaining frames while paused
            for (let i = 1; i < frameDeltas.length; i++) {
              const steps = timeManager.update(frameDeltas[i]);

              // Should not execute any simulation steps
              expect(steps).toBe(0);

              for (let j = 0; j < steps; j++) {
                world.step(timeManager.getScaledDelta());
              }

              // Continue rendering
              world.render(timeManager.getInterpolationAlpha());
            }

            // Verify update systems were not invoked during pause
            expect(updateInvocations).toBe(updateInvocationsBeforePause);

            // Verify render systems continued to be invoked
            const expectedRenderInvocations =
              renderInvocationsBeforePause + (frameDeltas.length - 1);
            expect(renderInvocations).toBe(expectedRenderInvocations);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Integration Tests', () => {
    it('should run full game loop with ECS for multiple frames', () => {
      const fixedDelta = 16.67;
      const timeManager = new TimeManager({ fixedDelta });
      const world = new World();

      // Create test entity with component
      const entity = world.createEntity();
      world.addComponent(entity, TestComponentDef, { value: 0 });

      // Track system executions
      const updateExecutions: number[] = [];
      const renderExecutions: number[] = [];

      // Register update system that modifies component
      const updateSystem: System = {
        id: 'update',
        stage: 'update',
        execute: (context: SystemContext) => {
          updateExecutions.push(context.delta);

          // Increment component value
          const component = world.getComponent(entity, TestComponentDef);
          if (component) {
            component.value += 1;
          }

          // Verify context has correct fields
          expect(context.delta).toBeGreaterThan(0);
          expect(context.totalTime).toBeGreaterThanOrEqual(0);
          expect(context.elapsed).toBeGreaterThanOrEqual(0);
          expect(context.alpha).toBeUndefined();
        },
      };

      // Register render system
      const renderSystem: System = {
        id: 'render',
        stage: 'render',
        execute: (context: SystemContext) => {
          renderExecutions.push(context.alpha ?? 0);

          // Verify context has correct fields
          expect(context.alpha).toBeGreaterThanOrEqual(0);
          expect(context.alpha).toBeLessThanOrEqual(1);
          expect(context.totalTime).toBeGreaterThanOrEqual(0);
          expect(context.elapsed).toBeGreaterThanOrEqual(0);
        },
      };

      world.registerSystem(updateSystem);
      world.registerSystem(renderSystem);

      // Simulate multiple frames
      const frameDeltas = [16.67, 16.67, 33.34, 16.67, 50.0];
      let expectedSteps = 0;

      for (const frameDelta of frameDeltas) {
        const steps = timeManager.update(frameDelta);
        expectedSteps += steps;

        // Execute simulation steps
        for (let i = 0; i < steps; i++) {
          world.step(timeManager.getScaledDelta());
        }

        // Execute render
        world.render(timeManager.getInterpolationAlpha());
      }

      // Verify systems were called correct number of times
      expect(updateExecutions.length).toBe(expectedSteps);
      expect(renderExecutions.length).toBe(frameDeltas.length);

      // Verify component was updated correctly (once per simulation step)
      const component = world.getComponent(entity, TestComponentDef);
      expect(component?.value).toBe(expectedSteps);

      // Verify all update deltas are the fixed delta
      for (const delta of updateExecutions) {
        expect(delta).toBeCloseTo(fixedDelta, 5);
      }

      // Verify all render alphas are in [0, 1]
      for (const alpha of renderExecutions) {
        expect(alpha).toBeGreaterThanOrEqual(0);
        expect(alpha).toBeLessThanOrEqual(1);
      }
    });

    it('should maintain simulation determinism with same inputs', () => {
      const fixedDelta = 16.67;
      const frameDeltas = [16.67, 33.34, 16.67, 50.0, 16.67];

      // Run simulation twice with same inputs
      const runSimulation = () => {
        const timeManager = new TimeManager({ fixedDelta });
        const world = new World();

        const entity = world.createEntity();
        world.addComponent(entity, TestComponentDef, { value: 0 });

        const updateSystem: System = {
          id: 'update',
          stage: 'update',
          execute: () => {
            const component = world.getComponent(entity, TestComponentDef);
            if (component) {
              // Deterministic update
              component.value += 1;
            }
          },
        };

        world.registerSystem(updateSystem);

        for (const frameDelta of frameDeltas) {
          const steps = timeManager.update(frameDelta);
          for (let i = 0; i < steps; i++) {
            world.step(timeManager.getScaledDelta());
          }
        }

        return world.getComponent(entity, TestComponentDef)?.value;
      };

      const result1 = runSimulation();
      const result2 = runSimulation();

      // Results should be identical
      expect(result1).toBe(result2);
      expect(result1).toBeGreaterThan(0);
    });

    it('should handle pause behavior correctly with ECS', () => {
      const fixedDelta = 16.67;
      const timeManager = new TimeManager({ fixedDelta });
      const world = new World();

      const entity = world.createEntity();
      world.addComponent(entity, TestComponentDef, { value: 0 });

      let updateCount = 0;
      let renderCount = 0;

      const updateSystem: System = {
        id: 'update',
        stage: 'update',
        execute: () => {
          updateCount++;
          const component = world.getComponent(entity, TestComponentDef);
          if (component) {
            component.value += 1;
          }
        },
      };

      const renderSystem: System = {
        id: 'render',
        stage: 'render',
        execute: () => {
          renderCount++;
        },
      };

      world.registerSystem(updateSystem);
      world.registerSystem(renderSystem);

      // Run a few frames normally
      for (let i = 0; i < 3; i++) {
        const steps = timeManager.update(16.67);
        for (let j = 0; j < steps; j++) {
          world.step(timeManager.getScaledDelta());
        }
        world.render(timeManager.getInterpolationAlpha());
      }

      const updateCountBeforePause = updateCount;
      const renderCountBeforePause = renderCount;
      const valueBeforePause = world.getComponent(entity, TestComponentDef)?.value ?? 0;

      // Pause
      timeManager.pause();

      // Run frames while paused
      for (let i = 0; i < 3; i++) {
        const steps = timeManager.update(16.67);
        expect(steps).toBe(0); // No simulation steps when paused

        for (let j = 0; j < steps; j++) {
          world.step(timeManager.getScaledDelta());
        }
        world.render(timeManager.getInterpolationAlpha());
      }

      // Verify update system was not called during pause
      expect(updateCount).toBe(updateCountBeforePause);

      // Verify render system continued to be called
      expect(renderCount).toBe(renderCountBeforePause + 3);

      // Verify component value didn't change
      expect(world.getComponent(entity, TestComponentDef)?.value).toBe(valueBeforePause);

      // Resume
      timeManager.resume();

      // Run more frames
      for (let i = 0; i < 2; i++) {
        const steps = timeManager.update(16.67);
        for (let j = 0; j < steps; j++) {
          world.step(timeManager.getScaledDelta());
        }
        world.render(timeManager.getInterpolationAlpha());
      }

      // Verify update system resumed
      expect(updateCount).toBeGreaterThan(updateCountBeforePause);

      // Verify component value increased
      expect(world.getComponent(entity, TestComponentDef)?.value).toBeGreaterThan(valueBeforePause);
    });

    it('should pass correct timing information to systems', () => {
      const fixedDelta = 16.67;
      const timeScale = 2.0;
      const timeManager = new TimeManager({ fixedDelta, timeScale });
      const world = new World();

      let lastUpdateDelta = 0;
      let lastUpdateTotalTime = 0;
      let lastRenderAlpha = 0;
      let lastRenderTotalTime = 0;

      const updateSystem: System = {
        id: 'update',
        stage: 'update',
        execute: (context: SystemContext) => {
          lastUpdateDelta = context.delta;
          lastUpdateTotalTime = context.totalTime;

          // Verify delta is scaled
          expect(context.delta).toBeCloseTo(fixedDelta * timeScale, 5);

          // Verify alpha is not set for update systems
          expect(context.alpha).toBeUndefined();
        },
      };

      const renderSystem: System = {
        id: 'render',
        stage: 'render',
        execute: (context: SystemContext) => {
          lastRenderAlpha = context.alpha ?? 0;
          lastRenderTotalTime = context.totalTime;

          // Verify alpha is set for render systems
          expect(context.alpha).toBeDefined();
          expect(context.alpha).toBeGreaterThanOrEqual(0);
          expect(context.alpha).toBeLessThanOrEqual(1);
        },
      };

      world.registerSystem(updateSystem);
      world.registerSystem(renderSystem);

      // Run a frame
      const steps = timeManager.update(33.34);
      for (let i = 0; i < steps; i++) {
        world.step(timeManager.getScaledDelta());
      }
      world.render(timeManager.getInterpolationAlpha());

      // Verify timing information was passed correctly
      expect(lastUpdateDelta).toBeCloseTo(fixedDelta * timeScale, 5);
      expect(lastUpdateTotalTime).toBeGreaterThan(0);
      expect(lastRenderAlpha).toBeGreaterThanOrEqual(0);
      expect(lastRenderAlpha).toBeLessThanOrEqual(1);
      expect(lastRenderTotalTime).toBeGreaterThan(0);

      // Update and render should have same totalTime
      expect(lastUpdateTotalTime).toBe(lastRenderTotalTime);
    });
  });
});
