// web/src/App.tsx
import React, { useState } from 'react'
import { MapView } from './MapView'
import type { BaseMapId } from './basemaps'
import { BaseMapToggle } from './components/BaseMapToggle'

export default function App() {
  const [baseMapId, setBaseMapId] = useState<BaseMapId>('nls-vector')

  return (
    <div className="app">
      <header className="header">
        <div className="title">Trail Tracker</div>
        <div className="subtle">Base map:</div>
        <BaseMapToggle value={baseMapId} onChange={setBaseMapId} />
      </header>

      <main className="main">
        <MapView baseMapId={baseMapId} />
      </main>
    </div>
  )
}
