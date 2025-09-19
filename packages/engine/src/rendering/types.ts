export interface SpriteDrawOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  tint?: [number, number, number, number];
  origin?: [number, number];
  parallax?: [number, number]; // (1,1)=world space; (0,0)=screen-space
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

export interface TextureRegion {
  readonly texture: Texture;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly origin?: [number, number];
}

export interface TextureAtlasFrameDefinition {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly origin?: [number, number];
}

export type TextureAtlasDefinition = Record<string, TextureAtlasFrameDefinition>;
