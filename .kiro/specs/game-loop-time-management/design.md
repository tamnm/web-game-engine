# Design Document

## Overview

The game loop and time management system provides the foundation for deterministic, frame-rate independent gameplay in the web game engine. It implements a fixed timestep simulation loop decoupled from variable display refresh rates, enabling consistent game behavior across devices while maintaining smooth visual rendering through interpolation.

The system consists of two primary components:

1. **TimeManager** - Manages time state, accumulation, scaling, and statistics
2. **GameLoop** - Orchestrates the main execution cycle, coordinating simulation steps and render frames

This design ensures that game logic executes at a constant 60 Hz regardless of display refresh rate, while rendering can occur at any rate (typically 60 Hz, 120 Hz, or higher). Frame interpolation provides smooth visuals even when simulation and rendering rates differ.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         GameLoop                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  requestAnimationFrame / setTimeout                     │ │
│  │  ↓                                                       │ │
│  │  tick(currentTime)                                      │ │
│  │  ├─ Calculate frame delta                               │ │
│  │  ├─ Update TimeManager                                  │ │
│  │  ├─ While accumulator >= fixedDelta:                    │ │
│  │  │  ├─ Execute simulation step                          │ │
│  │  │  ├─ Invoke ECS update systems                        │ │
│  │  │  └─ Decrement accumulator                            │ │
│  │  ├─ Calculate interpolation alpha                       │ │
│  │  ├─ Invoke ECS render systems                           │ │
│  │  └─ Schedule next tick                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       TimeManager                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  State:                                                  │ │
│  │  - accumulator: number                                  │ │
│  │  - fixedDelta: number (16.67ms)                         │ │
│  │  - timeScale: number (default 1.0)                      │ │
│  │  - paused: boolean                                      │ │
│  │  - totalSimulationTime: number                          │ │
│  │  - lastTimestamp: number                                │ │
│  │  - frameCount: number                                   │ │
│  │  - frameTimeHistory: number[]                           │ │
│  │                                                          │ │
│  │  Methods:                                                │ │
│  │  - update(delta: number): void                          │ │
│  │  - getInterpolationAlpha(): number                      │ │
│  │  - setTimeScale(scale: number): void                    │ │
│  │  - pause(): void                                         │ │
│  │  - resume(): void                                        │ │
│  │  - getStats(): TimeStats                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      ECS World                               │
│  - Receives fixed delta (16.67ms) for simulation            │
│  - Receives interpolation alpha for rendering               │
│  - Systems execute in stages: update → render               │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Frame Start**: Browser calls `requestAnimationFrame` with current timestamp
2. **Delta Calculation**: GameLoop calculates elapsed time since last frame
3. **Time Accumulation**: TimeManager adds scaled delta to accumulator (if not paused)
4. **Simulation Steps**: While accumulator >= fixedDelta, execute simulation and decrement accumulator
5. **Interpolation**: Calculate alpha = accumulator / fixedDelta for smooth rendering
6. **Rendering**: Invoke render systems with interpolation alpha
7. **Frame End**: Schedule next frame via requestAnimationFrame or setTimeout

### Key Design Decisions

1. **Fixed Timestep**: 16.67ms (60 Hz) chosen as a balance between responsiveness and performance
2. **Accumulator Pattern**: Prevents time loss and ensures deterministic simulation
3. **Interpolation**: Provides smooth visuals without increasing simulation rate
4. **Time Scaling**: Applied to accumulation, not to fixed delta, preserving determinism
5. **Spiral of Death Prevention**: Accumulator clamped to 250ms maximum
6. **High-Resolution Timing**: Uses `performance.now()` for sub-millisecond precision

## Components and Interfaces

### TimeManager

```typescript
interface TimeManagerOptions {
  fixedDelta?: number; // Default: 16.67ms (60 Hz)
  maxAccumulator?: number; // Default: 250ms
  timeScale?: number; // Default: 1.0
}

interface TimeStats {
  fps: number; // Current frames per second
  averageFrameTime: number; // Average frame time in ms
  simulationSteps: number; // Steps executed in current frame
  timeScale: number; // Current time scale
  totalSimulationTime: number; // Total elapsed simulation time
  isPaused: boolean; // Current pause state
}

class TimeManager {
  constructor(options?: TimeManagerOptions);

  // Core time management
  update(frameDelta: number): number; // Returns number of simulation steps to execute
  getFixedDelta(): number; // Returns the fixed timestep (16.67ms)
  getScaledDelta(): number; // Returns fixed delta * time scale
  getInterpolationAlpha(): number; // Returns value between 0 and 1

  // Time manipulation
  setTimeScale(scale: number): void;
  getTimeScale(): number;
  pause(): void;
  resume(): void;
  isPaused(): boolean;

  // Statistics
  getStats(): TimeStats;
  getTotalSimulationTime(): number;

  // Internal state management
  reset(): void;
  recordFrameTime(frameTime: number): void;
}
```

