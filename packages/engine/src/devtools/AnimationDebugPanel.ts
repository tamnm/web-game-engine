import type { Entity, World } from '../ecs/types';
import type { AnimationController } from '../animation/sprite/AnimationController';
import { SpriteAnimation } from '../animation/sprite/components';

/**
 * Options for configuring the AnimationDebugPanel
 */
export interface AnimationDebugPanelOptions {
  /**
   * The HTML element to attach the panel to (defaults to document.body)
   */
  container?: HTMLElement;
  /**
   * The position of the panel on screen
   * @default 'top-right'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Debug panel for inspecting and controlling sprite animations in real-time.
 *
 * Provides an interactive UI overlay that displays:
 * - Current animation clip name
 * - Current frame index
 * - Playback state (playing, paused, stopped)
 * - Accumulated time
 * - Animation speed, loop mode, direction
 * - Flip and rotation transforms
 * - Active transitions
 *
 * Includes playback control buttons:
 * - Play, Pause, Stop
 * - Step forward/backward (manual frame stepping)
 *
 * @example
 * ```typescript
 * const world = new World();
 * const animationManager = new AnimationManager();
 * const controller = new AnimationController(world, animationManager);
 *
 * // Create debug panel
 * const debugPanel = new AnimationDebugPanel(world, controller, {
 *   position: 'top-right'
 * });
 *
 * // Select an entity to debug
 * const entity = world.createEntity();
 * debugPanel.selectEntity(entity);
 *
 * // Attach to DOM
 * debugPanel.attach();
 *
 * // Update in game loop
 * function gameLoop(deltaTime: number) {
 *   world.step(deltaTime);
 *   debugPanel.update(); // Updates display in real-time
 * }
 * ```
 */
export class AnimationDebugPanel {
  private readonly container: HTMLElement;
  private readonly el: HTMLDivElement;
  private readonly controlsEl: HTMLDivElement;
  private readonly infoEl: HTMLDivElement;
  private selectedEntity: Entity | null = null;

  constructor(
    private readonly world: World,
    private readonly controller: AnimationController,
    options: AnimationDebugPanelOptions = {}
  ) {
    this.container = options.container ?? document.body;

    // Create main panel
    this.el = document.createElement('div');
    const pos = options.position ?? 'top-right';
    const style = this.el.style;
    style.position = 'fixed';
    style.zIndex = '99999';
    style.fontFamily = 'monospace';
    style.fontSize = '12px';
    style.color = '#0f0';
    style.background = 'rgba(0,0,0,0.8)';
    style.padding = '8px';
    style.minWidth = '200px';
    style.borderRadius = '4px';

    switch (pos) {
      case 'top-left':
        style.top = '8px';
        style.left = '8px';
        break;
      case 'bottom-left':
        style.bottom = '8px';
        style.left = '8px';
        break;
      case 'bottom-right':
        style.bottom = '8px';
        style.right = '8px';
        break;
      default:
        style.top = '8px';
        style.right = '8px';
    }

    // Create info display
    this.infoEl = document.createElement('div');
    this.infoEl.style.marginBottom = '8px';
    this.infoEl.style.whiteSpace = 'pre';
    this.el.appendChild(this.infoEl);

    // Create controls
    this.controlsEl = document.createElement('div');
    this.controlsEl.style.pointerEvents = 'auto';
    this.el.appendChild(this.controlsEl);

    this.createControls();
  }

