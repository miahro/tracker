// web/src/features/track-editor/draftTrackReducer.test.ts
import { describe, it, expect } from 'vitest'
import {
  draftTrackReducer,
  deriveDraftTrack,
  INITIAL_STATE,
  type DraftTrackState,
} from './draftTrackReducer'
import type { GeoJsonPosition } from '../../adapters/geojson'

// Finnish coordinates used throughout — realistic for a MEJÄ track
const P1: GeoJsonPosition = [25.1, 60.3]
const P2: GeoJsonPosition = [25.12, 60.31]
const P3: GeoJsonPosition = [25.14, 60.32]
const P4: GeoJsonPosition = [25.16, 60.33]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function drawing(...points: GeoJsonPosition[]): DraftTrackState {
  let state = draftTrackReducer(INITIAL_STATE, { type: 'START_DRAWING', trackType: 'AVO' })
  for (const p of points) {
    state = draftTrackReducer(state, { type: 'ADD_POINT', position: p })
  }
  return state
}

// ---------------------------------------------------------------------------
// INITIAL_STATE
// ---------------------------------------------------------------------------

describe('INITIAL_STATE', () => {
  it('starts idle with no points and AVO type', () => {
    expect(INITIAL_STATE.mode).toBe('idle')
    expect(INITIAL_STATE.points).toHaveLength(0)
    expect(INITIAL_STATE.trackType).toBe('AVO')
  })
})

// ---------------------------------------------------------------------------
// START_DRAWING
// ---------------------------------------------------------------------------

describe('START_DRAWING', () => {
  it('transitions from idle to drawing', () => {
    const state = draftTrackReducer(INITIAL_STATE, { type: 'START_DRAWING', trackType: 'AVO' })
    expect(state.mode).toBe('drawing')
    expect(state.points).toHaveLength(0)
  })

  it('sets the requested track type', () => {
    const state = draftTrackReducer(INITIAL_STATE, { type: 'START_DRAWING', trackType: 'VOI' })
    expect(state.trackType).toBe('VOI')
  })

  it('clears points when restarting from finished', () => {
    const finished = { ...drawing(P1, P2), mode: 'finished' as const }
    const restarted = draftTrackReducer(finished, { type: 'START_DRAWING', trackType: 'TRAINING' })
    expect(restarted.mode).toBe('drawing')
    expect(restarted.points).toHaveLength(0)
    expect(restarted.trackType).toBe('TRAINING')
  })

  it('is a no-op when already drawing', () => {
    const state = drawing(P1)
    const again = draftTrackReducer(state, { type: 'START_DRAWING', trackType: 'VOI' })
    expect(again).toBe(state) // same reference — no change
  })
})

// ---------------------------------------------------------------------------
// ADD_POINT
// ---------------------------------------------------------------------------

