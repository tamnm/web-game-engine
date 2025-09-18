export interface SpriteDrawOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  tint?: [number, number, number, number];
  origin?: [number, number];
}

export interface RenderStats {
  drawCalls: number;
  sprites: number;
  batches: number;
}

export type RenderContext = WebGL2RenderingContext | CanvasRenderingContext2D;

export interface Texture {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly source: HTMLImageElement | HTMLCanvasElement | ImageBitmap | null;
}
