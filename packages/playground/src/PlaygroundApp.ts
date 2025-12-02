/**
 * Main playground application class.
 * Manages demo registration, loading, switching, and UI coordination.
 */

import type { Demo } from './demos/BaseDemo.js';
import { DemoSelector, type DemoMetadata } from './ui/DemoSelector.js';

/**
 * Constructor type for demo classes.
 */
type DemoConstructor = new (canvas: HTMLCanvasElement) => Demo;

/**
 * Internal demo registry entry with constructor.
 */
interface DemoRegistryEntry extends DemoMetadata {
  constructor: DemoConstructor;
}

/**
 * PlaygroundApp orchestrates the entire playground experience.
 * It manages demo registration, loading, cleanup, and UI state.
 */
export class PlaygroundApp {
  private canvas: HTMLCanvasElement;
  private loadingEl: HTMLElement;
  private demoSelector: DemoSelector;
  private demoRegistry: Map<string, DemoRegistryEntry> = new Map();
  private currentDemo: Demo | null = null;
  private currentDemoName: string | null = null;
  private devToolsEnabled: boolean = true;

  /**
   * Creates a new PlaygroundApp instance.
   * @param canvas - Canvas element for rendering demos
   * @param demoSelectorContainer - Container element for the demo selector UI
   * @param loadingEl - Loading indicator element
   */
  constructor(
    canvas: HTMLCanvasElement,
    demoSelectorContainer: HTMLElement,
    loadingEl: HTMLElement
  ) {
    this.canvas = canvas;
    this.loadingEl = loadingEl;

    // Create demo selector with callback for demo selection
    this.demoSelector = new DemoSelector(demoSelectorContainer, (demoName) =>
      this.loadDemo(demoName)
    );
  }

  /**
   * Registers a demo with the playground.
   * The demo will appear in the selector and can be loaded by name.
   *
   * @param name - Internal name for the demo (used as identifier)
   * @param displayName - Display name shown in the UI
   * @param description - Brief description of what the demo showcases
   * @param constructor - Demo class constructor
   *
   * @example
   * app.registerDemo(
   *   'animation',
   *   'Sprite Animation',
   *   'Frame-based sprite animations with loop modes',
   *   AnimationDemo
   * );
   */
  registerDemo(
    name: string,
    displayName: string,
    description: string,
    constructor: DemoConstructor
  ): void {
    if (this.demoRegistry.has(name)) {
      console.warn(`Demo '${name}' is already registered. Overwriting.`);
    }

    this.demoRegistry.set(name, {
      name: displayName,
      description,
      constructor,
    });
  }

  /**
   * Renders the demo selector UI with all registered demos.
   * Should be called after all demos are registered.
   */
  renderDemoSelector(): void {
    // Convert registry to metadata map for the selector
    const metadataMap = new Map<string, DemoMetadata>();
    this.demoRegistry.forEach((entry, name) => {
      metadataMap.set(name, {
        name: entry.name,
        description: entry.description,
      });
    });

    this.demoSelector.renderDemoList(metadataMap);
  }

  /**
   * Loads and starts a demo by name.
   * Automatically cleans up the previous demo before loading the new one.
   *
   * @param name - Internal name of the demo to load
   * @returns Promise that resolves when the demo is loaded and initialized
   *
   * @throws Error if the demo is not found in the registry
   */
  async loadDemo(name: string): Promise<void> {
    try {
      // Show loading indicator
      this.showLoading();

      // Clean up current demo
      this.unloadCurrentDemo();

      // Get demo from registry
      const entry = this.demoRegistry.get(name);
      if (!entry) {
        throw new Error(`Demo not found: ${name}`);
      }

      // Create and initialize new demo
      console.info(`Loading demo: ${entry.name}`);
      this.currentDemo = new entry.constructor(this.canvas);
      await this.currentDemo.init();

      // Update state
      this.currentDemoName = name;
      this.demoSelector.setCurrentDemo(name);

      console.info(`Demo loaded successfully: ${entry.name}`);
    } catch (error) {
      console.error(`Failed to load demo: ${name}`, error);
      this.showError(
        `Failed to load demo: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      // Hide loading indicator
      this.hideLoading();
    }
  }

  /**
   * Unloads the current demo and cleans up its resources.
   * Safe to call even if no demo is currently loaded.
   */
  unloadCurrentDemo(): void {
    if (!this.currentDemo) {
      return;
    }

    try {
      console.info('Cleaning up current demo');
      this.currentDemo.cleanup();
    } catch (error) {
      console.error('Error during demo cleanup:', error);
    } finally {
      this.currentDemo = null;
      this.currentDemoName = null;
    }
  }

  /**
   * Toggles dev tools visibility.
   * Controls the visibility of DevOverlay elements in the DOM.
   */
  toggleDevTools(): void {
    this.devToolsEnabled = !this.devToolsEnabled;
    console.info(`Dev tools ${this.devToolsEnabled ? 'enabled' : 'disabled'}`);

    // Find all DevOverlay elements and toggle their visibility
    const overlays = document.querySelectorAll(
      '[style*="position: fixed"][style*="z-index: 99999"]'
    );
    overlays.forEach((overlay) => {
      if (overlay instanceof HTMLElement) {
        overlay.style.display = this.devToolsEnabled ? 'block' : 'none';
      }
    });
  }

  /**
   * Shows the loading indicator.
   */
  private showLoading(): void {
    this.loadingEl.classList.remove('hidden');
  }

  /**
   * Hides the loading indicator.
   */
  private hideLoading(): void {
    this.loadingEl.classList.add('hidden');
  }

  /**
   * Shows an error message to the user.
   * @param message - Error message to display
   */
  private showError(message: string): void {
    // For now, just use console.error
    // In the future, could show a toast notification or modal
    console.error(message);
    alert(`Error: ${message}`);
  }

  /**
   * Gets the name of the currently loaded demo.
   * @returns Current demo name or null if no demo is loaded
   */
  getCurrentDemoName(): string | null {
    return this.currentDemoName;
  }

  /**
   * Gets the list of all registered demo names.
   * @returns Array of demo names
   */
  getRegisteredDemos(): string[] {
    return Array.from(this.demoRegistry.keys());
  }
}
