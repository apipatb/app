const User = require('../models/User');
const {
  generateTokens,
  verifyRefreshToken,
  blacklistToken,
  storeRefreshToken,
  getStoredRefreshToken,
  deleteRefreshToken
} = require('../utils/jwt');
const { logger } = require('../utils/logger');
const response = require('../utils/response');
const { sendWelcomeEmail } = require('../utils/emailService');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return response.conflict(res, 'Email already registered');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'user' // Default role
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Store refresh token in Redis
    await storeRefreshToken(user._id.toString(), tokens.refreshToken);

    // Update user with refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.toSafeObject());

    logger.info(`New user registered: ${user.email}`);

    return response.created(res, {
      user: user.toSafeObject(),
      ...tokens
    }, 'Registration successful');
  } catch (error) {
    logger.error('Registration error:', error);
    return response.badRequest(res, error.message);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password exist
    if (!email || !password) {
      return response.badRequest(res, 'Please provide email and password');
    }

    // 2. Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return response.unauthorized(res, 'Invalid email or password');
    }

    // 3. Check if user is active
    if (!user.isActive) {
      return response.forbidden(res, 'Your account has been deactivated');
    }

    // 4. Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return response.unauthorized(res, 'Invalid email or password');
    }

    // 5. Generate tokens
    const tokens = generateTokens(user);

    // 6. Store refresh token in Redis
    await storeRefreshToken(user._id.toString(), tokens.refreshToken);

    // 7. Update user with refresh token and last login
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    return response.success(res, {
      user: user.toSafeObject(),
      ...tokens
    }, 'Login successful');
  } catch (error) {
    logger.error('Login error:', error);
    return response.serverError(res, 'Login failed');
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const userId = req.user._id;
    const token = req.token;

    // 1. Blacklist access token
    await blacklistToken(token, 900); // 15 minutes

    // 2. Delete refresh token from Redis
    await deleteRefreshToken(userId);

    // 3. Clear refresh token from user
    await User.findByIdAndUpdate(userId, {
      refreshToken: null
    });

    logger.info(`User logged out: ${req.user.email}`);

    return response.success(res, null, 'Logout successful');
  } catch (error) {
    logger.error('Logout error:', error);
    return response.serverError(res, 'Logout failed');
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return response.badRequest(res, 'Refresh token is required');
    }

    // 1. Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return response.unauthorized(res, 'Invalid or expired refresh token');
    }

    // 2. Check if refresh token exists in Redis
    const storedToken = await getStoredRefreshToken(decoded.userId);

    if (!storedToken || storedToken !== refreshToken) {
      return response.unauthorized(res, 'Invalid refresh token');
    }

    // 3. Get user
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return response.unauthorized(res, 'User not found or inactive');
    }

    // 4. Generate new tokens
    const tokens = generateTokens(user);

    // 5. Update refresh token in Redis
    await storeRefreshToken(user._id.toString(), tokens.refreshToken);

    // 6. Update user with new refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    logger.info(`Token refreshed for user: ${user.email}`);

    return response.success(res, tokens, 'Token refreshed successfully');
  } catch (error) {
    logger.error('Token refresh error:', error);
    return response.serverError(res, 'Token refresh failed');
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return response.notFound(res, 'User not found');
    }

    return response.success(res, user.toSafeObject());
  } catch (error) {
    logger.error('Get me error:', error);
    return response.serverError(res, 'Failed to get user profile');
  }
};

/**
 * Update current user profile
 * PUT /api/auth/me
 */
const updateMe = async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Don't allow password update here (use change password endpoint)
    if (req.body.password || req.body.email || req.body.role) {
      return response.badRequest(res, 'Cannot update password, email, or role using this endpoint');
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );

    return response.success(res, user.toSafeObject(), 'Profile updated successfully');
  } catch (error) {
    logger.error('Update profile error:', error);
    return response.badRequest(res, error.message);
  }
};

/**
 * Change password
 * POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return response.badRequest(res, 'Please provide current and new password');
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return response.unauthorized(res, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all existing tokens
    await deleteRefreshToken(user._id.toString());

    // Generate new tokens
    const tokens = generateTokens(user);
    await storeRefreshToken(user._id.toString(), tokens.refreshToken);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    return response.success(res, tokens, 'Password changed successfully. Please use new token.');
  } catch (error) {
    logger.error('Change password error:', error);
    return response.serverError(res, 'Failed to change password');
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateMe,
  changePassword
};
