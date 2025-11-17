import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * API Client for SkyGuard Backend
 * Provides TypeScript interfaces and functions for all API endpoints
 */

// TypeScript Interfaces
export interface Flight {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  sensors: number[] | null;
  altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
}

export interface FlightsResponse {
  source: string;
  fetched_at?: string;
  cached_at?: string;
  count: number;
  flights: Flight[];
}

export interface SearchFlightsParams {
  callsign?: string;
  origin?: string;
  destination?: string;
}

export interface BoundsParams {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
}

export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: string;
  updated: string;
  coordinates: [number, number, number]; // [lon, lat, depth]
  latitude: number;
  longitude: number;
  depth: number;
  type: string;
  title: string;
  status: string;
  tsunami: boolean;
  sig: number;
  url: string;
  detail: string;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: string | null;
  category: string;
}

export interface EarthquakesResponse {
  source: string;
  fetched_at?: string;
  cached_at?: string;
  count: number;
  minMagnitude: number;
  days: number;
  earthquakes: Earthquake[];
}

export interface NaturalEvent {
  id: string;
  title: string;
  description: string | null;
  link: string;
  closed: string | null;
  categories: Array<{ id: string; title: string }>;
  sources: Array<{ id: string; url: string }>;
  geometry: Array<{
    date: string;
    type: string;
    coordinates: [number, number];
  }>;
  latitude: number | null;
  longitude: number | null;
  date: string | null;
  category: string;
}

export interface NaturalEventsResponse {
  source: string;
  fetched_at?: string;
  cached_at?: string;
  count: number;
  filters: {
    category?: string;
    status: string;
    limit: number;
  };
  events: NaturalEvent[];
}

export interface AllDisastersResponse {
  fetched_at: string;
  summary: {
    total: number;
    earthquakes: number;
    natural_events: number;
  };
  data: {
    earthquakes: Earthquake[];
    natural_events: NaturalEvent[];
  };
}

export interface AnalysisMatch {
  flight: {
    callsign: string | null;
    icao24: string;
    latitude: number;
    longitude: number;
    altitude: number | null;
    velocity: number | null;
  };
  disaster: {
    type: string;
    name: string;
    latitude: number;
    longitude: number;
    magnitude?: number;
  };
  distance_km: number;
  severity: 'high' | 'medium' | 'low';
}

export interface AnalysisResponse {
  analyzed_at: string;
  radius_km: number;
  flights_analyzed: number;
  disasters_analyzed: number;
  matches_found: number;
  matches: AnalysisMatch[];
}

export interface AffectedAirport {
  airport: {
    code: string;
    name: string;
    lat: number;
    lon: number;
  };
  disaster: Earthquake | NaturalEvent;
  distance_km: number;
}

export interface AffectedAirportsResponse {
  analyzed_at: string;
  radius_km: number;
  affected_count: number;
  affected_airports: AffectedAirport[];
}

// API Client Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for error handling
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error: No response received');
    } else {
      // Error in request setup
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API Functions

/**
 * Get all active flights
 */
export async function getFlights(): Promise<FlightsResponse> {
  const response = await apiClient.get<FlightsResponse>('/api/flights/all');
  return response.data;
}

/**
 * Search flights by parameters
 */
export async function searchFlights(params: SearchFlightsParams): Promise<FlightsResponse> {
  const response = await apiClient.get<FlightsResponse>('/api/flights/search', { params });
  return response.data;
}

/**
 * Get flights in bounding box
 */
export async function getFlightsBounds(bounds: BoundsParams): Promise<FlightsResponse> {
  const response = await apiClient.get<FlightsResponse>('/api/flights/bounds', {
    params: bounds,
  });
  return response.data;
}

/**
 * Get earthquakes
 */
export async function getEarthquakes(params?: {
  minMagnitude?: number;
  days?: number;
}): Promise<EarthquakesResponse> {
  const response = await apiClient.get<EarthquakesResponse>('/api/disasters/earthquakes', {
    params,
  });
  return response.data;
}

/**
 * Get natural events
 */
export async function getNaturalEvents(params?: {
  category?: string;
  status?: string;
  limit?: number;
}): Promise<NaturalEventsResponse> {
  const response = await apiClient.get<NaturalEventsResponse>('/api/disasters/events', {
    params,
  });
  return response.data;
}

/**
 * Get all disasters (earthquakes + natural events)
 */
export async function getAllDisasters(params?: {
  minMagnitude?: number;
  days?: number;
}): Promise<AllDisastersResponse> {
  const response = await apiClient.get<AllDisastersResponse>('/api/disasters/all', {
    params,
  });
  return response.data;
}

/**
 * Analyze flights near disasters
 */
export async function analyzeFlightsNearDisasters(data: {
  flights: Flight[];
  disasters: (Earthquake | NaturalEvent)[];
  radiusKm?: number;
}): Promise<AnalysisResponse> {
  const response = await apiClient.post<AnalysisResponse>(
    '/api/analysis/flights-near-disaster',
    data
  );
  return response.data;
}

/**
 * Get affected airports near disasters
 */
export async function getAffectedAirports(params: {
  disasters: (Earthquake | NaturalEvent)[];
  radiusKm?: number;
}): Promise<AffectedAirportsResponse> {
  const response = await apiClient.get<AffectedAirportsResponse>(
    '/api/analysis/affected-airports',
    {
      params: {
        disasters: JSON.stringify(params.disasters),
        radiusKm: params.radiusKm,
      },
    }
  );
  return response.data;
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  const response = await apiClient.get('/health');
  return response.data;
}

export default apiClient;
