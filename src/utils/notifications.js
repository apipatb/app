const redis = require('redis');
const { logger } = require('./logger');

let publisher = null;
let subscriber = null;

/**
 * Initialize Redis Pub/Sub clients
 */
const initPubSub = async () => {
  try {
    // Create publisher client
    publisher = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });

    // Create subscriber client (separate connection required)
    subscriber = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });

    publisher.on('error', (err) => logger.error('Redis Publisher Error:', err));
    subscriber.on('error', (err) => logger.error('Redis Subscriber Error:', err));

    await publisher.connect();
    await subscriber.connect();

    logger.info('✅ Redis Pub/Sub initialized');

    // Subscribe to order status changes
    await subscriber.subscribe('order:status:changed', (message) => {
      try {
        const data = JSON.parse(message);
        logger.info('Order status changed:', data);
        // Here you can add logic to send push notifications, emails, etc.
      } catch (error) {
        logger.error('Error processing order status notification:', error);
      }
    });

    return { publisher, subscriber };
  } catch (error) {
    logger.error('Failed to initialize Pub/Sub:', error);
    throw error;
  }
};

/**
 * Publish order status change notification
 * @param {Object} orderData - Order data {orderId, orderNumber, status, customer}
 */
const publishOrderStatusChange = async (orderData) => {
  try {
    if (!publisher) {
      logger.warn('Publisher not initialized');
      return;
    }

    const message = {
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      oldStatus: orderData.oldStatus,
      newStatus: orderData.newStatus,
      customer: orderData.customer,
      timestamp: new Date().toISOString()
    };

    await publisher.publish('order:status:changed', JSON.stringify(message));
    logger.info(`Published order status change: ${orderData.orderNumber} -> ${orderData.newStatus}`);
  } catch (error) {
    logger.error('Error publishing order status change:', error);
  }
};

/**
 * Publish new order notification
 * @param {Object} orderData - Order data
 */
const publishNewOrder = async (orderData) => {
  try {
    if (!publisher) {
      logger.warn('Publisher not initialized');
      return;
    }

    const message = {
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      customer: orderData.customer,
      totalAmount: orderData.totalAmount,
      timestamp: new Date().toISOString()
    };

    await publisher.publish('order:new', JSON.stringify(message));
    logger.info(`Published new order: ${orderData.orderNumber}`);
  } catch (error) {
    logger.error('Error publishing new order:', error);
  }
};

/**
 * Subscribe to a channel
 * @param {string} channel - Channel name
 * @param {Function} callback - Callback function to handle messages
 */
const subscribe = async (channel, callback) => {
  try {
    if (!subscriber) {
      logger.warn('Subscriber not initialized');
      return;
    }

    await subscriber.subscribe(channel, (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        logger.error(`Error processing message from ${channel}:`, error);
      }
    });

    logger.info(`Subscribed to channel: ${channel}`);
  } catch (error) {
    logger.error(`Error subscribing to ${channel}:`, error);
  }
};

/**
 * Close Pub/Sub connections
 */
const closePubSub = async () => {
  try {
    if (publisher) await publisher.quit();
    if (subscriber) await subscriber.quit();
    logger.info('Redis Pub/Sub connections closed');
  } catch (error) {
    logger.error('Error closing Pub/Sub:', error);
  }
};

module.exports = {
  initPubSub,
  publishOrderStatusChange,
  publishNewOrder,
  subscribe,
  closePubSub
};
