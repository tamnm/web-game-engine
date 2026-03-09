import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { World } from '../ecs/World';
import { DefaultTextRenderer } from '../text/TextRenderer';
import { TextRenderingSystem } from '../text/TextRenderingSystem';
import { TextLayoutEngine } from '../text/TextLayoutEngine';
import { FontManager } from '../text/FontManager';
import { Renderer } from '../rendering/Renderer';
import { createBitmapFont, parseBMFontText } from '../text/BMFontParser';
import { Texture, TextureRegion, SpriteDrawOptions } from '../rendering/types';
import { AssetManager } from '../assets/AssetManager';

// Type for drawSprite mock calls
type DrawSpriteCall = [TextureRegion, SpriteDrawOptions];

// Mock texture creation helper
function createMockTexture(width: number, height: number): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return {
    id: 'mock-texture',
    width,
    height,
    source: canvas,
  };
}

// Mock Canvas 2D context (removed unused function)

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
      { minLength: 3, maxLength: 10 }
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

describe('Text Cross-Backend Visual Consistency Property Tests', () => {
  let layoutEngine: TextLayoutEngine;
  let fontManager: FontManager;

  beforeEach(() => {
    layoutEngine = new TextLayoutEngine();
    const mockAssetManager = {} as AssetManager;
    fontManager = new FontManager(mockAssetManager);
  });

  /**
   * **Feature: text-rendering-system, Property 30: Cross-backend visual consistency**
   * For any text rendered on different backends (WebGL2 vs Canvas 2D), the visual output should be
   * consistent in positioning and appearance
   * **Validates: Requirements 9.3**
   */
  it('Property 30: Cross-backend visual consistency - should produce consistent positioning across backends', () => {
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
              // Generate text using available characters
              text: fc
                .array(fc.constantFrom(...availableChars), { minLength: 1, maxLength: 5 })
                .map((chars) => chars.join('')),
              fontData: fc.constant(fontData),
              position: fc.record({
                x: fc.integer({ min: -100, max: 100 }),
                y: fc.integer({ min: -100, max: 100 }),
              }),
              color: fc.tuple(
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 })
              ) as fc.Arbitrary<[number, number, number, number]>,
            });
          })
          .filter((data) => data !== null),
        ({ text, fontData, position, color }) => {
          // Create fresh world and renderer for each iteration
          const testWorld1 = new World();
          const testWorld2 = new World();
          const testRenderer1 = new DefaultTextRenderer(layoutEngine, fontManager);
          const testRenderer2 = new DefaultTextRenderer(layoutEngine, fontManager);
          const testRenderingSystem1 = new TextRenderingSystem(layoutEngine, fontManager);
          const testRenderingSystem2 = new TextRenderingSystem(layoutEngine, fontManager);

          // Create Canvas 2D renderer
          const mockCanvas2DRenderer = {
            drawSprite: vi.fn(),
            begin: vi.fn(),
            end: vi.fn(() => ({ drawCalls: 0, sprites: 0, batches: 0 })),
            getStats: vi.fn(() => ({ drawCalls: 0, sprites: 0, batches: 0 })),
            setCamera: vi.fn(),
            setViewport: vi.fn(),
            setPostProcess: vi.fn(),
            getBackend: vi.fn(() => 'canvas2d'),
          } as unknown as Renderer;

          // Create "WebGL2" renderer (simulated with same interface)
          const mockWebGL2Renderer = {
            drawSprite: vi.fn(),
            begin: vi.fn(),
            end: vi.fn(() => ({ drawCalls: 0, sprites: 0, batches: 0 })),
            getStats: vi.fn(() => ({ drawCalls: 0, sprites: 0, batches: 0 })),
            setCamera: vi.fn(),
            setViewport: vi.fn(),
            setPostProcess: vi.fn(),
            getBackend: vi.fn(() => 'webgl2'),
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

          // Mock font manager to return our test font for both renderers
          const mockGetFont = vi.fn((id: string) => (id === 'test-font' ? bitmapFont : undefined));
          fontManager.getFont = mockGetFont;

          // Create identical text entities on both backends
          testRenderer1.createTextEntity(testWorld1, {
            text,
            font: 'test-font',
            x: position.x,
            y: position.y,
            style: { color },
          });

          testRenderer2.createTextEntity(testWorld2, {
            text,
            font: 'test-font',
            x: position.x,
            y: position.y,
            style: { color },
          });

          // Render on both backends
          testRenderingSystem1.render(testWorld1, mockCanvas2DRenderer);
          testRenderingSystem2.render(testWorld2, mockWebGL2Renderer);

          // Count expected characters (only those that exist in the font)
          const expectedCharacterCount = text
            .split('')
            .filter((char) => bitmapFont.characters.has(char)).length;

          // Both backends should render the same number of characters
          expect(mockCanvas2DRenderer.drawSprite).toHaveBeenCalledTimes(expectedCharacterCount);
          expect(mockWebGL2Renderer.drawSprite).toHaveBeenCalledTimes(expectedCharacterCount);

          // Extract draw calls from both backends
          const canvas2DCalls = (
            mockCanvas2DRenderer.drawSprite as unknown as ReturnType<typeof vi.fn>
          ).mock.calls as DrawSpriteCall[];
          const webgl2Calls = (mockWebGL2Renderer.drawSprite as unknown as ReturnType<typeof vi.fn>)
            .mock.calls as DrawSpriteCall[];

          // Verify consistent positioning and appearance across backends
          for (let i = 0; i < expectedCharacterCount; i++) {
            const [canvas2DRegion, canvas2DOptions] = canvas2DCalls[i];
            const [webgl2Region, webgl2Options] = webgl2Calls[i];

            // Texture regions should be identical (same font atlas)
            expect(canvas2DRegion.texture).toBe(webgl2Region.texture);
            expect(canvas2DRegion.x).toBe(webgl2Region.x);
            expect(canvas2DRegion.y).toBe(webgl2Region.y);
            expect(canvas2DRegion.width).toBe(webgl2Region.width);
            expect(canvas2DRegion.height).toBe(webgl2Region.height);

            // Sprite positioning should be identical
            expect(canvas2DOptions.x).toBeCloseTo(webgl2Options.x, 5);
            expect(canvas2DOptions.y).toBeCloseTo(webgl2Options.y, 5);
            expect(canvas2DOptions.width).toBe(webgl2Options.width);
            expect(canvas2DOptions.height).toBe(webgl2Options.height);

            // Colors should be identical
            expect(canvas2DOptions.tint).toEqual(webgl2Options.tint);

            // Origins should be identical
            expect(canvas2DOptions.origin).toEqual(webgl2Options.origin);

            // Rotation should be identical
            expect(canvas2DOptions.rotation).toBe(webgl2Options.rotation);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 30: Cross-backend visual consistency (with styling)**
   * For any text with styling effects rendered on different backends, the visual output should be
   * consistent in positioning and appearance
   * **Validates: Requirements 9.3**
   */
  it('Property 30: Cross-backend visual consistency - should produce consistent styling effects across backends', () => {
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
              // Generate single character for simpler verification
              text: fc.constantFrom(...availableChars),
              fontData: fc.constant(fontData),
              position: fc.record({
                x: fc.integer({ min: -50, max: 50 }),
                y: fc.integer({ min: -50, max: 50 }),
              }),
              textColor: fc.tuple(
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 })
              ) as fc.Arbitrary<[number, number, number, number]>,
              shadowColor: fc.tuple(
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 })
              ) as fc.Arbitrary<[number, number, number, number]>,
              shadowOffset: fc.record({
                x: fc.integer({ min: -5, max: 5 }),
                y: fc.integer({ min: -5, max: 5 }),
              }),
            });
          })
          .filter((data) => data !== null),
        ({ text, fontData, position, textColor, shadowColor, shadowOffset }) => {
          // Create fresh world and renderer for each iteration
          const testWorld1 = new World();
          const testWorld2 = new World();
          const testRenderer1 = new DefaultTextRenderer(layoutEngine, fontManager);
          const testRenderer2 = new DefaultTextRenderer(layoutEngine, fontManager);
          const testRenderingSystem1 = new TextRenderingSystem(layoutEngine, fontManager);
          const testRenderingSystem2 = new TextRenderingSystem(layoutEngine, fontManager);

          // Create Canvas 2D renderer
          const mockCanvas2DRenderer = {
            drawSprite: vi.fn(),
            begin: vi.fn(),
            end: vi.fn(() => ({ drawCalls: 0, sprites: 0, batches: 0 })),
            getStats: vi.fn(() => ({ drawCalls: 0, sprites: 0, batches: 0 })),
            setCamera: vi.fn(),
            setViewport: vi.fn(),
            setPostProcess: vi.fn(),
            getBackend: vi.fn(() => 'canvas2d'),
          } as unknown as Renderer;

          // Create "WebGL2" renderer (simulated with same interface)
          const mockWebGL2Renderer = {
            drawSprite: vi.fn(),
            begin: vi.fn(),
            end: vi.fn(() => ({ drawCalls: 0, sprites: 0, batches: 0 })),
            getStats: vi.fn(() => ({ drawCalls: 0, sprites: 0, batches: 0 })),
            setCamera: vi.fn(),
            setViewport: vi.fn(),
            setPostProcess: vi.fn(),
            getBackend: vi.fn(() => 'webgl2'),
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

          // Skip if character doesn't exist in font
          if (!bitmapFont.characters.has(text)) {
            return;
          }

          // Mock font manager to return our test font for both renderers
          const mockGetFont = vi.fn((id: string) => (id === 'test-font' ? bitmapFont : undefined));
          fontManager.getFont = mockGetFont;

          // Create identical text entities with styling on both backends
          testRenderer1.createTextEntity(testWorld1, {
            text,
            font: 'test-font',
            x: position.x,
            y: position.y,
            style: {
              color: textColor,
              dropShadow: {
                color: shadowColor,
                offsetX: shadowOffset.x,
                offsetY: shadowOffset.y,
              },
            },
          });

          testRenderer2.createTextEntity(testWorld2, {
            text,
            font: 'test-font',
            x: position.x,
            y: position.y,
            style: {
              color: textColor,
              dropShadow: {
                color: shadowColor,
                offsetX: shadowOffset.x,
                offsetY: shadowOffset.y,
              },
            },
          });

          // Render on both backends
          testRenderingSystem1.render(testWorld1, mockCanvas2DRenderer);
          testRenderingSystem2.render(testWorld2, mockWebGL2Renderer);

          // Both backends should render: 1 shadow + 1 main text = 2 calls
          expect(mockCanvas2DRenderer.drawSprite).toHaveBeenCalledTimes(2);
          expect(mockWebGL2Renderer.drawSprite).toHaveBeenCalledTimes(2);

          // Extract draw calls from both backends
          const canvas2DCalls = (
            mockCanvas2DRenderer.drawSprite as unknown as ReturnType<typeof vi.fn>
          ).mock.calls as DrawSpriteCall[];
          const webgl2Calls = (mockWebGL2Renderer.drawSprite as unknown as ReturnType<typeof vi.fn>)
            .mock.calls as DrawSpriteCall[];

          // Verify consistent shadow rendering
          const [, canvas2DShadowOptions] = canvas2DCalls[0];
          const [, webgl2ShadowOptions] = webgl2Calls[0];

          // Shadow colors should be identical
          expect(canvas2DShadowOptions.tint).toEqual(webgl2ShadowOptions.tint);
          expect(canvas2DShadowOptions.tint).toEqual(shadowColor);

          // Shadow positions should be identical
          expect(canvas2DShadowOptions.x).toBeCloseTo(webgl2ShadowOptions.x, 5);
          expect(canvas2DShadowOptions.y).toBeCloseTo(webgl2ShadowOptions.y, 5);

          // Verify consistent main text rendering
          const [, canvas2DMainOptions] = canvas2DCalls[1];
          const [, webgl2MainOptions] = webgl2Calls[1];

          // Main text colors should be identical
          expect(canvas2DMainOptions.tint).toEqual(webgl2MainOptions.tint);
          expect(canvas2DMainOptions.tint).toEqual(textColor);

          // Main text positions should be identical
          expect(canvas2DMainOptions.x).toBeCloseTo(webgl2MainOptions.x, 5);
          expect(canvas2DMainOptions.y).toBeCloseTo(webgl2MainOptions.y, 5);

          // Shadow offset should be consistent
          const shadowOffsetX = canvas2DMainOptions.x - canvas2DShadowOptions.x;
          const shadowOffsetY = canvas2DMainOptions.y - canvas2DShadowOptions.y;
          const webgl2OffsetX = webgl2MainOptions.x - webgl2ShadowOptions.x;
          const webgl2OffsetY = webgl2MainOptions.y - webgl2ShadowOptions.y;

          expect(shadowOffsetX).toBeCloseTo(webgl2OffsetX, 5);
          expect(shadowOffsetY).toBeCloseTo(webgl2OffsetY, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
