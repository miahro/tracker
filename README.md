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

## Development

### Linting

This repository uses **ESLint** for linting, with formatting handled by **Prettier**.

Run linting from the repository root:

```bash
npm run lint
```

Auto-fix where possible:

```bash
npm run lint -- --fix
```

---

### Testing

Testing is split into **unit tests** (domain) and **end-to-end (E2E) tests** (web).

#### Unit Tests

Unit tests are implemented using **Vitest** and currently focus on the `domain/` package.

Run from repo root:

```bash
npm test
```


---

#### End-to-End (E2E) Tests – Web

The web application uses **Cypress**.

Run from the root:

```bash
npm run cy:open -w @trail-tracker/web   # Cypress UI (Chromium)
npm run cy:open:chrome -w @trail-tracker/web   # Cypress UI (Chrome)
npm run cy:run -w @trail-tracker/web         # Headless Cypress run
```

Run full automated E2E flow (recommended):

```bash
npm run e2e -w @trail-tracker/web
```

This will:
1. Start the Vite dev server
2. Wait for http://localhost:5173
3. Execute Cypress tests headlessly
4. Shut everything down automatically

---

### Local Development Workflow

Typical day-to-day workflow:

```bash
# install dependencies
npm install

# start web app
npm run e2e -w @trail-tracker/web
```

Before committing:

```bash
npm run lint
npm test
```

Before opening a PR (recommended):

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