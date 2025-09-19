import { describe, expect, it, vi } from 'vitest';
import { Renderer } from '../rendering';
import type { Texture } from '../rendering';

function createTexture(id: string, width = 16, height = 16): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { id, width, height, source: canvas };
}

function createInstrumentedContext2D() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const composites: string[] = [];
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
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  Object.defineProperty(ctx as unknown as Record<string, unknown>, 'globalCompositeOperation', {
    get() {
      return composites[composites.length - 1] ?? 'source-over';
    },
    set(v: string) {
      composites.push(v);
    },
    configurable: true,
    enumerable: true,
  });
  return { ctx, composites };
}

describe('Blend modes and tint', () => {
  it('maps additive blend to lighter', () => {
    const { ctx, composites } = createInstrumentedContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const tex = createTexture('t');
    renderer.begin();
    renderer.drawSprite(tex, { x: 5, y: 6, blend: 'additive' });
    renderer.end();
    expect(composites).toContain('lighter');
  });

  it('applies color tint with multiply + destination-in mask', () => {
    const { ctx, composites } = createInstrumentedContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const tex = createTexture('t', 8, 8);
    renderer.begin();
    renderer.drawSprite(tex, { x: 0, y: 0, tint: [0.5, 0.25, 1, 0.8], origin: [0, 0] });
    renderer.end();
    // Expect multiply overlay then destination-in mask applied at least once
    expect(composites).toContain('multiply');
    expect(composites).toContain('destination-in');
    // drawImage should have been called more than once due to masking pass
    const drawImageMock = ctx.drawImage as unknown as ReturnType<typeof vi.fn>;
    expect(drawImageMock.mock.calls.length).toBeGreaterThan(1);
  });
});

describe('Post-process hook', () => {
  it('invokes post-process at end of frame on Canvas2D', () => {
    const { ctx } = createInstrumentedContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const hook = vi.fn();
    renderer.setPostProcess(hook);
    renderer.begin();
    renderer.end();
    expect(hook).toHaveBeenCalledTimes(1);
    expect(ctx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
  });
});
