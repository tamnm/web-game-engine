/**
 * Base demo interface and abstract class for playground demos.
 * All demos should extend BaseDemo to ensure consistent lifecycle management.
 */

/**
 * Demo interface defining the contract for all playground demos.
 * Each demo must implement initialization, cleanup, update, and render methods.
 */
export interface Demo {
  /**
   * Initialize the demo: create world, systems, entities, and start game loop.
   * This method is called when the demo is loaded.
   */
  init(): Promise<void>;

  /**
   * Clean up all resources: stop game loop, dispose world and renderer.
   * This method is called when switching to another demo.
   */
  cleanup(): void;

  /**
   * Update game logic. Called by the game loop during simulation steps.
   * @param delta - Time elapsed since last update in milliseconds
   */
  update(delta: number): void;

  /**
   * Render the current frame. Called by the game loop during render phase.
   */
  render(): void;
}

/**
 * Abstract base class for playground demos.
 * Provides common functionality and default implementations for demo lifecycle.
 *
 * Subclasses should:
 * 1. Implement the abstract init() method to set up their specific demo
 * 2. Optionally override cleanup() if additional cleanup is needed
 * 3. Optionally override update() and render() for custom behavior
 *
 * @example
 * class MyDemo extends BaseDemo {
 *   async init(): Promise<void> {
 *     // Create world, systems, entities
 *     this.world = new World();
 *     // ... setup code
 *   }
 * }
 */
export abstract class BaseDemo implements Demo {
  /**
   * Canvas element for rendering. Provided by PlaygroundApp.
   */
  protected canvas: HTMLCanvasElement;

  /**
   * ECS World instance. Should be created in init().
   */
  protected world: unknown = null;

  /**
   * Renderer instance. Should be created in init().
   */
  protected renderer: unknown = null;

  /**
   * Game loop instance. Should be created in init().
   */
  protected gameLoop: unknown = null;

  /**
   * Creates a new demo instance.
   * @param canvas - Canvas element for rendering
   */
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * Initialize the demo. Must be implemented by subclasses.
   * This is where you create the world, systems, entities, and start the game loop.
   */
  abstract init(): Promise<void>;

  /**
   * Default cleanup implementation.
   * Stops the game loop, disposes the world and renderer, and clears the canvas.
   * Subclasses can override this to add additional cleanup logic.
   */
  cleanup(): void {
    // Stop game loop if it exists
    if (
      this.gameLoop &&
      typeof this.gameLoop === 'object' &&
      'stop' in this.gameLoop &&
      typeof this.gameLoop.stop === 'function'
    ) {
      this.gameLoop.stop();
    }

    // Dispose world if it exists
    if (
      this.world &&
      typeof this.world === 'object' &&
      'dispose' in this.world &&
      typeof this.world.dispose === 'function'
    ) {
      this.world.dispose();
    }

    // Dispose renderer if it exists
    if (
      this.renderer &&
      typeof this.renderer === 'object' &&
      'dispose' in this.renderer &&
      typeof this.renderer.dispose === 'function'
    ) {
      this.renderer.dispose();
    }

    // Clear canvas
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Clear references
    this.gameLoop = null;
    this.world = null;
    this.renderer = null;
  }

  /**
   * Default update implementation.
   * Calls world.step() if the world exists.
   * Subclasses can override this for custom update logic.
   *
   * @param delta - Time elapsed since last update in milliseconds
   */
  update(delta: number): void {
    if (
      this.world &&
      typeof this.world === 'object' &&
      'step' in this.world &&
      typeof this.world.step === 'function'
    ) {
      this.world.step(delta);
    }
  }

  /**
   * Default render implementation.
   * Calls renderer.render() if the renderer exists.
   * Subclasses can override this for custom rendering logic.
   */
  render(): void {
    if (
      this.renderer &&
      typeof this.renderer === 'object' &&
      'render' in this.renderer &&
      typeof this.renderer.render === 'function'
    ) {
      this.renderer.render(this.world);
    }
  }
}
