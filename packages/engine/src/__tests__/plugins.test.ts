import { describe, expect, it, vi } from 'vitest';
import { PluginHost } from '../plugins';
import { World, type System } from '../ecs';
import { UIOverlay } from '../ui';

describe('PluginHost', () => {
  it('installs plugin and registers/unregisters systems', () => {
    const world = new World();
    let ticks = 0;
    const system: System = {
      id: 'tick-counter',
      stage: 'update',
      execute: () => {
        ticks += 1;
      },
    };
    const host = new PluginHost({ world });
    host.install({
      id: 'counter',
      setup(ctx) {
        ctx.registerSystem(system);
      },
    });
    world.registerSystem({ id: 'noop', stage: 'update', execute: () => {} });
    world.step(16);
    expect(ticks).toBe(1);
    host.uninstall('counter');
    world.step(16);
    expect(ticks).toBe(1);
  });

  it('prevents duplicate installation and emits events', () => {
    const world = new World();
    const host = new PluginHost({ world });
    const installed = vi.fn();
    host.events.on('installed', installed);
    host.install({ id: 'p', setup: () => {} });
    expect(installed).toHaveBeenCalledWith({ id: 'p' });
    expect(() => host.install({ id: 'p', setup: () => {} })).toThrowError(
      'Plugin already installed: p'
    );
  });

  it('adds dev panel when overlay provided and removes on uninstall', () => {
    const overlay = new UIOverlay();
    const host = new PluginHost({ overlay });
    host.install({
      id: 'paneler',
      setup(ctx) {
        const panel = ctx.ui?.addPanel('Hello');
        panel && panel.append('x');
      },
    });
    expect(document.body.querySelector('div')!).toBeTruthy();
    host.uninstall('paneler');
    // root overlay may remain attached but panel removed
    expect(
      Array.from(document.querySelectorAll('div')).some((d) =>
        (d.textContent || '').includes('Hello')
      )
    ).toBe(false);
  });
});
