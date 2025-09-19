# Tutorials

This section walks through building with the engine step by step.

## 1) Minimal Sprite

Create a canvas in your HTML and draw a sprite with the renderer.

```ts
import { Renderer } from '@web-game-engine/core';

const canvas = document.querySelector('canvas')!;
const r = new Renderer({ canvas });

const image = new Image();
image.src = '/assets/ship.png';
await image.decode();

const texture = { id: 'ship', width: image.width, height: image.height, source: image };

r.begin();
r.drawSprite(texture, { x: 160, y: 120, origin: [0.5, 0.5] });
const stats = r.end();
console.log('stats', stats);
```

## 2) Camera + Parallax

```ts
import { Renderer, Camera2D } from '@web-game-engine/core';

const r = new Renderer({ canvas });
const camera = new Camera2D();
camera.setPosition(100, 50);
r.setCamera(camera);

r.begin();
r.drawSprite(bgTexture, { x: 0, y: 0, parallax: [0.2, 0.2] });
r.drawSprite(playerTexture, { x: 200, y: 120 });
r.end();
```

## 3) Viewport Scaling

```ts
import { Viewport } from '@web-game-engine/core';
const vp = new Viewport({ designWidth: 320, designHeight: 180, mode: 'pixel-perfect' });
r.setViewport(vp);
```

## 4) Sprite Atlases

```ts
import { TextureAtlas } from '@web-game-engine/core';
const atlas = new TextureAtlas(texture, {
  player_idle: { x: 0, y: 0, width: 16, height: 16, origin: [0.5, 0.5] },
});
r.begin();
r.drawSprite(atlas.getRegion('player_idle'), { x: 80, y: 90 });
r.end();
```

Next up: UI overlay, particles, storage, and plugins in later milestones.
