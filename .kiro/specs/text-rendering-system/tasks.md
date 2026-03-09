# Implementation Plan

- [x] 1. Set up text rendering subsystem structure and core interfaces
  - Create directory structure in `packages/engine/src/text/`
  - Define TypeScript interfaces for BitmapFont, CharacterData, and FontManager
  - Set up barrel exports in text subsystem index file
  - _Requirements: 1.1, 1.2, 2.1_

- [x] 2. Implement BMFont format parser and font loading
  - [x] 2.1 Create BMFont format parser for .fnt files
    - Write parser for text-based BMFont descriptor format
    - Extract font metrics, character data, and kerning pairs
    - Handle multiple texture page references
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Write property test for BMFont parsing
    - **Property 1: Font parsing completeness**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 2.3 Implement font asset loader integration
    - Register BMFont loader with AssetManager
    - Handle font atlas texture loading and validation
    - Implement font resource caching and reference counting
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 2.4 Write property test for font loading error handling
    - **Property 2: Font loading error handling**
    - **Validates: Requirements 1.3**

  - [x] 2.5 Write property test for font resource isolation
    - **Property 3: Font resource isolation**
    - **Validates: Requirements 1.4**

  - [x] 2.6 Write property test for font atlas validation
    - **Property 4: Font atlas validation**
    - **Validates: Requirements 1.5**

- [x] 3. Create text layout engine with wrapping and alignment
  - [x] 3.1 Implement core text layout algorithm
    - Write character positioning calculations with advance width and kerning
    - Implement word wrapping with word boundary detection
    - Handle manual line breaks and character-level wrapping
    - _Requirements: 3.1, 3.2, 3.5, 6.3_

  - [x] 3.2 Write property test for word boundary wrapping
    - **Property 8: Word boundary wrapping**
    - **Validates: Requirements 3.1**

  - [x] 3.3 Write property test for character boundary wrapping
    - **Property 9: Character boundary wrapping**
    - **Validates: Requirements 3.2**

  - [x] 3.4 Implement text alignment calculations
    - Add horizontal alignment (left, center, right) positioning
    - Add vertical alignment (top, middle, bottom) positioning
    - Calculate alignment offsets based on text bounds
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 3.5 Write property test for horizontal alignment positioning
    - **Property 13: Horizontal alignment positioning**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 3.6 Write property test for vertical alignment positioning
    - **Property 14: Vertical alignment positioning**
    - **Validates: Requirements 4.4, 4.5, 4.6**

  - [x] 3.7 Add spacing and line height controls
    - Implement custom line height spacing between lines
    - Add character spacing adjustments between all characters
    - Handle negative spacing values with bounds checking
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 3.8 Write property test for spacing application
    - **Property 20: Spacing application**
    - **Validates: Requirements 6.1, 6.2**

  - [x] 3.9 Write property test for kerning adjustment application
    - **Property 21: Kerning adjustment application**
    - **Validates: Requirements 6.3**

- [x] 4. Implement ECS components and text entity management
  - [x] 4.1 Create text-related ECS components
    - Define TextComponent with content, styling, and layout properties
    - Define TextLayoutComponent for caching layout calculations
    - Add Transform component integration for positioning
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 4.2 Build text entity creation and management API
    - Implement createTextEntity function with styling options
    - Add updateText and updateStyle functions for dynamic content
    - Create text measurement utilities for bounds calculation
    - _Requirements: 2.1, 2.2, 8.1, 8.2, 8.3_

  - [x] 4.3 Write property test for text content updates trigger layout recalculation
    - **Property 5: Text content updates trigger layout recalculation**
    - **Validates: Requirements 2.2**

  - [x] 4.4 Write property test for text entity independence
    - **Property 7: Text entity independence**
    - **Validates: Requirements 2.5**

  - [x] 4.5 Write property test for text bounds calculation accuracy
    - **Property 28: Text bounds calculation accuracy**
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 5. Checkpoint - Ensure core text layout tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create text rendering system with sprite integration
  - [x] 6.1 Implement text-to-sprite conversion
    - Convert character layout data to sprite draw calls
    - Generate TextureRegion objects for each character from font atlas
    - Handle character visibility and clipping
    - _Requirements: 7.1, 7.3_

  - [x] 6.2 Build text rendering system integration
    - Create text rendering system that processes TextComponent entities
    - Integrate with existing Renderer.drawSprite for character rendering
    - Implement batching optimization for same-font characters
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [x] 6.3 Write property test for sprite batch integration
    - **Property 24: Sprite batch integration**
    - **Validates: Requirements 7.1**

  - [x] 6.4 Write property test for font-based batching optimization
    - **Property 25: Font-based batching optimization**
    - **Validates: Requirements 7.2**

  - [x] 6.5 Write property test for texture grouping optimization
    - **Property 26: Texture grouping optimization**
    - **Validates: Requirements 7.3**

