# TODO - Current Priorities

## 1. Advanced Tetris (M5)

**Priority:** High  
**Status:** Not started  
**Why now:** This is the largest product gap after the engine/playground work and has the clearest acceptance target.

### Minimum scope for the next iteration

- Implement a playable core loop in `packages/games/tetris-advanced`.
- Add 7-bag piece generation, hold, next queue, gravity, lock delay, soft/hard drop.
- Implement SRS rotation and cover it with focused tests.
- Add scoring for singles/doubles/triples/tetrises, combos, back-to-back, and T-spins.
- Persist configurable DAS/ARR/soft drop settings.

### Exit signal

- The package is no longer a bootstrap placeholder.
- Core gameplay is playable locally and backed by automated tests for rotation, scoring, and determinism.

## 2. Flappy-like (M6)

**Priority:** Medium  
**Status:** Not started  
**Why later:** It depends less on deep rules than Tetris, so it is a better follow-up once the second showcase pattern is established.

### Target scope

- Playable flap/obstacle loop with restart under 500 ms.
- Deterministic daily seed mode.
- Local leaderboard and replay persistence.
- Accessibility toggles and one-button input coverage.

## 3. Release Hardening (M7)

**Priority:** Medium  
**Status:** In progress  
**What is already done:** Docs site, API generation, Pages deployment workflow, and engine playground.

### Remaining work

- Record acceptance status against engine and showcase requirement docs.
- Decide and implement versioning/changelog flow.
- Add publish/release workflow if the engine package is meant to ship externally.
- Expand Pages/example gallery once Tetris and Flappy-like exist.

## Verification Snapshot (March 9, 2026)

- `npm run typecheck`: passing
- `npm run test -- --run`: passing
- `packages/playground`: implemented
- `packages/games/super-snake`: implemented with tests
- `packages/games/tetris-advanced`: placeholder
- `packages/games/flappy-like`: placeholder
