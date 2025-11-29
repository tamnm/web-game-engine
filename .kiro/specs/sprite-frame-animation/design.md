# Design Document

## Overview

The sprite frame animation system provides frame-based animation capabilities for the 2D game engine through an ECS-driven architecture. The system consists of animation components that store playback state, an animation system that updates frame progression based on delta time, and integration points with the existing texture atlas and rendering subsystems.

The design emphasizes determinism, performance, and ease of use. Animations are defined as clips containing ordered sequences of texture atlas frame names with associated timing information. Each entity with an animation component maintains independent playback state, allowing hundreds of simultaneously animated entities. The system respects the engine's time scaling capabilities and provides comprehensive playback controls and event callbacks for game logic integration.

## Architecture

### Component-Based State Management

Animation state is stored in ECS components attached to entities. The primary component is `SpriteAnimation`, which contains:

- Current animation clip reference
- Current frame index within the clip
- Accumulated time since last frame change
- Playback state (playing, paused, stopped)
- Animation speed multiplier
- Flip and rotation transforms
- Event callback registrations

### System-Based Updates

The `SpriteAnimationSystem` executes during the `update` stage and processes all entities with `SpriteAnimation` components. For each playing animation, the system:

1. Retrieves scaled delta time from the system context
2. Applies animation speed multiplier
3. Accumulates time and advances frames when thresholds are exceeded
4. Handles loop behavior and direction changes
5. Invokes registered event callbacks
6. Updates component state for rendering

### Animation Clip Registry

Animation clips are registered globally or per-entity and contain:

- Unique clip name
- Ordered array of texture atlas frame names
- Frame durations (uniform or per-frame)
- Loop mode configuration
- Default animation speed

The registry validates frame names against texture atlases during clip registration to catch configuration errors early.

## Components and Interfaces

### SpriteAnimation Component

```typescript
interface SpriteAnimationData {
  // Current clip being played
  clipName: string;

  // Current frame index in the clip
  frameIndex: number;

  // Accumulated time in seconds since last frame change
  accumulatedTime: number;

  // Playback state
  state: 'playing' | 'paused' | 'stopped';

  // Animation speed multiplier (1.0 = normal speed)
  speed: number;

  // Loop mode
  loopMode: 'none' | 'loop' | 'ping-pong';

  // Playback direction (1 = forward, -1 = reverse)
  direction: 1 | -1;

  // Visual transforms
  flipX: boolean;
  flipY: boolean;
  rotation: number; // radians

  // Event callbacks
  onComplete?: (entity: Entity, clipName: string) => void;
  onLoop?: (entity: Entity, clipName: string) => void;
  onFrame?: (entity: Entity, clipName: string, frameIndex: number) => void;

  // Transition state (optional)
  transition?: {
    targetClip: string;
    duration: number;
    elapsed: number;
  };
}

const SpriteAnimation: ComponentDefinition<SpriteAnimationData> = {
  name: 'SpriteAnimation',
  defaults: () => ({
    clipName: '',
    frameIndex: 0,
    accumulatedTime: 0,
    state: 'stopped',
    speed: 1.0,
    loopMode: 'loop',
    direction: 1,
    flipX: false,
    flipY: false,
    rotation: 0,
  }),
};
```

### Animation Clip Definition

```typescript
interface AnimationFrame {
  // Frame name in texture atlas
  frameName: string;

  // Duration in seconds (optional, uses clip default if not specified)
  duration?: number;
}

interface AnimationClip {
  // Unique clip identifier
  name: string;

  // Texture atlas containing the frames
  atlas: TextureAtlas;

  // Ordered sequence of frames
  frames: AnimationFrame[];

  // Default frame duration in seconds
  defaultFrameDuration: number;

  // Default loop mode
  loopMode: 'none' | 'loop' | 'ping-pong';

  // Default animation speed
  speed: number;
}
```

### Animation Manager

```typescript
interface AnimationManager {
  // Register an animation clip
  registerClip(clip: AnimationClip): void;

  // Get a registered clip by name
  getClip(name: string): AnimationClip | undefined;

  // Check if a clip exists
  hasClip(name: string): boolean;

  // List all registered clip names
  listClips(): string[];

  // Unregister a clip
  unregisterClip(name: string): void;
}
```

### Animation Control API

