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

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * A single rule violation found when validating a track.
 *
 * severity:
 *   'error'   — track is invalid and cannot be used in a competition
 *   'warning' — advisable to fix, but not a hard disqualifier
 *
 * segmentIndex is present when the violation is specific to one segment
 * (0-based, matching TrackSegment.sequenceIndex).
 */
export interface RuleViolation {
  ruleId: string
  severity: 'error' | 'warning'
  message: string
  segmentIndex?: number
}

// Track length bounds per class (meters)
const TRACK_LENGTH: Record<string, { min: number; max: number }> = {
  AVO: { min: 900, max: 1000 },
  VOI: { min: 1200, max: 1400 },
}

const MIN_SEGMENT_LENGTH_M = 150

/**
 * Test whether two line segments intersect, using 2D parametric intersection.
 * Treats lon/lat as flat Cartesian coordinates — accurate enough for MEJÄ
 * segment lengths (< 2 km; error < 1 mm at Finnish latitudes).
 *
 * Shared endpoints (adjacent segments) are NOT considered intersections —
 * callers must skip adjacent pairs themselves.
 */
function segmentsIntersect(a: TrackSegment, b: TrackSegment): boolean {
  const ax1 = a.start.lon,
    ay1 = a.start.lat
  const ax2 = a.end.lon,
    ay2 = a.end.lat
  const bx1 = b.start.lon,
    by1 = b.start.lat
  const bx2 = b.end.lon,
    by2 = b.end.lat

  const dax = ax2 - ax1,
    day = ay2 - ay1
  const dbx = bx2 - bx1,
    dby = by2 - by1

  const denom = dax * dby - day * dbx
  if (Math.abs(denom) < 1e-12) return false // parallel or collinear

  const dx = bx1 - ax1,
    dy = by1 - ay1
  const t = (dx * dby - dy * dbx) / denom
  const u = (dx * day - dy * dax) / denom

  // Strictly interior intersection (exclude shared endpoints: t/u = 0 or 1)
  const eps = 1e-10
  return t > eps && t < 1 - eps && u > eps && u < 1 - eps
}

/**
 * Validate a finished Track against the MEJÄ rules that can be checked
 * from geometry alone.
 *
 * TRAINING tracks are never validated — returns an empty array.
 *
 * Rules checked:
 *   track-length       — total length within class bounds (AVO/VOI)
 *   min-segment-length — every segment ≥ 150 m (AVO/VOI)
 *   self-intersection  — no two non-adjacent segments may cross (AVO/VOI)
 */
export function validateTrack(track: Track): RuleViolation[] {
  if (track.type === 'TRAINING') return []

  const violations: RuleViolation[] = []
  const totalLength = getTrackLengthMeters(track)
  const bounds = TRACK_LENGTH[track.type]

  // --- Total track length ---
  if (totalLength < bounds.min) {
    violations.push({
      ruleId: 'track-length',
      severity: 'error',
      message: `Track is too short: ${Math.round(totalLength)} m (minimum ${bounds.min} m for ${track.type})`,
    })
  } else if (totalLength > bounds.max) {
    violations.push({
      ruleId: 'track-length',
      severity: 'error',
      message: `Track is too long: ${Math.round(totalLength)} m (maximum ${bounds.max} m for ${track.type})`,
    })
  }

  // --- Minimum segment length ---
  for (const segment of track.segments) {
    const length = getSegmentLengthMeters(segment)
    if (length < MIN_SEGMENT_LENGTH_M) {
      violations.push({
        ruleId: 'min-segment-length',
        severity: 'error',
        message: `Segment ${segment.sequenceIndex + 1} is too short: ${Math.round(length)} m (minimum ${MIN_SEGMENT_LENGTH_M} m)`,
        segmentIndex: segment.sequenceIndex,
      })
    }
  }

  // --- Self-intersection ---
  const sorted = [...track.segments].sort((a, b) => a.sequenceIndex - b.sequenceIndex)
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 2; j < sorted.length; j++) {
      // Skip adjacent pairs — they share an endpoint and aren't a real crossing
      if (segmentsIntersect(sorted[i], sorted[j])) {
        violations.push({
          ruleId: 'self-intersection',
          severity: 'error',
          message: `Segment ${sorted[i].sequenceIndex + 1} and segment ${sorted[j].sequenceIndex + 1} cross each other`,
        })
      }
    }
  }

  return violations
}

// ---------------------------------------------------------------------------
// Geometry helpers — interpolation
// ---------------------------------------------------------------------------

