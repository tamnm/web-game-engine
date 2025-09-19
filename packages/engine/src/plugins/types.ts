import type { World, System } from '../ecs';
import type { UIOverlay } from '../ui';
import { EventEmitter, type EventMap } from '../utils/EventEmitter';

export interface PluginHostOptions {
  world?: World;
  overlay?: UIOverlay;
}

export interface PluginContext {
  world?: World;
  events: EventEmitter<PluginEvents>;
  registerSystem(system: System): void;
  ui?: {
    overlay: UIOverlay;
    addPanel: (title?: string) => HTMLDivElement;
  };
}

export interface PluginDefinition {
  id: string;
  setup(ctx: PluginContext): void | (() => void);
}

export interface PluginEvents extends EventMap {
  installed: { id: string };
  uninstalled: { id: string };
}
