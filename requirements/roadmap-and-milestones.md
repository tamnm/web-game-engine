# Roadmap and Milestones

Milestones are sequential; each includes exit criteria tied to acceptance.

## Progress Snapshot (verified March 9, 2026)

- M0: Complete. Repository scaffolding, lint/format setup, CI workflows, and ADRs are present.
- M1: Complete. The engine package contains ECS, scenes, assets, input, audio, animation, physics, storage, UI, and tests.
- M2: Complete. Rendering, batching, cameras, viewport handling, fallback behavior, dev overlay, and performance tests are implemented.
- M3: Complete. Plugin host, example plugin coverage, particles, save/load, and UI overlay are in place.
- M4: In progress. `super-snake` is implemented with game systems, UI, leaderboard persistence, replay data capture, and test coverage, but the full SNA-\* acceptance checklist is not yet explicitly signed off in the repo.
- M5: Not started. `tetris-advanced` is still a bootstrap placeholder.
- M6: Not started. `flappy-like` is still a bootstrap placeholder.
- M7: In progress. Docs site, generated API reference, GitHub Pages build, and the engine playground are implemented; release hardening and final acceptance evidence are still missing.

## Current Verification Notes

- `npm run typecheck`: passes.
- `npm run test -- --run`: passes (39 files, 214 tests).
- The old M7 playground TODO is stale. `packages/playground` exists and is built into `docs/playground`.
- Super Snake is the only showcase with meaningful game implementation today.

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
- Engine playground/sandbox is complete in `packages/playground` and published into `docs/playground`.
- Remaining work:
  - Finish showcase coverage so the example gallery includes all three target games.
  - Run and document final acceptance checks against engine and showcase requirements.
  - Add release artifacts such as changelog/versioning workflow and package publishing path if public release is intended.
- Exit: Engine acceptance met; docs and samples published.

## Recommended Next Move

Focus next on M5, not more engine polish. The highest-leverage move is to implement Advanced Tetris first because its acceptance criteria are crisp and testable: 7-bag generation, SRS rotation, scoring, hold/queue behavior, replay determinism, and persisted DAS/ARR settings. Finishing Tetris closes the largest gap between the current repo state and the stated product scope while reusing the now-stable engine foundation.
