// domain/src/bearing.test.ts
import { describe, it, expect } from 'vitest'
import { getSegmentBearingDegrees, type TrackSegment } from './index'

function seg(startLat: number, startLon: number, endLat: number, endLon: number): TrackSegment {
  return {
    id: 'test',
    sequenceIndex: 0,
    start: { lat: startLat, lon: startLon },
    end: { lat: endLat, lon: endLon },
  }
}

// Tolerance in degrees for floating-point comparisons
const TOLERANCE = 0.5

describe('getSegmentBearingDegrees', () => {
  it('returns ~0° heading due north', () => {
    // Same longitude, increasing latitude → due north
    const bearing = getSegmentBearingDegrees(seg(60.0, 25.0, 61.0, 25.0))
    expect(bearing).toBeCloseTo(0, 0)
  })

  it('returns ~180° heading due south', () => {
    const bearing = getSegmentBearingDegrees(seg(61.0, 25.0, 60.0, 25.0))
    expect(Math.abs(bearing - 180)).toBeLessThan(TOLERANCE)
  })

  it('returns ~90° heading due east', () => {
    // Same latitude, increasing longitude → due east
    // (approximately true for small deltas at mid-latitudes)
    const bearing = getSegmentBearingDegrees(seg(60.0, 25.0, 60.0, 26.0))
    expect(Math.abs(bearing - 90)).toBeLessThan(TOLERANCE)
  })

  it('returns ~270° heading due west', () => {
    const bearing = getSegmentBearingDegrees(seg(60.0, 26.0, 60.0, 25.0))
    expect(Math.abs(bearing - 270)).toBeLessThan(TOLERANCE)
  })

  it('returns ~45° heading north-east', () => {
    // Equal lat and lon delta → NE at ~45° (approximately, at these latitudes)
    const bearing = getSegmentBearingDegrees(seg(60.0, 25.0, 60.5, 25.7))
    expect(bearing).toBeGreaterThan(30)
    expect(bearing).toBeLessThan(60)
  })

  it('always returns a value in 0–360 range', () => {
    const cases = [
      seg(60.0, 25.0, 61.0, 25.0), // N
      seg(61.0, 25.0, 60.0, 25.0), // S
      seg(60.0, 25.0, 60.0, 26.0), // E
      seg(60.0, 26.0, 60.0, 25.0), // W
      seg(60.0, 25.0, 59.0, 24.0), // SW
    ]
    for (const s of cases) {
      const b = getSegmentBearingDegrees(s)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThan(360)
    }
  })

  it('is consistent with realistic Finnish MEJÄ coordinates', () => {
    // Segment running roughly north-east in Finnish forest terrain
    const bearing = getSegmentBearingDegrees(seg(60.3, 25.1, 60.31, 25.12))
    expect(bearing).toBeGreaterThan(0)
    expect(bearing).toBeLessThan(90)
  })
})
