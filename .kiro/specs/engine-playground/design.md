# Design Document

## Overview

The engine playground is a standalone package within the monorepo that provides an interactive browser-based environment for exploring engine features. It reuses existing demo classes from the engine, wraps them in a simple UI with a demo selector, and enables dev tools by default to facilitate learning and experimentation.

The playground serves three primary purposes:

1. **Learning Tool** - New developers can see engine features in action with well-commented code
2. **Testing Environment** - Engine developers can quickly test features without building a full game
3. **Project Template** - Developers can copy the playground structure to start their own projects

The design emphasizes simplicity, fast startup, and zero external asset dependencies to minimize friction for new users.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (localhost:5173)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    index.html                           │ │
│  │  ├─ Canvas element (#game-canvas)                      │ │
│  │  ├─ Demo selector sidebar (#demo-selector)             │ │
│  │  └─ Loading indicator                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      main.ts (Entry Point)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  - Initialize Vite dev server                          │ │
│  │  - Create PlaygroundApp instance                       │ │
│  │  - Register all demos                                  │ │
│  │  - Render demo selector UI                             │ │
│  │  - Load default demo (AnimationDemo)                   │ │
│  │  - Set up keyboard shortcuts                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      PlaygroundApp                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  State:                                                  │ │
│  │  - currentDemo: Demo | null                             │ │
│  │  - demoRegistry: Map<string, DemoConstructor>           │ │
│  │  - canvas: HTMLCanvasElement                            │ │
│  │  - devToolsEnabled: boolean                             │ │
│  │                                                          │ │
│  │  Methods:                                                │ │
│  │  - registerDemo(name, description, constructor)         │ │
│  │  - loadDemo(name): Promise<void>                        │ │
│  │  - unloadCurrentDemo(): void                            │ │
│  │  - toggleDevTools(): void                               │ │
│  │  - renderDemoSelector(): void                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                         Demo Classes                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AnimationDemo (reuse from engine)                      │ │
│  │  - Demonstrates sprite frame animation                  │ │
│  │  - Shows loop modes, speed control, transforms          │ │
│  │  - Enables AnimationDebugPanel                          │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PhysicsDemo (new)                                      │ │
│  │  - Demonstrates collision detection                     │ │
│  │  - Shows different collision shapes                     │ │
│  │  - Interactive object spawning                          │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ParticlesDemo (new)                                    │ │
│  │  - Demonstrates particle emitters                       │ │
│  │  - Shows burst and continuous modes                     │ │
│  │  - Interactive particle triggering                      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  InputDemo (new)                                        │ │
│  │  - Demonstrates keyboard, mouse, gamepad input          │ │
│  │  - Visual feedback for all input types                  │ │
│  │  - Real-time input state display                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Startup**: Vite dev server starts, loads index.html and main.ts
2. **Initialization**: PlaygroundApp creates canvas, registers demos, renders selector
3. **Demo Selection**: User clicks demo in selector, PlaygroundApp loads demo
4. **Demo Cleanup**: Previous demo's cleanup() method called, resources released
5. **Demo Loading**: New demo's init() method called, scene created, game loop starts
6. **Runtime**: Demo runs with dev tools enabled, user can switch demos or toggle tools

### Key Design Decisions

1. **Reuse Existing Demos**: Import SpriteAnimationDemo from engine rather than duplicating code
2. **Simple UI**: Minimal sidebar with demo list, no complex framework dependencies
3. **Procedural Graphics**: Generate textures and shapes programmatically to avoid asset loading
4. **Dev Tools Always On**: Enable DevOverlay by default for learning and debugging
5. **Package Structure**: Mirror game package structure (super-snake) for consistency
6. **Vite for Dev Server**: Use Vite for fast HMR and modern dev experience

## Components and Interfaces

### PlaygroundApp

```typescript
interface DemoMetadata {
  name: string;
  description: string;
  constructor: new (canvas: HTMLCanvasElement) => Demo;
}

interface Demo {
  init(): Promise<void>;
  cleanup(): void;
  update(delta: number): void;
  render(): void;
}

class PlaygroundApp {
  private currentDemo: Demo | null = null;
  private demoRegistry: Map<string, DemoMetadata> = new Map();
  private canvas: HTMLCanvasElement;
  private devToolsEnabled: boolean = true;

  constructor(canvas: HTMLCanvasElement);

  // Demo management
  registerDemo(
    name: string,
    description: string,
    constructor: new (canvas: HTMLCanvasElement) => Demo
  ): void;
  async loadDemo(name: string): Promise<void>;
  unloadCurrentDemo(): void;

  // UI management
  renderDemoSelector(): void;
  toggleDevTools(): void;

  // Lifecycle
  start(): void;
  stop(): void;
}
```

### Demo Base Class

```typescript
abstract class BaseDemo implements Demo {
  protected canvas: HTMLCanvasElement;
  protected world: World;
  protected renderer: Renderer;
  protected gameLoop: GameLoop;

  constructor(canvas: HTMLCanvasElement);

  abstract init(): Promise<void>;

  cleanup(): void {
    // Default cleanup: stop game loop, dispose world, clear canvas
    this.gameLoop?.stop();
    this.world?.dispose();
    this.renderer?.dispose();
  }

  update(delta: number): void {
    this.world?.step(delta);
  }

  render(): void {
    this.renderer?.render(this.world);
  }
}
```

### Demo Implementations

```typescript
// Reuse existing demo from engine
import { SpriteAnimationDemo } from '@web-game-engine/core/demo';

// New demos
class PhysicsDemo extends BaseDemo {
  async init(): Promise<void> {
    // Create world with physics system
    // Spawn entities with collision shapes
    // Set up interactive spawning
  }
}

class ParticlesDemo extends BaseDemo {
  async init(): Promise<void> {
    // Create world with particle system
    // Create multiple emitters
    // Set up interactive triggering
  }
}

class InputDemo extends BaseDemo {
  async init(): Promise<void> {
    // Create world with input system
    // Create visual feedback entities
    // Display input state in real-time
  }
}
```

## Data Models

### Demo Registry Entry

```typescript
interface DemoRegistryEntry {
  name: string; // Display name (e.g., "Sprite Animation")
  description: string; // Brief description (e.g., "Frame-based sprite animations")
  constructor: DemoConstructor; // Class constructor
  order: number; // Display order in selector
}
```

### Playground State

```typescript
interface PlaygroundState {
  currentDemoName: string | null; // Name of currently loaded demo
  demos: DemoRegistryEntry[]; // All registered demos
  devToolsVisible: boolean; // Dev tools visibility state
  loading: boolean; // Loading state during demo switch
}
```

## File Structure

```
packages/playground/
├── index.html                 # Main HTML with canvas and demo selector
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── README.md                  # Documentation and usage guide
└── src/
    ├── main.ts                # Entry point, initializes PlaygroundApp
    ├── PlaygroundApp.ts       # Main application class
    ├── demos/
    │   ├── index.ts           # Re-exports all demos
    │   ├── BaseDemo.ts        # Abstract base class for demos
    │   ├── PhysicsDemo.ts     # Physics and collision demo
    │   ├── ParticlesDemo.ts   # Particle effects demo
    │   └── InputDemo.ts       # Input handling demo
    ├── ui/
    │   ├── DemoSelector.ts    # Sidebar UI component
    │   └── styles.css         # Minimal CSS for layout
    └── utils/
        └── graphics.ts        # Procedural texture/shape generation
```

## Styling and Layout

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Web Game Engine Playground</title>
  </head>
  <body>
    <div id="app">
      <aside id="demo-selector">
        <!-- Demo list rendered here -->
      </aside>
      <main id="demo-container">
        <canvas id="game-canvas"></canvas>
        <div id="loading" class="hidden">Loading...</div>
      </main>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### CSS Layout

```css
/* Minimal layout: sidebar + canvas */
#app {
  display: flex;
  height: 100vh;
  margin: 0;
  font-family: system-ui, sans-serif;
}

#demo-selector {
  width: 250px;
  background: #2a2a2a;
  color: #fff;
  overflow-y: auto;
  padding: 1rem;
}

#demo-container {
  flex: 1;
  position: relative;
  background: #1a1a1a;
}

#game-canvas {
  width: 100%;
  height: 100%;
}
```

## Procedural Graphics

To avoid external asset dependencies, the playground generates graphics programmatically:

### Procedural Textures

```typescript
// Generate a simple colored square texture
function createColorTexture(color: string, size: number = 64): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

// Generate a gradient texture
function createGradientTexture(
  color1: string,
  color2: string,
  size: number = 64
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

// Generate a circle texture for particles
function createCircleTexture(color: string, size: number = 32): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}
```

### Animation Frames

```typescript
// Generate animation frames procedurally
function createAnimationFrames(baseColor: string, frameCount: number): HTMLCanvasElement[] {
  const frames: HTMLCanvasElement[] = [];
  for (let i = 0; i < frameCount; i++) {
    const hue = (parseInt(baseColor.slice(1), 16) + i * 30) % 360;
    const color = `hsl(${hue}, 70%, 50%)`;
    frames.push(createColorTexture(color, 64));
  }
  return frames;
}
```

## Dev Tools Integration

### Enable DevOverlay by Default

```typescript
// In PlaygroundApp.start()
const devOverlay = new DevOverlay(this.world);
devOverlay.enable();
devOverlay.show();

// Keyboard shortcut to toggle (F12 or backtick)
document.addEventListener('keydown', (e) => {
  if (e.key === 'F12' || e.key === '`') {
    e.preventDefault();
    this.toggleDevTools();
  }
});
```

### Enable AnimationDebugPanel for Animation Demo

```typescript
// In AnimationDemo.init()
if (this.world.hasResource('devOverlay')) {
  const devOverlay = this.world.getResource<DevOverlay>('devOverlay');
  const animDebugPanel = new AnimationDebugPanel(this.world);
  devOverlay.addPanel(animDebugPanel);
}
```

## Error Handling

### Demo Loading Errors

```typescript
async loadDemo(name: string): Promise<void> {
  try {
    this.showLoading();
    this.unloadCurrentDemo();

    const metadata = this.demoRegistry.get(name);
    if (!metadata) {
      throw new Error(`Demo not found: ${name}`);
    }

    this.currentDemo = new metadata.constructor(this.canvas);
    await this.currentDemo.init();

    this.hideLoading();
  } catch (error) {
    console.error(`Failed to load demo: ${name}`, error);
    this.showError(`Failed to load demo: ${error.message}`);
    this.hideLoading();
  }
}
```

### Resource Cleanup Errors

```typescript
unloadCurrentDemo(): void {
  if (!this.currentDemo) return;

  try {
    this.currentDemo.cleanup();
  } catch (error) {
    console.error('Error during demo cleanup:', error);
  } finally {
    this.currentDemo = null;
  }
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify individual components:

1. **PlaygroundApp Tests**:
   - Demo registration and retrieval
   - Demo loading and unloading
   - Dev tools toggle
   - Error handling

2. **Demo Tests**:
   - Initialization and cleanup
   - Resource disposal
   - State isolation

### Integration Testing

Integration tests will verify the full playground:

1. **Demo Switching**:
   - Load multiple demos in sequence
   - Verify cleanup between switches
   - Check for memory leaks

2. **Dev Tools**:
   - Verify dev tools are enabled by default
   - Test keyboard shortcuts
   - Verify panels display correctly

3. **Procedural Graphics**:
   - Verify textures generate correctly
   - Test animation frame generation
   - Verify no external assets loaded

### Property-Based Testing

Property-based tests will verify correctness properties:

**Library**: fast-check (https://github.com/dubzzz/fast-check)

**Configuration**: Each property test should run a minimum of 100 iterations.

**Test Tagging**: Each property-based test must include a comment with the format:

```typescript
// **Feature: engine-playground, Property N: [property description]**
```

**Property Tests**:

1. **Property 1: Demo isolation**
   - Generate random sequences of demo switches
   - Verify each demo starts with clean state
   - Tag: `**Feature: engine-playground, Property 1: Demo isolation**`

2. **Property 2: Resource cleanup**
   - Load and unload demos multiple times
   - Verify no memory leaks (entity count returns to zero)
   - Tag: `**Feature: engine-playground, Property 2: Resource cleanup**`

3. **Property 3: Demo selector visibility**
   - Verify selector is always accessible
   - Test with different demo counts
   - Tag: `**Feature: engine-playground, Property 3: Demo selector visibility**`

4. **Property 4: Dev tools availability**
   - Verify dev tools enabled for all demos
   - Test keyboard shortcut toggle
   - Tag: `**Feature: engine-playground, Property 4: Dev tools availability**`

5. **Property 5: Startup performance**
   - Measure time from start to first demo display
   - Verify < 5 seconds
   - Tag: `**Feature: engine-playground, Property 5: Startup performance**`

6. **Property 6: No external asset dependencies**
   - Verify no network requests for assets
   - Check all textures are procedurally generated
   - Tag: `**Feature: engine-playground, Property 6: No external asset dependencies**`

7. **Property 7: Code documentation coverage**
   - Parse source files for API usage
   - Verify comments within 5 lines
   - Tag: `**Feature: engine-playground, Property 7: Code documentation coverage**`

### Manual Testing

Manual testing checklist:

1. **Visual Verification**:
   - All demos render correctly
   - UI is responsive and clear
   - Dev tools display properly

2. **Interaction Testing**:
   - Demo selector switches demos
   - Keyboard shortcuts work
   - Interactive demos respond to input

3. **Performance Testing**:
   - Smooth 60 FPS in all demos
   - No lag when switching demos
   - Dev tools don't impact performance

## Performance Considerations

### Optimization Strategies

1. **Lazy Demo Loading**: Only load demo code when selected
2. **Resource Pooling**: Reuse canvas and renderer between demos
3. **Efficient Cleanup**: Dispose resources immediately on demo switch
4. **Minimal UI**: Simple DOM structure for demo selector

### Performance Targets

- **Startup Time**: < 5 seconds from `npm run dev` to first demo
- **Demo Switch Time**: < 500ms to switch between demos
- **Frame Rate**: Maintain 60 FPS in all demos
- **Memory**: No memory leaks after 10+ demo switches

## Future Enhancements

1. **Code Editor Integration**: Add Monaco editor to edit demo code live
2. **Shareable Links**: Generate URLs with demo state for sharing
3. **More Demos**: Add demos for audio, UI, save/load, scenes
4. **Mobile Support**: Optimize UI and controls for mobile devices
5. **Export Demo**: Allow exporting current demo as standalone project
6. **Performance Profiler**: Add detailed performance metrics panel
7. **Tutorial Mode**: Add guided tutorials with step-by-step instructions
