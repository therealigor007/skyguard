'use client'

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'

const mockFlights = [
  { id: 1, callsign: 'UAL456', origin: '🇺🇸 USA', altitude: '35,000 ft', speed: '450 kt' },
  { id: 2, callsign: 'AAL789', origin: '🇨🇦 Canada', altitude: '32,000 ft', speed: '460 kt' },
  { id: 3, callsign: 'SWA123', origin: '🇺🇸 USA', altitude: '28,000 ft', speed: '440 kt' },
  { id: 4, callsign: 'DAL456', origin: '🇺🇸 USA', altitude: '38,000 ft', speed: '470 kt' },
  { id: 5, callsign: 'ACA789', origin: '🇨🇦 Canada', altitude: '33,000 ft', speed: '455 kt' },
]

const mockDisasters = [
  { id: 1, type: 'Earthquake', severity: '6.5', location: 'Pacific Coast', time: '2 hours ago', color: 'bg-red-500' },
  { id: 2, type: 'Wildfire', severity: '5.2', location: 'California', time: '4 hours ago', color: 'bg-orange-500' },
  { id: 3, type: 'Storm', severity: '4.8', location: 'Gulf Coast', time: '1 hour ago', color: 'bg-yellow-500' },
  { id: 4, type: 'Volcano', severity: '7.1', location: 'Hawaii', time: '30 min ago', color: 'bg-red-600' },
  { id: 5, type: 'Wildfire', severity: '5.5', location: 'Oregon', time: '6 hours ago', color: 'bg-orange-500' },
]

export function Sidebar() {
  const [activeTab, setActiveTab] = useState('flights')
  const [searchTerm, setSearchTerm] = useState('')
  const [disasterFilter, setDisasterFilter] = useState('All')

  const flightItems = mockFlights.filter(f =>
    f.callsign.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const disasterItems = mockDisasters.filter(d => {
    if (disasterFilter === 'All') return true
    return d.type === disasterFilter
  })

  return (
    <div className="fixed left-0 top-20 bottom-0 w-80 glass border-r border-border overflow-y-auto">
      {/* Tabs */}
      <div className="flex border-b border-border sticky top-0 bg-slate-800/90 backdrop-blur">
        <button
          onClick={() => setActiveTab('flights')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-smooth ${
            activeTab === 'flights'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Flights
        </button>
        <button
          onClick={() => setActiveTab('disasters')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-smooth ${
            activeTab === 'disasters'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Disasters
        </button>
      </div>

      <div className="p-4">
        {/* Search/Filter */}
        {activeTab === 'flights' && (
          <div className="mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search callsign..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {activeTab === 'disasters' && (
          <div className="mb-4">
            <select
              value={disasterFilter}
              onChange={(e) => setDisasterFilter(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option>All</option>
              <option>Earthquakes</option>
              <option>Wildfire</option>
              <option>Storm</option>
              <option>Volcano</option>
            </select>
          </div>
        )}

        {/* Flight Cards */}
        {activeTab === 'flights' && (
          <div className="space-y-2">
            {flightItems.map((flight) => (
              <div
                key={flight.id}
                className="p-3 bg-card rounded-lg border border-border cursor-pointer hover-lift"
              >
                <p className="font-bold text-sm mb-1">{flight.callsign}</p>
                <p className="text-xs text-muted-foreground mb-2">{flight.origin}</p>
                <div className="flex justify-between text-xs">
                  <span>Alt: {flight.altitude}</span>
                  <span>Speed: {flight.speed}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disaster Cards */}
        {activeTab === 'disasters' && (
          <div className="space-y-2">
            {disasterItems.map((disaster) => (
              <div
                key={disaster.id}
                className="p-3 bg-card rounded-lg border border-border cursor-pointer hover-lift"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold text-white ${disaster.color}`}>
                    {disaster.type}
                  </span>
                </div>
                <p className="text-sm font-medium mb-1">{disaster.location}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mag: {disaster.severity}</span>
                  <span>{disaster.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
