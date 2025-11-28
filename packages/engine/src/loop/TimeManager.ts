import type { TimeManagerOptions, TimeStats } from './types.js';

/**
 * Default fixed timestep: 16.67ms (60 Hz)
 */
const DEFAULT_FIXED_DELTA = 1000 / 60;

/**
 * Default maximum accumulator: 250ms
 */
const DEFAULT_MAX_ACCUMULATOR = 250;

/**
 * Default time scale: 1.0 (normal speed)
 */
const DEFAULT_TIME_SCALE = 1.0;

/**
 * Number of frames to track for statistics (60 frames = 1 second at 60 FPS)
 */
const FRAME_HISTORY_SIZE = 60;

/**
 * TimeManager manages time state, accumulation, scaling, and statistics
 * for the game loop. It implements a fixed timestep simulation with
 * frame interpolation support.
 *
 * @example
 * ```typescript
 * // Create a TimeManager with custom settings
 * const timeManager = new TimeManager({
 *   fixedDelta: 16.67,  // 60 Hz simulation
 *   maxAccumulator: 250, // Prevent spiral of death
 *   timeScale: 1.0       // Normal speed
 * });
 *
 * // In your game loop
 * const steps = timeManager.update(frameDelta);
 * for (let i = 0; i < steps; i++) {
 *   // Execute simulation step
 *   updateGameLogic(timeManager.getScaledDelta());
 * }
 *
 * // Render with interpolation
 * const alpha = timeManager.getInterpolationAlpha();
 * render(alpha);
 * ```
 */
export class TimeManager {
  // Accumulator pattern
  private accumulator: number = 0;
  private readonly fixedDelta: number;
  private readonly maxAccumulator: number;

  // Time manipulation
  private timeScale: number;
  private paused: boolean = false;

  // Timing state
  private totalSimulationTime: number = 0;

  // Statistics
  private frameCount: number = 0;
  private frameTimeHistory: number[] = [];
  private simulationStepsThisFrame: number = 0;

  /**
   * Creates a new TimeManager instance
   * @param options Configuration options
   */
  constructor(options: TimeManagerOptions = {}) {
    this.fixedDelta = options.fixedDelta ?? DEFAULT_FIXED_DELTA;
    this.maxAccumulator = options.maxAccumulator ?? DEFAULT_MAX_ACCUMULATOR;
    this.timeScale = options.timeScale ?? DEFAULT_TIME_SCALE;
  }

  /**
   * Updates the time manager with the elapsed frame time and returns
   * the number of simulation steps to execute.
   *
   * This method implements the accumulator pattern for fixed timestep simulation.
   * It adds the scaled frame delta to an accumulator and calculates how many
   * fixed timestep updates should occur. The accumulator is clamped to prevent
   * the "spiral of death" where too many steps cause further slowdown.
   *
   * @param frameDelta Elapsed time since last frame in milliseconds
   * @returns Number of simulation steps to execute
   *
   * @example
   * ```typescript
   * const steps = timeManager.update(16.67);
   * for (let i = 0; i < steps; i++) {
   *   // Execute fixed timestep update
   *   world.step(timeManager.getScaledDelta());
   * }
   * ```
   */
  update(frameDelta: number): number {
    // Reset simulation steps counter
    this.simulationStepsThisFrame = 0;

    // If paused, don't accumulate time
    if (this.paused) {
      return 0;
    }

    // Apply time scale to frame delta
    const scaledDelta = frameDelta * this.timeScale;

    // Add scaled delta to accumulator
    this.accumulator += scaledDelta;

    // Clamp accumulator to prevent spiral of death
    if (this.accumulator > this.maxAccumulator) {
      console.warn(
        `TimeManager: Accumulator clamped from ${this.accumulator}ms to ${this.maxAccumulator}ms`
      );
      this.accumulator = this.maxAccumulator;
    }

    // Calculate number of simulation steps to execute
    const steps = Math.floor(this.accumulator / this.fixedDelta);

    // Decrement accumulator by executed steps
    this.accumulator -= steps * this.fixedDelta;

    // Update total simulation time
    this.totalSimulationTime += steps * this.fixedDelta;

    // Track steps for statistics
    this.simulationStepsThisFrame = steps;

    // Warn if too many simulation steps in one frame
    if (steps > 5) {
      console.warn(
        `TimeManager: Executed ${steps} simulation steps in one frame. Consider optimizing game logic.`
      );
    }

    return steps;
  }

  /**
   * Gets the fixed timestep value
   * @returns Fixed delta time in milliseconds
   */
  getFixedDelta(): number {
    return this.fixedDelta;
  }

  /**
   * Gets the scaled delta time (fixed delta * time scale)
   * @returns Scaled delta time in milliseconds
   */
  getScaledDelta(): number {
    return this.fixedDelta * this.timeScale;
  }

