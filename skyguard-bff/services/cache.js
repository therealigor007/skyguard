/**
 * In-memory cache with TTL support
 * Used to reduce API calls and respect rate limits
 */

const cache = new Map();

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {any|null} - Cached value or null if expired/not found
 */
function get(key) {
  const item = cache.get(key);
  
  if (!item) {
    return null;
  }
  
  // Check if expired
  if (item.expiresAt && Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
}

/**
 * Set value in cache with optional TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds (default: 30000)
 */
function set(key, value, ttl = 30000) {
  const expiresAt = ttl > 0 ? Date.now() + ttl : null;
  
  cache.set(key, {
    value,
    expiresAt,
    createdAt: Date.now(),
  });
}

/**
 * Clear cache (specific key or all)
 * @param {string} [key] - Optional key to clear, if not provided clears all
 */
function clear(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Get cache statistics
 * @returns {object} - Cache stats
 */
function getStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

module.exports = {
  get,
  set,
  clear,
  getStats,
};
