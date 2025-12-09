// domain/src/index.ts

// The basic track types for this project.
// AVO = open class, VOI = winner class, TRAINING has no strict rules.
export type TrackType = "AVO" | "VOI" | "TRAINING";

// Simple coordinate in WGS84 (lat/lon in degrees).
export interface Coordinate {
  lat: number;
  lon: number;
}

// One straight-line part of a track between two coordinates.
export interface TrackSegment {
  id: string;
  start: Coordinate;
  end: Coordinate;
  sequenceIndex: number;
}

// Minimal Track model for now.
// This will grow as we add objects (corners, lay pits, markers, etc.).
export interface Track {
  id: string;
  name: string;
  type: TrackType;
  segments: TrackSegment[];
}

// Placeholder: later we will implement real geometry.
// For now, this just returns 0 so we can compile and write tests against it.
export function getTrackLengthMeters(track: Track): number {
  // TODO: implement proper length calculation
  return 0;
}
