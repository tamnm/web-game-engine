# Particles

Basic particle emitter for 2D effects. Integrates with the `Renderer`.

Example:

```ts
import { Emitter, Behaviors } from '@web-game-engine/core';
import { Renderer } from '@web-game-engine/core';

const renderer = new Renderer({ canvas });
const emitter = new Emitter({
  x: 160,
  y: 90,
  texture: myParticleTexture,
  emissionRate: 30,
  maxParticles: 500,
  behaviors: [
    Behaviors.gravity(200),
    Behaviors.alphaOverLife(1, 0),
    Behaviors.scaleOverLife(0.5, 1.5),
  ],
});

function frame(dtMs: number) {
  emitter.update(dtMs);
  renderer.begin();
  emitter.render(renderer);
  renderer.end();
}
```

Customize emission ranges with `speed`, `angle`, `ttl`, `scale`, `alpha`.
