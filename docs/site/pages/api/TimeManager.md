# TimeManager

Kind: symbol

## Members

- accumulator
- fixedDelta
- maxAccumulator
- timeScale
- paused
- totalSimulationTime
- frameCount
- frameTimeHistory
- simulationStepsThisFrame
- (anonymous)
- update — (frameDelta: number): number
- getFixedDelta — (): number
- getScaledDelta — (): number
- getInterpolationAlpha — (): number
- setTimeScale — (scale: number): void
- getTimeScale — (): number
- pause — (): void
- resume — (): void
- isPaused — (): boolean
- getStats — (): TimeStats
- getTotalSimulationTime — (): number
- recordFrameTime — (frameTime: number): void
- reset — (): void
