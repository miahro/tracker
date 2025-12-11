import React, { useEffect, useRef } from 'react'
import maplibregl, { type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export function MapViewMapAnt() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const style: StyleSpecification = {
      version: 8,
      sources: {
        mapant: {
          type: 'raster',
          tiles: ['https://wmts.mapant.fi/wmts_EPSG3857.php?z={z}&x={x}&y={y}'],
          tileSize: 256,
          minzoom: 0,
          maxzoom: 18,
          attribution:
            'MapAnt Finland – https://mapant.fi – Contains data © National Land Survey of Finland (NLS), CC BY 4.0',
        },
      },
      layers: [
        {
          id: 'mapant-base',
          type: 'raster',
          source: 'mapant',
        },
      ],
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
