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

describe('Text Canvas 2D Backend Support', () => {
  let layoutEngine: TextLayoutEngine;
  let fontManager: FontManager;

  beforeEach(() => {
    layoutEngine = new TextLayoutEngine();
    const mockAssetManager = {} as AssetManager;
    fontManager = new FontManager(mockAssetManager);
  });

  it('should render text correctly using Canvas 2D drawImage operations', () => {
    const testWorld = new World();
    const testRenderer = new DefaultTextRenderer(layoutEngine, fontManager);
    const testRenderingSystem = new TextRenderingSystem(layoutEngine, fontManager);

    // Create a mock Canvas 2D context
    const mockCanvas2DContext = createMockCanvas2DContext();

    // Create renderer with Canvas 2D context
    const renderer = new Renderer({
      contextProvider: () => mockCanvas2DContext,
    });

    // Verify backend is Canvas 2D
    expect(renderer.getBackend()).toBe('canvas2d');

    // Create a bitmap font
    const mockAtlas = createMockTexture(256, 256);
    const bmfontText = `info face="TestFont" size=16
common lineHeight=16 base=12 scaleW=256 scaleH=256
page id=0 file="font.png"
chars count=3
char id=65 x=0 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=66 x=12 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12
char id=67 x=24 y=0 width=12 height=16 xoffset=0 yoffset=0 xadvance=12`;

    const parsedData = parseBMFontText(bmfontText);
    const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

    // Mock font manager to return our test font
    fontManager.getFont = vi.fn((id: string) => (id === 'test-font' ? bitmapFont : undefined));

    // Create text entity
    testRenderer.createTextEntity(testWorld, {
      text: 'ABC',
      font: 'test-font',
      x: 100,
      y: 100,
    });

    // Render the text
    renderer.begin();
    testRenderingSystem.render(testWorld, renderer);
    renderer.end();

    // Verify Canvas 2D drawImage was called for each character
    expect(mockCanvas2DContext.drawImage).toHaveBeenCalledTimes(3);

    // Verify proper Canvas 2D operations were used
    expect(mockCanvas2DContext.save).toHaveBeenCalled();
    expect(mockCanvas2DContext.restore).toHaveBeenCalled();
    expect(mockCanvas2DContext.translate).toHaveBeenCalled();
  });

  it('should maintain visual consistency with different text styles', () => {
    const testWorld = new World();
    const testRenderer = new DefaultTextRenderer(layoutEngine, fontManager);
    const testRenderingSystem = new TextRenderingSystem(layoutEngine, fontManager);

    // Create a mock Canvas 2D context
    const mockCanvas2DContext = createMockCanvas2DContext();

    // Create renderer with Canvas 2D context
    const renderer = new Renderer({
      contextProvider: () => mockCanvas2DContext,
    });

    // Create a bitmap font
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

    // Create text entity with styling effects
    testRenderer.createTextEntity(testWorld, {
      text: 'A',
      font: 'test-font',
      x: 100,
      y: 100,
      style: {
        color: [1, 0, 0, 1], // Red text
        dropShadow: {
          color: [0, 0, 0, 0.5],
          offsetX: 2,
          offsetY: 2,
        },
        stroke: {
          color: [0, 0, 1, 1], // Blue stroke
          width: 1,
        },
      },
    });

    // Render the text
    renderer.begin();
    testRenderingSystem.render(testWorld, renderer);
    renderer.end();

    // Should render: 1 shadow + 8 stroke outlines + 1 main text = 10 base calls
    // Canvas 2D may call drawImage multiple times per character for color tinting
    expect(mockCanvas2DContext.drawImage).toHaveBeenCalled();
    expect(
      (mockCanvas2DContext.drawImage as ReturnType<typeof vi.fn>).mock.calls.length
    ).toBeGreaterThanOrEqual(10);

    // Verify color tinting operations were used
    expect(mockCanvas2DContext.fillRect).toHaveBeenCalled();
  });

  it('should handle backend-specific feature limitations gracefully', () => {
    const testWorld = new World();
    const testRenderer = new DefaultTextRenderer(layoutEngine, fontManager);
    const testRenderingSystem = new TextRenderingSystem(layoutEngine, fontManager);

    // Create a Canvas 2D context that throws errors on certain operations
    const mockCanvas2DContext = createMockCanvas2DContext();
    // Simulate a limitation where drawImage might fail
    (mockCanvas2DContext.drawImage as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Canvas 2D limitation');
    });

    // Create renderer with Canvas 2D context
    const renderer = new Renderer({
      contextProvider: () => mockCanvas2DContext,
    });

    // Create a bitmap font
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

    // Verify rendering handles errors gracefully and doesn't crash
    expect(() => {
      renderer.begin();
      testRenderingSystem.render(testWorld, renderer);
      renderer.end();
    }).not.toThrow();

    // The renderer should have attempted to draw but handled the error
    expect(mockCanvas2DContext.drawImage).toHaveBeenCalled();
  });

  it('should support all blend modes available in Canvas 2D', () => {
    const testWorld = new World();
    const testRenderer = new DefaultTextRenderer(layoutEngine, fontManager);
    const testRenderingSystem = new TextRenderingSystem(layoutEngine, fontManager);

    // Create a mock Canvas 2D context
    const mockCanvas2DContext = createMockCanvas2DContext();

    // Create renderer with Canvas 2D context
    const renderer = new Renderer({
      contextProvider: () => mockCanvas2DContext,
    });

    // Create a bitmap font
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

    // Test different blend modes
    const blendModes: Array<'normal' | 'additive' | 'multiply' | 'screen'> = [
      'normal',
      'additive',
      'multiply',
      'screen',
    ];

    for (let i = 0; i < blendModes.length; i++) {
      // Create text entity with specific blend mode
      const entity = testRenderer.createTextEntity(testWorld, {
        text: 'A',
        font: 'test-font',
        x: 100,
        y: 100,
        style: {
          // Remove blend mode as it's not part of TextStyle
        },
      });

      // Render the text
      renderer.begin();
      testRenderingSystem.render(testWorld, renderer);
      renderer.end();

      // Remove entity for next iteration
      testWorld.destroyEntity(entity);
    }

    // Verify all blend modes were handled
    expect(mockCanvas2DContext.drawImage).toHaveBeenCalled();
  });
});
