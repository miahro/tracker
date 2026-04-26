// web/src/App.tsx
import React, { useState } from 'react'
import { MapView } from './MapView'
import type { BaseMapId } from './basemaps'
import { BaseMapToggle } from './components/BaseMapToggle'
import { useDraftTrack } from './features/track-editor/useDraftTrack'
import { segmentsToGeoJson } from './adapters/geojson'

export default function App() {
  const [baseMapId, setBaseMapId] = useState<BaseMapId>('nls-vector')
  const { state, derived, startDrawing, addPoint, undo, finish, reset } = useDraftTrack()

  const trackPositions = segmentsToGeoJson(derived.segments)

  return (
    <div className="app">
      <header className="header">
        <div className="title">Trail Tracker</div>
        <div className="subtle">Base map:</div>
        <BaseMapToggle value={baseMapId} onChange={setBaseMapId} />

        <div className="editorControls" data-testid="editor-controls">
          {/* Idle — choose track type */}
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
          {state.mode === 'idle' && (
            <button
              className="pillButton"
              data-testid="btn-draw-training"
              onClick={() => startDrawing('TRAINING')}
            >
              Draw Training
            </button>
          )}

          {/* Drawing — status + actions */}
          {state.mode === 'drawing' && (
            <span className="subtle" data-testid="drawing-status">
              {state.trackType} — {state.points.length} pt — {Math.round(derived.totalLengthMeters)}{' '}
              m
            </span>
          )}
          {state.mode === 'drawing' && derived.hasShortSegment && (
            <span className="warningBadge" data-testid="warning-short-segment">
              ⚠ segment &lt;150 m
            </span>
          )}
          {state.mode === 'drawing' && derived.startFinishTooClose && (
            <span className="warningBadge" data-testid="warning-start-finish-distance">
              ⚠ start↔finish &lt;150 m
            </span>
          )}
          {derived.canUndo && (
            <button className="pillButton" data-testid="btn-undo" onClick={undo}>
              Undo
            </button>
          )}
          {derived.canFinish && (
            <button
              className="pillButton pillButtonActive"
              data-testid="btn-finish"
              onClick={finish}
            >
              Finish
            </button>
          )}
          {state.mode !== 'idle' && (
            <button className="pillButton" data-testid="btn-reset" onClick={reset}>
              Reset
            </button>
          )}
        </div>
      </header>

      {/* Finished track summary */}
      {derived.finishedTrack && (
        <div className="trackSummary" data-testid="track-summary">
          <span className="trackSummaryType" data-testid="summary-type">
            {derived.finishedTrack.type}
          </span>
          <span data-testid="summary-length">{Math.round(derived.totalLengthMeters)} m</span>
          <span data-testid="summary-points">{state.points.length} points</span>
          {derived.startFinishTooClose && (
            <span className="warningBadge" data-testid="summary-warning-start-finish">
              ⚠ start↔finish &lt;150 m
            </span>
          )}
          <span className="summaryDivider" />
          {derived.segmentInfos.map((info) => (
            <span
              key={info.index}
              className={`segmentInfo${info.isTooShort ? ' segmentWarning' : ''}`}
              data-testid={`summary-seg-${info.index}`}
            >
              Seg {info.index + 1}: {Math.round(info.lengthMeters)} m &nbsp;·&nbsp;{' '}
              {Math.round(info.bearingDegrees)}°{info.isTooShort && ' ⚠'}
            </span>
          ))}
        </div>
      )}

      <main className="main">
        <MapView
          baseMapId={baseMapId}
          trackPositions={trackPositions}
          onMapClick={
            state.mode === 'drawing' && !derived.isPointLimitReached ? addPoint : undefined
          }
        />
      </main>
    </div>
  )
}
