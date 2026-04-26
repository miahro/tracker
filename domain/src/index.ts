// domain/src/index.ts

export type TrackType = 'AVO' | 'VOI' | 'TRAINING'

// ---------------------------------------------------------------------------
// TrackObject – discriminated union of all objects that can appear on a track
// ---------------------------------------------------------------------------

/**
 * The start point of the track (lähtö).
 * Ground is broken in a 30x30 cm area. Direction marker is placed ~10m ahead.
 */
export interface TrackObjectStart {
  type: 'START'
  id: string
  position: Coordinate
}

/**
 * The finish / kill site (kaato).
 * Ground is broken in a 30x30 cm area.
 * Must be ≥60m from a trafficked road.
 */
export interface TrackObjectFinish {
  type: 'FINISH'
  id: string
  position: Coordinate
}

/**
 * A 90-degree corner (kulma).
 * AVO requires 2, VOI requires 3 (one of which carries the break).
 * Must be ≥150m from start, finish, and other key elements.
 */
export interface TrackObjectCorner {
  type: 'CORNER'
  id: string
  position: Coordinate
}

/**
 * A lay pit / resting place (makuupaikka).
 * Ground is broken in a 30x30 cm area; a few drops of blood added.
 * AVO: 2 pits. VOI: 4 pits (one per straight segment, ≥50m from any corner or finish).
 */
export interface TrackObjectLayPit {
  type: 'LAY_PIT'
  id: string
  position: Coordinate
}

/**
 * The bloodless break used in VOI class (katko / katkos).
 * Placed on one corner at least 300m before the finish.
 * The blood trail leads 15m, then moves 2–5m sideways, backtracks 15m,
 * then turns 90° forward ~10m before resuming.
 */
export interface TrackObjectBreak {
  type: 'BREAK'
  id: string
  /** Position where the blood trail stops (end of the last bloody segment). */
  position: Coordinate
}

/**
 * A generic navigation / reference marker (merkki).
 * Used for planning purposes; not a rule-defined element.
 */
export interface TrackObjectMarker {
  type: 'MARKER'
  id: string
  position: Coordinate
  /** Optional label shown on the map. */
  label?: string
}

export type TrackObject =
  | TrackObjectStart
  | TrackObjectFinish
  | TrackObjectCorner
  | TrackObjectLayPit
  | TrackObjectBreak
  | TrackObjectMarker

export interface Coordinate {
  lat: number
  lon: number
}

export interface TrackSegment {
  id: string
  start: Coordinate
  end: Coordinate
  sequenceIndex: number
}

export interface Track {
  id: string
  name: string
  type: TrackType
  segments: TrackSegment[]
  objects: TrackObject[]
}

// Approximate Earth radius in meters
const EARTH_RADIUS_METERS = 6371000

// Haversine distance between two WGS84 coordinates in meters
export function distanceBetweenCoordinatesMeters(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)

  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)

  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))

  return EARTH_RADIUS_METERS * c
}

// Length of a single segment in meters
export function getSegmentLengthMeters(segment: TrackSegment): number {
  return distanceBetweenCoordinatesMeters(segment.start, segment.end)
}

// Total length of a track in meters (sum of segment lengths)
export function getTrackLengthMeters(track: Track): number {
  return track.segments.reduce((sum, segment) => sum + getSegmentLengthMeters(segment), 0)
}

/**
 * Grid (true north) bearing from segment start to end, in degrees 0–360.
 *
 * Uses the forward azimuth formula for WGS84 coordinates.
 * 0° = North, 90° = East, 180° = South, 270° = West.
 *
 * For a MEJÄ track the corners are specified as 90° turns, so the bearing
 * of each segment relative to the previous one matters for field placement.
 */
export function getSegmentBearingDegrees(segment: TrackSegment): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const toDeg = (rad: number) => (rad * 180) / Math.PI

  const lat1 = toRad(segment.start.lat)
  const lat2 = toRad(segment.end.lat)
  const dLon = toRad(segment.end.lon - segment.start.lon)

  const x = Math.sin(dLon) * Math.cos(lat2)
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

  const bearing = toDeg(Math.atan2(x, y))

  // Normalise to 0–360
  return (bearing + 360) % 360
}
