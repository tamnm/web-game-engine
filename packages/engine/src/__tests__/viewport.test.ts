import { describe, expect, it, vi } from 'vitest';
import { Renderer, Viewport } from '../rendering';

function createMockContext2D(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 200;
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

describe('Viewport scaling', () => {
  it('applies pixel-perfect integer scaling with centering', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const vp = new Viewport({ designWidth: 160, designHeight: 90, mode: 'pixel-perfect' });
    renderer.setViewport(vp);

    renderer.begin();
    renderer.end();

    expect(ctx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    // scale = floor(min(300/160=1.875, 200/90=2.22)) = 1, offsets = (70, 55)
    expect(ctx.translate).toHaveBeenCalledWith(70, 55);
    expect(ctx.scale).toHaveBeenCalledWith(1, 1);
  });

  it('applies letterbox (contain) scaling with centering', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const vp = new Viewport({ designWidth: 200, designHeight: 200, mode: 'letterbox' });
    renderer.setViewport(vp);

    renderer.begin();
    renderer.end();

    // min(300/200=1.5, 200/200=1) => 1, offsets (50,0)
    expect(ctx.translate).toHaveBeenCalledWith(50, 0);
    expect(ctx.scale).toHaveBeenCalledWith(1, 1);
  });

  it('applies crop (cover) scaling with centering', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const vp = new Viewport({ designWidth: 200, designHeight: 200, mode: 'crop' });
    renderer.setViewport(vp);

    renderer.begin();
    renderer.end();

    // max(300/200=1.5, 200/200=1) => 1.5, offsets ((300-300)/2=0,(200-300)/2=-50)
    expect(ctx.translate).toHaveBeenCalledWith(0, -50);
    expect(ctx.scale).toHaveBeenCalledWith(1.5, 1.5);
  });

  it('fit behaves like letterbox (no distortion)', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const vp = new Viewport({ designWidth: 200, designHeight: 200, mode: 'fit' });
    renderer.setViewport(vp);

    renderer.begin();
    renderer.end();

    // same as letterbox test
    expect(ctx.translate).toHaveBeenCalledWith(50, 0);
    expect(ctx.scale).toHaveBeenCalledWith(1, 1);
  });
});
