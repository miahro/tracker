// domain/src/trackObject.test.ts
import { describe, it, expect } from 'vitest'
import type {
  TrackObject,
  TrackObjectStart,
  TrackObjectFinish,
  TrackObjectCorner,
  TrackObjectLayPit,
  TrackObjectBreak,
  TrackObjectMarker,
} from './index'

// ---------------------------------------------------------------------------
// Construction – each variant is valid as a TrackObject
// ---------------------------------------------------------------------------

describe('TrackObject discriminated union', () => {
  it('accepts a START object', () => {
    const obj: TrackObjectStart = {
      type: 'START',
      id: 'obj-start-1',
      position: { lat: 60.3, lon: 25.1 },
    }

    expect(obj.type).toBe('START')
    expect(obj.position.lat).toBe(60.3)
  })

  it('accepts a FINISH object', () => {
    const obj: TrackObjectFinish = {
      type: 'FINISH',
      id: 'obj-finish-1',
      position: { lat: 60.32, lon: 25.15 },
    }

    expect(obj.type).toBe('FINISH')
  })

  it('accepts a CORNER object', () => {
    const obj: TrackObjectCorner = {
      type: 'CORNER',
      id: 'obj-corner-1',
      position: { lat: 60.31, lon: 25.12 },
    }

    expect(obj.type).toBe('CORNER')
  })

  it('accepts a LAY_PIT object', () => {
    const obj: TrackObjectLayPit = {
      type: 'LAY_PIT',
      id: 'obj-laypit-1',
      position: { lat: 60.305, lon: 25.11 },
    }

    expect(obj.type).toBe('LAY_PIT')
  })

  it('accepts a BREAK object', () => {
    const obj: TrackObjectBreak = {
      type: 'BREAK',
      id: 'obj-break-1',
      position: { lat: 60.315, lon: 25.13 },
    }

    expect(obj.type).toBe('BREAK')
  })

  it('accepts a MARKER object without a label', () => {
    const obj: TrackObjectMarker = {
      type: 'MARKER',
      id: 'obj-marker-1',
      position: { lat: 60.302, lon: 25.105 },
    }

    expect(obj.type).toBe('MARKER')
    expect(obj.label).toBeUndefined()
  })

  it('accepts a MARKER object with a label', () => {
    const obj: TrackObjectMarker = {
      type: 'MARKER',
      id: 'obj-marker-2',
      position: { lat: 60.302, lon: 25.105 },
      label: 'Water crossing',
    }

    expect(obj.label).toBe('Water crossing')
  })
})

// ---------------------------------------------------------------------------
// Narrowing – type guard via discriminant field works correctly
// ---------------------------------------------------------------------------

describe('TrackObject type narrowing', () => {
  it('narrows correctly on type field', () => {
    const objects: TrackObject[] = [
      { type: 'START', id: 's1', position: { lat: 60.3, lon: 25.1 } },
      { type: 'CORNER', id: 'c1', position: { lat: 60.31, lon: 25.12 } },
      { type: 'CORNER', id: 'c2', position: { lat: 60.32, lon: 25.14 } },
      { type: 'LAY_PIT', id: 'lp1', position: { lat: 60.305, lon: 25.11 } },
      { type: 'LAY_PIT', id: 'lp2', position: { lat: 60.315, lon: 25.13 } },
      { type: 'FINISH', id: 'f1', position: { lat: 60.33, lon: 25.16 } },
    ]

    const corners = objects.filter((o) => o.type === 'CORNER')
    const layPits = objects.filter((o) => o.type === 'LAY_PIT')
    const starts = objects.filter((o) => o.type === 'START')

    // AVO requires 2 corners and 2 lay pits
    expect(corners).toHaveLength(2)
    expect(layPits).toHaveLength(2)
    expect(starts).toHaveLength(1)
  })

  it('counts VOI-compliant set of objects correctly', () => {
    const objects: TrackObject[] = [
      { type: 'START', id: 's1', position: { lat: 60.3, lon: 25.1 } },
      { type: 'CORNER', id: 'c1', position: { lat: 60.31, lon: 25.12 } },
      { type: 'CORNER', id: 'c2', position: { lat: 60.32, lon: 25.14 } },
      { type: 'CORNER', id: 'c3', position: { lat: 60.325, lon: 25.15 } },
      { type: 'LAY_PIT', id: 'lp1', position: { lat: 60.305, lon: 25.11 } },
      { type: 'LAY_PIT', id: 'lp2', position: { lat: 60.315, lon: 25.13 } },
      { type: 'LAY_PIT', id: 'lp3', position: { lat: 60.322, lon: 25.145 } },
      { type: 'LAY_PIT', id: 'lp4', position: { lat: 60.328, lon: 25.155 } },
      { type: 'BREAK', id: 'b1', position: { lat: 60.32, lon: 25.14 } },
      { type: 'FINISH', id: 'f1', position: { lat: 60.34, lon: 25.17 } },
    ]

    // VOI: 3 corners, 4 lay pits, 1 break
    expect(objects.filter((o) => o.type === 'CORNER')).toHaveLength(3)
    expect(objects.filter((o) => o.type === 'LAY_PIT')).toHaveLength(4)
    expect(objects.filter((o) => o.type === 'BREAK')).toHaveLength(1)
  })
})
