// web/src/features/track-editor/useDraftTrack.ts
//
// React hook for the draft track editor.
// Thin wrapper around draftTrackReducer — all logic lives in the reducer.

import { useReducer } from 'react'
import type { TrackType } from '@trail-tracker/domain'
import {
  draftTrackReducer,
  deriveDraftTrack,
  INITIAL_STATE,
  type DraftTrackState,
  type DraftTrackDerived,
} from './draftTrackReducer'
import type { GeoJsonPosition } from '../../adapters/geojson'

export interface UseDraftTrackResult {
  state: DraftTrackState
  derived: DraftTrackDerived
  startDrawing: (trackType: TrackType) => void
  addPoint: (position: GeoJsonPosition) => void
  undo: () => void
  finish: () => void
  reset: () => void
}

export function useDraftTrack(): UseDraftTrackResult {
  const [state, dispatch] = useReducer(draftTrackReducer, INITIAL_STATE)
  const derived = deriveDraftTrack(state)

  return {
    state,
    derived,
    startDrawing: (trackType) => dispatch({ type: 'START_DRAWING', trackType }),
    addPoint: (position) => dispatch({ type: 'ADD_POINT', position }),
    undo: () => dispatch({ type: 'UNDO' }),
    finish: () => dispatch({ type: 'FINISH' }),
    reset: () => dispatch({ type: 'RESET' }),
  }
}
