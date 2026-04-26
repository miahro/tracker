// web/src/features/track-editor/useDraftTrack.ts

import { useReducer, useEffect, useRef } from 'react'
import type { TrackType } from '@trail-tracker/domain'
import {
  draftTrackReducer,
  deriveDraftTrack,
  INITIAL_STATE,
  type DraftTrackState,
  type DraftTrackDerived,
} from './draftTrackReducer'
import type { GeoJsonPosition } from '../../adapters/geojson'
import { saveTrackState } from '../../persistence'

export interface UseDraftTrackResult {
  state: DraftTrackState
  derived: DraftTrackDerived
  startDrawing: (trackType: TrackType) => void
  addPoint: (position: GeoJsonPosition) => void
  undo: () => void
  finish: () => void
  reset: () => void
}

export function useDraftTrack(initialState: DraftTrackState = INITIAL_STATE): UseDraftTrackResult {
  const [state, dispatch] = useReducer(draftTrackReducer, initialState)
  const derived = deriveDraftTrack(state)

  // Track whether we've completed the first render with the real initial state.
  // Don't save until after that — avoids overwriting persisted data with INITIAL_STATE.
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    void saveTrackState(state)
  }, [state])

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
