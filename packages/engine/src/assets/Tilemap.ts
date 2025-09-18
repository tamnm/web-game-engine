export interface TilemapLayer {
  id: number;
  name: string;
  width: number;
  height: number;
  data: number[];
}

export interface Tilemap {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  layers: TilemapLayer[];
}

export interface RawTiledLayer {
  id: number;
  name: string;
  width: number;
  height: number;
  data: number[];
  type: string;
}

export interface RawTiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: RawTiledLayer[];
}

export function parseTiledMap(raw: RawTiledMap): Tilemap {
  return {
    width: raw.width,
    height: raw.height,
    tileWidth: raw.tilewidth,
    tileHeight: raw.tileheight,
    layers: raw.layers
      .filter((layer) => layer.type === 'tilelayer')
      .map((layer) => ({
        id: layer.id,
        name: layer.name,
        width: layer.width,
        height: layer.height,
        data: [...layer.data],
      })),
  };
}
