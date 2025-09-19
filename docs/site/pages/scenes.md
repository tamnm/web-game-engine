# Scenes & ECS

Scenes manage high-level flow (menus, gameplay) with push/pop/replace operations. Under the hood, an ECS world runs systems in deterministic stages.

Typical setup:

```ts
import { World } from '@web-game-engine/core';

const world = new World();
// register systems...
```
