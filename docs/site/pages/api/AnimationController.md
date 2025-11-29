# AnimationController

Kind: symbol

## Members

- (anonymous)
- play — (entity: number, clipName: string, resetFrame?: boolean): void
- pause — (entity: number): void
- resume — (entity: number): void
- stop — (entity: number): void
- setSpeed — (entity: number, speed: number): void
- setLoopMode — (entity: number, mode: LoopMode): void
- setFlip — (entity: number, flipX: boolean, flipY: boolean): void
- setRotation — (entity: number, rotation: number): void
- transitionTo — (entity: number, targetClip: string, duration: number): void
- getState — (entity: number): SpriteAnimationData
- getCurrentFrame — (entity: number): TextureRegion
- step — (entity: number, steps: number): void
