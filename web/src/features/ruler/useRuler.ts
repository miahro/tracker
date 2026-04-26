// web/src/features/ruler/useRuler.ts
//
// Ruler tool state machine.
//
// States:
//   idle            — ruler not active
//   awaiting-first  — active, waiting for first click
//   awaiting-second — first point placed, waiting for second click
//   showing         — both points placed, distance displayed
//
// The ruler is independent of the track drawing state.

import { useState, useCallback } from 'react'
import { distanceBetweenCoordinatesMeters } from '@trail-tracker/domain'
import type { GeoJsonPosition } from '../../adapters/geojson'

export type RulerMode = 'idle' | 'awaiting-first' | 'awaiting-second' | 'showing'

export interface RulerState {
  mode: RulerMode
  pointA: GeoJsonPosition | null
  pointB: GeoJsonPosition | null
  /** Distance in meters, or null when fewer than 2 points are placed */
  distanceMeters: number | null
}

export interface UseRulerReturn {
  ruler: RulerState
  /** Start the ruler (enters awaiting-first) */
  startRuler: () => void
  /** Handle a map click — places pointA then pointB */
  handleRulerClick: (position: GeoJsonPosition) => void
  /** Reset back to idle */
  resetRuler: () => void
}

const INITIAL: RulerState = {
  mode: 'idle',
  pointA: null,
  pointB: null,
  distanceMeters: null,
}

export function useRuler(): UseRulerReturn {
  const [ruler, setRuler] = useState<RulerState>(INITIAL)

  const startRuler = useCallback(() => {
    setRuler({ mode: 'awaiting-first', pointA: null, pointB: null, distanceMeters: null })
  }, [])

  const handleRulerClick = useCallback((position: GeoJsonPosition) => {
    setRuler((prev) => {
      if (prev.mode === 'awaiting-first') {
        return { ...prev, mode: 'awaiting-second', pointA: position }
      }

      if (prev.mode === 'awaiting-second' && prev.pointA) {
        const distanceMeters = distanceBetweenCoordinatesMeters(
          { lat: prev.pointA[1], lon: prev.pointA[0] },
          { lat: position[1], lon: position[0] }
        )
        return { mode: 'showing', pointA: prev.pointA, pointB: position, distanceMeters }
      }

      // In 'showing' mode a new click restarts from that point
      if (prev.mode === 'showing') {
        return { mode: 'awaiting-second', pointA: position, pointB: null, distanceMeters: null }
      }

      return prev
    })
  }, [])

  const resetRuler = useCallback(() => {
    setRuler(INITIAL)
  }, [])

  return { ruler, startRuler, handleRulerClick, resetRuler }
}
