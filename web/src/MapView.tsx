import React, { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export function MapView() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const apiKey = import.meta.env.VITE_NLS_API_KEY

    if (!apiKey) {
      // You can later replace this with a nicer UI message
      // but for now a console warning is enough.

      console.warn('VITE_NLS_API_KEY not set – NLS basemap will not load')
      return
    }

    //const styleUrl = `https://avoin-karttakuva.maanmittauslaitos.fi/vectortiles/stylejson/v20/taustakartta.json?TileMatrixSet=WGS84_Pseudo-Mercator&api-key=${apiKey}`
    const styleUrl = `https://avoin-karttakuva.maanmittauslaitos.fi/vectortiles/stylejson/v20/backgroundmap.json?TileMatrixSet=WGS84_Pseudo-Mercator&api-key=${apiKey}`

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [25.0, 60.0], // [lon, lat] – roughly southern Finland
      zoom: 7,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    // Optional: explicit attribution control, see below
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© National Land Survey of Finland, NLS open data CC BY 4.0',
      }),
      'bottom-right'
    )

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  )
}
