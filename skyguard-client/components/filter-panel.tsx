'use client'

import { useState } from 'react'
import { Toggle } from '@/components/ui/toggle'

export function FilterPanel() {
  const [showFlights, setShowFlights] = useState(true)
  const [showEarthquakes, setShowEarthquakes] = useState(true)
  const [showEvents, setShowEvents] = useState(true)
  const [minMagnitude, setMinMagnitude] = useState(4.5)
  const [alertRadius, setAlertRadius] = useState(200)
  const [autoRefresh, setAutoRefresh] = useState(true)

  return (
    <div className="absolute top-24 left-96 right-6 z-30 glass rounded-lg border border-border p-4 flex items-center gap-6">
      {/* Toggle Switches */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Show Flights</label>
        <button
          onClick={() => setShowFlights(!showFlights)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-smooth ${
            showFlights ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-smooth ${
              showFlights ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Earthquakes</label>
        <button
          onClick={() => setShowEarthquakes(!showEarthquakes)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-smooth ${
            showEarthquakes ? 'bg-red-500' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-smooth ${
              showEarthquakes ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Events</label>
        <button
          onClick={() => setShowEvents(!showEvents)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-smooth ${
            showEvents ? 'bg-orange-500' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-smooth ${
              showEvents ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Range Sliders */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium whitespace-nowrap">Min Magnitude:</label>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={minMagnitude}
          onChange={(e) => setMinMagnitude(parseFloat(e.target.value))}
          className="w-24 h-1 bg-muted rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm font-mono">{minMagnitude.toFixed(1)}</span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium whitespace-nowrap">Alert Radius:</label>
        <input
          type="range"
          min="50"
          max="500"
          step="50"
          value={alertRadius}
          onChange={(e) => setAlertRadius(parseInt(e.target.value))}
          className="w-24 h-1 bg-muted rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm font-mono">{alertRadius} km</span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Auto-Refresh</label>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-smooth ${
            autoRefresh ? 'bg-green-500' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-smooth ${
              autoRefresh ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
