# Developer Onboarding

Welcome to the web game engine monorepo. This guide helps new contributors get productive quickly.

## Prerequisites

- Node.js ≥ 20 (see `.nvmrc` once added).
- npm 9+ (bundled with Node 20).
- Recommended: pnpm or yarn if you prefer, but npm workspaces are supported out of the box.

## Install Dependencies

```bash
npm install
```

## Useful Scripts

| Command                | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run lint`         | Lints all packages using the shared ESLint config.               |
| `npm run lint:fix`     | Lints and applies safe fixes.                                    |
| `npm run format`       | Formats files with Prettier.                                     |
| `npm run format:check` | Verifies formatting without writing.                             |
| `npm run typecheck`    | Runs TypeScript project references (engine + showcase packages). |
| `npm run test`         | Executes the Vitest suite once.                                  |
| `npm run test:watch`   | Runs Vitest in watch mode.                                       |
| `npm run build`        | Runs each workspace build script (tsup/vite).                    |
| `npm run clean`        | Removes build artifacts.                                         |

## Workspace Layout

- `packages/engine` — core engine source (`@web-game-engine/core`).
- `packages/games/*` — showcase games built on the engine.
- `docs/` — ADRs, onboarding, planning artifacts.
- `examples/` — sandboxes and tutorial code snippets (to be populated).
- `tests/` — cross-package integration/performance suites.
- `requirements/` — product and technical requirements (see README).

## Workflow

1. Create a branch off `main`.
2. Make changes and ensure `npm run lint`, `npm run typecheck`, and `npm run test` succeed.
3. Commit; Husky runs `lint-staged` to keep diffs clean.
4. Open a PR; GitHub Actions runs CI (lint → typecheck → test).

## IDE Tips

- Use VS Code with the ESLint and Prettier extensions for best experience.
- Enable TypeScript project references by opening the repo root, not individual package directories.

## Next Steps

- Review `requirements/roadmap-and-milestones.md` to understand milestone goals.
- Browse ADRs in `docs/adr` for historical decisions.
- For engine internals, start with `requirements/engine/architecture.md`.
