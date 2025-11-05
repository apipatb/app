const { verifyAccessToken, isTokenBlacklisted } = require('../utils/jwt');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const response = require('../utils/response');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.unauthorized(res, 'No token provided. Please login.');
    }

    const token = authHeader.split(' ')[1];

    // 2. Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return response.unauthorized(res, 'Token has been revoked. Please login again.');
    }

    // 3. Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return response.unauthorized(res, 'Token expired. Please refresh your token.');
      }
      if (error.name === 'JsonWebTokenError') {
        return response.unauthorized(res, 'Invalid token. Please login again.');
      }
      throw error;
    }

    // 4. Check if user still exists
    const user = await User.findById(decoded.userId).select('+passwordChangedAt');

    if (!user) {
      return response.unauthorized(res, 'User no longer exists.');
    }

    // 5. Check if user is active
    if (!user.isActive) {
      return response.forbidden(res, 'Your account has been deactivated.');
    }

    // 6. Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return response.unauthorized(res, 'Password recently changed. Please login again.');
    }

    // 7. Attach user to request
    req.user = user.toSafeObject();
    req.token = token;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return response.serverError(res, 'Authentication failed');
  }
};

/**
 * Authorization middleware
 * Checks if user has required role
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return response.unauthorized(res, 'Please login first');
    }

    if (!roles.includes(req.user.role)) {
      return response.forbidden(res, `Access denied. Required role: ${roles.join(' or ')}`);
    }

    next();
  };
};

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't fail if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.split(' ')[1];

    // Check blacklist
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return next(); // Continue without user
    }

    // Verify token
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);

      if (user && user.isActive) {
        req.user = user.toSafeObject();
        req.token = token;
      }
    } catch (error) {
      // Invalid token - continue without user
      logger.debug('Optional auth failed:', error.message);
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next(); // Continue without user
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
