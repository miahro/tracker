import React, { useState } from 'react'
import { MapView } from './MapView'
import type { BaseMapId } from './basemaps'

export default function App() {
  const [baseMapId, setBaseMapId] = useState<BaseMapId>('nls-vector')

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
          padding: '0.5rem 1rem',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ fontWeight: 600 }}>Trail Tracker</div>
        <div style={{ fontSize: '0.9rem', color: '#555' }}>Base map:</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setBaseMapId('nls-vector')}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              border: baseMapId === 'nls-vector' ? '1px solid #007acc' : '1px solid #ccc',
              backgroundColor: baseMapId === 'nls-vector' ? '#e6f3ff' : '#f8f8f8',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            NLS vector
          </button>
          <button
            type="button"
            onClick={() => setBaseMapId('mapant')}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              border: baseMapId === 'mapant' ? '1px solid #007acc' : '1px solid #ccc',
              backgroundColor: baseMapId === 'mapant' ? '#e6f3ff' : '#f8f8f8',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            MapAnt
          </button>
        </div>
      </header>

      <main style={{ flex: 1, minHeight: 0 }}>
        <MapView baseMapId={baseMapId} />
      </main>
    </div>
  )
}
