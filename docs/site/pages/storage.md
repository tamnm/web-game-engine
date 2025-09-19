# Storage & Save Manager

The storage module provides a versioned `SaveManager` with a pluggable `SaveStore`.

Example (LocalStorage):

```ts
import { SaveManager, LocalStorageStore } from '@web-game-engine/core';

const saves = new SaveManager<{ score: number }>({
  namespace: 'my-game',
  version: 2,
  store: new LocalStorageStore(),
  migrations: [
    {
      from: 1,
      to: 2,
      migrate: (d: unknown) => ({ score: parseInt((d as { score: string }).score, 10) }),
    },
  ],
});

saves.save({ score: 100 }, 'slot1');
const record = saves.load('slot1'); // { version: 2, data: { score: 100 } }
```

Slots are named via `save(data, slot)` and listed with `listSlots()`.