### GameLoop

```typescript
interface GameLoopOptions {
  timeManager?: TimeManager;
  useVSync?: boolean; // Default: true
  targetFPS?: number; // Used when vsync is false
  onSimulationStep?: (delta: number) => void;
  onRender?: (alpha: number) => void;
}

class GameLoop {
  constructor(options: GameLoopOptions);

  // Lifecycle
  start(): void;
  stop(): void;
  isRunning(): boolean;

  // Frame execution
  tick(timestamp: number): void; // Main loop iteration

  // Configuration
  setVSync(enabled: boolean): void;
  setTargetFPS(fps: number): void;

  // Access to time manager
  getTimeManager(): TimeManager;
}
```

### Integration with ECS

```typescript
// World receives timing information
interface SystemContext {
  delta: number;        // For simulation systems: fixed delta * time scale
  alpha?: number;       // For render systems: interpolation factor
  totalTime: number;    // Total elapsed simulation time
}

// Systems are invoked with appropriate timing
world.step(delta: number);           // Simulation step with fixed delta
world.render(alpha: number);         // Render step with interpolation
```

## Data Models

### TimeManager State

```typescript
interface TimeManagerState {
  // Accumulator pattern
  accumulator: number; // Leftover time from previous frames
  fixedDelta: number; // Fixed timestep (16.67ms for 60 Hz)
  maxAccumulator: number; // Maximum accumulator to prevent spiral of death

  // Time manipulation
  timeScale: number; // Multiplier for time (1.0 = normal, 0.5 = slow-mo)
  paused: boolean; // Whether simulation is paused

  // Timing state
  lastTimestamp: number; // Timestamp of last update
  totalSimulationTime: number; // Total time simulated (in fixed steps)

  // Statistics
  frameCount: number; // Total frames rendered
  frameTimeHistory: number[]; // Rolling window of frame times (last 60 frames)
  simulationStepsThisFrame: number; // Steps executed in current frame
}
```

### GameLoop State

