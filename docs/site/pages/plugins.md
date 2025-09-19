# Plugins

Plugins extend the engine at runtime via the `PluginHost`.

Context features:

- `registerSystem(system)` — add ECS systems
- `events` — installed/uninstalled events
- `ui.addPanel(title)` — add a UI panel when a `UIOverlay` is provided

Example:

```ts
import { PluginHost } from '@web-game-engine/core';
import { World, UIOverlay } from '@web-game-engine/core';

const host = new PluginHost({ world: new World(), overlay: new UIOverlay() });
host.install({
  id: 'hello',
  setup(ctx) {
    ctx.registerSystem({
      id: 'hello-system',
      stage: 'update',
      execute: () => {
        /* ... */
      },
    });
    ctx.ui?.addPanel('Hello Plugin');
  },
});
```

See `plugins/example` for a ticker plugin with a UI panel.
