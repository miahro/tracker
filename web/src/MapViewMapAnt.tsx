import React, { useEffect, useRef } from 'react'
import maplibregl, { type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

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

export function MapViewMapAnt() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const labelMarkersRef = useRef<maplibregl.Marker[]>([])

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

    console.log('MapAnt Map initialized')
    // --- FEATURE NAMES INTEGRATION ---

    async function updateFeatureNames() {
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
        console.log('MapAnt getFeatureNames response received')
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

          const marker = new maplibregl.Marker({
            element: el,
          })
            .setLngLat([f.lng, f.lat])
            .addTo(map)

          labelMarkersRef.current.push(marker)
        }
      } catch (error) {
        // This might show CORS issues or network errors

        console.error('Failed to fetch MapAnt feature names', error)
      }
    }

    function handleMoveEnd() {
      void updateFeatureNames()
    }

    map.on('moveend', handleMoveEnd)
    map.on('load', () => {
      void updateFeatureNames()
    })

    // --- CLEANUP ---
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
