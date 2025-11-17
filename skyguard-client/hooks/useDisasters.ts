'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllDisasters, Earthquake, NaturalEvent, AllDisastersResponse } from '@/lib/api';

interface UseDisastersOptions {
  minMagnitude?: number;
  autoRefresh?: boolean;
  interval?: number; // in milliseconds
}

interface UseDisastersReturn {
  earthquakes: Earthquake[];
  events: NaturalEvent[];
  allDisasters: (Earthquake | NaturalEvent)[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdate: Date | null;
}

/**
 * Custom hook for fetching disaster data (earthquakes and natural events)
 * @param options - Configuration options
 * @returns Disaster data, loading state, error state, and refetch function
 */
export function useDisasters(options: UseDisastersOptions = {}): UseDisastersReturn {
  const { minMagnitude = 4.5, autoRefresh = false, interval = 30000 } = options;

  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [events, setEvents] = useState<NaturalEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchDisasters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: AllDisastersResponse = await getAllDisasters({
        minMagnitude,
        days: 7,
      });

      setEarthquakes(response.data.earthquakes);
      setEvents(response.data.natural_events);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch disasters';
      setError(errorMessage);
      console.error('Error fetching disasters:', err);
      
      // Retry logic - wait 5 seconds and retry once
      setTimeout(() => {
        fetchDisasters();
      }, 5000);
    } finally {
      setLoading(false);
    }
  }, [minMagnitude]);

  // Initial fetch
  useEffect(() => {
    fetchDisasters();
  }, [fetchDisasters]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchDisasters();
    }, interval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, interval, fetchDisasters]);

  // Combine all disasters into a single array
  const allDisasters = [...earthquakes, ...events];

  return {
    earthquakes,
    events,
    allDisasters,
    loading,
    error,
    refetch: fetchDisasters,
    lastUpdate,
  };
}
