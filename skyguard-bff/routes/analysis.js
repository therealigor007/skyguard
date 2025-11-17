const express = require("express");
const router = express.Router();
const { calculateDistance, isPointInRadius } = require("../utils/helpers");

// POST /api/analysis/flights-near-disaster
router.post("/flights-near-disaster", async (req, res) => {
  try {
    const { flights, disasters, radiusKm = 200 } = req.body;

    if (!flights || !disasters) {
      return res.status(400).json({
        error: "Please provide both flights and disasters arrays",
      });
    }

    const results = [];

    // Check each flight against each disaster
    flights.forEach((flight) => {
      if (!flight.latitude || !flight.longitude) return;

      disasters.forEach((disaster) => {
        let disasterLat, disasterLon, disasterType, disasterName;

        // Handle earthquake format
        if (disaster.coordinates) {
          disasterLon = disaster.coordinates[0];
          disasterLat = disaster.coordinates[1];
          disasterType = "earthquake";
          disasterName = disaster.place;
        }
        // Handle EONET format
        else if (disaster.geometry && disaster.geometry[0]) {
          disasterLon = disaster.geometry[0].coordinates[0];
          disasterLat = disaster.geometry[0].coordinates[1];
          disasterType = disaster.categories?.[0]?.title || "natural_event";
          disasterName = disaster.title;
        }

        if (!disasterLat || !disasterLon) return;

        const distance = calculateDistance(
          flight.latitude,
          flight.longitude,
          disasterLat,
          disasterLon
        );

        if (distance <= radiusKm) {
          results.push({
            flight: {
              callsign: flight.callsign,
              icao24: flight.icao24,
              latitude: flight.latitude,
              longitude: flight.longitude,
              altitude: flight.altitude,
              velocity: flight.velocity,
            },
            disaster: {
              type: disasterType,
              name: disasterName,
              latitude: disasterLat,
              longitude: disasterLon,
              magnitude: disaster.magnitude || disaster.mag,
            },
            distance_km: Math.round(distance * 10) / 10,
            severity:
              distance < 50 ? "high" : distance < 100 ? "medium" : "low",
          });
        }
      });
    });

    res.json({
      analyzed_at: new Date().toISOString(),
      radius_km: radiusKm,
      flights_analyzed: flights.length,
      disasters_analyzed: disasters.length,
      matches_found: results.length,
      matches: results.sort((a, b) => a.distance_km - b.distance_km),
    });
  } catch (error) {
    console.error("Error analyzing flights near disasters:", error.message);
    res.status(500).json({
      error: "Failed to analyze flights",
      message: error.message,
    });
  }
});

// GET /api/analysis/affected-airports
router.get("/affected-airports", async (req, res) => {
  try {
    const { disasters, radiusKm = 100 } = req.query;

    if (!disasters) {
      return res.status(400).json({
        error: "Please provide disasters data",
      });
    }

    // This is a simplified version - in production, you'd have an airport database
    const majorAirports = [
      { code: "LAX", name: "Los Angeles", lat: 33.9416, lon: -118.4085 },
      { code: "JFK", name: "New York JFK", lat: 40.6413, lon: -73.7781 },
      { code: "HND", name: "Tokyo Haneda", lat: 35.5494, lon: 139.7798 },
      { code: "LHR", name: "London Heathrow", lat: 51.47, lon: -0.4543 },
      { code: "CDG", name: "Paris CDG", lat: 49.0097, lon: 2.5479 },
      { code: "DXB", name: "Dubai", lat: 25.2532, lon: 55.3657 },
      { code: "SIN", name: "Singapore", lat: 1.3644, lon: 103.9915 },
      { code: "SYD", name: "Sydney", lat: -33.9399, lon: 151.1753 },
      { code: "MNL", name: "Manila", lat: 14.5086, lon: 121.0194 },
      { code: "MEX", name: "Mexico City", lat: 19.4363, lon: -99.0721 },
    ];

    const affectedAirports = [];
    const disastersArray = JSON.parse(disasters);

    majorAirports.forEach((airport) => {
      disastersArray.forEach((disaster) => {
        let disasterLat, disasterLon;

        if (disaster.coordinates) {
          disasterLon = disaster.coordinates[0];
          disasterLat = disaster.coordinates[1];
        } else if (disaster.geometry && disaster.geometry[0]) {
          disasterLon = disaster.geometry[0].coordinates[0];
          disasterLat = disaster.geometry[0].coordinates[1];
        }

        if (!disasterLat || !disasterLon) return;

        const distance = calculateDistance(
          airport.lat,
          airport.lon,
          disasterLat,
          disasterLon
        );

        if (distance <= parseFloat(radiusKm)) {
          affectedAirports.push({
            airport: airport,
            disaster: disaster,
            distance_km: Math.round(distance * 10) / 10,
          });
        }
      });
    });

    res.json({
      analyzed_at: new Date().toISOString(),
      radius_km: parseFloat(radiusKm),
      affected_count: affectedAirports.length,
      affected_airports: affectedAirports,
    });
  } catch (error) {
    console.error("Error analyzing affected airports:", error.message);
    res.status(500).json({
      error: "Failed to analyze airports",
      message: error.message,
    });
  }
});

module.exports = router;
