# ADR 0004: Engine Plugin System

- **Status:** Accepted (M0 — Foundations)
- **Date:** 2025-09-18
- **Decision Makers:** Engine + DX leads
- **Related Requirements:** ENG-PLG-001, ENG-PLG-002, requirements/engine/architecture.md

## Context

Engine extensibility is critical for internal teams and external contributors. Requirements mandate plugins that can register systems, components, resources, loaders, and devtools panels without forking the engine.

## Decision

Introduce a plugin manager that:

- Loads plugin manifests describing dependencies and capabilities.
- Provides lifecycle hooks (install, configure, register, teardown).
- Offers scoped registration APIs for systems, components, asset loaders, resources, and devtools UIs.
- Supports runtime enable/disable with namespace isolation to avoid collisions.

## Consequences

- Provides sustainable extension path aligned with ENG-PLG-\* requirements.
- Requires sandboxing and version compatibility checks to maintain stability.
- Documentation and examples must clearly explain plugin authoring (ENG-DOC-001/002).
