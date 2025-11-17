/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a point is within a radius of another point
 */
function isPointInRadius(lat1, lon1, lat2, lon2, radiusKm) {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
}

/**
 * Format timestamp to readable string
 */
function formatTimestamp(timestamp) {
  return new Date(timestamp).toISOString();
}

module.exports = {
  calculateDistance,
  isPointInRadius,
  formatTimestamp,
  toRad,
};
