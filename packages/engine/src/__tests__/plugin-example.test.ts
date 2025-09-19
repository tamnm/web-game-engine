import { describe, expect, it } from 'vitest';
import { World } from '../ecs';
import { UIOverlay } from '../ui';
import { PluginHost, type PluginDefinition } from '../plugins';

describe('Example Plugin', () => {
  it('adds a panel and updates tick counter via system', async () => {
    const world = new World();
    const overlay = new UIOverlay();
    const host = new PluginHost({ world, overlay });
    // Dynamically import the example plugin to avoid TS rootDir complaints
    const mod = await import(
      new URL('../../../../plugins/example/index.ts', import.meta.url).pathname
    );
    const createExamplePlugin = (mod as { createExamplePlugin: (id?: string) => PluginDefinition })
      .createExamplePlugin;
    host.install(createExamplePlugin());
    // Run a few frames
    world.registerSystem({ id: 'noop', stage: 'update', execute: () => {} });
    for (let i = 0; i < 5; i++) world.step(16);
    const panel = Array.from(document.querySelectorAll('div')).find((d) =>
      (d.textContent || '').includes('Example Plugin')
    ) as HTMLDivElement | undefined;
    expect(panel).toBeTruthy();
    const txt = panel?.textContent || '';
    expect(txt).toContain('Ticks:');
    // Should have incremented beyond 0 after several steps
    const match = txt.match(/Ticks:\s*(\d+)/);
    expect(match).toBeTruthy();
    if (match) expect(parseInt(match[1]!, 10)).toBeGreaterThan(0);
  });
});
