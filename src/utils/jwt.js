const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');
const { logger } = require('./logger');

// JWT Secret keys (should be in environment variables)
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRY || '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d'; // 7 days

/**
 * Generate access token
 * @param {Object} payload - Token payload (user id, role, etc.)
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'laundry-api',
    audience: 'laundry-app'
  });
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'laundry-api',
    audience: 'laundry-app'
  });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Both tokens
 */
const generateTokens = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY
  };
};

/**
 * Verify access token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET, {
      issuer: 'laundry-api',
      audience: 'laundry-app'
    });
  } catch (error) {
    logger.error('Access token verification failed:', error.message);
    throw error;
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET, {
      issuer: 'laundry-api',
      audience: 'laundry-app'
    });
  } catch (error) {
    logger.error('Refresh token verification failed:', error.message);
    throw error;
  }
};

/**
 * Blacklist token (for logout)
 * Store token in Redis with expiration
 * @param {string} token - Token to blacklist
 * @param {number} expiresIn - Token expiration time in seconds
 */
const blacklistToken = async (token, expiresIn = 900) => {
  try {
    const client = getRedisClient();
    const key = `blacklist:token:${token}`;
    await client.setEx(key, expiresIn, 'revoked');
    logger.info('Token blacklisted successfully');
  } catch (error) {
    logger.error('Failed to blacklist token:', error);
    throw error;
  }
};

/**
 * Check if token is blacklisted
 * @param {string} token - Token to check
 * @returns {boolean} True if blacklisted
 */
const isTokenBlacklisted = async (token) => {
  try {
    const client = getRedisClient();
    const key = `blacklist:token:${token}`;
    const result = await client.get(key);
    return result !== null;
  } catch (error) {
    logger.error('Failed to check token blacklist:', error);
    return false;
  }
};

/**
 * Store refresh token in Redis
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token
 */
const storeRefreshToken = async (userId, refreshToken) => {
  try {
    const client = getRedisClient();
    const key = `refresh:token:${userId}`;

    // Store with 7 day expiration
    await client.setEx(key, 7 * 24 * 60 * 60, refreshToken);
    logger.info(`Refresh token stored for user ${userId}`);
  } catch (error) {
    logger.error('Failed to store refresh token:', error);
    throw error;
  }
};

/**
 * Get stored refresh token
 * @param {string} userId - User ID
 * @returns {string|null} Refresh token or null
 */
const getStoredRefreshToken = async (userId) => {
  try {
    const client = getRedisClient();
    const key = `refresh:token:${userId}`;
    return await client.get(key);
  } catch (error) {
    logger.error('Failed to get refresh token:', error);
    return null;
  }
};

/**
 * Delete refresh token (for logout)
 * @param {string} userId - User ID
 */
const deleteRefreshToken = async (userId) => {
  try {
    const client = getRedisClient();
    const key = `refresh:token:${userId}`;
    await client.del(key);
    logger.info(`Refresh token deleted for user ${userId}`);
  } catch (error) {
    logger.error('Failed to delete refresh token:', error);
    throw error;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
  storeRefreshToken,
  getStoredRefreshToken,
  deleteRefreshToken
};
