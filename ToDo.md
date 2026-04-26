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
    - [x] `CORNER` (kulma) — implicit junction, used for VOI eligibility display
    - [x] `LAY_PIT` (makuupaikka) — mobile-only, not placed in web planner
    - [x] `BREAK` (katko — VOI only) — mobile-only, not placed in web planner
    - [x] `MARKER` (planning aid)
- [x] Geometry helpers: distance, segment length, total track length, bearing
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

## Phase 2.5 – Track Data Pipeline & Map Primitives ✅

- [x] GeoJSON ↔ domain adapter (`web/src/adapters/geojson.ts`)
- [x] Coordinate convention locked: GeoJSON `[lon, lat]` ↔ domain `{ lat, lon }`
- [x] Draft track store with pure reducer, state machine, and `useDraftTrack` hook
- [x] Unified test runner (`vitest.config.ts`) — all tests with single `npm test`
- [x] Polyline + vertex point map layers

---

## Phase 3 – Basic Track Editor ✅ (mostly)

- [x] Track type selection: AVO / VOI / TRAINING
- [x] Click-to-add-point on map
- [x] Polyline drawn between points
- [x] Undo last point, Reset
- [x] Finish track → assembles `Track` with START + FINISH objects
- [x] Summary bar: total length, segment lengths, bearings
- [ ] Declination corrected bearing
- [ ] Enforce segment count during drawing:
  - AVO: exactly 4 points (3 segments) — Finish auto-triggers, further clicks blocked
  - VOI: exactly 5 points (4 segments) — same
  - TRAINING: unlimited, Finish available after 2 points (as now)
- [ ] Minimum segment length warning (< 150 m) shown during drawing

---

## Phase 4 – Domain Rules & Validation

### 4a — Validatable from geometry (web + mobile)

- [ ] `RuleViolation` type: `{ ruleId, severity, message, segmentIndex? }`
- [ ] AVO length: 900–1000 m
- [ ] VOI length: 1200–1400 m
- [ ] All segments ≥ 150 m (AVO and VOI)
- [ ] "Validate Track" button — shows violations in summary bar
- [ ] Training tracks: skip all validation, show geometry only

### 4b — Computed display (web planner + mobile display)

- [ ] VOI lay pit zones:
  - Per segment: valid zone = segment excluding first and last 50 m
  - Rendered as dual line or shading on map segment
  - Computed in domain, rendered in web and later mobile
- [ ] VOI break corner eligibility:
  - Corners 1 and 2: always eligible
  - Corner 3: eligible only if segment 4 length > 300 m
  - Shown as visual indicator on corner point
- [ ] AVO/VOI corner markers: visual dot at each segment junction

### 4c — Not applicable to web planner

- Age rule (≥ 12 h AVO / ≥ 18 h VOI) — mobile app only, requires `laidAt` timestamp
- Lay pit positions (VOI) — recorded in field via mobile app
- Break corner selection (VOI) — recorded in field via mobile app
- Road/building distance (≥ 60 m) — see Phase 5 ruler tool

---

## Phase 5 – Editor UX & Advanced Features

- [ ] Manual distance ruler tool (click two map points → shows distance)
  - Primary use: checking distance from roads, buildings
- [ ] Visualize rule violations on map (color overlays, segment highlighting)
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
- [ ] Display planned route with corner markers
- [ ] Display VOI lay pit zones and break corner eligibility (from plan)
- [ ] GPS tracking of actual route walked by track maker
- [ ] Record actual lay pit positions (tap to mark)
- [ ] Record break corner selection (tap corner to designate)
- [ ] Place pre-markers (~30 m before corners, lay pits, and finish — maker selects exact position)
- [ ] Age rule validation (requires `laidAt` timestamp from field)
- [ ] Offline tile + track caching

---

## Continuous

- [ ] Maintain test coverage (domain unit, web E2E, server integration)
- [ ] Refactor domain models as MEJÄ rule understanding deepens
- [ ] Keep documentation in sync with architecture changes
