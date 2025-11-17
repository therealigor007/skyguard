/**
 * Custom error classes and error handling middleware
 */

/**
 * Custom API Error
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Validation Error
 */
class ValidationError extends Error {
  constructor(message, fields = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.fields = fields;
  }
}

/**
 * Express error handling middleware
 * This should be the last middleware in the app
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error(`[ERROR] ${err.name}: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let response = {
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Add details for specific error types
  if (err instanceof ValidationError && err.fields) {
    response.fields = err.fields;
  }

  if (err instanceof ApiError && err.details) {
    response.details = err.details;
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An unexpected error occurred';
    response.error = message;
  }

  res.status(statusCode).json(response);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  ValidationError,
  errorHandler,
  asyncHandler,
};