- [x] 7. Add text styling effects (color, shadow, outline)
  - [x] 7.1 Implement basic text coloring
    - Apply color tinting to character sprites using existing tint system
    - Handle alpha transparency in text color values
    - _Requirements: 5.1_

  - [x] 7.2 Add drop shadow effect rendering
    - Render shadow copy of text offset from main text
    - Implement shadow color and offset configuration
    - Ensure correct rendering order (shadow behind main text)
    - _Requirements: 5.2, 5.4_

  - [x] 7.3 Implement stroke outline effect
    - Render outline around characters using multiple offset passes
    - Add stroke color and width configuration
    - Maintain correct layering order with shadows and main text
    - _Requirements: 5.3, 5.4_

  - [x] 7.4 Write property test for text color application
    - **Property 15: Text color application**
    - **Validates: Requirements 5.1**

  - [x] 7.5 Write property test for drop shadow rendering
    - **Property 16: Drop shadow rendering**
    - **Validates: Requirements 5.2**

  - [x] 7.6 Write property test for stroke outline rendering
    - **Property 17: Stroke outline rendering**
    - **Validates: Requirements 5.3**

  - [x] 7.7 Write property test for style effect layering order
    - **Property 18: Style effect layering order**
    - **Validates: Requirements 5.4**

- [x] 8. Implement dynamic text updates and layout recalculation
  - [x] 8.1 Add layout invalidation and recalculation system
    - Implement dirty flag system for layout changes
    - Trigger layout recalculation on text or style updates
    - Optimize recalculation to only process changed entities
    - _Requirements: 2.2, 3.4, 5.5, 6.5_

  - [x] 8.2 Handle edge cases and error conditions
    - Implement graceful handling of empty text content
    - Add fallback character substitution for unsupported characters
    - Handle layout parameter validation and safe defaults
    - _Requirements: 2.3, 2.4_

  - [x] 8.3 Write property test for layout recalculation on width changes
    - **Property 11: Layout recalculation on width changes**
    - **Validates: Requirements 3.4**

  - [x] 8.4 Write property test for immediate style updates
    - **Property 19: Immediate style updates**
    - **Validates: Requirements 5.5**

  - [x] 8.5 Write property test for position recalculation on spacing changes
    - **Property 23: Position recalculation on spacing changes**
    - **Validates: Requirements 6.5**

  - [x] 8.6 Write property test for unsupported character handling
    - **Property 6: Unsupported character handling**
    - **Validates: Requirements 2.4**

- [x] 9. Add cross-backend rendering support (WebGL2 and Canvas 2D)
  - [x] 9.1 Ensure WebGL2 backend compatibility
    - Verify text rendering works with existing WebGL2 sprite batching
    - Test GPU-accelerated rendering performance with large text volumes
    - _Requirements: 9.1_

  - [x] 9.2 Implement Canvas 2D backend support
    - Ensure text renders correctly using Canvas 2D drawImage operations
    - Maintain visual consistency between WebGL2 and Canvas 2D outputs
    - Handle backend-specific feature limitations gracefully
    - _Requirements: 9.2, 9.3, 9.5_

  - [x] 9.3 Add backend fallback and detection
    - Implement automatic fallback when preferred backend unavailable
    - Maintain consistent API regardless of active backend
    - _Requirements: 9.4_

  - [x] 9.4 Write property test for cross-backend visual consistency
    - **Property 30: Cross-backend visual consistency**
    - **Validates: Requirements 9.3**

  - [x] 9.5 Write property test for backend feature adaptation
    - **Property 31: Backend feature adaptation**
    - **Validates: Requirements 9.5**

