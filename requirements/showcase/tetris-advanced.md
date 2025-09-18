# Advanced Tetris — Requirements

## Vision

Responsive, feature‑complete falling‑blocks with modern rotation system, smooth DAS/ARR, and competitive scoring.

## Core Gameplay

- TET-FUN-001: Standard 7‑bag randomizer; hold piece; next queue (>= 5).
- TET-FUN-002: SRS rotation with wall/floor kicks; lock delay and soft/hard drop.
- TET-FUN-003: Line clear effects with combos, back‑to‑back scoring; T‑spin detection.
- TET-FUN-004: Levels and gravity scaling; speeds curated for mobile and desktop.

## Controls

- TET-CTL-001: Keyboard, gamepad, touch; configurable DAS/ARR/softdrop speeds; remappable.

## Presentation

- TET-PRS-001: Crisp pixel alignment; subpixel animation for UI; ghost piece.
- TET-PRS-002: Particle and screen shake on multiple lines; subtle backgrounds.

## Audio

- TET-AUD-001: Music with tempo increase at high level; sfx for rotate, move, drop, line clears.

## UI/Meta

- TET-UI-001: Menus: main, marathon/sprint, settings, pause, game over.
- TET-UI-002: Local leaderboards (marathon highest, sprint best time); replays.

## Performance

- TET-PERF-001: 60 FPS on mid‑range mobile with effects.

## Acceptance

- All TET-\* implemented; SRS behavior verified via test suite; replays deterministic; DAS/ARR configurable and persisted; scoring aligns with documented table.
