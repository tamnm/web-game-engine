/**
 * Game loop and time management module
 *
 * Provides fixed timestep simulation with frame interpolation for deterministic,
 * frame-rate independent gameplay.
 */

export type {
  TimeManagerOptions,
  TimeStats,
  GameLoopOptions,
  TimeManager as ITimeManager,
  GameLoop as IGameLoop,
} from './types.js';

export { TimeManager } from './TimeManager.js';
export { GameLoop } from './GameLoop.js';
