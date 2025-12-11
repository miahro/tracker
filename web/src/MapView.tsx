// web/src/MapView.tsx
import React, { useEffect, useRef } from 'react'
import maplibregl, { type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getBaseMapConfig, type BaseMapId } from './basemaps'

// Change this to 'mapant' or 'nls-vector' to switch basemap
const SELECTED_BASEMAP: BaseMapId = 'mapant'
//const SELECTED_BASEMAP: BaseMapId = 'nls-vector'

interface MapAntFeatureName {
  id: string
  lng: number
  lat: number
  text: string
  type: string
  rotation: string
  size: string
  code: string
}

export function MapView() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const labelMarkersRef = useRef<maplibregl.Marker[]>([])

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

    // --- MapAnt feature names (only when using MapAnt basemap) ---

    async function updateFeatureNames() {
      if (baseMap.id !== 'mapant') {
        return
      }

      const bounds = map.getBounds()
      const payload = {
        south: bounds.getSouth(),
        north: bounds.getNorth(),
        west: bounds.getWest(),
        east: bounds.getEast(),
      }

      try {
        const response = await fetch('https://www.mapant.fi/ajax/getFeatureNames.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          console.warn('MapAnt getFeatureNames returned non-OK status', response.status)
          return
        }

        const data = (await response.json()) as {
          featureNames?: MapAntFeatureName[]
        }
        const featureNames = data.featureNames ?? []

        // Remove existing markers
        for (const marker of labelMarkersRef.current) {
          marker.remove()
        }
        labelMarkersRef.current = []

        // Add new markers
        for (const f of featureNames) {
          const el = document.createElement('div')
          el.textContent = f.text
          el.style.position = 'relative'
          el.style.whiteSpace = 'nowrap'
          el.style.fontSize = '11px'
          el.style.fontFamily = 'system-ui, sans-serif'
          el.style.color = '#1a1a1a'
          el.style.textShadow = '0 0 3px rgba(255,255,255,0.9), 0 0 2px rgba(255,255,255,0.9)'

          const marker = new maplibregl.Marker({ element: el }).setLngLat([f.lng, f.lat]).addTo(map)

          labelMarkersRef.current.push(marker)
        }
      } catch (error) {
        console.error('Failed to fetch MapAnt feature names', error)
      }
    }

    function handleMoveEnd() {
      if (baseMap.id === 'mapant') {
        void updateFeatureNames()
      }
    }

    map.on('load', () => {
      if (baseMap.id === 'mapant') {
        void updateFeatureNames()
      }
    })
    map.on('moveend', handleMoveEnd)

    return () => {
      map.off('moveend', handleMoveEnd)
      for (const marker of labelMarkersRef.current) {
        marker.remove()
      }
      labelMarkersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
}