describe('ADD_POINT', () => {
  it('appends a point while drawing', () => {
    const state = drawing(P1)
    expect(state.points).toHaveLength(1)
    expect(state.points[0]).toEqual(P1)
  })

  it('appends multiple points in order', () => {
    const state = drawing(P1, P2, P3)
    expect(state.points).toEqual([P1, P2, P3])
  })

  it('is a no-op when idle', () => {
    const state = draftTrackReducer(INITIAL_STATE, { type: 'ADD_POINT', position: P1 })
    expect(state.points).toHaveLength(0)
  })

  it('is a no-op when finished', () => {
    const finished = { ...drawing(P1, P2), mode: 'finished' as const }
    const state = draftTrackReducer(finished, { type: 'ADD_POINT', position: P3 })
    expect(state.points).toHaveLength(2)
  })

  // AVO max = 4 points
  it('blocks the 5th point for AVO', () => {
    const P5: GeoJsonPosition = [25.18, 60.34]
    const state = drawing(P1, P2, P3, P4) // exactly 4 — at limit
    const blocked = draftTrackReducer(state, { type: 'ADD_POINT', position: P5 })
    expect(blocked.points).toHaveLength(4)
  })

  it('allows exactly 4 points for AVO', () => {
    const state = drawing(P1, P2, P3, P4)
    expect(state.points).toHaveLength(4)
  })

  // VOI max = 5 points
  it('allows exactly 5 points for VOI', () => {
    const P5: GeoJsonPosition = [25.18, 60.34]
    let state = draftTrackReducer(INITIAL_STATE, { type: 'START_DRAWING', trackType: 'VOI' })
    for (const p of [P1, P2, P3, P4, P5]) {
      state = draftTrackReducer(state, { type: 'ADD_POINT', position: p })
    }
    expect(state.points).toHaveLength(5)
  })

  it('blocks the 6th point for VOI', () => {
    const P5: GeoJsonPosition = [25.18, 60.34]
    const P6: GeoJsonPosition = [25.2, 60.35]
    let state = draftTrackReducer(INITIAL_STATE, { type: 'START_DRAWING', trackType: 'VOI' })
    for (const p of [P1, P2, P3, P4, P5]) {
      state = draftTrackReducer(state, { type: 'ADD_POINT', position: p })
    }
    const blocked = draftTrackReducer(state, { type: 'ADD_POINT', position: P6 })
    expect(blocked.points).toHaveLength(5)
  })

  // TRAINING has no limit
  it('allows more than 5 points for TRAINING', () => {
    const P5: GeoJsonPosition = [25.18, 60.34]
    const P6: GeoJsonPosition = [25.2, 60.35]
    let state = draftTrackReducer(INITIAL_STATE, { type: 'START_DRAWING', trackType: 'TRAINING' })
    for (const p of [P1, P2, P3, P4, P5, P6]) {
      state = draftTrackReducer(state, { type: 'ADD_POINT', position: p })
    }
    expect(state.points).toHaveLength(6)
  })
})

// ---------------------------------------------------------------------------
// UNDO
// ---------------------------------------------------------------------------

describe('UNDO', () => {
  it('removes the last point', () => {
    const state = draftTrackReducer(drawing(P1, P2), { type: 'UNDO' })
    expect(state.points).toEqual([P1])
  })

  it('results in empty points after undoing the only point', () => {
    const state = draftTrackReducer(drawing(P1), { type: 'UNDO' })
    expect(state.points).toHaveLength(0)
  })

  it('is a no-op when no points exist', () => {
    const empty = draftTrackReducer(INITIAL_STATE, { type: 'START_DRAWING', trackType: 'AVO' })
    const state = draftTrackReducer(empty, { type: 'UNDO' })
    expect(state.points).toHaveLength(0)
  })

  it('is a no-op when idle', () => {
    const state = draftTrackReducer(INITIAL_STATE, { type: 'UNDO' })
    expect(state).toBe(INITIAL_STATE)
  })
})

// ---------------------------------------------------------------------------
// FINISH
// ---------------------------------------------------------------------------

describe('FINISH', () => {
  it('transitions to finished with 2+ points', () => {
    const state = draftTrackReducer(drawing(P1, P2), { type: 'FINISH' })
    expect(state.mode).toBe('finished')
  })

  it('preserves points after finishing', () => {
    const state = draftTrackReducer(drawing(P1, P2, P3), { type: 'FINISH' })
    expect(state.points).toEqual([P1, P2, P3])
  })

  it('is a no-op with fewer than 2 points', () => {
    const onePoint = drawing(P1)
    const state = draftTrackReducer(onePoint, { type: 'FINISH' })
    expect(state.mode).toBe('drawing')
  })

  it('is a no-op when idle', () => {
    const state = draftTrackReducer(INITIAL_STATE, { type: 'FINISH' })
    expect(state.mode).toBe('idle')
  })
})

// ---------------------------------------------------------------------------
// RESET
// ---------------------------------------------------------------------------

describe('RESET', () => {
  it('returns to initial state from drawing', () => {
    const state = draftTrackReducer(drawing(P1, P2, P3), { type: 'RESET' })
    expect(state).toEqual(INITIAL_STATE)
  })

  it('returns to initial state from finished', () => {
    const finished = { ...drawing(P1, P2), mode: 'finished' as const }
    const state = draftTrackReducer(finished, { type: 'RESET' })
    expect(state).toEqual(INITIAL_STATE)
  })
})

