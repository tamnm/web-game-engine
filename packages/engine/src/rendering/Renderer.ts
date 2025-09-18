import { RenderContext, RenderStats, SpriteDrawOptions, Texture } from './types';

const IDENTITY_TINT: [number, number, number, number] = [1, 1, 1, 1];

export interface RendererOptions {
  canvas?: HTMLCanvasElement;
  contextProvider?: () => RenderContext | null;
}

export class Renderer {
  private readonly context: RenderContext | null;
  private stats: RenderStats = { drawCalls: 0, sprites: 0, batches: 0 };
  private drawing = false;

  constructor(options: RendererOptions = {}) {
    if (options.contextProvider) {
      this.context = options.contextProvider();
    } else if (options.canvas) {
      this.context = options.canvas.getContext('webgl2') ?? options.canvas.getContext('2d');
    } else {
      this.context = null;
    }
  }

  begin(): void {
    this.stats = { drawCalls: 0, sprites: 0, batches: 0 };
    this.drawing = true;
    if (this.context && 'clearColor' in this.context) {
      this.context.clearColor(0, 0, 0, 1);
      (this.context as WebGL2RenderingContext).clear(
        (this.context as WebGL2RenderingContext).COLOR_BUFFER_BIT
      );
    } else if (this.context) {
      (this.context as CanvasRenderingContext2D).clearRect(
        0,
        0,
        (this.context as CanvasRenderingContext2D).canvas.width,
        (this.context as CanvasRenderingContext2D).canvas.height
      );
    }
  }

  drawSprite(texture: Texture, options: SpriteDrawOptions): void {
    if (!this.drawing) {
      throw new Error('Renderer.begin() must be called before drawing');
    }
    this.stats.drawCalls += 1;
    this.stats.sprites += 1;
    if (this.context && !(this.context instanceof WebGL2RenderingContext)) {
      this.drawSpriteCanvas(texture, options);
    }
  }

  end(): RenderStats {
    this.drawing = false;
    this.stats.batches = Math.max(1, this.stats.drawCalls);
    return { ...this.stats };
  }

  private drawSpriteCanvas(texture: Texture, options: SpriteDrawOptions): void {
    const ctx = this.context as CanvasRenderingContext2D | null;
    if (!ctx || !texture.source) return;
    const origin = options.origin ?? [0.5, 0.5];
    const tint = options.tint ?? IDENTITY_TINT;
    ctx.save();
    ctx.translate(options.x, options.y);
    const rotation = options.rotation ?? 0;
    ctx.rotate(rotation);
    ctx.globalAlpha = tint[3];
    ctx.drawImage(
      texture.source,
      -options.width * origin[0],
      -options.height * origin[1],
      options.width,
      options.height
    );
    ctx.restore();
  }
}
