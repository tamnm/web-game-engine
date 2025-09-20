import { Renderer } from '../rendering/Renderer';
import type { RendererOptions } from '../rendering/Renderer';
import type { SpriteDrawOptions, RenderStats, Texture, TextureRegion } from '../rendering';

function isTextureRegion(source: Texture | TextureRegion): source is TextureRegion {
  return (source as TextureRegion).texture !== undefined && 'x' in source;
}

export interface RecordedSpriteCommand {
  textureId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  tint: [number, number, number, number];
  origin: [number, number];
  parallax: [number, number];
  blend?: 'normal' | 'additive' | 'multiply' | 'screen';
}

export interface RecordedFrame {
  commands: RecordedSpriteCommand[];
  stats: RenderStats;
}

/**
 * Headless renderer variant that records draw commands without touching DOM APIs.
 */
export class HeadlessRenderer extends Renderer {
  private currentFrame: RecordedSpriteCommand[] | null = null;
  private readonly frames: RecordedFrame[] = [];

  constructor(options: RendererOptions = {}) {
    super({ ...options, contextProvider: () => null });
  }

  override begin(): void {
    super.begin();
    this.currentFrame = [];
  }

  override drawSprite(source: Texture | TextureRegion, options: SpriteDrawOptions): void {
    if (!this.currentFrame) {
      throw new Error('HeadlessRenderer.drawSprite called outside begin/end');
    }
    const region = isTextureRegion(source) ? source : undefined;
    const texture = region?.texture ?? (source as Texture);
    const width = options.width ?? region?.width ?? texture.width;
    const height = options.height ?? region?.height ?? texture.height;
    const tint = options.tint ?? [1, 1, 1, 1];
    const origin = options.origin ?? region?.origin ?? [0.5, 0.5];
    const parallax: [number, number] = options.parallax ?? [1, 1];
    this.currentFrame.push({
      textureId: texture.id,
      x: options.x,
      y: options.y,
      width,
      height,
      rotation: options.rotation ?? 0,
      tint: [...tint] as [number, number, number, number],
      origin: [...origin] as [number, number],
      parallax,
      blend: options.blend,
    });
    super.drawSprite(source, options);
  }

  override end(): RenderStats {
    const stats = super.end();
    if (this.currentFrame) {
      this.frames.push({ commands: this.currentFrame, stats });
      this.currentFrame = null;
    }
    return stats;
  }

  getFrames(): readonly RecordedFrame[] {
    return this.frames;
  }

  clearFrames(): void {
    this.frames.length = 0;
    this.currentFrame = null;
  }
}
