# ADR 0001: Adopt Entity-Component-System Core

- **Status:** Accepted (M0 — Foundations)
- **Date:** 2025-09-18
- **Decision Makers:** Engine architecture group
- **Related Requirements:** ENG-ECS-001, ENG-ECS-002, requirements/engine/architecture.md

## Context

The engine must support highly composable gameplay logic, deterministic system ordering, and efficient iteration over large numbers of entities (ENG-ECS-\*, roadmap M1). Data-oriented design eases serialization, replay determinism, and plugin interoperability.

## Decision

Adopt an Entity-Component-System (ECS) core where:

- Entities are opaque IDs.
- Components are typed, data-only records.
- Systems operate over component queries, scheduled in deterministic stages.
- Worlds/scenes own ECS state and resources; plugins extend via registration APIs.

## Consequences

- Clear separation of data and behavior improves testability and decouples engine subsystems.
- Requires tooling for component typing, system scheduling, and serialization (addressed in M1).
- Introduces learning curve; mitigated via documentation and samples (ENG-DOC-001).