```typescript
interface GameLoopState {
  running: boolean; // Whether loop is active
  useVSync: boolean; // Whether to use requestAnimationFrame
  targetFPS: number; // Target frame rate when vsync is off
  lastFrameTime: number; // Timestamp of last frame
  frameId: number | null; // ID from requestAnimationFrame or setTimeout
  timeManager: TimeManager; // Time management instance
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Fixed timestep consistency

_For any_ sequence of simulation steps, each step should receive exactly the fixed delta time (16.67ms), regardless of actual frame timing or number of steps executed per frame.

**Validates: Requirements 1.1, 1.3**

### Property 2: Accumulator correctness

_For any_ frame delta, the number of simulation steps executed should equal floor((accumulator + scaledDelta) / fixedDelta), and the remaining accumulator should be less than fixedDelta.

**Validates: Requirements 1.2, 1.4**

### Property 3: Interpolation bounds

_For any_ render frame, the interpolation alpha value should be greater than or equal to 0 and less than or equal to 1.

**Validates: Requirements 2.1**

### Property 4: Interpolation calculation

_For any_ render frame, the interpolation alpha should equal accumulator / fixedDelta, representing the fractional progress toward the next simulation step.

**Validates: Requirements 2.2, 2.5**

### Property 5: Time scale multiplication

_For any_ time scale value and frame delta, the scaled delta added to the accumulator should equal frameDelta \* timeScale (when not paused).

**Validates: Requirements 3.1, 3.6**

### Property 6: Pause/resume round-trip

_For any_ game state, pausing then immediately resuming should preserve the accumulator value and not execute any simulation steps during the paused period.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 7: No time jumps on resume

_For any_ pause duration, resuming should not cause the first frame delta to exceed a reasonable threshold (e.g., 2x fixedDelta), preventing catch-up simulation spikes.

**Validates: Requirements 4.5, 6.5**

### Property 8: Render delta independence

_For any_ render frame, the render delta time (actual elapsed time) should be independent of the fixed simulation delta and should reflect real wall-clock time.

**Validates: Requirements 5.2**

### Property 9: Delta time precision

_For any_ delta time value, it should have sub-millisecond precision (at least 3 decimal places) when using high-resolution timestamps.

**Validates: Requirements 5.5**

### Property 10: Frame rate limiting

_For any_ target FPS setting, the actual average FPS over a measurement window should be within 10% of the target (when vsync is disabled and system can maintain the rate).

**Validates: Requirements 6.3**

### Property 11: Statistics accuracy

_For any_ time period, the statistics (FPS, average frame time, simulation steps, time scale, total time) should accurately reflect the actual measurements within acceptable error margins.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 12: ECS simulation timing

_For any_ simulation step, all ECS update-stage systems should receive the same fixed delta time (16.67ms \* timeScale).

**Validates: Requirements 8.1, 8.3**

### Property 13: ECS render timing

_For any_ render frame, all ECS render-stage systems should receive the same interpolation alpha value.

**Validates: Requirements 8.2**

### Property 14: Pause affects only simulation

_For any_ paused period, render-stage systems should continue to be invoked while update-stage systems should not be invoked.

**Validates: Requirements 8.4**

## Error Handling

### Spiral of Death Prevention

When the accumulator exceeds `maxAccumulator` (default 250ms), it is clamped to prevent the "spiral of death" where the game tries to catch up with too many simulation steps, causing further slowdown.

```typescript
if (this.accumulator > this.maxAccumulator) {
  console.warn(
    `TimeManager: Accumulator clamped from ${this.accumulator}ms to ${this.maxAccumulator}ms`
  );
  this.accumulator = this.maxAccumulator;
}
```

### Invalid Time Scale

Time scale values should be non-negative. Negative values are rejected:

```typescript
setTimeScale(scale: number): void {
  if (scale < 0) {
    throw new Error('Time scale must be non-negative');
  }
  this.timeScale = scale;
}
```

### Browser Tab Visibility

When the browser tab becomes inactive, the game loop should handle the large time gap gracefully:

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    this.pause();
  } else {
    this.resume();
    // Reset lastTimestamp to prevent large delta
    this.lastTimestamp = performance.now();
  }
});
```

### Performance Degradation

If the system consistently cannot maintain the fixed timestep (accumulator frequently maxed), emit warnings:

