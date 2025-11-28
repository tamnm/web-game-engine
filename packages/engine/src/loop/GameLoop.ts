import { TimeManager } from './TimeManager.js';
import type { GameLoopOptions, TimeManager as ITimeManager } from './types.js';

/**
 * Default target FPS when VSync is disabled
 */
const DEFAULT_TARGET_FPS = 60;

/**
 * GameLoop orchestrates the main execution cycle, coordinating simulation
 * steps and render frames with proper timing.
 *
 * The GameLoop manages the main game execution cycle, using a TimeManager
 * to implement fixed timestep simulation with frame interpolation. It handles
 * browser integration (requestAnimationFrame or setTimeout), tab visibility
 * changes, and provides callbacks for simulation and rendering.
 *
 * @example
 * ```typescript
 * // Create a game loop with ECS integration
 * const gameLoop = new GameLoop({
 *   useVSync: true,
 *   onSimulationStep: (delta) => {
 *     world.step(delta);
 *   },
 *   onRender: (alpha) => {
 *     world.render(alpha);
 *   }
 * });
 *
 * // Start the loop
 * gameLoop.start();
 *
 * // Later: stop the loop
 * gameLoop.stop();
 * ```
 */
export class GameLoop {
  private timeManager: ITimeManager;
  private running: boolean = false;
  private useVSync: boolean;
  private targetFPS: number;
  private lastFrameTime: number = 0;
  private frameId: number | null = null;
  private onSimulationStep?: (delta: number) => void;
  private onRender?: (alpha: number) => void;
  private visibilityChangeHandler?: () => void;

  /**
   * Creates a new GameLoop instance
   * @param options Configuration options
   */
  constructor(options: GameLoopOptions = {}) {
    // Initialize TimeManager
    this.timeManager = options.timeManager ?? new TimeManager();

    // Set up vsync and target FPS configuration
    this.useVSync = options.useVSync ?? true;
    this.targetFPS = options.targetFPS ?? DEFAULT_TARGET_FPS;

    // Store callbacks
    this.onSimulationStep = options.onSimulationStep;
    this.onRender = options.onRender;
  }

  /**
   * Starts the game loop.
   *
   * Initializes the timestamp, sets up browser tab visibility handling,
   * and begins the frame execution cycle. If the loop is already running,
   * this method does nothing.
   *
   * @example
   * ```typescript
   * gameLoop.start();
   * console.info('Game loop started');
   * ```
   */
  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    // Initialize timestamp
    this.lastFrameTime = performance.now();

    // Set up browser tab visibility handling
    this.setupVisibilityHandling();

    // Start frame loop
    this.scheduleNextFrame();
  }

  /**
   * Stops the game loop.
   *
   * Cancels any scheduled frames (requestAnimationFrame or setTimeout),
   * cleans up event listeners, and stops the execution cycle. If the loop
   * is not running, this method does nothing.
   *
   * @example
   * ```typescript
   * gameLoop.stop();
   * console.info('Game loop stopped');
   * ```
   */
  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    // Cancel scheduled frame
    if (this.frameId !== null) {
      if (this.useVSync) {
        cancelAnimationFrame(this.frameId);
      } else {
        clearTimeout(this.frameId);
      }
      this.frameId = null;
    }

    // Clean up visibility handler
    this.cleanupVisibilityHandling();
  }

  /**
   * Checks if the game loop is running
   * @returns True if running, false otherwise
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Main tick method - executes one frame of the game loop.
   *
   * This method is called once per frame (via requestAnimationFrame or setTimeout).
   * It calculates the frame delta, updates the TimeManager, executes simulation
   * steps, invokes the render callback with interpolation alpha, records frame
   * time statistics, and schedules the next frame.
   *
   * @param timestamp Current high-resolution timestamp from performance.now()
   *
   * @example
   * ```typescript
   * // Typically called automatically by the game loop
   * // But can be called manually for testing
   * gameLoop.tick(performance.now());
   * ```
   */
  tick(timestamp: number): void {
    if (!this.running) {
      return;
    }

    // Calculate frame delta from last timestamp
    const frameDelta = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // Update TimeManager with frame delta
    const steps = this.timeManager.update(frameDelta);

    // Execute simulation steps
    const scaledDelta = this.timeManager.getScaledDelta();
    for (let i = 0; i < steps; i++) {
      if (this.onSimulationStep) {
        this.onSimulationStep(scaledDelta);
      }
    }

    // Calculate interpolation alpha from TimeManager
    const alpha = this.timeManager.getInterpolationAlpha();

    // Invoke render callback with alpha
    if (this.onRender) {
      this.onRender(alpha);
    }

    // Record frame time for statistics
    this.timeManager.recordFrameTime(frameDelta);

    // Schedule next tick
    this.scheduleNextFrame();
  }

  /**
   * Sets whether to use VSync (requestAnimationFrame).
   *
   * When VSync is enabled, the game loop uses requestAnimationFrame which
   * synchronizes with the display refresh rate. When disabled, it uses
   * setTimeout with the target FPS setting.
   *
   * @param enabled True to use VSync, false to use manual timing
   *
   * @example
   * ```typescript
   * // Enable VSync for smooth rendering
   * gameLoop.setVSync(true);
   *
   * // Disable VSync for custom frame rate
   * gameLoop.setVSync(false);
   * gameLoop.setTargetFPS(30);
   * ```
   */
  setVSync(enabled: boolean): void {
    this.useVSync = enabled;
  }

  /**
   * Sets the target frame rate when VSync is disabled.
   *
   * This setting only applies when VSync is disabled. The game loop will
   * use setTimeout with a calculated delay to target the specified frame rate.
   *
   * @param fps Target frames per second (e.g., 30, 60, 120)
   *
   * @example
   * ```typescript
   * // Limit to 30 FPS to reduce CPU usage
   * gameLoop.setVSync(false);
   * gameLoop.setTargetFPS(30);
   * ```
   */
  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
  }

  /**
   * Gets the TimeManager instance.
   *
   * Provides access to the TimeManager for controlling time scale, pause/resume,
   * and accessing performance statistics.
   *
   * @returns TimeManager instance
   *
   * @example
   * ```typescript
   * const timeManager = gameLoop.getTimeManager();
   * timeManager.setTimeScale(0.5); // Slow motion
   * const stats = timeManager.getStats();
   * console.info(`FPS: ${stats.fps}`);
   * ```
   */
  getTimeManager(): ITimeManager {
    return this.timeManager;
  }

  /**
   * Schedules the next frame based on VSync setting
   */
  private scheduleNextFrame(): void {
    if (!this.running) {
      return;
    }

    if (this.useVSync) {
      // Use requestAnimationFrame when vsync enabled
      this.frameId = requestAnimationFrame((timestamp) => this.tick(timestamp));
    } else {
      // Use setTimeout with calculated delay when vsync disabled
      const frameDelay = 1000 / this.targetFPS;
      this.frameId = setTimeout(() => {
        this.tick(performance.now());
      }, frameDelay) as unknown as number;
    }
  }

  /**
   * Sets up browser tab visibility handling
   */
  private setupVisibilityHandling(): void {
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        // Pause TimeManager when tab becomes hidden
        this.timeManager.pause();
      } else {
        // Resume TimeManager when tab becomes visible
        this.timeManager.resume();
        // Reset timestamp on resume to prevent time jump
        this.lastFrameTime = performance.now();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  /**
   * Cleans up browser tab visibility handling
   */
  private cleanupVisibilityHandling(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = undefined;
    }
  }
}
