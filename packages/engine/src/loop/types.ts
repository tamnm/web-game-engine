/**
 * Options for configuring the TimeManager
 */
export interface TimeManagerOptions {
  /** Fixed timestep in milliseconds (default: 16.67ms for 60 Hz) */
  fixedDelta?: number;
  /** Maximum accumulator value to prevent spiral of death (default: 250ms) */
  maxAccumulator?: number;
  /** Time scale multiplier (default: 1.0) */
  timeScale?: number;
}

/**
 * Statistics about time management and performance
 */
export interface TimeStats {
  /** Current frames per second */
  fps: number;
  /** Average frame time in milliseconds */
  averageFrameTime: number;
  /** Number of simulation steps executed in the current frame */
  simulationSteps: number;
  /** Current time scale value */
  timeScale: number;
  /** Total elapsed simulation time in milliseconds */
  totalSimulationTime: number;
  /** Whether simulation is currently paused */
  isPaused: boolean;
}

/**
 * Options for configuring the GameLoop
 */
export interface GameLoopOptions {
  /** TimeManager instance (optional, will create default if not provided) */
  timeManager?: TimeManager;
  /** Whether to use VSync (requestAnimationFrame) (default: true) */
  useVSync?: boolean;
  /** Target frames per second when VSync is disabled */
  targetFPS?: number;
  /** Callback invoked for each simulation step */
  onSimulationStep?: (delta: number) => void;
  /** Callback invoked for each render frame */
  onRender?: (alpha: number) => void;
}

/**
 * TimeManager interface for managing time state and calculations
 */
export interface TimeManager {
  // Core time management
  update(frameDelta: number): number;
  getFixedDelta(): number;
  getScaledDelta(): number;
  getInterpolationAlpha(): number;

  // Time manipulation
  setTimeScale(scale: number): void;
  getTimeScale(): number;
  pause(): void;
  resume(): void;
  isPaused(): boolean;

  // Statistics
  getStats(): TimeStats;
  getTotalSimulationTime(): number;

  // Internal state management
  reset(): void;
  recordFrameTime(frameTime: number): void;
}

/**
 * GameLoop interface for managing the main execution cycle
 */
export interface GameLoop {
  // Lifecycle
  start(): void;
  stop(): void;
  isRunning(): boolean;

  // Frame execution
  tick(timestamp: number): void;

  // Configuration
  setVSync(enabled: boolean): void;
  setTargetFPS(fps: number): void;

  // Access to time manager
  getTimeManager(): TimeManager;
}
