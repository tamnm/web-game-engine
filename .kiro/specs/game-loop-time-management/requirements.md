# Requirements Document

## Introduction

This specification defines a game loop and time management system for a 2D web game engine. The system provides deterministic fixed-timestep simulation decoupled from variable display rates, enabling smooth rendering, time manipulation effects, and frame-rate independent gameplay. This is foundational for replay systems, networked gameplay, and consistent game behavior across different devices.

## Glossary

- **Game Loop**: The main execution cycle that processes input, updates simulation, and renders frames continuously.
- **Fixed Timestep**: A constant time interval (e.g., 16.67ms for 60 Hz) used for simulation updates to ensure deterministic behavior.
- **Variable Display Rate**: The actual frame rate at which the browser renders frames, which may differ from the simulation rate.
- **Frame Interpolation**: A technique to smooth rendering by calculating intermediate states between simulation steps.
- **Time Scale**: A multiplier applied to delta time to create slow-motion or fast-forward effects.
- **Delta Time**: The elapsed time since the last update, used for frame-rate independent calculations.
- **Accumulator**: A buffer that tracks leftover time between fixed timestep updates.
- **VSync**: Vertical synchronization that limits frame rate to the display's refresh rate.
- **Time Manager**: The component responsible for tracking and managing all time-related state.
- **Simulation Step**: A single fixed-timestep update of game logic.
- **Render Frame**: A single display update that may occur between simulation steps.

## Requirements

### Requirement 1

**User Story:** As a game developer, I want a fixed timestep simulation loop, so that my game logic behaves deterministically regardless of frame rate.

#### Acceptance Criteria

1. WHEN the Game Loop executes, THE Time Manager SHALL update simulation at a fixed interval of 16.67ms (60 Hz)
2. WHEN frame rate varies, THE Time Manager SHALL accumulate time and execute multiple simulation steps if needed to maintain the fixed timestep
3. WHEN simulation steps are executed, THE Time Manager SHALL provide a constant delta time of 16.67ms to all systems
4. WHILE the accumulator contains sufficient time, THE Game Loop SHALL continue executing simulation steps until the accumulator is depleted below one timestep
5. WHEN the accumulator exceeds a maximum threshold (e.g., 250ms), THE Time Manager SHALL clamp it to prevent spiral of death

### Requirement 2

**User Story:** As a game developer, I want frame interpolation, so that rendering appears smooth even when simulation runs at a lower fixed rate than display refresh rate.

#### Acceptance Criteria

1. WHEN a render frame occurs between simulation steps, THE Time Manager SHALL calculate an interpolation factor (alpha) between 0 and 1
2. WHEN rendering, THE Renderer SHALL receive the interpolation factor to blend between previous and current simulation states
3. WHEN the interpolation factor is 0, THE Renderer SHALL display the previous simulation state exactly
4. WHEN the interpolation factor is 1, THE Renderer SHALL display the current simulation state exactly
5. WHEN the interpolation factor is between 0 and 1, THE Renderer SHALL display a smoothly interpolated state

### Requirement 3

**User Story:** As a game developer, I want time scaling capabilities, so that I can implement slow-motion, fast-forward, and other time manipulation effects.

#### Acceptance Criteria

1. WHEN a time scale is set, THE Time Manager SHALL multiply all delta time values by the time scale factor
2. WHEN time scale is 1.0, THE Time Manager SHALL provide normal-speed simulation
3. WHEN time scale is less than 1.0 (e.g., 0.5), THE Time Manager SHALL provide slow-motion simulation
4. WHEN time scale is greater than 1.0 (e.g., 2.0), THE Time Manager SHALL provide fast-forward simulation
5. WHEN time scale is 0, THE Time Manager SHALL pause simulation while continuing to render
6. WHEN time scale changes, THE Time Manager SHALL apply the new scale to subsequent updates without affecting accumulated time

### Requirement 4

**User Story:** As a game developer, I want pause and resume functionality, so that I can halt gameplay for menus, debugging, or player convenience.

#### Acceptance Criteria

1. WHEN pause is called, THE Time Manager SHALL stop accumulating simulation time
2. WHILE paused, THE Game Loop SHALL continue rendering but SHALL NOT execute simulation steps
3. WHEN resume is called, THE Time Manager SHALL continue accumulating simulation time from the paused state
4. WHEN pausing, THE Time Manager SHALL preserve the current accumulator value
5. WHEN resuming, THE Time Manager SHALL not create a large time jump that causes catch-up simulation

### Requirement 5

**User Story:** As a game developer, I want accurate delta time management, so that I can implement frame-rate independent animations and physics.

#### Acceptance Criteria

1. WHEN a simulation step executes, THE Time Manager SHALL provide the fixed delta time (16.67ms) to update systems
2. WHEN a render frame executes, THE Time Manager SHALL provide the actual elapsed time since the last render for non-simulation updates
3. WHEN time scale is applied, THE Time Manager SHALL provide scaled delta time to simulation systems
4. WHEN calculating delta time, THE Time Manager SHALL use high-resolution timestamps (performance.now() or equivalent)
5. WHEN delta time is requested, THE Time Manager SHALL return values in milliseconds with sub-millisecond precision

### Requirement 6

**User Story:** As a game developer, I want frame rate limiting and vsync support, so that I can control performance and prevent excessive CPU usage.

#### Acceptance Criteria

1. WHEN vsync is enabled, THE Game Loop SHALL use requestAnimationFrame for frame timing
2. WHEN vsync is disabled, THE Game Loop SHALL use setTimeout or setInterval with a target frame rate
3. WHEN a target frame rate is set (e.g., 30 FPS), THE Game Loop SHALL limit render calls to that rate
4. WHEN the browser tab is inactive, THE Game Loop SHALL reduce or pause execution to conserve resources
5. WHEN the browser tab becomes active again, THE Game Loop SHALL resume without creating a large time jump

### Requirement 7

**User Story:** As a game developer, I want time statistics and monitoring, so that I can debug performance issues and optimize my game.

#### Acceptance Criteria

1. WHEN requested, THE Time Manager SHALL provide the current frames per second (FPS)
2. WHEN requested, THE Time Manager SHALL provide the average frame time over a rolling window
3. WHEN requested, THE Time Manager SHALL provide the number of simulation steps executed in the current frame
4. WHEN requested, THE Time Manager SHALL provide the current time scale value
5. WHEN requested, THE Time Manager SHALL provide the total elapsed simulation time since start

### Requirement 8

**User Story:** As a game developer, I want the game loop to integrate with the ECS system, so that all systems receive consistent timing information.

#### Acceptance Criteria

1. WHEN simulation steps execute, THE Game Loop SHALL invoke ECS systems in their configured stages with the fixed delta time
2. WHEN rendering, THE Game Loop SHALL invoke render-stage systems with the interpolation factor
3. WHEN time scale changes, THE Game Loop SHALL ensure all systems receive scaled delta time
4. WHEN paused, THE Game Loop SHALL not invoke update-stage systems but SHALL continue invoking render-stage systems
5. WHEN the game loop starts, THE Time Manager SHALL initialize with a valid timestamp before the first update
