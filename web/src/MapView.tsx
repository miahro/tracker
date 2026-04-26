// web/src/MapView.tsx
import React, { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getBaseMapConfig, type BaseMapId } from './basemaps'
import { buildBaseMapStyle } from './map/buildBaseMapStyle'
import type { GeoJsonPosition } from './adapters/geojson'
import type { LayPitZone, BreakEligibility } from '@trail-tracker/domain'
import { saveViewport, type PersistedViewport } from './persistence'

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
  layPitZones: LayPitZone[]
  breakEligibility: BreakEligibility[]
  violatedSegmentIndices: number[]
  initialViewport: PersistedViewport | null
  selectedPointIndex: number | null
  onPointClick?: (index: number | null) => void
  onPointDrag?: (index: number, position: GeoJsonPosition) => void
  rulerPointA: GeoJsonPosition | null
  rulerPointB: GeoJsonPosition | null
  onMapClick?: (position: GeoJsonPosition) => void
}

const DEFAULT_CENTER: [number, number] = [23.796833, 60.447159]
const DEFAULT_ZOOM = 15

const SOURCE_ID = 'draft-track'
const LAYER_LINE_ID = 'draft-track-line'
const LAYER_POINTS_ID = 'draft-track-points'
const LINE_COLOR = '#2563eb' // blue — clear contrast against red violation highlight

// VOI overlay layer IDs
const SOURCE_LAY_PIT = 'lay-pit-zones'
const LAYER_LAY_PIT = 'lay-pit-zones-line'
const SOURCE_BREAK = 'break-eligibility'
const LAYER_BREAK = 'break-eligibility-points'

// Ruler layer IDs
const SOURCE_RULER = 'ruler'
const LAYER_RULER_LINE = 'ruler-line'
const LAYER_RULER_POINTS = 'ruler-points'

function buildRulerGeoJson(
  pointA: GeoJsonPosition | null,
  pointB: GeoJsonPosition | null
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = []
  if (pointA) {
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: pointA },
      properties: {},
    })
  }
  if (pointB) {
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: pointB },
      properties: {},
    })
  }
  if (pointA && pointB) {
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [pointA, pointB] },
      properties: {},
    })
  }
  return { type: 'FeatureCollection', features }
}

function buildLayPitGeoJson(zones: LayPitZone[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [z.zoneStart.lon, z.zoneStart.lat],
          [z.zoneEnd.lon, z.zoneEnd.lat],
        ],
      },
      properties: { segmentIndex: z.segmentIndex },
    })),
  }
}

function buildBreakGeoJson(
  eligibility: BreakEligibility[],
  positions: GeoJsonPosition[]
): GeoJSON.FeatureCollection {
  // Corner i is the point at positions[i+1] (positions[0] = start)
  return {
    type: 'FeatureCollection',
    features: eligibility
      .map((e) => {
        const pos = positions[e.cornerIndex + 1]
        if (!pos) return null
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: pos },
          properties: { eligible: e.eligible, cornerIndex: e.cornerIndex },
        }
      })
      .filter((f): f is NonNullable<typeof f> => f !== null),
  }
}

function buildGeoJson(
  positions: GeoJsonPosition[],
  roles: PointRole[],
  violatedSegmentIndices: number[],
  selectedIndex: number | null
): GeoJSON.FeatureCollection {
  const violated = new Set(violatedSegmentIndices)

  // One LineString per segment so each can be coloured independently
  const segmentFeatures: GeoJSON.Feature[] = positions.slice(0, -1).map((pos, i) => ({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: [pos, positions[i + 1]] },
    properties: { segmentIndex: i, violated: violated.has(i) },
  }))

  const pointFeatures: GeoJSON.Feature[] = positions.map((pos, i) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: pos },
    properties: { role: roles[i] ?? 'corner', pointIndex: i, selected: i === selectedIndex },
  }))

  return {
    type: 'FeatureCollection',
    features: [...segmentFeatures, ...pointFeatures],
  }
}

