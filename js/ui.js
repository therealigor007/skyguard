import { CONFIG, STATE } from "./config.js";
import { updateMapMarkers, updateAlertCircles } from "./map.js";

// --- DOM ELEMENT CACHE ---
// Mapped to the IDs in your NEW index.html
const DOMElements = {
  // Overlays & Status
  loading: document.getElementById("loadingOverlay"),
  errorMsg: document.getElementById("errorMessage"),
  errorText: document.getElementById("errorText"),
  closeError: document.getElementById("closeError"),
  lastUpdate: document.getElementById("lastUpdate"),

  // Stats Bar
  flightCount: document.getElementById("flightCount"),
  earthquakeCount: document.getElementById("earthquakeCount"),
  eventCount: document.getElementById("eventCount"),
  alertCount: document.getElementById("alertCount"),

  // Lists
  alertsList: document.getElementById("alertsList"),

  // Filters (Checkboxes)
  showFlights: document.getElementById("showFlights"),
  showEarthquakes: document.getElementById("showEarthquakes"),
  showEvents: document.getElementById("showEvents"),
  autoRefresh: document.getElementById("autoRefresh"),

  // Filters (Ranges/Inputs)
  minMagnitude: document.getElementById("minMagnitude"),
  daysRange: document.getElementById("daysRange"),
  alertRadius: document.getElementById("alertRadius"),

  // Value Display Spans
  magValue: document.getElementById("magValue"),
  daysValue: document.getElementById("daysValue"),
  radiusValue: document.getElementById("radiusValue"),

  // Buttons
  refreshBtn: document.getElementById("refreshBtn"),
  applyFilters: document.getElementById("applyFilters"),
  searchBtn: document.getElementById("searchBtn"),
  searchInput: document.getElementById("searchInput"),
  searchResults: document.getElementById("searchResults"),
};

/**
 * Shows the loading indicator overlay.
 */
function showLoading() {
  if (DOMElements.loading) DOMElements.loading.style.display = "flex";
}

/**
 * Hides the loading indicator overlay.
 */
function hideLoading() {
  if (DOMElements.loading) {
    setTimeout(() => {
      DOMElements.loading.style.display = "none";
    }, 300);
  }
}

/**
 * Updates the stats bar and last update timestamp.
 */
function updateStats() {
  // Update Timestamp
  STATE.lastUpdate = new Date();
  if (DOMElements.lastUpdate) {
    DOMElements.lastUpdate.textContent = STATE.lastUpdate.toLocaleTimeString();
  }

  // Update Counts
  if (DOMElements.flightCount)
    DOMElements.flightCount.textContent = STATE.flights.length;
  if (DOMElements.earthquakeCount)
    DOMElements.earthquakeCount.textContent = STATE.earthquakes.length;
  if (DOMElements.eventCount)
    DOMElements.eventCount.textContent = STATE.events.length;

  // Update Alert Count with visual cues
  if (DOMElements.alertCount) {
    const count = STATE.alerts.length;
    DOMElements.alertCount.textContent = count;

    // Highlight if alerts exist
    const alertCard = DOMElements.alertCount.closest(".stat-card");
    if (alertCard) {
      if (count > 0) {
        alertCard.style.borderColor = "var(--danger-color)";
        alertCard.style.backgroundColor = "rgba(220, 38, 38, 0.2)";
      } else {
        alertCard.style.borderColor = "transparent";
        alertCard.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
      }
    }
  }
}

/**
 * Renders the list of active alerts in the sidebar.
 */
function renderAlerts() {
  const alerts = STATE.alerts;
  const listContainer = DOMElements.alertsList;
  if (!listContainer) return;

  listContainer.innerHTML = ""; // Clear existing

  if (alerts.length === 0) {
    listContainer.innerHTML =
      '<p class="info-text">✅ No immediate threats detected.</p>';
    return;
  }

  alerts.forEach((alert) => {
    const alertItem = document.createElement("div");
    alertItem.className = "alert-item";

    // Determine title based on disaster type
    const disasterName =
      alert.disaster.type === "earthquake"
        ? alert.disaster.place
        : alert.disaster.title;

    alertItem.innerHTML = `
            <div class="alert-title">${alert.type.replace(/_/g, " ")}</div>
            <div class="alert-desc">${alert.message}</div>
            <div style="font-size: 0.75rem; margin-top: 5px; opacity: 0.8;">
                Near: ${disasterName}
            </div>
        `;

    // Click to fly to location
    alertItem.addEventListener("click", () => {
      if (STATE.mapInstance) {
        STATE.mapInstance.flyTo(
          [alert.disaster.latitude, alert.disaster.longitude],
          6
        );
      }
    });

    listContainer.appendChild(alertItem);
  });
}

