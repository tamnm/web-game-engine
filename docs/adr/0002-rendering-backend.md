# ADR 0002: WebGL2 as Primary Rendering Backend

- **Status:** Accepted (M0 — Foundations)
- **Date:** 2025-09-18
- **Decision Makers:** Rendering leads
- **Related Requirements:** ENG-RND-001 through ENG-RND-006, requirements/engine/architecture.md

## Context

The engine must deliver performant 2D rendering with batching, shaders, and wide browser/device compatibility, while allowing Canvas fallback and future WebGPU experimentation.

## Decision

Use WebGL2 as the primary rendering backend. Provide:

- Shared abstraction layer for sprite/quad pipelines, batching, cameras, post-processing.
- Canvas 2D fallback for environments without WebGL2.
- Experimental WebGPU path behind opt-in feature flag once platform support matures.

## Consequences

- Aligns with performance budgets (ENF-PERF-001/002) and compatibility matrix (ENF-COMP-\*).
- Requires asset pipeline to produce texture atlases optimized for WebGL2.
- Demands tooling/tests specific to WebGL2; fallback path adds maintenance cost.
