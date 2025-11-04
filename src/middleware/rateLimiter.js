const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');

/**
 * Rate Limiter using Redis
 * Limits requests per IP address
 */

// General API rate limiter (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args) => {
      const client = getRedisClient();
      return client.sendCommand(args);
    }
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for write operations (20 requests per 15 minutes)
const strictLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args) => {
      const client = getRedisClient();
      return client.sendCommand(args);
    }
  }),
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Too many create/update requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Very strict rate limiter for sensitive operations (5 requests per hour)
const veryStrictLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args) => {
      const client = getRedisClient();
      return client.sendCommand(args);
    }
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: 'Too many attempts, please try again after 1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  strictLimiter,
  veryStrictLimiter
};