  /**
   * Calculates the interpolation alpha for smooth rendering.
   *
   * The alpha value represents the fractional progress toward the next
   * simulation step. It can be used to interpolate between the previous
   * and current simulation states for smooth rendering even when the
   * display refresh rate differs from the simulation rate.
   *
   * @returns Interpolation factor between 0 and 1
   *
   * @example
   * ```typescript
   * const alpha = timeManager.getInterpolationAlpha();
   * // Interpolate position for smooth rendering
   * const renderX = prevX + (currentX - prevX) * alpha;
   * const renderY = prevY + (currentY - prevY) * alpha;
   * ```
   */
  getInterpolationAlpha(): number {
    // Calculate alpha as accumulator / fixedDelta
    const alpha = this.accumulator / this.fixedDelta;

    // Clamp to [0, 1] range
    return Math.max(0, Math.min(1, alpha));
  }

  /**
   * Sets the time scale multiplier for time manipulation effects.
   *
   * Time scale affects how fast simulation time progresses relative to
   * real time. Values less than 1.0 create slow-motion effects, values
   * greater than 1.0 create fast-forward effects, and 0 freezes simulation
   * while continuing to render.
   *
   * @param scale Time scale value (1.0 = normal, 0.5 = slow-mo, 2.0 = fast-forward, 0 = freeze)
   * @throws {Error} If scale is negative
   *
   * @example
   * ```typescript
   * // Slow motion effect
   * timeManager.setTimeScale(0.5);
   *
   * // Fast forward
   * timeManager.setTimeScale(2.0);
   *
   * // Freeze simulation (but keep rendering)
   * timeManager.setTimeScale(0);
   * ```
   */
  setTimeScale(scale: number): void {
    if (scale < 0) {
      throw new Error('Time scale must be non-negative');
    }
    this.timeScale = scale;
  }

  /**
   * Gets the current time scale
   * @returns Current time scale value
   */
  getTimeScale(): number {
    return this.timeScale;
  }

  /**
   * Pauses the simulation.
   *
   * When paused, the time manager stops accumulating simulation time,
   * preventing simulation steps from executing. Rendering can continue
   * while paused. The accumulator value is preserved.
   *
   * @example
   * ```typescript
   * // Pause when opening menu
   * timeManager.pause();
   * ```
   */
  pause(): void {
    if (!this.paused) {
      this.paused = true;
    }
  }

  /**
   * Resumes the simulation.
   *
   * When resumed, the time manager continues accumulating simulation time
   * from the paused state. No time jump occurs - the accumulator value
   * is preserved from when pause was called.
   *
   * @example
   * ```typescript
   * // Resume when closing menu
   * timeManager.resume();
   * ```
   */
  resume(): void {
    if (this.paused) {
      this.paused = false;
    }
  }

  /**
   * Checks if the simulation is paused
   * @returns True if paused, false otherwise
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Gets current time statistics for performance monitoring.
   *
   * Returns comprehensive statistics including FPS, frame time, simulation
   * steps, time scale, total simulation time, and pause state. Useful for
   * debugging performance issues and displaying performance metrics.
   *
   * @returns Time statistics object
   *
   * @example
   * ```typescript
   * const stats = timeManager.getStats();
   * console.info(`FPS: ${stats.fps.toFixed(2)}`);
   * console.info(`Frame Time: ${stats.averageFrameTime.toFixed(2)}ms`);
   * console.info(`Simulation Steps: ${stats.simulationSteps}`);
   * ```
   */
  getStats(): TimeStats {
    // Calculate FPS from frame time history
    let fps = 0;
    let averageFrameTime = 0;

    if (this.frameTimeHistory.length > 0) {
      const sum = this.frameTimeHistory.reduce((acc, time) => acc + time, 0);
      averageFrameTime = sum / this.frameTimeHistory.length;
      // FPS = 1000ms / average frame time
      fps = averageFrameTime > 0 ? 1000 / averageFrameTime : 0;
    }

    return {
      fps,
      averageFrameTime,
      simulationSteps: this.simulationStepsThisFrame,
      timeScale: this.timeScale,
      totalSimulationTime: this.totalSimulationTime,
      isPaused: this.paused,
    };
  }

  /**
   * Gets the total elapsed simulation time
   * @returns Total simulation time in milliseconds
   */
  getTotalSimulationTime(): number {
    return this.totalSimulationTime;
  }

  /**
   * Records a frame time for statistics tracking
   * @param frameTime Frame time in milliseconds
   */
  recordFrameTime(frameTime: number): void {
    this.frameCount++;

    // Maintain rolling window of frame times
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > FRAME_HISTORY_SIZE) {
      this.frameTimeHistory.shift();
    }
  }

  /**
   * Resets all time manager state
   */
  reset(): void {
    this.accumulator = 0;
    this.totalSimulationTime = 0;
    this.frameCount = 0;
    this.frameTimeHistory = [];
    this.simulationStepsThisFrame = 0;
    this.paused = false;
  }
}
