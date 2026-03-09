import { AssetManager } from '../assets/AssetManager';
import { Texture } from '../rendering/types';
import { FontDescriptor } from './types';
import { FontManager } from './FontManager';

/**
 * Register image loader with the asset manager
 */
export function registerImageLoader(assetManager: AssetManager): void {
  assetManager.registerLoader({
    id: 'image',
    match: (descriptor) => {
      const source = descriptor.source.toLowerCase();
      return (
        source.endsWith('.png') ||
        source.endsWith('.jpg') ||
        source.endsWith('.jpeg') ||
        source.endsWith('.gif') ||
        source.endsWith('.bmp')
      );
    },
    loader: async (source: string) => {
      return new Promise<Texture>((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
          const texture: Texture = {
            id: source,
            width: image.width,
            height: image.height,
            source: image,
          };
          resolve(texture);
        };

        image.onerror = () => {
          reject(new Error(`Failed to load image: ${source}`));
        };

        image.src = source;
      });
    },
  });
}

/**
 * Register BMFont loader with the asset manager
 */
export function registerBMFontLoader(assetManager: AssetManager, fontManager: FontManager): void {
  assetManager.registerLoader({
    id: 'bmfont',
    match: (descriptor) => {
      // Check if this is a font descriptor with bmfont loader
      return 'loader' in descriptor && descriptor.loader === 'bmfont';
    },
    loader: async (source: string) => {
      // The source should be a JSON string containing the FontDescriptor
      let fontDescriptor: FontDescriptor;

      try {
        fontDescriptor = JSON.parse(source) as FontDescriptor;
      } catch (error) {
        throw new Error(
          `Invalid BMFont descriptor format: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      // Validate the descriptor
      if (!fontDescriptor.key || !fontDescriptor.fntFile || !fontDescriptor.textureFiles) {
        throw new Error('BMFont descriptor must include key, fntFile, and textureFiles');
      }

      if (fontDescriptor.loader !== 'bmfont') {
        throw new Error(`Expected loader 'bmfont', got '${fontDescriptor.loader}'`);
      }

      // Load the font using the font manager
      return await fontManager.loadFont(fontDescriptor);
    },
  });
}

/**
 * Create a font descriptor for loading BMFont assets
 */
export function createFontDescriptor(
  key: string,
  fntFile: string,
  textureFiles: string[]
): FontDescriptor {
  return {
    key,
    fntFile,
    textureFiles,
    loader: 'bmfont',
  };
}