```typescript
interface AnimationController {
  // Play an animation clip
  play(entity: Entity, clipName: string, resetFrame?: boolean): void;

  // Pause the current animation
  pause(entity: Entity): void;

  // Resume a paused animation
  resume(entity: Entity): void;

  // Stop the animation and reset to frame 0
  stop(entity: Entity): void;

  // Set animation speed
  setSpeed(entity: Entity, speed: number): void;

  // Set loop mode
  setLoopMode(entity: Entity, mode: 'none' | 'loop' | 'ping-pong'): void;

  // Set flip transforms
  setFlip(entity: Entity, flipX: boolean, flipY: boolean): void;

  // Set rotation
  setRotation(entity: Entity, rotation: number): void;

  // Transition to another animation
  transitionTo(entity: Entity, targetClip: string, duration: number): void;

  // Get current animation state
  getState(entity: Entity): SpriteAnimationData | undefined;

  // Get current frame's texture region
  getCurrentFrame(entity: Entity): TextureRegion | undefined;
}
```

## Data Models

### Frame Advancement Model

Frame advancement follows a time-accumulation model:

1. Each update, scaled delta time is added to `accumulatedTime`
2. The current frame's duration is retrieved (per-frame or default)
3. While `accumulatedTime >= frameDuration`:
   - Subtract `frameDuration` from `accumulatedTime`
   - Advance frame index by `direction` (1 or -1)
   - Handle boundary conditions (loop, stop, reverse)
   - Invoke `onFrame` callback
4. Remaining `accumulatedTime` carries over to next update

This model ensures:

- Frame-perfect timing regardless of frame rate
- Correct behavior when multiple frames should advance in a single update
- Smooth handling of variable frame durations
- Deterministic playback with fixed timestep

### Loop Behavior Model

**None Mode:**

- When `frameIndex` reaches the last frame, set `state` to 'stopped'
- Invoke `onComplete` callback
- Remain on final frame

**Loop Mode:**

- When `frameIndex` exceeds the last frame, wrap to frame 0
- Invoke `onLoop` callback
- Continue playing

**Ping-Pong Mode:**

- When `frameIndex` reaches 0 (reverse) or last frame (forward), reverse `direction`
- Invoke `onLoop` callback
- Continue playing in opposite direction

### Transition Model

Transitions blend between animations over a specified duration:

1. When transition is initiated:
   - Store target clip and transition duration
   - Continue playing current animation
   - Begin accumulating transition elapsed time

2. During transition:
   - Update both current and target animations
   - Calculate blend factor: `elapsed / duration`
   - Interpolate visual properties (position, alpha) if applicable

3. On transition complete:
   - Switch to target clip
   - Reset to frame 0 of target clip
   - Clear transition state
   - Invoke `onTransitionComplete` callback

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Animation clip registration validates frame references

_For any_ animation clip with frame names, registering the clip should succeed if and only if all frame names exist in the specified texture atlas.
**Validates: Requirements 1.2**

### Property 2: Component initialization defaults

_For any_ newly created animation component, the playback state should be 'stopped', frame index should be 0, and accumulated time should be 0.
**Validates: Requirements 2.2**

### Property 3: Component state isolation

_For any_ two entities with animation components, modifying one entity's animation state should not affect the other entity's state.
**Validates: Requirements 2.4**

### Property 4: Component query completeness

_For any_ entity with an animation component, querying the component should return all required fields: frame index, playback state, elapsed time, clip name, and speed.
**Validates: Requirements 2.5**

### Property 5: Play operation state transition

_For any_ animation component, calling play should set the playback state to 'playing' and reset frame index to 0.
**Validates: Requirements 3.1, 3.5**

### Property 6: Pause preserves state

_For any_ playing animation, calling pause should set state to 'paused' and preserve the current frame index and accumulated time.
**Validates: Requirements 3.2**

### Property 7: Stop resets state

_For any_ animation component, calling stop should set state to 'stopped', frame index to 0, and accumulated time to 0.
**Validates: Requirements 3.3**

### Property 8: Resume continues from paused state

_For any_ paused animation, calling resume should set state to 'playing' and maintain the frame index and accumulated time from before pause.
**Validates: Requirements 3.4**

### Property 9: Time accumulation for playing animations

_For any_ animation in 'playing' state, after a system update with delta time D, the accumulated time should increase by D _ speed _ timeScale.
**Validates: Requirements 4.1, 4.4, 6.4**

### Property 10: Paused animations do not accumulate time

_For any_ animation in 'paused' state, after a system update with any delta time, the accumulated time should remain unchanged.
**Validates: Requirements 4.5**

### Property 11: Frame advancement with time accumulation

_For any_ playing animation, when accumulated time exceeds the sum of frame durations for N frames, the frame index should advance by N frames and accumulated time should be reduced by the sum of those durations.
**Validates: Requirements 4.2, 4.3**

