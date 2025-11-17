const axios = require("axios");

const OPENSKY_BASE_URL = "https://opensky-network.org/api";

/**
 * Get all active flights
 */
async function getAllFlights() {
  try {
    const response = await axios.get(`${OPENSKY_BASE_URL}/states/all`, {
      timeout: 10000,
    });

    if (!response.data || !response.data.states) {
      return [];
    }

    // Transform OpenSky data format to our format
    const flights = response.data.states.map((state) => ({
      icao24: state[0],
      callsign: state[1] ? state[1].trim() : null,
      origin_country: state[2],
      time_position: state[3],
      last_contact: state[4],
      longitude: state[5],
      latitude: state[6],
      baro_altitude: state[7],
      on_ground: state[8],
      velocity: state[9],
      true_track: state[10],
      vertical_rate: state[11],
      sensors: state[12],
      altitude: state[13],
      squawk: state[14],
      spi: state[15],
      position_source: state[16],
    }));

    // Filter out flights without position data
    return flights.filter((f) => f.latitude !== null && f.longitude !== null);
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error(
        "OpenSky API rate limit exceeded. Please wait before retrying."
      );
    }
    throw new Error(`OpenSky API error: ${error.message}`);
  }
}

/**
 * Get flights in a bounding box
 */
async function getFlightsInBounds(bounds) {
  try {
    const { lat1, lon1, lat2, lon2 } = bounds;
    const url = `${OPENSKY_BASE_URL}/states/all?lamin=${lat1}&lomin=${lon1}&lamax=${lat2}&lomax=${lon2}`;

    const response = await axios.get(url, {
      timeout: 10000,
    });

    if (!response.data || !response.data.states) {
      return [];
    }

    const flights = response.data.states.map((state) => ({
      icao24: state[0],
      callsign: state[1] ? state[1].trim() : null,
      origin_country: state[2],
      longitude: state[5],
      latitude: state[6],
      altitude: state[13],
      velocity: state[9],
      on_ground: state[8],
    }));

    return flights.filter((f) => f.latitude !== null && f.longitude !== null);
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error(
        "OpenSky API rate limit exceeded. Please wait before retrying."
      );
    }
    throw new Error(`OpenSky API error: ${error.message}`);
  }
}

module.exports = {
  getAllFlights,
  getFlightsInBounds,
};
