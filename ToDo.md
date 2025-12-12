# Updated TODO – Trail Tracker

This TODO is updated to reflect progress so far and to reduce rework by locking in data flow and editing foundations before deep rule work.

---

## Phase 0 – Project Bootstrap (done)

- [x] Create initial project documentation (`README.md`, `ARCHITECTURE.md`, `TODO.md`)
- [x] Initialize git repository
- [x] Set up monorepo or multi-package structure (domain + web to start)
- [x] Add `.gitignore`, shared `tsconfig.base.json`, ESLint + Prettier
- [x] Add GitHub Actions CI:
  - [x] Install dependencies for monorepo
  - [x] Run `npm run lint`
  - [x] Run `npm run build`
  - [x] Run `npm test` (domain tests)
- [x] Add coverage reporting (Codecov) once domain tests are in place

---

## Phase 0.5 – Developer Environment Setup (done)

- [x] Install Node using nvm
- [x] Install VS Code ESLint + Prettier extensions
- [x] Configure `.vscode/settings.json` for ESLint/Prettier

---

## Phase 1 – Domain Foundation (mostly done)

- [x] Create `domain/` package with TypeScript build configuration
- [x] Define `TrackType` enum: `AVO | VOI | TRAINING`
- [x] Create first domain models:
  - [x] `Coordinate`
  - [x] `Track` (including `.type: TrackType`)
  - [x] `TrackSegment`
  - [ ] `TrackObject` (discriminated union)
    - [ ] Start
    - [ ] Finish
    - [ ] Corner
    - [ ] LayPit (makuupaikka)
    - [ ] Marker
    - [ ] Break (katkos)
- [x] Implement basic geometry helpers:
  - [x] Distance between coordinates
  - [x] Total track length calculation
  - [x] Segment lengths
- [x] Set up Vitest for domain tests
- [x] Add first unit tests for geometry functions

**Note:** Training tracks ignore rule validation but use all geometry features (length, segments, markers, etc.).

---

## Phase 2 – Web App Scaffold (done)

- [x] Scaffold `web/` app with Vite + React + TypeScript
- [x] Enable imports from `domain/` using workspace / path alias
- [x] Add minimal UI structure (header + main)
- [x] Integrate MapLibre GL JS
- [x] Load NLS Finland basemap with correct attribution
- [x] Load MapAnt basemap as alternative

---

## Phase 2.5 – Track Data Pipeline & Map Primitives (new)

Lock down how map drawing data becomes domain data (and vice versa), before editor UX grows.

- [ ] Create GeoJSON ↔ domain adapter layer
  - [ ] `LineString` → `TrackSegment[]` / points
  - [ ] domain track → GeoJSON for rendering
- [ ] Choose and document coordinate convention
  - [ ] Domain `Coordinate` uses WGS84 `(lon, lat)`
- [ ] Implement a single “draft track” store in web (source of truth)
  - [ ] Track type
  - [ ] points / segments
  - [ ] objects (when added later)
  - [ ] editor mode
- [ ] Minimal map rendering primitives
  - [ ] Polyline layer
  - [ ] Vertex points layer
  - [ ] Selected / hovered vertex visuals (simple highlight)

---

## Phase 3 – Basic Track Editor

- [ ] UI: select **track type** (AVO / VOI / TRAINING) before drawing
- [ ] Click-to-add-point interaction (append points)
- [ ] Draw polyline between added points
- [ ] Undo last point
- [ ] Reset/clear drawing
- [ ] “Finish track” workflow with explicit semantics:
  - [ ] Freeze points until user enters edit mode
  - [ ] Create Start + Finish objects (or define start/finish via first/last point)
  - [ ] Compute derived values (total length, segment lengths)
- [ ] Convert drawn data into `domain` models (via adapters from Phase 2.5)
- [ ] Show bearings for segments (grid bearing first)
- [ ] Optional (later): declination-corrected bearings based on location

**Early data-quality constraints (lightweight):**
- [ ] Snap-to-last-point tolerance (avoid micro-segments)
- [ ] Warn on minimum segment length

---

## Phase 4 – Domain Rules & Validation

- [ ] Model rule sets for:
  - [ ] `RuleSetAVO`
  - [ ] `RuleSetVOI`
- [ ] Implement rule evaluation engine:
  - Input: `Track`, `RuleSet | null`
  - Output: `RuleViolation[]`
- [ ] Add unit tests for AVO rules
- [ ] Add unit tests for VOI rules
- [ ] Add **“Validate Track”** button in web UI for AVO/VOI
- [ ] For Training tracks (no validation), still show:
  - [ ] Total length
  - [ ] Segment lengths
  - [ ] Object list

---

## Phase 5 – Editor UX & Advanced Features

- [ ] Add domain-specific objects to editor:
  - [ ] Corners
  - [ ] Lay pits (makuupaikka)
  - [ ] Break (katkos)
  - [ ] Markers
- [ ] Visualize rule violations on map (color overlays, icons, tooltips)
- [ ] Add local persistence (IndexedDB preferred; `localStorage` acceptable early)
- [ ] Improve geometry editing:
  - [ ] Move points
  - [ ] Delete point
  - [ ] Insert point on segment
- [ ] Add object placement UX:
  - [ ] Snap/attach object to nearest segment with stored `chainage` (distance along track)

---

## Phase 6 – Backend Introduction

- [ ] Scaffold `server/` with Express + TypeScript
- [ ] Add Prisma + SQLite (dev) or PostgreSQL (later)
- [ ] Create initial DB schema:
  - [ ] Users
  - [ ] Tracks
  - [ ] Track versions
- [ ] Implement REST endpoints:
  - [ ] `POST /tracks`
  - [ ] `GET /tracks`
  - [ ] `GET /tracks/:id`
- [ ] Connect web app to backend
- [ ] Add React Query (or similar) for data fetching

---

## Phase 7 – Mobile Planning & Prototype

- [ ] Create initial `mobile/` folder
- [ ] Set up React Native project
- [ ] Integrate MapLibre RN
- [ ] Verify `domain/` can be imported
- [ ] Load a test track from API or local JSON
- [ ] Show GPS position on map
- [ ] Begin offline-map planning (tiles + track caching)
- [ ] Implement fetching feature names from MapAnt

---

## Continuous Tasks

- [ ] Maintain and expand test coverage (domain + web + server)
- [ ] Refactor domain models as MEJÄ rule interpretation evolves
- [ ] Update documentation when architecture changes
- [ ] Add small guides (map setup, rule logic, domain models)