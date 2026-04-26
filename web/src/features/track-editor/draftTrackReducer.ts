// web/src/features/track-editor/draftTrackReducer.ts
//
// Pure reducer for draft track editor state.
// No React dependency — fully unit-testable in isolation.

import type { TrackType, TrackSegment } from '@trail-tracker/domain'
import { getTrackLengthMeters } from '@trail-tracker/domain'
import { segmentsFromGeoJson, type GeoJsonPosition } from '../../adapters/geojson'

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

    case 'ADD_POINT':
      // Only accept points while drawing
      if (state.mode !== 'drawing') return state
      return { ...state, points: [...state.points, action.position] }

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

export interface DraftTrackDerived {
  segments: TrackSegment[]
  totalLengthMeters: number
  canFinish: boolean
  canUndo: boolean
}

export function deriveDraftTrack(state: DraftTrackState): DraftTrackDerived {
  const segments = segmentsFromGeoJson(state.points)
  const totalLengthMeters = getTrackLengthMeters({
    id: 'draft',
    name: 'draft',
    type: state.trackType,
    segments,
    objects: [],
  })

  return {
    segments,
    totalLengthMeters,
    canFinish: state.mode === 'drawing' && state.points.length >= 2,
    canUndo: state.mode === 'drawing' && state.points.length > 0,
  }
}
