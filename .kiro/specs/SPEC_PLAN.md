# Spec-Driven Development Plan

This document provides a comprehensive list of specs needed to complete the engine and showcase games. Each spec includes a suggested prompt for creating requirements, design, and implementation tasks using the spec-driven workflow.

## Status Overview

**Completed Milestones:**

- M0: Foundations ✅
- M1: Core Engine MVP ✅
- M2: Rendering & Performance ✅
- M3: Polishing & Plugins ✅

**In Progress:**

- M7: Documentation & Release (partial)

**Remaining:**

- M4: Super Snake (partial - core implemented, needs polish)
- M5: Advanced Tetris (placeholder only)
- M6: Flappy-like (placeholder only)
- Engine gaps and enhancements

---

## Implementation Sequence

The specs are organized by priority and dependencies. Follow this sequence for optimal development flow:

### Phase 1: Engine Completion (Critical Gaps)

1. Game Loop & Time Management
2. Sprite Frame Animation
3. Text Rendering System
4. Advanced Audio Features

### Phase 2: Super Snake Polish

5. Super Snake Replay System
6. Super Snake Visual Polish
7. Super Snake Audio Integration
8. Super Snake Accessibility

### Phase 3: Tetris Implementation

9. Tetris Core Game Logic
10. Tetris SRS Rotation System
11. Tetris Scoring & Progression
12. Tetris UI & Menus
13. Tetris Audio & Polish

### Phase 4: Flappy Implementation

14. Flappy Core Physics
15. Flappy Procedural Generation
16. Flappy UI & Progression
17. Flappy Audio & Polish

### Phase 5: Documentation & Release

18. API Documentation
19. Tutorial Content
20. Example Projects
21. Release Preparation

---

## Engine Specs

### 1. Game Loop & Time Management

**Priority**: Critical  
**Dependencies**: None  
**Status**: Partially implemented (needs formalization)

**Scope**: Implement a fixed timestep game loop with interpolation, time scaling, pause/resume, and frame-independent timing. This is foundational for deterministic gameplay and replay systems.

**Suggested Prompt**:

```
Create a spec for a game loop and time management system for a 2D web game engine. The system should provide:
- Fixed timestep simulation (60 Hz) with variable display rate
- Frame interpolation for smooth rendering
- Time scaling for slow-motion effects
- Pause/resume functionality
- Delta time management
- Frame rate limiting and vsync support

Requirements should follow EARS patterns and include correctness properties for:
- Deterministic simulation at fixed timestep
- Accurate time accumulation
- Proper interpolation between frames
- Time scale effects on all systems

Reference: ENG-ECS-002 (system scheduling), requirements/engine/architecture.md (Game Loop section)
```

---

### 2. Sprite Frame Animation

**Priority**: High  
**Dependencies**: Asset Manager (completed)  
**Status**: Not implemented

**Scope**: Implement sprite sheet frame animation with play/pause/loop controls, animation events, and integration with the ECS system.

**Suggested Prompt**:

```
Create a spec for a sprite frame animation system in an ECS-based 2D game engine. The system should support:
- Frame-based animations from sprite sheets/atlases
- Play, pause, stop, loop, and reverse controls
- Animation speed control (FPS or duration-based)
- Animation events (onComplete, onLoop, onFrame)
- Flip and rotation transforms
- Animation blending/transitions
- Integration with texture atlas system

Requirements should include:
- Component for animation state (current frame, time, playing status)
- System for updating animations based on delta time
- API for controlling animations from game code

Correctness properties should verify:
- Frame progression matches specified timing
- Loop behavior works correctly
- Events fire at appropriate times
- Time scaling affects animation speed

Reference: ENG-ANM-001, requirements/engine/functional-requirements.md
```

---

### 3. Text Rendering System

**Priority**: High  
**Dependencies**: Renderer (completed)  
**Status**: Not implemented

**Scope**: Implement text rendering with bitmap fonts and dynamic text layout, including wrapping, alignment, and styling.

**Suggested Prompt**:

```
Create a spec for a text rendering system for a 2D game engine with Canvas 2D and WebGL2 backends. The system should support:
- Bitmap font rendering from font atlases
- Dynamic text with wrapping, alignment (left/center/right), and vertical alignment
- Text styling: color, drop shadow, stroke/outline
- Multi-line text with line height control
- Efficient batching with sprite rendering
- Measurement and bounds calculation

Requirements should cover:
- Loading and parsing bitmap font formats (BMFont, AngelCode)
- Text layout algorithm for wrapping and alignment
- Rendering integration with existing sprite batching
- API for creating and updating text entities

Correctness properties should verify:
- Text wrapping at correct boundaries
- Alignment produces expected positions
- Character spacing and kerning work correctly
- Bounds calculation matches rendered output

Reference: ENG-UI-002, requirements/engine/functional-requirements.md
```

