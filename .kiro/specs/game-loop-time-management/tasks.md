# Implementation Plan

- [x] 1. Set up project structure and core interfaces
  - Create directory `packages/engine/src/loop/` for game loop components
  - Define TypeScript interfaces for TimeManager and GameLoop options
  - Define TimeStats interface for statistics
  - Export types from `packages/engine/src/loop/index.ts`
  - _Requirements: 1.1, 5.1, 7.1-7.5_

- [x] 2. Implement TimeManager core functionality
  - [x] 2.1 Create TimeManager class with state initialization
    - Implement constructor with TimeManagerOptions
    - Initialize accumulator, fixedDelta, timeScale, paused state
    - Initialize statistics tracking (frameCount, frameTimeHistory)
    - Set up high-resolution timestamp tracking
    - _Requirements: 1.1, 5.4, 8.5_

  - [x] 2.2 Implement time accumulation and simulation step calculation
    - Implement `update(frameDelta: number): number` method
    - Add scaled delta to accumulator (respecting time scale and pause state)
    - Calculate number of simulation steps (floor(accumulator / fixedDelta))
    - Decrement accumulator by executed steps
    - Implement accumulator clamping to prevent spiral of death
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 2.3 Write property test for fixed timestep consistency
    - **Property 1: Fixed timestep consistency**
    - **Validates: Requirements 1.1, 1.3**

  - [x] 2.4 Write property test for accumulator correctness
    - **Property 2: Accumulator correctness**
    - **Validates: Requirements 1.2, 1.4**

  - [x] 2.5 Implement interpolation alpha calculation
    - Implement `getInterpolationAlpha(): number` method
    - Calculate alpha as accumulator / fixedDelta
    - Ensure alpha is clamped to [0, 1] range
    - _Requirements: 2.1, 2.2_

  - [x] 2.6 Write property test for interpolation bounds and calculation
    - **Property 3: Interpolation bounds**
    - **Property 4: Interpolation calculation**
    - **Validates: Requirements 2.1, 2.2, 2.5**

  - [x] 2.7 Implement time scaling
    - Implement `setTimeScale(scale: number): void` method
    - Validate scale is non-negative
    - Apply scale to delta time in update method
    - Implement `getTimeScale(): number` getter
    - _Requirements: 3.1, 3.6_

  - [x] 2.8 Write property test for time scale multiplication
    - **Property 5: Time scale multiplication**
    - **Validates: Requirements 3.1, 3.6**

  - [x] 2.9 Implement pause and resume functionality
    - Implement `pause(): void` method to set paused flag
    - Implement `resume(): void` method to clear paused flag
    - Implement `isPaused(): boolean` getter
    - Ensure update method respects paused state
    - Store timestamp on pause to prevent time jumps on resume
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.10 Write property test for pause/resume behavior
    - **Property 6: Pause/resume round-trip**
    - **Property 7: No time jumps on resume**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

  - [x] 2.11 Implement statistics tracking
    - Implement `recordFrameTime(frameTime: number): void` method
    - Maintain rolling window of last 60 frame times
    - Calculate FPS from frame time history
    - Calculate average frame time
    - Track simulation steps per frame
    - Track total simulation time
    - Implement `getStats(): TimeStats` method
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 2.12 Write property test for statistics accuracy
    - **Property 11: Statistics accuracy**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

  - [x] 2.13 Implement helper methods
    - Implement `getFixedDelta(): number` getter
    - Implement `getScaledDelta(): number` method (fixedDelta \* timeScale)
    - Implement `getTotalSimulationTime(): number` getter
    - Implement `reset(): void` method to reset all state
    - _Requirements: 5.1, 5.3_

  - [x] 2.14 Write unit tests for TimeManager edge cases
    - Test accumulator clamping at maxAccumulator threshold
    - Test time scale = 0 (pause simulation)
    - Test time scale = 1.0 (normal speed)
    - Test negative time scale rejection
    - Test initialization with valid timestamp
    - _Requirements: 1.5, 3.2, 3.5, 8.5_

