/**
 * Mock Redis for Development/Testing
 * In-memory cache when Redis is not available
 */

class MockRedis {
  constructor() {
    this.store = new Map();
    this.expiry = new Map();
  }

  async connect() {
    console.log('Mock Redis connected (in-memory cache)');
    return this;
  }

  async ping() {
    return 'PONG';
  }

  async setEx(key, ttl, value) {
    this.store.set(key, value);
    const expiryTime = Date.now() + (ttl * 1000);
    this.expiry.set(key, expiryTime);

    // Auto-delete after TTL
    setTimeout(() => {
      this.del(key);
    }, ttl * 1000);

    return 'OK';
  }

  async get(key) {
    // Check if key has expired
    const expiryTime = this.expiry.get(key);
    if (expiryTime && Date.now() > expiryTime) {
      this.del(key);
      return null;
    }
    return this.store.get(key) || null;
  }

  async del(key) {
    this.store.delete(key);
    this.expiry.delete(key);
    return 1;
  }

  async exists(key) {
    const expiryTime = this.expiry.get(key);
    if (expiryTime && Date.now() > expiryTime) {
      this.del(key);
      return 0;
    }
    return this.store.has(key) ? 1 : 0;
  }

  async incr(key) {
    const current = parseInt(this.store.get(key) || 0);
    const newValue = current + 1;
    this.store.set(key, newValue.toString());
    return newValue;
  }

  async expire(key, seconds) {
    if (this.store.has(key)) {
      const expiryTime = Date.now() + (seconds * 1000);
      this.expiry.set(key, expiryTime);

      setTimeout(() => {
        this.del(key);
      }, seconds * 1000);

      return 1;
    }
    return 0;
  }

  on(event, callback) {
    // Mock event handling
    if (event === 'connect') {
      setTimeout(() => callback(), 100);
    }
  }
}

// Create mock Redis client
const mockRedisClient = new MockRedis();

// Mock cache utilities
const cache = {
  async set(key, value, ttlSeconds = null) {
    try {
      const ttl = ttlSeconds || 3600;
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await mockRedisClient.setEx(key, ttl, stringValue);
      return true;
    } catch (error) {
      console.error('Mock cache set error:', error);
      return false;
    }
  },

  async get(key) {
    try {
      const value = await mockRedisClient.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Mock cache get error:', error);
      return null;
    }
  },

  async delete(key) {
    try {
      await mockRedisClient.del(key);
      return true;
    } catch (error) {
      console.error('Mock cache delete error:', error);
      return false;
    }
  },

  async exists(key) {
    try {
      return await mockRedisClient.exists(key);
    } catch (error) {
      console.error('Mock cache exists error:', error);
      return false;
    }
  },

  async setOTP(phone, otp) {
    const key = `otp:${phone}`;
    const ttl = 300; // 5 minutes
    return await this.set(key, otp, ttl);
  },

  async getOTP(phone) {
    const key = `otp:${phone}`;
    return await this.get(key);
  },

  async invalidateOTP(phone) {
    const key = `otp:${phone}`;
    return await this.delete(key);
  },

  async checkRateLimit(identifier, limit = 100, windowSeconds = 60) {
    const key = `rate:${identifier}`;
    const current = await mockRedisClient.incr(key);

    if (current === 1) {
      await mockRedisClient.expire(key, windowSeconds);
    }

    return current <= limit;
  }
};

module.exports = {
  initializeRedis: async () => {
    await mockRedisClient.connect();
    return mockRedisClient;
  },
  cache,
  getRedisClient: () => mockRedisClient
};