/**
 * Input handling demo.
 * Demonstrates keyboard, mouse, and gamepad input with visual feedback.
 */

import { BaseDemo } from './BaseDemo.js';
import { Renderer, GameLoop, InputManager, DevOverlay, Vec2 } from '@web-game-engine/core';

/**
 * InputDemo showcases the engine's input handling capabilities.
 * Features:
 * - Visual feedback for keyboard input (show pressed keys)
 * - Mouse position and button state display
 * - Gamepad button and axis state display
 * - Real-time input event details
 */
export class InputDemo extends BaseDemo {
  private devOverlay!: DevOverlay;
  private inputManager!: InputManager;
  private pressedKeys: Set<string> = new Set();
  private mousePos: Vec2 = { x: 0, y: 0 };
  private mouseButtons: Set<number> = new Set();
  private lastInputEvent = '';

  async init(): Promise<void> {
    console.info('InputDemo: Initializing input handling showcase');

    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;

    // Create renderer - force Canvas 2D (WebGL not implemented yet)
    this.renderer = new Renderer({
      contextProvider: () => this.canvas.getContext('2d'),
    }) as unknown;

    // Create input manager
    this.inputManager = new InputManager();

    // Set up input bindings for common actions
    this.inputManager.bind('jump', { action: 'jump', device: 'keyboard', code: 'Space' });
    this.inputManager.bind('moveLeft', {
      action: 'moveLeft',
      device: 'keyboard',
      code: 'ArrowLeft',
    });
    this.inputManager.bind('moveRight', {
      action: 'moveRight',
      device: 'keyboard',
      code: 'ArrowRight',
    });
    this.inputManager.bind('moveUp', { action: 'moveUp', device: 'keyboard', code: 'ArrowUp' });
    this.inputManager.bind('moveDown', {
      action: 'moveDown',
      device: 'keyboard',
      code: 'ArrowDown',
    });

    // Listen to input events
    this.inputManager.events.on('actionDown', ({ action, state }) => {
      this.lastInputEvent = `Action DOWN: ${action} (value: ${state.value})`;
    });

    this.inputManager.events.on('actionUp', ({ action, state }) => {
      this.lastInputEvent = `Action UP: ${action} (value: ${state.value})`;
    });

    // Create game loop
    this.gameLoop = new GameLoop({
      onSimulationStep: (delta: number) => this.update(delta),
      onRender: () => this.render(),
      targetFPS: 60,
    }) as unknown;

    // Enable dev tools overlay
    this.devOverlay = new DevOverlay({ position: 'top-left' });
    this.devOverlay.attach();

    // Set up input listeners
    this.setupInputListeners();

    // Start the game loop
    (this.gameLoop as GameLoop).start();

    console.info('InputDemo: Initialized successfully');
  }

