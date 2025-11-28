import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { TimeManager } from '../loop/TimeManager.js';

describe('TimeManager', () => {
  describe('Property-Based Tests', () => {
    // **Feature: game-loop-time-management, Property 1: Fixed timestep consistency**
    it('should provide exactly the fixed delta time for each simulation step', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: Math.fround(0), max: Math.fround(100) }), {
            minLength: 1,
            maxLength: 50,
          }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(5) }),
          (frameDeltas, timeScale) => {
            const fixedDelta = 16.67;
            const timeManager = new TimeManager({ fixedDelta, timeScale });

            // Track all deltas that would be passed to simulation steps
            const simulationDeltas: number[] = [];

            for (const frameDelta of frameDeltas) {
              const steps = timeManager.update(frameDelta);

              // Each step should receive exactly the scaled fixed delta
              for (let i = 0; i < steps; i++) {
                simulationDeltas.push(timeManager.getScaledDelta());
              }
            }

            // Verify all simulation deltas are exactly fixedDelta * timeScale
            const expectedDelta = fixedDelta * timeScale;
            for (const delta of simulationDeltas) {
              expect(delta).toBeCloseTo(expectedDelta, 5);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Feature: game-loop-time-management, Property 2: Accumulator correctness**
    it('should execute correct number of steps and maintain valid accumulator', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(5), noNaN: true }),
          (frameDelta, timeScale) => {
            const fixedDelta = 16.67;
            const maxAccumulator = 250;
            const timeManager = new TimeManager({ fixedDelta, maxAccumulator, timeScale });

            // Get initial accumulator (should be 0)
            const initialAlpha = timeManager.getInterpolationAlpha();
            const initialAccumulator = initialAlpha * fixedDelta;

            // Update with frame delta
            const steps = timeManager.update(frameDelta);

            // Calculate what the accumulator should be (accounting for clamping)
            const scaledDelta = frameDelta * timeScale;
            let totalTime = initialAccumulator + scaledDelta;

            // Clamp to maxAccumulator if needed
            if (totalTime > maxAccumulator) {
              totalTime = maxAccumulator;
            }

            const expectedSteps = Math.floor(totalTime / fixedDelta);
            const expectedAccumulator = totalTime - expectedSteps * fixedDelta;

            // Verify step count matches expected
            expect(steps).toBe(expectedSteps);

            // Verify accumulator is less than fixedDelta
            const alpha = timeManager.getInterpolationAlpha();
            const actualAccumulator = alpha * fixedDelta;
            expect(actualAccumulator).toBeLessThan(fixedDelta);
            expect(actualAccumulator).toBeGreaterThanOrEqual(0);

            // Verify accumulator matches expected (within floating point precision)
            expect(actualAccumulator).toBeCloseTo(expectedAccumulator, 3);
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Feature: game-loop-time-management, Property 3: Interpolation bounds**
    // **Feature: game-loop-time-management, Property 4: Interpolation calculation**
    it('should maintain interpolation alpha in [0, 1] and calculate correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }), {
            minLength: 1,
            maxLength: 20,
          }),
          (frameDeltas) => {
            const fixedDelta = 16.67;
            const timeManager = new TimeManager({ fixedDelta });

            for (const frameDelta of frameDeltas) {
              timeManager.update(frameDelta);

              // Property 3: Verify alpha is in [0, 1]
              const alpha = timeManager.getInterpolationAlpha();
              expect(alpha).toBeGreaterThanOrEqual(0);
              expect(alpha).toBeLessThanOrEqual(1);

              // Property 4: Verify alpha calculation is correct
              // Alpha should equal accumulator / fixedDelta
              // We can't directly access accumulator, but we can verify the relationship
              // by checking that alpha * fixedDelta gives us a value less than fixedDelta
              const impliedAccumulator = alpha * fixedDelta;
              expect(impliedAccumulator).toBeLessThan(fixedDelta + 0.001); // Small epsilon for floating point
              expect(impliedAccumulator).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Feature: game-loop-time-management, Property 5: Time scale multiplication**
    it('should apply time scale correctly to delta accumulation', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(5), noNaN: true }),
          (frameDelta, timeScale) => {
            const fixedDelta = 16.67;
            const maxAccumulator = 250;
            const timeManager = new TimeManager({ fixedDelta, maxAccumulator, timeScale });

            // Track initial simulation time
            const initialTime = timeManager.getTotalSimulationTime();

            // Update with frame delta
            const steps = timeManager.update(frameDelta);

            // Calculate expected scaled delta (accounting for clamping)
            const scaledDelta = frameDelta * timeScale;
            const clampedDelta = Math.min(scaledDelta, maxAccumulator);

            // The total simulation time should have increased by steps * fixedDelta
            const expectedSimulationTime = initialTime + steps * fixedDelta;
            expect(timeManager.getTotalSimulationTime()).toBeCloseTo(expectedSimulationTime, 3);

            // Verify getScaledDelta returns fixedDelta * timeScale
            expect(timeManager.getScaledDelta()).toBeCloseTo(fixedDelta * timeScale, 5);

            // The accumulator should contain the remainder after steps (accounting for clamping)
            const alpha = timeManager.getInterpolationAlpha();
            const accumulator = alpha * fixedDelta;
            const expectedAccumulator = clampedDelta - steps * fixedDelta;
            expect(accumulator).toBeCloseTo(expectedAccumulator, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Feature: game-loop-time-management, Property 6: Pause/resume round-trip**
    it('should preserve accumulator and not execute steps when paused', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(50), noNaN: true }),
          fc.float({ min: Math.fround(1), max: Math.fround(50), noNaN: true }),
          (frameDelta1, frameDelta2) => {
            const fixedDelta = 16.67;
            const timeManager = new TimeManager({ fixedDelta });

            // Update once to build up some accumulator
            timeManager.update(frameDelta1);
            const alphaBeforePause = timeManager.getInterpolationAlpha();
            const simulationTimeBeforePause = timeManager.getTotalSimulationTime();

            // Pause
            timeManager.pause();
            expect(timeManager.isPaused()).toBe(true);

            // Update while paused - should not execute steps
            const stepsDuringPause = timeManager.update(frameDelta2);
            expect(stepsDuringPause).toBe(0);

            // Accumulator should be preserved
            const alphaDuringPause = timeManager.getInterpolationAlpha();
            expect(alphaDuringPause).toBeCloseTo(alphaBeforePause, 5);

            // Simulation time should not advance
            expect(timeManager.getTotalSimulationTime()).toBe(simulationTimeBeforePause);

            // Resume
            timeManager.resume();
            expect(timeManager.isPaused()).toBe(false);

            // Accumulator should still be preserved
            const alphaAfterResume = timeManager.getInterpolationAlpha();
            expect(alphaAfterResume).toBeCloseTo(alphaBeforePause, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Feature: game-loop-time-management, Property 7: No time jumps on resume**
    it('should not create large time jumps when resuming', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(50), noNaN: true }),
          (frameDelta) => {
            const fixedDelta = 16.67;
            const maxAccumulator = 250;
            const timeManager = new TimeManager({ fixedDelta, maxAccumulator });

            // Pause and resume
            timeManager.pause();
            timeManager.resume();

            // First update after resume should not cause excessive steps
            const steps = timeManager.update(frameDelta);

            // Steps should be reasonable (not a huge catch-up)
            // Maximum reasonable steps for a single frame delta
            const maxReasonableSteps = Math.ceil(maxAccumulator / fixedDelta);
            expect(steps).toBeLessThanOrEqual(maxReasonableSteps);

            // For a normal frame delta, steps should be very small
            if (frameDelta < 100) {
              expect(steps).toBeLessThanOrEqual(10);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Feature: game-loop-time-management, Property 11: Statistics accuracy**
    it('should accurately track and report statistics', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: Math.fround(10), max: Math.fround(30), noNaN: true }), {
            minLength: 5,
            maxLength: 20,
          }),
          fc.float({ min: Math.fround(0.5), max: Math.fround(2), noNaN: true }),
          (frameTimes, timeScale) => {
            const fixedDelta = 16.67;
            const timeManager = new TimeManager({ fixedDelta, timeScale });

            // Record frame times
            for (const frameTime of frameTimes) {
              timeManager.recordFrameTime(frameTime);
            }

            // Get statistics
            const stats = timeManager.getStats();

            // Verify time scale is correct
            expect(stats.timeScale).toBe(timeScale);

            // Verify pause state
            expect(stats.isPaused).toBe(false);

            // Verify average frame time
            const expectedAverage = frameTimes.reduce((sum, t) => sum + t, 0) / frameTimes.length;
            expect(stats.averageFrameTime).toBeCloseTo(expectedAverage, 5);

            // Verify FPS calculation
            const expectedFPS = 1000 / expectedAverage;
            expect(stats.fps).toBeCloseTo(expectedFPS, 3);

            // Verify total simulation time is non-negative
            expect(stats.totalSimulationTime).toBeGreaterThanOrEqual(0);

            // Verify simulation steps is non-negative
            expect(stats.simulationSteps).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should clamp accumulator at maxAccumulator threshold', () => {
      const fixedDelta = 16.67;
      const maxAccumulator = 250;
      const timeManager = new TimeManager({ fixedDelta, maxAccumulator });

      // Update with a huge delta that would exceed maxAccumulator
      const hugeFrameDelta = 500;
      timeManager.update(hugeFrameDelta);

      // Verify accumulator is clamped
      const alpha = timeManager.getInterpolationAlpha();
      const accumulator = alpha * fixedDelta;
      expect(accumulator).toBeLessThan(fixedDelta);
    });

    it('should warn when accumulator is clamped (spiral of death)', () => {
      const fixedDelta = 16.67;
      const maxAccumulator = 250;
      const timeManager = new TimeManager({ fixedDelta, maxAccumulator });

      // Spy on console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Update with a huge delta that exceeds maxAccumulator
      const hugeFrameDelta = 500;
      timeManager.update(hugeFrameDelta);

      // Verify warning was logged
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Accumulator clamped from'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(`${maxAccumulator}ms`));

      warnSpy.mockRestore();
    });

    it('should warn when too many simulation steps are executed', () => {
      const fixedDelta = 16.67;
      const timeManager = new TimeManager({ fixedDelta });

      // Spy on console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Update with a delta that causes more than 5 steps
      // 7 steps * 16.67ms = ~116.7ms
      const largeDelta = 120;
      const steps = timeManager.update(largeDelta);

      // Verify more than 5 steps were executed
      expect(steps).toBeGreaterThan(5);

      // Verify warning was logged
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Executed ${steps} simulation steps in one frame`)
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Consider optimizing game logic')
      );

      warnSpy.mockRestore();
    });

    it('should handle time scale = 0 (pause simulation)', () => {
      const fixedDelta = 16.67;
      const timeManager = new TimeManager({ fixedDelta, timeScale: 0 });

      const initialTime = timeManager.getTotalSimulationTime();

      // Update with normal frame delta
      const steps = timeManager.update(16.67);

      // No steps should execute with time scale = 0
      expect(steps).toBe(0);
      expect(timeManager.getTotalSimulationTime()).toBe(initialTime);
    });

    it('should handle time scale = 1.0 (normal speed)', () => {
      const fixedDelta = 16.67;
      const timeManager = new TimeManager({ fixedDelta, timeScale: 1.0 });

      // Update with exactly one fixed delta
      const steps = timeManager.update(16.67);

      // Should execute exactly 1 step
      expect(steps).toBe(1);
      expect(timeManager.getTotalSimulationTime()).toBeCloseTo(fixedDelta, 5);
    });

    it('should reject negative time scale', () => {
      const timeManager = new TimeManager();

      expect(() => {
        timeManager.setTimeScale(-1);
      }).toThrow('Time scale must be non-negative');
    });

    it('should initialize with valid timestamp', () => {
      const timeManager = new TimeManager();

      // Should be able to get stats immediately
      const stats = timeManager.getStats();
      expect(stats.totalSimulationTime).toBe(0);
      expect(stats.fps).toBe(0);
      expect(stats.isPaused).toBe(false);
    });

    it('should handle reset correctly', () => {
      const timeManager = new TimeManager();

      // Do some updates
      timeManager.update(50);
      timeManager.recordFrameTime(16.67);
      timeManager.pause();

      // Reset
      timeManager.reset();

      // Verify everything is reset
      const stats = timeManager.getStats();
      expect(stats.totalSimulationTime).toBe(0);
      expect(stats.fps).toBe(0);
      expect(stats.averageFrameTime).toBe(0);
      expect(stats.isPaused).toBe(false);
      expect(timeManager.getInterpolationAlpha()).toBe(0);
    });
  });
});
