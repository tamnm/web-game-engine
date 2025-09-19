# Renderer

Kind: symbol

## Members

- context
- stats
- drawing
- currentBatch
- maxBatchSize
- camera
- viewport
- postProcessHook — (ctx: CanvasRenderingContext2D): void
- backend
- frameStartMs
- (anonymous)
- begin — (): void
- setCamera — (camera: Camera2D): void
- setViewport — (viewport: Viewport): void
- setPostProcess — (hook: (ctx: CanvasRenderingContext2D) => void): void
- getBackend — (): RenderBackend
- getStats — (): RenderStats
- drawSprite — (source: Texture | TextureRegion, options: SpriteDrawOptions): void
- end — (): RenderStats
- prepareCommand — (source: Texture | TextureRegion, options: SpriteDrawOptions): SpriteBatchCommand
- enqueue — (command: SpriteBatchCommand): void
- flushCurrentBatch — (): void
- drawSpriteCanvas — (command: SpriteBatchCommand): void
- isWebGLContext — (ctx: RenderContext): ctx is WebGL2RenderingContext
- mapBlendToCanvas — (blend: "normal" | "additive" | "multiply" | "screen"): GlobalCompositeOperation
