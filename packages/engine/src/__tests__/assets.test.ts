import { describe, expect, it, vi } from 'vitest';
import { AssetManager } from '../assets';

describe('AssetManager', () => {
  it('loads assets with custom loader and caches results', async () => {
    const manager = new AssetManager();
    manager.registerLoader({
      id: 'mock',
      match: (descriptor) => descriptor.source.endsWith('.mock'),
      loader: async (source) => ({ source, loaded: true }),
    });

    const progressSpy = vi.fn();
    manager.events.on('progress', progressSpy);

    const asset = await manager.load<{ source: string; loaded: boolean }>({
      key: 'test-asset',
      source: 'foo.mock',
    });

    expect(asset.loaded).toBe(true);
    expect(manager.get<{ source: string; loaded: boolean }>('test-asset')).toEqual(asset);
    expect(progressSpy).toHaveBeenCalled();

    const cached = await manager.load<{ source: string; loaded: boolean }>({
      key: 'test-asset',
      source: 'foo.mock',
    });
    expect(cached).toBe(asset);
  });
});
