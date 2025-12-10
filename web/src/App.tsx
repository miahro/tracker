import React from 'react'
import { MapView } from './MapView'
import type { Track, TrackType } from '@trail-tracker/domain'
import { getTrackLengthMeters } from '@trail-tracker/domain'

const demoTrack: Track = {
  id: 'demo',
  name: 'Demo training track',
  type: 'TRAINING' as TrackType,
  segments: [],
}

export default function App() {
  const length = getTrackLengthMeters(demoTrack)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid #ddd',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Trail Tracker</h1>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
          Demo track “{demoTrack.name}” length: {length.toFixed(2)} m
        </p>
      </header>

      <main style={{ flex: 1, minHeight: 0 }}>
        <MapView />
      </main>
    </div>
  )
}
