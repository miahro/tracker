// web/src/features/ruler/useRuler.test.ts
// @vitest-environment jsdom

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRuler } from './useRuler'
import type { GeoJsonPosition } from '../../adapters/geojson'

// Finnish coords ~1 km apart
const A: GeoJsonPosition = [25.1, 60.3]
const B: GeoJsonPosition = [25.1, 60.31] // ~1.1 km north

describe('useRuler', () => {
  it('starts in idle mode', () => {
    const { result } = renderHook(() => useRuler())
    expect(result.current.ruler.mode).toBe('idle')
    expect(result.current.ruler.pointA).toBeNull()
    expect(result.current.ruler.pointB).toBeNull()
    expect(result.current.ruler.distanceMeters).toBeNull()
  })

  it('startRuler transitions to awaiting-first', () => {
    const { result } = renderHook(() => useRuler())
    act(() => result.current.startRuler())
    expect(result.current.ruler.mode).toBe('awaiting-first')
  })

  it('first click transitions to awaiting-second and stores pointA', () => {
    const { result } = renderHook(() => useRuler())
    act(() => result.current.startRuler())
    act(() => result.current.handleRulerClick(A))
    expect(result.current.ruler.mode).toBe('awaiting-second')
    expect(result.current.ruler.pointA).toEqual(A)
    expect(result.current.ruler.pointB).toBeNull()
  })

  it('second click transitions to showing with distance', () => {
    const { result } = renderHook(() => useRuler())
    act(() => result.current.startRuler())
    act(() => result.current.handleRulerClick(A))
    act(() => result.current.handleRulerClick(B))
    expect(result.current.ruler.mode).toBe('showing')
    expect(result.current.ruler.pointA).toEqual(A)
    expect(result.current.ruler.pointB).toEqual(B)
    expect(result.current.ruler.distanceMeters).not.toBeNull()
  })

  it('distance is approximately correct for known coordinates (~1.1 km)', () => {
    const { result } = renderHook(() => useRuler())
    act(() => result.current.startRuler())
    act(() => result.current.handleRulerClick(A))
    act(() => result.current.handleRulerClick(B))
    const d = result.current.ruler.distanceMeters!
    expect(d).toBeGreaterThan(1000)
    expect(d).toBeLessThan(1200)
  })

  it('click in showing mode restarts from the new point', () => {
    const { result } = renderHook(() => useRuler())
    act(() => result.current.startRuler())
    act(() => result.current.handleRulerClick(A))
    act(() => result.current.handleRulerClick(B))
    const C: GeoJsonPosition = [25.12, 60.31]
    act(() => result.current.handleRulerClick(C))
    expect(result.current.ruler.mode).toBe('awaiting-second')
    expect(result.current.ruler.pointA).toEqual(C)
    expect(result.current.ruler.pointB).toBeNull()
  })

  it('resetRuler returns to idle and clears all state', () => {
    const { result } = renderHook(() => useRuler())
    act(() => result.current.startRuler())
    act(() => result.current.handleRulerClick(A))
    act(() => result.current.handleRulerClick(B))
    act(() => result.current.resetRuler())
    expect(result.current.ruler.mode).toBe('idle')
    expect(result.current.ruler.pointA).toBeNull()
    expect(result.current.ruler.pointB).toBeNull()
    expect(result.current.ruler.distanceMeters).toBeNull()
  })

  it('clicks are ignored in idle mode', () => {
    const { result } = renderHook(() => useRuler())
    act(() => result.current.handleRulerClick(A))
    expect(result.current.ruler.mode).toBe('idle')
    expect(result.current.ruler.pointA).toBeNull()
  })
})
