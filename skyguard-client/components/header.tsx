'use client'

import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 glass border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">✈️</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            SkyGuard
          </h1>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">✈️</span>
            <div>
              <p className="text-sm text-muted-foreground">Active Flights</p>
              <p className="font-bold text-lg">1,234</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">🌍</span>
            <div>
              <p className="text-sm text-muted-foreground">Active Disasters</p>
              <p className="font-bold text-lg">56</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">🕐</span>
            <div>
              <p className="text-sm text-muted-foreground">Last Update</p>
              <p className="font-bold text-lg">14:23:05</p>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-primary hover:bg-accent text-primary-foreground transition-smooth hover-lift"
        >
          <RefreshCw
            size={20}
            className={isRefreshing ? 'animate-spin' : ''}
          />
        </button>
      </div>
    </div>
  )
}
