# Web Game Engine Monorepo

A TypeScript-first 2D web game engine paired with three showcase titles (Super Snake, Advanced Tetris, Flappy-like). The repository is organised as an npm workspace so engine, games, docs, and tooling evolve together.

## Packages

- `packages/engine` (`@web-game-engine/core`) — ECS-driven engine core with rendering, audio, input, animation, physics, asset pipeline, demo scene, and tests.
- `packages/games/super-snake` — placeholder for the Super Snake showcase implementation.
- `packages/games/tetris-advanced` — placeholder for the Advanced Tetris showcase.
- `packages/games/flappy-like` — placeholder for the Flappy-style showcase.

Supporting directories:

- `docs/` — onboarding guide, docs site (`docs/site`), and ADRs.
- `requirements/` — detailed functional/non-functional specs, roadmap, user stories, glossary.
- `examples/` — reserved for future tutorials and sandbox scenes.
- `tests/` — reserved for cross-package integration/performance suites.

## Tooling

- TypeScript strict mode with project references (`tsconfig.json`).
- ESLint (flat config) + Prettier + lint-staged + Husky (`.husky/pre-commit`).
- Vitest for unit tests (`vitest.config.ts`).
- GitHub Actions workflow (`.github/workflows/ci.yml`) running lint, typecheck, and tests on pushes/PRs to `main`.

## Scripts

| Command                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `npm install`          | Install dependencies across all workspaces.       |
| `npm run lint`         | Run ESLint across the monorepo.                   |
| `npm run lint:fix`     | Apply safe lint fixes.                            |
| `npm run typecheck`    | Execute TypeScript project references (`tsc -b`). |
| `npm run test`         | Run the Vitest suite once.                        |
| `npm run test:watch`   | Run Vitest in watch mode.                         |
| `npm run build`        | Invoke each workspace build script (tsup / Vite). |
| `npm run clean`        | Remove build artefacts (`dist`, `.turbo`).        |
| `npm run docs:serve`   | Serve the docs site with Vite (dev).              |
| `npm run docs:preview` | Preview the built docs site.                      |
| `npm run docs:api`     | Generate API reference Markdown under docs/site.  |

## Testing

Engine unit tests live in `packages/engine/src/__tests__`. Coverage includes ECS scheduling, scenes, asset manager, input manager, tweening, rendering (batching, cameras, viewport, shaders/blend), and a dev overlay. A performance harness for rendering resides in `tests/performance/` with lenient thresholds to catch regressions.

## Docs

- Static docs site in `docs/site` with a simple theme and sidebar.
- API Reference is generated from TypeScript via `npm run docs:api` into `docs/site/pages/api`.
- See `docs/README.md` for usage, versioning badge, and deployment tips.

## Requirements & ADRs

- Requirements reside in `requirements/` (ENG-_, ENF-_, SNA-_, TET-_, FLP-\* IDs) covering engine, showcases, roadmap, and acceptance criteria.
- Architecture Decision Records live in `docs/adr/` (ECS core, rendering backend, fixed timestep loop, plugin system, more to come).

## Status & Next Milestones

Completed

- M1 — Core Engine MVP (ECS, scenes, assets, input, basic renderer/audio, animation)
- M2 — Rendering & Performance (sprite batching, cameras, viewport scaling, tint/blend hooks, Canvas fallback, dev overlay, perf harness)
- M3 — Polishing & Plugins (initial pass)
- M7 — Docs (site scaffold, tutorials/examples, API reference generation)

Next

1. Finalize M7 — Docs & Release
   - Acceptance runs, changelog, versioning, and publish workflow.
2. Showcase Builds (M4–M6)
   - Implement Super Snake, Advanced Tetris, Flappy-like; leaderboards and deterministic replays.
3. Tooling Cleanup
   - Update Husky pre-commit bootstrap lines before v10.
   - Expand workspace scripts for showcase dev servers.

Refer to `requirements/roadmap-and-milestones.md` for full milestone scope and acceptance checkpoints.
