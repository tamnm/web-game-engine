/**
 * Demo selector UI component for the playground sidebar.
 * Renders a list of available demos and handles demo selection.
 */

export interface DemoMetadata {
  name: string;
  description: string;
}

/**
 * Renders the demo list in the sidebar and manages selection state.
 */
export class DemoSelector {
  private container: HTMLElement;
  private currentDemo: string | null = null;
  private onDemoSelect: (demoName: string) => void;

  /**
   * Creates a new DemoSelector instance.
   * @param container - DOM element to render the demo list into
   * @param onDemoSelect - Callback function called when a demo is selected
   */
  constructor(container: HTMLElement, onDemoSelect: (demoName: string) => void) {
    this.container = container;
    this.onDemoSelect = onDemoSelect;
  }

  /**
   * Renders the list of demos in the sidebar.
   * Each demo is displayed as a clickable card with name and description.
   *
   * @param demos - Map of demo names to their metadata
   */
  renderDemoList(demos: Map<string, DemoMetadata>): void {
    // Clear existing content
    this.container.innerHTML = '';

    // Create demo items
    demos.forEach((metadata, name) => {
      const demoItem = this.createDemoItem(name, metadata);
      this.container.appendChild(demoItem);
    });

    // Add keyboard shortcut hint at the bottom
    this.addKeyboardHint();
  }

  /**
   * Creates a single demo item element.
   * @param name - Internal name of the demo
   * @param metadata - Display metadata (name and description)
   * @returns DOM element for the demo item
   */
  private createDemoItem(name: string, metadata: DemoMetadata): HTMLElement {
    const item = document.createElement('div');
    item.className = 'demo-item';
    item.dataset.demo = name;

    // Add active class if this is the current demo
    if (name === this.currentDemo) {
      item.classList.add('active');
    }

    // Demo name
    const nameEl = document.createElement('div');
    nameEl.className = 'demo-item-name';
    nameEl.textContent = metadata.name;
    item.appendChild(nameEl);

    // Demo description
    const descEl = document.createElement('div');
    descEl.className = 'demo-item-description';
    descEl.textContent = metadata.description;
    item.appendChild(descEl);

    // Click handler
    item.addEventListener('click', () => {
      this.selectDemo(name);
    });

    return item;
  }

  /**
   * Adds a keyboard shortcut hint to the bottom of the selector.
   */
  private addKeyboardHint(): void {
    const hint = document.createElement('div');
    hint.className = 'keyboard-hint';
    hint.innerHTML = `
      <strong>Keyboard Shortcuts</strong><br>
      <kbd>F12</kbd> or <kbd>\`</kbd> Toggle dev tools
    `;
    this.container.appendChild(hint);
  }

  /**
   * Selects a demo and updates the UI.
   * @param name - Name of the demo to select
   */
  selectDemo(name: string): void {
    // Update current demo
    this.currentDemo = name;

    // Update active state in UI
    const items = this.container.querySelectorAll('.demo-item');
    items.forEach((item) => {
      if (item instanceof HTMLElement) {
        if (item.dataset.demo === name) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      }
    });

    // Notify parent
    this.onDemoSelect(name);
  }

  /**
   * Gets the currently selected demo name.
   * @returns Current demo name or null if none selected
   */
  getCurrentDemo(): string | null {
    return this.currentDemo;
  }

  /**
   * Sets the current demo without triggering the selection callback.
   * Useful for initializing the selector state.
   * @param name - Name of the demo to mark as current
   */
  setCurrentDemo(name: string): void {
    this.currentDemo = name;

    // Update UI
    const items = this.container.querySelectorAll('.demo-item');
    items.forEach((item) => {
      if (item instanceof HTMLElement) {
        if (item.dataset.demo === name) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      }
    });
  }
}
