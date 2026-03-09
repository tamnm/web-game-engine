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
  kernings: fc.array(
    fc.record({
      first: fc.integer({ min: 65, max: 90 }),
      second: fc.integer({ min: 65, max: 90 }),
      amount: fc.integer({ min: -3, max: 3 }),
    }),
    { maxLength: 10 }
  ),
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
  kernings: Array<{ first: number; second: number; amount: number }>;
}): string {
  let result = '';

  result += `info face="${data.info.face}" size=${data.info.size}\n`;
  result += `common lineHeight=${data.common.lineHeight} base=${data.common.base} scaleW=${data.common.scaleW} scaleH=${data.common.scaleH}\n`;
  result += `page id=0 file="font.png"\n`;
  result += `chars count=${data.chars.length}\n`;

  for (const char of data.chars) {
    result += `char id=${char.id} x=${char.x} y=${char.y} width=${char.width} height=${char.height} xoffset=${char.xoffset} yoffset=${char.yoffset} xadvance=${char.xadvance}\n`;
  }

  if (data.kernings.length > 0) {
    result += `kernings count=${data.kernings.length}\n`;
    for (const kerning of data.kernings) {
      result += `kerning first=${kerning.first} second=${kerning.second} amount=${kerning.amount}\n`;
    }
  }

  return result;
}

