// web/src/App.tsx
import React, { useState } from 'react'
import { MapView } from './MapView'
import type { BaseMapId } from './basemaps'
import { BaseMapToggle } from './components/BaseMapToggle'
import { useDraftTrack } from './features/track-editor/useDraftTrack'
import { segmentsToGeoJson } from './adapters/geojson'

export default function App() {
  const [baseMapId, setBaseMapId] = useState<BaseMapId>('nls-vector')
  const { state, derived, startDrawing, addPoint, undo, reset } = useDraftTrack()

  // Convert domain segments back to GeoJSON positions for the map layer
  const trackPositions = segmentsToGeoJson(derived.segments)

  return (
    <div className="app">
      <header className="header">
        <div className="title">Trail Tracker</div>
        <div className="subtle">Base map:</div>
        <BaseMapToggle value={baseMapId} onChange={setBaseMapId} />
        <div className="editorControls">
          {state.mode === 'idle' && (
            <button className="pillButton" onClick={() => startDrawing('AVO')}>
              Draw AVO
            </button>
          )}
          {state.mode === 'idle' && (
            <button className="pillButton" onClick={() => startDrawing('VOI')}>
              Draw VOI
            </button>
          )}
          {state.mode === 'drawing' && (
            <span className="subtle">
              {state.points.length} pt — {Math.round(derived.totalLengthMeters)} m
            </span>
          )}
          {derived.canUndo && (
            <button className="pillButton" onClick={undo}>
              Undo
            </button>
          )}
          {state.mode !== 'idle' && (
            <button className="pillButton" onClick={reset}>
              Reset
            </button>
          )}
        </div>
      </header>

      <main className="main">
        <MapView
          baseMapId={baseMapId}
          trackPositions={trackPositions}
          onMapClick={state.mode === 'drawing' ? addPoint : undefined}
        />
      </main>
    </div>
  )
}
