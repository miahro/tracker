// web/src/MapView.tsx
import React, { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getBaseMapConfig, type BaseMapId } from './basemaps'
import { buildBaseMapStyle } from './map/buildBaseMapStyle'

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

interface MapViewProps {
  baseMapId: BaseMapId
}

const DEFAULT_CENTER: [number, number] = [23.796833, 60.447159]
const DEFAULT_ZOOM = 15

export function MapView({ baseMapId }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const labelMarkersRef = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (!mapContainerRef.current) return

    const nlsApiKey = import.meta.env.VITE_NLS_API_KEY
    const baseMap = getBaseMapConfig(baseMapId, nlsApiKey)
    const style = buildBaseMapStyle(baseMap)

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = map

    async function updateFeatureNames() {
      if (baseMap.id !== 'mapant') return

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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          console.warn('MapAnt getFeatureNames returned non-OK status', response.status)
          return
        }

        const data = (await response.json()) as { featureNames?: MapAntFeatureName[] }
        const featureNames = data.featureNames ?? []

        for (const marker of labelMarkersRef.current) marker.remove()
        labelMarkersRef.current = []

        for (const f of featureNames) {
          const el = document.createElement('div')
          el.className = 'mapantLabel'
          el.textContent = f.text

          const marker = new maplibregl.Marker({ element: el }).setLngLat([f.lng, f.lat]).addTo(map)

          labelMarkersRef.current.push(marker)
        }
      } catch (error) {
        console.error('Failed to fetch MapAnt feature names', error)
      }
    }

    function handleMoveEnd() {
      if (baseMap.id === 'mapant') void updateFeatureNames()
    }

    map.on('load', () => {
      if (baseMap.id === 'mapant') void updateFeatureNames()
    })
    map.on('moveend', handleMoveEnd)

    return () => {
      map.off('moveend', handleMoveEnd)
      for (const marker of labelMarkersRef.current) marker.remove()
      labelMarkersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [baseMapId])

  return <div ref={mapContainerRef} className="mapContainer" />
}
