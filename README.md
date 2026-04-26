# Trail Tracker (working title)

[![CI](https://github.com/miahro/tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/miahro/tracker/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/miahro/tracker/branch/main/graph/badge.svg)](https://codecov.io/gh/miahro/tracker)

Planning and navigation tool for **MEJÄ** (Metsästyskoirien jäljestämiskoe) style blood tracks used in Finnish dog sports.

The project will eventually consist of:

- 🌐 **Web app (desktop-first)** for designing and validating tracks on top of Maanmittauslaitos (NLS) maps
- 📱 **Mobile app (Android / React Native)** for offline navigation while laying and running tracks
- 🗄️ **Backend (Node.js + Express + Prisma)** for storing tracks, rules, and user accounts
- 📦 **Shared TypeScript domain logic** for geometry, rules, and validation, reused across all platforms

Official MEJÄ rules and organizing instructions are used as the primary domain reference.

---

## Goals

- Provide an easy way to **design MEJÄ-compliant tracks** on top of official Finnish maps
- Help organizers **validate tracks against rules** (lengths, angles, separation, lay pits, etc.)
- Support field work with **offline-capable navigation** during track laying and trial execution
- Serve as a **learning project** for a full-stack TypeScript app with a future native mobile client

---

## Data Sources

### MapAnt Finland

- Automatically generated orienteering map of Finland
- Contains data © National Land Survey of Finland (NLS)
- License: **CC BY 4.0**
- https://mapant.fi

### National Land Survey of Finland (NLS)

- Topographic database vector tiles (Taustakartta / Backgroundmap)
- License: **CC BY 4.0**
- https://www.maanmittauslaitos.fi/en/maps-and-spatial-data/opendata

Proper attribution is shown inside the application UI on all map layers.

---

## Tech Stack (planned)

**Frontend (web)**

- React + TypeScript
- Vite
- MapLibre GL JS

**Mobile (later phase)**

- React Native + TypeScript
- React Native MapLibre
- Offline maps + GPS

**Backend (later phase)**

- Node.js + Express
- Prisma ORM
- PostgreSQL / SQLite

**Shared domain**

- Pure TypeScript (`domain/`)
- Geometry, MEJÄ rules, validation

---

## Repository Structure

```text
.
├─ domain/
├─ web/
├─ server/
└─ mobile/
```

---

## Local Development

### Prerequisites

- **Node.js** ≥ 20 (recommend installing via [nvm](https://github.com/nvm-sh/nvm))
- **npm** ≥ 10 (comes with Node 20)

### First-time setup

```bash
git clone https://github.com/miahro/tracker.git
cd tracker
npm install        # installs all workspace packages (domain + web)
```

### Run the web app

```bash
npm run dev -w @trail-tracker/web
```

Open http://localhost:5173 in your browser. The map loads NLS Finland tiles by default.

---

### Linting & formatting

This repository uses **ESLint** with **Prettier**.

```bash
npm run lint          # check for issues
npm run lint -- --fix # auto-fix where possible
npm run format        # apply Prettier formatting
```

---

### Testing

#### Domain unit tests (Vitest)

All domain business logic has unit tests. Run from the repo root:

```bash
npm test                     # run once
npx vitest --reporter=verbose  # watch mode with output
```

#### End-to-end tests (Cypress)

The web app uses Cypress for E2E tests.

```bash
# Full automated run (starts dev server, runs tests, tears down):
npm run e2e -w @trail-tracker/web

# Interactive Cypress UI:
npm run cy:open -w @trail-tracker/web         # Chromium
npm run cy:open:chrome -w @trail-tracker/web  # Chrome

# Headless run only (requires dev server already running):
npm run cy:run -w @trail-tracker/web
```

---

### Typical daily workflow

```bash
npm install                        # after pulling, if dependencies changed

npm run dev -w @trail-tracker/web  # start dev server

# before committing:
npm run lint
npm test
```

Before opening a pull request, also run:

```bash
npm run e2e -w @trail-tracker/web
```

---

## Architecture

System architecture is described in [architecture](./docs/architecture.md).

---

## License

This project is licensed under the **MIT License**.

External map data is licensed under **CC BY 4.0**:

- MapAnt Finland
- National Land Survey of Finland (NLS)

Attribution is shown inside the application UI and documented above.
