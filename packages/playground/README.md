# Engine Playground

Interactive playground for exploring the web game engine's features without building a full game.

## Overview

The Engine Playground is a browser-based environment that showcases engine capabilities through interactive demos. It's designed for:

- **Learning**: New developers can see engine features in action
- **Testing**: Quick experimentation with engine APIs
- **Templates**: Copy the structure to start your own project

## Features

- 🎮 **Multiple Demos**: Animation, physics, particles, and input handling
- 🎨 **Zero Assets**: All graphics generated procedurally
- 🛠️ **Dev Tools**: Built-in debug panels and performance metrics
- ⚡ **Fast Startup**: < 5 seconds from `npm run dev` to running demo
- 📝 **Well-Commented**: Learn by reading the source code

## Getting Started

### Run the Playground

```bash
# From the playground directory
npm run dev
```

The playground will automatically open in your browser at `http://localhost:5173`.

### Available Demos

1. **Sprite Animation** - Frame-based animations with loop modes, speed control, and transforms
2. **Physics & Collision** - Collision detection with different shapes and interactive spawning
3. **Particle Effects** - Particle emitters with burst and continuous modes
4. **Input Handling** - Keyboard, mouse, and gamepad input with visual feedback

### Keyboard Shortcuts

- `F12` or `` ` `` - Toggle dev tools visibility

## Project Structure

```
packages/playground/
├── index.html              # Main HTML with canvas and demo selector
├── src/
│   ├── main.ts            # Entry point, registers demos
│   ├── PlaygroundApp.ts   # Main application class
│   ├── demos/             # Demo implementations
│   │   ├── BaseDemo.ts    # Abstract base class
│   │   ├── AnimationDemo.ts
│   │   ├── PhysicsDemo.ts
│   │   ├── ParticlesDemo.ts
│   │   └── InputDemo.ts
│   ├── ui/                # UI components
│   │   ├── DemoSelector.ts
│   │   └── styles.css
│   └── utils/             # Utilities
│       └── graphics.ts    # Procedural texture generation
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Using as a Template

The playground follows the same structure as game packages in the monorepo. To start your own project:

1. Copy the playground directory structure
2. Modify `src/main.ts` to create your game scene
3. Update `package.json` with your project name
4. Run `npm run dev` to start developing

## Adding New Demos

To add a new demo to the playground:

1. **Create Demo Class**

```typescript
// src/demos/MyDemo.ts
import { BaseDemo } from './BaseDemo.js';

export class MyDemo extends BaseDemo {
  async init(): Promise<void> {
    // Set up your demo
    this.canvas.width = 800;
    this.canvas.height = 600;

    // Create world, systems, entities
    // ...
  }
}
```

2. **Register Demo**

```typescript
// src/main.ts
import { MyDemo } from './demos/MyDemo.js';

app.registerDemo('my-demo', 'My Demo', 'Description of what this demo showcases', MyDemo);
```

3. **Export Demo**

```typescript
// src/demos/index.ts
export { MyDemo } from './MyDemo.js';
```

## Development

### Commands

```bash
npm run dev        # Start dev server with HMR
npm run build      # Build for production
npm run preview    # Preview production build
npm run test       # Run tests
npm run lint       # Lint code
npm run typecheck  # Check TypeScript types
```

### Code Style

- All code follows the monorepo's ESLint and Prettier configuration
- Comments explain engine API usage and design decisions
- Demos use procedural graphics (no external assets)

## Architecture

### PlaygroundApp

The main application class that:

- Manages demo registration and lifecycle
- Handles demo switching with cleanup
- Coordinates UI updates
- Provides error handling

### BaseDemo

Abstract base class that all demos extend:

- Provides common lifecycle methods (init, cleanup, update, render)
- Manages canvas, world, renderer, and game loop references
- Implements default cleanup logic

### DemoSelector

UI component that:

- Renders the list of available demos
- Handles demo selection
- Updates active state visually

## Performance

- **Startup Time**: < 5 seconds from `npm run dev` to first demo
- **Demo Switch**: < 500ms to switch between demos
- **Frame Rate**: Maintains 60 FPS in all demos
- **Memory**: No memory leaks after multiple demo switches

## License

MIT - Same as the parent monorepo
