# GameLoop

Kind: symbol

## Members

- timeManager
- running
- useVSync
- targetFPS
- lastFrameTime
- frameId
- onSimulationStep — (delta: number): void
- onRender — (alpha: number): void
- visibilityChangeHandler — (): void
- (anonymous)
- start — (): void
- stop — (): void
- isRunning — (): boolean
- tick — (timestamp: number): void
- setVSync — (enabled: boolean): void
- setTargetFPS — (fps: number): void
- getTimeManager — (): TimeManager
- scheduleNextFrame — (): void
- setupVisibilityHandling — (): void
- cleanupVisibilityHandling — (): void
