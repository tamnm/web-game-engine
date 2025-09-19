import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Renderer, Features } from '../rendering';
import type { RenderBackend } from '../rendering';

function createMock2D(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
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

describe('Feature detection and fallback', () => {
  it('reports WebGL2 unavailable by default in jsdom', () => {
    expect(Features.isWebGL2Available()).toBe(false);
  });

  it('uses Canvas2D backend when WebGL2 not available', () => {
    const ctx2d = createMock2D();
    const fakeCanvas = {
      width: 128,
      height: 128,
      getContext: (id: string) => (id === '2d' ? ctx2d : null),
    } as unknown as HTMLCanvasElement;
    const renderer = new Renderer({ canvas: fakeCanvas });
    expect(renderer.getBackend()).toBe<RenderBackend>('canvas2d');
    renderer.begin();
    // No draw yet; just ensure begin() touches 2D APIs
    expect(ctx2d.setTransform as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled();
  });

  describe('with mocked WebGL2 support', () => {
    const originalGL = (globalThis as unknown as { WebGL2RenderingContext?: unknown })
      .WebGL2RenderingContext;
    beforeEach(() => {
      (
        globalThis as unknown as { WebGL2RenderingContext: new () => object }
      ).WebGL2RenderingContext = class {} as unknown as new () => object;
    });
    afterEach(() => {
      (globalThis as unknown as { WebGL2RenderingContext?: unknown }).WebGL2RenderingContext =
        originalGL;
    });

    it('detects WebGL2 when canvas provides a GL context', () => {
      const GLCtor = (
        globalThis as unknown as { WebGL2RenderingContext: new () => Record<string, unknown> }
      ).WebGL2RenderingContext;
      const gl = new GLCtor();
      (gl as Record<string, unknown>).clearColor = vi.fn();
      (gl as Record<string, unknown>).clear = vi.fn();
      (gl as Record<string, unknown>).COLOR_BUFFER_BIT = 0x4000;
      const fakeCanvas = {
        width: 128,
        height: 128,
        getContext: (id: string) => (id === 'webgl2' ? (gl as unknown as RenderingContext) : null),
      } as unknown as HTMLCanvasElement;
      const renderer = new Renderer({ canvas: fakeCanvas });
      expect(renderer.getBackend()).toBe<RenderBackend>('webgl2');
      renderer.begin();
      const clearColor = (gl as Record<string, unknown>).clearColor as unknown as ReturnType<
        typeof vi.fn
      >;
      const clear = (gl as Record<string, unknown>).clear as unknown as ReturnType<typeof vi.fn>;
      const bit = (gl as Record<string, unknown>).COLOR_BUFFER_BIT as number;
      expect(clearColor).toHaveBeenCalledWith(0, 0, 0, 1);
      expect(clear).toHaveBeenCalledWith(bit);
    });
  });
});
