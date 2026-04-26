// web/src/features/track-editor/useTrackLayers.ts
//
// Manages two MapLibre layers for the draft track:
//   - "draft-track-line"   — polyline connecting all points
//   - "draft-track-points" — circle at each vertex
//
// Accepts a stable map ref and the current GeoJSON positions.
// Updates the source data on every render — MapLibre diffs internally.

import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import type { GeoJsonPosition } from '../../adapters/geojson'

const SOURCE_ID = 'draft-track'
const LAYER_LINE_ID = 'draft-track-line'
const LAYER_POINTS_ID = 'draft-track-points'

// Colours
const LINE_COLOR = '#e63946' // red — visible on both NLS and MapAnt
const POINT_COLOR = '#e63946'
const POINT_STROKE = '#ffffff'

function buildGeoJson(positions: GeoJsonPosition[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      // Line — only meaningful with 2+ points
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: positions,
        },
        properties: {},
      },
      // One point feature per vertex
      ...positions.map((pos) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: pos },
        properties: {},
      })),
    ],
  }
}

function addLayers(map: maplibregl.Map): void {
  if (map.getSource(SOURCE_ID)) return // already initialised

  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data: buildGeoJson([]),
  })

  map.addLayer({
    id: LAYER_LINE_ID,
    type: 'line',
    source: SOURCE_ID,
    filter: ['==', '$type', 'LineString'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': LINE_COLOR,
      'line-width': 3,
      'line-opacity': 0.9,
    },
  })

  map.addLayer({
    id: LAYER_POINTS_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['==', '$type', 'Point'],
    paint: {
      'circle-radius': 5,
      'circle-color': POINT_COLOR,
      'circle-stroke-width': 2,
      'circle-stroke-color': POINT_STROKE,
    },
  })
}

function removeLayers(map: maplibregl.Map): void {
  if (map.getLayer(LAYER_POINTS_ID)) map.removeLayer(LAYER_POINTS_ID)
  if (map.getLayer(LAYER_LINE_ID)) map.removeLayer(LAYER_LINE_ID)
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
}

function updateData(map: maplibregl.Map, positions: GeoJsonPosition[]): void {
  const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
  if (source) {
    source.setData(buildGeoJson(positions))
  }
}

export interface UseTrackLayersOptions {
  mapRef: React.RefObject<maplibregl.Map | null>
  positions: GeoJsonPosition[]
}

export function useTrackLayers({ mapRef, positions }: UseTrackLayersOptions): void {
  // Add layers once after the map style loads
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    function onLoad() {
      addLayers(map!)
    }

    if (map.isStyleLoaded()) {
      addLayers(map)
    } else {
      map.on('load', onLoad)
    }

    return () => {
      map.off('load', onLoad)
      // Clean up layers when basemap changes (map instance is replaced)
      if (map.isStyleLoaded()) removeLayers(map)
    }
  }, [mapRef])

  // Update source data whenever positions change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    updateData(map, positions)
  }, [mapRef, positions])
}
