# API Requirements (TypeScript)

All public APIs are typed, documented, and stable under SemVer. Representative interfaces are described; concrete definitions belong in implementation.

## Core Types

- Entity: opaque ID (`number` or branded type).
- Component<TData>: data only; serializable; no methods.
- System: `{ stage: 'init'|'preUpdate'|'update'|'postUpdate'|'render'; query: QuerySpec; execute(ctx): void }`.
- World: create/destroy entities; add/remove/get components; run systems; events.

## Scheduling

- Deterministic system ordering with numbered phases and per‑phase ordering.
- API: `registerSystem(system, phase, order)`; `unregisterSystem(system)`.

## Events

- Typed event bus: `on<T>('evt', handler)`, `emit<T>('evt', payload)`; scoped to world/scene.

## Assets

- `AssetManager.load<T>(key, url | descriptor): Promise<T>`; progress/error events.
- Built‑ins: `Texture`, `TextureAtlas`, `Tilemap`, `AudioClip`, `Font`.
- Loader extension: `registerLoader(type, loaderFn)`.

## Rendering

- `Renderer` with `begin(scene)`, `drawSprite(sprite)`, `drawText(text)`, `end()`.
- Camera: position/zoom/rotation; screen‑to‑world/world‑to‑screen.
- Materials/shaders: tint, blend modes; post‑FX hook.

## Input

- `Input.actions.bind('Jump', [Key.Space, Gamepad.A])`; `Input.on('Jump', cb)`.
- Pointer/touch normalized events; gesture helpers (`onSwipe`, `onTap`).

## Audio

- `Audio.play('sfx:hit', { volume: 0.8, pan: -0.2 })`; busses and filters.

## Physics/Collision

- `Physics.addCollider(entity, { shape: 'aabb'|'circle'|'tile', ... })`.
- Queries: `overlap(area)`, `raycast(origin, dir, len)`; contact events.

## Animation/Particles

- `Animator.play(entity, 'run', { loop: true })`; `Tween.to(entity, { x: 100 }, 300, Easing.OutQuad)`.
- `Particles.emit('explosion', { position, count: 50 })`.

## Scenes

- `SceneManager.push(scene)`, `pop()`, `replace(scene)`, transitions.

## Save/Load

- `Storage.save(slot, data)`, `load(slot)`, versioning and migrations.

## Plugins

- Manifest: name, version, dependencies, extension points.
- `Plugin.install(ctx)` receives registration surface: systems, components, loaders, devtools.

## Errors

- Discrete error types (AssetError, RenderError, InputError). All public APIs throw typed errors.

## Stability and Deprecation

- `@experimental`, `@deprecated` tags in docs; deprecations kept for one minor version unless critical.