/**
 * Setup all event listeners.
 * @param {Function} refreshCallback - The main data fetch function from app.js
 */
function initEventListeners(refreshCallback) {
  // 1. Tab Switching Logic
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all tabs and buttons
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));

      // Add active class to clicked button
      btn.classList.add("active");

      // Show corresponding content
      const tabId = btn.getAttribute("data-tab");
      const content = document.getElementById(tabId);
      if (content) content.classList.add("active");
    });
  });

  // 2. Checkbox Filters (Instant Update)
  const handleCheckbox = () => {
    STATE.filters.showFlights = DOMElements.showFlights.checked;
    STATE.filters.showEarthquakes = DOMElements.showEarthquakes.checked;
    STATE.filters.showEvents = DOMElements.showEvents.checked;
    updateMapMarkers();
  };

  if (DOMElements.showFlights)
    DOMElements.showFlights.addEventListener("change", handleCheckbox);
  if (DOMElements.showEarthquakes)
    DOMElements.showEarthquakes.addEventListener("change", handleCheckbox);
  if (DOMElements.showEvents)
    DOMElements.showEvents.addEventListener("change", handleCheckbox);

  // 3. Range Sliders (Update Display Value)
  if (DOMElements.minMagnitude) {
    DOMElements.minMagnitude.addEventListener("input", (e) => {
      DOMElements.magValue.textContent = e.target.value;
    });
  }
  if (DOMElements.daysRange) {
    DOMElements.daysRange.addEventListener("input", (e) => {
      DOMElements.daysValue.textContent = e.target.value;
    });
  }
  if (DOMElements.alertRadius) {
    DOMElements.alertRadius.addEventListener("input", (e) => {
      DOMElements.radiusValue.textContent = e.target.value;
    });
  }

  // 4. Apply Filters Button (Triggers Logic)
  if (DOMElements.applyFilters) {
    DOMElements.applyFilters.addEventListener("click", () => {
      // Update state from inputs
      STATE.filters.minMagnitude = parseFloat(DOMElements.minMagnitude.value);
      STATE.filters.daysRange = parseInt(DOMElements.daysRange.value);
      STATE.filters.alertRadius = parseInt(DOMElements.alertRadius.value);

      // Radius only requires re-analysis, but Mag/Days requires API fetch
      refreshCallback();
    });
  }

  // 5. Refresh Button
  if (DOMElements.refreshBtn) {
    DOMElements.refreshBtn.addEventListener("click", refreshCallback);
  }

  // 6. Search Functionality
  if (DOMElements.searchBtn && DOMElements.searchInput) {
    const handleSearch = () => {
      const query = DOMElements.searchInput.value.toUpperCase().trim();
      const resultsContainer = DOMElements.searchResults;
      resultsContainer.innerHTML = "";

      if (!query) return;

      // Find matches
      const matches = STATE.flights.filter((f) => f.callsign.includes(query));

      if (matches.length === 0) {
        resultsContainer.innerHTML =
          '<p class="info-text">No flights found.</p>';
        return;
      }

      matches.slice(0, 5).forEach((flight) => {
        const div = document.createElement("div");
        div.className = "alert-item"; // Reuse styling
        div.style.borderLeftColor = "var(--primary-color)";
        div.innerHTML = `<strong>✈️ ${flight.callsign}</strong><br><small>${flight.country}</small>`;

        div.addEventListener("click", () => {
          if (STATE.mapInstance) {
            STATE.mapInstance.flyTo([flight.latitude, flight.longitude], 10);
            // Optional: Trigger marker popup here if stored references existed
          }
        });

        resultsContainer.appendChild(div);
      });
    };

    DOMElements.searchBtn.addEventListener("click", handleSearch);
  }

  // 7. Auto Refresh Toggle
  if (DOMElements.autoRefresh) {
    DOMElements.autoRefresh.addEventListener("change", (e) => {
      if (e.target.checked) {
        STATE.autoRefreshInterval = setInterval(
          refreshCallback,
          CONFIG.DEFAULTS.AUTO_REFRESH_INTERVAL
        );
      } else {
        clearInterval(STATE.autoRefreshInterval);
      }
    });
  }

  // 8. Error Message Close
  if (DOMElements.closeError && DOMElements.errorMsg) {
    DOMElements.closeError.addEventListener("click", () => {
      DOMElements.errorMsg.style.display = "none";
    });
  }
}

// Export for use in app.js
export {
  showLoading,
  hideLoading,
  updateStats,
  renderAlerts,
  initEventListeners,
};
