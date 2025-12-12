// web/src/map/buildBaseMapStyle.ts
import { type StyleSpecification } from 'maplibre-gl'
import type { BaseMapConfig } from '../basemaps'

export function buildBaseMapStyle(baseMap: BaseMapConfig): string | StyleSpecification {
  if (baseMap.type === 'vector-style-url' && baseMap.styleUrl) {
    return baseMap.styleUrl
  }

  if (baseMap.type === 'raster-xyz' && baseMap.tileUrlTemplate) {
    return {
      version: 8,
      sources: {
        base: {
          type: 'raster',
          tiles: [baseMap.tileUrlTemplate],
          tileSize: 256,
          minzoom: 0,
          maxzoom: 18,
          attribution:
            'MapAnt Finland – https://mapant.fi – Contains data © National Land Survey of Finland (NLS), CC BY 4.0',
        },
      },
      layers: [
        {
          id: 'base',
          type: 'raster',
          source: 'base',
        },
      ],
    }
  }

  throw new Error(`Unsupported basemap configuration: ${baseMap.id}`)
}
