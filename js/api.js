import { CONFIG, STATE } from "./config.js";

const API = {
  /**
   * Fetch all active flights from OpenSky Network
   */
  async fetchFlights() {
    try {
      // OpenSky often times out or rate limits free users.
      // We use a short timeout to fail fast if it's stuck.
      const response = await fetch(CONFIG.API.OPENSKY, {
        method: "GET",
        signal: AbortSignal.timeout(CONFIG.TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !data.states) {
        console.warn("No flight data available");
        return [];
      }

      // Transform OpenSky data format
      const flights = data.states
        .map((state) => ({
          callsign: state[1] ? state[1].trim() : "Unknown",
          icao24: state[0], // Unique identifier
          country: state[2] || "Unknown",
          longitude: state[5],
          latitude: state[6],
          // FIX: Ensure altitude is a number, default to 0 if null
          altitude: (state[13] !== null ? state[13] : state[7]) || 0,
          // FIX: Ensure velocity is a number, default to 0 if null
          velocity: state[9] || 0,
          // FIX: Ensure heading is a number, default to 0 if null
          heading: state[10] || 0,
          onGround: state[8],
          emergency:
            state[14] === "7700" ||
            state[14] === "7600" ||
            state[14] === "7500",
          verticalRate: state[11] || 0,
          type: "flight",
        }))
        .filter((f) => f.latitude !== null && f.longitude !== null);
      return flights;
    } catch (error) {
      console.warn("Flight fetch failed (skipping layer):", error.message);
      return []; // Return empty array so other layers still work
    }
  },

  /**
   * Fetch earthquakes from USGS
   */
  async fetchEarthquakes(minMagnitude = 4.5, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const url = new URL(CONFIG.API.USGS);
      url.searchParams.append("format", "geojson");
      url.searchParams.append(
        "starttime",
        startDate.toISOString().split("T")[0]
      );
      url.searchParams.append("minmagnitude", minMagnitude);
      url.searchParams.append("orderby", "time");

      const response = await fetch(url, {
        signal: AbortSignal.timeout(CONFIG.TIMEOUT),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (!data || !data.features) return [];

      const earthquakes = data.features.map((feature) => ({
        id: feature.id,
        magnitude: feature.properties.mag,
        place: feature.properties.place,
        time: new Date(feature.properties.time).toISOString(),
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        depth: feature.geometry.coordinates[2],
        tsunami: feature.properties.tsunami === 1,
        alert: feature.properties.alert,
        url: feature.properties.url,
        type: "earthquake",
      }));
      return earthquakes;
    } catch (error) {
      console.warn("Earthquake fetch failed:", error.message);
      return [];
    }
  },

  /**
   * Fetch natural events from NASA EONET
   */
  async fetchNaturalEvents() {
    try {
      const url = new URL(CONFIG.API.NASA_EONET);
      url.searchParams.append("status", "open");
      url.searchParams.append("limit", "100");

      const response = await fetch(url, {
        signal: AbortSignal.timeout(CONFIG.TIMEOUT),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (!data || !data.events) return [];

      const events = data.events
        .map((event) => {
          let latestGeometry = null;
          if (event.geometry && event.geometry.length > 0) {
            latestGeometry = event.geometry.reduce((latest, current) => {
              if (!latest) return current;
              const latestDate = latest.date
                ? new Date(latest.date).getTime()
                : 0;
              const currentDate = current.date
                ? new Date(current.date).getTime()
                : 0;
              return currentDate > latestDate ? current : latest;
            }, null);
          }

          if (!latestGeometry || !latestGeometry.coordinates) return null;

          return {
            id: event.id,
            title: event.title,
            category: event.categories?.[0]?.title || "Unknown",
            longitude: latestGeometry.coordinates[0],
            latitude: latestGeometry.coordinates[1],
            date: latestGeometry.date,
            link: event.link,
            type: "event",
          };
        })
        .filter((e) => e !== null);

      return events;
    } catch (error) {
      console.warn("NASA EONET fetch failed:", error.message);
      return [];
    }
  },

  /**
   * Fetch all data in parallel using allSettled
   */
  async fetchAllData() {
    const { minMagnitude, daysRange } = STATE.filters;

    // Use allSettled to prevent one failed API from stopping the others
    const results = await Promise.allSettled([
      this.fetchFlights(),
      this.fetchEarthquakes(minMagnitude, daysRange),
      this.fetchNaturalEvents(),
    ]);

    const flights = results[0].status === "fulfilled" ? results[0].value : [];
    const earthquakes =
      results[1].status === "fulfilled" ? results[1].value : [];
    const events = results[2].status === "fulfilled" ? results[2].value : [];

    if (results[0].status === "rejected")
      console.warn("Failed to load flights.");
    if (results[1].status === "rejected")
      console.warn("Failed to load earthquakes.");
    if (results[2].status === "rejected")
      console.warn("Failed to load events.");

    return { flights, earthquakes, events };
  },
};

export { API };
