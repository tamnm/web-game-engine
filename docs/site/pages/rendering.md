# Rendering

Rendering supports batching, cameras (parallax/zoom/shake), viewport scaling, shader/blend hooks, and Canvas 2D fallback.

Core APIs:

```ts
import { Renderer, Camera2D, Viewport, TextureAtlas } from '@web-game-engine/core';
```

- `Renderer.begin()` / `Renderer.end()` delimit a frame; stats include draw calls, batches, sprites, and frame time.
- `Renderer.setCamera(camera)` applies world transforms with parallax and zoom.
- `Renderer.setViewport(viewport)` applies scaling (pixel-perfect, letterbox, crop, fit).
- Sprite options include `origin`, `tint [r,g,b,a]`, `blend` (normal/additive/multiply/screen), and `parallax`.
- `TextureAtlas` exposes regions by name with optional per-frame origin.

Tip: In Canvas2D, color tint is simulated via multiply + destination-in masking.
