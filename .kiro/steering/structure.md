# Project Structure

## Monorepo Organization

This is an npm workspace monorepo with the following top-level structure:

```
/
├── packages/              # Main packages
│   ├── engine/           # Core engine (@web-game-engine/core)
│   └── games/            # Showcase games
│       ├── super-snake/
│       ├── tetris-advanced/
│       └── flappy-like/
├── plugins/              # Example plugins
├── docs/                 # Documentation and GitHub Pages
├── requirements/         # Specifications and requirements
├── tests/                # Cross-package integration/performance tests
└── scripts/              # Build and tooling scripts
```

## Engine Package (`packages/engine/`)

The core engine follows a modular subsystem structure:

```
src/
├── ecs/              # Entity-Component-System core
├── scene/            # Scene management
├── assets/           # Asset loading and management
├── input/            # Input handling (keyboard, mouse, touch, gamepad)
├── audio/            # Audio engine (WebAudio)
├── rendering/        # WebGL2/Canvas rendering
│   ├── camera/
│   ├── viewport/
│   └── support/
├── physics/          # Collision detection and resolution
├── animation/        # Tweening and easing
├── particles/        # Particle system
├── ui/               # UI overlay system
├── storage/          # Save/load management
├── plugins/          # Plugin host
├── devtools/         # Development overlay
├── testing/          # Testing utilities (headless renderer)
├── utils/            # Shared utilities (EventEmitter)
├── math/             # Math utilities (Vec2)
├── demo/             # Demo scenes
└── __tests__/        # Unit tests
```

## Game Packages (`packages/games/`)

Each game follows a similar structure:

```
game-name/
├── src/
│   ├── game/         # Game-specific logic
│   │   ├── systems/  # ECS systems
│   │   ├── ui/       # UI components
│   │   └── input/    # Input handling
│   ├── __tests__/    # Game tests
│   └── main.ts       # Entry point
├── index.html
├── package.json
└── vite.config.ts
```

## Documentation (`docs/`)

```
docs/
├── adr/              # Architecture Decision Records
├── site/             # Documentation website
│   └── pages/        # Documentation pages
│       └── api/      # Generated API reference
└── super-snake/      # Built game demos for GitHub Pages
```

## Requirements (`requirements/`)

```
requirements/
├── engine/           # Engine requirements and specs
├── showcase/         # Game showcase requirements
├── glossary.md
├── roadmap-and-milestones.md
└── user-stories.md
```

## Architectural Conventions

### ECS Pattern

- **Entities**: Opaque numeric IDs
- **Components**: Plain data objects, no behavior, serializable
- **Systems**: Pure functions operating on component queries
- **Worlds**: Own ECS state and resources

### Module Exports

- Each subsystem exports via `index.ts` barrel files
- Main engine exports all subsystems from `packages/engine/src/index.ts`
- Use named exports, avoid default exports

### File Naming

- PascalCase for classes and types (e.g., `World.ts`, `Scene.ts`)
- camelCase for utilities and functions (e.g., `easing.ts`, `collision.ts`)
- Test files: `*.test.ts` in `__tests__/` directories

### Import Paths

- Use relative imports within packages
- Use package names for cross-package imports (e.g., `@web-game-engine/core`)

## Testing Strategy

- Unit tests colocated in `__tests__/` directories
- Engine tests: `packages/engine/src/__tests__/`
- Game tests: `packages/games/*/src/__tests__/`
- Performance tests: `tests/performance/`
- Use Vitest with jsdom for DOM/WebGL mocking
