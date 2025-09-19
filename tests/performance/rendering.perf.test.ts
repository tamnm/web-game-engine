import { describe, expect, it, vi } from 'vitest';
import { Renderer } from '../../packages/engine/src/rendering';
import type { Texture } from '../../packages/engine/src/rendering';

function createMockContext2D(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
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

function makeTexture(id: string, w = 32, h = 32): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { id, width: w, height: h, source: canvas };
}

// Lenient thresholds to catch regressions without flakiness in CI
const THRESHOLDS = {
  batch5000_drawCalls_max: 10, // default maxBatchSize=1000 => expect 5
  frame1000_ms_max: 100, // should be well under on typical CI
};

describe('Rendering performance harness', () => {
  it('batches efficiently for many sprites with same texture', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const tex = makeTexture('shared');
    const N = 5000;
    renderer.begin();
    for (let i = 0; i < N; i++) {
      renderer.drawSprite(tex, { x: i % 512, y: ((i / 512) | 0) % 512, width: 8, height: 8 });
    }
    const stats = renderer.end();
    expect(stats.sprites).toBe(N);
    expect(stats.drawCalls).toBeLessThanOrEqual(THRESHOLDS.batch5000_drawCalls_max);
  });

  it('maintains reasonable frame time for 1000 sprites', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const tex = makeTexture('shared');
    const N = 1000;
    renderer.begin();
    for (let i = 0; i < N; i++) {
      renderer.drawSprite(tex, { x: (i * 3) % 512, y: (i * 7) % 512, width: 8, height: 8 });
    }
    const stats = renderer.end();
    expect(stats.sprites).toBe(N);
    // Allow generous ceiling; alerts when something goes very wrong
    expect(stats.frameTimeMs ?? 0).toBeLessThanOrEqual(THRESHOLDS.frame1000_ms_max);
  });
});
