const CONFIG = {
  // API Endpoints
  API: {
    OPENSKY: "https://opensky-network.org/api/states/all",
    USGS: "https://earthquake.usgs.gov/fdsnws/event/1/query",
    NASA_EONET: "https://eonet.gsfc.nasa.gov/api/v3/events",
  },

  // Default Settings
  DEFAULTS: {
    MIN_MAGNITUDE: 4.5,
    DAYS_RANGE: 7,
    ALERT_RADIUS: 200, // kilometers
    AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
  },

  // Map Settings
  MAP: {
    CENTER: [0, 0],
    ZOOM: 2,
    MIN_ZOOM: 2,
    MAX_ZOOM: 18,
    TILE_LAYER: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    ATTRIBUTION:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },

  // Marker Icons (emoji-based for simplicity)
  ICONS: {
    FLIGHT: "✈️",
    FLIGHT_EMERGENCY: "🚨", // Added specific icon for emergency
    EARTHQUAKE: "🌍",
    WILDFIRE: "🔥",
    STORM: "🌀",
    VOLCANO: "🌋",
    FLOOD: "🌊",
    ALERT: "⚠️",
    AIRPORT: "🛫", // Added an airport icon placeholder for future use
  },

  // Severity Colors
  COLORS: {
    HIGH_RISK: "#dc2626", // Red-600
    MEDIUM_RISK: "#f59e0b", // Amber-500
    LOW_RISK: "#10b981", // Emerald-500
    FLIGHT: "#3b82f6", // Blue-600
    EARTHQUAKE: "#ef4444", // Red-500
    EVENT: "#f97316", // Orange-500
    ALERT_PROXIMITY: "#f59e0b", // Amber for proximity alert circle
  },

  // Request Timeout
  TIMEOUT: 15000, // 15 seconds
};

// Global State object to hold all data, filters, and timers
const STATE = {
  flights: [],
  earthquakes: [],
  events: [],
  alerts: [],
  filters: {
    showFlights: true,
    showEarthquakes: true,
    showEvents: true,
    minMagnitude: CONFIG.DEFAULTS.MIN_MAGNITUDE,
    daysRange: CONFIG.DEFAULTS.DAYS_RANGE,
    alertRadius: CONFIG.DEFAULTS.ALERT_RADIUS,
  },
  mapInstance: null, // Will hold the Leaflet map object
  markerLayers: {}, // To manage Leaflet marker layers (flights, quakes, events)
  alertCircles: [], // To manage Leaflet alert circles
  autoRefreshInterval: null,
  lastUpdate: null,
};

// Export CONFIG and STATE so other modules can access them
export { CONFIG, STATE };
