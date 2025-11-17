const axios = require("axios");

const USGS_BASE_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";

/**
 * Get earthquake data from USGS
 */
async function getEarthquakes(minMagnitude = 4.5, days = 7) {
  try {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);

    const params = {
      format: "geojson",
      starttime: startTime.toISOString().split("T")[0],
      minmagnitude: minMagnitude,
      orderby: "time",
    };

    const response = await axios.get(USGS_BASE_URL, {
      params,
      timeout: 10000,
    });

    if (!response.data || !response.data.features) {
      return [];
    }

    // Transform USGS data to our format
    const earthquakes = response.data.features.map((feature) => ({
      id: feature.id,
      magnitude: feature.properties.mag,
      place: feature.properties.place,
      time: new Date(feature.properties.time).toISOString(),
      updated: new Date(feature.properties.updated).toISOString(),
      coordinates: feature.geometry.coordinates, // [lon, lat, depth]
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      depth: feature.geometry.coordinates[2],
      type: feature.properties.type,
      title: feature.properties.title,
      status: feature.properties.status,
      tsunami: feature.properties.tsunami === 1,
      sig: feature.properties.sig,
      url: feature.properties.url,
      detail: feature.properties.detail,
      felt: feature.properties.felt,
      cdi: feature.properties.cdi,
      mmi: feature.properties.mmi,
      alert: feature.properties.alert,
      category: "earthquake",
    }));

    return earthquakes;
  } catch (error) {
    throw new Error(`USGS API error: ${error.message}`);
  }
}

module.exports = {
  getEarthquakes,
};
