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

  const trackPositions = segmentsToGeoJson(derived.segments)

  return (
    <div className="app">
      <header className="header">
        <div className="title">Trail Tracker</div>
        <div className="subtle">Base map:</div>
        <BaseMapToggle value={baseMapId} onChange={setBaseMapId} />
        <div className="editorControls" data-testid="editor-controls">
          {state.mode === 'idle' && (
            <button
              className="pillButton"
              data-testid="btn-draw-avo"
              onClick={() => startDrawing('AVO')}
            >
              Draw AVO
            </button>
          )}
          {state.mode === 'idle' && (
            <button
              className="pillButton"
              data-testid="btn-draw-voi"
              onClick={() => startDrawing('VOI')}
            >
              Draw VOI
            </button>
          )}
          {state.mode === 'drawing' && (
            <span className="subtle" data-testid="drawing-status">
              {state.points.length} pt — {Math.round(derived.totalLengthMeters)} m
            </span>
          )}
          {derived.canUndo && (
            <button className="pillButton" data-testid="btn-undo" onClick={undo}>
              Undo
            </button>
          )}
          {state.mode !== 'idle' && (
            <button className="pillButton" data-testid="btn-reset" onClick={reset}>
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
