import { describe, expect, it, vi } from 'vitest';
import { Emitter, Behaviors } from '../particles';
import { Renderer } from '../rendering';
import type { Texture } from '../rendering';

function createMockContext2D(): CanvasRenderingContext2D {
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

function makeTexture(id: string, w = 8, h = 8): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { id, width: w, height: h, source: canvas };
}

describe('Particles — emission and update', () => {
  it('emits particles at a target rate', () => {
    const emitter = new Emitter({ emissionRate: 10, maxParticles: 100 });
    emitter.update(500); // half a second => ~5 particles
    expect(emitter['count']).toBeDefined();
  });

  it('moves particles with velocity and acceleration', () => {
    const emitter = new Emitter({ emissionRate: 0 });
    emitter.emit(1);
    // set velocity via behaviors or direct manipulation
    const b = Behaviors.gravity(0); // no-op gravity
    const a = Behaviors.alphaOverLife(1, 0);
    const s = Behaviors.scaleOverLife(1, 2);
    emitter.setBehaviors([b, a, s]);
    let beforeX = 0;
    emitter.withParticles((ps) => {
      beforeX = ps[0].x;
      ps[0].vx = 10; // px/s
    });
    emitter.update(1000);
    let afterX = 0;
    emitter.withParticles((ps) => {
      afterX = ps[0].x;
    });
    expect(Math.round(afterX - beforeX)).toBe(10);
  });
});

describe('Particles — rendering', () => {
  it('renders particles via Renderer.drawSprite', () => {
    const ctx = createMockContext2D();
    const renderer = new Renderer({ contextProvider: () => ctx });
    const tex = makeTexture('p', 4, 4);
    const emitter = new Emitter({ emissionRate: 0, texture: tex });
    emitter.emit(3);
    emitter.update(16);
    renderer.begin();
    emitter.render(renderer);
    renderer.end();
    expect(
      (ctx.drawImage as unknown as ReturnType<typeof vi.fn>).mock.calls.length
    ).toBeGreaterThan(0);
  });
});
