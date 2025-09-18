import { EventEmitter } from '../utils/EventEmitter';

export type InputDevice = 'keyboard' | 'gamepad' | 'mouse' | 'touch';

export interface ActionBinding {
  action: string;
  device: InputDevice;
  code: string;
}

export interface ActionState {
  pressed: boolean;
  value: number;
  updatedAt: number;
}

export interface InputEvents {
  actionDown: { action: string; state: ActionState };
  actionUp: { action: string; state: ActionState };
  [key: string]: unknown;
}

export interface StorageAdapter {
  load(): Record<string, ActionBinding[]>;
  save(bindings: Record<string, ActionBinding[]>): void;
}

export interface InputManagerOptions {
  storage?: StorageAdapter;
}

export type { EventEmitter };
