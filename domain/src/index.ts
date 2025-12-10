// domain/src/index.ts

export type TrackType = 'AVO' | 'VOI' | 'TRAINING'

export interface Coordinate {
  lat: number
  lon: number
}

export interface TrackSegment {
  id: string
  start: Coordinate
  end: Coordinate
  sequenceIndex: number
}

export interface Track {
  id: string
  name: string
  type: TrackType
  segments: TrackSegment[]
}

// Approximate Earth radius in meters
const EARTH_RADIUS_METERS = 6371000

// Haversine distance between two WGS84 coordinates in meters
export function distanceBetweenCoordinatesMeters(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)

  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)

  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))

  return EARTH_RADIUS_METERS * c
}

// Length of a single segment in meters
export function getSegmentLengthMeters(segment: TrackSegment): number {
  return distanceBetweenCoordinatesMeters(segment.start, segment.end)
}

// Total length of a track in meters (sum of segment lengths)
export function getTrackLengthMeters(track: Track): number {
  return track.segments.reduce((sum, segment) => sum + getSegmentLengthMeters(segment), 0)
}
