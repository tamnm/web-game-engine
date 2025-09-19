import { Texture, TextureAtlasDefinition, TextureRegion } from './types';

function cloneRegion(region: TextureRegion): TextureRegion {
  return {
    texture: region.texture,
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    origin: region.origin ? ([...region.origin] as [number, number]) : undefined,
  };
}

export class TextureAtlas {
  private readonly regions = new Map<string, TextureRegion>();

  constructor(
    public readonly texture: Texture,
    frames: TextureAtlasDefinition
  ) {
    Object.entries(frames).forEach(([name, frame]) => {
      this.regions.set(name, {
        texture,
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height,
        origin: frame.origin ? ([...frame.origin] as [number, number]) : undefined,
      });
    });
  }

  getRegion(name: string): TextureRegion {
    const region = this.regions.get(name);
    if (!region) {
      throw new Error(`Unknown atlas frame: ${name}`);
    }
    return cloneRegion(region);
  }

  hasRegion(name: string): boolean {
    return this.regions.has(name);
  }

  listRegions(): string[] {
    return Array.from(this.regions.keys());
  }
}

export type { TextureRegion };
