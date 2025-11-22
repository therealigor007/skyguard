import { CONFIG, STATE } from "./config.js";

/**
 * Initializes the Leaflet map and saves the instance to the global STATE.
 */
function initMap() {
  if (STATE.mapInstance) {
    console.warn("Map already initialized.");
    return;
  }

  try {
    const map = L.map("map", {
      minZoom: CONFIG.MAP.MIN_ZOOM,
      maxZoom: CONFIG.MAP.MAX_ZOOM,
      worldCopyJump: true,
    }).setView(CONFIG.MAP.CENTER, CONFIG.MAP.ZOOM);

    L.tileLayer(CONFIG.MAP.TILE_LAYER, {
      attribution: CONFIG.MAP.ATTRIBUTION,
      maxZoom: CONFIG.MAP.MAX_ZOOM,
      minZoom: CONFIG.MAP.MIN_ZOOM,
    }).addTo(map);

    STATE.markerLayers.flights = L.layerGroup().addTo(map);
    STATE.markerLayers.earthquakes = L.layerGroup().addTo(map);
    STATE.markerLayers.events = L.layerGroup().addTo(map);
    STATE.markerLayers.alerts = L.layerGroup().addTo(map);

    STATE.mapInstance = map;
  } catch (error) {
    console.error("Failed to initialize map:", error);
    document.getElementById(
      "map"
    ).innerHTML = `<div style="text-align: center; padding: 20px; color: ${CONFIG.COLORS.HIGH_RISK};"><h2>Map Error</h2></div>`;
  }
}

