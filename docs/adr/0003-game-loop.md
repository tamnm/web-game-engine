# ADR 0003: Fixed Timestep Simulation Loop with Interpolation

- **Status:** Accepted (M0 — Foundations)
- **Date:** 2025-09-18
- **Decision Makers:** Engine leads
- **Related Requirements:** ENG-RND-003, ENG-ANM-002, ENF-PERF-001, requirements/engine/architecture.md

## Context

We need deterministic physics, animation timing, and replay fidelity across devices with varying refresh rates. Requirements call for 60 FPS on mobile, optional higher FPS on desktop, paused/time-scaled states, and deterministic replays.

## Decision

Adopt a fixed 60 Hz simulation timestep with accumulator, allowing interpolation/extrapolation for rendering. Provide time scaling, pause, slow-mo, and deterministic replay hooks.

## Consequences

- Simplifies determinism and physics stability.
- Requires interpolation for rendering to avoid judder at unlocked refresh rates.
- Simulation-heavy scenes must respect frame budget; profiling tools (ENG-DBG-001/002) will monitor.
