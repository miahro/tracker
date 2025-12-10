// domain/src/geometry.test.ts
import { describe, it, expect } from 'vitest'
import {
  Coordinate,
  Track,
  TrackSegment,
  distanceBetweenCoordinatesMeters,
  getSegmentLengthMeters,
  getTrackLengthMeters,
} from './index'

describe('distanceBetweenCoordinatesMeters', () => {
  it('returns 0 for identical coordinates', () => {
    const a: Coordinate = { lat: 60.0, lon: 25.0 }

    const d = distanceBetweenCoordinatesMeters(a, a)

    expect(d).toBe(0)
  })

  it('is roughly 111 km per degree of latitude', () => {
    const a: Coordinate = { lat: 60.0, lon: 25.0 }
    const b: Coordinate = { lat: 61.0, lon: 25.0 }

    const d = distanceBetweenCoordinatesMeters(a, b)

    // ~111,000 meters per degree latitude, allow small tolerance
    expect(d).toBeGreaterThan(110000)
    expect(d).toBeLessThan(112000)
  })
})

describe('getSegmentLengthMeters', () => {
  it('matches distanceBetweenCoordinatesMeters for the same start/end', () => {
    const start: Coordinate = { lat: 60.0, lon: 25.0 }
    const end: Coordinate = { lat: 60.1, lon: 25.0 }

    const segment: TrackSegment = {
      id: 's1',
      start,
      end,
      sequenceIndex: 0,
    }

    const d1 = distanceBetweenCoordinatesMeters(start, end)
    const d2 = getSegmentLengthMeters(segment)

    // They should be very close to each other
    expect(Math.abs(d1 - d2)).toBeLessThan(0.0001)
  })
})

describe('getTrackLengthMeters', () => {
  it('is 0 for a track with no segments', () => {
    const emptyTrack: Track = {
      id: 't-empty',
      name: 'Empty',
      type: 'TRAINING',
      segments: [],
    }

    expect(getTrackLengthMeters(emptyTrack)).toBe(0)
  })

  it('sums the lengths of all segments', () => {
    const a: Coordinate = { lat: 60.0, lon: 25.0 }
    const b: Coordinate = { lat: 60.1, lon: 25.0 }
    const c: Coordinate = { lat: 60.2, lon: 25.0 }

    const s1: TrackSegment = {
      id: 's1',
      start: a,
      end: b,
      sequenceIndex: 0,
    }

    const s2: TrackSegment = {
      id: 's2',
      start: b,
      end: c,
      sequenceIndex: 1,
    }

    const track: Track = {
      id: 't1',
      name: 'Two segments',
      type: 'TRAINING',
      segments: [s1, s2],
    }

    const len1 = getSegmentLengthMeters(s1)
    const len2 = getSegmentLengthMeters(s2)
    const total = getTrackLengthMeters(track)

    // total should be very close to len1 + len2
    expect(Math.abs(total - (len1 + len2))).toBeLessThan(0.0001)
  })
})
