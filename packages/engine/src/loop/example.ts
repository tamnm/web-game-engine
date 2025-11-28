/**
 * Example: Basic Game Loop Setup
 *
 * This example demonstrates how to set up and use the GameLoop and TimeManager
 * for a deterministic fixed-timestep game with smooth rendering.
 */

import { GameLoop, TimeManager } from './index.js';
import { World } from '../ecs/World.js';
import type { ComponentDefinition } from '../ecs/types.js';

// Example 1: Basic Game Loop with ECS Integration
function basicGameLoopExample() {
  // Create an ECS world
  const world = new World();

  // Create a TimeManager with custom settings
  const timeManager = new TimeManager({
    fixedDelta: 16.67, // 60 Hz simulation
    maxAccumulator: 250, // Prevent spiral of death
    timeScale: 1.0, // Normal speed
  });

  // Create a GameLoop with callbacks
  const gameLoop = new GameLoop({
    timeManager,
    useVSync: true, // Use requestAnimationFrame

    // Simulation callback - called for each fixed timestep
    onSimulationStep: (delta: number) => {
      // Update game logic at fixed timestep
      world.step(delta);
    },

    // Render callback - called for each frame
    onRender: (alpha: number) => {
      // Render with interpolation
      world.render(alpha);
    },
  });

  // Start the game loop
  gameLoop.start();

  // Later: stop the game loop
  // gameLoop.stop();
}

// Example 2: Pause and Resume
function pauseResumeExample() {
  const gameLoop = new GameLoop();
  const timeManager = gameLoop.getTimeManager();

  gameLoop.start();

  // Pause the game (e.g., when opening a menu)
  timeManager.pause();
  console.info('Game paused');

  // Resume the game
  timeManager.resume();
  console.info('Game resumed');

  // Check pause state
  if (timeManager.isPaused()) {
    console.info('Game is currently paused');
  }
}

// Example 3: Time Scale Effects
function timeScaleExample() {
  const gameLoop = new GameLoop();
  const timeManager = gameLoop.getTimeManager();

  gameLoop.start();

  // Normal speed
  timeManager.setTimeScale(1.0);

  // Slow motion (50% speed)
  timeManager.setTimeScale(0.5);
  console.info('Slow motion activated');

  // Fast forward (2x speed)
  timeManager.setTimeScale(2.0);
  console.info('Fast forward activated');

  // Freeze simulation (but keep rendering)
  timeManager.setTimeScale(0);
  console.info('Simulation frozen');

  // Get current time scale
  const currentScale = timeManager.getTimeScale();
  console.info(`Current time scale: ${currentScale}`);
}

// Example 4: Monitoring Performance
function performanceMonitoringExample() {
  const gameLoop = new GameLoop();
  const timeManager = gameLoop.getTimeManager();

  gameLoop.start();

  // Periodically check performance statistics
  setInterval(() => {
    const stats = timeManager.getStats();

    console.info('Performance Stats:', {
      fps: stats.fps.toFixed(2),
      averageFrameTime: stats.averageFrameTime.toFixed(2) + 'ms',
      simulationSteps: stats.simulationSteps,
      timeScale: stats.timeScale,
      totalSimulationTime: (stats.totalSimulationTime / 1000).toFixed(2) + 's',
      isPaused: stats.isPaused,
    });
  }, 1000);
}

// Example 5: Custom Frame Rate Limiting
function frameRateLimitingExample() {
  // Disable VSync and set custom target FPS
  const gameLoop = new GameLoop({
    useVSync: false,
    targetFPS: 30, // Limit to 30 FPS
  });

  gameLoop.start();

  // Change target FPS at runtime
  gameLoop.setTargetFPS(60);

  // Re-enable VSync
  gameLoop.setVSync(true);
}

// Example 6: Complete Game Setup
function completeGameSetupExample() {
  // Create ECS world
  const world = new World();

  // Define a simple component
  interface Position {
    x: number;
    y: number;
  }

  const PositionComponent: ComponentDefinition<Position> = {
    name: 'Position',
    defaults: () => ({ x: 0, y: 0 }),
  };

  // Create an entity
  const player = world.createEntity();
  world.addComponent(player, PositionComponent, { x: 0, y: 0 });

  // Create TimeManager
  const timeManager = new TimeManager({
    fixedDelta: 16.67, // 60 Hz
  });

  // Create GameLoop
  const gameLoop = new GameLoop({
    timeManager,
    useVSync: true,

    onSimulationStep: (delta: number) => {
      // Update game logic
      type Row = { entity: number; position: Position };
      for (const row of world.query<Row>({ all: [PositionComponent] })) {
        // Move entity (frame-rate independent)
        row.position.x += 100 * (delta / 1000); // 100 pixels per second
      }
    },

    onRender: (alpha: number) => {
      // Render with interpolation
      // In a real game, you would interpolate between previous and current positions
      type Row = { entity: number; position: Position };
      for (const row of world.query<Row>({ all: [PositionComponent] })) {
        // Render entity at interpolated position
        console.info(`Render entity at (${row.position.x}, ${row.position.y}) with alpha ${alpha}`);
      }
    },
  });

  // Start the game
  gameLoop.start();

  // Handle pause on window blur
  window.addEventListener('blur', () => {
    timeManager.pause();
  });

  window.addEventListener('focus', () => {
    timeManager.resume();
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    gameLoop.stop();
  });
}

// Export examples for documentation
export {
  basicGameLoopExample,
  pauseResumeExample,
  timeScaleExample,
  performanceMonitoringExample,
  frameRateLimitingExample,
  completeGameSetupExample,
};