  /**
   * Set up input event listeners.
   */
  private setupInputListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.pressedKeys.add(e.code);
      this.inputManager.handleKey(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.pressedKeys.delete(e.code);
      this.inputManager.handleKey(e.code, false);
    });

    // Mouse events
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = e.clientX - rect.left;
      this.mousePos.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.mouseButtons.add(e.button);
      this.lastInputEvent = `Mouse DOWN: Button ${e.button}`;
    });

    this.canvas.addEventListener('mouseup', (e) => {
      this.mouseButtons.delete(e.button);
      this.lastInputEvent = `Mouse UP: Button ${e.button}`;
    });

    // Gamepad polling (if available)
    // Note: Gamepad API requires polling in the update loop
  }

  /**
   * Update input state and poll gamepads.
   */
  override update(delta: number): void {
    // Delta not needed for input polling
    void delta;

    // Poll gamepad state
    const gamepads = navigator.getGamepads?.();
    if (gamepads) {
      for (const gamepad of gamepads) {
        if (gamepad) {
          // Check buttons
          gamepad.buttons.forEach((button, index) => {
            if (button.pressed) {
              this.inputManager.handleGamepadButton(`Button${index}`, true);
            }
          });
        }
      }
    }
  }

  /**
   * Render input state visualization.
   */
  override render(): void {
    const renderer = this.renderer as Renderer;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    // Begin rendering frame
    renderer.begin();

    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Input Demo', this.canvas.width / 2, 40);

    // Draw keyboard section
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4a9eff';
    ctx.fillText('Keyboard', 50, 100);

    ctx.font = '16px system-ui';
    ctx.fillStyle = '#b0b0b0';
    ctx.fillText('Press any key to see it here:', 50, 130);

    // Display pressed keys
    ctx.fillStyle = '#ffffff';
    const keysArray = Array.from(this.pressedKeys);
    let keyboardSectionEndY = 160;

    if (keysArray.length > 0) {
      keysArray.forEach((key, index) => {
        const x = 50 + (index % 5) * 140;
        const y = 160 + Math.floor(index / 5) * 40;

        // Draw key box
        ctx.fillStyle = '#4a9eff';
        ctx.fillRect(x, y, 120, 30);

        // Draw key text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(key, x + 60, y + 20);

        // Track the bottom of the keyboard section
        keyboardSectionEndY = Math.max(keyboardSectionEndY, y + 30);
      });
    } else {
      ctx.fillStyle = '#666666';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('No keys pressed', 50, 180);
      keyboardSectionEndY = 180;
    }

    // Reset text alignment to left for subsequent sections
    ctx.textAlign = 'left';

    // Draw mouse section (dynamically positioned below keyboard section)
    const mouseSectionY = keyboardSectionEndY + 50;
    ctx.font = 'bold 20px system-ui';
    ctx.fillStyle = '#50c878';
    ctx.fillText('Mouse', 50, mouseSectionY);

    ctx.font = '16px system-ui';
    ctx.fillStyle = '#b0b0b0';
    ctx.fillText(
      `Position: (${Math.round(this.mousePos.x)}, ${Math.round(this.mousePos.y)})`,
      50,
      mouseSectionY + 30
    );

    // Display mouse buttons
    const buttonsArray = Array.from(this.mouseButtons);
    if (buttonsArray.length > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Buttons: ${buttonsArray.join(', ')}`, 50, mouseSectionY + 60);
    } else {
      ctx.fillStyle = '#666666';
      ctx.fillText('No buttons pressed', 50, mouseSectionY + 60);
    }

    // Draw mouse cursor indicator
    ctx.fillStyle = '#50c878';
    ctx.beginPath();
    ctx.arc(this.mousePos.x, this.mousePos.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Draw gamepad section (dynamically positioned below mouse section)
    const gamepadSectionY = mouseSectionY + 110;
    ctx.font = 'bold 20px system-ui';
    ctx.fillStyle = '#ffd93d';
    ctx.fillText('Gamepad', 50, gamepadSectionY);

    const gamepads = navigator.getGamepads?.();
    const connectedGamepad = gamepads ? Array.from(gamepads).find((gp) => gp !== null) : null;

    if (connectedGamepad) {
      ctx.font = '16px system-ui';
      ctx.fillStyle = '#b0b0b0';
      ctx.fillText(`Connected: ${connectedGamepad.id}`, 50, gamepadSectionY + 30);

      // Show button states
      const pressedButtons = connectedGamepad.buttons
        .map((btn, idx) => (btn.pressed ? `B${idx}` : null))
        .filter((b) => b !== null);

      if (pressedButtons.length > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Buttons: ${pressedButtons.join(', ')}`, 50, gamepadSectionY + 60);
      }

      // Show axes
      if (connectedGamepad.axes.length > 0) {
        ctx.fillStyle = '#b0b0b0';
        ctx.fillText(
          `Axes: ${connectedGamepad.axes.map((a) => a.toFixed(2)).join(', ')}`,
          50,
          gamepadSectionY + 90
        );
      }
    } else {
      ctx.font = '14px system-ui';
      ctx.fillStyle = '#666666';
      ctx.fillText('No gamepad connected', 50, gamepadSectionY + 30);
      ctx.fillText('Connect a gamepad and press any button', 50, gamepadSectionY + 55);
    }

    // Draw last input event
    if (this.lastInputEvent) {
      ctx.font = 'bold 16px system-ui';
      ctx.fillStyle = '#ff6b6b';
      ctx.textAlign = 'center';
      ctx.fillText(`Last Event: ${this.lastInputEvent}`, this.canvas.width / 2, 580);
    }

    // End rendering frame and get stats
    const stats = renderer.end();

    // Update dev overlay
    if (this.devOverlay) {
      this.devOverlay.update(stats);
    }
  }

  /**
   * Override cleanup to properly dispose input resources.
   */
  override cleanup(): void {
    console.info('InputDemo: Cleaning up resources');

    // Remove event listeners
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
    this.canvas.removeEventListener('mousemove', () => {});
    this.canvas.removeEventListener('mousedown', () => {});
    this.canvas.removeEventListener('mouseup', () => {});

    // Clear state
    this.pressedKeys.clear();
    this.mouseButtons.clear();

    // Detach dev overlay
    if (this.devOverlay) {
      this.devOverlay.detach();
    }

    // Call base cleanup
    super.cleanup();
  }
}
