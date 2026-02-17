/**
 * Database Keepalive Route
 * Prevents Neon database from auto-suspending
 */

const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const winston = require('winston');

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

/**
 * GET /api/v1/keepalive
 * Simple ping to keep database active
 */
router.get('/', async (req, res) => {
  try {
    const start = Date.now();

    // Execute lightweight query
    const result = await query('SELECT NOW() as current_time, version() as db_version');

    const duration = Date.now() - start;

    logger.info('Keepalive ping successful', {
      duration: `${duration}ms`,
      timestamp: result.rows[0].current_time,
      service: 'keepalive'
    });

    res.json({
      status: 'alive',
      database: 'connected',
      timestamp: result.rows[0].current_time,
      responseTime: `${duration}ms`,
      message: 'Database keepalive successful'
    });

  } catch (error) {
    logger.error('Keepalive ping failed', {
      error: error.message,
      code: error.code,
      service: 'keepalive'
    });

    // Return error but with 200 status so frontend doesn't treat it as failure
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      code: error.code,
      message: 'Database connection failed - may be waking up from suspend',
      retryAfter: 5 // seconds
    });
  }
});

/**
 * POST /api/v1/keepalive/wake
 * Force database wake-up with retry logic
 */
router.post('/wake', async (req, res) => {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const start = Date.now();
      const result = await query('SELECT NOW() as wake_time, pg_database_size(current_database()) as size');
      const duration = Date.now() - start;

      logger.info(`Database wake successful on attempt ${attempt}`, {
        duration: `${duration}ms`,
        service: 'keepalive'
      });

      return res.json({
        status: 'awake',
        database: 'connected',
        attempt: attempt,
        wakeTime: result.rows[0].wake_time,
        databaseSize: result.rows[0].size,
        responseTime: `${duration}ms`,
        message: 'Database successfully awakened'
      });

    } catch (error) {
      logger.warn(`Wake attempt ${attempt}/${maxRetries} failed`, {
        error: error.message,
        service: 'keepalive'
      });

      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        // Final attempt failed
        return res.status(503).json({
          status: 'failed',
          database: 'unreachable',
          attempts: maxRetries,
          error: error.message,
          message: 'Failed to wake database after multiple attempts'
        });
      }
    }
  }
});

/**
 * GET /api/v1/keepalive/status
 * Get database connection status and metadata
 */
router.get('/status', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        NOW() as current_time,
        pg_database_size(current_database()) as db_size,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as active_connections,
        version() as db_version
    `);

    const status = result.rows[0];

    res.json({
      status: 'connected',
      timestamp: status.current_time,
      databaseSize: `${(parseInt(status.db_size) / 1024 / 1024).toFixed(2)} MB`,
      activeConnections: status.active_connections,
      version: status.db_version.split(' ')[0] + ' ' + status.db_version.split(' ')[1],
      uptime: 'connected'
    });

  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      error: error.message,
      message: 'Database not available'
    });
  }
});

module.exports = router;
