import type { PluginDefinition } from '../../packages/engine/src/plugins';

export function createExamplePlugin(id = 'example-plugin'): PluginDefinition {
  return {
    id,
    setup(ctx) {
      // Optional UI panel
      let panel: HTMLDivElement | undefined;
      let counterEl: HTMLSpanElement | undefined;
      if (ctx.ui) {
        panel = ctx.ui.addPanel('Example Plugin');
        const p = document.createElement('div');
        p.textContent = 'Ticks: ';
        counterEl = document.createElement('span');
        counterEl.textContent = '0';
        p.appendChild(counterEl);
        panel.appendChild(p);
      }

      // Register a simple update system that increments a counter
      let ticks = 0;
      ctx.registerSystem({
        id: `${id}/ticker`,
        stage: 'update',
        execute: () => {
          ticks += 1;
          if (counterEl) counterEl.textContent = String(ticks);
        },
      });

      return () => {
        // Nothing special; PluginHost removes systems and panels
        panel = undefined;
        counterEl = undefined;
      };
    },
  };
}
