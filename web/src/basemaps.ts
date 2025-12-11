export type BaseMapId = 'nls-vector' | 'mapant'

export interface BaseMapConfig {
  id: BaseMapId
  label: string
  type: 'vector-style-url' | 'raster-xyz'
  // For vector NLS style
  styleUrl?: string
  // For raster XYZ tiles
  tileUrlTemplate?: string
}

export function getBaseMapConfig(id: BaseMapId, nlsApiKey?: string): BaseMapConfig {
  if (id === 'nls-vector') {
    if (!nlsApiKey) {
      throw new Error('NLS API key required for nls-vector basemap')
    }

    return {
      id,
      label: 'NLS background (vector)',
      type: 'vector-style-url',
      styleUrl: `https://avoin-karttakuva.maanmittauslaitos.fi/vectortiles/stylejson/v20/backgroundmap.json?TileMatrixSet=WGS84_Pseudo-Mercator&api-key=${nlsApiKey}`,
    }
  }

  return {
    id: 'mapant',
    label: 'MapAnt (raster orienteering map)',
    type: 'raster-xyz',
    tileUrlTemplate: 'https://wmts.mapant.fi/wmts_EPSG3857.php?z={z}&x={x}&y={y}',
  }
}
