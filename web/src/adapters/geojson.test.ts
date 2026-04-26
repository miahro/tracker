// web/src/adapters/geojson.test.ts
import { describe, it, expect } from 'vitest'
import {
  coordinateFromGeoJson,
  coordinateToGeoJson,
  segmentsFromGeoJson,
  segmentsToGeoJson,
  type GeoJsonPosition,
} from './geojson'

// ---------------------------------------------------------------------------
// coordinateFromGeoJson
// ---------------------------------------------------------------------------

describe('coordinateFromGeoJson', () => {
  it('swaps [lon, lat] to { lat, lon }', () => {
    const result = coordinateFromGeoJson([25.1, 60.3])
    expect(result).toEqual({ lat: 60.3, lon: 25.1 })
  })

  it('handles negative longitude (west of meridian)', () => {
    const result = coordinateFromGeoJson([-73.9857, 40.7484])
    expect(result).toEqual({ lat: 40.7484, lon: -73.9857 })
  })
})

// ---------------------------------------------------------------------------
// coordinateToGeoJson
// ---------------------------------------------------------------------------

describe('coordinateToGeoJson', () => {
  it('swaps { lat, lon } to [lon, lat]', () => {
    const result = coordinateToGeoJson({ lat: 60.3, lon: 25.1 })
    expect(result).toEqual([25.1, 60.3])
  })

  it('round-trips through coordinateFromGeoJson', () => {
    const original: GeoJsonPosition = [25.1, 60.3]
    const roundTripped = coordinateToGeoJson(coordinateFromGeoJson(original))
    expect(roundTripped).toEqual(original)
  })
})

// ---------------------------------------------------------------------------
// segmentsFromGeoJson
// ---------------------------------------------------------------------------

describe('segmentsFromGeoJson', () => {
  it('returns empty array for 0 positions', () => {
    expect(segmentsFromGeoJson([])).toEqual([])
  })

  it('returns empty array for 1 position (no segment possible)', () => {
    expect(segmentsFromGeoJson([[25.1, 60.3]])).toEqual([])
  })

  it('returns 1 segment for 2 positions', () => {
    const segments = segmentsFromGeoJson([
      [25.1, 60.3],
      [25.2, 60.4],
    ])

    expect(segments).toHaveLength(1)
    expect(segments[0].sequenceIndex).toBe(0)
    expect(segments[0].start).toEqual({ lat: 60.3, lon: 25.1 })
    expect(segments[0].end).toEqual({ lat: 60.4, lon: 25.2 })
  })

  it('returns N-1 segments for N positions', () => {
    const positions: GeoJsonPosition[] = [
      [25.1, 60.3],
      [25.2, 60.35],
      [25.3, 60.4],
      [25.4, 60.45],
    ]

    const segments = segmentsFromGeoJson(positions)

    expect(segments).toHaveLength(3)
  })

  it('assigns sequential sequenceIndex values starting at 0', () => {
    const positions: GeoJsonPosition[] = [
      [25.1, 60.3],
      [25.2, 60.35],
      [25.3, 60.4],
    ]

    const segments = segmentsFromGeoJson(positions)

    expect(segments.map((s) => s.sequenceIndex)).toEqual([0, 1])
  })

  it('chains segments correctly — end of seg N equals start of seg N+1', () => {
    const positions: GeoJsonPosition[] = [
      [25.1, 60.3],
      [25.2, 60.35],
      [25.3, 60.4],
    ]

    const segments = segmentsFromGeoJson(positions)

    expect(segments[0].end).toEqual(segments[1].start)
  })

  it('swaps lon/lat correctly for all positions', () => {
    // Finnish coordinates: lon ~25, lat ~60 — easy to verify swap
    const segments = segmentsFromGeoJson([
      [25.0, 60.0],
      [25.5, 60.5],
    ])

    expect(segments[0].start.lon).toBe(25.0)
    expect(segments[0].start.lat).toBe(60.0)
    expect(segments[0].end.lon).toBe(25.5)
    expect(segments[0].end.lat).toBe(60.5)
  })
})

// ---------------------------------------------------------------------------
// segmentsToGeoJson
// ---------------------------------------------------------------------------

describe('segmentsToGeoJson', () => {
  it('returns empty array for no segments', () => {
    expect(segmentsToGeoJson([])).toEqual([])
  })

  it('returns 2 positions for 1 segment', () => {
    const positions = segmentsToGeoJson([
      {
        id: 'seg-0',
        sequenceIndex: 0,
        start: { lat: 60.3, lon: 25.1 },
        end: { lat: 60.4, lon: 25.2 },
      },
    ])

    expect(positions).toEqual([
      [25.1, 60.3],
      [25.2, 60.4],
    ])
  })

  it('round-trips through segmentsFromGeoJson', () => {
    const original: GeoJsonPosition[] = [
      [25.1, 60.3],
      [25.2, 60.35],
      [25.3, 60.4],
    ]

    const roundTripped = segmentsToGeoJson(segmentsFromGeoJson(original))
    expect(roundTripped).toEqual(original)
  })

  it('sorts by sequenceIndex before converting (order-independent input)', () => {
    const segments = [
      {
        id: 'seg-1',
        sequenceIndex: 1,
        start: { lat: 60.35, lon: 25.2 },
        end: { lat: 60.4, lon: 25.3 },
      },
      {
        id: 'seg-0',
        sequenceIndex: 0,
        start: { lat: 60.3, lon: 25.1 },
        end: { lat: 60.35, lon: 25.2 },
      },
    ]

    const positions = segmentsToGeoJson(segments)

    expect(positions[0]).toEqual([25.1, 60.3])
    expect(positions[1]).toEqual([25.2, 60.35])
    expect(positions[2]).toEqual([25.3, 60.4])
  })
})
