const { getAllPerformanceMetrics } = require('../middleware/performance');
const { getRedisClient } = require('../config/redis');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { logger } = require('../utils/logger');

/**
 * Get application metrics
 */
const getMetrics = async (req, res) => {
  try {
    const client = getRedisClient();

    // Get performance metrics
    const performanceMetrics = await getAllPerformanceMetrics();

    // Get cache hit/miss stats (if available)
    const cacheKeys = await client.keys('*');
    const cacheStats = {
      totalKeys: cacheKeys.length,
      memoryUsage: await client.info('memory')
    };

    // Get database stats
    const [totalOrders, totalCustomers] = await Promise.all([
      Order.countDocuments(),
      Customer.countDocuments()
    ]);

    // Get system stats
    const systemStats = {
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      },
      cpu: process.cpuUsage()
    };

    res.json({
      success: true,
      metrics: {
        performance: performanceMetrics,
        cache: {
          totalKeys: cacheStats.totalKeys
        },
        database: {
          totalOrders,
          totalCustomers
        },
        system: systemStats
      }
    });
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getMetrics
};
