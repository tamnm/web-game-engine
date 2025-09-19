import type { System, World } from '../ecs';
import { EventEmitter } from '../utils/EventEmitter';
import type { UIOverlay } from '../ui';
import type { PluginDefinition, PluginEvents, PluginHostOptions, PluginContext } from './types';

interface InstalledRecord {
  id: string;
  teardown?: () => void;
  systems: string[]; // system ids
  panels: HTMLElement[];
}

export class PluginHost {
  private readonly world?: World;
  private readonly overlay?: UIOverlay;
  readonly events = new EventEmitter<PluginEvents>();
  private readonly installed = new Map<string, InstalledRecord>();

  constructor(options: PluginHostOptions = {}) {
    this.world = options.world;
    this.overlay = options.overlay;
  }

  install(plugin: PluginDefinition): void {
    if (this.installed.has(plugin.id)) {
      throw new Error(`Plugin already installed: ${plugin.id}`);
    }
    const systems: string[] = [];
    const panels: HTMLElement[] = [];
    const ctx: PluginContext = {
      world: this.world,
      events: this.events,
      registerSystem: (system: System) => {
        if (!this.world) return;
        this.world.registerSystem(system);
        systems.push(system.id);
      },
      ui: this.overlay
        ? {
            overlay: this.overlay,
            addPanel: (title?: string) => {
              this.overlay!.attach();
              const panel = this.overlay!.addPanel({ title });
              panels.push(panel);
              return panel;
            },
          }
        : undefined,
    };
    let teardown: (() => void) | undefined;
    try {
      const result = plugin.setup(ctx);
      if (typeof result === 'function') teardown = result;
      this.installed.set(plugin.id, { id: plugin.id, teardown, systems, panels });
      this.events.emit('installed', { id: plugin.id });
    } catch (err) {
      // best-effort rollback
      for (const sys of systems) this.world?.unregisterSystem(sys);
      for (const el of panels) el.remove();
      throw err;
    }
  }

  uninstall(id: string): void {
    const rec = this.installed.get(id);
    if (!rec) return;
    try {
      rec.teardown?.();
    } finally {
      for (const sys of rec.systems) this.world?.unregisterSystem(sys);
      for (const el of rec.panels) el.remove();
      this.installed.delete(id);
      this.events.emit('uninstalled', { id });
    }
  }

  isInstalled(id: string): boolean {
    return this.installed.has(id);
  }

  list(): string[] {
    return Array.from(this.installed.keys()).sort();
  }
}
