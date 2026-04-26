// web/src/features/track-editor/draftTrackReducer.ts
//
// Pure reducer for draft track editor state.
// No React dependency — fully unit-testable in isolation.

import type { TrackType, TrackSegment, Track } from '@trail-tracker/domain'
import {
  getTrackLengthMeters,
  getSegmentBearingDegrees,
  getSegmentLengthMeters,
} from '@trail-tracker/domain'
import {
  segmentsFromGeoJson,
  coordinateFromGeoJson,
  type GeoJsonPosition,
} from '../../adapters/geojson'

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
  bearingDegrees: number
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
   * Fully assembled Track with START + FINISH objects.
   * Only present when mode === 'finished'.
   */
  finishedTrack: Track | null
}

export function deriveDraftTrack(state: DraftTrackState): DraftTrackDerived {
  const segments = segmentsFromGeoJson(state.points)
  const segmentInfos: SegmentInfo[] = segments.map((s) => ({
    index: s.sequenceIndex,
    lengthMeters: getSegmentLengthMeters(s),
    bearingDegrees: getSegmentBearingDegrees(s),
  }))
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

  return {
    segments,
    segmentInfos,
    totalLengthMeters,
    canFinish,
    canUndo: state.mode === 'drawing' && state.points.length > 0,
    isPointLimitReached,
    finishedTrack,
  }
}
