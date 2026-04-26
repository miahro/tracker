// web/src/persistence.ts
//
// Thin IndexedDB wrapper for persisting:
//   - DraftTrackState  (survives page refresh)
//   - Viewport         (center + zoom, survives page refresh and basemap toggle)
//
// Single database "trail-tracker", single object store "app-state".
// Keys: 'track-state' and 'viewport'.

const DB_NAME = 'trail-tracker'
const DB_VERSION = 1
const STORE_NAME = 'app-state'

const KEY_TRACK = 'track-state'
const KEY_VIEWPORT = 'viewport'

export interface PersistedViewport {
  center: [number, number] // [lng, lat]
  zoom: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function get<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => resolve((req.result as T) ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

async function set<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const req = tx.objectStore(STORE_NAME).put(value, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // Persistence is best-effort — never crash the app
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

import type { DraftTrackState } from './features/track-editor/draftTrackReducer'

export async function saveTrackState(state: DraftTrackState): Promise<void> {
  await set(KEY_TRACK, state)
}

export async function loadTrackState(): Promise<DraftTrackState | null> {
  return get<DraftTrackState>(KEY_TRACK)
}

export async function saveViewport(viewport: PersistedViewport): Promise<void> {
  await set(KEY_VIEWPORT, viewport)
}

export async function loadViewport(): Promise<PersistedViewport | null> {
  return get<PersistedViewport>(KEY_VIEWPORT)
}