### Property 12: Animation speed affects frame rate

_For any_ animation with speed S, the time required to advance one frame should be frameDuration / S (where S > 0).
**Validates: Requirements 6.2, 6.3**

### Property 13: Loop mode wraps to frame zero

_For any_ animation with loop mode 'loop', when the frame index would exceed the last frame, it should wrap to frame 0 and continue playing.
**Validates: Requirements 5.2**

### Property 14: None mode stops at final frame

_For any_ animation with loop mode 'none', when reaching the final frame, the playback state should become 'stopped' and frame index should remain at the final frame.
**Validates: Requirements 5.1, 5.5**

### Property 15: Ping-pong reverses direction at boundaries

_For any_ animation with loop mode 'ping-pong', when reaching frame 0 (while going reverse) or the final frame (while going forward), the direction should reverse.
**Validates: Requirements 5.3, 5.4**

### Property 16: OnLoop callback fires on wrap

_For any_ animation with loop mode 'loop', when the frame index wraps from the last frame to frame 0, the onLoop callback should be invoked with the entity and clip name.
**Validates: Requirements 7.1**

### Property 17: OnComplete callback fires on completion

_For any_ animation with loop mode 'none', when reaching the final frame and stopping, the onComplete callback should be invoked with the entity and clip name.
**Validates: Requirements 7.2**

### Property 18: OnFrame callback fires on frame change

_For any_ animation, when the frame index changes from F to F+1 (or F-1 in reverse), the onFrame callback should be invoked with the entity, clip name, and new frame index.
**Validates: Requirements 7.3**

### Property 19: Multiple callbacks execute in order

_For any_ animation event with N registered callbacks, all N callbacks should be invoked in registration order when the event occurs.
**Validates: Requirements 7.4**

### Property 20: Callback errors are isolated

_For any_ animation event where a callback throws an error, the error should be logged and remaining callbacks should still execute.
**Validates: Requirements 7.5**

### Property 21: Flip transforms affect rendering

_For any_ animation with flipX or flipY set to true, the rendering system should receive sprite draw options with the corresponding flip flags set.
**Validates: Requirements 8.1, 8.2, 9.3**

### Property 22: Current frame provides texture region

_For any_ entity with an animation component in any state, querying the current frame should return a valid TextureRegion from the texture atlas.
**Validates: Requirements 9.1**

### Property 23: Invalid clip references are handled gracefully

_For any_ animation component with an invalid clip name or frame index, the system should log an error and not crash during rendering.
**Validates: Requirements 9.4**

### Property 24: Per-frame durations are used correctly

_For any_ animation clip with per-frame durations, advancing from frame F should use the duration specified for frame F.
**Validates: Requirements 10.2**

### Property 25: Default duration fallback

_For any_ animation clip without per-frame durations, all frames should use the clip's default frame duration.
**Validates: Requirements 10.3**

### Property 26: Variable duration frame advancement

_For any_ animation with per-frame durations [D1, D2, D3, ...], accumulating time T should advance through frames correctly such that frame F is displayed for duration DF.
**Validates: Requirements 10.5**

### Property 27: Transition completion switches clips

_For any_ animation transition with duration D, after elapsed time >= D, the animation should be playing the target clip starting from frame 0.
**Validates: Requirements 11.3**

### Property 28: Transition interruption

_For any_ active transition, initiating a new transition should cancel the current transition and start the new one.
**Validates: Requirements 11.4**

### Property 29: Manual frame stepping

_For any_ animation, calling step(1) should advance the frame index by exactly 1, and step(-1) should decrement by exactly 1.
**Validates: Requirements 12.4**

## Error Handling

### Invalid Input Handling

The system validates all inputs and provides clear error messages:

- **Invalid clip names**: Throw error with message "Animation clip '{name}' not found"
- **Invalid frame names**: Throw error during clip registration with message "Frame '{frameName}' not found in texture atlas"
- **Invalid durations**: Throw error with message "Frame duration must be greater than zero"
- **Invalid speed**: Throw error with message "Animation speed must be greater than zero"
- **Invalid entity**: Log warning "Entity {id} does not have SpriteAnimation component" and skip operation

### Runtime Error Handling

During system execution, errors are handled gracefully:

- **Missing texture atlas**: Log error and skip rendering for affected entity
- **Frame index out of bounds**: Clamp to valid range and log warning
- **Callback exceptions**: Catch, log error with stack trace, continue processing
- **Invalid component state**: Reset to default state and log error

### Recovery Strategies

The system provides recovery mechanisms:

