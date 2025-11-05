const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

let io;

/**
 * Initialize Socket.io server
 * @param {Object} httpServer - HTTP server instance
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      // Allow anonymous connections but mark as unauthenticated
      socket.data.user = null;
      socket.data.authenticated = false;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = decoded;
      socket.data.authenticated = true;
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      socket.data.user = null;
      socket.data.authenticated = false;
      next(); // Allow connection but as unauthenticated
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.data.user?.userId || 'anonymous';
    logger.info(`Socket connected: ${socket.id} (User: ${userId})`);

    // Join user-specific room if authenticated
    if (socket.data.authenticated) {
      socket.join(`user:${socket.data.user.userId}`);
      logger.info(`User ${socket.data.user.userId} joined their room`);
    }

    // Join order tracking room
    socket.on('track-order', (orderNumber) => {
      if (orderNumber) {
        socket.join(`order:${orderNumber}`);
        logger.info(`Socket ${socket.id} tracking order: ${orderNumber}`);
        socket.emit('tracking-started', { orderNumber });
      }
    });

    // Leave order tracking room
    socket.on('untrack-order', (orderNumber) => {
      if (orderNumber) {
        socket.leave(`order:${orderNumber}`);
        logger.info(`Socket ${socket.id} stopped tracking order: ${orderNumber}`);
        socket.emit('tracking-stopped', { orderNumber });
      }
    });

    // Join dashboard room (staff/admin only)
    socket.on('join-dashboard', () => {
      if (socket.data.authenticated && ['staff', 'admin'].includes(socket.data.user.role)) {
        socket.join('dashboard');
        logger.info(`User ${socket.data.user.userId} joined dashboard room`);
        socket.emit('dashboard-joined');
      } else {
        socket.emit('error', { message: 'Unauthorized: Dashboard access requires staff or admin role' });
      }
    });

    // Handle ping for connection keep-alive
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Disconnection handler
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (User: ${userId}, Reason: ${reason})`);
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('✅ Socket.io initialized successfully');
  return io;
};

/**
 * Get Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket first.');
  }
  return io;
};

/**
 * Emit order status update to specific order room
 */
const emitOrderUpdate = (orderNumber, data) => {
  if (io) {
    io.to(`order:${orderNumber}`).emit('order-update', {
      orderNumber,
      ...data,
      timestamp: new Date().toISOString()
    });
    logger.debug(`Order update emitted for ${orderNumber}`);
  }
};

/**
 * Emit notification to specific user
 */
const emitUserNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
    logger.debug(`Notification sent to user ${userId}`);
  }
};

/**
 * Emit dashboard update (for staff/admin)
 */
const emitDashboardUpdate = (data) => {
  if (io) {
    io.to('dashboard').emit('dashboard-update', {
      ...data,
      timestamp: new Date().toISOString()
    });
    logger.debug('Dashboard update emitted');
  }
};

/**
 * Broadcast notification to all connected clients
 */
const broadcastNotification = (notification) => {
  if (io) {
    io.emit('broadcast', {
      ...notification,
      timestamp: new Date().toISOString()
    });
    logger.debug('Broadcast notification sent');
  }
};

/**
 * Get active connections count
 */
const getActiveConnections = () => {
  if (io) {
    return io.engine.clientsCount;
  }
  return 0;
};

/**
 * Close Socket.io server
 */
const closeSocket = () => {
  if (io) {
    io.close();
    logger.info('Socket.io server closed');
  }
};

module.exports = {
  initSocket,
  getIO,
  emitOrderUpdate,
  emitUserNotification,
  emitDashboardUpdate,
  broadcastNotification,
  getActiveConnections,
  closeSocket
};
