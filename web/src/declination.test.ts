// web/src/declination.test.ts

import { describe, it, expect } from 'vitest'
import { getDeclinationDegrees, trueToMagneticBearing } from './declination'

// Helsinki area — well-known positive declination (~+10°)
const HELSINKI: { lat: number; lon: number } = { lat: 60.3, lon: 25.1 }

describe('getDeclinationDegrees', () => {
  it('returns a number for a Finnish coordinate', () => {
    const decl = getDeclinationDegrees(HELSINKI)
    expect(typeof decl).toBe('number')
  })

  it('returns a positive declination for Finland (magnetic north is east of true north)', () => {
    const decl = getDeclinationDegrees(HELSINKI)
    expect(decl).toBeGreaterThan(0)
  })

  it('returns a value in a plausible range for Finland (~8–13°)', () => {
    const decl = getDeclinationDegrees(HELSINKI)
    expect(decl).toBeGreaterThan(5)
    expect(decl).toBeLessThan(15)
  })

  it('accepts an explicit date', () => {
    const decl = getDeclinationDegrees(HELSINKI, new Date('2025-06-01'))
    expect(typeof decl).toBe('number')
    expect(decl).toBeGreaterThan(0)
  })

  it('returns 0 gracefully if something goes wrong (fallback)', () => {
    // The function is designed to return 0 on error — we just verify it never throws
    expect(() => getDeclinationDegrees(HELSINKI)).not.toThrow()
  })
})

describe('trueToMagneticBearing', () => {
  it('subtracts positive declination from true bearing', () => {
    // true 045°, decl +10° → compass 035°
    expect(trueToMagneticBearing(45, 10)).toBeCloseTo(35)
  })

  it('adds magnitude when declination is negative (west)', () => {
    // true 045°, decl −5° → compass 050°
    expect(trueToMagneticBearing(45, -5)).toBeCloseTo(50)
  })

  it('normalises result below 0° back into 0–360 range', () => {
    // true 005°, decl +10° → compass −5° → normalised 355°
    expect(trueToMagneticBearing(5, 10)).toBeCloseTo(355)
  })

  it('normalises result at or above 360° back into 0–360 range', () => {
    // true 355°, decl −10° → 365° → normalised 005°
    expect(trueToMagneticBearing(355, -10)).toBeCloseTo(5)
  })

  it('returns 0° when true bearing equals declination', () => {
    expect(trueToMagneticBearing(10, 10)).toBeCloseTo(0)
  })

  it('returns true bearing unchanged when declination is 0', () => {
    expect(trueToMagneticBearing(123, 0)).toBeCloseTo(123)
  })
})
