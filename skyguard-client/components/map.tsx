'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export function Map() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Initialize map
    mapInstance.current = L.map(mapRef.current).setView([40, -95], 4)

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current)

    // Add airplane markers
    const flights = [
      { lat: 40.7128, lng: -74.006, callsign: 'UAL456' },
      { lat: 34.0522, lng: -118.2437, callsign: 'AAL789' },
      { lat: 41.8781, lng: -87.6298, callsign: 'SWA123' },
    ]

    flights.forEach((flight) => {
      const marker = L.marker([flight.lat, flight.lng], {
        icon: L.divIcon({
          html: `<div class="text-2xl">✈️</div>`,
          iconSize: [24, 24],
          className: 'flex items-center justify-center',
        }),
      }).addTo(mapInstance.current!)

      marker.bindPopup(`<strong>${flight.callsign}</strong><br>Altitude: 35,000 ft<br>Speed: 450 kt`)
    })

    // Add earthquake markers (pulsing circles)
    const earthquakes = [
      { lat: 38.8026, lng: -122.2651, magnitude: 6.5 },
      { lat: 36.7783, lng: -119.4179, magnitude: 5.2 },
    ]

    earthquakes.forEach((eq) => {
      const circle = L.circleMarker([eq.lat, eq.lng], {
        radius: eq.magnitude * 3,
        fillColor: '#ef4444',
        color: '#ef4444',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.4,
      }).addTo(mapInstance.current!)

      circle.bindPopup(`<strong>Earthquake</strong><br>Magnitude: ${eq.magnitude}`)
    })

    // Add volcano marker
    L.marker([21.3099, -157.8581], {
      icon: L.divIcon({
        html: `<div class="text-2xl">🌋</div>`,
        iconSize: [24, 24],
        className: 'flex items-center justify-center',
      }),
    }).addTo(mapInstance.current!)

    return () => {
      // Cleanup
    }
  }, [])

  return (
    <div
      ref={mapRef}
      className="absolute inset-0 left-80 top-20 rounded-lg overflow-hidden"
      style={{ height: 'calc(100vh - 80px)' }}
    />
  )
}
