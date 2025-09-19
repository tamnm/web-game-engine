# UI Overlay

The `UIOverlay` provides a lightweight DOM-based overlay for HUD elements.

- Elements: text, image, button, panel
- Anchors: `top-left`, `top-right`, `bottom-left`, `bottom-right`, `center`

Example:

```ts
import { UIOverlay } from '@web-game-engine/core';

const ui = new UIOverlay();
ui.attach();
ui.addText({ text: 'Score: 0', anchor: 'top-left', x: 8, y: 8 });
const panel = ui.addPanel({ title: 'Debug', anchor: 'bottom-right', x: 8, y: 8 });
panel.append('Draw Calls: 0');
```

Detach with `ui.detach()` or clear with `ui.clear()`.