/**
 * Interpolate a point along a great-circle path between two coordinates.
 * fraction=0 returns start, fraction=1 returns end.
 *
 * Uses the spherical linear interpolation (slerp) formula on a unit sphere.
 * Accurate enough for MEJÄ segment lengths (< 2 km).
 */
export function interpolateCoordinate(
  start: Coordinate,
  end: Coordinate,
  fraction: number
): Coordinate {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI

  const lat1 = toRad(start.lat)
  const lon1 = toRad(start.lon)
  const lat2 = toRad(end.lat)
  const lon2 = toRad(end.lon)

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
      )
    )

  if (d === 0) return start

  const a = Math.sin((1 - fraction) * d) / Math.sin(d)
  const b = Math.sin(fraction * d) / Math.sin(d)

  const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2)
  const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2)
  const z = a * Math.sin(lat1) + b * Math.sin(lat2)

  return {
    lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
    lon: toDeg(Math.atan2(y, x)),
  }
}

// ---------------------------------------------------------------------------
// VOI — Lay pit zones
// ---------------------------------------------------------------------------

/**
 * The valid zone for a VOI lay pit on a single segment.
 *
 * Rules: the lay pit must be ≥ 50 m from both ends of the segment
 * (i.e. ≥ 50 m from a corner or the finish).
 *
 * Returns the start and end coordinates of the valid zone along the segment,
 * or null if the segment is too short to have any valid zone (< 100 m total
 * exclusion zone, i.e. segment ≤ 100 m — invalid anyway by the 150 m rule,
 * but we handle it gracefully).
 */
export interface LayPitZone {
  /** Index of the segment this zone belongs to (0-based, = TrackSegment.sequenceIndex) */
  segmentIndex: number
  /** Start of the valid zone (50 m from segment start) */
  zoneStart: Coordinate
  /** End of the valid zone (50 m from segment end) */
  zoneEnd: Coordinate
}

const LAY_PIT_EXCLUSION_M = 50

export function getLayPitZone(segment: TrackSegment): LayPitZone | null {
  const length = getSegmentLengthMeters(segment)
  const exclusion = LAY_PIT_EXCLUSION_M * 2

  if (length <= exclusion) return null

  const startFraction = LAY_PIT_EXCLUSION_M / length
  const endFraction = (length - LAY_PIT_EXCLUSION_M) / length

  return {
    segmentIndex: segment.sequenceIndex,
    zoneStart: interpolateCoordinate(segment.start, segment.end, startFraction),
    zoneEnd: interpolateCoordinate(segment.start, segment.end, endFraction),
  }
}

/**
 * Compute lay pit zones for all segments of a VOI track.
 * Returns one zone per segment (null entries filtered out).
 * Returns empty array for non-VOI tracks.
 */
export function getVoiLayPitZones(track: Track): LayPitZone[] {
  if (track.type !== 'VOI') return []
  return track.segments.map((s) => getLayPitZone(s)).filter((z): z is LayPitZone => z !== null)
}

// ---------------------------------------------------------------------------
// VOI — Break corner eligibility
// ---------------------------------------------------------------------------

/**
 * Eligibility of each corner for the VOI break (katko).
 *
 * Rules:
 *   Corner 1 (between seg 0 and seg 1): always eligible
 *   Corner 2 (between seg 1 and seg 2): always eligible
 *   Corner 3 (between seg 2 and seg 3): eligible only if segment 4 (seg index 3) > 300 m
 *
 * cornerIndex is 0-based (corner 0 = junction of seg 0 and seg 1).
 */
export interface BreakEligibility {
  /** 0-based corner index */
  cornerIndex: number
  eligible: boolean
  /** Human-readable reason when not eligible */
  reason?: string
}

const BREAK_MIN_REMAINING_M = 300

export function getVoiBreakEligibility(track: Track): BreakEligibility[] {
  if (track.type !== 'VOI') return []

  const sorted = [...track.segments].sort((a, b) => a.sequenceIndex - b.sequenceIndex)
  // VOI has 4 segments → 3 corners (indices 0, 1, 2)
  const lastSegmentLength = sorted[3] ? getSegmentLengthMeters(sorted[3]) : 0

  return [
    { cornerIndex: 0, eligible: true },
    { cornerIndex: 1, eligible: true },
    {
      cornerIndex: 2,
      eligible: lastSegmentLength > BREAK_MIN_REMAINING_M,
      reason:
        lastSegmentLength > BREAK_MIN_REMAINING_M
          ? undefined
          : `Segment 4 is ${Math.round(lastSegmentLength)} m — must be > ${BREAK_MIN_REMAINING_M} m for break at corner 3`,
    },
  ]
}
