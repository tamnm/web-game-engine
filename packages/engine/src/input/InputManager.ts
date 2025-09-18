import { EventEmitter } from '../utils/EventEmitter';
import {
  ActionBinding,
  ActionState,
  InputEvents,
  InputManagerOptions,
  StorageAdapter,
} from './types';
import { BrowserStorage, MemoryStorage } from './MemoryStorage';

interface InternalBinding extends ActionBinding {}

export class InputManager {
  private readonly bindings: Map<string, InternalBinding[]> = new Map();
  private readonly states: Map<string, ActionState> = new Map();
  private readonly storage: StorageAdapter;
  readonly events = new EventEmitter<InputEvents>();

  constructor(options: InputManagerOptions = {}) {
    this.storage =
      options.storage ??
      (typeof localStorage !== 'undefined' ? new BrowserStorage() : new MemoryStorage());
    const persisted = this.storage.load();
    Object.entries(persisted).forEach(([action, actionBindings]) => {
      this.bindings.set(
        action,
        actionBindings.map((b) => ({ ...b }))
      );
    });
  }

  getBindings(action: string): InternalBinding[] {
    return this.bindings.get(action)?.map((binding) => ({ ...binding })) ?? [];
  }

  bind(action: string, binding: ActionBinding): void {
    const list = this.bindings.get(action) ?? [];
    list.push({ ...binding });
    this.bindings.set(action, list);
    this.persist();
  }

  rebind(action: string, bindings: ActionBinding[]): void {
    this.bindings.set(
      action,
      bindings.map((binding) => ({ ...binding }))
    );
    this.persist();
  }

  removeBinding(action: string, predicate: (binding: ActionBinding) => boolean): void {
    const list = this.bindings.get(action);
    if (!list) return;
    this.bindings.set(
      action,
      list.filter((binding) => !predicate(binding))
    );
    this.persist();
  }

  /**
   * Process a keyboard event. Consumers should call this from window listeners.
   */
  handleKey(code: string, isDown: boolean, timestamp = performance.now()): void {
    this.processInput('keyboard', code, isDown, timestamp);
  }

  handleGamepadButton(code: string, isDown: boolean, timestamp = performance.now()): void {
    this.processInput('gamepad', code, isDown, timestamp);
  }

  handleAction(action: string, isDown: boolean, value = 1, timestamp = performance.now()): void {
    const state = this.getOrCreateState(action);
    state.pressed = isDown;
    state.value = value;
    state.updatedAt = timestamp;
    this.emitState(action, state, isDown);
  }

  private processInput(
    device: InternalBinding['device'],
    code: string,
    isDown: boolean,
    timestamp: number
  ) {
    for (const [action, bindings] of this.bindings) {
      if (bindings.some((binding) => binding.device === device && binding.code === code)) {
        const state = this.getOrCreateState(action);
        state.pressed = isDown;
        state.value = isDown ? 1 : 0;
        state.updatedAt = timestamp;
        this.emitState(action, state, isDown);
      }
    }
  }

  private getOrCreateState(action: string): ActionState {
    const existing = this.states.get(action);
    if (existing) return existing;
    const state: ActionState = {
      pressed: false,
      value: 0,
      updatedAt: performance.now?.() ?? Date.now(),
    };
    this.states.set(action, state);
    return state;
  }

  private emitState(action: string, state: ActionState, isDown: boolean) {
    const event = isDown ? 'actionDown' : 'actionUp';
    this.events.emit(event, { action, state: { ...state } });
  }

  private persist(): void {
    const serializable: Record<string, InternalBinding[]> = {};
    for (const [action, bindings] of this.bindings.entries()) {
      serializable[action] = bindings.map((binding) => ({ ...binding }));
    }
    this.storage.save(serializable);
  }
}
