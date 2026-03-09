import { AssetManager } from '../assets/AssetManager';
import { Texture } from '../rendering/types';
import { BitmapFont, FontDescriptor, FontManager as IFontManager } from './types';
import { parseBMFontText, createBitmapFont } from './BMFontParser';

/**
 * Font manager implementation for loading and managing bitmap fonts
 */
export class FontManager implements IFontManager {
  private readonly fonts = new Map<string, BitmapFont>();
  private readonly assetManager: AssetManager;

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
  }

  /**
   * Load a bitmap font from a font descriptor
   */
  async loadFont(descriptor: FontDescriptor): Promise<BitmapFont> {
    // Check if font is already loaded
    const existingFont = this.fonts.get(descriptor.key);
    if (existingFont) {
      return existingFont;
    }

    try {
      // Load the .fnt file content
      const fntContent = await this.assetManager.load<string>({
        key: `${descriptor.key}_fnt`,
        source: descriptor.fntFile,
        loader: 'text',
      });

      // Parse the BMFont data
      const rawFontData = parseBMFontText(fntContent);

      // Validate that we have the expected number of texture pages
      if (rawFontData.pages.length !== descriptor.textureFiles.length) {
        throw new Error(
          `Font ${descriptor.key}: Expected ${rawFontData.pages.length} texture pages, but got ${descriptor.textureFiles.length}`
        );
      }

      // For now, we only support single-page fonts (most common case)
      if (descriptor.textureFiles.length !== 1) {
        throw new Error(
          `Font ${descriptor.key}: Multi-page fonts are not yet supported. Expected 1 texture file, got ${descriptor.textureFiles.length}`
        );
      }

      // Load the texture atlas
      const atlas = await this.assetManager.load<Texture>({
        key: `${descriptor.key}_atlas`,
        source: descriptor.textureFiles[0],
        loader: 'image',
      });

      // Validate that all characters fit within the atlas bounds
      this.validateCharacterBounds(rawFontData, atlas);

      // Create the bitmap font
      const bitmapFont = createBitmapFont(descriptor.key, rawFontData, atlas);

      // Cache the font
      this.fonts.set(descriptor.key, bitmapFont);

      return bitmapFont;
    } catch (error) {
      throw new Error(
        `Failed to load font ${descriptor.key}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a loaded font by ID
   */
  getFont(id: string): BitmapFont | undefined {
    return this.fonts.get(id);
  }

  /**
   * Release a font from memory
   */
  releaseFont(id: string): void {
    const font = this.fonts.get(id);
    if (font) {
      // Release associated assets
      this.assetManager.release(`${id}_fnt`);
      this.assetManager.release(`${id}_atlas`);

      // Remove from cache
      this.fonts.delete(id);
    }
  }

  /**
   * Get list of all available font IDs
   */
  getAvailableFonts(): string[] {
    return Array.from(this.fonts.keys());
  }

  /**
   * Validate that all character coordinates are within atlas bounds
   */
  private validateCharacterBounds(
    rawFontData: {
      chars: Array<{ id: number; x: number; y: number; width: number; height: number }>;
    },
    atlas: Texture
  ): void {
    for (const char of rawFontData.chars) {
      const right = char.x + char.width;
      const bottom = char.y + char.height;

      if (char.x < 0 || char.y < 0 || right > atlas.width || bottom > atlas.height) {
        throw new Error(
          `Character ${String.fromCharCode(char.id)} (${char.id}) bounds [${char.x}, ${char.y}, ${right}, ${bottom}] exceed atlas dimensions [${atlas.width}, ${atlas.height}]`
        );
      }
    }
  }
}
