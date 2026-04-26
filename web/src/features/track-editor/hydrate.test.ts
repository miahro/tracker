// web/src/features/track-editor/hydrate.test.ts
//
// Tests for the HYDRATE action — used to restore persisted state on mount.

import { describe, it, expect } from 'vitest'
import { draftTrackReducer, INITIAL_STATE } from './draftTrackReducer'
import type { DraftTrackState } from './draftTrackReducer'
import type { GeoJsonPosition } from '../../adapters/geojson'

const P1: GeoJsonPosition = [25.1, 60.3]
const P2: GeoJsonPosition = [25.11, 60.31]
const P3: GeoJsonPosition = [25.12, 60.32]

describe('HYDRATE', () => {
  it('replaces idle state with a drawing state', () => {
    const saved: DraftTrackState = {
      mode: 'drawing',
      trackType: 'AVO',
      points: [P1, P2, P3],
    }
    const result = draftTrackReducer(INITIAL_STATE, { type: 'HYDRATE', state: saved })
    expect(result).toEqual(saved)
  })

  it('replaces idle state with a finished state', () => {
    const saved: DraftTrackState = {
      mode: 'finished',
      trackType: 'VOI',
      points: [P1, P2, P3],
    }
    const result = draftTrackReducer(INITIAL_STATE, { type: 'HYDRATE', state: saved })
    expect(result.mode).toBe('finished')
    expect(result.trackType).toBe('VOI')
    expect(result.points).toHaveLength(3)
  })

  it('can hydrate back to idle', () => {
    const drawing: DraftTrackState = { mode: 'drawing', trackType: 'AVO', points: [P1] }
    const withPoints = draftTrackReducer(INITIAL_STATE, { type: 'HYDRATE', state: drawing })
    const backToIdle = draftTrackReducer(withPoints, { type: 'HYDRATE', state: INITIAL_STATE })
    expect(backToIdle).toEqual(INITIAL_STATE)
  })

  it('continues normally after hydration — can add a point', () => {
    const saved: DraftTrackState = { mode: 'drawing', trackType: 'AVO', points: [P1, P2] }
    const hydrated = draftTrackReducer(INITIAL_STATE, { type: 'HYDRATE', state: saved })
    const withExtra = draftTrackReducer(hydrated, { type: 'ADD_POINT', position: P3 })
    expect(withExtra.points).toHaveLength(3)
  })

  it('continues normally after hydration — can undo', () => {
    const saved: DraftTrackState = { mode: 'drawing', trackType: 'AVO', points: [P1, P2, P3] }
    const hydrated = draftTrackReducer(INITIAL_STATE, { type: 'HYDRATE', state: saved })
    const undone = draftTrackReducer(hydrated, { type: 'UNDO' })
    expect(undone.points).toHaveLength(2)
  })
})
