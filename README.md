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

This project uses openly licensed geospatial datasets:

### MapAnt Finland
- **MapAnt Finland** – automatically generated orienteering map of all Finland
- Contains data © *National Land Survey of Finland (NLS)*
- Open data license: **CC BY 4.0**
- Website: https://mapant.fi

### National Land Survey of Finland (NLS)
- **Topographic database vector tiles (Taustakartta / Backgroundmap)**
- Open data license: **CC BY 4.0**
- More information: https://www.maanmittauslaitos.fi/en/maps-and-spatial-data/opendata

Proper attribution is shown inside the application UI on all map layers.

---


## Tech Stack (planned)

**Frontend (web)**

- React + TypeScript
- Vite (dev/build tool)
- MapLibre GL JS (map rendering)
- NLS Finland vector tiles / WMTS as basemap(s)

**Mobile (later phase)**

- React Native + TypeScript
- React Native MapLibre
- Offline maps + GPS + device sensors

**Backend (later phase)**

- Node.js + Express (REST API)
- Prisma ORM
- PostgreSQL (or SQLite for development)

**Shared domain**

- Pure TypeScript (`domain/`), no React/Node dependencies
- Geometry, MEJÄ rule modelling, and validation

**Testing**

- Jest or Vitest for unit tests (domain & backend)
- Cypress for E2E tests (web)

---

## Repository Structure (planned)

This is the _target_ structure; early versions will grow towards this.

```text
.
├─ domain/          # Pure TS: track models, rules, geometry, validation
├─ web/             # React + MapLibre web UI
├─ server/          # Node + Express + Prisma backend
└─ mobile/          # React Native app (later)
```

## Architecture

System architecture is described in [architecture](./docs/architecture.md).

## License

This project is licensed under the [MIT License](./LICENSE).

### License Compatibility

This project is licensed under the **MIT License**.

All external map layers used in the application are under **Creative Commons Attribution 4.0 International (CC BY 4.0)** licenses:

- **MapAnt Finland** imagery
- **National Land Survey of Finland (NLS)** open datasets and vector tiles

CC BY 4.0 is compatible with MIT-licensed software **as long as attribution requirements are fulfilled**.
To meet these obligations:

- Attribution is shown **inside the application UI** on all maps.
- Attribution is also included in the project’s **Data Sources** section.

No CC BY 4.0 licensed data is redistributed or modified inside this repository; it is loaded dynamically from the official providers, which keeps licensing boundaries clear.
