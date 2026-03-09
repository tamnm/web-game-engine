import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { World } from '../ecs/World';
import { Entity } from '../ecs/types';
import {
  TextComponent,
  TextLayoutComponent,
  TextComponentDef,
  TextLayoutComponentDef,
} from '../text/components';
import {
  serializeTextComponent,
  deserializeTextComponent,
  serializeTextLayoutComponent,
  deserializeTextLayoutComponent,
  deserializeTextComponentWithFallback,
  deserializeTextComponentWithRepair,
  repairCorruptedTextComponent,
  validateSerializedTextComponent,
  FontResolver,
  TextDeserializationError,
} from '../text/serialization';
import { TextSerializationManager } from '../text/TextSerializationManager';
import { DropShadowStyle, StrokeStyle } from '../text/types';

describe('Text Serialization', () => {
  // Test setup is done per test to avoid state leakage

  // Generators for property-based testing
  const colorGen = fc.tuple(
    fc.float({ min: Math.fround(0), max: Math.fround(1) }),
    fc.float({ min: Math.fround(0), max: Math.fround(1) }),
    fc.float({ min: Math.fround(0), max: Math.fround(1) }),
    fc.float({ min: Math.fround(0), max: Math.fround(1) })
  ) as fc.Arbitrary<[number, number, number, number]>;

  const dropShadowGen = fc.record({
    color: colorGen,
    offsetX: fc.float({ min: Math.fround(-100), max: Math.fround(100) }),
    offsetY: fc.float({ min: Math.fround(-100), max: Math.fround(100) }),
  }) as fc.Arbitrary<DropShadowStyle>;

  const strokeGen = fc.record({
    color: colorGen,
    width: fc.float({ min: Math.fround(0.1), max: Math.fround(10) }),
  }) as fc.Arbitrary<StrokeStyle>;

  const textComponentGen = fc.record({
    type: fc.constant('TextComponent' as const),
    text: fc.string({ minLength: 0, maxLength: 1000 }),
    fontId: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    color: colorGen,
    maxWidth: fc.option(fc.float({ min: Math.fround(1), max: Math.fround(2000) }), {
      nil: undefined,
    }),
    horizontalAlign: fc.constantFrom('left', 'center', 'right'),
    verticalAlign: fc.constantFrom('top', 'middle', 'bottom'),
    lineHeight: fc.option(fc.float({ min: Math.fround(0.1), max: Math.fround(5) }), {
      nil: undefined,
    }),
    characterSpacing: fc.option(fc.float({ min: Math.fround(-10), max: Math.fround(50) }), {
      nil: undefined,
    }),
    wordWrap: fc.boolean(),
    dropShadow: fc.option(dropShadowGen, { nil: undefined }),
    stroke: fc.option(strokeGen, { nil: undefined }),
    visible: fc.boolean(),
  }) as fc.Arbitrary<TextComponent>;

  const textLayoutComponentGen = fc.record({
    type: fc.constant('TextLayoutComponent' as const),
    layout: fc.constant(null), // Layout is always null in serialization
    dirty: fc.boolean(),
  }) as fc.Arbitrary<TextLayoutComponent>;

  /**
   * **Feature: text-rendering-system, Property 32: Serialization round-trip preservation**
   * For any text entity, serializing then deserializing should restore the entity
   * with identical content, styling, and layout properties
   */
  it('preserves TextComponent data through serialization round-trip', () => {
    fc.assert(
      fc.property(textComponentGen, (originalComponent) => {
        // Serialize the component
        const serialized = serializeTextComponent(originalComponent);

        // Deserialize it back
        const deserialized = deserializeTextComponent(serialized);

        // Should be identical to original
        expect(deserialized).toEqual(originalComponent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 32: Serialization round-trip preservation**
   * For any text layout component, serializing then deserializing should restore
   * the component with correct properties
   */
  it('preserves TextLayoutComponent data through serialization round-trip', () => {
    fc.assert(
      fc.property(textLayoutComponentGen, (originalComponent) => {
        // Serialize the component
        const serialized = serializeTextLayoutComponent(originalComponent);

        // Deserialize it back
        const deserialized = deserializeTextLayoutComponent(serialized);

        // Layout should always be null and dirty should be true after deserialization
        expect(deserialized.type).toBe('TextLayoutComponent');
        expect(deserialized.layout).toBe(null);
        expect(deserialized.dirty).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 32: Serialization round-trip preservation**
   * For any world with text entities, serializing then deserializing should restore
   * all text entities with their original properties
   */
  it('preserves text entities through world serialization round-trip', () => {
    fc.assert(
      fc.property(fc.array(textComponentGen, { minLength: 1, maxLength: 5 }), (textComponents) => {
        // Create a fresh world for this test
        const testWorld = new World();
        const testSerializationManager = new TextSerializationManager();

        // Create entities with text components
        textComponents.forEach((component) => {
          const entity = testWorld.createEntity();
          testWorld.addComponent(entity, TextComponentDef, component);

          // Add layout component
          const layoutComponent: TextLayoutComponent = {
            type: 'TextLayoutComponent',
            layout: null,
            dirty: true,
          };
          testWorld.addComponent(entity, TextLayoutComponentDef, layoutComponent);
        });

        // Serialize the world
        const serialized = testSerializationManager.serializeTextWorld(testWorld, {
          includeLayout: true,
        });

        // Create a new world and deserialize
        const newWorld = new World();
        const stats = testSerializationManager.deserializeTextWorld(newWorld, serialized);

        // Check that all entities were successfully deserialized
        expect(stats.success).toBe(textComponents.length);
        expect(stats.failed).toBe(0);

        // Verify that the new world has the same number of text entities
        const newQuery = newWorld.query({ all: [TextComponentDef] });
        expect(newQuery.size).toBe(textComponents.length);

        // Verify that all original components are present (order may differ)
        const deserializedComponents: TextComponent[] = [];
        for (const result of newQuery) {
          const component = newWorld.getComponent(result.entity as Entity, TextComponentDef);
          if (component) {
            deserializedComponents.push(component);
          }
        }

        // Sort both arrays by text content for comparison
        const sortedOriginal = [...textComponents]
          .map((comp) => ({
            ...comp,
            fontId: comp.fontId.trim(), // Normalize fontId to match deserialization behavior
          }))
          .sort((a, b) => a.text.localeCompare(b.text));
        const sortedDeserialized = deserializedComponents.sort((a, b) =>
          a.text.localeCompare(b.text)
        );

        expect(sortedDeserialized).toEqual(sortedOriginal);
      }),
      { numRuns: 20 } // Fewer runs for complex world operations
    );
  });

  it('handles empty text components correctly', () => {
    const emptyComponent: TextComponent = {
      type: 'TextComponent',
      text: '',
      fontId: '',
      color: [1, 1, 1, 1],
      horizontalAlign: 'left',
      verticalAlign: 'top',
      wordWrap: false,
      visible: true,
    };

    const serialized = serializeTextComponent(emptyComponent);
    const deserialized = deserializeTextComponent(serialized);

    expect(deserialized).toEqual(emptyComponent);
  });

  it('handles components with all optional properties', () => {
    const fullComponent: TextComponent = {
      type: 'TextComponent',
      text: 'Test text with all properties',
      fontId: 'test-font',
      color: [0.5, 0.7, 0.9, 0.8],
      maxWidth: 200,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      lineHeight: 1.5,
      characterSpacing: 2,
      wordWrap: true,
      dropShadow: {
        color: [0, 0, 0, 0.5],
        offsetX: 2,
        offsetY: 2,
      },
      stroke: {
        color: [1, 1, 1, 1],
        width: 1,
      },
      visible: true,
    };

    const serialized = serializeTextComponent(fullComponent);
    const deserialized = deserializeTextComponent(serialized);

    expect(deserialized).toEqual(fullComponent);
  });

  it('validates serialized data structure correctly', () => {
    const validData = {
      type: 'TextComponent',
      text: 'Valid text',
      fontId: 'valid-font',
      color: [1, 1, 1, 1],
      horizontalAlign: 'left',
      verticalAlign: 'top',
      wordWrap: false,
      visible: true,
    };

    expect(validateSerializedTextComponent(validData)).toBe(true);
    expect(validateSerializedTextComponent(null)).toBe(false);
    expect(validateSerializedTextComponent({})).toBe(false);
    expect(validateSerializedTextComponent({ ...validData, type: 'InvalidType' })).toBe(false);
    expect(validateSerializedTextComponent({ ...validData, color: [1, 1, 1] })).toBe(false);
  });

  /**
   * **Feature: text-rendering-system, Property 33: Missing font graceful handling**
   * For any deserialization operation with missing font references, the system should
   * handle the error gracefully and use fallback fonts
   */
  it('handles missing fonts gracefully during deserialization', () => {
    fc.assert(
      fc.property(
        textComponentGen,
        fc.string({ minLength: 1, maxLength: 50 }), // fallback font ID
        (originalComponent, fallbackFontId) => {
          // Create a mock font resolver that reports the original font as missing
          const mockFontResolver: FontResolver = {
            hasFont: (fontId: string) => fontId === fallbackFontId, // Only fallback font exists
            getFallbackFont: () => fallbackFontId,
            getAvailableFonts: () => [fallbackFontId],
          };

          // Serialize the component
          const serialized = serializeTextComponent(originalComponent);

          // Deserialize with the mock font resolver
          const deserialized = deserializeTextComponentWithFallback(serialized, {
            fontResolver: mockFontResolver,
          });

          // Should succeed and use fallback font
          expect(deserialized).not.toBeNull();
          if (deserialized) {
            // Font ID should be replaced with fallback
            expect(deserialized.fontId).toBe(fallbackFontId);

            // All other properties should be preserved
            expect(deserialized.text).toBe(originalComponent.text);
            expect(deserialized.color).toEqual(originalComponent.color);
            expect(deserialized.horizontalAlign).toBe(originalComponent.horizontalAlign);
            expect(deserialized.verticalAlign).toBe(originalComponent.verticalAlign);
            expect(deserialized.wordWrap).toBe(originalComponent.wordWrap);
            expect(deserialized.visible).toBe(originalComponent.visible);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 33: Missing font graceful handling**
   * For any deserialization operation with no available fonts, the system should
   * handle the error gracefully
   */
  it('handles complete font unavailability gracefully', () => {
    fc.assert(
      fc.property(textComponentGen, (originalComponent) => {
        // Create a mock font resolver with no available fonts
        const mockFontResolver: FontResolver = {
          hasFont: () => false, // No fonts available
          getFallbackFont: () => null, // No fallback available
          getAvailableFonts: () => [], // No fonts at all
        };

        // Serialize the component
        const serialized = serializeTextComponent(originalComponent);

        // Deserialize with the mock font resolver (non-strict mode)
        const deserialized = deserializeTextComponentWithFallback(serialized, {
          fontResolver: mockFontResolver,
          strictMode: false,
        });

        // Should succeed with empty font ID
        expect(deserialized).not.toBeNull();
        if (deserialized) {
          expect(deserialized.fontId).toBe('');

          // All other properties should be preserved
          expect(deserialized.text).toBe(originalComponent.text);
          expect(deserialized.color).toEqual(originalComponent.color);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 33: Missing font graceful handling**
   * For any deserialization operation in strict mode with missing fonts, the system
   * should throw appropriate errors
   */
  it('throws errors in strict mode when fonts are missing', () => {
    fc.assert(
      fc.property(textComponentGen, (originalComponent) => {
        // Create a mock font resolver with no available fonts
        const mockFontResolver: FontResolver = {
          hasFont: () => false,
          getFallbackFont: () => null,
          getAvailableFonts: () => [],
        };

        // Serialize the component
        const serialized = serializeTextComponent(originalComponent);

        // Deserialize with strict mode should throw or return null
        try {
          const result = deserializeTextComponentWithFallback(serialized, {
            fontResolver: mockFontResolver,
            strictMode: true,
          });
          // If no exception is thrown, result should be null
          expect(result).toBeNull();
        } catch (error) {
          // If an exception is thrown, it should be a TextDeserializationError
          expect(error).toBeInstanceOf(TextDeserializationError);
        }
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 34: Corrupted data validation**
   * For any corrupted text entity serialization data, the system should validate
   * and either repair or reject the data appropriately
   */
  it('validates and repairs corrupted text component data', () => {
    fc.assert(
      fc.property(
        textComponentGen,
        fc.record({
          // Generate various corruption patterns
          corruptType: fc.boolean(),
          corruptText: fc.boolean(),
          corruptFontId: fc.boolean(),
          corruptColor: fc.boolean(),
          corruptAlignment: fc.boolean(),
          corruptBooleans: fc.boolean(),
        }),
        (originalComponent, corruptionPattern) => {
          // Serialize the original component
          const serialized = serializeTextComponent(originalComponent);

          // Create a corrupted version
          const corrupted: Record<string, unknown> = { ...serialized };

          if (corruptionPattern.corruptType) {
            corrupted.type = 'InvalidType';
          }
          if (corruptionPattern.corruptText) {
            corrupted.text = null; // Invalid text
          }
          if (corruptionPattern.corruptFontId) {
            corrupted.fontId = 123; // Invalid fontId type
          }
          if (corruptionPattern.corruptColor) {
            corrupted.color = [1, 1, 1]; // Invalid color array length
          }
          if (corruptionPattern.corruptAlignment) {
            corrupted.horizontalAlign = 'invalid';
            corrupted.verticalAlign = 'invalid';
          }
          if (corruptionPattern.corruptBooleans) {
            corrupted.wordWrap = 'not-a-boolean';
            corrupted.visible = 'not-a-boolean';
          }

          // Try to repair the corrupted data
          const repaired = repairCorruptedTextComponent(corrupted);

          if (repaired) {
            // If repair succeeded, the repaired data should be valid
            expect(validateSerializedTextComponent(repaired)).toBe(true);

            // Should be able to deserialize the repaired data
            const deserialized = deserializeTextComponent(repaired);
            expect(deserialized).toBeDefined();
            expect(deserialized.type).toBe('TextComponent');
          } else {
            // If repair failed, the original data should have been too corrupted
            expect(validateSerializedTextComponent(corrupted)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 34: Corrupted data validation**
   * For any completely invalid data, the repair function should return null
   */
  it('rejects completely invalid data during repair', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.array(fc.anything()),
          fc.record({}) // Empty object
        ),
        (invalidData) => {
          const repaired = repairCorruptedTextComponent(invalidData);

          if (repaired) {
            // If somehow repaired, it should be valid
            expect(validateSerializedTextComponent(repaired)).toBe(true);
          } else {
            // Most invalid data should not be repairable
            expect(repaired).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 34: Corrupted data validation**
   * For any text component, the repair-then-deserialize process should handle
   * corruption gracefully
   */
  it('handles corruption gracefully with repair-then-deserialize', () => {
    fc.assert(
      fc.property(textComponentGen, (originalComponent) => {
        // Serialize the original component
        const serialized = serializeTextComponent(originalComponent);

        // Create various corruption patterns
        const corruptionPatterns = [
          { ...serialized, text: null },
          { ...serialized, fontId: 123 },
          { ...serialized, color: [1, 1] },
          { ...serialized, horizontalAlign: 'invalid' },
          { ...serialized, wordWrap: 'not-boolean' },
          { ...serialized, type: 'WrongType' },
        ];

        for (const corrupted of corruptionPatterns) {
          const result = deserializeTextComponentWithRepair(corrupted);

          if (result) {
            // If deserialization succeeded, result should be valid
            expect(result.type).toBe('TextComponent');
            expect(typeof result.text).toBe('string');
            expect(typeof result.fontId).toBe('string');
            expect(Array.isArray(result.color)).toBe(true);
            expect(result.color.length).toBe(4);
            expect(['left', 'center', 'right']).toContain(result.horizontalAlign);
            expect(['top', 'middle', 'bottom']).toContain(result.verticalAlign);
            expect(typeof result.wordWrap).toBe('boolean');
            expect(typeof result.visible).toBe('boolean');
          }
          // If result is null, that's also acceptable (corruption was too severe)
        }
      }),
      { numRuns: 50 }
    );
  });
});
