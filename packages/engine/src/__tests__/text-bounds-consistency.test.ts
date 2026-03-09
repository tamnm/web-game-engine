import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { World } from '../ecs/World';
import { DefaultTextRenderer } from '../text/TextRenderer';
import { TextLayoutEngine } from '../text/TextLayoutEngine';
import { FontManager } from '../text/FontManager';

import { createBitmapFont, parseBMFontText } from '../text/BMFontParser';
import { Texture } from '../rendering/types';
import { AssetManager } from '../assets/AssetManager';

type GeneratedChar = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  xoffset: number;
  yoffset: number;
  xadvance: number;
};

// Mock texture creation helper
function createMockTexture(width: number, height: number): Texture {
  return {
    id: 'mock-texture',
    width,
    height,
    source: null,
  };
}

// Generator for valid BMFont data with realistic font metrics
const bmfontDataArb = fc.integer({ min: 12, max: 24 }).chain((fontSize) => {
  // Generate realistic font metrics based on font size
  const lineHeight = Math.floor(fontSize * 1.2); // 20% larger than font size
  const baseline = Math.floor(fontSize * 0.8); // 80% of font size
  const charWidth = fontSize; // Monospace characters
  const charHeight = fontSize;

  return fc.record({
    info: fc.record({
      face: fc.string({ minLength: 1, maxLength: 10 }),
      size: fc.constant(fontSize),
    }),
    common: fc.record({
      lineHeight: fc.constant(lineHeight),
      base: fc.constant(baseline),
      scaleW: fc.constant(256), // Fixed atlas size for consistency
      scaleH: fc.constant(256),
    }),
    chars: fc
      .array(
        fc.record({
          id: fc.integer({ min: 65, max: 90 }), // A-Z
        }),
        { minLength: 5, maxLength: 26 }
      )
      .map((chars): GeneratedChar[] => {
        const positionedChars: GeneratedChar[] = chars.map((base, index) => ({
          ...base,
          // Position characters in a grid pattern
          x: (index % 16) * charWidth,
          y: Math.floor(index / 16) * charHeight,
          width: charWidth,
          height: charHeight,
          xoffset: 0, // Keep simple for consistency
          yoffset: 0,
          xadvance: charWidth, // Monospace advance
        }));

        // Ensure unique character IDs by removing duplicates
        const uniqueChars = new Map<number, GeneratedChar>();
        positionedChars.forEach((char, index) => {
          if (!uniqueChars.has(char.id)) {
            uniqueChars.set(char.id, {
              ...char,
              x: (index % 16) * charWidth,
              y: Math.floor(index / 16) * charHeight,
            });
          }
        });
        return Array.from(uniqueChars.values());
      }),
  });
});

// Helper to generate BMFont text format
function generateBMFontText(data: {
  info: { face: string; size: number };
  common: { lineHeight: number; base: number; scaleW: number; scaleH: number };
  chars: Array<{
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    xoffset: number;
    yoffset: number;
    xadvance: number;
  }>;
}): string {
  let result = '';

  result += `info face="${data.info.face}" size=${data.info.size}\n`;
  result += `common lineHeight=${data.common.lineHeight} base=${data.common.base} scaleW=${data.common.scaleW} scaleH=${data.common.scaleH}\n`;
  result += `page id=0 file="font.png"\n`;
  result += `chars count=${data.chars.length}\n`;

  for (const char of data.chars) {
    result += `char id=${char.id} x=${char.x} y=${char.y} width=${char.width} height=${char.height} xoffset=${char.xoffset} yoffset=${char.yoffset} xadvance=${char.xadvance}\n`;
  }

  return result;
}

