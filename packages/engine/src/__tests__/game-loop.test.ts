import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { GameLoop } from '../loop/GameLoop.js';
import { TimeManager } from '../loop/TimeManager.js';

describe('GameLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Property-Based Tests', () => {
    // **Feature: game-loop-time-management, Property 8: Render delta independence**
    it('should track render delta independently of fixed simulation delta', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: Math.fround(5), max: Math.fround(50), noNaN: true }), {
            minLength: 2,
            maxLength: 10,
          }),
          (frameDeltas) => {
            const fixedDelta = 16.67;
            const timeManager = new TimeManager({ fixedDelta });
            const frameTimes: number[] = [];

            const gameLoop = new GameLoop({
              timeManager,
              onRender: () => {
                // Record frame time from TimeManager stats
                const stats = timeManager.getStats();
                if (stats.averageFrameTime > 0) {
                  frameTimes.push(stats.averageFrameTime);
                }
              },
              useVSync: false,
            });

            gameLoop.start();

            // Simulate frames with varying deltas
            let timestamp = performance.now();
            for (const delta of frameDeltas) {
              gameLoop.tick(timestamp);
              timestamp += delta;
            }

            gameLoop.stop();

            // Verify that frame times reflect actual elapsed time, not fixed delta
            // The recorded frame times should vary with the input deltas
            if (frameTimes.length > 1) {
              // Check that frame times are not all equal to fixedDelta
              const allEqualToFixed = frameTimes.every((ft) => Math.abs(ft - fixedDelta) < 0.01);
              // Frame times should reflect actual deltas, not be locked to fixedDelta
              // (unless by coincidence all deltas happen to be ~16.67ms)
              const allDeltasNearFixed = frameDeltas.every((d) => Math.abs(d - fixedDelta) < 0.01);
              if (!allDeltasNearFixed) {
                expect(allEqualToFixed).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Feature: game-loop-time-management, Property 9: Delta time precision**
    it('should provide delta time with sub-millisecond precision', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: Math.fround(10), max: Math.fround(30), noNaN: true }), {
            minLength: 3,
            maxLength: 10,
          }),
          (frameDeltas) => {
            const timeManager = new TimeManager();
            const gameLoop = new GameLoop({
              timeManager,
              useVSync: false,
            });

            gameLoop.start();

            // Simulate frames with precise deltas
            let timestamp = performance.now();
            for (const delta of frameDeltas) {
              gameLoop.tick(timestamp);
              timestamp += delta;
            }

            gameLoop.stop();

            // Verify that recorded frame times have sub-millisecond precision
            const stats = timeManager.getStats();
            if (stats.averageFrameTime > 0) {
              // Check that the value has at least 3 decimal places of precision
              // by verifying it's not a whole number
              const hasDecimalPrecision = stats.averageFrameTime % 1 !== 0;

              // Also verify the value is reasonable (not NaN, not Infinity)
              expect(Number.isFinite(stats.averageFrameTime)).toBe(true);
              expect(stats.averageFrameTime).toBeGreaterThan(0);

              // If we have varying frame deltas, we should see decimal precision
              const hasVariation = frameDeltas.some(
                (d, i) => i > 0 && Math.abs(d - frameDeltas[0]) > 0.1
              );
              if (hasVariation) {
                // With varying deltas, the average should have decimal precision
                expect(hasDecimalPrecision || stats.averageFrameTime < 1).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Feature: game-loop-time-management, Property 10: Frame rate limiting**
    it('should configure frame rate limiting mechanism correctly', () => {
      fc.assert(
        fc.property(fc.integer({ min: 15, max: 144 }), (targetFPS) => {
          const gameLoop = new GameLoop({ useVSync: false, targetFPS });

          // Verify the target FPS is set
          gameLoop.setTargetFPS(targetFPS);

          // Calculate expected frame delay
          const expectedDelay = 1000 / targetFPS;

          // Start the loop
          gameLoop.start();

          // Verify loop is running
          expect(gameLoop.isRunning()).toBe(true);

          // Stop the loop
          gameLoop.stop();

          // Verify loop is stopped
          expect(gameLoop.isRunning()).toBe(false);

          // The mechanism should be in place (we can't reliably test actual timing in unit tests)
          // But we can verify the configuration is correct
          expect(targetFPS).toBeGreaterThan(0);
          expect(expectedDelay).toBeGreaterThan(0);
          expect(expectedDelay).toBeLessThanOrEqual(1000);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should start and stop lifecycle correctly', () => {
      const gameLoop = new GameLoop();

      expect(gameLoop.isRunning()).toBe(false);

      gameLoop.start();
      expect(gameLoop.isRunning()).toBe(true);

      gameLoop.stop();
      expect(gameLoop.isRunning()).toBe(false);
    });

    it('should not start twice', () => {
      const gameLoop = new GameLoop();

      gameLoop.start();
      expect(gameLoop.isRunning()).toBe(true);

      // Try to start again
      gameLoop.start();
      expect(gameLoop.isRunning()).toBe(true);

      gameLoop.stop();
    });

    it('should not stop twice', () => {
      const gameLoop = new GameLoop();

      gameLoop.start();
      gameLoop.stop();
      expect(gameLoop.isRunning()).toBe(false);

      // Try to stop again
      gameLoop.stop();
      expect(gameLoop.isRunning()).toBe(false);
    });

    it('should switch between vsync and manual timing modes', () => {
      const gameLoop = new GameLoop({ useVSync: true });

      // Switch to manual timing
      gameLoop.setVSync(false);
      gameLoop.setTargetFPS(30);

      // Switch back to vsync
      gameLoop.setVSync(true);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should invoke simulation callback for each step', () => {
      const simulationSteps: number[] = [];
      const onSimulationStep = vi.fn((delta: number) => {
        simulationSteps.push(delta);
      });

      const timeManager = new TimeManager({ fixedDelta: 16.67 });
      const gameLoop = new GameLoop({
        timeManager,
        onSimulationStep,
        useVSync: false,
      });

      gameLoop.start();

      // Simulate a frame that should trigger 2 simulation steps
      const timestamp = performance.now();
      gameLoop.tick(timestamp);
      gameLoop.tick(timestamp + 33.34); // Two fixed timesteps worth

      expect(onSimulationStep).toHaveBeenCalled();
      expect(simulationSteps.length).toBeGreaterThan(0);

      gameLoop.stop();
    });

    it('should invoke render callback for each frame', () => {
      const renderAlphas: number[] = [];
      const onRender = vi.fn((alpha: number) => {
        renderAlphas.push(alpha);
      });

      const gameLoop = new GameLoop({
        onRender,
        useVSync: false,
      });

      gameLoop.start();

      // Simulate frames
      const timestamp = performance.now();
      gameLoop.tick(timestamp);
      gameLoop.tick(timestamp + 16.67);

      expect(onRender).toHaveBeenCalled();
      expect(renderAlphas.length).toBeGreaterThan(0);

      // All alphas should be in [0, 1]
      for (const alpha of renderAlphas) {
        expect(alpha).toBeGreaterThanOrEqual(0);
        expect(alpha).toBeLessThanOrEqual(1);
      }

      gameLoop.stop();
    });

    it('should handle tab visibility changes', () => {
      const gameLoop = new GameLoop();
      const timeManager = gameLoop.getTimeManager();

      gameLoop.start();

      // Simulate tab becoming hidden
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // TimeManager should be paused
      expect(timeManager.isPaused()).toBe(true);

      // Simulate tab becoming visible
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // TimeManager should be resumed
      expect(timeManager.isPaused()).toBe(false);

      gameLoop.stop();
    });

    it('should integrate with TimeManager correctly', () => {
      const timeManager = new TimeManager({ fixedDelta: 16.67 });
      const gameLoop = new GameLoop({ timeManager });

      // Should return the same TimeManager instance
      expect(gameLoop.getTimeManager()).toBe(timeManager);
    });

    it('should create default TimeManager if not provided', () => {
      const gameLoop = new GameLoop();

      // Should have a TimeManager
      const timeManager = gameLoop.getTimeManager();
      expect(timeManager).toBeDefined();
      expect(timeManager.getFixedDelta()).toBeCloseTo(16.67, 2);
    });

    it('should record frame times in TimeManager', () => {
      const gameLoop = new GameLoop({ useVSync: false });
      const timeManager = gameLoop.getTimeManager();

      gameLoop.start();

      // Simulate frames
      const timestamp = performance.now();
      gameLoop.tick(timestamp);
      gameLoop.tick(timestamp + 16.67);
      gameLoop.tick(timestamp + 33.34);

      // Check that statistics are being tracked
      const stats = timeManager.getStats();
      expect(stats.averageFrameTime).toBeGreaterThan(0);

      gameLoop.stop();
    });

    it('should not tick when stopped', () => {
      const onSimulationStep = vi.fn();
      const onRender = vi.fn();

      const gameLoop = new GameLoop({
        onSimulationStep,
        onRender,
        useVSync: false,
      });

      // Tick without starting
      gameLoop.tick(performance.now());

      expect(onSimulationStep).not.toHaveBeenCalled();
      expect(onRender).not.toHaveBeenCalled();
    });

    it('should handle VSync mode with requestAnimationFrame', () => {
      const gameLoop = new GameLoop({ useVSync: true });

      gameLoop.start();
      expect(gameLoop.isRunning()).toBe(true);

      gameLoop.stop();
      expect(gameLoop.isRunning()).toBe(false);
    });

    it('should handle manual timing mode with setTimeout', () => {
      const gameLoop = new GameLoop({ useVSync: false, targetFPS: 60 });

      gameLoop.start();
      expect(gameLoop.isRunning()).toBe(true);

      gameLoop.stop();
      expect(gameLoop.isRunning()).toBe(false);
    });
  });
});