describe('MOVE_POINT', () => {
  const NEW_POS: GeoJsonPosition = [25.2, 60.4]

  it('moves a point at a given index', () => {
    const state = draftTrackReducer(drawing(P1, P2, P3), {
      type: 'MOVE_POINT',
      index: 1,
      position: NEW_POS,
    })
    expect(state.points[1]).toEqual(NEW_POS)
    expect(state.points[0]).toEqual(P1)
    expect(state.points[2]).toEqual(P3)
  })

  it('moves the first point', () => {
    const state = draftTrackReducer(drawing(P1, P2), {
      type: 'MOVE_POINT',
      index: 0,
      position: NEW_POS,
    })
    expect(state.points[0]).toEqual(NEW_POS)
  })

  it('moves the last point', () => {
    const state = draftTrackReducer(drawing(P1, P2, P3), {
      type: 'MOVE_POINT',
      index: 2,
      position: NEW_POS,
    })
    expect(state.points[2]).toEqual(NEW_POS)
  })

  it('is a no-op when not in drawing mode', () => {
    const finished = { ...drawing(P1, P2), mode: 'finished' as const }
    const state = draftTrackReducer(finished, { type: 'MOVE_POINT', index: 0, position: NEW_POS })
    expect(state.points[0]).toEqual(P1)
  })

  it('is a no-op for out-of-range index', () => {
    const state = draftTrackReducer(drawing(P1, P2), {
      type: 'MOVE_POINT',
      index: 5,
      position: NEW_POS,
    })
    expect(state.points).toHaveLength(2)
  })

  it('preserves point count', () => {
    const state = draftTrackReducer(drawing(P1, P2, P3), {
      type: 'MOVE_POINT',
      index: 1,
      position: NEW_POS,
    })
    expect(state.points).toHaveLength(3)
  })
})

