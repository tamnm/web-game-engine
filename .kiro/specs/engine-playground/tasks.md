# Implementation Plan

- [x] 1. Set up playground package structure
  - Create `packages/playground/` directory
  - Create `package.json` with dependencies (@web-game-engine/core, vite, typescript)
  - Create `tsconfig.json` extending workspace base config
  - Create `vite.config.ts` with dev server configuration
  - Add playground to workspace in root `package.json`
  - _Requirements: 9.1, 10.1, 10.2, 10.3_

- [x] 2. Create HTML structure and basic styling
  - Create `index.html` with canvas element and demo selector container
  - Create `src/ui/styles.css` with flexbox layout (sidebar + canvas)
  - Add loading indicator element
  - Add meta tags for viewport and charset
  - Link stylesheet and main.ts module script
  - _Requirements: 1.1, 9.2_

- [x] 3. Implement procedural graphics utilities
  - Create `src/utils/graphics.ts`
  - Implement `createColorTexture(color, size)` function
  - Implement `createGradientTexture(color1, color2, size)` function
  - Implement `createCircleTexture(color, size)` function
  - Implement `createAnimationFrames(baseColor, frameCount)` function
  - Add JSDoc comments explaining each utility
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 8.1, 8.2_

- [x] 4. Implement BaseDemo abstract class
  - Create `src/demos/BaseDemo.ts`
  - Define Demo interface with init, cleanup, update, render methods
  - Implement BaseDemo with canvas, world, renderer, gameLoop properties
  - Implement default cleanup method (stop loop, dispose world/renderer)
  - Implement default update and render methods
  - Add JSDoc comments explaining the base class purpose
  - _Requirements: 1.3, 8.1, 8.3_

- [x] 5. Implement DemoSelector UI component
  - Create `src/ui/DemoSelector.ts`
  - Implement renderDemoList method that creates DOM elements for each demo
  - Add click handlers for demo selection
  - Highlight currently active demo
  - Display demo name and description
  - Add CSS classes for styling
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 6. Implement PlaygroundApp core class
  - Create `src/PlaygroundApp.ts`
  - Define DemoMetadata interface
  - Implement demo registry (Map<string, DemoMetadata>)
  - Implement registerDemo method with validation
  - Implement loadDemo method with cleanup and error handling
  - Implement unloadCurrentDemo method with try-catch
  - Implement toggleDevTools method
  - Implement renderDemoSelector method using DemoSelector component
  - Add loading state management (showLoading, hideLoading)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.4_

- [x] 7. Implement demo scaffolding
  - Create `src/demos/PhysicsDemo.ts` extending BaseDemo with placeholder
  - Create `src/demos/ParticlesDemo.ts` extending BaseDemo with placeholder
  - Create `src/demos/InputDemo.ts` extending BaseDemo with placeholder
  - Create `src/demos/AnimationDemo.ts` extending BaseDemo with placeholder
  - Export all demos from `src/demos/index.ts`
  - _Requirements: 2.1, 3.1, 4.1, 5.1_

- [x] 8. Implement main entry point
  - Create `src/main.ts`
  - Import PlaygroundApp and all demo classes
  - Get canvas element from DOM
  - Create PlaygroundApp instance
  - Register AnimationDemo, PhysicsDemo, ParticlesDemo, InputDemo
  - Call renderDemoSelector to display UI
  - Load default demo (AnimationDemo)
  - Set up keyboard shortcut for dev tools toggle (F12 or backtick)
  - Add comments explaining initialization flow
  - _Requirements: 1.4, 7.1, 7.4, 8.1, 8.2, 9.1_

- [x] 9. Create comprehensive README documentation
  - Create `packages/playground/README.md`
  - Add overview of playground purpose and features
  - Document how to run the playground (`npm run dev`)
  - List all available demos with descriptions
  - Explain how to use playground as a project template
  - Document keyboard shortcuts (dev tools toggle)
  - Add section on adding new demos
  - Include code examples for common tasks
  - _Requirements: 8.5, 10.4_

- [x] 10. Implement AnimationDemo with engine integration
  - Import World, Renderer, GameLoop from @web-game-engine/core
  - Import SpriteAnimationDemo or animation components from engine
  - Create world with animation system
  - Create animated sprite entities with different loop modes
  - Demonstrate speed control, flip, and rotation
  - Enable AnimationDebugPanel if available
  - Add comments explaining animation setup
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.3, 8.2, 8.3_

