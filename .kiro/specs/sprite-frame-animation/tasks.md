# Implementation Plan

- [x] 1. Set up animation module structure and core types
  - Create `packages/engine/src/animation/sprite/` directory
  - Define TypeScript interfaces for SpriteAnimationData, AnimationClip, AnimationFrame
  - Define loop mode and playback state enums
  - Export types from `packages/engine/src/animation/sprite/types.ts`
  - _Requirements: 1.1, 2.1_

- [x] 2. Implement AnimationManager for clip registration
  - Create AnimationManager class with clip storage (Map)
  - Implement registerClip method with frame name validation against texture atlas
  - Implement getClip, hasClip, listClips, unregisterClip methods
  - Validate frame durations are positive during registration
  - Export from `packages/engine/src/animation/sprite/AnimationManager.ts`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.1 Write property test for clip registration validation
  - **Property 1: Animation clip registration validates frame references**
  - **Validates: Requirements 1.2**

- [x] 3. Implement SpriteAnimation component definition
  - Create component definition with defaults factory

  - Initialize with stopped state, frame 0, zero accumulated time
  - Include all fields: clipName, frameIndex, accumulatedTime, state, speed, loopMode, direction, flip, rotation, callbacks
  - Export from `packages/engine/src/animation/sprite/components.ts`

  - _Requirements: 2.1, 2.2_

- [x] 3.1 Write property test for component initialization
  - **Property 2: Component initialization defaults**
  - **Validates: Requirements 2.2**

- [x] 3.2 Write property test for component state isolation
  - **Property 3: Component state isolation**
  - **Validates: Requirements 2.4**

- [x] 4. Implement AnimationController for playback control
  - Create AnimationController class accepting World and AnimationManager
  - Implement play method: set state to playing, reset frame to 0, set clip name
  - Implement pause method: set state to paused, preserve frame and time
  - Implement stop method: set state to stopped, reset frame and time to 0
  - Implement resume method: set state to playing, preserve frame and time
  - Implement setSpeed, setLoopMode, setFlip, setRotation methods
  - Implement getState and getCurrentFrame methods
  - Export from `packages/engine/src/animation/sprite/AnimationController.ts`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 8.1, 8.2, 8.3_

- [x] 4.1 Write property test for play operation
  - **Property 5: Play operation state transition**
  - **Validates: Requirements 3.1, 3.5**

- [x] 4.2 Write property test for pause preserves state
  - **Property 6: Pause preserves state**
  - **Validates: Requirements 3.2**

- [x] 4.3 Write property test for stop resets state
  - **Property 7: Stop resets state**
  - **Validates: Requirements 3.3**

- [x] 4.4 Write property test for resume continues from paused
  - **Property 8: Resume continues from paused state**
  - **Validates: Requirements 3.4**

- [x] 5. Implement SpriteAnimationSystem for frame advancement
  - Create system with id 'sprite-animation', stage 'update', order 10
  - Query for entities with SpriteAnimation component
  - For each playing animation, accumulate delta _ speed _ timeScale
  - Implement frame advancement logic: while accumulated >= frameDuration, advance frame
  - Handle per-frame durations vs default duration
  - Subtract frame duration from accumulated time when advancing
  - Skip paused and stopped animations
  - Export from `packages/engine/src/animation/sprite/SpriteAnimationSystem.ts`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.2, 10.3, 10.5_

- [x] 5.1 Write property test for time accumulation
  - **Property 9: Time accumulation for playing animations**
  - **Validates: Requirements 4.1, 4.4, 6.4**

- [x] 5.2 Write property test for paused animations
  - **Property 10: Paused animations do not accumulate time**
  - **Validates: Requirements 4.5**

- [x] 5.3 Write property test for frame advancement
  - **Property 11: Frame advancement with time accumulation**
  - **Validates: Requirements 4.2, 4.3**

- [x] 5.4 Write property test for animation speed
  - **Property 12: Animation speed affects frame rate**
  - **Validates: Requirements 6.2, 6.3**

- [x] 6. Implement loop mode behaviors in SpriteAnimationSystem
  - Implement 'none' mode: stop at final frame, set state to stopped
  - Implement 'loop' mode: wrap frame index to 0 when exceeding last frame
  - Implement 'ping-pong' mode: reverse direction at frame 0 and last frame
  - Apply direction multiplier to frame advancement (1 or -1)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6.1 Write property test for loop mode wrapping
  - **Property 13: Loop mode wraps to frame zero**
  - **Validates: Requirements 5.2**

- [x] 6.2 Write property test for none mode stopping
  - **Property 14: None mode stops at final frame**
  - **Validates: Requirements 5.1, 5.5**

- [x] 6.3 Write property test for ping-pong reversal
  - **Property 15: Ping-pong reverses direction at boundaries**
  - **Validates: Requirements 5.3, 5.4**

