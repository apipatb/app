require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');

const { validateEnv } = require('./config/env');
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initSocket, closeSocket } = require('./config/socket');
const { initPubSub, closePubSub } = require('./utils/notifications');
const { logger, requestLogger } = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const requestId = require('./middleware/requestId');
const { performanceMonitor } = require('./middleware/performance');
const { healthCheck, detailedHealthCheck, readinessCheck, livenessCheck } = require('./controllers/healthController');
const { getMetrics } = require('./controllers/metricsController');
const swaggerSpec = require('./config/swagger');

// Validate environment variables on startup
validateEnv();

// Import routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Trust proxy (for Railway/Heroku/etc)
app.set('trust proxy', 1);

// Compression middleware (compress all responses)
app.use(compression());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for Swagger UI
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware (for tracing)
app.use(requestId);

// Performance monitoring
app.use(performanceMonitor);

// Custom request logger
app.use(requestLogger);

// API Documentation (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Laundry API Docs'
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoints (before rate limiting)
app.get('/health', healthCheck);
app.get('/health/detailed', detailedHealthCheck);
app.get('/health/ready', readinessCheck);  // For Kubernetes readiness probe
app.get('/health/live', livenessCheck);    // For Kubernetes liveness probe

// Metrics endpoint (for monitoring)
app.get('/metrics', getMetrics);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Laundry Management API',
    version: '2.3.0',
    environment: process.env.NODE_ENV || 'development',
    features: [
      'JWT Authentication (Access & Refresh Tokens)',
      'Role-Based Access Control (RBAC)',
      'MongoDB & Redis Integration',
      'Real-time Notifications (Pub/Sub)',
      'Advanced Caching',
      'Rate Limiting',
      'Input Validation',
      'Dashboard Analytics',
      'Pagination & Sorting',
      'Advanced Search & Filtering',
      'Request ID Tracking',
      'Health Checks (Kubernetes-ready)',
      'API Documentation (Swagger)',
      'Performance Monitoring',
      'Response Compression',
      'Environment Validation'
    ],
    endpoints: {
      documentation: {
        swagger: '/api-docs',
        openapi: '/api-docs.json'
      },
      monitoring: {
        health: '/health',
        detailed: '/health/detailed',
        readiness: '/health/ready',
        liveness: '/health/live',
        metrics: '/metrics'
      },
      api: {
        auth: '/api/auth',
        customers: '/api/customers',
        services: '/api/services',
        orders: '/api/orders',
        dashboard: '/api/dashboard'
      }
    },
    quickStart: {
      authentication: 'Register at /api/auth/register and login at /api/auth/login',
      documentation: 'Visit /api-docs for interactive API documentation',
      pagination: 'Add ?page=1&limit=20&sort=-createdAt to list endpoints',
      search: 'Add &search=keyword to filter results',
      monitoring: 'Check /metrics for performance data'
    }
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis
    await connectRedis();

    // Initialize Pub/Sub
    await initPubSub();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.io
    initSocket(httpServer);

    // Start HTTP server
    const server = httpServer.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📍 API available at http://localhost:${PORT}`);
      logger.info(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
      logger.info(`🔌 WebSocket server ready`);
      logger.info(`💚 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close Socket.io
          closeSocket();
          logger.info('Socket.io server closed');

          // Close Pub/Sub connections
          await closePubSub();
          logger.info('Pub/Sub connections closed');

          // Close other connections if needed
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
