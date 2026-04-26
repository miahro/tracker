// web/src/App.tsx
import React, { useState, useEffect } from 'react'
import { MapView } from './MapView'
import type { BaseMapId } from './basemaps'
import { BaseMapToggle } from './components/BaseMapToggle'
import { useDraftTrack } from './features/track-editor/useDraftTrack'
import { useRuler } from './features/ruler/useRuler'
import { segmentsToGeoJson } from './adapters/geojson'
import { validateTrack, type RuleViolation } from '@trail-tracker/domain'
import { loadTrackState, loadViewport, type PersistedViewport } from './persistence'
import { INITIAL_STATE, type DraftTrackState } from './features/track-editor/draftTrackReducer'

interface LoadedInit {
  trackState: DraftTrackState
  viewport: PersistedViewport | null
}

export default function App() {
  const [baseMapId, setBaseMapId] = useState<BaseMapId>('nls-vector')
  const [init, setInit] = useState<LoadedInit | null>(null)

  // Load persisted data before rendering the editor — prevents save-before-load race
  useEffect(() => {
    Promise.all([loadTrackState(), loadViewport()]).then(([trackState, viewport]) => {
      setInit({ trackState: trackState ?? INITIAL_STATE, viewport })
    })
  }, [])

  if (!init) return null // wait for persistence load before rendering

  return <AppInner baseMapId={baseMapId} setBaseMapId={setBaseMapId} init={init} />
}

function AppInner({
  baseMapId,
  setBaseMapId,
  init,
}: {
  baseMapId: BaseMapId
  setBaseMapId: (id: BaseMapId) => void
  init: LoadedInit
}) {
  const {
    state,
    derived,
    selectedPointIndex,
    startDrawing,
    addPoint,
    movePoint,
    deletePoint,
    selectPoint,
    undo,
    finish,
    reset,
  } = useDraftTrack(init.trackState)
  const [violations, setViolations] = useState<RuleViolation[] | null>(null)
  const { ruler, startRuler, handleRulerClick, resetRuler } = useRuler()

  const trackPositions = segmentsToGeoJson(derived.segments)

  // Role of each point: start, corner(s), finish — drives map marker styling
  type PointRole = 'start' | 'corner' | 'finish'
  const pointRoles: PointRole[] = trackPositions.map((_, i) => {
    if (i === 0) return 'start'
    if (i === trackPositions.length - 1 && state.mode === 'finished') return 'finish'
    return 'corner'
  })

  const violatedSegmentIndices: number[] = violations
    ? violations
        .filter((v) => v.ruleId === 'min-segment-length' && v.segmentIndex !== undefined)
        .map((v) => v.segmentIndex!)
    : []

  function handleValidate() {
    if (derived.finishedTrack) {
      setViolations(validateTrack(derived.finishedTrack))
    }
  }

  function handleReset() {
    setViolations(null)
    resetRuler()
    reset()
  }

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
          {state.mode === 'drawing' && selectedPointIndex !== null && (
            <button
              className="pillButton pillButtonDanger"
              data-testid="btn-delete-point"
              onClick={() => deletePoint(selectedPointIndex)}
            >
              Delete point {selectedPointIndex + 1}
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
            <button className="pillButton" data-testid="btn-reset" onClick={handleReset}>
              Reset
            </button>
          )}
          {state.mode === 'finished' && (
            <button
              className="pillButton pillButtonActive"
              data-testid="btn-validate"
              onClick={handleValidate}
            >
              Validate
            </button>
          )}
          {/* Ruler tool — always available, independent of track mode */}
          {ruler.mode === 'idle' ? (
            <button className="pillButton" data-testid="btn-ruler" onClick={startRuler}>
              📏 Ruler
            </button>
          ) : (
            <button
              className="pillButton pillButtonActive"
              data-testid="btn-ruler-reset"
              onClick={resetRuler}
            >
              ✕ Ruler
            </button>
          )}
        </div>
        {/* Ruler status bar */}
        {ruler.mode !== 'idle' && (
          <div className="rulerStatus" data-testid="ruler-status">
            {ruler.mode === 'awaiting-first' && 'Click first point'}
            {ruler.mode === 'awaiting-second' && 'Click second point'}
            {ruler.mode === 'showing' && ruler.distanceMeters !== null && (
              <>
                📏 {Math.round(ruler.distanceMeters)} m
                {ruler.distanceMeters < 60 && (
                  <span className="warningBadge" style={{ marginLeft: '0.5rem' }}>
                    ⚠ &lt;60 m from road/building
                  </span>
                )}
                <span className="subtle" style={{ marginLeft: '0.5rem' }}>
                  — click to measure again
                </span>
              </>
            )}
          </div>
        )}
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
              {Math.round(info.bearingDegrees)}° true &nbsp;·&nbsp;{' '}
              {Math.round(info.compassBearingDegrees)}° mag
              {info.isTooShort && ' ⚠'}
            </span>
          ))}
        </div>
      )}

      {/* Validation results */}
      {violations !== null && (
        <div
          className={`validationPanel ${violations.length === 0 ? 'validationPanelOk' : 'validationPanelErrors'}`}
          data-testid="validation-panel"
        >
          {violations.length === 0 ? (
            <span className="validationOk" data-testid="validation-ok">
              ✓ Track is valid
            </span>
          ) : (
            violations.map((v, i) => (
              <span key={i} className="validationError" data-testid={`violation-${i}`}>
                ✕ {v.message}
              </span>
            ))
          )}
        </div>
      )}

      <main className="main">
        <MapView
          baseMapId={baseMapId}
          trackPositions={trackPositions}
          pointRoles={pointRoles}
          layPitZones={derived.layPitZones}
          breakEligibility={derived.breakEligibility}
          violatedSegmentIndices={violatedSegmentIndices}
          initialViewport={init.viewport}
          selectedPointIndex={selectedPointIndex}
          onPointClick={state.mode === 'drawing' ? selectPoint : undefined}
          onPointDrag={state.mode === 'drawing' ? movePoint : undefined}
          rulerPointA={ruler.pointA}
          rulerPointB={ruler.pointB}
          onMapClick={
            ruler.mode !== 'idle'
              ? handleRulerClick
              : state.mode === 'drawing' &&
                  !derived.isPointLimitReached &&
                  selectedPointIndex === null
                ? addPoint
                : undefined
          }
        />
      </main>
    </div>
  )
}
