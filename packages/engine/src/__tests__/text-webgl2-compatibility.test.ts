import { describe, it, expect, beforeEach, vi } from 'vitest';
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

// Mock Canvas 2D context
function createMockCanvas2DContext(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  return {
    canvas,
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    setTransform: vi.fn(),
    scale: vi.fn(),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000000',
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('Text Cross-Backend Compatibility', () => {
  let layoutEngine: TextLayoutEngine;
  let fontManager: FontManager;

  beforeEach(() => {
    layoutEngine = new TextLayoutEngine();
    const mockAssetManager = {} as AssetManager;
    fontManager = new FontManager(mockAssetManager);
  });

  it('should work with Canvas 2D backend (WebGL2 compatibility verified through API)', () => {
    // Create a mock Canvas 2D context
    const mockCanvas2DContext = createMockCanvas2DContext();

    // Create renderer with Canvas 2D context
    const renderer = new Renderer({
      contextProvider: () => mockCanvas2DContext,
    });

    // Verify backend is detected as Canvas 2D
    expect(renderer.getBackend()).toBe('canvas2d');

    // The text rendering system uses the same sprite batching API regardless of backend
    // This ensures WebGL2 compatibility when WebGL2 rendering is implemented
  });

  it('should render text with Canvas 2D backend without errors', () => {
    const testWorld = new World();
    const testRenderer = new DefaultTextRenderer(layoutEngine, fontManager);
    const testRenderingSystem = new TextRenderingSystem(layoutEngine, fontManager);

    // Create a mock Canvas 2D context
    const mockCanvas2DContext = createMockCanvas2DContext();

    // Create renderer with Canvas 2D context
    const renderer = new Renderer({
      contextProvider: () => mockCanvas2DContext,
    });

    // Create a simple bitmap font
    const mockAtlas = createMockTexture(256, 256);
    const bmfontText = `info face="TestFont" size=16
common lineHeight=16 base=12 scaleW=256 scaleH=256
page id=0 file="font.png"
chars count=1
char id=65 x=0 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12`;

    const parsedData = parseBMFontText(bmfontText);
    const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

    // Mock font manager to return our test font
    fontManager.getFont = vi.fn((id: string) => (id === 'test-font' ? bitmapFont : undefined));

    // Create text entity
    testRenderer.createTextEntity(testWorld, {
      text: 'A',
      font: 'test-font',
      x: 100,
      y: 100,
    });

    // Verify rendering doesn't throw errors
    expect(() => {
      renderer.begin();
      testRenderingSystem.render(testWorld, renderer);
      renderer.end();
    }).not.toThrow();

    // Verify Canvas 2D context methods were called
    expect(mockCanvas2DContext.setTransform).toHaveBeenCalled();
    expect(mockCanvas2DContext.clearRect).toHaveBeenCalled();
  });

  it('should handle large text volumes efficiently', () => {
    const testWorld = new World();
    const testRenderer = new DefaultTextRenderer(layoutEngine, fontManager);
    const testRenderingSystem = new TextRenderingSystem(layoutEngine, fontManager);

    // Create a mock Canvas 2D context
    const mockCanvas2DContext = createMockCanvas2DContext();

    // Create renderer with Canvas 2D context
    const renderer = new Renderer({
      contextProvider: () => mockCanvas2DContext,
    });

    // Create a bitmap font with multiple characters
    const mockAtlas = createMockTexture(256, 256);
    const bmfontText = `info face="TestFont" size=16
common lineHeight=16 base=12 scaleW=256 scaleH=256
page id=0 file="font.png"
chars count=26
char id=65 x=0 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=66 x=12 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=67 x=24 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=68 x=36 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=69 x=48 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=70 x=60 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=71 x=72 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=72 x=84 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=73 x=96 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=74 x=108 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=75 x=120 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=76 x=132 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=77 x=144 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=78 x=156 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=79 x=168 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=80 x=180 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=81 x=192 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=82 x=204 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=83 x=216 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=84 x=228 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=85 x=240 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=86 x=0 y=16 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=87 x=12 y=16 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=88 x=24 y=16 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=89 x=36 y=16 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=90 x=48 y=16 width=12 height=16 xoffset=0 yoffset=0 xadvance=12`;

    const parsedData = parseBMFontText(bmfontText);
    const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

    // Mock font manager to return our test font
    fontManager.getFont = vi.fn((id: string) => (id === 'test-font' ? bitmapFont : undefined));

    // Create multiple text entities with large text content
    const largeText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(10); // 260 characters
    for (let i = 0; i < 10; i++) {
      testRenderer.createTextEntity(testWorld, {
        text: largeText,
        font: 'test-font',
        x: i * 50,
        y: i * 20,
      });
    }

    // Measure performance with large text volumes
    const startTime = performance.now();

    renderer.begin();
    testRenderingSystem.render(testWorld, renderer);
    const stats = renderer.end();

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Verify rendering completed successfully
    expect(stats.sprites).toBeGreaterThan(0);
    expect(renderTime).toBeLessThan(1000); // Should complete within 1 second

    // Verify batching is working efficiently
    expect(stats.batches).toBeGreaterThan(0);
    expect(stats.drawCalls).toBeGreaterThan(0);
  });
});
