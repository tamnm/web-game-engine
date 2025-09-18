# Engine Functional Requirements

IDs use prefix ENG-[AREA]-[NNN]. Acceptance criteria are testable.

## Rendering (RND)

- ENG-RND-001: WebGL2 sprite/quad rendering with texture atlases.
  - Accept: Render 10k static sprites at 60 FPS on mid‑range desktop; batching verified in profiling.
- ENG-RND-002: Layers and sorting by z/order with stable results.
  - Accept: Deterministic draw order across frames; API to set layer/order.
- ENG-RND-003: Cameras (orthographic) with parallax, zoom, shake.
  - Accept: Camera transforms applied; shake/zoom adjustable at runtime; parallax works.
- ENG-RND-004: Viewport scaling modes: pixel‑perfect, letterbox, crop, fit.
  - Accept: Toggle modes; no stretching/distortion; safe area respected on mobile.
- ENG-RND-005: Shaders: simple color/alpha/tint; blend modes; post‑FX hooks.
  - Accept: Per‑sprite tint; additive blending; post‑FX example applied.
- ENG-RND-006: Canvas 2D fallback.
  - Accept: Feature parity for static sprites, text, and basic effects; auto select fallback.

## ECS and Scenes (ECS)

- ENG-ECS-001: Entities are lightweight IDs; components are typed data.
  - Accept: Add/remove components at runtime; serialized to JSON.
- ENG-ECS-002: Systems with declarative queries and stage ordering.
  - Accept: PreUpdate, Update, PostUpdate, Render stages configurable; deterministic order.
- ENG-ECS-003: Scene manager with stack (push/pop/replace) and transitions.
  - Accept: Menus, pause overlays; transitions fade in/out.

## Assets (AST)

- ENG-AST-001: Load images (PNG, JPG, WebP), spritesheets (JSON atlas), tilemaps (Tiled JSON), audio (OGG/MP3/WAV), fonts (bitmap/WOFF), JSON/CSV.
  - Accept: Preload queue with progress events; cache/dedupe identical assets.
- ENG-AST-002: Runtime/dynamic loading and unloading.
  - Accept: Load assets on demand; dispose frees memory; reference counting.
- ENG-AST-003: Asset pipeline hooks for versioning and CDN paths.
  - Accept: Configurable base URL and cache‑busting.

## Input (INP)

- ENG-INP-001: Keyboard, mouse, pointer, touch, gamepad support.
  - Accept: Events normalized across browsers; pointer capture works.
- ENG-INP-002: Action mapping and rebindable controls.
  - Accept: Map multiple devices to actions; persist bindings.
- ENG-INP-003: Gesture helpers (tap, double‑tap, swipe, long‑press).
  - Accept: Provide callbacks; thresholds configurable.

## Audio (AUD)

- ENG-AUD-001: WebAudio with busses (master, music, sfx) and groups.
  - Accept: Independently control volume/mute; persistence across scenes.
- ENG-AUD-002: 2D spatialization (pan), filters (lowpass), and loop points.
  - Accept: Panning reflects camera; filter applied at runtime; seamless loops.
- ENG-AUD-003: Music cross‑fade and ducking.
  - Accept: Automatic ducking of sfx over music; configurable fade duration.

## Physics/Collision (PHY)

- ENG-PHY-001: Colliders: AABB, circle, tilemap; triggers and layers/masks.
  - Accept: Overlap queries and raycasts; collision events fired.
- ENG-PHY-002: Basic resolution (separation, restitution, friction) and gravity.
  - Accept: Stable stacking for simple cases; configurable gravity per scene.
- ENG-PHY-003: Broadphase via uniform grid; sleeping for static bodies.
  - Accept: Broadphase reduces pair checks by >80% on stress tests.

## Animation and Particles (ANM)

- ENG-ANM-001: Sprite frame animation and flip/rotate/scale transforms.
  - Accept: Play, pause, loop, reverse; events on complete.
- ENG-ANM-002: Tweening for properties (position, rotation, alpha) with easings.
  - Accept: Chain/sequence support; pause/resume; time scale aware.
- ENG-ANM-003: Particle system with emitters, shapes, and behaviors.
  - Accept: 1k particles at 60 FPS on desktop; configurable sprites and lifetimes.

## UI and Text (UI)

- ENG-UI-001: HUD/overlay widgets (text, image, button, panel) with anchors.
  - Accept: Anchors to corners/center; safe‑area handling.
- ENG-UI-002: Bitmap fonts and dynamic text layout.
  - Accept: Wrapping, alignment, drop shadow, stroke.
- ENG-UI-003: Input widgets: basic buttons, toggles, sliders.
  - Accept: Keyboard/gamepad/touch accessible; focus management.

## Save/Load and Settings (SAV)

- ENG-SAV-001: Local persistence (LocalStorage/IndexedDB) for settings and saves.
  - Accept: Versioned schema; migration hooks; corruption handling.
- ENG-SAV-002: Replays and high scores (local).
  - Accept: Deterministic input recording; playback fidelity verified.

## Debugging/Observability (DBG)

- ENG-DBG-001: On‑screen dev overlay (FPS, frame time, draw calls, memory hints).
  - Accept: Toggle at runtime; minimal overhead when hidden.
- ENG-DBG-002: Entity inspector and system profiler in dev.
  - Accept: Select entity; view components; system timings per frame.

## Plugin System (PLG)

- ENG-PLG-001: Plugin lifecycle (install/configure/register/teardown) and manifests.
  - Accept: Dynamically enable/disable plugins; namespace isolation.
- ENG-PLG-002: Plugins can add systems, components, resources, asset loaders, devtools panels.
  - Accept: Example plugin shipped and tested.

## Documentation and Samples (DOC)

- ENG-DOC-001: API reference (typed) with examples and guides.
  - Accept: 95% public APIs documented; examples compile.
- ENG-DOC-002: Minimal templates for new games (starter projects).
  - Accept: CLI generates runnable skeleton with config and examples.
