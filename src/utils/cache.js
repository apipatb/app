const { getRedisClient } = require('../config/redis');

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL) || 3600; // 1 hour

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached data or null
 */
const getCache = async (key) => {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set cache data
 * @param {string} key - Cache key
 * @param {any} value - Data to cache
 * @param {number} ttl - Time to live in seconds
 */
const setCache = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const client = getRedisClient();
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

/**
 * Delete cached data
 * @param {string} key - Cache key
 */
const deleteCache = async (key) => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

/**
 * Delete multiple cache keys by pattern
 * @param {string} pattern - Key pattern (e.g., 'customer:*')
 */
const deleteCachePattern = async (pattern) => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('Cache pattern delete error:', error);
  }
};

/**
 * Get or set cache (cache-aside pattern)
 * @param {string} key - Cache key
 * @param {Function} fetchFunction - Function to fetch data if cache miss
 * @param {number} ttl - Time to live
 */
const getOrSetCache = async (key, fetchFunction, ttl = DEFAULT_TTL) => {
  try {
    // Try to get from cache
    const cached = await getCache(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data
    const data = await fetchFunction();

    // Set cache
    if (data !== null && data !== undefined) {
      await setCache(key, data, ttl);
    }

    return data;
  } catch (error) {
    console.error('Get or set cache error:', error);
    // If cache fails, still try to fetch the data
    return await fetchFunction();
  }
};

/**
 * Track order status in Redis (for real-time updates)
 * @param {string} orderId - Order ID
 * @param {string} status - Order status
 */
const trackOrderStatus = async (orderId, status) => {
  try {
    const client = getRedisClient();
    const key = `order:status:${orderId}`;
    await client.setEx(key, 86400, status); // 24 hours

    // Also add to status queue for processing
    await client.rPush(`queue:orders:${status}`, orderId);
  } catch (error) {
    console.error('Track order status error:', error);
  }
};

/**
 * Get orders by status from queue
 * @param {string} status - Order status
 * @param {number} count - Number of orders to get
 */
const getOrdersByStatus = async (status, count = 10) => {
  try {
    const client = getRedisClient();
    const orders = await client.lRange(`queue:orders:${status}`, 0, count - 1);
    return orders;
  } catch (error) {
    console.error('Get orders by status error:', error);
    return [];
  }
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  getOrSetCache,
  trackOrderStatus,
  getOrdersByStatus
};
