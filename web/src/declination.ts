// web/src/declination.ts
//
// Thin wrapper around the geomagnetism WMM model.
//
// Returns the magnetic declination (in degrees) at a given WGS84 coordinate.
// Positive declination means magnetic north is east of true north.
//
// Compass bearing = true bearing − declination
//   e.g. true 045°, declination +10.5° → compass reads 034.5°
//
// The WMM model bundled with geomagnetism has a finite validity period.
// If called outside that period it throws unless allowOutOfBoundsModel is set.
// We catch and return 0 so the UI degrades gracefully (shows true bearing only).

import geomagnetism from 'geomagnetism'
import type { Coordinate } from '@trail-tracker/domain'

/**
 * Magnetic declination in degrees at the given coordinate and date.
 * Returns 0 if the model cannot produce a result (out-of-bounds date, etc.).
 */
export function getDeclinationDegrees(coord: Coordinate, date: Date = new Date()): number {
  try {
    const model = geomagnetism.model(date, { allowOutOfBoundsModel: true })
    // geomagnetism expects [lat, lon]
    return model.point([coord.lat, coord.lon]).decl
  } catch {
    return 0
  }
}

/**
 * Convert a true (grid) bearing to a magnetic compass bearing.
 * Result is normalised to 0–360.
 */
export function trueToMagneticBearing(trueBearing: number, declination: number): number {
  return (((trueBearing - declination) % 360) + 360) % 360
}