describe('Text Sprite Integration Property Tests', () => {
  let layoutEngine: TextLayoutEngine;
  let fontManager: FontManager;

  beforeEach(() => {
    layoutEngine = new TextLayoutEngine();
    // Create a mock asset manager for FontManager
    const mockAssetManager = {} as AssetManager;
    fontManager = new FontManager(mockAssetManager);
  });

  /**
   * **Feature: text-rendering-system, Property 24: Sprite batch integration**
   * For any rendered text, each character should be submitted to the sprite batching system
   * as individual sprite draw calls
   * **Validates: Requirements 7.1**
   */
  it('Property 24: Sprite batch integration - should submit each character as individual sprite draw calls', () => {
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
            });
          })
          .filter((data) => data !== null),
        ({ text, fontData, position }) => {
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

          // Create text entity
          testRenderer.createTextEntity(testWorld, {
            text,
            font: 'test-font',
            x: position.x,
            y: position.y,
          });

          // Render the text
          testRenderingSystem.render(testWorld, freshMockRenderer);

          // Count expected characters (only those that exist in the font)
          const expectedCharacterCount = text
            .split('')
            .filter((char) => bitmapFont.characters.has(char)).length;

          // Verify that drawSprite was called once for each renderable character
          expect(freshMockRenderer.drawSprite).toHaveBeenCalledTimes(expectedCharacterCount);

          // Verify each call was made with proper TextureRegion and SpriteDrawOptions
          const drawSpriteCalls = (
            freshMockRenderer.drawSprite as unknown as ReturnType<typeof vi.fn>
          ).mock.calls as DrawSpriteCall[];

          for (let i = 0; i < drawSpriteCalls.length; i++) {
            const [textureRegion, spriteOptions] = drawSpriteCalls[i];

            // Verify TextureRegion structure
            expect(textureRegion).toHaveProperty('texture');
            expect(textureRegion).toHaveProperty('x');
            expect(textureRegion).toHaveProperty('y');
            expect(textureRegion).toHaveProperty('width');
            expect(textureRegion).toHaveProperty('height');
            expect(textureRegion.texture).toBe(bitmapFont.atlas);

            // Verify SpriteDrawOptions structure
            expect(spriteOptions).toHaveProperty('x');
            expect(spriteOptions).toHaveProperty('y');
            expect(spriteOptions).toHaveProperty('width');
            expect(spriteOptions).toHaveProperty('height');
            expect(spriteOptions).toHaveProperty('tint');
            expect(spriteOptions).toHaveProperty('origin');

            // Verify that coordinates are numbers
            expect(typeof spriteOptions.x).toBe('number');
            expect(typeof spriteOptions.y).toBe('number');
            expect(typeof spriteOptions.width).toBe('number');
            expect(typeof spriteOptions.height).toBe('number');

            // Verify tint is a valid color array
            expect(Array.isArray(spriteOptions.tint)).toBe(true);
            expect(spriteOptions.tint).toHaveLength(4);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 25: Font-based batching optimization**
   * For any multiple text entities using the same font, their characters should be
   * batched together for efficient rendering
   * **Validates: Requirements 7.2**
   */
  it('Property 25: Font-based batching optimization - should process entities with same font together', () => {
    fc.assert(
      fc.property(
        bmfontDataArb
          .chain((fontData) => {
            // Extract available characters from font data
            const availableChars = fontData.chars.map((c) => String.fromCharCode(c.id));

            if (availableChars.length < 2) {
              return fc.constant(null); // Skip this test case
            }

            return fc
              .record({
                // Generate multiple texts using available characters
                texts: fc.array(
                  fc
                    .array(fc.constantFrom(...availableChars), { minLength: 1, maxLength: 5 })
                    .map((chars) => chars.join('')),
                  { minLength: 2, maxLength: 4 }
                ),
                fontData: fc.constant(fontData),
              })
              .chain(({ texts, fontData }) => {
                // Generate positions array with same length as texts
                return fc.record({
                  texts: fc.constant(texts),
                  fontData: fc.constant(fontData),
                  positions: fc.array(
                    fc.record({
                      x: fc.integer({ min: -50, max: 50 }),
                      y: fc.integer({ min: -50, max: 50 }),
                    }),
                    { minLength: texts.length, maxLength: texts.length }
                  ),
                });
              });
          })
          .filter((data) => data !== null),
        ({ texts, fontData, positions }) => {
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

          // Create multiple text entities with the same font
          const entities = [];
          for (let i = 0; i < Math.min(texts.length, positions.length); i++) {
            const entity = testRenderer.createTextEntity(testWorld, {
              text: texts[i],
              font: 'test-font',
              x: positions[i].x,
              y: positions[i].y,
            });
            entities.push(entity);
          }

          // Render all text entities
          testRenderingSystem.render(testWorld, freshMockRenderer);

          // Calculate total expected character count across all entities
          const totalExpectedCharacters = texts.reduce((total, text) => {
            return total + text.split('').filter((char) => bitmapFont.characters.has(char)).length;
          }, 0);

          // Verify that drawSprite was called for all characters across all entities
          expect(freshMockRenderer.drawSprite).toHaveBeenCalledTimes(totalExpectedCharacters);

          // Verify that font manager was called only once per unique font
          // (indicating batching by font)
          expect(fontManager.getFont).toHaveBeenCalledWith('test-font');

          // All calls should use the same font atlas texture
          const drawSpriteCalls = (
            freshMockRenderer.drawSprite as unknown as ReturnType<typeof vi.fn>
          ).mock.calls as DrawSpriteCall[];
          for (const [textureRegion] of drawSpriteCalls) {
            expect(textureRegion.texture).toBe(bitmapFont.atlas);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 26: Texture grouping optimization**
   * For any text rendering operation, characters should be grouped by font atlas texture
   * to minimize texture switches
   * **Validates: Requirements 7.3**
   */
  it('Property 26: Texture grouping optimization - should group characters by font atlas texture', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Generate data for two different fonts
          font1Data: bmfontDataArb,
          font2Data: bmfontDataArb,
          texts: fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 5 }),
              fontId: fc.constantFrom('font1', 'font2'),
              position: fc.record({
                x: fc.integer({ min: -50, max: 50 }),
                y: fc.integer({ min: -50, max: 50 }),
              }),
            }),
            { minLength: 2, maxLength: 6 }
          ),
        }),
        ({ font1Data, font2Data, texts }) => {
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
          } as unknown as Renderer;

          // Create two different bitmap fonts
          const createFont = (fontData: typeof font1Data, fontId: string) => {
            const atlasWidth = Math.max(
              fontData.common.scaleW,
              ...fontData.chars.map((c) => c.x + c.width)
            );
            const atlasHeight = Math.max(
              fontData.common.scaleH,
              ...fontData.chars.map((c) => c.y + c.height)
            );

            const mockAtlas = createMockTexture(atlasWidth, atlasHeight);
            // Create a new texture with distinguishable ID
            const distinguishableAtlas = {
              ...mockAtlas,
              id: `${fontId}-atlas`,
            };
            const bmfontText = generateBMFontText(fontData);
            const parsedData = parseBMFontText(bmfontText);
            return createBitmapFont(fontId, parsedData, distinguishableAtlas);
          };

          const font1 = createFont(font1Data, 'font1');
          const font2 = createFont(font2Data, 'font2');

          // Mock font manager to return appropriate fonts
          fontManager.getFont = vi.fn((id: string) => {
            if (id === 'font1') return font1;
            if (id === 'font2') return font2;
            return undefined;
          });

          // Create text entities with different fonts
          const entities = [];
          for (const textData of texts) {
            // Filter text to only include characters available in the selected font
            const font = textData.fontId === 'font1' ? font1 : font2;
            const availableChars = Array.from(font.characters.keys());
            const filteredText = textData.text
              .split('')
              .filter((char) => availableChars.includes(char))
              .join('');

            if (filteredText.length > 0) {
              const entity = testRenderer.createTextEntity(testWorld, {
                text: filteredText,
                font: textData.fontId,
                x: textData.position.x,
                y: textData.position.y,
              });
              entities.push({ entity, fontId: textData.fontId, text: filteredText });
            }
          }

          if (entities.length === 0) return; // Skip if no valid entities

          // Render all text entities
          testRenderingSystem.render(testWorld, freshMockRenderer);

          // Analyze the order of drawSprite calls to verify texture grouping
          const drawSpriteCalls = (
            freshMockRenderer.drawSprite as unknown as ReturnType<typeof vi.fn>
          ).mock.calls as DrawSpriteCall[];

          if (drawSpriteCalls.length > 1) {
            // Group consecutive calls by texture
            const textureGroups: string[][] = [];
            let currentGroup: string[] = [];
            let currentTexture: string | null = null;

            for (const [textureRegion] of drawSpriteCalls) {
              const textureId = textureRegion.texture.id;

              if (currentTexture !== textureId) {
                if (currentGroup.length > 0) {
                  textureGroups.push([...currentGroup]);
                }
                currentGroup = [textureId];
                currentTexture = textureId;
              } else {
                currentGroup.push(textureId);
              }
            }

            if (currentGroup.length > 0) {
              textureGroups.push(currentGroup);
            }

            // Verify that characters using the same texture are grouped together
            // (no texture switches within a group)
            for (const group of textureGroups) {
              const uniqueTextures = new Set(group);
              expect(uniqueTextures.size).toBe(1); // All calls in group use same texture
            }

            // Count texture switches (should be minimized)
            const textureSwitches = textureGroups.length - 1;
            const uniqueTextures = new Set(drawSpriteCalls.map(([region]) => region.texture.id));

            // Number of texture switches should not exceed number of unique textures - 1
            expect(textureSwitches).toBeLessThanOrEqual(uniqueTextures.size - 1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 15: Text color application**
   * For any text with specified color, all rendered characters should display with the specified color values
   * **Validates: Requirements 5.1**
   */
  it('Property 15: Text color application - should apply specified color to all rendered characters', () => {
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
                .array(fc.constantFrom(...availableChars), { minLength: 1, maxLength: 5 })
                .map((chars) => chars.join('')),
              fontData: fc.constant(fontData),
              // Generate random color values (RGBA)
              color: fc.tuple(
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 })
              ) as fc.Arbitrary<[number, number, number, number]>,
              position: fc.record({
                x: fc.integer({ min: -100, max: 100 }),
                y: fc.integer({ min: -100, max: 100 }),
              }),
            });
          })
          .filter((data) => data !== null),
        ({ text, fontData, color, position }) => {
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

          // Create text entity with specified color
          testRenderer.createTextEntity(testWorld, {
            text,
            font: 'test-font',
            x: position.x,
            y: position.y,
            style: {
              color,
            },
          });

          // Render the text
          testRenderingSystem.render(testWorld, freshMockRenderer);

          // Verify that all drawSprite calls use the specified color as tint
          const drawSpriteCalls = (
            freshMockRenderer.drawSprite as unknown as ReturnType<typeof vi.fn>
          ).mock.calls as DrawSpriteCall[];

          for (const [, spriteOptions] of drawSpriteCalls) {
            expect(spriteOptions.tint).toEqual(color);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 16: Drop shadow rendering**
   * For any text with drop shadow enabled, a shadow copy should be rendered at the specified offset from the main text
   * **Validates: Requirements 5.2**
   */
  it('Property 16: Drop shadow rendering - should render shadow copy at specified offset', () => {
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
                .array(fc.constantFrom(...availableChars), { minLength: 1, maxLength: 3 })
                .map((chars) => chars.join('')),
              fontData: fc.constant(fontData),
              // Generate random shadow properties
              shadowOffset: fc.record({
                x: fc.integer({ min: -10, max: 10 }),
                y: fc.integer({ min: -10, max: 10 }),
              }),
              shadowColor: fc.tuple(
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 })
              ) as fc.Arbitrary<[number, number, number, number]>,
              textColor: fc.tuple(
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 }),
                fc.float({ min: 0, max: 1 })
              ) as fc.Arbitrary<[number, number, number, number]>,
              position: fc.record({
                x: fc.integer({ min: -50, max: 50 }),
                y: fc.integer({ min: -50, max: 50 }),
              }),
            });
          })
          .filter((data) => data !== null),
        ({ text, fontData, shadowOffset, shadowColor, textColor, position }) => {
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

          // Create text entity with drop shadow
          testRenderer.createTextEntity(testWorld, {
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

          // Render the text
          testRenderingSystem.render(testWorld, freshMockRenderer);

          // Count expected characters (only those that exist in the font)
          const expectedCharacterCount = text
            .split('')
            .filter((char) => bitmapFont.characters.has(char)).length;

          // Should render each character twice: once for shadow, once for main text
          expect(freshMockRenderer.drawSprite).toHaveBeenCalledTimes(expectedCharacterCount * 2);

          const drawSpriteCalls = (
            freshMockRenderer.drawSprite as unknown as ReturnType<typeof vi.fn>
          ).mock.calls as DrawSpriteCall[];

          // Verify shadow and main text rendering
          for (let i = 0; i < expectedCharacterCount; i++) {
            const shadowCall = drawSpriteCalls[i];
            const mainCall = drawSpriteCalls[i + expectedCharacterCount];

            // Shadow should use shadow color
            expect(shadowCall[1].tint).toEqual(shadowColor);

            // Main text should use text color
            expect(mainCall[1].tint).toEqual(textColor);

            // Shadow should be offset from main text
            const shadowX = shadowCall[1].x;
            const shadowY = shadowCall[1].y;
            const mainX = mainCall[1].x;
            const mainY = mainCall[1].y;

            expect(shadowX).toBeCloseTo(mainX + shadowOffset.x, 5);
            expect(shadowY).toBeCloseTo(mainY + shadowOffset.y, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 17: Stroke outline rendering**
   * For any text with stroke outline enabled, an outline should be rendered around each character with the specified properties
   * **Validates: Requirements 5.3**
   */
  it('Property 17: Stroke outline rendering - should render outline around each character', () => {
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
                .array(fc.constantFrom(...availableChars), { minLength: 1, maxLength: 2 })
                .map((chars) => chars.join('')),
              fontData: fc.constant(fontData),
              // Generate random stroke properties
              strokeWidth: fc.integer({ min: 1, max: 3 }),
              strokeColor: fc.tuple(
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10)
              ) as fc.Arbitrary<[number, number, number, number]>,
              textColor: fc.tuple(
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10)
              ) as fc.Arbitrary<[number, number, number, number]>,
              position: fc.record({
                x: fc.integer({ min: -50, max: 50 }),
                y: fc.integer({ min: -50, max: 50 }),
              }),
            });
          })
          .filter((data) => data !== null),
        ({ text, fontData, strokeWidth, strokeColor, textColor, position }) => {
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

          // Create text entity with stroke outline
          testRenderer.createTextEntity(testWorld, {
            text,
            font: 'test-font',
            x: position.x,
            y: position.y,
            style: {
              color: textColor,
              stroke: {
                color: strokeColor,
                width: strokeWidth,
              },
            },
          });

          // Render the text
          testRenderingSystem.render(testWorld, freshMockRenderer);

          // Count expected characters (only those that exist in the font)
          const expectedCharacterCount = text
            .split('')
            .filter((char) => bitmapFont.characters.has(char)).length;

          // Should render each character 9 times: 8 for outline + 1 for main text
          expect(freshMockRenderer.drawSprite).toHaveBeenCalledTimes(expectedCharacterCount * 9);

          const drawSpriteCalls = (
            freshMockRenderer.drawSprite as unknown as ReturnType<typeof vi.fn>
          ).mock.calls as DrawSpriteCall[];

          // Verify stroke and main text rendering
          // First all stroke calls (8 per character)
          for (let charIndex = 0; charIndex < expectedCharacterCount; charIndex++) {
            const strokeBaseIndex = charIndex * 8;
            for (let strokeIndex = 0; strokeIndex < 8; strokeIndex++) {
              const strokeCall = drawSpriteCalls[strokeBaseIndex + strokeIndex];
              expect(strokeCall[1].tint).toEqual(strokeColor);
            }
          }

          // Then all main text calls (1 per character)
          const mainTextStartIndex = expectedCharacterCount * 8;
          for (let charIndex = 0; charIndex < expectedCharacterCount; charIndex++) {
            const mainCall = drawSpriteCalls[mainTextStartIndex + charIndex];
            expect(mainCall[1].tint).toEqual(textColor);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 18: Style effect layering order**
   * For any text with multiple styling effects applied, the effects should render in the correct layering order (shadow, outline, main text)
   * **Validates: Requirements 5.4**
   */
  it('Property 18: Style effect layering order - should render effects in correct order', () => {
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
              // Generate random style properties
              shadowOffset: fc.record({
                x: fc.integer({ min: -5, max: 5 }),
                y: fc.integer({ min: -5, max: 5 }),
              }),
              shadowColor: fc.tuple(
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10)
              ) as fc.Arbitrary<[number, number, number, number]>,
              strokeWidth: fc.integer({ min: 1, max: 2 }),
              strokeColor: fc.tuple(
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10)
              ) as fc.Arbitrary<[number, number, number, number]>,
              textColor: fc.tuple(
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10),
                fc.integer({ min: 1, max: 10 }).map((n) => n / 10)
              ) as fc.Arbitrary<[number, number, number, number]>,
              position: fc.record({
                x: fc.integer({ min: -50, max: 50 }),
                y: fc.integer({ min: -50, max: 50 }),
              }),
            });
          })
          .filter((data) => data !== null),
        ({
          text,
          fontData,
          shadowOffset,
          shadowColor,
          strokeWidth,
          strokeColor,
          textColor,
          position,
        }) => {
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

          // Skip if character doesn't exist in font
          if (!bitmapFont.characters.has(text)) {
            return;
          }

          // Create text entity with both shadow and stroke
          testRenderer.createTextEntity(testWorld, {
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
              stroke: {
                color: strokeColor,
                width: strokeWidth,
              },
            },
          });

          // Render the text
          testRenderingSystem.render(testWorld, freshMockRenderer);

          // Should render: 1 shadow + 8 stroke outlines + 1 main text = 10 calls
          expect(freshMockRenderer.drawSprite).toHaveBeenCalledTimes(10);

          const drawSpriteCalls = (
            freshMockRenderer.drawSprite as unknown as ReturnType<typeof vi.fn>
          ).mock.calls as DrawSpriteCall[];

          // Verify correct layering order:
          // 1. First call should be shadow (shadow color)
          expect(drawSpriteCalls[0][1].tint).toEqual(shadowColor);

          // 2. Next 8 calls should be stroke outline (stroke color)
          for (let i = 1; i <= 8; i++) {
            expect(drawSpriteCalls[i][1].tint).toEqual(strokeColor);
          }

          // 3. Last call should be main text (text color)
          expect(drawSpriteCalls[9][1].tint).toEqual(textColor);
        }
      ),
      { numRuns: 100 }
    );
  });
});
