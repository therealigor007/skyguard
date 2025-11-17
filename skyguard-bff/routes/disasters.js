const express = require("express");
const router = express.Router();
const usgsService = require("../services/usgs");
const eonetService = require("../services/eonet");

// Cache objects
let earthquakeCache = { data: null, timestamp: null };
let eventsCache = { data: null, timestamp: null };

const CACHE_DURATION = (process.env.CACHE_DURATION || 30) * 1000;

// GET /api/disasters/earthquakes - Get earthquake data
router.get("/earthquakes", async (req, res) => {
  try {
    const { minMagnitude = 4.5, days = 7 } = req.query;
    const now = Date.now();

    // Check cache
    if (
      earthquakeCache.data &&
      earthquakeCache.timestamp &&
      now - earthquakeCache.timestamp < CACHE_DURATION
    ) {
      return res.json({
        source: "cache",
        cached_at: new Date(earthquakeCache.timestamp).toISOString(),
        ...earthquakeCache.data,
      });
    }

    // Fetch fresh data
    const earthquakes = await usgsService.getEarthquakes(
      parseFloat(minMagnitude),
      parseInt(days)
    );

    const response = {
      source: "api",
      fetched_at: new Date(now).toISOString(),
      count: earthquakes.length,
      minMagnitude: parseFloat(minMagnitude),
      days: parseInt(days),
      earthquakes: earthquakes,
    };

    // Update cache
    earthquakeCache = {
      data: {
        count: earthquakes.length,
        minMagnitude: parseFloat(minMagnitude),
        days: parseInt(days),
        earthquakes: earthquakes,
      },
      timestamp: now,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching earthquakes:", error.message);
    res.status(500).json({
      error: "Failed to fetch earthquake data",
      message: error.message,
    });
  }
});

// GET /api/disasters/events - Get natural events (storms, wildfires, etc.)
router.get("/events", async (req, res) => {
  try {
    const { category, status = "open", limit = 100 } = req.query;
    const now = Date.now();

    const cacheKey = `${category}-${status}-${limit}`;

    // Check cache
    if (
      eventsCache.data &&
      eventsCache.timestamp &&
      now - eventsCache.timestamp < CACHE_DURATION
    ) {
      return res.json({
        source: "cache",
        cached_at: new Date(eventsCache.timestamp).toISOString(),
        ...eventsCache.data,
      });
    }

    // Fetch fresh data
    const events = await eonetService.getNaturalEvents(
      category,
      status,
      parseInt(limit)
    );

    const response = {
      source: "api",
      fetched_at: new Date(now).toISOString(),
      count: events.length,
      filters: { category, status, limit: parseInt(limit) },
      events: events,
    };

    // Update cache
    eventsCache = {
      data: {
        count: events.length,
        filters: { category, status, limit: parseInt(limit) },
        events: events,
      },
      timestamp: now,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching natural events:", error.message);
    res.status(500).json({
      error: "Failed to fetch natural events",
      message: error.message,
    });
  }
});

// GET /api/disasters/all - Get all disasters combined
router.get("/all", async (req, res) => {
  try {
    const { minMagnitude = 4.5, days = 7 } = req.query;

    // Fetch both earthquakes and events in parallel
    const [earthquakes, events] = await Promise.all([
      usgsService.getEarthquakes(parseFloat(minMagnitude), parseInt(days)),
      eonetService.getNaturalEvents(null, "open", 100),
    ]);

    res.json({
      fetched_at: new Date().toISOString(),
      summary: {
        total: earthquakes.length + events.length,
        earthquakes: earthquakes.length,
        natural_events: events.length,
      },
      data: {
        earthquakes: earthquakes,
        natural_events: events,
      },
    });
  } catch (error) {
    console.error("Error fetching all disasters:", error.message);
    res.status(500).json({
      error: "Failed to fetch disaster data",
      message: error.message,
    });
  }
});

module.exports = router;
