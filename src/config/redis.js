/**
 * Redis Cache Configuration
 * Redis 7 connection and cache utilities with mock fallback
 */

const winston = require('winston');

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

// Check if we should use mock Redis
const USE_MOCK_REDIS = process.env.USE_MOCK_REDIS === 'true' || process.env.NODE_ENV === 'mock';

let redisClient;
let cache;
let initializeRedis;

if (USE_MOCK_REDIS) {
  // Use mock Redis
  logger.info('Using mock Redis (in-memory cache)');
  const mockRedis = require('./mock-redis');
  initializeRedis = mockRedis.initializeRedis;
  cache = mockRedis.cache;
  redisClient = mockRedis.getRedisClient();
} else {
  // Try to use real Redis
  try {
    const redis = require('redis');

    // Initialize Redis connection
    initializeRedis = async function() {
      try {
        redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB) || 0,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    await redisClient.connect();

    // Test connection
        await redisClient.ping();
        logger.info('Redis connection established successfully');

        return redisClient;
      } catch (error) {
        logger.error('Failed to initialize Redis:', error.message);
        throw error;
      }
    };

    // Cache utilities
    cache = {
  // Set value with TTL
  async set(key, value, ttlSeconds = null) {
    try {
      const ttl = ttlSeconds || parseInt(process.env.REDIS_DEFAULT_TTL) || 3600;
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await redisClient.setEx(key, ttl, stringValue);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },

  // Get value
  async get(key) {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;

      // Try to parse as JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  // Delete key
  async delete(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },

  // Check if key exists
  async exists(key) {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  },

  // Set OTP with specific TTL
  async setOTP(phone, otp) {
    const key = `otp:${phone}`;
    const ttl = (parseInt(process.env.OTP_EXPIRY_MINUTES) || 5) * 60;
    return await this.set(key, otp, ttl);
  },

  // Get OTP
  async getOTP(phone) {
    const key = `otp:${phone}`;
    return await this.get(key);
  },

  // Invalidate OTP
  async invalidateOTP(phone) {
    const key = `otp:${phone}`;
    return await this.delete(key);
  },

  // Rate limiting helper
  async checkRateLimit(identifier, limit = 100, windowSeconds = 60) {
    const key = `rate:${identifier}`;
    const current = await redisClient.incr(key);

    if (current === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    return current <= limit;
    }
  };
  } catch (error) {
    // If Redis is not available, fall back to mock
    logger.warn('Redis not available, falling back to mock cache');
    const mockRedis = require('./mock-redis');
    initializeRedis = mockRedis.initializeRedis;
    cache = mockRedis.cache;
    redisClient = mockRedis.getRedisClient();
  }
}

module.exports = {
  initializeRedis,
  cache,
  getRedisClient: () => redisClient
};