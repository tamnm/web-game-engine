# @web-game-engine/core

TypeScript-first 2D web game engine with Entity-Component-System (ECS) architecture.

## Features

### Core Systems

- **ECS** - Data-oriented Entity-Component-System architecture
- **Scene Management** - Scene lifecycle with transitions
- **Game Loop** - Fixed timestep with interpolation
- **Asset Management** - Async loading and caching

### Rendering

- **WebGL2 Renderer** - Hardware-accelerated sprite rendering with batching
- **Canvas 2D Fallback** - Automatic fallback for compatibility
- **Texture Atlas** - Efficient sprite sheet management
- **Camera System** - 2D camera with zoom and viewport scaling

### Animation System

The engine includes a comprehensive sprite frame animation system:

**Features:**

- Multiple animation clips per entity
- Loop modes: none, loop, ping-pong
- Variable frame durations (per-frame or default)
- Smooth transitions between animations
- Flip (horizontal/vertical) and rotation transforms
- Event callbacks: onFrame, onLoop, onComplete, onTransitionComplete
- Animation speed control
- Manual frame stepping for debugging

**Components:**

- `AnimationManager` - Registers and manages animation clips
- `AnimationController` - Controls playback (play, pause, stop, resume)
- `SpriteAnimationSystem` - Updates animations each frame
- `AnimationDebugPanel` - Real-time inspector with playback controls

### Input

- Keyboard, Mouse, Touch, Gamepad support

### Audio

- WebAudio engine with spatial audio

### Physics

- AABB and circle collision detection
- Basic collision resolution

### UI & Dev Tools

- HTML overlay system
- Development overlay with FPS counter
- **Animation Debug Panel** - Interactive animation inspector

### Additional

- Particle system
- Save/load (local storage)
- Plugin system
- Testing utilities

## Installation

```bash
npm install @web-game-engine/core
```

## Animation Quick Start

```typescript
import {
  World,
  AnimationManager,
  AnimationController,
  createSpriteAnimationSystem,
  SpriteAnimation,
  TextureAtlas,
} from '@web-game-engine/core';

// Setup
const world = new World();
const animationManager = new AnimationManager();
world.registerSystem(createSpriteAnimationSystem(animationManager));
const controller = new AnimationController(world, animationManager);

// Register animation clip
animationManager.registerClip({
  name: 'walk',
  atlas: myTextureAtlas,
  frames: [{ frameName: 'walk-1' }, { frameName: 'walk-2' }, { frameName: 'walk-3' }],
  defaultFrameDuration: 0.1,
  loopMode: 'loop',
  speed: 1.0,
});

// Create animated entity
const entity = world.createEntity();
world.addComponent(entity, SpriteAnimation, SpriteAnimation.defaults!());

// Play animation
controller.play(entity, 'walk');

// Game loop
function gameLoop(deltaTime: number) {
  world.step(deltaTime);
  const frame = controller.getCurrentFrame(entity);
  // Render frame...
}
```

## Animation Debug Panel

```typescript
import { AnimationDebugPanel } from '@web-game-engine/core';

const debugPanel = new AnimationDebugPanel(world, controller, {
  position: 'top-right',
});

debugPanel.selectEntity(entity);
debugPanel.attach();

// Update in game loop
function gameLoop(deltaTime: number) {
  world.step(deltaTime);
  debugPanel.update(); // Real-time display
}
```

The debug panel provides:

- Current clip, frame, state, elapsed time
- Speed, loop mode, direction, flip, rotation
- Interactive controls: Play, Pause, Stop, Step Forward/Backward

## Documentation

See the main repository README and docs for complete documentation.

## License

See LICENSE file in repository root.