- [x] 11. Implement PhysicsDemo with engine integration
  - Import World, Renderer, GameLoop from @web-game-engine/core
  - Import physics/collision components from engine
  - Create world with physics and collision systems
  - Create entities with different collision shapes (circle, rectangle)
  - Add visual rendering for collision shapes using procedural graphics
  - Implement interactive object spawning on mouse click
  - Add visual feedback for collisions (color change or highlight)
  - Add comments explaining physics setup and collision detection
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.4, 8.2, 8.3_

- [x] 12. Implement ParticlesDemo with engine integration
  - Import World, Renderer, GameLoop from @web-game-engine/core
  - Import Emitter and particle components from engine
  - Create world with particle system
  - Create multiple particle emitters with different configurations
  - Use procedural circle textures for particles
  - Implement burst and continuous emitter modes
  - Add interactive triggering on mouse click
  - Display particle count and FPS using dev tools
  - Add comments explaining particle system configuration
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.4, 8.2, 8.3_

- [x] 13. Implement InputDemo with engine integration
  - Import World, Renderer, GameLoop, InputManager from @web-game-engine/core
  - Create world with input system
  - Create visual feedback entities for keyboard (show pressed keys)
  - Create visual feedback for mouse (position, button states)
  - Create visual feedback for gamepad (buttons, axes)
  - Display input event details in real-time using canvas text
  - Add comments explaining input handling setup
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.5, 8.2, 8.3_

- [x] 14. Integrate DevOverlay with all demos
  - Import DevOverlay from @web-game-engine/core
  - In PlaygroundApp.loadDemo, enable DevOverlay for all demos
  - Configure DevOverlay to show FPS, frame time, entity count
  - For AnimationDemo, enable AnimationDebugPanel
  - Ensure dev tools don't obstruct main demo view
  - Implement toggleDevTools method to show/hide overlay
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 15. Checkpoint - Ensure playground builds and runs with real demos
  - Ensure all tests pass, ask the user if questions arise.

- [ ]\* 16. Write integration tests for demo switching
  - Create test file `src/__tests__/playground.test.ts`
  - Test loading multiple demos in sequence
  - Verify cleanup is called when switching demos
  - Verify no memory leaks after multiple switches
  - Test error handling for invalid demo names
  - _Requirements: 1.2, 1.3_

- [ ]\* 16.1 Write property test for demo isolation
  - **Property 1: Demo isolation**
  - Generate random sequences of demo switches
  - Verify each demo starts with clean state
  - **Validates: Requirements 1.3**

- [ ]\* 16.2 Write property test for resource cleanup
  - **Property 2: Resource cleanup**
  - Load and unload demos multiple times
  - Verify entity count returns to zero after cleanup
  - **Validates: Requirements 1.3**

- [ ]\* 16.3 Write property test for demo selector visibility
  - **Property 3: Demo selector visibility**
  - Verify selector is always accessible
  - Test with different demo counts
  - **Validates: Requirements 1.1, 1.2**

- [ ]\* 16.4 Write property test for dev tools availability
  - **Property 4: Dev tools availability**
  - Verify dev tools enabled for all demos
  - Test keyboard shortcut toggle
  - **Validates: Requirements 7.1, 7.4**

- [ ]\* 17. Write performance tests
  - Create test file `src/__tests__/performance.test.ts`
  - Measure startup time from app creation to first demo display
  - Verify startup time < 5 seconds
  - Measure demo switch time
  - Verify demo switch time < 500ms
  - _Requirements: 9.4_

- [ ]\* 17.1 Write property test for startup performance
  - **Property 5: Startup performance**
  - Measure time from start to first demo display
  - Verify < 5 seconds
  - **Validates: Requirements 9.4**

- [ ]\* 17.2 Write property test for no external asset dependencies
  - **Property 6: No external asset dependencies**
  - Monitor network requests during demo loading
  - Verify no requests for image, audio, or font files
  - **Validates: Requirements 6.2, 6.3**

- [ ]\* 17.3 Write property test for code documentation coverage
  - **Property 7: Code documentation coverage**
  - Parse source files for API usage
  - Verify comments within 5 lines of API calls
  - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 18. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