describe('DELETE_POINT', () => {
  it('removes a point at a given index', () => {
    const state = draftTrackReducer(drawing(P1, P2, P3), { type: 'DELETE_POINT', index: 1 })
    expect(state.points).toHaveLength(2)
    expect(state.points[0]).toEqual(P1)
    expect(state.points[1]).toEqual(P3)
  })

  it('removes the first point', () => {
    const state = draftTrackReducer(drawing(P1, P2, P3), { type: 'DELETE_POINT', index: 0 })
    expect(state.points[0]).toEqual(P2)
    expect(state.points).toHaveLength(2)
  })

  it('removes the last point', () => {
    const state = draftTrackReducer(drawing(P1, P2, P3), { type: 'DELETE_POINT', index: 2 })
    expect(state.points[state.points.length - 1]).toEqual(P2)
    expect(state.points).toHaveLength(2)
  })

  it('is a no-op when only 1 point remains', () => {
    const state = draftTrackReducer(drawing(P1), { type: 'DELETE_POINT', index: 0 })
    expect(state.points).toHaveLength(1)
  })

  it('is a no-op when not in drawing mode', () => {
    const finished = { ...drawing(P1, P2, P3), mode: 'finished' as const }
    const state = draftTrackReducer(finished, { type: 'DELETE_POINT', index: 1 })
    expect(state.points).toHaveLength(3)
  })

  it('is a no-op for out-of-range index', () => {
    const state = draftTrackReducer(drawing(P1, P2), { type: 'DELETE_POINT', index: 5 })
    expect(state.points).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// deriveDraftTrack
// ---------------------------------------------------------------------------

describe('deriveDraftTrack', () => {
  it('returns empty segments and zero length when idle', () => {
    const d = deriveDraftTrack(INITIAL_STATE)
    expect(d.segments).toHaveLength(0)
    expect(d.segmentInfos).toHaveLength(0)
    expect(d.totalLengthMeters).toBe(0)
  })

  it('returns no segments for a single point', () => {
    const d = deriveDraftTrack(drawing(P1))
    expect(d.segments).toHaveLength(0)
  })

  it('returns N-1 segments for N points', () => {
    const d = deriveDraftTrack(drawing(P1, P2, P3, P4))
    expect(d.segments).toHaveLength(3)
    expect(d.segmentInfos).toHaveLength(3)
  })

  it('segmentInfos bearing is in 0–360 range', () => {
    const d = deriveDraftTrack(drawing(P1, P2, P3))
    for (const info of d.segmentInfos) {
      expect(info.bearingDegrees).toBeGreaterThanOrEqual(0)
      expect(info.bearingDegrees).toBeLessThan(360)
    }
  })

  it('compassBearingDegrees is in 0–360 range', () => {
    const d = deriveDraftTrack(drawing(P1, P2, P3))
    for (const info of d.segmentInfos) {
      expect(info.compassBearingDegrees).toBeGreaterThanOrEqual(0)
      expect(info.compassBearingDegrees).toBeLessThan(360)
    }
  })

  it('compassBearingDegrees differs from true bearing by approximately Finnish declination (~10°)', () => {
    // P1/P2 are Finnish coords — declination is ~+10°, so compass < true
    const d = deriveDraftTrack(drawing(P1, P2))
    const diff = d.segmentInfos[0].bearingDegrees - d.segmentInfos[0].compassBearingDegrees
    // Allow for wrap-around: diff should be ~+10 (or ~−350 if wrapped)
    const normalised = ((diff % 360) + 360) % 360
    expect(normalised).toBeGreaterThan(5)
    expect(normalised).toBeLessThan(15)
  })

  it('segmentInfos lengthMeters is positive', () => {
    const d = deriveDraftTrack(drawing(P1, P2))
    expect(d.segmentInfos[0].lengthMeters).toBeGreaterThan(0)
  })

  it('computes a positive total length for 2+ points', () => {
    const d = deriveDraftTrack(drawing(P1, P2))
    expect(d.totalLengthMeters).toBeGreaterThan(0)
  })

  it('canUndo is false when idle', () => {
    expect(deriveDraftTrack(INITIAL_STATE).canUndo).toBe(false)
  })

  it('canUndo is false with no points', () => {
    const empty = draftTrackReducer(INITIAL_STATE, { type: 'START_DRAWING', trackType: 'AVO' })
    expect(deriveDraftTrack(empty).canUndo).toBe(false)
  })

  it('canUndo is true with at least one point while drawing', () => {
    expect(deriveDraftTrack(drawing(P1)).canUndo).toBe(true)
  })

  it('canFinish is false with fewer than 2 points', () => {
    expect(deriveDraftTrack(drawing(P1)).canFinish).toBe(false)
  })

  // AVO requires exactly 4 points — canFinish is false before that
  it('canFinish is false for AVO with only 2 points', () => {
    expect(deriveDraftTrack(drawing(P1, P2)).canFinish).toBe(false)
  })

  it('canFinish is false for AVO with 3 points', () => {
    expect(deriveDraftTrack(drawing(P1, P2, P3)).canFinish).toBe(false)
  })

  it('canFinish is true for AVO at exactly 4 points', () => {
    const P5: GeoJsonPosition = [25.18, 60.34]
    expect(deriveDraftTrack(drawing(P1, P2, P3, P4)).canFinish).toBe(true)
    void P5
  })

  // TRAINING: canFinish at 2+ points (no upper limit)
  it('canFinish is true for TRAINING with 2+ points while drawing', () => {
    function trainingDrawing(...points: GeoJsonPosition[]): DraftTrackState {
      let state = draftTrackReducer(INITIAL_STATE, { type: 'START_DRAWING', trackType: 'TRAINING' })
      for (const p of points) {
        state = draftTrackReducer(state, { type: 'ADD_POINT', position: p })
      }
      return state
    }
    expect(deriveDraftTrack(trainingDrawing(P1, P2)).canFinish).toBe(true)
    expect(deriveDraftTrack(trainingDrawing(P1, P2, P3, P4)).canFinish).toBe(true)
  })

  it('canFinish is false when finished', () => {
    const finished = { ...drawing(P1, P2), mode: 'finished' as const }
    expect(deriveDraftTrack(finished).canFinish).toBe(false)
  })

  // isPointLimitReached
  it('isPointLimitReached is false before AVO limit', () => {
    expect(deriveDraftTrack(drawing(P1, P2, P3)).isPointLimitReached).toBe(false)
  })

  it('isPointLimitReached is true at AVO limit (4 points)', () => {
    expect(deriveDraftTrack(drawing(P1, P2, P3, P4)).isPointLimitReached).toBe(true)
  })

  it('isPointLimitReached is never true for TRAINING', () => {
    const P5: GeoJsonPosition = [25.18, 60.34]
    const P6: GeoJsonPosition = [25.2, 60.35]
    let state = draftTrackReducer(INITIAL_STATE, { type: 'START_DRAWING', trackType: 'TRAINING' })
    for (const p of [P1, P2, P3, P4, P5, P6]) {
      state = draftTrackReducer(state, { type: 'ADD_POINT', position: p })
    }
    expect(deriveDraftTrack(state).isPointLimitReached).toBe(false)
  })

  it('isPointLimitReached is false when idle', () => {
    expect(deriveDraftTrack(INITIAL_STATE).isPointLimitReached).toBe(false)
  })

  // isTooShort / hasShortSegment
  // P1→P2 are ~1.7 km apart (realistic Finnish coords) — well above 150 m
  // We need points close enough to be under 150 m for the warning tests
  const CLOSE_A: GeoJsonPosition = [25.1, 60.3]
  const CLOSE_B: GeoJsonPosition = [25.1005, 60.3] // ~33 m east of CLOSE_A

  it('isTooShort is false for a segment clearly above 150 m (AVO)', () => {
    const d = deriveDraftTrack(drawing(P1, P2))
    expect(d.segmentInfos[0].isTooShort).toBe(false)
  })

  it('isTooShort is true for a segment under 150 m (AVO)', () => {
    const d = deriveDraftTrack(drawing(CLOSE_A, CLOSE_B))
    expect(d.segmentInfos[0].isTooShort).toBe(true)
  })

  it('isTooShort is always false for TRAINING regardless of length', () => {
    function trainingState(...pts: GeoJsonPosition[]): DraftTrackState {
      let s = draftTrackReducer(INITIAL_STATE, { type: 'START_DRAWING', trackType: 'TRAINING' })
      for (const p of pts) s = draftTrackReducer(s, { type: 'ADD_POINT', position: p })
      return s
    }
    const d = deriveDraftTrack(trainingState(CLOSE_A, CLOSE_B))
    expect(d.segmentInfos[0].isTooShort).toBe(false)
  })

  it('hasShortSegment is false when all segments are long enough (AVO)', () => {
    const d = deriveDraftTrack(drawing(P1, P2, P3))
    expect(d.hasShortSegment).toBe(false)
  })

  it('hasShortSegment is true when any segment is under 150 m (AVO)', () => {
    const d = deriveDraftTrack(drawing(P1, P2, CLOSE_A, CLOSE_B))
    // P2→CLOSE_A may or may not be short, but CLOSE_A→CLOSE_B definitely is
    expect(d.hasShortSegment).toBe(true)
  })

  it('hasShortSegment is false for TRAINING even with short segments', () => {
    let s = draftTrackReducer(INITIAL_STATE, { type: 'START_DRAWING', trackType: 'TRAINING' })
    for (const p of [CLOSE_A, CLOSE_B]) {
      s = draftTrackReducer(s, { type: 'ADD_POINT', position: p })
    }
    expect(deriveDraftTrack(s).hasShortSegment).toBe(false)
  })

  it('hasShortSegment is false with no segments', () => {
    expect(deriveDraftTrack(INITIAL_STATE).hasShortSegment).toBe(false)
  })

  // startFinishTooClose
  // A doubling-back AVO track: both segments are ~600 m (pass length check)
  // but start and finish are only ~80 m apart (fail key-element separation)
  const DOUBBACK_START: GeoJsonPosition = [25.1, 60.3]
  const DOUBBACK_MID: GeoJsonPosition = [25.1, 60.3054] // ~600 m north
  const DOUBBACK_END: GeoJsonPosition = [25.1015, 60.3] // ~80 m east of start

  it('startFinishTooClose is false for a normal non-doubling track (AVO)', () => {
    // P1, P2, P3 are all distinct and spread out — start→finish well over 150 m
    const d = deriveDraftTrack(drawing(P1, P2, P3))
    expect(d.startFinishTooClose).toBe(false)
  })

  it('startFinishTooClose is true when track doubles back to within 150 m of start (AVO)', () => {
    const d = deriveDraftTrack(drawing(DOUBBACK_START, DOUBBACK_MID, DOUBBACK_END))
    // Both segments ≥ 150 m — but start→finish is ~80 m
    expect(d.segmentInfos[0].isTooShort).toBe(false)
    expect(d.segmentInfos[1].isTooShort).toBe(false)
    expect(d.startFinishTooClose).toBe(true)
  })

  it('startFinishTooClose is false for TRAINING even when start and finish are close', () => {
    let s = draftTrackReducer(INITIAL_STATE, { type: 'START_DRAWING', trackType: 'TRAINING' })
    for (const p of [DOUBBACK_START, DOUBBACK_MID, DOUBBACK_END]) {
      s = draftTrackReducer(s, { type: 'ADD_POINT', position: p })
    }
    expect(deriveDraftTrack(s).startFinishTooClose).toBe(false)
  })

  it('startFinishTooClose is false with only one point', () => {
    expect(deriveDraftTrack(drawing(P1)).startFinishTooClose).toBe(false)
  })

  it('startFinishTooClose is false when idle', () => {
    expect(deriveDraftTrack(INITIAL_STATE).startFinishTooClose).toBe(false)
  })

  it('finishedTrack is null when drawing', () => {
    expect(deriveDraftTrack(drawing(P1, P2)).finishedTrack).toBeNull()
  })

  it('finishedTrack is null when idle', () => {
    expect(deriveDraftTrack(INITIAL_STATE).finishedTrack).toBeNull()
  })

  it('finishedTrack is assembled with START and FINISH objects when finished', () => {
    const finished = { ...drawing(P1, P2, P3), mode: 'finished' as const }
    const track = deriveDraftTrack(finished).finishedTrack

    expect(track).not.toBeNull()
    expect(track!.objects).toHaveLength(2)
    expect(track!.objects[0].type).toBe('START')
    expect(track!.objects[1].type).toBe('FINISH')
  })

  it('finishedTrack START position matches first point', () => {
    const finished = { ...drawing(P1, P2), mode: 'finished' as const }
    const track = deriveDraftTrack(finished).finishedTrack!
    const start = track.objects.find((o) => o.type === 'START')!

    expect(start.position).toEqual({ lat: P1[1], lon: P1[0] })
  })

  it('finishedTrack FINISH position matches last point', () => {
    const finished = { ...drawing(P1, P2, P3), mode: 'finished' as const }
    const track = deriveDraftTrack(finished).finishedTrack!
    const finish = track.objects.find((o) => o.type === 'FINISH')!

    expect(finish.position).toEqual({ lat: P3[1], lon: P3[0] })
  })

  it('finishedTrack preserves track type', () => {
    const voiState: DraftTrackState = { mode: 'finished', trackType: 'VOI', points: [P1, P2] }
    expect(deriveDraftTrack(voiState).finishedTrack!.type).toBe('VOI')
  })

  it('finishedTrack works for TRAINING type', () => {
    const trainingState: DraftTrackState = {
      mode: 'finished',
      trackType: 'TRAINING',
      points: [P1, P2, P3, P4],
    }
    const track = deriveDraftTrack(trainingState).finishedTrack!
    expect(track.type).toBe('TRAINING')
    expect(track.segments).toHaveLength(3)
  })
})
