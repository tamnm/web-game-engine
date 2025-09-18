# Engine Architecture

This document outlines the high‑level architecture for the engine and key design decisions.

## Architectural Style

- ECS (Entity–Component–System) core with a data‑oriented design.
- Modular subsystems: rendering, input, audio, physics/collision, animation, particles, assets, scenes, UI, save/load, debugging, plugin host.
- Event bus for decoupled communication; scheduler for system ordering; resource manager for assets and shared state.

## Rendering

- Primary: WebGL2 2D renderer with batching and sprite/quad pipelines.
- Fallback: Canvas 2D when WebGL2 unavailable.
- Optional: WebGPU behind an experimental build flag.

## Game Loop

- Fixed timestep for simulation (e.g., 60 Hz) with interpolation to display rate (vsync).
- Time manager provides delta time, scaled time, pause/resume, and slow‑mo support.

## ECS

- Entity: lightweight ID.
- Component: plain data (typed), serializable, no behavior.
- System: operates on component queries; deterministic order; configurable stages (init, preUpdate, update, postUpdate, render).

## Scenes and State

- Scene manager controls active scene stack (push/pop/replace), transitions, and preload hooks.
- Scenes compose ECS worlds and resources; cutscenes/menus are scenes.

## Assets and Resources

- Asset loaders for images, spritesheets/atlases, tilemaps, audio, fonts, JSON/CSV, shaders.
- Global resource registry for shared, immutable state (e.g., configuration, theme, physics settings).

## Input and Audio

- Input: keyboard, mouse, touch, pointer, gamepad. Bindings and action mapping layer.
- Audio: WebAudio mixer with busses (master, music, sfx), 2D panning, filters, and dynamic music support.

## Physics/Collision

- Built‑in lightweight collision and resolution for AABB, circle, tilemap; broadphase via uniform grid.
- Optional plugin for advanced 2D physics (e.g., Box2D via WASM).

## UI and Accessibility

- Lightweight UI overlay (HUD, menus), anchoring, layout helpers.
- Accessibility: configurable controls, reduced motion, colorblind‑friendly palettes.

## Plugin System

- Plugins declare systems, components, resources, asset loaders, and editor/devtools panels.
- Lifecycle: install, configure, register, teardown.

## Error Handling and Observability

- Centralized error boundary for engine; recover to menus when possible.
- Logger with levels and categories; profiling hooks; on‑screen dev overlay.

## Packaging

- ESM modules, tree‑shakable, typed TypeScript APIs.
- Builds for modern browsers; polyfills as needed.

## Key Decisions

- ADR-001 (ECS): Prefer data‑oriented ECS for performance and composability.
- ADR-002 (Rendering): WebGL2 primary with Canvas fallback.
- ADR-003 (Loop): Fixed timestep simulation with interpolation.
- ADR-004 (Plugins): Plugin API for extension without forking.
