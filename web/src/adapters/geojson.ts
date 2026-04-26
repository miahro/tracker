// web/src/adapters/geojson.ts
//
// Converts between GeoJSON coordinate arrays and domain types.
//
// Coordinate convention:
//   GeoJSON:          [longitude, latitude]  (spec §3.1.1)
//   Domain Coordinate: { lat, lon }
//
// All conversion happens here — nowhere else in web/ or domain/ should
// need to know about this swap.

import type { Coordinate, TrackSegment } from '@trail-tracker/domain'

/** A GeoJSON position tuple: [longitude, latitude] */
export type GeoJsonPosition = [number, number]

/**
 * Convert a single GeoJSON position to a domain Coordinate.
 * Swaps [lon, lat] → { lat, lon }.
 */
export function coordinateFromGeoJson(position: GeoJsonPosition): Coordinate {
  return { lat: position[1], lon: position[0] }
}

/**
 * Convert a domain Coordinate back to a GeoJSON position.
 * Swaps { lat, lon } → [lon, lat].
 */
export function coordinateToGeoJson(coord: Coordinate): GeoJsonPosition {
  return [coord.lon, coord.lat]
}

/**
 * Convert an ordered array of GeoJSON positions into domain TrackSegments.
 *
 * - 0 or 1 positions → empty array (no segments can be formed)
 * - N positions → N-1 segments, sequenceIndex 0-based
 *
 * IDs are generated as `seg-{sequenceIndex}` and are stable for a given
 * position array. Callers that need globally unique IDs should prefix them.
 */
export function segmentsFromGeoJson(positions: GeoJsonPosition[]): TrackSegment[] {
  if (positions.length < 2) return []

  return positions.slice(0, -1).map((pos, i) => ({
    id: `seg-${i}`,
    start: coordinateFromGeoJson(pos),
    end: coordinateFromGeoJson(positions[i + 1]),
    sequenceIndex: i,
  }))
}

/**
 * Convert an array of domain TrackSegments back to an ordered GeoJSON
 * position array.
 *
 * Assumes segments are ordered by sequenceIndex and form a continuous
 * polyline (end of segment N === start of segment N+1).
 * Returns [] for an empty segment array.
 */
export function segmentsToGeoJson(segments: TrackSegment[]): GeoJsonPosition[] {
  if (segments.length === 0) return []

  const sorted = [...segments].sort((a, b) => a.sequenceIndex - b.sequenceIndex)

  // First point + each segment's end point
  return [coordinateToGeoJson(sorted[0].start), ...sorted.map((s) => coordinateToGeoJson(s.end))]
}
