# Performance and Compatibility

## Budgets and Targets

- Frame time budget (mobile): <= 16.6 ms typical scenes; spikes < 25 ms.
- Draw calls (mobile typical): <= 150; desktop: <= 300 typical.
- Sprites: 10k static at 60 FPS desktop; 2k mixed on mobile typical.
- Particles: 1k desktop; 300 mobile typical.
- Load time: < 3s on 4G; < 1.5s on broadband for sample games.
- Bundle size (core): < 1.5MB gzipped; demo game bundle < 4MB gzipped assets (excluding audio optional variants).

## Techniques

- Batching by material/texture; atlas packing; instancing where applicable.
- Culling (frustum, distance) and LOD for expensive effects.
- Avoid per‑frame allocations; object pools for hot paths.
- Use typed arrays and interleaved buffers for render data.

## Compatibility Matrix

- Desktop: Chrome, Edge, Firefox, Safari (latest 2 versions).
- Mobile: Android Chrome, iOS Safari (latest 2 major).
- Fallback: Canvas 2D with reduced effects; warning in dev overlay.

## Feature Detection

- Runtime checks for WebGL2/WebGPU; graceful downgrade to Canvas.
- Audio context unlock for mobile; pointer/touch support sniffing.

## Diagnostics

- Built‑in profiler: per‑system timings; renderer draw calls; batches; GPU vendor/driver.
- Debug overlay toggled via hotkey; minimal overhead when hidden.
