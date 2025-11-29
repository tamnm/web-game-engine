# Roadmap and Milestones

Milestones are sequential; each includes exit criteria tied to acceptance.

## M0 — Foundations (Weeks 1–2)

- Project scaffolding, coding standards, lint/format, CI skeleton.
- Decision records (ADRs) covering ECS, rendering, loop, plugins.
- Exit: CI green; docs skeleton present.

## M1 — Core Engine MVP (Weeks 3–6)

- ECS, scenes, assets, input, basic renderer, audio.
- Tilemaps, basic physics/collision, animations, tweening.
- Exit: Small demo scene meets ENG-\* minimal set; 60 FPS desktop.

## M2 — Rendering + Perf (Weeks 7–9)

- Batching, atlas, cameras, post‑FX hooks; Canvas fallback.
- Dev overlay, profiling; performance budgets enforced.
- Exit: Perf targets met on desktop + mobile reference.

## M3 — Polishing + Plugins (Weeks 10–11)

- UI overlay, save/load, particles, plugin host with example plugin.
- Exit: Example plugin shipped; docs drafted.

## M4 — Showcase: Super Snake (Weeks 12–13)

- Implement Super Snake; validate replays and leaderboards.
- Exit: SNA-\* acceptance satisfied across browser matrix.

## M5 — Showcase: Advanced Tetris (Weeks 14–16)

- Implement Tetris; SRS tests; replay determinism.
- Exit: TET-\* acceptance satisfied; perf targets met.

## M6 — Showcase: Flappy‑like (Weeks 17–18)

- Implement Flappy‑like; polish and accessibility toggles.
- Exit: FLP-\* acceptance satisfied; quick restart metric achieved.

## M7 — Documentation + Release (Weeks 19–20)

- Complete docs, tutorials, API reference; example gallery.
- **TODO: Create engine playground/sandbox** - Interactive demo package showcasing engine features (animation, physics, particles, input) with demo selector UI. Allows developers to quickly try the engine in browser without building a full game. Should reuse existing demo classes (e.g., SpriteAnimationDemo) and include dev tools enabled.
- Exit: Engine acceptance met; docs and samples published.