- [x] 7. Implement animation event callbacks
  - Invoke onLoop callback when wrapping in loop mode
  - Invoke onComplete callback when stopping in none mode
  - Invoke onFrame callback when frame index changes
  - Collect callbacks during frame advancement, invoke after entity processing
  - Wrap callback invocations in try-catch, log errors and continue
  - Maintain callback registration order
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7.1 Write property test for onLoop callback
  - **Property 16: OnLoop callback fires on wrap**
  - **Validates: Requirements 7.1**

- [x] 7.2 Write property test for onComplete callback
  - **Property 17: OnComplete callback fires on completion**
  - **Validates: Requirements 7.2**

- [x] 7.3 Write property test for onFrame callback
  - **Property 18: OnFrame callback fires on frame change**

  - **Validates: Requirements 7.3**

- [x] 7.4 Write property test for callback ordering
  - **Property 19: Multiple callbacks execute in order**

  - **Validates: Requirements 7.4**

- [x] 7.5 Write property test for callback error isolation
  - **Property 20: Callback errors are isolated**
  - **Validates: Requirements 7.5**

- [x] 8. Checkpoint - Ensure core animation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement rendering integration
  - Add getCurrentFrame method to AnimationController that returns TextureRegion
  - Retrieve current frame from clip using frameIndex
  - Handle invalid clip or frame references gracefully (log error, return undefined)
  - Create helper function to convert animation component to SpriteDrawOptions
  - Apply flipX, flipY, and rotation to draw options
  - _Requirements: 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9.1 Write property test for flip transforms
  - **Property 21: Flip transforms affect rendering**
  - **Validates: Requirements 8.1, 8.2, 9.3**

- [x] 9.2 Write property test for current frame texture region
  - **Property 22: Current frame provides texture region**
  - **Validates: Requirements 9.1**

- [x] 9.3 Write property test for invalid reference handling
  - **Property 23: Invalid clip references are handled gracefully**
  - **Validates: Requirements 9.4**

- [x] 10. Implement per-frame duration support
  - Modify AnimationClip to support optional per-frame duration array
  - Update frame advancement logic to use per-frame duration if available
  - Fall back to default duration if per-frame not specified
  - Validate per-frame duration array length matches frame count
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 10.1 Write property test for per-frame durations
  - **Property 24: Per-frame durations are used correctly**
  - **Validates: Requirements 10.2**

- [x] 10.2 Write property test for default duration fallback
  - **Property 25: Default duration fallback**
  - **Validates: Requirements 10.3**

- [x] 10.3 Write property test for variable duration advancement
  - **Property 26: Variable duration frame advancement**
  - **Validates: Requirements 10.5**

- [x] 11. Implement animation transitions
  - Add transition field to SpriteAnimationData component
  - Implement transitionTo method in AnimationController
  - Update SpriteAnimationSystem to handle active transitions
  - Accumulate transition elapsed time during updates
  - Complete transition when elapsed >= duration: switch clip, reset frame
  - Cancel current transition when new transition requested
  - Invoke onTransitionComplete callback when transition finishes
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 11.1 Write property test for transition completion
  - **Property 27: Transition completion switches clips**
  - **Validates: Requirements 11.3**

- [x] 11.2 Write property test for transition interruption
  - **Property 28: Transition interruption**
  - **Validates: Requirements 11.4**

- [x] 12. Implement development tools integration
  - Add step method to AnimationController for manual frame stepping
  - Create animation debug panel component for DevOverlay
  - Display current clip, frame, state, elapsed time for selected entity
  - Add playback control buttons (play, pause, stop, step forward, step back)
  - Update debug display in real-time during playback
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 12.1 Write property test for manual frame stepping
  - **Property 29: Manual frame stepping**
  - **Validates: Requirements 12.4**

- [x] 13. Create example scene demonstrating sprite animations
  - Create example scene in `packages/engine/src/demo/SpriteAnimationDemo.ts`
  - Load texture atlas with multiple animation frames
  - Register animation clips (idle, walk, run, jump)
  - Create entities with SpriteAnimation components
  - Demonstrate playback controls, loop modes, and transitions
  - Show flip and rotation transforms
  - Include event callback examples
  - _Requirements: All_

- [x] 13.1 Write integration test for animation system with ECS
  - Test animation system with world, entities, and components
  - Verify multiple animated entities work independently
  - Test animation lifecycle with entity creation and destruction
  - _Requirements: 2.3, 2.4_

- [x] 14. Update engine exports and documentation
  - Export all animation types from `packages/engine/src/animation/sprite/index.ts`
  - Re-export from `packages/engine/src/animation/index.ts`
  - Add JSDoc comments to all public APIs
  - Update engine README with animation system overview
  - _Requirements: All_

- [x] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
