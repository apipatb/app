const responseTime = require('response-time');
const { logger } = require('../utils/logger');
const { getRedisClient } = require('../config/redis');

/**
 * Response time middleware with Redis tracking
 */
const performanceMonitor = responseTime(async (req, res, time) => {
  // Log slow requests (> 1 second)
  if (time > 1000) {
    logger.warn('Slow request detected', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      duration: `${time.toFixed(2)}ms`,
      statusCode: res.statusCode
    });
  }

  // Track API response times in Redis (for monitoring)
  try {
    const client = getRedisClient();
    const key = `metrics:response-time:${req.method}:${req.path}`;

    // Store last 100 response times using Redis List
    await client.lPush(key, time.toString());
    await client.lTrim(key, 0, 99); // Keep only last 100
    await client.expire(key, 3600); // Expire after 1 hour
  } catch (error) {
    // Don't fail request if monitoring fails
    logger.error('Performance tracking failed:', error);
  }
});

/**
 * Get performance metrics from Redis
 */
const getPerformanceMetrics = async (method, path) => {
  try {
    const client = getRedisClient();
    const key = `metrics:response-time:${method}:${path}`;
    const times = await client.lRange(key, 0, -1);

    if (times.length === 0) {
      return null;
    }

    const numericTimes = times.map(t => parseFloat(t));
    const sum = numericTimes.reduce((a, b) => a + b, 0);
    const avg = sum / numericTimes.length;
    const min = Math.min(...numericTimes);
    const max = Math.max(...numericTimes);

    // Calculate percentiles
    const sorted = numericTimes.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      count: times.length,
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      p50: p50.toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2)
    };
  } catch (error) {
    logger.error('Failed to get performance metrics:', error);
    return null;
  }
};

/**
 * Get all performance metrics
 */
const getAllPerformanceMetrics = async () => {
  try {
    const client = getRedisClient();
    const keys = await client.keys('metrics:response-time:*');

    const metrics = {};

    for (const key of keys) {
      const parts = key.split(':');
      const method = parts[2];
      const path = parts.slice(3).join(':');

      const times = await client.lRange(key, 0, -1);
      if (times.length > 0) {
        const numericTimes = times.map(t => parseFloat(t));
        const sum = numericTimes.reduce((a, b) => a + b, 0);
        const avg = sum / numericTimes.length;

        metrics[`${method} ${path}`] = {
          count: times.length,
          avgResponseTime: `${avg.toFixed(2)}ms`
        };
      }
    }

    return metrics;
  } catch (error) {
    logger.error('Failed to get all performance metrics:', error);
    return {};
  }
};

module.exports = {
  performanceMonitor,
  getPerformanceMetrics,
  getAllPerformanceMetrics
};
