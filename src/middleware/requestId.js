const crypto = require('crypto');

/**
 * Request ID Middleware
 * Adds a unique ID to each request for tracking/debugging
 */

const requestId = (req, res, next) => {
  // Check if request already has an ID (from proxy/load balancer)
  const existingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];

  // Generate new ID if not exists
  const id = existingId || crypto.randomUUID();

  // Attach to request
  req.id = id;

  // Add to response headers
  res.setHeader('X-Request-ID', id);

  next();
};

module.exports = requestId;
