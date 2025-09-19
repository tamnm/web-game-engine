import { describe, expect, it, vi } from 'vitest';
import { Renderer, Camera2D } from '../rendering';
import type { Texture } from '../rendering';

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

describe('Camera2D parallax and zoom', () => {
  it('applies camera translation to world-space sprites', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const camera = new Camera2D();
    renderer.setCamera(camera);
    const texture = createTexture('t');

    camera.setPosition(100, 50);
    renderer.begin();
    renderer.drawSprite(texture, { x: 150, y: 80 });
    renderer.end();

    expect(ctx.translate).toHaveBeenCalledWith(50, 30);
  });

  it('ignores camera offset for screen-space sprites (parallax 0,0)', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const camera = new Camera2D();
    renderer.setCamera(camera);
    const texture = createTexture('t');

    camera.setPosition(100, 50);
    renderer.begin();
    renderer.drawSprite(texture, { x: 150, y: 80, parallax: [0, 0] });
    renderer.end();

    expect(ctx.translate).toHaveBeenCalledWith(150, 80);
  });

  it('scales positions and sizes with zoom', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const camera = new Camera2D();
    renderer.setCamera(camera);
    const texture = createTexture('t', 16, 24);

    camera.setZoom(2);
    renderer.begin();
    renderer.drawSprite(texture, { x: 10, y: 20, width: 16, height: 24, origin: [0, 0] });
    renderer.end();

    // position is scaled
    expect(ctx.translate).toHaveBeenCalledWith(20, 40);
    // dest width/height are scaled
    expect(ctx.drawImage).toHaveBeenCalledWith(texture.source, -0, -0, 32, 48);
  });
});

describe('Camera2D shake', () => {
  it('produces transient shake offset that decays to zero', () => {
    const camera = new Camera2D();
    camera.shake({ intensity: 10, durationMs: 1000, frequencyHz: 25 });

    camera.update(16);
    const o1 = camera.shakeOffset;
    expect(Math.abs(o1.x) + Math.abs(o1.y)).toBeGreaterThan(0);

    camera.update(1000); // finish
    const o2 = camera.shakeOffset;
    expect(o2.x).toBe(0);
    expect(o2.y).toBe(0);
  });
});
