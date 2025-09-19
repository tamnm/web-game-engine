import { RenderContext, RenderStats, SpriteDrawOptions, Texture, TextureRegion } from './types';
import { Camera2D } from './camera/Camera2D';
import { Viewport } from './viewport/Viewport';

const IDENTITY_TINT: [number, number, number, number] = [1, 1, 1, 1];

export interface RendererOptions {
  canvas?: HTMLCanvasElement;
  contextProvider?: () => RenderContext | null;
  maxBatchSize?: number;
}

interface SpriteBatchCommand {
  texture: Texture;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  tint: [number, number, number, number];
  origin: [number, number];
  parallax: [number, number];
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface SpriteBatch {
  texture: Texture;
  commands: SpriteBatchCommand[];
}

function isTextureRegion(source: Texture | TextureRegion): source is TextureRegion {
  return (source as TextureRegion).texture !== undefined && 'x' in source;
}

export class Renderer {
  private readonly context: RenderContext | null;
  private stats: RenderStats = { drawCalls: 0, sprites: 0, batches: 0 };
  private drawing = false;
  private currentBatch: SpriteBatch | null = null;
  private readonly maxBatchSize: number;
  private camera: Camera2D | null = null;
  private viewport: Viewport | null = null;

  constructor(options: RendererOptions = {}) {
    if (options.contextProvider) {
      this.context = options.contextProvider();
    } else if (options.canvas) {
      this.context = options.canvas.getContext('webgl2') ?? options.canvas.getContext('2d');
    } else {
      this.context = null;
    }
    this.maxBatchSize = Math.max(1, options.maxBatchSize ?? 1000);
  }

  begin(): void {
    this.stats = { drawCalls: 0, sprites: 0, batches: 0 };
    this.drawing = true;
    this.currentBatch = null;
    if (this.context && 'clearColor' in this.context) {
      this.context.clearColor(0, 0, 0, 1);
      (this.context as WebGL2RenderingContext).clear(
        (this.context as WebGL2RenderingContext).COLOR_BUFFER_BIT
      );
    } else if (this.context) {
      const ctx2d = this.context as CanvasRenderingContext2D;
      ctx2d.setTransform(1, 0, 0, 1, 0, 0);
      ctx2d.clearRect(0, 0, ctx2d.canvas.width, ctx2d.canvas.height);
      if (this.viewport) {
        this.viewport.applyToContext(ctx2d);
      }
    }
  }

  setCamera(camera: Camera2D | null): void {
    this.camera = camera;
  }

  setViewport(viewport: Viewport | null): void {
    this.viewport = viewport;
  }

  drawSprite(source: Texture | TextureRegion, options: SpriteDrawOptions): void {
    if (!this.drawing) {
      throw new Error('Renderer.begin() must be called before drawing');
    }
    const command = this.prepareCommand(source, options);
    this.enqueue(command);
    this.stats.sprites += 1;
  }

  end(): RenderStats {
    this.flushCurrentBatch();
    this.drawing = false;
    return { ...this.stats };
  }

  private prepareCommand(
    source: Texture | TextureRegion,
    options: SpriteDrawOptions
  ): SpriteBatchCommand {
    const regionSource = isTextureRegion(source) ? source : undefined;
    const region = regionSource
      ? {
          x: regionSource.x,
          y: regionSource.y,
          width: regionSource.width,
          height: regionSource.height,
        }
      : undefined;
    const texture = regionSource ? regionSource.texture : (source as Texture);
    const width = options.width ?? region?.width ?? texture.width;
    const height = options.height ?? region?.height ?? texture.height;
    const origin = options.origin ?? regionSource?.origin ?? [0.5, 0.5];
    const tint = options.tint ?? IDENTITY_TINT;
    const parallax: [number, number] = options.parallax ?? [1, 1];
    return {
      texture,
      x: options.x,
      y: options.y,
      width,
      height,
      rotation: options.rotation ?? 0,
      tint,
      origin,
      parallax,
      region,
    };
  }

  private enqueue(command: SpriteBatchCommand): void {
    const texture = command.texture;
    if (!this.currentBatch || this.currentBatch.texture.id !== texture.id) {
      this.flushCurrentBatch();
      this.currentBatch = { texture, commands: [] };
    }
    this.currentBatch.commands.push(command);
    if (this.currentBatch.commands.length >= this.maxBatchSize) {
      this.flushCurrentBatch();
    }
  }

  private flushCurrentBatch(): void {
    if (!this.currentBatch || this.currentBatch.commands.length === 0) {
      return;
    }
    if (this.context && !this.isWebGLContext(this.context)) {
      for (const command of this.currentBatch.commands) {
        this.drawSpriteCanvas(command);
      }
    }
    this.stats.drawCalls += 1;
    this.stats.batches += 1;
    this.currentBatch = null;
  }

  private drawSpriteCanvas(command: SpriteBatchCommand): void {
    const ctx = this.context as CanvasRenderingContext2D | null;
    const { texture } = command;
    if (!ctx || !texture.source) return;
    const { origin, tint } = command;
    const cam = this.camera;
    const shake = cam?.shakeOffset ?? { x: 0, y: 0 };
    const zoom = cam?.zoom ?? 1;
    const camX = (cam?.x ?? 0) + shake.x;
    const camY = (cam?.y ?? 0) + shake.y;
    const tx = (command.x - camX * command.parallax[0]) * zoom;
    const ty = (command.y - camY * command.parallax[1]) * zoom;
    ctx.save();
    ctx.translate(tx, ty);
    if (command.rotation) {
      ctx.rotate(command.rotation);
    }
    ctx.globalAlpha = tint[3];
    if (command.region) {
      ctx.drawImage(
        texture.source,
        command.region.x,
        command.region.y,
        command.region.width,
        command.region.height,
        -command.width * origin[0] * zoom,
        -command.height * origin[1] * zoom,
        command.width * zoom,
        command.height * zoom
      );
    } else {
      ctx.drawImage(
        texture.source,
        -command.width * origin[0] * zoom,
        -command.height * origin[1] * zoom,
        command.width * zoom,
        command.height * zoom
      );
    }
    ctx.restore();
  }

  private isWebGLContext(ctx: RenderContext): ctx is WebGL2RenderingContext {
    return typeof WebGL2RenderingContext !== 'undefined' && ctx instanceof WebGL2RenderingContext;
  }
}