- [x] 3. Checkpoint - Ensure TimeManager tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement GameLoop core functionality
  - [x] 4.1 Create GameLoop class with initialization
    - Implement constructor with GameLoopOptions
    - Initialize TimeManager instance
    - Set up vsync and target FPS configuration
    - Initialize running state and frame tracking
    - _Requirements: 6.1, 6.2_

  - [x] 4.2 Implement main tick method
    - Implement `tick(timestamp: number): void` method
    - Calculate frame delta from last timestamp
    - Update TimeManager with frame delta
    - Execute simulation steps in a loop while TimeManager indicates steps needed
    - Calculate interpolation alpha from TimeManager
    - Invoke render callback with alpha
    - Record frame time for statistics
    - Schedule next tick
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2_

  - [x] 4.3 Implement start and stop methods
    - Implement `start(): void` method
    - Initialize timestamp and start frame loop
    - Implement `stop(): void` method
    - Cancel scheduled frame (requestAnimationFrame or setTimeout)
    - Implement `isRunning(): boolean` getter
    - _Requirements: 6.1, 6.2_

  - [x] 4.4 Implement VSync and frame rate limiting
    - Implement `setVSync(enabled: boolean): void` method
    - Use requestAnimationFrame when vsync enabled
    - Use setTimeout with calculated delay when vsync disabled
    - Implement `setTargetFPS(fps: number): void` method
    - Calculate frame delay from target FPS (1000 / fps)
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 4.5 Write property test for frame rate limiting
    - **Property 10: Frame rate limiting**
    - **Validates: Requirements 6.3**

  - [x] 4.6 Implement browser tab visibility handling
    - Add event listener for 'visibilitychange'
    - Pause TimeManager when tab becomes hidden
    - Resume TimeManager when tab becomes visible
    - Reset timestamp on resume to prevent time jump
    - _Requirements: 6.4, 6.5_

  - [x] 4.7 Implement callback system
    - Store onSimulationStep callback from options
    - Store onRender callback from options
    - Invoke onSimulationStep with scaled delta for each simulation step
    - Invoke onRender with interpolation alpha for each render frame
    - _Requirements: 8.1, 8.2_

  - [x] 4.8 Implement TimeManager access
    - Implement `getTimeManager(): TimeManager` getter

    - Allow external access to time statistics and control
    - _Requirements: 7.1-7.5_

  - [x] 4.9 Write unit tests for GameLoop
    - Test start/stop lifecycle
    - Test vsync vs manual timing mode switching
    - Test callback invocation (simulation vs render)
    - Test tab visibility handling
    - Test integration with TimeManager
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 5. Checkpoint - Ensure GameLoop tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Integrate with ECS World
  - [x] 6.1 Update World.step() to accept delta time parameter
    - Modify World.step() signature to accept delta: number
    - Pass delta to all update-stage systems via SystemContext
    - Ensure delta is the fixed timestep value
    - _Requirements: 8.1_

  - [x] 6.2 Add World.render() method for render-stage systems
    - Create World.render(alpha: number) method
    - Pass alpha to all render-stage systems via SystemContext
    - Ensure render systems receive interpolation factor
    - _Requirements: 8.2_

  - [x] 6.3 Update SystemContext interface
    - Add delta: number field for simulation delta
    - Add alpha?: number field for interpolation factor
    - Add totalTime: number field for total simulation time
    - Update all system signatures to use SystemContext
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 6.4 Write property test for ECS timing integration
    - **Property 12: ECS simulation timing**
    - **Property 13: ECS render timing**
    - **Property 14: Pause affects only simulation**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [x] 6.5 Write integration test for full game loop with ECS
    - Create test world with mock systems
    - Run game loop for multiple frames
    - Verify systems receive correct timing
    - Verify simulation determinism
    - Test pause behavior with ECS
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 7. Checkpoint - Ensure ECS integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Add error handling and warnings
  - [x] 8.1 Implement spiral of death warning
    - Log warning when accumulator is clamped
    - Include actual and clamped values in warning
    - _Requirements: 1.5_

  - [x] 8.2 Implement performance degradation warning
    - Log warning when simulation steps per frame exceeds threshold (e.g., 5)
    - Suggest optimization in warning message
    - _Requirements: 1.2, 1.4_

  - [x] 8.3 Implement time scale validation
    - Throw error for negative time scale values
    - Include helpful error message
    - _Requirements: 3.1_

  - [x] 8.4 Write unit tests for error handling
    - Test spiral of death warning triggers
    - Test performance warning triggers
    - Test time scale validation error
    - _Requirements: 1.5, 3.1_

- [x] 9. Add property-based tests for render delta independence and precision
  - [x] 9.1 Write property test for render delta independence
    - **Property 8: Render delta independence**
    - **Validates: Requirements 5.2**

  - [x] 9.2 Write property test for delta time precision
    - **Property 9: Delta time precision**
    - **Validates: Requirements 5.5**

- [x] 10. Create example usage and documentation
  - [x] 10.1 Create example demonstrating basic game loop setup
    - Show TimeManager and GameLoop initialization
    - Demonstrate integration with ECS World
    - Show pause/resume usage
    - Show time scale effects
    - _Requirements: All_

  - [x] 10.2 Add JSDoc comments to all public APIs
    - Document TimeManager class and methods
    - Document GameLoop class and methods
    - Document all interfaces and types
    - Include usage examples in comments
    - _Requirements: All_

  - [x] 10.3 Update engine index.ts to export loop components
    - Export TimeManager, GameLoop from loop module
    - Export TimeManagerOptions, GameLoopOptions, TimeStats interfaces
    - _Requirements: All_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
