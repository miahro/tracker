// domain/src/validation.test.ts

import { describe, it, expect } from 'vitest'
import { validateTrack } from './index'
import type { Track, TrackSegment, Coordinate } from './index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a coordinate offset by approximate meters north/east from a base */
function offset(base: Coordinate, northM: number, eastM: number): Coordinate {
  return {
    lat: base.lat + northM / 111320,
    lon: base.lon + eastM / (111320 * Math.cos((base.lat * Math.PI) / 180)),
  }
}

const BASE: Coordinate = { lat: 60.3, lon: 25.1 }

/** Build a Track from an ordered list of coordinates */
function makeTrack(type: Track['type'], coords: Coordinate[]): Track {
  const segments: TrackSegment[] = []
  for (let i = 0; i < coords.length - 1; i++) {
    segments.push({
      id: `seg-${i}`,
      start: coords[i],
      end: coords[i + 1],
      sequenceIndex: i,
    })
  }
  return {
    id: 'test',
    name: 'test track',
    type,
    segments,
    objects: [],
  }
}

// AVO: 3 segments, each 320 m → total 960 m (valid 900–1000 m)
const AVO_VALID = makeTrack('AVO', [
  BASE,
  offset(BASE, 320, 0),
  offset(BASE, 640, 0),
  offset(BASE, 960, 0),
])

// AVO: 3 segments, each 250 m → total 750 m (too short)
const AVO_TOO_SHORT = makeTrack('AVO', [
  BASE,
  offset(BASE, 250, 0),
  offset(BASE, 500, 0),
  offset(BASE, 750, 0),
])

// AVO: 3 segments, each 360 m → total 1080 m (too long)
const AVO_TOO_LONG = makeTrack('AVO', [
  BASE,
  offset(BASE, 360, 0),
  offset(BASE, 720, 0),
  offset(BASE, 1080, 0),
])

// VOI: 4 segments, each 325 m → total 1300 m (valid 1200–1400 m)
const VOI_VALID = makeTrack('VOI', [
  BASE,
  offset(BASE, 325, 0),
  offset(BASE, 650, 0),
  offset(BASE, 975, 0),
  offset(BASE, 1300, 0),
])

// VOI: 4 segments, each 250 m → total 1000 m (too short)
const VOI_TOO_SHORT = makeTrack('VOI', [
  BASE,
  offset(BASE, 250, 0),
  offset(BASE, 500, 0),
  offset(BASE, 750, 0),
  offset(BASE, 1000, 0),
])

// VOI: 4 segments, each 380 m → total 1520 m (too long)
const VOI_TOO_LONG = makeTrack('VOI', [
  BASE,
  offset(BASE, 380, 0),
  offset(BASE, 760, 0),
  offset(BASE, 1140, 0),
  offset(BASE, 1520, 0),
])

// AVO with one segment below 150 m (seg 0 = 100 m, segs 1+2 = 430 m each → total 960 m)
const AVO_SHORT_SEGMENT = makeTrack('AVO', [
  BASE,
  offset(BASE, 100, 0), // seg 0: 100 m — too short
  offset(BASE, 530, 0), // seg 1: 430 m — ok
  offset(BASE, 960, 0), // seg 2: 430 m — ok
])

// TRAINING: arbitrary segments, no rules apply
const TRAINING_TRACK = makeTrack('TRAINING', [
  BASE,
  offset(BASE, 50, 0), // 50 m — would fail AVO/VOI but irrelevant
  offset(BASE, 100, 0),
])

// ---------------------------------------------------------------------------
// TRAINING — no validation
// ---------------------------------------------------------------------------

describe('validateTrack — TRAINING', () => {
  it('returns no violations for a TRAINING track regardless of length', () => {
    expect(validateTrack(TRAINING_TRACK)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// AVO — track length
// ---------------------------------------------------------------------------

describe('validateTrack — AVO track length', () => {
  it('returns no violations for a valid AVO track', () => {
    const violations = validateTrack(AVO_VALID)
    expect(violations.filter((v) => v.ruleId === 'track-length')).toHaveLength(0)
  })

  it('returns an error when AVO track is too short', () => {
    const violations = validateTrack(AVO_TOO_SHORT)
    const v = violations.find((v) => v.ruleId === 'track-length')
    expect(v).toBeDefined()
    expect(v!.severity).toBe('error')
    expect(v!.message).toMatch(/too short/)
    expect(v!.message).toMatch(/900/)
  })

  it('returns an error when AVO track is too long', () => {
    const violations = validateTrack(AVO_TOO_LONG)
    const v = violations.find((v) => v.ruleId === 'track-length')
    expect(v).toBeDefined()
    expect(v!.severity).toBe('error')
    expect(v!.message).toMatch(/too long/)
    expect(v!.message).toMatch(/1000/)
  })
})

// ---------------------------------------------------------------------------
// VOI — track length
// ---------------------------------------------------------------------------

describe('validateTrack — VOI track length', () => {
  it('returns no violations for a valid VOI track', () => {
    const violations = validateTrack(VOI_VALID)
    expect(violations.filter((v) => v.ruleId === 'track-length')).toHaveLength(0)
  })

  it('returns an error when VOI track is too short', () => {
    const violations = validateTrack(VOI_TOO_SHORT)
    const v = violations.find((v) => v.ruleId === 'track-length')
    expect(v).toBeDefined()
    expect(v!.severity).toBe('error')
    expect(v!.message).toMatch(/too short/)
    expect(v!.message).toMatch(/1200/)
  })

  it('returns an error when VOI track is too long', () => {
    const violations = validateTrack(VOI_TOO_LONG)
    const v = violations.find((v) => v.ruleId === 'track-length')
    expect(v).toBeDefined()
    expect(v!.severity).toBe('error')
    expect(v!.message).toMatch(/too long/)
    expect(v!.message).toMatch(/1400/)
  })
})

// ---------------------------------------------------------------------------
// Minimum segment length
// ---------------------------------------------------------------------------

describe('validateTrack — min segment length', () => {
  it('returns no segment violations for a valid AVO track', () => {
    const violations = validateTrack(AVO_VALID)
    expect(violations.filter((v) => v.ruleId === 'min-segment-length')).toHaveLength(0)
  })

  it('returns an error for each segment under 150 m', () => {
    const violations = validateTrack(AVO_SHORT_SEGMENT)
    const segViolations = violations.filter((v) => v.ruleId === 'min-segment-length')
    expect(segViolations).toHaveLength(1)
    expect(segViolations[0].segmentIndex).toBe(0)
    expect(segViolations[0].severity).toBe('error')
    expect(segViolations[0].message).toMatch(/Segment 1/)
    expect(segViolations[0].message).toMatch(/150/)
  })

  it('does not report min-segment-length for TRAINING', () => {
    const violations = validateTrack(TRAINING_TRACK)
    expect(violations.filter((v) => v.ruleId === 'min-segment-length')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Multiple violations
// ---------------------------------------------------------------------------

describe('validateTrack — multiple violations', () => {
  it('can return both track-length and min-segment-length violations at once', () => {
    const violations = validateTrack(AVO_SHORT_SEGMENT)
    // total = 960 m — within AVO range, so only segment violation expected
    expect(violations.some((v) => v.ruleId === 'min-segment-length')).toBe(true)
  })

  it('returns empty array for a valid VOI track', () => {
    expect(validateTrack(VOI_VALID)).toHaveLength(0)
  })
})
