import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { World } from '../ecs/World';
import { DefaultTextRenderer } from '../text/TextRenderer';
import { TextRenderingSystem } from '../text/TextRenderingSystem';
import { TextLayoutEngine } from '../text/TextLayoutEngine';
import { FontManager } from '../text/FontManager';
import { Renderer } from '../rendering/Renderer';

import { createBitmapFont, parseBMFontText } from '../text/BMFontParser';
import { Texture } from '../rendering/types';
import { AssetManager } from '../assets/AssetManager';

// Mock texture creation helper
function createMockTexture(width: number, height: number): Texture {
  return {
    id: 'mock-texture',
    width,
    height,
    source: null,
  };
}

// Generator for valid BMFont data (simplified version)
const bmfontDataArb = fc.record({
  info: fc.record({
    face: fc.string({ minLength: 1, maxLength: 10 }),
    size: fc.integer({ min: 8, max: 32 }),
  }),
  common: fc.record({
    lineHeight: fc.integer({ min: 8, max: 40 }),
    base: fc.integer({ min: 8, max: 40 }),
    scaleW: fc.integer({ min: 64, max: 256 }),
    scaleH: fc.integer({ min: 64, max: 256 }),
  }),
  chars: fc
    .array(
      fc.record({
        id: fc.integer({ min: 65, max: 90 }), // A-Z
        x: fc.integer({ min: 0, max: 200 }),
        y: fc.integer({ min: 0, max: 200 }),
        width: fc.integer({ min: 4, max: 16 }),
        height: fc.integer({ min: 4, max: 16 }),
        xoffset: fc.integer({ min: -2, max: 2 }),
        yoffset: fc.integer({ min: -2, max: 2 }),
        xadvance: fc.integer({ min: 4, max: 20 }),
      }),
      { minLength: 5, maxLength: 26 }
    )
    .map((chars) => {
      // Ensure unique character IDs by removing duplicates
      const uniqueChars = new Map();
      for (const char of chars) {
        if (!uniqueChars.has(char.id)) {
          uniqueChars.set(char.id, char);
        }
      }
      return Array.from(uniqueChars.values());
    }),
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

describe('Text Conditional Rendering Property Tests', () => {
  let layoutEngine: TextLayoutEngine;
  let fontManager: FontManager;

  beforeEach(() => {
    layoutEngine = new TextLayoutEngine();
    // Create a mock asset manager for FontManager
    const mockAssetManager = {} as AssetManager;
    fontManager = new FontManager(mockAssetManager);
  });

  /**
   * **Feature: text-rendering-system, Property 27: Conditional rendering behavior**
   * For any text with rendering disabled, no sprite data should be submitted to the batching system
   * **Validates: Requirements 7.5**
   */
  it('Property 27: Conditional rendering behavior - should not submit sprite data when rendering disabled', () => {
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
                .array(fc.constantFrom(...availableChars), { minLength: 1, maxLength: 10 })
                .map((chars) => chars.join('')),
              fontData: fc.constant(fontData),
              position: fc.record({
                x: fc.integer({ min: -100, max: 100 }),
                y: fc.integer({ min: -100, max: 100 }),
              }),
              // Generate visibility state
              visible: fc.boolean(),
            });
          })
          .filter((data) => data !== null),
        ({ text, fontData, position, visible }) => {
          // Create fresh world and renderer for each iteration
          const testWorld = new World();
          const testRenderer = new DefaultTextRenderer(layoutEngine, fontManager);
          const testRenderingSystem = new TextRenderingSystem(layoutEngine, fontManager);

          // Create fresh mock renderer for each iteration
          const freshMockRenderer = {
            drawSprite: vi.fn(),
            begin: vi.fn(),
            end: vi.fn(),
            getStats: vi.fn(() => ({ drawCalls: 0, sprites: 0, batches: 0 })),
            setCamera: vi.fn(),
            setViewport: vi.fn(),
            setPostProcess: vi.fn(),
            getBackend: vi.fn(() => 'canvas2d'),
            getCanvas: vi.fn(() => ({ width: 800, height: 600 })),
          } as unknown as Renderer;

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

          // Create text entity with specified visibility
          const entity = testRenderer.createTextEntity(testWorld, {
            text,
            font: 'test-font',
            x: position.x,
            y: position.y,
          });

          // Set visibility using the new API
          testRenderer.setTextVisibility(testWorld, entity, visible);

          // Render the text
          testRenderingSystem.render(testWorld, freshMockRenderer);

          if (visible) {
            // When visible, should render characters that exist in the font
            const expectedCharacterCount = text
              .split('')
              .filter((char) => bitmapFont.characters.has(char)).length;
            expect(freshMockRenderer.drawSprite).toHaveBeenCalledTimes(expectedCharacterCount);
          } else {
            // When invisible, should not submit any sprite data
            expect(freshMockRenderer.drawSprite).not.toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
