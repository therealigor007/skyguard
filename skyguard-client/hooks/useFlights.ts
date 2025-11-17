'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFlights, Flight, FlightsResponse } from '@/lib/api';

interface UseFlightsOptions {
  autoRefresh?: boolean;
  interval?: number; // in milliseconds
}

interface UseFlightsReturn {
  flights: Flight[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdate: Date | null;
}

/**
 * Custom hook for fetching flight data
 * @param options - Configuration options
 * @returns Flight data, loading state, error state, and refetch function
 */
export function useFlights(options: UseFlightsOptions = {}): UseFlightsReturn {
  const { autoRefresh = false, interval = 30000 } = options;

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchFlights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: FlightsResponse = await getFlights();
      setFlights(response.flights);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch flights';
      setError(errorMessage);
      console.error('Error fetching flights:', err);
      
      // Retry logic - wait 5 seconds and retry once
      if (err instanceof Error && err.message.includes('rate limit')) {
        setTimeout(() => {
          fetchFlights();
        }, 5000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchFlights();
    }, interval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, interval, fetchFlights]);

  return {
    flights,
    loading,
    error,
    refetch: fetchFlights,
    lastUpdate,
  };
}
