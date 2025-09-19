import type { RenderBackend } from '../types';

export function isWebGL2Available(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  const Ctor = (window as unknown as { WebGL2RenderingContext?: unknown }).WebGL2RenderingContext;
  if (!Ctor) return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return !!gl;
  } catch {
    return false;
  }
}

export function detectBackendForCanvas(canvas: HTMLCanvasElement): RenderBackend {
  try {
    const gl = canvas.getContext('webgl2');
    type GL2Ctor = new (...args: unknown[]) => unknown;
    const GL2 = (window as unknown as { WebGL2RenderingContext?: GL2Ctor }).WebGL2RenderingContext;
    if (gl && GL2 && gl instanceof (GL2 as GL2Ctor)) {
      return 'webgl2';
    }
  } catch {
    // ignore and fallback
  }
  const ctx2d = canvas.getContext('2d');
  return ctx2d ? 'canvas2d' : 'none';
}
