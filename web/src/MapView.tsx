// web/src/MapView.tsx
import React, { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getBaseMapConfig, type BaseMapId } from './basemaps'
import { buildBaseMapStyle } from './map/buildBaseMapStyle'
import type { GeoJsonPosition } from './adapters/geojson'

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

export type PointRole = 'start' | 'corner' | 'finish'

interface MapViewProps {
  baseMapId: BaseMapId
  trackPositions: GeoJsonPosition[]
  pointRoles: PointRole[]
  onMapClick?: (position: GeoJsonPosition) => void
}

const DEFAULT_CENTER: [number, number] = [23.796833, 60.447159]
const DEFAULT_ZOOM = 15

const SOURCE_ID = 'draft-track'
const LAYER_LINE_ID = 'draft-track-line'
const LAYER_POINTS_ID = 'draft-track-points'
const LINE_COLOR = '#e63946'

function buildGeoJson(positions: GeoJsonPosition[], roles: PointRole[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: positions },
        properties: {},
      },
      ...positions.map((pos, i) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: pos },
        properties: { role: roles[i] ?? 'corner' },
      })),
    ],
  }
}

function addTrackLayers(
  map: maplibregl.Map,
  positions: GeoJsonPosition[],
  roles: PointRole[]
): void {
  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data: buildGeoJson(positions, roles),
  })

  map.addLayer({
    id: LAYER_LINE_ID,
    type: 'line',
    source: SOURCE_ID,
    filter: ['==', '$type', 'LineString'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': LINE_COLOR, 'line-width': 3, 'line-opacity': 0.9 },
  })

  // Data-driven: colour and size by role
  // start = blue, finish = green, corner = red (matches track line)
  map.addLayer({
    id: LAYER_POINTS_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['==', '$type', 'Point'],
    paint: {
      'circle-radius': ['match', ['get', 'role'], 'start', 7, 'finish', 7, 5],
      'circle-color': [
        'match',
        ['get', 'role'],
        'start',
        '#2563eb', // blue
        'finish',
        '#16a34a', // green
        '#e63946', // red for corners
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  })
}

export function MapView({ baseMapId, trackPositions, pointRoles, onMapClick }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const labelMarkersRef = useRef<maplibregl.Marker[]>([])

  const onMapClickRef = useRef(onMapClick)
  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  const trackPositionsRef = useRef(trackPositions)
  useEffect(() => {
    trackPositionsRef.current = trackPositions
  }, [trackPositions])

  const pointRolesRef = useRef(pointRoles)
  useEffect(() => {
    pointRolesRef.current = pointRoles
  }, [pointRoles])

  useEffect(() => {
    if (!mapContainerRef.current) return

    const nlsApiKey = import.meta.env.VITE_NLS_API_KEY
    const baseMap = getBaseMapConfig(baseMapId, nlsApiKey)
    const style = buildBaseMapStyle(baseMap)

    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      })
    } catch (err) {
      console.warn('MapLibre: failed to initialize map, WebGL may be unavailable.', err)
      return
    }

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = map

    map.on('click', (e: maplibregl.MapMouseEvent) => {
      onMapClickRef.current?.([e.lngLat.lng, e.lngLat.lat])
    })

    function addLayersAndData() {
      addTrackLayers(map, trackPositionsRef.current, pointRolesRef.current)
    }

    if (map.isStyleLoaded()) {
      addLayersAndData()
    } else {
      map.once('load', addLayersAndData)
    }

    async function updateFeatureNames() {
      if (baseMap.id !== 'mapant') return
      const bounds = map.getBounds()
      try {
        const response = await fetch('https://www.mapant.fi/ajax/getFeatureNames.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            south: bounds.getSouth(),
            north: bounds.getNorth(),
            west: bounds.getWest(),
            east: bounds.getEast(),
          }),
        })
        if (!response.ok) return
        const data = (await response.json()) as { featureNames?: MapAntFeatureName[] }
        for (const marker of labelMarkersRef.current) marker.remove()
        labelMarkersRef.current = []
        for (const f of data.featureNames ?? []) {
          const el = document.createElement('div')
          el.className = 'mapantLabel'
          el.textContent = f.text
          labelMarkersRef.current.push(
            new maplibregl.Marker({ element: el }).setLngLat([f.lng, f.lat]).addTo(map)
          )
        }
      } catch (error) {
        console.error('Failed to fetch MapAnt feature names', error)
      }
    }

    map.on('load', () => {
      if (baseMap.id === 'mapant') void updateFeatureNames()
    })
    map.on('moveend', () => {
      if (baseMap.id === 'mapant') void updateFeatureNames()
    })

    return () => {
      for (const marker of labelMarkersRef.current) marker.remove()
      labelMarkersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [baseMapId])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    function updateData() {
      const source = map!.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
      if (source) source.setData(buildGeoJson(trackPositions, pointRoles))
    }

    if (map.isStyleLoaded()) {
      updateData()
    } else {
      map.once('load', updateData)
    }
  }, [trackPositions])

  return <div ref={mapContainerRef} className="mapContainer" />
}
