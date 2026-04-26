// web/src/features/track-editor/draftTrackReducer.ts
//
// Pure reducer for draft track editor state.
// No React dependency — fully unit-testable in isolation.

import type { TrackType, TrackSegment, Track } from '@trail-tracker/domain'
import {
  getTrackLengthMeters,
  getSegmentBearingDegrees,
  getSegmentLengthMeters,
  distanceBetweenCoordinatesMeters,
  getVoiLayPitZones,
  getVoiBreakEligibility,
  type LayPitZone,
  type BreakEligibility,
} from '@trail-tracker/domain'
import {
  segmentsFromGeoJson,
  coordinateFromGeoJson,
  type GeoJsonPosition,
} from '../../adapters/geojson'
import { getDeclinationDegrees, trueToMagneticBearing } from '../../declination'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type EditorMode = 'idle' | 'drawing' | 'finished'

export interface DraftTrackState {
  mode: EditorMode
  trackType: TrackType
  /** Ordered click positions in GeoJSON [lon, lat] convention. */
  points: GeoJsonPosition[]
}

export const INITIAL_STATE: DraftTrackState = {
  mode: 'idle',
  trackType: 'AVO',
  points: [],
}

// ---------------------------------------------------------------------------
// Track type constraints
// ---------------------------------------------------------------------------

/**
 * Maximum number of points allowed per track type.
 * AVO: 4 points → 3 segments (2 corners)
 * VOI: 5 points → 4 segments (3 corners)
 * TRAINING: unlimited (represented as Infinity)
 */
