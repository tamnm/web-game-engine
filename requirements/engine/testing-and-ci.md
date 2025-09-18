# Testing and CI

## Testing Strategy

- Unit tests: core math, ECS, input normalization, asset loaders, utility functions.
- Integration tests: rendering (offscreen/headless), physics overlap/raycast, scene transitions, audio routing (mocked).
- E2E tests: showcase games boot, menu interactions, gameplay flows, pause/resume, save/load.
- Performance tests: frame time under scripted scenes; regression thresholds.
- Determinism tests: replays for sample games reproduce outcomes.

## Tooling

- Test runner: Vitest or Jest (TS support).
- Headless browser: Playwright for E2E and visual snapshots.
- Lint: ESLint; Format: Prettier; Type checks: tsc in strict mode.

## Coverage Targets

- Core engine modules: >= 80%; critical systems: >= 90% line/branch.

## CI Pipelines

- On PR: lint, typecheck, unit + integration tests, coverage report.
- Nightly: E2E suite, performance benchmarks, dependency audit/licensing.
- Release: version bump checks, changelog, tag, publish artifacts.

## Artifacts

- Coverage badges, HTML reports, benchmark trends over time.
