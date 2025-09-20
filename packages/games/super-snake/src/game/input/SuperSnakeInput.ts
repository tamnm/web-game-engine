import { InputManager } from '@web-game-engine/core';
import type { ActionBinding, StorageAdapter, InputManagerOptions } from '@web-game-engine/core';
import type { SnakeDirection } from '../components';

export type ControlAction = 'move-up' | 'move-down' | 'move-left' | 'move-right' | 'pause';

export interface SuperSnakeInputOptions {
  storage?: StorageAdapter;
  window?: Window & typeof globalThis;
  navigator?: Navigator;
  gamepadDeadzone?: number;
  enableKeyboard?: boolean;
  enableTouch?: boolean;
  enableGamepad?: boolean;
}

const DEFAULT_BINDINGS: Record<ControlAction, ActionBinding[]> = {
  'move-up': [
    { action: 'move-up', device: 'keyboard', code: 'ArrowUp' },
    { action: 'move-up', device: 'keyboard', code: 'KeyW' },
  ],
  'move-down': [
    { action: 'move-down', device: 'keyboard', code: 'ArrowDown' },
    { action: 'move-down', device: 'keyboard', code: 'KeyS' },
  ],
  'move-left': [
    { action: 'move-left', device: 'keyboard', code: 'ArrowLeft' },
    { action: 'move-left', device: 'keyboard', code: 'KeyA' },
  ],
  'move-right': [
    { action: 'move-right', device: 'keyboard', code: 'ArrowRight' },
    { action: 'move-right', device: 'keyboard', code: 'KeyD' },
  ],
  pause: [
    { action: 'pause', device: 'keyboard', code: 'Escape' },
    { action: 'pause', device: 'keyboard', code: 'Space' },
  ],
};

const PREVENT_DEFAULT_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

interface PointerSnapshot {
  id: number;
  startX: number;
  startY: number;
  startTime: number;
}

export class SuperSnakeInput {
  private readonly manager: InputManager;
  private readonly window: Window & typeof globalThis;
  private readonly navigator?: Navigator;
  private readonly gamepadDeadzone: number;
  private readonly enableKeyboard: boolean;
  private readonly enableTouch: boolean;
  private readonly enableGamepad: boolean;
  private readonly directionQueue: SnakeDirection[] = [];
  private readonly gamepadButtonStates = new Map<string, boolean>();
  private lastAxisDirection: SnakeDirection | null = null;
  private pointerSnapshot: PointerSnapshot | null = null;
  private pointerThreshold = 24;
  private attached = false;
  private readonly listeners: Array<() => void> = [];
  private readonly unsubscribes: Array<() => void> = [];

  constructor(options: SuperSnakeInputOptions = {}) {
    this.window = options.window ?? window;
    this.navigator =
      options.navigator ?? (typeof navigator !== 'undefined' ? navigator : undefined);
    this.gamepadDeadzone = options.gamepadDeadzone ?? 0.35;
    this.enableKeyboard = options.enableKeyboard ?? true;
    this.enableTouch = options.enableTouch ?? true;
    this.enableGamepad = options.enableGamepad ?? true;
    const managerOptions: InputManagerOptions = options.storage ? { storage: options.storage } : {};
    this.manager = new InputManager(managerOptions);
    this.ensureDefaultBindings();
    this.subscribeActions();
  }

  attach(target: HTMLElement): void {
    if (this.attached) return;
    this.attached = true;
    if (this.enableKeyboard) {
      this.addListener(this.window, 'keydown', this.onKeyDown as EventListener, { passive: false });
      this.addListener(this.window, 'keyup', this.onKeyUp as EventListener, { passive: false });
      this.addListener(this.window, 'blur', this.onBlur as EventListener);
    }
    if (this.enableTouch) {
      this.addListener(target, 'pointerdown', this.onPointerDown as EventListener, {
        passive: false,
      });
      this.addListener(target, 'pointerup', this.onPointerUp as EventListener, { passive: false });
      this.addListener(target, 'pointercancel', this.onPointerCancel as EventListener, {
        passive: false,
      });
      this.addListener(target, 'pointerleave', this.onPointerCancel as EventListener, {
        passive: false,
      });
    }
  }

  detach(): void {
    if (!this.attached) return;
    this.attached = false;
    while (this.listeners.length > 0) {
      const dispose = this.listeners.pop();
      dispose?.();
    }
    while (this.unsubscribes.length > 0) {
      const unsubscribe = this.unsubscribes.pop();
      unsubscribe?.();
    }
    this.gamepadButtonStates.clear();
    this.lastAxisDirection = null;
    this.pointerSnapshot = null;
    this.directionQueue.length = 0;
  }

