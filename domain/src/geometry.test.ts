// domain/src/geometry.test.ts
import { describe, it, expect } from 'vitest'
import { Coordinate, distanceBetweenCoordinatesMeters } from './index'

describe('distanceBetweenCoordinatesMeters', () => {
  it('returns 0 for identical coordinates', () => {
    const a: Coordinate = { lat: 60.0, lon: 25.0 }

    const d = distanceBetweenCoordinatesMeters(a, a)

    expect(d).toBe(0)
  })

  it('is roughly 111 km per degree of latitude', () => {
    const a: Coordinate = { lat: 60.0, lon: 25.0 }
    const b: Coordinate = { lat: 61.0, lon: 25.0 }

    const d = distanceBetweenCoordinatesMeters(a, b)

    // ~111,000 meters per degree latitude, allow small tolerance
    expect(d).toBeGreaterThan(110000)
    expect(d).toBeLessThan(112000)
  })
})
