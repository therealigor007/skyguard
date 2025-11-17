'use client';

import { useState, useCallback } from 'react';
import { analyzeFlightsNearDisasters, Flight, Earthquake, NaturalEvent, AnalysisMatch } from '@/lib/api';

interface UseAnalysisReturn {
  analyze: (
    flights: Flight[],
    disasters: (Earthquake | NaturalEvent)[],
    radiusKm?: number
  ) => Promise<void>;
  affectedFlights: AnalysisMatch[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for analyzing flights near disasters
 * @returns Analysis function, affected flights data, loading state, and error state
 */
export function useAnalysis(): UseAnalysisReturn {
  const [affectedFlights, setAffectedFlights] = useState<AnalysisMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (
      flights: Flight[],
      disasters: (Earthquake | NaturalEvent)[],
      radiusKm: number = 200
    ) => {
      try {
        setLoading(true);
        setError(null);

        const response = await analyzeFlightsNearDisasters({
          flights,
          disasters,
          radiusKm,
        });

        setAffectedFlights(response.matches);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to analyze flights';
        setError(errorMessage);
        console.error('Error analyzing flights:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    analyze,
    affectedFlights,
    loading,
    error,
  };
}
