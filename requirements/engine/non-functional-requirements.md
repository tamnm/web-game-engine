# Engine Non‑Functional Requirements

## Performance

- ENF-PERF-001: 60 FPS on mid‑range mobile for typical 2D scenes (<= 1k sprites, minimal post‑FX).
- ENF-PERF-002: 120 FPS capable on desktop with VSync off, where supported.
- ENF-PERF-003: Draw call budget: <= 150 per frame on mobile typical scenes (batching expected).
- ENF-PERF-004: Load time (first interactive): < 3s on 4G for sample games.
- ENF-PERF-005: Memory footprint: engine core < 1.5MB gzipped; per scene runtime heap < 200MB.

## Compatibility

- ENF-COMP-001: Browser matrix: latest two versions of Chrome, Edge, Firefox, Safari.
- ENF-COMP-002: Mobile: Android Chrome, iOS Safari latest two releases.
- ENF-COMP-003: Graceful degradation to Canvas 2D with warning in dev overlay.

## Reliability

- ENF-REL-001: Crash‑free sessions > 99.9% for sample games in manual QA.
- ENF-REL-002: Robust error handling: fallback to main menu on runtime errors.
- ENF-REL-003: Asset loading retries with backoff and error UI in dev.

## Usability (DX)

- ENF-DX-001: TypeScript first; strict mode; public API fully typed.
- ENF-DX-002: Semantic versioning; documented breaking changes and migration notes.
- ENF-DX-003: Intuitive API naming; consistent component/system patterns.

## Maintainability

- ENF-MAINT-001: Unit test coverage >= 80% of core modules; critical systems >= 90%.
- ENF-MAINT-002: Linting and formatting enforced in CI; zero warnings on main.
- ENF-MAINT-003: Modular packages where practical; internal APIs stable.

## Security

- ENF-SEC-001: No eval or dynamic code injection; strict CSP‑friendly patterns.
- ENF-SEC-002: Third‑party dependencies vetted; license and vulnerability scanning in CI.

## Accessibility (A11y)

- ENF-A11Y-001: Color contrast for built‑in UI elements follows WCAG AA.
- ENF-A11Y-002: Remappable controls; reduced motion option; vibration optional.

## Internationalization (i18n)

- ENF-I18N-001: Built‑in UI strings externalized; RTL‑friendly anchoring.