function addTrackLayers(
  map: maplibregl.Map,
  positions: GeoJsonPosition[],
  roles: PointRole[],
  layPitZones: LayPitZone[],
  breakEligibility: BreakEligibility[],
  violatedSegmentIndices: number[],
  selectedIndex: number | null
): void {
  // --- Main track ---
  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data: buildGeoJson(positions, roles, violatedSegmentIndices, selectedIndex),
  })
  map.addLayer({
    id: LAYER_LINE_ID,
    type: 'line',
    source: SOURCE_ID,
    filter: ['==', '$type', 'LineString'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': ['case', ['get', 'violated'], '#dc2626', LINE_COLOR],
      'line-width': ['case', ['get', 'violated'], 4, 3],
      'line-opacity': 0.9,
    },
  })
  map.addLayer({
    id: LAYER_POINTS_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['==', '$type', 'Point'],
    paint: {
      'circle-radius': [
        'case',
        ['get', 'selected'],
        9,
        ['match', ['get', 'role'], 'start', 7, 'finish', 7, 5],
      ],
      'circle-color': [
        'case',
        ['get', 'selected'],
        '#f59e0b',
        ['match', ['get', 'role'], 'start', '#2563eb', 'finish', '#16a34a', '#e63946'],
      ],
      'circle-stroke-width': ['case', ['get', 'selected'], 3, 2],
      'circle-stroke-color': '#ffffff',
    },
  })

  // --- VOI lay pit zones ---
  map.addSource(SOURCE_LAY_PIT, {
    type: 'geojson',
    data: buildLayPitGeoJson(layPitZones),
  })
  map.addLayer({
    id: LAYER_LAY_PIT,
    type: 'line',
    source: SOURCE_LAY_PIT,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#16a34a', 'line-width': 6, 'line-opacity': 0.5 },
  })

  // --- VOI break corner eligibility ---
  map.addSource(SOURCE_BREAK, {
    type: 'geojson',
    data: buildBreakGeoJson(breakEligibility, positions),
  })
  map.addLayer({
    id: LAYER_BREAK,
    type: 'circle',
    source: SOURCE_BREAK,
    paint: {
      'circle-radius': 12,
      'circle-color': 'transparent',
      'circle-stroke-width': 3,
      'circle-stroke-color': ['case', ['get', 'eligible'], '#16a34a', '#dc2626'],
    },
  })

  // --- Ruler ---
  map.addSource(SOURCE_RULER, { type: 'geojson', data: buildRulerGeoJson(null, null) })
  map.addLayer({
    id: LAYER_RULER_LINE,
    type: 'line',
    source: SOURCE_RULER,
    filter: ['==', '$type', 'LineString'],
    layout: { 'line-cap': 'round' },
    paint: { 'line-color': '#f59e0b', 'line-width': 2, 'line-dasharray': [4, 3] },
  })
  map.addLayer({
    id: LAYER_RULER_POINTS,
    type: 'circle',
    source: SOURCE_RULER,
    filter: ['==', '$type', 'Point'],
    paint: {
      'circle-radius': 5,
      'circle-color': '#f59e0b',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  })
}

