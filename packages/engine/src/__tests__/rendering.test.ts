import { describe, expect, it, vi } from 'vitest';
import { Renderer, TextureAtlas } from '../rendering';
import type { Texture, TextureAtlasDefinition } from '../rendering';

function createMockContext2D(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = {
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
  } as unknown as CanvasRenderingContext2D;
  return ctx;
}

function createTexture(id: string, width = 32, height = 32): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return {
    id,
    width,
    height,
    source: canvas,
  };
}

describe('Renderer batching', () => {
  it('groups sprites sharing a texture into one draw call', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const texture = createTexture('shared');

    renderer.begin();
    renderer.drawSprite(texture, { x: 0, y: 0, width: 16, height: 16 });
    renderer.drawSprite(texture, { x: 32, y: 32, width: 16, height: 16 });
    renderer.drawSprite(texture, { x: 64, y: 64, width: 16, height: 16 });
    const stats = renderer.end();

    expect(stats.drawCalls).toBe(1);
    expect(stats.batches).toBe(1);
    expect(stats.sprites).toBe(3);
    expect(ctx.drawImage).toHaveBeenCalledTimes(3);
  });

  it('flushes batch when texture changes', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const first = createTexture('first');
    const second = createTexture('second');

    renderer.begin();
    renderer.drawSprite(first, { x: 0, y: 0 });
    renderer.drawSprite(second, { x: 10, y: 12 });
    const stats = renderer.end();

    expect(stats.drawCalls).toBe(2);
    expect(stats.batches).toBe(2);
    expect(stats.sprites).toBe(2);
  });

  it('enforces max batch size threshold', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx, maxBatchSize: 2 });
    const texture = createTexture('limited');

    renderer.begin();
    renderer.drawSprite(texture, { x: 0, y: 0 });
    renderer.drawSprite(texture, { x: 10, y: 10 });
    renderer.drawSprite(texture, { x: 20, y: 20 });
    const stats = renderer.end();

    expect(stats.drawCalls).toBe(2);
    expect(stats.batches).toBe(2);
    expect(stats.sprites).toBe(3);
  });
});

describe('Texture atlas integration', () => {
  it('renders atlas regions using sprite batching', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const texture = createTexture('atlas', 64, 64);
    const frames: TextureAtlasDefinition = {
      hero: { x: 4, y: 12, width: 16, height: 24, origin: [0.25, 0.75] },
    };
    const atlas = new TextureAtlas(texture, frames);

    renderer.begin();
    renderer.drawSprite(atlas.getRegion('hero'), { x: 32, y: 48 });
    renderer.end();

    expect(ctx.drawImage).toHaveBeenCalledTimes(1);
    expect(ctx.drawImage).toHaveBeenCalledWith(
      texture.source,
      4,
      12,
      16,
      24,
      -16 * 0.25,
      -24 * 0.75,
      16,
      24
    );
  });

  it('lists and guards atlas regions', () => {
    const texture = createTexture('atlas');
    const atlas = new TextureAtlas(texture, {
      idle: { x: 0, y: 0, width: 8, height: 8 },
    });

    expect(atlas.hasRegion('idle')).toBe(true);
    expect(atlas.listRegions()).toContain('idle');
    expect(() => atlas.getRegion('missing')).toThrowError('Unknown atlas frame: missing');
  });
});
