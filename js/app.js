import { CONFIG, STATE } from "./config.js";
import { API } from "./api.js";
import { initMap, updateMapMarkers, updateAlertCircles } from "./map.js";
import { generateAlerts } from "./analysis.js";
// NOTE: Imported 'updateStats' instead of 'updateTimestamp'
import {
  showLoading,
  hideLoading,
  updateStats,
  renderAlerts,
  initEventListeners,
} from "./ui.js";

/**
 * The core data fetching, analysis, and rendering sequence.
 */
async function refreshDataCycle() {
  showLoading();

  try {
    // 1. Fetch all data concurrently
    const { flights, earthquakes, events } = await API.fetchAllData();

    // 2. Update global state
    STATE.flights = flights;
    STATE.earthquakes = earthquakes;
    STATE.events = events;

    // 3. Run analysis
    runAnalysis();

    // 4. Update UI (Stats & Alert List)
    updateStats(); // Updates the counters at the top
  } catch (error) {
    console.error("Critical error during refresh cycle:", error);
  } finally {
    hideLoading();
  }
}

/**
 * Runs the analysis and updates all map components locally.
 */
function runAnalysis() {
  // 1. Generate alerts (this populates STATE.alerts)
  generateAlerts();

  // 2. Render all markers (flights, quakes, events)
  updateMapMarkers();

  // 3. Draw alert circles around disaster zones if alerts exist
  updateAlertCircles();

  // 4. Update the sidebar alert list
  renderAlerts();
}

/**
 * Initializes the entire application.
 */
function init() {
  // 1. Initialize the map first
  initMap();

  // 2. Set up initial event listeners
  initEventListeners(refreshDataCycle);

  // 3. Run the first data load
  refreshDataCycle();

  // Expose for debugging
  window.APP = { reRunAnalysis: runAnalysis };
}

// Start the application when the entire page is loaded
window.onload = init;

export { runAnalysis };