  /**
   * Create playback control buttons
   */
  private createControls(): void {
    const buttonStyle = `
      background: #333;
      color: #0f0;
      border: 1px solid #0f0;
      padding: 4px 8px;
      margin: 2px;
      cursor: pointer;
      font-family: monospace;
      font-size: 11px;
    `;

    // Play button
    const playBtn = document.createElement('button');
    playBtn.textContent = '▶ Play';
    playBtn.style.cssText = buttonStyle;
    playBtn.onclick = () => this.onPlay();
    this.controlsEl.appendChild(playBtn);

    // Pause button
    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = '⏸ Pause';
    pauseBtn.style.cssText = buttonStyle;
    pauseBtn.onclick = () => this.onPause();
    this.controlsEl.appendChild(pauseBtn);

    // Stop button
    const stopBtn = document.createElement('button');
    stopBtn.textContent = '⏹ Stop';
    stopBtn.style.cssText = buttonStyle;
    stopBtn.onclick = () => this.onStop();
    this.controlsEl.appendChild(stopBtn);

    // Line break
    this.controlsEl.appendChild(document.createElement('br'));

    // Step backward button
    const stepBackBtn = document.createElement('button');
    stepBackBtn.textContent = '◀ Step';
    stepBackBtn.style.cssText = buttonStyle;
    stepBackBtn.onclick = () => this.onStepBackward();
    this.controlsEl.appendChild(stepBackBtn);

    // Step forward button
    const stepFwdBtn = document.createElement('button');
    stepFwdBtn.textContent = 'Step ▶';
    stepFwdBtn.style.cssText = buttonStyle;
    stepFwdBtn.onclick = () => this.onStepForward();
    this.controlsEl.appendChild(stepFwdBtn);
  }

  /**
   * Set the entity to debug
   */
  selectEntity(entity: Entity): void {
    this.selectedEntity = entity;
    this.update();
  }

  /**
   * Clear the selected entity
   */
  clearSelection(): void {
    this.selectedEntity = null;
    this.update();
  }

  /**
   * Attach the panel to the DOM
   */
  attach(): void {
    if (!this.el.isConnected) {
      this.container.appendChild(this.el);
    }
  }

  /**
   * Detach the panel from the DOM
   */
  detach(): void {
    if (this.el.parentElement) {
      this.el.parentElement.removeChild(this.el);
    }
  }

  /**
   * Update the debug display with current animation state
   */
  update(): void {
    if (this.selectedEntity === null) {
      this.infoEl.textContent = 'No entity selected';
      return;
    }

    const anim = this.world.getComponent(this.selectedEntity, SpriteAnimation);

    if (!anim) {
      this.infoEl.textContent = `Entity ${this.selectedEntity}\nNo animation component`;
      return;
    }

    const lines = [
      `Entity: ${this.selectedEntity}`,
      `Clip: ${anim.clipName || '(none)'}`,
      `Frame: ${anim.frameIndex}`,
      `State: ${anim.state}`,
      `Time: ${anim.accumulatedTime.toFixed(3)}s`,
      `Speed: ${anim.speed.toFixed(2)}x`,
      `Loop: ${anim.loopMode}`,
      `Dir: ${anim.direction === 1 ? 'forward' : 'reverse'}`,
      `Flip: ${anim.flipX ? 'H' : '-'}${anim.flipY ? 'V' : '-'}`,
      `Rot: ${((anim.rotation * 180) / Math.PI).toFixed(1)}°`,
    ];

    if (anim.transition) {
      lines.push(`Transition: ${anim.transition.targetClip}`);
      lines.push(
        `  ${anim.transition.elapsed.toFixed(2)}s / ${anim.transition.duration.toFixed(2)}s`
      );
    }

    this.infoEl.textContent = lines.join('\n');
  }

  /**
   * Play button handler
   */
  private onPlay(): void {
    if (this.selectedEntity === null) return;

    const anim = this.world.getComponent(this.selectedEntity, SpriteAnimation);
    if (!anim || !anim.clipName) return;

    this.controller.play(this.selectedEntity, anim.clipName, false);
    this.update();
  }

  /**
   * Pause button handler
   */
  private onPause(): void {
    if (this.selectedEntity === null) return;
    this.controller.pause(this.selectedEntity);
    this.update();
  }

  /**
   * Stop button handler
   */
  private onStop(): void {
    if (this.selectedEntity === null) return;
    this.controller.stop(this.selectedEntity);
    this.update();
  }

  /**
   * Step forward button handler
   */
  private onStepForward(): void {
    if (this.selectedEntity === null) return;
    this.controller.step(this.selectedEntity, 1);
    this.update();
  }

  /**
   * Step backward button handler
   */
  private onStepBackward(): void {
    if (this.selectedEntity === null) return;
    this.controller.step(this.selectedEntity, -1);
    this.update();
  }

  /**
   * Get the panel element
   */
  get element(): HTMLDivElement {
    return this.el;
  }
}
