/**
 * Database Connection Module
 * PostgreSQL 15 connection management with mock fallback
 */

const winston = require('winston');

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

// Check if we should use mock database
const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'mock';

let pool, query, getClient, transaction, initializeDatabase;

if (USE_MOCK_DB) {
  // Use mock database
  logger.info('Using mock database (in-memory storage)');
  const mockDb = require('../config/mock-db');
  pool = mockDb.pool;
  query = mockDb.query;
  getClient = mockDb.getClient;
  transaction = mockDb.transaction;
  initializeDatabase = mockDb.initializeDatabase;
} else {
  // Use real PostgreSQL
  try {
    const { Pool } = require('pg');

    // Create connection pool
    // Supports both DATABASE_URL (Render/Neon/Heroku standard) and individual vars
    const poolConfig = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
          ssl: { rejectUnauthorized: false }, // Required for Neon and most cloud DBs
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME || 'ubertruck_db',
          user: process.env.DB_USER || 'ubertruck_user',
          password: process.env.DB_PASSWORD,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        };
    pool = new Pool(poolConfig);

    // Test database connection
    initializeDatabase = async function() {
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        logger.info('Database connected successfully at:', result.rows[0].now);
        client.release();
        return true;
      } catch (error) {
        logger.error('Database connection failed:', error.message);
        throw error;
      }
    };

    // Query wrapper with error handling
    query = async function(text, params) {
      const start = Date.now();
      try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.debug('Query executed', {
          text: text.substring(0, 100),
          duration,
          rows: result.rowCount
        });
        return result;
      } catch (error) {
        logger.error('Query error:', {
          error: error.message,
          query: text.substring(0, 100)
        });
        throw error;
      }
    };

    // Get a client for transactions
    getClient = async function() {
      const client = await pool.connect();
      return client;
    };

    // Transaction helper
    transaction = async function(callback) {
      const client = await getClient();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    };
  } catch (error) {
    // If PostgreSQL is not available, fall back to mock
    logger.warn('PostgreSQL not available, falling back to mock database');
    const mockDb = require('../config/mock-db');
    pool = mockDb.pool;
    query = mockDb.query;
    getClient = mockDb.getClient;
    transaction = mockDb.transaction;
    initializeDatabase = mockDb.initializeDatabase;
  }
}

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  initializeDatabase
};