# TODO – Trail Tracker

---

## Phase 0 – Project Bootstrap ✅

- [x] Create initial project documentation (`README.md`, `ARCHITECTURE.md`, `TODO.md`)
- [x] Initialize git repository
- [x] Set up monorepo structure (domain + web)
- [x] Add `.gitignore`, shared `tsconfig.base.json`, ESLint + Prettier
- [x] Add GitHub Actions CI (lint, build, test)
- [x] Add coverage reporting (Codecov)

---

## Phase 0.5 – Developer Environment Setup ✅

- [x] Install Node using nvm
- [x] Install VS Code ESLint + Prettier extensions
- [x] Configure `.vscode/settings.json`

---

## Phase 1 – Domain Foundation ✅

- [x] Create `domain/` package with TypeScript build configuration
- [x] Define `TrackType`: `AVO | VOI | TRAINING`
- [x] Create core domain models:
  - [x] `Coordinate` — `{ lat, lon }` WGS84
  - [x] `Track` — includes `type`, `segments[]`, `objects[]`
  - [x] `TrackSegment` — `id`, `start`, `end`, `sequenceIndex`
  - [x] `TrackObject` discriminated union:
    - [x] `START` (lähtö)
    - [x] `FINISH` (kaato)
    - [x] `CORNER` (kulma)
    - [x] `LAY_PIT` (makuupaikka)
    - [x] `BREAK` (katko — VOI only)
    - [x] `MARKER` (planning aid)
- [x] Geometry helpers: distance, segment length, total track length
- [x] Vitest set up; unit tests for all geometry helpers and TrackObject

---

## Phase 2 – Web App Scaffold ✅

- [x] Scaffold `web/` with Vite + React + TypeScript
- [x] Import from `domain/` via workspace path alias
- [x] Minimal UI: header + map
- [x] MapLibre GL JS integrated
- [x] NLS Finland basemap (vector tiles)
- [x] MapAnt basemap as alternative
- [x] Basemap toggle component with `data-testid` attributes
- [x] Cypress E2E smoke test (basemap toggle)
- [x] WebGL error handling in `MapView` (graceful fallback when GPU unavailable)
- [x] Cypress support file suppresses WebGL uncaught exceptions in interactive mode

---

## Phase 2.5 – Track Data Pipeline & Map Primitives 🔄

- [x] GeoJSON ↔ domain adapter (`web/src/adapters/geojson.ts`):
  - [x] `coordinateFromGeoJson` / `coordinateToGeoJson`
  - [x] `segmentsFromGeoJson` / `segmentsToGeoJson`
  - [x] Coordinate convention locked: GeoJSON `[lon, lat]` ↔ domain `{ lat, lon }`
  - [x] Full unit test coverage including round-trips
- [ ] Draft track store — `useDraftTrack` hook (`web/src/features/track-editor/useDraftTrack.ts`):
  - [ ] Editor state machine: `idle | drawing | finished`
  - [ ] Accumulated click points
  - [ ] `addPoint`, `undo`, `reset` actions
  - [ ] Derives `TrackSegment[]` and total length via adapter + domain helpers
  - [ ] Track type selection (`AVO | VOI | TRAINING`)
- [ ] Minimal map rendering primitives:
  - [ ] Polyline layer for drawn segments
  - [ ] Vertex points layer
  - [ ] Selected / hovered vertex highlight

---

## Phase 3 – Basic Track Editor

- [ ] UI: select track type (AVO / VOI / TRAINING) before drawing
- [ ] Click-to-add-point on map (append points)
- [ ] Draw polyline between added points
- [ ] Undo last point
- [ ] Reset / clear drawing
- [ ] "Finish track" workflow:
  - [ ] Freeze points; enter edit mode to modify
  - [ ] Auto-create START + FINISH objects from first/last point
  - [ ] Show total length + segment lengths
- [ ] Show grid bearings for segments
- [ ] Snap-to-last-point tolerance (avoid micro-segments)
- [ ] Warn on minimum segment length

---

## Phase 4 – Domain Rules & Validation

- [ ] Rule models: `RuleSetAVO`, `RuleSetVOI`
- [ ] Rule evaluation engine:
  - Input: `Track`, `RuleSet | null`
  - Output: `RuleViolation[]`
- [ ] AVO rules + unit tests:
  - [ ] Length 900–1000 m
  - [ ] Exactly 2 corners
  - [ ] Exactly 2 lay pits
  - [ ] Age ≥ 12 h (metadata)
  - [ ] ≥ 150 m between key elements
  - [ ] ≥ 60 m from roads (metadata / manual input)
- [ ] VOI rules + unit tests:
  - [ ] Length 1200–1400 m
  - [ ] Exactly 3 corners
  - [ ] Exactly 4 lay pits (one per segment, ≥ 50 m from corner/finish)
  - [ ] Exactly 1 break, ≥ 300 m before finish
  - [ ] Age ≥ 18 h
  - [ ] ≥ 150 m between key elements
- [ ] "Validate Track" button in web UI
- [ ] Training tracks: show length + segments, skip validation

---

## Phase 5 – Editor UX & Advanced Features

- [ ] Place domain objects on map:
  - [ ] Corners, lay pits, break, markers
  - [ ] Snap / attach to nearest segment (stored as chainage)
- [ ] Visualize rule violations: color overlays, icons, tooltips
- [ ] Local persistence (IndexedDB)
- [ ] Advanced geometry editing:
  - [ ] Move point
  - [ ] Delete point
  - [ ] Insert point on segment

---

## Phase 6 – Backend

- [ ] Scaffold `server/` with Express + TypeScript
- [ ] Prisma + SQLite (dev) / PostgreSQL (prod)
- [ ] DB schema: users, tracks, track versions
- [ ] REST endpoints: `POST /tracks`, `GET /tracks`, `GET /tracks/:id`
- [ ] Connect web app to backend (React Query or similar)

---

## Phase 7 – Mobile

- [ ] Create `mobile/` with React Native + MapLibre RN
- [ ] Verify `domain/` imports work
- [ ] Load track from API or local JSON
- [ ] Show GPS position on map
- [ ] Offline tile + track caching

---

## Continuous

- [ ] Maintain test coverage (domain unit, web E2E, server integration)
- [ ] Refactor domain models as MEJÄ rule understanding deepens
- [ ] Keep documentation in sync with architecture changes
