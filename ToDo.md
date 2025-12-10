# TODO – Trail Tracker

Ordered task list for project development. This list will evolve over time.

---

## Phase 0 – Project Bootstrap

- [x] Create initial project documentation (`README.md`, `ARCHITECTURE.md`, `TODO.md`)
- [x] Initialize git repository
- [x] Set up monorepo or multi-package structure (domain + web to start)
- [x] Add `.gitignore`, shared `tsconfig.base.json`, ESLint + Prettier
- [ ] Add GitHub Actions CI:
  - [x] Install dependencies for monorepo
  - [x] Run `npm run lint`
  - [x] Run `npm run build`
  - [ ] Run `npm test` (once domain tests exist)
  - [ ] Add coverage reporting (Codecov) once domain tests are in place


---

## Phase 0.5 – Developer Environment Setup
- [x] Install Node using nvm
- [x] Install VS Code ESLint + Prettier (new) extensions
- [x] Configure .vscode/settings.json for ESLint/Prettier

---

## Phase 1 – Domain Foundation

- [x] Create `domain/` package with TypeScript build configuration
- [x] Define **TrackType** enum: `AVO | VOI | TRAINING`
- [x] Create first domain models:
  - [x] `Coordinate`
  - [x] `Track` (including `.type: TrackType`)
  - [x] `TrackSegment`
  - [ ] `TrackObject` (Start, Finish, Corner, LayPit, Marker)
- [ ] Implement basic geometry helpers:
  - [ ] Distance between coordinates
  - [ ] Total track length calculation
  - [ ] Segment lengths
- [ ] Set up Vitest for domain tests
- [ ] Add first unit tests for geometry functions

**Notes:**
Training tracks ignore rule validation but use all geometry features (length, segments, markers).

---

## Phase 2 – Web App Scaffold

- [ ] Scaffold `web/` app with Vite + React + TypeScript
- [ ] Enable imports from `domain/` using workspace / path alias
- [ ] Add minimal UI structure (header + main)
- [ ] Integrate MapLibre GL JS
- [ ] Load NLS Finland basemap with correct attribution

---

## Phase 3 – Basic Track Editor

- [ ] Implement click-to-add-point interaction
- [ ] Draw polyline between added points
- [ ] “Finish track” workflow
- [ ] Convert drawn data into `domain` models
- [ ] Add undo / reset track drawing
- [ ] Add UI for selecting **track type** (AVO / VOI / Training) before drawing

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
- [ ] No validation for Training tracks, but show:
  - [ ] Total length
  - [ ] Segment lengths
  - [ ] Object list

---

## Phase 5 – Editor UX & Advanced Features

- [ ] Add domain-specific objects to editor:
  - [ ] Start
  - [ ] Finish
  - [ ] Corners
  - [ ] Lay pits (makuupaikka)
  - [ ] Katkos (break)
  - [ ] Markers
- [ ] Visualize rule violations on map (color overlays or tooltips)
- [ ] Add local persistence for tracks (`localStorage` or IndexedDB)
- [ ] Improve geometry editing (move points, delete point)

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
- [ ] Begin offline-map planning

---

## Continuous Tasks

- [ ] Maintain and expand test coverage (domain + web + server)
- [ ] Refactor domain models as MEJÄ rule interpretation evolves
- [ ] Update documentation when architecture changes
- [ ] Add small guides (map setup, rule logic, domain models)
