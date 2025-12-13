---
inclusion: always
---

# Project Structure & Conventions

## Monorepo Organization

This is an npm workspace monorepo. When working with files, understand the package boundaries:

```
/
├── packages/
│   ├── engine/           # Core engine (@web-game-engine/core)
│   ├── games/            # Showcase games (super-snake, tetris-advanced, flappy-like)
│   └── playground/       # Development playground
├── plugins/              # Example plugins
├── docs/                 # Documentation and GitHub Pages builds
├── requirements/         # Specifications and requirements
├── tests/                # Cross-package integration/performance tests
└── scripts/              # Build and tooling scripts
```

## Engine Architecture (`packages/engine/src/`)

The engine uses modular subsystems. When adding features, place them in the appropriate subsystem:

- `ecs/` - Entity-Component-System core (World, Query, components)
- `scene/` - Scene management (Scene, SceneManager)
- `assets/` - Asset loading (AssetManager, loaders, Tilemap)
- `input/` - Input handling (InputManager, all device types)
- `audio/` - Audio engine (AudioEngine, WebAudio-based)
- `rendering/` - WebGL2/Canvas rendering (Renderer, Camera2D, Viewport, TextureAtlas)
- `physics/` - Collision detection and resolution
- `animation/` - Tweening, easing, sprite animations
- `particles/` - Particle system (Emitter)
- `ui/` - UI overlay system
- `storage/` - Save/load management (SaveManager, LocalStorageStore)
- `plugins/` - Plugin host system
- `devtools/` - Development overlay and debug panels
- `testing/` - Testing utilities (HeadlessRenderer)
- `utils/` - Shared utilities (EventEmitter)
- `math/` - Math utilities (Vec2)
- `demo/` - Demo scenes for testing

## Code Organization Rules

### File Placement

- **New engine features**: Add to appropriate `packages/engine/src/` subsystem
- **Game logic**: Place in `packages/games/{game-name}/src/game/`
- **Tests**: Colocate in `__tests__/` directories within each package
- **Demos/Examples**: Use `packages/playground/` for experimentation

### File Naming Conventions

- **Classes/Types**: PascalCase (e.g., `World.ts`, `Scene.ts`, `InputManager.ts`)
- **Utilities/Functions**: camelCase (e.g., `easing.ts`, `collision.ts`)
- **Test files**: `*.test.ts` in `__tests__/` directories
- **Index files**: `index.ts` for barrel exports

### Import/Export Patterns

- **Within packages**: Use relative imports (`./`, `../`)
- **Cross-package**: Use package names (`@web-game-engine/core`)
- **Exports**: Use named exports, avoid default exports
- **Barrel files**: Each subsystem exports via `index.ts`

## ECS Architecture Rules

When working with the ECS system:

- **Entities**: Opaque numeric IDs, no methods or properties
- **Components**: Plain data objects only, no behavior, must be serializable
- **Systems**: Pure functions that operate on component queries
- **Worlds**: Own all ECS state and resources, isolated from each other

### Component Definition Pattern

```typescript
export interface MyComponent {
  readonly type: 'MyComponent';
  someData: number;
  moreData: string;
}
```

### System Pattern

```typescript
export function mySystem(world: World, deltaTime: number): void {
  const query = world.query(['MyComponent', 'Transform']);
  for (const entity of query.entities) {
    // System logic here
  }
}
```

## Game Structure Pattern

When creating games in `packages/games/`, follow this structure:

```
game-name/
├── src/
│   ├── game/
│   │   ├── components.ts     # Game-specific components
│   │   ├── systems/          # ECS systems
│   │   ├── ui/              # UI components
│   │   ├── input/           # Input handling
│   │   └── GameScene.ts     # Main scene class
│   ├── __tests__/           # Game tests
│   └── main.ts              # Entry point
├── index.html
├── package.json
└── vite.config.ts
```

## Testing Guidelines

- **Unit tests**: Colocate in `__tests__/` directories
- **Engine tests**: `packages/engine/src/__tests__/`
- **Game tests**: `packages/games/*/src/__tests__/`
- **Performance tests**: `tests/performance/`
- **Framework**: Use Vitest with jsdom for DOM/WebGL mocking
- **Naming**: `*.test.ts` files only

## Development Workflow

- **Playground**: Use `packages/playground/` for testing engine features
- **Demos**: Create demo classes extending `BaseDemo` in playground
- **Documentation**: Update relevant docs in `docs/site/pages/`
- **Requirements**: Reference `requirements/` for specifications
