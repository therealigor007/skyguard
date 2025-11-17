const express = require("express");
const router = express.Router();
const openSkyService = require("../services/opensky");

// Cache object
let flightCache = {
  data: null,
  timestamp: null,
};

const CACHE_DURATION = (process.env.CACHE_DURATION || 30) * 1000;

// GET /api/flights/all - Get all flights
router.get("/all", async (req, res) => {
  try {
    const now = Date.now();

    // Return cached data if still valid
    if (
      flightCache.data &&
      flightCache.timestamp &&
      now - flightCache.timestamp < CACHE_DURATION
    ) {
      return res.json({
        source: "cache",
        cached_at: new Date(flightCache.timestamp).toISOString(),
        count: flightCache.data.length,
        flights: flightCache.data,
      });
    }

    // Fetch fresh data
    const flights = await openSkyService.getAllFlights();

    // Update cache
    flightCache = {
      data: flights,
      timestamp: now,
    };

    res.json({
      source: "api",
      fetched_at: new Date(now).toISOString(),
      count: flights.length,
      flights: flights,
    });
  } catch (error) {
    console.error("Error fetching flights:", error.message);
    res.status(500).json({
      error: "Failed to fetch flight data",
      message: error.message,
    });
  }
});

// GET /api/flights/search?callsign=XXX - Search flights by callsign
router.get("/search", async (req, res) => {
  try {
    const { callsign, origin, destination } = req.query;

    if (!callsign && !origin && !destination) {
      return res.status(400).json({
        error:
          "Please provide at least one search parameter: callsign, origin, or destination",
      });
    }

    // Use cached data if available, otherwise fetch
    let flights = flightCache.data;
    if (!flights) {
      flights = await openSkyService.getAllFlights();
    }

    // Filter flights
    let results = flights;

    if (callsign) {
      results = results.filter(
        (f) =>
          f.callsign &&
          f.callsign.toLowerCase().includes(callsign.toLowerCase())
      );
    }

    if (origin) {
      results = results.filter(
        (f) =>
          f.origin_country &&
          f.origin_country.toLowerCase().includes(origin.toLowerCase())
      );
    }

    res.json({
      query: { callsign, origin, destination },
      count: results.length,
      flights: results,
    });
  } catch (error) {
    console.error("Error searching flights:", error.message);
    res.status(500).json({
      error: "Failed to search flights",
      message: error.message,
    });
  }
});

// GET /api/flights/bounds?lat1=X&lon1=Y&lat2=Z&lon2=W - Get flights in bounding box
router.get("/bounds", async (req, res) => {
  try {
    const { lat1, lon1, lat2, lon2 } = req.query;

    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return res.status(400).json({
        error:
          "Please provide all bounding box parameters: lat1, lon1, lat2, lon2",
      });
    }

    const bounds = {
      lat1: parseFloat(lat1),
      lon1: parseFloat(lon1),
      lat2: parseFloat(lat2),
      lon2: parseFloat(lon2),
    };

    const flights = await openSkyService.getFlightsInBounds(bounds);

    res.json({
      bounds: bounds,
      count: flights.length,
      flights: flights,
    });
  } catch (error) {
    console.error("Error fetching flights in bounds:", error.message);
    res.status(500).json({
      error: "Failed to fetch flights in bounds",
      message: error.message,
    });
  }
});

module.exports = router;
