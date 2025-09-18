# Web Game Engine Monorepo

A TypeScript-first 2D web game engine paired with three showcase titles (Super Snake, Advanced Tetris, Flappy-like). The repository is organised as an npm workspace so engine, games, docs, and tooling evolve together.

## Packages

- `packages/engine` (`@web-game-engine/core`) — ECS-driven engine core with rendering, audio, input, animation, physics, asset pipeline, demo scene, and tests.
- `packages/games/super-snake` — placeholder for the Super Snake showcase implementation.
- `packages/games/tetris-advanced` — placeholder for the Advanced Tetris showcase.
- `packages/games/flappy-like` — placeholder for the Flappy-style showcase.

Supporting directories:

- `docs/` — onboarding guide and ADRs covering architectural decisions.
- `requirements/` — detailed functional/non-functional specs, roadmap, user stories, glossary.
- `examples/` — reserved for future tutorials and sandbox scenes.
- `tests/` — reserved for cross-package integration/performance suites.

## Tooling

- TypeScript strict mode with project references (`tsconfig.json`).
- ESLint (flat config) + Prettier + lint-staged + Husky (`.husky/pre-commit`).
- Vitest for unit tests (`vitest.config.ts`).
- GitHub Actions workflow (`.github/workflows/ci.yml`) running lint, typecheck, and tests on pushes/PRs to `main`.

## Scripts

| Command              | Description                                       |
| -------------------- | ------------------------------------------------- |
| `npm install`        | Install dependencies across all workspaces.       |
| `npm run lint`       | Run ESLint across the monorepo.                   |
| `npm run lint:fix`   | Apply safe lint fixes.                            |
| `npm run typecheck`  | Execute TypeScript project references (`tsc -b`). |
| `npm run test`       | Run the Vitest suite once.                        |
| `npm run test:watch` | Run Vitest in watch mode.                         |
| `npm run build`      | Invoke each workspace build script (tsup / Vite). |
| `npm run clean`      | Remove build artefacts (`dist`, `.turbo`).        |

## Testing

Engine unit tests live in `packages/engine/src/__tests__`. Current coverage exercises ECS scheduling, scenes, asset manager, input manager, tweening, and the minimal demo scene. Integration and E2E suites will expand as milestones progress.

## Requirements & ADRs

- Requirements reside in `requirements/` (ENG-_, ENF-_, SNA-_, TET-_, FLP-\* IDs) covering engine, showcases, roadmap, and acceptance criteria.
- Architecture Decision Records live in `docs/adr/` (ECS core, rendering backend, fixed timestep loop, plugin system, more to come).

## TODOs / Next Milestones

1. **M2 — Rendering & Performance**
   - Implement sprite batching, camera/parallax system, viewport scaling modes, shader/post-effect hooks, Canvas fallback parity, and dev overlay/profiler.
   - Add performance harness with budgets and regression thresholds.
2. **M3 — Polishing & Plugins**
   - Build UI overlay widgets, save/load system, particle engine, plugin host API, and example plugin with docs.
3. **Showcase Builds (M4–M6)**
   - Implement Super Snake, Advanced Tetris, and Flappy-like using engine APIs; wire leaderboards, deterministic replays, accessibility options, polish.
4. **M7 — Docs & Release**
   - Publish docs site (API reference, tutorials, gallery), run final acceptance across engine + showcases, create release automation (changelog, tag).
5. **Tooling Cleanup**
   - Update Husky hook to remove deprecated bootstrap lines before v10.
   - Expand npm scripts for showcase/devserver workflows as games materialise.

Refer to `requirements/roadmap-and-milestones.md` for full milestone scope and acceptance checkpoints.