export function MapView({
  baseMapId,
  trackPositions,
  pointRoles,
  layPitZones,
  breakEligibility,
  violatedSegmentIndices,
  initialViewport,
  selectedPointIndex,
  onPointClick,
  onPointDrag,
  rulerPointA,
  rulerPointB,
  onMapClick,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const labelMarkersRef = useRef<maplibregl.Marker[]>([])

  // Seeded from persisted data (loaded before render in App) — no async needed here
  const viewportRef = useRef<{ center: [number, number]; zoom: number }>(
    initialViewport ?? { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }
  )

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

  const layPitZonesRef = useRef(layPitZones)
  useEffect(() => {
    layPitZonesRef.current = layPitZones
  }, [layPitZones])

  const breakEligibilityRef = useRef(breakEligibility)
  useEffect(() => {
    breakEligibilityRef.current = breakEligibility
  }, [breakEligibility])

  const violatedSegmentIndicesRef = useRef(violatedSegmentIndices)
  useEffect(() => {
    violatedSegmentIndicesRef.current = violatedSegmentIndices
  }, [violatedSegmentIndices])

  const onPointClickRef = useRef(onPointClick)
  useEffect(() => {
    onPointClickRef.current = onPointClick
  }, [onPointClick])

  const onPointDragRef = useRef(onPointDrag)
  useEffect(() => {
    onPointDragRef.current = onPointDrag
  }, [onPointDrag])

  const selectedPointIndexRef = useRef(selectedPointIndex)
  useEffect(() => {
    selectedPointIndexRef.current = selectedPointIndex
  }, [selectedPointIndex])

  // selectedPointIndex drives GeoJSON re-render (in data update effect)

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
        center: viewportRef.current.center,
        zoom: viewportRef.current.zoom,
      })
    } catch (err) {
      console.warn('MapLibre: failed to initialize map, WebGL may be unavailable.', err)
      return
    }

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = map

    // Click on a point → select it; click elsewhere → deselect and add point
    map.on('click', LAYER_POINTS_ID, (e) => {
      e.preventDefault()
      const feature = e.features?.[0]
      if (feature) {
        const idx = feature.properties?.pointIndex as number
        onPointClickRef.current?.(idx)
      }
    })

    map.on('click', (e: maplibregl.MapMouseEvent) => {
      if ((e as maplibregl.MapMouseEvent & { defaultPrevented?: boolean }).defaultPrevented) return
      onPointClickRef.current?.(null) // deselect
      onMapClickRef.current?.([e.lngLat.lng, e.lngLat.lat])
    })

    // Drag a point to move it
    let draggingIndex: number | null = null

    map.on('mousedown', LAYER_POINTS_ID, (e) => {
      if (!onPointDragRef.current) return
      e.preventDefault()
      const feature = e.features?.[0]
      if (!feature) return
      draggingIndex = feature.properties?.pointIndex as number
      map.getCanvas().style.cursor = 'grabbing'
      map.dragPan.disable()
    })

    map.on('mousemove', (e) => {
      if (draggingIndex === null || !onPointDragRef.current) return
      onPointDragRef.current(draggingIndex, [e.lngLat.lng, e.lngLat.lat])
    })

    const stopDrag = () => {
      if (draggingIndex === null) return
      draggingIndex = null
      map.getCanvas().style.cursor = ''
      map.dragPan.enable()
    }

    map.on('mouseup', stopDrag)
    map.on('mouseleave', LAYER_POINTS_ID, () => {
      if (draggingIndex === null) map.getCanvas().style.cursor = ''
    })
    map.on('mouseenter', LAYER_POINTS_ID, () => {
      if (draggingIndex === null && onPointDragRef.current) map.getCanvas().style.cursor = 'grab'
    })

    function addLayersAndData() {
      addTrackLayers(
        map,
        trackPositionsRef.current,
        pointRolesRef.current,
        layPitZonesRef.current,
        breakEligibilityRef.current,
        violatedSegmentIndicesRef.current,
        selectedPointIndexRef.current
      )
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
      // Capture viewport so next map instance (basemap toggle) starts here
      const c = map.getCenter()
      const viewport = { center: [c.lng, c.lat] as [number, number], zoom: map.getZoom() }
      viewportRef.current = viewport
      void saveViewport(viewport)
    })

    return () => {
      // Capture final viewport before destroying the map
      const c = map.getCenter()
      viewportRef.current = { center: [c.lng, c.lat] as [number, number], zoom: map.getZoom() }
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
      const m = map!
      const source = m.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
      if (source)
        source.setData(
          buildGeoJson(trackPositions, pointRoles, violatedSegmentIndices, selectedPointIndex)
        )
      const layPitSource = m.getSource(SOURCE_LAY_PIT) as maplibregl.GeoJSONSource | undefined
      if (layPitSource) layPitSource.setData(buildLayPitGeoJson(layPitZones))
      const breakSource = m.getSource(SOURCE_BREAK) as maplibregl.GeoJSONSource | undefined
      if (breakSource) breakSource.setData(buildBreakGeoJson(breakEligibility, trackPositions))
      const rulerSource = m.getSource(SOURCE_RULER) as maplibregl.GeoJSONSource | undefined
      if (rulerSource) rulerSource.setData(buildRulerGeoJson(rulerPointA, rulerPointB))
    }

    if (map.isStyleLoaded()) {
      updateData()
    } else {
      map.once('load', updateData)
    }
  }, [
    trackPositions,
    pointRoles,
    layPitZones,
    breakEligibility,
    violatedSegmentIndices,
    selectedPointIndex,
    rulerPointA,
    rulerPointB,
  ])

  return <div ref={mapContainerRef} className="mapContainer" />
}
