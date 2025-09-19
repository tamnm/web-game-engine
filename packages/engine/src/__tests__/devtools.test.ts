import { describe, expect, it, vi } from 'vitest';
import { Renderer, DevOverlay } from '..';
import type { Texture } from '../rendering';

function createMockContext2D(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
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

function createTexture(id: string, w = 8, h = 8): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { id, width: w, height: h, source: canvas };
}

describe('DevOverlay', () => {
  it('attaches to DOM and updates with renderer stats', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const overlay = new DevOverlay();
    overlay.attach();

    const tex = createTexture('t');
    renderer.begin();
    renderer.drawSprite(tex, { x: 1, y: 2 });
    const stats = renderer.end();
    overlay.update(stats);

    const el = overlay.element;
    expect(document.body.contains(el)).toBe(true);
    expect(el.textContent || '').toContain('DrawCalls');
    expect(el.textContent || '').toContain('Batches');
    expect(el.textContent || '').toContain('Sprites');
  });
});