```typescript
if (this.simulationStepsThisFrame > 5) {
  console.warn(
    `TimeManager: Executed ${this.simulationStepsThisFrame} simulation steps in one frame. Consider optimizing game logic.`
  );
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify individual components in isolation:

1. **TimeManager Tests**:
   - Accumulator behavior with various frame deltas
   - Time scale application
   - Pause/resume state transitions
   - Statistics calculation
   - Interpolation alpha calculation
   - Edge cases (zero delta, huge delta, negative scale)

2. **GameLoop Tests**:
   - Start/stop lifecycle
   - VSync vs manual timing
   - Integration with TimeManager
   - Callback invocation (simulation vs render)

### Property-Based Testing

Property-based tests will verify correctness properties across many random inputs using a PBT library (fast-check for TypeScript):

**Library**: fast-check (https://github.com/dubzzz/fast-check)

**Configuration**: Each property test should run a minimum of 100 iterations to ensure coverage of edge cases.

**Test Tagging**: Each property-based test must include a comment with the format:

```typescript
// **Feature: game-loop-time-management, Property N: [property description]**
```

**Property Tests**:

1. **Property 1: Fixed timestep consistency**
   - Generate random sequences of frame deltas
   - Verify each simulation step receives exactly 16.67ms
   - Tag: `**Feature: game-loop-time-management, Property 1: Fixed timestep consistency**`

2. **Property 2: Accumulator correctness**
   - Generate random frame deltas and time scales
   - Verify step count and remaining accumulator are correct
   - Tag: `**Feature: game-loop-time-management, Property 2: Accumulator correctness**`

3. **Property 3: Interpolation bounds**
   - Generate random accumulator values
   - Verify alpha is always in [0, 1]
   - Tag: `**Feature: game-loop-time-management, Property 3: Interpolation bounds**`

4. **Property 4: Interpolation calculation**
   - Generate random accumulator and fixedDelta values
   - Verify alpha = accumulator / fixedDelta
   - Tag: `**Feature: game-loop-time-management, Property 4: Interpolation calculation**`

5. **Property 5: Time scale multiplication**
   - Generate random time scales and frame deltas
   - Verify scaled delta = frameDelta \* timeScale
   - Tag: `**Feature: game-loop-time-management, Property 5: Time scale multiplication**`

6. **Property 6: Pause/resume round-trip**
   - Generate random game states
   - Pause, advance time, resume
   - Verify accumulator unchanged and no steps during pause
   - Tag: `**Feature: game-loop-time-management, Property 6: Pause/resume round-trip**`

7. **Property 7: No time jumps on resume**
   - Generate random pause durations
   - Verify first delta after resume is reasonable
   - Tag: `**Feature: game-loop-time-management, Property 7: No time jumps on resume**`

8. **Property 8: Render delta independence**
   - Generate random frame sequences
   - Verify render delta reflects actual time, not fixed delta
   - Tag: `**Feature: game-loop-time-management, Property 8: Render delta independence**`

9. **Property 9: Delta time precision**
   - Generate random timestamps
   - Verify delta values have sub-millisecond precision
   - Tag: `**Feature: game-loop-time-management, Property 9: Delta time precision**`

10. **Property 10: Frame rate limiting**
    - Generate random target FPS values
    - Measure actual FPS over time
    - Verify within 10% of target
    - Tag: `**Feature: game-loop-time-management, Property 10: Frame rate limiting**`

11. **Property 11: Statistics accuracy**
    - Generate random frame sequences
    - Verify statistics match actual measurements
    - Tag: `**Feature: game-loop-time-management, Property 11: Statistics accuracy**`

12. **Property 12: ECS simulation timing**
    - Generate random simulation steps
    - Verify all systems receive same delta
    - Tag: `**Feature: game-loop-time-management, Property 12: ECS simulation timing**`

13. **Property 13: ECS render timing**
    - Generate random render frames
    - Verify all systems receive same alpha
    - Tag: `**Feature: game-loop-time-management, Property 13: ECS render timing**`

14. **Property 14: Pause affects only simulation**
    - Generate random paused periods
    - Count system invocations
    - Verify render continues, update stops
    - Tag: `**Feature: game-loop-time-management, Property 14: Pause affects only simulation**`

### Integration Testing

Integration tests will verify the game loop works correctly with the ECS system:

1. **Full Loop Integration**:
   - Create a minimal ECS world with test systems
   - Run the game loop for multiple frames
   - Verify systems receive correct timing information
   - Verify simulation determinism (same inputs = same outputs)

2. **Performance Testing**:
   - Run loop for extended period (1000+ frames)
   - Verify no memory leaks
   - Verify consistent frame timing
   - Verify accumulator doesn't grow unbounded

3. **Browser Integration**:
   - Test with requestAnimationFrame
   - Test with setTimeout
   - Test tab visibility changes
   - Test on different refresh rates (60Hz, 120Hz, 144Hz)

### Edge Case Testing

Specific edge cases to test:

1. **Accumulator clamping** (Requirement 1.5): Verify accumulator never exceeds maxAccumulator
2. **Alpha boundaries** (Requirements 2.3, 2.4): Test alpha=0 and alpha=1 cases
3. **Time scale = 1.0** (Requirement 3.2): Verify no change to delta
4. **Time scale = 0** (Requirement 3.5): Verify simulation pauses, rendering continues
5. **Initialization** (Requirement 8.5): Verify first update has valid timing

## Performance Considerations

### Optimization Strategies

1. **Minimize Allocations**: Reuse objects and arrays where possible
2. **Efficient Statistics**: Use circular buffer for frame time history
3. **Early Exit**: Skip simulation steps when paused
4. **Batch Updates**: Execute multiple simulation steps before rendering when needed

### Performance Targets

- **Overhead**: Game loop overhead should be < 0.5ms per frame
- **Memory**: TimeManager should use < 1KB of memory
- **Consistency**: Frame time variance should be < 2ms (excluding outliers)

### Monitoring

Expose performance metrics via `getStats()`:

- Current FPS
- Average frame time
- Simulation steps per frame
- Time scale
- Total simulation time

## Future Enhancements

1. **Variable Timestep Option**: Support for variable timestep mode for non-deterministic games
2. **Multiple Simulation Rates**: Support different fixed timesteps for different systems
3. **Frame Prediction**: Predict next frame state for even smoother rendering
4. **Replay System Integration**: Built-in support for recording and playback
5. **Network Synchronization**: Helpers for networked multiplayer timing
6. **Profiling Hooks**: Detailed timing breakdown for each system
7. **Adaptive Quality**: Automatically adjust time scale or quality based on performance