export const MAX_POINTS: Record<TrackType, number> = {
  AVO: 4,
  VOI: 5,
  TRAINING: Infinity,
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type DraftTrackAction =
  | { type: 'START_DRAWING'; trackType: TrackType }
  | { type: 'ADD_POINT'; position: GeoJsonPosition }
  | { type: 'UNDO' }
  | { type: 'FINISH' }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; state: DraftTrackState }
  | { type: 'MOVE_POINT'; index: number; position: GeoJsonPosition }
  | { type: 'DELETE_POINT'; index: number }

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function draftTrackReducer(
  state: DraftTrackState,
  action: DraftTrackAction
): DraftTrackState {
  switch (action.type) {
    case 'START_DRAWING':
      // Allow starting from idle or restarting from finished
      if (state.mode === 'drawing') return state
      return { mode: 'drawing', trackType: action.trackType, points: [] }

    case 'ADD_POINT': {
      // Only accept points while drawing
      if (state.mode !== 'drawing') return state
      // Block once the track-type limit is reached
      if (state.points.length >= MAX_POINTS[state.trackType]) return state
      return { ...state, points: [...state.points, action.position] }
    }

    case 'UNDO':
      if (state.mode !== 'drawing' || state.points.length === 0) return state
      return { ...state, points: state.points.slice(0, -1) }

    case 'FINISH':
      // Need at least 2 points to form a track
      if (state.mode !== 'drawing' || state.points.length < 2) return state
      return { ...state, mode: 'finished' }

    case 'RESET':
      return INITIAL_STATE

    case 'HYDRATE':
      return action.state

    case 'MOVE_POINT': {
      // Only allowed while drawing; index must be in range
      if (state.mode !== 'drawing') return state
      if (action.index < 0 || action.index >= state.points.length) return state
      const moved = [...state.points]
      moved[action.index] = action.position
      return { ...state, points: moved }
    }

    case 'DELETE_POINT': {
      // Only allowed while drawing; must keep at least 1 point
      if (state.mode !== 'drawing') return state
      if (action.index < 0 || action.index >= state.points.length) return state
      if (state.points.length <= 1) return state
      const remaining = state.points.filter((_, i) => i !== action.index)
      return { ...state, points: remaining }
    }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Derived values — computed from state, not stored
// ---------------------------------------------------------------------------

export interface SegmentInfo {
  index: number
  lengthMeters: number
  /** True (grid) bearing, 0–360°. */
  bearingDegrees: number
  /**
   * Magnetic compass bearing, 0–360°.
   * Computed by subtracting the WMM declination at the segment midpoint.
   * Equal to bearingDegrees when declination data is unavailable.
   */
  compassBearingDegrees: number
  /**
   * True when this segment is shorter than the 150 m minimum required by AVO and VOI rules.
   * Always false for TRAINING (no minimum applies).
   */
  isTooShort: boolean
}

export interface DraftTrackDerived {
  segments: TrackSegment[]
  segmentInfos: SegmentInfo[]
  totalLengthMeters: number
  canFinish: boolean
  canUndo: boolean
  /**
   * True when the point limit for AVO/VOI has been reached.
   * TRAINING never reaches a limit (always false).
   * Used by the UI to auto-trigger Finish or disable further point adding.
   */
  isPointLimitReached: boolean
  /**
   * True when at least one segment is below the 150 m minimum (AVO/VOI only).
   * Always false for TRAINING.
   */
  hasShortSegment: boolean
  /**
   * True when start and finish are less than 150 m apart in a straight line
   * (AVO/VOI only). Catches doubling-back tracks where all segments pass the
   * length check but the key-element separation rule is still violated.
   * Always false for TRAINING.
   */
  startFinishTooClose: boolean
  /**
   * VOI only: valid lay pit zones per segment (50 m excluded at each end).
   * Empty for AVO and TRAINING.
   */
  layPitZones: LayPitZone[]
  /**
   * VOI only: break corner eligibility for each corner (0-based index).
   * Empty for AVO and TRAINING.
   */
  breakEligibility: BreakEligibility[]
  /**
   * Fully assembled Track with START + FINISH objects.
   * Only present when mode === 'finished'.
   */
  finishedTrack: Track | null
}

export function deriveDraftTrack(state: DraftTrackState): DraftTrackDerived {
  const segments = segmentsFromGeoJson(state.points)
  const MIN_SEGMENT_LENGTH_METERS = 150
  const enforceMinLength = state.trackType !== 'TRAINING'

  const segmentInfos: SegmentInfo[] = segments.map((s) => {
    const lengthMeters = getSegmentLengthMeters(s)
    const bearingDegrees = getSegmentBearingDegrees(s)
    // Use segment midpoint for declination — more accurate than either endpoint
    const midpoint = {
      lat: (s.start.lat + s.end.lat) / 2,
      lon: (s.start.lon + s.end.lon) / 2,
    }
    const declination = getDeclinationDegrees(midpoint)
    return {
      index: s.sequenceIndex,
      lengthMeters,
      bearingDegrees,
      compassBearingDegrees: trueToMagneticBearing(bearingDegrees, declination),
      isTooShort: enforceMinLength && lengthMeters < MIN_SEGMENT_LENGTH_METERS,
    }
  })

  const hasShortSegment = segmentInfos.some((s) => s.isTooShort)

  /**
   * Check start→finish straight-line distance (AVO/VOI only).
   * Segments can each be ≥150 m while a doubling-back track brings start and
   * finish closer than 150 m — violating the key-element separation rule.
   * Only meaningful once there are at least 2 points (1 segment).
   */
  const startFinishTooClose =
    enforceMinLength &&
    state.points.length >= 2 &&
    distanceBetweenCoordinatesMeters(
      coordinateFromGeoJson(state.points[0]),
      coordinateFromGeoJson(state.points[state.points.length - 1])
    ) < MIN_SEGMENT_LENGTH_METERS
  const totalLengthMeters = getTrackLengthMeters({
    id: 'draft',
    name: 'draft',
    type: state.trackType,
    segments,
    objects: [],
  })

  // Assemble a proper Track once drawing is finished
  const finishedTrack: Track | null =
    state.mode === 'finished' && state.points.length >= 2
      ? {
          id: 'draft',
          name: `${state.trackType} track`,
          type: state.trackType,
          segments,
          objects: [
            {
              type: 'START',
              id: 'obj-start',
              position: coordinateFromGeoJson(state.points[0]),
            },
            {
              type: 'FINISH',
              id: 'obj-finish',
              position: coordinateFromGeoJson(state.points[state.points.length - 1]),
            },
          ],
        }
      : null

  const maxPoints = MAX_POINTS[state.trackType]
  const isPointLimitReached =
    state.mode === 'drawing' && maxPoints !== Infinity && state.points.length >= maxPoints

  /**
   * canFinish rules:
   * - AVO/VOI: only when the exact point limit has been reached (track is complete)
   * - TRAINING: any time there are ≥2 points while drawing
   */
  const canFinish =
    state.mode === 'drawing' &&
    (state.trackType === 'TRAINING' ? state.points.length >= 2 : state.points.length >= maxPoints)

  // Build a temporary Track for VOI computations during drawing (before finish)
  // Use finishedTrack when available, otherwise build from current segments
  const trackForVoi: Track | null =
    finishedTrack ??
    (state.trackType === 'VOI' && segments.length > 0
      ? {
          id: 'draft',
          name: 'draft',
          type: 'VOI',
          segments,
          objects: [],
        }
      : null)

  const layPitZones: LayPitZone[] = trackForVoi ? getVoiLayPitZones(trackForVoi) : []
  const breakEligibility: BreakEligibility[] = trackForVoi
    ? getVoiBreakEligibility(trackForVoi)
    : []

  return {
    segments,
    segmentInfos,
    totalLengthMeters,
    canFinish,
    canUndo: state.mode === 'drawing' && state.points.length > 0,
    isPointLimitReached,
    hasShortSegment,
    startFinishTooClose,
    layPitZones,
    breakEligibility,
    finishedTrack,
  }
}
