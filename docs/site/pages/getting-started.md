# Getting Started

Welcome to the Web Game Engine. This guide helps you spin up a simple scene and render sprites.

- Install dependencies: `npm install`
- Run tests: `npm test`
- Build: `npm run build`

Quick example:

```ts
import { Renderer } from '@web-game-engine/core';

const canvas = document.querySelector('canvas')!;
const renderer = new Renderer({ canvas });
renderer.begin();
// draw calls ...
renderer.end();
```

See the Engine Overview for subsystems and architecture.
