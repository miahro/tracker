import React from 'react'
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
    <div style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Trail Tracker (web demo)</h1>
      <p>
        This is a placeholder React app using the shared <code>@trail-tracker/domain</code> package.
      </p>
      <p>
        Demo track <strong>{demoTrack.name}</strong> length: <code>{length.toFixed(2)} m</code>
      </p>
    </div>
  )
}