- [x] 10. Checkpoint - Ensure rendering and styling tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement text serialization and persistence
  - [x] 11.1 Add text component serialization support
    - Implement serialization for TextComponent and TextLayoutComponent
    - Handle font reference serialization and resolution
    - Ensure serialized data includes all necessary styling and layout properties
    - _Requirements: 10.1, 10.3_

  - [x] 11.2 Create deserialization and error handling
    - Implement robust deserialization with validation
    - Handle missing font references with fallback mechanisms
    - Add corruption detection and recovery for malformed data
    - _Requirements: 10.2, 10.4, 10.5_

  - [x] 11.3 Write property test for serialization round-trip preservation
    - **Property 32: Serialization round-trip preservation**
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [x] 11.4 Write property test for missing font graceful handling
    - **Property 33: Missing font graceful handling**
    - **Validates: Requirements 10.4**

  - [x] 11.5 Write property test for corrupted data validation
    - **Property 34: Corrupted data validation**
    - **Validates: Requirements 10.5**

- [x] 12. Add comprehensive wrapping and line break handling
  - [x] 12.1 Enhance wrapping algorithm completeness
    - Ensure single line rendering when wrapping is disabled
    - Preserve manual line breaks in combination with automatic wrapping
    - Handle negative spacing values with appropriate bounds checking
    - _Requirements: 3.3, 3.5, 6.4_

  - [x] 12.2 Write property test for single line rendering when wrapping disabled
    - **Property 10: Single line rendering when wrapping disabled**
    - **Validates: Requirements 3.3**

  - [x] 12.3 Write property test for manual line break preservation
    - **Property 12: Manual line break preservation**
    - **Validates: Requirements 3.5**

  - [x] 12.4 Write property test for negative spacing handling
    - **Property 22: Negative spacing handling**
    - **Validates: Requirements 6.4**

- [x] 13. Implement conditional rendering and optimization features
  - [x] 13.1 Add text visibility and conditional rendering
    - Implement text entity visibility toggle functionality
    - Ensure disabled text entities don't submit sprite data
    - Add bounds-based culling for off-screen text optimization
    - _Requirements: 7.5_

  - [x] 13.2 Create bounds update and measurement consistency
    - Ensure bounds calculations update when text content changes
    - Implement efficient bounds caching with invalidation
    - Handle empty text bounds as special case returning zero dimensions
    - _Requirements: 8.4, 8.5_

  - [x] 13.3 Write property test for conditional rendering behavior
    - **Property 27: Conditional rendering behavior**
    - **Validates: Requirements 7.5**

  - [x] 13.4 Write property test for bounds update consistency
    - **Property 29: Bounds update consistency**
    - **Validates: Requirements 8.5**

- [x] 14. Create comprehensive playground demo
  - [x] 14.1 Create TextRenderingDemo class extending BaseDemo
    - Implement demo class following existing playground demo patterns
    - Set up demo scene with multiple text examples showcasing different features
    - Add demo to DemoSelector for easy access
    - _Requirements: All requirements for demonstration_

  - [x] 14.2 Implement interactive text property controls
    - Create UI controls for font selection, text content editing
    - Add sliders for character spacing, line height, and text size
    - Include toggles for word wrapping, alignment options, and styling effects
    - Add color pickers for text color, shadow color, and stroke color
    - _Requirements: 2.1, 3.1-3.5, 4.1-4.6, 5.1-5.5, 6.1-6.5_

  - [x] 14.3 Add comprehensive text feature showcase
    - Display examples of different alignment combinations (left/center/right + top/middle/bottom)
    - Show text wrapping behavior with adjustable width boundaries
    - Demonstrate styling effects (drop shadows, stroke outlines, color variations)
    - Include multi-line text with custom line height and character spacing
    - _Requirements: 3.1-3.5, 4.1-4.6, 5.1-5.5, 6.1-6.5_

  - [x] 14.4 Create sample BMFont assets for demo
    - Include at least 2 different bitmap fonts with varying styles
    - Ensure fonts have kerning data for proper spacing demonstration
    - Add fonts to playground assets with proper loading configuration
    - _Requirements: 1.1, 1.2, 6.3_

  - [x] 14.5 Add performance and batching visualization
    - Display render statistics (draw calls, batches, sprites rendered)
    - Show text entity count and update performance metrics
    - Include stress test with many text entities to demonstrate batching efficiency
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 15. Add text system integration to engine exports
  - [ ] 15.1 Export text rendering APIs from engine
    - Add text system exports to main engine index file
    - Ensure all public APIs are properly exported and typed
    - Update engine package.json if needed for new dependencies
    - _Requirements: 2.1, integration requirements_

  - [ ] 15.2 Create text system usage documentation
    - Add text rendering examples to engine documentation
    - Include code samples for common text operations
    - Document BMFont asset preparation and loading
    - _Requirements: All requirements for documentation_

- [ ] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
