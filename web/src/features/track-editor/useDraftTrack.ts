// web/src/features/track-editor/useDraftTrack.ts

import { useReducer, useEffect, useRef, useState, useCallback } from 'react'
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
  selectedPointIndex: number | null
  startDrawing: (trackType: TrackType) => void
  addPoint: (position: GeoJsonPosition) => void
  movePoint: (index: number, position: GeoJsonPosition) => void
  deletePoint: (index: number) => void
  selectPoint: (index: number | null) => void
  undo: () => void
  finish: () => void
  reset: () => void
}

export function useDraftTrack(initialState: DraftTrackState = INITIAL_STATE): UseDraftTrackResult {
  const [state, dispatch] = useReducer(draftTrackReducer, initialState)
  const derived = deriveDraftTrack(state)
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    void saveTrackState(state)
  }, [state])

  // Clear selection when mode changes (e.g. after reset or finish)
  useEffect(() => {
    setSelectedPointIndex(null)
  }, [state.mode])

  const selectPoint = useCallback((index: number | null) => {
    setSelectedPointIndex(index)
  }, [])

  const movePoint = useCallback((index: number, position: GeoJsonPosition) => {
    dispatch({ type: 'MOVE_POINT', index, position })
  }, [])

  const deletePoint = useCallback((index: number) => {
    dispatch({ type: 'DELETE_POINT', index })
    setSelectedPointIndex(null)
  }, [])

  return {
    state,
    derived,
    selectedPointIndex,
    startDrawing: (trackType) => dispatch({ type: 'START_DRAWING', trackType }),
    addPoint: (position) => dispatch({ type: 'ADD_POINT', position }),
    movePoint,
    deletePoint,
    selectPoint,
    undo: () => dispatch({ type: 'UNDO' }),
    finish: () => dispatch({ type: 'FINISH' }),
    reset: () => {
      dispatch({ type: 'RESET' })
      setSelectedPointIndex(null)
    },
  }
}
