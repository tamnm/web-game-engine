export type ViewportMode = 'pixel-perfect' | 'letterbox' | 'crop' | 'fit';

export interface ViewportOptions {
  designWidth: number;
  designHeight: number;
  mode?: ViewportMode;
}

export interface ViewportState {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  scaledWidth: number;
  scaledHeight: number;
}

export class Viewport {
  readonly designWidth: number;
  readonly designHeight: number;
  mode: ViewportMode;

  constructor(options: ViewportOptions) {
    this.designWidth = Math.max(1, Math.floor(options.designWidth));
    this.designHeight = Math.max(1, Math.floor(options.designHeight));
    this.mode = options.mode ?? 'letterbox';
  }

  setMode(mode: ViewportMode): void {
    this.mode = mode;
  }

  compute(canvasWidth: number, canvasHeight: number): ViewportState {
    const dw = this.designWidth;
    const dh = this.designHeight;
    const cw = Math.max(1, Math.floor(canvasWidth));
    const ch = Math.max(1, Math.floor(canvasHeight));

    let scaleX = cw / dw;
    let scaleY = ch / dh;
    let offsetX = 0;
    let offsetY = 0;

    switch (this.mode) {
      case 'pixel-perfect': {
        const s = Math.max(1, Math.floor(Math.min(scaleX, scaleY)));
        scaleX = s;
        scaleY = s;
        const scaledW = dw * s;
        const scaledH = dh * s;
        offsetX = Math.floor((cw - scaledW) / 2);
        offsetY = Math.floor((ch - scaledH) / 2);
        return {
          offsetX,
          offsetY,
          scaleX,
          scaleY,
          scaledWidth: scaledW,
          scaledHeight: scaledH,
        };
      }
      case 'letterbox':
      case 'fit': {
        const s = Math.min(scaleX, scaleY);
        scaleX = s;
        scaleY = s;
        const scaledW = dw * s;
        const scaledH = dh * s;
        offsetX = (cw - scaledW) / 2;
        offsetY = (ch - scaledH) / 2;
        return { offsetX, offsetY, scaleX, scaleY, scaledWidth: scaledW, scaledHeight: scaledH };
      }
      case 'crop': {
        const s = Math.max(scaleX, scaleY);
        scaleX = s;
        scaleY = s;
        const scaledW = dw * s;
        const scaledH = dh * s;
        offsetX = (cw - scaledW) / 2;
        offsetY = (ch - scaledH) / 2;
        return { offsetX, offsetY, scaleX, scaleY, scaledWidth: scaledW, scaledHeight: scaledH };
      }
      default: {
        const scaledW = dw * scaleX;
        const scaledH = dh * scaleY;
        return { offsetX, offsetY, scaleX, scaleY, scaledWidth: scaledW, scaledHeight: scaledH };
      }
    }
  }

  applyToContext(ctx: CanvasRenderingContext2D): ViewportState {
    const canvas = ctx.canvas;
    const state = this.compute(canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(state.offsetX, state.offsetY);
    ctx.scale(state.scaleX, state.scaleY);
    return state;
  }
}
