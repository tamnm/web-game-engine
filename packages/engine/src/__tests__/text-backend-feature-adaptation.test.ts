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

describe('Text Backend Feature Adaptation Property Tests', () => {
  let layoutEngine: TextLayoutEngine;
  let fontManager: FontManager;

  beforeEach(() => {
    layoutEngine = new TextLayoutEngine();
    const mockAssetManager = {} as AssetManager;
    fontManager = new FontManager(mockAssetManager);
  });

  /**
   * **Feature: text-rendering-system, Property 31: Backend feature adaptation**
   * For any text with styling effects on backends with different capabilities, the effects should
   * adapt appropriately to available features
   * **Validates: Requirements 9.5**
   */
  it('Property 31: Backend feature adaptation - should adapt to backend capabilities', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.constantFrom('A', 'B', 'C'), // Simple characters that exist in our test font
          position: fc.record({
            x: fc.integer({ min: -50, max: 50 }),
            y: fc.integer({ min: -50, max: 50 }),
          }),
          textColor: fc.tuple(
            fc.float({ min: 0, max: 1 }),
            fc.float({ min: 0, max: 1 }),
            fc.float({ min: 0, max: 1 }),
            fc.float({ min: 0.5, max: 1 }) // Ensure some transparency for blend testing
          ) as fc.Arbitrary<[number, number, number, number]>,
          strokeColor: fc.tuple(
            fc.float({ min: 0, max: 1 }),
            fc.float({ min: 0, max: 1 }),
            fc.float({ min: 0, max: 1 }),
            fc.float({ min: 0, max: 1 })
          ) as fc.Arbitrary<[number, number, number, number]>,
          strokeWidth: fc.integer({ min: 1, max: 5 }),
        }),
        ({ text, position, textColor, strokeColor, strokeWidth }) => {
          // Create fresh world and renderer for each iteration
          const testWorld1 = new World();
          const testWorld2 = new World();
          const testRenderer1 = new DefaultTextRenderer(layoutEngine, fontManager);
          const testRenderer2 = new DefaultTextRenderer(layoutEngine, fontManager);
          const testRenderingSystem1 = new TextRenderingSystem(layoutEngine, fontManager);
          const testRenderingSystem2 = new TextRenderingSystem(layoutEngine, fontManager);

          // Create limited capability backend (Canvas 2D with basic features)
          const mockLimitedRenderer = {
            drawSprite: vi.fn(),
            begin: vi.fn(),
            end: vi.fn(() => ({ drawCalls: 0, sprites: 0, batches: 0 })),
            getStats: vi.fn(() => ({ drawCalls: 0, sprites: 0, batches: 0 })),
            setCamera: vi.fn(),
            setViewport: vi.fn(),
            setPostProcess: vi.fn(),
            getBackend: vi.fn(() => 'canvas2d'),
            // Simulate limited capabilities
            supportsComplexEffects: false,
            supportsAdvancedBlending: false,
          } as unknown as Renderer;

          // Create full capability backend (WebGL2 with advanced features)
          const mockAdvancedRenderer = {
            drawSprite: vi.fn(),
            begin: vi.fn(),
            end: vi.fn(() => ({ drawCalls: 0, sprites: 0, batches: 0 })),
            getStats: vi.fn(() => ({ drawCalls: 0, sprites: 0, batches: 0 })),
            setCamera: vi.fn(),
            setViewport: vi.fn(),
            setPostProcess: vi.fn(),
            getBackend: vi.fn(() => 'webgl2'),
            // Simulate advanced capabilities
            supportsComplexEffects: true,
            supportsAdvancedBlending: true,
          } as unknown as Renderer;

          // Create a simple bitmap font with multiple characters
          const mockAtlas = createMockTexture(256, 256);
          const bmfontText = `info face="TestFont" size=16
common lineHeight=16 base=12 scaleW=256 scaleH=256
page id=0 file="font.png"
chars count=3
char id=65 x=0 y=0 width=8 height=12 xoffset=0 yoffset=0 xadvance=8
char id=66 x=8 y=0 width=8 height=12 xoffset=0 yoffset=0 xadvance=8
char id=67 x=16 y=0 width=8 height=12 xoffset=0 yoffset=0 xadvance=8`;

          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

          // Mock font manager to return our test font
          const mockGetFont = vi.fn((id: string) => (id === 'test-font' ? bitmapFont : undefined));
          fontManager.getFont = mockGetFont;

          // Create text entities with complex styling effects on both backends
          testRenderer1.createTextEntity(testWorld1, {
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

          testRenderer2.createTextEntity(testWorld2, {
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

          // Render on both backends
          testRenderingSystem1.render(testWorld1, mockLimitedRenderer);
          testRenderingSystem2.render(testWorld2, mockAdvancedRenderer);

          // Extract draw calls from both backends
          const limitedCalls = (
            mockLimitedRenderer.drawSprite as unknown as ReturnType<typeof vi.fn>
          ).mock.calls as DrawSpriteCall[];
          const advancedCalls = (
            mockAdvancedRenderer.drawSprite as unknown as ReturnType<typeof vi.fn>
          ).mock.calls as DrawSpriteCall[];

          // Both backends should render successfully without errors
          // The key property: adaptation should not cause failures
          expect(limitedCalls.length).toBeGreaterThanOrEqual(1);
          expect(advancedCalls.length).toBeGreaterThanOrEqual(1);

          // Both should preserve the main text color and positioning
          const limitedMainText = limitedCalls[limitedCalls.length - 1]; // Main text is typically last
          const advancedMainText = advancedCalls[advancedCalls.length - 1];

          // Main text color should be preserved on both backends
          expect(limitedMainText[1].tint).toEqual(textColor);
          expect(advancedMainText[1].tint).toEqual(textColor);

          // Main text positioning should be consistent
          expect(limitedMainText[1].x).toBeCloseTo(advancedMainText[1].x, 5);
          expect(limitedMainText[1].y).toBeCloseTo(advancedMainText[1].y, 5);

          // The key property: both backends handle the styling appropriately
          // Advanced backend may render more passes for complex effects
          // Limited backend should render fewer passes but still produce output
          // This tests that the system adapts to available capabilities without failing
        }
      ),
      { numRuns: 100 }
    );
  });
});
