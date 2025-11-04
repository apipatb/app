const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');
const { logger } = require('../utils/logger');

/**
 * Basic health check
 */
const healthCheck = (req, res) => {
  res.json({
    success: true,
    message: 'Laundry Management API is running!',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

/**
 * Detailed health check with dependency status
 */
const detailedHealthCheck = async (req, res) => {
  const health = {
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    services: {}
  };

  // Check MongoDB
  try {
    const mongoState = mongoose.connection.readyState;
    const mongoStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    health.services.mongodb = {
      status: mongoState === 1 ? 'healthy' : 'unhealthy',
      state: mongoStatus[mongoState],
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };

    // Quick ping to verify connection
    if (mongoState === 1) {
      await mongoose.connection.db.admin().ping();
    }
  } catch (error) {
    health.services.mongodb = {
      status: 'unhealthy',
      error: error.message
    };
    health.success = false;
    logger.error('MongoDB health check failed:', error);
  }

  // Check Redis
  try {
    const redisClient = getRedisClient();
    const start = Date.now();
    await redisClient.ping();
    const latency = Date.now() - start;

    health.services.redis = {
      status: 'healthy',
      latency: `${latency}ms`,
      connected: redisClient.isOpen
    };
  } catch (error) {
    health.services.redis = {
      status: 'unhealthy',
      error: error.message
    };
    health.success = false;
    logger.error('Redis health check failed:', error);
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.memory = {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
  };

  // Set status code based on health
  const statusCode = health.success ? 200 : 503;

  res.status(statusCode).json(health);
};

/**
 * Readiness probe (for Kubernetes/Docker)
 * Returns 200 only if all dependencies are ready
 */
const readinessCheck = async (req, res) => {
  try {
    // Check MongoDB
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB not ready'
      });
    }

    // Quick MongoDB ping
    await mongoose.connection.db.admin().ping();

    // Check Redis
    const redisClient = getRedisClient();
    await redisClient.ping();

    res.json({
      success: true,
      message: 'Service is ready'
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service not ready',
      error: error.message
    });
  }
};

/**
 * Liveness probe (for Kubernetes/Docker)
 * Returns 200 if app is alive (doesn't check dependencies)
 */
const livenessCheck = (req, res) => {
  res.json({
    success: true,
    message: 'Service is alive'
  });
};

module.exports = {
  healthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck
};