  update(): void {
    if (!this.enableGamepad || !this.navigator?.getGamepads) {
      return;
    }
    const pads = this.navigator.getGamepads?.();
    if (!pads) return;
    for (const pad of pads) {
      if (!pad) continue;
      this.processGamepadButtons(pad);
      this.processGamepadAxes(pad);
    }
  }

  consumeDirection(): SnakeDirection | null {
    return this.directionQueue.shift() ?? null;
  }

  queueDirection(direction: SnakeDirection): void {
    const last = this.directionQueue[this.directionQueue.length - 1];
    if (last === direction) return;
    this.directionQueue.push(direction);
  }

  getBindings(action: ControlAction): ActionBinding[] {
    return this.manager.getBindings(action);
  }

  rebind(action: ControlAction, bindings: ActionBinding[]): void {
    this.manager.rebind(action, bindings);
  }

  private ensureDefaultBindings(): void {
    (Object.keys(DEFAULT_BINDINGS) as ControlAction[]).forEach((action) => {
      if (this.manager.getBindings(action).length === 0) {
        this.manager.rebind(action, DEFAULT_BINDINGS[action]);
      }
    });
  }

  private subscribeActions(): void {
    this.unsubscribes.push(
      this.manager.events.on('actionDown', ({ action }) => {
        switch (action as ControlAction) {
          case 'move-up':
            this.queueDirection('up');
            break;
          case 'move-down':
            this.queueDirection('down');
            break;
          case 'move-left':
            this.queueDirection('left');
            break;
          case 'move-right':
            this.queueDirection('right');
            break;
          default:
            break;
        }
      })
    );
  }

  private addListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
    this.listeners.push(() => target.removeEventListener(type, listener, options));
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enableKeyboard) return;
    if (event.repeat) return;
    if (PREVENT_DEFAULT_KEYS.has(event.code)) {
      event.preventDefault();
    }
    this.manager.handleKey(event.code, true, this.now());
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    if (!this.enableKeyboard) return;
    if (PREVENT_DEFAULT_KEYS.has(event.code)) {
      event.preventDefault();
    }
    this.manager.handleKey(event.code, false, this.now());
  };

  private onBlur = (): void => {
    const actions: ControlAction[] = ['move-up', 'move-down', 'move-left', 'move-right'];
    actions.forEach((action) => {
      this.manager.handleAction(action, false, 0, this.now());
    });
  };

  private onPointerDown = (event: PointerEvent): void => {
    if (!this.enableTouch) return;
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    this.pointerSnapshot = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTime: this.now(),
    };
    event.preventDefault();
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (!this.enableTouch) return;
    if (!this.pointerSnapshot || event.pointerId !== this.pointerSnapshot.id) return;
    const dx = event.clientX - this.pointerSnapshot.startX;
    const dy = event.clientY - this.pointerSnapshot.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < this.pointerThreshold && absY < this.pointerThreshold) {
      this.pointerSnapshot = null;
      return;
    }
    if (absX > absY) {
      this.queueDirection(dx > 0 ? 'right' : 'left');
    } else {
      this.queueDirection(dy > 0 ? 'down' : 'up');
    }
    this.pointerSnapshot = null;
    event.preventDefault();
  };

  private onPointerCancel = (): void => {
    if (!this.enableTouch) return;
    this.pointerSnapshot = null;
  };

  private processGamepadButtons(pad: Gamepad): void {
    const mappings: Array<{ index: number; direction: SnakeDirection }> = [
      { index: 12, direction: 'up' },
      { index: 13, direction: 'down' },
      { index: 14, direction: 'left' },
      { index: 15, direction: 'right' },
    ];
    mappings.forEach(({ index, direction }) => {
      const button = pad.buttons[index];
      if (!button) return;
      const key = `${pad.index}:button:${index}`;
      const previous = this.gamepadButtonStates.get(key) ?? false;
      if (button.pressed && !previous) {
        this.queueDirection(direction);
      }
      this.gamepadButtonStates.set(key, button.pressed);
    });
  }

  private processGamepadAxes(pad: Gamepad): void {
    const axes = pad.axes ?? [];
    if (axes.length < 2) {
      this.lastAxisDirection = null;
      return;
    }
    const [x, y] = axes;
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    let direction: SnakeDirection | null = null;
    if (absX > absY && absX > this.gamepadDeadzone) {
      direction = x > 0 ? 'right' : 'left';
    } else if (absY > this.gamepadDeadzone) {
      direction = y > 0 ? 'down' : 'up';
    }
    if (direction && direction !== this.lastAxisDirection) {
      this.queueDirection(direction);
      this.lastAxisDirection = direction;
    }
    if (!direction) {
      this.lastAxisDirection = null;
    }
  }

  private now(): number {
    return this.window.performance?.now() ?? Date.now();
  }
}
