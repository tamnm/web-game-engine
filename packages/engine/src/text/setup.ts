import { AssetManager } from '../assets/AssetManager';
import { FontManager } from './FontManager';
import { registerImageLoader, registerBMFontLoader } from './loaders';

/**
 * Set up the text rendering system with the asset manager
 */
export function setupTextRendering(assetManager: AssetManager): FontManager {
  // Register the image loader for texture atlases
  registerImageLoader(assetManager);

  // Create font manager
  const fontManager = new FontManager(assetManager);

  // Register the BMFont loader
  registerBMFontLoader(assetManager, fontManager);

  return fontManager;
}
