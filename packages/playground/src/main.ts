/**
 * Main entry point for the Engine Playground.
 * Initializes the playground app, registers demos, and sets up keyboard shortcuts.
 */

import { PlaygroundApp } from './PlaygroundApp.js';
import { AnimationDemo, PhysicsDemo, ParticlesDemo, InputDemo } from './demos/index.js';

/**
 * Initialize and start the playground application.
 */
function main(): void {
  // Get DOM elements
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const demoListContainer = document.getElementById('demo-list') as HTMLElement;
  const loadingEl = document.getElementById('loading') as HTMLElement;

  // Validate required elements exist
  if (!canvas) {
    throw new Error('Canvas element #game-canvas not found');
  }
  if (!demoListContainer) {
    throw new Error('Demo list container #demo-list not found');
  }
  if (!loadingEl) {
    throw new Error('Loading element #loading not found');
  }

  // Create playground app instance
  const app = new PlaygroundApp(canvas, demoListContainer, loadingEl);

  // Register all available demos
  // Each demo is registered with an internal name, display name, description, and constructor

  app.registerDemo(
    'animation',
    'Sprite Animation',
    'Frame-based sprite animations with loop modes, speed control, and transforms',
    AnimationDemo
  );

  app.registerDemo(
    'physics',
    'Physics & Collision',
    'Collision detection with different shapes, velocity, and interactive spawning',
    PhysicsDemo
  );

  app.registerDemo(
    'particles',
    'Particle Effects',
    'Particle emitters with burst and continuous modes, interactive triggering',
    ParticlesDemo
  );

  app.registerDemo(
    'input',
    'Input Handling',
    'Keyboard, mouse, and gamepad input with real-time visual feedback',
    InputDemo
  );

  // Render the demo selector UI
  app.renderDemoSelector();

  // Load the default demo (Animation)
  // This happens asynchronously, errors are handled by PlaygroundApp
  app.loadDemo('animation').catch((error) => {
    console.error('Failed to load default demo:', error);
  });

  // Set up keyboard shortcuts
  setupKeyboardShortcuts(app);

  console.info('Engine Playground initialized');
  console.info('Available demos:', app.getRegisteredDemos());
}

/**
 * Set up global keyboard shortcuts for the playground.
 * @param app - PlaygroundApp instance
 */
function setupKeyboardShortcuts(app: PlaygroundApp): void {
  document.addEventListener('keydown', (event) => {
    // F12 or backtick (`) to toggle dev tools
    if (event.key === 'F12' || event.key === '`') {
      event.preventDefault();
      app.toggleDevTools();
    }
  });
}

// Start the playground when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
