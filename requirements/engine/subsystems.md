# Subsystems

Each subsystem lists responsibilities, key APIs, dependencies, and acceptance.

## Rendering

- Responsibilities: batching, sprite/quad rendering, layers, cameras, post‑FX.
- Key APIs: Renderer, Sprite, Material, Camera, RenderPass, Batch.
- Dependencies: Assets (textures), ECS (components), Time.
- Acceptance: See ENG-RND-\*; profiling shows batching and stable 60 FPS on targets.

## ECS

- Responsibilities: entities, components, queries, systems, scheduling.
- Key APIs: World, Entity, Component<T>, System, Query.
- Dependencies: Time, Events.
- Acceptance: Deterministic order; hot add/remove; serialization.

## Scenes

- Responsibilities: scene lifecycle, stack, transitions, preload.
- Key APIs: Scene, SceneManager, Transition.
- Acceptance: Push/pop/replace works; transitions render over scene boundaries.

## Assets

- Responsibilities: loading, caching, reference counting, manifests.
- Key APIs: AssetManager, Loader<T>, Texture, AudioClip, Tilemap, Font.
- Acceptance: Progress and error events; cache hit rate tracked in dev overlay.

## Input

- Responsibilities: device abstraction, action mapping, gestures.
- Key APIs: Input, ActionMap, Binding, Gamepad.
- Acceptance: Remapping persistence; pointer/touch normalized.

## Audio

- Responsibilities: playback, mixing, spatialization, effects, music management.
- Key APIs: AudioEngine, Bus, Sound, Music, Filter.
- Acceptance: Independent bus controls; seamless loops; ducking verified.

## Physics/Collision

- Responsibilities: colliders, broadphase, narrowphase, resolution, queries.
- Key APIs: PhysicsWorld, Collider, RigidBody (basic), Raycast.
- Acceptance: Broadphase efficiency; stable simple stacks; tile collisions.

## Animation

- Responsibilities: sprite animations, tweens, timelines.
- Key APIs: Animator, Tween, Easing.
- Acceptance: Timing accuracy; pause/resume; time scaling.

## Particles

- Responsibilities: emitters, particle updates, render integration.
- Key APIs: ParticleSystem, Emitter, Particle.
- Acceptance: 1k particles at 60 FPS on desktop.

## UI

- Responsibilities: overlay widgets, layout, focus, input integration.
- Key APIs: UIStage, Widget, Text, Button, Slider.
- Acceptance: Focus traversal; consistent anchors; accessibility toggles.

## Save/Load

- Responsibilities: local persistence, schema versioning, replays.
- Key APIs: Storage, SaveSlot, ReplayRecorder/Player.
- Acceptance: Corruption handling; migration paths; deterministic playback.

## Debug/Devtools

- Responsibilities: metrics overlay, entity inspector, profiler, logs.
- Key APIs: DevOverlay, Logger, Profiler.
- Acceptance: Low overhead when disabled; toggle at runtime.

## Plugin Host

- Responsibilities: plugin lifecycle, isolation, extension points.
- Key APIs: PluginManager, PluginContext, Manifest.
- Acceptance: Example plugin adding a system and dev panel.