---

### 4. Advanced Audio Features

**Priority**: Medium  
**Dependencies**: Audio Engine (completed)  
**Status**: Basic audio implemented, needs advanced features

**Scope**: Add 2D spatialization, filters, music cross-fading, and ducking to the existing audio engine.

**Suggested Prompt**:

```
Create a spec to enhance the existing audio engine with advanced features:
- 2D spatial audio (panning based on position relative to camera)
- Audio filters (lowpass, highpass, reverb)
- Music cross-fading with configurable duration
- Automatic ducking (reduce music volume when SFX plays)
- Loop points for seamless music loops
- Audio groups for batch control

The existing AudioEngine already supports:
- WebAudio context management
- Audio busses (master, music, sfx)
- Basic playback with volume control
- Audio clip caching

Requirements should focus on:
- Extending the bus system with filters
- Adding spatial audio calculations
- Implementing cross-fade manager
- Ducking automation

Correctness properties should verify:
- Panning reflects camera position correctly
- Cross-fades complete smoothly
- Ducking restores volume properly
- Filters apply without artifacts

Reference: ENG-AUD-002, ENG-AUD-003, packages/engine/src/audio/AudioEngine.ts
```

---

## Super Snake Specs

### 5. Super Snake Replay System

**Priority**: High  
**Dependencies**: Game Loop (Spec #1)  
**Status**: Partial (recording exists, needs playback)

**Scope**: Implement deterministic replay recording and playback for Super Snake, with UI for viewing replays from leaderboard.

**Suggested Prompt**:

```
Create a spec for a replay system for Super Snake that enables deterministic recording and playback. The game already records input events during gameplay.

The system should provide:
- Deterministic replay playback from recorded input events
- Replay validation (verify playback matches original)
- UI for viewing replays from leaderboard entries
- Replay controls (play, pause, speed control, scrubbing)
- Replay metadata (duration, score, mode)

Requirements should cover:
- Replay playback engine that feeds recorded inputs
- Determinism verification (same inputs = same outcome)
- UI components for replay viewer
- Integration with existing leaderboard system

Correctness properties should verify:
- Replays produce identical game states
- Input timing is preserved accurately
- Playback controls work correctly
- Replay data serializes/deserializes correctly

Reference: SNA-UI-003, ENG-SAV-002, packages/games/super-snake/src/game/SuperSnakeScene.ts (replayEvents)
```

---

### 6. Super Snake Visual Polish

**Priority**: Medium  
**Dependencies**: Particle System (completed), Sprite Animation (Spec #2)  
**Status**: Basic rendering complete, needs polish

**Scope**: Add visual polish to Super Snake including particle effects, screen shake, smooth camera follow, and themed visual effects.

**Suggested Prompt**:

```
Create a spec for visual polish enhancements to Super Snake. The game currently has basic grid-based rendering.

Add the following visual features:
- Particle bursts on food consumption, collisions, and power-up collection
- Screen shake on big scores and collisions
- Smooth camera follow with zoom effects
- Snake movement interpolation for smooth animation
- Power-up visual effects (glow, trails)
- Themed visual effects per level (day/night, weather)
- Transition effects between game states

Requirements should cover:
- Integration with existing particle emitter system
- Camera shake implementation with decay
- Interpolation between grid positions
- Visual effect triggers from game events

Correctness properties should verify:
- Particles spawn at correct positions
- Camera shake doesn't affect game logic
- Interpolation maintains grid alignment
- Effects don't impact performance (60 FPS target)

Reference: SNA-PRS-001, SNA-PRS-002, SNA-PRS-003, packages/engine/src/particles/
```

---

### 7. Super Snake Audio Integration

**Priority**: Medium  
**Dependencies**: Advanced Audio (Spec #4)  
**Status**: Not implemented

**Scope**: Integrate reactive audio into Super Snake with music layers that intensify with combo, and SFX for all game events.

**Suggested Prompt**:

```
Create a spec for audio integration in Super Snake with reactive music and comprehensive sound effects.

The system should provide:
- Layered music that intensifies with combo multiplier
- SFX for: food consumption, power-up collection, collisions, level up, game over
- Audio ducking (reduce music during important SFX)
- Spatial audio for directional events
- Audio settings persistence (volume, mute)

Requirements should cover:
- Music layer system with dynamic mixing
- SFX triggering from game events
- Audio bus configuration (master, music, sfx)
- Settings UI integration

Correctness properties should verify:
- Music layers sync correctly
- SFX trigger at appropriate times
- Volume settings persist across sessions
- Audio doesn't cause performance issues

Reference: SNA-AUD-001, packages/games/super-snake/src/game/SuperSnakeScene.ts
```

---

### 8. Super Snake Accessibility

**Priority**: Low  
**Dependencies**: None  
**Status**: Basic input remapping exists

**Scope**: Add accessibility features including colorblind modes, reduced motion, and enhanced input options.

**Suggested Prompt**:

```
Create a spec for accessibility enhancements to Super Snake.

Add the following accessibility features:
- Colorblind-friendly palettes (deuteranopia, protanopia, tritanopia)
- Reduced motion mode (disable particles, shake, smooth animations)
- High contrast mode
- Configurable input sensitivity
- Visual indicators for audio cues
- Persistent accessibility settings

Requirements should cover:
- Color palette system with theme switching
- Motion reduction flags for visual effects
- Settings UI for accessibility options
- Settings persistence via storage system

Correctness properties should verify:
- Color palettes maintain sufficient contrast
- Reduced motion disables appropriate effects
- Settings persist correctly
- Game remains playable in all modes

Reference: ENF-A11Y-002, SNA-CTL-001
```

---

## Tetris Specs

### 9. Tetris Core Game Logic

**Priority**: High  
**Dependencies**: Game Loop (Spec #1)  
**Status**: Not implemented

**Scope**: Implement core Tetris gameplay including piece generation, movement, rotation, locking, and line clearing.

**Suggested Prompt**:

```
Create a spec for the core game logic of Advanced Tetris following modern Tetris guidelines.

The system should implement:
- 7-bag randomizer for piece generation
- Piece movement (left, right, down, hard drop, soft drop)
- Hold piece functionality
- Next piece queue (minimum 5 pieces visible)
- Lock delay with reset on movement/rotation
- Line clearing with gravity
- Playfield (10 wide × 20 visible + 20 buffer)
- Game over detection

Requirements should cover:
- ECS components for game state (playfield, current piece, hold, queue)
- Systems for piece movement, locking, and line clearing
- Deterministic piece generation
- Input handling with DAS/ARR (Delayed Auto Shift / Auto Repeat Rate)

Correctness properties should verify:
- 7-bag randomizer produces correct distribution
- Pieces lock after delay expires
- Line clearing removes correct rows
- Game over triggers appropriately
- Hold piece swaps correctly (once per piece)

Reference: TET-FUN-001, TET-FUN-002, requirements/showcase/tetris-advanced.md
```

---

### 10. Tetris SRS Rotation System

**Priority**: Critical  
**Dependencies**: Tetris Core (Spec #9)  
**Status**: Not implemented

**Scope**: Implement the Super Rotation System (SRS) with wall kicks and floor kicks, including T-spin detection.

**Suggested Prompt**:

```
Create a spec for the Super Rotation System (SRS) in Tetris, including wall kicks, floor kicks, and T-spin detection.

The system should implement:
- SRS rotation states (0, R, 2, L) for all pieces
- Wall kick tables for all pieces (I-piece has special table)
- Floor kick behavior
- T-spin detection (proper, mini)
- Rotation validation and collision checking

Requirements should cover:
- Rotation state machine for each piece type
- Wall kick offset tables
- Collision detection during rotation
- T-spin detection algorithm
- Test suite for SRS compliance

Correctness properties should verify:
- Rotations follow SRS specification exactly
- Wall kicks try offsets in correct order
- T-spins detect correctly (3-corner rule)
- All standard SRS test cases pass
- Rotation is deterministic

Reference: TET-FUN-002, TET-FUN-003, requirements/showcase/tetris-advanced.md

Note: Include comprehensive test cases from Tetris guideline documentation to verify SRS compliance.
```

---

### 11. Tetris Scoring & Progression

**Priority**: High  
**Dependencies**: Tetris Core (Spec #9), SRS (Spec #10)  
**Status**: Not implemented

**Scope**: Implement scoring system with combos, back-to-back bonuses, T-spins, and level progression with gravity scaling.

**Suggested Prompt**:

```
Create a spec for the scoring and progression system in Advanced Tetris.

The system should implement:
- Standard Tetris scoring (single, double, triple, Tetris)
- T-spin scoring (T-spin single, double, triple)
- Back-to-back bonus for difficult clears
- Combo system for consecutive line clears
- Level progression based on lines cleared
- Gravity scaling per level
- Marathon and Sprint game modes

Requirements should cover:
- Scoring calculation for all clear types
- Back-to-back tracking and bonus application
- Combo counter and multiplier
- Level progression formula
- Gravity curve (frames per cell)
- Mode-specific rules (Marathon: endless, Sprint: 40 lines)

Correctness properties should verify:
- Scoring matches official Tetris guidelines
- Back-to-back bonus applies correctly
- Combo multiplier calculates accurately
- Level progression is deterministic
- Gravity scaling follows curve

Reference: TET-FUN-003, TET-FUN-004, requirements/showcase/tetris-advanced.md
```

---

### 12. Tetris UI & Menus

**Priority**: Medium  
**Dependencies**: Text Rendering (Spec #3), Tetris Core (Spec #9)  
**Status**: Not implemented

**Scope**: Implement complete UI for Tetris including menus, HUD, ghost piece, and settings.

**Suggested Prompt**:

```
Create a spec for the user interface and menu system for Advanced Tetris.

The system should provide:
- Main menu (Marathon, Sprint, Settings, Leaderboard)
- In-game HUD (score, level, lines, next pieces, hold piece)
- Ghost piece (preview of landing position)
- Pause menu
- Game over screen with score submission
- Settings menu (controls, audio, video, DAS/ARR)
- Leaderboard display (Marathon high scores, Sprint best times)

Requirements should cover:
- UI layout and anchoring
- Ghost piece rendering (semi-transparent)
- HUD updates from game state
- Menu navigation with keyboard/gamepad
- Settings persistence

Correctness properties should verify:
- Ghost piece shows correct landing position
- HUD displays accurate game state
- Menu navigation works with all input devices
- Settings save and load correctly

Reference: TET-UI-001, TET-UI-002, TET-PRS-001, requirements/showcase/tetris-advanced.md
```

---

### 13. Tetris Audio & Polish

**Priority**: Low  
**Dependencies**: Advanced Audio (Spec #4), Tetris Core (Spec #9)  
**Status**: Not implemented

**Scope**: Add audio and visual polish to Tetris including music, SFX, particles, and screen effects.

**Suggested Prompt**:

```
Create a spec for audio and visual polish in Advanced Tetris.

The system should provide:
- Background music with tempo increase at high levels
- SFX for: piece movement, rotation, lock, line clear, Tetris, T-spin, level up, game over
- Particle effects for line clears (more particles for Tetris/T-spin)
- Screen shake for big clears
- Smooth piece movement animation
- Line clear animation with delay
- Visual feedback for back-to-back and combos

Requirements should cover:
- Music system with tempo scaling
- SFX triggering from game events
- Particle integration for line clears
- Animation timing for line clear delay
- Visual effect intensity based on clear type

Correctness properties should verify:
- Music tempo scales correctly with level
- SFX trigger at appropriate times
- Particles don't impact performance (60 FPS)
- Line clear animation timing is consistent
- Visual effects enhance gameplay without distraction

Reference: TET-AUD-001, TET-PRS-002, requirements/showcase/tetris-advanced.md
```

---

## Flappy Specs

### 14. Flappy Core Physics

**Priority**: High  
**Dependencies**: Game Loop (Spec #1), Physics (completed)  
**Status**: Not implemented

**Scope**: Implement physics for Flappy-like game including gravity, flap mechanics, and collision detection.

**Suggested Prompt**:

```
Create a spec for the core physics system for a Flappy Bird-like game.

The system should implement:
- Gravity-based falling with acceleration
- Flap mechanic (upward impulse on input)
- Velocity and position integration
- Rotation based on velocity (tilt up when rising, down when falling)
- Collision detection with pipes and ground
- Physics tuning parameters (gravity, flap strength, terminal velocity)

Requirements should cover:
- ECS components for physics state (position, velocity, rotation)
- Physics system for integration and collision
- Input handling for flap action
- Tunable physics parameters for feel
- Collision with circular hitbox

Correctness properties should verify:
- Physics integration is frame-rate independent
- Flap impulse is consistent
- Collision detection is accurate
- Terminal velocity is enforced
- Rotation reflects velocity correctly

Reference: FLP-FUN-001, requirements/showcase/flappy-bird-like.md
```

---

### 15. Flappy Procedural Generation

**Priority**: High  
**Dependencies**: Flappy Physics (Spec #14)  
**Status**: Not implemented

**Scope**: Implement procedural obstacle generation with adjustable difficulty, patterns, and daily seed mode.

**Suggested Prompt**:

```
Create a spec for procedural obstacle generation in a Flappy Bird-like game.

The system should provide:
- Procedural pipe generation with configurable gaps
- Difficulty progression (gap size, spacing, speed)
- Pattern system (straight, wave, alternating)
- Daily seed mode (same obstacles each day)
- Collectible spawning between pipes
- Obstacle recycling for performance

Requirements should cover:
- Procedural generation algorithm with seed support
- Difficulty curve based on score/distance
- Pattern templates for variety
- Collectible placement rules
- Object pooling for obstacles

Correctness properties should verify:
- Same seed produces identical obstacles
- Gaps are always passable
- Difficulty progression is smooth
- Collectibles spawn in reachable positions
- Generation is deterministic

Reference: FLP-FUN-002, requirements/showcase/flappy-bird-like.md
```

---

### 16. Flappy UI & Progression

**Priority**: Medium  
**Dependencies**: Text Rendering (Spec #3), Flappy Core (Spec #14)  
**Status**: Not implemented

**Scope**: Implement UI, menus, scoring, and progression systems for Flappy-like game.

**Suggested Prompt**:

```
Create a spec for the UI and progression system for a Flappy Bird-like game.

The system should provide:
- Main menu (Play, Daily Challenge, Endless, Cosmetics, Settings)
- In-game HUD (score, high score, collectibles)
- Game over screen with score and medals
- Leaderboard (daily, endless, all-time)
- Cosmetics system (unlockable skins for bird and pipes)
- Settings menu (controls, audio, video, accessibility)
- Quick restart (< 500ms from game over to playing)

Requirements should cover:
- UI layout and state management
- Score calculation and display
- Medal/achievement system
- Cosmetics unlock conditions
- Settings persistence
- Fast restart implementation

Correctness properties should verify:
- Score increments correctly
- Medals award at correct thresholds
- Cosmetics unlock properly
- Settings persist across sessions
- Restart time meets performance target

Reference: FLP-UI-001, FLP-UI-002, FLP-PERF-001, requirements/showcase/flappy-bird-like.md
```

---

### 17. Flappy Audio & Polish

**Priority**: Low  
**Dependencies**: Advanced Audio (Spec #4), Sprite Animation (Spec #2)  
**Status**: Not implemented

**Scope**: Add audio, visual effects, and polish to Flappy-like game.

**Suggested Prompt**:

```
Create a spec for audio and visual polish in a Flappy Bird-like game.

The system should provide:
- Adaptive music with layers that add based on score
- SFX for: flap, score, collect, collision, medal earned
- Combo chimes for consecutive collectibles
- Parallax scrolling backgrounds (3+ layers)
- Dynamic time-of-day (dawn, day, dusk, night)
- Particle trails behind bird
- Screen shake on collision
- Chromatic aberration post-effect (optional, toggleable)
- Wing flap animation
- Smooth camera follow

Requirements should cover:
- Music layer system
- SFX triggering from game events
- Parallax implementation with different scroll speeds
- Time-of-day color grading
- Particle system integration
- Post-processing effects
- Animation system for bird

Correctness properties should verify:
- Music layers sync correctly
- Parallax creates depth perception
- Time-of-day transitions smoothly
- Particles don't impact performance (60 FPS)
- Post-effects are toggleable
- Animations loop seamlessly

Reference: FLP-AUD-001, FLP-PRS-001, FLP-PRS-002, requirements/showcase/flappy-bird-like.md
```

---

## Documentation Specs

### 18. API Documentation

**Priority**: High  
**Dependencies**: None  
**Status**: Partial (API reference generated, needs examples)

**Scope**: Complete API documentation with examples, guides, and best practices.

**Suggested Prompt**:

```
Create a spec for comprehensive API documentation for the web game engine.

The documentation should include:
- Complete API reference for all public interfaces
- Code examples for common use cases
- Best practices and patterns
- Migration guides for breaking changes
- Architecture overview
- Performance guidelines
- Troubleshooting guide

Requirements should cover:
- Documentation generation from TypeScript
- Example code that compiles and runs
- Documentation structure and navigation
- Search functionality
- Version-specific docs

Correctness properties should verify:
- All public APIs are documented
- Examples compile without errors
- Code snippets are up-to-date
- Links are valid
- Documentation matches implementation

Reference: ENG-DOC-001, requirements/engine/documentation-requirements.md
```

---

### 19. Tutorial Content

**Priority**: Medium  
**Dependencies**: API Documentation (Spec #18)  
**Status**: Not implemented

**Scope**: Create step-by-step tutorials for common game development tasks.

**Suggested Prompt**:

```
Create a spec for tutorial content that teaches developers how to use the game engine.

The tutorials should cover:
- Getting started (Hello World)
- Creating a simple game (Pong or Breakout)
- Working with sprites and animations
- Handling input and controls
- Playing audio and music
- Using the particle system
- Implementing UI and menus
- Saving and loading game state
- Creating a plugin

Requirements should cover:
- Tutorial structure and progression
- Code samples for each step
- Visual aids and diagrams
- Common pitfalls and solutions
- Progressive complexity

Correctness properties should verify:
- Tutorials build on each other logically
- Code samples work as written
- Concepts are explained clearly
- Tutorials cover essential features

Reference: ENG-DOC-001, requirements/engine/documentation-requirements.md
```

---

### 20. Example Projects

**Priority**: Medium  
**Dependencies**: API Documentation (Spec #18)  
**Status**: Not implemented

**Scope**: Create example projects demonstrating engine features and patterns.

**Suggested Prompt**:

```
Create a spec for example projects that demonstrate engine capabilities.

The examples should include:
- Minimal starter template
- Sprite rendering demo
- Animation showcase
- Particle effects gallery
- Physics playground
- Audio demo
- UI component examples
- Plugin example (already exists, needs documentation)
- Complete mini-game (e.g., Space Invaders clone)

Requirements should cover:
- Project structure and organization
- README for each example
- Inline code comments
- Runnable via npm scripts
- Deployable to GitHub Pages

Correctness properties should verify:
- Examples run without errors
- Code follows best practices
- Examples demonstrate intended features
- READMEs are clear and complete

Reference: ENG-DOC-002, requirements/engine/documentation-requirements.md
```

---

### 21. Release Preparation

**Priority**: High  
**Dependencies**: All other specs  
**Status**: Not started

**Scope**: Prepare engine for initial release including versioning, changelog, and publishing workflow.

**Suggested Prompt**:

```
Create a spec for preparing the game engine for its initial public release.

The release preparation should include:
- Semantic versioning setup
- Changelog generation
- npm publishing workflow
- GitHub release automation
- License verification
- Security audit
- Performance benchmarking
- Browser compatibility testing
- Bundle size optimization
- Documentation deployment

Requirements should cover:
- Version numbering scheme
- Changelog format and automation
- CI/CD for publishing
- Pre-release checklist
- Post-release monitoring

Correctness properties should verify:
- Version numbers follow SemVer
- Changelog is accurate and complete
- Published package works correctly
- All tests pass before release
- Documentation is up-to-date

Reference: ENF-DX-002, requirements/roadmap-and-milestones.md (M7)
```

---

## Summary

**Total Specs**: 21

**By Category**:

- Engine: 4 specs
- Super Snake: 4 specs
- Tetris: 5 specs
- Flappy: 4 specs
- Documentation: 4 specs

**By Priority**:

- Critical: 2 specs
- High: 10 specs
- Medium: 7 specs
- Low: 2 specs

**Estimated Timeline**:

- Phase 1 (Engine): 2-3 weeks
- Phase 2 (Super Snake): 1-2 weeks
- Phase 3 (Tetris): 3-4 weeks
- Phase 4 (Flappy): 2-3 weeks
- Phase 5 (Documentation): 1-2 weeks

**Total**: 9-14 weeks to complete all specs

---

## Usage Instructions

1. **Select a spec** from the list based on priority and dependencies
2. **Copy the suggested prompt** for that spec
3. **Start a new conversation** with the spec agent
4. **Paste the prompt** to begin the spec-driven workflow
5. **Follow the workflow** through requirements → design → tasks
6. **Execute tasks** incrementally using the task list
7. **Mark the spec as complete** when all tasks are done

## Notes

- Some specs have dependencies that should be completed first
- Specs can be worked on in parallel if dependencies allow
- Each spec follows the full spec-driven workflow (requirements, design, tasks)
- Property-based testing should be included for all core logic
- Integration tests should verify specs work together correctly
