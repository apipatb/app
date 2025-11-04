const Joi = require('joi');
const { logger } = require('../utils/logger');

/**
 * Environment variable validation schema
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number()
    .integer()
    .min(1024)
    .max(65535)
    .default(3000),

  MONGODB_URI: Joi.string()
    .required()
    .description('MongoDB connection string'),

  REDIS_HOST: Joi.string()
    .default('localhost')
    .description('Redis host'),

  REDIS_PORT: Joi.number()
    .integer()
    .min(1)
    .max(65535)
    .default(6379),

  CACHE_TTL: Joi.number()
    .integer()
    .min(60)
    .default(3600)
    .description('Cache TTL in seconds'),

  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info')
}).unknown(true); // Allow other environment variables

/**
 * Validate environment variables
 * @returns {Object} Validated environment variables
 */
const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false
  });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join(', ');

    console.error('❌ Environment validation failed:');
    console.error(errorMessages);

    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    // In development, warn but continue
    console.warn('⚠️  Continuing with invalid environment (development mode)');
  } else {
    logger.info('✅ Environment variables validated successfully');
  }

  return value;
};

/**
 * Get configuration object
 */
const getConfig = () => {
  const env = validateEnv();

  return {
    env: env.NODE_ENV,
    port: env.PORT,
    mongodb: {
      uri: env.MONGODB_URI
    },
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT
    },
    cache: {
      ttl: env.CACHE_TTL
    },
    logging: {
      level: env.LOG_LEVEL
    },
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test'
  };
};

module.exports = {
  validateEnv,
  getConfig
};
