const axios = require("axios");

const EONET_BASE_URL = "https://eonet.gsfc.nasa.gov/api/v3";

/**
 * Get natural events from NASA EONET
 * Categories: wildfires, severeStorms, volcanoes, floods, drought, dustHaze, snowIce, waterColor, landslides, seaLakeIce
 */
async function getNaturalEvents(category = null, status = "open", limit = 100) {
  try {
    let url = `${EONET_BASE_URL}/events`;
    const params = {
      status: status,
      limit: limit,
    };

    if (category) {
      params.category = category;
    }

    const response = await axios.get(url, {
      params,
      timeout: 10000,
    });

    if (!response.data || !response.data.events) {
      return [];
    }

    // Transform EONET data to our format
    const events = response.data.events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      link: event.link,
      closed: event.closed,
      categories: event.categories,
      sources: event.sources,
      geometry: event.geometry,
      // Extract latest coordinates
      latitude: event.geometry?.[0]?.coordinates?.[1] || null,
      longitude: event.geometry?.[0]?.coordinates?.[0] || null,
      date: event.geometry?.[0]?.date || null,
      category: event.categories?.[0]?.title || "Unknown",
    }));

    // Filter out events without coordinates
    return events.filter((e) => e.latitude !== null && e.longitude !== null);
  } catch (error) {
    throw new Error(`NASA EONET API error: ${error.message}`);
  }
}

/**
 * Get available event categories
 */
async function getCategories() {
  try {
    const response = await axios.get(`${EONET_BASE_URL}/categories`, {
      timeout: 10000,
    });

    return response.data.categories || [];
  } catch (error) {
    throw new Error(`NASA EONET API error: ${error.message}`);
  }
}

module.exports = {
  getNaturalEvents,
  getCategories,
};
