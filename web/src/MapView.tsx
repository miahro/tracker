import React, { useEffect, useRef } from 'react'
import maplibregl, { type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getBaseMapConfig, type BaseMapId } from './basemaps'

//const SELECTED_BASEMAP: BaseMapId = 'mapant' // change to 'nls-vector' to test NLS
const SELECTED_BASEMAP: BaseMapId = 'nls-vector'

export function MapView() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const nlsApiKey = import.meta.env.VITE_NLS_API_KEY
    const baseMap = getBaseMapConfig(SELECTED_BASEMAP, nlsApiKey)

    let style: string | StyleSpecification

    if (baseMap.type === 'vector-style-url' && baseMap.styleUrl) {
      // For NLS: style is a URL string
      style = baseMap.styleUrl
    } else if (baseMap.type === 'raster-xyz' && baseMap.tileUrlTemplate) {
      // For MapAnt: build a full MapLibre style object
      style = {
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
    } else {
      console.error('Invalid basemap configuration', baseMap)
      return
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style,
      center: [25.0, 60.5],
      zoom: 12,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
}
