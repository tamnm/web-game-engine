# Emitter

Kind: symbol

## Members

- x
- y
- texture
- emissionRate
- maxParticles
- particles
- accumulator
- behaviors
- rng — (): number
- speed
- angle
- ttl
- scale
- alpha
- (anonymous)
- count
- emit — (count: number): void
- update — (dtMs: number): void
- render — (renderer: { drawSprite: (src: Texture | TextureRegion, opts: SpriteDrawOptions) => void; }): void
- spawn — (): Particle
- withParticles — (fn: (list: Particle[]) => void): void
- setBehaviors — (behaviors: Behavior[]): void