describe('Text Bounds Consistency Property Tests', () => {
  let layoutEngine: TextLayoutEngine;
  let fontManager: FontManager;

  beforeEach(() => {
    layoutEngine = new TextLayoutEngine();
    // Create a mock asset manager for FontManager
    const mockAssetManager = {} as AssetManager;
    fontManager = new FontManager(mockAssetManager);
  });

  /**
   * **Feature: text-rendering-system, Property 29: Bounds update consistency**
   * For any text with changed content, the calculated bounds should be updated to reflect the new content dimensions
   * **Validates: Requirements 8.5**
   */
  it('Property 29: Bounds update consistency - should update bounds when text content changes', () => {
    fc.assert(
      fc.property(
        bmfontDataArb
          .chain((fontData) => {
            // Extract available characters from font data
            const availableChars = fontData.chars.map((c) => String.fromCharCode(c.id));

            if (availableChars.length < 2) {
              return fc.constant(null); // Skip this test case
            }

            return fc.record({
              // Generate two different texts using available characters
              initialText: fc
                .array(fc.constantFrom(...availableChars), { minLength: 1, maxLength: 5 })
                .map((chars) => chars.join('')),
              updatedText: fc
                .array(fc.constantFrom(...availableChars), { minLength: 1, maxLength: 8 })
                .map((chars) => chars.join('')),
              fontData: fc.constant(fontData),
              position: fc.record({
                x: fc.integer({ min: -50, max: 50 }),
                y: fc.integer({ min: -50, max: 50 }),
              }),
            });
          })
          .filter((data) => data !== null)
          .filter(({ initialText, updatedText }) => initialText !== updatedText), // Ensure texts are different
        ({ initialText, updatedText, fontData, position }) => {
          // Create fresh world and renderer for each iteration
          const testWorld = new World();
          const testRenderer = new DefaultTextRenderer(layoutEngine, fontManager);

          // Create a bitmap font and register it
          const atlasWidth = Math.max(
            fontData.common.scaleW,
            ...fontData.chars.map((c) => c.x + c.width)
          );
          const atlasHeight = Math.max(
            fontData.common.scaleH,
            ...fontData.chars.map((c) => c.y + c.height)
          );

          const mockAtlas = createMockTexture(atlasWidth, atlasHeight);
          const bmfontText = generateBMFontText(fontData);
          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

          // Mock font manager to return our test font
          fontManager.getFont = vi.fn((id: string) =>
            id === 'test-font' ? bitmapFont : undefined
          );

          // Create text entity with initial text
          const entity = testRenderer.createTextEntity(testWorld, {
            text: initialText,
            font: 'test-font',
            x: position.x,
            y: position.y,
          });

          // Get initial bounds
          const initialBounds = testRenderer.getTextBounds(testWorld, entity);
          expect(initialBounds).not.toBeNull();

          // Verify bounds are up-to-date initially
          expect(testRenderer.areBoundsUpToDate(testWorld, entity)).toBe(true);

          // Update text content
          testRenderer.updateText(testWorld, entity, updatedText);

          // Get updated bounds
          const updatedBounds = testRenderer.getTextBounds(testWorld, entity);
          expect(updatedBounds).not.toBeNull();

          // Verify bounds are still up-to-date after update
          expect(testRenderer.areBoundsUpToDate(testWorld, entity)).toBe(true);

          // Calculate expected dimensions for both texts
          const calculateExpectedDimensions = (text: string) => {
            const validChars = text.split('').filter((char) => bitmapFont.characters.has(char));
            if (validChars.length === 0) {
              return { width: 0, height: 0 };
            }

            let totalWidth = 0;
            let maxHeight = 0;

            for (const char of validChars) {
              const charData = bitmapFont.characters.get(char)!;
              totalWidth += charData.xAdvance;
              maxHeight = Math.max(maxHeight, charData.height);
            }

            return { width: totalWidth, height: maxHeight };
          };

          const initialExpected = calculateExpectedDimensions(initialText);
          const updatedExpected = calculateExpectedDimensions(updatedText);

          // If the expected dimensions are different, bounds should be different
          if (
            initialExpected.width !== updatedExpected.width ||
            initialExpected.height !== updatedExpected.height
          ) {
            expect(
              initialBounds!.width !== updatedBounds!.width ||
                initialBounds!.height !== updatedBounds!.height
            ).toBe(true);
          }

          // Bounds should reflect the actual content
          if (updatedExpected.width === 0 && updatedExpected.height === 0) {
            // Empty text should have zero bounds
            expect(updatedBounds!.width).toBe(0);
            expect(updatedBounds!.height).toBe(0);
          } else {
            // Non-empty text should have positive bounds
            expect(updatedBounds!.width).toBeGreaterThan(0);
            expect(updatedBounds!.height).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test bounds consistency for empty text handling
   */
  it('Property 29 Extension: Empty text bounds consistency - should handle empty text with zero dimensions', () => {
    fc.assert(
      fc.property(
        bmfontDataArb
          .chain((fontData) => {
            // Extract available characters from font data
            const availableChars = fontData.chars.map((c) => String.fromCharCode(c.id));

            if (availableChars.length < 1) {
              return fc.constant(null); // Skip this test case
            }

            return fc.record({
              // Generate non-empty text using available characters
              nonEmptyText: fc
                .array(fc.constantFrom(...availableChars), { minLength: 1, maxLength: 5 })
                .map((chars) => chars.join('')),
              fontData: fc.constant(fontData),
              position: fc.record({
                x: fc.integer({ min: -50, max: 50 }),
                y: fc.integer({ min: -50, max: 50 }),
              }),
            });
          })
          .filter((data) => data !== null),
        ({ nonEmptyText, fontData, position }) => {
          // Create fresh world and renderer for each iteration
          const testWorld = new World();
          const testRenderer = new DefaultTextRenderer(layoutEngine, fontManager);

          // Create a bitmap font and register it
          const atlasWidth = Math.max(
            fontData.common.scaleW,
            ...fontData.chars.map((c) => c.x + c.width)
          );
          const atlasHeight = Math.max(
            fontData.common.scaleH,
            ...fontData.chars.map((c) => c.y + c.height)
          );

          const mockAtlas = createMockTexture(atlasWidth, atlasHeight);
          const bmfontText = generateBMFontText(fontData);
          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

          // Mock font manager to return our test font
          fontManager.getFont = vi.fn((id: string) =>
            id === 'test-font' ? bitmapFont : undefined
          );

          // Create text entity with non-empty text
          const entity = testRenderer.createTextEntity(testWorld, {
            text: nonEmptyText,
            font: 'test-font',
            x: position.x,
            y: position.y,
          });

          // Get initial bounds (should be non-zero for valid characters)
          const initialBounds = testRenderer.getTextBounds(testWorld, entity);
          expect(initialBounds).not.toBeNull();

          const hasValidChars = nonEmptyText
            .split('')
            .some((char) => bitmapFont.characters.has(char));

          if (hasValidChars) {
            expect(initialBounds!.width).toBeGreaterThan(0);
            expect(initialBounds!.height).toBeGreaterThan(0);
          }

          // Update to empty text
          testRenderer.updateText(testWorld, entity, '');

          // Get bounds for empty text
          const emptyBounds = testRenderer.getTextBounds(testWorld, entity);
          expect(emptyBounds).not.toBeNull();

          // Empty text should have zero dimensions
          expect(emptyBounds!.width).toBe(0);
          expect(emptyBounds!.height).toBe(0);

          // Bounds should still be up-to-date
          expect(testRenderer.areBoundsUpToDate(testWorld, entity)).toBe(true);

          // Update back to non-empty text
          testRenderer.updateText(testWorld, entity, nonEmptyText);

          // Get final bounds
          const finalBounds = testRenderer.getTextBounds(testWorld, entity);
          expect(finalBounds).not.toBeNull();

          // Should match initial bounds (same text)
          if (hasValidChars) {
            expect(finalBounds!.width).toBeGreaterThan(0);
            expect(finalBounds!.height).toBeGreaterThan(0);
            expect(finalBounds!.width).toBe(initialBounds!.width);
            expect(finalBounds!.height).toBe(initialBounds!.height);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test bounds consistency for style changes that affect layout
   */
  it('Property 29 Extension: Style change bounds consistency - should update bounds when layout-affecting styles change', () => {
    fc.assert(
      fc.property(
        bmfontDataArb
          .chain((fontData) => {
            // Extract available characters from font data
            const availableChars = fontData.chars.map((c) => String.fromCharCode(c.id));

            if (availableChars.length < 1) {
              return fc.constant(null); // Skip this test case
            }

            return fc.record({
              // Generate text using available characters
              text: fc
                .array(fc.constantFrom(...availableChars), { minLength: 2, maxLength: 10 })
                .map((chars) => chars.join('')),
              fontData: fc.constant(fontData),
              position: fc.record({
                x: fc.integer({ min: -50, max: 50 }),
                y: fc.integer({ min: -50, max: 50 }),
              }),
              // Generate different character spacing values
              initialSpacing: fc.integer({ min: 0, max: 5 }),
              updatedSpacing: fc.integer({ min: 6, max: 15 }),
            });
          })
          .filter((data) => data !== null),
        ({ text, fontData, position, initialSpacing, updatedSpacing }) => {
          // Create fresh world and renderer for each iteration
          const testWorld = new World();
          const testRenderer = new DefaultTextRenderer(layoutEngine, fontManager);

          // Create a bitmap font and register it
          const atlasWidth = Math.max(
            fontData.common.scaleW,
            ...fontData.chars.map((c) => c.x + c.width)
          );
          const atlasHeight = Math.max(
            fontData.common.scaleH,
            ...fontData.chars.map((c) => c.y + c.height)
          );

          const mockAtlas = createMockTexture(atlasWidth, atlasHeight);
          const bmfontText = generateBMFontText(fontData);
          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

          // Mock font manager to return our test font
          fontManager.getFont = vi.fn((id: string) =>
            id === 'test-font' ? bitmapFont : undefined
          );

          // Create text entity with initial character spacing
          const entity = testRenderer.createTextEntity(testWorld, {
            text,
            font: 'test-font',
            x: position.x,
            y: position.y,
            style: {
              characterSpacing: initialSpacing,
            },
          });

          // Get initial bounds
          const initialBounds = testRenderer.getTextBounds(testWorld, entity);
          expect(initialBounds).not.toBeNull();

          // Update character spacing (layout-affecting change)
          testRenderer.updateStyle(testWorld, entity, {
            characterSpacing: updatedSpacing,
          });

          // Get updated bounds
          const updatedBounds = testRenderer.getTextBounds(testWorld, entity);
          expect(updatedBounds).not.toBeNull();

          // Bounds should be up-to-date after style change
          expect(testRenderer.areBoundsUpToDate(testWorld, entity)).toBe(true);

          // Since character spacing changed, width should be different
          // (assuming text has valid characters)
          const hasValidChars = text.split('').some((char) => bitmapFont.characters.has(char));

          if (hasValidChars && initialSpacing !== updatedSpacing) {
            expect(updatedBounds!.width).not.toBe(initialBounds!.width);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
