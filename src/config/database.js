/**
 * Database Configuration
 * PostgreSQL connection using Neon DB
 */

const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'ep-old-unit-a1j0qw5y-pooler.ap-southeast-1.aws.neon.tech',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'neondb',
  user: process.env.DB_USER || 'neondb_owner',
  password: process.env.DB_PASSWORD || 'npg_D7xL5ASaczbH',
  ssl: {
    rejectUnauthorized: false,
    require: true
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to Neon PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.log('Slow query detected:', { text, duration, rows: res.rowCount });
    }

    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
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

// Health check function
const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW()');
    return {
      connected: true,
      timestamp: result.rows[0].now
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
};

module.exports = {
  pool,
  query,
  transaction,
  healthCheck
};