function getIcon(emoji, color = "var(--text-color)") {
  return L.divIcon({
    className: "skyguard-icon",
    html: `<div style="color:${color};">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

/**
 * Creates the popup content for a flight marker.
 * Handles potential null values safely.
 */
function createFlightPopup(flight) {
  const statusColor = flight.emergency
    ? CONFIG.COLORS.HIGH_RISK
    : CONFIG.COLORS.FLIGHT;
  const statusText = flight.emergency ? "EMERGENCY (Squawk: 7x00)" : "Normal";

  // FIX: Ensure values exist before formatting
  const altMeters = flight.altitude || 0;
  const altFeet = Math.round(altMeters * 3.28084);
  const speedKts = Math.round((flight.velocity || 0) * 1.94384);
  const speedKmh = Math.round((flight.velocity || 0) * 3.6);
  const heading = Math.round(flight.heading || 0);

  return `
    <div style="font-family: sans-serif; padding: 5px; color: #1e293b;">
        <h3 style="font-size: 1.1rem; font-weight: bold; margin-bottom: 5px; color: ${
          CONFIG.COLORS.FLIGHT
        };">
            ✈️ ${flight.callsign}
        </h3>
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span></p>
        <p><strong>Origin:</strong> ${flight.country}</p>
        <p><strong>Altitude:</strong> ${altFeet} ft (${altMeters.toFixed(
    1
  )} m)</p>
        <p><strong>Speed:</strong> ${speedKts} kts (${speedKmh} km/h)</p>
        <p><strong>Heading:</strong> ${heading}°</p>
        ${
          flight.onGround
            ? '<p style="color:red; font-weight: bold;">ON GROUND</p>'
            : ""
        }
    </div>
  `;
}

function createQuakePopup(quake) {
  const alertColor = quake.alert ? quake.alert : CONFIG.COLORS.LOW_RISK;
  const quakeDate = new Date(quake.time).toLocaleString();

  return `
    <div style="font-family: sans-serif; padding: 5px; color: #1e293b;">
        <h3 style="font-size: 1.1rem; font-weight: bold; margin-bottom: 5px; color: ${
          CONFIG.COLORS.EARTHQUAKE
        };">
            🌍 M${quake.magnitude.toFixed(1)} Earthquake
        </h3>
        <p><strong>Location:</strong> ${quake.place}</p>
        <p><strong>Time:</strong> ${quakeDate}</p>
        <p><strong>Depth:</strong> ${quake.depth.toFixed(1)} km</p>
        <p><strong>Alert Level:</strong> <span style="color: ${alertColor}; font-weight: 600;">${
    quake.alert || "None"
  }</span></p>
        ${
          quake.tsunami
            ? '<p style="color:red; font-weight: bold;">TSUNAMI WARNING</p>'
            : ""
        }
        <a href="${quake.url}" target="_blank" style="color: ${
    CONFIG.COLORS.FLIGHT
  }; text-decoration: none;">View Details →</a>
    </div>
  `;
}

function createEventPopup(event) {
  const icon =
    CONFIG.ICONS[event.category.toUpperCase().replace(/\s/g, "_")] ||
    CONFIG.ICONS.WILDFIRE;
  const eventDate = new Date(event.date).toLocaleString();

  return `
      <div style="font-family: sans-serif; padding: 5px; color: #1e293b;">
          <h3 style="font-size: 1.1rem; font-weight: bold; margin-bottom: 5px; color: ${CONFIG.COLORS.EVENT};">
              ${icon} ${event.title}
          </h3>
          <p><strong>Category:</strong> ${event.category}</p>
          <p><strong>Date:</strong> ${eventDate}</p>
          <a href="${event.link}" target="_blank" style="color: ${CONFIG.COLORS.FLIGHT}; text-decoration: none;">View Source →</a>
      </div>
    `;
}

function clearMapMarkers() {
  if (STATE.mapInstance) {
    STATE.markerLayers.flights.clearLayers();
    STATE.markerLayers.earthquakes.clearLayers();
    STATE.markerLayers.events.clearLayers();
  }
}

function updateMapMarkers() {
  if (!STATE.mapInstance) return;

  clearMapMarkers();

  // --- 1. Draw Earthquakes ---
  if (STATE.filters.showEarthquakes) {
    STATE.earthquakes.forEach((quake) => {
      const icon = getIcon(CONFIG.ICONS.EARTHQUAKE, CONFIG.COLORS.EARTHQUAKE);
      const marker = L.marker([quake.latitude, quake.longitude], {
        icon: icon,
        opacity: 0.8,
      });
      marker.bindPopup(createQuakePopup(quake));
      marker.addTo(STATE.markerLayers.earthquakes);
    });
  }

  // --- 2. Draw Natural Events ---
  if (STATE.filters.showEvents) {
    STATE.events.forEach((event) => {
      const iconEmoji =
        CONFIG.ICONS[event.category.toUpperCase().replace(/\s/g, "_")] ||
        CONFIG.ICONS.WILDFIRE;
      const icon = getIcon(iconEmoji, CONFIG.COLORS.EVENT);
      const marker = L.marker([event.latitude, event.longitude], {
        icon: icon,
        opacity: 0.9,
      });
      marker.bindPopup(createEventPopup(event));
      marker.addTo(STATE.markerLayers.events);
    });
  }

  // --- 3. Draw Flights ---
  if (STATE.filters.showFlights) {
    STATE.flights.forEach((flight) => {
      const isEmergency = flight.emergency;
      const iconEmoji = isEmergency
        ? CONFIG.ICONS.FLIGHT_EMERGENCY
        : CONFIG.ICONS.FLIGHT;
      const color = isEmergency
        ? CONFIG.COLORS.HIGH_RISK
        : CONFIG.COLORS.FLIGHT;

      const icon = getIcon(iconEmoji, color);

      const marker = L.marker([flight.latitude, flight.longitude], {
        icon: icon,
        title: flight.callsign,
        rotationAngle: flight.heading || 0,
      });

      marker.bindPopup(createFlightPopup(flight));
      marker.addTo(STATE.markerLayers.flights);
    });
  }
}

function updateAlertCircles() {
  if (!STATE.mapInstance) return;

  STATE.markerLayers.alerts.clearLayers();
  STATE.alertCircles = [];

  STATE.alerts.forEach((alert) => {
    const disaster = alert.disaster;
    const circleOptions = {
      color: CONFIG.COLORS.ALERT_PROXIMITY,
      fillColor: CONFIG.COLORS.ALERT_PROXIMITY,
      fillOpacity: 0.1,
      weight: 2,
      opacity: 0.8,
      dashArray: "5, 5",
    };

    const radiusInMeters = STATE.filters.alertRadius * 1000;
    const circle = L.circle([disaster.latitude, disaster.longitude], {
      radius: radiusInMeters,
      ...circleOptions,
    }).addTo(STATE.markerLayers.alerts);

    circle.bindPopup(`
            <div style="font-family: sans-serif; padding: 5px; color: #1e293b;">
                <strong>Alert Zone:</strong> ${
                  disaster.type === "earthquake"
                    ? disaster.place
                    : disaster.title
                }<br>
                Radius: ${STATE.filters.alertRadius} km
            </div>
        `);

    STATE.alertCircles.push(circle);
  });
}

export { initMap, updateMapMarkers, updateAlertCircles, clearMapMarkers };
