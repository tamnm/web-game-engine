import type { RenderStats } from '../rendering';

export interface DevOverlayOptions {
  container?: HTMLElement;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export class DevOverlay {
  private readonly container: HTMLElement;
  private readonly el: HTMLDivElement;
  private lastFps = 0;

  constructor(options: DevOverlayOptions = {}) {
    this.container = options.container ?? document.body;
    this.el = document.createElement('div');
    const pos = options.position ?? 'top-left';
    const style = this.el.style;
    style.position = 'fixed';
    style.zIndex = '99999';
    style.pointerEvents = 'none';
    style.fontFamily = 'monospace';
    style.fontSize = '12px';
    style.color = '#0f0';
    style.background = 'rgba(0,0,0,0.6)';
    style.padding = '6px 8px';
    style.whiteSpace = 'pre';
    switch (pos) {
      case 'top-right':
        style.top = '8px';
        style.right = '8px';
        break;
      case 'bottom-left':
        style.bottom = '8px';
        style.left = '8px';
        break;
      case 'bottom-right':
        style.bottom = '8px';
        style.right = '8px';
        break;
      default:
        style.top = '8px';
        style.left = '8px';
    }
  }

  attach(): void {
    if (!this.el.isConnected) {
      this.container.appendChild(this.el);
    }
  }

  detach(): void {
    if (this.el.parentElement) {
      this.el.parentElement.removeChild(this.el);
    }
  }

  update(stats: RenderStats): void {
    const ms = Math.round((stats.frameTimeMs ?? 0) * 10) / 10;
    const fps =
      stats.frameTimeMs && stats.frameTimeMs > 0
        ? Math.round(1000 / stats.frameTimeMs)
        : this.lastFps;
    if (fps > 0) this.lastFps = fps;
    const lines = [
      `FPS: ${this.lastFps || '--'}  ms: ${ms}`,
      `DrawCalls: ${stats.drawCalls}  Batches: ${stats.batches}  Sprites: ${stats.sprites}`,
    ];
    this.el.textContent = lines.join('\n');
  }

  get element(): HTMLDivElement {
    return this.el;
  }
}
