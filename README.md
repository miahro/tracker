# Trail Tracker (working title)

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

This is the *target* structure; early versions will grow towards this.

```text
.
├─ domain/          # Pure TS: track models, rules, geometry, validation
├─ web/             # React + MapLibre web UI
├─ server/          # Node + Express + Prisma backend
└─ mobile/          # React Native app (later)


## License

This project is licensed under the [MIT License](./LICENSE).
