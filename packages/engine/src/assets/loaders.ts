import { AssetManager } from './AssetManager';
import { parseTiledMap, RawTiledMap } from './Tilemap';

export function registerDefaultLoaders(manager: AssetManager): void {
  manager.registerLoader({
    id: 'tilemap',
    match: (descriptor) =>
      descriptor.source.endsWith('.tmj') || descriptor.source.endsWith('.tilemap.json'),
    loader: async (source: string) => {
      if (typeof fetch !== 'function') {
        throw new Error('Global fetch API unavailable for tilemap loader');
      }
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to load tilemap: ${source}`);
      }
      const data = (await response.json()) as RawTiledMap;
      return parseTiledMap(data);
    },
  });
}

export { type Tilemap } from './Tilemap';