- **Clip not found**: Fall back to first registered clip or stop animation
- **Atlas update during playback**: Revalidate frame references, stop if invalid
- **Corrupted component state**: Reset to defaults on next update

## Testing Strategy

### Unit Testing

Unit tests verify individual functions and edge cases:

- Clip registration with valid and invalid frame names
- Component initialization and default values
- Playback control functions (play, pause, stop, resume)
- Frame advancement calculations with various delta times
- Loop mode boundary conditions
- Speed multiplier calculations
- Callback registration and invocation
- Error handling for invalid inputs

### Property-Based Testing

Property-based tests verify universal correctness properties using **fast-check** (JavaScript/TypeScript property testing library). Each test should run a minimum of 100 iterations with randomly generated inputs.

**Test Configuration:**

```typescript
import fc from 'fast-check';

// Configure property tests to run 100+ iterations
const testConfig = { numRuns: 100 };
```

**Property Test Structure:**
Each property-based test must:

1. Generate random valid inputs (clips, entities, delta times, etc.)
2. Execute the operation under test
3. Assert the correctness property holds
4. Include a comment tag referencing the design property

**Example Property Test:**

```typescript
// Feature: sprite-frame-animation, Property 9: Time accumulation for playing animations
fc.assert(
  fc.property(
    fc.float({ min: 0.001, max: 1.0 }), // delta
    fc.float({ min: 0.1, max: 2.0 }), // speed
    fc.float({ min: 0.5, max: 2.0 }), // timeScale
    (delta, speed, timeScale) => {
      // Test implementation
    }
  ),
  testConfig
);
```

**Generator Strategies:**

- **Animation clips**: Generate with 2-10 frames, durations 0.05-0.5s
- **Delta times**: Generate realistic values (0.001-0.1s for 10-1000 FPS)
- **Frame indices**: Generate within valid bounds for clip
- **Speeds**: Generate positive values (0.1-5.0)
- **Time scales**: Generate positive values (0.0-2.0)
- **Loop modes**: Generate from enum ['none', 'loop', 'ping-pong']

**Edge Cases to Test:**

- Zero-length animations (single frame)
- Very fast animations (short durations)
- Very slow animations (long durations)
- Large delta times (multiple frames per update)
- Speed near zero (0.01)
- Speed very high (10.0)
- Rapid state transitions (play/pause/stop in sequence)

### Integration Testing

Integration tests verify system interaction with other subsystems:

- Animation system with ECS world and entity lifecycle
- Animation system with rendering system (texture region retrieval)
- Animation system with time manager (time scaling)
- Animation controller with animation system
- Multiple animated entities in a scene
- Animation transitions during gameplay
- Event callbacks triggering game logic

### Performance Testing

Performance tests ensure the system meets requirements:

- 100 animated entities at 60 FPS with < 5ms system execution time
- 1000 animated entities at 30 FPS with < 16ms system execution time
- Memory usage remains stable over 10,000 frames
- No memory leaks when creating/destroying animated entities
- Clip registration and lookup in O(1) time

## Implementation Notes

### Performance Optimizations

- **Component data layout**: Store hot data (frameIndex, accumulatedTime, state) contiguously for cache efficiency
- **Batch callback invocation**: Collect callbacks during frame advancement, invoke after all entities processed
- **Lazy texture region lookup**: Only retrieve texture regions during rendering, not during updates
- **Frame duration caching**: Cache current frame duration to avoid repeated lookups
- **Early exit for stopped animations**: Skip processing for stopped animations in system update

### Determinism Considerations

- **Fixed-point time accumulation**: Use floating-point carefully to avoid drift over long sessions
- **Consistent frame advancement**: Ensure same delta time produces same frame progression
- **Callback ordering**: Maintain strict ordering for deterministic behavior
- **State machine transitions**: Use explicit state transitions, avoid implicit state changes

### Extensibility Points

- **Custom loop modes**: Allow registration of custom loop behavior functions
- **Animation events**: Support custom event types beyond onComplete/onLoop/onFrame
- **Frame interpolation**: Hook for sub-frame interpolation in future
- **Animation layers**: Support for blending multiple animations per entity
- **Animation state machines**: Integration point for state machine-driven animations

### Development Tools Integration

The animation system integrates with the engine's development overlay:

- **Animation inspector**: Display current clip, frame, state for selected entity
- **Playback controls**: Play/pause/stop/step buttons in dev overlay
- **Timeline scrubber**: Visual timeline showing frame progression
- **Performance metrics**: System execution time, entity count, callback count
- **Clip browser**: List all registered clips with preview thumbnails
