# Engine Overview

The engine is modular and ECS-driven. Major subsystems include:

- Rendering: batching, cameras, viewport scaling, shader hooks, Canvas fallback.
- ECS: World, queries, systems with deterministic ordering.
- Assets: textures/atlases, audio, fonts, JSON and more.
- Scenes: push/pop/replace with transitions.
- Input: keyboard, pointer, touch, gamepad with action mapping.
- Audio: WebAudio routing and effects.

See `requirements/` for detailed requirements and ADRs.
