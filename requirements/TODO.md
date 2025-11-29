# TODO - Future Improvements

## Engine Playground/Sandbox

**Priority:** Medium  
**Effort:** ~2-4 hours  
**Milestone:** M7 (Documentation + Release)

### Goal

Create an interactive playground package that allows developers to quickly try out engine features in the browser without building a full game.

### What to Build

```
packages/playground/
├── index.html
├── src/
│   ├── main.ts                    # Entry point with demo selector
│   ├── demos/
│   │   ├── AnimationDemo.ts       # Reuse SpriteAnimationDemo
│   │   ├── PhysicsDemo.ts         # Simple collision demo
│   │   ├── ParticlesDemo.ts       # Particle effects
│   │   └── InputDemo.ts           # Keyboard/mouse/gamepad
│   └── ui/
│       └── DemoSelector.ts        # Sidebar to switch demos
├── package.json                   # Copy from super-snake
└── vite.config.ts
```

### Key Features

- Sidebar UI to select different demos
- Each demo showcases a specific engine feature
- Dev tools enabled (AnimationDebugPanel, DevOverlay)
- Simple graphics (colored shapes) - no asset dependencies
- Well-commented code explaining engine usage
- `npm run dev` to start immediately

### Implementation Notes

- Copy package structure from `packages/games/super-snake`
- Import and wire up existing demo classes from engine
- Keep it minimal - focus on showcasing features, not building a complex app
- Add to workspace in root `package.json`

### Why This Matters

- Lower barrier to entry for new developers
- Quick way to test engine features
- Living documentation of how to use the engine
- Starting template for new projects

### Related Files

- `packages/engine/src/demo/SpriteAnimationDemo.ts` - Already exists, can be reused
- `packages/engine/src/devtools/AnimationDebugPanel.ts` - Should be showcased
- `packages/games/super-snake/` - Reference for package structure
