import React from 'react'
import { MapView } from './MapView'

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #ddd' }}>
        Trail Tracker
      </header>
      <main style={{ flex: 1, minHeight: 0 }}>
        <MapView />
      </main>
    </div>
  )
}
